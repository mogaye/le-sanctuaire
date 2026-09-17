import React from 'react';

interface BismillahCalligraphyProps {
  className?: string;
  showTranslation?: boolean;
  isDark?: boolean;
}

export const BismillahCalligraphy: React.FC<BismillahCalligraphyProps> = ({
  className = '',
  showTranslation = true,
  isDark = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-6 px-4 ${className}`}>
      {/* Decorative Top Accent */}
      <div className={`flex items-center gap-3 mb-3 ${isDark ? 'text-emerald-500/40' : 'text-neutral-300'}`}>
        <div className={`h-px w-12 bg-linear-to-r ${isDark ? 'from-transparent via-emerald-500/40 to-emerald-400/60' : 'from-transparent via-neutral-300 to-neutral-400'}`} />
        <span className={`text-xs font-serif ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>۞</span>
        <div className={`h-px w-12 bg-linear-to-l ${isDark ? 'from-transparent via-emerald-500/40 to-emerald-400/60' : 'from-transparent via-neutral-300 to-neutral-400'}`} />
      </div>

      {/* Main Arabic Calligraphy Text */}
      <div
        className={`font-arabic text-2xl sm:text-3xl md:text-4xl tracking-wide select-none leading-relaxed transition-colors ${
          isDark ? 'text-amber-200 drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]' : 'text-neutral-900'
        }`}
        dir="rtl"
        style={{ fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif" }}
      >
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </div>

      {/* Subtle Phonetic & Translation */}
      {showTranslation && (
        <div className="mt-3 space-y-0.5">
          <p className={`text-[11px] sm:text-xs italic font-serif ${isDark ? 'text-emerald-300/80' : 'text-neutral-600'}`}>
            Bi-smi llāhi r-raḥmāni r-raḥīm
          </p>
          <p className={`text-[11px] sm:text-xs font-medium max-w-md ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
            Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.
          </p>
        </div>
      )}

      {/* Decorative Bottom Accent */}
      <div className={`flex items-center gap-3 mt-3 ${isDark ? 'text-emerald-500/40' : 'text-neutral-300'}`}>
        <div className={`h-px w-16 bg-linear-to-r from-transparent ${isDark ? 'to-emerald-500/40' : 'to-neutral-300'}`} />
        <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-amber-400/60' : 'bg-neutral-300'}`} />
        <div className={`h-px w-16 bg-linear-to-l from-transparent ${isDark ? 'to-emerald-500/40' : 'to-neutral-300'}`} />
      </div>
    </div>
  );
};
