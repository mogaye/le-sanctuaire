import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Sparkles,
  Download,
  Calendar,
  Share2,
  Check,
  ShieldCheck,
  Compass,
  FileText,
  Bookmark,
} from 'lucide-react';
import { ISLAMIC_BOOKS, IslamicBook } from '../data/booksData';

interface LibraryPageProps {
  onBackToHome: () => void;
  initialBookId?: string;
}

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  isToday: boolean;
  targetDate: Date;
  isPassedToday: boolean;
}

// Calcule le prochain vendredi à 21h00 (ou aujourd'hui 21h00 si nous sommes vendredi avant 21h)
function calculateFridayCountdown(): CountdownState {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: Dimanche, 5: Vendredi
  const target = new Date(now);

  const isFriday = dayOfWeek === 5;
  let isPassedToday = false;

  if (isFriday) {
    target.setHours(21, 0, 0, 0);
    if (now.getTime() >= target.getTime()) {
      isPassedToday = true;
      // Prochain vendredi
      target.setDate(target.getDate() + 7);
    }
  } else {
    // Nombre de jours restants jusqu'au prochain vendredi
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    target.setDate(target.getDate() + daysUntilFriday);
    target.setHours(21, 0, 0, 0);
  }

  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    hours,
    minutes,
    seconds,
    isToday: isFriday && !isPassedToday,
    targetDate: target,
    isPassedToday,
  };
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onBackToHome }) => {
  const [countdown, setCountdown] = useState<CountdownState>(calculateFridayCountdown);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mise à jour continue du chronomètre chaque seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateFridayCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Le Sanctuaire - Bibliothèque du Vendredi',
          text: 'Découvrez la Bibliothèque du Sanctuaire : un nouveau livre spirituel sort chaque vendredi à 21h00 !',
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#12241A] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* ========================================================
          BARRE DE NAVIGATION SUPÉRIEURE (PROPRE & NORMALE)
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#183022]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-emerald-600/30 shadow-2xs transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Bouton Retour */}
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm font-bold transition-all cursor-pointer border border-neutral-200/80 dark:border-emerald-500/30 hover:border-emerald-500/50 active:scale-95 shrink-0"
            title="Retour à l'accueil"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Retour au Sanctuaire</span>
          </button>

          {/* Titre & Identité */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen className="w-4 h-4 text-emerald-700 dark:text-amber-300" />
            </div>
            <div className="text-left">
              <h1 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white leading-tight">
                Bibliothèque du Sanctuaire
              </h1>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-300/90 font-medium">
                Un livre chaque vendredi à 21h00
              </p>
            </div>
          </div>

          {/* Action Partager */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition cursor-pointer"
            title="Partager cette bibliothèque"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                <span className="hidden sm:inline">Lien copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Partager</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ========================================================
          CORPS PRINCIPAL DE LA PAGE
         ======================================================== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-8 sm:space-y-12">
        
        {/* BANNIÈRE HÉRO & ANNONCE PRINCIPALE */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/40 dark:from-[#173324] dark:via-[#132A1D] dark:to-[#0E2016] border border-emerald-200/90 dark:border-emerald-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-6 sm:p-10 text-center">
          
          {/* Badge officiel de parution hebdomadaire */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-bold shadow-2xs mb-4">
            <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Rendez-vous hebdomadaire</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-amber-800 dark:text-amber-300 font-extrabold">Vendredi 21h00</span>
          </div>

          {/* Titre & Message clé */}
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Un nouveau livre sort{' '}
            <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 dark:from-emerald-300 dark:via-teal-200 dark:to-amber-200 bg-clip-text text-transparent">
              chaque vendredi à 21h
            </span>
          </h2>

          <p className="mt-4 text-xs sm:text-base text-neutral-600 dark:text-emerald-200/85 max-w-2xl mx-auto leading-relaxed">
            Chaque semaine, Le Sanctuaire met à votre disposition un ouvrage islamique sélectionné pour enrichir votre savoir, nourrir votre spiritualité et vous accompagner dans votre cheminement.
          </p>

          {/* ========================================================
              CHRONO EN DIRECT (COMPTE À REBOURS POUR AUJOURD'HUI 21H)
             ======================================================== */}
          <div className="mt-8 pt-8 border-t border-emerald-200/60 dark:border-emerald-800/50">
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 dark:text-amber-300 mb-4 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                {countdown.isToday
                  ? "Chronomètre : Parution ce soir à 21h00"
                  : "Chronomètre : Prochaine parution vendredi à 21h00"}
              </span>
            </div>

            {/* Blocs du compte à rebours */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 max-w-md mx-auto">
              {/* Heures */}
              <div className="flex-1 min-w-[70px] sm:min-w-[90px] p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#1A382A] border border-emerald-200 dark:border-emerald-500/40 shadow-md">
                <span className="block text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white font-mono tabular-nums">
                  {formatNumber(countdown.hours)}
                </span>
                <span className="block text-[10px] sm:text-xs font-semibold text-neutral-500 dark:text-emerald-300/80 uppercase mt-0.5">
                  Heures
                </span>
              </div>

              <span className="text-xl sm:text-3xl font-extrabold text-emerald-600 dark:text-amber-300 font-mono pb-4">
                :
              </span>

              {/* Minutes */}
              <div className="flex-1 min-w-[70px] sm:min-w-[90px] p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#1A382A] border border-emerald-200 dark:border-emerald-500/40 shadow-md">
                <span className="block text-2xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white font-mono tabular-nums">
                  {formatNumber(countdown.minutes)}
                </span>
                <span className="block text-[10px] sm:text-xs font-semibold text-neutral-500 dark:text-emerald-300/80 uppercase mt-0.5">
                  Minutes
                </span>
              </div>

              <span className="text-xl sm:text-3xl font-extrabold text-emerald-600 dark:text-amber-300 font-mono pb-4">
                :
              </span>

              {/* Secondes */}
              <div className="flex-1 min-w-[70px] sm:min-w-[90px] p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#1A382A] border border-emerald-200 dark:border-emerald-500/40 shadow-md relative overflow-hidden">
                <span className="block text-2xl sm:text-4xl font-extrabold text-emerald-700 dark:text-amber-300 font-mono tabular-nums">
                  {formatNumber(countdown.seconds)}
                </span>
                <span className="block text-[10px] sm:text-xs font-semibold text-neutral-500 dark:text-emerald-300/80 uppercase mt-0.5">
                  Secondes
                </span>
              </div>
            </div>

            {/* État / Information */}
            <p className="mt-4 text-xs sm:text-sm text-neutral-600 dark:text-emerald-200/80 font-medium">
              {countdown.isToday ? (
                <span>
                  Le livre de ce vendredi est en cours de préparation. Il sera disponible en lecture directe et en téléchargement dès <strong className="text-emerald-800 dark:text-white font-bold">21h00</strong>.
                </span>
              ) : (
                <span>
                  Rendez-vous chaque vendredi à <strong className="text-emerald-800 dark:text-white font-bold">21h00</strong> pour découvrir le nouvel ouvrage hebdomadaire.
                </span>
              )}
            </p>
          </div>
        </section>

        {/* ========================================================
            ESPACE DE LA PARUTION HEBDOMADAIRE (CARTE D'ATTENTE SOIGNÉE)
           ======================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Ouvrage de la Semaine</span>
            </h3>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30">
              Publication à 21h00
            </span>
          </div>

          {/* Carte d'attente épurée pour le livre à paraître */}
          <div className="rounded-3xl bg-white dark:bg-[#183022] border border-neutral-200 dark:border-emerald-500/25 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Visuel Couverture Teaser */}
            <div className="w-40 sm:w-48 h-56 sm:h-64 rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-[#0A1A11] border-2 border-amber-400/50 shadow-xl flex flex-col items-center justify-between p-5 text-center relative overflow-hidden shrink-0 group">
              <div className="w-full flex justify-end">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </div>

              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="font-serif text-amber-200 text-xs tracking-wider">
                  Le Sanctuaire
                </div>
                <h4 className="text-white font-black text-sm leading-tight">
                  Livre du Vendredi
                </h4>
              </div>

              <div className="text-[10px] font-bold text-emerald-200/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                21h00
              </div>
            </div>

            {/* Descriptif & Caractéristiques */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Édition du Vendredi
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-1">
                  Nouvel Ouvrage Spirituel & Jurisprudence
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-emerald-200/80 mt-2 leading-relaxed">
                  L'ouvrage sélectionné pour ce vendredi sera accessible dès 21h00. Il sera lisible directement dans le lecteur interactif avec zoom et marque-pages, et disponible en téléchargement PDF gratuit.
                </p>
              </div>

              {/* Badges des fonctionnalités */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Lecture en ligne plein écran
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700">
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Format PDF téléchargeable
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Contenu authentifié
                </span>
              </div>

              {/* Bouton d'attente */}
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/40 text-amber-900 dark:text-amber-200 text-xs font-bold">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Disponible ce soir dès 21h00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            GUIDE : COMMENT FONCTIONNE LA BIBLIOTHÈQUE ?
           ======================================================== */}
        <section className="space-y-4 pt-4">
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            Comment fonctionne la Bibliothèque du Sanctuaire ?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Étape 1 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#183022] border border-neutral-200/80 dark:border-emerald-500/20 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Parution chaque vendredi à 21h
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/75 leading-relaxed">
                Chaque semaine, un nouvel ouvrage sélectionné pour sa clarté et sa profondeur est offert à toute la communauté.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#183022] border border-neutral-200/80 dark:border-emerald-500/20 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Lecture en ligne & PDF
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/75 leading-relaxed">
                Feuilletez le document directement dans votre navigateur sur smartphone et ordinateur, ou téléchargez-le pour le lire hors-ligne.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#183022] border border-neutral-200/80 dark:border-emerald-500/20 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                Partage & Transmission
              </h4>
              <p className="text-xs text-neutral-600 dark:text-emerald-200/75 leading-relaxed">
                Partagez les écrits bénéfiques avec vos proches et participez à la propagation du savoir sain et authentique.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};
