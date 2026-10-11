import React, { useState, useEffect, useRef } from 'react';
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
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [barWidth, setBarWidth] = useState(360);
  const lastScrollYRef = useRef(0);
  const barContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMoreOpen) {
      try {
        window.history.pushState({ sanctuaireOverlay: true }, '');
      } catch {
        // ignore
      }
      ;(window as any).__sanctuaireMoreOpen = true;
    } else {
      ;(window as any).__sanctuaireMoreOpen = false;
    }
  }, [isMoreOpen]);

  useEffect(() => {
    const handleCloseMore = () => {
      if (isMoreOpen) setIsMoreOpen(false);
    };
    window.addEventListener('sanctuaire-close-overlays', handleCloseMore);
    return () => window.removeEventListener('sanctuaire-close-overlays', handleCloseMore);
  }, [isMoreOpen]);

  // Mesure exacte en pixels de la barre pour une encoche 100% circulaire sans déformation
  useEffect(() => {
    const el = barContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 180) {
        setBarWidth(Math.round(w));
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    window.addEventListener('resize', updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Disparaît quand on descend, revient quand on monte
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const diff = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= 36) {
        setIsVisible(true);
      } else if (diff > 7 && !isMoreOpen) {
        setIsVisible(false);
      } else if (diff < -5) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMoreOpen]);

  // Réafficher la barre à chaque changement de page
  useEffect(() => {
    setIsVisible(true);
    lastScrollYRef.current = window.scrollY || 0;
  }, [currentView]);

  // Détermination de l'onglet actif (0 à 4)
  const isSecondaryView =
    currentView === 'fasting' ||
    currentView === 'faith' ||
    currentView === 'library' ||
    currentView === 'calendar';

  let activeIndex = 0;
  if (isMoreOpen || isSecondaryView) {
    activeIndex = 4;
  } else if (currentView === 'prayer') {
    activeIndex = 1;
  } else if (currentView === 'quran') {
    activeIndex = 2;
  } else if (currentView === 'home') {
    activeIndex = 0;
  }

  // Libellé et icône dynamiques pour le 5ème onglet si une sous-section est active
  const getFifthTabInfo = () => {
    if (isMoreOpen) return { label: 'Menu', icon: Menu };
    switch (currentView) {
      case 'fasting':
        return { label: 'Jeûne', icon: Moon };
      case 'faith':
        return { label: 'La Foi', icon: Sun };
      case 'library':
        return { label: 'Livres', icon: Library };
      case 'calendar':
        return { label: 'Suivi', icon: Calendar };
      default:
        return { label: 'Menu', icon: Menu };
    }
  };

  const fifthTab = getFifthTabInfo();

  const navItems = [
    {
      id: 'bottom-nav-home',
      label: 'Accueil',
      icon: Home,
      onClick: () => {
        setIsMoreOpen(false);
        onGoToHome();
      },
    },
    {
      id: 'bottom-nav-prayer',
      label: 'Prières',
      icon: Clock,
      onClick: () => {
        setIsMoreOpen(false);
        onOpenPrayerGuide();
      },
    },
    {
      id: 'bottom-nav-quran',
      label: 'Coran',
      icon: BookOpen,
      onClick: () => {
        setIsMoreOpen(false);
        onOpenQuran();
      },
    },
    {
      id: 'bottom-nav-qibla',
      label: 'Qibla',
      icon: Compass,
      onClick: () => {
        setIsMoreOpen(false);
        onOpenQibla();
      },
    },
    {
      id: 'bottom-nav-more',
      label: fifthTab.label,
      icon: fifthTab.icon,
      onClick: () => {
        setIsMoreOpen((prev) => !prev);
      },
    },
  ];

  // Géométrie 1:1 en pixels réels (aucune distorsion horizontale)
  const barHeight = 66;
  const sidePad = 8;
  const colWidth = (barWidth - sidePad * 2) / 5;
  const cx = sidePad + activeIndex * colWidth + colWidth / 2;
  const notchHalfWidth = 36;
  const notchDepth = 29;
  const cornerRadius = 22;

  const leftStart = Math.max(cornerRadius, cx - notchHalfWidth);
  const rightEnd = Math.min(barWidth - cornerRadius, cx + notchHalfWidth);

  const svgPath = `
    M ${cornerRadius} 0
    L ${leftStart} 0
    C ${cx - 21} 0, ${cx - 19} ${notchDepth}, ${cx} ${notchDepth}
    C ${cx + 19} ${notchDepth}, ${cx + 21} 0, ${rightEnd} 0
    L ${barWidth - cornerRadius} 0
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${barWidth} ${cornerRadius}
    L ${barWidth} ${barHeight - cornerRadius}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${barWidth - cornerRadius} ${barHeight}
    L ${cornerRadius} ${barHeight}
    A ${cornerRadius} ${cornerRadius} 0 0 1 0 ${barHeight - cornerRadius}
    L 0 ${cornerRadius}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${cornerRadius} 0
    Z
  `;

  return (
    <>
      <nav
        id="sanctuary-bottom-nav"
        role="navigation"
        aria-label="Navigation principale"
        className={`fixed bottom-2.5 left-0 right-0 z-40 md:hidden px-3 pointer-events-none select-none transition-all duration-300 ease-out ${
          isVisible || isMoreOpen
            ? 'translate-y-0 opacity-100'
            : 'translate-y-[140%] opacity-0'
        }`}
      >
        <div
          ref={barContainerRef}
          className="relative w-full max-w-md mx-auto h-[66px] pointer-events-auto"
        >
          {/* Fond SVG avec encoche incurvée 1:1 en pixels réels */}
          <svg
            viewBox={`0 0 ${barWidth} ${barHeight}`}
            className="
              absolute inset-0 w-full h-full
              drop-shadow-[0_-6px_22px_rgba(6,78,59,0.16)]
              dark:drop-shadow-[0_-8px_28px_rgba(0,0,0,0.55)]
              overflow-visible
            "
          >
            <defs>
              <linearGradient id="sanctuaryNavLight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F3F8F5" />
              </linearGradient>
              <linearGradient id="sanctuaryNavDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1A3526" />
                <stop offset="100%" stopColor="#112319" />
              </linearGradient>
            </defs>
            <path
              d={svgPath}
              fill={isDarkMode ? 'url(#sanctuaryNavDark)' : 'url(#sanctuaryNavLight)'}
              stroke={isDarkMode ? 'rgba(52, 211, 153, 0.35)' : 'rgba(5, 150, 105, 0.25)'}
              strokeWidth="1.5"
              className="transition-all duration-300 ease-out"
            />
          </svg>

          {/* Les 5 boutons de navigation alignés exactement sur [sidePad .. barWidth - sidePad] */}
          <div className="relative z-10 w-full h-full flex items-center justify-between px-[8px]">
            {navItems.map((item, idx) => {
              const IconComponent = item.icon;
              const isActive = idx === activeIndex;

              return (
                <button
                  key={item.id}
                  id={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="flex-1 h-full flex flex-col items-center justify-end pb-[9px] relative cursor-pointer group focus:outline-none"
                >
                  {/* Icône : surélevée dans son cercle émeraude & or si actif, sinon centrée dans la barre */}
                  <div
                    className={`transition-all duration-300 ease-out flex items-center justify-center ${
                      isActive
                        ? 'absolute -top-[20px] w-[44px] h-[44px] rounded-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-[#0B3B24] dark:from-emerald-500 dark:via-emerald-600 dark:to-[#0F3D26] text-amber-300 border-2 border-amber-400/90 shadow-[0_6px_16px_rgba(5,150,105,0.45)]'
                        : 'mb-[5px] text-neutral-600 dark:text-emerald-100/80 group-hover:text-emerald-700 dark:group-hover:text-amber-300 active:scale-90'
                    }`}
                  >
                    <IconComponent
                      className={`transition-transform duration-300 ${
                        isActive
                          ? 'w-[20px] h-[20px] text-amber-300 stroke-[2.3]'
                          : 'w-[19px] h-[19px] stroke-[2]'
                      }`}
                    />
                  </div>

                  {/* Texte lisible sous chaque icône */}
                  <span
                    className={`text-[11.5px] tracking-tight leading-none transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'font-extrabold text-emerald-800 dark:text-amber-300'
                        : 'font-semibold text-neutral-700 dark:text-emerald-100/85'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ========================================================
          TIROIR / MENU COMPLET DES ESPACES SPIRITUELS & RÉGLAGES
         ======================================================== */}
      {isMoreOpen && (
        <div
          id="mobile-more-backdrop"
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150 md:hidden"
        >
          <div
            id="mobile-more-sheet"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-auto bg-white/98 dark:bg-[#14261C]/98 backdrop-blur-xl text-neutral-900 dark:text-white rounded-t-3xl p-5 pb-8 shadow-2xl border-t border-emerald-500/30 space-y-4 animate-in slide-in-from-bottom duration-200"
          >
            {/* Poignée */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-emerald-800 rounded-full mx-auto" />

            {/* En-tête */}
            <div className="flex items-center justify-between pt-1 pb-3 border-b border-neutral-200/80 dark:border-emerald-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300/60 dark:border-emerald-500/40 text-emerald-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
                  ☪
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">Le Sanctuaire</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300/90 font-medium">
                    Tous vos espaces spirituels & réglages
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#193226] flex items-center justify-center text-neutral-600 hover:text-neutral-900 dark:text-emerald-300 dark:hover:text-white cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grille des Espaces */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Dhikr & Tasbih */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenDhikr();
                }}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#193226] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200/90 dark:border-emerald-500/30 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                    Dhikr & Tasbih
                  </span>
                  <span className="block text-[11px] text-emerald-700 dark:text-emerald-200/75 truncate">
                    Chapelet & Adhkar
                  </span>
                </div>
              </button>

              {/* Calendrier & Suivi Mensuel */}
              {onOpenCalendar && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenCalendar();
                  }}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#193226] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200/90 dark:border-emerald-500/30 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                      Calendrier
                    </span>
                    <span className="block text-[11px] text-emerald-700 dark:text-emerald-200/75 truncate">
                      Suivi & Stats
                    </span>
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
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#193226] hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-neutral-200/90 dark:border-purple-500/30 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Moon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                      Le Jeûne
                    </span>
                    <span className="block text-[11px] text-purple-700 dark:text-purple-200/75 truncate">
                      Imsak & Iftar
                    </span>
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
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#193226] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-neutral-200/90 dark:border-rose-500/30 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                    <Sun className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                      La Foi
                    </span>
                    <span className="block text-[11px] text-rose-700 dark:text-rose-200/75 truncate">
                      L&apos;Au-Delà
                    </span>
                  </div>
                </button>
              )}

              {/* Bibliothèque */}
              {onOpenLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenLibrary();
                  }}
                  className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#193226] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200/90 dark:border-emerald-500/30 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Library className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                      Bibliothèque
                    </span>
                    <span className="block text-[11px] text-emerald-700 dark:text-emerald-200/75 truncate">
                      Livres & Récits
                    </span>
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
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#193226] hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-neutral-200/90 dark:border-amber-500/30 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                    Boussole Qibla
                  </span>
                  <span className="block text-[11px] text-amber-700 dark:text-amber-300/85 truncate">
                    Direction Kaaba
                  </span>
                </div>
              </button>
            </div>

            {/* Réglages des horaires */}
            <div className="pt-2 space-y-2 border-t border-neutral-200/80 dark:border-emerald-800/40">
              {onOpenPrayerSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onOpenPrayerSettings();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-[#193226] hover:bg-neutral-100 dark:hover:bg-[#20402E] text-xs font-bold transition cursor-pointer border border-neutral-200/90 dark:border-emerald-500/30"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-neutral-800 dark:text-neutral-100">
                      Ajuster les heures de prière
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
