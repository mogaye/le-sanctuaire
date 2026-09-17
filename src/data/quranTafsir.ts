export interface TafsirEntry {
  surahNumber: number;
  ayahNumber: number;
  title: string;
  theme: string;
  tafsirText: string;
  context?: string;
  virtue?: string;
}

export const FAMOUS_TAFSIRS: Record<string, TafsirEntry> = {
  '1:1': {
    surahNumber: 1,
    ayahNumber: 1,
    title: 'La Basmala - La clé de la bénédiction divine',
    theme: 'Miséricorde infinie',
    tafsirText: '« Bismillah » est la formule par laquelle le croyant inaugure tout acte noble. « Ar-Rahmân » désigne la Miséricorde immense qui englobe toute la création en ce bas monde. « Ar-Rahîm » désigne la Miséricorde spécifique réservée aux croyants dans l’Au-Delà.',
    virtue: 'Tout acte important qui ne commence pas par le Nom d’Allah est privé de bénédiction (Hadith).',
  },
  '1:2': {
    surahNumber: 1,
    ayahNumber: 2,
    title: 'La Louange absolue (Al-Hamd)',
    theme: 'Reconnaissance et Souveraineté',
    tafsirText: 'Al-Hamd est la reconnaissance plénière de la perfection divine et de Ses bienfaits illimités. « Rabb al-‘Âlamîn » : le Créateur, le Protecteur et le Pourvoyeur de l’ensemble des mondes (les hommes, les anges, les djinns et toute la création).',
  },
  '1:5': {
    surahNumber: 1,
    ayahNumber: 5,
    title: 'L’essence du Monothéisme (Tawhîd)',
    theme: 'Adoration et Confiance pure',
    tafsirText: '« C’est Toi Seul que nous adorons » constitue le désaveu du polythéisme (Shirk). « Et c’est de Toi Seul que nous implorons le secours » constitue le désaveu de toute prétention de force personnelle sans l’aide d’Allah. Ibn Kathir rappelle que ce verset est le cœur même du Coran.',
  },
  '1:6': {
    surahNumber: 1,
    ayahNumber: 6,
    title: 'La demande du Droit Chemin (As-Sirât Al-Mustaqîm)',
    theme: 'Guidance permanente',
    tafsirText: 'Le Droit Chemin est la voie claire et sans déviation apportée par le Prophète ﷺ. Le croyant implore cette guidance à chaque prière pour y être guidé, s’y maintenir avec constance et progresser en piété.',
  },
  '2:255': {
    surahNumber: 2,
    ayahNumber: 255,
    title: 'Ayat Al-Kursi - Le Verset du Trône',
    theme: 'La Majesté suprême d’Allah',
    tafsirText: 'Ce verset est le plus éminent de tout le Noble Coran. Il réunit dix affirmations indépendantes sur l’Unicité, l’Éternité (Al-Hayy, Al-Qayyûm), la vigilance absolue (ni somnolence ni sommeil), et l’immensité de Son Trône (« Al-Kursi ») qui englobe les cieux et la terre sans que leur préservation ne Lui coûte le moindre effort.',
    virtue: 'Quiconque récite ce verset après chaque prière obligatoire, rien ne l’empêche d’entrer au Paradis sinon la mort (Rapporté par An-Nasa’i).',
  },
  '2:285': {
    surahNumber: 2,
    ayahNumber: 285,
    title: 'Les Piliers de la Foi',
    theme: 'Soumission et Croyance',
    tafsirText: 'Ce verset résume les fondements de la foi : la croyance en Allah, en Ses anges, en Ses Livres révélés et en l’ensemble de Ses messagers sans distinction, couronné par la soumission pleine : « Nous avons entendu et nous avons obéi ».',
    virtue: 'Les deux derniers versets de la sourate Al-Baqara suffisent à quiconque les récite la nuit pour le protéger contre tout mal (Rapporté par Al-Bukhari).',
  },
  '2:286': {
    surahNumber: 2,
    ayahNumber: 286,
    title: 'La Miséricorde et le Pardon',
    theme: 'Absence de contrainte insurmontable',
    tafsirText: 'Allah confirme qu’Il n’impose à aucune âme une charge supérieure à sa capacité. C’est la promesse d’équité et de clémence absolue, suivie de l’invocation sublime pour le pardon de nos fautes et inadvertances.',
  },
  '18:1': {
    surahNumber: 18,
    ayahNumber: 1,
    title: 'La Louange pour la Révélation parfaite',
    theme: 'Vérité immaculée',
    tafsirText: 'Allah loue Sa propre essence pour avoir descendu le Livre sur Son serviteur Muhammad ﷺ, un Livre exempt de toute contradiction ou tortuosité, droit et parfait pour avertir d’un châtiment sévère et annoncer aux croyants une immense récompense.',
    virtue: 'Celui qui mémorise les dix premiers versets de la sourate Al-Kahf sera préservé de l’épreuve du Dajjal (l’Antéchrist) - Rapporté par Muslim.',
  },
  '18:10': {
    surahNumber: 18,
    ayahNumber: 10,
    title: 'L’invocation des Gens de la Caverne',
    theme: 'Refuge et droiture',
    tafsirText: 'Ces jeunes croyants fuyant la tyrannie et l’idolâtrie se réfugièrent dans la caverne en invoquant : « Ô notre Seigneur, accorde-nous de Ta part une miséricorde et assure-nous la droiture dans notre conduite. » C’est un modèle de confiance absolue en Allah face aux épreuves de ce monde.',
  },
  '24:35': {
    surahNumber: 24,
    ayahNumber: 35,
    title: 'Ayat An-Nur - Le Verset de la Lumière',
    theme: 'La Lumière des cieux et de la terre',
    tafsirText: 'Allah est la Lumière des cieux et de la terre. La parabole de Sa lumière dans le cœur du croyant est semblable à une niche contenant une lampe de cristal étincelante, alimentée par l’huile d’un olivier béni ni oriental ni occidental. Lumière sur lumière, Allah guide vers Sa lumière qui Il veut.',
  },
  '36:1': {
    surahNumber: 36,
    ayahNumber: 1,
    title: 'Ya-Sin - Le cœur du Coran',
    theme: 'Témoignage du Message',
    tafsirText: 'Les lettres isolées soulignent le caractère miraculeux de la parole divine. Le serment par le Coran plein de sagesse vient confirmer sans équivoque la mission prophétique de Muhammad ﷺ sur une voie droite.',
  },
  '55:13': {
    surahNumber: 55,
    ayahNumber: 13,
    title: 'Le rappel des bienfaits incommensurables',
    theme: 'Gratitude universelle',
    tafsirText: '« Lequel donc des bienfaits de votre Seigneur nierez-vous ? » Ce refrain répété 31 fois dans la sourate Ar-Rahman interpelle solennellement les deux créatures dotées de libre arbitre (les hommes et les djinns) sur leur reconnaissance envers les dons d’Allah.',
  },
  '67:1': {
    surahNumber: 67,
    ayahNumber: 1,
    title: 'Tabârak - La Royauté Suprême',
    theme: 'Bénédiction et Puissance',
    tafsirText: '« Béni soit Celui dans la main de qui est la royauté, et Il est Omnipotent sur toute chose. » La sourate Al-Mulk protège du châtiment de la tombe pour celui qui la récite avec méditation chaque nuit (Hadith authentique).',
  },
  '112:1': {
    surahNumber: 112,
    ayahNumber: 1,
    title: 'Al-Ikhlas - L’Unicité Pure (Tawhîd Al-Khâlis)',
    theme: 'L’Absolu Divin',
    tafsirText: 'Cette sourate équivaut au tiers du Coran en valeur doctrinale. Elle affirme l’Unicité absolue (« Ahad »), le refuge universel de toutes les créatures (« As-Samad »), et réfute tout engendrement ou équivalence.',
  },
  '113:1': {
    surahNumber: 113,
    ayahNumber: 1,
    title: 'Al-Falaq - La protection contre les ténèbres',
    theme: 'Refuge contre le mal extérieur',
    tafsirText: 'Le croyant cherche refuge auprès du Seigneur de l’aube naissante contre le mal des créatures, contre la noirceur de la nuit, contre les pratiques occultes et contre l’envieux lorsqu’il envie.',
  },
  '114:1': {
    surahNumber: 114,
    ayahNumber: 1,
    title: 'An-Nas - La protection contre les insufflations',
    theme: 'Refuge contre le mal intérieur',
    tafsirText: 'Le croyant s’en remet au Seigneur, Souverain et Dieu des hommes contre le perfide tentateur (« Al-Waswâs ») qui insuffle le doute dans les cœurs, qu’il soit issu des djinns ou des hommes.',
  },
};

export function getTafsirForAyah(surahNum: number, ayahNum: number, surahName?: string): TafsirEntry {
  const key = `${surahNum}:${ayahNum}`;
  if (FAMOUS_TAFSIRS[key]) {
    return FAMOUS_TAFSIRS[key];
  }

  // Generative context for any other verse
  return {
    surahNumber: surahNum,
    ayahNumber: ayahNum,
    title: `Méditation du verset ${surahNum}:${ayahNum}`,
    theme: `Enseignement spirituel & Sagesse divine`,
    tafsirText: `Ce verset de la sourate ${surahName || surahNum} invite le croyant à contempler la grandeur d’Allah, Ses commandements bienveillants et Sa promesse de paix intérieure. Selon les exégètes classiques (Tafsir Ibn Kathir et Jalalayn), chaque verset porte une guidance vivante pour la purification du cœur et l’affermissement de la foi.`,
  };
}
