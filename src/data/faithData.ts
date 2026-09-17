export interface ResurrectionStage {
  stepNumber: number;
  title: string;
  arabicName: string;
  subtitle: string;
  description: string;
  versesOrHadiths: {
    text: string;
    ref: string;
  }[];
  keyInsights: string[];
}

export interface ParadiseGate {
  name: string;
  arabicName: string;
  forWhom: string;
  hadithDescription: string;
}

export const RESURRECTION_STAGES: ResurrectionStage[] = [
  {
    stepNumber: 1,
    title: "Les Grands Signes de l'Heure",
    arabicName: "أشراط الساعة الكبرى",
    subtitle: "Les bouleversements précurseurs universels",
    description: "Avant la fin des temps, 10 signes majeurs successifs surviendront de manière soudaine, comme des perles se détachant d'un collier brisé.",
    versesOrHadiths: [
      {
        text: "« L'Heure ne se dressera pas avant que vous n'ayez vu dix signes : la fumée, le Faux Messie (Ad-Dajjâl), la Bête, le lever du soleil de son couchant, la descente de Jésus fils de Marie, Gog et Magog... »",
        ref: "Sahih Muslim",
      },
    ],
    keyInsights: [
      "L'épreuve du Faux Messie (Ad-Dajjâl) et la protection par les dix premiers versets de la sourate Al-Kahf.",
      "La descente de 'Issa (Jésus) priant derrière l'Imam des musulmans et rétablissant la justice.",
      "La fin du repentir dès que le soleil se lèvera depuis l'Occident.",
    ],
  },
  {
    stepNumber: 2,
    title: "Le Souffle dans la Trompe",
    arabicName: "النفخ في الصور",
    subtitle: "Le foudroiement universel puis le grand réveil",
    description: "L'Archange Israfil soufflera à deux reprises : le premier souffle (Nafkhat As-Sa'iq) foudroiera l'univers entier, et le second (Nafkhat Al-Ba'th) ressuscitera chaque âme.",
    versesOrHadiths: [
      {
        text: "« Et on soufflera dans la Trompe, et voilà que ceux qui seront dans les cieux et ceux qui seront sur la terre seront foudroyés, sauf ceux qu'Allah voudra. Puis on y soufflera de nouveau, et les voilà debout à regarder. »",
        ref: "Sourate Az-Zumar (39:68)",
      },
    ],
    keyInsights: [
      "Les corps seront reconstitués à partir du coccyx ('Ajb adh-Dhanab) telle une plante arrosée par une pluie céleste de 40 jours.",
      "Chaque être sortira de sa tombe répondant immédiatement à l'appel de son Créateur.",
    ],
  },
  {
    stepNumber: 3,
    title: "Le Grand Rassemblement (Al-Mahshar)",
    arabicName: "الحشر في أرض المحشر",
    subtitle: "L'attente solennelle sous le Trône d'Allah",
    description: "L'humanité entière depuis Adam jusqu'au dernier homme sera réunie sur une terre blanche et immaculée, pieds nus, nus et incirconcis.",
    versesOrHadiths: [
      {
        text: "« Vous serez rassemblés pieds nus, nus et incirconcis, comme au premier jour de la création. » 'Aïcha demanda : Ô Messager d'Allah ! Les hommes et les femmes se regarderont-ils ? Il répondit : « La situation sera bien trop redoutable pour qu'ils y songent ! »",
        ref: "Sahih Al-Bukhari & Muslim",
      },
    ],
    keyInsights: [
      "Le soleil sera rapproché à la distance d'un mille, et chacun sera immergé dans sa propre sueur selon ses actes.",
      "Sept catégories de personnes seront abritées sous l'ombre du Trône : le dirigeant juste, le jeune ayant grandi dans l'adoration, l'homme attaché aux mosquées, deux amis s'aimant pour Allah, etc.",
    ],
  },
  {
    stepNumber: 4,
    title: "L'Intercession Suprême & Le Jugement (Al-Hisab)",
    arabicName: "الشفاعة العظمى والحساب",
    subtitle: "La délivrance de l'attente et la remise des registres",
    description: "Après que les gens eurent supplié Adam, Noé, Abraham, Moïse et Jésus en vain, ils viendront auprès du Prophète Muhammad ﷺ qui se prosternera sous le Trône pour demander à Allah de débuter le Jugement.",
    versesOrHadiths: [
      {
        text: "« Quiconque recevra son livre dans sa main droite sera soumis à un jugement facile et retournera réjoui parmi les siens. Quant à celui qui recevra son livre derrière son dos, il invoquera sa destruction. »",
        ref: "Sourate Al-Inshiqaq (84:7-11)",
      },
    ],
    keyInsights: [
      "Chaque individu sera seul face à Allah sans interprète, interrogé sur sa vie, sa jeunesse, son argent et sa science.",
      "Les membres témoigneront : la langue, les mains et les pieds scellés déclareront leurs actes réels.",
    ],
  },
  {
    stepNumber: 5,
    title: "La Balance des Actes (Al-Mizan)",
    arabicName: "الميزان",
    subtitle: "La pesée au poids d'un grain de moutarde",
    description: "Une Balance réelle dotée de deux plateaux immenses où seront pesés les registres, les œuvres matérialisées et les hommes eux-mêmes.",
    versesOrHadiths: [
      {
        text: "« Au Jour de la Résurrection, Nous placerons les balances de la justice. Nulle âme ne sera lésée en rien, fût-ce du poids d'un grain de moutarde que Nous ferons venir. »",
        ref: "Sourate Al-Anbiya (21:47)",
      },
    ],
    keyInsights: [
      "Le bon comportement pèse le plus lourd dans la Balance du serviteur.",
      "Deux paroles légères sur la langue et très lourdes sur la Balance : « Subhân Allâhi wa bihamdih, Subhân Allâhil-'Adhîm ».",
    ],
  },
  {
    stepNumber: 6,
    title: "Le Bassin Prophétique (Al-Hawd)",
    arabicName: "حوض النبي صلى الله عليه وسلم",
    subtitle: "L'eau bienfaisante désaltérante éternelle",
    description: "Un vaste bassin céleste alimenté par le fleuve Al-Kawthar du Paradis. Ses récipients sont aussi nombreux que les étoiles du ciel.",
    versesOrHadiths: [
      {
        text: "« Mon bassin s'étend sur une distance d'un mois de marche. Son eau est plus blanche que le lait, son odeur plus agréable que le musc, et ses coupes comme les étoiles du ciel. Quiconque en boira n'aura plus jamais soif. »",
        ref: "Sahih Al-Bukhari",
      },
    ],
    keyInsights: [
      "Les fidèles qui ont suivi sincèrement la Sunnah y boiront de la noble main du Prophète ﷺ.",
      "Ceux qui ont altéré la religion ou renié la foi en seront repoussés par les anges.",
    ],
  },
  {
    stepNumber: 7,
    title: "Le Pont au-dessus de l'Enfer (As-Sirat)",
    arabicName: "الصراط المستقيم",
    subtitle: "L'ultime épreuve avant l'entrée au Paradis",
    description: "Un pont suspendu sur le gouffre de la Géhenne, plus mince qu'un cheveu et plus tranchant qu'une épée, hérissé de crochets acérés (Kalâlib).",
    versesOrHadiths: [
      {
        text: "« Il n'y a nul d'entre vous qui ne passera pas par là (au-dessus de l'Enfer) : c'est un arrêt irrévocable de ton Seigneur. Puis Nous délivrerons ceux qui étaient pieux et Nous y laisserons les injustes agenouillés. »",
        ref: "Sourate Maryam (19:71-72)",
      },
    ],
    keyInsights: [
      "Les croyants traverseront selon la lumière de leur foi : certains comme un éclair, d'autres comme le vent, au galop, au pas ou en rampant.",
      "La supplication des Prophètes sur le Sirat sera : « Ô Allah, accorde le salut ! Accorde le salut ! » (Allâhumma sallim sallim).",
    ],
  },
];

export const PARADISE_GATES: ParadiseGate[] = [
  {
    name: "Bâb As-Salât (Porte de la Prière)",
    arabicName: "باب الصلاة",
    forWhom: "Pour ceux qui étaient assidus à la prière avec dévotion et ponctualité.",
    hadithDescription: "« Celui qui était du nombre des assidus à la prière sera appelé de la porte de la prière. »",
  },
  {
    name: "Bâb Ar-Rayyân (Porte des Jeûneurs)",
    arabicName: "باب الريان",
    forWhom: "Réservée exclusivement aux jeûneurs sincères qui enduraient la faim et la soif pour Allah.",
    hadithDescription: "« Il y a au Paradis une porte appelée Ar-Rayyân par laquelle entreront les jeûneurs le Jour de la Résurrection ; nul autre qu'eux n'y entrera. »",
  },
  {
    name: "Bâb As-Sadaqah (Porte de l'Aumône)",
    arabicName: "باب الصدقة",
    forWhom: "Pour ceux qui dépensaient généreusement leurs biens pour les pauvres, orphelins et œuvres pieuses.",
    hadithDescription: "« Et celui qui était du nombre de ceux qui donnaient l'aumône sera appelé de la porte de l'aumône. »",
  },
  {
    name: "Bâb Al-Jihâd (Porte de l'Effort Suprême)",
    arabicName: "باب الجهاد",
    forWhom: "Pour ceux qui ont consacré leur personne et leurs biens sur le sentier de la vérité.",
    hadithDescription: "Appelée pour les martyrs et les combattants sincères de la foi.",
  },
  {
    name: "Bâb Al-Ayman (La Porte Droite)",
    arabicName: "الباب الأيمن",
    forWhom: "Pour ceux qui entreront au Paradis sans jugement ni châtiment grâce à leur confiance absolue (Tawakkul).",
    hadithDescription: "La porte réservée aux 70 000 bienheureux qui se remettaient entièrement à leur Seigneur.",
  },
  {
    name: "Bâb Al-Kâdhimîn (Porte de la Maîtrise de Soi)",
    arabicName: "باب الكاظمين الغيظ",
    forWhom: "Pour ceux qui dominaient leur colère et pardonnaient généreusement aux gens.",
    hadithDescription: "Promis à ceux qui retiennent leur emportement alors qu'ils étaient capables de sévir.",
  },
];

export const PARADISE_DELIGHTS = [
  {
    title: "Les Degrés & Al-Firdaws Al-A'la",
    desc: "Le Paradis comporte 100 degrés ; la distance entre deux degrés est semblable à celle entre le ciel et la terre. Le plus haut et noble niveau est Al-Firdaws Al-A'la, dont le plafond est le Trône du Tout-Miséricordieux et d'où jaillissent les quatre fleuves.",
  },
  {
    title: "Les Fleuves Éternels",
    desc: "Un fleuve d'eau limpide et pure inaltérable, un fleuve de lait au goût jamais altéré, un fleuve de vin délice pour les buveurs sans ivresse ni maux de tête, et un fleuve de miel pur et clarifié.",
  },
  {
    title: "Le Plus Grand Bienfait : La Vision Divine (Ar-Ru'yah)",
    desc: "Lorsque les habitants du Paradis seront comblés de tous les délices, le voile sera levé et ils contempleront la Face Majestueuse d'Allah. Rien de ce qui leur a été donné ne leur sera plus cher ni plus beau que cette vision sublime.",
  },
];

export const HELL_WARNINGS = [
  {
    title: "La Chaleur et la Profondeur",
    desc: "Le feu de l'Enfer est 70 fois plus brûlant que n'importe quelle flamme terrestre. Une pierre jetée depuis son bord met 70 années pour atteindre son gouffre.",
  },
  {
    title: "Nourritures & Boissons des Damnés",
    desc: "L'arbre de Zaqqum épineux qui bout dans les ventres comme du métal en fusion, le Ghislin (pus infect), et une eau bouillante qui déchire les entrailles.",
  },
  {
    title: "La Voie du Salut",
    desc: "Le repentir sincère (Tawbah Nasuhah), l'attachement à l'unicité divine (Tawhid), la prière accomplie en son temps, la bienfaisance et la supplication de protection enseignée par le Prophète ﷺ.",
  },
];
