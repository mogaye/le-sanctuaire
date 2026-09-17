import React from 'react';
import {
  Clock,
  ShieldCheck,
  Droplets,
  AlertTriangle,
  HelpCircle,
  Bell,
  Sparkles,
  BookOpen,
  Heart,
} from 'lucide-react';

export type GuideChapter =
  | 'horaires'
  | 'prerequis'
  | 'ablutions'
  | 'invalidation'
  | 'doutes'
  | 'adhan'
  | 'priere'
  | 'sourates'
  | 'tasbih'
  | 'speciales';

interface GuideNavigationTabsProps {
  activeChapter: GuideChapter;
  onSelectChapter: (ch: GuideChapter) => void;
}

export const GuideNavigationTabs: React.FC<GuideNavigationTabsProps> = ({
  activeChapter,
  onSelectChapter,
}) => {
  const tabs: { id: GuideChapter; label: string; icon: React.ReactNode; shortLabel: string }[] = [
    {
      id: 'horaires',
      label: '1. Prières & Sunan',
      shortLabel: '1. Prières',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    {
      id: 'prerequis',
      label: '2. Prérequis & Piliers',
      shortLabel: '2. Piliers',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    {
      id: 'ablutions',
      label: '3. Ablutions & Tayammum',
      shortLabel: '3. Ablutions',
      icon: <Droplets className="w-3.5 h-3.5" />,
    },
    {
      id: 'invalidation',
      label: '4. Ce qui Invalide',
      shortLabel: '4. Invalidations',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    {
      id: 'doutes',
      label: '5. Doutes & Sujûd as-Sahw',
      shortLabel: '5. Doutes',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
    },
    {
      id: 'adhan',
      label: '6. L’Adhan & Iqamat',
      shortLabel: '6. Adhan',
      icon: <Bell className="w-3.5 h-3.5" />,
    },
    {
      id: 'priere',
      label: '7. Prière Pas-à-Pas',
      shortLabel: '7. Prière',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      id: 'sourates',
      label: '8. Sourates & Règles Voix',
      shortLabel: '8. Sourates',
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      id: 'tasbih',
      label: '9. Tasbih de Fatima',
      shortLabel: '9. Tasbih',
      icon: <Heart className="w-3.5 h-3.5" />,
    },
    {
      id: 'speciales',
      label: '10. Janâza & Circonstances',
      shortLabel: '10. Janâza',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="bg-white/95 dark:bg-[#193226]/95 backdrop-blur-md border-b border-neutral-200 dark:border-emerald-500/25 sticky top-14 md:top-16 z-30 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth">
        {tabs.map((t) => {
          const isActive = activeChapter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectChapter(t.id)}
              className={`min-h-[40px] px-3 sm:px-3.5 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border active:scale-95 ${
                isActive
                  ? 'bg-emerald-700 dark:bg-emerald-800 text-white border-emerald-600 dark:border-emerald-400/50 shadow-xs ring-2 ring-emerald-500/40'
                  : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-400/40 hover:bg-neutral-200 dark:hover:bg-[#1E3B2E]'
              }`}
            >
              <span className={isActive ? 'text-amber-300' : 'text-emerald-600 dark:text-emerald-400'}>{t.icon}</span>
              <span className="hidden md:inline">{t.label}</span>
              <span className="md:hidden">{t.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

