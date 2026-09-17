import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  BookOpen,
  X,
  Sparkles,
  ArrowRight,
  Gift,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Feather,
  ChevronRight,
  Coffee,
  ShieldCheck,
  Clock,
  User,
  Quote,
  Flame,
} from 'lucide-react';
import { ISLAMIC_STORIES, IslamicStory } from '../data/islamicStoriesData';
import { DonationModal } from './DonationModal';

export const FloatingInteractiveWidgets: React.FC = () => {
  // Modal states
  const [activeModal, setActiveModal] = useState<'donation' | 'stories' | null>(null);
  const [selectedStory, setSelectedStory] = useState<IslamicStory | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Drag tracking refs to avoid triggering action when dragging
  const isDraggingStoriesRef = useRef(false);
  const isDraggingDonationRef = useRef(false);

  const filteredStories = activeCategory === 'all'
    ? ISLAMIC_STORIES
    : ISLAMIC_STORIES.filter((s) => s.category === activeCategory);

  return (
    <>
      {/* 1. FLOTTANT HISTOIRES ISLAMIQUES / COIN DE L'AUTEUR (En haut de la colonne) */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={() => {
          isDraggingStoriesRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingStoriesRef.current = false;
          }, 200);
        }}
        whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 60 }}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.3 }}
        className="fixed z-50 bottom-[148px] right-2 sm:bottom-34 sm:right-6 cursor-grab select-none touch-none group"
      >
        <div className="relative flex items-center">
          {/* Bulle info dépliante au survol (hover uniquement sur grand écran) */}
          <div className="hidden sm:block absolute right-full mr-2.5 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto translate-x-1.5 group-hover:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap z-50">
            <div className="bg-[#0B1E13]/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-emerald-400/30 shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <p className="text-[11px] font-bold text-emerald-200">Histoires & Récits Spirituels</p>
                <p className="text-[9px] text-emerald-100/70">Écrits avec dévotion par l'Auteur</p>
              </div>
              <div className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1 py-0.5 rounded font-mono">
                {ISLAMIC_STORIES.length} récits
              </div>
            </div>
          </div>

          {/* Bouton d'icône principal (Histoires / Plume & Livre) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              if (isDraggingStoriesRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              setSelectedStory(null);
              setActiveModal('stories');
            }}
            className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 text-neutral-950 p-[1px] sm:p-[1.5px] shadow-md sm:shadow-[0_4px_16px_rgba(16,185,129,0.45),0_0_0_1px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_22px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer opacity-90 hover:opacity-100 sm:opacity-100"
            aria-label="Lire les histoires islamiques rédigées par l'auteur"
          >
            {/* Pulsation lumineuse subtile */}
            <span className="hidden sm:block absolute inset-0 rounded-full bg-emerald-400/30 animate-ping pointer-events-none opacity-20" />

            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0F301F] via-[#082014] to-[#04120B] flex items-center justify-center border border-emerald-400/40">
              <BookOpen className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-emerald-300 stroke-[1.8] group-hover:scale-110 group-hover:text-emerald-200 transition-transform" />
            </div>

            {/* Plume d'auteur badge */}
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-emerald-300 to-teal-200 text-[#092214] text-[7px] sm:text-[8px] font-black flex items-center justify-center shadow-xs border border-white">
              <Feather className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. FLOTTANT DONS / SOUTIEN */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={() => {
          isDraggingDonationRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingDonationRef.current = false;
          }, 200);
        }}
        whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 60 }}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="fixed z-50 bottom-[110px] right-2 sm:bottom-20 sm:right-6 cursor-grab select-none touch-none group"
      >
        <div className="relative flex items-center">
          {/* Bulle info dépliante au survol (hover uniquement sur grand écran) */}
          <div className="hidden sm:block absolute right-full mr-2.5 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto translate-x-1.5 group-hover:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap z-50">
            <div className="bg-[#0D2417]/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-amber-300/30 shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <div>
                <p className="text-[11px] font-bold text-amber-200">Soutenir le Sanctuaire</p>
                <p className="text-[9px] text-emerald-100/70">Faire un don ou offrir un présent</p>
              </div>
              <div className="text-[9px] bg-amber-400/20 text-amber-300 px-1 py-0.5 rounded font-mono">
                Glisser ↔
              </div>
            </div>
          </div>

          {/* Bouton d'icône principal (Donation / Cœur d'Or) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              if (isDraggingDonationRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              setActiveModal('donation');
            }}
            className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-neutral-950 p-[1px] sm:p-[1.5px] shadow-md sm:shadow-[0_4px_16px_rgba(245,158,11,0.45),0_0_0_1px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_22px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer opacity-90 hover:opacity-100 sm:opacity-100"
            aria-label="Faire un don ou soutenir l'application"
          >
            {/* Pulsation lumineuse subtile */}
            <span className="hidden sm:block absolute inset-0 rounded-full bg-amber-300/30 animate-ping pointer-events-none opacity-25" />
            
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#122E1F] via-[#091B11] to-[#041009] flex items-center justify-center border border-amber-400/40">
              <Heart className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-amber-300 fill-amber-400/30 stroke-[1.8] group-hover:scale-110 group-hover:text-amber-200 transition-transform" />
            </div>

            {/* Badge cadeau en miniature */}
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 text-[#0E1E14] text-[7px] sm:text-[8px] font-black flex items-center justify-center shadow-xs border border-white">
              <Gift className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* 3. MODAL DES DONS (Wave, DunyaPay, Cartes & Supabase Ledger) */}
      <DonationModal
        isOpen={activeModal === 'donation'}
        onClose={() => setActiveModal(null)}
      />

      {/* 4. MODAL DES HISTOIRES ISLAMIQUES (Écrites par l'auteur) */}
      <AnimatePresence>
        {activeModal === 'stories' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveModal(null);
                setSelectedStory(null);
              }}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-[#FAF7F2] dark:bg-[#12261A] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.65)] border border-[#E3D9CC] dark:border-emerald-800/60 flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100 my-auto z-10 transition-colors"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-b from-[#0F291B] to-[#091D13] text-white relative shrink-0">
                <button
                  onClick={() => {
                    if (selectedStory) {
                      setSelectedStory(null);
                    } else {
                      setActiveModal(null);
                    }
                  }}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Fermer ou retour"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
                    <Feather className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                        Les Récits du Sanctuaire
                      </h3>
                      <span className="text-[10px] font-semibold bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full">
                        Écrits par l'Auteur
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/75">
                      Histoires authentiques, morales spirituelles et sagesses prophétiques rédigées dans le code.
                    </p>
                  </div>
                </div>

                {/* Filter tags (when not in detail view) */}
                {!selectedStory && (
                  <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 text-xs">
                    {[
                      { id: 'all', label: 'Tous les récits' },
                      { id: 'prophetes', label: 'Prophètes ﷺ' },
                      { id: 'sagesse', label: 'Sagesses' },
                      { id: 'morale', label: 'Morales de vie' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCategory(tab.id)}
                        className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                          activeCategory === tab.id
                            ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                            : 'bg-white/10 hover:bg-white/15 text-neutral-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                {selectedStory ? (
                  /* VUE LECTURE DÉTAILLÉE DE L'HISTOIRE */
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <button
                      onClick={() => setSelectedStory(null)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-200 transition-colors cursor-pointer bg-emerald-100/60 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-full"
                    >
                      ← Retour à la liste des récits
                    </button>

                    <div className="space-y-2 border-b border-[#E3D9CC] dark:border-emerald-800/50 pb-4">
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <User className="w-3 h-3" />
                          Rédigé par {selectedStory.author}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {selectedStory.readTime} de lecture
                        </span>
                        <span>•</span>
                        <span>{selectedStory.date}</span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#0D2417] dark:text-white">
                        {selectedStory.title}
                      </h2>
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 italic">
                        {selectedStory.subtitle}
                      </p>
                    </div>

                    {/* Citation Arabe et Source si disponible */}
                    {selectedStory.arabicQuote && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-[#EBF2ED] dark:bg-[#163022] border border-[#CDE0D3] dark:border-emerald-800/60 text-right space-y-2 shadow-2xs">
                        <p className="font-serif text-xl sm:text-2xl text-[#0B2315] dark:text-amber-200 leading-loose dir-rtl" dir="rtl">
                          {selectedStory.arabicQuote}
                        </p>
                        {selectedStory.quoteSource && (
                          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 text-left">
                            Source : {selectedStory.quoteSource}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Paragraphes de l'histoire */}
                    <div className="space-y-4 text-sm sm:text-base leading-relaxed text-neutral-800 dark:text-neutral-200 font-normal">
                      {selectedStory.content.map((paragraph, idx) => (
                        <p key={idx} className="first-letter:text-2xl first-letter:font-serif first-letter:font-bold first-letter:text-emerald-900 dark:first-letter:text-emerald-300 first-letter:mr-1">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Leçon et Morale finale */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-[#173022] border border-amber-200/80 dark:border-amber-700/40 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Enseignement & Méditation</span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 font-medium leading-relaxed italic">
                        « {selectedStory.moralLesson} »
                      </p>
                    </div>

                    {/* Bas de page auteur note */}
                    <div className="pt-4 border-t border-[#E3D9CC] dark:border-emerald-800/50 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                      <span>Récit composé directement dans le code source de l'application</span>
                      <button
                        onClick={() => setSelectedStory(null)}
                        className="font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
                      >
                        Lire un autre récit
                      </button>
                    </div>
                  </div>
                ) : (
                  /* LISTE DES HISTOIRES */
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-200">
                      <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <p>
                        Ces histoires sont rédigées personnellement par l'administrateur dans le code du Sanctuaire pour enrichir votre âme et transmettre les valeurs de paix, de patience et de générosité.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 pt-2">
                      {filteredStories.map((story) => (
                        <div
                          key={story.id}
                          onClick={() => setSelectedStory(story)}
                          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#183022] border border-[#E0D8CB] dark:border-emerald-800/60 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-700/50">
                              {story.category === 'prophetes' ? 'Récit des Prophètes' : story.category === 'sagesse' ? 'Sagesse des Anciens' : 'Morale & Foi'}
                            </span>
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {story.readTime}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base sm:text-lg font-serif font-bold text-[#0D2417] dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                              {story.title}
                            </h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                              {story.subtitle}
                            </p>
                          </div>

                          <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                            {story.content[0]}
                          </p>

                          <div className="pt-2 flex items-center justify-between border-t border-neutral-150 dark:border-emerald-800/50 text-xs">
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                              Par {story.author}
                            </span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
                              Lire le récit
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
