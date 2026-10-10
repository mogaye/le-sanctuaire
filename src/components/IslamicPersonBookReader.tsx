import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  MapPin,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Compass,
  Award,
  Quote,
  ArrowLeft,
} from 'lucide-react';
import { IslamicPersonBook } from '../data/islamicPeopleHistoryData';

interface IslamicPersonBookReaderProps {
  book: IslamicPersonBook;
  onClose: () => void;
  onSelectOtherBook?: (book: IslamicPersonBook) => void;
  allBooks?: IslamicPersonBook[];
}

export const IslamicPersonBookReader: React.FC<IslamicPersonBookReaderProps> = ({
  book,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'lecture' | 'sommaire' | 'reperes'>('lecture');
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const readerTopRef = useRef<HTMLDivElement>(null);

  const currentChapter = book.chapters[selectedChapterIdx] || book.chapters[0];

  useEffect(() => {
    setSelectedChapterIdx(0);
    setActiveTab('lecture');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [book.id]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [selectedChapterIdx]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = [
      `${book.name}. ${book.title}.`,
      `${currentChapter.number} : ${currentChapter.title}.`,
      ...currentChapter.paragraphs,
    ].join(' ');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectChapter = (idx: number) => {
    setSelectedChapterIdx(idx);
    setActiveTab('lecture');
    readerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fontSizeClass = {
    sm: 'text-sm sm:text-base leading-relaxed',
    base: 'text-base sm:text-lg leading-relaxed',
    lg: 'text-lg sm:text-xl leading-[1.9]',
    xl: 'text-xl sm:text-2xl leading-[1.95]',
  }[fontSize];

  return (
    <div ref={readerTopRef} className="relative w-full">
      {/* ==============================================================
          EN-TÊTE BIOGRAPHIQUE ILLUSTRÉ
         ============================================================== */}
      <div
        className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${book.coverGradient} border border-emerald-500/35 p-6 sm:p-10 text-white shadow-xl mb-6`}
      >
        <div className="mb-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-200 hover:text-amber-300 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au Catalogue des Personnalités</span>
          </button>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{book.categoryLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-emerald-200 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Lecture : {book.readTime}</span>
              </span>
            </div>

            <div className="font-serif text-amber-300/95 text-lg sm:text-2xl tracking-wide" dir="rtl">
              {book.arabicName}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight font-serif">
              {book.name}{' '}
              <span className="text-amber-300 font-serif font-normal">{book.honorific}</span>
            </h1>

            <p className="text-sm sm:text-lg font-bold text-emerald-200">{book.title}</p>

            <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed pt-1">
              {book.shortSummary}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-emerald-200/90">
              <span className="inline-flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <strong>Époque :</strong> {book.era}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <strong>Lieux :</strong> {book.region}
              </span>
            </div>
          </div>

          {/* Encadré Citation Authentique */}
          <div className="lg:w-80 shrink-0 rounded-2xl bg-black/35 backdrop-blur-md border border-amber-300/30 p-5 space-y-3">
            <div className="flex items-center justify-between text-amber-300">
              <Quote className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Parole de Lumière</span>
            </div>
            <p className="text-base sm:text-lg font-serif text-amber-200 text-right leading-relaxed" dir="rtl">
              {book.arabicQuote}
            </p>
            <p className="text-xs sm:text-sm text-white/95 italic leading-relaxed">
              {book.frenchQuote}
            </p>
            <p className="text-[11px] text-emerald-300 font-semibold border-t border-white/10 pt-2">
              {book.quoteSource}
            </p>
          </div>
        </div>

        {/* Qualités & Vertus */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mr-1">
            <Award className="w-4 h-4" />
            <span>Vertus exemplaires :</span>
          </span>
          {book.virtues.map((virtue) => (
            <span
              key={virtue}
              className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold"
            >
              {virtue}
            </span>
          ))}
        </div>
      </div>

      {/* ==============================================================
          BARRE DE NAVIGATION SIMPLE (ÉCRITE, SANS ENCADRÉS, CLAIR & SOMBRE)
         ============================================================== */}
      <div className="sticky top-16 z-30 bg-[#F2EFE9]/95 dark:bg-[#12241A]/95 backdrop-blur-md py-3 border-b border-stone-300/80 dark:border-emerald-500/20 mb-8 flex flex-wrap items-center justify-between gap-6">
        <nav className="flex items-center gap-6 sm:gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('lecture')}
            className={`pb-1 text-sm sm:text-base transition-colors cursor-pointer border-b-2 ${
              activeTab === 'lecture'
                ? 'font-bold text-emerald-800 dark:text-amber-300 border-emerald-700 dark:border-amber-400'
                : 'font-medium text-neutral-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-white border-transparent'
            }`}
          >
            Texte de l&apos;Histoire
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sommaire')}
            className={`pb-1 text-sm sm:text-base transition-colors cursor-pointer border-b-2 ${
              activeTab === 'sommaire'
                ? 'font-bold text-emerald-800 dark:text-amber-300 border-emerald-700 dark:border-amber-400'
                : 'font-medium text-neutral-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-white border-transparent'
            }`}
          >
            Chapitres du Récit ({book.chapters.length})
          </button>

          {book.milestones.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('reperes')}
              className={`pb-1 text-sm sm:text-base transition-colors cursor-pointer border-b-2 ${
                activeTab === 'reperes'
                  ? 'font-bold text-emerald-800 dark:text-amber-300 border-emerald-700 dark:border-amber-400'
                  : 'font-medium text-neutral-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-white border-transparent'
              }`}
            >
              Repères Historiques
            </button>
          )}
        </nav>

        {/* Contrôles de taille du texte & écoute vocale */}
        {activeTab === 'lecture' && (
          <div className="flex items-center gap-5 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              {(['sm', 'base', 'lg', 'xl'] as const).map((sz, idx) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`cursor-pointer transition-colors ${
                    fontSize === sz
                      ? 'font-bold text-emerald-800 dark:text-amber-300 underline underline-offset-4'
                      : 'text-neutral-400 dark:text-stone-500 hover:text-neutral-800 dark:hover:text-stone-200'
                  }`}
                >
                  A{idx === 0 ? '-' : idx === 3 ? '++' : idx === 2 ? '+' : ''}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-1.5 font-bold cursor-pointer transition-colors ${
                isSpeaking
                  ? 'text-amber-600 dark:text-amber-300'
                  : 'text-emerald-800 dark:text-emerald-300 hover:underline'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Arrêter</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Écouter</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ==============================================================
          ONGLET 1 : LECTURE PAR CHAPITRE & TEXTE JUSTIFIÉ EN PLEINE LARGEUR (SANS CADRE)
         ============================================================== */}
      {activeTab === 'lecture' && (
        <div className="w-full">
          {/* Navigation simple par chapitre (écrite, sans boutons encadrés) */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-6 mb-8 border-b border-neutral-200 dark:border-emerald-500/15 text-sm sm:text-base font-serif">
            {book.chapters.map((chap, idx) => {
              const isActive = selectedChapterIdx === idx;
              return (
                <button
                  key={chap.number}
                  type="button"
                  onClick={() => handleSelectChapter(idx)}
                  className={`cursor-pointer transition-colors ${
                    isActive
                      ? 'font-bold text-emerald-800 dark:text-amber-300 underline underline-offset-8 decoration-2'
                      : 'text-neutral-500 dark:text-stone-400 hover:text-neutral-900 dark:hover:text-stone-200'
                  }`}
                >
                  {chap.number}
                </button>
              );
            })}
          </div>

          {/* Texte du chapitre sélectionné en pleine largeur, justifié et sans cadre */}
          <article className="py-2 text-neutral-900 dark:text-stone-100 w-full">
            <div className="mb-8">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-widest text-emerald-800 dark:text-amber-400 mb-1">
                {currentChapter.number} sur {book.chapters.length}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-900 dark:text-amber-300 font-serif text-left leading-tight">
                {currentChapter.title}
              </h2>
              {currentChapter.subtitle && (
                <p className="italic text-neutral-600 dark:text-stone-300 font-serif text-sm sm:text-base mt-2">
                  {currentChapter.subtitle}
                </p>
              )}
            </div>

            <div className={`font-serif space-y-6 text-justify ${fontSizeClass}`}>
              {currentChapter.paragraphs.map((paragraph, pIdx) => (
                <p
                  key={pIdx}
                  className="text-neutral-800 dark:text-stone-100/95 text-justify"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          {/* Navigation bas de chapitre (écrite simplement) */}
          <div className="flex items-center justify-between pt-10 mt-10 border-t border-neutral-200 dark:border-emerald-500/20 text-sm sm:text-base font-serif">
            <button
              type="button"
              disabled={selectedChapterIdx === 0}
              onClick={() => handleSelectChapter(Math.max(0, selectedChapterIdx - 1))}
              className="inline-flex items-center gap-1.5 font-bold text-neutral-700 dark:text-stone-200 hover:text-emerald-700 dark:hover:text-amber-300 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Chapitre précédent</span>
            </button>

            <span className="text-xs sm:text-sm text-neutral-500 dark:text-stone-400">
              {selectedChapterIdx + 1} / {book.chapters.length}
            </span>

            {selectedChapterIdx < book.chapters.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  handleSelectChapter(Math.min(book.chapters.length - 1, selectedChapterIdx + 1))
                }
                className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-amber-300 hover:underline transition cursor-pointer"
              >
                <span>Chapitre suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-amber-300 hover:underline transition cursor-pointer"
              >
                <span>Retour au Catalogue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==============================================================
          ONGLET 2 : SOMMAIRE DÉTAILLÉ DES CHAPITRES
         ============================================================== */}
      {activeTab === 'sommaire' && (
        <div className="divide-y divide-neutral-200 dark:divide-emerald-500/20 font-serif">
          {book.chapters.map((chap, idx) => {
            const isSelected = idx === selectedChapterIdx;
            return (
              <div
                key={chap.number}
                onClick={() => handleSelectChapter(idx)}
                className="py-5 flex items-start justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div
                    className={`text-xs font-sans font-bold uppercase tracking-wider ${
                      isSelected
                        ? 'text-emerald-700 dark:text-amber-300'
                        : 'text-neutral-500 dark:text-stone-400'
                    }`}
                  >
                    {chap.number}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-amber-300 transition-colors">
                    {chap.title}
                  </h3>
                  {chap.subtitle && (
                    <p className="text-sm text-neutral-600 dark:text-stone-300 italic">
                      {chap.subtitle}
                    </p>
                  )}
                </div>
                <span className="text-xs font-sans font-bold text-emerald-700 dark:text-amber-300 shrink-0 pt-1 group-hover:translate-x-1 transition-transform">
                  Lire →
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ==============================================================
          ONGLET 3 : REPÈRES HISTORIQUES
         ============================================================== */}
      {activeTab === 'reperes' && (
        <div className="divide-y divide-neutral-200 dark:divide-emerald-500/20 font-serif">
          {book.milestones.map((item, idx) => (
            <div key={idx} className="py-5 space-y-1">
              <div className="text-sm font-sans font-extrabold text-emerald-800 dark:text-amber-300">
                {item.period}
              </div>
              <p className="text-base text-neutral-800 dark:text-stone-200 leading-relaxed">
                {item.event}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
