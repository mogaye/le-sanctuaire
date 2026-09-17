import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Sparkles,
  VolumeX,
  Layers,
  ChevronRight,
  ShieldCheck,
  Award,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  SHORT_SURAS_FOR_PRAYER,
  PRAYER_STRUCTURES_SCHEMES,
  ShortSura,
  PrayerStructureScheme,
} from '../../data/prayerGuideDocument';

interface ShortSurasSectionProps {
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const ShortSurasSection: React.FC<ShortSurasSectionProps> = ({
  onNextChapter,
  onPrevChapter,
}) => {
  const [subTab, setSubTab] = useState<'suras' | 'structure'>('suras');
  const [selectedSuraIndex, setSelectedSuraIndex] = useState(0);
  const [selectedPrayerKey, setSelectedPrayerKey] = useState<'F' | 'D' | 'A' | 'M' | 'I'>('F');
  const [isPlaying, setIsPlaying] = useState(false);

  const activeSura: ShortSura = SHORT_SURAS_FOR_PRAYER[selectedSuraIndex] || SHORT_SURAS_FOR_PRAYER[0];
  const activeStructure: PrayerStructureScheme =
    PRAYER_STRUCTURES_SCHEMES.find((p) => p.key === selectedPrayerKey) || PRAYER_STRUCTURES_SCHEMES[0];

  const playSuraArabic = (arabicText: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(arabicText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#122F20] to-[#0A1F15] text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[10px] sm:text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Chapitre 8 • Récitation & Architecture</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Les Courtes Sourates & la Voix (Sirr & Jahr)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Consultez le texte arabe, la phonétique mot-à-mot et la traduction des 5 sourates courtes indispensables pour la prière, et découvrez l’architecture précise de chaque prière (2, 3 et 4 unités avec règles de voix haute ou basse).
          </p>
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 gap-1 sm:gap-1.5 shadow-xs max-w-md mx-auto transition-colors">
        <button
          onClick={() => setSubTab('suras')}
          className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
            subTab === 'suras'
              ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#14281E]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>5 Sourates</span>
        </button>

        <button
          onClick={() => setSubTab('structure')}
          className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${
            subTab === 'structure'
              ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-emerald-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-[#14281E]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Structure des Prières</span>
        </button>
      </div>

      {/* TAB 1: 5 SHORT SURAS */}
      {subTab === 'suras' && (
        <div className="space-y-6">
          {/* Sura selector carousel */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SHORT_SURAS_FOR_PRAYER.map((sura, idx) => {
              const isSelected = selectedSuraIndex === idx;
              return (
                <button
                  key={sura.number}
                  onClick={() => {
                    setSelectedSuraIndex(idx);
                    stopAudio();
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left space-y-1 ${
                    isSelected
                      ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-700 shadow-xs ring-2 ring-emerald-400/40'
                      : 'bg-white dark:bg-[#193226] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-emerald-500/25 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold opacity-70">
                      N° {sura.number}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-white/10">
                      {sura.versesCount} v.
                    </span>
                  </div>
                  <h4 className="text-xs font-black truncate">{sura.name}</h4>
                  <span className="font-arabic text-sm block">{sura.arabicName}</span>
                </button>
              );
            })}
          </div>

          {/* Active Sura Reader Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-emerald-800/40">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Sourate {activeSura.number} • {activeSura.versesCount} Versets
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  {activeSura.name}
                </h3>
              </div>

              {/* Audio Play Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isPlaying) {
                      stopAudio();
                    } else {
                      const fullArabic = activeSura.verses.map((v) => v.arabic).join(' ');
                      playSuraArabic(fullArabic);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                    isPlaying
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Arrêter la Récitation</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-amber-300" />
                      <span>Écouter la Sourate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Verses Breakdown */}
            <div className="space-y-4">
              {activeSura.verses.map((verse, vIdx) => (
                <div
                  key={vIdx}
                  className="p-4 rounded-2xl bg-neutral-50/70 dark:bg-[#14281E] border border-neutral-200/80 dark:border-emerald-500/20 space-y-2 hover:border-emerald-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-1">
                      {vIdx + 1}
                    </span>
                    <p className="font-arabic text-lg sm:text-xl text-emerald-950 dark:text-emerald-100 text-right leading-loose flex-1">
                      {verse.arabic}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/50 dark:border-emerald-800/30 space-y-1 text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300 italic">
                      {verse.phonetic}
                    </p>
                    <p className="text-neutral-700 dark:text-neutral-300">
                      « {verse.french} »
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRAYER STRUCTURES & VOICE RULES (SIRR / JAHR) */}
      {subTab === 'structure' && (
        <div className="space-y-6">
          {/* Quick prayer switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PRAYER_STRUCTURES_SCHEMES.map((p) => {
              const isSelected = selectedPrayerKey === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setSelectedPrayerKey(p.key)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-center space-y-1 ${
                    isSelected
                      ? 'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-700 shadow-xs ring-2 ring-emerald-400/40'
                      : 'bg-white dark:bg-[#193226] text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-emerald-500/25 hover:border-emerald-400'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                    {p.totalRakats} Rak‘ats
                  </span>
                  <h4 className="text-xs font-black">{p.name}</h4>
                  <span className="font-arabic text-xs block">{p.arabicName}</span>
                </button>
              );
            })}
          </div>

          {/* Active Prayer Detail */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-emerald-800/40">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold text-xs mb-1">
                  <span>{activeStructure.name} ({activeStructure.arabicName})</span>
                </div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                  Déroulement complet : {activeStructure.totalRakats} Unités de Prière
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-neutral-400 dark:text-neutral-400 block">Règle de voix :</span>
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                  {activeStructure.voiceRule}
                </span>
              </div>
            </div>

            {/* Rakats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeStructure.rakatsBreakdown.map((r) => (
                <div
                  key={r.rakatNumber}
                  className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-emerald-800 dark:bg-emerald-700 text-white flex items-center justify-center text-xs font-black">
                      R{r.rakatNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        r.voice.includes('Haute')
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-500/30'
                      }`}
                    >
                      {r.voice}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-neutral-900 dark:text-white block">Récitation requise :</span>
                    <p className="text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#193226] p-2.5 rounded-xl border border-neutral-200 dark:border-emerald-500/20">
                      {r.recitation}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-neutral-900 dark:text-white block">Détails & gestes :</span>
                    <p className="text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#193226] p-2.5 rounded-xl border border-neutral-200 dark:border-emerald-500/20">
                      {r.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Special Fiqh Note for 3rd & 4th rakats */}
            {activeStructure.totalRakats > 2 && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-neutral-800 dark:text-neutral-200 space-y-1">
                <span className="font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Règle Fiqh pour les 3e et 4e Rak‘ats :</span>
                </span>
                <p className="leading-relaxed">
                  Dans la 3ème et 4ème rakat, seule la sourate Al-Fâtiha est récitée à voix basse (Sirr). Il n’y a pas de seconde sourate. Dans certaines traditions d’Ahl al-Bayt, on peut également réciter les quatre glorifications (At-Tasbîhât al-Arba’ah : « Subhan Allâh wal-hamdu lillâh wa lâ ilâha ill-Allâh wallâhu Akbar »).
                </p>
              </div>
            )}
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
            <span>Chapitre 7 : La Prière Pas à Pas</span>
          </button>
        )}
        {onNextChapter && (
          <button
            onClick={onNextChapter}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 sm:ml-auto"
          >
            <span>Passer au Chapitre 9 : Tasbih de Fatima</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
