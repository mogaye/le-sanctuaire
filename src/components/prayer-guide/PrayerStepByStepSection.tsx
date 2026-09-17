import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  ZoomIn,
  BookOpen,
  X,
  Layers,
  Printer,
  Compass,
} from 'lucide-react';
import {
  COMPLETE_PRAYER_CHRONOLOGY,
  CompletePrayerStep,
} from '../../data/prayerGuideDocument';
import { PrayerIllustration, POSTURE_IMAGES } from '../PrayerIllustration';
import { CityData } from '../../types';

interface PrayerStepByStepSectionProps {
  selectedCity: CityData;
  onOpenQibla?: () => void;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
}

export const PrayerStepByStepSection: React.FC<PrayerStepByStepSectionProps> = ({
  selectedCity,
  onOpenQibla,
  onNextChapter,
  onPrevChapter,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'book'>('interactive');
  const [renderStyle, setRenderStyle] = useState<'3d' | 'vector'>('3d');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<{
    title: string;
    postureKey: CompletePrayerStep['postureKey'];
    stepNumber: number;
    description: string;
  } | null>(null);

  const steps = COMPLETE_PRAYER_CHRONOLOGY;
  const currentStep = steps[activeStepIndex];

  // Speech synthesis for authentic recitation
  const playStepAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Autoplay progression loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying) {
      timer = setTimeout(() => {
        if (activeStepIndex < steps.length - 1) {
          setActiveStepIndex((prev) => prev + 1);
        } else {
          setIsAutoPlaying(false);
        }
      }, 7000);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, activeStepIndex, steps.length]);

  return (
    <div className="space-y-6">
      {/* Chapter 6 Header Banner */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] bg-gradient-to-br from-[#122F20] to-[#0A1F15] text-white relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/30 text-[11px] sm:text-xs font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Chapitre 7 • Salat Al-Fajr (2 Rakas Complètes)</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              La Prière Pas-à-Pas : Du Début à la Fin
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Voici le déroulement intégral de la prière en 22 étapes successives, depuis l’Intention (Niyyah)
              et le Takbir jusqu’au Tashahhud, Salawat, Du’a et Taslim final.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="inline-flex p-1 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold shrink-0 self-start md:self-center">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                viewMode === 'interactive'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pas-à-Pas</span>
            </button>
            <button
              onClick={() => setViewMode('book')}
              className={`px-3 py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                viewMode === 'book'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Vue Livre</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE STEP-BY-STEP */}
      {viewMode === 'interactive' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Progress Tracker Card */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 transition-colors">
            <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#153424] to-[#0A1F14] text-amber-200 font-black text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0">
                {currentStep.step}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Étape {currentStep.step}/{steps.length}
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30">
                    {currentStep.phase}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white mt-0.5 truncate">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            {/* Stepper Carousel Pills */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar max-w-full py-0.5 w-full md:w-auto">
              {steps.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`h-7 px-2.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center active:scale-95 ${
                    idx === activeStepIndex
                      ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400/40'
                      : idx < activeStepIndex
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                      : 'bg-neutral-100 dark:bg-[#14281E] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#102018]'
                  }`}
                  title={s.title}
                >
                  <span>{s.step}</span>
                </button>
              ))}
            </div>

            {/* Auto-play toggle */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 active:scale-95 self-end md:self-auto ${
                isAutoPlaying
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40'
                  : 'bg-neutral-50 dark:bg-[#14281E] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-emerald-500/25 hover:bg-neutral-100 dark:hover:bg-[#102018]'
              }`}
            >
              {isAutoPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Défilement auto</span>
                </>
              )}
            </button>
          </div>

          {/* Dual Panel: 3D Model + Recitations & Guidelines */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
            {/* Left: 3D Posture Model Frame (Seamless transparent blend) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#193226] rounded-2xl sm:rounded-[32px] p-4 sm:p-6 md:p-8 border border-neutral-200 dark:border-emerald-500/25 shadow-2xs flex flex-col items-center justify-between text-center relative overflow-hidden transition-colors">
              <div className="w-full flex items-center justify-between mb-3">
                <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30">
                  {currentStep.category}
                </span>

                <div className="inline-flex p-0.5 rounded-lg sm:rounded-xl bg-neutral-100 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/25 text-xs font-bold">
                  <button
                    onClick={() => setRenderStyle('3d')}
                    className={`px-2.5 py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                      renderStyle === '3d'
                        ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-2xs font-extrabold'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Modèle 3D
                  </button>
                  <button
                    onClick={() => setRenderStyle('vector')}
                    className={`px-2.5 py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                      renderStyle === 'vector'
                        ? 'bg-emerald-700 dark:bg-emerald-800 text-white shadow-2xs font-extrabold'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    Schéma
                  </button>
                </div>
              </div>

              {/* Main Posture Display */}
              <div
                onClick={() =>
                  setEnlargedImage({
                    title: currentStep.title,
                    postureKey: currentStep.postureKey,
                    stepNumber: currentStep.step,
                    description: currentStep.postureDescription,
                  })
                }
                className="w-full max-w-[260px] sm:max-w-[280px] h-[240px] sm:h-[320px] relative flex items-center justify-center cursor-zoom-in group"
                title="Cliquez pour agrandir la posture en plein écran"
              >
                <PrayerIllustration
                  posture={currentStep.postureKey}
                  className="w-full h-full"
                  accentColor="#059669"
                  isAnimated={true}
                  viewMode={renderStyle}
                />
                <div className="absolute bottom-2 right-2 p-1.5 sm:p-2 bg-white/90 dark:bg-[#14281E]/90 rounded-xl shadow-xs text-neutral-700 dark:text-neutral-200 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] sm:text-[11px] font-bold border border-neutral-200/60 dark:border-emerald-500/20">
                  <ZoomIn className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Agrandir</span>
                </div>
              </div>

              {/* Posture Description */}
              <div className="mt-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed text-left w-full space-y-1.5">
                <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Description du Geste :</span>
                </div>
                <p>{currentStep.postureDescription}</p>
                {currentStep.notesFromGuide && (
                  <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 pt-1 border-t border-neutral-200 dark:border-emerald-800/40">
                    {currentStep.notesFromGuide}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Recitations, Verses Breakdown & Rules */}
            <div className="lg:col-span-7 bg-white dark:bg-[#193226] rounded-2xl sm:rounded-[32px] p-4 sm:p-6 md:p-8 border border-neutral-200 dark:border-emerald-500/25 shadow-2xs flex flex-col justify-between space-y-4 sm:space-y-5 transition-colors">
              <div className="space-y-4">
                {/* Header with audio button */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-emerald-800/40">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Paroles & Invocations
                    </span>
                    <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                      Récitation Prescrite
                    </h3>
                  </div>

                  <button
                    onClick={() => playStepAudio(currentStep.arabic)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95 ${
                      isPlayingAudio
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>{isPlayingAudio ? 'Récitation...' : 'Écouter l’arabe'}</span>
                  </button>
                </div>

                {/* Arabic Calligraphy Display */}
                <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 text-center shadow-inner relative">
                  <p className="font-arabic text-2xl sm:text-3xl text-neutral-900 dark:text-neutral-100 leading-loose font-medium selection:bg-amber-200">
                    {currentStep.arabic}
                  </p>
                </div>

                {/* Phonetics & Meaning */}
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-500/30">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                      Phonétique (guide de prononciation) :
                    </div>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 italic leading-relaxed">
                      « {currentStep.phonetic} »
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      Traduction en Français :
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 font-medium leading-relaxed">
                      {currentStep.french}
                    </p>
                  </div>
                </div>

                {/* Verses Breakdown if available (e.g., Fatiha, Ikhlas, Kawthar) */}
                {currentStep.verses && currentStep.verses.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Détail verset par verset :</span>
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {currentStep.verses.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#14281E] border border-neutral-200/80 dark:border-emerald-500/20 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-arabic text-base text-emerald-950 dark:text-emerald-300 font-bold">
                              {v.arabic}
                            </span>
                            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 italic">
                              {v.phonetic}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-700 dark:text-neutral-300">{v.french}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rule & Sunnah box */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-500/30 text-xs">
                  <div className="font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                    <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Règle & Conseil :</span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-normal">{currentStep.fiqhTips}</p>
                </div>
              </div>

              {/* Bottom Step Navigation Bar */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-neutral-100 dark:border-emerald-800/40">
                <button
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-emerald-500/30 hover:bg-neutral-50 dark:hover:bg-[#14281E] disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                >
                  <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
                  <span className="hidden sm:inline">Étape précédente</span>
                  <span className="sm:hidden">Précédent</span>
                </button>

                <div className="px-2.5 sm:px-3 py-1 rounded-full bg-neutral-100 dark:bg-[#14281E] text-[11px] sm:text-xs font-black text-neutral-600 dark:text-neutral-300 whitespace-nowrap shrink-0">
                  {activeStepIndex + 1} / {steps.length}
                </div>

                <button
                  disabled={activeStepIndex === steps.length - 1}
                  onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs text-white shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                >
                  <span className="hidden sm:inline">Étape suivante</span>
                  <span className="sm:hidden">Suivant</span>
                  <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BOOK STYLE CONTINUOUS OVERVIEW */}
      {viewMode === 'book' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Vue Livre Continue (22 Étapes du Guide)
              </span>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-0.5">
                Déroulement Intégral de la Prière du Début à la Fin
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                L’ensemble des 22 étapes récapitulées avec leurs postures et formules rituelles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.step}
                className="p-6 sm:p-8 rounded-[28px] bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/25 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col md:flex-row items-start justify-between gap-6"
              >
                {/* Number + Illustration */}
                <div className="flex flex-row md:flex-col items-center gap-4 shrink-0 min-w-[140px]">
                  <div className="w-10 h-10 rounded-full border-2 border-neutral-900 dark:border-emerald-400 flex items-center justify-center font-black text-neutral-900 dark:text-white text-base">
                    {step.step}
                  </div>

                  <div
                    onClick={() =>
                      setEnlargedImage({
                        title: step.title,
                        postureKey: step.postureKey,
                        stepNumber: step.step,
                        description: step.postureDescription,
                      })
                    }
                    className="relative cursor-zoom-in p-1 bg-transparent hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 rounded-2xl transition-all"
                    title="Agrandir"
                  >
                    <PrayerIllustration
                      posture={step.postureKey}
                      className="w-28 h-36"
                      accentColor="#059669"
                      isAnimated={false}
                      viewMode={renderStyle}
                    />
                  </div>
                </div>

                {/* Recitation & Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                      {step.phase} • {step.category}
                    </span>
                    <button
                      onClick={() => playStepAudio(step.arabic)}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
                      title="Écouter"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    </button>
                  </div>

                  <h4 className="text-lg font-black text-neutral-900 dark:text-white">{step.title}</h4>

                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20">
                    <p className="font-arabic text-xl sm:text-2xl text-neutral-900 dark:text-neutral-100 leading-relaxed font-medium">
                      {step.arabic}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 italic leading-relaxed">
                    « {step.phonetic} »
                  </p>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">{step.french}</p>
                </div>

                {/* Guidance notes */}
                <div className="w-full md:w-64 p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 text-xs space-y-2 shrink-0">
                  <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Détails de la Posture</span>
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{step.postureDescription}</p>
                  <div className="pt-2 border-t border-neutral-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                    {step.fiqhTips}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {onPrevChapter && (
          <button
            onClick={onPrevChapter}
            className="inline-flex items-center justify-center sm:justify-start gap-2 px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-[#193226] hover:bg-neutral-200 dark:hover:bg-[#14281E] text-neutral-700 dark:text-neutral-200 text-xs font-bold transition-all cursor-pointer text-left active:scale-95 border border-neutral-200 dark:border-emerald-500/20"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <span>Chapitre 6 : L’Adhan & L’Iqamat</span>
          </button>
        )}
        {onNextChapter && (
          <button
            onClick={onNextChapter}
            className="inline-flex items-center justify-center sm:justify-end gap-2 px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 text-left sm:text-right sm:ml-auto"
          >
            <span>Passer au Chapitre 8 : Sourates Courtes & Règles de Voix</span>
            <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        )}
      </div>

      {/* Lightbox Modal */}
      {enlargedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative bg-white dark:bg-[#193226] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-neutral-200 dark:border-emerald-500/25 p-6 flex flex-col items-center text-center space-y-4 max-h-[90vh] overflow-y-auto transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pt-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold uppercase tracking-wider">
                Étape {enlargedImage.stepNumber} • Vue Agrandie
              </span>
              <h3 className="text-xl font-black text-neutral-900 dark:text-white mt-2">
                {enlargedImage.title}
              </h3>
            </div>

            <div className="w-full max-w-xs h-[380px] rounded-3xl bg-white p-2 flex items-center justify-center overflow-hidden">
              <picture className="w-full h-full flex items-center justify-center">
                <source
                  srcSet={
                    POSTURE_IMAGES[enlargedImage.postureKey]?.webp ||
                    `/images/prayer/${enlargedImage.postureKey}.webp`
                  }
                  type="image/webp"
                />
                <img
                  src={
                    POSTURE_IMAGES[enlargedImage.postureKey]?.jpg ||
                    `/images/prayer/${enlargedImage.postureKey}.jpg`
                  }
                  alt={enlargedImage.title}
                  className="w-full h-full object-contain select-none mix-blend-multiply"
                  style={{
                    WebkitMaskImage:
                      'radial-gradient(ellipse 92% 90% at 50% 50%, black 75%, transparent 100%)',
                    maskImage:
                      'radial-gradient(ellipse 92% 90% at 50% 50%, black 75%, transparent 100%)',
                  }}
                />
              </picture>
            </div>

            <p className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-[#14281E] p-3 rounded-2xl border border-neutral-200 dark:border-emerald-500/20 text-left">
              {enlargedImage.description}
            </p>

            <button
              onClick={() => setEnlargedImage(null)}
              className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
