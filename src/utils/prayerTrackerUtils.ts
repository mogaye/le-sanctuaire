import { CityData } from '../types';
import { computeDynamicCityPrayers } from '../data/islamicData';
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
 * Saves prayer log for a given date
 */
export function setPrayerLog(dateStr: string, log: DailyPrayerLog): void {
  try {
    const payload = {
      ...log,
      F: log.fajr,
      D: log.dhuhr,
      A: log.asr,
      M: log.maghrib,
      I: log.isha,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(`prayer_log_${dateStr}`, JSON.stringify(payload));
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
          keysToRemove.push(key);
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

