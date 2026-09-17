import React, { useState } from 'react';
import { Sparkles, Heart, Users, Compass, ShieldCheck, Volume2, CheckCircle2 } from 'lucide-react';
import { SPECIAL_PRAYERS_COLLECTION } from '../../data/prayerGuideDocument';

interface SpecialPrayersSectionProps {
  onPrevChapter?: () => void;
}

export const SpecialPrayersSection: React.FC<SpecialPrayersSectionProps> = ({ onPrevChapter }) => {
  const [selectedPrayerId, setSelectedPrayerId] = useState<string>('janaza');

  const selectedPrayer =
    SPECIAL_PRAYERS_COLLECTION.find((p) => p.id === selectedPrayerId) ||
    SPECIAL_PRAYERS_COLLECTION[0];

  const playArabicAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#122F20] to-[#0A1F15] text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[10px] sm:text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>Chapitre 10 • Prières Spéciales & Circonstancielles</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Salât Al-Janâzah, Istikhârah & Prière du Voyageur
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Maîtrisez le déroulement précis des prières solennelles : la prière mortuaire (Salat Al-Janaza) et ses 4 Takbirs pour honorer nos défunts, la prière de consultation (Istikhara) pour éclairer nos choix, et les règles de raccourcissement du voyageur.
          </p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 gap-1 sm:gap-1.5 shadow-xs max-w-lg mx-auto transition-colors">
        {SPECIAL_PRAYERS_COLLECTION.map((p) => {
          const isActive = selectedPrayerId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPrayerId(p.id)}
              className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
                isActive
                  ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#14281E]'
              }`}
            >
              {p.id === 'janaza' && <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
              {p.id === 'istikhara' && <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
              {p.id === 'voyageur' && <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />}
              <span>{p.title.split('(')[0].trim()}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Prayer Detail Card */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 sm:space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-arabic text-xl font-bold text-emerald-900 dark:text-emerald-300">
                {selectedPrayer.arabicName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                {selectedPrayer.rakats}
              </span>
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-1">{selectedPrayer.title}</h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
          {selectedPrayer.description}
        </p>

        {/* Steps */}
        <div className="space-y-4 pt-2">
          {selectedPrayer.steps.map((st, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-neutral-50/80 dark:bg-[#14281E] border border-neutral-200/80 dark:border-emerald-500/20 hover:border-emerald-400 transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-emerald-800 dark:bg-emerald-700 text-amber-300 flex items-center justify-center text-xs font-black shadow-xs">
                    {idx + 1}
                  </span>
                  <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">{st.title}</h4>
                </div>
                {st.arabic && (
                  <button
                    onClick={() => playArabicAudio(st.arabic!)}
                    className="p-1.5 rounded-xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-[#102018] text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-xs"
                    title="Écouter la récitation en arabe"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Écouter</span>
                  </button>
                )}
              </div>

              {st.arabic && (
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-[#102018] border border-emerald-100 dark:border-emerald-800/40 text-right">
                  <p className="font-arabic text-base sm:text-lg text-emerald-950 dark:text-emerald-100 font-bold leading-loose">
                    {st.arabic}
                  </p>
                </div>
              )}

              {st.phonetic && (
                <p className="text-xs text-emerald-900 dark:text-emerald-300 font-semibold italic bg-white/70 dark:bg-[#193226] p-2.5 rounded-xl border border-neutral-200/60 dark:border-emerald-500/20">
                  {st.phonetic}
                </p>
              )}

              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                {st.french}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      {onPrevChapter && (
        <div className="pt-2">
          <button
            onClick={onPrevChapter}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-100 dark:bg-[#193226] hover:bg-neutral-200 dark:hover:bg-[#14281E] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-500/20"
          >
            <span>← Chapitre 9 : Tasbih de Fatima</span>
          </button>
        </div>
      )}
    </div>
  );
};
