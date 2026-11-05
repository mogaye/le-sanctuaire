import React, { useState, useEffect, useRef } from 'react';
import {
  Minimize2,
  Maximize,
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
  HelpCircle,
  X,
  BookOpen,
  Image as ImageIcon,
  Headphones,
  Languages,
  FileText,
  RotateCw,
  Layers,
  Search,
  Pin,
  PinOff,
  Sun,
} from 'lucide-react';
import { CompleteSurahItem } from '../data/quranSurahs';
import { Reciter } from '../types';
import { RECITERS } from '../data/islamicData';
import { TajweedText, TAJWEED_RULES_EXPLANATIONS, cleanAyahArabic } from '../utils/tajweedColorizer';
import { useWakeLock } from '../hooks/useWakeLock';

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

export interface CinematicBackground {
  id: string;
  name: string;
  category: 'emeraude' | 'obsidienne' | 'saphir' | 'ivoire';
  url: string;
  recommendedTheme?: CinematicThemeId;
}

export const CINEMATIC_BACKGROUNDS: CinematicBackground[] = [
  // Émeraude & Nuit (4K)
  {
    id: 'emerald_fanous_archway',
    name: 'Porche Mauresque & Lanternes (4K)',
    category: 'emeraude',
    url: '/images/fonds-islamiques/emerald_fanous_archway_4k.webp',
    recommendedTheme: 'emerald',
  },
  {
    id: 'emerald_celestial_glow',
    name: 'Rayonnement Céleste Émeraude (4K)',
    category: 'emeraude',
    url: '/images/fonds-islamiques/emerald_celestial_glow_4k.webp',
    recommendedTheme: 'emerald',
  },

  // Obsidienne & Noir (4K)
  {
    id: 'obsidian_gold_rays',
    name: "Marbre Noir & Rais d'Or (4K)",
    category: 'obsidienne',
    url: '/images/fonds-islamiques/obsidian_gold_rays_4k.webp',
    recommendedTheme: 'oled',
  },
  {
    id: 'midnight_gold_filigree',
    name: 'Mandala Astral Or & Ardoise (4K)',
    category: 'obsidienne',
    url: '/images/fonds-islamiques/midnight_gold_filigree_4k.webp',
    recommendedTheme: 'oled',
  },
  {
    id: 'midnight_gold_star',
    name: 'Étoile Géométrique 12 Branches (4K)',
    category: 'obsidienne',
    url: '/images/fonds-islamiques/midnight_gold_star_4k.webp',
    recommendedTheme: 'slate',
  },
  {
    id: 'obsidian_gold_waves',
    name: "Vagues d'Or Liquide & Marbre (4K)",
    category: 'obsidienne',
    url: '/images/fonds-islamiques/obsidian_gold_waves_4k.webp',
    recommendedTheme: 'oled',
  },
  {
    id: 'ref_obsidian_gold',
    name: 'Élégance Ombre Dorée (4K)',
    category: 'obsidienne',
    url: '/images/fonds-islamiques/ref_obsidian_gold_4k.webp',
    recommendedTheme: 'oled',
  },

  // Saphir & Crépuscule (4K)
  {
    id: 'sapphire_gold_mosque',
    name: "Mosquée Saphir & Croissant d'Or (4K)",
    category: 'saphir',
    url: '/images/fonds-islamiques/sapphire_gold_mosque_4k.webp',
    recommendedTheme: 'midnight',
  },
  {
    id: 'sapphire_lantern_night',
    name: 'Lanterne Indigo & Étoiles (4K)',
    category: 'saphir',
    url: '/images/fonds-islamiques/sapphire_lantern_night_4k.webp',
    recommendedTheme: 'midnight',
  },
  {
    id: 'golden_twilight_dunes',
    name: 'Dunes Dorées sous la Nuit (4K)',
    category: 'saphir',
    url: '/images/fonds-islamiques/golden_twilight_dunes_4k.webp',
    recommendedTheme: 'amber',
  },

  // Ivoire & Or (4K)
  {
    id: 'ivory_gold_arch',
    name: "Arche d'Ivoire & Stuc d'Or (4K)",
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_gold_arch_4k.webp',
    recommendedTheme: 'sepia',
  },
  {
    id: 'ivory_gold_courtyard',
    name: 'Patio Andalou aux Arches (4K)',
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_gold_courtyard_4k.webp',
    recommendedTheme: 'sepia',
  },
  {
    id: 'ivory_gold_palace',
    name: 'Palais Royal Blanc & Or (4K)',
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_gold_palace_4k.webp',
    recommendedTheme: 'sepia',
  },
  {
    id: 'ivory_marble_arch',
    name: 'Marbre de Carrare & Moucharabieh (4K)',
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_marble_arch_4k.webp',
    recommendedTheme: 'sepia',
  },
  {
    id: 'ivory_gold_rosette',
    name: "Rosace Dorée d'Angle (4K)",
    category: 'ivoire',
    url: '/images/fonds-islamiques/ivory_gold_rosette_4k.webp',
    recommendedTheme: 'sepia',
  },
  {
    id: 'ref_ivory_gold',
    name: 'Géométrie Ivoire & Doré (4K)',
    category: 'ivoire',
    url: '/images/fonds-islamiques/ref_ivory_gold_4k.webp',
    recommendedTheme: 'sepia',
  },
];

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
  const [isVerseFading, setIsVerseFading] = useState<boolean>(false);

  // Modals & Popovers state (all open in fixed front overlays, never behind text)
  const [isSurahPickerOpen, setIsSurahPickerOpen] = useState<boolean>(false);
  const [surahSearchQuery, setSurahSearchQuery] = useState<string>('');
  const [isReciterPickerOpen, setIsReciterPickerOpen] = useState<boolean>(false);

  // Fullscreen State (Tracks browser native fullscreen so reader covers 100% of physical display)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return Boolean(document.fullscreenElement);
    }
    return false;
  });

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  const enterNativeFullscreen = async () => {
    try {
      const el = containerRef.current || document.documentElement;
      if (el && !document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen({ navigationUI: 'hide' } as any).catch(() => {});
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Native fullscreen error:', err);
    }
  };

  const exitNativeFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await exitNativeFullscreen();
    } else {
      await enterNativeFullscreen();
    }
  };

  // Landscape Mode & Fullscreen (requested for mobile/tablet)
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth;
    }
    return false;
  });

  useEffect(() => {
    const handleOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Auto-request fullscreen upon opening reader
  useEffect(() => {
    if (!isOpen) return;
    enterNativeFullscreen();
  }, [isOpen]);

  const [isTajweedGuideOpen, setIsTajweedGuideOpen] = useState<boolean>(false);
  const [isHudPinned, setIsHudPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sanctuaire_cinematic_hud_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHudPinned = () => {
    setIsHudPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sanctuaire_cinematic_hud_pinned', String(next));
      } catch {}
      if (next) {
        setIsHudVisible(true);
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      }
      return next;
    });
  };

  // Screen Wake Lock (Anti-veille automatique pour empêcher l'écran et l'appareil de s'éteindre)
  const [isWakeLockEnabled, setIsWakeLockEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_cinematic_wakelock');
      if (saved === 'false') return false;
      return true; // Default to true: prevent device sleep while reading/listening!
    } catch {
      return true;
    }
  });

  const { isLocked: isWakeLocked, isSupported: isWakeLockSupported } = useWakeLock(
    isOpen && isWakeLockEnabled
  );

  const toggleWakeLock = () => {
    setIsWakeLockEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sanctuaire_cinematic_wakelock', String(next));
      } catch {}
      return next;
    });
  };

  const closeAllPopovers = () => {
    setIsSurahPickerOpen(false);
    setIsReciterPickerOpen(false);
    setIsAppearanceModalOpen(false);
    setIsTajweedGuideOpen(false);
  };

  const toggleLandscapeFullscreen = async () => {
    try {
      const next = !isLandscapeMode;
      setIsLandscapeMode(next);

      if (next) {
        await enterNativeFullscreen();

        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape').catch(() => {});
        } else if ((screen as any).lockOrientation) {
          try {
            (screen as any).lockOrientation('landscape');
          } catch {}
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        if (screen.orientation && (screen.orientation as any).unlock) {
          try {
            (screen.orientation as any).unlock();
          } catch {}
        } else if ((screen as any).unlockOrientation) {
          try {
            (screen as any).unlockOrientation();
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Landscape toggle error:', err);
    }
  };

  const handleChooseSurah = (num: number) => {
    closeAllPopovers();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(false);
    onSelectSurah(num);
  };

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

  // Unified Appearance & Settings Modal (Unites Themes, Backgrounds 4K, and Tajweed/Reading settings)
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState<boolean>(false);
  const [appearanceTab, setAppearanceTab] = useState<'themes' | 'backgrounds' | 'tajweed'>('themes');

  // Cinematic Background Wallpapers State
  const [selectedBgId, setSelectedBgId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_cinematic_bg');
      if (saved && (saved === 'none' || CINEMATIC_BACKGROUNDS.some((b) => b.id === saved))) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'emerald_fanous_archway';
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_cinematic_bg_opacity');
      if (saved) return Number(saved);
    } catch {
      // ignore
    }
    return 0.55;
  });
  const [bgCategoryFilter, setBgCategoryFilter] = useState<'all' | 'emeraude' | 'obsidienne' | 'saphir' | 'ivoire'>('all');

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

  // Font Size levels: 0 (Compact), 1 (Standard), 2 (Grand), 3 (Monumental)
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(1);

  // Translation & phonetics visibility - DEFAULT TO TRUE so transcription is always available!
  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_cinematic_translation');
      if (saved === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [showPhonetics, setShowPhonetics] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_cinematic_phonetics');
      if (saved === 'false') return false;
      return true; // Default to true!
    } catch {
      return true;
    }
  });

  const handleToggleTranslation = () => {
    setShowTranslation((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sanctuaire_cinematic_translation', String(next));
      } catch {}
      return next;
    });
  };

  const handleTogglePhonetics = () => {
    setShowPhonetics((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sanctuaire_cinematic_phonetics', String(next));
      } catch {}
      return next;
    });
  };

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
  };

  const handleSelectBackground = (bgId: string) => {
    setSelectedBgId(bgId);
    try {
      localStorage.setItem('sanctuaire_cinematic_bg', bgId);
    } catch {
      // ignore
    }
    const bg = CINEMATIC_BACKGROUNDS.find((b) => b.id === bgId);
    if (bg && bg.recommendedTheme) {
      handleSelectTheme(bg.recommendedTheme);
    }
  };

  const handleSelectBgOpacity = (val: number) => {
    setBgOpacity(val);
    try {
      localStorage.setItem('sanctuaire_cinematic_bg_opacity', String(val));
    } catch {
      // ignore
    }
  };

  const handleExit = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    exitNativeFullscreen();
    if (screen.orientation && (screen.orientation as any).unlock) {
      try {
        (screen.orientation as any).unlock();
      } catch {}
    } else if ((screen as any).unlockOrientation) {
      try {
        (screen as any).unlockOrientation();
      } catch {}
    }
    closeAllPopovers();
    onClose();
  };

  const anyModalOpen =
    isSurahPickerOpen ||
    isReciterPickerOpen ||
    isAppearanceModalOpen ||
    isTajweedGuideOpen;

  // Auto-hide HUD icons when audio is playing and user is not touching mouse/screen
  const resetHudTimer = (forceShow: boolean = true) => {
    if (forceShow) {
      setIsHudVisible(true);
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    // Never auto-hide if pinned or if any modal/menu is open
    if (isHudPinned || anyModalOpen) {
      setIsHudVisible(true);
      return;
    }
    // Auto-hide after 5000ms (5 seconds) of inactivity when audio is actively playing
    if (isPlayingAudio) {
      hideTimerRef.current = setTimeout(() => {
        if (!isHudPinned && !anyModalOpen) {
          setIsHudVisible(false);
        }
      }, 5000);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!isPlayingAudio || isHudPinned || anyModalOpen) {
      setIsHudVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      return;
    }

    // When audio is playing and not pinned, schedule auto-hide after 5s if inactive
    resetHudTimer(true);

    const onUserActivity = () => {
      resetHudTimer(true);
    };

    window.addEventListener('mousemove', onUserActivity);
    window.addEventListener('touchstart', onUserActivity, { passive: true });
    window.addEventListener('pointermove', onUserActivity);
    window.addEventListener('keydown', onUserActivity);

    return () => {
      window.removeEventListener('mousemove', onUserActivity);
      window.removeEventListener('touchstart', onUserActivity);
      window.removeEventListener('pointermove', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [isOpen, isPlayingAudio, anyModalOpen, isHudPinned]);

  const ayahs = (surahData?.ayahs || []).map((a) => ({
    ...a,
    ar: cleanAyahArabic(a.ar),
  }));
  const currentAyah = ayahs[currentAyahIndex] || ayahs[0];

  // Smooth, discreet, meditative verse transition (zero layout jump, silky soft dissolve)
  const transitionToVerse = (
    nextIdx: number,
    andPlayAudio: boolean = false,
    isUserAction: boolean = false
  ) => {
    if (!surahData || !ayahs || ayahs.length === 0) return;
    if (nextIdx < 0 || nextIdx >= ayahs.length) return;
    if (nextIdx === currentAyahIndex) {
      if (andPlayAudio) playVerseAudio(nextIdx, isUserAction);
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
          playVerseAudio(nextIdx, isUserAction);
        }, 260);
      }
    }, 200);
  };

  const playVerseAudio = (verseIdx: number, isUserAction: boolean = false) => {
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
        // Automatic advancement: MUST NOT force icons to pop up if already hidden
        transitionToVerse(nextIdx, true, false);
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
        // Only force icons visible if the user explicitly clicked play or navigated
        if (isUserAction) {
          resetHudTimer(true);
        }
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
      setIsHudVisible(true);
      playVerseAudio(currentAyahIndex, true);
    }
  };

  const handleNextVerse = () => {
    if (isVerseFading) return;
    if (currentAyahIndex < ayahs.length - 1) {
      transitionToVerse(currentAyahIndex + 1, isPlayingAudio, true);
    } else if (currentSurahMeta.number < 114) {
      onSelectSurah(currentSurahMeta.number + 1);
    }
  };

  const handlePrevVerse = () => {
    if (isVerseFading) return;
    if (currentAyahIndex > 0) {
      transitionToVerse(currentAyahIndex - 1, isPlayingAudio, true);
    } else if (currentSurahMeta.number > 1) {
      onSelectSurah(currentSurahMeta.number - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (anyModalOpen) {
          closeAllPopovers();
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
      } else if (e.key.toLowerCase() === 'f' || e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 't') {
        handleToggleTranslation();
      } else if (e.key.toLowerCase() === 'p') {
        handleTogglePhonetics();
      } else if (e.key.toLowerCase() === 'r') {
        setIsTajweedGuideOpen((v) => !v);
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
    isAppearanceModalOpen,
  ]);

  if (!isOpen) return null;

  const currentTheme = CINEMATIC_THEMES[theme] || CINEMATIC_THEMES.emerald;

  // Responsive fluid typography calculator: adapts to BOTH viewport width AND height
  // so text never overflows the frame, regardless of screen aspect ratio or verse length
  const getDynamicArabicStyle = (arText: string) => {
    const len = arText?.length || 0;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    let minPx = 18;
    let preferredVw = 3.6;
    let preferredVh = 4.8;
    let maxPx = 48;
    let lineHt = 1.75;

    if (len > 350) {
      // Extremely long verses (e.g. Ayat ad-Dayn, Ayat al-Kursi)
      minPx = isMobile ? 15 : 14;
      preferredVw = isMobile ? 3.8 : 1.8;
      preferredVh = 2.8;
      maxPx = isMobile ? 22 : 24;
      lineHt = 1.6;
    } else if (len > 220) {
      // Long verses
      minPx = isMobile ? 17 : 16;
      preferredVw = isMobile ? 4.2 : 2.2;
      preferredVh = 3.3;
      maxPx = isMobile ? 25 : 28;
      lineHt = 1.65;
    } else if (len > 130) {
      // Medium-long verses (e.g. Al-Kahf 5 has ~137 chars)
      minPx = isMobile ? 19 : 17;
      preferredVw = isMobile ? 4.8 : 2.6;
      preferredVh = 3.8;
      maxPx = isMobile ? 29 : 34;
      lineHt = 1.7;
    } else if (len > 60) {
      // Medium verses
      minPx = isMobile ? 22 : 19;
      preferredVw = isMobile ? 5.4 : 3.0;
      preferredVh = 4.4;
      maxPx = isMobile ? 34 : 40;
      lineHt = 1.75;
    } else {
      // Short verses (e.g. Al-Kahf 4)
      minPx = isMobile ? 25 : 22;
      preferredVw = isMobile ? 6.2 : 3.8;
      preferredVh = 5.2;
      maxPx = isMobile ? 42 : 50;
      lineHt = 1.8;
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const multipliers = [0.85, 1.0, 1.15, 1.3];
    const m = multipliers[fontSizeLevel] || 1.0;
    let minPx = isMobile ? 12 : 12;
    let preferredVw = isMobile ? 3.4 : 1.2;
    let preferredVh = isMobile ? 2.2 : 1.9;
    let maxPx = isMobile ? 15 : 16;

    if (len > 280) {
      minPx = isMobile ? 11 : 10.5;
      preferredVw = isMobile ? 3.0 : 1.0;
      preferredVh = isMobile ? 1.8 : 1.5;
      maxPx = isMobile ? 13 : 13.5;
    }

    return {
      fontSize: `clamp(${Math.round(minPx * m)}px, min(${(preferredVw * m).toFixed(2)}vw, ${(preferredVh * m).toFixed(2)}vh), ${Math.round(maxPx * m)}px)`,
      lineHeight: 1.5,
    };
  };

  const themeList = Object.values(CINEMATIC_THEMES);
  const selectedBg =
    selectedBgId === 'none'
      ? null
      : CINEMATIC_BACKGROUNDS.find((b) => b.id === selectedBgId) || CINEMATIC_BACKGROUNDS[0];
  const filteredBackgrounds =
    bgCategoryFilter === 'all'
      ? CINEMATIC_BACKGROUNDS
      : CINEMATIC_BACKGROUNDS.filter((b) => b.category === bgCategoryFilter);

  const filteredSurahs = (allSurahs || []).filter((s) => {
    const q = surahSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.arabicName.includes(q) ||
      s.frenchTranslation.toLowerCase().includes(q) ||
      String(s.number).includes(q)
    );
  });

  const isEmulatedLandscape = isLandscapeMode && isPortrait;

  return (
    <div
      ref={containerRef}
      style={{
        background: currentTheme.inlineBg,
        ...(isEmulatedLandscape
          ? {
              position: 'fixed',
              top: 0,
              left: '100vw',
              width: '100vh',
              height: '100vw',
              transform: 'rotate(90deg)',
              transformOrigin: 'top left',
              zIndex: 9999,
            }
          : {}),
      }}
      className={`fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] ${currentTheme.bg} flex flex-col justify-between overflow-hidden select-none transition-colors duration-500 ${
        !isHudVisible && isPlayingAudio ? 'cursor-none' : 'cursor-default'
      }`}
      onClick={() => {
        resetHudTimer(true);
      }}
      onMouseMove={() => {
        resetHudTimer(true);
      }}
    >
      {/* Dynamic Islamic Photographic Background Wallpaper Layer (Desktop & Tablet only; mobile uses pure serene spiritual gradient for flawless readability and fluid performance) */}
      {selectedBg && selectedBgId !== 'none' && (
        <div className="hidden md:block absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <img
            src={selectedBg.url}
            alt={selectedBg.name}
            className="w-full h-full object-cover transition-opacity duration-700"
          />
          {/* Tone-matched darkening veil to guarantee immaculate contrast for Tajweed and translations */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              backgroundColor: currentTheme.swatch || '#000000',
              opacity: bgOpacity,
            }}
          />
          {/* Radial vignette overlay */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/25 to-black/75 pointer-events-none" />
        </div>
      )}

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
          TOP FLOATING ACTION ICONS (NO BACKGROUND BAND, PURE ICONS)
         ======================================================== */}
      <div
        onMouseEnter={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          setIsHudVisible(true);
        }}
        onMouseLeave={() => {
          resetHudTimer(false);
        }}
        className={`fixed top-3 sm:top-5 left-3 sm:left-6 right-3 sm:right-6 z-[100] flex items-center justify-between pointer-events-none transition-all duration-500 ${
          isHudVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-6 pointer-events-none'
        }`}
      >
        {/* Left Floating Icons: Surah & Reciter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Surah Quick Picker Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeAllPopovers();
              setIsSurahPickerOpen(true);
            }}
            className="h-9 sm:h-10 px-3 rounded-full bg-black/55 hover:bg-black/75 text-amber-300 border border-white/20 backdrop-blur-xl flex items-center gap-1.5 transition active:scale-95 shadow-xl cursor-pointer"
            title={`Sourate ${currentSurahMeta.number}. ${currentSurahMeta.name} (cliquer pour changer)`}
          >
            <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs font-mono font-bold text-white tracking-tight">
              {currentSurahMeta.number}. {currentSurahMeta.name}
            </span>
          </button>

          {/* Reciter Selector Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeAllPopovers();
              setIsReciterPickerOpen(true);
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/55 hover:bg-black/75 text-white/90 hover:text-white border border-white/20 backdrop-blur-xl flex items-center justify-center transition active:scale-95 shadow-xl cursor-pointer"
            title={`Récitateur : ${selectedReciter.name} (cliquer pour changer)`}
          >
            <Headphones className="w-4 h-4 text-amber-300" />
          </button>
        </div>

        {/* Right Floating Icons: Plein Écran, Apparence & Réglages, Rotation (Mobile), Quitter */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">

          {/* Fullscreen Toggle (Covers the ENTIRE SCREEN, including the top browser bar on PC, tablet, and mobile) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-xl flex items-center justify-center transition active:scale-95 shadow-xl cursor-pointer border ${
              isFullscreen
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                : 'bg-black/55 hover:bg-black/75 text-amber-300 hover:text-white border-white/20'
            }`}
            title={
              isFullscreen
                ? 'Quitter le plein écran (F ou Échap)'
                : 'Plein écran complet (couvrir tout l’écran y compris le haut) (F)'
            }
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 stroke-[2.4]" />
            ) : (
              <Maximize className="w-4 h-4 stroke-[2.4]" />
            )}
          </button>

          {/* Unified Apparence & Réglages (Unites Theme, Backgrounds 4K, Tajweed, and Text Size) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeAllPopovers();
              setIsAppearanceModalOpen(true);
            }}
            className="h-9 sm:h-10 px-3 rounded-full bg-black/55 hover:bg-black/75 text-amber-300 border border-white/20 backdrop-blur-xl flex items-center gap-2 transition active:scale-95 shadow-xl cursor-pointer"
            title="Apparence & Réglages (Thèmes, Fonds 4K, Tajweed, Taille de texte)"
          >
            <Palette className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-semibold text-white/95 hidden sm:inline">Apparence</span>
          </button>

          {/* Landscape / Fullscreen Rotation Button (STRICTLY ON MOBILE ONLY as requested by user) */}
          <button
            onClick={toggleLandscapeFullscreen}
            className={`md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-xl flex items-center justify-center transition active:scale-95 shadow-xl cursor-pointer border ${
              isLandscapeMode
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                : 'bg-black/55 hover:bg-black/75 text-white/90 hover:text-white border-white/20'
            }`}
            title={isLandscapeMode ? 'Quitter mode paysage plein écran' : 'Mode paysage plein écran'}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Close / Exit Reader */}
          <button
            onClick={handleExit}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-600/85 hover:bg-rose-600 text-white border border-rose-400/40 backdrop-blur-xl flex items-center justify-center transition active:scale-95 shadow-xl cursor-pointer"
            title="Quitter le mode cinématique (Échap)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ========================================================
          CENTER CONTENT: CINEMATIC READING CANVAS
          Adapted with fluid auto-scaling so that NOTHING overflows or clips
         ======================================================== */}
      <main className="relative z-10 flex-1 w-full h-full overflow-y-auto px-4 sm:px-8 md:px-12 py-14 sm:py-16 flex flex-col items-center justify-center no-scrollbar">
        {displayMode === 'focus' ? (
          /* ========================================================
             1. FOCUS MODE: PURE CLEAN ELEVATED TYPOGRAPHY (ANCHORED & SERENE)
             ======================================================== */
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto py-1 sm:py-2 shrink-0">
            {/* Top Verse Badge pill - Stably anchored, does not jump */}
            <div className="shrink-0 mb-2.5 sm:mb-3 select-none">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/15 text-xs text-amber-300 font-mono font-medium tracking-wider shadow-xs">
                <span>Sourate {currentSurahMeta.name}</span>
                <span className="opacity-40">•</span>
                <span className="tabular-nums">
                  Verset {currentAyah?.num} / {currentSurahMeta.numberOfAyahs}
                </span>
              </div>
            </div>

            {/* GIANT ARABIC SCRIPT WITH TAJWEED COLORING (Flexible stage, clean rendering without rogue characters) */}
            <div className="w-full flex items-center justify-center px-2 sm:px-4 my-1 sm:my-2">
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
                className={`w-full max-w-sm border-t border-white/15 my-1.5 sm:my-2 transition-opacity duration-500 ease-out ${
                  isVerseFading ? 'opacity-20' : 'opacity-100'
                }`}
              />
            )}

            {/* Phonetics & French Translation - Pure text without any boxes, smooth dissolve */}
            {(showPhonetics || showTranslation) && (
              <div
                className={`w-full max-w-3xl space-y-1.5 sm:space-y-2 px-3 transition-all duration-500 ease-out ${
                  isVerseFading ? 'opacity-30 blur-[0.4px]' : 'opacity-100 blur-0'
                }`}
              >
                {showPhonetics && currentAyah?.tr && (
                  <p
                    className={`italic font-serif ${currentTheme.textTr} leading-relaxed text-center text-sm sm:text-base md:text-lg tracking-wide`}
                    style={getDynamicTranslationStyle(currentAyah.tr.length)}
                  >
                    « {currentAyah.tr} »
                  </p>
                )}

                {showTranslation && currentAyah?.fr && (
                  <p
                    className="font-normal text-white/95 leading-relaxed text-center tracking-normal text-xs sm:text-sm md:text-base"
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
              onMouseEnter={() => {
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                setIsHudVisible(true);
              }}
              onMouseLeave={() => {
                resetHudTimer(false);
              }}
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
              onMouseEnter={() => {
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                setIsHudVisible(true);
              }}
              onMouseLeave={() => {
                resetHudTimer(false);
              }}
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
          <div ref={verseListRef} className="w-full max-w-4xl mx-auto space-y-8 pt-20 pb-28">
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
                    transitionToVerse(idx, isPlayingAudio, true);
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
                        transitionToVerse(idx, true, true);
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
          BOTTOM FLOATING AUDIO & READING CONTROLS (NO BACKGROUND BAND, PURE ICONS)
         ======================================================== */}
      <div
        onMouseEnter={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          setIsHudVisible(true);
        }}
        onMouseLeave={() => {
          resetHudTimer(false);
        }}
        className={`fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center pointer-events-none transition-all duration-500 ${
          isHudVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-black/60 backdrop-blur-2xl border border-white/20 shadow-2xl">
          {/* Prev Surah (desktop/tablet) */}
          <button
            onClick={() => onSelectSurah(Math.max(1, currentSurahMeta.number - 1))}
            disabled={currentSurahMeta.number <= 1}
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white items-center justify-center transition active:scale-95 disabled:opacity-20 cursor-pointer"
            title="Sourate précédente"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Prev Ayah */}
          <button
            onClick={handlePrevVerse}
            disabled={currentAyahIndex === 0 && currentSurahMeta.number === 1}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition active:scale-95 disabled:opacity-20 cursor-pointer"
            title="Verset précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Center Play/Pause button */}
          <button
            onClick={togglePlayAudio}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center mx-1"
            title={isPlayingAudio ? 'Mettre en pause (Espace)' : 'Écouter la récitation (Espace)'}
          >
            {isPlayingAudio ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Ayah */}
          <button
            onClick={handleNextVerse}
            disabled={currentAyahIndex === ayahs.length - 1 && currentSurahMeta.number === 114}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition active:scale-95 disabled:opacity-20 cursor-pointer"
            title="Verset suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Next Surah (desktop/tablet) */}
          <button
            onClick={() => onSelectSurah(Math.min(114, currentSurahMeta.number + 1))}
            disabled={currentSurahMeta.number >= 114}
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white items-center justify-center transition active:scale-95 disabled:opacity-20 cursor-pointer"
            title="Sourate suivante"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Subtle separator */}
          <div className="w-px h-5 bg-white/20 mx-1" />

          {/* French Translation Toggle */}
          <button
            onClick={handleToggleTranslation}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border ${
              showTranslation
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                : 'bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white border-white/10'
            }`}
            title={showTranslation ? 'Masquer la traduction française (T)' : 'Afficher la traduction française (T)'}
          >
            <Languages className="w-4 h-4" />
          </button>

          {/* Phonetics / Transcription Toggle - VISIBLE EVERYWHERE */}
          <button
            onClick={handleTogglePhonetics}
            className={`flex w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center transition active:scale-95 cursor-pointer border ${
              showPhonetics
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                : 'bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white border-white/10'
            }`}
            title={showPhonetics ? 'Masquer la transcription phonétique (P)' : 'Afficher la transcription phonétique (P)'}
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Mute/Sound Toggle (icon only) */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.muted = !isAudioMuted;
              }
              setIsAudioMuted(!isAudioMuted);
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer border ${
              isAudioMuted
                ? 'bg-rose-500/25 text-rose-300 border-rose-400/50'
                : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border-white/10'
            }`}
            title={isAudioMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================
          1. SURAH SELECTION MODAL (OPENS IN FOREGROUND, NEVER CLIPPED)
         ======================================================== */}
      {isSurahPickerOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeAllPopovers}
        >
          <div
            className="w-full max-w-lg bg-neutral-900/98 border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-white max-h-[85vh] flex flex-col z-[10001]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Choisir une Sourate (1-114)</h3>
              </div>
              <button
                onClick={closeAllPopovers}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={surahSearchQuery}
                onChange={(e) => setSurahSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, numéro (ex: 18, Al-Kahf)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
                autoFocus
              />
            </div>

            {/* Surahs List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {filteredSurahs.map((s) => {
                const isSelected = s.number === currentSurahMeta.number;
                return (
                  <button
                    key={s.number}
                    onClick={() => handleChooseSurah(s.number)}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl text-left transition cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                          isSelected ? 'bg-neutral-950 text-amber-300' : 'bg-white/10 text-amber-300'
                        }`}
                      >
                        {s.number}
                      </span>
                      <div>
                        <div className="text-sm font-bold leading-tight">{s.name}</div>
                        <div className={`text-[11px] ${isSelected ? 'text-neutral-800' : 'text-neutral-400'}`}>
                          {s.frenchTranslation} • {s.numberOfAyahs} versets
                        </div>
                      </div>
                    </div>
                    <span className="font-arabic text-base" dir="rtl">
                      {s.arabicName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. RECITER SELECTION MODAL (OPENS IN FOREGROUND, NEVER CLIPPED)
         ======================================================== */}
      {isReciterPickerOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeAllPopovers}
        >
          <div
            className="w-full max-w-md bg-neutral-900/98 border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4 text-white max-h-[85vh] flex flex-col z-[10001]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <Headphones className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Choisir un Récitateur</h3>
              </div>
              <button
                onClick={closeAllPopovers}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {RECITERS.map((r) => {
                const isSelected = r.id === selectedReciter.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSelectReciter(r);
                      closeAllPopovers();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-neutral-950 text-amber-300' : 'bg-white/10 text-amber-300'
                        }`}
                      >
                        <Headphones className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="text-sm font-bold leading-tight">{r.name}</div>
                        <div className={`text-[11px] ${isSelected ? 'text-neutral-800' : 'text-neutral-400'}`}>
                          {r.style}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. UNIFIED SETTINGS & APPEARANCE MODAL (THEMES, FONDS 4K, TAJWEED & TEXT)
         ======================================================== */}
      {isAppearanceModalOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-white"
          onClick={closeAllPopovers}
        >
          <div
            className="w-full max-w-xl bg-neutral-900/98 border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col z-[10001]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Apparence & Lecture</h3>
                  <p className="text-xs text-neutral-400">Thèmes célestes, fonds d'écran et options de lecture</p>
                </div>
              </div>
              <button
                onClick={closeAllPopovers}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Unified Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl shrink-0 text-xs font-bold">
              <button
                onClick={() => setAppearanceTab('themes')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  appearanceTab === 'themes'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Thèmes</span>
              </button>
              <button
                onClick={() => setAppearanceTab('backgrounds')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  appearanceTab === 'backgrounds'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Fonds 4K</span>
              </button>
              <button
                onClick={() => setAppearanceTab('tajweed')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  appearanceTab === 'tajweed'
                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tajweed & Texte</span>
              </button>
            </div>

            {/* TAB 1: THEMES */}
            {appearanceTab === 'themes' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {themeList.map((t) => {
                    const isSelected = t.id === theme;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTheme(t.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl text-left text-xs font-bold transition cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-neutral-200 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/60 shadow-xs shrink-0"
                            style={{ backgroundColor: t.swatch }}
                          />
                          <span className="text-sm font-semibold">{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: BACKGROUNDS 4K */}
            {appearanceTab === 'backgrounds' && (
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 no-scrollbar">
                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold shrink-0">
                  <button
                    onClick={() => setBgCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition cursor-pointer ${
                      bgCategoryFilter === 'all'
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    Tous ({CINEMATIC_BACKGROUNDS.length})
                  </button>
                  <button
                    onClick={() => setBgCategoryFilter('emeraude')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition cursor-pointer ${
                      bgCategoryFilter === 'emeraude'
                        ? 'bg-emerald-500 text-white font-bold shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-emerald-300'
                    }`}
                  >
                    Émeraude
                  </button>
                  <button
                    onClick={() => setBgCategoryFilter('obsidienne')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition cursor-pointer ${
                      bgCategoryFilter === 'obsidienne'
                        ? 'bg-neutral-200 text-neutral-950 font-bold shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    Obsidienne
                  </button>
                  <button
                    onClick={() => setBgCategoryFilter('saphir')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition cursor-pointer ${
                      bgCategoryFilter === 'saphir'
                        ? 'bg-sky-500 text-white font-bold shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-sky-300'
                    }`}
                  >
                    Saphir
                  </button>
                  <button
                    onClick={() => setBgCategoryFilter('ivoire')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition cursor-pointer ${
                      bgCategoryFilter === 'ivoire'
                        ? 'bg-amber-200 text-neutral-950 font-bold shadow-xs'
                        : 'bg-white/5 hover:bg-white/10 text-amber-200'
                    }`}
                  >
                    Ivoire & Or
                  </button>
                </div>

                {/* Option: Pure Gradient (No photo) */}
                <button
                  onClick={() => handleSelectBackground('none')}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-between border ${
                    selectedBgId === 'none'
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border border-current opacity-60 inline-block" />
                    <span>Dégradé pur (sans image photographique)</span>
                  </span>
                  {selectedBgId === 'none' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                {/* Thumbnail Grid - 2 columns so cards are large, clear, and names never overlap! */}
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredBackgrounds.map((bg) => {
                    const isSelected = selectedBgId === bg.id;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => handleSelectBackground(bg.id)}
                        className={`group relative aspect-video rounded-2xl overflow-hidden border text-left transition cursor-pointer flex flex-col justify-end p-2.5 ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img
                          src={bg.url}
                          alt={bg.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white truncate drop-shadow-xs">
                            {bg.name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0 ml-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Opacity Veil Presets */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs mb-2 text-neutral-300">
                    <span className="font-semibold">Voile d'ombrage (lisibilité texte) :</span>
                    <span className="text-amber-300 font-mono font-bold">
                      {Math.round(bgOpacity * 100)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <button
                      onClick={() => handleSelectBgOpacity(0.38)}
                      className={`py-1.5 rounded-xl border transition cursor-pointer ${
                        bgOpacity <= 0.42
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-xs'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                      }`}
                    >
                      Léger (38%)
                    </button>
                    <button
                      onClick={() => handleSelectBgOpacity(0.55)}
                      className={`py-1.5 rounded-xl border transition cursor-pointer ${
                        bgOpacity > 0.42 && bgOpacity <= 0.65
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-xs'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                      }`}
                    >
                      Équilibré (55%)
                    </button>
                    <button
                      onClick={() => handleSelectBgOpacity(0.75)}
                      className={`py-1.5 rounded-xl border transition cursor-pointer ${
                        bgOpacity > 0.65
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-xs'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                      }`}
                    >
                      Sombre (75%)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TAJWEED & TEXT */}
            {appearanceTab === 'tajweed' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar text-xs">
                {/* Tajweed Assistance Toggle Card */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Coloration Tajweed Assistée</div>
                      <div className="text-neutral-400 text-[11px]">
                        Guide visuel des règles de prononciation coranique
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleTajweed}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                      isTajweedEnabled
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                        : 'bg-white/10 text-neutral-400 border-white/10'
                    }`}
                  >
                    {isTajweedEnabled ? 'Activé' : 'Désactivé'}
                  </button>
                </div>

                {/* Phonetics / Transcription Toggle Card */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Transcription Phonétique</div>
                      <div className="text-neutral-400 text-[11px]">
                        Translittération en alphabet latin pour faciliter la récitation
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePhonetics}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                      showPhonetics
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                        : 'bg-white/10 text-neutral-400 border-white/10'
                    }`}
                  >
                    {showPhonetics ? 'Activé' : 'Désactivé'}
                  </button>
                </div>

                {/* French Translation Toggle Card */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Languages className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Traduction Française</div>
                      <div className="text-neutral-400 text-[11px]">
                        Sens des versets par le Professeur Hamidullah
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleTranslation}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                      showTranslation
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                        : 'bg-white/10 text-neutral-400 border-white/10'
                    }`}
                  >
                    {showTranslation ? 'Activé' : 'Désactivé'}
                  </button>
                </div>

                {/* Pin HUD / Permanent Controls Toggle Card */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Pin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Garder les commandes visibles</div>
                      <div className="text-neutral-400 text-[11px]">
                        {isHudPinned
                          ? 'Les icônes restent fixées à l’écran'
                          : 'Masquage automatique après 5s d’inactivité'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleHudPinned}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                      isHudPinned
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                        : 'bg-white/10 text-neutral-400 border-white/10'
                    }`}
                  >
                    {isHudPinned ? 'Fixé (Permanent)' : 'Auto-masquage (5s)'}
                  </button>
                </div>

                {/* Anti-Veille / Maintenir l'écran allumé Toggle Card */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Empêcher la mise en veille</span>
                        {isWakeLocked && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Écran actif
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-400 text-[11px]">
                        Maintient l’écran toujours allumé sans interruption pendant la lecture
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleWakeLock}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                      isWakeLockEnabled
                        ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                        : 'bg-white/10 text-neutral-400 border-white/10'
                    }`}
                  >
                    {isWakeLockEnabled ? 'Activé' : 'Désactivé'}
                  </button>
                </div>

                {/* Font Size Selector */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="font-bold text-sm text-white">Taille du texte arabe</span>
                    <span className="text-amber-300 font-mono">
                      {fontSizeLevel === 0
                        ? 'Compact'
                        : fontSizeLevel === 1
                        ? 'Standard'
                        : fontSizeLevel === 2
                        ? 'Grand'
                        : 'Monumental'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['A', 'A+', 'A++', 'A+++'].map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFontSizeLevel(idx)}
                        className={`py-2 rounded-xl font-bold transition cursor-pointer border ${
                          fontSizeLevel === idx
                            ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Mode Selector */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="font-bold text-sm text-white">Mode de lecture</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDisplayMode('focus')}
                      className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer border text-left ${
                        displayMode === 'focus'
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                      }`}
                    >
                      <div className="font-bold">Focus verset</div>
                      <div className="text-[10px] opacity-75">Méditation un par un</div>
                    </button>
                    <button
                      onClick={() => setDisplayMode('continuous')}
                      className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer border text-left ${
                        displayMode === 'continuous'
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10'
                      }`}
                    >
                      <div className="font-bold">Continu</div>
                      <div className="text-[10px] opacity-75">Défilement fluide</div>
                    </button>
                  </div>
                </div>

                {/* Tajweed Rules Summary Guide */}
                <div className="space-y-2">
                  <div className="font-bold text-sm text-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Règles de couleurs du Tajweed</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsAppearanceModalOpen(false);
                        setIsTajweedGuideOpen(true);
                      }}
                      className="text-[11px] text-amber-300 hover:underline cursor-pointer"
                    >
                      Voir le guide complet &rarr;
                    </button>
                  </div>
                  <div className="space-y-2">
                    {TAJWEED_RULES_EXPLANATIONS.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3 rounded-2xl border transition-all"
                        style={{ backgroundColor: rule.bgColor, borderColor: rule.borderColor }}
                      >
                        <div className="flex items-center justify-between pb-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: rule.color }}
                            />
                            <span className="font-bold text-xs text-white">{rule.name}</span>
                            <span className="text-[11px] font-arabic opacity-75" dir="rtl">
                              {rule.arabicName}
                            </span>
                          </div>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: rule.color,
                              color: rule.id === 'silent' ? '#000000' : '#051A10',
                            }}
                          >
                            {rule.duration}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-200 mt-1 leading-snug">
                          {rule.description}
                        </p>
                        <div className="mt-1 text-[11px] font-arabic text-right text-amber-200" dir="rtl">
                          Exemple : <span className="font-bold underline">{rule.example}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          4. DEDICATED TAJWEED RULES & PRONUNCIATION MODAL
         ======================================================== */}
      {isTajweedGuideOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsTajweedGuideOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-neutral-900/98 border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white max-h-[90vh] flex flex-col z-[10001]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Règles de Tajweed (Tajwîd)</h3>
                  <p className="text-xs text-neutral-400">Guide officiel des couleurs de prononciation coranique</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleTajweed}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isTajweedEnabled
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm'
                      : 'bg-white/10 text-neutral-400 border-white/10'
                  }`}
                >
                  {isTajweedEnabled ? 'Couleurs activées' : 'Désactivé'}
                </button>
                <button
                  onClick={() => setIsTajweedGuideOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Rules list */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar text-xs">
              {TAJWEED_RULES_EXPLANATIONS.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-2xl border transition-all"
                  style={{ backgroundColor: rule.bgColor, borderColor: rule.borderColor }}
                >
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: rule.color }}
                      />
                      <span className="font-bold text-sm text-white">{rule.name}</span>
                      <span className="text-sm font-arabic font-bold opacity-85 text-amber-200" dir="rtl">
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
                  <p className="text-xs text-neutral-200 mt-1.5 leading-relaxed">
                    {rule.description}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-neutral-400 text-[11px]">Exemples coraniques :</span>
                    <span className="font-arabic text-sm text-amber-100 tracking-wider" dir="rtl">
                      {rule.example}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer tips */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 shrink-0">
              <span>Astuce : Vous pouvez activer ou désactiver les couleurs à tout moment avec la touche (R).</span>
              <button
                onClick={() => setIsTajweedGuideOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-400 text-neutral-950 font-bold hover:bg-amber-300 transition cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
