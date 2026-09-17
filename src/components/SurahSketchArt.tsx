import React from 'react';

interface SurahSketchArtProps {
  surahNumber: number;
  theme?: string;
  className?: string;
}

export const SurahSketchArt: React.FC<SurahSketchArtProps> = ({
  surahNumber,
  theme = 'spiritual',
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-[#193226] dark:to-[#14281E] p-6 border border-neutral-200/80 dark:border-emerald-500/25 transition-colors ${className}`}
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#15803d_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Geometric Ornamental Medallion */}
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600/40 dark:border-emerald-500/50 flex items-center justify-center bg-white dark:bg-[#12241B] shadow-xs mb-3 transition-colors">
          <span className="text-xl font-serif font-bold text-emerald-800 dark:text-emerald-300">
            {surahNumber}
          </span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
          Sourate {surahNumber}
        </span>
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 capitalize mt-0.5">
          {theme}
        </span>
      </div>
    </div>
  );
};
