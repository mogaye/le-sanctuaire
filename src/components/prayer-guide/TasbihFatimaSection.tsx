import React, { useState } from 'react';
import { RotateCcw, Sparkles, Check, Volume2, Heart, ArrowLeft } from 'lucide-react';
import { FATIMA_TASBIH_DATA } from '../../data/prayerGuideDocument';

interface TasbihFatimaSectionProps {
  onPrevChapter?: () => void;
  onRestartGuide?: () => void;
}

export const TasbihFatimaSection: React.FC<TasbihFatimaSectionProps> = ({
  onPrevChapter,
  onRestartGuide,
}) => {
  const [currentSegment, setCurrentSegment] = useState<0 | 1 | 2>(0);
  const [count, setCount] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  const segments = FATIMA_TASBIH_DATA.items;
  const currentItem = segments[currentSegment];

  const handleIncrement = () => {
    // Light haptic vibration if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }

    if (count + 1 >= currentItem.count) {
      // Completed this segment
      if (currentSegment < 2) {
        setCurrentSegment((prev) => (prev + 1) as 1 | 2);
        setCount(0);
        setTotalCompleted((prev) => prev + 1);
      } else {
        // All done!
        setCount(currentItem.count);
        setTotalCompleted((prev) => prev + 1);
      }
    } else {
      setCount((prev) => prev + 1);
      setTotalCompleted((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentSegment(0);
    setCount(0);
    setTotalCompleted(0);
  };

  const playPronunciation = (arabicText: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(arabicText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isFinished = currentSegment === 2 && count === currentItem.count;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#122F20] to-[#0A1F15] text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[10px] sm:text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>Chapitre 9 • Après la Prière</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            {FATIMA_TASBIH_DATA.title}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            {FATIMA_TASBIH_DATA.subtitle}
          </p>
        </div>
      </div>

      {/* Interactive Tasbih Counter Card */}
      <div className="bg-white dark:bg-[#193226] rounded-2xl sm:rounded-[32px] p-4 sm:p-10 border border-neutral-200 dark:border-emerald-500/25 shadow-xs flex flex-col items-center justify-center text-center space-y-5 sm:space-y-6 max-w-2xl mx-auto transition-colors">
        
        {/* Segment Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
          {segments.map((item, idx) => {
            const isCurrent = currentSegment === idx;
            const isDone = currentSegment > idx || (idx === 2 && count === item.count);
            return (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSegment(idx as 0 | 1 | 2);
                  setCount(0);
                }}
                className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                  isCurrent
                    ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-700 shadow-xs ring-2 ring-emerald-400/40'
                    : isDone
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-neutral-50 dark:bg-[#14281E] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-emerald-500/20 hover:bg-neutral-100 dark:hover:bg-[#102018]'
                }`}
              >
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider opacity-70">
                  {item.count} fois
                </div>
                <div className="font-arabic text-xs sm:text-sm mt-0.5">{item.arabic}</div>
                <div className="text-[10px] sm:text-[11px] truncate mt-0.5">{item.phonetic}</div>
              </button>
            );
          })}
        </div>

        {/* Current Dhikr Display */}
        <div className="space-y-1.5 sm:space-y-2 py-2 sm:py-4">
          <div className="flex items-center justify-center gap-2">
            <span className="font-arabic text-2xl sm:text-4xl font-bold text-emerald-950 dark:text-emerald-200">
              {currentItem.arabic}
            </span>
            <button
              onClick={() => playPronunciation(currentItem.arabic)}
              className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 transition-colors"
              title="Prononciation"
            >
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
            {currentItem.phonetic}
          </div>
          <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            « {currentItem.french} » — {currentItem.description}
          </div>
        </div>

        {/* Interactive Counting Button */}
        <div className="relative">
          <button
            onClick={handleIncrement}
            disabled={isFinished}
            className={`w-36 h-36 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 select-none cursor-pointer border-4 ${
              isFinished
                ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 cursor-default'
                : 'bg-gradient-to-br from-[#153424] to-[#0A1F14] hover:from-[#1b432e] hover:to-[#0f2d1e] text-white border-emerald-500/40 shadow-emerald-900/20'
            }`}
          >
            {isFinished ? (
              <div className="space-y-2">
                <Check className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs sm:text-sm font-black uppercase">Terminé !</span>
                <span className="text-[10px] sm:text-[11px] opacity-80 block">100 / 100 accomplis</span>
              </div>
            ) : (
              <>
                <span className="text-4xl sm:text-6xl font-black font-mono tracking-tight">
                  {count}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300 mt-1">
                  sur {currentItem.count}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/60 mt-0.5 sm:mt-1">
                  Appuyez pour compter
                </span>
              </>
            )}
          </button>
        </div>

        {/* Total Progress Bar */}
        <div className="w-full space-y-1.5 pt-2">
          <div className="flex justify-between text-[11px] sm:text-xs font-bold text-neutral-600 dark:text-neutral-400">
            <span>Progression du Tasbih</span>
            <span className="font-mono text-emerald-800 dark:text-emerald-300">
              {Math.min(totalCompleted, 100)} / 100
            </span>
          </div>
          <div className="w-full h-2.5 sm:h-3 rounded-full bg-neutral-100 dark:bg-[#14281E] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
              style={{ width: `${Math.min((totalCompleted / 100) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pt-2 w-full justify-center">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>

          {onRestartGuide && (
            <button
              onClick={onRestartGuide}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <span>Recommencer le guide</span>
            </button>
          )}
        </div>
      </div>

      {/* Final Hadith / Spiritual note */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-500/30 text-[11px] sm:text-xs text-emerald-950 dark:text-emerald-200 text-center max-w-2xl mx-auto space-y-1">
        <div className="font-bold flex items-center justify-center gap-1.5 text-emerald-900 dark:text-emerald-300">
          <Heart className="w-3.5 h-3.5 text-emerald-700 fill-emerald-700 dark:text-emerald-400 dark:fill-emerald-400" />
          <span>Mérite de ce Tasbih</span>
        </div>
        <p className="leading-relaxed text-neutral-600 dark:text-neutral-300">
          Ce Tasbih apaise le cœur, efface les péchés et décuple les récompenses auprès du Seigneur des Mondes.
          Qu’Allah agrée vos prières et vos invocations.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        {onPrevChapter && (
          <button
            onClick={onPrevChapter}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] hover:bg-neutral-200 dark:hover:bg-[#14281E] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-500/20 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span>Chapitre 8 : Sourates Courtes & Règles de Voix</span>
          </button>
        )}
      </div>
    </div>
  );
};
