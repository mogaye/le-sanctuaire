import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Clock,
  RotateCcw,
  Check,
  Sunrise,
  Sun,
  SunMedium,
  Sunset,
  Moon,
  Info,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { CityData, Method } from '../types';
import { METHODS } from '../data/islamicData';

export interface PrayerOffsets {
  F: number;
  D: number;
  A: number;
  M: number;
  I: number;
}

interface PrayerTimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: CityData;
  selectedMethod: Method;
  onSelectMethod: (method: Method) => void;
  offsets: PrayerOffsets;
  onSaveOffsets: (newOffsets: PrayerOffsets, asrMethod: 'standard' | 'hanafi') => void;
  currentAsrMethod: 'standard' | 'hanafi';
}

export function adjustTime(timeStr: string, offsetMinutes: number): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  let totalMinutes = h * 60 + m + offsetMinutes;
  totalMinutes = (totalMinutes + 24 * 60) % (24 * 60);
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export const PrayerTimeSettingsModal: React.FC<PrayerTimeSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  selectedMethod,
  onSelectMethod,
  offsets,
  onSaveOffsets,
  currentAsrMethod,
}) => {
  const [localOffsets, setLocalOffsets] = useState<PrayerOffsets>({ ...offsets });
  const [localAsrMethod, setLocalAsrMethod] = useState<'standard' | 'hanafi'>(currentAsrMethod);
  const [localMethod, setLocalMethod] = useState<Method>(selectedMethod);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with props when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalOffsets({ ...offsets });
      setLocalAsrMethod(currentAsrMethod);
      setLocalMethod(selectedMethod);
      setSaveSuccess(false);
    }
  }, [isOpen, offsets, currentAsrMethod, selectedMethod]);

  if (!isOpen) return null;

  const handleOffsetChange = (key: keyof PrayerOffsets, delta: number) => {
    setLocalOffsets((prev) => {
      const current = prev[key];
      const nextVal = Math.max(-180, Math.min(180, current + delta));
      return { ...prev, [key]: nextVal };
    });
  };

  const handleDirectTimeChange = (key: keyof PrayerOffsets, baseTime: string, newTimeStr: string) => {
    if (!newTimeStr || !newTimeStr.includes(':')) return;
    const parts = newTimeStr.split(':');
    const newH = parseInt(parts[0], 10);
    const newM = parseInt(parts[1], 10);
    if (isNaN(newH) || isNaN(newM)) return;

    const baseParts = baseTime.split(':');
    const baseH = parseInt(baseParts[0], 10);
    const baseM = parseInt(baseParts[1], 10);
    if (isNaN(baseH) || isNaN(baseM)) return;

    let diffMinutes = (newH * 60 + newM) - (baseH * 60 + baseM);
    // Wrap around midnight if needed (-12h to +12h)
    if (diffMinutes > 720) diffMinutes -= 1440;
    if (diffMinutes < -720) diffMinutes += 1440;

    // Allow up to +/- 180 minutes
    const clampedOffset = Math.max(-180, Math.min(180, diffMinutes));
    setLocalOffsets((prev) => ({ ...prev, [key]: clampedOffset }));
  };

  const handleResetSingle = (key: keyof PrayerOffsets) => {
    setLocalOffsets((prev) => ({ ...prev, [key]: 0 }));
  };

  const handleReset = () => {
    setLocalOffsets({ F: 0, D: 0, A: 0, M: 0, I: 0 });
    setLocalAsrMethod('standard');
    setSaveSuccess(false);
  };

  const handleSave = () => {
    onSelectMethod(localMethod);
    onSaveOffsets(localOffsets, localAsrMethod);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const prayerConfigs = [
    {
      key: 'F' as const,
      name: 'Fajr',
      arabic: 'الفجر',
      icon: Sunrise,
      color: 'text-[#153426]',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      key: 'D' as const,
      name: 'Zuhr (Dhuhr)',
      arabic: 'الظهر',
      icon: Sun,
      color: 'text-[#B07F2E]',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      key: 'A' as const,
      name: 'Asr',
      arabic: 'العصر',
      icon: SunMedium,
      color: 'text-[#1D4A3C]',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
    },
    {
      key: 'M' as const,
      name: 'Maghrib',
      arabic: 'المغرب',
      icon: Sunset,
      color: 'text-[#B55D28]',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      key: 'I' as const,
      name: 'Isha',
      arabic: 'العشاء',
      icon: Moon,
      color: 'text-[#142330]',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className="bg-white dark:bg-[#193226] rounded-2xl sm:rounded-[32px] max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#DFE7E2] dark:border-emerald-500/25 flex flex-col no-scrollbar transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-5 border-b border-[#E8EFEA] dark:border-emerald-800/40 flex items-center justify-between z-10 gap-2 transition-colors">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#EAF2EC] dark:bg-emerald-950/60 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 truncate">
              <h3 className="text-base sm:text-lg font-bold text-[#112318] dark:text-white leading-tight truncate">
                Ajuster les Heures
              </h3>
              <p className="text-[11px] sm:text-xs text-[#4F6858] dark:text-neutral-400 truncate">
                {selectedCity.name}, {selectedCity.country}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] text-neutral-600 dark:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1">
          
          {/* Info Banner */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 dark:from-emerald-950/50 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-500/25 flex items-start gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-100/80 dark:bg-emerald-900/60 border border-emerald-300/60 dark:border-emerald-500/30 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0 mt-0.5">
              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="text-[11px] sm:text-xs text-[#20402E] dark:text-neutral-300 leading-relaxed space-y-0.5 sm:space-y-1">
              <p className="font-bold text-[#11271B] dark:text-white">
                Saisie directe ou réglage fin minute par minute
              </p>
              <p>
                Tapez directement l'heure ou ajustez le décalage avec les boutons <span className="font-semibold">-1 / +1 / -5 / +5 min</span> selon l'horaire de votre mosquée.
              </p>
            </div>
          </div>

          {/* 1. Offsets per prayer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Ajustement des Horaires
              </h4>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Format 24 heures</span>
              </span>
            </div>

            <div className="space-y-3">
              {prayerConfigs.map((item) => {
                const baseTime = selectedCity.prayers[item.key];
                const offset = localOffsets[item.key];
                const adjusted = adjustTime(baseTime, offset);
                const IconComponent = item.icon;

                return (
                  <div
                    key={item.key}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#FAFBF9] dark:bg-[#14281E] border border-[#E1EAE4] dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Icon & Name & Base Time */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className={`w-10 h-10 rounded-2xl ${item.bg} dark:bg-emerald-950/60 border ${item.border} dark:border-emerald-500/30 flex items-center justify-center ${item.color} dark:text-emerald-300 shrink-0`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-neutral-900 dark:text-white leading-tight flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-serif font-normal">
                            ({item.arabic})
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                          <span>Calcul base :</span>
                          <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-[#193226] px-1.5 py-0.5 rounded">
                            {baseTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Direct Input & Stepper controls */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
                      
                      {/* Direct Time Typing Input */}
                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor={`time-input-${item.key}`}
                          className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium sm:hidden"
                        >
                          Heure :
                        </label>
                        <div className="relative flex items-center group">
                          <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 group-hover:text-emerald-600 absolute left-2.5 pointer-events-none transition-colors" />
                          <input
                            id={`time-input-${item.key}`}
                            type="time"
                            value={adjusted}
                            onChange={(e) => handleDirectTimeChange(item.key, baseTime, e.target.value)}
                            className="w-28 pl-8 pr-2 py-1.5 bg-white dark:bg-[#193226] border border-[#CDDBD2] dark:border-emerald-500/30 hover:border-emerald-500 focus:border-emerald-600 rounded-xl font-mono text-sm font-extrabold text-neutral-900 dark:text-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-text"
                            title="Tapez directement l'heure souhaitée au clavier ou cliquez sur l'horloge"
                          />
                        </div>
                      </div>

                      {/* Stepper buttons: -5, -1, badge, +1, +5 */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOffsetChange(item.key, -5)}
                          className="px-1.5 py-1 rounded-lg bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 hover:bg-neutral-100 dark:hover:bg-[#102018] hover:border-neutral-300 active:scale-95 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold transition-all cursor-pointer select-none"
                          title="Reculer de 5 minutes"
                        >
                          -5m
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOffsetChange(item.key, -1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 hover:bg-neutral-100 dark:hover:bg-[#102018] hover:border-neutral-300 active:scale-95 text-neutral-700 dark:text-neutral-200 font-bold flex items-center justify-center transition-all cursor-pointer select-none text-xs"
                          title="Reculer de 1 minute"
                        >
                          -1
                        </button>

                        {/* Offset badge */}
                        <div
                          className={`min-w-[50px] px-2 py-1 rounded-lg text-center text-[11px] font-bold border transition-colors ${
                            offset === 0
                              ? 'bg-neutral-100 dark:bg-[#193226] text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-emerald-500/25'
                              : offset > 0
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/30'
                          }`}
                          title={`Décalage par rapport à la base : ${offset} minutes`}
                        >
                          {offset > 0 ? `+${offset}m` : offset < 0 ? `${offset}m` : '0m'}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOffsetChange(item.key, 1)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 hover:bg-neutral-100 dark:hover:bg-[#102018] hover:border-neutral-300 active:scale-95 text-neutral-700 dark:text-neutral-200 font-bold flex items-center justify-center transition-all cursor-pointer select-none text-xs"
                          title="Avancer de 1 minute"
                        >
                          +1
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOffsetChange(item.key, 5)}
                          className="px-1.5 py-1 rounded-lg bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 hover:bg-neutral-100 dark:hover:bg-[#102018] hover:border-neutral-300 active:scale-95 text-neutral-600 dark:text-neutral-300 text-[11px] font-semibold transition-all cursor-pointer select-none"
                          title="Avancer de 5 minutes"
                        >
                          +5m
                        </button>

                        {offset !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleResetSingle(item.key)}
                            className="w-7 h-7 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-[#193226] flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                            title="Réinitialiser cette prière à l'heure de base"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Juristic School for Asr */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-emerald-800/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Méthode Juridique pour l'Asr
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalAsrMethod('standard')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  localAsrMethod === 'standard'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/30'
                    : 'bg-[#FAFBF9] dark:bg-[#14281E] border-neutral-200 dark:border-emerald-500/20 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#102018]'
                }`}
              >
                <div className="text-xs">Standard (Majorité)</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal mt-0.5">
                  Chafi'i, Maliki, Hanbali (ombre = 1x)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocalAsrMethod('hanafi')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  localAsrMethod === 'hanafi'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/30'
                    : 'bg-[#FAFBF9] dark:bg-[#14281E] border-neutral-200 dark:border-emerald-500/20 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#102018]'
                }`}
              >
                <div className="text-xs">Hanafi</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal mt-0.5">
                  École Hanafite (ombre = 2x, plus tardif)
                </div>
              </button>
            </div>
          </div>

          {/* 3. Astronomical Calculation Method */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-emerald-800/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Convention de Calcul des Angles
            </h4>
            <div className="space-y-1.5">
              {METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setLocalMethod(method)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between border transition-colors cursor-pointer ${
                    localMethod.id === method.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/40 font-bold'
                      : 'bg-[#FAFBF9] dark:bg-[#14281E] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-emerald-500/20 hover:bg-neutral-100 dark:hover:bg-[#102018]'
                  }`}
                >
                  <span>{method.fullName}</span>
                  {localMethod.id === method.id && (
                    <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-md px-3.5 sm:px-6 py-3 sm:py-4 border-t border-[#E8EFEA] dark:border-emerald-800/40 flex items-center justify-between gap-2 transition-colors">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#14281E] transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Réinitialiser</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-neutral-200 dark:border-emerald-500/30 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#14281E] transition-colors cursor-pointer active:scale-95"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Enregistrer les Ajustements</span>
                  <span className="sm:hidden">Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
