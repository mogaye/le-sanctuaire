import { CityData } from '../types';
import { computeDynamicCityPrayers } from '../data/islamicData';
import { supabase } from '../lib/supabase';
import type { PrayerKey } from './timeUtils';
export type { PrayerKey } from './timeUtils';

export interface DailyPrayerLog {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export const PRAYER_KEY_MAP: Record<PrayerKey, keyof DailyPrayerLog> = {
  F: 'fajr',
  D: 'dhuhr',
  A: 'asr',
  M: 'maghrib',
  I: 'isha',
};

export const LOG_KEY_TO_PRAYER_KEY: Record<keyof DailyPrayerLog, PrayerKey> = {
  fajr: 'F',
  dhuhr: 'D',
  asr: 'A',
  maghrib: 'M',
  isha: 'I',
};

export const PRAYER_METADATA: Record<PrayerKey, { label: string; arabic: string; color: string }> = {
  F: { label: 'Fajr', arabic: 'الفجر', color: '#059669' },
  D: { label: 'Dhuhr', arabic: 'الظهر', color: '#0284c7' },
  A: { label: 'Asr', arabic: 'العصر', color: '#d97706' },
  M: { label: 'Maghrib', arabic: 'المغرب', color: '#ea580c' },
  I: { label: 'Isha', arabic: 'العشاء', color: '#6366f1' },
};

/**
 * Format a Date object into YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Resolves the currently logged-in user's normalized email or a unique visitor ID from localStorage
 */
export function getActiveUserEmail(): string {
  try {
    if (typeof localStorage === 'undefined') return 'visiteur_anonyme';
    const raw = localStorage.getItem('sanctuaire_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      const email = (parsed?.email || '').trim().toLowerCase();
      if (email && email.includes('@')) return email;
      if (parsed?.id) return String(parsed.id).trim().toLowerCase();
    }
    if (localStorage.getItem('sanctuaire_logged_out') !== 'true') {
      const regRaw = localStorage.getItem('sanctuaire_registered_accounts');
      if (regRaw) {
        const regList = JSON.parse(regRaw);
        if (Array.isArray(regList) && regList.length > 0 && regList[0]?.email) {
          const fallbackEmail = String(regList[0].email).trim().toLowerCase();
          if (fallbackEmail.includes('@')) return fallbackEmail;
        }
      }
    }
    let visitorId = localStorage.getItem('sanctuaire_visitor_id');
    if (!visitorId) {
      visitorId = `visiteur_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('sanctuaire_visitor_id', visitorId);
    }
    return visitorId;
  } catch {
    return 'visiteur_anonyme';
  }
}

// Track in-flight pushes so a background pull never overwrites an active click
const inFlightPrayerPushes = new Set<string>();
const inFlightSettingPushes = new Set<string>();

/**
 * Reads prayer completion log from localStorage for a given date (YYYY-MM-DD)
 */
export function getPrayerLog(dateStr: string): DailyPrayerLog {
  const emptyLog: DailyPrayerLog = {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };

  try {
    const raw = localStorage.getItem(`prayer_log_${dateStr}`);
    if (!raw) return emptyLog;
    const parsed = JSON.parse(raw);
    return {
      fajr: !!(parsed.fajr ?? parsed.F),
      dhuhr: !!(parsed.dhuhr ?? parsed.D),
      asr: !!(parsed.asr ?? parsed.A),
      maghrib: !!(parsed.maghrib ?? parsed.M),
      isha: !!(parsed.isha ?? parsed.I),
    };
  } catch {
    return emptyLog;
  }
}

/**
 * Saves prayer log for a given date locally AND pushes immediately to the cloud account
 */
export function setPrayerLog(
  dateStr: string,
  log: DailyPrayerLog,
  options?: { skipCloudPush?: boolean; serverUpdatedAt?: number }
): void {
  try {
    const nowTs = options?.serverUpdatedAt || Date.now();
    const shouldPush = !options?.skipCloudPush;
    const payload = {
      fajr: !!log.fajr,
      dhuhr: !!log.dhuhr,
      asr: !!log.asr,
      maghrib: !!log.maghrib,
      isha: !!log.isha,
      F: !!log.fajr,
      D: !!log.dhuhr,
      A: !!log.asr,
      M: !!log.maghrib,
      I: !!log.isha,
      updatedAt: nowTs,
      updated_at: new Date(nowTs).toISOString(),
      pendingPush: shouldPush,
    };
    localStorage.setItem(`prayer_log_${dateStr}`, JSON.stringify(payload));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('prayer-tracker-updated'));
      window.dispatchEvent(
        new CustomEvent('sanctuaire-sync-updated', {
          detail: { prayersChanged: true, dateStr },
        })
      );
    }

    if (shouldPush) {
      const email = getActiveUserEmail();
      if (email) {
        inFlightPrayerPushes.add(dateStr);
        fetch(`/api/sync/${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'push',
            prayers: {
              [dateStr]: {
                fajr: !!log.fajr,
                dhuhr: !!log.dhuhr,
                asr: !!log.asr,
                maghrib: !!log.maghrib,
                isha: !!log.isha,
                updatedAt: nowTs,
                pendingPush: true,
              },
            },
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (!data) return;
            const serverDay = data?.state?.prayers?.[dateStr];
            const finalTs = serverDay?.updatedAt || data?.serverTime || nowTs;
            const updatedPayload = {
              ...payload,
              updatedAt: finalTs,
              updated_at: new Date(finalTs).toISOString(),
              pendingPush: false,
            };
            localStorage.setItem(`prayer_log_${dateStr}`, JSON.stringify(updatedPayload));
          })
          .catch(() => {
            // Keeps pendingPush: true so next pullAndMergeCloudSync retries automatically
          })
          .finally(() => {
            inFlightPrayerPushes.delete(dateStr);
          });

        // Also mirror directly to Supabase prayer_logs if client is configured
        if (supabase) {
          supabase
            .from('prayer_logs')
            .upsert(
              {
                user_id: email,
                date: dateStr,
                fajr: !!log.fajr,
                dhuhr: !!log.dhuhr,
                asr: !!log.asr,
                maghrib: !!log.maghrib,
                isha: !!log.isha,
                updated_at: new Date(nowTs).toISOString(),
              },
              { onConflict: 'user_id,date' }
            )
            .then(
              () => {},
              () => {}
            );
        }
      }
    }
  } catch (e) {
    console.error('Failed to save prayer log:', e);
  }
}

/**
 * Toggle a single prayer state for a date
 */
export function togglePrayerInLog(dateStr: string, key: PrayerKey): DailyPrayerLog {
  const current = getPrayerLog(dateStr);
  const logKey = PRAYER_KEY_MAP[key];
  const updated: DailyPrayerLog = {
    ...current,
    [logKey]: !current[logKey],
  };
  setPrayerLog(dateStr, updated);
  return updated;
}

/**
 * Pushes a user setting or action (city, offsets, tasbih, quran bookmarks, dark mode, etc.)
 * to the cloud account so PC and Mobile stay in sync in real time.
 */
export function pushSettingToCloud(key: string, value: any): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const nowTs = Date.now();
    localStorage.setItem(`sanctuaire_sync_pending_${key}`, 'true');

    const email = getActiveUserEmail();
    if (!email) return;

    inFlightSettingPushes.add(key);
    fetch(`/api/sync/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'push',
        settings: {
          [key]: {
            value,
            updatedAt: nowTs,
            pendingPush: true,
          },
        },
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        localStorage.removeItem(`sanctuaire_sync_pending_${key}`);
        const serverEntry = data?.state?.settings?.[key];
        if (serverEntry?.updatedAt) {
          localStorage.setItem(`sanctuaire_sync_ts_${key}`, String(serverEntry.updatedAt));
        }
      })
      .catch(() => {
        // Keeps sanctuaire_sync_pending_${key} = 'true' for retry on next background sync
      })
      .finally(() => {
        inFlightSettingPushes.delete(key);
      });
  } catch {
    // ignore
  }
}

const SYNCED_SETTING_KEYS = [
  'sanctuaire_selected_city',
  'sanctuaire_selected_method',
  'sanctuaire_selected_reciter',
  'prayer_offsets',
  'asr_method',
  'time_mode',
  'sanctuaire_dark_mode',
  'sanctuaire_tasbih_count',
  'sanctuaire_selected_dhikr_index',
  'quran_bookmarked_verses',
  'quran_last_read_surah',
  'quran_last_read_ayah',
  'quran_reading_theme',
] as const;

let isSyncPullInProgress = false;

/**
 * Pulls the latest account state from PostgreSQL and merges with localStorage.
 * Completely immune to clock skew between PC, Mobile, and Server.
 */
export async function pullAndMergeCloudSync(forceSeedLocal = false): Promise<void> {
  if (isSyncPullInProgress) return;
  const email = getActiveUserEmail();
  if (!email) return;

  isSyncPullInProgress = true;
  try {
    const localPrayersPayload: Record<string, any> = {};
    const localSettingsPayload: Record<string, any> = {};
    const uploadedPendingPrayerDates: string[] = [];
    const uploadedPendingSettingKeys: string[] = [];

    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('prayer_log_')) {
          const dateStr = k.replace('prayer_log_', '');
          if (inFlightPrayerPushes.has(dateStr)) continue;
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '{}');
            const isPending = parsed.pendingPush === true;
            if (!forceSeedLocal && !isPending) continue;

            const fajr = !!(parsed.fajr ?? parsed.F);
            const dhuhr = !!(parsed.dhuhr ?? parsed.D);
            const asr = !!(parsed.asr ?? parsed.A);
            const maghrib = !!(parsed.maghrib ?? parsed.M);
            const isha = !!(parsed.isha ?? parsed.I);
            const ts = Number(parsed.updatedAt) || 1000;

            if (isPending || fajr || dhuhr || asr || maghrib || isha || parsed.updatedAt) {
              localPrayersPayload[dateStr] = {
                fajr,
                dhuhr,
                asr,
                maghrib,
                isha,
                updatedAt: ts,
                pendingPush: isPending,
              };
              if (isPending) {
                uploadedPendingPrayerDates.push(dateStr);
              }
            }
          } catch {
            // ignore malformed
          }
        }
      }

      for (const sKey of SYNCED_SETTING_KEYS) {
        if (inFlightSettingPushes.has(sKey)) continue;
        const isPending = localStorage.getItem(`sanctuaire_sync_pending_${sKey}`) === 'true';
        if (!forceSeedLocal && !isPending) continue;

        const rawVal = localStorage.getItem(sKey);
        if (rawVal !== null) {
          const ts = Number(localStorage.getItem(`sanctuaire_sync_ts_${sKey}`)) || 1000;
          localSettingsPayload[sKey] = {
            value: rawVal,
            updatedAt: ts,
            pendingPush: isPending,
          };
          if (isPending) {
            uploadedPendingSettingKeys.push(sKey);
          }
        }
      }
    }

    const response = await fetch(`/api/sync/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'pull',
        prayers: localPrayersPayload,
        settings: localSettingsPayload,
      }),
    }).catch(() => null);

    let state = null;
    if (response && response.ok) {
      const data = await response.json().catch(() => null);
      state = data?.state || null;
    }

    // If /api/sync returned empty prayers or failed, also merge directly from Supabase prayer_logs table if configured
    if (supabase) {
      try {
        const { data: supaRows } = await supabase
          .from('prayer_logs')
          .select('date, fajr, dhuhr, asr, maghrib, isha, updated_at')
          .eq('user_id', email)
          .order('date', { ascending: false })
          .limit(60);

        if (Array.isArray(supaRows) && supaRows.length > 0) {
          if (!state) state = { prayers: {}, settings: {} };
          if (!state.prayers) state.prayers = {};
          for (const row of supaRows) {
            if (!row?.date) continue;
            const rowTs = row.updated_at ? new Date(row.updated_at).getTime() : 1000;
            const existing = state.prayers[row.date];
            if (!existing || rowTs >= (existing.updatedAt || 0)) {
              state.prayers[row.date] = {
                fajr: Boolean(row.fajr),
                dhuhr: Boolean(row.dhuhr),
                asr: Boolean(row.asr),
                maghrib: Boolean(row.maghrib),
                isha: Boolean(row.isha),
                updatedAt: rowTs,
              };
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (!state) return;

    // Clear pending flags for items that were just uploaded in this sync round
    for (const dateStr of uploadedPendingPrayerDates) {
      if (inFlightPrayerPushes.has(dateStr)) continue;
      try {
        const raw = localStorage.getItem(`prayer_log_${dateStr}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.pendingPush = false;
          localStorage.setItem(`prayer_log_${dateStr}`, JSON.stringify(parsed));
        }
      } catch {
        // ignore
      }
    }
    for (const sKey of uploadedPendingSettingKeys) {
      if (inFlightSettingPushes.has(sKey)) continue;
      localStorage.removeItem(`sanctuaire_sync_pending_${sKey}`);
    }

    let prayersChanged = false;
    const updatedSettingKeys: string[] = [];

    // 1. Apply synced prayer logs from server (authoritative whenever no local push is in-flight)
    if (state.prayers && typeof state.prayers === 'object') {
      for (const [dateStr, serverDay] of Object.entries(state.prayers as Record<string, any>)) {
        if (!serverDay || inFlightPrayerPushes.has(dateStr)) continue;

        const rawLocal = localStorage.getItem(`prayer_log_${dateStr}`);
        let localDiffers = true;
        let isStillPendingLocal = false;

        if (rawLocal) {
          try {
            const parsed = JSON.parse(rawLocal);
            isStillPendingLocal = parsed.pendingPush === true;
            const lFajr = !!(parsed.fajr ?? parsed.F);
            const lDhuhr = !!(parsed.dhuhr ?? parsed.D);
            const lAsr = !!(parsed.asr ?? parsed.A);
            const lMaghrib = !!(parsed.maghrib ?? parsed.M);
            const lIsha = !!(parsed.isha ?? parsed.I);

            localDiffers =
              lFajr !== Boolean(serverDay.fajr) ||
              lDhuhr !== Boolean(serverDay.dhuhr) ||
              lAsr !== Boolean(serverDay.asr) ||
              lMaghrib !== Boolean(serverDay.maghrib) ||
              lIsha !== Boolean(serverDay.isha);
          } catch {
            localDiffers = true;
          }
        }

        if (!isStillPendingLocal && localDiffers) {
          const serverTs = Number(serverDay.updatedAt) || Date.now();
          const payload = {
            fajr: Boolean(serverDay.fajr),
            dhuhr: Boolean(serverDay.dhuhr),
            asr: Boolean(serverDay.asr),
            maghrib: Boolean(serverDay.maghrib),
            isha: Boolean(serverDay.isha),
            F: Boolean(serverDay.fajr),
            D: Boolean(serverDay.dhuhr),
            A: Boolean(serverDay.asr),
            M: Boolean(serverDay.maghrib),
            I: Boolean(serverDay.isha),
            updatedAt: serverTs,
            updated_at: new Date(serverTs).toISOString(),
            pendingPush: false,
          };
          localStorage.setItem(`prayer_log_${dateStr}`, JSON.stringify(payload));
          prayersChanged = true;
        }
      }
    }

    // 2. Apply synced settings & actions from server (authoritative whenever no local push is in-flight)
    if (state.settings && typeof state.settings === 'object') {
      for (const [sKey, serverEntry] of Object.entries(state.settings as Record<string, any>)) {
        if (!serverEntry || !('value' in serverEntry) || inFlightSettingPushes.has(sKey)) continue;
        if (localStorage.getItem(`sanctuaire_sync_pending_${sKey}`) === 'true') continue;

        const serverTs = Number(serverEntry.updatedAt) || Date.now();
        const nextStrVal =
          typeof serverEntry.value === 'string'
            ? serverEntry.value
            : JSON.stringify(serverEntry.value);
        const currentLocalStrVal = localStorage.getItem(sKey);

        if (currentLocalStrVal !== nextStrVal) {
          localStorage.setItem(sKey, nextStrVal);
          updatedSettingKeys.push(sKey);
        }
        localStorage.setItem(`sanctuaire_sync_ts_${sKey}`, String(serverTs));
      }
    }

    if (prayersChanged || updatedSettingKeys.length > 0) {
      if (typeof window !== 'undefined') {
        if (prayersChanged) {
          window.dispatchEvent(new Event('prayer-tracker-updated'));
        }
        window.dispatchEvent(
          new CustomEvent('sanctuaire-sync-updated', {
            detail: {
              prayersChanged,
              settingsChanged: updatedSettingKeys.length > 0,
              updatedSettingKeys,
            },
          })
        );
      }
    }
  } catch {
    // Ignore transient network errors
  } finally {
    isSyncPullInProgress = false;
  }
}

/**
 * Convert DailyPrayerLog to Record<'F'|'D'|'A'|'M'|'I', boolean>
 */
export function logToKeyMap(log: DailyPrayerLog): Record<PrayerKey, boolean> {
  return {
    F: log.fajr,
    D: log.dhuhr,
    A: log.asr,
    M: log.maghrib,
    I: log.isha,
  };
}

/**
 * Islamic Hijri Date representation
 */
export interface HijriDateInfo {
  day: number;
  monthName: string;
  year: number;
  fullFormatted: string;
  isAyyamAlBid: boolean; // 13th, 14th, or 15th
}

export function getHijriDateInfo(date: Date): HijriDateInfo {
  try {
    const formatter = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const dayVal = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
    const monthVal = parts.find((p) => p.type === 'month')?.value || '';
    const yearVal = parseInt(parts.find((p) => p.type === 'year')?.value || '1448', 10);

    return {
      day: isNaN(dayVal) ? 1 : dayVal,
      monthName: monthVal,
      year: isNaN(yearVal) ? 1448 : yearVal,
      fullFormatted: `${dayVal} ${monthVal} ${yearVal} AH`,
      isAyyamAlBid: dayVal === 13 || dayVal === 14 || dayVal === 15,
    };
  } catch {
    return {
      day: 1,
      monthName: 'Mois Islamique',
      year: 1448,
      fullFormatted: '1er Jour Hégirien 1448 AH',
      isAyyamAlBid: false,
    };
  }
}

/**
 * Monthly Calendar Day Item
 */
export interface MonthCalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number; // 1..31
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 5=Fri
  dayNameShort: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isFriday: boolean;
  hijri: HijriDateInfo;
  prayers: Record<PrayerKey, string>;
  log: DailyPrayerLog;
  completedCount: number; // 0..5
}

/**
 * Returns all days for a Gregorian month with prayers & logs
 */
export function getMonthDaysData(
  year: number,
  month: number, // 0 = Jan, 8 = Sept
  city: CityData,
  methodId: string = 'muslim'
): MonthCalendarDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = formatDateKey(today);

  const days: MonthCalendarDay[] = [];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = formatDateKey(curDate);
    const dayOfWeek = curDate.getDay();
    const isToday = dateStr === todayStr;
    const isPast = curDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isFuture = curDate > new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isFriday = dayOfWeek === 5;

    const hijri = getHijriDateInfo(curDate);
    const prayers = computeDynamicCityPrayers(city, curDate, methodId);
    const log = getPrayerLog(dateStr);
    const completedCount = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length;

    days.push({
      date: curDate,
      dateStr,
      dayNumber: d,
      dayOfWeek,
      dayNameShort: dayNames[dayOfWeek],
      isToday,
      isPast,
      isFuture,
      isFriday,
      hijri,
      prayers,
      log,
      completedCount,
    });
  }

  return days;
}

/**
 * Monthly Statistics Summary
 */
export interface MonthStats {
  monthName: string;
  year: number;
  totalDaysInMonth: number;
  elapsedDays: number;
  totalPrayersExpected: number;
  totalPrayersCompleted: number;
  completionRate: number; // 0..100
  perfectDaysCount: number; // days with 5/5
  streakDays: number;
  perPrayer: Record<PrayerKey, { count: number; total: number; rate: number }>;
  bestPrayerKey: PrayerKey;
  mostChallengingPrayerKey: PrayerKey;
}

export function calculateMonthStats(days: MonthCalendarDay[]): MonthStats {
  const elapsedDaysList = days.filter((d) => !d.isFuture);
  const elapsedDays = Math.max(elapsedDaysList.length, 1);
  const totalExpected = elapsedDays * 5;

  let totalCompleted = 0;
  let perfectDays = 0;

  const prayerCounts: Record<PrayerKey, number> = {
    F: 0,
    D: 0,
    A: 0,
    M: 0,
    I: 0,
  };

  elapsedDaysList.forEach((d) => {
    if (d.log.fajr) prayerCounts.F++;
    if (d.log.dhuhr) prayerCounts.D++;
    if (d.log.asr) prayerCounts.A++;
    if (d.log.maghrib) prayerCounts.M++;
    if (d.log.isha) prayerCounts.I++;

    totalCompleted += d.completedCount;
    if (d.completedCount === 5) {
      perfectDays++;
    }
  });

  const completionRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

  const perPrayer: Record<PrayerKey, { count: number; total: number; rate: number }> = {
    F: { count: prayerCounts.F, total: elapsedDays, rate: elapsedDays > 0 ? Math.round((prayerCounts.F / elapsedDays) * 100) : 0 },
    D: { count: prayerCounts.D, total: elapsedDays, rate: elapsedDays > 0 ? Math.round((prayerCounts.D / elapsedDays) * 100) : 0 },
    A: { count: prayerCounts.A, total: elapsedDays, rate: elapsedDays > 0 ? Math.round((prayerCounts.A / elapsedDays) * 100) : 0 },
    M: { count: prayerCounts.M, total: elapsedDays, rate: elapsedDays > 0 ? Math.round((prayerCounts.M / elapsedDays) * 100) : 0 },
    I: { count: prayerCounts.I, total: elapsedDays, rate: elapsedDays > 0 ? Math.round((prayerCounts.I / elapsedDays) * 100) : 0 },
  };

  // Determine best and challenging
  let bestKey: PrayerKey = 'M';
  let bestRate = -1;
  let minKey: PrayerKey = 'F';
  let minRate = 101;

  (['F', 'D', 'A', 'M', 'I'] as PrayerKey[]).forEach((k) => {
    const r = perPrayer[k].rate;
    if (r > bestRate) {
      bestRate = r;
      bestKey = k;
    }
    if (r < minRate) {
      minRate = r;
      minKey = k;
    }
  });

  // Calculate current streak (backwards from today or latest elapsed day)
  let streak = 0;
  for (let i = elapsedDaysList.length - 1; i >= 0; i--) {
    if (elapsedDaysList[i].completedCount >= 1) {
      streak++;
    } else {
      break;
    }
  }

  const sampleDate = days[0]?.date || new Date();
  const monthName = sampleDate.toLocaleDateString('fr-FR', { month: 'long' });

  return {
    monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    year: sampleDate.getFullYear(),
    totalDaysInMonth: days.length,
    elapsedDays,
    totalPrayersExpected: totalExpected,
    totalPrayersCompleted: totalCompleted,
    completionRate,
    perfectDaysCount: perfectDays,
    streakDays: streak,
    perPrayer,
    bestPrayerKey: bestKey,
    mostChallengingPrayerKey: minKey,
  };
}

/**
 * Purges any previously seeded sample/mock data so the application operates strictly on real user data.
 */
export function purgeMockSampleDataIfPresent() {
  try {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem('sanctuaire_has_seeded_tracker_sample') === 'true') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('prayer_log_')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
            // Only remove old mock logs that lacked an updatedAt timestamp
            if (!parsed.updatedAt && !parsed.updated_at) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem('sanctuaire_has_seeded_tracker_sample');
    }
  } catch {
    // ignore
  }
}

// Automatically clean up any past mock data on load
purgeMockSampleDataIfPresent();

