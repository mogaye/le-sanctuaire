export type QuizCategoryId = 'piliers' | 'sira' | 'prophetes' | 'coran' | 'histoire';

export interface QuizQuestionItem {
  id: string;
  category: QuizCategoryId;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation?: string;
}

export interface QuizCategoryMeta {
  id: QuizCategoryId;
  label: string;
  shortLabel: string;
}

export interface QuizPackPreset {
  id: string;
  title: string;
  questionIds: string[];
}

export const QUIZ_CATEGORIES: QuizCategoryMeta[] = [
  { id: 'piliers', label: 'Piliers & Pratique', shortLabel: 'Piliers' },
  { id: 'sira', label: 'Vie du Prophète ﷺ', shortLabel: 'Sîra' },
  { id: 'prophetes', label: 'Les Prophètes', shortLabel: 'Prophètes' },
  { id: 'coran', label: 'Noble Coran', shortLabel: 'Coran' },
  { id: 'histoire', label: 'Compagnons & Culture', shortLabel: 'Culture' },
];

export const ISLAMIC_QUIZ_BANK: QuizQuestionItem[] = [
  // ================= PILIERS & PRATIQUE =================
  {
    id: 'pil_1',
    category: 'piliers',
    question: 'Combien de piliers compte l’Islam selon le hadith authentique de Jibril ?',
    options: ['3 piliers', '5 piliers', '6 piliers', '7 piliers'],
    correctIndex: 1,
    explanation: 'Les 5 piliers : Shahada, Salat, Zakat, Jeûne du Ramadan et Hajj.',
  },
  {
    id: 'pil_2',
    category: 'piliers',
    question: 'Combien de rak‘ât obligatoires compte la prière du Maghrib ?',
    options: ['2 rak‘ât', '3 rak‘ât', '4 rak‘ât', '5 rak‘ât'],
    correctIndex: 1,
    explanation: 'Le Maghrib comprend 3 unités obligatoires (Fajr 2, Dhuhr 4, Asr 4, Isha 4).',
  },
  {
    id: 'pil_3',
    category: 'piliers',
    question: 'Quel est le taux habituel de la Zakât sur l’épargne annuelle (Nisâb atteint) ?',
    options: ['1 %', '2,5 %', '5 %', '10 %'],
    correctIndex: 1,
    explanation: 'La Zakât Al-Mâl correspond à 2,5 % (un quarantième) après une année lunaire.',
  },
  {
    id: 'pil_4',
    category: 'piliers',
    question: 'Quelle nuit vaut plus de mille mois d’adoration pendant le Ramadan ?',
    options: ['Laylat Al-Qadr', 'Le 1er Ramadan', 'Laylat Al-Mi‘râj', 'Le 15 Cha‘bân'],
    correctIndex: 0,
    explanation: 'Sourate Al-Qadr (97:3) : La Nuit du Destin est meilleure que mille mois.',
  },
  {
    id: 'pil_5',
    category: 'piliers',
    question: 'Combien d’articles de foi (Arkân Al-Îmân) sont mentionnés par le Prophète ﷺ ?',
    options: ['4 articles', '5 articles', '6 articles', '7 articles'],
    correctIndex: 2,
    explanation: 'Croire en Allah, Ses Anges, Ses Livres, Ses Messagers, le Jour Dernier et le Destin.',
  },
  {
    id: 'pil_6',
    category: 'piliers',
    question: 'Quel pilier du Hajj est si essentiel que sans lui le pèlerinage n’est pas valide ?',
    options: ['Le stationnement à ‘Arafa', 'Boire à Zamzam', 'Dormir à Médine', 'Toucher la Pierre Noire'],
    correctIndex: 0,
    explanation: 'Le Prophète ﷺ a dit : « Le Hajj, c’est ‘Arafa. » (Rapporté par At-Tirmidhi).',
  },
  {
    id: 'pil_7',
    category: 'piliers',
    question: 'Quelle prière nocturne surérogatoire est spécifiquement priée en Ramadan ?',
    options: ['Salat Al-Kousouf', 'Tarâwîh', 'Salat Al-Istikhâra', 'Salat Ad-Douhâ'],
    correctIndex: 1,
    explanation: 'Les Tarâwîh sont accomplies chaque nuit du mois béni de Ramadan après l’Isha.',
  },

  // ================= VIE DU PROPHÈTE ﷺ (SÎRA) =================
  {
    id: 'sir_1',
    category: 'sira',
    question: 'En quelle année après la naissance du Prophète ﷺ a commencé la Révélation ?',
    options: ['À 25 ans', 'À 33 ans', 'À 40 ans', 'À 45 ans'],
    correctIndex: 2,
    explanation: 'La Révélation débuta dans la grotte de Hirâ lorsque le Prophète ﷺ avait 40 ans.',
  },
  {
    id: 'sir_2',
    category: 'sira',
    question: 'Dans quelle grotte le Prophète Muhammad ﷺ reçut-il les premiers versets ?',
    options: ['Grotte de Thawr', 'Grotte de Hirâ', 'Mont Uhud', 'Vallée de Minâ'],
    correctIndex: 1,
    explanation: 'L’ange Jibril lui révéla « Iqra » dans la grotte de Hirâ sur le mont An-Nour.',
  },
  {
    id: 'sir_3',
    category: 'sira',
    question: 'Qui fut la première personne à croire au message du Prophète ﷺ ?',
    options: ['Abou Bakr As-Siddîq', '‘Alî ibn Abî Tâlib', 'Khadîja bint Khuwaylid', 'Zayd ibn Hâritha'],
    correctIndex: 2,
    explanation: 'Son épouse Khadîja (qu’Allah l’agrée) le réconforta et crut immédiatement.',
  },
  {
    id: 'sir_4',
    category: 'sira',
    question: 'Quel événement marque le début du calendrier hégirien ?',
    options: ['La naissance du Prophète ﷺ', 'L’émigration à Médine', 'La prise de La Mecque', 'La bataille de Badr'],
    correctIndex: 1,
    explanation: 'L’Hégire (Hijra) vers Médine en 622 fut choisie par ‘Umar comme point de départ.',
  },
  {
    id: 'sir_5',
    category: 'sira',
    question: 'Quel compagnon accompagna le Prophète ﷺ dans la grotte de Thawr lors de l’Hégire ?',
    options: ['‘Umar ibn Al-Khattâb', '‘Uthmân ibn ‘Affân', 'Abou Bakr As-Siddîq', 'Bilâl ibn Rabâh'],
    correctIndex: 2,
    explanation: 'Abou Bakr l’accompagna, cité dans Sourate At-Tawbah (9:40).',
  },
  {
    id: 'sir_6',
    category: 'sira',
    question: 'Comment s’appelait la nourrice du Prophète ﷺ issue de la tribu des Banou Sa‘d ?',
    options: ['Halîma As-Sa‘diyya', 'Baraka (Umm Ayman)', 'Âmina bint Wahb', 'Fâtima bint Asad'],
    correctIndex: 0,
    explanation: 'Halîma As-Sa‘diyya l’allaita et l’éleva durant sa petite enfance dans le désert.',
  },

  // ================= LES PROPHÈTES =================
  {
    id: 'pro_1',
    category: 'prophetes',
    question: 'Quel prophète fut avalé par un grand poisson puis invoqua Allah dans les ténèbres ?',
    options: ['Moussa (عليه السلام)', 'Younous (عليه السلام)', 'Ayyoûb (عليه السلام)', 'Nouh (عليه السلام)'],
    correctIndex: 1,
    explanation: 'Younous (Jonas) prononça l’invocation célèbre : « Lâ ilâha illâ Anta Subhânaka… »',
  },
  {
    id: 'pro_2',
    category: 'prophetes',
    question: 'Quel prophète a bâti la Ka‘ba avec son fils Ismâ‘îl (عليهما السلام) ?',
    options: ['Nouh (عليه السلام)', 'Ibrâhîm (عليه السلام)', 'Dâwoûd (عليه السلام)', 'Soulaymân (عليه السلام)'],
    correctIndex: 1,
    explanation: 'Sourate Al-Baqara (2:127) mentionne Ibrâhîm et Ismâ‘îl élevant les assises de la Maison.',
  },
  {
    id: 'pro_3',
    category: 'prophetes',
    question: 'À quel prophète Allah a-t-Il donné la capacité de parler aux animaux et aux djinns ?',
    options: ['Youssouf (عليه السلام)', 'Soulaymân (عليه السلام)', '‘Îssâ (عليه السلام)', 'Idrîs (عليه السلام)'],
    correctIndex: 1,
    explanation: 'Sourate An-Naml (27:16) relate que Soulaymân apprit le langage des oiseaux et fourmis.',
  },
  {
    id: 'pro_4',
    category: 'prophetes',
    question: 'Quel prophète est surnommé « Kalîm Allah » (celui à qui Allah a parlé directement) ?',
    options: ['Moussa (عليه السلام)', 'Ibrâhîm (عليه السلام)', '‘Îssâ (عليه السلام)', 'Muhammad ﷺ'],
    correctIndex: 0,
    explanation: 'Allah s’adressa directement à Moussa au mont Tour (Sourate An-Nisâ 4:164).',
  },
  {
    id: 'pro_5',
    category: 'prophetes',
    question: 'Quel prophète reçut le Zabour (les Psaumes) comme Livre révélé ?',
    options: ['Moussa (عليه السلام)', 'Dâwoûd (عليه السلام)', '‘Îssâ (عليه السلام)', 'Ibrâhîm (عليه السلام)'],
    correctIndex: 1,
    explanation: 'Allah dit dans Sourate Al-Isrâ (17:55) : « Et Nous avons donné le Zabour à Dâwoûd. »',
  },
  {
    id: 'pro_6',
    category: 'prophetes',
    question: 'Quel prophète interpréta le rêve du roi d’Égypte concernant 7 vaches grasses et 7 maigres ?',
    options: ['Ya‘qoûb (عليه السلام)', 'Youssouf (عليه السلام)', 'Hâroûn (عليه السلام)', 'Ilyâs (عليه السلام)'],
    correctIndex: 1,
    explanation: 'Youssouf (عليه السلام) prédit 7 années d’abondance suivies de 7 années de sécheresse.',
  },

  // ================= NOBLE CORAN =================
  {
    id: 'cor_1',
    category: 'coran',
    question: 'Combien de sourates compte le Noble Coran au total ?',
    options: ['99 sourates', '110 sourates', '114 sourates', '120 sourates'],
    correctIndex: 2,
    explanation: 'Le Coran comporte exactement 114 sourates, d’Al-Fâtiha à An-Nâs.',
  },
  {
    id: 'cor_2',
    category: 'coran',
    question: 'Quelle est la plus longue sourate du Noble Coran ?',
    options: ['Âl-‘Imrân', 'Al-Baqara', 'An-Nisâ', 'Al-Mâ’ida'],
    correctIndex: 1,
    explanation: 'Sourate Al-Baqara (La Vache) contient 286 versets.',
  },
  {
    id: 'cor_3',
    category: 'coran',
    question: 'Quelle sourate ne commence PAS par « Bismillâh ir-Rahmân ir-Rahîm » ?',
    options: ['Al-Kahf', 'Yâ-Sîn', 'At-Tawba', 'Ar-Rahmân'],
    correctIndex: 2,
    explanation: 'Sourate At-Tawba (sourate 9) est la seule sourate sans Basmala au début.',
  },
  {
    id: 'cor_4',
    category: 'coran',
    question: 'Quelle sourate équivaut à un tiers du Coran en récompense selon le Prophète ﷺ ?',
    options: ['Al-Ikhlâs', 'Al-Falaq', 'Al-Mulk', 'Al-Fâtiha'],
    correctIndex: 0,
    explanation: 'Sourate Al-Ikhlâs (112) résume l’Unicité pure d’Allah et équivaut au tiers du Coran.',
  },
  {
    id: 'cor_5',
    category: 'coran',
    question: 'Quel est le plus grand verset du Coran connu sous le nom de « Verset du Trône » ?',
    options: ['Al-Baqara 2:255', 'Al-Baqara 2:286', 'An-Nour 24:35', 'Al-Ikhlâs 112:1'],
    correctIndex: 0,
    explanation: 'Âyat Al-Kursî se trouve dans Sourate Al-Baqara, verset 255.',
  },
  {
    id: 'cor_6',
    category: 'coran',
    question: 'Quelle sourate du Coran porte le nom d’une femme vertueuse ?',
    options: ['Âsiya', 'Maryam', 'Khadîja', 'Hâjar'],
    correctIndex: 1,
    explanation: 'Sourate Maryam (sourate 19) honore la mère du prophète ‘Îssâ (عليه السلام).',
  },
  {
    id: 'cor_7',
    category: 'coran',
    question: 'Quelle est la plus courte sourate du Noble Coran (3 versets) ?',
    options: ['An-Nasr', 'Al-‘Asr', 'Al-Kawthar', 'Quraysh'],
    correctIndex: 2,
    explanation: 'Sourate Al-Kawthar (108) compte 3 courts versets et 10 mots arabes.',
  },

  // ================= COMPAGNONS & CULTURE =================
  {
    id: 'his_1',
    category: 'histoire',
    question: 'Qui fut le premier muezzin de l’Islam choisi pour la beauté de sa voix ?',
    options: ['Salmân Al-Fârisî', 'Bilâl ibn Rabâh', 'Abou Hourayra', 'Zayd ibn Thâbit'],
    correctIndex: 1,
    explanation: 'Bilâl ibn Rabâh (qu’Allah l’agrée) lança le tout premier appel à la prière à Médine.',
  },
  {
    id: 'his_2',
    category: 'histoire',
    question: 'Quel compagnon a rapporté le plus grand nombre de hadiths du Prophète ﷺ ?',
    options: ['Abou Hourayra', 'Anas ibn Mâlik', '‘Abdullâh ibn ‘Umar', 'Abou Bakr As-Siddîq'],
    correctIndex: 0,
    explanation: 'Abou Hourayra (qu’Allah l’agrée) a transmis plus de 5 300 hadiths.',
  },
  {
    id: 'his_3',
    category: 'histoire',
    question: 'Qui est le seul compagnon mentionné explicitement par son prénom dans le Coran ?',
    options: ['Abou Bakr', '‘Umar', 'Zayd (ibn Hâritha)', '‘Alî'],
    correctIndex: 2,
    explanation: 'Zayd ibn Hâritha est mentionné par son nom dans Sourate Al-Ahzâb (33:37).',
  },
  {
    id: 'his_4',
    category: 'histoire',
    question: 'Quel calife bien guidé était surnommé « Al-Fârûq » (celui qui discerne le vrai du faux) ?',
    options: ['Abou Bakr As-Siddîq', '‘Umar ibn Al-Khattâb', '‘Uthmân ibn ‘Affân', '‘Alî ibn Abî Tâlib'],
    correctIndex: 1,
    explanation: '‘Umar ibn Al-Khattâb reçut ce surnom pour sa fermeté dans la justice et la vérité.',
  },
  {
    id: 'his_5',
    category: 'histoire',
    question: 'Dans quelle ville se trouve Al-Masjid Al-Aqsâ, troisième lieu saint de l’Islam ?',
    options: ['Médine', 'Damas', 'Jérusalem (Al-Quds)', 'Le Caire'],
    correctIndex: 2,
    explanation: 'Al-Masjid Al-Aqsâ fut la première Qibla et la destination du Voyage Nocturne (Al-Isrâ).',
  },
  {
    id: 'his_6',
    category: 'histoire',
    question: 'Quel compagnon était surnommé « Dhou-n-Nourayn » (l’homme aux deux lumières) ?',
    options: ['Khâlid ibn Al-Walîd', '‘Uthmân ibn ‘Affân', 'Sa‘d ibn Abî Waqqâs', 'Talha ibn ‘Ubaydillâh'],
    correctIndex: 1,
    explanation: '‘Uthmân épousa successivement deux filles du Prophète ﷺ : Ruqayya puis Umm Kulthûm.',
  },
];

export const ISLAMIC_QUIZ_PACKS: QuizPackPreset[] = [
  {
    id: 'pack_decouverte',
    title: 'Découverte (3 Q)',
    questionIds: ['pil_1', 'cor_1', 'sir_1'],
  },
  {
    id: 'pack_coran',
    title: 'Noble Coran',
    questionIds: ['cor_1', 'cor_2', 'cor_3', 'cor_4', 'cor_5'],
  },
  {
    id: 'pack_sira',
    title: 'Vie du Prophète ﷺ',
    questionIds: ['sir_1', 'sir_2', 'sir_3', 'sir_4', 'sir_5'],
  },
  {
    id: 'pack_prophetes',
    title: 'Les Prophètes',
    questionIds: ['pro_1', 'pro_2', 'pro_3', 'pro_4', 'pro_6'],
  },
  {
    id: 'pack_piliers',
    title: 'Piliers & Culture',
    questionIds: ['pil_1', 'pil_3', 'pil_4', 'his_1', 'his_5'],
  },
];

export function getQuizCategoryLabel(category: QuizCategoryId): string {
  return QUIZ_CATEGORIES.find((c) => c.id === category)?.label || 'Islam';
}

export function getQuestionsByPackId(packId: string): QuizQuestionItem[] {
  const pack = ISLAMIC_QUIZ_PACKS.find((p) => p.id === packId) || ISLAMIC_QUIZ_PACKS[0];
  const mapped = pack.questionIds
    .map((id) => ISLAMIC_QUIZ_BANK.find((q) => q.id === id))
    .filter((q): q is QuizQuestionItem => Boolean(q));
  return mapped.map((q) => ({
    ...q,
    options: [...q.options] as [string, string, string, string],
  }));
}
