export interface IslamicBook {
  id: string;
  title: string;
  arabicTitle: string;
  author: string;
  category: 'coran' | 'jeune' | 'foi';
  pdfFileName: string;
  pdfUrl: string;
  description: string;
  pageEstimate: number;
  topics: string[];
  keyQuotes: {
    text: string;
    source: string;
  }[];
  chapters: {
    title: string;
    summary: string;
  }[];
}

export const ISLAMIC_BOOKS: IslamicBook[] = [
  {
    id: 'arabic-quran',
    title: 'Le Noble Coran (Mushaf Arabe)',
    arabicTitle: 'القرآن الكريم',
    author: 'Parole d’Allah révélée au Prophète Muhammad ﷺ',
    category: 'coran',
    pdfFileName: 'Arabic-Quran.pdf.pdf',
    pdfUrl: '/books/Arabic-Quran.pdf.pdf',
    description: 'Le texte sacré intégral du Coran en calligraphie arabe traditionnelle (Mushaf), avec les 114 sourates et 30 Juz.',
    pageEstimate: 604,
    topics: ['Texte Sacré', '114 Sourates', 'Récitation', 'Méditation (Tadabbur)'],
    keyQuotes: [
      {
        text: 'شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ وَبَيِّنَاتٍ مِّنَ الْهُدَىٰ وَالْفُرْقَانِ',
        source: 'Sourate Al-Baqarah (2:185)',
      },
      {
        text: '« Le mois de Ramadan au cours duquel le Coran a été descendu comme guide pour les gens, et preuves claires de la bonne direction et du discernement. »',
        source: 'Sens du verset 2:185',
      },
    ],
    chapters: [
      { title: 'Al-Fatihah à Al-Baqarah', summary: 'Fondements de la foi, législation et guidance pour les croyants.' },
      { title: 'Sourates Médinoises', summary: 'Organisation de la communauté, piété, justice sociale et règles de vie.' },
      { title: 'Juz ‘Amma (Partie 30)', summary: 'Sourates courtes riches en méditation sur la création et l’Au-delà.' },
    ],
  },
  {
    id: 'livre-jeune-ibn-baz',
    title: 'Le Livre du Jeûne',
    arabicTitle: 'كتاب الصيام',
    author: 'Cheikh ‘Abdul-‘Azîz Ibn Bâz (رحمه الله)',
    category: 'jeune',
    pdfFileName: 'fr-livre-du-jeune-ibn-baz-1.pdf',
    pdfUrl: '/books/fr-livre-du-jeune-ibn-baz-1.pdf',
    description: 'Guide juridique authentique et clair détaillant les règles indispensables du jeûne de Ramadan, les erreurs courantes, les annulatifs, la prière nocturne de Tarawih, la Nuit du Destin et la Zakat Al-Fitr.',
    pageEstimate: 45,
    topics: ['Obligation du Jeûne', 'Annulatifs & Dérogations', 'Tarawih & Tahajjud', 'Laylat Al-Qadr', 'Zakat Al-Fitr'],
    keyQuotes: [
      {
        text: '« Le jeûne est une école de piété (Taqwa). Le musulman doit préserver son ouïe, son regard et sa langue de tout ce qu’Allah a interdit afin que son jeûne soit agréé. »',
        source: 'Cheikh Ibn Baz',
      },
      {
        text: '« Quiconque accomplit la prière nocturne du Ramadan avec foi et sincère espoir en la récompense d’Allah verra ses péchés passés pardonnés. »',
        source: 'Hadith Sahih Bukhari & Muslim',
      },
    ],
    chapters: [
      { title: 'Mérites et statut du Jeûne', summary: 'Les sagesses profondes du jeûne et son statut de pilier de l’Islam.' },
      { title: 'Ce qui rompt le jeûne & ce qui ne le rompt pas', summary: 'Distinction claire entre les annulatifs réels et les idées reçues.' },
      { title: 'Règles pour les malades, voyageurs et femmes', summary: 'Les dispenses légitimes, le rattrapage (Qadâ) et l’expiation (Fidya).' },
      { title: 'Les dix dernières nuits & la Nuit du Destin', summary: 'L’effort spirituel, l’I’tikaf et les invocations recommandées.' },
      { title: 'Zakat Al-Fitr & Prière de l’Aïd', summary: 'Quantité (1 Sa’), moment prescrit et bénéficiaires de l’aumône de rupture.' },
    ],
  },
  {
    id: 'jeune-ramadan-complet',
    title: 'Le Jeûne de Ramadan : Statut & Spiritualité',
    arabicTitle: 'صيام رمضان : أحكامه وفضائله',
    author: 'Ouvrage collectif de référence islamique',
    category: 'jeune',
    pdfFileName: 'le-jeûne-de-ramadan.pdf',
    pdfUrl: '/books/le-jeûne-de-ramadan.pdf',
    description: 'Une étude exhaustive de la dimension rituelle et spirituelle du mois béni de Ramadan, les sagesses médicales et intérieures de la privation pour Allah.',
    pageEstimate: 60,
    topics: ['Spiritualité du Jeûne', 'Suhoor & Iftar', 'Comportement du Jeûneur', 'Règles de Kaffara'],
    keyQuotes: [
      {
        text: '« Le jeûne est un bouclier contre le Feu ; lorsque l’un de vous jeûne, qu’il s’abstienne de tout propos grossier et de cris. Si quelqu’un l’insulte ou le cherche, qu’il dise : Je suis une personne qui jeûne. »',
        source: 'Hadith Sahih Al-Bukhari',
      },
    ],
    chapters: [
      { title: 'Les conditions d’obligation', summary: 'Qui doit jeûner et quelles sont les conditions d’aptitude.' },
      { title: 'L’Intention (An-Niyyah)', summary: 'La formulation de l’intention avant l’aube pour les jeûnes obligatoires.' },
      { title: 'Les convenances prophétiques (Sunan)', summary: 'Retarder le Suhoor, hâter l’Iftar avec des dattes ou de l’eau, et multiplier les aumônes.' },
    ],
  },
  {
    id: 'conditions-jeune',
    title: 'Les Conditions du Jeûne',
    arabicTitle: 'شروط الصيام وأركانه',
    author: 'Précis de Fiqh islamique',
    category: 'jeune',
    pdfFileName: 'conditions-du-jeune-1.pdf',
    pdfUrl: '/books/conditions-du-jeune-1.pdf',
    description: 'Fascicule synthétique axé sur les conditions de validité, d’obligation, et les éléments indispensables pour que l’acte d’adoration soit valide.',
    pageEstimate: 20,
    topics: ['Conditions de validité', 'Conditions d’obligation', 'Piliers du Jeûne', 'Annulatifs majeurs'],
    keyQuotes: [
      {
        text: '« Deux piliers fondamentaux fondent le jeûne : l’intention sincère au cœur et l’abstinence totale des plaisirs du ventre et du sexe depuis le lever réel de l’aube jusqu’au coucher du soleil. »',
        source: 'Précis de Fiqh',
      },
    ],
    chapters: [
      { title: 'Les 6 conditions d’obligation', summary: 'Islam, raison, puberté, capacité physique, résidence et pureté rituelle.' },
      { title: 'Les piliers (Arkan)', summary: 'L’abstinence consciente et l’intention dédiée exclusivement à Allah.' },
    ],
  },
  {
    id: 'la-resurrection-achqar',
    title: 'Le Jour de la Résurrection',
    arabicTitle: 'اليوم الآخر : القيامة الكبرى',
    author: 'Dr. ‘Omar Sulaimân Al-Achqar (رحمه الله)',
    category: 'foi',
    pdfFileName: 'la resurection-1.pdf',
    pdfUrl: '/books/la resurection-1.pdf',
    description: 'Le chef-d’œuvre incontournable sur l’eschatologie musulmane. Du premier souffle dans la Trompe au rassemblement sur la terre du Jugement, l’Exposition des actes, la Balance, le Bassin et le passage du Pont Sirat.',
    pageEstimate: 280,
    topics: ['Signes de l’Heure', 'Le Souffle dans la Trompe', 'Le Rassemblement (Mahshar)', 'La Balance (Mizan)', 'Le Pont Sirat', 'L’Intercession'],
    keyQuotes: [
      {
        text: '« Ce Jour-là, la terre sera changée en une autre terre, ainsi que les cieux et les hommes comparaîtront devant Allah, l’Unique, le Dominateur Suprême. »',
        source: 'Sourate Ibrahim (14:48)',
      },
      {
        text: '« Sept catégories de personnes seront protégées sous l’ombre du Trône d’Allah le Jour où il n’y aura d’autre ombre que la Sienne... »',
        source: 'Hadith authentique',
      },
    ],
    chapters: [
      { title: 'Les signes avant-coureurs majeurs', summary: 'L’apparition du Faux Messie (Ad-Dajjal), la descente de Jésus (‘Issa), Gog et Magog (Ya’juj wa Ma’juj).' },
      { title: 'La Trompe & la Résurrection des corps', summary: 'Le foudroiement universel puis le réveil de toute l’humanité depuis le coccyx.' },
      { title: 'Le Grand Rassemblement (Al-Mahshar)', summary: '50 000 années d’attente sous la chaleur du soleil, l’angoisse humaine et la Grande Intercession.' },
      { title: 'La Balance (Al-Mizan) & les Livres', summary: 'La pesée rigoureuse des actions au poids d’un atome et la remise des registres.' },
      { title: 'Le Bassin (Al-Hawd) & le Pont (As-Sirat)', summary: 'L’eau désaltérante réservée aux fidèles et la traversée au-dessus de la Géhenne selon la lumière de sa foi.' },
    ],
  },
  {
    id: 'paradis-enfer-achqar',
    title: 'La Foi Islamique : Le Paradis & L’Enfer',
    arabicTitle: 'الجنة والنار في ضوء الكتاب والسنة',
    author: 'Dr. ‘Omar Sulaimân Al-Achqar (رحمه الله)',
    category: 'foi',
    pdfFileName: 'al-Achqar_La-Foi-Islamique-(07-08)-Le-Paradis-et-l-Enfer-1.pdf',
    pdfUrl: '/books/al-Achqar_La-Foi-Islamique-(07-08)-Le-Paradis-et-l-Enfer-1.pdf',
    description: 'Une description monumentale et documentée basée sur le Coran et les Hadiths authentiques : la félicité infinie du Paradis, ses degrés, ses palais, ses fleuves, la vision divine, et la réalité effroyable de l’Enfer et ses châtiments.',
    pageEstimate: 310,
    topics: ['Les Portes du Paradis', 'Al-Firdaws Al-A’la', 'La Vision d’Allah', 'Les Niveaux de l’Enfer', 'Zaqqum & Ghislin'],
    keyQuotes: [
      {
        text: '« J’ai préparé pour Mes serviteurs vertueux ce qu’aucun œil n’a jamais vu, ce qu’aucune oreille n’a jamais entendu, et ce qu’aucun cœur humain n’a jamais pu concevoir. »',
        source: 'Hadith Qudsi authentique',
      },
      {
        text: '« Pour ceux qui agissent en bien, il y a la meilleure récompense (le Paradis) et un surplus (la contemplation de la Face Sacrée d’Allah). »',
        source: 'Sourate Yunus (10:26)',
      },
    ],
    chapters: [
      { title: 'L’existence actuelle et l’éternité du Paradis', summary: 'Créé avant la création des hommes, aux portes ouvertes pour les serviteurs pieux.' },
      { title: 'Les degrés et les fleuves du Paradis', summary: 'Cent degrés séparant le croyant d’Al-Firdaws, fleuves de miel, de lait et d’eau pure.' },
      { title: 'Le plus suprême des bienfaits : Ar-Ru’yah', summary: 'Voir la Face bénie d’Allah sans se gêner mutuellement, semblable à la pleine lune.' },
      { title: 'L’Enfer et ses portes', summary: 'Ses abîmes profonds, le feu soixante-dix fois plus ardent que le feu terrestre.' },
      { title: 'Les tourments et la nourriture des réprouvés', summary: 'L’arbre maudit de Zaqqum, l’eau bouillante et la perte éternelle pour l’incroyance.' },
    ],
  },
];
