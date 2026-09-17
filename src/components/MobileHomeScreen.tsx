import React, { useState, useMemo } from 'react';
import {
  Menu,
  Bell,
  Search,
  SlidersHorizontal,
  BookOpen,
  Clock,
  Compass,
  Sparkles,
  ChevronRight,
  RotateCw,
  Quote,
  CheckCircle2,
  Circle,
  MapPin,
  Calendar,
  Moon,
  Sun,
  Sunrise,
  SunMedium,
  Sunset,
  Library,
  ArrowRight,
  ArrowUp,
  Heart,
  ExternalLink,
  LogIn,
  LogOut,
  X,
  Volume2,
  Play,
  RotateCcw,
  Check,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CityData } from '../types';
import { CitySelectorModal } from './CitySelectorModal';
import { getPrayerLog, formatDateKey } from '../utils/prayerTrackerUtils';

export interface MobileHomeScreenProps {
  currentUser: { name?: string; firstName?: string; lastName?: string; email?: string } | null;
  selectedCity: CityData;
  cities: CityData[];
  onCityChange: (city: CityData) => void;
  liveClockString: string;
  liveGregorianDate: string;
  liveHijriDate: string;
  nextPrayer: {
    name: string;
    arabicName: string;
    time: string;
    remainingStr: string;
  };
  todayPrayers: Array<{
    key: 'F' | 'D' | 'A' | 'M' | 'I';
    name: string;
    arabicName: string;
    time: string;
    isNext: boolean;
    isCompleted: boolean;
  }>;
  onTogglePrayer: (key: 'F' | 'D' | 'A' | 'M' | 'I') => void;
  currentVerse: {
    id: string;
    french: string;
    reference: string;
    arabicSurahName: string;
  };
  onNextVerse: () => void;
  onOpenQuran: () => void;
  onOpenPrayerGuide: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
  onOpenFasting?: () => void;
  onOpenFaith?: () => void;
  onOpenLibrary?: () => void;
  onOpenPrayerSettings: () => void;
  onOpenCalendar?: () => void;
  onOpenAuth?: () => void;
  onLogout: () => void;
  onGoToLanding: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const HADITHS = [
  {
    id: 1,
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    french: '« Le meilleur d’entre vous est celui qui apprend le Coran et l’enseigne. »',
    source: 'Rapporté par Al-Boukhari (n° 5027)',
    theme: 'Le Saint Coran',
  },
  {
    id: 2,
    arabic: 'صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً',
    french: '« La prière en groupe dépasse la prière individuelle de vingt-sept degrés. »',
    source: 'Rapporté par Al-Boukhari et Muslim',
    theme: 'La Salat en communauté',
  },
  {
    id: 3,
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    french: '« Celui qui emprunte un chemin à la recherche d’une science, Allah lui facilite un chemin vers le Paradis. »',
    source: 'Rapporté par Muslim (n° 2699)',
    theme: 'La quête de la science',
  },
  {
    id: 4,
    arabic: 'أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ',
    french: '« L’œuvre la plus aimée d’Allah est celle qui est la plus constante, même si elle est modeste. »',
    source: 'Rapporté par Al-Boukhari et Muslim',
    theme: 'La constance spirituelle',
  },
];

const ALLAH_NAMES = [
  {
    arabic: 'الرَّحْمَٰنُ',
    transliteration: 'Ar-Rahmân',
    meaning: 'Le Tout-Miséricordieux',
    description: 'Celui dont la miséricorde infinie et absolue embrasse l’ensemble de la création et de l’univers.',
  },
  {
    arabic: 'السَّلَامُ',
    transliteration: 'As-Salâm',
    meaning: 'La Source de la Paix',
    description: 'Celui qui est exempt de tout défaut et qui accorde la quiétude profonde aux cœurs croyants.',
  },
  {
    arabic: 'الْوَدُودُ',
    transliteration: 'Al-Wadûd',
    meaning: 'Le Tout-Aimant, Le Bienveillant',
    description: 'Celui qui aime Ses serviteurs avec tendresse et qui répand la bonté dans les âmes sincères.',
  },
  {
    arabic: 'الْغَفَّارُ',
    transliteration: 'Al-Ghaffâr',
    meaning: 'Le Grand Pardonneur',
    description: 'Celui qui pardonne sans cesse les manquements et dissimule les faiblesses de celui qui se repent.',
  },
  {
    arabic: 'النُّورُ',
    transliteration: 'An-Nûr',
    meaning: 'La Lumière des Cieux et de la Terre',
    description: 'Celui qui illumine les cœurs par la foi et guide les âmes hors des ténèbres vers la clarté.',
  },
];

const QUICK_DHIKRS = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', translit: 'SubhanAllah', target: 33, meaning: 'Gloire à Allah' },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', translit: 'Alhamdulillah', target: 33, meaning: 'Louange à Allah' },
  { id: 'allahuakbar', arabic: 'اللَّهُ أَكْبَرُ', translit: 'Allahu Akbar', target: 33, meaning: 'Allah est le Plus Grand' },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', translit: 'Astaghfirullah', target: 100, meaning: 'Je demande pardon à Allah' },
];

export const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({
  currentUser,
  selectedCity,
  cities,
  onCityChange,
  liveClockString,
  liveGregorianDate,
  liveHijriDate,
  nextPrayer,
  todayPrayers,
  onTogglePrayer,
  currentVerse,
  onNextVerse,
  onOpenQuran,
  onOpenPrayerGuide,
  onOpenQibla,
  onOpenDhikr,
  onOpenFasting,
  onOpenFaith,
  onOpenLibrary,
  onOpenPrayerSettings,
  onOpenCalendar,
  onOpenAuth,
  onLogout,
  onGoToLanding,
  isDarkMode = true,
  onToggleDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);

  // Quick Mini-Tasbih State
  const [selectedDhikrIdx, setSelectedDhikrIdx] = useState(0);
  const [dhikrCount, setDhikrCount] = useState(0);

  // Daily Asma & Hadith Rotation State
  const [nameIdx, setNameIdx] = useState(0);
  const [hadithIdx, setHadithIdx] = useState(0);

  // Calculate approximate Shuruq (Sunrise) ~1h20 after Fajr
  const fajrPrayer = todayPrayers.find((p) => p.key === 'F');
  const getShuruqTime = (fajrTime?: string) => {
    if (!fajrTime) return '07:05';
    const [h, m] = fajrTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return '07:05';
    const total = h * 60 + m + 80;
    const shH = Math.floor(total / 60) % 24;
    const shM = total % 60;
    return `${String(shH).padStart(2, '0')}:${String(shM).padStart(2, '0')}`;
  };
  const shuruqTime = getShuruqTime(fajrPrayer?.time);

  const currentDhikr = QUICK_DHIKRS[selectedDhikrIdx];
  const currentHadith = HADITHS[hadithIdx];
  const currentAllahName = ALLAH_NAMES[nameIdx];

  const handleIncrementDhikr = () => {
    if (dhikrCount >= currentDhikr.target) {
      setDhikrCount(1);
    } else {
      setDhikrCount((prev) => prev + 1);
    }
  };

  const completedCount = todayPrayers.filter((p) => p.isCompleted).length;

  // Real Weekly Constance Tracker based on actual prayer logs for the current week (Monday to Sunday)
  const weekDaysData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const todayStr = formatDateKey(today);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    return dayLabels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = formatDateKey(d);
      const isToday = dateStr === todayStr;
      const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const isPast = dMidnight < todayMidnight;
      const isFuture = dMidnight > todayMidnight;

      let count = 0;
      if (isToday) {
        count = todayPrayers.filter((p) => p.isCompleted).length;
      } else if (isPast) {
        const log = getPrayerLog(dateStr);
        count = Object.values(log).filter(Boolean).length;
      }

      return {
        label,
        dateStr,
        isToday,
        isPast,
        isFuture,
        count,
      };
    });
  }, [todayPrayers]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-[#F4F7F5] dark:bg-[#14261C] text-neutral-900 dark:text-neutral-100 pb-6 font-['Plus_Jakarta_Sans',sans-serif] select-none min-h-screen transition-colors duration-200">
      
      {/* ========================================================
          1. TOP APP BAR (Menu Hamburger à gauche, Thème & Cloche à droite)
         ======================================================== */}
      <header className="px-4 sm:px-5 pt-3 pb-2 flex items-center justify-between">
        {/* Hamburger Menu Icon */}
        <button
          id="mobile-btn-drawer"
          type="button"
          onClick={() => setIsSideDrawerOpen(true)}
          className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-[#193226] border border-neutral-200/80 dark:border-emerald-500/30 shadow-xs flex items-center justify-center text-neutral-800 dark:text-emerald-200 hover:text-emerald-950 dark:hover:text-white active:scale-95 transition-transform cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5 stroke-[2]" />
        </button>

        {/* City & Live Clock Pill (Center) */}
        <button
          type="button"
          onClick={() => setIsCityModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-[#193226] border border-neutral-200/80 dark:border-emerald-500/30 text-xs font-semibold text-neutral-900 dark:text-emerald-100 active:scale-95 transition-transform cursor-pointer shadow-xs"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold text-neutral-900 dark:text-white">{selectedCity.name}</span>
          <span className="text-[10px] bg-emerald-600 dark:bg-emerald-700 text-white font-mono px-1.5 py-0.5 rounded-full font-bold">
            {liveClockString}
          </span>
        </button>

        {/* Right Actions: Bell */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPrayerSettings}
            className="relative w-10 h-10 rounded-2xl bg-white/90 dark:bg-[#193226] border border-neutral-200/80 dark:border-emerald-500/30 shadow-xs flex items-center justify-center text-neutral-800 dark:text-emerald-200 hover:text-emerald-950 dark:hover:text-white active:scale-95 transition-transform cursor-pointer"
            aria-label="Rappels de prière"
          >
            <Bell className="w-4.5 h-4.5 stroke-[1.8]" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#193226]" />
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-5 space-y-4 pt-1">
        
        {/* ========================================================
            2. GREETING & AVATAR SECTION
           ======================================================== */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-0.5 max-w-[240px]">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 truncate">
              Assalamu Alaykum,{' '}
              <span className="font-bold text-emerald-800 dark:text-emerald-200">
                {currentUser?.firstName || (currentUser?.name ? currentUser.name.split(' ')[0] : '') || 'Cher Croyant'}
              </span>
            </p>
            <h1 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
              Nourrissez votre{' '}
              <span className="text-emerald-600 dark:text-emerald-300">spiritualité.</span>
            </h1>
          </div>

          {/* Profile Circle Avatar */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md shadow-emerald-950/20">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#193226] flex items-center justify-center overflow-hidden">
                {currentUser ? (
                  <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                    {(currentUser.firstName || currentUser.name || 'S').charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <img
                    src="/images/sanctuaire_logo.jpg"
                    alt="Sanctuaire"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#14261C] shadow-xs" />
          </div>
        </div>

        {/* ========================================================
            3. SEARCH BAR (Input pill with filter icon)
           ======================================================== */}
        <div className="relative flex items-center gap-2">
          <div
            onClick={onOpenQuran}
            className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs cursor-pointer active:scale-99 transition-transform"
          >
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400/80 shrink-0" />
            <span className="text-xs text-neutral-500 dark:text-neutral-300 font-normal truncate">
              Rechercher une sourate, prière, verset...
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenPrayerSettings}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs flex items-center justify-center text-neutral-700 dark:text-emerald-200 hover:text-neutral-950 dark:hover:text-white active:scale-95 transition-transform cursor-pointer shrink-0"
            aria-label="Filtres et réglages"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>

        {/* ========================================================
            4. HERO BANNER CARD (Next Prayer Countdown)
           ======================================================== */}
        <div
          className="relative rounded-2xl overflow-hidden p-4 sm:p-5 shadow-[0_10px_25px_rgba(16,115,75,0.2)] flex flex-col justify-between min-h-[145px] border border-emerald-600/30 dark:border-emerald-500/30"
          style={{
            background: 'linear-gradient(135deg, #1B5E39 0%, #174E30 45%, #0F3721 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
          <div className="absolute bottom-0 right-10 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

          {/* Right Clock Display */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex flex-col items-center justify-center p-1.5 text-white">
              <Clock className="w-6 h-6 text-amber-300 stroke-[1.8]" />
              <span className="text-[10px] font-mono font-bold mt-0.5 text-emerald-100">
                {nextPrayer.time}
              </span>
            </div>
          </div>

          {/* Left Content */}
          <div className="relative z-10 max-w-[65%] space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-semibold text-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Prochaine Prière
            </div>

            <h2 className="text-lg font-extrabold text-white tracking-tight leading-tight">
              {nextPrayer.name} <span className="text-emerald-300 font-serif text-sm">{nextPrayer.arabicName}</span>
            </h2>

            <p className="text-[11px] text-emerald-100/90 leading-snug">
              Dans <span className="font-bold text-amber-200">{nextPrayer.remainingStr}</span> • {selectedCity.name}
            </p>

            <div className="pt-1.5">
              <button
                type="button"
                onClick={onOpenPrayerGuide}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-emerald-950 text-[11px] font-bold shadow-xs hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
              >
                <span>Guide de prière</span>
                <ArrowRight className="w-3 h-3 text-emerald-800" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            5. "NOS ESPACES" (4 Main Portals)
           ======================================================== */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Nos Espaces</h3>
            <button
              type="button"
              onClick={onOpenQuran}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer flex items-center gap-0.5"
            >
              <span>Voir tout</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* 1. Coran */}
            <button
              type="button"
              onClick={onOpenQuran}
              className="bg-white dark:bg-[#193226] rounded-xl p-2 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs flex flex-col items-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <BookOpen className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight">Coran</span>
              <span className="text-[9px] text-neutral-500 dark:text-emerald-200/70 leading-none">114 Sourates</span>
            </button>

            {/* 2. Prières */}
            <button
              type="button"
              onClick={onOpenPrayerGuide}
              className="bg-white dark:bg-[#193226] rounded-xl p-2 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs flex flex-col items-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 border border-blue-300/80 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <Clock className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight">Prières</span>
              <span className="text-[9px] text-neutral-500 dark:text-emerald-200/70 leading-none">5 Salats</span>
            </button>

            {/* 3. Qibla */}
            <button
              type="button"
              onClick={onOpenQibla}
              className="bg-white dark:bg-[#193226] rounded-xl p-2 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs flex flex-col items-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Compass className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight">Qibla</span>
              <span className="text-[9px] text-neutral-500 dark:text-emerald-200/70 leading-none">Boussole</span>
            </button>

            {/* 4. Dhikr */}
            <button
              type="button"
              onClick={onOpenDhikr}
              className="bg-white dark:bg-[#193226] rounded-xl p-2 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs flex flex-col items-center text-center gap-1 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight">Dhikr</span>
              <span className="text-[9px] text-neutral-500 dark:text-emerald-200/70 leading-none">Tasbih</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            6. "HORAIRES DES 5 PRIÈRES DU JOUR"
           ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Horaires des Prières
              </h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 font-medium">
                {liveHijriDate}
              </p>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{completedCount} / 5 accomplies</span>
            </div>
          </div>

          {/* Unified Clean 5-Salat Table List */}
          <div className="bg-white dark:bg-[#193226] rounded-2xl border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs overflow-hidden divide-y divide-neutral-100 dark:divide-emerald-800/40">
            {/* Shuruq (Sunrise) row */}
            <div className="px-4 py-2.5 bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-500/20 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2.5">
                <Sunrise className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-bold">Lever du soleil</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300/80 font-serif ml-1.5">الشروق</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-800 dark:text-amber-200">{shuruqTime}</span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 border border-amber-300/80 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  Fin du Fajr
                </span>
              </div>
            </div>

            {/* All 5 Daily Prayers with Checkboxes */}
            {todayPrayers.map((p) => {
              const iconMap = {
                F: <Sunrise className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />,
                D: <Sun className="w-4 h-4 text-amber-600 dark:text-amber-300" />,
                A: <SunMedium className="w-4 h-4 text-orange-600 dark:text-orange-300" />,
                M: <Sunset className="w-4 h-4 text-rose-600 dark:text-rose-300" />,
                I: <Moon className="w-4 h-4 text-purple-600 dark:text-purple-300" />,
              };

              return (
                <div
                  key={p.key}
                  className={`px-4 py-3 flex items-center justify-between transition-colors ${
                    p.isNext
                      ? 'bg-amber-50/60 dark:bg-amber-950/30'
                      : 'hover:bg-neutral-50 dark:hover:bg-[#1E3B2E]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      p.isNext
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/40'
                        : 'bg-neutral-100 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20'
                    }`}>
                      {iconMap[p.key]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">{p.name}</span>
                        <span className="font-serif text-xs text-emerald-700 dark:text-emerald-300">{p.arabicName}</span>
                        {p.isNext && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-[9px] border border-amber-300/80 dark:border-amber-500/40">
                            À venir
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 dark:text-emerald-200/60 font-medium block">
                        {p.key === 'F' && '2 Rakats (voix haute)'}
                        {p.key === 'D' && '4 Rakats (silencieux)'}
                        {p.key === 'A' && '4 Rakats (silencieux)'}
                        {p.key === 'M' && '3 Rakats (voix haute)'}
                        {p.key === 'I' && '4 Rakats (voix haute)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-extrabold text-xs sm:text-sm ${
                      p.isNext ? 'text-amber-700 dark:text-amber-300 font-black' : 'text-neutral-700 dark:text-neutral-200'
                    }`}>
                      {p.time}
                    </span>

                    <button
                      type="button"
                      onClick={() => onTogglePrayer(p.key)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer active:scale-90 ${
                        p.isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-[#14281E] border-neutral-300 dark:border-emerald-500/30 text-neutral-400 dark:text-emerald-300/60 hover:border-emerald-500'
                      }`}
                      title={p.isCompleted ? 'Prière accomplie (cliquer pour décocher)' : 'Marquer comme accomplie'}
                    >
                      {p.isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Circle className="w-4 h-4 stroke-[1.8]" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick button to open full monthly prayer calendar & stats */}
          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 dark:bg-[#12271D] hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-700/50 text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-98"
            >
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Consulter le Calendrier & Suivi Mensuel</span>
            </button>
          )}
        </div>

        {/* ========================================================
            7. "REPRENDRE LE SAINT CORAN" (Quran Resume Card)
           ======================================================== */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">Le Saint Coran</h3>
            <button
              type="button"
              onClick={onOpenQuran}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer flex items-center gap-0.5"
            >
              <span>Ouvrir Coran</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-emerald-500/25 text-neutral-900 dark:text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-400/30 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-300" />
                  <span>Lecture Recommandée</span>
                </div>
                <h4 className="text-base font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  Sourate Al-Fatiha • الفَاتِحَة
                </h4>
                <p className="text-xs text-neutral-600 dark:text-emerald-100/80 line-clamp-1">
                  « L’Ouverture » — 7 Versets • Récitateur Mishary Alafasy
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenQuran}
                className="w-10 h-10 rounded-full bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform cursor-pointer"
                title="Écouter la sourate"
              >
                <Play className="w-4 h-4 ml-0.5 fill-current" />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-emerald-800/60 flex items-center justify-between text-[11px]">
              <span className="text-emerald-800 dark:text-emerald-200/90 font-arabic text-xs">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
              <button
                type="button"
                onClick={onOpenQuran}
                className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
              >
                Lire la sourate complète →
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            8. "CHAPELET ÉLECTRONIQUE (MINI-TASBIH RAPIDE)"
           ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">Dhikr & Tasbih Quotidien</h3>
            <button
              type="button"
              onClick={onOpenDhikr}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer flex items-center gap-0.5"
            >
              <span>Tasbih complet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#193226] rounded-2xl p-4 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs space-y-3">
            {/* Dhikr Pills Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {QUICK_DHIKRS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedDhikrIdx(idx);
                    setDhikrCount(0);
                  }}
                  className={`p-1.5 rounded-xl text-center text-[10px] font-bold border transition-all cursor-pointer ${
                    selectedDhikrIdx === idx
                      ? 'bg-emerald-600 dark:bg-emerald-800 text-white border-emerald-500/40 dark:border-emerald-400/40 shadow-xs'
                      : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-emerald-500/20 hover:bg-neutral-200 dark:hover:bg-[#1E3B2E]'
                  }`}
                >
                  <span className="block truncate font-arabic text-xs text-emerald-800 dark:text-amber-200">{item.arabic}</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">{item.translit}</span>
                </button>
              ))}
            </div>

            {/* Interactive Dhikr Tap Counter */}
            <div className="flex items-center justify-between bg-neutral-50 dark:bg-[#14281E] rounded-xl p-3 border border-neutral-200 dark:border-emerald-500/20">
              <div className="space-y-0.5">
                <span className="font-arabic text-base font-bold text-emerald-800 dark:text-amber-200 block">
                  {currentDhikr.arabic}
                </span>
                <span className="text-xs font-black text-neutral-900 dark:text-white block">
                  {currentDhikr.translit}
                </span>
                <span className="text-[10px] text-neutral-600 dark:text-emerald-200/70 font-medium block">
                  « {currentDhikr.meaning} »
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDhikrCount(0)}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  title="Remettre à zéro"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleIncrementDhikr}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-[#12261B] dark:to-[#1C3F2B] text-white flex flex-col items-center justify-center font-mono font-black shadow-sm active:scale-90 transition-transform cursor-pointer border border-emerald-400/40 dark:border-emerald-500/40"
                >
                  <span className="text-lg leading-none">{dhikrCount}</span>
                  <span className="text-[8px] font-sans font-bold text-emerald-100 dark:text-emerald-300 opacity-90 mt-0.5">
                    /{currentDhikr.target}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            9. "INSPIRATION SPIRITUELLE" (Verse of the Day)
           ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">Verset Méditatif du Jour</h3>
            <button
              type="button"
              onClick={onNextVerse}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer flex items-center gap-1"
            >
              <span>Autre verset</span>
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#193226] rounded-2xl p-4 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300/80 dark:border-amber-500/40">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>{currentVerse.reference}</span>
                <span>•</span>
                <span className="font-serif">{currentVerse.arabicSurahName}</span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-200 font-medium leading-relaxed italic line-clamp-3">
                « {currentVerse.french} »
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300/70 font-medium">
                1 min de méditation quotidienne
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner text-emerald-700 dark:text-emerald-300">
              <Quote className="w-6 h-6 opacity-80" />
            </div>
          </div>
        </div>

        {/* ========================================================
            10. "LE NOM D'ALLAH DU JOUR" (Al-Asma Al-Husna)
           ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">Le Nom d’Allah du Jour</h3>
            <button
              type="button"
              onClick={() => setNameIdx((prev) => (prev + 1) % ALLAH_NAMES.length)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer flex items-center gap-1"
            >
              <span>Suivant</span>
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#193226] rounded-2xl p-4 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-arabic text-xl font-bold text-amber-700 dark:text-amber-200">
                  {currentAllahName.arabic}
                </span>
                <span className="text-xs font-black text-neutral-900 dark:text-white">
                  {currentAllahName.transliteration}
                </span>
              </div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {currentAllahName.meaning}
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-medium leading-relaxed">
                {currentAllahName.description}
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
              <Award className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* ========================================================
            11. "HADITH & SAGESSE DU JOUR"
           ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">Sagesse Prophétique du Jour</h3>
            <button
              type="button"
              onClick={() => setHadithIdx((prev) => (prev + 1) % HADITHS.length)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white cursor-pointer flex items-center gap-1"
            >
              <span>Autre hadith</span>
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#193226] rounded-2xl p-4 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
              <span>{currentHadith.theme}</span>
            </div>

            <p className="font-arabic text-sm text-amber-800 dark:text-amber-200 leading-relaxed font-semibold">
              {currentHadith.arabic}
            </p>

            <p className="text-xs text-neutral-700 dark:text-neutral-200 italic leading-relaxed">
              {currentHadith.french}
            </p>

            <div className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-medium pt-0.5">
              {currentHadith.source}
            </div>
          </div>
        </div>

        {/* ========================================================
            12. "REPÈRES & PROCHAINS ÉVÉNEMENTS SPIRITUELS"
           ======================================================== */}
        <div className="space-y-2.5 pt-1">
          <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight">Repères & Prochains Jalons</h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs space-y-1">
              <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Vendredi (Jumu’ah)</h4>
              <p className="text-[10px] text-neutral-600 dark:text-emerald-200/70 font-medium">Lecture de Sourate Al-Kahf et prière en assemblée.</p>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-purple-500/30 shadow-xs space-y-1">
              <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/70 border border-purple-300/80 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Jours Blancs</h4>
              <p className="text-[10px] text-neutral-600 dark:text-purple-200/70 font-medium">Jeûne Sunnah recommandé les 13, 14 et 15 du mois.</p>
            </div>
          </div>
        </div>

        {/* ========================================================
            13. COMPLEMENTARY FASTING, FAITH & LIBRARY ACCESS
           ======================================================== */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {onOpenFasting && (
            <button
              type="button"
              onClick={onOpenFasting}
              className="p-2.5 rounded-xl bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-purple-500/30 shadow-xs flex flex-col items-center text-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/70 border border-purple-300/80 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight truncate">Le Jeûne</h4>
                <p className="text-[9px] text-purple-700 dark:text-purple-200/70 truncate">Imsak & Iftar</p>
              </div>
            </button>
          )}

          {onOpenFaith && (
            <button
              type="button"
              onClick={onOpenFaith}
              className="p-2.5 rounded-xl bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-rose-500/30 shadow-xs flex flex-col items-center text-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/70 border border-rose-300/80 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight truncate">La Foi</h4>
                <p className="text-[9px] text-rose-700 dark:text-rose-200/70 truncate">Paradis & Enfer</p>
              </div>
            </button>
          )}

          {onOpenLibrary && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="p-2.5 rounded-xl bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs flex flex-col items-center text-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Library className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight truncate">Livres</h4>
                <p className="text-[9px] text-emerald-700 dark:text-emerald-200/70 truncate">6 Ouvrages</p>
              </div>
            </button>
          )}
        </div>

        {/* ========================================================
            14. SUIVI HEBDOMADAIRE (Weekly Constance Tracker)
           ======================================================== */}
        <div className="bg-white dark:bg-[#193226] rounded-2xl p-4 border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white">Constance de la Semaine</h4>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 px-2 py-0.5 rounded-full">
              {completedCount >= 5 ? 'Objectif atteint !' : `${completedCount}/5 aujourd’hui`}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 pt-1">
            {weekDaysData.map((item) => {
              const hasCompleted = item.count > 0;
              const isPerfect = item.count === 5;
              return (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-full h-8 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                      item.isToday
                        ? 'bg-emerald-600 dark:bg-emerald-700 text-white ring-2 ring-emerald-400 shadow-2xs'
                        : item.isPast
                        ? isPerfect
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/30'
                          : hasCompleted
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/30'
                          : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-emerald-500/10'
                        : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-400 dark:text-neutral-500 border border-neutral-200/60 dark:border-emerald-500/10'
                    }`}
                    title={item.isToday ? 'Aujourd’hui' : item.dateStr}
                  >
                    {item.isFuture ? '-' : `${item.count}/5`}
                  </div>
                  <span className={`text-[9px] font-medium ${item.isToday ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-neutral-600 dark:text-emerald-200/60'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {onOpenCalendar && (
            <button
              type="button"
              onClick={onOpenCalendar}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/50 text-neutral-800 dark:text-emerald-200 text-xs font-bold border border-neutral-200 dark:border-emerald-700/40 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Voir le Graphique & Calendrier Mensuel Complet</span>
            </button>
          )}
        </div>

        {/* ========================================================
            15. FOOTER DU BAS & CLÔTURE SPIRITUELLE
           ======================================================== */}
        <div className="pt-2 pb-2 text-center space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#193226] text-neutral-900 dark:text-white border border-neutral-200/90 dark:border-emerald-500/25 shadow-xs text-center space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/5 dark:bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-300" />
              <span>Clôture Spirituelle</span>
            </div>
            <p className="font-arabic text-base text-amber-800 dark:text-amber-200 font-bold leading-relaxed">
              رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ
            </p>
            <p className="text-xs text-neutral-700 dark:text-neutral-200 italic font-medium">
              « Seigneur, accepte cela de notre part. Car c’est Toi l’Audient, l’Omniscient. »
            </p>
            <div className="pt-1.5 border-t border-neutral-100 dark:border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300/80 font-medium">
              <span>{liveHijriDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {selectedCity.name}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#193226] border border-neutral-200/90 dark:border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-200 hover:text-emerald-950 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#1E3B2E] active:scale-95 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
              <span>Remonter en haut</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 dark:text-emerald-200/60 font-medium">
            <span>Le Sanctuaire</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Heart className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 fill-current" />
              Votre sanctuaire spirituel quotidien
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================
          SIDE DRAWER (Menu Hamburger Mobile)
         ======================================================== */}
      {isSideDrawerOpen && (
        <div
          onClick={() => setIsSideDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[280px] bg-white dark:bg-[#14261C] border-r border-neutral-200 dark:border-emerald-500/25 h-full p-5 shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-200 text-neutral-900 dark:text-neutral-100"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-emerald-800/40">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/images/sanctuaire_logo.jpg"
                    alt="Sanctuaire"
                    className="w-8 h-8 rounded-xl object-cover shadow-xs border border-neutral-200 dark:border-emerald-500/30"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white leading-tight">Le Sanctuaire</h3>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80">Application Islamique</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSideDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 flex items-center justify-center text-neutral-700 dark:text-emerald-300 hover:text-neutral-950 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    onOpenQuran();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-[#193226] hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Le Saint Coran (114 Sourates)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    onOpenPrayerGuide();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-blue-50 dark:hover:bg-[#193226] hover:text-blue-700 dark:hover:text-blue-200 transition-colors cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Guide de la Prière (10 Chapitres)</span>
                </button>

                {onOpenCalendar && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSideDrawerOpen(false);
                      onOpenCalendar();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-[#193226] hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Calendrier & Suivi Mensuel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    onOpenQibla();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-amber-50 dark:hover:bg-[#193226] hover:text-amber-700 dark:hover:text-amber-200 transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Boussole Qibla</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    onOpenDhikr();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-emerald-50 dark:hover:bg-[#193226] hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Tasbih & Dhikr Électronique</span>
                </button>

                {onOpenFasting && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSideDrawerOpen(false);
                      onOpenFasting();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-purple-50 dark:hover:bg-[#193226] hover:text-purple-700 dark:hover:text-purple-200 transition-colors cursor-pointer"
                  >
                    <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Le Jeûne & Ramadan</span>
                  </button>
                )}

                {onOpenFaith && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSideDrawerOpen(false);
                      onOpenFaith();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-rose-50 dark:hover:bg-[#193226] hover:text-rose-700 dark:hover:text-rose-200 transition-colors cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Les Piliers de la Foi</span>
                  </button>
                )}

                {onOpenLibrary && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSideDrawerOpen(false);
                      onOpenLibrary();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-teal-50 dark:hover:bg-[#193226] hover:text-teal-700 dark:hover:text-teal-200 transition-colors cursor-pointer"
                  >
                    <Library className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Bibliothèque (6 Ouvrages)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    onOpenPrayerSettings();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#193226] transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  <span>Réglages des Horaires</span>
                </button>
              </div>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="pt-3 border-t border-neutral-200 dark:border-emerald-800/40 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsSideDrawerOpen(false);
                  onGoToLanding();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#193226] font-bold cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Page Vitrine (Landing)</span>
              </button>

              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se Déconnecter</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSideDrawerOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Connexion / Inscription</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CITY SELECTION MODAL
         ======================================================== */}
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={onCityChange}
        cities={cities}
      />

    </div>
  );
};
