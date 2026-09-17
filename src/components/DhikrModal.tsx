import React, { useState } from 'react';
import { X, RotateCcw, Sparkles, Check } from 'lucide-react';
import { DHIKR_LIST } from '../data/islamicData';
import { DhikrItem } from '../types';

interface DhikrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DhikrModal: React.FC<DhikrModalProps> = ({ isOpen, onClose }) => {
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrItem>(DHIKR_LIST[0]);
  const [count, setCount] = useState<number>(0);
  const [totalCompleted, setTotalCompleted] = useState<number>(0);

  if (!isOpen) return null;

  const handleIncrement = () => {
    if (count + 1 >= selectedDhikr.targetCount) {
      setCount(0);
      setTotalCompleted((prev) => prev + 1);
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 650;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch {
        // audio context ignored if blocked
      }
    } else {
      setCount((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-[#193226] rounded-2xl sm:rounded-[32px] border border-neutral-200 dark:border-emerald-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-5 border-b border-neutral-200 dark:border-emerald-800/40 gap-2">
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-xl font-bold text-neutral-900 dark:text-white truncate">
                Tasbih & Invocations
              </h2>
              <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/30 shrink-0">
                Adhkar
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 font-medium truncate">
              Chapelet interactif et invocations prophétiques authentiques.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] flex items-center justify-center text-neutral-800 dark:text-white transition cursor-pointer active:scale-95 shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-8 overflow-y-auto space-y-4 sm:space-y-8 flex-1 no-scrollbar">
          {/* Interactive Digital Tasbih Counter Widget */}
          <div className="rounded-2xl sm:rounded-3xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 p-4 sm:p-8 flex flex-col items-center justify-center text-center relative">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-500/30 px-2.5 sm:px-3 py-0.5 rounded-full mb-1 sm:mb-2">
              Chapelet Digital
            </span>

            {/* Arabic selected formula */}
            <p className="font-arabic text-xl sm:text-3xl text-neutral-900 dark:text-white font-medium my-1 sm:my-2">
              {selectedDhikr.arabic}
            </p>
            <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
              {selectedDhikr.transliteration}
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-700 dark:text-neutral-300 italic mt-0.5 max-w-md font-medium">
              {selectedDhikr.translation}
            </p>

            {/* Giant Circular Click Button */}
            <div className="mt-4 sm:mt-8 mb-3 sm:mb-4 relative">
              <button
                onClick={handleIncrement}
                className="w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-[0_12px_36px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center transition-transform transform active:scale-95 cursor-pointer select-none group border-4 border-white dark:border-emerald-950/60"
              >
                <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {count}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-200 mt-1">
                  Sur {selectedDhikr.targetCount}
                </span>
                <span className="text-[9px] sm:text-[10px] text-white/80 mt-0.5 sm:mt-1">Appuyer</span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#193226] transition cursor-pointer border border-neutral-300 dark:border-emerald-500/30 bg-white dark:bg-[#14281E] active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                <span>Réinitialiser</span>
              </button>

              {totalCompleted > 0 && (
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  Complétées : {totalCompleted}
                </span>
              )}
            </div>
          </div>

          {/* Adhkar Selector List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Sélectionner une invocation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {DHIKR_LIST.map((item) => {
                const isSelected = selectedDhikr.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedDhikr(item);
                      setCount(0);
                    }}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-600 shadow-xs ring-2 ring-purple-500'
                        : 'bg-white dark:bg-[#193226] border-neutral-200 dark:border-emerald-500/20 text-neutral-900 dark:text-white hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold">{item.transliteration}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white border border-white/30'
                            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                        }`}
                      >
                        {item.targetCount}x
                      </span>
                    </div>
                    <p className="font-arabic text-lg my-1">{item.arabic}</p>
                    <p
                      className={`text-xs line-clamp-1 font-medium ${
                        isSelected ? 'opacity-90 text-white' : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {item.translation}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
