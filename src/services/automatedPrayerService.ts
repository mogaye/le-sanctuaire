import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { CITIES } from '../data/islamicData.ts';

export interface AutomatedPrayerDay {
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Lundi 2 Nov"
  dayNumber: number;
  hijriFormatted: string; // e.g. "12 Joumada Al-Oula 1448 AH"
  fajr: string;
  shuruq: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface AutomatedPrayerScheduleResult {
  cityId: string;
  cityName: string;
  country: string;
  region: string;
  timezone: string;
  methodName: string;
  asrMethod: string;
  weekRangeFormatted: string; // e.g. "Semaine du 02 au 08 Novembre 2026"
  days: AutomatedPrayerDay[];
  currentWeekNumber: number;
  generatedAt: string;
}

function getCalculationParams(methodId: string, asrMethod: string = 'standard') {
  let params = CalculationMethod.MuslimWorldLeague();

  if (methodId === 'umm_al_qura') {
    params = CalculationMethod.UmmAlQura();
  } else if (methodId === 'egypt') {
    params = CalculationMethod.Egyptian();
  } else if (methodId === 'isna') {
    params = CalculationMethod.NorthAmerica();
  } else if (methodId === 'uoif') {
    params = CalculationMethod.Other();
    params.fajrAngle = 12;
    params.ishaAngle = 12;
  }

  if (asrMethod === 'hanafi') {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi;
  }

  return params;
}

function formatInTimezone(d: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

function getHijriString(d: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const str = formatter.format(d);
    return str.includes('AH') ? str : `${str} AH`;
  } catch {
    return '1448 AH';
  }
}

/**
 * Calculates authentic prayer times for a city for an entire week or specific date range.
 * This runs continuously on the backend to guarantee authentic astronomical times.
 */
export function getWeeklyAutomatedPrayers(
  cityIdOrName: string,
  methodId: string = 'muslim',
  asrMethod: string = 'standard',
  referenceDate: Date = new Date()
): AutomatedPrayerScheduleResult {
  const query = (cityIdOrName || 'dakar').trim().toLowerCase();
  const city =
    CITIES.find(
      (c) =>
        c.id.toLowerCase() === query ||
        c.name.toLowerCase() === query ||
        c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === query
    ) || CITIES[0];

  const params = getCalculationParams(methodId, asrMethod);
  const coords = new Coordinates(city.latitude, city.longitude);

  // Compute Monday of the week
  const curr = new Date(referenceDate);
  const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - dayOfWeek);
  monday.setHours(12, 0, 0, 0);

  const days: AutomatedPrayerDay[] = [];
  const frenchDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const frenchMonths = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const pt = new PrayerTimes(coords, d, params);
    const dayName = `${frenchDays[i]} ${d.getDate()} ${frenchMonths[d.getMonth()]}`;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    days.push({
      date: dateStr,
      dayName,
      dayNumber: d.getDate(),
      hijriFormatted: getHijriString(d),
      fajr: formatInTimezone(pt.fajr, city.timezone),
      shuruq: formatInTimezone(pt.sunrise, city.timezone),
      dhuhr: formatInTimezone(pt.dhuhr, city.timezone),
      asr: formatInTimezone(pt.asr, city.timezone),
      maghrib: formatInTimezone(pt.maghrib, city.timezone),
      isha: formatInTimezone(pt.isha, city.timezone),
    });
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekRangeFormatted = `Semaine du ${monday.getDate()} au ${sunday.getDate()} ${frenchMonths[sunday.getMonth()]} ${sunday.getFullYear()}`;

  // Week number
  const firstJan = new Date(curr.getFullYear(), 0, 1);
  const pastDays = (curr.getTime() - firstJan.getTime()) / 86400000;
  const currentWeekNumber = Math.ceil((pastDays + firstJan.getDay() + 1) / 7);

  return {
    cityId: city.id,
    cityName: city.name,
    country: city.country,
    region: city.region || 'Afrique',
    timezone: city.timezone,
    methodName: methodId === 'umm_al_qura' ? 'Umm Al-Qura' : 'Ligue Islamique Mondiale',
    asrMethod: asrMethod === 'hanafi' ? 'Hanafite' : 'Standard (Shafi/Maliki/Hanbali)',
    weekRangeFormatted,
    days,
    currentWeekNumber,
    generatedAt: new Date().toISOString(),
  };
}
