export interface IslamicStory {
  id: string;
  title: string;
  subtitle: string;
  category: 'prophetes' | 'compagnons' | 'sagesse' | 'morale';
  arabicQuote?: string;
  quoteSource?: string;
  content: string[]; // Paragraphes de l'histoire
  moralLesson: string;
  readTime: string;
  author: string;
  date: string;
}

// Collection d'histoires que vous (administrateur/auteur) écrivez et enrichissez directement ici dans le code
export const ISLAMIC_STORIES: IslamicStory[] = [
  {
    id: 'l-homme-au-chien-soif',
    title: 'La Miséricorde envers toute créature',
    subtitle: 'L’homme qui abreuva un chien assoiffé',
    category: 'sagesse',
    arabicQuote: 'فِي كُلِّ ذَاتِ كَبِدٍ رَطْبَةٍ أَجْرٌ',
    quoteSource: 'Sahih Al-Bukhari (2466)',
    readTime: '3 min',
    author: 'Rédaction Le Sanctuaire',
    date: '16 Septembre 2026',
    content: [
      "Tandis qu'un voyageur marchait le long d'un sentier aride et brûlant, une soif cuisante s'empara de lui. Après une longue quête sous un soleil de plomb, il aperçut un puits. Il descendit au fond de la cavité rocheuse, étancha sa soif et remonta à la surface avec soulagement.",
      "En reprenant son souffle, son regard se posa sur un chien haletant. L'animal, consumé par une soif extrême, léchait la terre humide et mordait la poussière pour en extraire quelques gouttes de fraîcheur.",
      "L'homme fut saisi d'une profonde compassion. Il se dit en son cœur : « Cette pauvre bête souffre de la même soif dévorante qui me torturait il y a un instant. »",
      "N'ayant aucun récipient sous la main, il redescendit dans la pénombre du puits. Il retira sa chaussure de cuir, la remplit d'eau pure, la saisit entre ses dents pour pouvoir s'agripper à la paroi rocheuse et remonta avec peine.",
      "Il tendit alors la chaussure au chien qui but jusqu'à apaiser complètement sa soif. Dieu accueillit cet acte de bonté avec agrément, lui pardonna ses péchés et lui ouvrit les portes de Sa miséricorde infinie."
    ],
    moralLesson: "Même le plus humble des actes de compassion, accompli avec sincérité et sans spectateur humain, possède un poids immense auprès du Créateur."
  },
  {
    id: 'la-patience-du-cordonnier',
    title: 'Le Trésor de la Confiance en Dieu',
    subtitle: 'La foi inébranlable du vieil artisan',
    category: 'morale',
    arabicQuote: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    quoteSource: 'Sourate At-Talaq (Le Divorce), Verset 3',
    readTime: '4 min',
    author: 'Rédaction Le Sanctuaire',
    date: '16 Septembre 2026',
    content: [
      "Dans une ruelle tranquille de Médine vivait un cordonnier âgé, réputé pour sa probité et son calme rayonnant. Chaque matin, après la prière de l'Aube (Fajr), il ouvrait son petit atelier, invoquait le Nom divin et réparait avec soin les sandales des passants et des voyageurs.",
      "Un jour, une sécheresse prolongée frappa la région et les habitants commencèrent à s'inquiéter pour leur subsistance. Un voisin lui demanda : « Ô artisan, ne crains-tu pas pour le pain de demain ? La disette s'installe. »",
      "Le vieil homme leva les yeux avec un sourire serein et répondit : « Mon cher frère, Dieu pourvoit à la nourriture du petit oiseau dans le nid caché de la forêt, et au ver sous la pierre sombre. Comment pourrais-je douter qu'Il Se souvienne de moi alors que je L'invoque cinq fois par jour ? »",
      "Quelques jours plus tard, une caravane commerciale égarée fit halte dans la ville, cherchant un maître artisan capable de restaurer d'urgence les harnais et les semelles de toute l'expédition. L'artisan reçut de quoi subvenir à sa famille et partagea une grande partie de ses gains avec les indigents du quartier."
    ],
    moralLesson: "Le véritable Tawakkul (confiance totale en Dieu) n'est pas l'inaction, mais un cœur libéré de l'angoisse tout en agissant avec constance et rectitude."
  },
  {
    id: 'le-pardon-du-prophete-taif',
    title: 'La Grandeur du Pardon',
    subtitle: 'L’épreuve de Taïf et l’ange des montagnes',
    category: 'prophetes',
    arabicQuote: 'اللَّهُمَّ اغْفِرْ لِقَوْمِي فَإِنَّهُمْ لَا يَعْلَمُونَ',
    quoteSource: 'Sahih Al-Bukhari & Muslim',
    readTime: '5 min',
    author: 'Rédaction Le Sanctuaire',
    date: '16 Septembre 2026',
    content: [
      "Après la perte douloureuse de son épouse Khadija et de son protecteur Abou Talib, le Messager d’Allah ﷺ se rendit à pied à la cité de Taïf, avec l'espoir d'y trouver une oreille attentive au message divin.",
      "Les chefs de la ville refusèrent hautainement son appel et incitèrent les insensés et les jeunes à le pourchasser. Ils lui jetèrent des pierres avec tant de violence que ses pieds nobles saignèrent, et qu'il dut trouver refuge dans un verger ombragé.",
      "Là, assis dans la solitude et la douleur physique, il n'adressa pas une malédiction contre ses persécuteurs, mais leva les mains au ciel avec une humilité poignante : « Ô Allah, c’est à Toi seul que je me plains de ma faiblesse, de mon impuissance et du mépris des gens à mon égard... »",
      "Aussitôt, l’Ange Gabriel descendit accompagné de l’Ange gardien des montagnes, qui dit : « Si tu le souhaites, je refermerai sur eux les deux collines qui enserrent la vallée. »",
      "Mais le Prophète de la Miséricorde ﷺ répondit sans hésiter : « Non, j'espère plutôt qu'Allah fera sortir de leurs descendants des êtres qui adoreront Dieu l'Unique sans rien Lui associer. »"
    ],
    moralLesson: "La véritable force d'une âme réside dans sa capacité à pardonner et à espérer le bien pour autrui même au cœur de l'injustice la plus rude."
  }
];
