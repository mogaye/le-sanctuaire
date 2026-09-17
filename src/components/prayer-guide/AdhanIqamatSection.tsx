import React, { useState } from 'react';
import { Volume2, Sparkles, Bell, Radio, ArrowRight, ArrowLeft } from 'lucide-react';
import { ADHAN_CALL_LINES, IQAMAT_LINES, AdhanLine } from '../../data/prayerGuideDocument';

interface AdhanIqamatSectionProps {
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const AdhanIqamatSection: React.FC<AdhanIqamatSectionProps> = ({
  onNextChapter,
  onPrevChapter,
}) => {
  const [playingText, setPlayingText] = useState<string | null>(null);

  const playAudio = (arabicText: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(arabicText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      setPlayingText(arabicText);
      utterance.onend = () => setPlayingText(null);
      utterance.onerror = () => setPlayingText(null);
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
            <span>Chapitre 6 • Appels Rituels</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            L’Azan (L’Appel) et l’Iqamat (L’Annonce Immédiate)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            « L’Azan est l’appel à la prière et il est recommandé, avant les prières, de prononcer l’Al-Azán.
            Avant de commencer effectivement la prière, l’IQAMAT est ensuite récité. »
          </p>
        </div>
      </div>

      {/* Side-by-Side: Adhan & Iqamat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* L'Adhan */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-3 sm:space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-emerald-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                  L’Azan (Al-Adhân)
                </h3>
                <span className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                  Grand appel à la prière
                </span>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
              Avant la prière
            </span>
          </div>

          <div className="space-y-2.5">
            {ADHAN_CALL_LINES.map((line, idx) => {
              const isPlaying = playingText === line.arabic;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    line.isFajrOnly
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/30'
                      : 'bg-neutral-50/70 dark:bg-[#14281E] border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-neutral-200 dark:bg-[#193226] text-neutral-800 dark:text-neutral-200">
                        {line.repeat} fois
                      </span>
                      {line.isFajrOnly && (
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                          Salat Fajr uniquement
                        </span>
                      )}
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {line.phonetic}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {line.french}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-arabic text-sm text-emerald-950 dark:text-emerald-200 font-bold hidden sm:inline">
                      {line.arabic}
                    </span>
                    <button
                      onClick={() => playAudio(line.arabic)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'bg-white dark:bg-[#193226] hover:bg-emerald-50 dark:hover:bg-[#14281E] text-emerald-800 dark:text-emerald-300 border border-neutral-200 dark:border-emerald-500/30'
                      }`}
                      title="Écouter la prononciation arabe"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Obs du Guide :</strong> Au Salat Fajr (Aube), il faut prononcer après le <em>Hayya alá’l Faláh</em> : <strong>« La Salat Hairum Mina Naum »</strong> (La prière est meilleure que le sommeil).
          </div>
        </div>

        {/* L'Iqamat */}
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-xs space-y-3 sm:space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-emerald-800/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                  L’Iqamat (L’Annonce Immédiate)
                </h3>
                <span className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                  Récité juste avant de démarrer
                </span>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs bg-neutral-100 dark:bg-[#14281E] text-neutral-800 dark:text-neutral-200 font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-neutral-200 dark:border-emerald-500/30">
              Immédiat
            </span>
          </div>

          <div className="space-y-2.5">
            {IQAMAT_LINES.map((line, idx) => {
              const isPlaying = playingText === line.arabic;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-neutral-50/70 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 hover:border-emerald-400 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-neutral-200 dark:bg-[#193226] text-neutral-800 dark:text-neutral-200">
                        {line.repeat} fois
                      </span>
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {line.phonetic}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {line.french}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-arabic text-sm text-emerald-950 dark:text-emerald-200 font-bold hidden sm:inline">
                      {line.arabic}
                    </span>
                    <button
                      onClick={() => playAudio(line.arabic)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'bg-white dark:bg-[#193226] hover:bg-emerald-50 dark:hover:bg-[#14281E] text-emerald-800 dark:text-emerald-300 border border-neutral-200 dark:border-emerald-500/30'
                      }`}
                      title="Écouter la prononciation arabe"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <strong>Prêt pour la Prière :</strong> Dès la fin de l’Iqamat, vous êtes debout face à la Kaaba pour débuter le <em>Salat Al-Fajr</em> avec l’Intention (Níyeh) et le Takbir !
          </div>
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
            <span>Chapitre 5 : Doutes & Sujûd as-Sahw</span>
          </button>
        )}
        {onNextChapter && (
          <button
            onClick={onNextChapter}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 sm:ml-auto"
          >
            <span>Passer au Chapitre 7 : La Prière Pas-à-Pas</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
