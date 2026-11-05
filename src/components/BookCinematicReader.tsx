import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Minimize2,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Palette,
  BookOpen,
  Sparkles,
  X,
  List,
  Type,
  Users,
  Check,
  Award,
  Compass,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { PUITS_DE_NOUR_CHAPTERS } from '../data/puitsDeNourText';
import {
  PUITS_DE_NOUR_CHARACTERS,
  PUITS_DE_NOUR_HERO_IMAGE,
  BookCharacter,
} from '../data/puitsDeNourCharacters';
import {
  IslamicPersonBook,
  PersonChapter,
  ISLAMIC_PEOPLE_BOOKS,
} from '../data/islamicPeopleHistoryData';
import {
  CINEMATIC_THEMES,
  CinematicThemeId,
  CINEMATIC_BACKGROUNDS,
  CinematicBackground,
} from './QuranCinematicReader';
import { CharacterPortrait } from './CharacterPortrait';

export interface BookCinematicReaderProps {
  isOpen: boolean;
  onClose: () => void;
  bookType: 'puits-de-nour' | 'person';
  personBook?: IslamicPersonBook | null;
  initialChapterIndex?: number;
}

interface ChapterDisplay {
  id: string;
  number: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
}

export const BookCinematicReader: React.FC<BookCinematicReaderProps> = ({
  isOpen,
  onClose,
  bookType,
  personBook,
  initialChapterIndex = 0,
}) => {
  // Theme state
  const [currentThemeId, setCurrentThemeId] = useState<CinematicThemeId>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_book_cinematic_theme');
      if (saved && CINEMATIC_THEMES[saved as CinematicThemeId]) {
        return saved as CinematicThemeId;
      }
    } catch {}
    return bookType === 'puits-de-nour' ? 'amber' : 'emerald';
  });

  // Background artwork
  const [selectedBgId, setSelectedBgId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sanctuaire_book_cinematic_bg') || null;
    } catch {
      return null;
    }
  });

  // Typography & Layout state
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [maxWidth, setMaxWidth] = useState<'reading' | 'wide'>('reading');
  const [currentChapterIdx, setCurrentChapterIdx] = useState<number>(initialChapterIndex);

  // Drawers and Modals
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<BookCharacter | null>(null);

  // Audio / Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [readingProgress, setReadingProgress] = useState<number>(0);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return Boolean(document.fullscreenElement);
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Prepare normalized chapter data
  const normalizedChapters: ChapterDisplay[] = useMemo(() => {
    if (bookType === 'puits-de-nour') {
      return PUITS_DE_NOUR_CHAPTERS.map((ch, idx) => {
        const rawLines = ch.rawText.split('\n');
        const paragraphs: string[] = [];
        let curr: string[] = [];

        for (const line of rawLines) {
          const trimmed = line.trim();
          if (!trimmed) {
            if (curr.length > 0) {
              paragraphs.push(curr.join(' '));
              curr = [];
            }
          } else {
            curr.push(trimmed);
          }
        }
        if (curr.length > 0) {
          paragraphs.push(curr.join(' '));
        }

        return {
          id: ch.id || `chap-${idx + 1}`,
          number: ch.number,
          title: ch.title,
          subtitle: "Récit & Sagesse • Dar-Salam",
          paragraphs: paragraphs.length > 0 ? paragraphs : [ch.rawText],
        };
      });
    }

    // Otherwise person book (e.g. Histoire du Prophète Muhammad ﷺ)
    const activePerson = personBook || ISLAMIC_PEOPLE_BOOKS[0];
    return activePerson.chapters.map((ch: PersonChapter, idx: number) => ({
      id: `prophet-chap-${idx + 1}`,
      number: ch.number,
      title: ch.title,
      subtitle: ch.subtitle,
      paragraphs: ch.paragraphs,
    }));
  }, [bookType, personBook]);

  const currentChapter = normalizedChapters[currentChapterIdx] || normalizedChapters[0];
  const activeTheme = CINEMATIC_THEMES[currentThemeId] || CINEMATIC_THEMES.emerald;
  const currentBg = CINEMATIC_BACKGROUNDS.find((bg) => bg.id === selectedBgId) || null;

  // Book metadata
  const bookTitle =
    bookType === 'puits-de-nour'
      ? 'Le Puits de Nour'
      : personBook?.name || 'La Vie du Prophète Muhammad';
  const bookArabic =
    bookType === 'puits-de-nour'
      ? 'بِئْرُ نُور — دَارُ السَّلَام'
      : personBook?.arabicName || 'السِّيرَةُ النَّبَوِيَّةُ — مُحَمَّدٌ ﷺ';
  const bookSubtitle =
    bookType === 'puits-de-nour'
      ? 'Parution du Vendredi • Récit initiatique & Sagesse'
      : personBook?.title || 'Récit historique en dix chapitres authentiques';

  // Keyboard navigation & Esc key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTocOpen) setIsTocOpen(false);
        else if (isPaletteOpen) setIsPaletteOpen(false);
        else if (isCharactersOpen) setIsCharactersOpen(false);
        else if (isMilestonesOpen) setIsMilestonesOpen(false);
        else if (selectedCharacter) setSelectedCharacter(null);
        else onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentChapterIdx < normalizedChapters.length - 1) {
          setCurrentChapterIdx((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentChapterIdx > 0) {
          setCurrentChapterIdx((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    isTocOpen,
    isPaletteOpen,
    isCharactersOpen,
    isMilestonesOpen,
    selectedCharacter,
    currentChapterIdx,
    normalizedChapters.length,
    onClose,
  ]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Stop speech on chapter change or unmount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentChapterIdx, bookType]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Track scroll reading progress
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const total = el.scrollHeight - el.clientHeight;
    if (total <= 0) {
      setReadingProgress(100);
    } else {
      setReadingProgress(Math.min(100, Math.round((el.scrollTop / total) * 100)));
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // ignore
    }
  };

  const handleSelectTheme = (themeId: CinematicThemeId) => {
    setCurrentThemeId(themeId);
    try {
      localStorage.setItem('sanctuaire_book_cinematic_theme', themeId);
    } catch {}
  };

  const handleSelectBackground = (bgId: string | null) => {
    setSelectedBgId(bgId);
    try {
      if (bgId) {
        localStorage.setItem('sanctuaire_book_cinematic_bg', bgId);
      } else {
        localStorage.removeItem('sanctuaire_book_cinematic_bg');
      }
    } catch {}
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = [
      `${bookTitle}.`,
      `${currentChapter.number} : ${currentChapter.title}.`,
      ...currentChapter.paragraphs,
    ].join(' ');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';
    utterance.rate = speechRate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCycleSpeechRate = () => {
    const nextRate = speechRate === 1 ? 1.15 : speechRate === 1.15 ? 0.9 : 1;
    setSpeechRate(nextRate);
    if (isSpeaking) {
      // restart with next rate
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setTimeout(handleToggleSpeech, 100);
    }
  };

  if (!isOpen) return null;

  const fontClasses = {
    sm: 'text-base sm:text-lg leading-relaxed',
    base: 'text-lg sm:text-xl leading-[1.85]',
    lg: 'text-xl sm:text-2xl leading-[1.95]',
    xl: 'text-2xl sm:text-3xl leading-[2.05]',
  }[fontSize];

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden flex flex-col select-none text-white transition-colors duration-500 ${activeTheme.bg}`}
      style={{
        background: !currentBg ? activeTheme.inlineBg : undefined,
      }}
    >
      {/* ==============================================================
          WALLPAPER ARRIÈRE-PLAN ISLAMIQUE 4K (OPTIONNEL)
         ============================================================== */}
      {currentBg && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            src={currentBg.url}
            alt={currentBg.name}
            className="w-full h-full object-cover object-center opacity-30 transform scale-105 transition-opacity duration-700"
          />
          <div
            className="absolute inset-0 backdrop-blur-[2px]"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${activeTheme.glow1} 0%, rgba(3, 10, 7, 0.88) 70%, rgba(1, 4, 3, 0.96) 100%)`,
            }}
          />
        </div>
      )}

      {/* Halo lumineux céleste d'ambiance */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] pointer-events-none z-0 rounded-full blur-[140px] opacity-40 transition-colors duration-700"
        style={{ background: activeTheme.accent }}
      />

      {/* Jauge fine de progression de lecture au sommet */}
      <div className="relative z-30 w-full h-1 bg-white/10">
        <div
          className="h-full transition-all duration-150 ease-out"
          style={{
            width: `${readingProgress}%`,
            backgroundColor: activeTheme.accent,
            boxShadow: `0 0 10px ${activeTheme.accent}`,
          }}
        />
      </div>

      {/* ==============================================================
          BARRE SUPÉRIEURE HUD (TITRE, SOMMAIRE, THÈMES & CONTRÔLES)
         ============================================================== */}
      <header
        className={`relative z-20 h-16 sm:h-18 px-3 sm:px-6 border-b backdrop-blur-xl flex items-center justify-between shrink-0 shadow-lg transition-colors ${activeTheme.hudBg}`}
      >
        {/* Côté Gauche : Quitter / Sommaire / Titre du livre */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/15 transition active:scale-95 cursor-pointer shrink-0"
            title="Quitter la lecture plein écran (Échap)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Quitter</span>
          </button>

          {/* Bouton Sommaire / Table des matières */}
          <button
            type="button"
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/15 transition active:scale-95 cursor-pointer shrink-0"
            title="Ouvrir la table des chapitres"
          >
            <List className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Chapitres</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-mono">
              {currentChapterIdx + 1}/{normalizedChapters.length}
            </span>
          </button>

          {/* Titre & Identification de l'ouvrage */}
          <div className="hidden lg:flex flex-col min-w-0 ml-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-black/40 border-white/15 text-amber-300 truncate max-w-[200px]">
                {bookType === 'puits-de-nour' ? 'Livre du Vendredi' : 'Sîrah & Histoire'}
              </span>
              <span className="text-xs font-serif text-white/70 truncate" dir="rtl">
                {bookArabic}
              </span>
            </div>
            <h1 className="text-sm font-extrabold text-white truncate max-w-sm">
              {bookTitle} • <span className="text-white/80 font-medium">{currentChapter.number}</span>
            </h1>
          </div>
        </div>

        {/* Côté Droit : Audio Speech, Thèmes, Typo, Plein écran */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Si Puits de Nour : Bouton Personnages */}
          {bookType === 'puits-de-nour' && (
            <button
              type="button"
              onClick={() => setIsCharactersOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold transition cursor-pointer"
              title="Voir les personnages de Dar-Salam"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Personnages</span>
            </button>
          )}

          {/* Si Histoire du Prophète : Repères & Leçons */}
          {bookType === 'person' && (
            <button
              type="button"
              onClick={() => setIsMilestonesOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition cursor-pointer"
              title="Voir les repères historiques & la leçon spirituelle"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Repères & Vertus</span>
            </button>
          )}

          {/* Bouton Narration Vocale */}
          <div className="flex items-center rounded-full bg-white/10 border border-white/15 p-0.5">
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-400 text-neutral-950 shadow-md font-extrabold animate-pulse'
                  : 'text-white hover:bg-white/15'
              }`}
              title={isSpeaking ? 'Mettre la lecture en pause' : 'Écouter la narration vocale'}
            >
              {isSpeaking ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white/70" />
                  <span className="hidden sm:inline">Écouter</span>
                </>
              )}
            </button>
            {isSpeaking && (
              <button
                type="button"
                onClick={handleCycleSpeechRate}
                className="px-2 py-1 text-[10px] font-mono font-bold text-amber-300 hover:text-white transition cursor-pointer"
                title="Vitesse de narration"
              >
                {speechRate}x
              </button>
            )}
          </div>

          {/* Sélecteur de Thèmes Célestes */}
          <button
            type="button"
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 cursor-pointer relative"
            title="Personnaliser les couleurs & fonds spirituels"
          >
            <Palette className="w-4 h-4 text-amber-300" />
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black"
              style={{ backgroundColor: activeTheme.accent }}
            />
          </button>

          {/* Bouton Taille de Police */}
          <div className="hidden sm:flex items-center rounded-full bg-white/10 border border-white/15 p-0.5">
            {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz)}
                className={`px-2 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  fontSize === sz
                    ? 'bg-white text-neutral-950 font-black shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title={`Taille ${sz.toUpperCase()}`}
              >
                {sz === 'sm' ? 'A-' : sz === 'base' ? 'A' : sz === 'lg' ? 'A+' : 'A++'}
              </button>
            ))}
          </div>

          {/* Bouton Bascule Serif / Sans */}
          <button
            type="button"
            onClick={() => setFontFamily((prev) => (prev === 'serif' ? 'sans' : 'serif'))}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 cursor-pointer"
            title={`Basculer en police ${fontFamily === 'serif' ? 'Sans-Serif Moderne' : 'Serif Littéraire'}`}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Bascule Plein Écran */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 cursor-pointer"
            title={isFullscreen ? 'Quitter le mode plein écran natif' : 'Activer le mode plein écran natif'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 transition active:scale-95 cursor-pointer ml-1"
            title="Quitter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ==============================================================
          CORPS DU LIVRE : LECTURE CINÉMATIQUE HAUTE DÉFINITION
         ============================================================== */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 md:p-12 transition-colors select-text"
      >
        <div
          className={`mx-auto ${
            maxWidth === 'reading' ? 'max-w-3xl' : 'max-w-4xl'
          } space-y-8 sm:space-y-10 pb-28`}
        >
          {/* En-tête solennel du chapitre */}
          <div className="text-center space-y-3 pt-4 sm:pt-8 border-b border-white/10 pb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border bg-black/40 border-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentChapter.number} • {bookTitle}</span>
            </div>

            {/* Calligraphie Bismillah ou Titre Arabe */}
            <div className="font-arabic text-2xl sm:text-3xl text-amber-200/90 pt-1" dir="rtl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {currentChapter.title}
            </h2>

            {currentChapter.subtitle && (
              <p className="text-sm sm:text-base text-white/75 max-w-xl mx-auto italic font-serif">
                {currentChapter.subtitle}
              </p>
            )}
          </div>

          {/* Citation noble (si livre du prophète) */}
          {bookType === 'person' && personBook && currentChapterIdx === 0 && (
            <div className="rounded-3xl bg-emerald-950/40 border border-emerald-500/30 p-6 sm:p-8 space-y-3 text-center my-6">
              <p className="font-arabic text-2xl sm:text-3xl text-amber-300 leading-relaxed" dir="rtl">
                {personBook.arabicQuote}
              </p>
              <p className="text-sm sm:text-base font-serif italic text-emerald-100/95 max-w-xl mx-auto">
                {personBook.frenchQuote}
              </p>
              <span className="block text-[11px] uppercase tracking-wider font-bold text-amber-400/80">
                — {personBook.quoteSource}
              </span>
            </div>
          )}

          {/* ==============================================================
              PARAGRAPHES DU RÉCIT AVEC TYPOGRAPHIE LITTÉRAIRE
             ============================================================== */}
          <div
            className={`space-y-6 sm:space-y-7 ${
              fontFamily === 'serif' ? 'font-serif' : 'font-sans'
            } ${fontClasses}`}
          >
            {currentChapter.paragraphs.map((pText, pIdx) => {
              const isFirst = pIdx === 0;
              const firstLetter = pText.charAt(0);
              const remainingText = pText.slice(1);

              return (
                <p
                  key={`par-${currentChapterIdx}-${pIdx}`}
                  className="text-white/90 selection:bg-amber-500 selection:text-neutral-950 transition-colors tracking-normal"
                  style={{ textIndent: isFirst ? '0' : '1.5em' }}
                >
                  {isFirst ? (
                    <>
                      <span
                        className="float-left text-5xl sm:text-6xl font-black mr-3 -mt-1 font-serif select-none"
                        style={{ color: activeTheme.accent }}
                      >
                        {firstLetter}
                      </span>
                      <span>{remainingText}</span>
                    </>
                  ) : (
                    pText
                  )}
                </p>
              );
            })}
          </div>

          {/* Ornement de fin de chapitre */}
          <div className="pt-10 border-t border-white/10 text-center space-y-4">
            <div className="flex items-center justify-center gap-3 text-amber-400/60">
              <span className="h-px w-16 bg-white/15" />
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="h-px w-16 bg-white/15" />
            </div>
            <p className="text-xs text-white/60 font-serif italic">
              Fin de {currentChapter.number}
            </p>

            {/* Stepper suivant / précédent au bas du texte */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <button
                type="button"
                disabled={currentChapterIdx === 0}
                onClick={() => {
                  if (currentChapterIdx > 0) {
                    setCurrentChapterIdx((prev) => prev - 1);
                  }
                }}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition cursor-pointer ${
                  currentChapterIdx === 0
                    ? 'opacity-40 border-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white active:scale-95'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Chapitre Précédent</span>
              </button>

              <span className="text-xs font-mono text-white/60">
                {currentChapterIdx + 1} sur {normalizedChapters.length}
              </span>

              <button
                type="button"
                disabled={currentChapterIdx === normalizedChapters.length - 1}
                onClick={() => {
                  if (currentChapterIdx < normalizedChapters.length - 1) {
                    setCurrentChapterIdx((prev) => prev + 1);
                  }
                }}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition cursor-pointer ${
                  currentChapterIdx === normalizedChapters.length - 1
                    ? 'opacity-40 border-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-lg active:scale-95'
                }`}
              >
                <span>Chapitre Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================
          BARRE D'ACTION INFÉRIEURE FLOTTANTE (STEPPER RAPIDE)
         ============================================================== */}
      <footer className="relative z-20 h-14 px-4 sm:px-6 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-between shrink-0 text-xs text-white/80">
        <button
          type="button"
          disabled={currentChapterIdx === 0}
          onClick={() => setCurrentChapterIdx((prev) => Math.max(0, prev - 1))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-md">
            {currentChapter.title}
          </span>
          <span className="text-white/40 hidden sm:inline">•</span>
          <span className="font-mono text-amber-300 hidden sm:inline">
            Progression : {readingProgress}%
          </span>
        </div>

        <button
          type="button"
          disabled={currentChapterIdx === normalizedChapters.length - 1}
          onClick={() =>
            setCurrentChapterIdx((prev) =>
              Math.min(normalizedChapters.length - 1, prev + 1)
            )
          }
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* ==============================================================
          TIROIR SOMMAIRE / TABLE DES MATIÈRES (SLIDE-OVER)
         ============================================================== */}
      {isTocOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start animate-in fade-in duration-200"
          onClick={() => setIsTocOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#081710] border-r border-white/15 h-full flex flex-col p-6 shadow-2xl text-white select-none overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Table des Chapitres
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTocOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 my-4 flex-1 overflow-y-auto pr-1">
              {normalizedChapters.map((ch, idx) => {
                const isSelected = idx === currentChapterIdx;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      setCurrentChapterIdx(idx);
                      setIsTocOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-900/60 border-emerald-400/80 shadow-md'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-amber-300">
                          {ch.number}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-400/20 text-emerald-300 text-[9px] font-bold">
                            En cours
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                        {ch.title}
                      </h4>
                      {ch.subtitle && (
                        <p className="text-xs text-white/60 line-clamp-1 italic font-serif">
                          {ch.subtitle}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 mt-1 shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-white/50">
                {bookTitle} • {normalizedChapters.length} Chapitres
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL PALETTE DE COULEURS & FONDS 4K
         ============================================================== */}
      {isPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-[#0B1A12] border border-white/20 p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Thèmes & Décors Célestes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 10 Thèmes de couleurs */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                10 Nuances Nocturnes & Spirituelles
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.values(CINEMATIC_THEMES).map((th) => {
                  const isSel = th.id === currentThemeId;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handleSelectTheme(th.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        isSel
                          ? 'border-amber-400 bg-white/15 shadow-md'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: th.accent }}
                      />
                      <span className="text-xs font-bold truncate text-white">
                        {th.name}
                      </span>
                      {isSel && <Check className="w-3.5 h-3.5 text-amber-400 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arrière-plans 4K */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Arrière-plan Graphique Islamique 4K
                </span>
                {selectedBgId && (
                  <button
                    type="button"
                    onClick={() => handleSelectBackground(null)}
                    className="text-xs text-white/60 hover:text-white underline cursor-pointer"
                  >
                    Effacer le fond
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {CINEMATIC_BACKGROUNDS.map((bg) => {
                  const isSel = selectedBgId === bg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => handleSelectBackground(bg.id)}
                      className={`p-2 rounded-2xl border text-left transition relative overflow-hidden group cursor-pointer ${
                        isSel ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/10'
                      }`}
                    >
                      <img
                        src={bg.url}
                        alt={bg.name}
                        className="w-full h-14 object-cover rounded-xl opacity-75 group-hover:opacity-100 transition-opacity"
                      />
                      <span className="block text-[10px] font-bold text-white truncate mt-1">
                        {bg.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          DRAWER PERSONNAGES POUR LE PUITS DE NOUR
         ============================================================== */}
      {isCharactersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsCharactersOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0E1F16] border-l border-white/15 h-full flex flex-col p-6 shadow-2xl text-white select-none overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Personnages de Dar-Salam
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCharactersOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 my-4 flex-1 overflow-y-auto pr-1">
              {PUITS_DE_NOUR_CHARACTERS.map((char) => (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-amber-400/40">
                    <CharacterPortrait characterId={char.id} name={char.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">
                      {char.name} <span className="text-xs text-amber-300">({char.age})</span>
                    </h4>
                    <p className="text-xs text-white/60 truncate">{char.role}</p>
                    <p className="text-[11px] text-emerald-300/80 line-clamp-1 italic">
                      « {char.personality} »
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL REPÈRES & VERTUS POUR HISTOIRE DU PROPHÈTE
         ============================================================== */}
      {isMilestonesOpen && personBook && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsMilestonesOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-[#091D13] border border-emerald-500/30 p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">
                  Repères Historiques & Vertus Prophétiques
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMilestonesOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vertus */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Vertus & Caractère Sacré
              </span>
              <div className="flex flex-wrap gap-2">
                {personBook.virtues.map((v) => (
                  <span
                    key={v}
                    className="px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-emerald-200 text-xs font-semibold"
                  >
                    ✦ {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Chronologie */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Chronologie en 10 Chapitres
              </span>
              <div className="space-y-2">
                {personBook.milestones.map((m, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs"
                  >
                    <span className="font-bold text-amber-300">{m.period}</span>
                    <p className="text-white/80 leading-relaxed">{m.event}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leçon spirituelle */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs sm:text-sm text-amber-100/90 leading-relaxed font-serif">
              <span className="block font-bold text-amber-300 mb-1 font-sans uppercase tracking-wider text-[11px]">
                Enseignement & Portée Spirituelle :
              </span>
              {personBook.spiritualLesson}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          FICHE DÉTAILLÉE D'UN PERSONNAGE (POUR LE PUITS DE NOUR)
         ============================================================== */}
      {selectedCharacter && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedCharacter(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#091D13] border border-amber-400/40 p-6 sm:p-8 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-amber-400">
                  <CharacterPortrait
                    characterId={selectedCharacter.id}
                    name={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {selectedCharacter.name}
                  </h3>
                  <p className="text-xs font-semibold text-amber-300">
                    {selectedCharacter.role} • {selectedCharacter.age}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCharacter(null)}
                className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-serif pt-2 border-t border-white/10">
              {selectedCharacter.shortBio}
            </p>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
              <span className="font-bold text-amber-300">Personnalité & Vertus :</span>
              <p className="text-white/80">{selectedCharacter.personality}</p>
            </div>

            {selectedCharacter.innerConflict && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs italic font-serif text-amber-100">
                « {selectedCharacter.innerConflict} »
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
