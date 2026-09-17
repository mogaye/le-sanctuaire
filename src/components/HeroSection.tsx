import React from 'react';
import { ArrowUpRight, Sparkles, Compass, ArrowRight, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrayerTime } from '../types';
import { PRAYERS } from '../data/islamicData';
import { useSpiritualVerseTimer } from '../hooks/useSpiritualVerseTimer';

interface HeroSectionProps {
  onOpenPrayerGuide: (prayerKey?: 'F' | 'D' | 'A' | 'M' | 'I') => void;
  activePrayerKey: 'F' | 'D' | 'A' | 'M' | 'I';
  onSelectPrayerKey: (key: 'F' | 'D' | 'A' | 'M' | 'I') => void;
  onAccederSite?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenPrayerGuide,
  activePrayerKey,
  onSelectPrayerKey,
  onAccederSite,
}) => {
  const { currentVerse } = useSpiritualVerseTimer(60000, 3);

  // Selected prayer details
  const selectedPrayer = PRAYERS.find((p) => p.key === activePrayerKey) || PRAYERS[0];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-8 pb-10 sm:pb-20 relative">
      <div className="flex flex-col justify-between min-h-[480px] sm:min-h-[540px] lg:min-h-[620px]">
        
        {/* Top Badge: Subtle Golden Aura */}
        <div className="flex items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 border border-amber-400/40 text-xs font-semibold text-amber-200 backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="tracking-wide">Guide Spirituel Quotidien · 100% Gratuit</span>
          </div>
        </div>

        {/* Center Content: Main Display Heading */}
        <div className="max-w-3xl mt-5 sm:mt-10 space-y-3.5 sm:space-y-5">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[84px] font-black text-white tracking-tight leading-[1.08] select-none drop-shadow-md">
            <span className="block text-white">La Voie De La</span>
            <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 drop-shadow-md font-serif italic font-black">
              Sérénité
            </span>
          </h1>

          <p className="text-emerald-50/95 text-xs sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal drop-shadow-sm">
            Votre sanctuaire spirituel quotidien pour apprendre la prière pas à pas, méditer le Saint Coran, retrouver la Qibla et cultiver votre foi avec paix et dévotion.
          </p>

          {/* Action Buttons: Luxurious Amber Golden Primary Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
            {onAccederSite && (
              <button
                id="btn-hero-acceder-site"
                onClick={onAccederSite}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_8px_28px_rgba(245,158,11,0.38)] hover:shadow-[0_12px_36px_rgba(245,158,11,0.5)] transition-all cursor-pointer group active:scale-[0.98]"
              >
                <Compass className="w-4 h-4 text-neutral-950 group-hover:rotate-45 transition-transform shrink-0" />
                <span>Accéder au sanctuaire</span>
                <ArrowRight className="w-4 h-4 text-neutral-950 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            )}

            <button
              id="btn-hero-guide-prieres"
              onClick={() => onOpenPrayerGuide(activePrayerKey)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm border border-white/35 backdrop-blur-md shadow-xs transition-all cursor-pointer active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Guide des 5 Prières</span>
            </button>
          </div>

          {/* Trust Highlights Micro Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-emerald-100">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>5 Prières Illustrées</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>114 Sourates Audio</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Boussole Qibla Précise</span>
            </span>
          </div>
        </div>

        {/* Bottom Row: Enhanced Learning Card (Left) & Spiritual Wisdom Capsule (Right) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-6 mt-8 sm:mt-14">
          
          {/* Hero Learning Card: Apprendre À Prier (Re-architected for Elegance & Clarity) */}
          <div
            id="hero-card-apprendre-prier"
            className="w-full max-w-lg rounded-[28px] bg-white/95 dark:bg-[#152B1E]/95 backdrop-blur-2xl border border-emerald-200/70 dark:border-emerald-700/50 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.38)] transition-all relative group"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-neutral-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight leading-tight">
                    Apprendre À Prier
                  </h2>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Salat pas à pas avec ablutions</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/50 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                  Guide Interactif
                </span>

                <button
                  id="hero-card-arrow-btn"
                  onClick={() => onOpenPrayerGuide(activePrayerKey)}
                  title="Ouvrir le guide complet"
                  className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95 shrink-0"
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[2.4]" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed my-3 font-medium">
              Maîtrisez les 5 prières quotidiennes obligatoires : récitations en arabe avec phonétique française, traductions complètes et postures illustrées.
            </p>

            {/* Prayer Focus Pill */}
            <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-[#1A3626] border border-emerald-100/90 dark:border-emerald-700/50 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-950 dark:text-white flex items-center gap-1.5">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold font-serif text-sm">{selectedPrayer.arabicName}</span>
                <span>Prière de {selectedPrayer.name}</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-emerald-900/60 px-2 py-0.5 rounded-md shadow-2xs border border-emerald-200/50 dark:border-emerald-700/50">
                {selectedPrayer.rakats} Rakats
              </span>
            </div>

            {/* Card Footer: 5 Interactive Prayer Chips (Fajr, Dhuhr, Asr, Maghrib, Isha) */}
            <div className="pt-2 border-t border-neutral-100 dark:border-emerald-800/40">
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {PRAYERS.map((prayer) => {
                  const isSelected = activePrayerKey === prayer.key;
                  return (
                    <button
                      key={prayer.key}
                      id={`badge-prayer-${prayer.key}`}
                      onClick={() => {
                        onSelectPrayerKey(prayer.key);
                        onOpenPrayerGuide(prayer.key);
                      }}
                      title={`${prayer.name} (${prayer.arabicName}) - ${prayer.rakats} Rakats`}
                      className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-500 scale-[1.03]'
                          : 'bg-neutral-100 dark:bg-[#1A3626] hover:bg-neutral-200 dark:hover:bg-[#204230] text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-emerald-700/40'
                      }`}
                    >
                      <span className="text-xs font-black leading-none">{prayer.key}</span>
                      <span className={`text-[9px] font-bold mt-1 tracking-tight truncate ${isSelected ? 'text-emerald-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {prayer.name}
                      </span>
                      <span className={`text-[8px] mt-0.5 leading-none ${isSelected ? 'text-amber-300 font-semibold' : 'text-neutral-400 dark:text-neutral-400'}`}>
                        {prayer.rakats}R
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Bottom Rotating Spiritual Verse Capsule */}
          <div className="hidden lg:flex items-center gap-3 px-5 py-3 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md border border-emerald-300/60 dark:border-amber-400/20 text-xs text-neutral-800 dark:text-white/95 shadow-lg max-w-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-pulse shrink-0" />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentVerse.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <span className="font-serif text-base text-amber-800 dark:text-amber-200 shrink-0 select-text">
                  {currentVerse.arabic}
                </span>
                <span className="text-neutral-700 dark:text-white/80 font-medium truncate italic">
                  « {currentVerse.french} »
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                  [{currentVerse.surahName}]
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
};
