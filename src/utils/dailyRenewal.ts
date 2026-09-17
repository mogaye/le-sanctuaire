import { SPIRITUAL_VERSES, SpiritualVerse } from '../data/spiritualVerses';

export interface DailyHadith {
  id: string;
  arabic?: string;
  text: string;
  narrator: string;
  source: string;
  topic: string;
}

export const DAILY_HADITHS: DailyHadith[] = [
  {
    id: 'h1',
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    text: '« Les actions ne valent que par leurs intentions, et chacun ne recevra la récompense que selon ce qu’il a eu l’intention de faire. »',
    narrator: 'Omar ibn Al-Khattab (qu’Allah l’agrée)',
    source: 'Rapporté par Al-Bukhari (1) et Muslim (1907)',
    topic: 'Sincérité & Intention (Niyyah)',
  },
  {
    id: 'h2',
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    text: '« Le meilleur d’entre vous est celui qui a appris le Coran et qui l’a enseigné aux autres. »',
    narrator: 'Othman ibn Affan (qu’Allah l’agrée)',
    source: 'Rapporté par Al-Bukhari (5027)',
    topic: 'Le Saint Coran',
  },
  {
    id: 'h3',
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    text: '« Que celui qui croit en Allah et au Jour dernier dise du bien ou qu’il garde le silence. »',
    narrator: 'Abu Hurayrah (qu’Allah l’agrée)',
    source: 'Rapporté par Al-Bukhari et Muslim',
    topic: 'Comportement & Maîtrise de la parole',
  },
  {
    id: 'h4',
    arabic: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    text: '« Aucun de vous ne sera véritablement croyant tant qu’il n’aimera pas pour son frère ce qu’il aime pour lui-même. »',
    narrator: 'Anas ibn Malik (qu’Allah l’agrée)',
    source: 'Rapporté par Al-Bukhari (13) et Muslim (45)',
    topic: 'Fraternité & Altruisme',
  },
  {
    id: 'h5',
    arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
    text: '« L’invocation est l’essence même de l’adoration. »',
    narrator: 'An-Nu’man ibn Bashir (qu’Allah l’agrée)',
    source: 'Rapporté par At-Tirmidhi (2969), authentifié par Al-Albani',
    topic: 'Invocations (Doua)',
  },
  {
    id: 'h6',
    arabic: 'مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا',
    text: '« Celui qui prie sur moi une seule prière, Allah le bénit dix fois en retour. »',
    narrator: 'Abu Hurayrah (qu’Allah l’agrée)',
    source: 'Rapporté par Muslim (384)',
    topic: 'Prières sur le Prophète ﷺ',
  },
  {
    id: 'h7',
    arabic: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    text: '« Crains Allah où que tu sois, fais suivre la mauvaise action d’une bonne action qui l’effacera, et comporte-toi avec les gens avec un bon caractère. »',
    narrator: 'Abu Dharr et Mu’adh ibn Jabal (qu’Allah les agrée)',
    source: 'Rapporté par At-Tirmidhi (1987), Hadith Hasan',
    topic: 'Noblesse de caractère (Taqwa)',
  },
];

// Returns today's ISO date string: YYYY-MM-DD
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Computes day of year (1 to 366)
export function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Daily Verse of the Day (Renews automatically every midnight)
export function getDailySpiritualVerse(): SpiritualVerse {
  const day = getDayOfYear();
  const index = day % SPIRITUAL_VERSES.length;
  return SPIRITUAL_VERSES[index] || SPIRITUAL_VERSES[0];
}

// Daily Hadith of the Day (Renews automatically every midnight)
export function getDailyHadith(): DailyHadith {
  const day = getDayOfYear();
  const index = day % DAILY_HADITHS.length;
  return DAILY_HADITHS[index] || DAILY_HADITHS[0];
}

// Daily Islamic / Hijri Date calculation
export function getDailyHijriDate(): { day: number; monthName: string; year: number; raw: string } {
  try {
    const now = new Date();
    // Use Intl DateTimeFormat with Islamic Umalqura calendar
    const formatter = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    let day = 1;
    let monthName = 'Safar';
    let year = 1448;

    parts.forEach((p) => {
      if (p.type === 'day') day = parseInt(p.value, 10) || 1;
      if (p.type === 'month') monthName = p.value;
      if (p.type === 'year') year = parseInt(p.value, 10) || 1448;
    });

    const raw = formatter.format(now);
    return { day, monthName, year, raw };
  } catch {
    // Fallback if Intl calendar not supported
    return {
      day: 24,
      monthName: 'Safar',
      year: 1448,
      raw: '24 Safar 1448',
    };
  }
}

// Daily Spiritual Reflection / Thought of the Day
export function getDailyReflection(): { title: string; text: string } {
  const reflections = [
    {
      title: 'Patience & Espoir',
      text: 'Chaque épreuve renferme une graine de soulagement. Fais confiance au Plan Divin et garde ton cœur en paix.',
    },
    {
      title: 'La Lumière du Dhikr',
      text: 'Le rappel constant d’Allah apaise les angoisses et illumine l’âme même au cœur de l’obscurité.',
    },
    {
      title: 'Bienveillance & Fraternité',
      text: 'Un simple sourire, une parole douce ou un geste d’aide constituent une aumône bénie auprès du Très-Haut.',
    },
    {
      title: 'La Valeur du Temps',
      text: 'Chaque souffle est une opportunité unique pour se rapprocher du Créateur et purifier son intention.',
    },
    {
      title: 'Gratitude (Ash-Shukr)',
      text: 'Compter ses bienfaits quotidiens attire la bénédiction et ouvre les portes de l’abondance spirituelle.',
    },
  ];

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const index = Math.abs(dayOfYear) % reflections.length;
  return reflections[index];
}
