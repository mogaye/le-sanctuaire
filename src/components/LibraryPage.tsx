import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Download,
  ExternalLink,
  Maximize2,
  X,
  FileText,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ISLAMIC_BOOKS, IslamicBook } from '../data/booksData';

interface LibraryPageProps {
  onBackToHome: () => void;
  initialBookId?: string;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onBackToHome,
  initialBookId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'coran' | 'jeune' | 'foi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReadingBook, setActiveReadingBook] = useState<IslamicBook | null>(
    initialBookId ? ISLAMIC_BOOKS.find((b) => b.id === initialBookId) || null : null
  );
  const [isFullscreenReader, setIsFullscreenReader] = useState(false);

  const filteredBooks = ISLAMIC_BOOKS.filter((b) => {
    const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.arabicTitle.includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.topics.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#14261C] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans pb-28 md:pb-16 transition-colors duration-300">
      {/* STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-emerald-500/25 shadow-2xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-500/40 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            <span className="hidden sm:inline">Retour au Sanctuaire</span>
            <span className="sm:hidden">Accueil</span>
          </button>

          <div className="flex items-center gap-2 text-left sm:text-center truncate min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-800 dark:to-emerald-950 text-emerald-800 dark:text-amber-200 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              م
            </div>
            <div className="min-w-0 truncate">
              <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-tight truncate">
                Bibliothèque Islamique & Ouvrages Numérisés (المكتبة)
              </h1>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-medium truncate">
                6 Ouvrages de Référence Authentiques en Lecture Directe
              </p>
            </div>
          </div>

          <div className="hidden sm:block shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              {ISLAMIC_BOOKS.length} Livres Inclus
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full space-y-4 sm:space-y-6">
        {/* ACTIVE READER MODAL / EMBEDDED VIEW */}
        {activeReadingBook && (
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-3 sm:space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-neutral-200 dark:border-emerald-800/40">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-amber-300 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-arabic text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-200">
                      {activeReadingBook.arabicTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                      {activeReadingBook.pageEstimate} p.
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-lg font-black text-neutral-900 dark:text-white mt-0.5 truncate">
                    {activeReadingBook.title}
                  </h3>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 truncate">{activeReadingBook.author}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <a
                  href={activeReadingBook.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 border border-neutral-200 dark:border-emerald-500/20 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                  <span>Plein Écran</span>
                </a>
                <a
                  href={activeReadingBook.pdfUrl}
                  download={activeReadingBook.pdfFileName}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs border border-emerald-600 dark:border-emerald-400/30"
                  title="Télécharger le fichier PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger</span>
                </a>
                <button
                  onClick={() => setActiveReadingBook(null)}
                  className="p-1.5 rounded-xl bg-neutral-100 hover:bg-rose-100 dark:bg-[#14281E] dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-300 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-emerald-500/20 transition-all cursor-pointer"
                  title="Fermer le lecteur"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* EMBEDDED VIEWER */}
            <div className="w-full h-[380px] sm:h-[650px] bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-inner border border-neutral-200 dark:border-emerald-500/30 relative">
              <iframe
                src={`${activeReadingBook.pdfUrl}#toolbar=1&navpanes=1`}
                className="w-full h-full border-0"
                title={activeReadingBook.title}
              />
            </div>

            {/* Book Details and Chapters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-2">
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                  Structure & Chapitres de l'Ouvrage :
                </h4>
                <div className="space-y-2">
                  {activeReadingBook.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 space-y-0.5 text-xs transition-colors"
                    >
                      <span className="font-extrabold text-amber-800 dark:text-amber-200 block">{ch.title}</span>
                      <p className="text-neutral-600 dark:text-neutral-300 font-medium">{ch.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                  Citations Notables :
                </h4>
                <div className="space-y-2">
                  {activeReadingBook.keyQuotes.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14281E] border border-amber-200 dark:border-amber-500/20 text-xs space-y-1 transition-colors"
                    >
                      <p className="text-neutral-700 dark:text-neutral-200 font-medium italic leading-relaxed">
                        {q.text}
                      </p>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block text-right">
                        — {q.source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HERO BANNER (when reader closed) */}
        {!activeReadingBook && (
          <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 text-neutral-900 dark:text-white relative overflow-hidden shadow-xs transition-colors">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-400/30 text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                <span>La Maktaba du Croyant</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                Livres Islamiques & Guides de Référence
              </h2>
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-emerald-100/80 leading-relaxed">
                Explorez le Saint Coran en arabe, les ouvrages indispensables de Cheikh Ibn Baz sur le jeûne de Ramadan, et les tomes monumentaux du Dr. Omar Sulaiman Al-Achqar sur la Résurrection, le Paradis et l'Enfer.
              </p>
            </div>
          </div>
        )}

        {/* FILTER BAR & SEARCH */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs overflow-x-auto no-scrollbar w-full sm:w-auto transition-colors">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
              }`}
            >
              Tous ({ISLAMIC_BOOKS.length})
            </button>
            <button
              onClick={() => setSelectedCategory('coran')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                selectedCategory === 'coran'
                  ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
              }`}
            >
              Mushaf Coran
            </button>
            <button
              onClick={() => setSelectedCategory('jeune')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                selectedCategory === 'jeune'
                  ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
              }`}
            >
              Le Jeûne (3)
            </button>
            <button
              onClick={() => setSelectedCategory('foi')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95 ${
                selectedCategory === 'foi'
                  ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
              }`}
            >
              Foi & Au-Delà (2)
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-emerald-600/70 dark:text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un livre, auteur..."
              className="w-full pl-8 sm:pl-9 pr-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* BOOKS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 sm:space-y-4 shadow-xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      book.category === 'coran'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                        : book.category === 'jeune'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30'
                    }`}
                  >
                    {book.category === 'coran'
                      ? 'Saint Coran'
                      : book.category === 'jeune'
                      ? 'Jeûne de Ramadan'
                      : 'Foi & Au-Delà'}
                  </span>
                  <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                    ~{book.pageEstimate} pages
                  </span>
                </div>

                <div>
                  <span className="font-arabic text-sm font-bold text-amber-800 dark:text-amber-200 block">
                    {book.arabicTitle}
                  </span>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white mt-0.5">{book.title}</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{book.author}</p>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium line-clamp-3">
                  {book.description}
                </p>

                <div className="pt-2 border-t border-neutral-200 dark:border-emerald-800/40 flex flex-wrap gap-1">
                  {book.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 text-[10px] text-neutral-700 dark:text-neutral-300 font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-emerald-800/40">
                <button
                  onClick={() => {
                    setActiveReadingBook(book);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 py-2.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs border border-emerald-600 dark:border-emerald-400/30"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                  <span>Consulter le Livre</span>
                </button>
                <a
                  href={book.pdfUrl}
                  download={book.pdfFileName}
                  className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 border border-neutral-200 dark:border-emerald-500/20 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                  title="Télécharger le fichier PDF"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
