import { PUITS_DE_NOUR_HERO_IMAGE } from './puitsDeNourCharacters';

export interface IslamicBook {
  id: string;
  title: string;
  arabicTitle?: string;
  author: string;
  category:
    | 'Coran'
    | 'Jeûne & Ramadan'
    | 'Foi & Croyance (Aqida)'
    | 'Récit & Sagesse'
    | 'foi'
    | 'jeune';
  description: string;
  pages?: string;
  pageEstimate?: string;
  chaptersCount?: number;
  charactersCount?: number;
  pdfUrl?: string;
  coverImage?: string;
  coverGradient: string;
  accentColor: string;
  featured?: boolean;
  publishedAt?: string;
  isInteractiveBook?: boolean;
}

export const ISLAMIC_BOOKS: IslamicBook[] = [
  {
    id: 'le-puits-de-nour',
    title: 'Le Puits de Nour',
    arabicTitle: 'بِئْرُ نُور — دَارُ السَّلَام',
    author: 'Édition Originale du Sanctuaire',
    category: 'Récit & Sagesse',
    description:
      "Dans le village d'oasis de Dar-Salam frappé par la sécheresse, le jeune Yassine (12 ans), élevé par sa grand-mère Setti Aïcha, découvre que le tarissement du grand puits cache une vérité enfouie depuis le départ mystérieux de son père. Entre l'épreuve de la pièce d'or, la traversée de la tempête de sable et la restauration de la justice, un récit initiatique profond sur l'honnêteté, la responsabilité collective, le pardon et la lumière de la vérité.",
    pages: '4 Chapitres & Épilogue (Texte intégral)',
    chaptersCount: 4,
    charactersCount: 19,
    coverImage: PUITS_DE_NOUR_HERO_IMAGE,
    coverGradient: 'from-amber-700 via-amber-900 to-stone-950',
    accentColor: 'amber',
    featured: true,
    publishedAt: 'Parution du Vendredi — Disponible maintenant',
    isInteractiveBook: true,
  },
];
