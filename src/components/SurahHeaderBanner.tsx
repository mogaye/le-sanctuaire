import React from 'react';
import { Play, Pause, Volume2, Sparkles, BookOpen } from 'lucide-react';
import { CompleteSurahItem } from '../data/quranSurahs';

interface SurahHeaderBannerProps {
  surah: CompleteSurahItem;
  isPlayingAudio: boolean;
  onToggleAudio: () => void;
  reciterName: string;
  isDark?: boolean;
}

export const SurahHeaderBanner: React.FC<SurahHeaderBannerProps> = ({
  surah,
  isPlayingAudio,
  onToggleAudio,
  reciterName,
  isDark = false,
}) => {
  return (
    <div
      className={`relative shrink-0 w-full min-h-[120px] overflow-hidden rounded-2xl md:rounded-3xl border p-5 sm:p-7 md:p-8 mb-8 shadow-xs select-none transition-colors ${
        isDark
          ? 'bg-gradient-to-br from-[#193226] via-[#152A20] to-[#12241B] border-emerald-500/25 shadow-emerald-950/40'
          : 'border-neutral-200/90 bg-gradient-to-br from-[#FAFCFA] via-white to-[#F2F7F4]'
      }`}
    >
      {/* Background Decorative Arabic Watermark */}
      <div
        className={`absolute -right-6 -top-6 select-none pointer-events-none text-7xl sm:text-8xl md:text-9xl font-arabic font-bold leading-none ${
          isDark ? 'text-emerald-400/10' : 'text-neutral-200/60 opacity-30'
        }`}
      >
        {surah.arabicName}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        {/* Left Side: Number, Badges & Titles */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shadow-xs shrink-0 ${
                isDark
                  ? 'bg-emerald-950 border border-emerald-500/30 text-amber-200'
                  : 'bg-neutral-950 text-white'
              }`}
            >
              {surah.number}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase border ${
                isDark
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
              }`}
            >
              {surah.revelationType}
            </span>
            <span className={`text-xs font-medium ${isDark ? 'text-emerald-300/70' : 'text-neutral-500'}`}>
              Juz {surah.juz} • {surah.numberOfAyahs} versets
            </span>
          </div>

          <div>
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight flex items-baseline gap-3 flex-wrap ${
                isDark ? 'text-white' : 'text-neutral-900'
              }`}
            >
              <span>{surah.name}</span>
              <span
                className={`text-base sm:text-lg font-normal font-sans ${
                  isDark ? 'text-emerald-200/70' : 'text-neutral-500'
                }`}
              >
                ({surah.frenchTranslation})
              </span>
            </h1>
          </div>
        </div>

        {/* Right Side: Arabic Calligraphy Badge & Audio Recitation Button */}
        <div
          className={`flex items-center justify-between md:justify-end gap-4 sm:gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 ${
            isDark ? 'border-emerald-500/20' : 'border-neutral-100'
          }`}
        >
          <div className="text-left md:text-right">
            <div
              className={`text-2xl sm:text-3xl md:text-4xl font-arabic font-bold tracking-wide leading-tight ${
                isDark ? 'text-amber-200' : 'text-neutral-900'
              }`}
              dir="rtl"
            >
              سُورَةُ {surah.arabicName}
            </div>
            <div
              className={`text-[11px] mt-1 flex items-center gap-1.5 md:justify-end ${
                isDark ? 'text-emerald-300/80' : 'text-neutral-500'
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-neutral-400'}`} />
              <span className="truncate max-w-[200px]">{reciterName}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleAudio}
            className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center transition-all shadow-md cursor-pointer ${
              isPlayingAudio
                ? isDark
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 ring-4 ring-emerald-500/30 scale-105'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 ring-4 ring-emerald-100 scale-105'
                : isDark
                ? 'bg-emerald-800 text-white hover:bg-emerald-700 border border-emerald-500/30 hover:scale-105'
                : 'bg-neutral-950 text-white hover:bg-neutral-800 hover:scale-105'
            }`}
            title={isPlayingAudio ? 'Mettre en pause' : 'Écouter la récitation'}
          >
            {isPlayingAudio ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
