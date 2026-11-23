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
  {
    id: 'pil_8',
    category: 'piliers',
    question: 'Quel pilier de l’Islam consiste à témoigner qu’il n’y a de divinité digne d’adoration qu’Allah et que Muhammad ﷺ est Son messager ?',
    options: ['La Shahada', 'La Zakât', 'La Salat', 'Le Hajj'],
    correctIndex: 0,
    explanation: 'La Shahada (attestation de foi) est le premier pilier de l’Islam et la porte d’entrée en religion.',
  },
  {
    id: 'pil_9',
    category: 'piliers',
    question: 'Combien de fois par jour le musulman accomplit-il les prières obligatoires ?',
    options: ['3 fois', '4 fois', '5 fois', '7 fois'],
    correctIndex: 2,
    explanation: 'Les 5 prières quotidiennes sont Fajr, Dhuhr, Asr, Maghrib et Isha.',
  },
  {
    id: 'pil_10',
    category: 'piliers',
    question: 'Vers quelle direction les musulmans se tournent-ils pour accomplir la prière (Qibla) ?',
    options: ['Médine', 'Al-Quds', 'La Ka‘ba à La Mecque', 'L’Est géographique'],
    correctIndex: 2,
    explanation: 'La Qibla est orientée vers Al-Masjid Al-Harâm (la Ka‘ba) à La Mecque.',
  },
  {
    id: 'pil_11',
    category: 'piliers',
    question: 'Quel acte purifie les ablutions mineures (Woudou) avant la prière lorsqu’il n’y a pas d’eau disponible ?',
    options: ['Le Tayammum', 'Le Ghusl', 'Le Tasbîh', 'L’I‘tikâf'],
    correctIndex: 0,
    explanation: 'Le Tayammum (ablution sèche avec de la terre ou pierre propre) remplace l’eau en cas d’absence ou d’empêchement.',
  },
  {
    id: 'pil_12',
    category: 'piliers',
    question: 'Quel mois lunaire précède immédiatement le mois de Ramadan ?',
    options: ['Rajab', 'Sha‘bân', 'Shawwâl', 'Dhul-Hijja'],
    correctIndex: 1,
    explanation: 'Sha‘bân est le 8e mois du calendrier hégirien, suivi par Ramadan (9e mois) puis Shawwâl (10e).',
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
  {
    id: 'sir_7',
    category: 'sira',
    question: 'En quelle année après l’Hégire eut lieu la grande bataille de Badr ?',
    options: ['En l’an 1 H', 'En l’an 2 H', 'En l’an 5 H', 'En l’an 8 H'],
    correctIndex: 1,
    explanation: 'La bataille décisive de Badr eut lieu le 17 Ramadan de l’an 2 de l’Hégire.',
  },
  {
    id: 'sir_8',
    category: 'sira',
    question: 'Quel était le surnom du Prophète Muhammad ﷺ parmi les Mecquois avant sa mission prophétique ?',
    options: ['Al-Sâdiq Al-Amîn', 'Al-Fârûq', 'Asad Allah', 'Sayf Allah'],
    correctIndex: 0,
    explanation: 'Les habitants de La Mecque l’appelaient « Le Véridique, le Digne de confiance » (Al-Sâdiq Al-Amîn).',
  },
  {
    id: 'sir_9',
    category: 'sira',
    question: 'Quel traité de paix fut conclu entre le Prophète ﷺ et les Qurayshites en l’an 6 de l’Hégire ?',
    options: ['Le Pacte d’Al-‘Aqaba', 'Le Traité d’Al-Hudaybiyya', 'La Constitution de Médine', 'Le Traité de Khaybar'],
    correctIndex: 1,
    explanation: 'Le Traité d’Al-Hudaybiyya ouvrit une période de paix qui permit une large diffusion de l’Islam.',
  },
  {
    id: 'sir_10',
    category: 'sira',
    question: 'Quel compagnon suggéra au Prophète ﷺ de creuser un fossé autour de Médine lors de la bataille d’Al-Khandaq ?',
    options: ['Salmân Al-Fârisî', 'Khâlid ibn Al-Walîd', 'Sa‘d ibn Mu‘âdh', 'Abou ‘Ubayda'],
    correctIndex: 0,
    explanation: 'Salmân Al-Fârisî (qu’Allah l’agrée) proposa cette stratégie défensive inédite en Arabie.',
  },
  {
    id: 'sir_11',
    category: 'sira',
    question: 'Comment s’appelait la mosquée bâtie par le Prophète ﷺ dès son arrivée à Qubâ près de Médine ?',
    options: ['Masjid An-Nabawî', 'Masjid Qubâ', 'Masjid Al-Qiblatayn', 'Masjid Al-Ghamâma'],
    correctIndex: 1,
    explanation: 'Masjid Qubâ fut la toute première mosquée fondée dans l’histoire de l’Islam.',
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
  {
    id: 'pro_7',
    category: 'prophetes',
    question: 'Quel prophète est célèbre pour sa patience exemplaire face à la maladie et à la perte de ses biens ?',
    options: ['Ayyoûb (عليه السلام)', 'Zakariyyâ (عليه السلام)', 'Chou‘ayb (عليه السلام)', 'Loût (عليه السلام)'],
    correctIndex: 0,
    explanation: 'Allah loua la patience d’Ayyoûb (Job) dans Sourate Sâd (38:44).',
  },
  {
    id: 'pro_8',
    category: 'prophetes',
    question: 'Quel prophète construisit une arche sur ordre d’Allah pour sauver les croyants du Déluge ?',
    options: ['Hoûd (عليه السلام)', 'Sâlih (عليه السلام)', 'Nouh (عليه السلام)', 'Idrîs (عليه السلام)'],
    correctIndex: 2,
    explanation: 'Nouh (Noé) prêcha 950 ans auprès de son peuple avant le Déluge (Sourate Al-‘Ankaboût 29:14).',
  },
  {
    id: 'pro_9',
    category: 'prophetes',
    question: 'Quel prophète fut envoyé au peuple de Thamoud avec le miracle d’une chamelle sortie du rocher ?',
    options: ['Hoûd (عليه السلام)', 'Sâlih (عليه السلام)', 'Chou‘ayb (عليه السلام)', 'Ilyâs (عليه السلام)'],
    correctIndex: 1,
    explanation: 'Sâlih (عليه السلام) fut envoyé au peuple de Thamoud avec le signe de la chamelle d’Allah.',
  },
  {
    id: 'pro_10',
    category: 'prophetes',
    question: 'Quel prophète parla dès son berceau pour innocenter sa mère Maryam ?',
    options: ['Yahyâ (عليه السلام)', '‘Îssâ (عليه السلام)', 'Ismâ‘îl (عليه السلام)', 'Ishâq (عليه السلام)'],
    correctIndex: 1,
    explanation: 'Dans Sourate Maryam (19:30), ‘Îssâ (Jésus) déclara au berceau : « Je suis vraiment le serviteur d’Allah. »',
  },
  {
    id: 'pro_11',
    category: 'prophetes',
    question: 'Quel prophète est surnommé « Khalîl Allah » (l’ami intime d’Allah) ?',
    options: ['Moussa (عليه السلام)', 'Ibrâhîm (عليه السلام)', 'Nouh (عليه السلام)', 'Dâwoûd (عليه السلام)'],
    correctIndex: 1,
    explanation: 'Sourate An-Nisâ (4:125) affirme : « Et Allah avait pris Ibrâhîm pour ami privilégié (Khalîl). »',
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
  {
    id: 'cor_8',
    category: 'coran',
    question: 'Quel fut le tout premier mot révélé au Prophète Muhammad ﷺ dans le Coran ?',
    options: ['Bismillâh', 'Iqra’ (Lis)', 'Subhânallâh', 'Al-Hamdulillâh'],
    correctIndex: 1,
    explanation: 'Sourate Al-‘Alaq (96:1) débute par « Iqra’ bismi Rabbika alladhî khalaq » (Lis au nom de ton Seigneur).',
  },
  {
    id: 'cor_9',
    category: 'coran',
    question: 'Combien de Juz (parties) divise-t-on le Noble Coran pour faciliter sa lecture mensuelle ?',
    options: ['15 Juz', '20 Juz', '30 Juz', '40 Juz'],
    correctIndex: 2,
    explanation: 'Le Coran est divisé en 30 Juz (et 60 Hizb), permettant de le lire en entier en un mois.',
  },
  {
    id: 'cor_10',
    category: 'coran',
    question: 'Quelle sourate est recommandée à la lecture chaque vendredi pour sa lumière entre les deux vendredis ?',
    options: ['Al-Kahf', 'Al-Mulk', 'Al-Wâqi‘a', 'As-Sajda'],
    correctIndex: 0,
    explanation: 'La récitation de Sourate Al-Kahf (La Caverne) le vendredi illumine le croyant d’un vendredi à l’autre.',
  },
  {
    id: 'cor_11',
    category: 'coran',
    question: 'Quelle sourate protège du châtiment de la tombe lorsqu’elle est récitée régulièrement chaque nuit ?',
    options: ['Al-Mulk', 'Al-Fajr', 'Al-Balad', 'Al-Inshiqâq'],
    correctIndex: 0,
    explanation: 'Sourate Al-Mulk (La Royauté, sourate 67) intercède en faveur de son lecteur.',
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
  {
    id: 'his_7',
    category: 'histoire',
    question: 'Quel compagnon fut surnommé « Sayf Allah Al-Masloûl » (l’épée dégainée d’Allah) ?',
    options: ['‘Amr ibn Al-‘Âs', 'Khâlid ibn Al-Walîd', 'Hamza ibn ‘Abdil-Muttalib', 'Az-Zubayr ibn Al-‘Awwâm'],
    correctIndex: 1,
    explanation: 'Le Prophète ﷺ décerna ce titre prestigieux à Khâlid ibn Al-Walîd lors de l’expédition de Mu’ta.',
  },
  {
    id: 'his_8',
    category: 'histoire',
    question: 'Qui dirigea la commission chargée de compiler et d’unifier le Mushaf du Coran sous Abou Bakr puis ‘Uthmân ?',
    options: ['Zayd ibn Thâbit', 'Ibn Mas‘oûd', 'Mu‘âdh ibn Jabal', 'Ubayy ibn Ka‘b'],
    correctIndex: 0,
    explanation: 'Zayd ibn Thâbit, scribe principal de la Révélation, dirigea ce travail historique.',
  },
  {
    id: 'his_9',
    category: 'histoire',
    question: 'Quelle épouse du Prophète ﷺ était surnommée « Al-Humayrâ » et a transmis plus de 2 200 hadiths ?',
    options: ['Hafsa bint ‘Umar', '‘Â’isha bint Abî Bakr', 'Umm Salama', 'Zaynab bint Jahsh'],
    correctIndex: 1,
    explanation: '‘Â’isha (qu’Allah l’agrée) fut l’une des plus grandes savantes de la première génération.',
  },
  {
    id: 'his_10',
    category: 'histoire',
    question: 'Quel compagnon fut le premier ambassadeur envoyé par le Prophète ﷺ pour enseigner l’Islam à Médine ?',
    options: ['Mus‘ab ibn ‘Umayr', 'Ja‘far ibn Abî Tâlib', 'Bilâl ibn Rabâh', 'Abou Dharr'],
    correctIndex: 0,
    explanation: 'Mus‘ab ibn ‘Umayr enseigna le Coran aux habitants de Médine avant l’Hégire.',
  },
  {
    id: 'his_11',
    category: 'histoire',
    question: 'Comment s’appelait le roi juste d’Abyssinie qui accueillit et protégea les premiers musulmans émigrés ?',
    options: ['Héraclius', 'An-Najâshî (le Négus)', 'Chosroès', 'Al-Muqawqis'],
    correctIndex: 1,
    explanation: 'Le Négus (Ashama) protégea les compagnons menés par Ja‘far ibn Abî Tâlib.',
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
