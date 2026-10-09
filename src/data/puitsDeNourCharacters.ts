export interface CharacterReaction {
  situation: string;
  reaction: string;
}

export interface CharacterRelation {
  person: string;
  description: string;
}

export interface BookCharacter {
  id: string;
  name: string;
  aliases: string[]; // Pour la détection cliquable dans le texte
  age: string;
  role: string;
  group: 'principal' | 'conflit' | 'secondaire';
  shortBio: string;
  imageUrl?: string;
  avatarColor: string;
  parentsAndFamily: string;
  appearance: string;
  personality: string;
  innerConflict?: string;
  woundsAndSecrets?: string;
  relations: CharacterRelation[];
  reactions: CharacterReaction[];
  evolution: string;
  illustrationsRules?: string;
}

export interface BookLocation {
  id: string;
  name: string;
  subtitle: string;
  description: string;
}

import heroImg from '../assets/images/puits_de_nour_hero_1791576280881.jpg';
import portraitYassine from '../assets/images/portrait_yassine_1791576293393.jpg';
import portraitSettiAicha from '../assets/images/portrait_setti_aicha_1791576304698.jpg';
import portraitImamAbdelkarim from '../assets/images/portrait_imam_abdelkarim_1791579363460.jpg';
import portraitBilal from '../assets/images/portrait_bilal_1791576327188.jpg';
import portraitMaryam from '../assets/images/portrait_maryam_1791576316240.jpg';
import portraitIbrahim from '../assets/images/portrait_ibrahim_1791579374736.jpg';
import portraitHadjMansour from '../assets/images/portrait_hadj_mansour_1791579385098.jpg';
import portraitKarim from '../assets/images/portrait_karim_1791579395834.jpg';
import portraitOumar from '../assets/images/portrait_oumar_1791579416598.jpg';
import portraitKhadija from '../assets/images/portrait_khadija_1791579444606.jpg';
import portraitSouleymane from '../assets/images/portrait_souleymane_1791579405672.jpg';
import portraitFatou from '../assets/images/portrait_fatou_1791579454264.jpg';
import portraitCheikhIdriss from '../assets/images/portrait_cheikh_idriss_1791579466636.jpg';
import portraitMoussa from '../assets/images/portrait_moussa_1791579484514.jpg';
import portraitVieuxSidi from '../assets/images/portrait_vieux_sidi_1791579522914.jpg';
import portraitAichaVeuve from '../assets/images/portrait_aicha_veuve_1791579512994.jpg';
import portraitNoura from '../assets/images/portrait_noura_1791579475458.jpg';
import portraitAmadou from '../assets/images/portrait_amadou_1791579533358.jpg';
import portraitPereYassine from '../assets/images/portrait_pere_yassine_1791579544088.jpg';

export const PUITS_DE_NOUR_HERO_IMAGE = heroImg;

export const PUITS_DE_NOUR_LOCATIONS: BookLocation[] = [
  {
    id: 'dar-salam',
    name: 'Dar-Salam',
    subtitle: "Le village d'oasis",
    description: "Le village d'oasis entouré de palmiers et de maisons d'argile (banco), frappé par une sécheresse qui met à l'épreuve les cœurs et la solidarité des habitants."
  },
  {
    id: 'grand-puits',
    name: 'Le Grand Puits (Le Puits de Nour)',
    subtitle: 'Cœur du village',
    description: "Cœur ancestral du village entouré d'un cercle de pierres usées par les cordes et les seaux, désormais presque sec, lieu de rassemblement, de dispute puis de réconciliation."
  },
  {
    id: 'mosquee-argile',
    name: "La Mosquée d'argile",
    subtitle: 'Lieu de prière et de conseil',
    description: "Petite et modeste mosquée au minaret de terre, où l'on se retrouve pour la prière, la consultation collective et les leçons de sagesse de l'imam Abdelkarim."
  },
  {
    id: 'le-souk',
    name: 'Le Souk (Le Marché)',
    subtitle: 'Théâtre des tentations et de la vérité',
    description: "Marché animé aux étals de dattes, de céréales et d'étoffes, théâtre des rumeurs de Fatou, de la bourse d'or perdue par Hadj Mansour et du test d'honnêteté de Yassine."
  },
  {
    id: 'colline-figuier',
    name: 'La Colline & Cour du Figuier',
    subtitle: 'Lieu de retraite et de confidence',
    description: "Lieu de recueillement et de confidence où Yassine prie, réfléchit et écoute les récits et secrets transmis par sa grand-mère Setti Aïcha."
  },
  {
    id: 'vallee-lointaine',
    name: "La Vallée de l'Est & Dépression Rocheuse",
    subtitle: "Objectif du voyage périlleux",
    description: "Au-delà des pierres noires et des dunes, là où se trouvent l'ancien dépôt oublié, la halte caravanière et le canal souterrain sous la pierre plate."
  },
  {
    id: 'maison-yassine',
    name: 'La Maison de Yassine et Setti Aïcha',
    subtitle: 'Foyer humble et chaleureux',
    description: "Demeure modeste aux murs de banco réparés avec soin, abritant le vieux coffre en bois, la lettre du père et la chaleur aimante de Setti Aïcha."
  }
];

export const PUITS_DE_NOUR_CHARACTERS: BookCharacter[] = [
  {
    id: 'yassine',
    name: 'Yassine',
    aliases: ['Yassine'],
    age: '12 ans',
    role: 'Le garçon qui veut comprendre la vérité',
    group: 'principal',
    shortBio: "Orphelin de père, courageux et sensible. Il apprend à faire confiance à Allah, à défendre l'honnêteté et à ne pas tout porter seul.",
    imageUrl: portraitYassine,
    avatarColor: '#B45309',
    parentsAndFamily: "Orphelin de père (son père est parti il y a douze ans après avoir découvert le détournement des réserves de grain et d'eau). Élevé avec amour par sa grand-mère paternelle Setti Aïcha dans une maison modeste de Dar-Salam. La situation de sa mère n'est pas établie dans le manuscrit. A un lien de parenté mentionné avec Amadou (son neveu/cousin jaloux).",
    appearance: "Garçon de douze ans à la silhouette fine, aux épaules encore étroites et aux gestes parfois hésitants. Visage expressif avec des yeux attentifs qui observent davantage que ce qu'il dit. Porte une tunique simple en tissu naturel, un bonnet kufi brodé, des sandales usées et le carré de tissu de son père au poignet ou dans sa poche.",
    personality: "Sensible, généreux, observateur, curieux et profondément juste. Il remarque ceux qui cachent leur faim ou leur peine. Son défaut est de vouloir tout résoudre et porter seul pour épargner sa grand-mère, et de bouillir d'impatience face aux silences entourant son père.",
    innerConflict: "Comment rester bon lorsque la vie devient injuste, et comment faire confiance sans devenir naïf ?",
    woundsAndSecrets: "L'absence de son père depuis douze ans est sa blessure la plus vive. Il craint d'avoir été abandonné jusqu'à l'ouverture du vieux coffre et la lecture de la lettre paternelle : « Si je tarde, ne laisse pas mon fils croire que je l'ai oublié. »",
    relations: [
      { person: 'Setti Aïcha (Grand-mère)', description: "Amour profond, confiance quotidienne, mais douleur face au secret longtemps gardé sur son père." },
      { person: 'Bilal', description: "Meilleur ami et frère de cœur ; loyauté, humour partagé et soutien dans l'épreuve." },
      { person: 'Maryam', description: "Respect mutuel, réflexion méthodique et courage partagé." },
      { person: 'Karim', description: "Rivalité et blessures face aux moqueries, puis sauvetage dans la tempête et pardon lucide." },
      { person: 'Cheikh Idriss', description: "Espoir de connaître le passé de son père, mêlé de prudence devant les réponses partielles." },
      { person: 'Imam Abdelkarim', description: "Profond respect pour un guide qui enseigne la patience active et la justice." }
    ],
    reactions: [
      { situation: 'Devant le puits presque vide', reaction: "Se penche vers le fond, serre les lèvres, observe les adultes et aide les personnes âgées à porter leurs jarres." },
      { situation: "Lorsqu'on insulte son père", reaction: "Son visage se ferme, sa respiration devient courte, mais il choisit de ne pas ajouter du mal à ce qui va déjà mal." },
      { situation: "Lorsqu'il trouve la bourse d'or", reaction: "Ressent une tentation humaine réelle en pensant à la faim de Setti Aïcha, mais choisit l'honnêteté et rend la bourse à Hadj Mansour." },
      { situation: 'Pendant la tempête de sable', reaction: "Agit malgré la peur et risque sa vie au bord du ravin pour tendre la main à Karim." },
      { situation: 'Lorsque Karim demande pardon', reaction: "Pardonne sans naïveté : il refuse de garder Karim prisonnier de son passé tout en rappelant que la confiance se reconstruit par les actes." }
    ],
    evolution: "Au début, Yassine pense devoir tout porter seul pour prouver son courage. À la fin, il comprend qu'il peut faire sa part sans porter le monde entier sur ses épaules : demander de l'aide et agir collectivement font partie du vrai courage."
  },
  {
    id: 'setti-aicha',
    name: 'Setti Aïcha',
    aliases: ['Setti Aïcha'],
    age: '65–75 ans',
    role: 'La grand-mère qui garde un secret',
    group: 'principal',
    shortBio: "Grand-mère de Yassine, sage, bienveillante et conteuse. Elle a longtemps gardé le coffre et les lettres du père de Yassine par peur de le voir souffrir.",
    imageUrl: portraitSettiAicha,
    avatarColor: '#7C2D12',
    parentsAndFamily: "Grand-mère de Yassine et mère du père disparu de Yassine. Elle est le pilier du foyer familial à Dar-Salam et la gardienne du vieux coffre en bois contenant l'écharpe brodée, la pièce gravée et les lettres de son fils.",
    appearance: "Femme âgée (entre 65 et 75 ans) au visage marqué par le temps et les épreuves, aux mains fines et ridées habituées au travail quotidien. Démarche lente mais présence digne, vêtue de tissus sobres et d'un foulard noué avec soin.",
    personality: "Affectueuse, sage, patiente, croyante et dotée d'un humour vif qui allège les moments durs. Sa faiblesse est d'avoir cru que le silence protégeait ceux qu'elle aime, retardant le moment où Yassine pourrait connaître son histoire.",
    innerConflict: "Protéger l'enfance de Yassine contre la peur et les conflits du village, ou lui livrer une vérité douloureuse et incomplète.",
    woundsAndSecrets: "Elle a attendu chaque soir le retour de son fils parti défendre l'équité des réserves, et a caché pendant douze ans la clé du coffre et la lettre adressée au village.",
    relations: [
      { person: 'Yassine (Petit-fils)', description: "Toute sa vie ; elle se prive de nourriture pour lui et finit par lui remettre la clé du coffre." },
      { person: 'Le père de Yassine (Son fils)', description: "Fierté mêlée de douleur ; elle redoutait autant sa disparition que la découverte de ses éventuelles erreurs." },
      { person: 'Cheikh Idriss', description: "Ancien compagnon de route de son fils ; son retour réveille à la fois sa colère, sa peur et son soulagement." }
    ],
    reactions: [
      { situation: 'Manque de nourriture', reaction: "Prétend ne pas avoir faim ou plaisante sur son âge pour laisser le plus gros morceau de galette à Yassine." },
      { situation: 'Questions sur le père de Yassine', reaction: "Ses doigts se figent, elle range des bols déjà propres pour gagner du temps avant d'accepter d'ouvrir le coffre." },
      { situation: 'Retour de Cheikh Idriss', reaction: "Pâlit, ses mains s'immobilisent, puis l'accueille avec dignité." },
      { situation: 'Assemblée du village', reaction: "Avoue publiquement devant tout Dar-Salam que la peur l'a poussée au silence et remet la dernière lettre de son fils." }
    ],
    evolution: "Elle passe d'un silence protecteur mais étouffant à une confiance honnête, acceptant de dire « je ne sais pas » et de partager le poids du passé avec Yassine."
  },
  {
    id: 'imam-abdelkarim',
    name: 'Imam Abdelkarim',
    aliases: ['Imam Abdelkarim', "l'imam Abdelkarim", "L'imam Abdelkarim", "l'imam", "L'imam"],
    age: 'Homme mûr (env. 45–55 ans)',
    role: "Le guide érudit qui associe la foi à l'action",
    group: 'principal',
    shortBio: "Calme, bienveillant et juste, il enseigne par l'exemple. Il rappelle que le Tawakkul (confiance en Allah) exige l'effort, la consultation et la preuve.",
    imageUrl: portraitImamAbdelkarim,
    avatarColor: '#065F46',
    parentsAndFamily: "Guide spirituel de la communauté de Dar-Salam. Sa famille personnelle n'est pas détaillée dans le manuscrit ; il agit comme figure morale et médiateur pour toutes les familles du village.",
    appearance: "Homme calme et digne au visage serein qui contraste avec l'agitation des villageois. Porte une tunique claire et une coiffe blanche sobre.",
    personality: "Érudit, patient, rigoureux et profondément équitable. Il refuse les conclusions hâtives, interdit que l'on condamne sans preuve et ne permet jamais que la religion serve à faire taire les opprimés ou à protéger les puissants.",
    innerConflict: "Maintenir la paix et l'unité de Dar-Salam sans jamais sacrifier la vérité ni la justice due aux familles pauvres.",
    relations: [
      { person: 'Yassine', description: "Mentor bienveillant ; il l'accompagne aux archives et dans le désert tout en canalisant son impatience." },
      { person: 'Hadj Mansour', description: "Ferme et juste ; il le protège des accusations sans preuve au marché, mais exige que ses comptes et ses contributions soient vérifiés." },
      { person: 'Les enfants du village', description: "Leur donne la parole lors des assemblées publiques pour qu'ils posent leurs questions sur la gestion de l'eau." }
    ],
    reactions: [
      { situation: 'Querelles autour du puits ou du marché', reaction: "Attend que les voix baissent, lève la main avec calme et distingue systématiquement les faits, les hypothèses et les rumeurs." },
      { situation: "Découverte d'indices dans les registres", reaction: "Rappelle que l'on ne cherche pas une histoire qui plaît, mais la vérité exacte." },
      { situation: 'Face au découragement devant le canal bouché', reaction: "Ne donne pas de fausses promesses : invite à évaluer les moyens, consulter ceux qui savent et protéger les plus fragiles." }
    ],
    evolution: "Il demeure le socle moral du village et instaure une gouvernance transparente où les comptes sont publics, l'entretien partagé et la parole des enfants écoutée."
  },
  {
    id: 'bilal',
    name: 'Bilal',
    aliases: ['Bilal'],
    age: '12 ans',
    role: "Le meilleur ami qui utilise l'humour comme bouclier",
    group: 'principal',
    shortBio: "Joyeux, blagueur et impulsif. Son humour masque sa propre peur et son inquiétude pour son petit frère Ibrahim, mais sa loyauté envers Yassine est sans faille.",
    imageUrl: portraitBilal,
    avatarColor: '#1D4ED8',
    parentsAndFamily: "Grand frère protecteur d'Ibrahim (7 ans). Leur père s'inquiète de la pénurie et leur mère compte chaque réserve d'eau avec angoisse. (Dans certaines illustrations secondaires, la famille d'Aïcha et des jeunes enfants du village lui est associée).",
    appearance: "Garçon de douze ans vif, énergique et toujours en mouvement, au sourire lumineux. Porte une tunique indigo simple souvent poussiéreuse et un bonnet tressé.",
    personality: "Drôle, loyal, spontané et impulsif. Il invente des histoires absurdes (comme les nuages qui se disputent la couleur d'un seau ou l'échange d'une chèvre contre des dattes) pour empêcher la peur de dominer.",
    innerConflict: "Continuer à faire rire pour rassurer son petit frère Ibrahim tout en affrontant la peur bien réelle de la soif et du danger.",
    relations: [
      { person: 'Yassine', description: "Amitié fraternelle indéfectible ; il sait rester silencieux et présent quand Yassine a le cœur lourd." },
      { person: 'Ibrahim (Petit frère)', description: "Tendresse protectrice ; pendant la tempête, sa plus grande peur est de ne jamais revoir Ibrahim." },
      { person: 'Maryam', description: "Duo complice où ses blagues se heurtent au sérieux méthodique de Maryam." },
      { person: 'Karim', description: "Ancienne victime de ses moqueries sur sa pauvreté ; il refuse de le laisser périr et lui apprend à rire avec les autres plutôt que contre eux." }
    ],
    reactions: [
      { situation: 'Quand la peur monte', reaction: "Parle plus vite et plaisante pour détendre l'atmosphère." },
      { situation: 'Séparé pendant la tempête de sable', reaction: "Cesse de faire le malin, pense à son petit frère Ibrahim et reconnaît humblement sa peur dans l'abri." },
      { situation: 'Face aux excuses de Karim', reaction: "Pose une limite franche sans rancune éternelle : il ne pardonne pas tout en un jour, mais lui tend la main quand sa cheville flanche." }
    ],
    evolution: "Il comprend que l'humour est un don précieux pour rapprocher les cœurs, mais qu'il ne remplace ni la prudence ni la reconnaissance sincère de ses émotions."
  },
  {
    id: 'maryam',
    name: 'Maryam',
    aliases: ['Maryam'],
    age: '11 ans',
    role: 'La jeune fille qui ose poser les questions',
    group: 'principal',
    shortBio: "Brillante, courageuse et méthodique. Armée de son carnet, elle observe les fissures du puits, vérifie les registres et refuse les rumeurs sans preuves.",
    imageUrl: portraitMaryam,
    avatarColor: '#9D174D',
    parentsAndFamily: "Fille d'un père qui lui a appris à lire les comptes du foyer et à noter les dépenses, et d'une mère tisserande qui lui a enseigné que chaque fil a besoin des autres pour que toute la trame tienne.",
    appearance: "Jeune fille de onze ans au regard vif, attentif et déterminé, à la posture droite. Porte un foulard traditionnel bordeaux et ocre, et garde toujours contre elle son carnet de notes.",
    personality: "Intelligente, courageuse, méthodique et franche. Elle remarque la fissure au sud du puits, exige des preuves face à Fatou et Hadj Mansour, et rêve de soigner et d'aider les autres grâce au savoir. Son défaut est parfois l'impatience face aux adultes qui l'ignorent parce qu'elle est une fille ou une enfant.",
    innerConflict: "Faire entendre la voix de la raison et de la méthode sans céder à la colère ni à l'arrogance lorsqu'on la rabaisse.",
    relations: [
      { person: 'Yassine', description: "Alliée lucide ; elle l'encourage à rendre la bourse d'or et le retient par le poignet pour l'empêcher de se perdre dans la tempête." },
      { person: 'Bilal', description: "Complicité pleine de réparties ; elle corrige ses exagérations tout en comptant sur son courage." },
      { person: 'Karim', description: "Soigne ses mains écorchées après le ravin sans moquerie ni flatterie, puis l'aide à comprendre les registres." },
      { person: 'Fatou', description: "Confronte ses rumeurs au marché puis accueille sa confession avec justesse." }
    ],
    reactions: [
      { situation: 'Devant une anomalie ou une fissure', reaction: "S'accroupit, touche la pierre, prend des notes précises et propose de vérifier avant de se disputer." },
      { situation: "Quand un adulte se moque d'elle", reaction: "Rougit mais ne baisse pas les yeux : rappelle que ne pas vérifier une idée fait perdre du temps à tout le monde." },
      { situation: 'Pendant la tempête', reaction: "Garde son sang-froid, attache la corde au rocher et sauve Yassine et Karim de la chute." }
    ],
    evolution: "Elle devient la mémoire écrite du chantier du Puits de Nour, tenant les registres publics et apprenant aux plus jeunes comme Ibrahim à lire les comptes."
  },
  {
    id: 'ibrahim',
    name: 'Ibrahim',
    aliases: ['Ibrahim'],
    age: '7 ans',
    role: 'Le petit frère qui regarde le monde sans filtre',
    group: 'principal',
    shortBio: "Petit frère de Bilal, naïf, tendre et curieux. Ses questions simples et directes désarment les adultes et rappellent l'essentiel.",
    imageUrl: portraitIbrahim,
    avatarColor: '#D97706',
    parentsAndFamily: "Petit frère cadet de Bilal (12 ans). Vit avec Bilal et leurs parents à Dar-Salam ; souffre en silence de voir sa mère compter les dernières gouttes d'eau.",
    appearance: "Petit garçon de sept ans au visage juvénile et curieux, nettement plus petit que Bilal et Yassine, vêtu d'une tunique simple et d'un petit bonnet clair.",
    personality: "Innocent, spontané, imaginatif et attachant. Il admire son grand frère Bilal, prend parfois ses blagues au premier degré (prêt à apprendre à bêler au marchand pour avoir des dattes) et pose les questions que personne n'ose formuler simplement.",
    relations: [
      { person: 'Bilal (Grand frère)', description: "Son modèle absolu ; il rit à ses histoires de nuages mais perçoit aussi l'inquiétude des grands." },
      { person: 'Yassine & Maryam', description: "Leur demande pourquoi le puits s'appelle le Puits de Nour et souhaite apprendre à lire les registres avec Maryam et Karim." }
    ],
    reactions: [
      { situation: 'Face aux disputes compliquées des adultes', reaction: "Pose une question candide qui met à nu la contradiction (« Alors, si quelqu'un cache un seau, il faut allumer une lampe ? »)." },
      { situation: 'Retour de l’eau au Puits de Nour', reaction: "Demande le sens du mot Nour (lumière) et s'engage à apprendre à lire et compter." }
    ],
    evolution: "Il incarne la génération future de Dar-Salam à qui l'on transmet les règles écrites et la lecture des registres pour que l'injustice ne se répète plus."
  },
  {
    id: 'hadj-mansour',
    name: 'Hadj Mansour',
    aliases: ['Hadj Mansour', 'Mansour'],
    age: 'Homme mûr (env. 50 ans)',
    role: 'Le marchand qui a peur de perdre le contrôle',
    group: 'conflit',
    shortBio: "Le marchand le plus riche de Dar-Salam. Orgueilleux et méfiant par peur de manquer, il finit par reconnaître ses erreurs de gestion et contribuer au bien commun.",
    imageUrl: portraitHadjMansour,
    avatarColor: '#92400E',
    parentsAndFamily: "Père de Karim (14 ans) et fils d'un marchand qui possédait l'ancien entrepôt à l'extrémité du village. Veut préserver l'honneur et la sécurité matérielle de sa lignée.",
    appearance: "Homme mûr à la posture droite, vêtu d'un boubou impeccable malgré la poussière, d'un turban soigné et d'une bague d'argent au doigt.",
    personality: "Intelligent, prévoyant et discipliné dans les affaires, mais enfermé dans la crainte de perdre ce qu'il a bâti après avoir connu autrefois des trahisons et de mauvaises récoltes. Il confond prudence et fermeture du cœur.",
    innerConflict: "Protéger sa fortune et sa réputation à tout prix, ou accepter la transparence et la responsabilité collective devant le village et son propre fils.",
    woundsAndSecrets: "Des années plus tôt, il a accepté de stocker des sacs de grain destinés à l'entretien du canal dans son entrepôt privé, puis a laissé les comptes devenir confus par peur d'être soupçonné.",
    relations: [
      { person: 'Karim (Son fils)', description: "Exigeant et mesurant tout ; il est bouleversé lorsque Karim choisit la vérité plutôt que le silence familial." },
      { person: 'Yassine', description: "D'abord méfiant et ingrat quand Yassine lui rend sa bourse d'or, puis forcé au respect devant l'intégrité du garçon qui refuse sa récompense." },
      { person: 'Oumar le forgeron', description: "S'oppose durement à lui autour du puits avant d'accepter de fournir outils et matériaux inscrits dans les comptes communs." }
    ],
    reactions: [
      { situation: 'Demande de contribution au puits', reaction: "Croise les bras et invoque les coûts et les risques avant de céder progressivement." },
      { situation: 'Perte et restitution de sa bourse d’or', reaction: "Exige de fouiller le marché, puis compte ses pièces avec suspicion au lieu de remercier Yassine." },
      { situation: 'Confronté par Karim aux registres', reaction: "Ferme les yeux, renonce à mentir à son fils et accepte que les comptes soient vérifiés et réparés publiquement." }
    ],
    evolution: "Il apprend à distinguer la confiance de l'obéissance, porte lui-même une pelle jusqu'à la dépression rocheuse, remet les clés de l'ancien entrepôt et finance un fonds de réparation inscrit au registre public."
  },
  {
    id: 'karim',
    name: 'Karim',
    aliases: ['Karim'],
    age: '14 ans',
    role: "Le fils qui cache sa fragilité derrière l'arrogance",
    group: 'conflit',
    shortBio: "Fils de Hadj Mansour. D'abord arrogant et blessant envers Yassine, il suit l'expédition avec les copies des registres, survit au ravin grâce à Yassine et choisit la vérité.",
    imageUrl: portraitKarim,
    avatarColor: '#4338CA',
    parentsAndFamily: "Fils de Hadj Mansour et de son épouse (mentionnée par Yassine lorsqu'il lui conseille de parler à sa mère et à l'imam). Porte le poids écrasant du nom et des attentes de son père.",
    appearance: "Garçon de quatorze ans, plus grand que Yassine, vêtu d'une tunique propre et de sandales neuves au début, puis les mains bandées et appuyé sur une branche après sa chute au bord du ravin pendant la tempête.",
    personality: "Au départ orgueilleux et moqueur, utilisant l'argent de son père pour dominer et cacher sa solitude (« Mon père mesure tout : les sacs de grain, les pièces, les mots, même les silences »). Au fond, il aspire à être respecté pour ce qu'il est vraiment.",
    innerConflict: "Ne plus être le simple reflet de l'orgueil de son père sans pour autant détruire sa famille.",
    relations: [
      { person: 'Hadj Mansour (Son père)', description: "Crainte de le décevoir ; il trouve finalement le courage de lui demander des comptes avec respect et franchise." },
      { person: 'Yassine', description: "L'humilie au marché sur l'absence de son père, puis est sauvé par lui au bord du ravin et lui confectionne de ses mains une bourse de cuir en signe de repentir." },
      { person: 'Bilal & Maryam', description: "Apprend l'humilité à leurs côtés, aide Maryam aux registres et enseigne les chiffres à Ibrahim." }
    ],
    reactions: [
      { situation: 'Au marché face à Yassine', reaction: "Lance une pique cruelle sur le père de Yassine pour masquer sa propre inquiétude." },
      { situation: 'Suspendu au bord du ravin dans la tempête', reaction: "Toute son arrogance s'effondre ; il s'agrippe à la main de Yassine et demande pardon." },
      { situation: 'De retour à Dar-Salam', reaction: "Refuse de changer de version devant son père et fabrique une bourse de cuir pour Yassine sans exiger un pardon immédiat." }
    ],
    evolution: "De garçon arrogant et solitaire, il devient un adolescent responsable de ses choix, capable de dire la vérité, de s'excuser sans se justifier et de partager son savoir avec les plus jeunes."
  },
  {
    id: 'oumar',
    name: 'Oumar le forgeron',
    aliases: ['Oumar le forgeron', 'Oumar'],
    age: 'Homme robuste (env. 40–50 ans)',
    role: 'Le forgeron qui doit apprendre à maîtriser sa colère',
    group: 'conflit',
    shortBio: "Travailleur acharné aux épaules larges et au grand cœur. Prompt à s'emporter par peur de l'inaction, il dirige avec maîtrise les travaux de maçonnerie du canal et du puits.",
    imageUrl: portraitOumar,
    avatarColor: '#374151',
    parentsAndFamily: "Artisan forgeron de Dar-Salam. Il garde le regret ancien d'un jeune apprenti qu'il avait blessé par une remarque trop brutale et qui avait quitté son atelier.",
    appearance: "Homme robuste aux épaules larges, aux mains marquées par les brûlures et la suie, portant une barbe rarement taillée et des vêtements de travail solides.",
    personality: "Courageux, franc, généreux et travailleur, mais colérique et impatient. Devant un problème humain, il frappe parfois les mots comme il frappe le métal.",
    innerConflict: "Apprendre qu'une main forte peut aussi servir à soutenir avec douceur et qu'un homme peut reconnaître une erreur sans perdre son autorité.",
    relations: [
      { person: 'Maryam', description: "D'abord agacé qu'une enfant interrompe la dispute au puits, il reconnaît aussitôt la justesse de son observation sur la fissure sud." },
      { person: 'Yassine', description: "Lui forge un petit couteau à manche de bois avant le départ et veille sur ses mains blessées pendant les fouilles du canal." },
      { person: 'Hadj Mansour', description: "S'affronte à lui verbalement avant de travailler avec les matériaux fournis pour le bien du village." }
    ],
    reactions: [
      { situation: 'Devant le puits tari', reaction: "Veut creuser immédiatement et hausse la voix contre ceux qui calculent leurs dépenses." },
      { situation: 'Pendant le chantier du canal', reaction: "Fait preuve d'une grande prudence technique, protège les ouvriers des éboulements et oblige Yassine à reposer ses mains blessées." }
    ],
    evolution: "Il reconnaît en assemblée n'avoir autrefois réparé les outils que de ceux qui pouvaient payer, met tout son art au service du Puits de Nour et forme de nouveaux apprentis avec patience."
  },
  {
    id: 'khadija',
    name: 'Khadija la tisseuse',
    aliases: ['Khadija la tisserande', 'Khadija la tisseuse', 'Khadija'],
    age: 'Femme adulte (env. 35–45 ans)',
    role: 'La tisserande qui donne sans savoir demander',
    group: 'conflit',
    shortBio: "Généreuse, discrète et humble. Elle coud des bandes de protection pour le voyage, organise l'entraide et rappelle que chaque fil a besoin des autres pour tenir.",
    imageUrl: portraitKhadija,
    avatarColor: '#7E22CE',
    parentsAndFamily: "Tisserande respectée de Dar-Salam. Dans le récit, la mère de Maryam est également décrite comme tisserande lui ayant appris la leçon des fils et de la trame communautaire.",
    appearance: "Femme au regard doux et attentif, aux gestes précis et patients, vêtue de tissus soignés et d'un foulard coloré.",
    personality: "Généreuse, humble et prévoyante. Elle donne sans chercher les compliments, mais sa faiblesse est de ne jamais oser demander de l'aide pour elle-même par peur d'être un fardeau.",
    relations: [
      { person: 'Yassine, Maryam & les voyageurs', description: "Leur prépare des bandes de tissu cousues solidement contre le sable et rappelle que les nuits du désert sont froides." },
      { person: 'Fatou', description: "L'accueille près d'elle lors des repas communautaires et l'encourage par son écoute." }
    ],
    reactions: [
      { situation: 'Préparatifs du départ vers l’est', reaction: "Apporte discrètement des tissus supplémentaires pour protéger les visages et couvrir ceux qui auraient froid la nuit." },
      { situation: 'Assemblée du village', reaction: "Rappelle la mémoire des familles modestes qui entretenaient autrefois le canal et propose d'afficher publiquement les règles d'équité." }
    ],
    evolution: "Elle comprend que la vraie solidarité ne consiste pas à s'épuiser en silence, mais aussi à accepter de demander et de recevoir l'aide des autres."
  },
  {
    id: 'souleymane',
    name: 'Souleymane le berger',
    aliases: ['Souleymane le berger', 'Souleymane'],
    age: 'Homme adulte (env. 40 ans)',
    role: 'Le berger qui sait lire les signes de la terre',
    group: 'conflit',
    shortBio: "Observateur silencieux et endurant. Il guide l'expédition à travers la tempête de sable et repère l'humidité de l'ancien canal souterrain.",
    imageUrl: portraitSouleymane,
    avatarColor: '#4D7C0F',
    parentsAndFamily: "Fils d'un berger qui lui a appris à lire les signes du désert (les herbes dans les fissures, la fraîcheur des pierres, le comportement des insectes et des oiseaux).",
    appearance: "Homme élancé et endurant, le visage entouré d'un chèche protecteur, tenant toujours son bâton de marche et un ancien compas dans sa poche.",
    personality: "Calme, prudent, réfléchi et humble devant la nature. Il ne confond jamais un indice avec une certitude et refuse les promesses spectaculaires.",
    relations: [
      { person: 'Imam Abdelkarim', description: "Duo de sagesse pratique et spirituelle durant l'expédition dans le désert." },
      { person: 'Yassine, Bilal, Maryam & Karim', description: "Veille sur leur sécurité avec la corde dans la tempête et leur enseigne à lire le terrain sans creuser au hasard." }
    ],
    reactions: [
      { situation: 'Approche de la tempête de sable', reaction: "Remarque aussitôt la disparition des oiseaux et le changement du vent, attache le groupe avec une corde et cherche l'abri rocheux." },
      { situation: 'Devant la dépression rocheuse et le canal', reaction: "Touche et sent la terre humide, filtre l'eau de l'ancienne citerne et guide le dégagement méthodique du conduit." }
    ],
    evolution: "Il cartographie tous les points d'eau et les pistes autour de Dar-Salam et forme les jeunes du village à observer la terre avec rigueur."
  },
  {
    id: 'fatou',
    name: 'Fatou la commère',
    aliases: ['Fatou la commère', 'Fatou'],
    age: 'Femme adulte (env. 35–45 ans)',
    role: 'La femme qui doit apprendre à mesurer ses paroles',
    group: 'conflit',
    shortBio: "Expressive et bavarde, elle colporte au début des rumeurs sans preuve au marché, avant de reconnaître publiquement ses torts et de choisir la sincérité.",
    imageUrl: portraitFatou,
    avatarColor: '#BE185D',
    parentsAndFamily: "Habitante de Dar-Salam, voisine présente au marché et aux assemblées du village.",
    appearance: "Femme expressive portant un foulard aux motifs vifs, souvent vue près des étals de dattes au marché.",
    personality: "Elle n'est pas foncièrement mauvaise et sait aider une voisine malade, mais elle supporte mal de ne pas être au centre de l'attention et répète des rumeurs en y ajoutant des détails.",
    relations: [
      { person: 'Maryam', description: "Maryam la confronte au marché (« Qui te l'a dit ? »), ce qui amorce sa prise de conscience." },
      { person: 'Yassine & Setti Aïcha', description: "Leur avoue avoir colporté pendant des années une rumeur infondée sur le père de Yassine et corrige publiquement ses paroles." }
    ],
    reactions: [
      { situation: 'Au marché pendant la sécheresse', reaction: "Accuse sans preuve une famille d'avoir rempli trois jarres en cachette." },
      { situation: 'Prise de conscience', reaction: "Vient trouver Maryam puis prend la parole en tremblant devant toute l'assemblée pour avouer qu'elle n'avait aucune preuve." }
    ],
    evolution: "Elle cesse de répéter ce qu'elle ignore, interrompt elle-même les nouvelles rumeurs et découvre que la vérité permet de dormir en paix."
  },
  {
    id: 'cheikh-idriss',
    name: 'Cheikh Idriss',
    aliases: ['Cheikh Idriss', 'Le Cheikh Idriss', 'Idriss'],
    age: 'Homme âgé (env. 60–70 ans)',
    role: 'Le voyageur qui connaît une partie du passé',
    group: 'conflit',
    shortBio: "Voyageur mystérieux et ancien compagnon du père de Yassine. Il arrive à Dar-Salam pour aider à faire éclater la vérité avec prudence et exactitude.",
    imageUrl: portraitCheikhIdriss,
    avatarColor: '#57534E',
    parentsAndFamily: "Ami et compagnon de jeunesse du père de Yassine, proche de Setti Aïcha et connu du vieux gardien Sidi et de l'imam Abdelkarim.",
    appearance: "Homme âgé au manteau couvert de poussière, aux sandales usées par la route et au visage marqué par le soleil, s'appuyant sur un bâton poli par des années de marche.",
    personality: "Prudent, patient, réservé et d'une grande honnêteté intellectuelle. Il refuse de livrer à Yassine une accusation incomplète et distingue toujours ce qu'il sait de ce qu'il suppose.",
    relations: [
      { person: 'Yassine', description: "Boit une gorgée de sa gourde à son arrivée, reconnaît le fils de son ami disparu et l'aide à déchiffrer le sceau des registres." },
      { person: 'Setti Aïcha', description: "L'encourage avec respect à ouvrir enfin le vieux coffre et à ne plus laisser Yassine devant une porte fermée." }
    ],
    reactions: [
      { situation: 'Arrivée près du puits tari', reaction: "Reconnaît Yassine au tissu noué à son poignet et retient son émotion avant d'aller parler à Setti Aïcha." },
      { situation: 'Devant les registres et Moussa', reaction: "Reconnaît la marque du cercle traversé de trois lignes et interroge Moussa sans colère mais sans se laisser tromper." }
    ],
    evolution: "Il accompagne l'éclosion de la vérité à Dar-Salam sans se poser en juge suprême, laissant les preuves et l'assemblée établir la justice."
  },
  {
    id: 'moussa',
    name: 'Moussa le menteur',
    aliases: ['Moussa le menteur', 'Moussa'],
    age: 'Jeune adulte (env. 25–30 ans)',
    role: 'Le petit fraudeur qui se justifie par la survie',
    group: 'conflit',
    shortBio: "Petit commerçant rusé et ancien porteur de messages au dépôt. Il tente d'inciter Yassine à garder la bourse d'or, puis finit par révéler ce qu'il a vu douze ans plus tôt.",
    imageUrl: portraitMoussa,
    avatarColor: '#0F766E',
    parentsAndFamily: "Commerçant modeste de Dar-Salam, sans famille riche pour le protéger.",
    appearance: "Jeune homme au sourire en coin, aux gestes mobiles et au regard nerveux, cachant parfois ses affaires sous son manteau.",
    personality: "Charmeur, opportuniste et débrouillard, mais tourmenté par sa lâcheté passée. Il se raconte qu'il n'avait pas le choix pour excuser ses demi-vérités.",
    relations: [
      { person: 'Yassine', description: "Lui souffle de garder la bourse trouvée au marché, puis est ébranlé par la droiture du garçon." },
      { person: 'Cheikh Idriss & Imam Abdelkarim', description: "Finit par leur avouer qu'il avait vu un registre être emporté sur une charrette à la roue fendue." }
    ],
    reactions: [
      { situation: 'Quand Yassine trouve la bourse d’or', reaction: "Lui conseille de la garder en affirmant que la faim ne patiente pas." },
      { situation: 'Interrogé sur les anciens registres', reaction: "Change d'abord plusieurs fois de version par peur des représailles, avant d'avouer la vérité sur le registre déplacé." }
    ],
    evolution: "Ses excuses faciles se fissurent ; il accepte de témoigner sur ce qu'il a réellement vu et de reconnaître sa part de responsabilité."
  },
  {
    id: 'vieux-sidi',
    name: 'Le vieux Sidi',
    aliases: ['Le vieux Sidi', 'Sidi'],
    age: 'Vieillard (env. 70–75 ans)',
    role: "Le sage oublié et gardien de l'ancien dépôt",
    group: 'secondaire',
    shortBio: "Gardien de l'ancien dépôt des registres derrière les étals des tisserands. Il a conservé le cahier de livraison et la page pliée portant le sceau du cercle à trois lignes.",
    imageUrl: portraitVieuxSidi,
    avatarColor: '#6D28D9',
    parentsAndFamily: "Ancien employé et gardien de la mémoire administrative des caravanes de Dar-Salam.",
    appearance: "Vieil homme à la barbe blanche et au bonnet traditionnel, au regard calme et attentif.",
    personality: "Discret, méthodique et fidèle à sa tâche. Même lorsque plus personne ne venait consulter les archives, il a conservé les cahiers oubliés.",
    relations: [
      { person: 'Cheikh Idriss', description: "Le reconnaît dès son retour (« Je me demandais si tu reviendrais un jour »)." },
      { person: 'Yassine & Setti Aïcha', description: "Leur apporte à la maison le paquet enveloppé de toile contenant la copie du registre annoté." }
    ],
    reactions: [
      { situation: 'Visite au dépôt des registres', reaction: "Guide l'imam, Idriss et Yassine vers les étagères et sort le cahier non officiel qu'il avait précieusement gardé." }
    ],
    evolution: "Sa patience et sa mémoire permettent d'authentifier les marques de transport et de rétablir la vérité sur les livraisons de grain."
  },
  {
    id: 'aicha-veuve',
    name: 'Aïcha (la mère courageuse)',
    aliases: ['Aïcha'],
    age: 'Femme adulte (env. 30–40 ans)',
    role: 'Veuve qui élève seule ses enfants',
    group: 'secondaire',
    shortBio: "Femme digne et courageuse de Dar-Salam qui élève ses enfants au milieu de la pénurie. Forte mais souvent épuisée, elle incarne les familles vulnérables que le puits doit protéger.",
    imageUrl: portraitAichaVeuve,
    avatarColor: '#B91C1C',
    parentsAndFamily: "Mère de famille élevant ses enfants avec courage dans le quartier modeste de Dar-Salam.",
    appearance: "Femme au visage digne et fatigué, portant un voile traditionnel aux tons chauds.",
    personality: "Silencieuse dans l'épreuve, digne et résiliente ; elle fait partie de celles qui ne crient pas autour du puits mais qui ont le plus à perdre.",
    relations: [
      { person: 'Khadija & Setti Aïcha', description: "Soutenue par l'entraide discrète des femmes du village." },
      { person: 'Yassine & Bilal', description: "Inspire à Yassine la prise de conscience que les plus silencieux sont souvent ceux qui souffrent le plus." }
    ],
    reactions: [
      { situation: 'Face à la pénurie d’eau', reaction: "Attend patiemment son tour avec dignité sans entrer dans les querelles bruyantes." }
    ],
    evolution: "Grâce aux nouvelles règles équitables du Puits de Nour, son foyer est protégé en priorité avec discrétion et respect."
  },
  {
    id: 'noura',
    name: 'Noura',
    aliases: ['Noura'],
    age: 'Adolescente (env. 14–16 ans)',
    role: 'La jeune guérisseuse',
    group: 'secondaire',
    shortBio: "Jeune fille attentive de Dar-Salam qui rêve d'aider les autres et de devenir une grande guérisseuse, partageant avec Maryam l'amour du savoir utile.",
    imageUrl: portraitNoura,
    avatarColor: '#047857',
    parentsAndFamily: "Jeune habitante de Dar-Salam engagée dans le soin et l'entraide auprès des anciens et des enfants.",
    appearance: "Jeune fille au regard doux et posé, coiffée d'un foulard vert émeraude.",
    personality: "Empathique, studieuse et dévouée au soin des blessures et de la santé des villageois.",
    relations: [
      { person: 'Maryam', description: "Partage avec elle l'ambition d'apprendre à soigner et d'aider la communauté par la connaissance." }
    ],
    reactions: [
      { situation: 'Pendant la crise du village', reaction: "Observe et assiste les plus fragiles avec calme et bienveillance." }
    ],
    evolution: "Participe au renouveau de Dar-Salam où le savoir et le soin sont transmis au service de tous."
  },
  {
    id: 'amadou',
    name: 'Amadou',
    aliases: ['Amadou'],
    age: '11–12 ans',
    role: "L'enfant jaloux en quête d'affection",
    group: 'secondaire',
    shortBio: "Jeune garçon du village (parent/camarade de Yassine) qui manifeste parfois de la jalousie ou suivait Karim, mais cache un grand besoin d'amour et de reconnaissance.",
    imageUrl: portraitAmadou,
    avatarColor: '#CA8A04',
    parentsAndFamily: "Mentionné sur la planche des personnages comme jeune parent (« neveu / cousin ») de Yassine à Dar-Salam.",
    appearance: "Jeune garçon au regard sérieux et un peu sur la défensive, portant une tunique beige et un bonnet tressé.",
    personality: "Parfois jaloux ou influençable lorsqu'il cherche à être accepté, mais sensible et capable d'apprendre lorsque les enfants prennent la parole.",
    relations: [
      { person: 'Yassine & Karim', description: "Observe l'évolution de Karim et la droiture de Yassine, comprenant que la valeur ne vient pas de la moquerie." }
    ],
    reactions: [
      { situation: 'Face aux moqueries de groupe', reaction: "Suit d'abord les plus forts avant de comprendre que le respect véritable se construit dans l'entraide." }
    ],
    evolution: "Rejoint le cercle des enfants autour de Setti Aïcha et de la mosquée pour apprendre à lire les registres et aider au puits."
  },
  {
    id: 'pere-yassine',
    name: 'Le Père de Yassine',
    aliases: ['son père', 'Son père', 'mon père', 'ton père'],
    age: 'Disparu il y a 12 ans',
    role: "La mémoire qui traverse l'histoire",
    group: 'secondaire',
    shortBio: "Homme courageux, honnête mais impatient. Il a découvert les irrégularités dans les réserves d'eau et de grain douze ans plus tôt et est parti chercher des témoins et des preuves.",
    imageUrl: portraitPereYassine,
    avatarColor: '#9A3412',
    parentsAndFamily: "Fils de Setti Aïcha et père de Yassine. Parti lorsque Yassine était tout petit en laissant une écharpe brodée, une pièce gravée, une lettre d'amour paternel et une lettre adressée aux habitants de Dar-Salam.",
    appearance: "Présent dans les souvenirs, le coffre de bois et les lettres : il partage avec Yassine la même manière de froncer les sourcils lorsqu'il cherche à comprendre une injustice.",
    personality: "Courageux, intègre, attentif aux familles pauvres, mais parfois impatient et solitaire dans sa manière de porter la vérité sans attendre d'avoir rassemblé toutes les preuves.",
    innerConflict: "Défendre immédiatement les familles lésées de Dar-Salam ou prendre le temps de réunir des preuves incontestables avec prudence.",
    woundsAndSecrets: "Dans sa lettre à Yassine, il écrit : « Si je tarde, ne laisse pas mon fils croire que je l'ai oublié. » Il n'est pas parti par abandon, mais pour chercher les témoins capables de confirmer l'emplacement des réserves et l'état du canal.",
    relations: [
      { person: 'Yassine (Son fils)', description: "Lui lègue son exigence de vérité, mais Yassine apprend à ne pas répéter son isolement." },
      { person: 'Setti Aïcha (Sa mère)', description: "Lui a confié le coffre et ses deux lettres avant son départ." },
      { person: 'Cheikh Idriss', description: "Son compagnon de route avec qui il s'est séparé à la halte caravanière après une tempête." }
    ],
    reactions: [
      { situation: 'Découverte des sacs manquants et du canal négligé', reaction: "Refuse de se taire malgré les pressions et note les irrégularités." }
    ],
    evolution: "Sa mémoire est réhabilitée avec nuance à Dar-Salam : ni voleur comme le disaient les rumeurs, ni héros infaillible, mais un homme juste dont l'œuvre est achevée collectivement par son fils et le village."
  }
];
