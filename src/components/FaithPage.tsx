import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Flame,
  ShieldCheck,
  BookOpen,
  Volume2,
  FileText,
  Download,
  ExternalLink,
  ChevronRight,
  Sun,
  Eye,
  Layers,
} from 'lucide-react';
import {
  RESURRECTION_STAGES,
  PARADISE_GATES,
  PARADISE_DELIGHTS,
  HELL_WARNINGS,
} from '../data/faithData';
import { ISLAMIC_BOOKS } from '../data/booksData';

interface FaithPageProps {
  onBackToHome: () => void;
  onOpenBookReader?: (bookId: string) => void;
}

export const FaithPage: React.FC<FaithPageProps> = ({
  onBackToHome,
  onOpenBookReader,
}) => {
  const [activeTab, setActiveTab] = useState<'resurrection' | 'paradis' | 'enfer' | 'livres'>('resurrection');
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);

  const currentStage = RESURRECTION_STAGES[selectedStageIdx];
  const faithBooks = ISLAMIC_BOOKS.filter((b) => b.category === 'foi');

  const playArabicAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

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
              ق
            </div>
            <div className="min-w-0 truncate">
              <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-tight truncate">
                La Foi en l’Au-Delà : Résurrection, Paradis & Enfer
              </h1>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-medium truncate">
                D’après les Ouvrages du Dr. ‘Omar Sulaimân Al-Achqar
              </p>
            </div>
          </div>

          <div className="hidden sm:block shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              5ème Pilier de la Foi
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full space-y-4 sm:space-y-6">
        {/* HERO BANNER */}
        <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 text-neutral-900 dark:text-white relative overflow-hidden shadow-xs transition-colors">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-400/30 text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
              <span>Eschatologie Musulmane Authentique • Dr. Omar Al-Achqar</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              « Le Jour où les gens se tiendront debout devant le Seigneur de l'Univers »
            </h2>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-emerald-100/80 leading-relaxed">
              Méditez sur le destin éternel de l'âme : les étapes du Jour Dernier (la Trompe, le Mahshar, la Balance, le Bassin, le Sirat), les splendeurs inimaginables du Paradis d’Al-Firdaws et la terreur des tourments de la Géhenne.
            </p>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex p-1 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 gap-1 shadow-xs max-w-2xl mx-auto overflow-x-auto no-scrollbar transition-colors">
          <button
            onClick={() => setActiveTab('resurrection')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'resurrection'
                ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Le Jour Dernier</span>
          </button>

          <button
            onClick={() => setActiveTab('paradis')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'paradis'
                ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Le Paradis</span>
          </button>

          <button
            onClick={() => setActiveTab('enfer')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'enfer'
                ? 'bg-rose-700 text-white shadow-xs border border-rose-600 dark:border-rose-400/40'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>L’Enfer</span>
          </button>

          <button
            onClick={() => setActiveTab('livres')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              activeTab === 'livres'
                ? 'bg-emerald-700 text-white shadow-xs border border-emerald-600 dark:border-emerald-400/40'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Livres</span>
          </button>
        </div>

        {/* TAB 1: RESURRECTION (7 ÉTAPES) */}
        {activeTab === 'resurrection' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Step Selector Carousel */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
              {RESURRECTION_STAGES.map((st, idx) => (
                <button
                  key={st.stepNumber}
                  onClick={() => setSelectedStageIdx(idx)}
                  className={`px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 sm:gap-2 border active:scale-95 ${
                    idx === selectedStageIdx
                      ? 'bg-emerald-700 text-white border-emerald-600 dark:border-emerald-400/50 shadow-xs ring-2 ring-emerald-500/40'
                      : 'bg-white dark:bg-[#193226] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-amber-300 text-[10px] font-black flex items-center justify-center">
                    {st.stepNumber}
                  </span>
                  <span>{st.title}</span>
                </button>
              ))}
            </div>

            {/* Stage Detail Card */}
            <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 sm:space-y-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-emerald-800/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      Étape {currentStage.stepNumber} sur {RESURRECTION_STAGES.length}
                    </span>
                    <span className="font-arabic text-lg font-bold text-amber-800 dark:text-amber-200">
                      {currentStage.arabicName}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-1">{currentStage.title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-emerald-200/70 font-semibold">{currentStage.subtitle}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">
                {currentStage.description}
              </p>

              {/* Verses / Hadiths */}
              <div className="space-y-3">
                {currentStage.versesOrHadiths.map((vh, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 space-y-1.5 transition-colors"
                  >
                    <p className="text-xs sm:text-sm text-neutral-800 dark:text-emerald-100 font-medium leading-relaxed italic">
                      {vh.text}
                    </p>
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 block text-right">
                      — {vh.ref}
                    </span>
                  </div>
                ))}
              </div>

              {/* Key Insights */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                  Points Clés & Vérités Révélées :
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentStage.keyInsights.map((ins, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 text-xs text-neutral-700 dark:text-neutral-200 font-medium flex items-start gap-2.5 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-1.5" />
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-emerald-800/40">
                <button
                  disabled={selectedStageIdx === 0}
                  onClick={() => setSelectedStageIdx((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-[#14281E] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-[#1E3B2E] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all border border-neutral-200 dark:border-emerald-500/20"
                >
                  ← Étape Précédente
                </button>

                <button
                  disabled={selectedStageIdx === RESURRECTION_STAGES.length - 1}
                  onClick={() =>
                    setSelectedStageIdx((prev) =>
                      Math.min(RESURRECTION_STAGES.length - 1, prev + 1)
                    )
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all shadow-xs border border-emerald-600 dark:border-emerald-400/30"
                >
                  Étape Suivante →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LE PARADIS & SES 8 PORTES */}
        {activeTab === 'paradis' && (
          <div className="space-y-6">
            {/* Les Délices Majeurs */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                <span>La Félicité Éternelle d’Al-Jannah</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PARADISE_DELIGHTS.map((del, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 space-y-2 transition-colors"
                  >
                    <h4 className="text-sm font-black text-amber-800 dark:text-amber-200">{del.title}</h4>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">
                      {del.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Les 8 Portes du Paradis */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  <span>Les Portes Royales du Paradis (Abwâb Al-Jannah)</span>
                </h3>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  8 Portes Sublimes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PARADISE_GATES.map((gate, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 hover:border-amber-500/40 transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-neutral-900 dark:text-white">{gate.name}</h4>
                      <span className="font-arabic text-sm text-amber-800 dark:text-amber-200 font-bold">
                        {gate.arabicName}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{gate.forWhom}</p>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 italic pt-1 border-t border-neutral-200 dark:border-emerald-800/40">
                      {gate.hadithDescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: L'ENFER & LA PROTECTION */}
        {activeTab === 'enfer' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-rose-200 dark:border-rose-500/30 shadow-xs space-y-4 transition-colors">
              <h3 className="text-base font-black text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span>La Réalité de l’Enfer & Comment S’en Préserver</span>
              </h3>
              <p className="text-xs text-neutral-700 dark:text-rose-100/80 leading-relaxed font-medium">
                Le Dr. Omar Al-Achqar rappelle que la méditation sur l’Enfer vise à purifier l’âme de l’arrogance et à stimuler l’ardeur dans les bonnes actions et le repentir sincère.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {HELL_WARNINGS.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-rose-200 dark:border-rose-500/20 space-y-2 shadow-xs transition-colors"
                  >
                    <h4 className="text-sm font-black text-neutral-900 dark:text-white">{w.title}</h4>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed font-medium">{w.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LES LIVRES ORIGINAUX DU DR. AL-ACHQAR */}
        {activeTab === 'livres' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                <span>Les Deux Livres de Référence du Dr. ‘Omar Sulaimân Al-Achqar</span>
              </h3>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/70 leading-relaxed">
                Retrouvez les versions intégrales numérisées incluses dans votre sanctuaire. Vous pouvez les feuilleter directement dans le lecteur ou les télécharger en PDF.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {faithBooks.map((book) => (
                  <div
                    key={book.id}
                    className="p-6 rounded-3xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                          Ouvrage Majeur • {book.pageEstimate} pages
                        </span>
                        <span className="font-arabic text-sm font-bold text-amber-800 dark:text-amber-200">
                          {book.arabicTitle}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-neutral-900 dark:text-white">{book.title}</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">{book.author}</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                        {book.description}
                      </p>

                      <div className="pt-2 border-t border-neutral-200 dark:border-emerald-800/40 space-y-1">
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                          Thèmes Traités :
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {book.topics.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/20 text-[11px] text-neutral-700 dark:text-neutral-200 font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-emerald-800/40">
                      {onOpenBookReader ? (
                        <button
                          onClick={() => onOpenBookReader(book.id)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs border border-emerald-600 dark:border-emerald-400/30"
                        >
                          <BookOpen className="w-4 h-4 text-amber-300" />
                          <span>Ouvrir dans le Lecteur</span>
                        </button>
                      ) : (
                        <a
                          href={book.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs border border-emerald-600 dark:border-emerald-400/30"
                        >
                          <ExternalLink className="w-4 h-4 text-amber-300" />
                          <span>Consulter</span>
                        </a>
                      )}
                      <a
                        href={book.pdfUrl}
                        download={book.pdfFileName}
                        className="p-2.5 rounded-xl bg-neutral-200/80 hover:bg-neutral-300 dark:bg-[#193226] dark:hover:bg-[#1E3B2E] border border-neutral-300 dark:border-emerald-500/20 text-neutral-700 dark:text-neutral-200 transition-all cursor-pointer"
                        title="Télécharger le PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
