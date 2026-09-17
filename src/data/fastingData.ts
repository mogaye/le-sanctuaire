export interface FastingRuleCategory {
  title: string;
  subtitle: string;
  items: {
    question: string;
    ruling: 'invalide' | 'autorise' | 'recommande' | 'deconseille';
    verdictLabel: string;
    explanation: string;
    dalilSource: string;
  }[];
}

export const FASTING_CONDITIONS = [
  {
    title: "1. L'Islam",
    desc: "Le jeûne n'est pas agréé du mécréant tant qu'il n'embrasse pas l'Islam.",
    badge: "Condition d'acceptation",
  },
  {
    title: "2. La Puberté (Bulûgh)",
    desc: "Obligatoire dès que l'enfant atteint la puberté. Les parents doivent toutefois encourager les plus jeunes à jeûner progressivement selon leur endurance.",
    badge: "Condition d'obligation",
  },
  {
    title: "3. La Raison ('Aql)",
    desc: "La personne privée de ses facultés mentales n'est soumise à aucune obligation ni rattrapage légal.",
    badge: "Condition d'obligation",
  },
  {
    title: "4. La Capacité Physique (Qudrah)",
    desc: "Le malade incurable ou la personne très âgée incapable de supporter la faim sans péril sont exemptés et versent une compensation (Fidya).",
    badge: "Condition d'obligation",
  },
  {
    title: "5. La Résidence (Iqâmah)",
    desc: "Le voyageur qui parcourt la distance légale du voyage a la permission de rompre son jeûne et devra rattraper ultérieurement les jours manqués.",
    badge: "Condition d'obligation",
  },
  {
    title: "6. La Pureté Rituelle Féminine",
    desc: "L'absence de règles (Haydh) et de lochies (Nifâs). La femme ne jeûne pas durant cette période et rattrape chaque jour après le Ramadan.",
    badge: "Condition de validité",
  },
];

export const FASTING_PILLARS = [
  {
    title: "1. L'Intention Sincère (An-Niyyah)",
    arabic: "النِّيَّةُ",
    description: "Former dans son cœur le dessein d'accomplir le jeûne prescrit d'Allah avant le lever de l'aube (Fajr). Elle ne se prononce pas à voix haute.",
    hadith: "« Point de jeûne pour celui qui ne l'a pas résolu avant l'aube. » (Abou Daoud, At-Tirmidhi)",
  },
  {
    title: "2. L'Abstinence Complète (Al-Imsâk)",
    arabic: "الإِمْسَاكُ",
    description: "S'abstenir de boire, de manger, et de toute relation intime depuis le deuxième appel à la prière de l'aube jusqu'au coucher complet du soleil.",
    hadith: "« Mangez et buvez jusqu'à ce que se distingue le fil blanc du fil noir de l'aube, puis accomplissez le jeûne jusqu'à la nuit. » (Coran 2:187)",
  },
];

export const FASTING_RULES_ACCORDING_TO_IBN_BAZ: FastingRuleCategory[] = [
  {
    title: "Ce qui annule le jeûne (Mufattirât)",
    subtitle: "Règles strictes selon la Sunnah et l'avis de Cheikh Ibn Baz",
    items: [
      {
        question: "Manger ou boire volontairement",
        ruling: "invalide",
        verdictLabel: "Rompt le jeûne",
        explanation: "Ingérer un aliment ou une boisson délibérément annule immédiatement le jeûne. Le croyant doit se repentir et rattraper le jour.",
        dalilSource: "Consensus des savants (Ijmâ')",
      },
      {
        question: "Les rapports charnels en journée",
        ruling: "invalide",
        verdictLabel: "Annulation grave + Kaffâra",
        explanation: "Annule le jeûne et exige la grande expiation : libérer un esclave, ou jeûner deux mois consécutifs, ou à défaut nourrir 60 pauvres.",
        dalilSource: "Sahih Al-Bukhari & Muslim",
      },
      {
        question: "Le vomissement provoqué volontairement",
        ruling: "invalide",
        verdictLabel: "Rompt le jeûne",
        explanation: "Si le jeûneur provoque lui-même son vomi, son jeûne est rompu. En revanche, si le vomi survient de manière involontaire, le jeûne reste parfaitement valide.",
        dalilSource: "Hadith Abou Daoud & At-Tirmidhi",
      },
      {
        question: "Les perfusions et injections nutritives",
        ruling: "invalide",
        verdictLabel: "Rompt le jeûne",
        explanation: "Les perfusions de glucose, vitamines ou sérum apportant des éléments nutritifs au corps tiennent lieu de nourriture et annulent le jeûne.",
        dalilSource: "Fatwa Cheikh Ibn Baz",
      },
    ],
  },
  {
    title: "Ce qui n'annule PAS le jeûne (Idées reçues)",
    subtitle: "Actes autorisés souvent craints à tort",
    items: [
      {
        question: "Manger ou boire par oubli total",
        ruling: "autorise",
        verdictLabel: "Jeûne 100% Valide",
        explanation: "Celui qui mange ou boit par oubli doit simplement s'arrêter dès qu'il s'en rappelle et poursuivre son jeûne. C'est Allah qui l'a nourri et abreuvé.",
        dalilSource: "Sahih Al-Bukhari & Muslim",
      },
      {
        question: "Utiliser le Siwâk ou la brosse à dents",
        ruling: "autorise",
        verdictLabel: "Autorisé & Recommandé",
        explanation: "Le Siwak est une Sunnah recommandée à tout moment de la journée. La brosse à dents est permise en veillant scrupuleusement à ne pas avaler le dentifrice.",
        dalilSource: "Sunnah prophétique",
      },
      {
        question: "Les collyres pour les yeux ou gouttes pour les oreilles",
        ruling: "autorise",
        verdictLabel: "Autorisé",
        explanation: "Selon Cheikh Ibn Baz et la majorité des juristes contemporains, les yeux et les oreilles ne constituent pas un canal alimentaire naturel.",
        dalilSource: "Fatwas contemporaines Cheikh Ibn Baz",
      },
      {
        question: "La prise de sang pour examen médical",
        ruling: "autorise",
        verdictLabel: "Autorisé",
        explanation: "Un prélèvement sanguin pour une analyse de laboratoire n'affecte pas la validité du jeûne car la quantité extraite est minime.",
        dalilSource: "Comité permanent des savants",
      },
      {
        question: "Prendre une douche pour se rafraîchir",
        ruling: "autorise",
        verdictLabel: "Autorisé",
        explanation: "Le Prophète ﷺ versait de l'eau sur sa tête à cause de la chaleur et de la soif alors qu'il jeûnait.",
        dalilSource: "Rapporté par Abou Daoud",
      },
      {
        question: "Le parfum, l'encens et les odeurs",
        ruling: "autorise",
        verdictLabel: "Autorisé",
        explanation: "Se parfumer est permis. Cependant, il est déconseillé d'inhaler profondément la fumée épaisse de l'encens car elle peut atteindre l'estomac.",
        dalilSource: "Cheikh Ibn Baz",
      },
    ],
  },
];

export const RAMADAN_SPIRITUAL_PRACTICES = [
  {
    title: "La Prière de Tarâwîh & Qiyâm",
    desc: "Priée chaque nuit après la prière de l'Icha en groupe ou individuellement. Selon Cheikh Ibn Baz, la Sunnah préconise 11 ou 13 rakats avec récitation posée et recueillement profond, bien que plus de rakats soient permises selon le consensus.",
  },
  {
    title: "La Nuit du Destin (Laylat Al-Qadr)",
    desc: "Vaut mieux que mille mois d'adoration (plus de 83 ans). Elle se recherche avec assiduité lors des nuits impaires des dix derniers jours (21, 23, 25, 27, 29).",
    duaArabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    duaPhonetic: "Allâhoumma innaka ‘Afouwwoune, touhibboul-‘afwa, fa’fou ‘annî.",
    duaFrench: "« Ô Allah ! Tu es Pardonneur, Tu aimes le pardon, alors pardonne-moi. »",
  },
  {
    title: "La Zakat Al-Fitr (Aumône de rupture)",
    desc: "Obligatoire pour chaque musulman (homme, femme, enfant). Elle consiste en un Sa’ (environ 2,5 à 3 kg) de denrée alimentaire de base du pays (riz, blé, dattes) donnée aux pauvres avant la prière de l’Aïd pour purifier le jeûneur de ses manquements.",
  },
];
