import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  Award,
  Flame,
  Printer,
  Moon,
  Sun,
  Sunrise,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { CityData, Method, UserProfile } from '../types';
import {
  MonthCalendarDay,
  DailyPrayerLog,
  PrayerKey,
  PRAYER_METADATA,
  getMonthDaysData,
  calculateMonthStats,
  formatDateKey,
  togglePrayerInLog,
  setPrayerLog,
} from '../utils/prayerTrackerUtils';

interface MonthlyPrayerCalendarViewProps {
  currentUser?: UserProfile | null;
  onBackToHome: () => void;
  selectedCity: CityData;
  selectedMethod: Method;
  initialTab?: 'calendar' | 'stats';
}

export const MonthlyPrayerCalendarView: React.FC<MonthlyPrayerCalendarViewProps> = ({
  currentUser,
  onBackToHome,
  selectedCity,
  selectedMethod,
  initialTab = 'calendar',
}) => {
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats'>(initialTab);

  // Selected day for the detailed view
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => formatDateKey(today));

  // Local refresh trigger when user toggles a prayer
  const [refreshTick, setRefreshTick] = useState(0);

  // Compute month days and stats
  const monthDays = useMemo(() => {
    return getMonthDaysData(selectedYear, selectedMonth, selectedCity, selectedMethod.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, selectedCity, selectedMethod.id, refreshTick]);

  const monthStats = useMemo(() => {
    return calculateMonthStats(monthDays);
  }, [monthDays]);

  // Active day details
  const activeDay = useMemo(() => {
    return monthDays.find((d) => d.dateStr === selectedDayStr) || monthDays[0] || null;
  }, [monthDays, selectedDayStr]);

  // Handle month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setSelectedDayStr(formatDateKey(today));
  };

  // Toggle single prayer for active day
  const handleTogglePrayerForDay = (dateStr: string, prayerKey: PrayerKey) => {
    togglePrayerInLog(dateStr, prayerKey);
    setRefreshTick((t) => t + 1);
  };

  // Mark all 5 prayers completed for active day
  const handleMarkAllPrayers = (dateStr: string, completed: boolean) => {
    const fullLog: DailyPrayerLog = {
      fajr: completed,
      dhuhr: completed,
      asr: completed,
      maghrib: completed,
      isha: completed,
    };
    setPrayerLog(dateStr, fullLog);
    setRefreshTick((t) => t + 1);
  };

  // Calculate calendar grid blank offsets (Monday-based: 0 = Mon, 6 = Sun)
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Convert Sun=0 to Mon=0

  // Month Hijri subtitle summary
  const hijriMonthSummary = useMemo(() => {
    if (!monthDays.length) return '';
    const startH = monthDays[0].hijri;
    const endH = monthDays[monthDays.length - 1].hijri;
    if (startH.monthName === endH.monthName) {
      return `${startH.monthName} ${startH.year} AH`;
    }
    return `${startH.monthName} / ${endH.monthName} ${endH.year} AH`;
  }, [monthDays]);

  const monthNameCapitalized = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, 1);
    const name = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [selectedYear, selectedMonth]);

  return (
    <div className="min-h-screen bg-[#F4F7F5] dark:bg-[#14261C] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-emerald-600 selection:text-white transition-colors duration-200 pb-24 md:pb-16">
      {/* ========================================================
          STICKY TOP NAVBAR
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#183225]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-emerald-700/40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Back button */}
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#11241A] dark:hover:bg-emerald-900/60 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-600/30 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Retour au Sanctuaire</span>
            <span className="sm:hidden">Accueil</span>
          </button>

          {/* Central Tabs: Calendrier vs Graphique */}
          <div className="flex items-center p-1 bg-neutral-200/70 dark:bg-[#0E1E15] rounded-xl border border-neutral-300/60 dark:border-emerald-700/50">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
              <span>Calendrier Mensuel</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Graphique & Suivi</span>
            </button>
          </div>

          {/* City Badge & Print */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-[#12281D] border border-emerald-200 dark:border-emerald-700/40 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{selectedCity.name}</span>
            </div>

            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#11241A] dark:hover:bg-emerald-900/60 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-emerald-600/30 transition cursor-pointer"
              title="Imprimer / Exporter le calendrier"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          HERO BANNER & MONTH NAVIGATION
         ======================================================== */}
      <section className="bg-gradient-to-b from-[#122F20] via-[#0D2418] to-[#153424] text-white py-6 md:py-8 px-4 sm:px-6 relative overflow-hidden border-b border-[#214E36]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
          {/* Title & Hijri date */}
          <div className="text-center md:text-left space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[11px] font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Calendrier Islamique & Suivi des Prières</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {monthNameCapitalized}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 font-medium">
              Calendrier Hégirien : <span className="text-amber-200 font-bold">{hijriMonthSummary}</span> • Horaires calculés pour {selectedCity.name}
            </p>
          </div>

          {/* Month Stepper Controls */}
          <div className="flex items-center gap-2 bg-[#091D13] p-1.5 rounded-2xl border border-emerald-600/40 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer active:scale-95"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentMonth}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-bold transition cursor-pointer border border-emerald-400/30"
              title="Revenir au mois actuel"
            >
              Aujourd'hui
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer active:scale-95"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          MAIN CONTENT ZONE
         ======================================================== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* =====================================================
            TAB 1 : CALENDRIER MENSUEL & HORAIRES
           ===================================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Top Key Badges & White Days / Jumu'ah announcement */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-[#183225] p-3.5 rounded-2xl border border-neutral-200 dark:border-emerald-700/40 flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">Jours du mois</div>
                  <div className="text-sm font-black text-neutral-900 dark:text-white">
                    {monthDays.length} jours • {selectedCity.name}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#183225] p-3.5 rounded-2xl border border-neutral-200 dark:border-emerald-700/40 flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">Jours Blancs (Ayyam al-Bid)</div>
                  <div className="text-sm font-black text-neutral-900 dark:text-white">
                    13, 14, 15 Hégiriens (Jeûne Sunnah)
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#183225] p-3.5 rounded-2xl border border-neutral-200 dark:border-emerald-700/40 flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">Assiduité ce mois</div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {monthStats.completionRate}% ({monthStats.totalPrayersCompleted} prières accomplies)
                  </div>
                </div>
              </div>
            </div>

            {/* Layout: Main Monthly Grid + Selected Day Detail Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left/Main Column: Calendar Grid (8 cols on lg) */}
              <div className="lg:col-span-8 bg-white dark:bg-[#183225] rounded-3xl p-4 sm:p-6 border border-neutral-200 dark:border-emerald-700/40 shadow-xs">
                {/* Week Day Header */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven (Jumu\'ah)', 'Sam', 'Dim'].map((d, i) => (
                    <div
                      key={d}
                      className={`py-2 rounded-xl ${
                        i === 4
                          ? 'bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-black'
                          : ''
                      }`}
                    >
                      <span className="hidden sm:inline">{d}</span>
                      <span className="sm:hidden">{d.slice(0, 3)}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Days Cells */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {/* Empty cells for previous month padding */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[70px] sm:min-h-[88px] rounded-2xl bg-neutral-50/50 dark:bg-[#12241B]/40 border border-dashed border-neutral-200/50 dark:border-emerald-900/30 opacity-40"
                    />
                  ))}

                  {/* Real Days of Current Month */}
                  {monthDays.map((day) => {
                    const isSelected = day.dateStr === selectedDayStr;
                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => setSelectedDayStr(day.dateStr)}
                        className={`min-h-[70px] sm:min-h-[88px] p-1.5 sm:p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-600 dark:border-emerald-400 ring-2 ring-emerald-500/30 shadow-sm'
                            : day.isToday
                            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400/80 dark:border-amber-500/50'
                            : day.isFriday
                            ? 'bg-emerald-50/30 dark:bg-[#152B20] border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
                            : 'bg-white dark:bg-[#14281E] border-neutral-200 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-600'
                        }`}
                      >
                        {/* Top row: Gregorian Day & Hijri Day */}
                        <div className="flex items-start justify-between w-full">
                          <span
                            className={`text-xs sm:text-sm font-black rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${
                              day.isToday
                                ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-2xs'
                                : isSelected
                                ? 'bg-emerald-700 text-white'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {day.dayNumber}
                          </span>

                          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {day.hijri.day}
                          </span>
                        </div>

                        {/* Mid Indicator: White days or Friday tag */}
                        <div className="my-0.5">
                          {day.isFriday && (
                            <span className="text-[8px] sm:text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                              Jumu'ah
                            </span>
                          )}
                          {day.hijri.isAyyamAlBid && (
                            <span className="text-[8px] font-bold text-amber-700 dark:text-amber-300 block truncate">
                              Jeûne
                            </span>
                          )}
                        </div>

                        {/* Bottom: 5 Prayer Completion Dots */}
                        <div className="w-full flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-emerald-800/40">
                          <div className="flex items-center gap-0.5 sm:gap-1">
                            {(['F', 'D', 'A', 'M', 'I'] as PrayerKey[]).map((k) => {
                              const done =
                                k === 'F'
                                  ? day.log.fajr
                                  : k === 'D'
                                  ? day.log.dhuhr
                                  : k === 'A'
                                  ? day.log.asr
                                  : k === 'M'
                                  ? day.log.maghrib
                                  : day.log.isha;
                              return (
                                <span
                                  key={k}
                                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                                    done
                                      ? 'bg-emerald-500 dark:bg-emerald-400'
                                      : 'bg-neutral-300 dark:bg-neutral-700'
                                  }`}
                                  title={`${PRAYER_METADATA[k].label}: ${done ? 'Accomplie' : 'Non cochée'}`}
                                />
                              );
                            })}
                          </div>

                          <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400">
                            {day.completedCount}/5
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Day Detail Panel (4 cols on lg) */}
              <div className="lg:col-span-4 space-y-4">
                {activeDay && (
                  <div className="bg-white dark:bg-[#183225] rounded-3xl p-5 border border-neutral-200 dark:border-emerald-700/40 shadow-xs space-y-4">
                    {/* Day Header */}
                    <div className="pb-3 border-b border-neutral-200 dark:border-emerald-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                          Fiche du Jour
                        </span>
                        {activeDay.isToday && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-400/40">
                            Aujourd'hui
                          </span>
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white mt-1">
                        {activeDay.date.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h2>
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-bold mt-0.5">
                        {activeDay.hijri.fullFormatted}
                      </p>
                    </div>

                    {/* Progress Score for this Day */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 dark:bg-[#12281D] border border-emerald-200/80 dark:border-emerald-800/50">
                      <div>
                        <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                          Prières accomplies
                        </div>
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                          Cliquez ci-dessous pour cocher/décocher
                        </div>
                      </div>
                      <div className="text-base font-black text-emerald-700 dark:text-emerald-300">
                        {activeDay.completedCount} / 5
                      </div>
                    </div>

                    {/* 5 Prayers Interactive Checklist with Times */}
                    <div className="space-y-2">
                      {(['F', 'D', 'A', 'M', 'I'] as PrayerKey[]).map((key) => {
                        const isDone =
                          key === 'F'
                            ? activeDay.log.fajr
                            : key === 'D'
                            ? activeDay.log.dhuhr
                            : key === 'A'
                            ? activeDay.log.asr
                            : key === 'M'
                            ? activeDay.log.maghrib
                            : activeDay.log.isha;
                        const meta = PRAYER_METADATA[key];
                        const prayerTime = activeDay.prayers[key];

                        return (
                          <div
                            key={key}
                            onClick={() => handleTogglePrayerForDay(activeDay.dateStr, key)}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                              isDone
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700/60'
                                : 'bg-neutral-50 dark:bg-[#13271E] border-neutral-200 dark:border-emerald-900/40 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-xl flex items-center justify-center transition-colors ${
                                  isDone
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-[#0E1E15]'
                                }`}
                              >
                                {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                  {meta.label}
                                </span>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-arabic ml-1.5">
                                  {meta.arabic}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs font-mono font-bold text-neutral-800 dark:text-emerald-300">
                              {prayerTime}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Mark All Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleMarkAllPrayers(activeDay.dateStr, true)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs text-center active:scale-95"
                      >
                        Tout Cocher (5/5)
                      </button>
                      <button
                        onClick={() => handleMarkAllPrayers(activeDay.dateStr, false)}
                        className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#12261C] text-neutral-700 dark:text-neutral-300 text-xs font-medium transition cursor-pointer border border-neutral-200 dark:border-emerald-800/40 text-center"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Monthly Prayer Times Table (Printable & Inspectable) */}
            <div className="bg-white dark:bg-[#183225] rounded-3xl p-5 sm:p-6 border border-neutral-200 dark:border-emerald-700/40 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    Tableau Mensuel Complet des Horaires ({monthNameCapitalized})
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Horaires astronomiques pour {selectedCity.name} ({selectedMethod.name})
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer ce mois</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-emerald-800/50">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-neutral-50 dark:bg-[#12241B] text-neutral-700 dark:text-emerald-300 border-b border-neutral-200 dark:border-emerald-800/50 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Hégire</th>
                      <th className="py-2.5 px-3">Fajr</th>
                      <th className="py-2.5 px-3">Dhuhr</th>
                      <th className="py-2.5 px-3">Asr</th>
                      <th className="py-2.5 px-3">Maghrib</th>
                      <th className="py-2.5 px-3">Isha</th>
                      <th className="py-2.5 px-3 text-center">Suivi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-emerald-900/30">
                    {monthDays.map((d) => (
                      <tr
                        key={d.dateStr}
                        onClick={() => setSelectedDayStr(d.dateStr)}
                        className={`hover:bg-neutral-50 dark:hover:bg-emerald-950/40 cursor-pointer transition ${
                          d.isToday
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 font-bold'
                            : d.isFriday
                            ? 'bg-emerald-50/20 dark:bg-[#13281E]'
                            : ''
                        }`}
                      >
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={d.isToday ? 'text-amber-600 dark:text-amber-400 font-black' : ''}>
                            {d.dayNameShort} {d.dayNumber}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                          {d.hijri.day} {d.hijri.monthName.slice(0, 10)}
                        </td>
                        <td className="py-2 px-3 font-mono">{d.prayers.F}</td>
                        <td className="py-2 px-3 font-mono">{d.prayers.D}</td>
                        <td className="py-2 px-3 font-mono">{d.prayers.A}</td>
                        <td className="py-2 px-3 font-mono">{d.prayers.M}</td>
                        <td className="py-2 px-3 font-mono">{d.prayers.I}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.completedCount === 5
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : d.completedCount > 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {d.completedCount}/5
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            TAB 2 : GRAPHIQUE & SUIVI DÉTAILLÉ DES PRIÈRES
           ===================================================== */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-[#183225] p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-emerald-700/40 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
                  <span>Assiduité Globale</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {monthStats.completionRate}%
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  {monthStats.totalPrayersCompleted} sur {monthStats.totalPrayersExpected} prières dues
                </div>
              </div>

              <div className="bg-white dark:bg-[#183225] p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-emerald-700/40 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
                  <span>Série Active (Streak)</span>
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                  {monthStats.streakDays} jours
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Jours consécutifs avec prières
                </div>
              </div>

              <div className="bg-white dark:bg-[#183225] p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-emerald-700/40 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
                  <span>Jours Parfaits (5/5)</span>
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                  {monthStats.perfectDaysCount}
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Sur {monthStats.elapsedDays} jours écoulés
                </div>
              </div>

              <div className="bg-white dark:bg-[#183225] p-4 sm:p-5 rounded-3xl border border-neutral-200 dark:border-emerald-700/40 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold">
                  <span>Prière Phare</span>
                  <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                  {PRAYER_METADATA[monthStats.bestPrayerKey].label}
                </div>
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  {monthStats.perPrayer[monthStats.bestPrayerKey].rate}% de régularité
                </div>
              </div>
            </div>

            {/* Dynamic Daily Bar Chart (1 to 31) */}
            <div className="bg-white dark:bg-[#183225] p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-emerald-700/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    Graphique d'Assiduité Quotidienne (Nombre de prières par jour)
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Chaque barre représente les prières effectuées (de 0 à 5) du 1er au dernier jour
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-500" />
                    <span>5/5 (Complet)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-md bg-amber-400" />
                    <span>1 à 4/5</span>
                  </div>
                </div>
              </div>

              {/* Responsive Bar Chart Canvas */}
              <div className="pt-6 pb-2">
                <div className="flex items-end gap-1 sm:gap-1.5 h-44 w-full px-1 border-b border-neutral-200 dark:border-emerald-800/60">
                  {monthDays.map((d) => {
                    const heightPercent = (d.completedCount / 5) * 100;
                    const isPerfect = d.completedCount === 5;
                    const isPartial = d.completedCount > 0 && d.completedCount < 5;

                    return (
                      <div
                        key={d.dateStr}
                        onClick={() => {
                          setSelectedDayStr(d.dateStr);
                          setActiveTab('calendar');
                        }}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                        title={`${d.dayNameShort} ${d.dayNumber}: ${d.completedCount}/5 prières`}
                      >
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-neutral-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-20 shadow-md">
                          {d.dayNumber} {monthNameCapitalized} : {d.completedCount}/5
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${Math.max(heightPercent, d.isFuture ? 0 : 4)}%` }}
                          className={`w-full rounded-t-md transition-all group-hover:brightness-110 ${
                            isPerfect
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-2xs'
                              : isPartial
                              ? 'bg-gradient-to-t from-amber-500 to-amber-300'
                              : d.isFuture
                              ? 'bg-neutral-200/40 dark:bg-neutral-800/30'
                              : 'bg-neutral-200 dark:bg-neutral-700'
                          } ${d.isToday ? 'ring-2 ring-amber-400' : ''}`}
                        />

                        {/* Day number below axis */}
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold mt-2 ${
                            d.isToday
                              ? 'text-amber-600 dark:text-amber-400 font-black'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {d.dayNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Per-Prayer Breakdown (Fajr, Dhuhr, Asr, Maghrib, Isha) */}
            <div className="bg-white dark:bg-[#183225] p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-emerald-700/40 shadow-xs space-y-4">
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                Régularité par Prière
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {(['F', 'D', 'A', 'M', 'I'] as PrayerKey[]).map((k) => {
                  const stat = monthStats.perPrayer[k];
                  const meta = PRAYER_METADATA[k];
                  return (
                    <div
                      key={k}
                      className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#12251C] border border-neutral-200 dark:border-emerald-800/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-black text-neutral-900 dark:text-white">
                            {meta.label}
                          </div>
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-arabic">
                            {meta.arabic}
                          </div>
                        </div>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {stat.rate}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                        <div
                          style={{ width: `${stat.rate}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        />
                      </div>

                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400">
                        {stat.count} sur {stat.total} jours
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spiritual Advice according to stats */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#0F2B1C] to-emerald-900 text-white border border-emerald-500/30 flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-amber-200">
                  Conseil Spirituel du Mois • La Constance dans la Salât
                </h4>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  Le Prophète Muhammad (ﷺ) a dit : « L'œuvre la plus aimée d'Allah est la prière accomplie en son temps. »
                  Votre suivi mensuel est automatiquement sauvegardé sur votre appareil et dans votre profil spirituel.
                  Chaque prière cochée fortifie votre lien avec le Créateur.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
