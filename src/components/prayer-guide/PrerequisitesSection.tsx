import React, { useState } from 'react';
import {
  Compass,
  ShieldCheck,
  Shirt,
  Clock,
  Droplets,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  PRAYER_PREREQUISITES,
  PILLARS_VS_OBLIGATIONS_DATA,
} from '../../data/prayerGuideDocument';

interface PrerequisitesSectionProps {
  onOpenQibla?: () => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const PrerequisitesSection: React.FC<PrerequisitesSectionProps> = ({
  onOpenQibla,
  onNextChapter,
  onPrevChapter,
}) => {
  const [subTab, setSubTab] = useState<'shurut' | 'arkan'>('shurut');

  const getIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Droplets className="w-5 h-5 text-emerald-600" />;
      case 1:
        return <ShieldCheck className="w-5 h-5 text-teal-600" />;
      case 2:
        return <Compass className="w-5 h-5 text-amber-600" />;
      case 3:
        return <Shirt className="w-5 h-5 text-indigo-600" />;
      case 4:
      default:
        return <Clock className="w-5 h-5 text-rose-600" />;
    }
  };

  const arkanData = PILLARS_VS_OBLIGATIONS_DATA;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#122F20] to-[#0A1F15] text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[10px] sm:text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>Chapitre 2 • Conditions de Validité & Piliers</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Conditions Préalables & Distinction : Piliers vs Obligations
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Comprenez avec clarté les 5 conditions d’entrée en prière et la différence cruciale de jurisprudence entre les Piliers (Arkân, irréparables si omis) et les Obligations (Wâjibât, réparables par la prosternation de l’oubli).
          </p>
        </div>
      </div>

      {/* Sub-tabs Selector */}
      <div className="flex p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 gap-1 sm:gap-1.5 shadow-xs max-w-md mx-auto transition-colors">
        <button
          onClick={() => setSubTab('shurut')}
          className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
            subTab === 'shurut'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>5 Conditions</span>
        </button>

        <button
          onClick={() => setSubTab('arkan')}
          className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
            subTab === 'arkan'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Piliers vs Obligations</span>
        </button>
      </div>

      {/* TAB 1: 5 CONDITIONS PREALABLES */}
      {subTab === 'shurut' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRAYER_PREREQUISITES.map((req, idx) => (
              <div
                key={req.title}
                className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center">
                      {getIcon(idx)}
                    </div>
                    <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Condition {idx + 1} / {PRAYER_PREREQUISITES.length}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-neutral-900 dark:text-white">
                    {req.title}
                  </h3>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {req.description}
                  </p>
                </div>

                {/* Special Action Button for Qibla */}
                {idx === 2 && onOpenQibla && (
                  <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-emerald-800/40">
                    <button
                      onClick={onOpenQibla}
                      className="w-full py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-200 dark:border-emerald-500/30"
                    >
                      <Compass className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Ouvrir la Boussole de la Qibla</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Warning Box on Prayer Timing */}
          <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-500/30 flex items-start gap-4 transition-colors">
            <div className="w-9 h-9 rounded-2xl bg-rose-200/70 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 flex items-center justify-center shrink-0 font-bold text-sm">
              ⚠️
            </div>
            <div className="text-xs text-rose-950 dark:text-rose-200 space-y-1">
              <div className="font-bold text-sm text-rose-950 dark:text-rose-100">
                Avertissement du Guide sur le Temps Imparti :
              </div>
              <p className="leading-relaxed">
                « Il est important de commencer à prier uniquement pendant le temps où l’heure de la prière a commencé.
                Sinon, la prière deviendra invalide. »
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PILIERS (ARKAN) VS OBLIGATIONS (WAJIBAT) VS SUNAN */}
      {subTab === 'arkan' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed transition-colors">
            {arkanData.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Arkân (Piliers) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-black text-sm">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-700 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="block">{arkanData.pillars.name}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-500/30 text-xs text-rose-950 dark:text-rose-200 font-medium leading-relaxed">
                <strong>Règle juridique :</strong> {arkanData.pillars.rule}
              </div>

              <ul className="space-y-2.5">
                {arkanData.pillars.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200/80 dark:border-emerald-500/20 text-xs text-neutral-900 dark:text-neutral-100 space-y-1 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                      <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-900 dark:text-rose-200 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 pl-7">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Wâjibât (Obligations) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-700 dark:text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="block">{arkanData.obligations.name}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 font-medium leading-relaxed">
                <strong>Règle juridique :</strong> {arkanData.obligations.rule}
              </div>

              <ul className="space-y-2.5">
                {arkanData.obligations.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200/80 dark:border-emerald-500/20 text-xs text-neutral-900 dark:text-neutral-100 space-y-1 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 pl-7">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Sunan (Actes recommandés) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="block">{arkanData.sunan.name}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 font-medium leading-relaxed">
                <strong>Règle juridique :</strong> {arkanData.sunan.rule}
              </div>

              <ul className="space-y-2">
                {arkanData.sunan.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200/80 dark:border-emerald-500/20 text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
        {onPrevChapter && (
          <button
            onClick={onPrevChapter}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] hover:bg-neutral-200 dark:hover:bg-[#14281E] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-500/20 active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span>Chapitre 1 : Les 5 Prières</span>
          </button>
        )}
        {onNextChapter && (
          <button
            onClick={onNextChapter}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 sm:ml-auto"
          >
            <span>Passer au Chapitre 3 : Les Ablutions (Wudu)</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};

