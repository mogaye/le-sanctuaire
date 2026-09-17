export interface PrayerTime {
  name: string;
  key: 'F' | 'D' | 'A' | 'M' | 'I';
  arabicName: string;
  time: string;
  rakats: number;
  description: string;
}

export interface CityData {
  id: string;
  name: string;
  country: string;
  region?: string;
  prayers: Record<'F' | 'D' | 'A' | 'M' | 'I', string>;
  qiblaAngle: number;
  timezone?: string;
  utcOffset?: string;
  latitude?: number;
  longitude?: number;
}

export interface Reciter {
  id: string;
  name: string;
  style: string;
}

export interface Method {
  id: string;
  name: string;
  fullName: string;
}

export interface Surah {
  number: number;
  name: string;
  arabicName: string;
  englishTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Mecquoise' | 'Médinoise';
  ayahs: {
    number: number;
    text: string;
    translation: string;
  }[];
}

export interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  targetCount: number;
  category: 'matin' | 'soir' | 'tasbih' | 'apres_priere';
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  city?: string;
}
