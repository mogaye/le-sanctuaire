import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
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
  onSelectOtherBook,
  allBooks = [],
}) => {
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl'>('lg');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const readerTopRef = useRef<HTMLDivElement>(null);

  const currentChapter = book.chapters[selectedChapterIdx] || book.chapters[0];

  useEffect(() => {
    setSelectedChapterIdx(0);
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

  const fontSizeClass =
    fontSize === 'base'
      ? 'text-sm sm:text-base leading-relaxed'
      : fontSize === 'xl'
      ? 'text-lg sm:text-xl leading-loose'
      : 'text-base sm:text-lg leading-relaxed';

  const otherBooks = allBooks.filter((b) => b.id !== book.id).slice(0, 3);

  return (
    <div ref={readerTopRef} className="space-y-6 sm:space-y-8">
      {/* Barre supérieure de retour au catalogue */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#183022] p-4 rounded-2xl border border-stone-200 dark:border-emerald-500/30 shadow-xs">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold transition cursor-pointer border border-emerald-200 dark:border-emerald-500/30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Catalogue des Personnalités</span>
        </button>

        {/* Contrôles de taille de police & Lecture vocale */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl bg-neutral-100 dark:bg-[#12241A] p-1 border border-neutral-200 dark:border-emerald-500/25">
            {(['base', 'lg', 'xl'] as const).map((sz, idx) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  fontSize === sz
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-emerald-200/70 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Taille du texte"
              >
                {idx === 0 ? 'A-' : idx === 1 ? 'A' : 'A+'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isSpeaking
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                : 'bg-neutral-100 dark:bg-[#12241A] text-neutral-800 dark:text-emerald-200 border-neutral-200 dark:border-emerald-500/30 hover:border-emerald-500/60'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Arrêter l&apos;écoute</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Écouter ce chapitre</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* En-tête Biographique Illustré */}
      <div
        className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${book.coverGradient} border border-emerald-500/35 p-6 sm:p-10 text-white shadow-xl`}
      >
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

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {book.name}{' '}
              <span className="text-amber-300 font-serif font-normal">{book.honorific}</span>
            </h2>

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

      {/* Grille principale : Navigation des Chapitres + Repères Historiques à gauche, Lecture à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne latérale : Sommaire des chapitres & Frise chronologique */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Sommaire des chapitres */}
          <div className="rounded-2xl bg-white dark:bg-[#183022] border border-stone-200 dark:border-emerald-500/25 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Chapitres du Récit ({book.chapters.length})</span>
            </h3>

            <div className="space-y-2">
              {book.chapters.map((chap, idx) => {
                const isSelected = idx === selectedChapterIdx;
                return (
                  <button
                    key={chap.number}
                    type="button"
                    onClick={() => {
                      setSelectedChapterIdx(idx);
                      readerTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                        : 'bg-neutral-50 dark:bg-[#12241A] text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-emerald-500/20 hover:border-emerald-500/50'
                    }`}
                  >
                    <div
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isSelected ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {chap.number}
                    </div>
                    <div className="text-xs sm:text-sm font-bold mt-0.5 leading-snug">
                      {chap.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repères historiques clés */}
          <div className="rounded-2xl bg-white dark:bg-[#183022] border border-stone-200 dark:border-emerald-500/25 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Repères Historiques</span>
            </h3>

            <div className="relative pl-4 border-l-2 border-emerald-500/40 space-y-4">
              {book.milestones.map((item, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-amber-400 ring-4 ring-white dark:ring-[#183022]" />
                  <div className="text-xs font-extrabold text-emerald-800 dark:text-amber-300">
                    {item.period}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-emerald-100/80 mt-0.5 leading-relaxed">
                    {item.event}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Zone principale de lecture du chapitre */}
        <div className="lg:col-span-8 space-y-6">
          <article className="rounded-3xl bg-white dark:bg-[#183022] border border-stone-200 dark:border-emerald-500/25 p-6 sm:p-10 shadow-xs space-y-6">
            <div className="border-b border-stone-200 dark:border-emerald-500/20 pb-5">
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-amber-300">
                {currentChapter.number} sur {book.chapters.length}
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1 leading-tight">
                {currentChapter.title}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-emerald-300/80 mt-1">
                {currentChapter.subtitle}
              </p>
            </div>

            <div className={`space-y-5 text-neutral-800 dark:text-neutral-100 font-serif ${fontSizeClass}`}>
              {currentChapter.paragraphs.map((paragraph, pIdx) => (
                <p
                  key={pIdx}
                  className={
                    pIdx === 0
                      ? 'first-letter:text-4xl first-letter:font-black first-letter:text-emerald-700 dark:first-letter:text-amber-300 first-letter:mr-2 first-letter:float-left first-letter:leading-none'
                      : ''
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Leçon spirituelle à retenir */}
            <div className="mt-8 rounded-2xl bg-emerald-50/90 dark:bg-[#12241A] border border-emerald-200 dark:border-emerald-500/30 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>Sagesse & Enseignement à méditer</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-emerald-100/90 leading-relaxed font-medium">
                {book.spiritualLesson}
              </p>
            </div>

            {/* Navigation Précédent / Suivant entre les chapitres */}
            <div className="pt-4 border-t border-stone-200 dark:border-emerald-500/20 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={selectedChapterIdx === 0}
                onClick={() => {
                  setSelectedChapterIdx((prev) => Math.max(0, prev - 1));
                  readerTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-[#12241A] text-neutral-800 dark:text-emerald-200 text-xs sm:text-sm font-bold disabled:opacity-40 hover:bg-neutral-200 dark:hover:bg-emerald-900/50 transition cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Chapitre précédent</span>
              </button>

              <span className="text-xs font-bold text-neutral-500 dark:text-emerald-300/70">
                {selectedChapterIdx + 1} / {book.chapters.length}
              </span>

              {selectedChapterIdx < book.chapters.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChapterIdx((prev) => Math.min(book.chapters.length - 1, prev + 1));
                    readerTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  <span>Chapitre suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  <span>Terminer & Voir le Catalogue</span>
                </button>
              )}
            </div>
          </article>

          {/* Suggestions d'autres biographies du catalogue */}
          {otherBooks.length > 0 && onSelectOtherBook && (
            <div className="rounded-2xl bg-white dark:bg-[#183022] border border-stone-200 dark:border-emerald-500/25 p-5 space-y-4">
              <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                Continuer la découverte dans le catalogue :
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {otherBooks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectOtherBook(item);
                      readerTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-left p-3.5 rounded-xl bg-neutral-50 dark:bg-[#12241A] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-500/50 transition cursor-pointer group"
                  >
                    <div className="text-[10px] font-bold text-emerald-700 dark:text-amber-300 uppercase">
                      {item.categoryLabel}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white mt-0.5 group-hover:text-emerald-700 dark:group-hover:text-amber-300 transition">
                      {item.name} {item.honorific}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-emerald-200/70 line-clamp-1 mt-0.5">
                      {item.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
