import {
  parseRequestBody,
  supabaseSelect,
  supabaseUpsert,
  supabasePatch,
  supabaseDelete,
} from '../_supabase.js';

const memorySyncCache = new Map();
let lastServerTs = 0;

function getNextServerTime() {
  const now = Date.now();
  lastServerTs = Math.max(now, lastServerTs + 1);
  return lastServerTs;
}

async function getSyncAliases(rawEmail) {
  const clean = String(rawEmail || '').trim().toLowerCase() || 'visiteur_anonyme';
  return [clean];
}

async function loadStateFromSupabase(rawEmail) {
  const aliases = await getSyncAliases(rawEmail);
  const mergedPrayers = {};
  const mergedSettings = {};

  for (const alias of aliases) {
    const prayerRows = await supabaseSelect(
      'prayer_logs',
      `user_id=eq.${encodeURIComponent(alias)}&order=date.desc`
    );
    for (const row of prayerRows) {
      if (!row?.date) continue;
      const rowTime = row.updated_at ? new Date(row.updated_at).getTime() : 1000;
      const current = mergedPrayers[row.date];
      if (!current || rowTime >= current.updatedAt) {
        mergedPrayers[row.date] = {
          fajr: Boolean(row.fajr),
          dhuhr: Boolean(row.dhuhr),
          asr: Boolean(row.asr),
          maghrib: Boolean(row.maghrib),
          isha: Boolean(row.isha),
          updatedAt: rowTime,
        };
      }
    }

    const syncLogs = await supabaseSelect(
      'email_logs',
      `email_type=eq.user_sync_state&sender_email=eq.${encodeURIComponent(alias)}&order=id.desc&limit=1`
    );
    if (syncLogs.length > 0 && syncLogs[0]?.body_preview) {
      try {
        const parsed = JSON.parse(syncLogs[0].body_preview);
        if (parsed?.prayers && typeof parsed.prayers === 'object') {
          for (const [date, pVal] of Object.entries(parsed.prayers)) {
            if (!pVal || typeof pVal !== 'object') continue;
            const incomingTs = Number(pVal.updatedAt) || 1000;
            const current = mergedPrayers[date];
            if (!current || incomingTs >= current.updatedAt) {
              mergedPrayers[date] = {
                fajr: Boolean(pVal.fajr),
                dhuhr: Boolean(pVal.dhuhr),
                asr: Boolean(pVal.asr),
                maghrib: Boolean(pVal.maghrib),
                isha: Boolean(pVal.isha),
                updatedAt: incomingTs,
              };
            }
          }
        }
        if (parsed?.settings && typeof parsed.settings === 'object') {
          for (const [sKey, sVal] of Object.entries(parsed.settings)) {
            if (!sVal || typeof sVal !== 'object' || !('value' in sVal)) continue;
            const incomingTs = Number(sVal.updatedAt) || 1000;
            const current = mergedSettings[sKey];
            if (!current || incomingTs >= current.updatedAt) {
              mergedSettings[sKey] = {
                value: sVal.value,
                updatedAt: incomingTs,
              };
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  const cacheKey = aliases[0];
  const cached = memorySyncCache.get(cacheKey);
  if (cached) {
    for (const [date, pVal] of Object.entries(cached.prayers || {})) {
      const current = mergedPrayers[date];
      if (!current || pVal.updatedAt >= current.updatedAt) {
        mergedPrayers[date] = pVal;
      }
    }
    for (const [sKey, sVal] of Object.entries(cached.settings || {})) {
      const current = mergedSettings[sKey];
      if (!current || sVal.updatedAt >= current.updatedAt) {
        mergedSettings[sKey] = sVal;
      }
    }
  }

  const finalState = {
    prayers: mergedPrayers,
    settings: mergedSettings,
    lastUpdatedAt: cached?.lastUpdatedAt || getNextServerTime(),
  };

  memorySyncCache.set(cacheKey, finalState);
  return { state: finalState, aliases };
}

async function saveSyncStateToSupabase(alias, stateObj) {
  const serialized = JSON.stringify(stateObj);
  const existing = await supabaseSelect(
    'email_logs',
    `email_type=eq.user_sync_state&sender_email=eq.${encodeURIComponent(alias)}&order=id.desc&limit=1`
  );
  if (existing.length > 0 && existing[0]?.id) {
    await supabasePatch('email_logs', `id=eq.${existing[0].id}`, {
      body_preview: serialized,
      subject: `sync_${Date.now()}`,
    });
  } else {
    await supabaseUpsert('email_logs', {
      sender_email: alias,
      recipient_email: alias,
      subject: `sync_${Date.now()}`,
      body_preview: serialized,
      email_type: 'user_sync_state',
      status: 'synced',
    });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawEmail =
    decodeURIComponent(req.query?.email || '').trim().toLowerCase() || 'visiteur_anonyme';

  try {
    if (req.method === 'GET') {
      const { state } = await loadStateFromSupabase(rawEmail);
      return res.status(200).json({ email: rawEmail, state, serverTime: state.lastUpdatedAt });
    }

    if (req.method === 'POST') {
      const incoming = await parseRequestBody(req);
      const isPushAction = incoming.mode === 'push';
      const serverNow = getNextServerTime();
      const { state: current, aliases } = await loadStateFromSupabase(rawEmail);

      let hasChanges = false;
      const datesToPersist = [];

      if (incoming.prayers && typeof incoming.prayers === 'object') {
        for (const [date, pVal] of Object.entries(incoming.prayers)) {
          if (!pVal || typeof pVal !== 'object') continue;
          const existing = current.prayers[date];
          const isExplicitPush = isPushAction || pVal.pendingPush === true;

          if (!existing || isExplicitPush) {
            const nextDay = {
              fajr: Boolean(pVal.fajr),
              dhuhr: Boolean(pVal.dhuhr),
              asr: Boolean(pVal.asr),
              maghrib: Boolean(pVal.maghrib),
              isha: Boolean(pVal.isha),
              updatedAt: serverNow,
            };
            const changed =
              !existing ||
              existing.fajr !== nextDay.fajr ||
              existing.dhuhr !== nextDay.dhuhr ||
              existing.asr !== nextDay.asr ||
              existing.maghrib !== nextDay.maghrib ||
              existing.isha !== nextDay.isha ||
              isExplicitPush;

            current.prayers[date] = nextDay;
            if (changed) {
              hasChanges = true;
              datesToPersist.push(date);
            }
          }
        }
      }

      if (incoming.settings && typeof incoming.settings === 'object') {
        for (const [sKey, sVal] of Object.entries(incoming.settings)) {
          if (!sVal || typeof sVal !== 'object' || !('value' in sVal)) continue;
          const existing = current.settings[sKey];
          const isExplicitPush = isPushAction || sVal.pendingPush === true;

          if (!existing || isExplicitPush) {
            const prevSerialized = existing ? JSON.stringify(existing.value) : '';
            const nextSerialized = JSON.stringify(sVal.value);
            current.settings[sKey] = {
              value: sVal.value,
              updatedAt: serverNow,
            };
            if (!existing || prevSerialized !== nextSerialized || isExplicitPush) {
              hasChanges = true;
            }
          }
        }
      }

      // 1. Automatically persist Quran favorites into public.quran_favorites if provided
      if (Array.isArray(incoming.quranFavorites)) {
        for (const fav of incoming.quranFavorites) {
          if (!fav || !fav.surahNumber || !fav.ayahNumber) continue;
          const sNum = Number(fav.surahNumber);
          const aNum = Number(fav.ayahNumber);
          if (fav.remove) {
            await supabaseDelete(
              'quran_favorites',
              `user_id=eq.${encodeURIComponent(rawEmail)}&surah_number=eq.${sNum}&ayah_number=eq.${aNum}`
            );
          } else {
            const payload = {
              user_id: rawEmail,
              surah_number: sNum,
              ayah_number: aNum,
              surah_name: String(fav.surahName || `Sourate ${sNum}`),
              ayah_text: String(fav.ayahText || ''),
              ayah_translation: String(fav.ayahTranslation || ''),
            };
            const upRes = await supabaseUpsert(
              'quran_favorites',
              payload,
              'user_id,surah_number,ayah_number'
            );
            if (!upRes.ok) {
              await supabaseUpsert('quran_favorites', payload);
            }
          }
        }
      }

      // 2. Automatically persist Dhikr / Tasbih logs into public.dhikr_logs if provided
      if (Array.isArray(incoming.dhikrLogs)) {
        for (const dLog of incoming.dhikrLogs) {
          if (!dLog || !dLog.dhikrPhrase) continue;
          const dateKey = String(dLog.date || new Date().toISOString().slice(0, 10));
          const phrase = String(dLog.dhikrPhrase).trim();
          const countVal = Math.max(0, Number(dLog.count) || 0);
          const targetVal = Math.max(1, Number(dLog.target) || 33);
          const completedVal = Boolean(dLog.completed || countVal >= targetVal);

          const payload = {
            user_id: rawEmail,
            date: dateKey,
            dhikr_phrase: phrase,
            count: countVal,
            target: targetVal,
            completed: completedVal,
          };

          const existingDhikr = await supabaseSelect(
            'dhikr_logs',
            `user_id=eq.${encodeURIComponent(rawEmail)}&date=eq.${encodeURIComponent(dateKey)}&dhikr_phrase=eq.${encodeURIComponent(phrase)}&limit=1`
          );
          if (existingDhikr.length > 0 && existingDhikr[0]?.id) {
            await supabasePatch('dhikr_logs', `id=eq.${existingDhikr[0].id}`, {
              count: countVal,
              target: targetVal,
              completed: completedVal,
            });
          } else {
            const upDhikr = await supabaseUpsert(
              'dhikr_logs',
              payload,
              'user_id,date,dhikr_phrase'
            );
            if (!upDhikr.ok) {
              await supabaseUpsert('dhikr_logs', payload);
            }
          }
        }
      }

      if (hasChanges) {
        current.lastUpdatedAt = serverNow;
        memorySyncCache.set(aliases[0], current);

        const nowIso = new Date().toISOString();
        for (const date of datesToPersist) {
          const dayLog = current.prayers[date];
          if (dayLog) {
            for (const alias of aliases) {
              const pPayload = {
                user_id: alias,
                date,
                fajr: Boolean(dayLog.fajr),
                dhuhr: Boolean(dayLog.dhuhr),
                asr: Boolean(dayLog.asr),
                maghrib: Boolean(dayLog.maghrib),
                isha: Boolean(dayLog.isha),
                updated_at: nowIso,
              };
              const upPrayer = await supabaseUpsert('prayer_logs', pPayload, 'user_id,date');
              if (!upPrayer.ok) {
                const existingPrayer = await supabaseSelect(
                  'prayer_logs',
                  `user_id=eq.${encodeURIComponent(alias)}&date=eq.${encodeURIComponent(date)}&limit=1`
                );
                if (existingPrayer.length > 0 && existingPrayer[0]?.id) {
                  await supabasePatch('prayer_logs', `id=eq.${existingPrayer[0].id}`, pPayload);
                } else {
                  await supabaseUpsert('prayer_logs', pPayload);
                }
              }
            }
          }
        }

        for (const alias of aliases) {
          await saveSyncStateToSupabase(alias, current);
        }
      }

      return res.status(200).json({ email: rawEmail, state: current, serverTime: serverNow });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to sync state' });
  }
}
