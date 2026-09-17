import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Compass,
  BookOpen,
  Clock,
  Heart,
  ArrowRight,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { UserProfile } from '../types';
import { useSpiritualVerseTimer } from '../hooks/useSpiritualVerseTimer';

export interface WelcomeWalkthroughProps {
  user: UserProfile | null;
  isRegistered: boolean;
  mode?: 'onboarding' | 'welcome_back';
  onComplete: () => void;
  onSkip?: () => void;
}

export const WelcomeWalkthrough: React.FC<WelcomeWalkthroughProps> = ({
  user,
  isRegistered,
  mode = 'onboarding',
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const totalSteps = 3;
  const { currentVerse } = useSpiritualVerseTimer(60000, 1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45 && currentStep > 0 && !isWelcomeBack) {
      setCurrentStep((prev) => prev - 1);
    }
    setTouchStartX(null);
  };

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Cher croyant';
  const fullName = user?.name || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : firstName);

  const isWelcomeBack = mode === 'welcome_back';

  // Keyboard navigation (Space or Enter or ArrowRight advances)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        if (onSkip) onSkip();
        else onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, onComplete, onSkip, isWelcomeBack]);

  const handleNext = () => {
    if (isWelcomeBack) {
      onComplete();
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      id="welcome-walkthrough-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-[#030C07]/85 backdrop-blur-md selection:bg-emerald-500 selection:text-white overflow-y-auto"
      onClick={handleNext}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-emerald-600/20 via-teal-500/15 to-amber-500/10 rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-emerald-900/25 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Main Glass Card Container */}
      <div
        id="welcome-walkthrough-card"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-[800px] rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-[#0B1E15]/95 via-[#081810]/95 to-[#040E09]/98 border border-emerald-500/25 shadow-[0_25px_80px_rgba(0,0,0,0.7)] p-4 sm:p-9 md:p-11 text-white overflow-hidden cursor-pointer select-none transition-all max-h-[90vh] overflow-y-auto"
      >
        {/* Subtle decorative Islamic arch geometric outline */}
        <div className="absolute top-0 right-0 w-72 h-72 opacity-[0.035] pointer-events-none">
          <svg viewBox="0 0 200 200" fill="currentColor" className="w-full h-full text-amber-200">
            <path d="M100 0 C50 30 10 70 10 130 C10 170 40 200 100 200 C160 200 190 170 190 130 C190 70 150 30 100 0 Z" />
          </svg>
        </div>

        {/* Top Header Bar */}
        <div className="relative z-10 flex items-center justify-between pb-5 sm:pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-1 ring-amber-400/50 shadow-md shrink-0">
              <img
                src="/images/sanctuaire_logo.jpg"
                alt="Le Sanctuaire"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white block">
                Le Sanctuaire
              </span>
              <span className="text-[10px] text-emerald-300/80 block">
                {isWelcomeBack
                  ? 'Reconnexion Réussie'
                  : isRegistered
                  ? 'Espace Personnel Validé'
                  : 'Accès Visiteur'}
              </span>
            </div>
          </div>

          {/* Stepper Dots (only for multi-step onboarding) */}
          {!isWelcomeBack ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[0, 1, 2].map((stepIndex) => (
                <div
                  key={stepIndex}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    currentStep === stepIndex
                      ? 'w-7 sm:w-8 bg-gradient-to-r from-amber-300 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                      : currentStep > stepIndex
                      ? 'w-2 sm:w-2.5 bg-emerald-400/80'
                      : 'w-2 sm:w-2.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-[11px] text-amber-200 font-medium">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>Session active</span>
            </div>
          )}

          {/* Skip / Fermer button */}
          <button
            id="welcome-skip-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onSkip) onSkip();
              else onComplete();
            }}
            className="text-[11px] sm:text-xs font-semibold text-emerald-200/70 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            {isWelcomeBack ? 'Fermer' : 'Passer'}
          </button>
        </div>

        {/* Content Body */}
        <div className="relative z-10 min-h-[300px] sm:min-h-[320px] flex flex-col justify-center py-5 sm:py-7">
          <AnimatePresence mode="wait">
            {/* =========================================================================
                MODE : RECONNEXION / BON RETOUR (Lorsque l'utilisateur se déconnecte puis se reconnecte)
               ========================================================================= */}
            {isWelcomeBack ? (
              <motion.div
                key="welcome-back"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-5 text-left"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Bon retour parmi nous</span>
                </div>

                <div className="space-y-2">
                  <div className="font-arabic text-2xl sm:text-3xl text-amber-200/90 tracking-wide select-text">
                    السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ
                  </div>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                    Bon retour dans votre Sanctuaire,{' '}
                    <span className="bg-gradient-to-r from-amber-200 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                      {firstName} !
                    </span>
                  </h1>
                </div>

                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
                  Quel plaisir de vous retrouver, <strong className="text-white font-semibold">{fullName}</strong>.
                  Toutes vos préférences, marques-pages coraniques et réglages de prière sont intacts et synchronisés.
                  Poursuivez votre cheminement spirituel en toute paix et sérénité.
                </p>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-emerald-300/85">
                  <span className="flex items-center gap-1.5 bg-white/5 border border-emerald-500/25 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Profil restauré
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 border border-emerald-500/25 px-3 py-1.5 rounded-full">
                    <Bookmark className="w-3.5 h-3.5 text-amber-300" />
                    Marque-pages prêts
                  </span>
                  <span className="flex items-center gap-1.5 bg-white/5 border border-emerald-500/25 px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-teal-300" />
                    Horaires à jour
                  </span>
                </div>

                {/* Rotating Spiritual Verse Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-black/40 to-emerald-950/70 border border-emerald-500/30 shadow-inner mt-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentVerse.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="font-arabic text-lg sm:text-xl text-amber-200/90 leading-relaxed mb-1.5 select-text">
                        « {currentVerse.arabic} »
                      </div>
                      <p className="text-xs sm:text-sm text-emerald-100 italic leading-relaxed">
                        {currentVerse.french}
                      </p>
                      <p className="text-[11px] text-emerald-400/80 mt-1.5 font-semibold">
                        {currentVerse.reference}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              /* =========================================================================
                  MODE : ONBOARDING EN 3 ÉTAPES (Affiché une seule fois)
                 ========================================================================= */
              <>
                {/* ÉTAPE 0 : ACCUEIL */}
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-5 text-left"
                  >
                    {isRegistered ? (
                      <>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                          <span>Compte personnel activé</span>
                        </div>

                        <div className="space-y-2">
                          <div className="font-arabic text-2xl sm:text-3xl text-amber-200/90 tracking-wide select-text">
                            السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ
                          </div>
                          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                            Bienvenue dans votre Sanctuaire,{' '}
                            <span className="bg-gradient-to-r from-amber-200 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                              {firstName} !
                            </span>
                          </h1>
                        </div>

                        <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
                          C’est un privilège de vous compter parmi nous,{' '}
                          <strong className="text-white font-semibold">{fullName}</strong>. Votre espace a été
                          configuré pour vous offrir une expérience spirituelle fluide, intime et continue.
                        </p>

                        <div className="pt-1 flex items-center gap-3 text-xs sm:text-sm text-emerald-300/80 font-medium">
                          <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Profil {fullName}
                          </span>
                          <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                            <Bookmark className="w-3.5 h-3.5 text-amber-300" />
                            Sauvegarde active
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span>Bienvenue au Sanctuaire</span>
                        </div>

                        <div className="space-y-2">
                          <div className="font-arabic text-2xl sm:text-3xl text-amber-200/90 tracking-wide select-text">
                            بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </div>
                          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                            La paix soit sur vous,{' '}
                            <span className="bg-gradient-to-r from-amber-200 via-emerald-200 to-teal-200 bg-clip-text text-transparent">
                              cher visiteur.
                            </span>
                          </h1>
                        </div>

                        <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-normal">
                          Entrez en toute simplicité dans ce havre spirituel. Toutes les ressources sont
                          ouvertes librement et sans aucune obligation : écoutez le Noble Coran, suivez les
                          horaires de prière, découvrez les guides illustrés et plongez dans nos ouvrages essentiels.
                        </p>

                        <div className="pt-1 flex items-center gap-2 text-xs text-emerald-300/80 font-medium">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>Accès direct et illimité sans inscription préalable</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* ÉTAPE 1 : DÉCOUVERTE */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-5 text-left"
                  >
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-300/90 mb-1">
                        {isRegistered ? 'Vos outils sur-mesure' : 'Découvrez votre espace'}
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                        {isRegistered
                          ? `Un sanctuaire à votre image, ${firstName}`
                          : 'Tout ce qui élève votre foi au quotidien'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                      <div className="p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 transition-colors flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white mb-0.5">Le Saint Coran</h3>
                          <p className="text-xs text-emerald-100/75 leading-relaxed">
                            114 sourates avec audio haute définition, traduction française et suivi de lecture.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 transition-colors flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white mb-0.5">Prières & Guide Illustré</h3>
                          <p className="text-xs text-emerald-100/75 leading-relaxed">
                            Calcul précis des 5 prières, ajustements par minute et guide des postures pas-à-pas.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 transition-colors flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white mb-0.5">Qibla & Dhikr Interactif</h3>
                          <p className="text-xs text-emerald-100/75 leading-relaxed">
                            Orientation vers la Mecque et chapelet interactif avec invocations prophétiques.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 transition-colors flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white mb-0.5">Bibliothèque & Ramadan</h3>
                          <p className="text-xs text-emerald-100/75 leading-relaxed">
                            Ouvrages théologiques fondamentaux et calendrier du jeûne avec horaires Imsak/Iftar.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ÉTAPE 2 : OUVERTURE DU SITE */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-6 text-left"
                  >
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-xs font-semibold">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                        <span>Prêt à débuter</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                        {isRegistered
                          ? `Entrez dans votre havre, ${firstName}`
                          : 'Votre sanctuaire spirituel s’ouvre à vous'}
                      </h2>
                    </div>

                    {/* Serene Spiritual Quote Card */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-black/40 to-emerald-950/70 border border-emerald-500/30 shadow-inner">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentVerse.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="font-arabic text-lg sm:text-xl text-amber-200/90 leading-relaxed mb-1.5 select-text">
                            « {currentVerse.arabic} »
                          </div>
                          <p className="text-xs sm:text-sm text-emerald-100 italic leading-relaxed">
                            {currentVerse.french}
                          </p>
                          <p className="text-[11px] text-emerald-400/80 mt-1.5 font-semibold">
                            {currentVerse.reference}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
                      {isRegistered
                        ? `Tout est prêt pour vous. Cliquez ci-dessous pour ouvrir votre Sanctuaire.`
                        : `Explorez librement, méditez les versets et nourrissez votre cœur à votre rythme.`}
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Interactive Touch Area / Footer */}
        <div className="relative z-10 pt-4 sm:pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-emerald-300/80 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isWelcomeBack
                ? 'Appuyez sur Entrée ou cliquez pour continuer'
                : currentStep < totalSteps - 1
                ? 'Touchez pour passer à la suite'
                : 'Touchez pour ouvrir le site'}
            </span>
          </div>

          <button
            id="welcome-action-next-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-amber-200 via-emerald-300 to-teal-300 hover:from-amber-100 hover:to-emerald-200 text-[#091811] font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(52,211,153,0.35)] hover:shadow-[0_6px_25px_rgba(52,211,153,0.45)] transition-all cursor-pointer group active:scale-[0.98]"
          >
            <span>
              {isWelcomeBack
                ? 'Accéder à mon Sanctuaire'
                : currentStep < totalSteps - 1
                ? 'Suivant'
                : isRegistered
                ? 'Entrer dans mon Sanctuaire'
                : 'Accéder au Sanctuaire'}
            </span>
            <ArrowRight className="w-4 h-4 text-[#091811] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
