import React, { useState } from 'react';
import { Monitor, Smartphone, Volume2, Sparkles, Compass, BookOpen, Clock, Check, ArrowRight } from 'lucide-react';
import { CityData } from '../types';
import { PRAYERS } from '../data/islamicData';

interface AppPreviewSectionProps {
  selectedCity: CityData;
  onOpenPrayerGuide: () => void;
  onOpenQuran: () => void;
  onOpenQibla: () => void;
  onOpenDhikr: () => void;
}

export const AppPreviewSection: React.FC<AppPreviewSectionProps> = ({
  selectedCity,
  onOpenPrayerGuide,
  onOpenQuran,
  onOpenQibla,
  onOpenDhikr,
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'desktop' | 'mobile'>('both');
  const [screenMode, setScreenMode] = useState<'prayers' | 'quran' | 'tasbih'>('prayers');
  const [mobileCount, setMobileCount] = useState<number>(33);

  return (
    <section className="w-full relative overflow-hidden py-10 sm:py-28 border-b border-emerald-200/60 dark:border-emerald-900/40">
      {/* Background Image behind the entire Preview Section */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/backgrounds/preview_arch_bg.jpg"
          alt="Arrière-plan sanctuaire et arcades"
          className="w-full h-full object-cover object-center opacity-10 dark:opacity-25"
        />
        {/* Harmonizing atmospheric gradient overlay for optimal legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7F5] via-[#EDF5F0] to-[#F4F7F5] dark:from-[#14261C] dark:via-[#172D21]/92 dark:to-[#14261C] backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-3.5 sm:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-14">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-3 sm:px-3.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/40 inline-block mb-2 sm:mb-3 backdrop-blur-sm">
            APERÇU MULTI-ÉCRANS
          </span>
          <h2 className="text-xl sm:text-4xl font-extrabold text-emerald-950 dark:text-white tracking-tight mb-2 sm:mb-3">
            Une Interface Fluide Sur Tous Vos Appareils
          </h2>
          <p className="text-emerald-900/80 dark:text-emerald-100/80 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
            Conçu pour vous offrir une clarté absolue et une réactivité instantanée, sur grand écran comme au creux de votre main.
          </p>

        {/* View Mode Switcher Controls */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
          <div className="inline-flex p-0.5 sm:p-1 rounded-full bg-emerald-100/70 dark:bg-white/10 border border-emerald-200 dark:border-white/20 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('both')}
              className={`flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                activeTab === 'both'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Vue Combinée</span>
            </button>

            <button
              onClick={() => setActiveTab('desktop')}
              className={`flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Ordinateur</span>
            </button>

            <button
              onClick={() => setActiveTab('mobile')}
              className={`flex items-center gap-1 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                activeTab === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Smartphone</span>
            </button>
          </div>

          {/* Interactive Screen Feature Selector */}
          <div className="inline-flex p-0.5 sm:p-1 rounded-full bg-emerald-100/70 dark:bg-white/10 border border-emerald-200 dark:border-white/20 backdrop-blur-md">
            <button
              onClick={() => setScreenMode('prayers')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                screenMode === 'prayers'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-700 dark:text-emerald-100 hover:text-emerald-950 dark:hover:text-white'
              }`}
            >
              Horaires & Salat
            </button>
            <button
              onClick={() => setScreenMode('quran')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                screenMode === 'quran'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-700 dark:text-emerald-100 hover:text-emerald-950 dark:hover:text-white'
              }`}
            >
              Coran Audio
            </button>
            <button
              onClick={() => setScreenMode('tasbih')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                screenMode === 'tasbih'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-neutral-700 dark:text-emerald-100 hover:text-emerald-950 dark:hover:text-white'
              }`}
            >
              Tasbih Interactif
            </button>
          </div>
        </div>
      </div>

      {/* Visual Showcase Stage with Architectural Podium */}
      <div className="relative rounded-2xl sm:rounded-[36px] overflow-hidden p-3.5 sm:p-10 border border-emerald-200 dark:border-emerald-500/25 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] bg-white dark:bg-[#172E22]/90 transition-colors duration-200">
        {/* Subtle Architectural Islamic Sanctuary Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/images/backgrounds/preview_arch_bg.jpg"
            alt="Arrière-plan architectural sanctuaire"
            className="w-full h-full object-cover object-center opacity-5 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-emerald-50/40 to-white/95 dark:from-[#172E22]/95 dark:via-[#1A3427]/85 dark:to-[#172E22]/95" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* 1. Desktop Browser Mockup */}
          {(activeTab === 'both' || activeTab === 'desktop') && (
          <div
            className={`w-full ${
              activeTab === 'both' ? 'lg:w-3/5' : 'max-w-4xl'
            } transition-all duration-300`}
          >
            <div className="rounded-[28px] bg-white dark:bg-[#193226] border border-neutral-200 dark:border-emerald-500/30 shadow-[0_18px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* Browser Window Chrome */}
              <div className="px-5 py-3.5 bg-neutral-100 dark:bg-[#14281E] border-b border-neutral-200 dark:border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>

                <div className="px-4 py-1 rounded-full bg-white dark:bg-[#183125] border border-neutral-200 dark:border-emerald-500/30 text-[11px] text-neutral-800 dark:text-emerald-200 font-semibold tracking-wide flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span>lavoiedelaserenite.app</span>
                </div>

                <div className="text-[10px] text-neutral-500 dark:text-emerald-300/60 font-medium">Desktop Preview</div>
              </div>

              {/* Browser Inner Showcase Content */}
              <div className="p-6 sm:p-8 bg-white dark:bg-[#193226] space-y-6 transition-colors duration-200">
                {/* Header preview row */}
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <img
                      src="/images/sanctuaire_logo.jpg"
                      alt="Logo Le Sanctuaire"
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/30"
                    />
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">Le Sanctuaire</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/40">
                      📍 {selectedCity.name}
                    </span>
                    <button
                      onClick={onOpenPrayerGuide}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-full cursor-pointer transition-colors"
                    >
                      Guide ↗
                    </button>
                  </div>
                </div>

                {/* Dynamic Screen Inside Desktop Mockup */}
                {screenMode === 'prayers' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Horaires du jour ({selectedCity.name})
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 px-2 py-0.5 rounded-full">
                        En direct
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                      {PRAYERS.map((p, idx) => (
                        <div
                          key={p.key}
                          className={`px-1 py-1.5 sm:p-3 rounded-xl sm:rounded-2xl text-center border transition-all min-w-0 flex flex-col justify-center ${
                            idx === 1
                              ? 'bg-emerald-50 dark:bg-[#224433] border-emerald-400 ring-1 ring-emerald-400/40 shadow-xs'
                              : 'bg-neutral-50 dark:bg-[#14281E] border-neutral-200 dark:border-emerald-500/20'
                          }`}
                        >
                          <span className="text-[8px] sm:text-[10px] font-bold text-neutral-600 dark:text-neutral-300 block uppercase truncate tracking-tight">
                            {p.name}
                          </span>
                          <span className="text-[10px] sm:text-xs font-arabic text-amber-700 dark:text-amber-200 block my-0.5 leading-tight truncate">
                            {p.arabicName}
                          </span>
                          <span className="text-[11px] sm:text-sm font-extrabold text-neutral-900 dark:text-white block whitespace-nowrap">
                            {selectedCity.prayers[p.key]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-4 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-white">Orientation Qibla</div>
                          <div className="text-[11px] text-neutral-600 dark:text-emerald-200/80">
                            Angle exact : {selectedCity.qiblaAngle}° vers Makkah
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={onOpenQibla}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        Voir la boussole →
                      </button>
                    </div>
                  </div>
                )}

                {screenMode === 'quran' && (
                  <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/40 px-2.5 py-0.5 rounded-full">
                        Sourate Al-Fatiha • 7 Versets
                      </span>
                      <button
                        onClick={onOpenQuran}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        Ouvrir le lecteur complet →
                      </button>
                    </div>
                    <p className="font-arabic text-2xl text-amber-800 dark:text-amber-100 text-right leading-relaxed font-medium">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ۝
                    </p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 italic font-normal">
                      « Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux. Louange à Allah, Seigneur de l'univers. »
                    </p>
                  </div>
                )}

                {screenMode === 'tasbih' && (
                  <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/40">
                        Tasbih Électronique
                      </span>
                      <p className="font-arabic text-xl text-amber-800 dark:text-amber-100 font-medium mt-2">سُبْحَانَ اللَّهِ</p>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">SubhanAllah (33x)</p>
                    </div>
                    <button
                      onClick={onOpenDhikr}
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      Lancer le compteur →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Mobile Device Mockup */}
        {(activeTab === 'both' || activeTab === 'mobile') && (
          <div
            className={`w-full ${
              activeTab === 'both' ? 'lg:w-[320px]' : 'max-w-[340px]'
            } flex-shrink-0 transition-all duration-300`}
          >
            {/* Phone Bezel */}
            <div className="rounded-[40px] bg-neutral-900 dark:bg-[#0A1810] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-4 border-neutral-800 dark:border-[#1B3628]">
              {/* Phone Inner Screen */}
              <div className="rounded-[32px] bg-white dark:bg-[#162D20] overflow-hidden border border-neutral-200 dark:border-emerald-500/25 flex flex-col min-h-[520px] transition-colors duration-200">
                {/* Status Bar & Dynamic Island */}
                <div className="pt-3 px-5 pb-2 bg-neutral-50 dark:bg-[#162D20] flex items-center justify-between select-none border-b border-neutral-200/60 dark:border-transparent">
                  <span className="text-[11px] font-bold text-neutral-800 dark:text-emerald-100">09:41</span>
                  {/* Dynamic Island */}
                  <div className="w-20 h-4 rounded-full bg-neutral-900 dark:bg-[#0A1810] flex items-center justify-center border border-neutral-700 dark:border-emerald-500/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    <span className="text-[8px] text-emerald-300 font-bold">Salat</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-800 dark:text-emerald-100">
                    <span>5G</span>
                    <span className="text-emerald-600 dark:text-emerald-400">100%</span>
                  </div>
                </div>

                {/* Mobile App Header */}
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#162D20]">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300/70 block">Sérénité Mobile</span>
                    <span className="text-xs font-extrabold text-neutral-900 dark:text-white">{selectedCity.name}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
                    Prochaine : Dhuhr
                  </span>
                </div>

                {/* Mobile Screen Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-[#162D20] transition-colors duration-200">
                  {/* Quick Card 1: Today Prayer */}
                  <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#12241A] border border-neutral-200 dark:border-emerald-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-emerald-300/80">
                        Prochaine Prière
                      </span>
                      <span className="text-xs font-arabic text-amber-700 dark:text-amber-200 font-medium">الظهر</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-neutral-900 dark:text-white">
                        {selectedCity.prayers.D}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 px-2 py-0.5 rounded-full">
                        Dans 1h 24m
                      </span>
                    </div>
                  </div>

                  {/* Quick Card 2: Interactive Mobile Tasbih Tap Button */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#12241A] border border-neutral-200 dark:border-emerald-500/20 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                      Chapelet Mobile
                    </span>
                    <div className="font-arabic text-lg text-amber-800 dark:text-amber-100 font-medium my-1">
                      الْحَمْدُ لِلَّهِ
                    </div>
                    <p className="text-[11px] font-bold text-neutral-900 dark:text-white mb-3">Al-Hamdulillah</p>

                    <button
                      onClick={() => setMobileCount((prev) => (prev >= 33 ? 1 : prev + 1))}
                      className="w-16 h-16 mx-auto rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-lg border border-emerald-400/40"
                    >
                      <span>{mobileCount}</span>
                      <span className="text-[8px] font-medium opacity-80">/ 33</span>
                    </button>
                    <span className="text-[9px] text-neutral-500 dark:text-emerald-200/70 block mt-2">Touchez pour incrémenter</span>
                  </div>

                  {/* Mobile Quick Action Link */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={onOpenPrayerGuide}
                      className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold text-center cursor-pointer shadow-xs transition-colors"
                    >
                      Guide Salat ↗
                    </button>
                    <button
                      onClick={onOpenQuran}
                      className="py-2 px-2.5 rounded-xl bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/15 text-neutral-800 dark:text-emerald-100 text-[11px] font-bold text-center cursor-pointer transition-colors"
                    >
                      Coran Audio ↗
                    </button>
                  </div>
                </div>

                {/* Mobile Bottom Tab Bar */}
                <div className="px-4 py-2.5 bg-neutral-50 dark:bg-[#12241A] border-t border-neutral-200 dark:border-white/10 flex items-center justify-around">
                  <div className="flex flex-col items-center gap-0.5 text-emerald-700 dark:text-emerald-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[8px] font-bold">Horaires</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-neutral-500 dark:text-neutral-400">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[8px] font-bold">Coran</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-neutral-500 dark:text-neutral-400">
                    <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[8px] font-bold">Qibla</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-neutral-500 dark:text-neutral-400">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="text-[8px] font-bold">Tasbih</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
      </div>
    </section>
  );
};
