import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, ChevronDown, Check, Bookmark } from 'lucide-react';
import { CompleteSurahItem } from '../data/quranSurahs';
import { RECITERS } from '../data/islamicData';
import { Reciter } from '../types';

interface SidebarAudioControlProps {
  surah: CompleteSurahItem;
  isPlayingAudio: boolean;
  onToggleAudio: () => void;
  selectedReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  bookmarkedCount: number;
  isDark?: boolean;
}

export const SidebarAudioControl: React.FC<SidebarAudioControlProps> = ({
  surah,
  isPlayingAudio,
  onToggleAudio,
  selectedReciter,
  onSelectReciter,
  bookmarkedCount,
  isDark = false,
}) => {
  const [isOpenReciters, setIsOpenReciters] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenReciters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`rounded-2xl p-3.5 space-y-3 border transition-colors ${
        isDark
          ? 'bg-[#14281E] border-emerald-500/25'
          : 'bg-[#F8FAFC] border-neutral-200/90'
      }`}
    >
      {/* Top row: Current Reciter & Play Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpenReciters(!isOpenReciters)}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border text-left text-xs transition cursor-pointer ${
              isDark
                ? 'bg-[#193226] border-emerald-500/30 text-white hover:border-emerald-400/50'
                : 'bg-white border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <div className="truncate">
                <span
                  className={`block text-[10px] font-medium leading-none ${
                    isDark ? 'text-emerald-300/70' : 'text-neutral-500'
                  }`}
                >
                  Récitateur
                </span>
                <span
                  className={`block text-xs font-bold truncate mt-0.5 ${
                    isDark ? 'text-white' : 'text-neutral-800'
                  }`}
                >
                  {selectedReciter.name}
                </span>
              </div>
            </div>
            <ChevronDown className={`w-3 h-3 shrink-0 ${isDark ? 'text-emerald-300/70' : 'text-neutral-400'}`} />
          </button>

          {/* Reciter Dropdown */}
          {isOpenReciters && (
            <div
              className={`absolute top-full left-0 right-0 mt-1 z-30 rounded-xl shadow-xl p-1 space-y-0.5 max-h-48 overflow-y-auto border ${
                isDark
                  ? 'bg-[#193226] border-emerald-500/30 shadow-emerald-950/60'
                  : 'bg-white border-neutral-200 shadow-lg'
              }`}
            >
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onSelectReciter(r);
                    setIsOpenReciters(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                    r.id === selectedReciter.id
                      ? isDark
                        ? 'bg-emerald-800 text-white font-semibold'
                        : 'bg-neutral-900 text-white font-semibold'
                      : isDark
                      ? 'hover:bg-[#14281E] text-neutral-200'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <span className="truncate">{r.name}</span>
                  {r.id === selectedReciter.id && (
                    <Check className={`w-3 h-3 shrink-0 ml-1 ${isDark ? 'text-amber-300' : 'text-emerald-400'}`} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={onToggleAudio}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer ${
            isPlayingAudio
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : isDark
              ? 'bg-emerald-800 text-white hover:bg-emerald-700 border border-emerald-500/30'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}
          title={isPlayingAudio ? 'Pause' : 'Écouter'}
        >
          {isPlayingAudio ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Bottom stats row: Bookmark counter and active surah hint */}
      <div
        className={`flex items-center justify-between text-[11px] pt-1 border-t ${
          isDark ? 'border-emerald-500/20 text-emerald-300/70' : 'border-neutral-200/70 text-neutral-500'
        }`}
      >
        <span className="truncate">Sourate {surah.number} • {surah.numberOfAyahs} v.</span>
        <div
          className={`flex items-center gap-1 font-medium ${
            isDark ? 'text-amber-300' : 'text-amber-700'
          }`}
        >
          <Bookmark className={`w-3 h-3 ${isDark ? 'fill-amber-400/20 text-amber-300' : 'fill-amber-500/20 text-amber-600'}`} />
          <span>{bookmarkedCount} signet{bookmarkedCount > 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};
