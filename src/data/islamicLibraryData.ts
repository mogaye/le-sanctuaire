export interface PdfIslamicBook {
  id: string;
  title: string;
  arabicTitle: string;
  author: string;
  authorTitle?: string;
  category: 'piete' | 'fiqh' | 'sirah' | 'spiritualite' | 'methodologie' | 'foi';
  categoryLabel: string;
  pdfUrl: string;
  fileName: string;
  pagesCount: number;
  description: string;
  highlights: string[];
  gradient: string;
  accentColor: string;
  isNewUpload?: boolean;
}

export const ISLAMIC_PDF_LIBRARY: PdfIslamicBook[] = [
  {
    id: 'crains-allah',
    title: 'Crains Allah où que tu sois...',
    arabicTitle: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ',
    author: "Cheikh 'Oubayd Al-Jâbirî",
    authorTitle: "Ancien enseignant à l'Université Islamique de Médine",
    category: 'piete',
    categoryLabel: 'Piété & Croyance',
    pdfUrl: '/livres/crains-allah-ou-que-tu-sois.pdf',
    fileName: 'crains-allah-ou-que-tu-sois.pdf',
    pagesCount: 31,
    description:
      "Une explication lumineuse et profonde du noble hadîth prophétique : « Crains Allah où que tu sois, fais suivre le péché par une bonne action qui l'efface, et comporte-toi envers les gens d'un bon comportement ». Définition de la Taqwâ, ses degrés et ses secrets.",
    highlights: [
      'Les trois grands ordres du hadîth et leurs applications quotidiennes',
      'Le sens linguistique et religieux de la crainte révérencielle (Taqwâ)',
      'La différence fondamentale entre péchés majeurs et péchés mineurs',
      'La règle suprême du bon comportement avec les croyants et toute personne',
    ],
    gradient: 'from-emerald-800 via-teal-900 to-slate-950',
    accentColor: '#10B981',
    isNewUpload: true,
  },
  {
    id: 'la-piete-realite-effet',
    title: "La Piété : Sa Réalité et l'Effet de sa Mise en Application",
    arabicTitle: 'حَقِيقَةُ التَّقْوَى وَأَثَرُ تَطْبِيقِهَا',
    author: "Cheikh 'Abdoullâh Al-Boukhârî",
    authorTitle: "Enseignant à la Faculté du Hadîth — Université de Médine",
    category: 'piete',
    categoryLabel: 'Piété & Croyance',
    pdfUrl: '/livres/la-piete-sa-realite-et-effet.pdf',
    fileName: 'la-piete-sa-realite-et-effet.pdf',
    pagesCount: 40,
    description:
      "Conférence majeure exposant la définition d'or de la piété selon Talq ibn Habîb, validée par l'Imam Ibn Al-Qayyim et Ibn Kathir. L'auteur détaille comment la piété s'acquiert par la science authentique, la sincérité et le suivi de la Sounnah.",
    highlights: [
      'La meilleure définition jamais donnée de la piété selon Ibn Al-Qayyim',
      'Les 3 degrés de la préservation : interdits, ambiguïtés et futilités',
      'Le dressage et la maîtrise de l’âme face aux désirs secrets',
      'Douceur et secours divin accordés dans les épreuves de la vie',
    ],
    gradient: 'from-teal-800 via-emerald-950 to-neutral-950',
    accentColor: '#14B8A6',
    isNewUpload: true,
  },
  {
    id: 'patience-remerciement',
    title: 'Règle dans la Patience et le Remerciement',
    arabicTitle: 'قَاعِدَةٌ فِي الصَّبْرِ وَالشُّكْرِ',
    author: 'Cheikh Al-Islâm Ibn Taymiyyah',
    authorTitle: 'Grand savant et moujtahid (m. 728 H)',
    category: 'spiritualite',
    categoryLabel: 'Spiritualité & Patience',
    pdfUrl: '/livres/regle-dans-la-patience-et-le-remerciement.pdf',
    fileName: 'regle-dans-la-patience-et-le-remerciement.pdf',
    pagesCount: 44,
    description:
      "L'épître célèbre de Cheikh Al-Islam Ibn Taymiyyah expliquant que la foi entière est divisée en deux moitiés : la patience face aux épreuves et le remerciement dans l'aisance. Contient les 20 remèdes et réflexions qui aident le croyant à pardonner et patienter face aux torts causés par autrui.",
    highlights: [
      'Les trois catégories de la patience dans la religion',
      'Les 20 contemplations spirituelles qui facilitent le pardon face aux offenses',
      'Pourquoi le pardon élève le serviteur en puissance auprès d’Allah',
      'La récompense incommensurable promise à ceux qui endurent sans rancœur',
    ],
    gradient: 'from-amber-800 via-stone-900 to-black',
    accentColor: '#F59E0B',
    isNewUpload: true,
  },
  {
    id: 'guide-zakat',
    title: 'Guide Pratique Concis sur Zakât Al-Mâl en Islam',
    arabicTitle: 'دَلِيلٌ مُوجَزٌ فِي زَكَاةِ الْمَالِ',
    author: "Mehdi Abou 'Abdir-Rahmân (Relecture Saad Abou 'Abdir-Rahmân)",
    authorTitle: 'Éditions SPF Birmingham',
    category: 'fiqh',
    categoryLabel: 'Fiqh & Zakât',
    pdfUrl: '/livres/guide-pratique-zakat.pdf',
    fileName: 'guide-pratique-zakat.pdf',
    pagesCount: 56,
    description:
      "Guide clair, pratique et exhaustif destiné aux musulmans pour calculer et s'acquitter de la Zakât de l'argent liquide, de l'or, des bijoux, des salaires mensuels, des commerces, des terres et des dettes selon les avis juridiques des grands imams (Ibn Baz, Al-'Othaymîn, Al-Fawzân).",
    highlights: [
      'Calcul du Nisâb de l’or (85g) et de l’argent (595g) avec exemples chiffrés',
      'Méthode simple pour la Zakât des salariés payés au mois',
      'Règles des bijoux portés, des biens en location et des dettes',
      'Statut des caisses d’entraide et des associations caritatives',
    ],
    gradient: 'from-emerald-900 via-yellow-950 to-neutral-950',
    accentColor: '#10B981',
    isNewUpload: true,
  },
  {
    id: 'biographie-prophete',
    title: 'Le Résumé de la Biographie du Prophète ﷺ',
    arabicTitle: 'خُلَاصَةُ السِّيرَةِ النَّبَوِيَّةِ',
    author: 'Cheikh Haytham Sarhan',
    authorTitle: "Éminent enseignant à la Mosquée du Prophète ﷺ à Médine",
    category: 'sirah',
    categoryLabel: 'Sîrah & Vie du Prophète ﷺ',
    pdfUrl: '/livres/biographie-du-prophete.pdf',
    fileName: 'biographie-du-prophete.pdf',
    pagesCount: 50,
    description:
      "Ouvrage pédagogique illustré et structuré sous forme de tableaux clairs retraçant la généalogie, les noms bénis, la description physique et morale, le mode de vie quotidien, les grandes étapes de la révélation, l'émigration, les batailles et le pèlerinage d'adieu du Messager d'Allah ﷺ.",
    highlights: [
      'Généalogie et descriptions physique et comportementale authentiques',
      'Tableaux chronologiques des périodes mecquoise et médinoise',
      'Synthèse des expéditions et des batailles majeures mentionnées dans le Coran',
      'Questionnaires d’auto-évaluation pour tester ses connaissances de la Sîrah',
    ],
    gradient: 'from-blue-900 via-indigo-950 to-neutral-950',
    accentColor: '#3B82F6',
    isNewUpload: true,
  },
  {
    id: 'lutte-penchants-ame',
    title: 'Les Étapes à Suivre dans la Lutte contre les Penchants de l’Âme',
    arabicTitle: 'مَرَاحِلُ جِهَادِ النَّفْسِ وَأَهْوَائِهَا',
    author: "Cheikh 'Oubayd Al-Jâbirî",
    authorTitle: "Grand savant de Médine (qu’Allah lui fasse miséricorde)",
    category: 'spiritualite',
    categoryLabel: 'Spiritualité & Patience',
    pdfUrl: '/livres/lutte-contre-les-penchants-de-lame.pdf',
    fileName: 'lutte-contre-les-penchants-de-lame.pdf',
    pagesCount: 14,
    description:
      "Rappel précieux détaillant la nature des 3 types d'âmes (instigatrice au mal, accusatrice et apaisée) et les 4 étapes indispensables pour triompher de ses passions : la science religieuse, la mise en pratique sincère, l'appel à la vérité et la patience constante.",
    highlights: [
      'La distinction des 3 états de l’âme humaine selon le Noble Coran',
      'Les 4 étapes progressives pour réformer son cœur et sa conduite',
      'Le danger de la science sans pratique et l’illusion des passions',
      'Conseils pour endurer face aux épreuves de la prédication',
    ],
    gradient: 'from-purple-900 via-slate-900 to-black',
    accentColor: '#8B5CF6',
    isNewUpload: true,
  },
  {
    id: 'devoilement-fitnah',
    title: 'Dévoilement de la Fitnah et Préservation de la Voie Salafie',
    arabicTitle: 'كَشْفُ الْفِتْنَةِ وَحِمَايَةُ الْمَنْهَجِ',
    author: "Mehdi Abou 'Abdir-Rahmân (avec avis des grands savants)",
    authorTitle: 'Édition de clarification méthodologique',
    category: 'methodologie',
    categoryLabel: 'Méthodologie & Conseils des Savants',
    pdfUrl: '/livres/devoilement-de-la-fitnah-mohammad-bin-hadi.pdf',
    fileName: 'devoilement-de-la-fitnah-mohammad-bin-hadi.pdf',
    pagesCount: 236,
    description:
      "Dossier documentaire et historique complet rassemblant les paroles, analyses et recommandations des grands savants de l'Islam (Cheikh Rabî' Al-Madkhalî, Cheikh 'Oubayd Al-Jâbirî, Cheikh Sâlih Al-Fawzân, Cheikh 'Abdoullâh Al-Boukhârî) appelant à l'union, au rejet de l'injustice et au respect des règles de la critique fondée sur les preuves.",
    highlights: [
      'Les conseils écrits et oraux des grands savants pour préserver la concorde',
      'Réfutation détaillée des accusations sans preuves (règle du Jarh wa Ta’dîl)',
      'Chronologie des événements et mises en garde des autorités religieuses',
      'Appel solennel à la fraternité, au repentir et à l’attachement au Coran et à la Sounnah',
    ],
    gradient: 'from-cyan-900 via-sky-950 to-neutral-950',
    accentColor: '#06B6D4',
    isNewUpload: true,
  },
  {
    id: 'foi-paradis-enfer',
    title: 'La Foi Islamique : Le Paradis et l’Enfer',
    arabicTitle: 'الْجَنَّةُ وَالنَّارُ فِي ضَوْءِ الْكِتَابِ وَالسُّنَّةِ',
    author: "Dr. 'Oumar Souleymân Al-Achqar",
    authorTitle: 'Professeur émérite en sciences islamiques',
    category: 'foi',
    categoryLabel: 'Foi & Croyance (Aqida)',
    pdfUrl: '/livres/la-foi-le-paradis-et-l-enfer.pdf',
    fileName: 'la-foi-le-paradis-et-l-enfer.pdf',
    pagesCount: 168,
    description:
      "Étude fondamentale et exhaustive sur la demeure éternelle des croyants (ses portes, ses degrés, ses délices inexprimables) et la mise en garde solennelle contre le châtiment du Feu, fondée sur les versets et ahadiths authentiques.",
    highlights: [
      'Description détaillée des délices et des portes du Paradis',
      'Les catégories de croyants et les degrés de félicité',
      'Mise en garde contre les causes menant au châtiment',
      'Preuves textuelles tirées du Coran et des deux Authentiques',
    ],
    gradient: 'from-rose-950 via-neutral-900 to-black',
    accentColor: '#F43F5E',
    isNewUpload: false,
  },
  {
    id: 'livre-jeune-ibn-baz',
    title: 'Le Livre du Jeûne selon les Preuves Authentiques',
    arabicTitle: 'كِتَابُ الصِّيَامِ لِلشَّيْخِ ابْنِ بَاز',
    author: "Cheikh 'Abdel-'Azîz Ibn Bâz",
    authorTitle: "Ancien Grand Mufti d'Arabie Saoudite",
    category: 'fiqh',
    categoryLabel: 'Fiqh & Zakât',
    pdfUrl: '/livres/livre-du-jeune-ibn-baz.pdf',
    fileName: 'livre-du-jeune-ibn-baz.pdf',
    pagesCount: 78,
    description:
      "Recueil complet des fatawa et explications juridiques sur le jeûne de Ramadan, ses conditions de validité, les actes recommandés et détestables, le jeûne du malade et du voyageur, ainsi que la nuit du Destin (Laylat Al-Qadr).",
    highlights: [
      'Conditions d’obligation et de validité du jeûne',
      'Détail des annulatifs et des actes permis pour le jeûneur',
      'Règles relatives au voyageur, à la femme enceinte et au malade',
      'Les mérites de la retraite spirituelle (I’tikâf) et de Laylat Al-Qadr',
    ],
    gradient: 'from-emerald-950 via-stone-900 to-black',
    accentColor: '#10B981',
    isNewUpload: false,
  },
];
