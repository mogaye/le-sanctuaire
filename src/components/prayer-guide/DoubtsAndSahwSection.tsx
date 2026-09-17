import React, { useState } from 'react';
import {
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Volume2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { DOUBTS_AND_SAHW_DATA } from '../../data/prayerGuideDocument';

interface DoubtsAndSahwSectionProps {
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const DoubtsAndSahwSection: React.FC<DoubtsAndSahwSectionProps> = ({
  onNextChapter,
  onPrevChapter,
}) => {
  const [activeTab, setActiveTab] = useState<'solver' | 'categories' | 'howto'>('solver');
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);

  const playDuaAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const data = DOUBTS_AND_SAHW_DATA;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#122F20] to-[#0A1F15] text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[10px] sm:text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
            <span>Chapitre 5 • Ach-Choukouk & Réparations</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Les Doutes dans la Prière & la Prosternation de l’Oubli (Sujûd as-Sahw)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            {data.intro} Tiré des chapitres essentiels du livret de jurisprudence pour lever toute anxiété et réparer sa prière sereinement.
          </p>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 gap-1 sm:gap-1.5 shadow-xs max-w-xl mx-auto transition-colors">
        <button
          onClick={() => setActiveTab('solver')}
          className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 active:scale-95 ${
            activeTab === 'solver'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Simulateur</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 active:scale-95 ${
            activeTab === 'categories'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>3 Doutes</span>
        </button>

        <button
          onClick={() => setActiveTab('howto')}
          className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 active:scale-95 ${
            activeTab === 'howto'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Sujûd as-Sahw</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE DOUBT SOLVER */}
      {activeTab === 'solver' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scenarios List */}
          <div className="lg:col-span-5 space-y-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block px-1 mb-1">
              Sélectionnez votre cas de doute :
            </span>
            {data.repairableDoubts.map((item, idx) => {
              const isSelected = selectedScenarioIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedScenarioIndex(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400/30'
                      : 'bg-white dark:bg-[#193226] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-[#14281E]'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider block ${
                        isSelected ? 'text-emerald-300' : 'text-neutral-400'
                      }`}
                    >
                      Cas #{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold leading-snug">{item.question}</h4>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-2 ${
                      isSelected ? 'text-amber-300' : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Solution Display Box */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs flex flex-col justify-between space-y-6 transition-colors">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-xs font-bold">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Question Fiqh #{selectedScenarioIndex + 1}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
                « {data.repairableDoubts[selectedScenarioIndex].question} »
              </h3>

              <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-[#14281E] border border-emerald-200 dark:border-emerald-500/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Règle islamique et solution pratique :</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {data.repairableDoubts[selectedScenarioIndex].solution}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E]/60 border border-neutral-200/80 dark:border-emerald-500/20 text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5">
                <span className="font-bold text-neutral-900 dark:text-white block">
                  Principe fondamental du Fiqh :
                </span>
                <p className="leading-relaxed">
                  « La certitude ne s’efface pas par le doute » (Al-yaqīnu lā yazūlu bish-shakk). L’Islam privilégie toujours la solution qui dégage l’âme de toute hésitation sans recommencer inutilement la prière.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-emerald-800/40 flex items-center justify-between">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Besoin de voir le déroulement du Sujûd as-Sahw ?
              </span>
              <button
                onClick={() => setActiveTab('howto')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-200 cursor-pointer"
              >
                <span>Voir les étapes du Sujûd</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THE 3 CATEGORIES OF DOUBTS */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Category 1: Doutes sans effet */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-300 font-black text-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <span>1. Doutes SANS effet (Ignorés)</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Dans ces 3 situations, n’accordez aucune attention au doute :
            </p>
            <div className="space-y-3">
              {data.noEffectDoubts.map((d, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-[#14281E] border border-emerald-100 dark:border-emerald-500/20 space-y-1 text-xs"
                >
                  <span className="font-bold text-emerald-950 dark:text-emerald-300 block">{d.caseTitle}</span>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{d.rule}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category 2: Doutes invalidants */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-300 font-black text-sm">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              </div>
              <span>2. Doutes INVALIDANTS</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Ces doutes majeurs annulent la prière, qui doit être recommencée :
            </p>
            <div className="space-y-3">
              {data.invalidatingDoubts.map((d, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-rose-50/50 dark:bg-[#14281E] border border-rose-100 dark:border-rose-500/20 space-y-1 text-xs"
                >
                  <span className="font-bold text-rose-950 dark:text-rose-300 block">{d.caseTitle}</span>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{d.ruling}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category 3: Doutes réparables */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-300 font-black text-sm">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              </div>
              <span>3. Doutes RÉPARABLES</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Se traitent pendant ou juste après la prière sans recommencer :
            </p>
            <div className="space-y-3">
              {data.repairableDoubts.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-amber-50/50 dark:bg-[#14281E] border border-amber-100 dark:border-amber-500/20 space-y-1 text-xs"
                >
                  <span className="font-bold text-amber-950 dark:text-amber-300 block">{d.question}</span>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-3">{d.solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOW TO DO SUJUD AS-SAHW */}
      {activeTab === 'howto' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                  {data.sujudSahwHowTo.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Deux prosternations réparatrices simples accomplies après le salut final (ou juste avant).
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                2 Prosternations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              {data.sujudSahwHowTo.steps.map((st) => (
                <div
                  key={st.step}
                  className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 flex flex-col justify-between space-y-3 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-black">
                      {st.step}
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">{st.title}</h4>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {st.description}
                    </p>
                  </div>

                  {st.arabic && (
                    <div className="pt-2 border-t border-neutral-200 dark:border-emerald-800/40 space-y-1.5">
                      <p className="font-arabic text-sm text-emerald-950 dark:text-emerald-200 text-right leading-loose">
                        {st.arabic}
                      </p>
                      <button
                        onClick={() => playDuaAudio(st.arabic!)}
                        className="w-full py-1.5 px-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/60 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-950 dark:text-emerald-200 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                        <span>Écouter</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Highlighted invocation card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#133020] to-[#0D2116] text-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                L’Invocation consacrée du Sujûd as-Sahw (du livret de prière)
              </span>
              <button
                onClick={() =>
                  playDuaAudio(
                    'بِسْمِ اللَّهِ وَبِاللَّهِ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer border border-white/20"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Écouter la récitation</span>
              </button>
            </div>

            <p className="font-arabic text-xl sm:text-2xl text-amber-200 text-center py-2 leading-relaxed">
              بِسْمِ اللَّهِ وَبِاللَّهِ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-white/10">
              <div>
                <span className="text-emerald-300 font-bold block mb-0.5">Phonétique :</span>
                <p className="text-emerald-100 italic">
                  Bismi-llâhi wa bi-llâh. As-salâmu ‘alayka ayyuhan-Nabiyyu wa raḥmatullâhi wa barakâtuh.
                </p>
              </div>
              <div>
                <span className="text-emerald-300 font-bold block mb-0.5">Traduction :</span>
                <p className="text-emerald-100">
                  « Au nom d’Allah et par Allah. Que la paix soit sur toi, ô Prophète, ainsi que la miséricorde d’Allah et Ses bénédictions. »
                </p>
              </div>
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
            <span>Chapitre 4 : Ce qui Invalide</span>
          </button>
        )}
        {onNextChapter && (
          <button
            onClick={onNextChapter}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 sm:ml-auto"
          >
            <span>Passer au Chapitre 6 : L’Adhan & L’Iqamat</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
