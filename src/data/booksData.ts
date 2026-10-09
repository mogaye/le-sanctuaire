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

// Les livres authentiques sortent chaque vendredi à 21h00
export const ISLAMIC_BOOKS: IslamicBook[] = [];
