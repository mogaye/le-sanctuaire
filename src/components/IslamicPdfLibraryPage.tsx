import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Sparkles,
  Shield,
  Eye,
  CheckCircle2,
  Bookmark,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Flame,
} from 'lucide-react';
import { ISLAMIC_PDF_LIBRARY, PdfIslamicBook } from '../data/islamicLibraryData';
import { PdfBookViewer } from './PdfBookViewer';

interface IslamicPdfLibraryPageProps {
  onBackToHome: () => void;
  onOpenStoryLibrary?: () => void;
  initialBookId?: string;
  onReadingStateChange?: (isReading: boolean) => void;
}

export const IslamicPdfLibraryPage: React.FC<IslamicPdfLibraryPageProps> = ({
  onBackToHome,
  onOpenStoryLibrary,
  initialBookId,
  onReadingStateChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBookForReader, setActiveBookForReader] = useState<PdfIslamicBook | null>(() => {
    if (initialBookId) {
      return ISLAMIC_PDF_LIBRARY.find((b) => b.id === initialBookId) || null;
    }
    return null;
  });

  const handleOpenBook = (book: PdfIslamicBook) => {
    setActiveBookForReader(book);
    onReadingStateChange?.(true);
  };

  const handleCloseReader = () => {
    setActiveBookForReader(null);
    onReadingStateChange?.(false);
  };

  const categories = [
    { id: 'all', label: 'Tous les livres' },
    { id: 'new', label: '✨ Récemment ajoutés' },
    { id: 'piete', label: 'Piété & Taqwâ' },
    { id: 'spiritualite', label: 'Patience & Remerciement' },
    { id: 'fiqh', label: 'Fiqh & Zakât' },
    { id: 'sirah', label: 'Sîrah (Prophète ﷺ)' },
    { id: 'methodologie', label: 'Méthodologie & Savants' },
    { id: 'foi', label: 'Foi & Au-Delà' },
  ];

  const filteredBooks = useMemo(() => {
    return ISLAMIC_PDF_LIBRARY.filter((book) => {
      if (selectedCategory === 'new' && !book.isNewUpload) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'new' && book.category !== selectedCategory) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(q) ||
        book.arabicTitle.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q) ||
        book.categoryLabel.toLowerCase().includes(q) ||
        book.highlights.some((h) => h.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#112218] text-neutral-900 dark:text-neutral-100 font-sans pb-28 md:pb-16 transition-colors duration-200">
      {/* If reader is open, render secure viewer */}
      {activeBookForReader && (
        <PdfBookViewer book={activeBookForReader} onClose={handleCloseReader} />
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#152B20]/95 backdrop-blur-md border-b border-emerald-200/80 dark:border-emerald-500/25 shadow-xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-neutral-100 dark:bg-emerald-950/70 hover:bg-neutral-200 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-neutral-200 dark:border-emerald-800/60 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Accueil</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white leading-tight">
                  Bibliothèque des Épîtres & Ouvrages
                </h1>
                <p className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300/80 font-medium">
                  Traités de savants authentiques • Lecture protégée intégrée
                </p>
              </div>
            </div>
          </div>

          {onOpenStoryLibrary && (
            <button
              type="button"
              onClick={onOpenStoryLibrary}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-600/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Récits & Histoire</span>
              <span className="sm:hidden">Récits</span>
            </button>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-8 sm:py-12 bg-gradient-to-b from-emerald-950 via-[#132A1F] to-[#112218] text-white border-b border-emerald-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>NOUVELLE BIBLIOTHÈQUE ISLAMIQUE DÉDIÉE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Ouvrages, Guides & Épîtres Précieuses
          </h2>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-emerald-100/90 leading-relaxed mb-6">
            Lisez directement en ligne les traités majeurs des grands savants de l'Islam (Cheikh Al-Islâm Ibn Taymiyyah, Cheikh 'Oubayd Al-Jâbirî, Cheikh 'Abdoullâh Al-Boukhârî, Cheikh Ibn Bâz, Cheikh Haytham Sarhan). Consultation intégrale en pleine page sans téléchargement direct.
          </p>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-bold">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>7 Traités ajoutés récemment</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lecture fidèle originale</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Accès réservé sans téléchargement</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH & FILTERS BAR */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, auteur (Ibn Taymiyyah, Al-Jâbirî, etc.), thématique..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#183225] border border-emerald-200 dark:border-emerald-800/80 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-emerald-400/60 focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>

          {/* Result counter */}
          <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 self-center">
            {filteredBooks.length} ouvrage{filteredBooks.length > 1 ? 's' : ''} disponible{filteredBooks.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Filter categories pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-white dark:bg-[#183225] text-neutral-700 dark:text-emerald-200/90 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* BOOKS GRID */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#183225] border border-emerald-200/80 dark:border-emerald-800/60 max-w-md mx-auto my-8">
            <BookOpen className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800 dark:text-white mb-1">
              Aucun ouvrage ne correspond à votre recherche
            </h3>
            <p className="text-xs text-neutral-500 dark:text-emerald-300/80 mb-4">
              Essayez avec un autre mot-clé ou réinitialisez le filtre.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Voir tous les ouvrages
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredBooks.map((book) => {
              return (
                <div
                  key={book.id}
                  className="rounded-3xl bg-white dark:bg-[#162D21] border border-emerald-200/80 dark:border-emerald-500/25 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    {/* Top Bar with Category & Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-600/40">
                        {book.categoryLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {book.isNewUpload && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 animate-pulse">
                            Nouveau
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-neutral-500 dark:text-emerald-400">
                          {book.pagesCount} p.
                        </span>
                      </div>
                    </div>

                    {/* Arabic Calligraphy Header */}
                    {book.arabicTitle && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-[#10291D] border border-emerald-800/40 text-center">
                        <p className="font-arabic text-xl sm:text-2xl text-amber-300 leading-relaxed font-bold">
                          {book.arabicTitle}
                        </p>
                      </div>
                    )}

                    {/* Title & Author */}
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                        {book.author}
                      </p>
                      {book.authorTitle && (
                        <p className="text-[11px] text-neutral-500 dark:text-emerald-400/70">
                          {book.authorTitle}
                        </p>
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-neutral-600 dark:text-emerald-100/80 leading-relaxed line-clamp-3">
                      {book.description}
                    </p>

                    {/* Key Highlights */}
                    <div className="space-y-1.5 pt-1">
                      {book.highlights.slice(0, 2).map((h, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-500 dark:text-emerald-300/80">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-emerald-800/40 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 dark:text-emerald-400/70">
                      <Shield className="w-3 h-3 text-emerald-500" />
                      <span>Lecture sur place</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenBook(book)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ouvrir & Lire</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
