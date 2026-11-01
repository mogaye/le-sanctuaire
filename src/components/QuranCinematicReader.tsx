import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Maximize2,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Type,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  RotateCcw,
  Languages,
  Moon,
  Sun,
  Flame,
} from 'lucide-react';
import { CompleteSurahItem } from '../data/quranSurahs';
import { Reciter } from '../types';
import { RECITERS } from '../data/islamicData';

interface AyahData {
  num: number;
  globalNum?: number;
  ar: string;
  tr: string;
  fr: string;
  en?: string;
}

interface FullSurahData {
  num: number;
  name: string;
  enName?: string;
  enMeaning?: string;
  arName: string;
  frName: string;
  rev: string;
  totalAyahs: number;
  ayahs: AyahData[];
}

interface QuranCinematicReaderProps {
  isOpen: boolean;
  onClose: () => void;
  surahData: FullSurahData | null;
  currentSurahMeta: CompleteSurahItem;
  allSurahs: CompleteSurahItem[];
  initialAyahNum?: number;
  selectedReciter: Reciter;
  onSelectReciter: (r: Reciter) => void;
  onSelectSurah: (surahNum: number) => void;
  getAyahAudioUrl: (surahNum: number, ayahNum: number, reciterId: string) => string;
}

export type CinematicTheme = 'emerald' | 'oled' | 'amber';
export type CinematicDisplayMode = 'focus' | 'continuous';

export const QuranCinematicReader: React.FC<QuranCinematicReaderProps> = ({
  isOpen,
  onClose,
  surahData,
  currentSurahMeta,
  allSurahs,
  initialAyahNum = 1,
  selectedReciter,
  onSelectReciter,
  onSelectSurah,
  getAyahAudioUrl,
}) => {
  // Navigation & Verse Focus
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<CinematicDisplayMode>('focus');
  const [theme, setTheme] = useState<CinematicTheme>('emerald');

  // Giant typography settings: 42px (M), 56px (L), 70px (XL default), 86px (XXL)
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(2); // 0: 42px, 1: 56px, 2: 70px, 3: 86px
  const fontSizes = [
    { ar: 'text-3xl sm:text-4xl md:text-5xl leading-relaxed', label: 'Grand (46px)' },
    { ar: 'text-4xl sm:text-5xl md:text-6xl leading-[1.8]', label: 'Très Grand (58px)' },
    { ar: 'text-5xl sm:text-6xl md:text-7xl leading-[2.0]', label: 'Majestueux (72px)' },
    { ar: 'text-6xl sm:text-7xl md:text-8xl leading-[2.2]', label: 'Monumental (88px)' },
  ];

  // Translation & phonetics visibility
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [showPhonetics, setShowPhonetics] = useState<boolean>(false);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-hide HUD on inactivity
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const hideTimerRef = useRef<any>(null);

  // Fullscreen state
  const [isFullscreenActive, setIsFullscreenActive] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const verseListRef = useRef<HTMLDivElement | null>(null);

  // Setup initial ayah index
  useEffect(() => {
    if (surahData && surahData.ayahs && surahData.ayahs.length > 0) {
      const idx = surahData.ayahs.findIndex((a) => a.num === initialAyahNum);
      setCurrentAyahIndex(idx >= 0 ? idx : 0);
    }
  }, [surahData, initialAyahNum]);

  // Request browser native Fullscreen when opened
  useEffect(() => {
    if (!isOpen) return;

    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsFullscreenActive(true);
        }
      } catch (e) {
        // Fullscreen might be restricted by browser policy or devtools; proceed with full-viewport mode
        setIsFullscreenActive(true);
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      setIsFullscreenActive(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isOpen]);

  // Stop audio on close or unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Exit fullscreen and close
  const handleExit = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  // Auto-hide HUD logic
  const resetHudTimer = () => {
    setIsHudVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsHudVisible(false);
    }, 3500);
  };

  useEffect(() => {
    if (!isOpen) return;
    resetHudTimer();

    const handleMouseMove = () => resetHudTimer();
    const handleTouchStart = () => resetHudTimer();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isOpen]);

  // Verses array
  const ayahs = surahData?.ayahs || [];
  const currentAyah = ayahs[currentAyahIndex] || ayahs[0];

  // Play audio for a specific verse
  const playVerseAudio = (verseIdx: number) => {
    if (!surahData || !ayahs[verseIdx]) return;
    const ayah = ayahs[verseIdx];

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = getAyahAudioUrl(surahData.num, ayah.num, selectedReciter.id);
    const audio = new Audio(audioUrl);
    audio.muted = isAudioMuted;
    audioRef.current = audio;

    audio.onended = () => {
      // Auto advance to next verse
      if (verseIdx < ayahs.length - 1) {
        const nextIdx = verseIdx + 1;
        setCurrentAyahIndex(nextIdx);
        playVerseAudio(nextIdx);
      } else {
        setIsPlayingAudio(false);
      }
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
    };

    audio
      .play()
      .then(() => {
        setIsPlayingAudio(true);
      })
      .catch(() => {
        setIsPlayingAudio(false);
      });
  };

  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      playVerseAudio(currentAyahIndex);
    }
  };

  const handleNextVerse = () => {
    if (currentAyahIndex < ayahs.length - 1) {
      const nextIdx = currentAyahIndex + 1;
      setCurrentAyahIndex(nextIdx);
      if (isPlayingAudio) {
        playVerseAudio(nextIdx);
      }
      // Scroll to element in continuous mode
      if (displayMode === 'continuous') {
        const el = document.getElementById(`cinematic-ayah-${nextIdx}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (currentSurahMeta.number < 114) {
      // Next Surah
      onSelectSurah(currentSurahMeta.number + 1);
    }
  };

  const handlePrevVerse = () => {
    if (currentAyahIndex > 0) {
      const prevIdx = currentAyahIndex - 1;
      setCurrentAyahIndex(prevIdx);
      if (isPlayingAudio) {
        playVerseAudio(prevIdx);
      }
      if (displayMode === 'continuous') {
        const el = document.getElementById(`cinematic-ayah-${prevIdx}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (currentSurahMeta.number > 1) {
      // Previous Surah
      onSelectSurah(currentSurahMeta.number - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayAudio();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextVerse();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevVerse();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else if (e.key.toLowerCase() === 't') {
        setShowTranslation((v) => !v);
      } else if (e.key.toLowerCase() === 'p') {
        setShowPhonetics((v) => !v);
      } else if (e.key === '+' || e.key === '=') {
        setFontSizeLevel((lvl) => Math.min(3, lvl + 1));
      } else if (e.key === '-' || e.key === '_') {
        setFontSizeLevel((lvl) => Math.max(0, lvl - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentAyahIndex, ayahs.length, isPlayingAudio]);

  if (!isOpen) return null;

  // Visual Theme styling
  const themeStyles = {
    emerald: {
      bg: 'bg-radial from-[#072418] via-[#04160F] to-[#010805]',
      cardBg: 'bg-emerald-950/40 border-emerald-500/25',
      textAr: 'text-amber-100 selection:bg-amber-500 selection:text-neutral-950',
      textTr: 'text-emerald-300/85',
      textFr: 'text-emerald-100/90',
      hudBg: 'bg-[#051810]/90 border-emerald-500/30 text-white',
      badge: 'bg-emerald-900/60 text-amber-300 border-emerald-500/40',
      activeBorder: 'border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.18)]',
    },
    oled: {
      bg: 'bg-black',
      cardBg: 'bg-neutral-950/70 border-white/15',
      textAr: 'text-white selection:bg-white selection:text-black',
      textTr: 'text-neutral-400',
      textFr: 'text-neutral-200',
      hudBg: 'bg-neutral-900/90 border-white/20 text-white',
      badge: 'bg-neutral-800 text-white border-white/25',
      activeBorder: 'border-white/80 shadow-[0_0_40px_rgba(255,255,255,0.15)]',
    },
    amber: {
      bg: 'bg-radial from-[#1F160C] via-[#120B04] to-[#080502]',
      cardBg: 'bg-amber-950/30 border-amber-500/25',
      textAr: 'text-amber-100 selection:bg-amber-400 selection:text-black',
      textTr: 'text-amber-300/80',
      textFr: 'text-amber-100/85',
      hudBg: 'bg-[#180E06]/90 border-amber-500/30 text-amber-100',
      badge: 'bg-amber-900/60 text-amber-300 border-amber-500/40',
      activeBorder: 'border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.2)]',
    },
  }[theme];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] ${themeStyles.bg} flex flex-col justify-between overflow-hidden select-none transition-colors duration-500`}
      onClick={resetHudTimer}
    >
      {/* Ambient background soft light glows for cinema feel */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-400/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ========================================================
          TOP CINEMATIC HUD (AUTO-HIDES ON INACTIVITY)
         ======================================================== */}
      <header
        className={`relative z-50 w-full px-5 py-4 flex items-center justify-between transition-all duration-500 backdrop-blur-md ${
          isHudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6 pointer-events-none'
        } ${themeStyles.hudBg} border-b`}
      >
        {/* Left: Surah Information */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-sm">
            {currentSurahMeta.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {currentSurahMeta.name}
              </h2>
              <span className="text-xs text-amber-300 font-bold hidden sm:inline">
                ({currentSurahMeta.frenchTranslation})
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 uppercase tracking-widest text-[9px] font-bold">
                {currentSurahMeta.revelationType === 'Meccan' ? 'Mecquoise' : 'Médinoise'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Verset {currentAyah?.num || 1} sur {currentSurahMeta.numberOfAyahs} • Récitateur :{' '}
              <span className="text-amber-200 font-semibold">{selectedReciter.name}</span>
            </p>
          </div>
        </div>

        {/* Center: Reciter Switcher Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/40 border border-white/10 text-xs">
          <span className="text-neutral-400 font-semibold text-[11px]">Récitation :</span>
          <select
            value={selectedReciter.id}
            onChange={(e) => {
              const rec = RECITERS.find((r) => r.id === e.target.value);
              if (rec) onSelectReciter(rec);
            }}
            className="bg-transparent text-amber-300 font-bold cursor-pointer focus:outline-hidden"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id} className="bg-neutral-900 text-white">
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Quick Options (Theme, Font Size, Exit) */}
        <div className="flex items-center gap-2">
          {/* Display Mode: Focus vs Continuous */}
          <div className="hidden sm:flex items-center p-1 bg-black/40 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setDisplayMode('focus')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                displayMode === 'focus' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-300 hover:text-white'
              }`}
              title="Un verset géant centré à la fois"
            >
              Focus Verset
            </button>
            <button
              onClick={() => setDisplayMode('continuous')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                displayMode === 'continuous' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-300 hover:text-white'
              }`}
              title="Défilement continu des versets"
            >
              Défilement
            </button>
          </div>

          {/* Theme Selector */}
          <button
            onClick={() => {
              const order: CinematicTheme[] = ['emerald', 'oled', 'amber'];
              const next = order[(order.indexOf(theme) + 1) % order.length];
              setTheme(next);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition cursor-pointer"
            title={`Thème actuel : ${theme}. Cliquer pour changer`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Font Size Increaser */}
          <button
            onClick={() => setFontSizeLevel((lvl) => (lvl + 1) % fontSizes.length)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Agrandir la taille d'écriture"
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">A+</span>
          </button>

          {/* Exit Fullscreen */}
          <button
            onClick={handleExit}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer flex items-center gap-1.5 font-bold text-xs shadow-md"
            title="Quitter le mode plein écran (Échap)"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          CENTER CONTENT: CINEMATIC READING CANVAS
         ======================================================== */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 md:px-16 py-6 flex flex-col justify-center items-center no-scrollbar">
        {displayMode === 'focus' ? (
          /* ========================================================
             1. FOCUS MODE: SINGLE GIANT HERO VERSE
             ======================================================== */
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center space-y-8 my-auto">
            {/* Surah Bismillah Banner if not At-Tawbah and first verse */}
            {currentSurahMeta.number !== 9 && currentAyah?.num === 1 && (
              <div className="text-amber-200/80 font-arabic text-2xl sm:text-3xl md:text-4xl tracking-wide pb-4">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>
            )}

            {/* Verse Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs text-amber-300 font-mono font-bold tracking-wider">
              <span>Sourate {currentSurahMeta.name}</span>
              <span className="opacity-40">•</span>
              <span>Verset {currentAyah?.num} / {currentSurahMeta.numberOfAyahs}</span>
            </div>

            {/* GIANT ARABIC SCRIPT */}
            <div
              dir="rtl"
              className={`w-full font-arabic ${fontSizes[fontSizeLevel].ar} ${themeStyles.textAr} tracking-normal text-center leading-[2.1] font-normal transition-all duration-300 px-4`}
              style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
            >
              {currentAyah?.ar}
              <span className="inline-block text-amber-400 mx-3 text-3xl align-middle opacity-90 select-none">
                ۝{currentAyah?.num}
              </span>
            </div>

            {/* Phonetics & French Translation */}
            {(showPhonetics || showTranslation) && (
              <div className="w-full max-w-3xl space-y-4 pt-4 border-t border-white/10">
                {showPhonetics && currentAyah?.tr && (
                  <p className={`text-base sm:text-lg md:text-xl italic font-serif ${themeStyles.textTr} leading-relaxed`}>
                    « {currentAyah.tr} »
                  </p>
                )}

                {showTranslation && currentAyah?.fr && (
                  <p className={`text-lg sm:text-xl md:text-2xl font-medium ${themeStyles.textFr} leading-relaxed`}>
                    {currentAyah.fr}
                  </p>
                )}
              </div>
            )}

            {/* Previous & Next Clickable Targets for Mouse Users */}
            <button
              onClick={handlePrevVerse}
              disabled={currentAyahIndex === 0 && currentSurahMeta.number === 1}
              className="fixed left-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition cursor-pointer disabled:opacity-20 active:scale-90"
              title="Verset précédent (Flèche Gauche)"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>

            <button
              onClick={handleNextVerse}
              disabled={currentAyahIndex === ayahs.length - 1 && currentSurahMeta.number === 114}
              className="fixed right-4 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition cursor-pointer disabled:opacity-20 active:scale-90"
              title="Verset suivant (Flèche Droite)"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>
        ) : (
          /* ========================================================
             2. CONTINUOUS SCROLL MODE: ALL VERSES IN GIANT TYPE
             ======================================================== */
          <div ref={verseListRef} className="w-full max-w-4xl mx-auto space-y-10 py-12">
            {currentSurahMeta.number !== 9 && (
              <div className="text-center text-amber-200/80 font-arabic text-3xl sm:text-4xl pb-8">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
              </div>
            )}

            {ayahs.map((ayah, idx) => {
              const isCurrent = idx === currentAyahIndex;
              return (
                <div
                  key={ayah.num}
                  id={`cinematic-ayah-${idx}`}
                  onClick={() => {
                    setCurrentAyahIndex(idx);
                    if (isPlayingAudio) playVerseAudio(idx);
                  }}
                  className={`p-6 sm:p-8 rounded-3xl transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? `${themeStyles.cardBg} ${themeStyles.activeBorder} scale-[1.01]`
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between pb-4">
                    <span className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-mono font-bold text-xs">
                      {ayah.num}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAyahIndex(idx);
                        playVerseAudio(idx);
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-neutral-950 text-white transition"
                      title="Écouter ce verset"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  <div
                    dir="rtl"
                    className={`font-arabic ${fontSizes[fontSizeLevel].ar} ${themeStyles.textAr} text-right leading-[2.1]`}
                    style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
                  >
                    {ayah.ar}
                    <span className="inline-block text-amber-400 mx-2 text-2xl select-none">
                      ۝{ayah.num}
                    </span>
                  </div>

                  {(showPhonetics || showTranslation) && (
                    <div className="pt-4 space-y-2 border-t border-white/10 mt-4 text-left">
                      {showPhonetics && ayah.tr && (
                        <p className={`text-sm sm:text-base italic ${themeStyles.textTr}`}>
                          {ayah.tr}
                        </p>
                      )}
                      {showTranslation && ayah.fr && (
                        <p className={`text-base sm:text-lg font-medium ${themeStyles.textFr}`}>
                          {ayah.fr}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================
          BOTTOM CINEMATIC FLOATING HUD (AUTO-HIDES ON INACTIVITY)
         ======================================================== */}
      <footer
        className={`relative z-50 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500 backdrop-blur-md ${
          isHudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        } ${themeStyles.hudBg} border-t`}
      >
        {/* Left: Quick Surah Stepper */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectSurah(Math.max(1, currentSurahMeta.number - 1))}
            disabled={currentSurahMeta.number <= 1}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-30"
            title="Sourate précédente"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sourate préc.</span>
          </button>

          <span className="text-xs font-bold text-amber-300 px-2 font-mono">
            {currentSurahMeta.number}. {currentSurahMeta.name}
          </span>

          <button
            onClick={() => onSelectSurah(Math.min(114, currentSurahMeta.number + 1))}
            disabled={currentSurahMeta.number >= 114}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-30"
            title="Sourate suivante"
          >
            <span className="hidden sm:inline">Sourate suiv.</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Audio Play/Pause & Verse Stepper */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevVerse}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Verset précédent"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayAudio}
            className="p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black shadow-lg transition active:scale-95 cursor-pointer"
            title={isPlayingAudio ? 'Mettre en pause la récitation (Espace)' : 'Écouter la récitation (Espace)'}
          >
            {isPlayingAudio ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNextVerse}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Verset suivant"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Translation & Phonetics Toggles + Shortcuts Info */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTranslation((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              showTranslation
                ? 'bg-amber-400 text-neutral-950 border-amber-300'
                : 'bg-white/5 hover:bg-white/10 text-neutral-400 border-white/10'
            }`}
            title="Afficher/Masquer la traduction française (Touche T)"
          >
            <span>Traduction FR</span>
          </button>

          <button
            onClick={() => setShowPhonetics((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              showPhonetics
                ? 'bg-amber-400 text-neutral-950 border-amber-300'
                : 'bg-white/5 hover:bg-white/10 text-neutral-400 border-white/10'
            }`}
            title="Afficher/Masquer la phonétique (Touche P)"
          >
            <span>Phonétique</span>
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isAudioMuted;
              }
              setIsAudioMuted(!isAudioMuted);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title={isAudioMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </div>
  );
};
