import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Check,
  Heart,
  Clock,
  Moon,
  Sun,
  Award,
  Library,
} from 'lucide-react';
import { Header } from './Header';
import { MobileHomeScreen } from './MobileHomeScreen';
import { PrayerTimeSettingsModal, PrayerOffsets, adjustTime } from './PrayerTimeSettingsModal';
import { CITIES, PRAYERS, computeDynamicCityPrayers } from '../data/islamicData';
import { SPIRITUAL_VERSES } from '../data/spiritualVerses';
import { CityData, Method, Reciter, UserProfile } from '../types';
import {
  getCityCurrentDate,
  formatDateFrench,
  formatTimeDigits,
  getFormattedHijriDate,
  calculatePrayerSchedule,
  PrayerKey,
} from '../utils/timeUtils';
import {
  formatDateKey,
  getPrayerLog,
  setPrayerLog,
  logToKeyMap,
  PRAYER_KEY_MAP,
  pushSettingToCloud,
} from '../utils/prayerTrackerUtils';
import { getDailyHadith, getDailyReflection } from '../utils/dailyRenewal';
import { getAyahAudioUrl } from '../utils/quranAudioUtils';

interface HomePageProps {
  currentUser: UserProfile | null;
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
  onOpenCalendar?: () => void;
  onOpenQuran: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
  onOpenFasting?: () => void;
  onOpenFaith?: () => void;
  onOpenLibrary?: (bookId?: string) => void;
  onOpenDonations?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

const dhikrOptions = [
  {
    label: 'SubhanAllah',
    arabic: 'سُبْحَانَ اللَّهِ',
    meaning: 'Gloire et pureté à Allah',
    defaultTarget: 33,
  },
  {
    label: 'Alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    meaning: 'Louange à Allah',
    defaultTarget: 33,
  },
  {
    label: 'Allahu Akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    meaning: 'Allah est le Plus Grand',
    defaultTarget: 33,
  },
  {
    label: 'Astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    meaning: 'Je demande pardon à Allah',
    defaultTarget: 100,
  },
  {
    label: 'La ilaha illa Allah',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    meaning: 'Nulle divinité digne d’adoration sauf Allah',
    defaultTarget: 100,
  },
];

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
  onOpenCalendar,
  onOpenQuran,
  onOpenQibla,
  onOpenDhikr,
  onOpenFasting,
  onOpenFaith,
  onOpenLibrary,
  onOpenDonations,
  isDarkMode = true,
  onToggleDarkMode,
}) => {
  const [cityNow, setCityNow] = useState<Date>(() => getCityCurrentDate(selectedCity.timezone));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Prayer Offsets
  const [prayerOffsets, setPrayerOffsets] = useState<PrayerOffsets>(() => {
    try {
      const saved = localStorage.getItem('prayer_offsets');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { F: 0, D: 0, A: 0, M: 0, I: 0 };
  });

  const [asrMethod, setAsrMethod] = useState<'standard' | 'hanafi'>(() => {
    try {
      const saved = localStorage.getItem('asr_method');
      if (saved === 'hanafi') return 'hanafi';
    } catch {
      // ignore
    }
    return 'standard';
  });

  // Today's Prayer Completion Map
  const todayDateStr = useMemo(() => formatDateKey(cityNow), [cityNow]);
  const [completedPrayers, setCompletedPrayers] = useState<Record<PrayerKey, boolean>>(() =>
    logToKeyMap(getPrayerLog(formatDateKey(new Date())))
  );

  // Spiritual Verse State
  const [verseIndex, setVerseIndex] = useState<number>(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.abs(dayOfYear) % SPIRITUAL_VERSES.length;
  });
  const [isPlayingVerse, setIsPlayingVerse] = useState(false);
  const verseAudioRef = useRef<HTMLAudioElement | null>(null);

  // Tasbih & Zikr State
  const [selectedDhikrIndex, setSelectedDhikrIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_selected_dhikr_index');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [tasbihTarget, setTasbihTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_tasbih_target');
      return saved ? parseInt(saved, 10) || 33 : 33;
    } catch {
      return 33;
    }
  });

  const [customTasbihInput, setCustomTasbihInput] = useState<string>(() => String(tasbihTarget));

  const [tasbihCount, setTasbihCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_tasbih_count');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [isTasbihRippling, setIsTasbihRippling] = useState(false);
  const [syncRevision, setSyncRevision] = useState(0);

  // Live Clock Tick
  useEffect(() => {
    setCityNow(getCityCurrentDate(selectedCity.timezone));
    const timer = setInterval(() => {
      setCityNow(getCityCurrentDate(selectedCity.timezone));
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedCity.timezone]);

  // Listen for Prayer Tracker & Cloud Sync updates
  useEffect(() => {
    const refreshFromStorage = () => {
      setCompletedPrayers(logToKeyMap(getPrayerLog(todayDateStr)));
      setSyncRevision((r) => r + 1);
      try {
        const savedOffsets = localStorage.getItem('prayer_offsets');
        if (savedOffsets) setPrayerOffsets(JSON.parse(savedOffsets));
        const savedAsr = localStorage.getItem('asr_method');
        if (savedAsr === 'hanafi' || savedAsr === 'standard') setAsrMethod(savedAsr);
        const savedCount = localStorage.getItem('sanctuaire_tasbih_count');
        if (savedCount !== null) {
          const parsed = parseInt(savedCount, 10);
          if (!isNaN(parsed)) setTasbihCount(parsed);
        }
        const savedTarget = localStorage.getItem('sanctuaire_tasbih_target');
        if (savedTarget !== null) {
          const parsedT = parseInt(savedTarget, 10);
          if (!isNaN(parsedT) && parsedT > 0) {
            setTasbihTarget(parsedT);
            setCustomTasbihInput(String(parsedT));
          }
        }
        const savedIdx = localStorage.getItem('sanctuaire_selected_dhikr_index');
        if (savedIdx !== null) {
          const parsedIdx = parseInt(savedIdx, 10);
          if (!isNaN(parsedIdx)) setSelectedDhikrIndex(parsedIdx % dhikrOptions.length);
        }
      } catch {
        // ignore
      }
    };

    refreshFromStorage();
    window.addEventListener('prayer-tracker-updated', refreshFromStorage);
    window.addEventListener('sanctuaire-sync-updated', refreshFromStorage);
    window.addEventListener('storage', refreshFromStorage);
    return () => {
      window.removeEventListener('prayer-tracker-updated', refreshFromStorage);
      window.removeEventListener('sanctuaire-sync-updated', refreshFromStorage);
      window.removeEventListener('storage', refreshFromStorage);
    };
  }, [todayDateStr]);

  // Compute dynamic adjusted prayer times
  const adjustedPrayers = useMemo(() => {
    const raw = computeDynamicCityPrayers(selectedCity, cityNow, selectedMethod.id);
    const hanafiShift = asrMethod === 'hanafi' ? 42 : 0;
    return {
      F: adjustTime(raw.F, prayerOffsets.F),
      D: adjustTime(raw.D, prayerOffsets.D),
      A: adjustTime(raw.A, prayerOffsets.A + hanafiShift),
      M: adjustTime(raw.M, prayerOffsets.M),
      I: adjustTime(raw.I, prayerOffsets.I),
    };
  }, [selectedCity, cityNow, selectedMethod.id, prayerOffsets, asrMethod]);

  const schedule = useMemo(
    () => calculatePrayerSchedule(adjustedPrayers, cityNow),
    [adjustedPrayers, cityNow]
  );

  const todayPrayersList = useMemo(() => {
    return PRAYERS.map((p) => ({
      key: p.key,
      name: p.name,
      arabicName: p.arabicName,
      time: adjustedPrayers[p.key],
      rakats: p.rakats,
      isNext: schedule.nextPrayerKey === p.key,
      isCompleted: !!completedPrayers[p.key],
    }));
  }, [adjustedPrayers, schedule.nextPrayerKey, completedPrayers]);

  const handleTogglePrayer = (key: PrayerKey) => {
    const currentLog = getPrayerLog(todayDateStr);
    const logField = PRAYER_KEY_MAP[key];
    const updatedLog = {
      ...currentLog,
      [logField]: !currentLog[logField],
    };
    setPrayerLog(todayDateStr, updatedLog);
    setCompletedPrayers(logToKeyMap(updatedLog));
  };

  const handleSaveOffsets = (newOffsets: PrayerOffsets, newAsr: 'standard' | 'hanafi') => {
    setPrayerOffsets(newOffsets);
    setAsrMethod(newAsr);
    try {
      const json = JSON.stringify(newOffsets);
      localStorage.setItem('prayer_offsets', json);
      localStorage.setItem('asr_method', newAsr);
      pushSettingToCloud('prayer_offsets', json);
      pushSettingToCloud('asr_method', newAsr);
    } catch {
      // ignore
    }
  };

  const currentVerse = SPIRITUAL_VERSES[verseIndex % SPIRITUAL_VERSES.length] || SPIRITUAL_VERSES[0];

  const handleNextVerse = () => {
    if (verseAudioRef.current) {
      verseAudioRef.current.pause();
      setIsPlayingVerse(false);
    }
    setVerseIndex((prev) => (prev + 1) % SPIRITUAL_VERSES.length);
  };

  const handleToggleVerseAudio = () => {
    if (isPlayingVerse && verseAudioRef.current) {
      verseAudioRef.current.pause();
      setIsPlayingVerse(false);
      return;
    }
    const url = getAyahAudioUrl(
      currentVerse.surahNumber,
      currentVerse.ayahNumber,
      selectedReciter.id
    );
    if (!verseAudioRef.current) {
      verseAudioRef.current = new Audio(url);
    } else {
      verseAudioRef.current.src = url;
    }
    verseAudioRef.current.onended = () => setIsPlayingVerse(false);
    verseAudioRef.current.onerror = () => setIsPlayingVerse(false);
    verseAudioRef.current
      .play()
      .then(() => setIsPlayingVerse(true))
      .catch(() => setIsPlayingVerse(false));
  };

  useEffect(() => {
    return () => {
      if (verseAudioRef.current) {
        verseAudioRef.current.pause();
      }
    };
  }, []);

  const handleTasbihClick = () => {
    setIsTasbihRippling(true);
    setTimeout(() => setIsTasbihRippling(false), 140);
    setTasbihCount((prev) => {
      const next = tasbihTarget > 0 ? Math.min(tasbihTarget, prev + 1) : prev + 1;
      try {
        localStorage.setItem('sanctuaire_tasbih_count', String(next));
        pushSettingToCloud('sanctuaire_tasbih_count', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const resetTasbih = () => {
    setTasbihCount(0);
    try {
      localStorage.setItem('sanctuaire_tasbih_count', '0');
      pushSettingToCloud('sanctuaire_tasbih_count', '0');
    } catch {
      // ignore
    }
  };

  const completedTodayCount = todayPrayersList.filter((p) => p.isCompleted).length;
  const dailyHadith = useMemo(() => getDailyHadith(), []);
  const dailyReflection = useMemo(() => getDailyReflection(), []);

  // Weekly constance days (Mon -> Sun)
  const weeklyDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);
    const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const todayKey = formatDateKey(today);

    return labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dKey = formatDateKey(d);
      const isToday = dKey === todayKey;
      const log = isToday ? completedPrayers : logToKeyMap(getPrayerLog(dKey));
      const count = Object.values(log).filter(Boolean).length;
      return { label, dKey, isToday, count };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedPrayers, todayDateStr, syncRevision]);

  const nextPrayerInfo = useMemo(() => {
    const found = todayPrayersList.find((p) => p.key === schedule.nextPrayerKey) || todayPrayersList[0];
    return {
      key: found.key,
      name: found.name,
      arabicName: found.arabicName,
      time: found.time,
      remainingStr: schedule.countdownFormatted,
    };
  }, [todayPrayersList, schedule.nextPrayerKey, schedule.countdownFormatted]);

  const liveClockString = formatTimeDigits(cityNow, false);
  const liveGregorianDate = formatDateFrench(cityNow);
  const liveHijriDate = getFormattedHijriDate(cityNow);

  return (
    <div className="min-h-screen w-full bg-[#F4F7F5] dark:bg-[#14261C] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* ========================================================
          MOBILE VIEWPORT (< 768px)
         ======================================================== */}
      <div className="md:hidden">
        <MobileHomeScreen
          currentUser={currentUser}
          selectedCity={selectedCity}
          cities={CITIES}
          onCityChange={onSelectCity}
          liveClockString={liveClockString}
          liveGregorianDate={liveGregorianDate}
          liveHijriDate={liveHijriDate}
          nextPrayer={nextPrayerInfo}
          todayPrayers={todayPrayersList}
          onTogglePrayer={handleTogglePrayer}
          currentVerse={{
            id: currentVerse.id,
            french: currentVerse.french,
            reference: currentVerse.reference,
            arabicSurahName: currentVerse.arabicSurahName,
          }}
          onNextVerse={handleNextVerse}
          onOpenQuran={onOpenQuran}
          onOpenPrayerGuide={() => onOpenPrayerGuide(nextPrayerInfo.key)}
          onOpenQibla={onOpenQibla}
          onOpenDhikr={onOpenDhikr}
          onOpenFasting={onOpenFasting}
          onOpenFaith={onOpenFaith}
          onOpenLibrary={onOpenLibrary ? () => onOpenLibrary() : undefined}
          onOpenPrayerSettings={() => setIsSettingsOpen(true)}
          onOpenCalendar={onOpenCalendar}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          onGoToLanding={onGoToLanding}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      </div>

      {/* ========================================================
          DESKTOP VIEWPORT (>= 768px)
         ======================================================== */}
      <div className="hidden md:block">
        <Header
          selectedCity={selectedCity}
          onSelectCity={onSelectCity}
          selectedMethod={selectedMethod}
          onSelectMethod={onSelectMethod}
          selectedReciter={selectedReciter}
          onSelectReciter={onSelectReciter}
          onOpenPrayerGuide={() => onOpenPrayerGuide()}
          onOpenQuran={onOpenQuran}
          onOpenFasting={onOpenFasting}
          onOpenFaith={onOpenFaith}
          onOpenLibrary={onOpenLibrary ? () => onOpenLibrary() : undefined}
          onOpenDonations={onOpenDonations}
          onOpenAuth={onOpenAuth}
          currentUser={currentUser}
          onLogout={onLogout}
          onGoToHome={onGoToLanding}
          onOpenPrayerSettings={() => setIsSettingsOpen(true)}
          isLanding={false}
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
        />

        <main className="max-w-7xl mx-auto px-6 lg:px-10 pl-20 lg:pl-24 py-6 space-y-6">
          {/* ================= TOP HERO ROW: GREETING & NEXT PRAYER BANNER ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Greeting + Next Prayer Live Countdown */}
            <section className="lg:col-span-7 relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#042F2E] text-white p-7 shadow-xl border border-emerald-400/25 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-emerald-100">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>{liveGregorianDate}</span>
                  <span className="opacity-50">•</span>
                  <span className="text-amber-200 font-semibold">{liveHijriDate}</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 border border-white/15 text-xs font-mono font-bold text-emerald-200">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedCity.name}</span>
                  <span>•</span>
                  <span>{formatTimeDigits(cityNow, true)}</span>
                </div>
              </div>

              <div className="my-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/90">
                    Assalamu Alaykum,{' '}
                    {currentUser?.firstName ||
                      (currentUser?.name ? currentUser.name.split(' ')[0] : 'Cher Croyant')}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      Prochaine : {nextPrayerInfo.name}
                    </h1>
                    <span className="text-2xl font-serif text-amber-200">
                      {nextPrayerInfo.arabicName}
                    </span>
                  </div>
                  <p className="text-sm text-emerald-100/85">
                    Adhan prévu à{' '}
                    <span className="font-mono font-bold text-white">{nextPrayerInfo.time}</span> — dans{' '}
                    <span className="font-mono font-bold text-amber-300">
                      {nextPrayerInfo.remainingStr}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => onOpenPrayerGuide(nextPrayerInfo.key)}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <span>Guide de prière</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    title="Ajuster les horaires"
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mini 5-prayer strip */}
              <div className="grid grid-cols-5 gap-2 pt-3 border-t border-white/15">
                {todayPrayersList.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handleTogglePrayer(p.key)}
                    className={`px-3 py-2 rounded-xl text-left transition cursor-pointer border ${
                      p.isNext
                        ? 'bg-white/20 border-amber-300/60 shadow-sm'
                        : p.isCompleted
                        ? 'bg-emerald-900/50 border-emerald-400/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span>{p.name}</span>
                      {p.isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-white/40" />
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-100 mt-0.5">
                      {p.time}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Right 5 Cols: Daily Spiritual Verse & Audio */}
            <section className="lg:col-span-5 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-7 border border-neutral-200/90 dark:border-emerald-500/25 shadow-md dark:shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verset du Jour</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleVerseAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {isPlayingVerse ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Écouter</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleNextVerse}
                    title="Autre verset"
                    className="p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-[#1E3B2E] border border-neutral-200 dark:border-emerald-500/30 text-neutral-700 dark:text-emerald-200 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 my-auto">
                <p
                  dir="rtl"
                  className="text-lg sm:text-xl font-serif text-emerald-900 dark:text-amber-200 leading-relaxed text-right"
                >
                  {currentVerse.arabic}
                </p>
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-emerald-100/90 italic leading-relaxed">
                  {currentVerse.french}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/70 dark:border-emerald-500/20 text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {currentVerse.reference}
                </span>
                <button
                  onClick={onOpenQuran}
                  className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ouvrir le Coran</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          </div>

          {/* ================= MIDDLE ROW: PRAYER TRACKER (7 COLS) & ZIKR/TASBIH (5 COLS) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 7 COLS: SUIVI DES PRIÈRES & CONSTANCE HEBDOMADAIRE */}
            <section className="lg:col-span-7 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-7 border border-neutral-200/90 dark:border-emerald-500/25 shadow-md dark:shadow-xl flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                      Suivi des 5 Prières Quotidiennes
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-emerald-200/70">
                      {completedTodayCount}/5 prières accomplies aujourd’hui
                    </p>
                  </div>
                </div>

                {onOpenCalendar && (
                  <button
                    onClick={onOpenCalendar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-[#14281E] dark:hover:bg-[#1E3B2E] border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-800 dark:text-emerald-200 transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Calendrier mensuel</span>
                  </button>
                )}
              </div>

              {/* 5 Prayers Interactive Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {todayPrayersList.map((prayer) => (
                  <div
                    key={prayer.key}
                    onClick={() => handleTogglePrayer(prayer.key)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                      prayer.isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : prayer.isNext
                        ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-400/70 text-neutral-900 dark:text-white'
                        : 'bg-neutral-50 dark:bg-[#14281E] border-neutral-200 dark:border-emerald-500/20 text-neutral-800 dark:text-neutral-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold">{prayer.name}</span>
                      {prayer.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                    <div className="text-base font-mono font-extrabold">{prayer.time}</div>
                    <div
                      className={`text-[11px] mt-1 ${
                        prayer.isCompleted
                          ? 'text-emerald-100'
                          : 'text-neutral-500 dark:text-emerald-300/70'
                      }`}
                    >
                      {prayer.rakats} Rakats
                    </div>
                  </div>
                ))}
              </div>

              {/* Weekly Constance Strip */}
              <div className="pt-3 border-t border-neutral-200/80 dark:border-emerald-500/20">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-neutral-700 dark:text-emerald-200 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Constance de la semaine (Lun - Dim)</span>
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-emerald-300/70">
                    Synchronisé en temps réel
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {weeklyDays.map((d) => (
                    <div
                      key={d.dKey}
                      className={`py-2 px-2 rounded-xl border text-center ${
                        d.isToday
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60'
                          : 'border-neutral-200/80 dark:border-emerald-500/20 bg-neutral-50/60 dark:bg-[#14281E]/60'
                      }`}
                    >
                      <div className="text-[11px] font-bold text-neutral-600 dark:text-emerald-200">
                        {d.label}
                      </div>
                      <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {d.count}/5
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ================= RIGHT 5 COLS: ZIKR & TASBIH ================= */}
            <section className="lg:col-span-5 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl rounded-[28px] p-6 sm:p-7 border border-neutral-200/90 dark:border-emerald-500/25 shadow-md dark:shadow-xl flex flex-col justify-between space-y-4 text-neutral-900 dark:text-neutral-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-neutral-900 dark:text-white">
                      Zikr & Tasbih
                    </h3>
                  </div>
                </div>

                <button
                  onClick={resetTasbih}
                  title="Recommencer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-[#1E3B2E] border border-neutral-200 dark:border-emerald-500/30 text-xs font-semibold text-neutral-700 dark:text-emerald-200 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recommencer</span>
                </button>
              </div>

              {/* Phrase selector pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {dhikrOptions.map((item, idx) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setSelectedDhikrIndex(idx);
                      setTasbihCount(0);
                      pushSettingToCloud('sanctuaire_selected_dhikr_index', String(idx));
                      pushSettingToCloud('sanctuaire_tasbih_count', '0');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedDhikrIndex === idx
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-[#1E3B2E] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-emerald-500/20'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Configuration libre du nombre : presets + Libre (∞) + champ libre */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const parsed = parseInt(customTasbihInput, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    const valid = Math.min(999999, parsed);
                    setTasbihTarget(valid);
                    setCustomTasbihInput(String(valid));
                    setTasbihCount(0);
                    try {
                      localStorage.setItem('sanctuaire_tasbih_target', String(valid));
                      localStorage.setItem('sanctuaire_tasbih_count', '0');
                    } catch {
                      // ignore
                    }
                    pushSettingToCloud('sanctuaire_tasbih_target', String(valid));
                    pushSettingToCloud('sanctuaire_tasbih_count', '0');
                  }
                }}
                className="flex flex-wrap items-center gap-1.5"
              >
                {[33, 99, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setTasbihTarget(preset);
                      setCustomTasbihInput(String(preset));
                      setTasbihCount(0);
                      try {
                        localStorage.setItem('sanctuaire_tasbih_target', String(preset));
                        localStorage.setItem('sanctuaire_tasbih_count', '0');
                      } catch {
                        // ignore
                      }
                      pushSettingToCloud('sanctuaire_tasbih_target', String(preset));
                      pushSettingToCloud('sanctuaire_tasbih_count', '0');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      tasbihTarget === preset
                        ? 'bg-emerald-700 text-white border-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:border-emerald-400'
                        : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-emerald-500/20 hover:bg-neutral-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setTasbihTarget(0);
                    setCustomTasbihInput('');
                    setTasbihCount(0);
                    try {
                      localStorage.setItem('sanctuaire_tasbih_target', '0');
                      localStorage.setItem('sanctuaire_tasbih_count', '0');
                    } catch {
                      // ignore
                    }
                    pushSettingToCloud('sanctuaire_tasbih_target', '0');
                    pushSettingToCloud('sanctuaire_tasbih_count', '0');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    tasbihTarget === 0
                      ? 'bg-emerald-700 text-white border-emerald-700 dark:bg-emerald-500 dark:text-neutral-950 dark:border-emerald-400'
                      : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-emerald-500/20 hover:bg-neutral-200'
                  }`}
                >
                  Libre (∞)
                </button>

                <input
                  type="number"
                  min={1}
                  max={999999}
                  value={customTasbihInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomTasbihInput(val);
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      const valid = Math.min(999999, parsed);
                      setTasbihTarget(valid);
                      try {
                        localStorage.setItem('sanctuaire_tasbih_target', String(valid));
                      } catch {
                        // ignore
                      }
                      pushSettingToCloud('sanctuaire_tasbih_target', String(valid));
                    }
                  }}
                  placeholder="Nombre libre"
                  className="w-24 flex-1 px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/30 text-xs font-bold text-neutral-900 dark:text-white text-center focus:outline-none focus:border-emerald-500"
                />

                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
                >
                  Choisir
                </button>
              </form>

              {/* Interactive Tap Circle */}
              {(() => {
                const isDone = tasbihTarget > 0 && tasbihCount >= tasbihTarget;
                const activeDhikr = dhikrOptions[selectedDhikrIndex] || dhikrOptions[0];
                return (
                  <div
                    onClick={isDone ? resetTasbih : handleTasbihClick}
                    className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-b from-emerald-50/70 to-neutral-50/90 dark:from-[#14281E] dark:to-[#112219] border border-emerald-200/80 dark:border-emerald-500/30 flex flex-col items-center justify-center text-center cursor-pointer select-none group relative overflow-hidden shadow-inner"
                  >
                    <div className="text-xl sm:text-2xl font-serif text-emerald-800 dark:text-amber-200 mb-0.5">
                      {activeDhikr.arabic}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mb-3">
                      {activeDhikr.meaning}
                    </div>

                    {/* Counter Ring */}
                    <div
                      className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform duration-150 ${
                        isTasbihRippling ? 'scale-92' : 'group-hover:scale-103'
                      } ${
                        isDone
                          ? 'bg-emerald-600 text-white border-2 border-emerald-300'
                          : 'bg-white dark:bg-[#193226] text-neutral-900 dark:text-white border-2 border-emerald-400/70 dark:border-emerald-500/40'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Check className="w-6 h-6 mb-0.5 stroke-[2.5]" />
                          <span className="text-xs font-extrabold">Terminé</span>
                          <span className="text-[10px] opacity-90 mt-0.5">Recommencer</span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-extrabold tracking-tight font-mono">
                            {tasbihCount}
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                            {tasbihTarget === 0 ? 'MODE LIBRE (∞)' : `/ ${tasbihTarget}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={onOpenDhikr}
                className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-[#1E3B2E] border border-neutral-200 dark:border-emerald-500/30 text-neutral-800 dark:text-emerald-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Plein écran</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </button>
            </section>
          </div>

          {/* ================= BOTTOM ROW: QUICK NAVIGATION & DAILY HADITH ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={onOpenQuran}
              className="rounded-2xl bg-white/95 dark:bg-[#193226]/95 p-5 border border-neutral-200/90 dark:border-emerald-500/25 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Le Noble Coran
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-emerald-200/70">
                    Lecture & Récitations audio ({selectedReciter.name})
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div
              onClick={onOpenQibla}
              className="rounded-2xl bg-white/95 dark:bg-[#193226]/95 p-5 border border-neutral-200/90 dark:border-emerald-500/25 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Direction Qibla ({selectedCity.qiblaAngle}°)
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-emerald-200/70">
                    Boussole précise vers La Mecque
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="rounded-2xl bg-white/95 dark:bg-[#193226]/95 p-5 border border-neutral-200/90 dark:border-emerald-500/25 shadow-sm flex flex-col justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-amber-300">
                Hadith du Jour • {dailyHadith.topic}
              </div>
              <p className="text-xs text-neutral-700 dark:text-emerald-100/90 italic my-1.5 line-clamp-2">
                {dailyHadith.text}
              </p>
              <div className="text-[10px] text-neutral-500 dark:text-emerald-300/70 font-medium">
                {dailyHadith.source} — {dailyReflection.title}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Prayer Settings Modal */}
      <PrayerTimeSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedCity={selectedCity}
        selectedMethod={selectedMethod}
        onSelectMethod={onSelectMethod}
        offsets={prayerOffsets}
        onSaveOffsets={handleSaveOffsets}
        currentAsrMethod={asrMethod}
      />
    </div>
  );
};