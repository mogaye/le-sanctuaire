import React, { useState } from 'react';
import {
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Smile,
  Hand,
  Footprints,
  Info,
  Layers,
  Volume2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  ABLUTION_RECOMMENDATIONS,
  ABLUTION_WATER_CONDITIONS,
  ABLUTION_STEPS_LIST,
  TAYAMMUM_DATA,
  WUDU_AUTHENTIC_DUA,
  GHUSL_OBLIGATION_CAUSES,
  GHUSL_STEPS_PROPHETIC,
} from '../../data/prayerGuideDocument';

interface AblutionSectionProps {
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const AblutionSection: React.FC<AblutionSectionProps> = ({
  onNextChapter,
  onPrevChapter,
}) => {
  const [purificationMode, setPurificationMode] = useState<'wudu' | 'tayammum' | 'ghusl'>('wudu');

  const playDuaAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smile':
        return <Smile className="w-5 h-5 text-emerald-700" />;
      case 'Hand':
        return <Hand className="w-5 h-5 text-teal-700" />;
      case 'Footprints':
        return <Footprints className="w-5 h-5 text-blue-700" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-600" />;
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
            <span>Chapitre 3 • Purification Rituelle</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Les Ablutions : À l’Eau (Wudhu) & Sèches (Tayammum)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            « Le plus important dans cet acte est l’intention. En réalisant l’Ablution ou la Purification,
            il doit y avoir la conscience que nous nous purifions pour parler avec Allah (Loué soit-Il),
            par conséquent, cela doit être fait avec le plus de sincérité possible. »
          </p>
        </div>
      </div>

      {/* Mode Selector: Wudu vs Tayammum vs Ghusl */}
      <div className="flex p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 gap-1 sm:gap-1.5 shadow-xs max-w-xl mx-auto transition-colors">
        <button
          onClick={() => setPurificationMode('wudu')}
          className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 active:scale-95 ${
            purificationMode === 'wudu'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <span>Wudhu</span>
        </button>

        <button
          onClick={() => setPurificationMode('ghusl')}
          className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 active:scale-95 ${
            purificationMode === 'ghusl'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          <span>Al-Ghusl</span>
        </button>

        <button
          onClick={() => setPurificationMode('tayammum')}
          className={`flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 active:scale-95 ${
            purificationMode === 'tayammum'
              ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#14281E]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>Tayammum</span>
        </button>
      </div>

      {/* SECTION 1: WUDU (WATER ABLUTION) */}
      {purificationMode === 'wudu' && (
        <div className="space-y-6">
          {/* Recommendations and Water Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommandations */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-sm">
                <Droplets className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Recommandations Préliminaires :</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Il est important que l’ablution soit faite dans cet ordre préliminaire :
              </p>
              <ul className="space-y-2.5">
                {ABLUTION_RECOMMENDATIONS.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conditions de l'eau */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-sm">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Conditions Requises Pour l’Eau d’Ablution :</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Quatre conditions fondamentales établies dans le guide :
              </p>
              <ul className="space-y-2.5">
                {ABLUTION_WATER_CONDITIONS.map((cond, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The 6 Steps Illustrated */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Comment Abluir ? Les 6 Étapes Pas à Pas</span>
              </h3>
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                De Haut en Bas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ABLUTION_STEPS_LIST.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-5 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center">
                        {getStepIcon(step.iconName)}
                      </div>
                      <span className="w-6 h-6 rounded-full bg-emerald-900 dark:bg-emerald-700 text-white flex items-center justify-center text-xs font-black">
                        {step.stepNumber}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                      {step.title}
                    </h4>

                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                      {step.instruction}
                    </p>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {step.details}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-emerald-800/40 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{step.importantTip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Authentic Post-Wudu Dua Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#123321] to-[#0B2014] text-white space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                  {WUDU_AUTHENTIC_DUA.title}
                </span>
                <p className="text-xs text-emerald-200">
                  {WUDU_AUTHENTIC_DUA.narrator} {WUDU_AUTHENTIC_DUA.hadithText}
                </p>
              </div>

              <button
                onClick={() => playDuaAudio(WUDU_AUTHENTIC_DUA.arabic)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Écouter le Du’a</span>
              </button>
            </div>

            <p className="font-arabic text-xl sm:text-2xl text-amber-100 text-center py-2 leading-relaxed">
              {WUDU_AUTHENTIC_DUA.arabic}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-emerald-300 font-bold block mb-1">Phonétique :</span>
                <p className="text-emerald-100 italic leading-relaxed">
                  {WUDU_AUTHENTIC_DUA.phonetic}
                </p>
              </div>
              <div>
                <span className="text-emerald-300 font-bold block mb-1">Traduction :</span>
                <p className="text-emerald-100 leading-relaxed">
                  {WUDU_AUTHENTIC_DUA.french}
                </p>
              </div>
            </div>

            <span className="text-[10px] text-emerald-300/80 block pt-1">
              Source : {WUDU_AUTHENTIC_DUA.reference}
            </span>
          </div>
        </div>
      )}

      {/* SECTION 2: TAYAMMUM (DRY PURIFICATION) */}
      {purificationMode === 'tayammum' && (
        <div className="space-y-6">
          {/* Quran verse banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#2D2416] to-[#1C160E] text-white space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <BookOpen className="w-4 h-4" />
              <span>Fondement Coranique du Tayammum</span>
            </div>
            <p className="font-arabic text-lg sm:text-xl text-amber-100 text-right leading-relaxed">
              {TAYAMMUM_DATA.quranVerse.arabic}
            </p>
            <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed italic">
              {TAYAMMUM_DATA.quranVerse.translation}
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed pt-1">
              {TAYAMMUM_DATA.definition}
            </p>
          </div>

          {/* 7 Causes of Recourse and Authorized Materials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Causes */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-black text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Quand le Tayammum devient-il obligatoire ou permis ?</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                5 cas majeurs tirés des ouvrages de jurisprudence islamique :
              </p>
              <div className="space-y-2.5">
                {TAYAMMUM_DATA.causesOfRecourse.map((c, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-amber-50/50 dark:bg-[#14281E] border border-amber-100 dark:border-amber-500/20 space-y-1">
                    <span className="text-xs font-bold text-amber-950 dark:text-amber-300 block">
                      {i + 1}. {c.title}
                    </span>
                    <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-4 flex flex-col justify-between transition-colors">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-sm">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Matières Pures Autorisées pour le Tayammum :</span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  La purification s’effectue sur des éléments naturels purs :
                </p>
                <div className="space-y-2">
                  {TAYAMMUM_DATA.authorizedMaterials.map((mat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-[#14281E] border border-emerald-100 dark:border-emerald-500/20 text-xs font-medium text-emerald-950 dark:text-emerald-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{mat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                <span className="font-bold text-neutral-900 dark:text-white block">Règle de pureté :</span>
                <p className="leading-relaxed">
                  La matière doit être exempte de toute souillure (Najâsah). Si de la terre propre n’est pas disponible, une pierre brute ou un carrelage non vitrifié propre est parfaitement valable.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Steps of Tayammum */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                Comment Accomplir le Tayammum ? Les 4 Étapes
              </h3>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/30">
                Rapide & Universel
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TAYAMMUM_DATA.steps.map((st) => (
                <div
                  key={st.step}
                  className="p-5 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs flex flex-col justify-between space-y-3 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-black">
                        {st.step}
                      </span>
                      {st.arabic && (
                        <span className="font-arabic text-emerald-900 dark:text-emerald-300 font-bold text-sm">
                          {st.arabic}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">{st.title}</h4>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                      {st.description}
                    </p>
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-emerald-800/40 leading-relaxed">
                    {st.details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: AL-GHUSL (GRANDES ABLUTIONS / PURIFICATION MAJEURE) */}
      {purificationMode === 'ghusl' && (
        <div className="space-y-6">
          {/* Causes d'obligation du Ghusl */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-500/30 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-black text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Causes qui rendent le Ghusl (Lavage Majeur) STRICTEMENT OBLIGATOIRE :</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
              Tant que le Ghusl n'a pas été accompli après l'un de ces événements, la prière (Salât), le Tawâf et le toucher du Coran en arabe sont interdits et non valides :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {GHUSL_OBLIGATION_CAUSES.map((cause, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/90 dark:bg-[#14281E] border border-amber-200/60 dark:border-amber-500/20 shadow-xs text-xs text-neutral-800 dark:text-neutral-200 font-medium"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{cause}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Étapes du Ghusl prophétique */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-300 font-black text-base">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>La Méthode Prophétique du Ghusl (Étape par Étape)</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                7 étapes complètes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GHUSL_STEPS_PROPHETIC.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-400 transition-all space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center text-xs font-black shadow-xs">
                      {step.stepNumber}
                    </span>
                    <span className="text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Étape {step.stepNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">{step.title}</h4>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                    {step.description}
                  </p>
                  <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-500/20 text-[11px] text-emerald-900 dark:text-emerald-300 font-semibold leading-relaxed">
                    💡 <span className="underline">Règle :</span> {step.hadithOrFiqhNote}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
        {onPrevChapter && (
          <button
            onClick={onPrevChapter}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-neutral-100 dark:bg-[#193226] hover:bg-neutral-200 dark:hover:bg-[#14281E] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer border border-neutral-200 dark:border-emerald-500/20 active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span>Chapitre 2 : Conditions Préalables</span>
          </button>
        )}
        {onNextChapter && (
          <button
            onClick={onNextChapter}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 sm:ml-auto"
          >
            <span>Passer au Chapitre 4 : Ce qui Invalide</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};

