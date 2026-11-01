import React, { useState, useEffect, useRef } from 'react';
import {
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Type,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Palette,
  Check,
  Video,
  HelpCircle,
  X,
  BookOpen,
} from 'lucide-react';
import { CompleteSurahItem } from '../data/quranSurahs';
import { Reciter } from '../types';
import { RECITERS } from '../data/islamicData';
import { TajweedText, TAJWEED_RULES_EXPLANATIONS, cleanAyahArabic } from '../utils/tajweedColorizer';
import { QuranVideoRecorderModal } from './QuranVideoRecorderModal';

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

// 10 Distinct, Gorgeous and Immersive Spiritual Themes
export type CinematicThemeId =
  | 'emerald'
  | 'midnight'
  | 'oled'
  | 'amber'
  | 'amethyst'
  | 'ocean'
  | 'ruby'
  | 'forest'
  | 'slate'
  | 'sepia';

export interface ThemeConfig {
  id: CinematicThemeId;
  name: string;
  bg: string;
  inlineBg: string;
  cardBg: string;
  textAr: string;
  textTr: string;
  textFr: string;
  hudBg: string;
  badge: string;
  activeBorder: string;
  accent: string;
  swatch: string;
  glow1: string;
  glow2: string;
}

export const CINEMATIC_THEMES: Record<CinematicThemeId, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Émeraude Sacrée',
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#06281b_0%,#03160e_55%,#010805_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #06281b 0%, #03160e 55%, #010805 100%)',
    cardBg: 'bg-emerald-950/40 border-emerald-500/25',
    textAr: 'text-amber-100 selection:bg-amber-500 selection:text-neutral-950',
    textTr: 'text-emerald-300/85',
    textFr: 'text-emerald-100/90',
    hudBg: 'bg-[#04170f]/92 border-emerald-500/30 text-white',
    badge: 'bg-emerald-900/60 text-amber-300 border-emerald-500/40',
    activeBorder: 'border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.18)]',
    accent: '#34D399',
    swatch: '#06281b',
    glow1: 'rgba(251, 191, 36, 0.06)',
    glow2: 'rgba(16, 185, 129, 0.08)',
  },
  midnight: {
    id: 'midnight',
    name: 'Bleu Nuit Céleste',
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#0b1e36_0%,#05101f_55%,#02060d_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #0b1e36 0%, #05101f 55%, #02060d 100%)',
    cardBg: 'bg-sky-950/40 border-sky-500/25',
    textAr: 'text-sky-100 selection:bg-sky-400 selection:text-neutral-950',
    textTr: 'text-sky-300/85',
    textFr: 'text-slate-100/90',
    hudBg: 'bg-[#051120]/92 border-sky-500/30 text-white',
    badge: 'bg-sky-900/60 text-sky-300 border-sky-500/40',
    activeBorder: 'border-sky-400/80 shadow-[0_0_40px_rgba(56,189,248,0.2)]',
    accent: '#38BDF8',
    swatch: '#0b1e36',
    glow1: 'rgba(56, 189, 248, 0.08)',
    glow2: 'rgba(99, 102, 241, 0.06)',
  },
  oled: {
    id: 'oled',
    name: 'Noir Absolu OLED',
    bg: 'bg-black',
    inlineBg: '#000000',
    cardBg: 'bg-neutral-950/80 border-white/15',
    textAr: 'text-white selection:bg-white selection:text-black',
    textTr: 'text-neutral-400',
    textFr: 'text-neutral-200',
    hudBg: 'bg-neutral-900/95 border-white/20 text-white',
    badge: 'bg-neutral-800 text-white border-white/25',
    activeBorder: 'border-white/80 shadow-[0_0_40px_rgba(255,255,255,0.15)]',
    accent: '#FFFFFF',
    swatch: '#000000',
    glow1: 'rgba(255, 255, 255, 0.04)',
    glow2: 'rgba(255, 255, 255, 0.03)',
  },
  amber: {
    id: 'amber',
    name: 'Ambre Crépusculaire',
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#2a1808_0%,#170c03_55%,#090401_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #2a1808 0%, #170c03 55%, #090401 100%)',
    cardBg: 'bg-amber-950/40 border-amber-500/25',
    textAr: 'text-amber-100 selection:bg-amber-400 selection:text-black',
    textTr: 'text-amber-300/85',
    textFr: 'text-amber-100/90',
    hudBg: 'bg-[#190d04]/92 border-amber-500/30 text-amber-100',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-500/40',
    activeBorder: 'border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.2)]',
    accent: '#F59E0B',
    swatch: '#2a1808',
    glow1: 'rgba(245, 158, 11, 0.08)',
    glow2: 'rgba(217, 119, 6, 0.06)',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Améthyste Royale',
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#220e36_0%,#12061f_55%,#06020c_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #220e36 0%, #12061f 55%, #06020c 100%)',
    cardBg: 'bg-purple-950/40 border-purple-500/25',
    textAr: 'text-purple-100 selection:bg-purple-400 selection:text-black',
    textTr: 'text-purple-300/85',
    textFr: 'text-purple-100/90',
    hudBg: 'bg-[#130722]/92 border-purple-500/30 text-purple-100',
    badge: 'bg-purple-900/60 text-purple-300 border-purple-500/40',
    activeBorder: 'border-purple-400/80 shadow-[0_0_40px_rgba(192,132,252,0.2)]',
    accent: '#C084FC',
    swatch: '#220e36',
    glow1: 'rgba(192, 132, 252, 0.08)',
    glow2: 'rgba(168, 85, 247, 0.06)',
  },
  ocean: {
    id: 'ocean',
    name: 'Abysse Océanique',
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#082930_0%,#04161a_55%,#01090c_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #082930 0%, #04161a 55%, #01090c 100%)',
    cardBg: 'bg-teal-950/40 border-teal-500/25',
    textAr: 'text-teal-100 selection:bg-teal-400 selection:text-black',
    textTr: 'text-teal-300/85',
    textFr: 'text-teal-100/90',
    hudBg: 'bg-[#04181d]/92 border-teal-500/30 text-teal-100',
    badge: 'bg-teal-900/60 text-teal-300 border-teal-500/40',
    activeBorder: 'border-teal-400/80 shadow-[0_0_40px_rgba(45,212,191,0.2)]',
    accent: '#2DD4BF',
    swatch: '#082930',
    glow1: 'rgba(45, 212, 191, 0.08)',
    glow2: 'rgba(20, 184, 166, 0.06)',
  },
  ruby: {
    id: 'ruby',
    name: 'Grenat Impérial',
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#2e0d16_0%,#19050b_55%,#090104_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #2e0d16 0%, #19050b 55%, #090104 100%)',
    cardBg: 'bg-rose-950/40 border-rose-500/25',
    textAr: 'text-rose-100 selection:bg-rose-400 selection:text-black',
    textTr: 'text-rose-300/85',
    textFr: 'text-rose-100/90',
    hudBg: 'bg-[#1a060d]/92 border-rose-500/30 text-rose-100',
    badge: 'bg-rose-900/60 text-rose-300 border-rose-500/40',
    activeBorder: 'border-rose-400/80 shadow-[0_0_40px_rgba(251,113,133,0.2)]',
    accent: '#FB7185',
    swatch: '#2e0d16',
    glow1: 'rgba(251, 113, 133, 0.08)',
    glow2: 'rgba(244, 63, 94, 0.06)',
  },
  forest: {
    id: 'forest',
    name: "Forêt d'Éden",
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#15260f_0%,#0b1607_55%,#040902_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #15260f 0%, #0b1607 55%, #040902 100%)',
    cardBg: 'bg-lime-950/40 border-lime-500/25',
    textAr: 'text-lime-100 selection:bg-lime-400 selection:text-black',
    textTr: 'text-lime-300/85',
    textFr: 'text-lime-100/90',
    hudBg: 'bg-[#0c1808]/92 border-lime-500/30 text-lime-100',
    badge: 'bg-lime-900/60 text-lime-300 border-lime-500/40',
    activeBorder: 'border-lime-400/80 shadow-[0_0_40px_rgba(163,230,53,0.2)]',
    accent: '#A3E635',
    swatch: '#15260f',
    glow1: 'rgba(163, 230, 53, 0.08)',
    glow2: 'rgba(132, 204, 22, 0.06)',
  },
  slate: {
    id: 'slate',
    name: 'Anthracite Titane',
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#1c2430_0%,#10151d_55%,#07090d_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #1c2430 0%, #10151d 55%, #07090d 100%)',
    cardBg: 'bg-slate-900/60 border-slate-500/25',
    textAr: 'text-slate-100 selection:bg-slate-400 selection:text-black',
    textTr: 'text-slate-300/85',
    textFr: 'text-slate-100/90',
    hudBg: 'bg-[#101621]/92 border-slate-500/30 text-slate-100',
    badge: 'bg-slate-800 text-slate-300 border-slate-600/40',
    activeBorder: 'border-slate-400/80 shadow-[0_0_40px_rgba(148,163,184,0.2)]',
    accent: '#94A3B8',
    swatch: '#1c2430',
    glow1: 'rgba(148, 163, 184, 0.08)',
    glow2: 'rgba(100, 116, 139, 0.06)',
  },
  sepia: {
    id: 'sepia',
    name: 'Parchemin Médine',
    bg: 'bg-[radial-gradient(ellipse_at_50%_30%,#262018_0%,#17120c_55%,#0a0805_100%)]',
    inlineBg: 'radial-gradient(ellipse at 50% 30%, #262018 0%, #17120c 55%, #0a0805 100%)',
    cardBg: 'bg-amber-950/40 border-amber-600/25',
    textAr: 'text-[#FEF9C3] selection:bg-amber-400 selection:text-black',
    textTr: 'text-amber-200/85',
    textFr: 'text-amber-100/90',
    hudBg: 'bg-[#18130d]/92 border-amber-600/30 text-amber-100',
    badge: 'bg-amber-900/60 text-amber-300 border-amber-600/40',
    activeBorder: 'border-amber-400/80 shadow-[0_0_40px_rgba(217,119,6,0.2)]',
    accent: '#D97706',
    swatch: '#262018',
    glow1: 'rgba(217, 119, 6, 0.08)',
    glow2: 'rgba(180, 83, 9, 0.06)',
  },
};

export type CinematicDisplayMode = 'focus' | 'continuous';

export const QuranCinematicReader: React.FC<QuranCinematicReaderProps> = ({
  isOpen,
  onClose,
  surahData,
  currentSurahMeta,
  allSurahs: _allSurahs,
  initialAyahNum = 1,
  selectedReciter,
  onSelectReciter,
  onSelectSurah,
  getAyahAudioUrl,
}) => {
  // Navigation & Verse Focus
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [displayMode, setDisplayMode] = useState<CinematicDisplayMode>('focus');
  const [isVerseFading, setIsVerseFading] = useState<boolean>(false);

  // 10 Themes Selection
  const [theme, setTheme] = useState<CinematicThemeId>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_cinematic_theme') as CinematicThemeId;
      if (saved && CINEMATIC_THEMES[saved]) return saved;
    } catch {
      // ignore
    }
    return 'emerald';
  });
  const [isThemePickerOpen, setIsThemePickerOpen] = useState<boolean>(false);

  // Tajweed Coloring & Guide state
  const [isTajweedEnabled, setIsTajweedEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_tajweed_enabled');
      if (saved === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [isTajweedGuideOpen, setIsTajweedGuideOpen] = useState<boolean>(false);

  // Video Generator Studio Modal state
  const [isVideoRecorderOpen, setIsVideoRecorderOpen] = useState<boolean>(false);

  // Font Size levels: 0 (Compact), 1 (Standard), 2 (Grand), 3 (Monumental)
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(1);

  // Translation & phonetics visibility
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [showPhonetics, setShowPhonetics] = useState<boolean>(false);

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-hide HUD, side chevrons, and mouse cursor
  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);
  const hideTimerRef = useRef<any>(null);

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
        }
      } catch (e) {
        // ignore
      }
    };

    enterFullscreen();
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

  const handleToggleTajweed = () => {
    setIsTajweedEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sanctuaire_tajweed_enabled', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleSelectTheme = (themeId: CinematicThemeId) => {
    setTheme(themeId);
    try {
      localStorage.setItem('sanctuaire_cinematic_theme', themeId);
    } catch {
      // ignore
    }
    setIsThemePickerOpen(false);
  };

  const handleExit = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  const resetHudTimer = (forceShow: boolean = true) => {
    if (forceShow) {
      setIsHudVisible(true);
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    const delay = isPlayingAudio ? 2500 : 5000;
    hideTimerRef.current = setTimeout(() => {
      if (isPlayingAudio) {
        setIsHudVisible(false);
        setIsThemePickerOpen(false);
      }
    }, delay);
  };

  useEffect(() => {
    if (!isOpen) return;
    resetHudTimer(true);

    const handleMouseMove = () => resetHudTimer(true);
    const handleTouchStart = () => resetHudTimer(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isOpen, isPlayingAudio]);

  const ayahs = surahData?.ayahs || [];
  const currentAyah = ayahs[currentAyahIndex] || ayahs[0];

  // Smooth, discreet, meditative verse transition (zero layout jump, silky soft dissolve)
  const transitionToVerse = (nextIdx: number, andPlayAudio: boolean = false) => {
    if (!surahData || !ayahs || ayahs.length === 0) return;
    if (nextIdx < 0 || nextIdx >= ayahs.length) return;
    if (nextIdx === currentAyahIndex) {
      if (andPlayAudio) playVerseAudio(nextIdx);
      return;
    }

    // 1. Soft dissolve (never goes pitch-black or jumps vertically)
    setIsVerseFading(true);

    setTimeout(() => {
      // 2. Switch verse index
      setCurrentAyahIndex(nextIdx);

      if (displayMode === 'continuous') {
        const el = document.getElementById(`cinematic-ayah-${nextIdx}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // 3. Allow DOM to paint new verse, then bloom softly into full clarity
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVerseFading(false);
        });
      });

      // 4. Meditative natural breath interval before next recitation begins
      if (andPlayAudio) {
        setTimeout(() => {
          playVerseAudio(nextIdx);
        }, 260);
      }
    }, 200);
  };

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
      if (verseIdx < ayahs.length - 1) {
        const nextIdx = verseIdx + 1;
        transitionToVerse(nextIdx, true);
      } else {
        setIsPlayingAudio(false);
        setIsHudVisible(true);
      }
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      setIsHudVisible(true);
    };

    audio
      .play()
      .then(() => {
        setIsPlayingAudio(true);
        setIsHudVisible(false);
        setIsThemePickerOpen(false);
      })
      .catch(() => {
        setIsPlayingAudio(false);
        setIsHudVisible(true);
      });
  };

  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
      setIsHudVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      setIsHudVisible(false);
      setIsThemePickerOpen(false);
      playVerseAudio(currentAyahIndex);
    }
  };

  const handleNextVerse = () => {
    if (isVerseFading) return;
    if (currentAyahIndex < ayahs.length - 1) {
      transitionToVerse(currentAyahIndex + 1, isPlayingAudio);
    } else if (currentSurahMeta.number < 114) {
      onSelectSurah(currentSurahMeta.number + 1);
    }
  };

  const handlePrevVerse = () => {
    if (isVerseFading) return;
    if (currentAyahIndex > 0) {
      transitionToVerse(currentAyahIndex - 1, isPlayingAudio);
    } else if (currentSurahMeta.number > 1) {
      onSelectSurah(currentSurahMeta.number - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTajweedGuideOpen) {
          setIsTajweedGuideOpen(false);
        } else if (isThemePickerOpen) {
          setIsThemePickerOpen(false);
        } else if (isVideoRecorderOpen) {
          setIsVideoRecorderOpen(false);
        } else {
          handleExit();
        }
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
  }, [
    isOpen,
    currentAyahIndex,
    ayahs.length,
    isPlayingAudio,
    isThemePickerOpen,
    isTajweedGuideOpen,
    isVideoRecorderOpen,
  ]);

  if (!isOpen) return null;

  const currentTheme = CINEMATIC_THEMES[theme] || CINEMATIC_THEMES.emerald;

  // Responsive fluid typography calculator: adapts to BOTH viewport width AND height
  // so text never overflows the frame, regardless of screen aspect ratio or verse length
  const getDynamicArabicStyle = (arText: string) => {
    const len = arText?.length || 0;
    let minPx = 20;
    let preferredVw = 4.0;
    let preferredVh = 6.2;
    let maxPx = 56;
    let lineHt = 1.8;

    if (len > 350) {
      // Extremely long verses (e.g. Ayat ad-Dayn, Ayat al-Kursi)
      minPx = 14;
      preferredVw = 2.0;
      preferredVh = 3.2;
      maxPx = 26;
      lineHt = 1.65;
    } else if (len > 220) {
      // Long verses
      minPx = 16;
      preferredVw = 2.5;
      preferredVh = 3.8;
      maxPx = 32;
      lineHt = 1.7;
    } else if (len > 130) {
      // Medium-long verses
      minPx = 18;
      preferredVw = 3.0;
      preferredVh = 4.6;
      maxPx = 40;
      lineHt = 1.75;
    } else if (len > 60) {
      // Medium verses (e.g. Al-Kahf 5)
      minPx = 20;
      preferredVw = 3.6;
      preferredVh = 5.4;
      maxPx = 48;
      lineHt = 1.8;
    } else {
      // Short verses (e.g. Al-Kahf 4)
      minPx = 22;
      preferredVw = 4.4;
      preferredVh = 6.6;
      maxPx = 58;
      lineHt = 1.85;
    }

    const multipliers = [0.85, 1.0, 1.15, 1.3];
    const m = multipliers[fontSizeLevel] || 1.0;

    const finalMin = Math.round(minPx * m);
    const finalVw = (preferredVw * m).toFixed(2);
    const finalVh = (preferredVh * m).toFixed(2);
    const finalMax = Math.round(maxPx * m);

    return {
      fontSize: `clamp(${finalMin}px, min(${finalVw}vw, ${finalVh}vh), ${finalMax}px)`,
      lineHeight: lineHt,
    };
  };

  const getDynamicTranslationStyle = (len: number) => {
    const multipliers = [0.85, 1.0, 1.15, 1.3];
    const m = multipliers[fontSizeLevel] || 1.0;
    let minPx = 12.5;
    let preferredVw = 1.3;
    let preferredVh = 2.2;
    let maxPx = 18;

    if (len > 280) {
      minPx = 11;
      preferredVw = 1.1;
      preferredVh = 1.8;
      maxPx = 15;
    }

    return {
      fontSize: `clamp(${Math.round(minPx * m)}px, min(${(preferredVw * m).toFixed(2)}vw, ${(preferredVh * m).toFixed(2)}vh), ${Math.round(maxPx * m)}px)`,
      lineHeight: 1.5,
    };
  };

  const themeList = Object.values(CINEMATIC_THEMES);

  return (
    <div
      ref={containerRef}
      style={{ background: currentTheme.inlineBg }}
      className={`fixed inset-0 z-[9999] ${currentTheme.bg} flex flex-col justify-between overflow-hidden select-none transition-colors duration-500 ${
        !isHudVisible && isPlayingAudio ? 'cursor-none' : 'cursor-default'
      }`}
      onClick={() => {
        if (!isHudVisible) {
          resetHudTimer(true);
        }
      }}
    >
      {/* Ambient background soft light glows for cinema feel */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700"
        style={{ backgroundColor: currentTheme.glow1 }}
      />
      <div
        className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full blur-[120px] pointer-events-none transition-all duration-700"
        style={{ backgroundColor: currentTheme.glow2 }}
      />

      {/* ========================================================
          TOP CINEMATIC HUD (AUTO-HIDES ON AUDIO PLAY)
         ======================================================== */}
      <header
        className={`relative z-50 w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between transition-all duration-500 backdrop-blur-md ${
          isHudVisible
            ? 'opacity-100 translate-y-0 shadow-lg'
            : 'opacity-0 -translate-y-full pointer-events-none'
        } ${currentTheme.hudBg} border-b`}
      >
        {/* Left: Surah Information */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 border border-white/20 flex items-center justify-center font-bold text-sm">
            {currentSurahMeta.number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight">
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

        {/* Right: Quick Options (Theme, Tajweed, Video, Font Size, Exit) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Display Mode: Focus vs Continuous */}
          <div className="hidden sm:flex items-center p-1 bg-black/40 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setDisplayMode('focus')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                displayMode === 'focus'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
              title="Un verset géant centré à la fois"
            >
              Focus Verset
            </button>
            <button
              onClick={() => setDisplayMode('continuous')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                displayMode === 'continuous'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'text-neutral-300 hover:text-white'
              }`}
              title="Défilement continu des versets"
            >
              Défilement
            </button>
          </div>

          {/* Tajweed Toggle & Guide Button */}
          <div className="flex items-center bg-black/40 rounded-xl border border-white/15 p-0.5">
            <button
              onClick={handleToggleTajweed}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                isTajweedEnabled
                  ? 'bg-gradient-to-r from-emerald-500/30 to-amber-500/30 text-amber-300 border border-amber-400/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Activer/Désactiver le coloriage Tajweed des lettres"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-rose-500 via-emerald-400 to-amber-400 inline-block" />
              <span>Tajweed</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsTajweedGuideOpen(true);
              }}
              className="p-1.5 text-neutral-400 hover:text-amber-300 transition cursor-pointer"
              title="Comprendre les couleurs et règles du Tajweed"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Video Studio Generator Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVideoRecorderOpen(true);
            }}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/30 hover:from-amber-400/30 hover:to-amber-500/40 text-amber-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-amber-400/30 shadow-xs"
            title="Enregistrer et exporter en vidéo avec le son et le logo officiel Le Sanctuaire"
          >
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Créer Vidéo</span>
          </button>

          {/* Theme Palette Button with Swatch preview */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsThemePickerOpen((prev) => !prev);
              }}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-white/15"
              title="Choisir parmi les 10 thèmes immersifs"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs inline-block"
                style={{ backgroundColor: currentTheme.swatch }}
              />
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{currentTheme.name}</span>
            </button>

            {/* 10 Themes Selection Popover */}
            {isThemePickerOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-72 p-3 rounded-2xl bg-neutral-900/98 backdrop-blur-xl border border-white/20 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    10 Couleurs Immersives
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">10 / 10 Thèmes</span>
                </div>
                <div className="grid grid-cols-1 gap-1 max-h-72 overflow-y-auto no-scrollbar pr-1">
                  {themeList.map((t) => {
                    const isSelected = t.id === theme;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTheme(t.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 shadow-sm'
                            : 'hover:bg-white/10 text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/50 shadow-xs shrink-0"
                            style={{ backgroundColor: t.swatch }}
                          />
                          <span>{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Font Size Increaser */}
          <button
            onClick={() => setFontSizeLevel((lvl) => (lvl + 1) % 4)}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition cursor-pointer flex items-center gap-1 text-xs font-bold border border-white/15"
            title="Ajuster la taille du texte"
          >
            <Type className="w-3.5 h-3.5 text-amber-300" />
            <span>A{fontSizeLevel === 0 ? '-' : fontSizeLevel === 3 ? '++' : '+'}</span>
          </button>

          {/* Exit Fullscreen */}
          <button
            onClick={handleExit}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-600/85 hover:bg-rose-600 text-white transition cursor-pointer flex items-center gap-1.5 font-bold text-xs shadow-md"
            title="Quitter le mode plein écran (Échap)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          CENTER CONTENT: CINEMATIC READING CANVAS
          Adapted with fluid auto-scaling so that NOTHING overflows or clips
         ======================================================== */}
      <main className="relative z-10 flex-1 w-full overflow-y-auto px-4 sm:px-8 md:px-12 py-3 sm:py-5 flex flex-col items-center no-scrollbar">
        {displayMode === 'focus' ? (
          /* ========================================================
             1. FOCUS MODE: PURE CLEAN ELEVATED TYPOGRAPHY (ANCHORED & SERENE)
             ======================================================== */
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto py-1 sm:py-2">
            {/* Top Verse Badge pill - Stably anchored, does not jump */}
            <div className="shrink-0 mb-3 sm:mb-4 select-none">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/15 text-xs text-amber-300 font-mono font-medium tracking-wider shadow-xs">
                <span>Sourate {currentSurahMeta.name}</span>
                <span className="opacity-40">•</span>
                <span className="tabular-nums">
                  Verset {currentAyah?.num} / {currentSurahMeta.numberOfAyahs}
                </span>
              </div>
            </div>

            {/* GIANT ARABIC SCRIPT WITH TAJWEED COLORING (Flexible stage, clean rendering without rogue characters) */}
            <div className="w-full flex items-center justify-center px-2 sm:px-4 my-1.5 sm:my-2.5">
              <div
                dir="rtl"
                className={`w-full font-arabic ${currentTheme.textAr} tracking-normal text-center font-normal transition-all duration-500 ease-out break-words [word-break:keep-all] ${
                  isVerseFading ? 'opacity-30 blur-[0.5px]' : 'opacity-100 blur-0'
                }`}
                style={{
                  fontFamily: "'Amiri', 'Traditional Arabic', serif",
                  ...getDynamicArabicStyle(cleanAyahArabic(currentAyah?.ar || '')),
                }}
              >
                <TajweedText text={cleanAyahArabic(currentAyah?.ar || '')} enabled={isTajweedEnabled} />
              </div>
            </div>

            {/* Thin subtle horizontal divider line */}
            {(showPhonetics || showTranslation) && (
              <div
                className={`w-full max-w-lg border-t border-white/15 my-2 sm:my-2.5 transition-opacity duration-500 ease-out ${
                  isVerseFading ? 'opacity-20' : 'opacity-100'
                }`}
              />
            )}

            {/* Phonetics & French Translation - Pure text without any boxes, smooth dissolve */}
            {(showPhonetics || showTranslation) && (
              <div
                className={`w-full max-w-3xl space-y-2 sm:space-y-2.5 px-3 transition-all duration-500 ease-out ${
                  isVerseFading ? 'opacity-30 blur-[0.4px]' : 'opacity-100 blur-0'
                }`}
              >
                {showPhonetics && currentAyah?.tr && (
                  <p
                    className={`italic font-serif ${currentTheme.textTr} leading-relaxed text-center`}
                    style={getDynamicTranslationStyle(currentAyah.tr.length)}
                  >
                    « {currentAyah.tr} »
                  </p>
                )}

                {showTranslation && currentAyah?.fr && (
                  <p
                    className="font-normal text-white/95 leading-relaxed text-center tracking-normal"
                    style={getDynamicTranslationStyle(currentAyah.fr.length)}
                  >
                    {currentAyah.fr}
                  </p>
                )}
              </div>
            )}

            {/* ========================================================
                SIDE CHEVRONS (AUTOHIDE WHEN PLAYING AUDIO)
                "et aussi les deux crochet suivant et precedant"
               ======================================================== */}
            <button
              onClick={handlePrevVerse}
              disabled={currentAyahIndex === 0 && currentSurahMeta.number === 1}
              className={`fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-500 cursor-pointer disabled:opacity-20 active:scale-90 z-40 backdrop-blur-xs border border-white/10 ${
                isHudVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'
              }`}
              title="Verset précédent (Flèche Gauche)"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            <button
              onClick={handleNextVerse}
              disabled={currentAyahIndex === ayahs.length - 1 && currentSurahMeta.number === 114}
              className={`fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-500 cursor-pointer disabled:opacity-20 active:scale-90 z-40 backdrop-blur-xs border border-white/10 ${
                isHudVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'
              }`}
              title="Verset suivant (Flèche Droite)"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
        ) : (
          /* ========================================================
             2. CONTINUOUS SCROLL MODE: ALL VERSES IN GIANT TYPE
             ======================================================== */
          <div ref={verseListRef} className="w-full max-w-4xl mx-auto space-y-8 py-8">
            {currentSurahMeta.number !== 9 && (
              <div className="text-center text-amber-200/80 font-arabic text-2xl sm:text-3xl pb-4">
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
                    transitionToVerse(idx, isPlayingAudio);
                  }}
                  className={`p-5 sm:p-7 rounded-3xl transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? `${currentTheme.cardBg} ${currentTheme.activeBorder} scale-[1.01]`
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3">
                    <span className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-mono font-bold text-xs">
                      {ayah.num}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        transitionToVerse(idx, true);
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-neutral-950 text-white transition"
                      title="Écouter ce verset"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  {/* Clean Arabic verse with Tajweed coloring */}
                  <div
                    dir="rtl"
                    className={`font-arabic ${currentTheme.textAr} text-right font-normal transition-all duration-300 break-words [word-break:keep-all]`}
                    style={{
                      fontFamily: "'Amiri', 'Traditional Arabic', serif",
                      ...getDynamicArabicStyle(cleanAyahArabic(ayah.ar)),
                    }}
                  >
                    <TajweedText text={cleanAyahArabic(ayah.ar)} enabled={isTajweedEnabled} />
                  </div>

                  {(showPhonetics || showTranslation) && (
                    <div className="pt-3 space-y-1.5 border-t border-white/10 mt-3 text-left">
                      {showPhonetics && ayah.tr && (
                        <p
                          className={`italic ${currentTheme.textTr} leading-relaxed`}
                          style={getDynamicTranslationStyle(ayah.tr.length)}
                        >
                          {ayah.tr}
                        </p>
                      )}
                      {showTranslation && ayah.fr && (
                        <p
                          className={`font-medium ${currentTheme.textFr} leading-relaxed`}
                          style={getDynamicTranslationStyle(ayah.fr.length)}
                        >
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
          BOTTOM CINEMATIC FLOATING HUD (AUTO-HIDES ON AUDIO PLAY)
         ======================================================== */}
      <footer
        className={`relative z-50 w-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-all duration-500 backdrop-blur-md ${
          isHudVisible
            ? 'opacity-100 translate-y-0 shadow-lg'
            : 'opacity-0 translate-y-full pointer-events-none'
        } ${currentTheme.hudBg} border-t`}
      >
        {/* Left: Quick Surah Stepper */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectSurah(Math.max(1, currentSurahMeta.number - 1))}
            disabled={currentSurahMeta.number <= 1}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-30 border border-white/10"
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
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-30 border border-white/10"
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
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/10"
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
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/10"
            title="Verset suivant"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Translation, Phonetics, Video & Mute */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTranslation((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              showTranslation
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
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
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-neutral-400 border-white/10'
            }`}
            title="Afficher/Masquer la phonétique (Touche P)"
          >
            <span>Phonétique</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVideoRecorderOpen(true);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-neutral-950 text-amber-300 transition cursor-pointer border border-white/10"
            title="Exporter une séquence en vidéo"
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isAudioMuted;
              }
              setIsAudioMuted(!isAudioMuted);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/10"
            title={isAudioMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </footer>

      {/* ========================================================
          TAJWEED RULES EXPLANATION MODAL
         ======================================================== */}
      {isTajweedGuideOpen && (
        <div
          onClick={() => setIsTajweedGuideOpen(false)}
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-neutral-900 border border-white/20 rounded-3xl p-6 shadow-2xl space-y-5 text-white max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Guide des Couleurs du Tajweed (تجويد)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Comprendre l'utilité et les règles de récitation des lettres colorées
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTajweedGuideOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs sm:text-sm text-neutral-200 leading-relaxed">
              <strong className="text-amber-300 font-bold">À quoi sert le Tajweed ?</strong>
              <p className="mt-1 text-neutral-300">
                Le Tajweed est la science de la récitation coranique. Le coloriage a été conçu par les savants
                pour guider visuellement vos yeux : chaque couleur vous indique instantanément comment prononcer la
                lettre (allonger, faire résonner dans le nez, faire rebondir ou ne pas prononcer) sans avoir
                besoin de maîtriser par cœur les règles grammaticales complexes !
              </p>
            </div>

            <div className="space-y-3">
              {TAJWEED_RULES_EXPLANATIONS.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 sm:p-4 rounded-2xl border transition-all"
                  style={{ backgroundColor: rule.bgColor, borderColor: rule.borderColor }}
                >
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: rule.color }}
                      />
                      <span className="font-bold text-sm text-white">{rule.name}</span>
                      <span className="text-xs font-arabic opacity-75 font-semibold" dir="rtl">
                        {rule.arabicName}
                      </span>
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={{
                        backgroundColor: rule.color,
                        color: rule.id === 'silent' ? '#000000' : '#051A10',
                      }}
                    >
                      {rule.duration}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-200 mt-1 leading-relaxed">
                    {rule.description}
                  </p>
                  <div className="mt-2 text-xs font-arabic text-right tracking-wide text-amber-200" dir="rtl">
                    Exemple : <span className="font-bold underline">{rule.example}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsTajweedGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition cursor-pointer shadow-md"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          VIDEO RECORDER / EXPORT STUDIO MODAL
         ======================================================== */}
      {isVideoRecorderOpen && (
        <QuranVideoRecorderModal
          isOpen={isVideoRecorderOpen}
          onClose={() => setIsVideoRecorderOpen(false)}
          surahNum={currentSurahMeta.number}
          surahName={currentSurahMeta.name}
          totalAyahs={currentSurahMeta.numberOfAyahs}
          currentAyahNum={currentAyah?.num || 1}
          ayahs={ayahs}
          selectedReciter={selectedReciter}
          getAyahAudioUrl={getAyahAudioUrl}
          themeId={theme}
        />
      )}
    </div>
  );
};
