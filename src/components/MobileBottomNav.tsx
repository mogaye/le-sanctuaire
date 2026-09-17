import React, { useState } from 'react';
import {
  Home,
  Clock,
  BookOpen,
  Compass,
  Sparkles,
  Moon,
  Sun,
  Library,
  SlidersHorizontal,
  X,
  ChevronRight,
  Menu,
  Calendar,
} from 'lucide-react';

export interface MobileBottomNavProps {
  currentView: string;
  onGoToHome: () => void;
  onOpenQuran: () => void;
  onOpenPrayerGuide: () => void;
  onOpenCalendar?: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
  onOpenFasting?: () => void;
  onOpenFaith?: () => void;
  onOpenLibrary?: () => void;
  onOpenPrayerSettings?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onGoToHome,
  onOpenQuran,
  onOpenPrayerGuide,
  onOpenCalendar,
  onOpenQibla,
  onOpenDhikr,
  onOpenFasting,
  onOpenFaith,
  onOpenLibrary,
  onOpenPrayerSettings,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Active tab detection
  const isHomeActive = currentView === 'home';
  const isPrayerActive = currentView === 'prayer';
  const isQuranActive = currentView === 'quran';

  return (
    <>
      {/* ========================================================
          BARRE DE NAVIGATION COLLÉE AU BAS - FOND BLANC TRANSPARENT
          - Translucide givré (bg-white/80 + backdrop-blur-xl)
          - Ultra compacte et mince
          - Collée tout en bas de l'écran
         ======================================================== */}
      <nav
        id="sanctuary-bottom-nav"
        role="navigation"
        aria-label="Navigation principale"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden w-full bg-white/95 dark:bg-[#14261C]/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-emerald-800/40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] select-none transition-colors"
      >
        <div className="w-full max-w-md mx-auto flex items-center justify-between px-2 py-1">
          
          {/* 1. Accueil */}
          <button
            id="bottom-nav-home"
            type="button"
            onClick={() => {
              setIsMoreOpen(false);
              onGoToHome();
            }}
            className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer group active:scale-90"
          >
            <div className="relative flex items-center justify-center">
              <Home
                className={`w-4 h-4 transition-colors stroke-[2.2] ${
                  isHomeActive
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-300'
                }`}
              />
              {isHomeActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </div>
            <span
              className={`text-[9px] mt-0.5 tracking-tight leading-none ${
                isHomeActive
                  ? 'font-bold text-emerald-800 dark:text-emerald-300'
                  : 'font-medium text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Accueil
            </span>
          </button>

          {/* 2. Prières */}
          <button
            id="bottom-nav-prayer"
            type="button"
            onClick={() => {
              setIsMoreOpen(false);
              onOpenPrayerGuide();
            }}
            className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer group active:scale-90"
          >
            <div className="relative flex items-center justify-center">
              <Clock
                className={`w-4 h-4 transition-colors stroke-[2.2] ${
                  isPrayerActive
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-300'
                }`}
              />
              {isPrayerActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </div>
            <span
              className={`text-[9px] mt-0.5 tracking-tight leading-none ${
                isPrayerActive
                  ? 'font-bold text-emerald-800 dark:text-emerald-300'
                  : 'font-medium text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Prières
            </span>
          </button>

          {/* 3. Saint Coran */}
          <button
            id="bottom-nav-quran"
            type="button"
            onClick={() => {
              setIsMoreOpen(false);
              onOpenQuran();
            }}
            className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer group active:scale-90"
          >
            <div className="relative flex items-center justify-center">
              <BookOpen
                className={`w-4 h-4 transition-colors stroke-[2.2] ${
                  isQuranActive
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-300'
                }`}
              />
              {isQuranActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </div>
            <span
              className={`text-[9px] mt-0.5 tracking-tight leading-none ${
                isQuranActive
                  ? 'font-bold text-emerald-800 dark:text-emerald-300'
                  : 'font-medium text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Coran
            </span>
          </button>

          {/* 4. Boussole Qibla */}
          <button
            id="bottom-nav-qibla"
            type="button"
            onClick={() => {
              setIsMoreOpen(false);
              onOpenQibla();
            }}
            className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer group active:scale-90"
          >
            <div className="relative flex items-center justify-center">
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors stroke-[2.2]" />
            </div>
            <span className="text-[9px] mt-0.5 tracking-tight leading-none font-medium text-neutral-600 dark:text-neutral-300">
              Qibla
            </span>
          </button>

          {/* 5. Dhikr / Tasbih */}
          <button
            id="bottom-nav-dhikr"
            type="button"
            onClick={() => {
              setIsMoreOpen(false);
              onOpenDhikr();
            }}
            className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer group active:scale-90"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-neutral-500 hover:text-emerald-700 dark:text-neutral-300 dark:hover:text-emerald-300 transition-colors stroke-[2.2]" />
            </div>
            <span className="text-[9px] mt-0.5 tracking-tight leading-none font-medium text-neutral-600 dark:text-neutral-300">
              Dhikr
            </span>
          </button>

          {/* 6. Menu / Plus */}
          <button
            id="bottom-nav-more"
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            title="Autres espaces et réglages"
            className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer group active:scale-90"
          >
            <div className="relative flex items-center justify-center">
              <Menu
                className={`w-4 h-4 transition-colors stroke-[2.2] ${
                  isMoreOpen
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-300'
                }`}
              />
              {isMoreOpen && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </div>
            <span
              className={`text-[9px] mt-0.5 tracking-tight leading-none ${
                isMoreOpen
                  ? 'font-bold text-emerald-800 dark:text-emerald-300'
                  : 'font-medium text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Menu
            </span>
          </button>

        </div>
      </nav>

      {/* ========================================================
          DRAWER / SHEET FOR EXTENDED SPACES & SETTINGS
         ======================================================== */}
      {isMoreOpen && (
        <div
          id="mobile-more-backdrop"
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150 md:hidden"
        >
          <div
            id="mobile-more-sheet"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-auto bg-white/98 dark:bg-[#14261C]/98 backdrop-blur-xl text-neutral-900 dark:text-white rounded-t-3xl p-4 pb-7 shadow-2xl border-t border-neutral-200 dark:border-emerald-800/40 space-y-3 animate-in slide-in-from-bottom duration-200"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between pt-1 pb-2 border-b border-neutral-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  ☪
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white">Le Sanctuaire</h3>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80">Espaces spirituels & réglages</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#193226] flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-emerald-300 dark:hover:text-white cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid of Other Sections */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              
              {/* Calendrier & Suivi Mensuel */}
              {onOpenCalendar && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenCalendar();
                  }}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#193226] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200/80 dark:border-emerald-500/25 text-left flex items-start gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-neutral-900 dark:text-white truncate">Calendrier</span>
                    <span className="block text-[9px] text-emerald-700 dark:text-emerald-200/70 truncate">Suivi & Stats</span>
                  </div>
                </button>
              )}

              {/* Le Jeûne & Ramadan */}
              {onOpenFasting && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenFasting();
                  }}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#193226] hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-neutral-200/80 dark:border-purple-500/25 text-left flex items-start gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-neutral-900 dark:text-white truncate">Le Jeûne</span>
                    <span className="block text-[9px] text-purple-700 dark:text-purple-200/70 truncate">Imsak & Iftar</span>
                  </div>
                </button>
              )}

              {/* La Foi & L'Au-Delà */}
              {onOpenFaith && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenFaith();
                  }}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#193226] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-neutral-200/80 dark:border-rose-500/25 text-left flex items-start gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-neutral-900 dark:text-white truncate">La Foi</span>
                    <span className="block text-[9px] text-rose-700 dark:text-rose-200/70 truncate">L'Au-Delà</span>
                  </div>
                </button>
              )}

              {/* Bibliothèque (6 Livres) */}
              {onOpenLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenLibrary();
                  }}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#193226] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200/80 dark:border-emerald-500/25 text-left flex items-start gap-2 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Library className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-neutral-900 dark:text-white truncate">Bibliothèque</span>
                    <span className="block text-[9px] text-emerald-700 dark:text-emerald-200/70 truncate">6 Ouvrages</span>
                  </div>
                </button>
              )}

              {/* Boussole Qibla */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenQibla();
                }}
                className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#193226] hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-neutral-200/80 dark:border-amber-500/25 text-left flex items-start gap-2 cursor-pointer active:scale-98 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-neutral-900 dark:text-white truncate">Boussole Qibla</span>
                  <span className="block text-[9px] text-amber-700 dark:text-amber-300/80 truncate">Direction Kaaba</span>
                </div>
              </button>

            </div>

            {/* Bottom Controls */}
            <div className="pt-2 space-y-1.5 border-t border-neutral-100 dark:border-emerald-800/40">
              {onOpenPrayerSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenPrayerSettings();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-[#193226] hover:bg-neutral-100 dark:hover:bg-[#20402E] text-xs font-medium transition cursor-pointer border border-neutral-200/80 dark:border-emerald-500/25"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-neutral-800 dark:text-neutral-100 font-bold">Ajuster les heures de prière</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
