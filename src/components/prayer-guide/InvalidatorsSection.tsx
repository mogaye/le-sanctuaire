import React from 'react';
import { AlertTriangle, XCircle, Sparkles, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { ABLUTION_INVALIDATORS, PRAYER_INVALIDATORS } from '../../data/prayerGuideDocument';

interface InvalidatorsSectionProps {
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const InvalidatorsSection: React.FC<InvalidatorsSectionProps> = ({
  onNextChapter,
  onPrevChapter,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#122F20] to-[#0A1F15] text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[10px] sm:text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>Chapitre 4 • Préservation de la Validité</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Éléments qui Invalident l’Ablution et la Prière
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Pour maintenir la pureté de votre acte d’adoration, il est indispensable de connaître
            les causes d’annulation de l’ablution ainsi que les comportements proscrits pendant la prière.
          </p>
        </div>
      </div>

      {/* Two Comparison Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Ce qui invalide l'ablution */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-3 sm:space-y-4 transition-colors">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-300 font-black text-xs sm:text-sm">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span>Tout ce qui invalide l’ablution (Mubtilat Al-Wudu) :</span>
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
            Si l’un de ces éléments survient après l’ablution, il devient obligatoire de la refaire :
          </p>
          <ul className="space-y-2 sm:space-y-2.5">
            {ABLUTION_INVALIDATORS.map((inv, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-50/50 dark:bg-[#14281E] border border-amber-100 dark:border-amber-500/20 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 dark:text-amber-300">{idx + 1}. </span>
                  <span>{inv}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Ce qui invalide la prière */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-3 sm:space-y-4 transition-colors">
          <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-300 font-black text-xs sm:text-sm">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span>Éléments qui invalident la prière (Mubtilat As-Salat) :</span>
          </div>
          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
            Ces actes rompent la connexion avec Dieu et rendent la prière nulle :
          </p>
          <ul className="space-y-1.5 sm:space-y-2">
            {PRAYER_INVALIDATORS.map((inv, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-50/50 dark:bg-[#14281E] border border-rose-100 dark:border-rose-500/20 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{inv}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
        {onPrevChapter && (
          <button
            onClick={onPrevChapter}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] hover:bg-neutral-200 dark:hover:bg-[#14281E] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-500/20 active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span>Chapitre 3 : Les Ablutions</span>
          </button>
        )}
        {onNextChapter && (
          <button
            onClick={onNextChapter}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 sm:ml-auto"
          >
            <span>Passer au Chapitre 5 : Doutes & Sujûd as-Sahw</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
