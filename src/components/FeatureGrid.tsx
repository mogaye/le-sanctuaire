import React from 'react';
import { CheckCircle2, BookOpen, Compass, Sparkles, ArrowUpRight, ChevronRight } from 'lucide-react';

interface FeatureGridProps {
  onOpenPrayerGuide: () => void;
  onOpenQuran: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  onOpenPrayerGuide,
  onOpenQuran,
  onOpenQibla,
  onOpenDhikr,
}) => {
  const features = [
    {
      id: 'feature-prayer-guide',
      title: 'Apprendre la Prière',
      subtitle: 'Guide visuel & audio pas-à-pas',
      badge: 'PAS-À-PAS',
      badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
      arrowHover: 'group-hover:bg-emerald-600 group-hover:text-white',
      description:
        'Maîtrisez les 5 prières quotidiennes avec postures détaillées, translittérations phonétiques, règles d’ablutions et récitations audio.',
      actionText: 'Commencer le guide',
      icon: CheckCircle2,
      onClick: onOpenPrayerGuide,
    },
    {
      id: 'feature-quran',
      title: 'Coran Intégré',
      subtitle: 'Récitations audio, traductions & recherche',
      badge: 'AUDIO & TRADUCTION',
      badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
      arrowHover: 'group-hover:bg-indigo-600 group-hover:text-white',
      description:
        'Lisez le Saint Coran avec calligraphie soignée, écoutez les récitations audio de grands imams et explorez les traductions verset par verset.',
      actionText: 'Ouvrir le Coran',
      icon: BookOpen,
      onClick: onOpenQuran,
    },
    {
      id: 'feature-qibla-times',
      title: 'Horaires & Qibla',
      subtitle: 'Géolocalisation précise & boussole en direct',
      badge: 'TEMPS RÉEL',
      badgeStyle: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
      arrowHover: 'group-hover:bg-amber-600 group-hover:text-white',
      description:
        'Consultez les heures exactes des 5 prières adaptées à votre ville et orientez-vous avec précision vers la Sainte Kaaba via la boussole interactive.',
      actionText: 'Voir les horaires',
      icon: Compass,
      onClick: onOpenQibla,
    },
    {
      id: 'feature-dhikr',
      title: 'Invocations & Dhikr',
      subtitle: 'Adhkar matin/soir & compteur interactif',
      badge: 'COMPTEUR & ADHKAR',
      badgeStyle: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
      arrowHover: 'group-hover:bg-purple-600 group-hover:text-white',
      description:
        'Récitation des invocations prophétiques authentiques du matin et du soir, accompagnées d’un chapelet électronique interactif (Tasbih).',
      actionText: 'Lancer le Dhikr',
      icon: Sparkles,
      onClick: onOpenDhikr,
    },
  ];

  return (
    <section className="w-full relative overflow-hidden py-10 sm:py-28 border-y border-emerald-200/60 dark:border-emerald-900/40">
      {/* Background image behind FeatureGrid elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/backgrounds/features_section_bg.jpg"
          alt="Arrière-plan outils et pratiques"
          className="w-full h-full object-cover object-center opacity-10 dark:opacity-25"
        />
        {/* Soft atmospheric gradient overlay for optimal legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7F5] via-[#EDF5F0] to-[#F4F7F5] dark:from-[#14261C] dark:via-[#172D21]/90 dark:to-[#14261C] backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-16">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-3 sm:px-3.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/40 inline-block mb-2 sm:mb-3 backdrop-blur-sm">
            OUTILS & PRATIQUES QUOTIDIENNES
          </span>
          <h2 className="text-xl sm:text-4xl font-extrabold text-emerald-950 dark:text-white tracking-tight mb-2 sm:mb-3">
            Votre Compagnon Spirituel Intégral
          </h2>
          <p className="text-emerald-900/80 dark:text-emerald-100/80 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
            Accédez aux ressources essentielles pour votre prière, récitation coranique, orientation et invocations quotidiennes.
          </p>
        </div>

        {/* 2x2 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-7">
          {features.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                id={card.id}
                onClick={card.onClick}
                className="rounded-2xl sm:rounded-[28px] bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl border border-emerald-200/80 dark:border-emerald-500/25 p-4 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.3)] hover:shadow-[0_22px_50px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_22px_50px_rgba(0,0,0,0.45)] hover:border-emerald-400/50 transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden active:scale-[0.99]"
              >
                {/* Subtle Arabesque Pattern Background Inset */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] dark:opacity-[0.06] pointer-events-none overflow-hidden rounded-tr-2xl sm:rounded-tr-[28px]">
                  <img
                    src="/images/backgrounds/features_pattern_bg.jpg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Header Row: Icon + Title/Subtitle on Left, Badge on Right */}
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full ${card.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-lg text-neutral-900 dark:text-white leading-snug truncate">
                          {card.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-200/80 font-medium mt-0.5 truncate">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Badge */}
                    <span className={`${card.badgeStyle} border text-[9px] sm:text-[11px] font-bold tracking-wider px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase flex-shrink-0 shadow-2xs`}>
                      {card.badge}
                    </span>
                  </div>

                  {/* Description Text */}
                  <p className="text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm leading-relaxed mt-3 sm:mt-5 mb-4 sm:mb-8 font-normal">
                    {card.description}
                  </p>
                </div>

                {/* Bottom Row: Action text + Round Arrow Button */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-neutral-100 dark:border-white/10">
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-200 flex items-center gap-1 transition-colors">
                    {card.actionText}
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-emerald-300 transition-transform group-hover:translate-x-1" />
                  </span>

                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 dark:bg-white/10 ${card.arrowHover} flex items-center justify-center text-emerald-800 dark:text-white transition-all shrink-0`}>
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
