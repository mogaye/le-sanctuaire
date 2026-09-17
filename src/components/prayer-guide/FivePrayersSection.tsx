import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Award,
  AlertTriangle,
  Heart,
  Home,
  ArrowRight,
} from 'lucide-react';
import {
  FIVE_PRAYERS_SCHEDULE,
  PrayerInfoItem,
  SUPEREROGATORY_PRAYERS_DATA,
} from '../../data/prayerGuideDocument';
import { CityData } from '../../types';
import {
  calculatePrayerSchedule,
  formatTimeDigits,
  getCityCurrentDate,
} from '../../utils/timeUtils';

interface FivePrayersSectionProps {
  selectedCity: CityData;
  onSelectPrayer?: (key: 'F' | 'D' | 'A' | 'M' | 'I') => void;
  onNextChapter?: () => void;
}

export const FivePrayersSection: React.FC<FivePrayersSectionProps> = ({
  selectedCity,
  onSelectPrayer,
  onNextChapter,
}) => {
  const [subTab, setSubTab] = useState<'obligatoires' | 'rawatib'>('obligatoires');

  // Live ticking clock for selected city
  const [now, setNow] = useState<Date>(() => getCityCurrentDate(selectedCity.timezone));

  useEffect(() => {
    const tick = () => setNow(getCityCurrentDate(selectedCity.timezone));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [selectedCity.timezone]);

  const schedule = calculatePrayerSchedule(selectedCity.prayers, now);
  const liveClockString = formatTimeDigits(now, true);

  const getIcon = (key: string) => {
    switch (key) {
      case 'F':
        return <Sunrise className="w-5 h-5 text-amber-500" />;
      case 'D':
        return <Sun className="w-5 h-5 text-amber-600" />;
      case 'A':
        return <Sun className="w-5 h-5 text-orange-500" />;
      case 'M':
        return <Sunset className="w-5 h-5 text-rose-500" />;
      case 'I':
      default:
        return <Moon className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#122F20] to-[#0A1F15] text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[11px] sm:text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chapitre 1 • Horaires, Obligatoires & Sunan</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
            Les Prières Obligatoires & Surérogatoires selon la Sunnah
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Rythmez votre journée entre les 5 prières obligatoires (Farâ’idh) et les 12 unités surérogatoires régulières (As-Sunan ar-Rawâtib) pour lesquelles une demeure au Paradis est promise.
          </p>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex p-1 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 gap-1 shadow-2xs max-w-md mx-auto transition-colors">
        <button
          onClick={() => setSubTab('obligatoires')}
          className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
            subTab === 'obligatoires'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>5 Prières Obligatoires</span>
        </button>

        <button
          onClick={() => setSubTab('rawatib')}
          className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
            subTab === 'rawatib'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />
          <span>Les 12 Sunan Rawâtib</span>
        </button>
      </div>

      {/* VIEW 1: 5 OBLIGATORY PRAYERS */}
      {subTab === 'obligatoires' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header live status ticker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 px-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Heure locale à {selectedCity.name} : <strong className="font-mono text-emerald-900 dark:text-emerald-300">{liveClockString}</strong></span>
            </span>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              Prochaine prière : <strong>{schedule.nextPrayerTime}</strong> (dans {schedule.countdownFormatted})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {FIVE_PRAYERS_SCHEDULE.map((p) => {
              const cityTime = selectedCity.prayers[p.key];
              const isCurrent = p.key === schedule.currentPrayerKey;
              const isNext = p.key === schedule.nextPrayerKey;
              const isPast = schedule.isPastPrayer(p.key);

              return (
                <div
                  key={p.key}
                  onClick={() => onSelectPrayer && onSelectPrayer(p.key)}
                  className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden active:scale-98 shadow-xs ${
                    isCurrent
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/30 dark:bg-emerald-950/40'
                      : isNext
                      ? 'border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/20 shadow-xs'
                      : 'border-neutral-200 dark:border-emerald-500/25 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {getIcon(p.key)}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs animate-pulse">
                              En cours
                            </span>
                          )}
                          {isNext && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                              Prochaine
                            </span>
                          )}
                          {!isCurrent && !isNext && isPast && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                              Passée
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                            {p.number}
                          </span>
                        </div>
                        <span className="font-serif text-lg text-emerald-950 dark:text-amber-200 block mt-0.5">
                          {p.arabicName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        {p.name}
                      </h3>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                        {p.rakas} Rakas
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
                      {p.timeDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Heure à {selectedCity.name} :</span>
                    <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/30">
                      {cityTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Observation Note from PDF */}
          <div className="p-6 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/30 flex items-start gap-4 transition-colors">
            <div className="w-9 h-9 rounded-2xl bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0 font-bold text-sm">
              !
            </div>
            <div className="space-y-1.5 text-xs text-amber-950 dark:text-amber-100">
              <div className="font-bold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
                <span>Observation du Guide : La Glorification après chaque prière</span>
              </div>
              <p className="leading-relaxed">
                Il est grandement recommandé, après chaque prière obligatoire, d’effectuer la glorification que Fatima (Azzahrá, Aleiha Salam), fille du Prophète Mohammad (saw) accomplissait, enseignée par son propre père :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#14281E] border border-amber-200 dark:border-amber-500/30 text-center transition-colors">
                  <span className="block font-black text-amber-900 dark:text-amber-300 text-sm">33 fois</span>
                  <span className="font-arabic text-sm text-neutral-800 dark:text-amber-200 block">سُبْحَانَ اللَّهِ</span>
                  <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">Subhna Alláh (Dieu glorifié)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#14281E] border border-amber-200 dark:border-amber-500/30 text-center transition-colors">
                  <span className="block font-black text-amber-900 dark:text-amber-300 text-sm">33 fois</span>
                  <span className="font-arabic text-sm text-neutral-800 dark:text-amber-200 block">الْحَمْدُ لِلَّهِ</span>
                  <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">Al-Hamdu Lilláh (Loué soit Dieu)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#14281E] border border-amber-200 dark:border-amber-500/30 text-center transition-colors">
                  <span className="block font-black text-amber-900 dark:text-amber-300 text-sm">34 fois</span>
                  <span className="font-arabic text-sm text-neutral-800 dark:text-amber-200 block">اللَّهُ أَكْبَرُ</span>
                  <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">Alláhu Akbar (Dieu est le Plus Grand)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SUPEREROGATORY PRAYERS (RAWÂTIB) */}
      {subTab === 'rawatib' && (
        <div className="space-y-6">
          {/* Hadith Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#163B26] to-[#0C2216] text-white space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Home className="w-4 h-4" />
              <span>La Promesse Divine : Une Demeure Bâtie au Paradis</span>
            </div>
            <p className="font-arabic text-base sm:text-lg text-amber-100 text-right leading-relaxed">
              {SUPEREROGATORY_PRAYERS_DATA.hadithPromise.arabic}
            </p>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed italic">
              {SUPEREROGATORY_PRAYERS_DATA.hadithPromise.translation}
            </p>
            <span className="text-[11px] text-emerald-300 block font-medium">
              — {SUPEREROGATORY_PRAYERS_DATA.hadithPromise.source}
            </span>
          </div>

          {/* The Rawatib List Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Détail des Prières Surérogatoires liées aux offices obligatoires :
              </h3>
              <span className="text-xs font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                12 Rak‘ats quotidiennes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SUPEREROGATORY_PRAYERS_DATA.rawatibList.map((r, i) => (
                <div
                  key={i}
                  className="p-5 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-400 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {r.timing} {r.associatedFard}
                      </span>
                      <span className="font-arabic text-emerald-950 dark:text-amber-200 font-bold text-sm">
                        {r.arabicName}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <h4 className="font-black text-sm text-neutral-900 dark:text-white">{r.name}</h4>
                      <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/30">
                        {r.rakats} Rak‘ats
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {r.virtueHadith}
                    </p>
                  </div>

                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium block pt-2 border-t border-neutral-100 dark:border-emerald-800/40">
                    Source : {r.source}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Witr & Duha section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
            <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Autres Prières Volontaires Hautement Recommandées :</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUPEREROGATORY_PRAYERS_DATA.otherRecommendedPrayers.map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-500/30 space-y-2 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-emerald-950 dark:text-emerald-200">{p.name}</h4>
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                      {p.rakats}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Forbidden Times Warning */}
          <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 space-y-3 transition-colors">
            <div className="flex items-center gap-2 text-rose-950 dark:text-rose-200 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              <span>Horaires Interdits pour les Prières Surérogatoires Libres :</span>
            </div>
            <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
              Le Prophète (saw) a formellement déconseillé d’accomplir des prières surérogatoires volontaires sans cause précise lors de ces trois moments :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {SUPEREROGATORY_PRAYERS_DATA.forbiddenTimes.map((f, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white/80 dark:bg-[#14281E] border border-rose-200 dark:border-rose-500/30 space-y-1 transition-colors">
                  <span className="text-xs font-bold text-rose-950 dark:text-rose-200 block">{f.period}</span>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">{f.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation to next chapter */}
      {onNextChapter && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onNextChapter}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>Passer au Chapitre 2 : Éléments nécessaires & Pureté</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
};

