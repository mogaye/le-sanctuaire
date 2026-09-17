import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Volume2, CheckCircle, Sparkles } from 'lucide-react';
import { PRAYERS, PRAYER_STEPS } from '../data/islamicData';
import { PrayerIllustration, PrayerPostureKey } from './PrayerIllustration';

interface PrayerGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrayerKey?: 'F' | 'D' | 'A' | 'M' | 'I';
}

export const PrayerGuideModal: React.FC<PrayerGuideModalProps> = ({
  isOpen,
  onClose,
  initialPrayerKey = 'F',
}) => {
  const [selectedKey, setSelectedKey] = useState<'F' | 'D' | 'A' | 'M' | 'I'>(initialPrayerKey);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [modalCharacterView, setModalCharacterView] = useState<'posture' | 'full'>('posture');

  if (!isOpen) return null;

  const currentPrayer = PRAYERS.find((p) => p.key === selectedKey) || PRAYERS[0];
  const currentStep = PRAYER_STEPS[currentStepIndex];

  const getPostureKey = (stepNum: number): PrayerPostureKey => {
    switch (stepNum) {
      case 1: return 'takbir';
      case 2: return 'qiyam';
      case 3: return 'ruku';
      case 4: return 'itidal';
      case 5: return 'sujud';
      case 6: return 'julus';
      case 7: return 'tashahhud';
      case 8: return 'taslim';
      default: return 'niyyah';
    }
  };

  // Speech synthesis for Arabic pronunciation
  const playArabicAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden bg-white dark:bg-[#193226] rounded-2xl sm:rounded-[32px] border border-neutral-200 dark:border-emerald-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-5 border-b border-neutral-200 dark:border-emerald-800/40 gap-2">
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white truncate">
                Guide de la Prière
              </h2>
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                Pas-à-Pas
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 font-medium truncate">
              Gestes, récitations et invocations authentiques.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] flex items-center justify-center text-neutral-800 dark:text-white transition cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Prayer Selector Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-8 pt-3 pb-2 border-b border-neutral-200 dark:border-emerald-800/40 overflow-x-auto no-scrollbar">
          {PRAYERS.map((p) => {
            const isSelected = selectedKey === p.key;
            return (
              <button
                key={p.key}
                onClick={() => {
                  setSelectedKey(p.key);
                  setCurrentStepIndex(0);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition cursor-pointer flex-shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-2xs ring-2 ring-emerald-500'
                    : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-[#102018]'
                }`}
              >
                <span>{p.name}</span>
                <span className="font-arabic text-xs sm:text-sm opacity-90">{p.arabicName}</span>
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-white/20">
                  {p.rakats}R
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-3.5 sm:p-8 overflow-y-auto flex-1 space-y-4 sm:space-y-6 no-scrollbar">
          {/* Active Prayer Info Banner */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 flex items-center justify-between gap-2">
            <div className="min-w-0 truncate">
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                {currentPrayer.name} ({currentPrayer.arabicName})
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-medium truncate">
                {currentPrayer.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] sm:text-xs font-bold text-neutral-500 dark:text-neutral-400 block">Étape</span>
              <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                {currentStepIndex + 1} / {PRAYER_STEPS.length}
              </span>
            </div>
          </div>

          {/* Current Step Card with Realistic Character Illustration */}
          <div className="rounded-2xl sm:rounded-3xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 p-4 sm:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Posture & Récitation
              </span>
              <button
                onClick={() => playArabicAudio(currentStep.arabic)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition cursor-pointer shadow-2xs shrink-0 active:scale-95 ${
                  isPlayingAudio
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isPlayingAudio ? 'Écoute...' : 'Écouter'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
              {/* Realistic Character Illustration Panel */}
              <div className="md:col-span-5 bg-white dark:bg-[#193226] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-neutral-200 dark:border-emerald-500/25 flex flex-col items-center justify-center text-center shadow-2xs">
                {/* View switcher */}
                <div className="inline-flex p-0.5 rounded-xl bg-neutral-100 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 mb-2 text-[10px] font-bold">
                  <button
                    onClick={() => setModalCharacterView('posture')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      modalCharacterView === 'posture'
                        ? 'bg-white dark:bg-[#193226] text-emerald-900 dark:text-emerald-200 shadow-2xs border border-neutral-200 dark:border-emerald-500/20'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Posture
                  </button>
                  <button
                    onClick={() => setModalCharacterView('full')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      modalCharacterView === 'full'
                        ? 'bg-white dark:bg-[#193226] text-emerald-900 dark:text-emerald-200 shadow-2xs border border-neutral-200 dark:border-emerald-500/20'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Plein Pied
                  </button>
                </div>

                <PrayerIllustration
                  posture={modalCharacterView === 'posture' ? getPostureKey(currentStep.step) : 'standing_full'}
                  className="w-36 h-48 sm:w-52 sm:h-64"
                  accentColor="#059669"
                  isAnimated={true}
                  showSandals={modalCharacterView === 'full'}
                />
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mt-2 bg-emerald-50 dark:bg-emerald-950/60 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                  {modalCharacterView === 'posture' ? currentStep.posture : 'Modèle Réaliste : Thobe blanc, Kufi'}
                </span>
              </div>

              {/* Text, Arabic & Translation Panel */}
              <div className="md:col-span-7 space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white">
                  {currentStep.title}
                </h4>

                {/* Arabic Script */}
                <div className="bg-white dark:bg-[#193226] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-emerald-500/25 text-center">
                  <p className="font-arabic text-lg sm:text-2xl text-neutral-900 dark:text-white font-medium leading-relaxed">
                    {currentStep.arabic}
                  </p>
                </div>

                {/* Phonetic & Meaning */}
                <div className="space-y-2">
                  <div className="text-[10px] sm:text-xs text-neutral-600 dark:text-neutral-400 uppercase font-bold tracking-wider">Phonétique</div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-300 italic bg-white dark:bg-[#193226] p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-emerald-500/25">
                    « {currentStep.phonetic} »
                  </p>

                  <div className="text-[10px] sm:text-xs text-neutral-600 dark:text-neutral-400 uppercase font-bold tracking-wider pt-0.5">Traduction</div>
                  <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#193226] p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-neutral-200 dark:border-emerald-500/25 font-medium">
                    {currentStep.french}
                  </p>
                </div>
              </div>
            </div>

            {/* Posture Details & Instructions */}
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 text-xs text-neutral-800 dark:text-neutral-200 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{currentStep.details}</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-t border-neutral-200 dark:border-emerald-800/40 bg-white dark:bg-[#193226] transition-colors">
          <button
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-neutral-300 dark:border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#14281E] transition cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span>Précédent</span>
          </button>

          {/* Dots on sm screens, counter text on mobile */}
          <div className="hidden sm:flex gap-1.5">
            {PRAYER_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStepIndex
                    ? 'w-6 bg-emerald-600'
                    : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
          <span className="sm:hidden text-xs font-bold text-neutral-600 dark:text-neutral-400">
            {currentStepIndex + 1} / {PRAYER_STEPS.length}
          </span>

          <button
            disabled={currentStepIndex === PRAYER_STEPS.length - 1}
            onClick={() => setCurrentStepIndex((prev) => Math.min(PRAYER_STEPS.length - 1, prev + 1))}
            className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-800 dark:bg-emerald-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-700 transition cursor-pointer active:scale-95"
          >
            <span>Suivant</span>
            <ChevronRight className="w-4 h-4 text-emerald-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
