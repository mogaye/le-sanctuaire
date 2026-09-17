import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Compass,
  Play,
  Share2,
  Bookmark,
  Check,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { CityData, Method } from '../types';
import { PRAYER_GUIDE_METADATA } from '../data/prayerGuideDocument';
import {
  GuideNavigationTabs,
  GuideChapter,
} from './prayer-guide/GuideNavigationTabs';
import { FivePrayersSection } from './prayer-guide/FivePrayersSection';
import { PrerequisitesSection } from './prayer-guide/PrerequisitesSection';
import { AblutionSection } from './prayer-guide/AblutionSection';
import { InvalidatorsSection } from './prayer-guide/InvalidatorsSection';
import { DoubtsAndSahwSection } from './prayer-guide/DoubtsAndSahwSection';
import { AdhanIqamatSection } from './prayer-guide/AdhanIqamatSection';
import { PrayerStepByStepSection } from './prayer-guide/PrayerStepByStepSection';
import { ShortSurasSection } from './prayer-guide/ShortSurasSection';
import { TasbihFatimaSection } from './prayer-guide/TasbihFatimaSection';
import { SpecialPrayersSection } from './prayer-guide/SpecialPrayersSection';

interface PrayerPageProps {
  currentUser?: { name: string; email: string } | null;
  onBackToHome: () => void;
  selectedCity: CityData;
  selectedMethod: Method;
  initialPrayerKey?: 'F' | 'D' | 'A' | 'M' | 'I';
  onOpenQibla?: () => void;
  onOpenPrayerSettings?: () => void;
  onOpenCalendar?: () => void;
}

export const PrayerPage: React.FC<PrayerPageProps> = ({
  currentUser,
  onBackToHome,
  selectedCity,
  onOpenQibla,
  onOpenCalendar,
}) => {
  const [activeChapter, setActiveChapter] = useState<GuideChapter>('horaires');
  const [hasCopiedShare, setHasCopiedShare] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: PRAYER_GUIDE_METADATA.title,
        text: 'Guide complet de la prière musulmane du début à la fin.',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setHasCopiedShare(true);
      setTimeout(() => setHasCopiedShare(false), 2000);
    }
  };

  const scrollToTabs = () => {
    const tabsEl = document.getElementById('guide-tabs');
    if (tabsEl) {
      tabsEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#14261C] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans pb-28 md:pb-16 transition-colors duration-300">
      {/* ========================================================
          STICKY TOP NAVBAR
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#193226]/95 backdrop-blur-md border-b border-neutral-200 dark:border-emerald-500/25 shadow-2xs transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* Back button */}
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-400/40 active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            <span className="hidden sm:inline">Retour au Sanctuaire</span>
            <span className="sm:hidden">Accueil</span>
          </button>

          {/* Title in navbar */}
          <div className="flex items-center gap-2 text-left sm:text-center truncate min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-800 dark:to-emerald-950 text-emerald-800 dark:text-amber-200 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              ص
            </div>
            <div className="min-w-0 truncate">
              <h1 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white leading-tight truncate">
                {PRAYER_GUIDE_METADATA.title}
              </h1>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300/80 font-medium truncate">
                {PRAYER_GUIDE_METADATA.author}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenCalendar && (
              <button
                onClick={onOpenCalendar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Consulter le Calendrier & Suivi Mensuel des Prières"
              >
                <Calendar className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Calendrier & Suivi</span>
              </button>
            )}

            {onOpenQibla && (
              <button
                onClick={onOpenQibla}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 text-neutral-800 dark:text-emerald-200 text-xs font-bold transition-all border border-neutral-200 dark:border-emerald-500/25 cursor-pointer"
                title="Vérifier la Qibla"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                <span>Qibla</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-emerald-500/20 transition-colors cursor-pointer"
              title="Partager le guide"
            >
              {hasCopiedShare ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          HERO BANNER COMPILATION HEADER
         ======================================================== */}
      <section className="bg-gradient-to-b from-[#122B1E] via-[#0E2418] to-[#153424] text-white py-6 md:py-10 px-4 sm:px-6 relative overflow-hidden border-b border-[#214E36]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 relative z-10">
          <div className="space-y-2.5 sm:space-y-3 text-center md:text-left max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-400/30 text-[11px] sm:text-xs font-semibold text-emerald-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentUser?.name ? `Guide Personnel • ${currentUser.name}` : 'Guide Rituel & Spirituel Complet'}</span>
            </div>

            <p className="font-arabic text-base sm:text-xl text-amber-200">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • السَّلَامُ عَلَيْكُمْ
            </p>

            <h2 className="text-xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {PRAYER_GUIDE_METADATA.title}
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-2xl mx-auto md:mx-0">
              « {PRAYER_GUIDE_METADATA.bismillah} {PRAYER_GUIDE_METADATA.greeting} » — {PRAYER_GUIDE_METADATA.author}.
              Retrouvez l’ensemble des horaires, des conditions de pureté, des ablutions (Wudhu), de l’Adhan,
              des 22 étapes de la prière pas à pas, et de la glorification de Fatima Azzahra.
            </p>

            {/* Quick Action Start Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-2.5 sm:gap-3">
              <button
                onClick={() => {
                  setActiveChapter('horaires');
                  scrollToTabs();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl bg-[#B9F5D0] hover:bg-[#a3f0bf] text-[#0A2616] text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-[#0A2616]" />
                <span>Commencer depuis le Début</span>
              </button>

              <button
                onClick={() => {
                  setActiveChapter('priere');
                  scrollToTabs();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/20 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>Aller à la Prière (22 Étapes)</span>
              </button>
            </div>
          </div>

          {/* All Fard Seal / Emblem */}
          <div className="shrink-0 flex items-center justify-center">
            <div className="w-24 h-24 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#B9F5D0] to-[#8EEBB4] text-[#0A2616] p-2 sm:p-4 flex flex-col items-center justify-center text-center shadow-[0_10px_35px_rgba(185,245,208,0.25)] border-2 sm:border-4 border-white">
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-[#144729]">
                Prière Islamique
              </span>
              <span className="text-xs sm:text-base font-extrabold leading-tight tracking-tight uppercase">
                Guide Vivant
              </span>
              <span className="text-[9px] sm:text-[11px] font-bold text-[#0F351F] uppercase mt-0.5">
                Du Début à la Fin
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          STICKY GUIDE CHAPTERS TABS
         ======================================================== */}
      <div id="guide-tabs">
        <GuideNavigationTabs
          activeChapter={activeChapter}
          onSelectChapter={(ch) => setActiveChapter(ch)}
        />
      </div>

      {/* ========================================================
          MAIN CONTENT DISPLAY PER CHAPTER
         ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeChapter === 'horaires' && (
          <FivePrayersSection
            selectedCity={selectedCity}
            onSelectPrayer={() => setActiveChapter('priere')}
            onNextChapter={() => setActiveChapter('prerequis')}
          />
        )}

        {activeChapter === 'prerequis' && (
          <PrerequisitesSection
            onOpenQibla={onOpenQibla}
            onPrevChapter={() => setActiveChapter('horaires')}
            onNextChapter={() => setActiveChapter('ablutions')}
          />
        )}

        {activeChapter === 'ablutions' && (
          <AblutionSection
            onPrevChapter={() => setActiveChapter('prerequis')}
            onNextChapter={() => setActiveChapter('invalidation')}
          />
        )}

        {activeChapter === 'invalidation' && (
          <InvalidatorsSection
            onPrevChapter={() => setActiveChapter('ablutions')}
            onNextChapter={() => setActiveChapter('doutes')}
          />
        )}

        {activeChapter === 'doutes' && (
          <DoubtsAndSahwSection
            onPrevChapter={() => setActiveChapter('invalidation')}
            onNextChapter={() => setActiveChapter('adhan')}
          />
        )}

        {activeChapter === 'adhan' && (
          <AdhanIqamatSection
            onPrevChapter={() => setActiveChapter('doutes')}
            onNextChapter={() => setActiveChapter('priere')}
          />
        )}

        {activeChapter === 'priere' && (
          <PrayerStepByStepSection
            selectedCity={selectedCity}
            onOpenQibla={onOpenQibla}
            onPrevChapter={() => setActiveChapter('adhan')}
            onNextChapter={() => setActiveChapter('sourates')}
          />
        )}

        {activeChapter === 'sourates' && (
          <ShortSurasSection
            onPrevChapter={() => setActiveChapter('priere')}
            onNextChapter={() => setActiveChapter('tasbih')}
          />
        )}

        {activeChapter === 'tasbih' && (
          <TasbihFatimaSection
            onPrevChapter={() => setActiveChapter('sourates')}
            onRestartGuide={() => {
              setActiveChapter('speciales');
            }}
          />
        )}

        {activeChapter === 'speciales' && (
          <SpecialPrayersSection
            onPrevChapter={() => setActiveChapter('tasbih')}
          />
        )}
      </main>
    </div>
  );
};
