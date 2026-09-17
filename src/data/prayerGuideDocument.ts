export interface PrayerInfoItem {
  number: string;
  name: string;
  arabicName: string;
  rakas: number;
  timeDescription: string;
  key: 'F' | 'D' | 'A' | 'M' | 'I';
  note?: string;
}

export interface AblutionStep {
  stepNumber: number;
  title: string;
  instruction: string;
  details: string;
  importantTip: string;
  iconName: string;
}

export interface AdhanLine {
  arabic: string;
  phonetic: string;
  french: string;
  repeat: number;
  isFajrOnly?: boolean;
}

export interface CompletePrayerStep {
  step: number;
  rakat: 1 | 2;
  phase: 'Rakat 1' | 'Rakat 2' | 'Clôture';
  title: string;
  category: 'Ouverture' | 'Récitation' | 'Inclinaison' | 'Prosternation' | 'Assise' | 'Clôture';
  postureKey:
    | 'niyyah'
    | 'takbir'
    | 'qiyam'
    | 'ruku'
    | 'itidal'
    | 'sujud'
    | 'julus'
    | 'tashahhud'
    | 'taslim';
  arabic: string;
  phonetic: string;
  french: string;
  postureDescription: string;
  fiqhTips: string;
  notesFromGuide?: string;
  verses?: {
    arabic: string;
    phonetic: string;
    french: string;
  }[];
}

export const PRAYER_GUIDE_METADATA = {
  title: 'Apprendre à Prier Comme les Musulmans',
  author: 'Compilé par Hajj Hamza Abdullah Islam',
  bismillah: "Au nom d'Allah, le Tout Miséricordieux, le Miséricordieux.",
  greeting: 'Assalamou Aleikoum',
};

// ==========================================
// 1. LES CINQ PRIÈRES DU JOUR ET LEURS HORAIRES
// ==========================================
export const FIVE_PRAYERS_SCHEDULE: PrayerInfoItem[] = [
  {
    number: '1ère prière',
    name: 'Salát Al-Fajr',
    arabicName: 'صلاة الفجر',
    rakas: 2,
    timeDescription: "On commence depuis l'aube jusqu'au lever du soleil.",
    key: 'F',
    note: 'Prière de l’aube composée de deux génuflexions (Rakas).',
  },
  {
    number: '2ª prière',
    name: 'Salat Al-Zuhr',
    arabicName: 'صلاة الظهر',
    rakas: 4,
    timeDescription: "Cela commence à midi jusqu'avant la prière de l'après-midi.",
    key: 'D',
    note: 'Prière de midi composée de quatre génuflexions (Rakas).',
  },
  {
    number: '3ème prière',
    name: 'Salat Al-Asr',
    arabicName: 'صلاة العصر',
    rakas: 4,
    timeDescription: "Cela commence vers 15h30 jusqu'à peu avant le coucher du soleil.",
    key: 'A',
    note: 'Prière de l’après-midi composée de quatre génuflexions (Rakas).',
  },
  {
    number: '4ª prière',
    name: 'Salat Al-Maghrib',
    arabicName: 'صلاة المغرب',
    rakas: 3,
    timeDescription:
      "Cela commence au coucher du soleil jusqu'à l'entrée de la nuit. Il est important de prier exactement au coucher du soleil, avant qu'il ne fasse sombre.",
    key: 'M',
    note: 'Prière du crépuscule composée de trois génuflexions (Rakas).',
  },
  {
    number: '5ª prière',
    name: 'Salat Al-Isha',
    arabicName: 'صلاة العشاء',
    rakas: 4,
    timeDescription:
      "Il commence depuis le coucher du soleil jusqu'à l'entrée de la nuit. Peut être prié jusqu'à minuit.",
    key: 'I',
    note: 'Prière du soir composée de quatre génuflexions (Rakas).',
  },
];

// ==========================================
// 2. ÉLÉMENTS NÉCESSAIRES AVANT LA PRIÈRE (CONDITIONS)
// ==========================================
export const PRAYER_PREREQUISITES = [
  {
    title: '1. Ablution (Wudu)',
    description: 'Avoir accompli l’ablution selon les étapes rituelles prescrites.',
  },
  {
    title: '2. Pureté intégrale du corps, vêtements et lieu',
    description:
      'Le (la) dévot(e) doit être purifié(e) des relations sexuelles (Ghusl), et la femme purifiée des menstruations et des lochies après accouchement.',
  },
  {
    title: '3. Direction de la Kaaba (Qibla à La Mecque)',
    description:
      'Vérifier la direction sacrée de La Mecque via la boussole, l’orientation des mosquées ou les fidèles.',
  },
  {
    title: '4. Tenue vestimentaire convenable',
    description:
      'La femme doit être complètement couverte sauf le visage et les mains. L’homme doit avoir les parties intimes décemment couvertes.',
  },
  {
    title: '5. Respect strict de l’horaire prescrit',
    description:
      'Il est primordial de commencer à prier uniquement pendant la période où l’heure de la prière a débuté. Sinon, la prière deviendrait invalide.',
  },
];

// ==========================================
// 3. RECOMMANDATIONS & CONDITIONS DE L’ABLUTION
// ==========================================
export const ABLUTION_RECOMMENDATIONS = [
  'Dire avant de commencer : « Bismi Lahi Ar-Rahmani Rahim » (Au nom de Dieu Clément Miséricordieux).',
  'Se laver les mains : trois fois de préférence.',
  'Faire un bain de bouche (rincer la bouche).',
  'Laver les narines (aspirer et expulser l’eau délicatement).',
];

export const ABLUTION_WATER_CONDITIONS = [
  'Que l’eau de l’ablution soit pure et propre (Tahur).',
  'Que ce soit de l’eau courante ou en quantité suffisante.',
  'Que l’eau ne soit pas usurpée ou acquise de manière illégitime.',
  'Toutes les parties du corps où l’ablution est faite doivent être pures et sans obstacle sur la peau (maquillage, peinture, vernis à ongles, colle, etc.).',
];

// ==========================================
// 4. CE QUI INVALIDE L’ABLUTION & LA PRIÈRE
// ==========================================
export const ABLUTION_INVALIDATORS = [
  'Urine',
  'Fèces (matières fécales)',
  'Émission de gaz',
  'Dormir (sommeil profond)',
  'Les choses qui font perdre conscience : folie, épilepsie, évanouissement, ivresse, etc.',
];

export const PRAYER_INVALIDATORS = [
  'Manger ou boire pendant la prière.',
  'Gargouiller ou rire aux éclats.',
  'S’éloigner ou se détourner de la direction de la Kaaba (Qibla).',
  'Pleurer pour des motifs mondains.',
  'Faire tout mouvement qui n’est pas une partie intégrante de la prière (par exemple gesticuler).',
  'Pour l’homme : porter tout bijou ou parure en or, que ce soit durant les prières ou socialement.',
  'Porter des vêtements ou accessoires en cuir provenant d’animaux non abattus selon le rituel islamique.',
  'Toute cause de perte de conscience, ou rupture de l’état d’ablution (urine, selles, gaz, sommeil).',
];

// ==========================================
// 5. ÉTAPES DE L’ABLUTION PAS À PAS
// ==========================================
export const ABLUTION_STEPS_LIST: AblutionStep[] = [
  {
    stepNumber: 1,
    title: 'Laver le visage',
    instruction:
      'Laver le visage de haut en bas avec la main droite. Commencer par le haut du front depuis la racine des cheveux jusqu’au menton.',
    details:
      'Si l’eau n’est pas suffisante pour laver tout le visage, nous pourrons prendre à nouveau de l’eau jusqu’à ce qu’il soit complètement mouillé, sur la largeur entre le pouce et le majeur.',
    importantTip: 'Veiller à descendre de haut en bas sans remonter l’eau à contresens.',
    iconName: 'Smile',
  },
  {
    stepNumber: 2,
    title: 'Avant-bras et main droite',
    instruction:
      'Laver l’avant-bras et la main droite avec la main gauche, de haut en bas (du coude vers les doigts).',
    details: 'Il est important que l’eau mouille tout l’avant-bras et la main, surtout entre les doigts.',
    importantTip: 'Bien faire pénétrer l’eau entre les doigts de la main droite.',
    iconName: 'Hand',
  },
  {
    stepNumber: 3,
    title: 'Avant-bras et main gauche',
    instruction:
      'Laver l’avant-bras et la main gauche avec la main droite, également de haut en bas (du coude vers les doigts).',
    details: 'Vérifiez soigneusement que l’eau a mouillé l’avant-bras, la main et entre les doigts.',
    importantTip: 'Répéter le geste minutieusement pour une couverture complète.',
    iconName: 'Hand',
  },
  {
    stepNumber: 4,
    title: 'Passer la main sur la tête (Mas-h)',
    instruction:
      'Avec la même eau de l’ablution (sans reprendre de nouvelle eau), passer la main droite sur le dessus de la tête.',
    details:
      'Passer la main de l’arrière vers l’avant ou sur la partie antérieure. Il est important que les cheveux soient secs avant le passage.',
    importantTip: 'Les cheveux doivent être secs pour que l’eau de la main purifie la tête.',
    iconName: 'Sparkles',
  },
  {
    stepNumber: 5,
    title: 'Essuyer le pied droit',
    instruction:
      'Avec la même eau de l’ablution, passer la main droite sur le pied droit, en commençant par la pointe des orteils jusqu’au début de la cheville.',
    details: 'Il est important que le pied soit sec avant d’y passer la main humide.',
    importantTip: 'Du bout des orteils jusqu’à l’articulation de la cheville.',
    iconName: 'Footprints',
  },
  {
    stepNumber: 6,
    title: 'Essuyer le pied gauche',
    instruction:
      'Avec la même eau de l’ablution, passer la main gauche sur le pied gauche, en commençant par le bout des orteils jusqu’au début de la cheville.',
    details: 'Il est tout aussi important que le pied gauche soit sec avant le passage de la main.',
    importantTip: 'Termine l’ablution complète. Vous êtes désormais en état de pureté pour la prière.',
    iconName: 'Footprints',
  },
];

// ==========================================
// 6. L’ADHAN (APPEL À LA PRIÈRE) & L’IQAMAT
// ==========================================
export const ADHAN_CALL_LINES: AdhanLine[] = [
  {
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Alláhu Akbar',
    french: 'Dieu est le Plus Grand',
    repeat: 4,
  },
  {
    arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ',
    phonetic: 'Ach-hadu ân lá iláha illa’Láh',
    french: 'Je témoigne qu’il n’y a pas de divinité en dehors de Dieu',
    repeat: 2,
  },
  {
    arabic: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
    phonetic: 'Ach-hadu ânna Mohammadan Rassúlo’Láh',
    french: 'Je témoigne que Mohammad est le Messager de Dieu',
    repeat: 2,
  },
  {
    arabic: 'حَيَّ عَلَى الصَّلَاةِ',
    phonetic: 'Hayya alá Assalát',
    french: 'Allons à la prière',
    repeat: 2,
  },
  {
    arabic: 'حَيَّ عَلَى الْفَلَاحِ',
    phonetic: 'Hayya alá’l Faláh',
    french: 'Allons à la réussite / meilleure des pratiques',
    repeat: 2,
  },
  {
    arabic: 'الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ',
    phonetic: 'Assalátu khayrun mina-n-nawm',
    french: 'La prière est meilleure que le sommeil',
    repeat: 2,
    isFajrOnly: true,
  },
  {
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Alláhu Akbar !',
    french: 'Dieu est le Plus Grand !',
    repeat: 2,
  },
  {
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    phonetic: 'Lá Iláha illal’Láh !',
    french: 'Il n’y a pas de divinité sauf Dieu !',
    repeat: 1,
  },
];

export const IQAMAT_LINES: AdhanLine[] = [
  {
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Alláhu Akbar',
    french: 'Dieu est plus grand',
    repeat: 2,
  },
  {
    arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ',
    phonetic: 'Ach-hadu ân lá iláha illa’Láh',
    french: 'Je témoigne qu’il n’y a pas de divinité en dehors de Dieu',
    repeat: 1,
  },
  {
    arabic: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
    phonetic: 'Ach-hadu ânna Mohammadan Rassúlo’Láh',
    french: 'Je témoigne que Mohamed est le Messager de Dieu',
    repeat: 1,
  },
  {
    arabic: 'حَيَّ عَلَى الصَّلَاةِ',
    phonetic: 'Hayya alá Assalát',
    french: 'Allons à la prière',
    repeat: 1,
  },
  {
    arabic: 'حَيَّ عَلَى الْفَلَاحِ',
    phonetic: 'Hayya alá’l Faláh',
    french: 'Allons au salut / meilleure des pratiques',
    repeat: 1,
  },
  {
    arabic: 'قَدْ قَامَتِ الصَّلَاةُ',
    phonetic: 'Qad qâmati-s-Salât',
    french: 'Voici le moment de la prière arrivé',
    repeat: 2,
  },
  {
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Alláhu Akbar !',
    french: 'Dieu est Plus Grand !',
    repeat: 2,
  },
  {
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    phonetic: 'Lá Iláha illal’Láh !',
    french: 'Il n’y a pas de divinité en dehors de Dieu !',
    repeat: 1,
  },
];

// ==========================================
// 7. LA PRIÈRE COMPLÈTE DU DÉBUT À LA FIN (SALAT AL-FAJR : 2 RAKAS)
// Telle qu’expliquée textuellement dans le guide de Hajj Hamza Abdullah Islam
// ==========================================
export const COMPLETE_PRAYER_CHRONOLOGY: CompletePrayerStep[] = [
  // ----------------------------------------------------
  // RAKAT 1
  // ----------------------------------------------------
  {
    step: 1,
    rakat: 1,
    phase: 'Rakat 1',
    title: "Se lever face à la Kaaba & Formuler l'Intention (Níyeh)",
    category: 'Ouverture',
    postureKey: 'niyyah',
    arabic: 'نَوَيْتُ أَنْ أُصَلِّيَ فَرْضَ الصُّبْحِ وَاجِبًا قُرْبَةً إِلَى اللَّهِ تَعَالَى',
    phonetic: 'Nauaitu ân uçalli fardas’fajr, uájeb qôrbatan ilal’Láh Taála',
    french: 'J’ai l’intention de prier la Prière du Matin, étant une obligation devant Dieu.',
    postureDescription:
      'Tout d’abord, nous nous tenons levés, debout et droits face à la direction sacrée de la Kaaba (Qibla). Formulez l’intention sincère dans votre esprit et votre cœur.',
    fiqhTips: 'L’intention doit être vouée exclusivement à Dieu, avec sincérité et humilité.',
    notesFromGuide: 'Mention du guide : Citer l’intention (Níyeh) face à la Kaaba.',
  },
  {
    step: 2,
    rakat: 1,
    phase: 'Rakat 1',
    title: 'Lever les mains & Takbirat Al-Ihram',
    category: 'Ouverture',
    postureKey: 'takbir',
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Alláhu Akbar !',
    french: 'Dieu est le Plus Grand.',
    postureDescription:
      'Lever les mains à la hauteur des oreilles, les paumes ouvertes orientées vers la Kaaba, et prononcer d’une voix claire : Alláhu Akbar !',
    fiqhTips: 'Ce premier Takbir marque l’entrée solennelle dans la prière.',
    notesFromGuide: 'Lever les mains à la hauteur des oreilles et prononcer : (Alláhu Akbar !).',
  },
  {
    step: 3,
    rakat: 1,
    phase: 'Rakat 1',
    title: 'Abaisser les bras & Réciter la Sourate Al-Fatiha',
    category: 'Récitation',
    postureKey: 'qiyam',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ۝ آمِين',
    phonetic:
      'Bismillahi-r-Rahmani-r-Rahim • Al-Hamdu Lillahi Rabbil-Alamin • Ar-Rahmani-r-Rahim • Maliki Yawmid-Din • Iyyaka na’budu wa Iyyaka nasta’in • Ihdina-s-Siratal-Mustaqim • Siratal-ladhina an’amta alayhim, ghayril-maghdubi alayhim wa lad-dallin • Amin !',
    french:
      'Au nom de Dieu, le Clément, le Miséricordieux. Louange à Allah, le Seigneur des mondes. Le Tout Miséricordieux, le Miséricordant. Le Souverain du Jour du Jugement. C’est seulement à Toi que nous rendons hommage et c’est seulement à Toi que nous implorons de l’aide. Guide-nous sur le droit chemin, sur le chemin de ceux que Tu as comblés de grâces ; non sur celui de ceux qui ont encouru Ta colère ni sur celui des égarés. Amin !',
    postureDescription:
      'Abaisser les mains et se tenir debout avec recueillement. Regard posé vers le sol au lieu de prosternation.',
    fiqhTips: 'La récitation de la Fatiha (Livre de l’Ouverture) est indispensable dans chaque Rakat.',
    notesFromGuide: 'Surate Al Fatiha (Livre de l’Ouverture) récitée en entier.',
    verses: [
      {
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        phonetic: 'Bismillahi-r-Rahmani-r-Rahim',
        french: '1. Au nom d’Allah, le Miséricordieux, le Miséricordant',
      },
      {
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        phonetic: 'Alrramidu Liler Rirobilá alamin',
        french: '2. Louange à Allah, le Seigneur des mondes.',
      },
      {
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
        phonetic: 'Ararmeni Rarrim',
        french: '3. Ô Miséricordieux, Ô Miséricordiateur.',
      },
      {
        arabic: 'مَالِكِ يَوْمِ الدِّينِ',
        phonetic: 'Méliqui ia omidin',
        french: '4. Le Souverain du Jour du Jugement',
      },
      {
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        phonetic: 'Iaka nábudu ua Iaka nastain',
        french: '5. C’est seulement à Toi que nous rendons hommage et c’est seulement à Toi que nous implorons de l’aide',
      },
      {
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        phonetic: 'Irdina Siratal Mustakim',
        french: '6. Guide-nous sur le droit chemin,',
      },
      {
        arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        phonetic: 'Siratal-ladhina anamta alayhim ghayril maghdubi alayhim waladdallin',
        french: '7. Sur le chemin de ceux que Tu as comblés de grâces ; non sur celui de ceux qui ont encouru Ta colère ni sur celui des égarés.',
      },
    ],
  },
  {
    step: 4,
    rakat: 1,
    phase: 'Rakat 1',
    title: "Réciter la Sourate de l'Unicité (Al-Ikhlas)",
    category: 'Récitation',
    postureKey: 'qiyam',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    phonetic:
      'Qulrualarru Arrad • Alarru samad • Lami ualid ua Lami iulad • Ualami ia qul larru kufuan arrad',
    french:
      'Au nom d’Allah, le Miséricordieux, le Miséricordant. Dis : Il est Allah, l’Unique ! Allah est le Sollicité (Le Seul à être imploré). N’a pas engendré et n’a pas été engendré. Et il n’y a personne qui Lui soit semblable.',
    postureDescription:
      'Toujours debout, enchaînez avec la récitation d’une seconde sourate. Le guide prescrit la sublime Sourate Al-Ikhlas (L’Unicité).',
    fiqhTips: 'Cette sourate équivaut au tiers du Coran par sa déclaration pure du Tawhid (Unicité divine).',
    notesFromGuide: 'Ensuite, prier une autre sourate coranique ou réciter la sourate de l’Unicité.',
    verses: [
      {
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        phonetic: 'Bismillahi-r-Rahmani-r-Rahim',
        french: 'Au nom d’Allah, le Miséricordieux, le Miséricordant',
      },
      {
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        phonetic: 'Qulrualarru Arrad',
        french: '1. Dis : Il est Allah, l’Unique !',
      },
      {
        arabic: 'اللَّهُ الصَّمَدُ',
        phonetic: 'Alarru samad',
        french: '2. Allah est le Sollicité',
      },
      {
        arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
        phonetic: 'Lami ualid ua Lami iulad',
        french: '3. N’a pas engendré et n’a pas été engendré',
      },
      {
        arabic: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
        phonetic: 'Ualami ia qul larru kufuan arrad',
        french: '4. Et il n’y a personne qui lui soit semblable.',
      },
    ],
  },
  {
    step: 5,
    rakat: 1,
    phase: 'Rakat 1',
    title: "L'Inclinaison (Ar-Ruku')",
    category: 'Inclinaison',
    postureKey: 'ruku',
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ وَبِحَمْدِهِ',
    phonetic: 'Subhana Rabbi’l Azím ua be-ramider (3 fois)',
    french: 'Glorifié est mon Magnifique Seigneur et en Sa louange !',
    postureDescription:
      'Incliner le corps en plaçant les mains fermement sur les genoux. Le dos doit être bien droit et horizontal, la tête alignée.',
    fiqhTips: 'Répétez la formule trois (3) fois comme prescrit dans le guide.',
    notesFromGuide:
      'Ensuite, incliner le corps en plaçant les mains fermement sur les genoux. Répéter 3 fois : (Subhana Rabbi’l Azím ua be-ramider).',
  },
  {
    step: 6,
    rakat: 1,
    phase: 'Rakat 1',
    title: "Le Redressement du corps (Al-I'tidal)",
    category: 'Inclinaison',
    postureKey: 'itidal',
    arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ',
    phonetic: 'Semialarru liman ramidar',
    french: 'Dieu entend celui qui Le glorifie !',
    postureDescription:
      'Lever le corps pour revenir complètement debout et droit. Marquez un instant d’immobilité et de sérénité.',
    fiqhTips: 'Attendre que chaque vertèbre reprenne sa place avant de descendre en prosternation.',
    notesFromGuide: 'Lever le corps et prier : (Semialarru liman ramidar) (Dieu entend celui qui Le glorifie!).',
  },
  {
    step: 7,
    rakat: 1,
    phase: 'Rakat 1',
    title: 'La Première Prosternation (As-Sujud 1)',
    category: 'Prosternation',
    postureKey: 'sujud',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ',
    phonetic: 'Subhana Rabbi Alá ua be-ramider (3 fois)',
    french: 'Glorifié soit mon Suprême Seigneur et en Votre louange !',
    postureDescription:
      'Laisser toucher fermement le sol : le front, la paume des mains, les genoux et les pointes des orteils des pieds (7 points d’appui).',
    fiqhTips: 'Prononcer la formule de glorification 3 (trois) fois.',
    notesFromGuide:
      'Observation du guide : La tête peut être placée sur de la terre bénie ou un tapis propre. Répéter 3 fois : (Subhana Rabbi Alá ua be-ramider).',
  },
  {
    step: 8,
    rakat: 1,
    phase: 'Rakat 1',
    title: 'Assise entre les deux prosternations (Julus)',
    category: 'Assise',
    postureKey: 'julus',
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Alláhu Akbar !',
    french: 'Dieu est le Plus Grand.',
    postureDescription:
      'Relevez la tête et asseyez-vous droit sur les jambes, les mains posées à plat sur les cuisses.',
    fiqhTips: 'Marquer une courte pause respiratoire assis avant la seconde prosternation.',
    notesFromGuide: 'Ensuite, s’asseoir droit sur les jambes et dire : (Allahu Akbar!).',
  },
  {
    step: 9,
    rakat: 1,
    phase: 'Rakat 1',
    title: 'La Deuxième Prosternation (As-Sujud 2)',
    category: 'Prosternation',
    postureKey: 'sujud',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ',
    phonetic: 'Subhana Rabbi Alá ua be-ramider (3 fois)',
    french: 'Glorifié soit mon Suprême Seigneur et en Son louange !',
    postureDescription:
      'Encore mettre le front au sol exactement comme la première fois et répéter la glorification 3 fois.',
    fiqhTips: 'Garder les 7 points de contact bien stables au sol.',
    notesFromGuide: 'Encore mettre le front et répéter 3 fois : (Subhana Rabbi Alá ua be-ramider).',
  },
  {
    step: 10,
    rakat: 1,
    phase: 'Rakat 1',
    title: 'S’asseoir & Clôture de la 1ère Rakat (Génuflexion)',
    category: 'Assise',
    postureKey: 'julus',
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Allahu Akbar !',
    french: 'Dieu est le Plus Grand !',
    postureDescription:
      'S’asseoir à nouveau un instant et répéter : Allahu Akbar ! Avec cela, on termine avec succès la 1ère génuflexion (Rakat 1).',
    fiqhTips: 'Préparez-vous à vous relever pour entamer la deuxième rakat.',
    notesFromGuide: 'S’asseoir à nouveau et répéter : (Allahu Akbar !). Avec cela, on termine la 1ère génuflexion (Raka).',
  },

  // ----------------------------------------------------
  // RAKAT 2
  // ----------------------------------------------------
  {
    step: 11,
    rakat: 2,
    phase: 'Rakat 2',
    title: 'Se relever pour la 2ème Rakat',
    category: 'Ouverture',
    postureKey: 'takbir',
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Allahu Akbar !',
    french: 'Dieu est le Plus Grand !',
    postureDescription:
      'Se relever pour la 2ème génuflexion (Raka), debout, et porter les mains à hauteur des oreilles en prononçant le Takbir.',
    fiqhTips: 'Se relever avec force et équilibre sans précipitation.',
    notesFromGuide: 'Ensuite, faire la 2ème génuflexion (Raka), en se levant et, les mains à hauteur des oreilles, (Dieu est grand).',
  },
  {
    step: 12,
    rakat: 2,
    phase: 'Rakat 2',
    title: 'Réciter la Sourate Al-Fatiha',
    category: 'Récitation',
    postureKey: 'qiyam',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ۝ آمِين',
    phonetic:
      'Bismillahi-r-Rahmani-r-Rahim • Al-Hamdu Lillahi Rabbil-Alamin • Ar-Rahmani-r-Rahim • Maliki Yawmid-Din • Iyyaka na’budu wa Iyyaka nasta’in • Ihdina-s-Siratal-Mustaqim • Siratal-ladhina an’amta alayhim, ghayril-maghdubi alayhim wa lad-dallin • Amin !',
    french:
      'Au nom d’Allah, le Miséricordieux, le Miséricordant. Louange à Allah, Seigneur des mondes... (Sourate d’ouverture complète).',
    postureDescription:
      'Abaisser les bras et réciter la Sourate Al-Fatiha avec dévotion et paix intérieure.',
    fiqhTips: 'La Fatiha est obligatoire dans chaque Rakat.',
    notesFromGuide: 'Abaisser les bras et réciter Al-Fâtiha puis une autre Sourate.',
  },
  {
    step: 13,
    rakat: 2,
    phase: 'Rakat 2',
    title: "Réciter la Sourate Al-Kawthar (L'Abondance)",
    category: 'Récitation',
    postureKey: 'qiyam',
    arabic:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ۝ فَصَلِّ لِرَبِّكَ وَانْحَرْ ۝ إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',
    phonetic:
      'Inna atainakal Kaussar • Fassóli liróbica uan har • Inna chianiaka rual abtar',
    french:
      'Au Nom d’Allah, Le Miséricordieux, Le Miséricordant. Certes, Nous t’avons accordé Al-Kaussar (l’Abondance suprême). Alors, prie ton Seigneur et immole les offrandes. En effet, celui qui te déteste sera-t-il sans postérité.',
    postureDescription:
      'Après la Fatiha, réciter la Sourate Al-Kawthar telle qu’indiquée dans le guide pour la seconde Rakat.',
    fiqhTips: 'Magnifique sourate apportant réconfort et assurance de la grâce divine.',
    notesFromGuide: 'Par exemple : Sourate Inna atainakal Kaussar avec sa traduction complète.',
    verses: [
      {
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        phonetic: 'Bismillahi-r-Rahmani-r-Rahim',
        french: 'Au nom de Dieu, le Tout Miséricordieux, le Très Miséricordieux.',
      },
      {
        arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
        phonetic: 'Inna atainakal Kaussar',
        french: '1. Certes, nous te donnons Al Kaussar',
      },
      {
        arabic: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ',
        phonetic: 'Fassóli liróbica uan har',
        french: '2. Alors, prie ton Seigneur et immole les offrandes',
      },
      {
        arabic: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',
        phonetic: 'Inna chianiaka rual abtar',
        french: '3. En effet, celui qui te déteste sera-t-il sans postérité.',
      },
    ],
  },
  {
    step: 14,
    rakat: 2,
    phase: 'Rakat 2',
    title: "L'Inclinaison de la 2ème Rakat (Ar-Ruku')",
    category: 'Inclinaison',
    postureKey: 'ruku',
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ وَبِحَمْدِهِ',
    phonetic: 'Subhâna Rabbi’l Azîm ua be-hamdeh ! (3 fois)',
    french:
      'Glorifié soit mon Magnifique Seigneur et en Son louange ! (Ou trois fois : Subhánal’Láh ! Glorifié soit Dieu !)',
    postureDescription:
      'Inclinez le corps en plaçant les mains sur les genoux, dos droit, et glorifiez le Seigneur 3 fois.',
    fiqhTips: 'Tenir l’inclinaison avec respect et calme.',
    notesFromGuide: 'Subhâna Rabbi’l Azîm ua be-hamdeh ! Ou trois fois : (Subhánal’Láh !).',
  },
  {
    step: 15,
    rakat: 2,
    phase: 'Rakat 2',
    title: "Le Redressement du corps (Al-I'tidal)",
    category: 'Inclinaison',
    postureKey: 'itidal',
    arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ',
    phonetic: 'Sameal’Láh leman hamedah !',
    french: 'Dieu entend celui qui Le glorifie !',
    postureDescription:
      'Soulever le corps pour vous redresser debout complètement avant de descendre en prosternation.',
    fiqhTips: 'Redressement parfait et regard recueilli.',
    notesFromGuide: 'Ensuite, soulever le corps et dire : (Sameal’Láh leman hamedah!).',
  },
  {
    step: 16,
    rakat: 2,
    phase: 'Rakat 2',
    title: 'La Première Prosternation de la 2ème Rakat',
    category: 'Prosternation',
    postureKey: 'sujud',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ',
    phonetic: 'Subhána Rabbi’l Aalá ua be-hamdeh (3 fois)',
    french: 'Glorifié soit mon Suprême Seigneur et en Son louange.',
    postureDescription:
      'Faire la 1ère prosternation en laissant le front fermement toucher le sol avec les 7 points de contact.',
    fiqhTips: 'Répétez la formule avec humilité profonde.',
    notesFromGuide: 'Faire la 1ère prosternation, en laissant le front toucher le sol et dire : (Subhána Rabbi’l Aalá ua be-hamdeh).',
  },
  {
    step: 17,
    rakat: 2,
    phase: 'Rakat 2',
    title: 'Assise intermédiaire (Julus)',
    category: 'Assise',
    postureKey: 'julus',
    arabic: 'اللَّهُ أَكْبَرُ',
    phonetic: 'Allâhu Akbar !',
    french: 'Dieu est le Sublime !',
    postureDescription:
      'S’asseoir sur les jambes et dire : Allâhu Akbar !',
    fiqhTips: 'Prendre un instant de pause avant la seconde prosternation.',
    notesFromGuide: 'S’asseoir sur les jambes et dire : (Allâhu Akbar !) (Dieu est le Sublime !).',
  },
  {
    step: 18,
    rakat: 2,
    phase: 'Rakat 2',
    title: 'La Deuxième Prosternation (Sujud 2)',
    category: 'Prosternation',
    postureKey: 'sujud',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ',
    phonetic: 'Subhána Rabbi’l Aalá ua be-hamdeh (3 fois)',
    french: 'Glorifié soit mon Suprême Seigneur et en Son louange.',
    postureDescription:
      'Faire la 2ème prosternation (Sujúd) en parfait accord avec la première.',
    fiqhTips: 'Dernière prosternation de la prière du Fajr.',
    notesFromGuide: 'Faire la 2ème prosternation (Sujúd), en accord avec la première.',
  },
  {
    step: 19,
    rakat: 2,
    phase: 'Clôture',
    title: 'Assise finale & Témoignage de foi (At-Tashahhud)',
    category: 'Assise',
    postureKey: 'tashahhud',
    arabic:
      'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    phonetic:
      'Ach-hadu an lá iláha illa’Láh, wahdahu lá charíka lah • Wa ach-hadu ânna Mohammadan abduhu ua Rassúluh',
    french:
      'J’atteste qu’il n’y a pas d’autre dieu qu’Allah, l’Unique, sans associé. Et j’atteste que Mohammad est Son serviteur et Son Apôtre (Messager) !',
    postureDescription:
      'En terminant les prosternations, restez assis sur vos jambes pour la formulation du Témoignage sacré.',
    fiqhTips: 'L’index de la main droite est dressé en direction de la Qibla pour affirmer l’Unicité.',
    notesFromGuide: 'En terminant, commencez à faire la prière : J’atteste qu’il n’y a pas d’autre dieu qu’Allah, l’Unique...',
  },
  {
    step: 20,
    rakat: 2,
    phase: 'Clôture',
    title: 'Bénédiction sur le Prophète (Salawat)',
    category: 'Assise',
    postureKey: 'tashahhud',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    phonetic: 'Alláhumma sólli alá Mohammadin ua áli Mohammad',
    french: 'Ô Allah, prie pour Mohammad et sa sainte famille (la lignée de Mohammad) !',
    postureDescription:
      'Toujours assis en posture de recueillement, envoyez les salutations et prières de bénédiction.',
    fiqhTips: 'Prière prescrite sur le Prophète (saw) et sa famille bénie.',
    notesFromGuide: 'Ô Allah, prie pour Mohammad et sa famille ! (Bénis Mohammad et la lignée de Mohammad !).',
  },
  {
    step: 21,
    rakat: 2,
    phase: 'Clôture',
    title: 'La Supplique Finale (Du’a coranique)',
    category: 'Assise',
    postureKey: 'tashahhud',
    arabic:
      'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    phonetic:
      'Rabbanâ âtinâ fid-dunyâ hasanatan, wa fil-âkhirati hasanatan, wa qinâ adhaban-nâr',
    french:
      'Notre Seigneur, accorde-nous dans ce monde la grâce (de bonnes choses), et dans l’Éternité la grâce, et préserve-nous du tourment du feu !',
    postureDescription:
      'Prononcez cette invocation universelle demandant le bien dans cette vie et dans l’au-delà.',
    fiqhTips: 'L’une des invocations les plus aimées et récitées par le Prophète.',
    notesFromGuide: 'Supplique : (Notre Seigneur, accorde-nous dans ce monde de bonnes choses...).',
  },
  {
    step: 22,
    rakat: 2,
    phase: 'Clôture',
    title: 'La Salutation Finale de Paix (At-Taslim)',
    category: 'Clôture',
    postureKey: 'taslim',
    arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ',
    phonetic: 'As-Salâmu Alaykum wa Rahmatullâhi wa Barakâtuh',
    french: 'Que la Paix, la Miséricorde de Dieu et Ses Bénédictions soient sur vous.',
    postureDescription:
      'Tournez le visage vers la droite pour prononcer le salut de paix, puis vers la gauche. La prière est désormais pleinement accomplie avec succès.',
    fiqhTips: 'Le Taslim clôture solennellement la prière en diffusant la paix sur la création.',
    notesFromGuide: 'Salutation finale clôturant la prière en paix.',
  },
];

// ==========================================
// 8. GLORIFICATION POST-PRIÈRE DE FATIMA AZZAHRA
// ==========================================
export const FATIMA_TASBIH_DATA = {
  title: 'La Glorification de Fatima Azzahrá (Aleiha Salam)',
  subtitle:
    'Enseignée par son propre père, le Prophète Mohammad (saw), recommandée après chaque prière obligatoire.',
  items: [
    {
      count: 33,
      arabic: 'سُبْحَانَ اللَّهِ',
      phonetic: 'Subhana Alláh',
      french: 'Dieu glorifié',
      description: 'Glorification de la perfection absolue de Dieu (33 fois).',
    },
    {
      count: 33,
      arabic: 'الْحَمْدُ لِلَّهِ',
      phonetic: 'Al-Hamdu Lilláh',
      french: 'Loué soit Dieu',
      description: 'Louange et gratitude infinie envers Dieu (33 fois).',
    },
    {
      count: 34,
      arabic: 'اللَّهُ أَكْبَرُ',
      phonetic: 'Alláhu Akbar',
      french: 'Dieu est le Plus Grand',
      description: 'Exaltation de la majesté divine suprême (34 fois).',
    },
  ],
  total: 100,
};

// ==========================================
// 9. LES PRIÈRES SURÉROGATOIRES (SUNAN RAWÂTIB & WITR)
// ==========================================
export interface RawatibPrayer {
  name: string;
  arabicName: string;
  associatedFard: string;
  timing: 'Avant' | 'Après';
  rakats: number;
  virtueHadith: string;
  source: string;
  isDailyTwelve: boolean;
}

export const SUPEREROGATORY_PRAYERS_DATA = {
  title: 'Les Prières Surérogatoires selon la Sunnah (As-Sunan ar-Rawâtib)',
  hadithPromise: {
    arabic: 'مَا مِنْ عَبْدٍ مُسْلِمٍ يُصَلِّي لِلَّهِ كُلَّ يَوْمٍ ثِنْتَيْ عَشْرَةَ رَكْعَةً تَطَوُّعًا غَيْرَ فَرِيضَةٍ، إِلَّا بَنَى اللَّهُ لَهُ بَيْتًا فِي الْجَنَّةِ',
    phonetic: 'Mā min ‘abdin muslimin yuṣallī lillāhi kulla yawmin thintay ‘ashrata rak‘atan taṭawwu‘an ghayra farīḍatin, illā banā Allāhu lahu baytan fīl-jannah',
    translation: '« Tout serviteur musulman qui prie pour Allah chaque jour douze rak‘ats surérogatoires, en dehors des prières obligatoires, Allah lui construira une demeure au Paradis. »',
    source: 'Rapporté par Muslim (n° 728) et At-Tirmidhi (n° 415)',
  },
  forbiddenTimes: [
    {
      period: 'Après la prière du ‘Asr jusqu’au coucher du soleil',
      reason: 'Période où le soleil se couche entre les cornes d’un démon (déconseillée pour les prières volontaires libres sans cause).',
    },
    {
      period: 'Après la prière du Fajr jusqu’au lever complet du soleil (environ 15 min après le Shurûq)',
      reason: 'Temps réservé aux invocations matinales jusqu’à l’heure de la prière de Duha.',
    },
    {
      period: 'Au zénith précis (quelques minutes avant le début de Dhuhr)',
      reason: 'Moment où l’Enfer est attisé jusqu’à ce que le soleil décline.',
    },
  ],
  rawatibList: [
    {
      name: 'Sunnah du Fajr',
      arabicName: 'سُنَّةُ الْفَجْرِ',
      associatedFard: 'Salat Al-Fajr',
      timing: 'Avant',
      rakats: 2,
      virtueHadith: '« Les deux unités de prière avant l’aube (Fajr) sont meilleures que ce bas-monde et tout ce qu’il contient. » (Hadith Muslim)',
      source: 'Sahih Muslim n° 725',
      isDailyTwelve: true,
    },
    {
      name: 'Sunnah avant Dhuhr',
      arabicName: 'سُنَّةُ قَبْلَ الظُّهْرِ',
      associatedFard: 'Salat Az-Zuhr',
      timing: 'Avant',
      rakats: 4,
      virtueHadith: 'Accomplies deux par deux avant la prière obligatoire de midi.',
      source: 'At-Tirmidhi & Abu Dawud',
      isDailyTwelve: true,
    },
    {
      name: 'Sunnah après Dhuhr',
      arabicName: 'سُنَّةُ بَعْدَ الظُّهْرِ',
      associatedFard: 'Salat Az-Zuhr',
      timing: 'Après',
      rakats: 2,
      virtueHadith: 'Deux rak‘ats après l’office de Dhuhr pour parfaire la rétribution.',
      source: 'Sahih Al-Bukhari & Muslim',
      isDailyTwelve: true,
    },
    {
      name: 'Recommandée avant ‘Asr',
      arabicName: 'سُنَّةُ قَبْلَ الْعَصْرِ',
      associatedFard: 'Salat Al-‘Asr',
      timing: 'Avant',
      rakats: 4,
      virtueHadith: '« Qu’Allah fasse miséricorde à un homme qui accomplit quatre rak‘ats avant le ‘Asr. »',
      source: 'Sunan At-Tirmidhi n° 430 (Jugé bon par Al-Albani)',
      isDailyTwelve: false,
    },
    {
      name: 'Sunnah après Maghrib',
      arabicName: 'سُنَّةُ بَعْدَ الْمَغْرِبِ',
      associatedFard: 'Salat Al-Maghrib',
      timing: 'Après',
      rakats: 2,
      virtueHadith: 'Deux rak‘ats accomplies de préférence à la maison juste après le Maghrib.',
      source: 'Sahih Al-Bukhari & Muslim',
      isDailyTwelve: true,
    },
    {
      name: 'Sunnah après ‘Isha',
      arabicName: 'سُنَّةُ بَعْدَ الْعِشَاءِ',
      associatedFard: 'Salat Al-‘Isha',
      timing: 'Après',
      rakats: 2,
      virtueHadith: 'Deux rak‘ats régulières concluant les douze unités promises au Paradis.',
      source: 'Sahih Al-Bukhari & Muslim',
      isDailyTwelve: true,
    },
  ] as RawatibPrayer[],
  otherRecommendedPrayers: [
    {
      name: 'Salât Al-Witr (La Prière Impaire)',
      arabicName: 'صَلَاةُ الْوِتْرِ',
      rakats: '1 ou 3 rakats',
      description: 'Très fortement recommandée (Sunnah Mu’akkadah). Le Prophète (saw) a dit : « Allah est Unique et Il aime le Witr ». Elle se prie entre la prière de ‘Isha et l’aube, et clôture les prières nocturnes.',
    },
    {
      name: 'Salât Ad-Duhâ (Prière de Matinée)',
      arabicName: 'صَلَاةُ الضُّحَى',
      rakats: '2 à 8 rakats',
      description: 'S’accomplit environ 15 à 20 minutes après le lever du soleil jusqu’à 15 minutes avant le Dhuhr. Vaut comme aumône pour chacune des 360 articulations du corps.',
    },
    {
      name: 'Tahiyyat Al-Masjid (Salutation de la Mosquée)',
      arabicName: 'تَحِيَّةُ الْمَسْجِدِ',
      rakats: '2 rakats',
      description: '« Lorsque l’un de vous entre dans la mosquée, qu’il ne s’assoie pas avant d’avoir accompli deux rak‘ats. » (Rapporté par Al-Bukhari).',
    },
  ],
};

// ==========================================
// 10. LE TAYAMMUM (ABLUTIONS SÈCHES)
// ==========================================
export interface TayammumStep {
  step: number;
  title: string;
  arabic?: string;
  description: string;
  details: string;
}

export const TAYAMMUM_DATA = {
  title: 'Le Tayammum (L’Ablution Sèche de Remplacement)',
  definition:
    'L’Islam est une religion de facilité. Lorsque l’eau est indisponible, insuffisante ou néfaste pour la santé, Dieu autorise le croyant à purifier rituellement son corps grâce à la terre pure.',
  quranVerse: {
    arabic: 'فَتَيَمَّمُوا صَعِيدًا طَيِّبًا فَامْسَحُوا بِوُجُوهِكُمْ وَأَيْدِيكُمْ مِنْهُ',
    phonetic: 'Fa-tayammamū ṣa‘īdan ṭayyiban fam-saḥū bi-wujūhikum wa aydīkum minhu',
    translation: '« ...Ayez alors recours à une terre pure, passez-en sur vos visages et sur vos mains... » (Sourate Al-Ma’idah, verset 6)',
  },
  causesOfRecourse: [
    {
      title: 'Absence ou Manque d’Eau',
      description: 'Impossible de trouver de l’eau après avoir cherché dans les environs immédiats.',
    },
    {
      title: 'Maladie ou Danger pour la Santé',
      description: 'Si l’utilisation de l’eau risque d’aggraver une blessure, d’augmenter la maladie ou de retarder la guérison.',
    },
    {
      title: 'Froid Extrême et Glacial',
      description: 'Température glaciale sans possibilité matérielle de tiédir l’eau et crainte légitime de tomber gravement malade.',
    },
    {
      title: 'Préservation de la Vie (Soif)',
      description: 'Si la faible quantité d’eau disponible est strictement requise pour étancher sa soif ou celle de ses compagnons ou animaux.',
    },
    {
      title: 'Urgence du Temps Imparti',
      description: 'Si chercher de l’eau ou faire le Wudu ordinaire ferait sortir l’heure légale de la prière en cours.',
    },
  ],
  authorizedMaterials: [
    'Terre naturelle propre et pure',
    'Sable sec non souillé',
    'Caillou ou pierre naturelle brute (non peinte, non vernie)',
    'Marbre brut ou roche minérale',
    'Poussière propre et naturelle',
  ],
  steps: [
    {
      step: 1,
      title: 'L’Intention Pure (An-Niyyah)',
      arabic: 'النِّيَّةُ',
      description: 'Former fermement l’intention dans le cœur de faire le Tayammum pour se purifier et accomplir la prière pour Allah.',
      details: 'L’intention est spirituelle et intérieure, elle ne se déclame pas à haute voix.',
    },
    {
      step: 2,
      title: 'Frapper la Terre Pure',
      arabic: 'الضَّرْبُ عَلَى الصَّعِيدِ',
      description: 'Poser ou frapper simultanément les deux paumes des mains à plat sur la terre pure ou la pierre, puis secouer ou souffler légèrement dessus.',
      details: 'Souffler pour enlever l’excédent de poussière afin de ne pas se salir.',
    },
    {
      step: 3,
      title: 'Essuyer l’Ensemble du Visage',
      arabic: 'مَسْحُ الْوَجْهِ',
      description: 'Passer les paumes des deux mains sur la totalité du visage, depuis le haut du front jusqu’au menton, et d’une tempe à l’autre.',
      details: 'Un passage complet et doux, identique à la zone lavée lors du Wudu.',
    },
    {
      step: 4,
      title: 'Essuyer les Deux Mains',
      arabic: 'مَسْحُ الْيَدَيْنِ',
      description: 'Essuyer le dos de la main droite avec la paume de la main gauche jusqu’aux poignets, puis essuyer le dos de la main gauche avec la paume droite.',
      details: 'Une fois cette étape terminée, le Tayammum est valide et vous pouvez prier immédiatement.',
    },
  ] as TayammumStep[],
};

// ==========================================
// 11. INVOCATION AUTHENTIQUE DES ABLUTIONS (DU'A DE 'UMAR)
// ==========================================
export const WUDU_AUTHENTIC_DUA = {
  title: 'L’Invocation Sacrée d’Après les Ablutions',
  narrator: 'Rapporté par ‘Umar ibn al-Khaṭṭāb (qu’Allah l’agrée), le Prophète (saw) a dit :',
  hadithText: '« Il n’y a aucun d’entre vous qui accomplit les ablutions parfaitement, puis prononce cette parole, sans que les huit portes du Paradis ne s’ouvrent à lui : il y pénètre par celle qu’il désire ! »',
  reference: 'Sahih Muslim (n° 234) et Jami‘ At-Tirmidhi (n° 55)',
  arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ. اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ، وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
  phonetic: 'Ash-hadu allā ilāha illallāhu waḥdahu lā sharīka lahu, wa ash-hadu anna Muḥammadan ‘abduhu wa rasūluh. Allāhumma-j‘alnī minat-tawwābīna, waj‘alnī minal-mutaṭahhirīn.',
  french: 'J’atteste qu’il n’y a point de divinité digne d’adoration en dehors d’Allah, Seul et sans associé, et j’atteste que Mohammad est Son serviteur et Son Messager. Ô Allah, compte-moi parmi les repentants et compte-moi parmi ceux qui se purifient !',
};

// ==========================================
// 12. LES PILIERS (ARKÂN) VS ACTES OBLIGATOIRES (WÂJIBÂT)
// ==========================================
export const PILLARS_VS_OBLIGATIONS_DATA = {
  title: 'Piliers (Arkân) vs Actes Obligatoires (Wâjibât) vs Sunan',
  summary: 'Une distinction capitale tirée des manuels de Fiqh de la prière : certains actes sont indispensables au point d’annuler la prière même en cas d’oubli involontaire, tandis que d’autres sont réparables par la prosternation de l’oubli.',
  pillars: {
    name: 'Les 5 Piliers Fondamentaux (Arkân)',
    rule: 'Si un pilier est omis, la prière est NULLE et NON AVENUE, même par distraction ou oubli ! Il doit être rattrapé immédiatement si l’on s’en souvient dans la rakat, sinon la prière doit être recommencée.',
    items: [
      {
        name: 'L’Intention (An-Niyyah)',
        description: 'La résolution intérieure sincère de vouer la prière à Allah seul.',
      },
      {
        name: 'Le Takbîr d’Entrée (Takbîrat Al-Iḥrâm)',
        description: 'Prononcer "Allahu Akbar" debout au commencement précis de la prière.',
      },
      {
        name: 'La Station Debout (Al-Qiyâm)',
        description: 'Se tenir droit pendant la récitation pour celui qui en a la capacité physique.',
      },
      {
        name: 'L’Inclinaison (Ar-Rukû‘)',
        description: 'S’incliner le dos horizontal avec appui des mains sur les genoux.',
      },
      {
        name: 'Les Deux Prosternations (As-Sujûd)',
        description: 'Deux prosternations par rakat sur les sept membres (front/nez, paumes, genoux, pointes des pieds).',
      },
    ],
  },
  obligations: {
    name: 'Les Actes Obligatoires Réparables (Wâjibât)',
    rule: 'Obligatoires lors de la prière. Si l’un d’eux est oublié involontairement par distraction, la prière demeure VALIDE et est réparée par la Prosternation de l’Oubli (Sujûd as-Sahw).',
    items: [
      {
        name: 'La Récitation de la Fatiha (Al-Qirâ’ah)',
        description: 'Réciter les 7 versets de la Mère du Livre dans chaque rakat.',
      },
      {
        name: 'Les Évocations de l’Inclinaison',
        description: 'Dire "Subhāna Rabbiyal-‘Aẓīm" au moins une fois lors du Rukû‘.',
      },
      {
        name: 'Les Évocations de la Prosternation',
        description: 'Dire "Subhāna Rabbiyal-A‘lā" au moins une fois lors du Sujûd.',
      },
      {
        name: 'L’Assise et Évocation entre les deux prosternations',
        description: 'S’asseoir droit et dire "Rabbighfir lî" (Seigneur pardonne-moi).',
      },
      {
        name: 'Le Premier Tachahhud assis',
        description: 'L’assise et récitation du Tachahhud intermédiaire (rakat 2 des prières à 3 ou 4 unités).',
      },
      {
        name: 'Le Dernier Tachahhud et Salawat',
        description: 'La formulation finale et les bénédictions sur le Prophète.',
      },
      {
        name: 'La Salutation de Clôture (At-Taslîm)',
        description: 'Prononcer le Salam pour sortir de l’état de sacralisation.',
      },
    ],
  },
  sunan: {
    name: 'Les Actes Recommandés (Sunan & Mustahabbât)',
    rule: 'Actes méritoires qui augmentent la récompense divine. Leur omission n’annule pas la prière et n’exige pas de prosternation de l’oubli.',
    items: [
      'L’Adhan et l’Iqamat avant la prière',
      'Lever les mains lors des Takbirs',
      'Le Qunout (invocation les mains levées dans la 2e rakat)',
      'Poser une Sutrah (obstacle protecteur) devant soi',
      'Réciter à voix haute (Fajr, 2 premières de Maghrib et ‘Isha) et à voix basse (Dhuhr, ‘Asr)',
      'Le regard fixé vers le lieu de prosternation',
    ],
  },
};

// ==========================================
// 13. GUIDE DES DOUTES DANS LA PRIÈRE (ACH-CHOUKOUK) ET SUJÛD AS-SAHW
// ==========================================
export const DOUBTS_AND_SAHW_DATA = {
  title: 'Résolution des Doutes dans la Prière (Ach-Choukouk) & Prosternation de l’Oubli (Sujûd as-Sahw)',
  intro:
    'L’être humain est sujet à l’oubli et aux distractions (waswâs). La jurisprudence islamique offre des règles de secours claires, mathématiques et rassurantes pour chaque situation de doute.',
  noEffectDoubts: [
    {
      caseTitle: '1. Doute survenu après avoir terminé la prière',
      rule: 'Ne pas en tenir compte ! La prière est considérée comme valide et accomplie.',
    },
    {
      caseTitle: '2. Doute survenu après avoir quitté l’acte',
      rule: 'Si vous doutez d’avoir récité la Fatiha alors que vous êtes déjà en inclinaison, poursuivez votre prière sans revenir en arrière.',
    },
    {
      caseTitle: '3. Doute d’une personne sujette au Waswâs (doute obsessionnel fréquent)',
      rule: 'La personne qui doute constamment à chaque prière doit rejeter le doute et bâtir sur la validité sans refaire aucun geste.',
    },
  ],
  invalidatingDoubts: [
    {
      caseTitle: 'Doute sur le nombre de rak‘ats dans Salât Al-Fajr (prière de 2 rak‘ats)',
      ruling: 'Invalide la prière si le doute persiste : il faut recommencer la prière.',
    },
    {
      caseTitle: 'Doute sur le nombre de rak‘ats dans Salât Al-Maghrib (prière de 3 rak‘ats)',
      ruling: 'Invalide la prière : il faut recommencer la prière.',
    },
    {
      caseTitle: 'Doute dans les deux premières rak‘ats d’une prière de 4 rak‘ats avant la fin de la 2e prosternation',
      ruling: 'Invalide la prière car les deux premières rakats sont le socle fondamental.',
    },
  ],
  repairableDoubts: [
    {
      question: 'J’hésite entre 3 et 4 rak‘ats dans une prière de 4 (Dhuhr, ‘Asr, ‘Isha)',
      solution: 'Bâtissez sur le chiffre le plus grand (considérez que vous êtes à la 4e), terminez votre prière normalement avec le Taslîm, puis effectuez la Prière de Précaution (1 rakat debout) ou les 2 prosternations de l’oubli selon votre école.',
    },
    {
      question: 'J’hésite entre 2 et 3 rak‘ats après avoir relevé la tête de la 2e prosternation',
      solution: 'Bâtissez sur 3, levez-vous pour accomplir une 4e rakat, terminez la prière avec le Taslîm, puis accomplissez 1 rakat de précaution debout.',
    },
    {
      question: 'J’ai oublié le premier Tachahhud assis et je me suis levé debout',
      solution: 'Si vous êtes déjà complètement debout, ne vous rasseyez pas ! Poursuivez votre prière jusqu’au bout, puis faites les 2 prosternations de l’oubli (Sujûd as-Sahw).',
    },
    {
      question: 'J’ai parlé par inadvertance ou fait le Salâm trop tôt par erreur',
      solution: 'Dès que vous réalisez l’erreur, complétez ce qu’il manque de la prière, saluez, puis accomplissez 2 prosternations de l’oubli.',
    },
  ],
  sujudSahwHowTo: {
    title: 'Comment accomplir la Prosternation de l’Oubli (Sujûd as-Sahw) ?',
    steps: [
      {
        step: 1,
        title: 'Intention et Takbir',
        description: 'Après avoir salué (ou avant le salut selon le motif), formez l’intention de réparer l’oubli et dites "Allahu Akbar".',
      },
      {
        step: 2,
        title: 'Première Prosternation avec Évocation Spécifique',
        description: 'Prosternez-vous et récitez l’invocation mentionnée dans le livret de prière :',
        arabic: 'بِسْمِ اللَّهِ وَبِاللَّهِ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ',
        phonetic: 'Bismi-llâhi wa bi-llâh. As-salâmu ‘alayka ayyuhan-Nabiyyu wa raḥmatullâhi wa barakâtuh.',
        french: 'Au nom d’Allah et par Allah. Que la paix soit sur toi, ô Prophète, ainsi que la miséricorde d’Allah et Ses bénédictions.',
      },
      {
        step: 3,
        title: 'Assise Intermédiaire',
        description: 'Relevez-vous en disant "Allahu Akbar", restez assis un court instant en disant "Rabbighfir lî" (Seigneur pardonne-moi).',
      },
      {
        step: 4,
        title: 'Deuxième Prosternation',
        description: 'Prosternez-vous à nouveau en répétant la même évocation sacrée.',
      },
      {
        step: 5,
        title: 'Tachahhud et Salutation Finale',
        description: 'Relevez-vous en position assise, récitez le Tachahhud et concluez par le Salâm : "As-Salâmu ‘Alaykum wa Raḥmatullâh". La prière est désormais pleinement réparée.',
      },
    ],
  },
};

// ==========================================
// 14. LES PETITES SOURATES ESSENTIELLES POUR LA PRIÈRE
// ==========================================
export interface ShortSura {
  number: number;
  name: string;
  arabicName: string;
  versesCount: number;
  verses: {
    arabic: string;
    phonetic: string;
    french: string;
  }[];
}

export const SHORT_SURAS_FOR_PRAYER: ShortSura[] = [
  {
    number: 1,
    name: 'Al-Fatiha (L’Ouverture)',
    arabicName: 'الفاتحة',
    versesCount: 7,
    verses: [
      {
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        phonetic: 'Bismi-llâhir-Raḥmânir-Raḥîm',
        french: 'Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.',
      },
      {
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        phonetic: 'Al-ḥamdu lillâhi Rabbil-‘âlamîn',
        french: 'Louange à Allah, Seigneur de l’univers.',
      },
      {
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
        phonetic: 'Ar-Raḥmânir-Raḥîm',
        french: 'Le Tout Miséricordieux, le Très Miséricordieux.',
      },
      {
        arabic: 'مَالِكِ يَوْمِ الدِّينِ',
        phonetic: 'Mâliki Yawmid-Dîn',
        french: 'Maître du Jour de la rétribution.',
      },
      {
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        phonetic: 'Iyyâka na‘budu wa iyyâka nasta‘în',
        french: 'C’est Toi Seul que nous adorons, et c’est Toi Seul dont nous implorons le secours.',
      },
      {
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        phonetic: 'Ihdinaṣ-ṣirâṭal-mustaqîm',
        french: 'Guide-nous dans le droit chemin,',
      },
      {
        arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        phonetic: 'Ṣirâṭal-ladhîna an‘amta ‘alayhim, ghayril-maghḍûbi ‘alayhim wa laḍ-ḍâllîn',
        french: 'Le chemin de ceux que Tu as comblés de bienfaits, non de ceux qui ont encouru Ta colère, ni des égarés.',
      },
    ],
  },
  {
    number: 108,
    name: 'Al-Kawthar (L’Abondance)',
    arabicName: 'الكوثر',
    versesCount: 3,
    verses: [
      {
        arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
        phonetic: 'Innâ a‘ṭaynâkal-Kawthar',
        french: 'En vérité, Nous t’avons accordé l’Abondance.',
      },
      {
        arabic: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ',
        phonetic: 'Fa-ṣalli li-Rabbika wan-ḥar',
        french: 'Prie donc ton Seigneur et sacrifie.',
      },
      {
        arabic: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',
        phonetic: 'Inna shâni-aka huwal-abtar',
        french: 'C’est certes celui qui te hait qui sera sans postérité.',
      },
    ],
  },
  {
    number: 112,
    name: 'Al-Ikhlas (Le Monothéisme Pur)',
    arabicName: 'الإخلاص',
    versesCount: 4,
    verses: [
      {
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        phonetic: 'Qul Huwallâhu Aḥad',
        french: 'Dis : « Il est Allah, Unique.',
      },
      {
        arabic: 'اللَّهُ الصَّمَدُ',
        phonetic: 'Allâhuṣ-Ṣamad',
        french: 'Allah, Le Seul à être imploré pour ce que nous désirons.',
      },
      {
        arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
        phonetic: 'Lam yalid wa lam yûlad',
        french: 'Il n’a jamais engendré, n’a pas été engendré non plus.',
      },
      {
        arabic: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
        phonetic: 'Wa lam yakul-lahu kufuwan aḥad',
        french: 'Et nul n’est égal à Lui. »',
      },
    ],
  },
  {
    number: 113,
    name: 'Al-Falaq (L’Aube Naissante)',
    arabicName: 'الفلق',
    versesCount: 5,
    verses: [
      {
        arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
        phonetic: 'Qul a‘ûdhu bi-Rabbil-falaq',
        french: 'Dis : « Je cherche protection auprès du Seigneur de l’aube naissante,',
      },
      {
        arabic: 'مِنْ شَرِّ مَا خَلَقَ',
        phonetic: 'Min sharri mâ khalaq',
        french: 'Contre le mal des êtres qu’Il a créés,',
      },
      {
        arabic: 'وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ',
        phonetic: 'Wa min sharri ghâsiqin idhâ waqab',
        french: 'Contre le mal de l’obscurité quand elle s’approfondit,',
      },
      {
        arabic: 'وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',
        phonetic: 'Wa min sharrin-naffâthâti fîl-‘uqad',
        french: 'Contre le mal de celles qui soufflent sur les nœuds,',
      },
      {
        arabic: 'وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
        phonetic: 'Wa min sharri ḥâsidin idhâ ḥasad',
        french: 'Et contre le mal de l’envieux quand il envie. »',
      },
    ],
  },
  {
    number: 114,
    name: 'An-Nas (Les Hommes)',
    arabicName: 'الناس',
    versesCount: 6,
    verses: [
      {
        arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
        phonetic: 'Qul a‘ûdhu bi-Rabbin-nâs',
        french: 'Dis : « Je cherche protection auprès du Seigneur des hommes,',
      },
      {
        arabic: 'مَلِكِ النَّاسِ',
        phonetic: 'Malikin-nâs',
        french: 'Le Roi des hommes,',
      },
      {
        arabic: 'إِلَٰهِ النَّاسِ',
        phonetic: 'Ilâhin-nâs',
        french: 'Le Dieu des hommes,',
      },
      {
        arabic: 'مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
        phonetic: 'Min sharril-waswâsil-khannâs',
        french: 'Contre le mal du tentateur fuyant,',
      },
      {
        arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',
        phonetic: 'Alladhî yuwaswisu fî ṣudûrin-nâs',
        french: 'Qui insuffle le mal dans les poitrines des hommes,',
      },
      {
        arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ',
        phonetic: 'Minal-jinnati wan-nâs',
        french: 'Qu’il soit parmi les djinns ou parmi les hommes. »',
      },
    ],
  },
];

// ==========================================
// 15. STRUCTURE COMPLÈTE DES 5 PRIÈRES (2, 3 ET 4 RAKATS)
// ==========================================
export interface PrayerStructureScheme {
  key: 'F' | 'D' | 'A' | 'M' | 'I';
  name: string;
  arabicName: string;
  totalRakats: number;
  voiceRule: string;
  rakatsBreakdown: {
    rakatNumber: number;
    voice: 'Haute voix (Jahr)' | 'Voix basse (Sirr)';
    recitation: string;
    details: string;
    hasTashahhud: boolean;
    isFinal: boolean;
  }[];
}

export const PRAYER_STRUCTURES_SCHEMES: PrayerStructureScheme[] = [
  {
    key: 'F',
    name: 'Salât Al-Fajr',
    arabicName: 'صلاة الفجر',
    totalRakats: 2,
    voiceRule: 'À voix haute (Jahr) pour l’homme ; à voix basse ou modérée pour la femme.',
    rakatsBreakdown: [
      {
        rakatNumber: 1,
        voice: 'Haute voix (Jahr)',
        recitation: 'Al-Fatiha + Une Sourate complète (ex: Al-Kawthar ou Al-Ikhlas)',
        details: 'Takbîrat Al-Ihram, Qiyam, Ruku‘, I‘tidal, 2 Prosternations.',
        hasTashahhud: false,
        isFinal: false,
      },
      {
        rakatNumber: 2,
        voice: 'Haute voix (Jahr)',
        recitation: 'Al-Fatiha + Une Sourate + Qunout (recommandé)',
        details: 'Ruku‘, 2 Prosternations, Assise finale, Tachahhud complet, Salawat et Salâm.',
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },
  {
    key: 'D',
    name: 'Salât Az-Zuhr',
    arabicName: 'صلاة الظهر',
    totalRakats: 4,
    voiceRule: 'Intégralement à voix basse (Sirr) dans toutes les rak‘ats.',
    rakatsBreakdown: [
      {
        rakatNumber: 1,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha + Une Sourate complète',
        details: 'Ruku‘ et 2 Prosternations.',
        hasTashahhud: false,
        isFinal: false,
      },
      {
        rakatNumber: 2,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha + Une Sourate',
        details: 'Ruku‘, 2 Prosternations, puis premier Tachahhud intermédiaire assis.',
        hasTashahhud: true,
        isFinal: false,
      },
      {
        rakatNumber: 3,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha seule (ou les 4 glorifications : SubhanAllah wal-hamdulillah...)',
        details: 'Ruku‘ et 2 Prosternations sans sourate additionnelle.',
        hasTashahhud: false,
        isFinal: false,
      },
      {
        rakatNumber: 4,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha seule (ou glorifications)',
        details: 'Ruku‘, 2 Prosternations, Assise finale, Tachahhud complet et Salâm.',
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },
  {
    key: 'A',
    name: 'Salât Al-‘Asr',
    arabicName: 'صلاة العصر',
    totalRakats: 4,
    voiceRule: 'Intégralement à voix basse (Sirr) dans toutes les rak‘ats.',
    rakatsBreakdown: [
      {
        rakatNumber: 1,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha + Une Sourate complète',
        details: 'Ruku‘ et 2 Prosternations.',
        hasTashahhud: false,
        isFinal: false,
      },
      {
        rakatNumber: 2,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha + Une Sourate',
        details: 'Ruku‘, 2 Prosternations, puis premier Tachahhud intermédiaire assis.',
        hasTashahhud: true,
        isFinal: false,
      },
      {
        rakatNumber: 3,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha seule',
        details: 'Ruku‘ et 2 Prosternations.',
        hasTashahhud: false,
        isFinal: false,
      },
      {
        rakatNumber: 4,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha seule',
        details: 'Ruku‘, 2 Prosternations, Assise finale, Tachahhud complet et Salâm.',
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },
  {
    key: 'M',
    name: 'Salât Al-Maghrib',
    arabicName: 'صلاة المغرب',
    totalRakats: 3,
    voiceRule: 'À voix haute (Jahr) pour les 2 premières rak‘ats ; à voix basse (Sirr) pour la 3ème.',
    rakatsBreakdown: [
      {
        rakatNumber: 1,
        voice: 'Haute voix (Jahr)',
        recitation: 'Al-Fatiha + Une Sourate complète',
        details: 'Ruku‘ et 2 Prosternations.',
        hasTashahhud: false,
        isFinal: false,
      },
      {
        rakatNumber: 2,
        voice: 'Haute voix (Jahr)',
        recitation: 'Al-Fatiha + Une Sourate + Qunout (recommandé)',
        details: 'Ruku‘, 2 Prosternations, puis premier Tachahhud intermédiaire assis.',
        hasTashahhud: true,
        isFinal: false,
      },
      {
        rakatNumber: 3,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha seule (sans sourate additionnelle)',
        details: 'Ruku‘, 2 Prosternations, Assise finale, Tachahhud complet, Salawat et Salâm.',
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },
  {
    key: 'I',
    name: 'Salât Al-‘Isha',
    arabicName: 'صلاة العشاء',
    totalRakats: 4,
    voiceRule: 'À voix haute (Jahr) pour les 2 premières rak‘ats ; à voix basse (Sirr) pour les 3e et 4e.',
    rakatsBreakdown: [
      {
        rakatNumber: 1,
        voice: 'Haute voix (Jahr)',
        recitation: 'Al-Fatiha + Une Sourate complète',
        details: 'Ruku‘ et 2 Prosternations.',
        hasTashahhud: false,
        isFinal: false,
      },
      {
        rakatNumber: 2,
        voice: 'Haute voix (Jahr)',
        recitation: 'Al-Fatiha + Une Sourate',
        details: 'Ruku‘, 2 Prosternations, puis premier Tachahhud intermédiaire assis.',
        hasTashahhud: true,
        isFinal: false,
      },
      {
        rakatNumber: 3,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha seule',
        details: 'Ruku‘ et 2 Prosternations.',
        hasTashahhud: false,
        isFinal: false,
      },
      {
        rakatNumber: 4,
        voice: 'Voix basse (Sirr)',
        recitation: 'Al-Fatiha seule',
        details: 'Ruku‘, 2 Prosternations, Assise finale, Tachahhud complet, Salawat et Salâm.',
        hasTashahhud: true,
        isFinal: true,
      },
    ],
  },
];

// ==========================================
// 10. LE LAVAGE RITUEL MAJEUR (AL-GHUSL)
// ==========================================
export interface GhuslStep {
  stepNumber: number;
  title: string;
  description: string;
  hadithOrFiqhNote: string;
}

export const GHUSL_OBLIGATION_CAUSES = [
  'L’éjaculation ou émission de sperme avec plaisir (éveil ou rêve érotique)',
  'La relation charnelle même sans éjaculation',
  'L’interruption des menstrues (Al-Haydh) chez la femme',
  'La fin des lochies (An-Nifâs) après un accouchement',
  'L’entrée en Islam d’un nouveau converti',
  'Le lavage mortuaire du musulman décédé',
];

export const GHUSL_STEPS_PROPHETIC: GhuslStep[] = [
  {
    stepNumber: 1,
    title: 'L’Intention (An-Niyyah) & Basmalah',
    description: 'Former l’intention sincère dans son cœur de lever l’état de grande impureté (Janâbah) pour plaire à Allah, puis dire intérieurement « Bismillâh ».',
    hadithOrFiqhNote: 'L’intention est le pilier indispensable sans lequel le Ghusl n’est pas valable.',
  },
  {
    stepNumber: 2,
    title: 'Laver les mains trois fois',
    description: 'Laver soigneusement les mains jusqu’aux poignets 3 fois avant de toucher à l’eau.',
    hadithOrFiqhNote: 'Sunnah d’après le hadith de ‘Aïcha et Maymouna (qu’Allah les agrée).',
  },
  {
    stepNumber: 3,
    title: 'Laver les parties intimes',
    description: 'Nettoyer avec la main gauche les parties intimes et toute trace d’impureté présente sur le corps.',
    hadithOrFiqhNote: 'Se laver ensuite la main avec du savon ou de l’eau pure.',
  },
  {
    stepNumber: 4,
    title: 'Faire les petites ablutions (Wudû’)',
    description: 'Accomplir les ablutions de la prière normales (bouche, nez, visage, bras, tête). On peut retarder le lavage des pieds jusqu’à la fin du bain.',
    hadithOrFiqhNote: 'Permet d’entrer dans la purification par étapes selon la pratique prophétique.',
  },
  {
    stepNumber: 5,
    title: 'Verser l’eau sur la tête 3 fois',
    description: 'Passer les doigts mouillés à la racine des cheveux puis verser trois poignées d’eau généreuses sur la tête en massant bien le cuir chevelu.',
    hadithOrFiqhNote: 'Il est obligatoire que l’eau atteigne la peau sous les cheveux.',
  },
  {
    stepNumber: 6,
    title: 'Laver tout le corps (côté droit puis gauche)',
    description: 'Verser l’eau sur l’ensemble du corps en commençant par le côté droit, puis le côté gauche, en frottant avec les mains les zones difficiles d’accès (nombril, aisselles, plis).',
    hadithOrFiqhNote: 'Pilier obligatoire : aucune partie du corps ne doit rester sèche.',
  },
  {
    stepNumber: 7,
    title: 'Laver les deux pieds',
    description: 'Se décaler légèrement de l’endroit souillé et laver soigneusement les deux pieds en insérant les doigts entre les orteils.',
    hadithOrFiqhNote: 'Le Ghusl valide également les petites ablutions (Wudû) si l’intention a été formulée.',
  },
];

// ==========================================
// 11. LES PRIÈRES PARTICULIÈRES (JANAZA, ISTIKHARA, ETC.)
// ==========================================
export interface SpecialPrayerItem {
  id: string;
  title: string;
  arabicName: string;
  rakats: string;
  description: string;
  steps: {
    title: string;
    arabic?: string;
    phonetic?: string;
    french: string;
  }[];
}

export const SPECIAL_PRAYERS_COLLECTION: SpecialPrayerItem[] = [
  {
    id: 'janaza',
    title: 'Salât Al-Janâzah (Prière Mortuaire)',
    arabicName: 'صلاة الجنازة',
    rakats: 'Debout sans inclinaison ni prosternation (4 Takbirs)',
    description: 'Une obligation communautaire (Fard Kifâyah) empreinte de solennité pour implorer le pardon et la miséricorde d’Allah en faveur du défunt musulman.',
    steps: [
      {
        title: '1er Takbîr : Sourate Al-Fatiha',
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ...',
        phonetic: 'Allâhou Akbar, puis récitation à voix basse de la Sourate Al-Fatiha.',
        french: 'On lève les mains pour le premier Takbir, puis on récite la Fatiha à voix basse.',
      },
      {
        title: '2ème Takbîr : La Prière Abrahamique',
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ...',
        phonetic: 'Allâhoumma salli ‘alâ Mouhammadin wa ‘alâ âli Mouhammad...',
        french: 'On dit Allahu Akbar puis on récite la prière sur le Prophète ﷺ (Salât Ibrâhîmiyyah).',
      },
      {
        title: '3ème Takbîr : Invocation pour le Défunt',
        arabic: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ، وَعَافِهِ وَاعْفُ عَنْهُ، وَأَكْرِمْ نُزُلَهُ، وَوَسِّعْ مُدْخَلَهُ...',
        phonetic: 'Allâhoumma-ghfir lahou war-hamhou, wa ‘âfihi wa’fou ‘anhou, wa akrim nouzoulah, wa wassi’ moudkhalah...',
        french: '« Ô Allah ! Pardonne-lui, fais-lui miséricorde, accorde-lui le salut, pardonne ses fautes, accueille-le avec noblesse et élargis sa tombe... »',
      },
      {
        title: '4ème Takbîr : Invocation finale & Salâm',
        arabic: 'اللَّهُمَّ لَا تَحْرِمْنَا أَجْرَهُ وَلَا تَفْتِنَّا بَعْدَهُ وَاغْفِرْ لَنَا وَلَهُ • السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
        phonetic: 'Allâhoumma lâ tahrimnâ ajrah, wa lâ taftinnâ ba’dah, waghfir lanâ wa lah. Puis Salâm à droite.',
        french: 'Invocation pour les vivants et le défunt, suivie d’un seul Salâm vers la droite (ou deux selon les écoles).',
      },
    ],
  },
  {
    id: 'istikhara',
    title: 'Salât Al-Istikhârah (Prière de Consultation)',
    arabicName: 'صلاة الاستخارة',
    rakats: '2 Rak‘ats surérogatoires suivies de la noble Dou‘â',
    description: 'Enseignée par le Prophète ﷺ aux Compagnons comme on enseigne une sourate du Coran, pour demander à Allah d’orienter son choix dans toute affaire importante (mariage, travail, projet, voyage).',
    steps: [
      {
        title: 'Accomplir 2 Rak‘ats régulières',
        french: 'Prier 2 rakats avec sincérité, en récitant Al-Fatiha puis une sourate (comme Al-Kafirun et Al-Ikhlas). Terminer la prière par le Taslim.',
      },
      {
        title: 'Prononcer l’Invocation de Consultation',
        arabic: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ...',
        phonetic: 'Allâhoumma innî astakhîrouka bi-‘ilmika, wa astaqdirouka bi-qoudratika, wa as-alouka min fadlikal-‘adhîm...',
        french: '« Ô Allah ! Je Te consulte par Ta science, je Te demande la capacité par Ta puissance et je Te demande de Ton immense grâce. Tu peux et je ne peux point, Tu sais et je ne sais point, et Tu es le Connaisseur des mystères... » (Puis nommer expressément son affaire).',
      },
    ],
  },
  {
    id: 'voyageur',
    title: 'Salât Al-Mousâfir (Prière du Voyageur)',
    arabicName: 'صلاة المسافر (القصر والجمع)',
    rakats: 'Raccourcissement (Qasr) à 2 rakats + Regroupement (Jam‘)',
    description: 'Une aumône et facilité divine accordée au musulman qui voyage sur une distance d’environ 80 km ou plus.',
    steps: [
      {
        title: 'Le Raccourcissement (Al-Qasr)',
        french: 'Les prières à 4 unités (Dhuhr, Asr et Isha) sont raccourcies à 2 unités. Le Fajr (2) et le Maghrib (3) restent inchangés.',
      },
      {
        title: 'Le Regroupement (Al-Jam‘)',
        french: 'Permission d’unir Dhuhr avec Asr (au moment du Dhuhr ou du Asr), et Maghrib avec Isha (au moment du Maghrib ou de l’Isha).',
      },
    ],
  },
];


