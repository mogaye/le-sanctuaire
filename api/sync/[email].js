import {
  parseRequestBody,
  supabaseSelect,
  supabaseUpsert,
  supabasePatch,
} from '../_supabase.js';

const OWNER_EMAIL_ALIASES = ['mgaye60000@gmail.com', 'modougaye58588@gmail.com'];

const memorySyncCache = new Map();
let lastServerTs = 0;

function getNextServerTime() {
  const now = Date.now();
  lastServerTs = Math.max(now, lastServerTs + 1);
  return lastServerTs;
}

async function getSyncAliases(rawEmail) {
  const clean = String(rawEmail || '').trim().toLowerCase();
  const aliasSet = new Set(OWNER_EMAIL_ALIASES);
  if (clean) aliasSet.add(clean);

  try {
    const profiles = await supabaseSelect('profiles', 'select=email&limit=10');
    if (Array.isArray(profiles) && profiles.length <= 10) {
      for (const p of profiles) {
        const em = String(p?.email || '').trim().toLowerCase();
        if (em && em.includes('@')) aliasSet.add(em);
      }
    }
  } catch {
    // ignore
  }

  return Array.from(aliasSet);
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

  const cached = memorySyncCache.get('canonical');
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

  memorySyncCache.set('canonical', finalState);
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

  const rawEmail = decodeURIComponent(req.query?.email || '').trim().toLowerCase() || 'mgaye60000@gmail.com';

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

      if (hasChanges) {
        current.lastUpdatedAt = serverNow;
        memorySyncCache.set('canonical', current);

        const nowIso = new Date().toISOString();
        for (const date of datesToPersist) {
          const dayLog = current.prayers[date];
          if (dayLog) {
            for (const alias of aliases) {
              await supabaseUpsert(
                'prayer_logs',
                {
                  user_id: alias,
                  date,
                  fajr: Boolean(dayLog.fajr),
                  dhuhr: Boolean(dayLog.dhuhr),
                  asr: Boolean(dayLog.asr),
                  maghrib: Boolean(dayLog.maghrib),
                  isha: Boolean(dayLog.isha),
                  updated_at: nowIso,
                },
                'user_id,date'
              );
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
