import { PUITS_DE_NOUR_HERO_IMAGE } from './puitsDeNourCharacters';

export type BookCategory =
  | 'Coran'
  | 'Jeûne & Ramadan'
  | 'Foi & Croyance (Aqida)'
  | 'Récit & Sagesse'
  | 'Sîrah & Histoire'
  | 'Fiqh & Piliers'
  | 'Spiritualité & Cœur'
  | 'foi'
  | 'jeune';

export interface IslamicBook {
  id: string;
  title: string;
  arabicTitle?: string;
  author: string;
  category: BookCategory;
  description: string;
  pages?: string;
  pageEstimate?: string;
  chaptersCount?: number;
  charactersCount?: number;
  pdfUrl?: string;
  coverImage?: string;
  coverGradient: string;
  accentColor: string;
  featured?: boolean;
  publishedAt?: string;
  isInteractiveBook?: boolean;
}

export const BOOK_CATEGORIES = [
  { id: 'all', label: 'Tous les livres' },
  { id: 'Foi & Croyance (Aqida)', label: 'Foi & Croyance' },
  { id: 'Spiritualité & Cœur', label: 'Spiritualité & Piété' },
  { id: 'Sîrah & Histoire', label: 'Sîrah & Histoire' },
  { id: 'Fiqh & Piliers', label: 'Fiqh & Zakat' },
  { id: 'Jeûne & Ramadan', label: 'Jeûne & Ramadan' },
  { id: 'Récit & Sagesse', label: 'Récits & Sagesses' },
] as const;

export const ISLAMIC_BOOKS: IslamicBook[] = [
  {
    id: 'le-puits-de-nour',
    title: 'Le Puits de Nour',
    arabicTitle: 'بِئْرُ نُور — دَارُ السَّلَام',
    author: 'Édition Originale du Sanctuaire',
    category: 'Récit & Sagesse',
    description:
      "Dans le village d'oasis de Dar-Salam frappé par la sécheresse, le jeune Yassine (12 ans), élevé par sa grand-mère Setti Aïcha, découvre que le tarissement du grand puits cache une vérité enfouie depuis le départ mystérieux de son père. Un récit initiatique profond sur l'honnêteté, la responsabilité collective, le pardon et la lumière de la vérité.",
    pages: '4 Chapitres & Épilogue (Texte intégral)',
    pageEstimate: '85',
    chaptersCount: 4,
    charactersCount: 19,
    coverImage: PUITS_DE_NOUR_HERO_IMAGE,
    coverGradient: 'from-amber-700 via-amber-900 to-stone-950',
    accentColor: 'amber',
    featured: true,
    publishedAt: 'Parution du Vendredi — Disponible maintenant',
    isInteractiveBook: true,
  },
  {
    id: 'biographie-du-prophete',
    title: 'Biographie du Prophète Muhammad (ﷺ)',
    arabicTitle: 'السيرة النبوية العطرة',
    author: 'Sîrah Prophétique Authentique',
    category: 'Sîrah & Histoire',
    description:
      "Un récit complet et émouvant de la vie exemplaire du Messager d'Allah ﷺ : de sa naissance bénie à La Mecque, la révélation divine, l'émigration (Hijrah) vers Médine, l'édification de la société musulmane, jusqu'au pèlerinage d'adieu.",
    pageEstimate: '49',
    pdfUrl: '/livres/biographie-du-prophete.pdf',
    coverGradient: 'from-emerald-800 via-teal-900 to-[#0A1A11]',
    accentColor: 'emerald',
    featured: true,
    publishedAt: 'Collection Sîrah',
  },
  {
    id: 'la-piete-sa-realite',
    title: "La Piété : Sa Réalité et l'Effet de sa Mise en Application",
    arabicTitle: 'حقيقة التقوى وأثرها في حياة المسلم',
    author: 'Ouvrage de Spiritualité & Sagesse',
    category: 'Spiritualité & Cœur',
    description:
      "Une étude spirituelle profonde sur le concept coranique d'At-Taqwâ (la piété et la crainte révérencielle d'Allah), ses fondements, ses manifestations concrètes dans le comportement et ses bienfaits immenses ici-bas et dans l'au-delà.",
    pageEstimate: '40',
    pdfUrl: '/livres/la-piete-sa-realite.pdf',
    coverGradient: 'from-teal-800 via-emerald-950 to-stone-900',
    accentColor: 'teal',
    publishedAt: 'Collection Spiritualité',
  },
  {
    id: 'regle-dans-la-patience',
    title: 'Règle dans la Patience et le Remerciement',
    arabicTitle: 'قاعدة في الصبر والشكر',
    author: 'Cheikh Al-Islam Ibn Taymiyyah',
    category: 'Récit & Sagesse',
    description:
      "Traité magistral sur les deux ailes indissociables de la foi : l'endurance patiente face aux épreuves (As-Sabr) et la reconnaissance sincère envers les bienfaits divins (Ash-Shoukr), avec exemples et règles spirituelles pour le croyant.",
    pageEstimate: '41',
    pdfUrl: '/livres/regle-dans-la-patience-et-le-remerciement.pdf',
    coverGradient: 'from-amber-800 via-amber-950 to-stone-950',
    accentColor: 'amber',
    featured: true,
    publishedAt: 'Éditions Classiques',
  },
  {
    id: 'guide-pratique-zakat',
    title: 'Guide Pratique de la Zakat',
    arabicTitle: 'الدليل العملي لأحكام الزكاة',
    author: 'Fiqh & Jurisprudence Islamique',
    category: 'Fiqh & Piliers',
    description:
      "Manuel pratique, clair et complet pour comprendre et calculer correctement le troisième pilier de l'Islam : Zakat Al-Mal (épargne, or, argent, biens commerciaux), calcul du Nisab, bénéficiaires coraniques et Zakat Al-Fitr de fin de Ramadan.",
    pageEstimate: '56',
    pdfUrl: '/livres/guide-pratique-zakat.pdf',
    coverGradient: 'from-emerald-900 via-green-950 to-neutral-900',
    accentColor: 'emerald',
    featured: true,
    publishedAt: 'Guide Pratique',
  },
  {
    id: 'crains-allah-ou-que-tu-sois',
    title: 'Crains Allah où que tu sois',
    arabicTitle: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ',
    author: 'Explication de Hadith & Sagesse',
    category: 'Spiritualité & Cœur',
    description:
      "Commentaire détaillé du précieux testament prophétique enseigné à Mou'adh Ibn Jabal : la vigilance divine en secret comme en public, faire suivre la mauvaise action par une bonne qui l'efface, et se comporter avec autrui avec les plus nobles vertus.",
    pageEstimate: '31',
    pdfUrl: '/livres/crains-allah-ou-que-tu-sois.pdf',
    coverGradient: 'from-indigo-900 via-blue-950 to-neutral-950',
    accentColor: 'indigo',
    featured: true,
    publishedAt: 'Rappels & Sagesses',
  },
  {
    id: 'lutte-contre-les-penchants',
    title: "La Lutte contre les Penchants de l'Âme",
    arabicTitle: 'جهاد النفس ومخالفة الهوى',
    author: 'Purification du Cœur (Tazkiyah)',
    category: 'Spiritualité & Cœur',
    description:
      "Guide d'éducation spirituelle sur le Jihad An-Nafs (la lutte contre les passions égocentriques, l'orgueil, la paresse et les désirs illicites) afin de faire triompher la raison, la foi et d'accéder à l'âme apaisée (An-Nafs Al-Moutma'innah).",
    pageEstimate: '14',
    pdfUrl: '/livres/lutte-contre-les-penchants-de-lame.pdf',
    coverGradient: 'from-purple-900 via-neutral-950 to-stone-950',
    accentColor: 'purple',
    featured: true,
    publishedAt: 'Purification & Sagesse',
  },
  {
    id: 'livret-devoilement-fitnah',
    title: 'Livret : Dévoilement des Épreuves & Enseignements',
    arabicTitle: 'رسالة في الفتن والمواقف الشرعية',
    author: 'Épître & Éclaircissement Doctrinal',
    category: 'Foi & Croyance (Aqida)',
    description:
      "Épître apportant des repères essentiels sur la préservation de l'unité des croyants, la vigilance face aux polémiques et discordes (fitan), et la fidélité constante aux fondements purs du Coran et de la tradition prophétique.",
    pageEstimate: '236',
    pdfUrl: '/livres/livret-devoilement-de-la-fitnah.pdf',
    coverGradient: 'from-slate-800 via-stone-900 to-neutral-950',
    accentColor: 'slate',
    featured: true,
    publishedAt: 'Éclaircissements',
  },
  {
    id: 'la-foi-islamique-paradis-enfer',
    title: 'La Foi Islamique : Le Paradis et l’Enfer',
    arabicTitle: 'الجنة والنار في ضوء الكتاب والسنة',
    author: 'Dr. Umar Sulayman Al-Ashqar',
    category: 'Foi & Croyance (Aqida)',
    description:
      "Ouvrage de référence mondial exhaustif basé sur le Coran et les Hadiths authentiques décrivant avec minutie les délices, rangs et portes du Paradis promis aux pieux, ainsi que les avertissements et châtiments de l'Enfer.",
    pageEstimate: '272',
    pdfUrl: '/livres/la-foi-islamique-paradis-et-enfer.pdf',
    coverGradient: 'from-emerald-950 via-teal-900 to-stone-950',
    accentColor: 'emerald',
    featured: true,
    publishedAt: 'Ouvrage de Référence',
  },
  {
    id: 'la-resurrection',
    title: 'Le Jour de la Résurrection (Al-Qiyamah)',
    arabicTitle: 'اليوم الآخر : القيامة الكبرى',
    author: 'Dr. Umar Sulayman Al-Ashqar',
    category: 'Foi & Croyance (Aqida)',
    description:
      "Étude doctrinale majeure sur les événements grandioses du Jour Dernier : le souffle dans la Trompe, la Résurrection, le Rassemblement de l'humanité, l'exposition des actes, la Balance (Al-Mizan), le Bassin (Al-Hawd) et la traversée du Pont (As-Sirat).",
    pageEstimate: '464',
    pdfUrl: '/livres/la-resurrection.pdf',
    coverGradient: 'from-cyan-900 via-sky-950 to-neutral-950',
    accentColor: 'cyan',
    featured: true,
    publishedAt: 'Ouvrage de Référence',
  },
  {
    id: 'livre-du-jeune-ibn-baz',
    title: 'Le Livre du Jeûne selon Cheikh Ibn Baz',
    arabicTitle: 'رسالة في الصيام وأحكامه',
    author: 'Cheikh Abdul-Aziz Ibn Baz',
    category: 'Jeûne & Ramadan',
    description:
      "Recueil complet des réponses juridiques indispensables sur les règles du jeûne de Ramadan : confirmation du croissant lunaire, conditions obligatoires, actes autorisés ou annulatifs, et dispositions spécifiques pour les malades, personnes âgées et voyageurs.",
    pageEstimate: '34',
    pdfUrl: '/livres/livre-du-jeune-ibn-baz.pdf',
    coverGradient: 'from-emerald-900 via-green-950 to-stone-950',
    accentColor: 'emerald',
    featured: true,
    publishedAt: 'Jurisprudence de Ramadan',
  },
  {
    id: 'conditions-du-jeune',
    title: 'Les Conditions & Règles du Jeûne de Ramadan',
    arabicTitle: 'شروط الصيام وأركانه',
    author: 'Enseignement du Fiqh Simplifié',
    category: 'Jeûne & Ramadan',
    description:
      "Guide clair et synthétique récapitulant les piliers fondamentaux, les conditions d'exigibilité et de validité du jeûne, les comportements recommandés au Suhour et à l'Iftar, ainsi que les erreurs courantes à éviter.",
    pageEstimate: '22',
    pdfUrl: '/livres/conditions-du-jeune.pdf',
    coverGradient: 'from-teal-900 via-emerald-950 to-neutral-900',
    accentColor: 'teal',
    publishedAt: 'Fiqh Simplifié',
  },
  {
    id: 'le-jeune-de-ramadan',
    title: 'Le Jeûne de Ramadan : Mérites et Pratiques',
    arabicTitle: 'فضل شهر رمضان وأحكام الصيام',
    author: 'Guide Spirituel & Jurisprudence',
    category: 'Jeûne & Ramadan',
    description:
      "Ouvrage complet pour vivre pleinement le mois béni de Ramadan : les immenses mérites spirituels du jeûne, l'assiduité à la récitation coranique, la prière de Tarawih, la générosité, la quête de la Nuit du Destin (Laylat Al-Qadr) et l'I'tikaf.",
    pageEstimate: '28',
    pdfUrl: '/livres/le-jeune-de-ramadan.pdf',
    coverGradient: 'from-amber-900 via-yellow-950 to-stone-950',
    accentColor: 'amber',
    featured: true,
    publishedAt: 'Spiritualité de Ramadan',
  },
];
