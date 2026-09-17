import React from 'react';
import { Clock, Heart, BookOpen, Compass, Sparkles, Moon, Sun, Library, Flame, Calendar } from 'lucide-react';

interface VerticalDockProps {
  activeSection: string;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenPrayerTimes: () => void;
  onOpenCalendar?: () => void;
  onOpenQuran: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
  onOpenFasting?: () => void;
  onOpenFaith?: () => void;
  onOpenLibrary?: () => void;
}

export const VerticalDock: React.FC<VerticalDockProps> = ({
  activeSection,
  isDarkMode,
  onToggleDarkMode,
  onOpenPrayerTimes,
  onOpenCalendar,
  onOpenQuran,
  onOpenQibla,
  onOpenDhikr,
  onOpenFasting,
  onOpenFaith,
  onOpenLibrary,
}) => {
  return (
    <aside className="hidden md:flex fixed left-3 sm:left-6 top-32 sm:top-36 z-30 flex-col items-center gap-3 select-none">
      {/* Main Capsule */}
      <div className="rounded-full bg-white dark:bg-[#13261C] border border-neutral-200/90 dark:border-emerald-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-1.5 sm:p-2 flex flex-col items-center gap-2.5 sm:gap-3 transition-colors">
        {/* 1. Clock (Prayer Times - Slate Blue) */}
        <button
          id="dock-btn-clock"
          onClick={onOpenPrayerTimes}
          title="Horaires de prière"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
        >
          <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
        </button>

        {/* 1b. Calendar (Monthly Prayer Calendar & Stats - Emerald) */}
        {onOpenCalendar && (
          <button
            id="dock-btn-calendar"
            onClick={onOpenCalendar}
            title="Calendrier & Suivi Mensuel des Prières"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
          >
            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
          </button>
        )}

        {/* 2. Heart (Active Center Pill - La Voie de la Sérénité) */}
        <button
          id="dock-btn-heart"
          title="La Voie de la Sérénité"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black dark:bg-emerald-900 text-white flex items-center justify-center shadow-md cursor-pointer transition transform hover:scale-105"
        >
          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-rose-400" />
        </button>

        {/* 3. Book (Quran - Indigo) */}
        <button
          id="dock-btn-book"
          onClick={onOpenQuran}
          title="Saint Coran"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
        >
          <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-600 dark:text-indigo-400 stroke-[2.2]" />
        </button>

        {/* 4. Fasting / Ramadan (Moon - Purple/Indigo) */}
        {onOpenFasting && (
          <button
            id="dock-btn-fasting"
            onClick={onOpenFasting}
            title="Le Jeûne & Ramadan"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition cursor-pointer"
          >
            <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-700 dark:text-purple-300 stroke-[2.2]" />
          </button>
        )}

        {/* 5. Faith / Eschatology (Sun/Rays - Amber) */}
        {onOpenFaith && (
          <button
            id="dock-btn-faith"
            onClick={onOpenFaith}
            title="La Foi & L'Au-Delà"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer"
          >
            <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
          </button>
        )}

        {/* 6. Library / Maktaba (Library - Emerald) */}
        {onOpenLibrary && (
          <button
            id="dock-btn-library"
            onClick={onOpenLibrary}
            title="Bibliothèque Islamique (6 Livres)"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
          >
            <Library className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-700 dark:text-emerald-300 stroke-[2.2]" />
          </button>
        )}

        {/* 7. Compass (Qibla - Warm Amber) */}
        <button
          id="dock-btn-compass"
          onClick={onOpenQibla}
          title="Boussole Qibla"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer"
        >
          <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
        </button>

        {/* 8. Sparkles (Adhkar & Tasbih - Emerald Tint) */}
        <button
          id="dock-btn-sparkles"
          onClick={onOpenDhikr}
          title="Invocations & Dhikr"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
        </button>

        {/* 9. Dark Circle Badge with Golden Crescent */}
        <button
          id="dock-btn-dhikr-counter"
          onClick={onOpenDhikr}
          title="Compteur Tasbih"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900 dark:bg-emerald-950 text-amber-400 border border-amber-400/30 flex items-center justify-center text-[11px] font-bold tracking-wider hover:bg-neutral-800 dark:hover:bg-[#1B3829] transition cursor-pointer shadow-sm"
        >
          <span className="text-amber-400">☪</span>
        </button>
      </div>
    </aside>
  );
};
