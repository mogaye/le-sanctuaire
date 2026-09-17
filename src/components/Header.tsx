import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUpRight,
  MapPin,
  Compass,
  BookOpen,
  ChevronDown,
  Check,
  LogOut,
  User as UserIcon,
  SlidersHorizontal,
  Moon,
  Sun,
  Library,
  Heart,
} from 'lucide-react';
import { CITIES, METHODS, RECITERS } from '../data/islamicData';
import { CityData, Method, Reciter } from '../types';
import { CitySelectorModal } from './CitySelectorModal';

interface HeaderProps {
  selectedCity: CityData;
  onSelectCity: (city: CityData) => void;
  selectedMethod: Method;
  onSelectMethod: (method: Method) => void;
  selectedReciter: Reciter;
  onSelectReciter: (reciter: Reciter) => void;
  onOpenPrayerGuide: () => void;
  onOpenQuran: () => void;
  onOpenAuth: () => void;
  currentUser?: { name: string; email: string } | null;
  onLogout?: () => void;
  onGoToHome?: () => void;
  onOpenPrayerSettings?: () => void;
  onOpenFasting?: () => void;
  onOpenFaith?: () => void;
  onOpenLibrary?: () => void;
  onOpenDonations?: () => void;
  isLanding?: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCity,
  onSelectCity,
  selectedMethod,
  onSelectMethod,
  selectedReciter,
  onSelectReciter,
  onOpenPrayerGuide,
  onOpenQuran,
  onOpenAuth,
  currentUser,
  onLogout,
  onGoToHome,
  onOpenPrayerSettings,
  onOpenFasting,
  onOpenFaith,
  onOpenLibrary,
  onOpenDonations,
  isLanding = false,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'city' | 'method' | 'reciter' | 'user' | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`w-full px-2 sm:px-6 md:px-8 py-2.5 sm:py-5 flex items-center justify-between gap-1.5 sm:gap-3 relative z-30 transition-colors ${isLanding ? 'bg-transparent' : 'bg-white/95 dark:bg-[#12261A]/95 backdrop-blur-md border-b border-neutral-200/50 dark:border-emerald-900/40'}`}>
      {/* Left Brand Logo & Prière Guide Group */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          id="btn-brand-logo-header"
          onClick={onGoToHome}
          className="inline-flex items-center gap-2 bg-white/95 dark:bg-[#183022] backdrop-blur-md hover:bg-white dark:hover:bg-[#20402E] text-neutral-900 dark:text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/70 dark:border-emerald-700/50 shadow-[0_4px_18px_rgba(0,0,0,0.12)] hover:border-emerald-500/40 transition-all cursor-pointer group active:scale-95 shrink-0 whitespace-nowrap flex-nowrap"
          title="Le Sanctuaire"
        >
          <img
            src="/images/sanctuaire_logo.jpg"
            alt="Logo Le Sanctuaire"
            referrerPolicy="no-referrer"
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover ring-1 ring-emerald-600/40 group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="text-neutral-950 dark:text-white font-black tracking-tight whitespace-nowrap select-none">
            Le Sanctuaire
          </span>
        </button>
      </div>

      {/* Center Capsule Pill with Dropdowns (Responsive: City + Method on tablet md, Full with Reciter on desktop lg) */}
      <div
        ref={dropdownRef}
        className="hidden md:flex items-center bg-white/95 dark:bg-[#183022] backdrop-blur-md border border-white/60 dark:border-emerald-700/50 rounded-full px-2.5 sm:px-4 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.12)] divide-x divide-neutral-200 dark:divide-emerald-800/60"
      >
        {/* City Segment with Rose MapPin Icon */}
        <div className="relative">
          <button
            id="selector-city-btn"
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'city' ? null : 'city')}
            className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3.5 py-1 hover:opacity-80 transition cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.2]" />
            </div>
            <div>
              <span className="hidden lg:block text-[10px] sm:text-[11px] font-medium text-black/70 dark:text-neutral-300 leading-none">
                Ville & Horaires
              </span>
              <span className="text-xs sm:text-sm font-bold text-black dark:text-white leading-tight flex items-center gap-1 mt-0.5">
                {selectedCity.name}
                <ChevronDown className="w-3 h-3 text-black/60 dark:text-neutral-400" />
              </span>
            </div>
          </button>

          {/* City Selection Modal */}
          <CitySelectorModal
            isOpen={openDropdown === 'city'}
            onClose={() => setOpenDropdown(null)}
            selectedCity={selectedCity}
            onSelectCity={(city) => {
              onSelectCity(city);
              setOpenDropdown(null);
            }}
            cities={CITIES}
          />
        </div>

        {/* Method Segment with Amber Compass Icon */}
        <div className="relative">
          <button
            id="selector-method-btn"
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'method' ? null : 'method')}
            className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3.5 py-1 hover:opacity-80 transition cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0">
              <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
            </div>
            <div>
              <span className="hidden lg:block text-[10px] sm:text-[11px] font-medium text-black/70 dark:text-neutral-300 leading-none">
                Méthode & Angle
              </span>
              <span className="text-xs sm:text-sm font-bold text-black dark:text-white leading-tight flex items-center gap-1 mt-0.5">
                {selectedMethod.name.split(' ')[0]}
                <ChevronDown className="w-3 h-3 text-black/60 dark:text-neutral-400" />
              </span>
            </div>
          </button>

          {/* Method Dropdown Menu */}
          {openDropdown === 'method' && (
            <div className="absolute left-0 mt-3 w-72 bg-white dark:bg-[#183022] rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-neutral-200 dark:border-emerald-700/60 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-black dark:text-emerald-300 uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-amber-600" />
                Méthode de calcul
              </div>
              <div className="space-y-0.5">
                {METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      onSelectMethod(method);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                      selectedMethod.id === method.id
                        ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-bold'
                        : 'text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#20402E]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{method.name}</div>
                      <div className="text-[10px] opacity-75">{method.fullName}</div>
                    </div>
                    {selectedMethod.id === method.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reciter Segment with Emerald BookOpen Icon (Visible on desktop & tablet landscape >= 1024px) */}
        <div className="relative hidden lg:block">
          <button
            id="selector-reciter-btn"
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'reciter' ? null : 'reciter')}
            className="flex items-center gap-2.5 px-2 sm:px-3.5 py-1 hover:opacity-80 transition cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
            </div>
            <div>
              <span className="block text-[10px] sm:text-[11px] font-medium text-black/70 dark:text-neutral-300 leading-none">
                Récitateur Coran
              </span>
              <span className="text-xs sm:text-sm font-bold text-black dark:text-white leading-tight flex items-center gap-1 mt-0.5">
                {selectedReciter.name}
                <ChevronDown className="w-3 h-3 text-black/60 dark:text-neutral-400" />
              </span>
            </div>
          </button>

          {/* Reciter Dropdown Menu */}
          {openDropdown === 'reciter' && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#183022] rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-neutral-200 dark:border-emerald-700/60 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold text-black dark:text-emerald-300 uppercase tracking-wider px-3 py-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-emerald-600" />
                Récitateur audio
              </div>
              <div className="space-y-0.5">
                {RECITERS.map((reciter) => (
                  <button
                    key={reciter.id}
                    onClick={() => {
                      onSelectReciter(reciter);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                      selectedReciter.id === reciter.id
                        ? 'bg-emerald-800 dark:bg-emerald-700 text-white font-bold'
                        : 'text-neutral-900 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#20402E]'
                    }`}
                  >
                    <span>{reciter.style}</span>
                    {selectedReciter.id === reciter.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right button group: Connexion & Profil */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0" ref={userMenuRef}>
        {currentUser ? (
          <div className="relative shrink-0">
            <button
              id="btn-user-profile-header"
              onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/95 dark:bg-[#183022] backdrop-blur-md hover:bg-white dark:hover:bg-[#20402E] text-neutral-900 dark:text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-full border border-white/60 dark:border-emerald-700/50 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:border-emerald-500/40 transition-all cursor-pointer group active:scale-95 shrink-0 whitespace-nowrap flex-nowrap"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-neutral-900 dark:text-white font-bold max-w-[70px] sm:max-w-[110px] truncate select-none">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-600 dark:text-neutral-400 shrink-0" />
            </button>

            {/* User Dropdown Menu */}
            {openDropdown === 'user' && (
              <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#183022] rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.15)] border border-neutral-200 dark:border-emerald-700/60 p-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-emerald-800/50 mb-2">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-neutral-600 dark:text-neutral-300 truncate">{currentUser.email}</div>
                </div>

                <div className="py-1 space-y-0.5">
                  {onGoToHome && (
                    <button
                      onClick={() => {
                        onGoToHome();
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-left font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>Mon Sanctuaire (Dashboard)</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onOpenQuran();
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-black dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#20402E] text-left font-medium cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Mes Sourates & Versets</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenPrayerGuide();
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-black dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#20402E] text-left font-medium cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Progression des Prières</span>
                  </button>
                  {onOpenFasting && (
                    <button
                      onClick={() => {
                        onOpenFasting();
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-900 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-left font-semibold cursor-pointer"
                    >
                      <Moon className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                      <span>Le Jeûne & Ramadan</span>
                    </button>
                  )}
                  {onOpenFaith && (
                    <button
                      onClick={() => {
                        onOpenFaith();
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-950 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-left font-semibold cursor-pointer"
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>La Foi & L'Au-Delà</span>
                    </button>
                  )}
                  {onOpenLibrary && (
                    <button
                      onClick={() => {
                        onOpenLibrary();
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-950 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-left font-semibold cursor-pointer"
                    >
                      <Library className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>Bibliothèque (6 Livres PDF)</span>
                    </button>
                  )}
                  {onOpenDonations && (
                    <button
                      onClick={() => {
                        onOpenDonations();
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-950 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-left font-bold cursor-pointer border border-amber-300/40"
                    >
                      <Heart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500/30" />
                      <span>Faire un Don (DunyaPay)</span>
                    </button>
                  )}
                  {onOpenPrayerSettings && (
                    <button
                      onClick={() => {
                        onOpenPrayerSettings();
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-emerald-950 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 text-left font-semibold cursor-pointer border border-emerald-200/50 dark:border-emerald-700/50"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
                      <span>Ajuster les Heures de Prière</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-neutral-100 dark:border-emerald-800/50">
                  <button
                    onClick={() => {
                      if (onLogout) onLogout();
                      setOpenDropdown(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-left font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span>Se Déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              id="btn-connexion-header"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/95 dark:bg-[#183022] backdrop-blur-md hover:bg-white dark:hover:bg-[#20402E] text-neutral-900 dark:text-white text-xs sm:text-sm font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/70 dark:border-emerald-700/50 shadow-[0_4px_18px_rgba(0,0,0,0.12)] hover:border-emerald-500/40 transition-all cursor-pointer group active:scale-95 shrink-0 whitespace-nowrap flex-nowrap"
            >
              <span className="text-neutral-900 dark:text-white font-bold whitespace-nowrap select-none">Connexion</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0 stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
