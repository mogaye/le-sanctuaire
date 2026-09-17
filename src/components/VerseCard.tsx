import React, { useState } from 'react';
import { Copy, Check, RotateCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpiritualVerseTimer } from '../hooks/useSpiritualVerseTimer';

export const VerseCard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { currentVerse, nextRandomVerse } = useSpiritualVerseTimer(60000, 2);

  const handleCopy = () => {
    const fullText = `بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\n« ${currentVerse.arabic} »\n${currentVerse.french}\n[${currentVerse.reference.toUpperCase()}]`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="w-full relative overflow-hidden py-8 sm:py-16">
      {/* Background Image behind the verse section */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/images/backgrounds/verse_card_bg.jpg"
          alt="Arrière-plan spirituel verset"
          className="w-full h-full object-cover object-center opacity-15 dark:opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7F5] via-[#EBF3ED] to-[#F4F7F5] dark:from-[#0E2016] dark:via-[#14261C] dark:to-[#14261C]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-3.5 sm:px-8">
        <div
          id="quran-verse-card"
          className="rounded-2xl sm:rounded-[32px] overflow-hidden border border-emerald-200/90 dark:border-emerald-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)] hover:border-emerald-400/50 transition-all relative text-center bg-white/95 dark:bg-[#193226]/95 backdrop-blur-xl group"
        >
          {/* Subtle Arabesque Motif inside the card */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/images/backgrounds/features_pattern_bg.jpg"
              alt="Motif islamique verset"
              className="w-full h-full object-cover object-center opacity-5 dark:opacity-10 mix-blend-multiply dark:mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-emerald-50/70 to-white/95 dark:from-[#193226]/90 dark:via-[#1C382A]/85 dark:to-[#193226]/95" />
          </div>

          {/* Content Container */}
          <div className="relative z-10 p-4 sm:p-12 pt-14 sm:pt-12">
            {/* Top Bar Controls (Copy + Randomize Next) */}
            <div className="absolute top-3.5 sm:top-6 right-4 sm:right-8 flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={nextRandomVerse}
                title="Changer aléatoirement le verset maintenant"
                className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-white/10 dark:hover:bg-white/20 border border-emerald-200/80 dark:border-white/15 shadow-2xs transition-colors cursor-pointer text-emerald-800 dark:text-emerald-100 hover:text-emerald-950 dark:hover:text-white active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                <span className="hidden sm:inline">Verset Suivant</span>
              </button>

              <button
                id="btn-copy-verse"
                onClick={handleCopy}
                title="Copier le verset"
                className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-white/10 dark:hover:bg-white/20 border border-emerald-200/80 dark:border-white/15 shadow-2xs transition-colors cursor-pointer text-emerald-900 dark:text-white active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-700 dark:text-neutral-300" />
                    <span className="text-emerald-900 dark:text-white font-medium">Copier</span>
                  </>
                )}
              </button>
            </div>

            {/* Basmala */}
            <div className="font-arabic text-xs sm:text-base text-amber-700 dark:text-amber-200/90 mb-2 sm:mb-3 select-none tracking-wide font-medium flex items-center justify-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400" />
              <span>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</span>
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400" />
            </div>

            {/* Animated Quran Verse Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentVerse.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                {/* Arabic Verse */}
                <p className="font-arabic text-xl sm:text-3xl md:text-[38px] text-amber-900 dark:text-amber-100 font-medium leading-[1.8] tracking-wide my-3 sm:my-4 select-text drop-shadow-[0_2px_12px_rgba(251,191,36,0.15)]">
                  « {currentVerse.arabic} »
                </p>

                {/* French Translation */}
                <p className="text-emerald-950 dark:text-emerald-100/90 text-xs sm:text-base italic max-w-2xl mx-auto mt-2 sm:mt-4 leading-relaxed font-normal">
                  {currentVerse.french}
                </p>

                {/* Reference & Timer Badge */}
                <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <span className="inline-block text-[10px] sm:text-[11px] font-bold tracking-widest text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-3 sm:px-3.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/40 uppercase">
                    [{currentVerse.reference}]
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-600 dark:text-neutral-300 bg-emerald-50 dark:bg-white/5 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-200/60 dark:border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                    Renouvelé chaque minute
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
