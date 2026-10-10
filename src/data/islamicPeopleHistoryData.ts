export type IslamicPersonCategory =
  | 'prophetes'
  | 'compagnons'
  | 'femmes_illustres'
  | 'savants_spirituels';

export interface PersonChapter {
  number: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
}

export interface PersonMilestone {
  period: string;
  event: string;
}

export interface IslamicPersonBook {
  id: string;
  name: string;
  honorific: string;
  arabicName: string;
  title: string;
  category: IslamicPersonCategory;
  categoryLabel: string;
  era: string;
  region: string;
  readTime: string;
  coverGradient: string;
  badgeColor: string;
  shortSummary: string;
  virtues: string[];
  arabicQuote: string;
  frenchQuote: string;
  quoteSource: string;
  milestones: PersonMilestone[];
  chapters: PersonChapter[];
  spiritualLesson: string;
}

export const ISLAMIC_PERSON_CATEGORIES: {
  id: 'all' | IslamicPersonCategory;
  label: string;
  count?: number;
}[] = [
  { id: 'all', label: 'Tout le Catalogue' },
  { id: 'prophetes', label: 'Prophètes & Messagers' },
  { id: 'compagnons', label: 'Compagnons (Sahaba)' },
  { id: 'femmes_illustres', label: "Femmes Illustres de l'Islam" },
  { id: 'savants_spirituels', label: 'Grands Savants & Sages' },
];

export const ISLAMIC_PEOPLE_BOOKS: IslamicPersonBook[] = [
  {
    id: 'prophete-muhammad-sira',
    name: 'Le Prophète Muhammad',
    honorific: 'ﷺ',
    arabicName: 'مُحَمَّدٌ رَسُولُ اللَّهِ ﷺ',
    title: "L'Envoyé de la Miséricorde pour les Mondes",
    category: 'prophetes',
    categoryLabel: 'Prophètes & Messagers',
    era: '570 – 632 apr. J.-C. (An 11 de l’Hégire)',
    region: 'La Mecque & Médine (Hedjaz)',
    readTime: '18 min',
    coverGradient: 'from-emerald-800 via-emerald-950 to-[#07150E]',
    badgeColor: 'emerald',
    shortSummary:
      "Le récit lumineux du Sceau des Prophètes : de son enfance d'orphelin à La Mecque sous le surnom d'Al-Amîn (le Digne de confiance) jusqu'à la Révélation du Noble Coran, sa patience face à l'adversité et la fondation d'une communauté fraternelle.",
    virtues: ['Miséricorde universelle', 'Véracité (Al-Amîn)', 'Douceur & Pardon', 'Constance dans la foi'],
    arabicQuote: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ',
    frenchQuote: '« Et Nous ne t’avons envoyé qu’en miséricorde pour l’univers. »',
    quoteSource: 'Sourate Al-Anbiya (21), Verset 107',
    milestones: [
      { period: '570 (Année de l’Éléphant)', event: 'Naissance à La Mecque, orphelin de son père Abdullah.' },
      { period: '595 (25 ans)', event: 'Mariage béni avec Khadija bint Khuwaylid, renommé Al-Amîn pour son intégrité.' },
      { period: '610 (40 ans)', event: 'Première révélation dans la grotte de Hira : « Lis, au nom de ton Seigneur ! »' },
      { period: '622 (An 1 H.)', event: 'L’Hégire vers Médine et établissement du pacte de fraternité.' },
      { period: '630 (An 8 H.)', event: 'Retour pacifique à La Mecque et pardon général accordé aux Mecquois.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: "L'Orphelin de La Mecque et l'Homme Digne de Confiance",
        subtitle: 'Une jeunesse préservée par la Providence divine',
        paragraphs: [
          "Au cœur de la vallée aride de La Mecque, près du sanctuaire antique de la Kaaba bâti jadis par Ibrahim et Ismaël, naquit Muhammad fils d'Abdullah. Orphelin de père avant même de voir le jour, il fut confié selon la coutume des nobles mecquois à la nourrice Halima As-Sa'diyya dans le désert pur des Banu Sa'd, où sa demeure fut aussitôt enveloppée d'une bénédiction singulière.",
          "Très tôt éprouvé par la disparition de sa mère Amina, puis de son grand-père Abdul-Muttalib, il grandit sous la protection bienveillante de son oncle Abou Talib. Malgré la dureté de la vie d'orphelin, jamais il ne s'inclina devant les idoles de pierre ni ne participa aux frivolités de son époque. Berger dans sa jeunesse, puis commerçant d'une probité absolue, il gagna le cœur de tous les habitants de La Mecque qui le surnommèrent d'une seule voix : « As-Sâdiq Al-Amîn » — le Véridique, le Digne de confiance.",
          "À l'âge de trente-cinq ans, lorsque les tribus de Quraysh faillirent s'entre-déchirer pour l'honneur de replacer la Pierre Noire lors de la reconstruction de la Kaaba, c'est lui qu'elles choisirent comme arbitre. Il étendit son manteau sur le sol, y déposa la pierre et invita un représentant de chaque clan à soulever un coin de l'étoffe, éteignant ainsi la discorde par une sagesse qui unissait les cœurs."
        ],
      },
      {
        number: 'Chapitre II',
        title: 'La Lumière de la Grotte de Hira',
        subtitle: 'La descente de la Parole divine durant le mois de Ramadan',
        paragraphs: [
          "À mesure qu'il approchait de la quarantaine, son âme aspirait à la méditation et au silence. Il prenait quelques provisions et se retirait dans la grotte de Hira, au sommet du mont An-Nour (la Montagne de la Lumière), contemplant l'immensité du ciel étoilé et méditant sur le Créateur unique de l'univers.",
          "Durant une nuit bénie du mois de Ramadan, l'Ange Jibrîl (Gabriel) se présenta à lui et lui dit : « Lis ! (Iqra') ». Le Prophète ﷺ répondit humblement : « Je ne sais pas lire. » L'Ange le serra contre lui à trois reprises avant de réciter les premiers versets révélés du Coran : « Lis, au nom de ton Seigneur qui a créé, qui a créé l'homme d'une adhérence. Lis ! Ton Seigneur est le Très Noble, qui a enseigné par la plume. »",
          "Tremblant sous le poids de cette rencontre céleste, il redescendit vers son épouse Khadija en disant : « Couvrez-moi, couvrez-moi ! » Elle l'apaisa par des paroles devenues immortelles : « Jamais ! Par Allah, Dieu ne t'humiliera jamais, car tu maintiens les liens de parenté, tu portes le fardeau du faible, tu donnes à celui qui est démuni, tu honores l'hôte et tu secours les gens frappés par les épreuves de la vérité. »"
        ],
      },
      {
        number: 'Chapitre III',
        title: "La Patience dans l'Épreuve et l'Hégire vers Médine",
        subtitle: 'Treize années d’appel pacifique suivies de la fraternité médinoise',
        paragraphs: [
          "Pendant treize ans à La Mecque, l'appel à l'Unicité divine (Tawhid), à la justice sociale et à l'affranchissement des opprimés rencontra l'hostilité féroce des notables attachés à leurs privilèges. Ses compagnons les plus vulnérables subirent la torture, et son clan fut soumis pendant trois longues années à un blocus impitoyable dans le ravin d'Abou Talib.",
          "Pourtant, le Messager d'Allah ﷺ ne répondit jamais à l'injure par l'injure. Lorsqu'il fut autorisé à émigrer vers Yathrib — qui devint Al-Madînah Al-Munawwarah (la Ville Illuminée) — son premier souci fut de laisser Ali ibn Abi Talib à La Mecque afin de restituer intégralement les dépôts que ses propres persécuteurs continuaient de lui confier, tant ils avaient foi en son honnêteté.",
          "À Médine, il bâtit la mosquée de ses propres mains aux côtés des croyants, établit la fraternité sacrée entre les Émigrés (Muhâjirûn) et les Auxiliaires (Ansâr), et rédigea la Charte de Médine garantissant la justice, l'entraide et le respect mutuel entre toutes les composantes de la cité."
        ],
      },
      {
        number: 'Chapitre IV',
        title: "Le Grand Pardon et l'Héritage Éternel",
        subtitle: '« Allez, vous êtes libres ! »',
        paragraphs: [
          "En l'an 8 de l'Hégire, lorsqu'il entra à La Mecque à la tête de dix mille croyants, il ne leva pas la tête avec orgueil, mais courba son front si bas sur sa monture que sa barbe touchait presque la selle, en signe d'humilité et de gratitude envers Allah.",
          "Face aux chefs de Quraysh qui l'avaient combattu, chassé et persécuté pendant vingt ans, il leur demanda : « Ô gens de Quraysh, que pensez-vous que je vais faire de vous ? » Ils répondirent : « Du bien, car tu es un frère généreux, fils d'un frère généreux. » Il leur dit alors les mots mêmes du prophète Youssouf : « Point de reproche contre vous aujourd'hui ! Qu'Allah vous pardonne, Il est le plus Miséricordieux des miséricordieux. Allez, vous êtes libres ! »",
          "Toute sa vie demeura d'une simplicité bouleversante : il reprisa ses propres vêtements, aida sa famille dans les tâches domestiques, salua les enfants sur son passage et ne s'endormit jamais le ventre plein tandis qu'un voisin avait faim. Son exemple demeure une lampe vivante pour quiconque espère en Allah et au Jour dernier."
        ],
      },
    ],
    spiritualLesson:
      "La véritable noblesse prophétique unit la fermeté dans la vérité à la douceur infinie envers les créatures : pardonner quand on a le pouvoir de punir est le sommet de la grandeur morale.",
  },
  {
    id: 'ibrahim-khalil-allah',
    name: 'Ibrahim (Abraham)',
    honorific: 'عليه السلام',
    arabicName: 'إِبْرَاهِيمُ خَلِيلُ اللَّهِ',
    title: "L'Ami Intime d'Allah et Père des Prophètes",
    category: 'prophetes',
    categoryLabel: 'Prophètes & Messagers',
    era: 'Antiquité mésopotamienne & cananéenne',
    region: 'Mésopotamie, Palestine & La Mecque',
    readTime: '14 min',
    coverGradient: 'from-amber-800 via-stone-900 to-[#140E08]',
    badgeColor: 'amber',
    shortSummary:
      "L'histoire du patriarche du monothéisme pur (Hanîf) : sa méditation face aux astres, son courage seul face au brasier de Nemrod, sa confiance absolue dans la vallée désertique de Bakka et la construction de la Kaaba avec son fils Ismaël.",
    virtues: ['Tawakkul absolu', 'Hospitalité généreuse', 'Courage face au faux', 'Cœur sain (Qalb Salîm)'],
    arabicQuote: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    frenchQuote: '« Allah nous suffit ; Il est notre meilleur Garant ! »',
    quoteSource: 'Sourate Al-Imran (3), Verset 173',
    milestones: [
      { period: 'Jeunesse à Babel', event: 'Rejet des idoles et méditation sur les astres pour démontrer l’Unicité du Créateur.' },
      { period: 'Miracle du Feu', event: 'Jeté dans la fournaise ardente qui devient « fraîcheur et paix » sur ordre d’Allah.' },
      { period: 'Vallée de La Mecque', event: 'Installation de Hajar et du nourrisson Ismaël près de la source bénie de Zamzam.' },
      { period: 'Fondation du Sanctuaire', event: 'Élévation des assises de la Kaaba et appel universel au Pèlerinage (Hajj).' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: "La Quête de l'Éternel au Milieu des Idoles",
        subtitle: "Quand l'intelligence du cœur dépasse les statues de pierre",
        paragraphs: [
          "Dans la cité antique de Babylone où les hommes façonnaient de leurs propres mains des statues de bois et de pierre pour les adorer, le jeune Ibrahim reçut d'Allah une droiture intérieure et un discernement lumineux. Son propre père, Azar, sculptait ces idoles, mais Ibrahim interrogeait son peuple avec douceur et raison : « Comment adorez-vous ce qui n'entend pas, ne voit pas et ne peut vous être d'aucun secours ? »",
          "Pour éveiller la conscience de ses contemporains qui vénéraient également les corps célestes, il observa la nuit venue une étoile brillante, puis la lune, puis le soleil éclatant. À chaque fois que l'astre déclinait à l'horizon, il proclamait : « Je n'aime pas ceux qui disparaissent ! Je tourne mon visage exclusivement vers Celui qui a créé les cieux et la terre, et je ne suis point de ceux qui Lui donnent des associés. »"
        ],
      },
      {
        number: 'Chapitre II',
        title: 'La Fournaise Transformée en Jardin de Paix',
        subtitle: 'La parole de confiance qui traversa les siècles',
        paragraphs: [
          "Lorsque les habitants de la cité découvrirent leurs idoles brisées — à l'exception de la plus grande qu'Ibrahim avait laissée intacte pour leur prouver qu'elle ne pouvait ni parler ni se défendre — leur orgueil l'emporta sur leur raison. Incapables de répondre à la vérité de son argument, ils s'écrièrent : « Brûlez-le et secourez vos divinités ! »",
          "Ils amassèrent du bois pendant des jours et allumèrent un brasier si gigantesque que les oiseaux mêmes ne pouvaient survoler sa colonne de chaleur. Au moment où Ibrahim fut projeté vers les flammes au moyen d'une catapulte, il prononça avec une sérénité totale : « HasbunAllahu wa Ni'mal-Wakîl » (Allah me suffit, et quel excellent Protecteur !).",
          "À cet instant précis, le décret du Créateur des éléments descendit : « Ô feu, sois fraîcheur et salut (paix) pour Ibrahim ! » Les flammes ne consumèrent que les liens qui entravaient ses mains, et Ibrahim marcha sain et sauf au milieu du brasier devenu un jardin paisible."
        ],
      },
      {
        number: 'Chapitre III',
        title: 'Zamzam et l’Élévation des Fondations de la Kaaba',
        subtitle: 'Le sacrifice, la patience de Hajar et la Maison Sacrée',
        paragraphs: [
          "Sur ordre divin, Ibrahim conduisit son épouse Hajar et leur nouveau-né Ismaël dans la vallée désertique et sans végétation de Bakka (La Mecque). Alors qu'il s'éloignait, Hajar lui demanda : « Ô Ibrahim, est-ce Allah qui t'a ordonné de nous laisser ici ? » Lorsqu'il fit signe que oui, elle répondit avec une foi inébranlable : « Alors Il ne nous abandonnera jamais ! »",
          "De sa course ardente entre les collines de Safa et Marwa jaillit, sous les pieds du petit Ismaël, la source bénie de Zamzam. Des années plus tard, père et fils unirent leurs forces pour élever les fondations de la Kaaba en invoquant : « Seigneur, accepte ceci de notre part ! Car c'est Toi l'Audient, l'Omniscient. »"
        ],
      },
    ],
    spiritualLesson:
      "Lorsque le serviteur place sa confiance absolue en Allah dans l'épreuve la plus brûlante, ce qui semblait être une destruction certaine se transforme par la grâce divine en fraîcheur, en paix et en bénédiction pour les générations futures.",
  },
  {
    id: 'youssouf-ahsan-al-qasas',
    name: 'Youssouf (Joseph)',
    honorific: 'عليه السلام',
    arabicName: 'يُوسُفُ الصِّدِّيقُ عَلَيْهِ السَّلَامُ',
    title: 'La Plus Belle des Histoires : Du Puits au Trône',
    category: 'prophetes',
    categoryLabel: 'Prophètes & Messagers',
    era: 'Époque des Patriarches (Canaan & Égypte antique)',
    region: 'Canaan (Palestine) & Égypte',
    readTime: '16 min',
    coverGradient: 'from-teal-800 via-emerald-950 to-[#091815]',
    badgeColor: 'teal',
    shortSummary:
      "Le récit coranique complet de la belle patience (Sabr Jamîl) : la jalousie fraternelle, l'obscurité du puits, la droiture morale face à la tentation, l'injustice de la prison et l'élévation finale dans le pardon et la réconciliation.",
    virtues: ['Patience lumineuse (Sabr Jamîl)', 'Chasteté & Intégrité', 'Science & Sagesse', 'Pardon sans rancune'],
    arabicQuote: 'إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ',
    frenchQuote: '« Quiconque craint Allah et patiente... Allah ne fait jamais perdre la récompense des bienfaisants. »',
    quoteSource: 'Sourate Youssouf (12), Verset 90',
    milestones: [
      { period: 'Enfance à Canaan', event: 'Vision des onze étoiles, du soleil et de la lune se prosternant devant lui.' },
      { period: 'Épreuve du Puits', event: 'Abandonné au fond d’un puits par ses frères, puis emmené par une caravane vers l’Égypte.' },
      { period: 'Épreuve du Palais & Prison', event: 'Préfère la prison à la désobéissance envers Allah et devient une lumière pour ses compagnons de cellule.' },
      { period: 'Intendant d’Égypte', event: 'Sauve l’Égypte et les contrées voisines de sept années de famine grâce à sa gestion juste.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: "Le Rêve Étoilé et l'Obscurité du Puits",
        subtitle: "Quand l'épreuve cache le début du plan divin",
        paragraphs: [
          "Fils bien-aimé du prophète Ya'qoub (Jacob), le jeune Youssouf confia un matin à son père : « Ô mon père, j'ai vu onze étoiles, ainsi que le soleil et la lune ; je les ai vus se prosterner devant moi. » Son père reconnut aussitôt les signes d'une élection divine et lui recommanda la discrétion, craignant que le démon ne sème la jalousie dans le cœur de ses demi-frères.",
          "Mais l'envie rongeait déjà ces derniers. Sous prétexte de l'emmener jouer dans les pâturages, ils le jetèrent au fond d'un puits solitaire et rapportèrent à leur père sa tunique tachée d'un faux sang. Tandis que Ya'qoub proclamait : « Une belle patience (Sabr Jamîl) ! C'est Allah dont on implore le secours », Allah rassura le cœur de l'enfant au fond du puits."
        ],
      },
      {
        number: 'Chapitre II',
        title: 'LaFidélité dans le Palais et la Lumière en Prison',
        subtitle: 'La liberté intérieure de celui qui craint Allah',
        paragraphs: [
          "Recueilli par une caravane et vendu pour quelques pièces d'argent en Égypte, Youssouf grandit dans la demeure du grand dignitaire Al-Azîz. Doté d'une beauté éclatante et d'une noblesse d'âme rare, il fut confronté à la séduction pressante de l'épouse de son maître. Malgré les portes verrouillées, il refusa la trahison en disant : « Qu'Allah me protège ! Mon maître m'a accordé un bon séjour, et les injustes ne réussissent pas. »",
          "Injustement emprisonné pendant de longues années bien que son innocence eût été constatée par des preuves évidentes, il ne se laissa jamais abattre par l'amertume. Dans l'ombre de la prison, les détenus témoignèrent de sa bonté : « Nous voyons que tu es véritablement du nombre des bienfaisants. »"
        ],
      },
      {
        number: 'Chapitre III',
        title: 'LaSagesse Royale et le Pardon Fraternel',
        subtitle: 'De la cellule à la gouvernance juste de l’Égypte',
        paragraphs: [
          "Lorsque le roi d'Égypte vit en songe sept vaches grasses dévorées par sept vaches maigres et sept épis verts à côté de sept autres desséchés, seul Youssouf put en révéler le sens et proposer un plan de prévoyance pour sauver tout le pays de la famine. Avant d'accepter toute charge, il tint à ce que son honneur fût publiquement lavé de toute calomnie.",
          "Des années plus tard, lorsque ses frères vinrent d'une terre frappée par la disette implorer des vivres et finirent par reconnaître celui qu'ils avaient jeté dans le puits, Youssouf ne chercha aucune vengeance. Il leur tendit les bras en disant : « Pas de reproche contre vous aujourd'hui ! Qu'Allah vous pardonne. » Et la famille entière fut réunie dans la gratitude et la paix."
        ],
      },
    ],
    spiritualLesson:
      "Aucune fosse creusée par la jalousie des hommes ne peut empêcher l'élévation que Dieu a écrite pour celui qui garde son cœur pur, patient et fidèle.",
  },
  {
    id: 'khadija-bint-khuwaylid',
    name: 'Khadija bint Khuwaylid',
    honorific: 'رضي الله عنها',
    arabicName: 'خَدِيجَةُ بِنْتُ خُوَيْلِدٍ رَضِيَ اللَّهُ عَنْهَا',
    title: 'La Première Croyante et Mère des Croyants',
    category: 'femmes_illustres',
    categoryLabel: "Femmes Illustres de l'Islam",
    era: '555 – 619 apr. J.-C. (10e année de la Prophétie)',
    region: 'La Mecque',
    readTime: '12 min',
    coverGradient: 'from-rose-900 via-stone-900 to-[#1A0D12]',
    badgeColor: 'rose',
    shortSummary:
      "Surnommée At-Tâhirah (la Pure) avant même l'avènement de l'Islam, elle fut la première personne sur terre à croire au message prophétique, offrant son cœur, sa sagesse et toute sa fortune pour soutenir la Vérité naissante.",
    virtues: ['Première croyante', 'Soutien indéfectible', 'Générosité totale', 'Sagesse & Noblesse'],
    arabicQuote: 'آمَنَتْ بِي إِذْ كَفَرَ بِي النَّاسُ',
    frenchQuote: '« Elle a cru en moi quand les gens m’ont renié, et m’a soutenu de ses biens quand les gens m’ont privé. »',
    quoteSource: 'Hadith authentique — Musnad Ahmad',
    milestones: [
      { period: 'Avant la Prophétie', event: 'Surnommée At-Tâhirah (la Pure) et grande commerçante respectée de Quraysh.' },
      { period: '595 apr. J.-C.', event: 'Union bénie avec Muhammad ﷺ après avoir admiré sa loyauté et sa noblesse de caractère.' },
      { period: '610 apr. J.-C.', event: 'Première personne à embrasser l’Islam sans la moindre hésitation le jour de la Révélation.' },
      { period: '616 – 619 apr. J.-C.', event: 'Endure trois années de blocus dans le ravin d’Abou Talib aux côtés des croyants.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: 'La Pure de La Mecque et le Choix de la Vertu',
        subtitle: "Une femme d'honneur, de clairvoyance et de dignité",
        paragraphs: [
          "Issue de la plus haute noblesse de Quraysh, Khadija bint Khuwaylid était connue dans toute La Mecque pour sa pureté morale — qui lui valut le titre d'At-Tâhirah — ainsi que pour son intelligence remarquable dans la gestion de ses caravanes commerciales qui voyageaient vers la Syrie et le Yémen.",
          "Alors que les plus riches notables de la cité briguaient sa main, elle cherchait avant tout la droiture de l'âme. Ayant entendu parler de l'honnêteté exemplaire de Muhammad ﷺ, elle lui confia ses marchandises avec son serviteur Maysarah. Au retour du voyage, devant la bénédiction exceptionnelle des échanges et le récit du comportement noble de Muhammad, elle reconnut en lui l'époux d'une vie."
        ],
      },
      {
        number: 'Chapitre II',
        title: "Le Premier Refuge de l'Islam",
        subtitle: 'La certitude qui apaisa le Messager au jour de Hira',
        paragraphs: [
          "Pendant quinze années d'une vie conjugale emplie de tendresse et de respect mutuel, Khadija fut la confidente attentive de son époux. Lorsque survint le bouleversement de la première révélation dans la grotte de Hira, elle n'eut pas une seconde de doute : elle l'enveloppa, le rassura et lui rappela que Dieu n'abandonne jamais celui qui fait le bien.",
          "Elle le conduisit auprès de son cousin érudit Waraqa ibn Nawfal, qui confirma que l'Ange descendu sur la montagne était bien le confident céleste envoyé jadis à Moïse. Ce jour-là, Khadija devint la toute première croyante de la communauté musulmane, priant en secret aux côtés du Prophète ﷺ face à la Kaaba."
        ],
      },
      {
        number: 'Chapitre III',
        title: 'Le Sacrifice dans le Ravin et le Salut Céleste',
        subtitle: 'Une demeure de perles au Paradis sans bruit ni fatigue',
        paragraphs: [
          "Lorsque les clans mecquois décrétèrent le boycott total contre les croyants et les Banu Hashim, Khadija quitta sans hésiter sa demeure confortable pour partager la faim, le froid et la chaleur étouffante du ravin d'Abou Talib pendant trois années, dépensant l'intégralité de sa fortune pour nourrir les faibles et affranchir les persécutés.",
          "Un jour, l'Ange Jibrîl descendit dire au Prophète ﷺ : « Ô Messager d'Allah, voici Khadija qui vient à toi avec un récipient contenant de la nourriture. Lorsqu'elle arrivera, transmets-lui le Salut (Salâm) de la part de son Seigneur et de ma part, et annonce-lui la bonne nouvelle d'un palais de perles creuses au Paradis, où il n'y aura ni vacarme ni fatigue. »"
        ],
      },
    ],
    spiritualLesson:
      "Être le premier soutien d'une cause juste à l'heure où le monde entier doute est un acte d'amour et de foi que ni le temps ni l'au-delà n'oublient jamais.",
  },
  {
    id: 'abou-bakr-as-siddiq',
    name: 'Abou Bakr As-Siddiq',
    honorific: 'رضي الله عنه',
    arabicName: 'أَبُو بَكْرٍ الصِّدِّيقُ رَضِيَ اللَّهُ عَنْهُ',
    title: 'Le Véridique et le Deuxième de la Grotte',
    category: 'compagnons',
    categoryLabel: 'Compagnons (Sahaba)',
    era: '573 – 634 apr. J.-C. (An 13 de l’Hégire)',
    region: 'La Mecque & Médine',
    readTime: '15 min',
    coverGradient: 'from-emerald-900 via-teal-950 to-[#0B1914]',
    badgeColor: 'emerald',
    shortSummary:
      "L'ami fidèle du Prophète ﷺ, celui qui affranchit Bilal et les opprimés de La Mecque, accompagna le Messager dans la grotte de Thawr durant l'Hégire et maintint la communauté unie avec douceur et fermeté en tant que premier Calife.",
    virtues: ['Foi sans hésitation (As-Siddîq)', 'Affranchissement des faibles', 'Amitié sacrée', 'Humilité du dirigeant'],
    arabicQuote: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
    frenchQuote: '« Ne t’afflige pas, car Allah est avec nous ! »',
    quoteSource: 'Sourate At-Tawbah (9), Verset 40',
    milestones: [
      { period: 'Début de la Révélation', event: 'Premier homme adulte libre à embrasser l’Islam sans aucune hésitation.' },
      { period: 'Années mecquoises', event: 'Dépense sa fortune pour racheter et libérer Bilal ibn Rabah et les esclaves torturés.' },
      { period: '622 (Hégire)', event: 'Compagnon de la grotte de Thawr, immortalisé dans le Noble Coran.' },
      { period: '632 – 634 (Califat)', event: 'Premier Calife bien-guidé, rassemble le premier manuscrit complet (Mushaf) du Coran.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: "La Foi qui ne Hésita Pas un Seul Instant",
        subtitle: "Pourquoi il fut surnommé As-Siddîq (le Véridique)",
        paragraphs: [
          "Le Prophète ﷺ a dit un jour : « Je n'ai appelé personne à l'Islam sans qu'il n'ait eu d'abord un moment de retenue ou d'hésitation, à l'exception d'Abou Bakr ibn Abi Quhafa. » Dès que son ami d'enfance lui annonça la Révélation, Abou Bakr embrassa la foi avec une clarté immédiate et devint lui-même la cause de la conversion d'Othman ibn Affan, de Zubayr, de Talha et d'Abdurrahman ibn Awf.",
          "Au lendemain du Voyage Nocturne (Al-Isrâ' wal-Mi'râj), lorsque des moqueurs accoururent vers lui en pensant ébranler sa foi : « Ton compagnon prétend être allé à Jérusalem et en être revenu en une seule nuit ! », Abou Bakr répondit calmement : « S'il l'a dit, alors il dit vrai ! Je le crois pour plus extraordinaire encore : je le crois pour les nouvelles du Ciel qui lui viennent matin et soir. » C'est depuis ce jour qu'il porta le titre d'As-Siddîq."
        ],
      },
      {
        number: 'Chapitre II',
        title: 'Le Libérateur des Opprimés et le Compagnon de la Grotte',
        subtitle: "L'amour qui protège et la sérénité sous le regard divin",
        paragraphs: [
          "À La Mecque, Abou Bakr utilisait ses biens pour racheter et rendre la liberté aux plus faibles : Bilal ibn Rabah, Amir ibn Fuhayra, Umm Ubays et Zinnira. Lorsque son propre père lui dit : « Mon fils, je vois que tu n'affranchis que des gens faibles ; pourquoi n'affranchis-tu pas des hommes robustes qui pourraient te défendre ? », Abou Bakr répondit : « Ô mon père, je ne recherche que la récompense auprès d'Allah ! »",
          "Lors de l'Hégire, il pleura de joie en apprenant qu'il accompagnerait le Prophète ﷺ sur la route de Médine. Dans la grotte de Thawr, alors que les poursuivants se tenaient juste au-dessus d'eux, il trembla non pour sa propre vie mais pour celle du Messager d'Allah. C'est là que descendit le verset éternel : « Quand ils étaient dans la grotte et qu'il disait à son compagnon : Ne t'afflige pas, car Allah est avec nous. »"
        ],
      },
      {
        number: 'Chapitre III',
        title: 'LeDiscours d’Investiture et la Garde du Livre',
        subtitle: 'Le fort chez vous est faible auprès de moi jusqu’à ce que je prenne le droit du faible',
        paragraphs: [
          "Porté à la tête de la communauté après le rappel à Dieu du Prophète ﷺ, Abou Bakr prononça un discours qui posa les fondements de l'éthique du pouvoir en Islam : « Ô gens ! J'ai été désigné pour vous diriger alors que je ne suis pas le meilleur d'entre vous. Si j'agis bien, aidez-moi ; et si je m'égare, redressez-moi. Le faible parmi vous est fort auprès de moi jusqu'à ce que je lui rende son droit, s'il plaît à Allah ; et le fort parmi vous est faible auprès de moi jusqu'à ce que je prenne de lui le droit d'autrui. »",
          "Malgré sa fonction de Calife, il continua à traire les brebis des orphelines de son quartier et veilla à la compilation scrupuleuse des feuillets du Noble Coran en un recueil préservé pour toutes les générations."
        ],
      },
    ],
    spiritualLesson:
      "La sincérité du cœur se reconnaît à sa fidélité dans l'épreuve et à sa générosité silencieuse envers ceux qui n'ont rien à rendre en retour.",
  },
  {
    id: 'oumar-ibn-al-khattab',
    name: 'Oumar ibn Al-Khattab',
    honorific: 'رضي الله عنه',
    arabicName: 'عُمَرُ بْنُ الْخَطَّابِ الْفَارُوقُ رَضِيَ اللَّهُ عَنْهُ',
    title: 'Al-Farouq : Le Modèle Éternel de la Justice et de la Piété',
    category: 'compagnons',
    categoryLabel: 'Compagnons (Sahaba)',
    era: '584 – 644 apr. J.-C. (An 23 de l’Hégire)',
    region: 'La Mecque, Médine & Jérusalem',
    readTime: '17 min',
    coverGradient: 'from-amber-900 via-emerald-950 to-[#0C1712]',
    badgeColor: 'amber',
    shortSummary:
      "Comment un homme redouté de La Mecque eut le cœur transpercé par la lecture de la Sourate Ta-Ha pour devenir Al-Farouq (celui qui discerne le vrai du faux), un dirigeant qui portait lui-même des sacs de farine la nuit aux familles démunies.",
    virtues: ['Justice incorruptible', 'Crainte révérencielle d’Allah', 'Service nocturne des pauvres', 'Courage pour la vérité'],
    arabicQuote: 'حَكَمْتَ فَعَدَلْتَ فَأَمِنْتَ فَنِمْتَ يَا عُمَرُ',
    frenchQuote: '« Tu as gouverné avec justice, tu as eu la paix du cœur, et tu as pu dormir en sécurité, ô Oumar ! »',
    quoteSource: 'Parole de l’émissaire perse voyant Oumar dormir sans garde sous un arbre',
    milestones: [
      { period: 'An 6 de la Prophétie', event: 'Conversion bouleversante après avoir lu les premiers versets de la Sourate Ta-Ha chez sa sœur Fatima.' },
      { period: '622 (Hégire)', event: 'Émigre vers Médine au grand jour en défiant quiconque d’oser l’arrêter.' },
      { period: '634 – 644 (Califat)', event: 'Établit le registre social (Dîwân), les pensions pour les enfants et les rondes nocturnes d’entraide.' },
      { period: '637 (Jérusalem)', event: 'Entre à Jérusalem à pied, tenant la bride du chameau sur lequel montait son serviteur.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: 'Les Versets de la Sourate Ta-Ha qui Ouvrirent un Cœur',
        subtitle: "Quand l'invocation du Prophète ﷺ fut exaucée",
        paragraphs: [
          "Le Messager d'Allah ﷺ avait invoqué : « Ô Allah ! Renforce l'Islam par celui des deux hommes que Tu aimes le plus : Oumar ibn Al-Khattab ou Amr ibn Hisham. » Un jour, Oumar sortit l'épée à la main, mais apprit en chemin que sa propre sœur Fatima et son beau-frère Sa'îd ibn Zayd avaient embrassé l'Islam.",
          "Arrivé chez eux alors qu'ils récitaient le Coran, il fut touché par la dignité calme de sa sœur. Après s'être purifié, il prit le feuillet et lut : « Ta-Ha. Nous n'avons point fait descendre sur toi le Coran pour que tu sois malheureux, mais seulement comme un rappel pour celui qui craint Allah... Certes, c'est Moi Allah : point de divinité que Moi. Adore-Moi donc et accomplis la prière pour te souvenir de Moi. »",
          "Les larmes coulèrent sur ses joues. Il s'écria : « Que cette parole est belle et noble ! Indiquez-moi où se trouve Muhammad ! » Ce jour-là, les musulmans purent pour la première fois prier ouvertement autour de la Kaaba."
        ],
      },
      {
        number: 'Chapitre II',
        title: 'Le Sac de Farine dans la Nuit de Médine',
        subtitle: '« Porteras-tu mon fardeau au Jour de la Résurrection ? »',
        paragraphs: [
          "Devenu Calife d'un territoire immense, Oumar vivait avec une austérité qui stupéfiait les ambassadeurs étrangers : sa tunique comptait plus de douze pièces rapiécées. Chaque nuit, accompagné de son serviteur Aslam, il parcourait incognito les faubourgs de Médine pour s'assurer que personne n'était dans le besoin.",
          "Une nuit, il aperçut au loin le feu d'une tente. En s'approchant, il vit une femme entourée d'enfants qui pleuraient de faim ; pour les calmer jusqu'à ce qu'ils s'endorment, elle faisait bouillir de l'eau avec des cailloux dans une marmite en se plaignant de l'inattention d'Oumar.",
          "Bouleversé, Oumar courut jusqu'à l'entrepôt des vivres (Bayt Al-Mâl), chargea lui-même un lourd sac de farine et de graisse sur son propre dos. Lorsque Aslam voulut le porter à sa place, Oumar lui dit : « Porteras-tu donc mes péchés à ma place au Jour du Jugement ? » Il revint à la tente, souffla lui-même sous la marmite jusqu'à ce que la fumée traversât sa barbe, fit cuire le repas et ne repartit qu'après avoir vu les enfants rire et manger à leur faim."
        ],
      },
      {
        number: 'Chapitre III',
        title: 'L’Entrée à Jérusalem et la Charte de Paix',
        subtitle: 'Le dirigeant à pied et le serviteur sur la monture',
        paragraphs: [
          "Lorsque les habitants de Jérusalem demandèrent à remettre les clés de la ville au Calife en personne, Oumar quitta Médine avec un seul serviteur et un seul chameau qu'ils montaient à tour de rôle, à distance égale. Au moment d'atteindre les portes de Jérusalem, le tour de monter revenait au serviteur.",
          "Malgré l'insistance de ce dernier, Oumar refusa de changer cet ordre équitable et entra dans la cité à pied, les pieds couverts de boue, tenant par la bride la monture où était assis son serviteur. Il accorda aux habitants la célèbre garantie d'Oumar (Al-'Uhdah Al-'Umariyyah), protégeant leurs vies, leurs biens et leurs lieux de culte."
        ],
      },
    ],
    spiritualLesson:
      "La vraie grandeur d'un responsable ne se mesure pas aux honneurs qu'il reçoit, mais à sa crainte de devoir rendre compte devant Dieu de la moindre injustice commise sous sa garde.",
  },
  {
    id: 'bilal-ibn-rabah',
    name: 'Bilal ibn Rabah',
    honorific: 'رضي الله عنه',
    arabicName: 'بِلَالُ بْنُ رَبَاحٍ مُؤَذِّنُ الرَّسُولِ ﷺ',
    title: "La Voix de l'Unicité et Premier Muezzin de l'Islam",
    category: 'compagnons',
    categoryLabel: 'Compagnons (Sahaba)',
    era: '580 – 640 apr. J.-C. (An 20 de l’Hégire)',
    region: 'La Mecque, Médine & Damas',
    readTime: '13 min',
    coverGradient: 'from-stone-800 via-emerald-950 to-[#081510]',
    badgeColor: 'emerald',
    shortSummary:
      "Né dans l'esclavage mais libre dans son âme, son cri « Ahad, Ahad ! » (Dieu est Unique) sous le soleil brûlant de La Mecque brisa les chaînes de l'oppression avant que sa voix mélodieuse ne devienne le premier Adhan de l'histoire.",
    virtues: ['Foi indomptable (Ahad, Ahad)', 'Dignité & Égalité humaine', 'Pureté des ablutions', 'Amour ardent du Prophète ﷺ'],
    arabicQuote: 'أَحَدٌ... أَحَدٌ',
    frenchQuote: '« L’Unique... L’Unique ! »',
    quoteSource: 'Parole de Bilal ibn Rabah sous l’épreuve du rocher brûlant à La Mecque',
    milestones: [
      { period: 'Premiers jours de l’Islam', event: 'Parmi les sept premières personnes à déclarer publiquement leur foi à La Mecque.' },
      { period: 'Affranchissement', event: 'Racheté et libéré par Abou Bakr As-Siddiq, que les compagnons appelaient « Notre maître qui a libéré notre maître ».' },
      { period: 'An 1 de l’Hégire', event: 'Désigné par le Prophète ﷺ comme le tout premier Muezzin de l’Islam à Médine.' },
      { period: 'An 8 de l’Hégire', event: 'Monte sur le toit de la Kaaba pour lancer l’appel à la prière devant toute La Mecque.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: 'Le Rocher Brûlant et le Cri de la Liberté Intérieure',
        subtitle: "Quand une âme enchaînée est plus libre que son oppresseur",
        paragraphs: [
          "Fils d'une mère abyssine nommée Hamâmah, Bilal ibn Rabah était esclave à La Mecque chez Umayyah ibn Khalaf. Lorsque la lumière de l'Islam toucha son cœur — un message qui proclamait qu'aucun Arabe n'est supérieur à un non-Arabe, ni un Blanc à un Noir, si ce n'est par la piété — Bilal embrassa la foi avec toute la force de son âme.",
          "Furieux de voir un esclave refuser d'adorer les idoles de son clan, Umayyah le faisait traîner à l'heure de midi sur le sable incandescent de la vallée de La Mecque et faisait déposer un lourd rocher brûlant sur sa poitrine en lui ordonnant de renier Dieu. Mais de la poitrine oppressée de Bilal ne s'élevait qu'un seul mot, calme et invincible : « Ahad... Ahad ! » (L'Unique... L'Unique !).",
          "Abou Bakr As-Siddiq passa devant cette scène, racheta Bilal au prix fort et l'affranchit immédiatement pour la face d'Allah. Plus tard, Oumar ibn Al-Khattab disait avec respect : « Abou Bakr est notre maître, et il a affranchi notre maître (Bilal) ! »"
        ],
      },
      {
        number: 'Chapitre II',
        title: "Le Premier Adhan et les Pas Entendus au Paradis",
        subtitle: "La voix qui appelait les cœurs vers le succès",
        paragraphs: [
          "À Médine, lorsque l'appel à la prière (Adhan) fut institué après la vision véridique d'Abdullah ibn Zayd, le Prophète ﷺ dit : « Lève-toi avec Bilal et enseigne-lui ces paroles afin qu'il lance l'appel, car sa voix est plus mélodieuse et porte plus loin que la tienne. » Ainsi résonna dans le ciel de Médine le premier Adhan de l'histoire.",
          "Un matin, après la prière de l'aube (Fajr), le Messager d'Allah ﷺ demanda : « Ô Bilal, parle-moi de l'œuvre la plus pleine d'espérance que tu aies accomplie en Islam, car j'ai entendu le bruit de tes sandales devant moi au Paradis ! » Bilal répondit avec humilité : « Je n'ai accompli aucune œuvre plus porteuse d'espérance à mes yeux que le fait que je ne me purifie jamais (ablutions), de jour comme de nuit, sans prier par cette purification autant qu'il m'est écrit de prier. »"
        ],
      },
      {
        number: 'Chapitre III',
        title: 'Sur le Toit de la Kaaba et le Dernier Appel à Médine',
        subtitle: "L'égalité consacrée et la fidélité au-delà de la vie",
        paragraphs: [
          "Le jour de l'ouverture pacifique de La Mecque, le Prophète ﷺ appela Bilal — l'ancien esclave jadis torturé dans ces mêmes rues — et lui demanda de monter sur le toit de la Kaaba pour lancer l'appel à la prière, scellant à jamais l'égalité de tous les êtres humains devant Dieu.",
          "Après le rappel à Dieu du Prophète ﷺ, le cœur de Bilal était si étreint par le chagrin qu'il ne parvenait plus à prononcer « Ash-hadu anna Muhammadan Rasûlullâh » sans éclater en sanglots. Lorsqu'il revint une dernière fois visiter Médine depuis la Syrie et accepta d'appeler à la prière à la demande d'Al-Hassan et Al-Hussayn, toute la cité de Médine sortit de ses maisons en pleurant au souvenir du temps du Messager ﷺ."
        ],
      },
    ],
    spiritualLesson:
      "L'Islam élève les êtres par la pureté de leur foi et de leurs actes : ni l'origine sociale ni la couleur de la peau ne comptent devant Allah, mais uniquement la sincérité du cœur.",
  },
  {
    id: 'maryam-bint-imran',
    name: 'Maryam bint Imran',
    honorific: 'عليها السلام',
    arabicName: 'مَرْيَمُ بِنْتُ عِمْرَانَ الصِّدِّيقَةُ',
    title: 'La Femme Choisie et Purifiée au-dessus des Mondes',
    category: 'femmes_illustres',
    categoryLabel: "Femmes Illustres de l'Islam",
    era: 'Ier siècle av. J.-C. (Palestine antique)',
    region: 'Bayt Al-Maqdis (Jérusalem) & Bethléem',
    readTime: '13 min',
    coverGradient: 'from-cyan-900 via-teal-950 to-[#071618]',
    badgeColor: 'teal',
    shortSummary:
      "La seule femme nommée par son propre nom dans le Noble Coran, à qui une sourate entière est dédiée : son recueillement dans le Mihrab sous la garde du prophète Zakariyya et la naissance miraculeuse de Issa (Jésus) عليه السلام.",
    virtues: ['Dévotion pure (Qunût)', 'Pudeur & Chasteté', 'Véracité (As-Siddîqah)', 'Abandon confiant à Dieu'],
    arabicQuote: 'يَا مَرْيَمُ إِنَّ اللَّهَ اصْطَفَاكِ وَطَهَّرَكِ وَاصْطَفَاكِ عَلَىٰ نِسَاءِ الْعَالَمِينَ',
    frenchQuote: '« Ô Maryam, certes Allah t’a élue, t’a purifiée et t’a choisie au-dessus des femmes des mondes. »',
    quoteSource: 'Sourate Al-Imran (3), Verset 42',
    milestones: [
      { period: 'Naissance bénie', event: 'Vouée au service de Dieu dès le ventre de sa mère Hannah, épouse de Imran.' },
      { period: 'Retraite au Mihrab', event: 'Élevée sous la tutelle du prophète Zakariyya et nourrie de fruits célestes hors saison.' },
      { period: 'Annonce de l’Ange', event: 'L’Ange Jibrîl lui annonce la naissance pure et miraculeuse d’un fils béni : Issa (Jésus).' },
      { period: 'Miracle du Berceau', event: 'Sous le palmier, puis devant son peuple où le nouveau-né parle au berceau pour proclamer l’honneur de sa mère.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: 'Le Vœu de la Mère de Maryam et le Sanctuaire du Mihrab',
        subtitle: '« Cela vient d’Allah : Il attribue Sa subsistance à qui Il veut sans compter »',
        paragraphs: [
          "L'épouse de Imran fit le vœu sincère de consacrer l'enfant qu'elle portait au service exclusif du Temple de Jérusalem. Lorsqu'elle mit au monde une fille, elle la nomma Maryam et implora : « Je la place, ainsi que sa descendance, sous Ta protection contre le diable banni. » Allah accueillit l'enfant d'un bel accueil et la fit grandir sous la garde du prophète Zakariyya (Zacharie).",
          "Dans son oratoire (Mihrab), Maryam passait ses journées et ses nuits en prière. Chaque fois que Zakariyya entrait auprès d'elle, il trouvait près d'elle des fruits d'été en plein hiver et des fruits d'hiver en plein été. Lorsqu'il lui demanda : « Ô Maryam, d'où te vient cela ? », elle répondit avec une foi limpide : « Cela vient d'Allah. Certes, Allah attribue Sa subsistance à qui Il veut, sans compter. »"
        ],
      },
      {
        number: 'Chapitre II',
        title: 'L’Épreuve du Palmier et la Parole de l’Enfant au Berceau',
        subtitle: "Quand le silence prescrit par Dieu laisse éclater le miracle de la vérité",
        paragraphs: [
          "Par le souffle et la Parole créatrice d'Allah (« Sois ! et il est »), Maryam conçut miraculeusement son fils Issa (Jésus) sans qu'aucun homme ne l'eût touchée. À l'approche de l'accouchement, la douleur et l'angoisse du regard des hommes la conduisirent près du tronc d'un palmier desséché. Une voix l'apaisa alors : un ruisseau d'eau fraîche jaillit à ses pieds, et en secouant le tronc du palmier, des dattes mûres et fraîches tombèrent vers elle.",
          "Sur ordre divin, elle fit vœu de silence devant les hommes lorsqu'elle revint vers son peuple portant son enfant. Quand les gens s'étonnèrent et la questionnèrent, elle fit simplement signe vers le nourrisson. L'enfant parla alors depuis son berceau : « Je suis vraiment le serviteur d'Allah. Il m'a donné le Livre et m'a désigné Prophète. Où que je sois, Il m'a rendu béni ; et Il m'a recommandé, tant que je vivrai, la prière et la Zakat, et la bonté envers ma mère. »"
        ],
      },
    ],
    spiritualLesson:
      "La pureté de l'intention et la dévotion sincère attirent le secours d'Allah là où les causes humaines semblent épuisées : même le tronc sec laisse tomber des fruits pour l'âme qui s'en remet à Lui.",
  },
  {
    id: 'aicha-bint-abi-bakr',
    name: 'Aïcha bint Abi Bakr',
    honorific: 'رضي الله عنها',
    arabicName: 'عَائِشَةُ أُمُّ الْمُؤْمِنِينَ رَضِيَ اللَّهُ عَنْهَا',
    title: "L'Océan du Savoir et Mère des Croyants",
    category: 'femmes_illustres',
    categoryLabel: "Femmes Illustres de l'Islam",
    era: '614 – 678 apr. J.-C. (An 58 de l’Hégire)',
    region: 'La Mecque & Médine',
    readTime: '14 min',
    coverGradient: 'from-purple-950 via-stone-900 to-[#110C18]',
    badgeColor: 'purple',
    shortSummary:
      "Épouse du Prophète ﷺ et fille d'Abou Bakr As-Siddiq, elle fut l'une des plus grandes savantes de l'histoire islamique, enseignant le Tafsir, le Hadith, la jurisprudence et la médecine aux compagnons et à la génération suivante.",
    virtues: ['Érudition & Mémoire prodigieuse', 'Transmission du Hadith (2 210 récits)', 'Générosité envers les pauvres', 'Éloquence & Sagesse juridique'],
    arabicQuote: 'مَا أَشْكَلَ عَلَيْنَا أَصْحَابَ رَسُولِ اللَّهِ حَدِيثٌ قَطُّ فَسَأَلْنَا عَائِشَةَ إِلَّا وَجَدْنَا عِنْدَهَا مِنْهُ عِلْمًا',
    frenchQuote: '« Jamais une question ne nous a paru complexe à nous, Compagnons du Messager d’Allah, sans que nous n’interrogions Aïcha et ne trouvions auprès d’elle une science à ce sujet. »',
    quoteSource: 'Témoignage du compagnon Abou Moussa Al-Ash’ari (Tirmidhi)',
    milestones: [
      { period: 'Vie auprès du Prophète ﷺ', event: 'Témoin privilégiée de l’enseignement prophétique, des adorations nocturnes et de la vie quotidienne du Messager.' },
      { period: 'Sourate An-Nour', event: 'Son honneur et son innocence sont proclamés pour l’éternité dans les versets de la Sourate La Lumière (24).' },
      { period: 'École de Médine', event: 'Devient la référence scientifique majeure de Médine pendant près de cinquante ans.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: "La Mémoire Vivante de la Maison Prophétique",
        subtitle: "Quand le foyer devient la plus grande université du savoir",
        paragraphs: [
          "Douée dès son plus jeune âge d'une intelligence vive, d'une mémoire exceptionnelle et d'un esprit analytique qui cherchait toujours à comprendre le « pourquoi » de chaque règle spirituelle, Aïcha bint Abi Bakr recueillit directement de la source prophétique un trésor inestimable de connaissances.",
          "Grâce à elle, la communauté musulmane a reçu non seulement plus de deux mille deux cents hadiths authentiques, mais surtout l'explication fine des actes d'adoration accomplis dans l'intimité du foyer : la prière nocturne (Qiyâm Al-Layl) du Prophète ﷺ, sa douceur, son éthique familiale et sa manière d'être, qu'elle résuma par cette parole célèbre : « Son caractère était le Coran. »"
        ],
      },
      {
        number: 'Chapitre II',
        title: "La Savante que Consultaient les Grands Compagnons",
        subtitle: 'Jurisprudence, poésie, histoire et médecine',
        paragraphs: [
          "Après le rappel à Dieu du Prophète ﷺ, la chambre d'Aïcha à Médine devint un phare de science où affluaient les savants, les juges, les femmes et les étudiants venus de toutes les régions. Derrière un rideau de pudeur, elle répondait aux questions juridiques les plus complexes, corrigeant avec rigueur et bienveillance les incompréhensions.",
          "Son neveu Urwah ibn Az-Zubayr, l'un des sept grands juristes de Médine, disait : « Je n'ai jamais vu quelqu'un de plus savant en jurisprudence (Fiqh), en médecine et en poésie qu'Aïcha. » Parallèlement à son savoir, son détachement des biens matériels était total : il lui arrivait de recevoir cent mille dirhams le matin et de tout distribuer aux nécessiteux avant le coucher du soleil, tout en jeûnant elle-même sans garder un seul dirham pour son propre repas du soir."
        ],
      },
    ],
    spiritualLesson:
      "L'Islam honore la quête du savoir chez l'homme comme chez la femme : une grande partie de notre compréhension de la Sunnah et du droit islamique repose sur l'érudition lumineuse de la Mère des Croyants.",
  },
  {
    id: 'salman-al-farisi',
    name: 'Salman Al-Farisi',
    honorific: 'رضي الله عنه',
    arabicName: 'سَلْمَانُ الْفَارِسِيُّ البَاحِثُ عَنِ الحَقِّ',
    title: 'Le Chercheur de Vérité à Travers les Terres',
    category: 'compagnons',
    categoryLabel: 'Compagnons (Sahaba)',
    era: 'VIe – VIIe siècle (An 35 de l’Hégire)',
    region: 'Ispahan (Perse), Syrie, Anatolie & Médine',
    readTime: '14 min',
    coverGradient: 'from-emerald-950 via-stone-900 to-[#0A1410]',
    badgeColor: 'emerald',
    shortSummary:
      "L'odyssée spirituelle extraordinaire d'un jeune noble perse qui quitta sa terre natale, servit de saints ermites à travers l'Orient, connut la trahison et l'esclavage avant de retrouver à Médine le Prophète attendu.",
    virtues: ['Quête sincère de la Vérité', 'Persévérance à travers les épreuves', 'Ingéniosité (Stratégie du Fossé)', 'Fraternité universelle'],
    arabicQuote: 'سَلْمَانُ مِنَّا أَهْلَ الْبَيْتِ',
    frenchQuote: '« Salman fait partie de nous, les gens de la Maison (Ahl Al-Bayt) ! »',
    quoteSource: 'Hadith authentique du Prophète ﷺ lors de la bataille du Fossé',
    milestones: [
      { period: 'Départ d’Ispahan', event: 'Quitte le confort familial en Perse pour chercher la religion pure d’Ibrahim.' },
      { period: 'Voyages en Syrie & Mossoul', event: 'Accompagne les derniers moines monothéistes qui lui annoncent la venue imminente d’un Prophète au pays des palmiers.' },
      { period: 'Arrivée à Médine', event: 'Reconnaît les trois signes de la prophétie chez Muhammad ﷺ et retrouve sa liberté grâce à l’entraide des compagnons.' },
      { period: 'An 5 H. (Al-Khandaq)', event: 'Propose de creuser le Fossé pour protéger Médine sans effusion de sang.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: 'Du Feu d’Ispahan aux Ermites du Levant',
        subtitle: "Quand l'âme refuse le confort pour chercher son Créateur",
        paragraphs: [
          "Fils d'un chef de village fortuné près d'Ispahan en Perse, Salman fut élevé dans la garde du feu sacré. Mais son cœur assoiffé de vérité pressentait qu'une religion plus haute existait. Quittant sa terre et ses privilèges, il voyagea vers la Syrie, puis Mossoul, Nisibis et Amorium, se mettant successivement au service d'érudits monothéistes pieux jusqu'à la mort de chacun d'eux.",
          "Sur son lit de mort, le dernier de ces sages lui confia : « Ô mon fils, il ne reste plus personne que je connaisse sur notre voie, mais le temps est venu où apparaîtra un Prophète envoyé avec la religion pure d'Ibrahim. Il émigrera vers une terre de palmiers située entre deux étendues de pierres volcaniques noires. Il possède trois signes : il n'accepte pas l'aumône (Sadaqah) pour lui-même, il accepte le cadeau (Hadiyyah), et il porte entre ses épaules le Sceau de la Prophétie. »"
        ],
      },
      {
        number: 'Chapitre II',
        title: 'Les Trois Signes à Médine et la Famille du Prophète ﷺ',
        subtitle: 'De l’esclavage injuste à la fraternité de la Maison Prophétique',
        paragraphs: [
          "Trahi en route par des caravaniers qui le vendirent comme esclave à Yathrib (Médine), Salman reconnut aussitôt les palmeraies entourées de roches noires décrites par son maître. Lorsque le Prophète ﷺ arriva à Médine lors de l'Hégire, Salman vint lui offrir des dattes en disant : « Ceci est une aumône. » Le Prophète ﷺ les fit manger à ses compagnons sans y toucher lui-même. Le lendemain, Salman apporta un plat en disant : « Ceci est un cadeau. » Le Prophète ﷺ en mangea avec ses compagnons. Puis, en voyant le Sceau de la Prophétie sur son épaule, Salman pleura d'émotion : sa longue quête avait enfin trouvé son port.",
          "Le Prophète ﷺ et les compagnons plantèrent de leurs propres mains trois cents jeunes palmiers pour racheter sa liberté. Lors du siège de Médine en l'an 5, c'est Salman qui proposa de creuser le Fossé (Al-Khandaq) pour protéger la ville. Tandis que les Émigrés et les Auxiliaires disaient chacun : « Salman est des nôtres ! », le Messager d'Allah ﷺ sourit et trancha : « Salman fait partie de nous, les gens de ma Maison (Ahl Al-Bayt) ! »"
        ],
      },
    ],
    spiritualLesson:
      "Quiconque cherche sincèrement la vérité avec un cœur loyal, Allah le guide jusqu'à la lumière, même s'il doit traverser des déserts et des années d'épreuves.",
  },
  {
    id: 'imam-al-bukhari',
    name: "L'Imam Al-Bukhari",
    honorific: 'رحمه الله',
    arabicName: 'الإِمَامُ مُحَمَّدُ بْنُ إِسْمَاعِيلَ البُخَارِيُّ',
    title: 'Le Gardien de la Parole Prophétique (Sahih Al-Bukhari)',
    category: 'savants_spirituels',
    categoryLabel: 'Grands Savants & Sages',
    era: '810 – 870 apr. J.-C. (194 – 256 de l’Hégire)',
    region: 'Boukhara, La Mecque, Médine, Bagdad & Samarcande',
    readTime: '13 min',
    coverGradient: 'from-amber-950 via-stone-900 to-[#120E0A]',
    badgeColor: 'amber',
    shortSummary:
      "De la guérison miraculeuse de sa vue dans l'enfance grâce aux invocations de sa mère jusqu'à ses seize années de voyages et de prières pour vérifier chaque hadith et compiler le recueil le plus authentique après le Noble Coran.",
    virtues: ['Rigueur scientifique absolue', 'Piété avant chaque écrit', 'Mémoire prodigieuse', 'Intégrité morale'],
    arabicQuote: 'مَا وَضَعْتُ فِي كِتَابِ الصَّحِيحِ حَدِيثًا إِلَّا اغْتَسَلْتُ قَبْلَ ذَلِكَ وَصَلَّيْتُ رَكْعَتَيْنِ',
    frenchQuote: '« Je n’ai inscrit aucun hadith dans mon livre As-Sahih sans m’être d’abord purifié par les grandes ablutions et avoir accompli deux unités de prière. »',
    quoteSource: 'Parole de l’Imam Muhammad ibn Isma’il Al-Bukhari',
    milestones: [
      { period: 'Enfance à Boukhara', event: 'Perd la vue enfant, puis la recouvre après les invocations incessantes de sa mère pieuse.' },
      { period: '16 ans (Pèlerinage)', event: 'Accomplit le Hajj avec sa mère et son frère, puis reste à La Mecque et Médine pour recueillir le savoir.' },
      { period: '16 années de compilation', event: 'Parcourt le monde musulman, écoute plus de mille maîtres et rédige Al-Jami’ As-Sahih.' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: "Les Larmes d'une Mère et le Don de la Mémoire",
        subtitle: "Comment l'invocation maternelle ouvrit les yeux d'un prodige",
        paragraphs: [
          "Né à Boukhara en Asie centrale et orphelin de père dès son jeune âge, le petit Muhammad ibn Isma'il perdit la vue durant son enfance. Les médecins de son époque déclarèrent son mal incurable, mais sa mère, femme d'une piété profonde, ne cessa de pleurer et d'implorer Allah dans le secret de la nuit.",
          "Une nuit, elle vit en songe le prophète Ibrahim عليه السلام lui dire : « Ô femme ! Allah a rendu la vue à ton fils en raison de l'abondance de tes invocations. » Au matin, l'enfant voyait parfaitement. Dès l'âge de dix ans, il fréquentait les cercles de science et mémorisait avec une précision stupéfiante des dizaines de milliers de récits avec leurs chaînes complètes de transmetteurs."
        ],
      },
      {
        number: 'Chapitre II',
        title: 'Seize Années de Voyages et Deux Rak’at pour Chaque Hadith',
        subtitle: "Quand la science est indissociable de la pureté du cœur",
        paragraphs: [
          "Pour préserver la parole authentique du Prophète ﷺ de toute altération ou faiblesse, l'Imam Al-Bukhari parcourut à pied et à dos de monture le Khorassan, l'Irak, le Hedjaz, la Syrie et l'Égypte. Sa rigueur éthique était telle que s'il voyait un transmetteur tromper un cheval avec un pan de vêtement vide pour l'attirer, il refusait de prendre le moindre hadith de cet homme en disant : « Celui qui trompe un animal ne saurait être digne de confiance pour la parole du Messager d'Allah ﷺ. »",
          "Pendant seize ans, entre la Mosquée Sacrée de La Mecque et la Mosquée du Prophète ﷺ à Médine, il sélectionna avec une méthode critique inégalée les hadiths de son *Sahih*, se purifiant et priant deux unités de prière de consultation (Istikhârah) avant d'inscrire chaque tradition."
        ],
      },
    ],
    spiritualLesson:
      "Le savoir véritable n'est pas une simple accumulation d'informations : il exige la rectitude morale, la vérification scrupuleuse et le respect sacré de la vérité.",
  },
  {
    id: 'cheikh-ahmadou-bamba',
    name: 'Cheikh Ahmadou Bamba',
    honorific: 'رحمه الله',
    arabicName: 'الشَّيْخُ أَحْمَدُ بَمْبَا خَادِمُ الرَّسُولِ',
    title: 'Khadimou Rassoul : La Voie de la Paix, du Savoir et du Travail',
    category: 'savants_spirituels',
    categoryLabel: 'Grands Savants & Sages',
    era: '1853 – 1927 (Afrique de l’Ouest)',
    region: 'Mbacké, Touba, Gabon & Mauritanie',
    readTime: '15 min',
    coverGradient: 'from-emerald-800 via-teal-900 to-[#061812]',
    badgeColor: 'emerald',
    shortSummary:
      "Le grand érudit, maître spirituel et poète de l'amour prophétique en Afrique de l'Ouest : sa résistance spirituelle non-violente face à l'exil colonial, son pardon total envers ses oppresseurs et la fondation de la cité bénie de Touba.",
    virtues: ['Paix & Non-violence absolue', 'Amour du Prophète ﷺ (Khadimou Rassoul)', 'Éducation & Travail sanctifié', 'Pardon envers les adversaires'],
    arabicQuote: 'يَا رَبِّ بَاعِدْ بَيْنِي وَبَيْنَ الشَّيْطَانِ وَبَيْنَ كُلِّ مَا لَا يُرْضِيكَ',
    frenchQuote: '« Je ne porte d’autres armes que le Coran et la Sunnah du Prophète, et je pardonne à tous ceux qui m’ont éprouvé. »',
    quoteSource: 'Écrits et témoignages spirituels de Cheikh Ahmadou Bamba',
    milestones: [
      { period: '1887 (Fondation de Touba)', event: 'Fonde Touba comme sanctuaire dédié à la foi, à l’enseignement du Coran et à la paix.' },
      { period: '1895 – 1902 (Exil au Gabon)', event: 'Sept années d’exil maritime et forestier traversées dans la prière, la patience et l’écriture de poèmes spirituels (Qasâ’id).' },
      { period: '1903 – 1907 (Mauritanie)', event: 'Séjour à Sarsara auprès des grands érudits mauritaniens qui saluent son rang spirituel.' },
      { period: 'Retour & Pardon', event: 'Déclare à son retour d’exil : « J’ai pardonné à tous mes ennemis pour la Face d’Allah. »' },
    ],
    chapters: [
      {
        number: 'Chapitre I',
        title: "L'Éducateur des Âmes et le Serviteur du Prophète ﷺ",
        subtitle: "Revivifier la foi par la connaissance, l'éthique et le travail",
        paragraphs: [
          "Né à Mbacké Baol au Sénégal dans une lignée d'érudits et de jurisconsultes, Cheikh Ahmadou Bamba Mbacké consacra sa jeunesse à l'étude approfondie du Coran, des sciences du Hadith, de la jurisprudence malékite et de la purification du cœur (Tasawwuf). À une époque marquée par les guerres, le désarroi social et la domination coloniale, il choisit la voie exigeante du Jihad Al-Nafs — le combat pacifique contre l'ego, l'ignorance et les passions.",
          "Se définissant humblement comme *Khadimou Rassoul* (le Serviteur du Messager d'Allah ﷺ), il fonda des écoles spirituelles (Daaras) où l'étude du Livre sacré s'unissait au travail agricole accompli comme une adoration (*Khidmah*), enseignant que la dignité du croyant repose sur le savoir utile et l'effort honnête."
        ],
      },
      {
        number: 'Chapitre II',
        title: "La Prière sur l'Océan et la Patience de l'Exil",
        subtitle: 'Sept ans au Gabon et quatre ans en Mauritanie sans haine ni rancune',
        paragraphs: [
          "Craignant son rayonnement populaire croissant bien que son mouvement fût strictement pacifique, l'administration coloniale l'arrêta en 1895 à Djéwol et le condamna à l'exil au Gabon. Sur le navire qui l'emmenait loin de sa terre, à l'heure de la prière, il manifesta sa fidélité inébranlable à son Seigneur en accomplissant sa prière face à l'immensité de l'océan, image devenue le symbole universel de la liberté spirituelle qui ne plie devant aucune contrainte.",
          "Durant sept années dans les forêts équatoriales de Mayumba et Lambaréné, loin de toute bibliothèque, il composa de mémoire des milliers de vers en arabe classique à la gloire d'Allah et à la louange du Prophète ﷺ. À son retour en 1902, alors que ses disciples attendaient son mot d'ordre, il proclama un pardon sans réserve envers tous ceux qui l'avaient exilé, rappelant que le Messager d'Allah ﷺ avait pardonné le jour de l'ouverture de La Mecque."
        ],
      },
    ],
    spiritualLesson:
      "La paix du cœur, l'amour du Prophète ﷺ, la recherche du savoir et le pardon sincère constituent une force spirituelle qu'aucun exil ni aucune épreuve terrestre ne peuvent éteindre.",
  },
];
