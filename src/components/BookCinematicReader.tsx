import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
  X,
  List,
  Type,
  Users,
  Award,
  ArrowLeft,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PUITS_DE_NOUR_CHAPTERS } from '../data/puitsDeNourText';
import {
  PUITS_DE_NOUR_CHARACTERS,
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
} from './QuranCinematicReader';
import { CharacterPortrait } from './CharacterPortrait';

export interface BookCinematicReaderProps {
  isOpen: boolean;
  onClose: () => void;
  bookType: 'puits-de-nour' | 'person';
  personBook?: IslamicPersonBook | null;
  initialChapterIndex?: number;
}

interface SlidePart {
  id: string;
  chapterIndex: number;
  chapterNumber: string;
  chapterTitle: string;
  chapterSubtitle?: string;
  partIndex: number; // 1-indexed in chapter
  totalPartsInChapter: number;
  globalIndex: number;
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

  // Typography state
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl' | '2xl'>('xl');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');

  // Slide navigation state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Bars visibility state: DISAPPEARS IMMEDIATELY when reading or navigating
  const [areBarsVisible, setAreBarsVisible] = useState<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drawers
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isCharactersOpen, setIsCharactersOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<BookCharacter | null>(null);

  // Audio / Speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1);

  // Hint toast that fades out quickly
  const [showQuickHint, setShowQuickHint] = useState<boolean>(true);

  // Prepare normalized chapter data
  const rawChapters = useMemo(() => {
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
          index: idx,
          number: ch.number,
          title: ch.title,
          subtitle: "Récit & Sagesse • Dar-Salam",
          paragraphs: paragraphs.length > 0 ? paragraphs : [ch.rawText],
        };
      });
    }

    // Person book (Histoire du Prophète Muhammad ﷺ)
    const activePerson = personBook || ISLAMIC_PEOPLE_BOOKS[0];
    return activePerson.chapters.map((ch: PersonChapter, idx: number) => ({
      index: idx,
      number: ch.number,
      title: ch.title,
      subtitle: ch.subtitle,
      paragraphs: ch.paragraphs,
    }));
  }, [bookType, personBook]);

  // Build the complete paginated sequence of slides ("parties") across all chapters
  const allSlides: SlidePart[] = useMemo(() => {
    const list: SlidePart[] = [];
    let globalCounter = 0;

    rawChapters.forEach((ch) => {
      // Clean paragraphs
      const cleanedParas = ch.paragraphs
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && !p.startsWith('Chapitre '));

      // Group into comfortable slide chunks (1 substantial paragraph or 2 short ones)
      const chapterSlideGroups: string[][] = [];
      let i = 0;
      while (i < cleanedParas.length) {
        const p1 = cleanedParas[i];
        const p2 = cleanedParas[i + 1];

        if (p1.length > 450 || !p2) {
          chapterSlideGroups.push([p1]);
          i += 1;
        } else if (p1.length + p2.length < 750) {
          chapterSlideGroups.push([p1, p2]);
          i += 2;
        } else {
          chapterSlideGroups.push([p1]);
          i += 1;
        }
      }

      const totalPartsInChapter = Math.max(1, chapterSlideGroups.length);
      chapterSlideGroups.forEach((paras, pIdx) => {
        list.push({
          id: `slide-${ch.index}-${pIdx}`,
          chapterIndex: ch.index,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          chapterSubtitle: ch.subtitle,
          partIndex: pIdx + 1,
          totalPartsInChapter,
          globalIndex: globalCounter,
          paragraphs: paras,
        });
        globalCounter += 1;
      });
    });

    return list;
  }, [rawChapters]);

  // Jump to initial chapter slide when opened
  useEffect(() => {
    if (initialChapterIndex > 0 && allSlides.length > 0) {
      const targetSlide = allSlides.find((s) => s.chapterIndex === initialChapterIndex);
      if (targetSlide) {
        setCurrentSlideIndex(targetSlide.globalIndex);
      }
    } else {
      setCurrentSlideIndex(0);
    }
    // Bars are hidden immediately on open
    setAreBarsVisible(false);
    setShowQuickHint(true);
    const hintTimer = setTimeout(() => setShowQuickHint(false), 3500);
    return () => clearTimeout(hintTimer);
  }, [isOpen, initialChapterIndex, allSlides]);

  const currentSlide: SlidePart = allSlides[currentSlideIndex] || allSlides[0] || {
    id: 'empty',
    chapterIndex: 0,
    chapterNumber: 'Chapitre 1',
    chapterTitle: '',
    partIndex: 1,
    totalPartsInChapter: 1,
    globalIndex: 0,
    paragraphs: [],
  };

  const activeTheme = CINEMATIC_THEMES[currentThemeId] || CINEMATIC_THEMES.amber;
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

  // Navigation callbacks
  const goToNextPart = useCallback(() => {
    setCurrentSlideIndex((prev) => {
      if (prev < allSlides.length - 1) {
        return prev + 1;
      }
      return prev;
    });
    setAreBarsVisible(false);
  }, [allSlides.length]);

  const goToPrevPart = useCallback(() => {
    setCurrentSlideIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
    setAreBarsVisible(false);
  }, []);

  // Stop speech synthesis helper
  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Stop speech on slide change
  useEffect(() => {
    stopSpeech();
  }, [currentSlideIndex, stopSpeech]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  // KEYBOARD CONTROLS: ArrowLeft, ArrowRight, and ESCAPE TO QUIT
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESCAPE TO QUIT IMMEDIATELY
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        stopSpeech();
        if (isTocOpen) {
          setIsTocOpen(false);
          return;
        }
        if (isPaletteOpen) {
          setIsPaletteOpen(false);
          return;
        }
        if (isCharactersOpen) {
          setIsCharactersOpen(false);
          return;
        }
        if (isMilestonesOpen) {
          setIsMilestonesOpen(false);
          return;
        }
        if (selectedCharacter) {
          setSelectedCharacter(null);
          return;
        }
        // Exit native fullscreen if active
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onClose();
        return;
      }

      // RIGHT ARROW / SPACE / PAGE DOWN = PARTIE SUIVANTE
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setAreBarsVisible(false);
        goToNextPart();
      }

      // LEFT ARROW / PAGE UP = PARTIE PRÉCÉDENTE
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setAreBarsVisible(false);
        goToPrevPart();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [
    isOpen,
    isTocOpen,
    isPaletteOpen,
    isCharactersOpen,
    isMilestonesOpen,
    selectedCharacter,
    goToNextPart,
    goToPrevPart,
    onClose,
    stopSpeech,
  ]);

  // MOUSE MOVEMENT: Temporarily reveal bars, then DISAPPEAR INSTANTLY after 2 seconds
  const handleMouseMove = () => {
    setAreBarsVisible(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setAreBarsVisible(false);
    }, 2000);
  };

  // Toggle speech synthesis for current slide
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = currentSlide.paragraphs.join(' ');
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';
    utterance.rate = speechRate;
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-advance to next part on completion
      goToNextPart();
    };
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  // Typography font size classes for grand wide presentation
  const fontClasses = {
    base: 'text-xl sm:text-2xl md:text-3xl leading-[1.8] sm:leading-[1.85]',
    lg: 'text-2xl sm:text-3xl md:text-[2.2rem] leading-[1.85] sm:leading-[1.9]',
    xl: 'text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] leading-[1.8] sm:leading-[1.9]',
    '2xl': 'text-3xl sm:text-4xl md:text-5xl lg:text-[3rem] leading-[1.75] sm:leading-[1.85]',
  }[fontSize];

  const progressPercent = Math.round(
    ((currentSlideIndex + 1) / Math.max(1, allSlides.length)) * 100
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={() => {
        // Clicking center hides bars immediately
        if (areBarsVisible) {
          setAreBarsVisible(false);
        }
      }}
      className={`fixed inset-0 z-[100] w-screen h-screen overflow-hidden select-none text-white transition-colors duration-500 flex flex-col ${activeTheme.bg}`}
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
            className="absolute inset-0 backdrop-blur-[1px]"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${activeTheme.glow1} 0%, rgba(3, 10, 7, 0.90) 70%, rgba(1, 4, 3, 0.98) 100%)`,
            }}
          />
        </div>
      )}

      {/* Halo lumineux céleste d'ambiance */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[700px] pointer-events-none z-0 rounded-full blur-[160px] opacity-35 transition-colors duration-700"
        style={{ background: activeTheme.accent }}
      />

      {/* ==============================================================
          BANDE DU HAUT (DISPARAÎT INSTANTANÉMENT)
         ============================================================== */}
      <header
        className={`absolute top-0 left-0 right-0 z-30 h-16 sm:h-18 px-4 sm:px-8 border-b backdrop-blur-xl flex items-center justify-between transition-all duration-300 ${
          areBarsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        } ${activeTheme.hudBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Côté Gauche : Quitter (Échap) / Sommaire / Titre */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white text-xs sm:text-sm font-bold border border-white/20 transition active:scale-95 cursor-pointer"
            title="Quitter la lecture (Échap)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quitter</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-[10px] font-mono text-amber-300">
              Échap
            </span>
          </button>

          {/* Bouton Sommaire */}
          <button
            type="button"
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/15 transition active:scale-95 cursor-pointer"
          >
            <List className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Chapitres</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-mono">
              {currentSlide.chapterIndex + 1}/{rawChapters.length}
            </span>
          </button>

          {/* Titre & Identification */}
          <div className="hidden lg:flex flex-col min-w-0 ml-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-black/40 border-white/15 text-amber-300 truncate">
                {bookType === 'puits-de-nour' ? 'Livre du Vendredi' : 'Sîrah & Histoire'}
              </span>
              <span className="text-xs font-serif text-white/70" dir="rtl">
                {bookArabic}
              </span>
            </div>
            <h1 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-md">
              {bookTitle} • <span className="text-white/80">{currentSlide.chapterTitle}</span>
            </h1>
          </div>
        </div>

        {/* Côté Droit : Audio Speech, Thèmes, Typo, Fermer */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Si Puits de Nour : Personnages */}
          {bookType === 'puits-de-nour' && (
            <button
              type="button"
              onClick={() => setIsCharactersOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Personnages</span>
            </button>
          )}

          {/* Si Histoire du Prophète : Repères */}
          {bookType === 'person' && (
            <button
              type="button"
              onClick={() => setIsMilestonesOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Repères</span>
            </button>
          )}

          {/* Bouton Narration Vocale */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
              isSpeaking
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-md animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
            }`}
            title="Écouter la narration vocale de cette partie"
          >
            {isSpeaking ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-white/70" />
                <span className="hidden sm:inline">Écouter</span>
              </>
            )}
          </button>

          {/* Sélecteur de Thèmes Célestes */}
          <button
            type="button"
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 cursor-pointer relative"
            title="Changer de thème de couleur"
          >
            <Palette className="w-4 h-4 text-amber-300" />
          </button>

          {/* Bouton Taille de Police */}
          <div className="hidden sm:flex items-center rounded-full bg-white/10 border border-white/15 p-0.5">
            {(['base', 'lg', 'xl', '2xl'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setFontSize(sz)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  fontSize === sz
                    ? 'bg-white text-neutral-950 font-black shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {sz === 'base' ? 'A' : sz === 'lg' ? 'A+' : sz === 'xl' ? 'A++' : 'Max'}
              </button>
            ))}
          </div>

          {/* Bascule Serif / Sans */}
          <button
            type="button"
            onClick={() => setFontFamily((prev) => (prev === 'serif' ? 'sans' : 'serif'))}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 cursor-pointer"
            title="Basculer la police de lecture"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-200 transition active:scale-95 cursor-pointer"
            title="Quitter (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ==============================================================
          ZONES DE CLIC GAUCHE / DROITE & BOUTONS FLOTTANTS DISCRETS
         ============================================================== */}
      {/* Zone gauche (Partie précédente) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          goToPrevPart();
        }}
        className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 z-10 flex items-center justify-start pl-4 sm:pl-6 cursor-pointer group opacity-0 hover:opacity-100 transition-opacity"
        title="Partie précédente (Flèche Gauche ←)"
      >
        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 group-hover:scale-110 group-hover:bg-black/60 group-hover:text-amber-300 transition-all shadow-xl">
          <ChevronLeft className="w-6 h-6" />
        </div>
      </div>

      {/* Zone droite (Partie suivante) */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          goToNextPart();
        }}
        className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 z-10 flex items-center justify-end pr-4 sm:pr-6 cursor-pointer group opacity-0 hover:opacity-100 transition-opacity"
        title="Partie suivante (Flèche Droite →)"
      >
        <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 group-hover:scale-110 group-hover:bg-black/60 group-hover:text-amber-300 transition-all shadow-xl">
          <ChevronRight className="w-6 h-6" />
        </div>
      </div>

      {/* ==============================================================
          CORPS IMMERSIF : GRAND FORMAT LARGE (PAR PARTIE)
         ============================================================== */}
      <main
        className="relative z-20 flex-1 w-full h-full flex flex-col justify-center items-center px-6 sm:px-12 md:px-20 lg:px-28 xl:px-36 select-text overflow-hidden"
      >
        {/* Conteneur de la partie en cours : Large, Centré, Plein format */}
        <div
          key={currentSlide.id}
          className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col justify-center items-center text-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* En-tête discret de la partie */}
          <div className="flex flex-col items-center gap-1.5 transition-opacity duration-300">
            <span className="text-xs sm:text-sm uppercase tracking-widest font-bold text-amber-300/90 font-serif">
              {currentSlide.chapterNumber} • Partie {currentSlide.partIndex} sur {currentSlide.totalPartsInChapter}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white/80 max-w-2xl truncate">
              {currentSlide.chapterTitle}
            </h2>
          </div>

          {/* Paragraphes de cette partie : Grand format et couverture totale */}
          <div
            className={`space-y-5 sm:space-y-7 text-center ${
              fontFamily === 'serif' ? 'font-serif' : 'font-sans'
            } ${fontClasses}`}
          >
            {currentSlide.paragraphs.map((pText, pIdx) => (
              <p
                key={`slide-p-${pIdx}`}
                className="text-white/95 selection:bg-amber-500 selection:text-neutral-950 transition-colors tracking-wide max-w-5xl mx-auto drop-shadow-sm"
              >
                {pText}
              </p>
            ))}
          </div>

          {/* Indicateur de bas de partie & points de progression */}
          <div className="pt-2 flex items-center justify-center gap-2 text-white/40 text-xs font-mono">
            <span>{currentSlide.partIndex}</span>
            <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{
                  width: `${(currentSlide.partIndex / currentSlide.totalPartsInChapter) * 100}%`,
                }}
              />
            </div>
            <span>{currentSlide.totalPartsInChapter}</span>
          </div>
        </div>
      </main>

      {/* ==============================================================
          BANDE DU BAS (DISPARAÎT INSTANTANÉMENT)
         ============================================================== */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-30 h-14 sm:h-16 px-6 sm:px-12 bg-black/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-between text-xs text-white/80 transition-all duration-300 ${
          areBarsVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={currentSlideIndex === 0}
          onClick={goToPrevPart}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer font-bold"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400" />
          <span>Partie Précédente (←)</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">
            {currentSlide.chapterTitle}
          </span>
          <span className="text-white/30">•</span>
          <span className="font-mono text-amber-300">
            Partie {currentSlideIndex + 1} / {allSlides.length} ({progressPercent}%)
          </span>
          <span className="text-white/30 hidden sm:inline">•</span>
          <span className="text-white/60 hidden sm:inline">
            Touche <strong className="text-white font-mono">Échap</strong> pour quitter
          </span>
        </div>

        <button
          type="button"
          disabled={currentSlideIndex === allSlides.length - 1}
          onClick={goToNextPart}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer font-bold"
        >
          <span>Partie Suivante (→)</span>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </button>
      </footer>

      {/* ==============================================================
          BULLE D'AIDE RAPIDE AU DÉMARRAGE (DISPARAÎT TRÈS VITE)
         ============================================================== */}
      {showQuickHint && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-xs sm:text-sm text-white flex items-center gap-3 shadow-2xl animate-in fade-in zoom-in-95 pointer-events-none">
          <span className="text-amber-300 font-bold">Navigation au clavier :</span>
          <span>Flèches <kbd className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-amber-300">←</kbd> et <kbd className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-amber-300">→</kbd> pour faire défiler les parties</span>
          <span className="text-white/40">•</span>
          <span>Touche <kbd className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-white">Échap</kbd> pour quitter</span>
        </div>
      )}

      {/* ==============================================================
          BOUTON FLOTTANT QUITTER TOUJOURS ACCESSIBLE (EN HAUT À DROITE)
         ============================================================== */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/35 hover:bg-black/75 backdrop-blur-md border border-white/15 hover:border-white/30 text-white/60 hover:text-white transition-all active:scale-95 cursor-pointer opacity-40 hover:opacity-100"
        title="Quitter la lecture (Échap)"
      >
        <X className="w-4 h-4" />
      </button>

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
              <h3 className="text-base font-extrabold text-white">Table des Chapitres</h3>
              <button
                type="button"
                onClick={() => setIsTocOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 my-4 flex-1 overflow-y-auto pr-1">
              {rawChapters.map((ch) => {
                const isCurrent = ch.index === currentSlide.chapterIndex;
                return (
                  <button
                    key={ch.index}
                    type="button"
                    onClick={() => {
                      const firstSlideOfChapter = allSlides.find(
                        (s) => s.chapterIndex === ch.index
                      );
                      if (firstSlideOfChapter) {
                        setCurrentSlideIndex(firstSlideOfChapter.globalIndex);
                      }
                      setIsTocOpen(false);
                      setAreBarsVisible(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-900/60 border-emerald-400/80 shadow-md'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-[11px] font-bold text-amber-300">
                        {ch.number}
                      </span>
                      <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                        {ch.title}
                      </h4>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 mt-1 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL PALETTE DE COULEURS
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
                <h3 className="text-base font-extrabold text-white">Thèmes de Lecture</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.values(CINEMATIC_THEMES).map((th) => {
                const isSel = th.id === currentThemeId;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      setCurrentThemeId(th.id);
                      try {
                        localStorage.setItem('sanctuaire_book_cinematic_theme', th.id);
                      } catch {}
                      setIsPaletteOpen(false);
                      setAreBarsVisible(false);
                    }}
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
                    <span className="text-xs font-bold truncate text-white">{th.name}</span>
                  </button>
                );
              })}
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
                <h3 className="text-base font-extrabold text-white">Personnages de Dar-Salam</h3>
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
          FICHE D'UN PERSONNAGE
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
                  <h3 className="text-lg font-black text-white">{selectedCharacter.name}</h3>
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
          </div>
        </div>
      )}
    </div>
  );
};
