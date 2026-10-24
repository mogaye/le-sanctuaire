import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Sparkles,
  Calendar,
  Share2,
  Check,
  ShieldCheck,
  Users,
  Search,
  Compass,
  Award,
  ChevronRight,
  Download,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { PuitsDeNourReader } from './PuitsDeNourReader';
import { IslamicPersonBookReader } from './IslamicPersonBookReader';
import { PdfBookReader } from './PdfBookReader';
import { PUITS_DE_NOUR_HERO_IMAGE, PUITS_DE_NOUR_CHARACTERS } from '../data/puitsDeNourCharacters';
import { PUITS_DE_NOUR_CHAPTERS } from '../data/puitsDeNourText';
import {
  ISLAMIC_PEOPLE_BOOKS,
  ISLAMIC_PERSON_CATEGORIES,
  IslamicPersonBook,
  IslamicPersonCategory,
} from '../data/islamicPeopleHistoryData';
import { ISLAMIC_BOOKS, IslamicBook, BOOK_CATEGORIES } from '../data/booksData';
import portraitSereinVertBg from '../Portrait serein avec Coran sur fond vert.png';

interface LibraryPageProps {
  onBackToHome: () => void;
  initialBookId?: string;
  onReadingStateChange?: (isReading: boolean) => void;
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

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onBackToHome,
  initialBookId,
  onReadingStateChange,
}) => {
  const [countdown, setCountdown] = useState<CountdownState>(calculateFridayCountdown);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isReadingPuitsDeNour, setIsReadingPuitsDeNour] = useState<boolean>(() => {
    return initialBookId === 'puits-de-nour';
  });
  const [selectedPersonBook, setSelectedPersonBook] = useState<IslamicPersonBook | null>(() => {
    if (!initialBookId || initialBookId === 'puits-de-nour') return null;
    return ISLAMIC_PEOPLE_BOOKS.find((b) => b.id === initialBookId && b.isAvailable !== false) || null;
  });
  const [selectedPdfBook, setSelectedPdfBook] = useState<IslamicBook | null>(() => {
    if (!initialBookId || initialBookId === 'puits-de-nour') return null;
    return ISLAMIC_BOOKS.find((b) => b.id === initialBookId && Boolean(b.pdfUrl)) || null;
  });
  const [selectedCategory, setSelectedCategory] = useState<'all' | IslamicPersonCategory>('all');
  const [bookFilterCategory, setBookFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mise à jour continue du chronomètre chaque seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateFridayCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isReadingAnyBook =
    isReadingPuitsDeNour || selectedPersonBook !== null || selectedPdfBook !== null;

  useEffect(() => {
    onReadingStateChange?.(isReadingAnyBook);
    return () => {
      onReadingStateChange?.(false);
    };
  }, [isReadingAnyBook, onReadingStateChange]);

  useEffect(() => {
    const handleCloseBookFromBack = () => {
      if (selectedPdfBook) {
        setSelectedPdfBook(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (isReadingPuitsDeNour) {
        setIsReadingPuitsDeNour(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (selectedPersonBook) {
        setSelectedPersonBook(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('sanctuaire-close-book', handleCloseBookFromBack);
    return () => window.removeEventListener('sanctuaire-close-book', handleCloseBookFromBack);
  }, [selectedPdfBook, isReadingPuitsDeNour, selectedPersonBook]);

  const filteredPdfBooks = useMemo(() => {
    return ISLAMIC_BOOKS.filter((book) => {
      if (!book.pdfUrl) return false;
      const matchesCat = bookFilterCategory === 'all' || book.category === bookFilterCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q) ||
        (book.arabicTitle && book.arabicTitle.toLowerCase().includes(q))
      );
    });
  }, [bookFilterCategory, searchQuery]);

  const filteredPersonBooks = useMemo(() => {
    return ISLAMIC_PEOPLE_BOOKS.filter((book) => {
      const matchesCat = selectedCategory === 'all' || book.category === selectedCategory;
      if (!matchesCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        book.name.toLowerCase().includes(q) ||
        book.title.toLowerCase().includes(q) ||
        book.shortSummary.toLowerCase().includes(q) ||
        book.era.toLowerCase().includes(q) ||
        book.virtues.some((v) => v.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Le Sanctuaire - Bibliothèque & Histoire des Personnalités Islamiques',
          text: 'Découvrez la Bibliothèque du Sanctuaire et le catalogue des grandes personnalités de l’Islam !',
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
    <div className="min-h-screen bg-[#F2EFE9] dark:bg-[#12241A] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans pb-24 md:pb-12 transition-colors duration-300">
      
      {/* ========================================================
          BARRE DE NAVIGATION SUPÉRIEURE (PROPRE & NORMALE)
         ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#F7F4EE]/95 dark:bg-[#183022]/95 backdrop-blur-md border-b border-stone-200/90 dark:border-emerald-600/30 shadow-2xs transition-colors">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Bouton Retour */}
          <button
            onClick={() => {
              if (selectedPdfBook) {
                setSelectedPdfBook(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else if (isReadingPuitsDeNour) {
                setIsReadingPuitsDeNour(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else if (selectedPersonBook) {
                setSelectedPersonBook(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                onBackToHome();
              }
            }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-[#14281E] dark:hover:bg-emerald-900/60 text-neutral-800 dark:text-neutral-100 text-xs sm:text-sm font-bold transition-all cursor-pointer border border-neutral-200/80 dark:border-emerald-500/30 hover:border-emerald-500/50 active:scale-95 shrink-0"
            title={isReadingAnyBook ? 'Retour au catalogue' : "Retour à l'accueil"}
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">{isReadingAnyBook ? 'Retour au Catalogue' : 'Retour au Sanctuaire'}</span>
            <span className="sm:hidden">{isReadingAnyBook ? 'Catalogue' : 'Accueil'}</span>
          </button>

          {/* Titre & Identité */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <BookOpen className="w-4 h-4 text-emerald-700 dark:text-amber-300" />
            </div>
            <div className="text-left min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white leading-tight truncate">
                Bibliothèque du Sanctuaire
              </h1>
              <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300/90 font-medium truncate">
                Ouvrages & Histoire des Personnalités Islamiques
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
        {isReadingPuitsDeNour ? (
          <PuitsDeNourReader onClose={() => setIsReadingPuitsDeNour(false)} />
        ) : selectedPersonBook ? (
          <IslamicPersonBookReader
            book={selectedPersonBook}
            onClose={() => {
              setSelectedPersonBook(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectOtherBook={(other) => {
              setSelectedPersonBook(other);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            allBooks={ISLAMIC_PEOPLE_BOOKS}
          />
        ) : (
          <>
            {/* BANNIÈRE HÉRO & ANNONCE PRINCIPALE AVEC CHRONOMÈTRE */}
            <section className="relative rounded-3xl overflow-hidden bg-[#132A1D] border border-emerald-600/35 dark:border-emerald-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-6 sm:p-10 text-center">
              {/* Image de fond (Portrait serein au Coran sur fond vert) */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                  src={portraitSereinVertBg}
                  alt="Bibliothèque du Sanctuaire"
                  className="w-full h-full object-cover object-right sm:object-center opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#091D13]/85 via-[#0D261A]/65 to-[#091D13]/60" />
              </div>

              <div className="relative z-10">
                {/* Badge officiel de parution hebdomadaire */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-bold shadow-2xs mb-4">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Rendez-vous hebdomadaire</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-amber-300 font-extrabold">Vendredi 21h00</span>
                </div>

                {/* Titre & Message clé */}
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
                  Un nouveau livre sort{' '}
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                    chaque vendredi à 21h
                  </span>
                </h2>

                <p className="mt-4 text-xs sm:text-base text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
                  Chaque semaine, Le Sanctuaire met à votre disposition un ouvrage islamique sélectionné pour enrichir votre savoir, nourrir votre spiritualité et vous accompagner dans votre cheminement.
                </p>
              </div>

              {/* ========================================================
                  CHRONO EN DIRECT (COMPTE À REBOURS)
                 ======================================================== */}
              <div className="relative z-10 mt-8 pt-8 border-t border-emerald-500/30">
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-amber-300 mb-4 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {countdown.isToday
                      ? 'Chronomètre : Parution ce soir à 21h00'
                      : 'Chronomètre : Prochaine parution vendredi à 21h00'}
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
                <p className="mt-4 text-xs sm:text-sm text-emerald-100/90 font-medium">
                  Rendez-vous chaque vendredi à <strong className="text-amber-300 font-bold">21h00</strong> pour découvrir le nouvel ouvrage hebdomadaire.
                </p>
              </div>
            </section>

            {/* ========================================================
                ESPACE DE LA PARUTION HEBDOMADAIRE : LE PUITS DE NOUR
               ======================================================== */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ouvrage de la Semaine</span>
                </h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30">
                  Disponible maintenant
                </span>
              </div>

              {/* Carte de l'ouvrage "Le Puits de Nour" */}
              <div
                onClick={() => {
                  setIsReadingPuitsDeNour(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="rounded-3xl bg-white dark:bg-[#183022] border border-neutral-200 dark:border-emerald-500/25 hover:border-emerald-500/60 p-6 sm:p-8 shadow-xs hover:shadow-lg transition-all flex flex-col md:flex-row items-center gap-6 sm:gap-8 cursor-pointer group"
              >
                {/* Visuel Couverture */}
                <div className="w-40 sm:w-48 h-56 sm:h-64 rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-[#0A1A11] border-2 border-amber-400/60 shadow-xl flex flex-col items-center justify-between p-5 text-center relative overflow-hidden shrink-0">
                  <img
                    src={PUITS_DE_NOUR_HERO_IMAGE}
                    alt="Le Puits de Nour"
                    className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30" />

                  <div className="relative z-10 w-full flex justify-end">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>

                  <div className="relative z-10 space-y-2">
                    <div className="w-11 h-11 mx-auto rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="font-serif text-amber-200 text-xs tracking-wider">
                      Le Sanctuaire
                    </div>
                    <h4 className="text-white font-black text-base leading-tight font-serif">
                      Le Puits de Nour
                    </h4>
                  </div>

                  <div className="relative z-10 text-[10px] font-bold text-amber-200 bg-black/40 px-2.5 py-1 rounded-full border border-amber-300/30">
                    {PUITS_DE_NOUR_CHAPTERS.length} Chapitres & Épilogue
                  </div>
                </div>

                {/* Descriptif & Caractéristiques */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Édition du Vendredi • Récit & Sagesse
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-1">
                      Le Puits de Nour
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-emerald-200/80 mt-2 leading-relaxed">
                      Dans le village d'oasis de Dar-Salam frappé par la sécheresse, le jeune Yassine (12 ans), élevé par sa grand-mère Setti Aïcha, découvre que le tarissement du grand puits cache une vérité enfouie depuis le départ mystérieux de son père. Un récit initiatique profond sur l'honnêteté, la responsabilité collective, le pardon et la lumière de la vérité.
                    </p>
                  </div>

                  {/* Badges des fonctionnalités */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Lecture intégrale par chapitre
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700">
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {PUITS_DE_NOUR_CHARACTERS.length} Personnages illustrés (fenêtre latérale)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Contenu authentifié
                    </span>
                  </div>

                  {/* Bouton de lecture directe */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsReadingPuitsDeNour(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Lire Le Puits de Nour maintenant</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================
                COLLECTION DES LIVRES ISLAMIQUES & ÉPÎTRES (PDF & LECTURE)
               ======================================================== */}
            <section className="space-y-6 pt-4 border-t border-stone-200/80 dark:border-emerald-500/20">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Livres & Épîtres Islamiques en PDF</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5">
                    <span>Ouvrages de Référence & Traités Numérisés</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-emerald-200/80 max-w-2xl leading-relaxed">
                    Accédez à la collection complète des livres islamiques téléchargeables et lisibles directement sur votre écran : Sîrah du Prophète ﷺ, Foi, Piété, Fiqh de la Zakat, Jeûne et sagesses spirituelles.
                  </p>
                </div>
              </div>

              {/* Filtres par Catégorie de Livres */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {BOOK_CATEGORIES.map((cat) => {
                  const isActive = bookFilterCategory === cat.id;
                  const count =
                    cat.id === 'all'
                      ? ISLAMIC_BOOKS.filter((b) => Boolean(b.pdfUrl)).length
                      : ISLAMIC_BOOKS.filter((b) => Boolean(b.pdfUrl) && b.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setBookFilterCategory(cat.id)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-[#183022] text-neutral-700 dark:text-emerald-100 border-stone-200 dark:border-emerald-500/25 hover:border-emerald-500/50'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          isActive
                            ? 'bg-amber-400 text-neutral-950'
                            : 'bg-neutral-100 dark:bg-[#12241A] text-emerald-700 dark:text-amber-300'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grille des Livres en PDF */}
              {filteredPdfBooks.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-[#183022] border border-stone-200 dark:border-emerald-500/25 p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-neutral-800 dark:text-white">
                    Aucun livre ne correspond à votre recherche « {searchQuery} ».
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setBookFilterCategory('all');
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-amber-300 underline cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPdfBooks.map((book) => (
                    <div
                      key={book.id}
                      className="rounded-3xl bg-white dark:bg-[#183022] border border-stone-200 dark:border-emerald-500/25 hover:border-emerald-500/60 p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        {/* En-tête de la carte */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30 truncate max-w-[170px]">
                            {book.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">
                            PDF • {book.pageEstimate ? `~${book.pageEstimate} p.` : 'Complet'}
                          </span>
                        </div>

                        {/* Calligraphie arabe si disponible */}
                        {book.arabicTitle && (
                          <div className="text-right font-arabic text-sm font-bold text-amber-700 dark:text-amber-300 leading-snug line-clamp-1" dir="rtl">
                            {book.arabicTitle}
                          </div>
                        )}

                        <div>
                          <h4 className="text-base font-black text-neutral-900 dark:text-white leading-snug">
                            {book.title}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                            {book.author}
                          </p>
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                          {book.description}
                        </p>
                      </div>

                      {/* Boutons d'action : Lire le PDF & Télécharger */}
                      <div className="pt-3 border-t border-stone-200/80 dark:border-emerald-500/20 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPdfBook(book);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Lire l'ouvrage (PDF)</span>
                        </button>

                        {book.pdfUrl && (
                          <a
                            href={book.pdfUrl}
                            download
                            className="inline-flex items-center justify-center gap-1 p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#12241A] dark:hover:bg-emerald-900/60 text-neutral-800 dark:text-emerald-200 border border-stone-200 dark:border-emerald-500/25 transition cursor-pointer"
                            title="Télécharger le PDF sur votre appareil"
                          >
                            <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ========================================================
                CATALOGUE : HISTOIRE DES PERSONNALITÉS ISLAMIQUES
               ======================================================== */}
            <section className="space-y-6 pt-4 border-t border-stone-200/80 dark:border-emerald-500/20">
              {/* En-tête du Catalogue */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300/70 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Collection Biographique & Spirituelle</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5">
                    <span>Catalogue : Histoire des Personnalités Islamiques</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-emerald-200/80 max-w-2xl leading-relaxed">
                    Découvrez la vie, les épreuves et les enseignements lumineux des Prophètes, des Compagnons, des Femmes illustres et des grands Sages de l&apos;Islam à travers des récits complets en chapitres.
                  </p>
                </div>

                {/* Barre de recherche dans le catalogue */}
                <div className="relative w-full md:w-72 shrink-0">
                  <Search className="w-4 h-4 text-neutral-400 dark:text-emerald-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une personnalité, vertu..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#183022] border border-stone-200 dark:border-emerald-500/30 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-emerald-200/50 focus:outline-none focus:border-emerald-600 dark:focus:border-amber-400 transition"
                  />
                </div>
              </div>

              {/* Filtres par catégorie */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {ISLAMIC_PERSON_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const count =
                    cat.id === 'all'
                      ? ISLAMIC_PEOPLE_BOOKS.length
                      : ISLAMIC_PEOPLE_BOOKS.filter((b) => b.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-[#183022] text-neutral-700 dark:text-emerald-100 border-stone-200 dark:border-emerald-500/25 hover:border-emerald-500/50'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          isActive
                            ? 'bg-amber-400 text-neutral-950'
                            : 'bg-neutral-100 dark:bg-[#12241A] text-emerald-700 dark:text-amber-300'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grille des ouvrages biographiques */}
              {filteredPersonBooks.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-[#183022] border border-stone-200 dark:border-emerald-500/25 p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-neutral-800 dark:text-white">
                    Aucune personnalité ne correspond à votre recherche « {searchQuery} ».
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-amber-300 underline cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPersonBooks.map((personBook) => {
                    const isAvailable = personBook.isAvailable !== false && personBook.chapters.length > 0;
                    return (
                      <div
                        key={personBook.id}
                        onClick={() => {
                          if (!isAvailable) return;
                          setSelectedPersonBook(personBook);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`rounded-3xl bg-white dark:bg-[#183022] border p-5 sm:p-6 shadow-xs transition-all flex flex-col justify-between gap-5 ${
                          isAvailable
                            ? 'border-stone-200 dark:border-emerald-500/25 hover:border-emerald-600/60 dark:hover:border-amber-400/50 hover:shadow-xl cursor-pointer group'
                            : 'border-stone-200/80 dark:border-emerald-500/15 opacity-90'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                          {/* Couverture du Livre Biographique */}
                          <div
                            className={`w-36 sm:w-36 h-48 sm:h-52 rounded-2xl bg-gradient-to-br ${personBook.coverGradient} border-2 ${
                              isAvailable ? 'border-amber-400/50 group-hover:scale-[1.02]' : 'border-stone-400/30'
                            } shadow-lg flex flex-col items-center justify-between p-4 text-center relative overflow-hidden shrink-0 transition-transform`}
                          >
                            <div className="w-full flex items-center justify-between text-[10px] font-bold text-amber-300/90">
                              <span>Sîrah & Vie</span>
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>

                            <div className="space-y-1.5 my-auto">
                              <div
                                className="font-serif text-amber-300 text-xs leading-snug line-clamp-2"
                                dir="rtl"
                              >
                                {personBook.arabicName}
                              </div>
                              <div className="w-8 h-0.5 bg-amber-400/50 mx-auto rounded-full" />
                              <h4 className="text-white font-black text-sm leading-tight font-serif">
                                {personBook.name}
                              </h4>
                              <span className="block text-[11px] text-amber-200 font-serif">
                                {personBook.honorific}
                              </span>
                            </div>

                            <div
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border w-full truncate ${
                                isAvailable
                                  ? 'text-emerald-200 bg-black/40 border-white/15'
                                  : 'text-amber-200 bg-black/55 border-amber-300/30'
                              }`}
                            >
                              {isAvailable ? `${personBook.chapters.length} Chapitres` : 'Histoire à venir'}
                            </div>
                          </div>

                          {/* Détails de la personnalité */}
                          <div className="flex-1 space-y-2.5 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-amber-300 border border-emerald-300/50 dark:border-emerald-500/30">
                                {personBook.categoryLabel}
                              </span>
                              {isAvailable ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                  <Clock className="w-3 h-3" />
                                  {personBook.readTime}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-400/30">
                                  <Clock className="w-3 h-3" />
                                  Pas encore disponible
                                </span>
                              )}
                            </div>

                            <div>
                              <h4 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-amber-300 transition leading-snug">
                                {personBook.name}{' '}
                                <span className="text-amber-600 dark:text-amber-300 font-serif font-normal">
                                  {personBook.honorific}
                                </span>
                              </h4>
                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                                {personBook.title}
                              </p>
                            </div>

                            {isAvailable ? (
                              <>
                                <p className="text-xs text-neutral-600 dark:text-emerald-100/80 line-clamp-3 leading-relaxed">
                                  {personBook.shortSummary}
                                </p>
                                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-neutral-500 dark:text-emerald-300/75 pt-0.5">
                                  <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span className="truncate">{personBook.era}</span>
                                </div>
                              </>
                            ) : (
                              <div className="rounded-2xl bg-neutral-100/90 dark:bg-[#12241A] border border-stone-200/80 dark:border-emerald-500/20 px-3.5 py-2.5 text-xs font-semibold text-neutral-600 dark:text-emerald-200/80">
                                Histoire à venir — Ce récit n&apos;est pas encore disponible.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pied de carte : Vertus & Bouton Lire / État */}
                        <div className="pt-3 border-t border-stone-200/80 dark:border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
                          {isAvailable ? (
                            <>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                {personBook.virtues.slice(0, 2).map((virtue) => (
                                  <span
                                    key={virtue}
                                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#12241A] text-neutral-700 dark:text-emerald-200 border border-neutral-200/80 dark:border-emerald-500/20"
                                  >
                                    {virtue}
                                  </span>
                                ))}
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPersonBook(personBook);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition cursor-pointer ml-auto"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Lire l&apos;histoire</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full flex items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300/90 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Histoire à venir</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#12241A] text-neutral-500 dark:text-emerald-200/60 border border-neutral-200 dark:border-emerald-500/20 text-xs font-bold">
                                Pas encore disponible
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                    Histoire des Personnalités Islamiques
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-emerald-200/75 leading-relaxed">
                    Explorez le catalogue biographique des Prophètes, Compagnons, Femmes illustres et Savants avec lecture par chapitre et écoute audio.
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
          </>
        )}
      </main>

      {/* Lecteur PDF modal intégré */}
      {selectedPdfBook && (
        <PdfBookReader
          book={selectedPdfBook}
          onClose={() => {
            setSelectedPdfBook(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
};

