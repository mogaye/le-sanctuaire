import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  BookOpen,
  CheckCircle2,
  Circle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  LogOut,
  MapPin,
  Sparkles,
  ChevronRight,
  Calendar,
  Flame,
  RotateCcw,
  SlidersHorizontal,
  Bookmark,
  ExternalLink,
  ChevronDown,
  Info,
  Clock,
  Sunrise,
  Sun,
  SunMedium,
  Sunset,
  Moon,
  Check,
  Quote,
  Star,
  Heart,
  Library,
  LogIn,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpiritualVerseTimer } from '../hooks/useSpiritualVerseTimer';
import { getAyahAudioUrl, getSurahAudioUrl, formatAudioSeconds } from '../utils/quranAudioUtils';
import { CityData, Method, Reciter, PrayerTime, UserProfile } from '../types';
import { CITIES, METHODS, RECITERS, PRAYERS } from '../data/islamicData';
import { PrayerTimeSettingsModal, PrayerOffsets, adjustTime } from './PrayerTimeSettingsModal';
import { CitySelectorModal } from './CitySelectorModal';
import { FooterSection } from './FooterSection';
import { MobileHomeScreen } from './MobileHomeScreen';
import {
  calculatePrayerSchedule,
  formatDateFrench,
  formatTimeDigits,
  getCityCurrentDate,
  getFormattedHijriDate,
  PrayerKey,
} from '../utils/timeUtils';
import {
  getPrayerLog,
  setPrayerLog,
  togglePrayerInLog,
  formatDateKey,
  logToKeyMap,
} from '../utils/prayerTrackerUtils';
import { getDailyHadith, getDailyReflection } from '../utils/dailyRenewal';

import fajrImg from '../assets/images/prayer_fajr_1789521106165.jpg';
import zuhrImg from '../assets/images/prayer_zuhr_1789521119005.jpg';
import asrImg from '../assets/images/prayer_asr_1789521131347.jpg';
import maghribImg from '../assets/images/prayer_maghrib_1789521142992.jpg';
import ishaImg from '../assets/images/prayer_isha_1789521158869.jpg';

interface HomePageProps {
  currentUser?: UserProfile | null;
  onLogout: () => void;
  onGoToLanding: () => void;
  onOpenAuth?: () => void;
  selectedCity: CityData;
  onSelectCity: (city: CityData) => void;
  selectedMethod: Method;
  onSelectMethod: (method: Method) => void;
  selectedReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  onOpenPrayerGuide: (prayerKey?: 'F' | 'D' | 'A' | 'M' | 'I') => void;
  onOpenQuran: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
  onOpenFasting?: () => void;
  onOpenFaith?: () => void;
  onOpenLibrary?: (bookId?: string) => void;
  onOpenDonations?: () => void;
  onOpenCalendar?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  onLogout,
  onGoToLanding,
  onOpenAuth,
  selectedCity,
  onSelectCity,
  selectedMethod,
  onSelectMethod,
  selectedReciter,
  onSelectReciter,
  onOpenPrayerGuide,
  onOpenQuran,
  onOpenQibla,
  onOpenDhikr,
  onOpenFasting,
  onOpenFaith,
  onOpenLibrary,
  onOpenDonations,
  onOpenCalendar,
  isDarkMode = true,
  onToggleDarkMode,
}) => {
  // Daily renewed Hadith & Reflection based on day of year
  const dailyHadith = getDailyHadith();
  const dailyReflection = getDailyReflection();

  // Rotating Spiritual Verse that updates randomly every 1 minute
  const { currentVerse, nextRandomVerse } = useSpiritualVerseTimer(60000, 0);

  // Prayer completion status loaded strictly from persistent real daily storage
  const [completedPrayers, setCompletedPrayers] = useState<Record<string, boolean>>(() => {
    const todayStr = formatDateKey(new Date());
    const log = getPrayerLog(todayStr);
    return logToKeyMap(log);
  });

  // Active Tasbih Dhikr State
  const dhikrOptions = [
    { label: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Gloire à Allah', target: 33 },
    { label: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'Louange à Allah', target: 33 },
    { label: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah est le Plus Grand', target: 34 },
    { label: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'Je demande pardon à Allah', target: 100 },
  ];
  const [selectedDhikrIndex, setSelectedDhikrIndex] = useState(0);
  const [tasbihCount, setTasbihCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_tasbih_count');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [isTasbihRippling, setIsTasbihRippling] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('sanctuaire_tasbih_count', String(tasbihCount));
    } catch {
      // ignore
    }
  }, [tasbihCount]);

  // Audio recitation playback preview for Quran bookmark (Sourate 18 Al-Kahf, Verset 19)
  const [isPlayingQuran, setIsPlayingQuran] = useState(false);
  const [quranAudioCurrentTime, setQuranAudioCurrentTime] = useState(0);
  const [quranAudioDuration, setQuranAudioDuration] = useState(0);
  const [isQuranAudioLoading, setIsQuranAudioLoading] = useState(false);
  const [quranAudioError, setQuranAudioError] = useState<string | null>(null);
  const quranAudioRef = useRef<HTMLAudioElement | null>(null);

  // Toggle play/pause for Quran verse 18:19 with the chosen reciter
  const togglePlayQuranAudio = () => {
    setQuranAudioError(null);

    // If currently playing, pause it
    if (isPlayingQuran && quranAudioRef.current) {
      quranAudioRef.current.pause();
      setIsPlayingQuran(false);
      return;
    }

    // If paused and audio already exists, resume
    if (quranAudioRef.current && quranAudioRef.current.src && !quranAudioRef.current.ended) {
      quranAudioRef.current
        .play()
        .then(() => setIsPlayingQuran(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsPlayingQuran(false);
          setQuranAudioError("Impossible de lancer la lecture audio");
        });
      return;
    }

    // Otherwise instantiate new Audio with chosen reciter
    if (quranAudioRef.current) {
      quranAudioRef.current.pause();
      quranAudioRef.current = null;
    }

    setIsQuranAudioLoading(true);
    const audioUrl = getAyahAudioUrl(18, 19, selectedReciter.id);
    const audio = new Audio(audioUrl);
    quranAudioRef.current = audio;

    audio.onloadedmetadata = () => {
      setQuranAudioDuration(audio.duration || 0);
      setIsQuranAudioLoading(false);
    };

    audio.ontimeupdate = () => {
      setQuranAudioCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setQuranAudioDuration(audio.duration);
      }
    };

    audio.onended = () => {
      setIsPlayingQuran(false);
      setQuranAudioCurrentTime(0);
    };

    audio.onerror = () => {
      setIsQuranAudioLoading(false);
      setIsPlayingQuran(false);
      // Fallback to generic Mishary URL if reciter failed
      if (audio.src !== getAyahAudioUrl(18, 19, 'mishary')) {
        audio.src = getAyahAudioUrl(18, 19, 'mishary');
        audio.play().catch(() => {
          setQuranAudioError("Récitation temporairement indisponible");
        });
      } else {
        setQuranAudioError("Erreur de connexion audio");
      }
    };

    audio
      .play()
      .then(() => {
        setIsPlayingQuran(true);
        setIsQuranAudioLoading(false);
      })
      .catch((err) => {
        console.warn('Playback error:', err);
        setIsQuranAudioLoading(false);
        setIsPlayingQuran(false);
        setQuranAudioError("Veuillez autoriser la lecture");
      });
  };

  // Change audio when reciter changes
  useEffect(() => {
    if (isPlayingQuran && quranAudioRef.current) {
      quranAudioRef.current.pause();
      const audioUrl = getAyahAudioUrl(18, 19, selectedReciter.id);
      const audio = new Audio(audioUrl);
      quranAudioRef.current = audio;
      audio.currentTime = 0;
      audio.ontimeupdate = () => setQuranAudioCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setQuranAudioDuration(audio.duration || 0);
      audio.onended = () => {
        setIsPlayingQuran(false);
        setQuranAudioCurrentTime(0);
      };
      audio.play().catch(() => setIsPlayingQuran(false));
    }
  }, [selectedReciter.id]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (quranAudioRef.current) {
        quranAudioRef.current.pause();
        quranAudioRef.current = null;
      }
    };
  }, []);

  // Seek audio position when clicking on progress bar
  const handleSeekProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!quranAudioRef.current || !quranAudioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * quranAudioDuration;
    quranAudioRef.current.currentTime = targetTime;
    setQuranAudioCurrentTime(targetTime);
  };

  // Dropdown states
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Prayer time adjustments & juristic school
  const [prayerOffsets, setPrayerOffsets] = useState<PrayerOffsets>(() => {
    try {
      const saved = localStorage.getItem('prayer_offsets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return { F: 0, D: 0, A: 0, M: 0, I: 0 };
  });

  const [asrMethod, setAsrMethod] = useState<'standard' | 'hanafi'>(() => {
    try {
      const saved = localStorage.getItem('asr_method');
      if (saved === 'hanafi') return 'hanafi';
    } catch (e) {
      // ignore
    }
    return 'standard';
  });

  const [isPrayerSettingsOpen, setIsPrayerSettingsOpen] = useState(false);

  const handleSavePrayerOffsets = (newOffsets: PrayerOffsets, newAsrMethod: 'standard' | 'hanafi') => {
    setPrayerOffsets(newOffsets);
    setAsrMethod(newAsrMethod);
    try {
      localStorage.setItem('prayer_offsets', JSON.stringify(newOffsets));
      localStorage.setItem('asr_method', newAsrMethod);
    } catch (e) {
      // ignore
    }
  };

  // Live ticking clock & time mode (city local vs device local)
  const [timeMode, setTimeMode] = useState<'city' | 'device'>(() => {
    try {
      return (localStorage.getItem('time_mode') as 'city' | 'device') || 'city';
    } catch {
      return 'city';
    }
  });

  const [now, setNow] = useState<Date>(() => {
    return timeMode === 'city'
      ? getCityCurrentDate(selectedCity.timezone)
      : new Date();
  });

  // Ticking effect: updates every second (1000ms)
  useEffect(() => {
    const tick = () => {
      if (timeMode === 'city') {
        setNow(getCityCurrentDate(selectedCity.timezone));
      } else {
        setNow(new Date());
      }
    };
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [selectedCity.timezone, timeMode]);

  const toggleTimeMode = () => {
    const nextMode = timeMode === 'city' ? 'device' : 'city';
    setTimeMode(nextMode);
    try {
      localStorage.setItem('time_mode', nextMode);
    } catch {
      // ignore
    }
  };

  // Effective adjusted prayer times
  const effectivePrayerTimes: Record<PrayerKey, string> = {
    F: adjustTime(selectedCity.prayers.F, prayerOffsets.F),
    D: adjustTime(selectedCity.prayers.D, prayerOffsets.D),
    A: adjustTime(selectedCity.prayers.A, prayerOffsets.A + (asrMethod === 'hanafi' ? 45 : 0)),
    M: adjustTime(selectedCity.prayers.M, prayerOffsets.M),
    I: adjustTime(selectedCity.prayers.I, prayerOffsets.I),
  };

  // Dynamically calculate prayer schedule, countdown, and active prayer
  const schedule = calculatePrayerSchedule(effectivePrayerTimes, now);
  const liveClockString = formatTimeDigits(now, true);
  const liveHijriDate = getFormattedHijriDate(now);
  const liveGregorianDate = formatDateFrench(now);

  // Prayer display names and arabic text
  const prayerKeys: Array<PrayerKey> = ['F', 'D', 'A', 'M', 'I'];
  const prayerNames: Record<PrayerKey, string> = {
    F: 'Fajr',
    D: 'Dhuhr',
    A: 'Asr',
    M: 'Maghrib',
    I: 'Isha',
  };
  const prayerArabic: Record<PrayerKey, string> = {
    F: 'الفجر',
    D: 'الظهر',
    A: 'العصر',
    M: 'المغرب',
    I: 'العشاء',
  };

  const togglePrayer = (key: string) => {
    const todayStr = formatDateKey(new Date());
    const updated = togglePrayerInLog(todayStr, key as PrayerKey);
    setCompletedPrayers(logToKeyMap(updated));
  };

  const handleTasbihClick = () => {
    setIsTasbihRippling(true);
    setTimeout(() => setIsTasbihRippling(false), 200);
    setTasbihCount((prev) => {
      const currentTarget = dhikrOptions[selectedDhikrIndex].target;
      if (prev + 1 >= currentTarget) {
        return currentTarget;
      }
      return prev + 1;
    });
  };

  const resetTasbih = () => {
    setTasbihCount(0);
  };

  const completedCount = Object.values(completedPrayers).filter(Boolean).length;

  return (
    <div className="min-h-screen w-full bg-[#F4F7F5] dark:bg-[#14261C] text-neutral-900 dark:text-neutral-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-600 selection:text-white transition-colors duration-200 pb-14 md:pb-0">
      
      {/* ============================================================
          1. MOBILE HOMESCREEN (VISIBLE ONLY ON MOBILE < 768px)
          Exact replica of the clean, modern native mobile design
         ============================================================ */}
      <div className="md:hidden">
        <MobileHomeScreen
          currentUser={
            currentUser
              ? {
                  name: currentUser.name,
                  firstName: currentUser.firstName,
                  lastName: currentUser.lastName,
                  email: currentUser.email,
                }
              : null
          }
          selectedCity={selectedCity}
          cities={CITIES}
          onCityChange={(city) => onSelectCity(city)}
          liveClockString={liveClockString}
          liveGregorianDate={liveGregorianDate}
          liveHijriDate={liveHijriDate}
          nextPrayer={{
            name: prayerNames[schedule.nextPrayerKey],
            arabicName: prayerArabic[schedule.nextPrayerKey],
            time: schedule.nextPrayerTime,
            remainingStr: schedule.countdownFormatted,
          }}
          todayPrayers={prayerKeys.map((k) => ({
            key: k,
            name: prayerNames[k],
            arabicName: prayerArabic[k],
            time: effectivePrayerTimes[k],
            isNext: k === schedule.nextPrayerKey,
            isCompleted: !!completedPrayers[k],
          }))}
          onTogglePrayer={(k) => togglePrayer(k)}
          currentVerse={currentVerse}
          onNextVerse={nextRandomVerse}
          onOpenQuran={onOpenQuran}
          onOpenPrayerGuide={() => onOpenPrayerGuide(schedule.nextPrayerKey)}
          onOpenQibla={onOpenQibla}
          onOpenDhikr={onOpenDhikr}
          onOpenCalendar={onOpenCalendar}
          onOpenFasting={onOpenFasting}
          onOpenFaith={onOpenFaith}
          onOpenLibrary={onOpenLibrary}
          onOpenPrayerSettings={() => setIsPrayerSettingsOpen(true)}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          onGoToLanding={onGoToLanding}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      </div>

      {/* ============================================================
          2. DESKTOP SANCTUARY (VISIBLE ONLY ON DESKTOP >= 768px)
         ============================================================ */}
      <div className="hidden md:flex flex-col min-h-screen justify-between">

      {/* ============================================================
          TOP AUTHENTICATED HEADER / SANCTUARY BAR
         ============================================================ */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#162D20]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-emerald-900/40 px-4 sm:px-8 py-3.5 flex items-center justify-between text-neutral-900 dark:text-white transition-colors">
        
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3">
          <img
            src="/images/sanctuaire_logo.jpg"
            alt="Logo Le Sanctuaire"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-xl object-cover ring-1 ring-emerald-500/40 shadow-sm"
          />
          <div>
            <span className="font-bold text-sm sm:text-base tracking-tight text-neutral-900 dark:text-white block leading-tight">
              Le Sanctuaire
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-medium block">
              Sanctuaire Spirituel Quotidien
            </span>
          </div>
        </div>

        {/* Mobile Compact City & Clock Pill */}
        <div className="md:hidden relative">
          <button
            type="button"
            onClick={() => setShowCityMenu(!showCityMenu)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neutral-100 dark:bg-[#193226] text-xs font-semibold text-neutral-800 dark:text-emerald-100 border border-neutral-200 dark:border-emerald-500/30 active:scale-95 transition-transform cursor-pointer"
          >
            <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="max-w-[75px] truncate">{selectedCity.name}</span>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-200 font-mono font-bold bg-neutral-200 dark:bg-[#14281E] px-1 py-0.5 rounded">
              {liveClockString}
            </span>
          </button>
        </div>

        {/* Center: City Selector, Live Clock & Hijri Pill (Responsive layout for tablet md & desktop lg) */}
        <div className="hidden md:flex items-center gap-2">
          {/* City Selector Button */}
          <button
            onClick={() => setShowCityMenu(true)}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#193226] dark:hover:bg-[#1E3B2E] border border-neutral-200 dark:border-emerald-500/30 text-xs font-medium text-neutral-800 dark:text-emerald-100 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden xl:inline">{selectedCity.name}, {selectedCity.country}</span>
            <span className="xl:hidden">{selectedCity.name}</span>
            {selectedCity.utcOffset && (
              <span className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-neutral-300 dark:border-emerald-500/30">
                {selectedCity.utcOffset}
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-neutral-500 dark:text-emerald-300/70 shrink-0" />
          </button>

          {/* Live Clock Button with Timezone indicator */}
          <button
            onClick={toggleTimeMode}
            title={`Cliquez pour basculer le mode horaire (actuellement : ${timeMode === 'city' ? `Heure de ${selectedCity.name}` : 'Heure de votre appareil'})`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#193226] dark:hover:bg-[#1E3B2E] border border-neutral-200 dark:border-emerald-500/30 text-xs text-neutral-800 dark:text-emerald-100 font-medium shadow-2xs transition-colors cursor-pointer group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="font-mono font-bold tracking-tight text-neutral-900 dark:text-white">{liveClockString}</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300/70 font-sans hidden lg:inline">
              {timeMode === 'city' ? selectedCity.name : 'Local'}
            </span>
          </button>

          {/* Hijri date badge (Visible on desktop & tablet landscape >= 1024px) */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 font-medium shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{liveHijriDate}</span>
          </div>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick link to Landing Page */}
          <button
            onClick={onGoToLanding}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 border border-neutral-300/80 dark:border-white/15 text-xs font-semibold text-neutral-800 dark:text-white shadow-2xs transition-all cursor-pointer"
            title="Consulter la vitrine publique"
          >
            <span>Landing Page</span>
            <ExternalLink className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-emerald-800/80 hover:bg-emerald-700/80 text-white text-xs font-medium shadow-sm transition-all cursor-pointer border border-emerald-500/30"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center">
                  {(currentUser.firstName || currentUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate">{currentUser.firstName || currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-emerald-200/70" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth || onGoToLanding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-800/80 hover:bg-emerald-700/80 text-white text-xs font-medium shadow-sm transition-all cursor-pointer border border-emerald-500/30"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-300" />
                <span>Connexion</span>
              </button>
            )}

            {showUserMenu && currentUser && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-[#193226] rounded-2xl shadow-2xl border border-emerald-500/30 p-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-emerald-800/40">
                  <div className="text-xs font-bold text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-200/70 truncate">{currentUser.email}</div>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      onOpenQuran();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-100 hover:bg-[#204030] text-left font-medium cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ouvrir le Saint Coran</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenPrayerGuide();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-100 hover:bg-[#204030] text-left font-medium cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guide des 5 Prières</span>
                  </button>
                  {onOpenFasting && (
                    <button
                      onClick={() => {
                        onOpenFasting();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-200 bg-purple-950/40 hover:bg-purple-900/50 text-left font-semibold cursor-pointer border border-purple-800/30"
                    >
                      <Moon className="w-3.5 h-3.5 text-purple-400" />
                      <span>Le Jeûne & Ramadan</span>
                    </button>
                  )}
                  {onOpenFaith && (
                    <button
                      onClick={() => {
                        onOpenFaith();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 text-left font-semibold cursor-pointer border border-amber-800/30"
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>La Foi & L'Au-Delà</span>
                    </button>
                  )}
                  {onOpenLibrary && (
                    <button
                      onClick={() => {
                        onOpenLibrary();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/60 text-left font-semibold cursor-pointer border border-emerald-700/30"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bibliothèque (6 Livres)</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsPrayerSettingsOpen(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/50 text-left font-semibold cursor-pointer border border-emerald-500/30"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ajuster les Heures de Prière</span>
                  </button>
                  <button
                    onClick={() => {
                      onGoToLanding();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-100 hover:bg-[#204030] text-left font-medium cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Voir la Landing Page</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-emerald-800/40">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-950/40 text-left font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Se Déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* ============================================================
          MAIN DASHBOARD BODY
         ============================================================ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 md:pl-20 lg:pl-24 xl:px-8 pt-6 sm:pt-8 space-y-6">
        
        {/* ========================================================
            HERO GREETING & SPIRITUAL STATUS CARD (WARM, LUMINOUS & WELCOMING)
           ======================================================== */}
        <section
          className="relative rounded-[36px] p-6 sm:p-9 text-white overflow-hidden shadow-[0_20px_60px_rgba(10,25,16,0.45)] border border-[#2B6040]/70 transition-all"
          style={{
            background:
              'radial-gradient(120% 120% at 15% 10%, #173E28 0%, #102B1D 45%, #0A1B12 100%)',
          }}
        >
          {/* Multi-layered Warm & Luminous Ambient Glows */}
          <div className="absolute -top-24 -left-16 w-96 h-96 bg-amber-400/15 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[480px] h-[340px] bg-emerald-400/20 rounded-full blur-[110px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-16 w-[420px] h-[420px] bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />

          {/* Sacred Geometry Watermark Overlay */}
          <div className="absolute -right-16 -bottom-16 w-96 h-96 pointer-events-none opacity-15">
            <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-300" fill="none" stroke="currentColor">
              <circle cx="100" cy="100" r="90" strokeWidth="0.8" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="70" strokeWidth="0.8" />
              <circle cx="100" cy="100" r="50" strokeWidth="0.6" />
              <rect x="30" y="30" width="140" height="140" strokeWidth="0.8" transform="rotate(45 100 100)" />
              <rect x="30" y="30" width="140" height="140" strokeWidth="0.8" />
              <circle cx="100" cy="100" r="30" strokeWidth="0.8" />
            </svg>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
            
            {/* Left column: Salutation, Warm Welcome & Quote */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Top status bar with glowing badge & live time */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-[11px] font-semibold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.25)] backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Sanctuaire Spirituel Quotidien</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] text-emerald-100 backdrop-blur-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  </span>
                  <span className="font-mono font-bold tracking-wider text-white">{liveClockString}</span>
                  <span className="text-emerald-300/80">• {selectedCity.name}</span>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-emerald-200/90 backdrop-blur-xs">
                  <Calendar className="w-3 h-3 text-emerald-300" />
                  <span>{liveGregorianDate}</span>
                </div>
              </div>

              {/* Personalized Warm Greeting */}
              <div className="flex items-start gap-3.5 sm:gap-4">
                {/* Monogram Avatar with warm glowing halo */}
                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#1C4E33] to-[#0D2417] border border-amber-300/40 shadow-[0_0_20px_rgba(245,158,11,0.25),inset_0_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center text-amber-100 font-bold text-base sm:text-lg tracking-wider">
                  {currentUser
                    ? (
                        currentUser.firstName
                          ? `${currentUser.firstName.charAt(0)}${currentUser.lastName ? currentUser.lastName.charAt(0) : ''}`
                          : currentUser.name.slice(0, 2)
                      ).toUpperCase()
                    : 'LS'}
                </div>

                <div className="space-y-1 flex-1">
                  <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-white leading-tight">
                    Assalamu Alaykum,{' '}
                    <span className="font-extrabold bg-gradient-to-r from-amber-100 via-emerald-100 to-teal-100 bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(52,211,153,0.45)]">
                      {currentUser ? (currentUser.firstName || (currentUser.name ? currentUser.name.split(' ')[0] : 'Cher Croyant')) : 'Cher Croyant'}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-200/90 font-medium flex items-center gap-1.5">
                    <span>Qu'Allah illumine votre journée de sérénité, de foi et de paix.</span>
                  </p>
                </div>
              </div>

              {/* Enhanced Spiritual Verse Card with Warm Quotes - Rotates every 1 minute */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-start gap-3 relative overflow-hidden group">
                <Quote className="w-5 h-5 text-amber-300/80 shrink-0 mt-0.5 rotate-180" />
                <div className="flex-1 min-w-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentVerse.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="space-y-1"
                    >
                      <p className="text-xs sm:text-[13px] text-neutral-100 font-normal leading-relaxed italic">
                        {currentVerse.french}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-[11px] font-semibold text-amber-200/90 tracking-wide">
                          {currentVerse.reference}
                        </span>
                        <span className="text-neutral-400 text-xs">•</span>
                        <span className="text-[11px] text-emerald-300/80 font-serif">
                          {currentVerse.arabicSurahName}
                        </span>
                        <span className="text-neutral-400 text-xs">•</span>
                        <span className="text-[10px] text-emerald-200/70 flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          change chaque minute
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bouton pour changer de verset immédiatement à la demande */}
                <button
                  onClick={nextRandomVerse}
                  title="Changer de verset maintenant"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 hover:text-white shrink-0 self-start cursor-pointer active:scale-95"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>

              {/* Progress summary streak pill & Completed prayers with glowing warmth */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-orange-500/10 backdrop-blur-md border border-amber-400/35 text-xs text-white shadow-[0_0_16px_rgba(245,158,11,0.2)]">
                  <Flame className="w-4 h-4 text-amber-300 fill-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
                  <span>Assiduité : <strong className="text-amber-200 font-bold">7 jours consécutifs</strong></span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 backdrop-blur-md border border-emerald-400/35 text-xs text-white shadow-[0_0_16px_rgba(16,185,129,0.2)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.8)]" />
                  <span>Prières aujourd'hui : <strong className="text-emerald-200 font-bold">{completedCount} / 5</strong></span>
                </div>
              </div>
            </div>

            {/* Right column: Next Prayer Banner with live countdown & Modern Glass Glow */}
            <div className="lg:col-span-5 bg-gradient-to-br from-white/[0.13] via-white/[0.07] to-white/[0.03] backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] space-y-3.5">
              
              {/* Header: Next Prayer + Live indicator + City */}
              <div className="flex items-center justify-between text-xs text-emerald-200 font-medium">
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                  </span>
                  <span className="text-white font-semibold tracking-wide">Prochaine Prière</span>
                </span>
                
                <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-400/40 text-emerald-200 shadow-2xs font-medium">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{selectedCity.name}</span>
                  <span className="text-neutral-400">•</span>
                  <span className="font-mono font-bold text-white">{liveClockString}</span>
                </span>
              </div>

              {/* Adhan alert banner if prayer time is now */}
              {schedule.isPrayerTimeNow && (
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-300/40 text-amber-200 text-xs font-bold flex items-center justify-between animate-pulse">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>C'est l'heure de la prière de {prayerNames[schedule.currentPrayerKey]} !</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider bg-amber-400/30 px-2 py-0.5 rounded-full">
                    Adhan
                  </span>
                </div>
              )}

              {/* Prayer Name & Time */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-2">
                    <span>{prayerNames[schedule.nextPrayerKey]}</span>
                    <span className="text-xl sm:text-2xl font-light text-emerald-300/90 font-serif">
                      ({prayerArabic[schedule.nextPrayerKey]})
                    </span>
                  </div>
                  <div className="text-xs text-neutral-300 mt-1 flex items-center gap-1.5">
                    <span>Heure prévue :</span>
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 font-mono font-bold text-white text-xs shadow-2xs">
                      {schedule.nextPrayerTime}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-200/80 font-medium">
                    Temps restant
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-emerald-200 via-teal-100 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(52,211,153,0.5)] font-mono">
                    {schedule.countdownFormatted}
                  </div>
                </div>
              </div>

              {/* Glowing progress bar to next prayer */}
              <div className="space-y-1">
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 h-full rounded-full shadow-[0_0_14px_rgba(52,211,153,0.8)] transition-all duration-1000 ease-linear"
                    style={{ width: `${Math.max(4, schedule.progressPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-300 font-mono px-0.5">
                  <span>{prayerNames[schedule.prevPrayerKey]} ({schedule.prevPrayerTime})</span>
                  <span className="text-emerald-300 font-semibold">{schedule.progressPercent}% écoulé</span>
                  <span>{prayerNames[schedule.nextPrayerKey]} ({schedule.nextPrayerTime})</span>
                </div>
              </div>

              {/* Interactive Footer Controls */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenPrayerGuide(schedule.nextPrayerKey)}
                  className="text-xs font-semibold text-white hover:text-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Guide {prayerNames[schedule.nextPrayerKey]}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setIsPrayerSettingsOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-emerald-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Ajuster les heures de prière"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-emerald-300" />
                    <span>Ajuster</span>
                  </button>

                  <button
                    onClick={() => onOpenQibla()}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs font-semibold text-emerald-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)] active:scale-95"
                  >
                    <Compass className="w-3 h-3 text-emerald-300" />
                    <span>Qibla ({selectedCity.qiblaAngle}°)</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================
            DAILY PRAYER TRACKER (MODÈLE CYCLES CÉLESTES DES 5 PRIÈRES)
           ======================================================== */}
        <section className="bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl rounded-[32px] p-5 sm:p-7 lg:p-8 border border-neutral-200/90 dark:border-emerald-500/25 shadow-md dark:shadow-xl space-y-6 text-neutral-900 dark:text-neutral-100">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-emerald-800/40 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-neutral-900 dark:text-white">
                  Cycle Céleste des 5 Prières
                </h2>
                <span className="text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300/80 dark:border-emerald-500/30">
                  {selectedCity.name}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-emerald-200/80 mt-0.5">
                Le parcours sacré du soleil à travers la journée. Cochez chaque prière accomplie.
              </p>
              <p className="sm:hidden text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 mt-1">
                <span>← Glisser pour parcourir les 5 prières →</span>
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {onOpenCalendar && (
                <button
                  type="button"
                  onClick={onOpenCalendar}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                  title="Consulter le Calendrier mensuel & Graphique d'assiduité"
                >
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span>Calendrier & Suivi Mensuel</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPrayerSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-[#1E3B2E] border border-neutral-200 dark:border-emerald-500/30 text-xs font-semibold text-neutral-800 dark:text-emerald-200 shadow-2xs transition-all cursor-pointer"
                title="Ajuster manuellement les heures de prière"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Ajuster les Heures</span>
              </button>

              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-3.5 py-1.5 rounded-full border border-emerald-300/80 dark:border-emerald-500/30 shadow-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{completedCount} / 5 accomplies</span>
              </span>
            </div>
          </div>

          {/* 5 Vertical Panoramic Cards (Exact Replica of Model 2 - Swipeable on mobile, Grid on desktop) */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-1 overflow-x-auto sm:overflow-visible no-scrollbar pb-2 sm:pb-0 snap-x items-stretch">
            {[
              {
                key: 'F' as const,
                number: '01',
                name: 'FAJR',
                arabic: 'الفجر',
                desc: 'Aube naissante, avant le lever',
                frenchDesc: 'Aube & Première lueur',
                badgeBg: 'bg-[#153426]',
                badgeText: 'text-white',
                titleColor: 'text-[#153426]',
                iconBg: 'bg-[#153426]',
                image: fajrImg,
                icon: Sunrise,
                alt: 'Fajr dawn sky and sunrise over mountains',
              },
              {
                key: 'D' as const,
                number: '02',
                name: 'ZUHR',
                arabic: 'الظهر',
                desc: 'Zénith, dès que le soleil décline',
                frenchDesc: 'Zénith du soleil',
                badgeBg: 'bg-[#B07F2E]',
                badgeText: 'text-white',
                titleColor: 'text-[#B07F2E]',
                iconBg: 'bg-[#B07F2E]',
                image: zuhrImg,
                icon: Sun,
                alt: 'Zuhr bright midday sun over mountains',
              },
              {
                key: 'A' as const,
                number: '03',
                name: 'ASR',
                arabic: 'العصر',
                desc: 'Après-midi, soleil doux et doré',
                frenchDesc: 'Fin d’après-midi doré',
                badgeBg: 'bg-[#1D4A3C]',
                badgeText: 'text-white',
                titleColor: 'text-[#1D4A3C]',
                iconBg: 'bg-[#1D4A3C]',
                image: asrImg,
                icon: SunMedium,
                alt: 'Asr golden afternoon sun over mountains',
              },
              {
                key: 'M' as const,
                number: '04',
                name: 'MAGHRIB',
                arabic: 'المغرب',
                desc: 'Crépuscule au coucher du soleil',
                frenchDesc: 'Coucher flamboyant',
                badgeBg: 'bg-[#B55D28]',
                badgeText: 'text-white',
                titleColor: 'text-[#B55D28]',
                iconBg: 'bg-[#B55D28]',
                image: maghribImg,
                icon: Sunset,
                alt: 'Maghrib deep orange sunset over horizon',
              },
              {
                key: 'I' as const,
                number: '05',
                name: 'ISHA',
                arabic: 'العشاء',
                desc: 'Nuit sereine et ciel étoilé',
                frenchDesc: 'Nuit noire & Prière finale',
                badgeBg: 'bg-[#142330]',
                badgeText: 'text-white',
                titleColor: 'text-[#142330]',
                iconBg: 'bg-[#142330]',
                image: ishaImg,
                icon: Moon,
                alt: 'Isha tranquil night sky with crescent moon',
              },
            ].map((prayer) => {
              const key = prayer.key;
              const isDone = completedPrayers[key];
              const isCurrent = key === schedule.currentPrayerKey;
              const isNext = key === schedule.nextPrayerKey;
              const isPast = schedule.isPastPrayer(key);
              const extraOffset = key === 'A' && asrMethod === 'hanafi' ? 45 : 0;
              const currentOffset = prayerOffsets[key] + extraOffset;
              const time = effectivePrayerTimes[key];
              const IconComponent = prayer.icon;

              return (
                <div
                  key={key}
                  onClick={() => togglePrayer(key)}
                  className={`group relative bg-white dark:bg-[#14281E] rounded-[26px] overflow-hidden border transition-all duration-300 flex flex-col h-full cursor-pointer select-none w-[270px] sm:w-auto shrink-0 snap-center shadow-xs dark:shadow-md ${
                    isDone
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : isCurrent
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg bg-emerald-50/70 dark:bg-emerald-950/40'
                      : isNext
                      ? 'border-amber-500/80 ring-2 ring-amber-500/25 shadow-md'
                      : 'border-neutral-200/90 dark:border-emerald-500/20 hover:border-emerald-400/50 hover:shadow-md'
                  }`}
                >
                  {/* TOP SECTION: Number badge, Title & Description (Takes flex-1 to equalize all 5 cards) */}
                  <div className="p-4 sm:p-5 text-center flex-1 flex flex-col justify-between items-center bg-gradient-to-b from-emerald-50/50 to-white dark:from-[#183326] dark:to-[#14281E] relative z-10">
                    
                    {/* Status Checkbox Button (Top Right) */}
                    <button
                      type="button"
                      aria-label={`Marquer ${prayer.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePrayer(key);
                      }}
                      className="absolute top-3.5 right-3.5 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                      ) : isCurrent ? (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      ) : isNext ? (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                      ) : (
                        <Circle className="w-4 h-4 text-neutral-400 dark:text-emerald-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                      )}
                    </button>

                    {/* Top Identity Block */}
                    <div className="w-full flex flex-col items-center">
                      {/* Circular Number Badge (01, 02, 03, 04, 05) */}
                      <div
                        className={`w-8 h-8 rounded-full ${prayer.badgeBg} ${prayer.badgeText} flex items-center justify-center font-bold text-xs tracking-wider shadow-sm mb-2 border border-white/15`}
                      >
                        {prayer.number}
                      </div>

                      {/* Status Pill Badge: Fixed height container (h-6) to ensure strict vertical alignment */}
                      <div className="h-6 flex items-center justify-center mb-1.5">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/40">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>Accomplie</span>
                          </span>
                        ) : isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            <span>En cours</span>
                          </span>
                        ) : isNext ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Prochaine</span>
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                            Passée
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10">
                            À venir
                          </span>
                        )}
                      </div>

                      {/* Prayer Name (Serif Bold Display) */}
                      <h3
                        className="font-serif text-lg sm:text-xl font-extrabold tracking-[0.12em] text-neutral-900 dark:text-white leading-tight"
                      >
                        {prayer.name}
                      </h3>

                      {/* Arabic Subtitle */}
                      <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300/70 mt-0.5 leading-tight">
                        {prayer.arabic}
                      </div>

                      {/* Timing Description (Standardized 2-line height h-8 to prevent vertical displacement) */}
                      <p className="text-[11px] leading-snug text-neutral-600 dark:text-neutral-300 font-medium mt-2 h-8 flex items-center justify-center text-center px-1">
                        {prayer.desc}
                      </p>
                    </div>

                    {/* Scheduled Time Pill with manual offset indicator (Pinned to bottom of top section) */}
                    <div className="mt-3 w-full flex items-center justify-center gap-1.5 flex-nowrap h-7">
                      <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white tracking-tight bg-neutral-100 dark:bg-black/40 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-emerald-500/20 shrink-0">
                        {time}
                      </span>
                      {currentOffset !== 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                            currentOffset > 0
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                          }`}
                          title="Ajustement manuel actif"
                        >
                          {currentOffset > 0 ? `+${currentOffset}m` : `${currentOffset}m`}
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 shrink-0">
                          Faite
                        </span>
                      )}
                      {isCurrent && !isDone && (
                        <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30 shrink-0">
                          En cours
                        </span>
                      )}
                    </div>
                  </div>

                  {/* LOWER SECTION: Landscape Sun Position Artwork (Fixed shrink-0 height perfectly aligned across all 5 cards) */}
                  <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-neutral-900 shrink-0 flex items-end">
                    <img
                      src={prayer.image}
                      alt={prayer.alt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105 opacity-90"
                    />

                    {/* Subtle bottom gradient to enhance icon contrast */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

                    {/* Overlapping Celestial Badge at Bottom Center */}
                    <div className="absolute bottom-3 inset-x-0 flex justify-center z-10 pointer-events-none">
                      <div
                        className={`w-10 h-10 rounded-full ${prayer.iconBg} text-white border-2 border-emerald-400/50 shadow-lg flex items-center justify-center transition-transform group-hover:scale-110`}
                      >
                        <IconComponent className="w-5 h-5 text-white stroke-[2.2]" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Guide Trigger (Fixed shrink-0 h-10 height aligned across all 5 cards) */}
                  <div className="px-3 py-2 bg-neutral-50 dark:bg-[#12241A] border-t border-neutral-200 dark:border-emerald-900/40 flex items-center justify-between text-[11px] text-neutral-700 dark:text-neutral-300 shrink-0 h-10">
                    <span className="truncate">{prayer.frenchDesc}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPrayerGuide(key);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 font-semibold cursor-pointer shrink-0 ml-1"
                    >
                      Guide →
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </section>

        {/* ========================================================
            2-COLUMN MODULE: REPRENDRE LE CORAN & TASBIH RAPIDE
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ================= LEFT 7 COLS: REPRENDRE LE CORAN ================= */}
          <section className="lg:col-span-7 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-7 border border-neutral-200/90 dark:border-emerald-500/25 shadow-md dark:shadow-xl flex flex-col justify-between space-y-4 text-neutral-900 dark:text-neutral-100">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <Bookmark className="w-4 h-4 fill-emerald-600 dark:fill-emerald-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900 dark:text-white">
                    Reprendre Ma Lecture
                  </h3>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                    Votre marque-page personnel actif
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenQuran}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-emerald-200 hover:text-emerald-950 dark:hover:text-white bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-[#1E3B2E] border border-neutral-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <span>Ouvrir le Mushaf</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Surah Details Banner */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/25 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Sourate 18 : Al-Kahf (La Caverne)
                  </div>
                  <div className="text-[11px] text-neutral-600 dark:text-emerald-200/70">
                    Juz 15 • Verset 19 • Récitateur : {selectedReciter.name}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-200 font-serif">
                    الكهف
                  </span>
                </div>
              </div>

              {/* Excerpt verse in Arabic & French */}
              <div className="pt-2 border-t border-neutral-200 dark:border-emerald-800/40 space-y-1.5">
                <p className="text-sm sm:text-base text-right text-neutral-900 dark:text-white font-serif leading-loose font-medium">
                  فَابْعَثُوا أَحَدَكُم بِوَرِقِكُمْ هَٰذِهِ إِلَى الْمَدِينَةِ فَلْيَنظُرْ أَيُّهَا أَزْكَىٰ طَعَامًا
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 italic leading-relaxed">
                  « Envoyez donc l'un de vous avec votre monnaie que voici à la ville, afin qu'il regarde quel est le meilleur aliment... »
                </p>
              </div>

              {/* Audio progress & play trigger */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayQuranAudio}
                    disabled={isQuranAudioLoading}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform active:scale-95 shrink-0 disabled:opacity-60"
                    aria-label={isPlayingQuran ? 'Mettre en pause' : 'Écouter la récitation'}
                    title={isPlayingQuran ? 'Pause' : 'Écouter'}
                  >
                    {isQuranAudioLoading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : isPlayingQuran ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-700 dark:text-emerald-300/80 font-medium mb-1.5">
                      <span className="flex items-center gap-1.5 truncate">
                        {isPlayingQuran && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        )}
                        <span className="truncate">
                          {isQuranAudioLoading
                            ? 'Chargement audio...'
                            : isPlayingQuran
                            ? 'Récitation en cours...'
                            : 'Écouter le verset 19'}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] text-neutral-800 dark:text-emerald-200 bg-neutral-200/80 dark:bg-black/40 px-2 py-0.5 rounded-full border border-neutral-300 dark:border-emerald-500/30 shrink-0 ml-2">
                        {formatAudioSeconds(quranAudioCurrentTime)} / {formatAudioSeconds(quranAudioDuration || 0)}
                      </span>
                    </div>

                    {/* Interactive Scrubbable Progress Bar */}
                    <div
                      onClick={handleSeekProgress}
                      className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden cursor-pointer relative group/bar transition-colors"
                      title="Cliquer pour avancer ou reculer dans l'écoute"
                    >
                      <div
                        className="bg-emerald-600 dark:bg-emerald-400 group-hover/bar:bg-emerald-500 dark:group-hover/bar:bg-emerald-300 h-full rounded-full transition-all duration-150"
                        style={{
                          width: `${
                            quranAudioDuration > 0
                              ? Math.min(100, Math.max(0, (quranAudioCurrentTime / quranAudioDuration) * 100))
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {quranAudioError && (
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/30 px-2.5 py-1 rounded-lg">
                    {quranAudioError}
                  </div>
                )}
              </div>

            </div>

            {/* Quick action buttons */}
            <div className="flex items-center justify-between pt-1 text-xs text-neutral-600 dark:text-emerald-200/80">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Lecture recommandée tous les vendredis
              </span>
              <button
                onClick={onOpenQuran}
                className="font-bold underline text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white cursor-pointer"
              >
                114 Sourates disponibles →
              </button>
            </div>

          </section>

          {/* ================= RIGHT 5 COLS: COMPTEUR TASBIH RAPIDE ================= */}
          <section className="lg:col-span-5 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-7 border border-neutral-200/90 dark:border-emerald-500/25 shadow-md dark:shadow-xl flex flex-col justify-between space-y-4 text-neutral-900 dark:text-neutral-100">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-neutral-900 dark:text-white">
                  Dhikr & Tasbih Quotidien
                </h3>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                  Évocation et apaisement de l'esprit
                </p>
              </div>

              <button
                onClick={onOpenDhikr}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white underline cursor-pointer"
              >
                Bibliothèque complète
              </button>
            </div>

            {/* Selector pill for Dhikr type */}
            <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 dark:bg-[#14281E] p-1 rounded-2xl border border-neutral-200 dark:border-emerald-500/20">
              {dhikrOptions.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setSelectedDhikrIndex(idx);
                    setTasbihCount(0);
                  }}
                  className={`text-[11px] py-1.5 px-2 rounded-xl font-medium transition-all cursor-pointer truncate ${
                    selectedDhikrIndex === idx
                      ? 'bg-emerald-600 dark:bg-emerald-800 text-white shadow-2xs font-bold border border-emerald-500/40 dark:border-emerald-400/40'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Central Interactive Tasbih Circle Button */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              
              <div className="text-center">
                <div className="text-xl font-serif font-semibold text-emerald-800 dark:text-amber-200">
                  {dhikrOptions[selectedDhikrIndex].arabic}
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-emerald-200/80 italic">
                  {dhikrOptions[selectedDhikrIndex].meaning}
                </div>
              </div>

              {/* Big Clickable Circular Counter */}
              <button
                type="button"
                onClick={handleTasbihClick}
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-[#12261B] dark:to-[#1C3F2B] text-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer border-4 border-emerald-400/50 dark:border-emerald-500/30 ${
                  isTasbihRippling ? 'ring-8 ring-emerald-400/40' : ''
                }`}
              >
                <span className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {tasbihCount}
                </span>
                <span className="text-[10px] text-emerald-200 dark:text-emerald-300 uppercase tracking-wider font-semibold">
                  / {dhikrOptions[selectedDhikrIndex].target}
                </span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={resetTasbih}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser</span>
                </button>
              </div>

            </div>

          </section>

        </div>

        {/* ========================================================
            RENARRATION QUOTIDIENNE : HADITH DU JOUR & SADAQAH JARIYAH
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Hadith du Jour (Col 8) */}
          <section className="lg:col-span-8 bg-gradient-to-br from-white/95 via-amber-50/30 to-white/95 dark:from-[#193226]/95 dark:via-[#1D3A2C]/90 dark:to-[#14281E]/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-7 border border-amber-300/40 dark:border-amber-500/25 shadow-md flex flex-col justify-between space-y-4 text-neutral-900 dark:text-neutral-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300">
                  <Quote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-amber-100 flex items-center gap-2">
                    <span>Hadith & Sagesse du Jour</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                      {dailyHadith.topic}
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-emerald-300/70">
                    Transmission authentique renouvelée chaque jour
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300/80 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Renouvellement quotidien</span>
              </div>
            </div>

            {/* Hadith Content */}
            <div className="space-y-3 py-1">
              {dailyHadith.arabic && (
                <p className="text-right font-serif text-lg sm:text-xl text-emerald-900 dark:text-amber-200 leading-relaxed tracking-wide">
                  {dailyHadith.arabic}
                </p>
              )}
              <p className="text-sm sm:text-base text-neutral-800 dark:text-neutral-100 leading-relaxed italic font-serif">
                {dailyHadith.text}
              </p>
            </div>

            {/* Narrator & Source footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-amber-200/50 dark:border-white/10 text-xs">
              <span className="text-neutral-600 dark:text-emerald-200/80 font-medium">
                Rapporteur : <strong className="text-neutral-900 dark:text-neutral-100">{dailyHadith.narrator}</strong>
              </span>
              <span className="text-amber-700 dark:text-amber-300/90 font-medium bg-amber-100/60 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-lg border border-amber-300/30">
                {dailyHadith.source}
              </span>
            </div>
          </section>

          {/* Sadaqah & Dons DunyaPay (Col 4) */}
          <section className="lg:col-span-4 bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-teal-500/15 dark:from-[#173827] dark:via-[#132E20] dark:to-[#0F2218] rounded-[28px] p-6 sm:p-7 border border-amber-400/40 dark:border-emerald-500/30 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300">
                  <Heart className="w-4 h-4 fill-amber-400/30" />
                </div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  Sadaqah Jariyah
                </h4>
              </div>
              <p className="text-xs text-neutral-700 dark:text-emerald-200/85 leading-relaxed">
                Participez à la pérennité de cette plateforme spirituelle bénie par un don via la passerelle sécurisée DunyaPay (Orange Money, Wave, Cartes Bancaires).
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-emerald-300/80">
                <span className="px-2 py-0.5 rounded bg-white/60 dark:bg-white/10 font-bold border border-neutral-200 dark:border-white/10">DunyaPay</span>
                <span className="px-2 py-0.5 rounded bg-white/60 dark:bg-white/10 font-bold border border-neutral-200 dark:border-white/10">Orange Money</span>
                <span className="px-2 py-0.5 rounded bg-white/60 dark:bg-white/10 font-bold border border-neutral-200 dark:border-white/10">Cartes</span>
              </div>

              {onOpenDonations && (
                <button
                  type="button"
                  onClick={onOpenDonations}
                  className="w-full h-11 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.98] text-neutral-950 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Heart className="w-4 h-4 text-neutral-950 fill-neutral-950/20" />
                  <span>Faire un don (DunyaPay)</span>
                </button>
              )}
            </div>
          </section>

        </div>

        {/* ========================================================
            QUICK ACCESS TOOLS GRID (6 MODULES SPIRITUELS)
           ======================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Boussole Qibla */}
          <div
            onClick={onOpenQibla}
            className="group bg-white/95 hover:bg-emerald-50/70 dark:bg-[#193226]/90 dark:hover:bg-[#1E3B2E] rounded-[24px] p-5 border border-neutral-200/90 dark:border-emerald-500/25 hover:border-emerald-400/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 px-2.5 py-1 rounded-full">
                {selectedCity.qiblaAngle}° Qibla
              </span>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-200">
                Boussole de la Qibla
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/70 mt-0.5">
                Orientation précise vers la Kaaba depuis {selectedCity.name}.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-emerald-800/40 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span>Ouvrir la boussole</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Guide de Prière */}
          <div
            onClick={() => onOpenPrayerGuide()}
            className="group bg-white/95 hover:bg-emerald-50/70 dark:bg-[#193226]/90 dark:hover:bg-[#1E3B2E] rounded-[24px] p-5 border border-neutral-200/90 dark:border-emerald-500/25 hover:border-emerald-400/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 px-2.5 py-1 rounded-full">
                Pas à pas
              </span>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-200">
                Guide des Prières & Ghusl
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/70 mt-0.5">
                Règles, positions, Janâza, Istikhârah et ablutions majeures.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-emerald-800/40 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span>Explorer le guide</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Invocations du Matin & Soir */}
          <div
            onClick={onOpenDhikr}
            className="group bg-white/95 hover:bg-emerald-50/70 dark:bg-[#193226]/90 dark:hover:bg-[#1E3B2E] rounded-[24px] p-5 border border-neutral-200/90 dark:border-emerald-500/25 hover:border-emerald-400/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 px-2.5 py-1 rounded-full">
                Hisn al-Muslim
              </span>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-200">
                Invocations Authentiques
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/70 mt-0.5">
                Adhkar du matin, du soir, du réveil et de protection.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-emerald-800/40 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span>Lire les duas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Le Jeûne & Ramadan */}
          <div
            onClick={onOpenFasting}
            className="group bg-white/95 hover:bg-purple-50/70 dark:bg-[#193226]/90 dark:hover:bg-[#1E3B2E] rounded-[24px] p-5 border border-purple-200/80 dark:border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/70 border border-purple-300/80 dark:border-purple-500/30 flex items-center justify-center text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform">
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-950/80 border border-purple-300/80 dark:border-purple-500/30 px-2.5 py-1 rounded-full">
                Ibn Baz & Piliers
              </span>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-200">
                Le Jeûne & Ramadan
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/70 mt-0.5">
                Imsak, Iftar, 6 conditions, annulatifs et Fiqh de Cheikh Ibn Baz.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-purple-100 dark:border-purple-800/40 flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300">
              <span>Découvrir le jeûne</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: La Foi & L'Au-Delà */}
          <div
            onClick={onOpenFaith}
            className="group bg-white/95 hover:bg-amber-50/70 dark:bg-[#193226]/90 dark:hover:bg-[#1E3B2E] rounded-[24px] p-5 border border-amber-200/80 dark:border-amber-500/30 hover:border-amber-400/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <Sun className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 border border-amber-300/80 dark:border-amber-500/30 px-2.5 py-1 rounded-full">
                Dr. Al-Achqar
              </span>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-200">
                La Foi & L'Au-Delà
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/70 mt-0.5">
                Résurrection, la Balance, les 8 portes du Paradis et l’Enfer.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-amber-100 dark:border-amber-800/40 flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
              <span>Explorer l’Au-Delà</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Bibliothèque Numérique (6 Livres) */}
          <div
            onClick={() => onOpenLibrary && onOpenLibrary()}
            className="group bg-white/95 hover:bg-emerald-50/70 dark:bg-[#193226]/90 dark:hover:bg-[#1E3B2E] rounded-[24px] p-5 border border-neutral-200/90 dark:border-emerald-500/25 hover:border-emerald-400/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between text-neutral-900 dark:text-neutral-100"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <Library className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-500/30 px-2.5 py-1 rounded-full">
                6 Livres Inclus
              </span>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-200">
                Bibliothèque Islamique
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/70 mt-0.5">
                Coran Arabe, livres de Cheikh Ibn Baz et Dr. Al-Achqar en lecture directe.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-emerald-800/40 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span>Ouvrir la Maktaba</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </section>

      </main>

      {/* Footer Section (exact same component from landing page) */}
      <FooterSection
        onOpenPrayerGuide={() => onOpenPrayerGuide()}
        onOpenQuran={onOpenQuran}
        onOpenQibla={onOpenQibla}
        onOpenDhikr={onOpenDhikr}
        showCta={false}
      />

      </div>

      {/* Prayer Time Adjustments & Settings Modal */}
      <PrayerTimeSettingsModal
        isOpen={isPrayerSettingsOpen}
        onClose={() => setIsPrayerSettingsOpen(false)}
        selectedCity={selectedCity}
        selectedMethod={selectedMethod}
        onSelectMethod={onSelectMethod}
        offsets={prayerOffsets}
        onSaveOffsets={handleSavePrayerOffsets}
        currentAsrMethod={asrMethod}
      />

      {/* World Cities & Timezones Modal */}
      <CitySelectorModal
        isOpen={showCityMenu}
        onClose={() => setShowCityMenu(false)}
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
        cities={CITIES}
      />

    </div>
  );
};
