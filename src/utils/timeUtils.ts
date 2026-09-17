/**
 * Time and Prayer calculation utilities for La Voie De La Sérénité
 * Provides real-time ticking, live countdowns, dynamic prayer highlighting,
 * Hijri calendar calculations, and timezone support.
 */

export type PrayerKey = 'F' | 'D' | 'A' | 'M' | 'I';

export const PRAYER_ORDER: PrayerKey[] = ['F', 'D', 'A', 'M', 'I'];

export const PRAYER_NAMES: Record<PrayerKey, { fr: string; ar: string; desc: string }> = {
  F: { fr: 'Fajr', ar: 'الفجر', desc: 'Prière de l\'aube' },
  D: { fr: 'Dhuhr', ar: 'الظهر', desc: 'Prière du zénith' },
  A: { fr: 'Asr', ar: 'العصر', desc: 'Prière de l\'après-midi' },
  M: { fr: 'Maghrib', ar: 'المغرب', desc: 'Prière du coucher du soleil' },
  I: { fr: 'Isha', ar: 'العشاء', desc: 'Prière de la nuit' },
};

/**
 * Converts a "HH:mm" time string into total minutes of the day (0 - 1439).
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Gets a Date object localized to a specific IANA timezone (or default local).
 */
export function getCityCurrentDate(timezone?: string): Date {
  const now = new Date();
  if (!timezone) return now;

  try {
    // Formats into local ISO-like string in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);

    const year = getPart('year');
    const month = getPart('month') - 1;
    const day = getPart('day');
    let hour = getPart('hour');
    // Handle 24 hour case in some formatters
    if (hour === 24) hour = 0;
    const minute = getPart('minute');
    const second = getPart('second');

    return new Date(year, month, day, hour, minute, second);
  } catch (e) {
    return now;
  }
}

/**
 * Formats a Date to French long date: e.g. "Mercredi 16 Septembre 2026"
 */
export function formatDateFrench(date: Date): string {
  try {
    const formatted = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    // Capitalize first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch (e) {
    return date.toLocaleDateString('fr-FR');
  }
}

/**
 * Formats a Date to HH:mm:ss or HH:mm
 */
export function formatTimeDigits(date: Date, includeSeconds = true): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  if (!includeSeconds) return `${h}:${m}`;
  const s = pad(date.getSeconds());
  return `${h}:${m}:${s}`;
}

/**
 * Accurately calculates the Islamic Hijri date using Intl API or reliable algorithmic fallback
 */
export function getFormattedHijriDate(date: Date = new Date()): string {
  try {
    const hijriFormatter = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formatted = hijriFormatter.format(date);
    return `${formatted} AH`;
  } catch (e) {
    try {
      const fallbackFormatter = new Intl.DateTimeFormat('fr-FR-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return `${fallbackFormatter.format(date)} AH`;
    } catch {
      return '15 Safar 1448 AH';
    }
  }
}

export interface PrayerScheduleState {
  currentPrayerKey: PrayerKey;
  nextPrayerKey: PrayerKey;
  prevPrayerKey: PrayerKey;
  nextPrayerTime: string;
  prevPrayerTime: string;
  totalSecondsRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  countdownFormatted: string;
  progressPercent: number;
  isPrayerTimeNow: boolean; // within 15 mins of Adhan
  isPastPrayer: (key: PrayerKey) => boolean;
}

/**
 * Calculates current prayer, next prayer, countdown, and progress dynamically based on time.
 */
export function calculatePrayerSchedule(
  prayerTimes: Record<PrayerKey, string>,
  now: Date
): PrayerScheduleState {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSecondsInDay = currentMinutes * 60 + now.getSeconds();

  const timesInMinutes: Record<PrayerKey, number> = {
    F: timeStringToMinutes(prayerTimes.F),
    D: timeStringToMinutes(prayerTimes.D),
    A: timeStringToMinutes(prayerTimes.A),
    M: timeStringToMinutes(prayerTimes.M),
    I: timeStringToMinutes(prayerTimes.I),
  };

  // Check which prayers have passed today
  const isPastPrayer = (key: PrayerKey): boolean => {
    return currentMinutes >= timesInMinutes[key];
  };

  let prevPrayerKey: PrayerKey = 'I';
  let nextPrayerKey: PrayerKey = 'F';
  let prevTimeMinutes = timesInMinutes.I;
  let nextTimeMinutes = timesInMinutes.F;
  let totalSpanSeconds = 0;
  let elapsedSeconds = 0;

  if (currentMinutes < timesInMinutes.F) {
    // Before Fajr (Night, after midnight)
    prevPrayerKey = 'I';
    nextPrayerKey = 'F';
    prevTimeMinutes = timesInMinutes.I - 24 * 60; // Isha yesterday
    nextTimeMinutes = timesInMinutes.F;
  } else if (currentMinutes < timesInMinutes.D) {
    // Between Fajr and Dhuhr
    prevPrayerKey = 'F';
    nextPrayerKey = 'D';
    prevTimeMinutes = timesInMinutes.F;
    nextTimeMinutes = timesInMinutes.D;
  } else if (currentMinutes < timesInMinutes.A) {
    // Between Dhuhr and Asr
    prevPrayerKey = 'D';
    nextPrayerKey = 'A';
    prevTimeMinutes = timesInMinutes.D;
    nextTimeMinutes = timesInMinutes.A;
  } else if (currentMinutes < timesInMinutes.M) {
    // Between Asr and Maghrib
    prevPrayerKey = 'A';
    nextPrayerKey = 'M';
    prevTimeMinutes = timesInMinutes.A;
    nextTimeMinutes = timesInMinutes.M;
  } else if (currentMinutes < timesInMinutes.I) {
    // Between Maghrib and Isha
    prevPrayerKey = 'M';
    nextPrayerKey = 'I';
    prevTimeMinutes = timesInMinutes.M;
    nextTimeMinutes = timesInMinutes.I;
  } else {
    // After Isha (Night, before midnight)
    prevPrayerKey = 'I';
    nextPrayerKey = 'F';
    prevTimeMinutes = timesInMinutes.I;
    nextTimeMinutes = timesInMinutes.F + 24 * 60; // Fajr tomorrow
  }

  // Calculate remaining seconds
  let targetSeconds = nextTimeMinutes * 60;
  let currentRefSeconds = currentSecondsInDay;

  // Handle wraps across midnight
  if (currentMinutes < timesInMinutes.F && prevPrayerKey === 'I') {
    // Before Fajr: currentRefSeconds is since 00:00, target is Fajr today
    targetSeconds = timesInMinutes.F * 60;
    const prevSeconds = (timesInMinutes.I - 24 * 60) * 60;
    totalSpanSeconds = targetSeconds - prevSeconds;
    elapsedSeconds = currentRefSeconds - prevSeconds;
  } else if (currentMinutes >= timesInMinutes.I && nextPrayerKey === 'F') {
    // After Isha: next is tomorrow's Fajr
    targetSeconds = (timesInMinutes.F + 24 * 60) * 60;
    const prevSeconds = timesInMinutes.I * 60;
    totalSpanSeconds = targetSeconds - prevSeconds;
    elapsedSeconds = currentRefSeconds - prevSeconds;
  } else {
    // Normal daytime interval
    const prevSeconds = prevTimeMinutes * 60;
    targetSeconds = nextTimeMinutes * 60;
    totalSpanSeconds = targetSeconds - prevSeconds;
    elapsedSeconds = currentRefSeconds - prevSeconds;
  }

  const totalSecondsRemaining = Math.max(0, targetSeconds - currentRefSeconds);
  const hoursRemaining = Math.floor(totalSecondsRemaining / 3600);
  const minutesRemaining = Math.floor((totalSecondsRemaining % 3600) / 60);
  const secondsRemaining = totalSecondsRemaining % 60;

  // Progress bar percentage (0 to 100)
  let progressPercent = 0;
  if (totalSpanSeconds > 0) {
    progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSeconds / totalSpanSeconds) * 100)));
  }

  // Countdown display string
  const pad = (n: number) => n.toString().padStart(2, '0');
  let countdownFormatted = '';
  if (hoursRemaining > 0) {
    countdownFormatted = `${hoursRemaining}h ${pad(minutesRemaining)}m ${pad(secondsRemaining)}s`;
  } else if (minutesRemaining > 0) {
    countdownFormatted = `${minutesRemaining}m ${pad(secondsRemaining)}s`;
  } else {
    countdownFormatted = `${secondsRemaining}s`;
  }

  // Check if we are within 15 minutes of the adhan of previous prayer
  const timeSincePrevSeconds = elapsedSeconds;
  const isPrayerTimeNow = timeSincePrevSeconds >= 0 && timeSincePrevSeconds <= 15 * 60;

  return {
    currentPrayerKey: prevPrayerKey,
    nextPrayerKey,
    prevPrayerKey,
    nextPrayerTime: prayerTimes[nextPrayerKey],
    prevPrayerTime: prayerTimes[prevPrayerKey],
    totalSecondsRemaining,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    countdownFormatted,
    progressPercent,
    isPrayerTimeNow,
    isPastPrayer,
  };
}
