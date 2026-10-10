import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { Header } from './components/Header';
import { VerticalDock } from './components/VerticalDock';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HeroSection } from './components/HeroSection';
import { VerseCard } from './components/VerseCard';
import { FeatureGrid } from './components/FeatureGrid';
import { AppPreviewSection } from './components/AppPreviewSection';
import { TrustHighlightsSection } from './components/TrustHighlightsSection';
import { FooterSection } from './components/FooterSection';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { PrayerPage } from './components/PrayerPage';
import { QuranPage } from './components/QuranPage';
import { FastingPage } from './components/FastingPage';
import { FaithPage } from './components/FaithPage';
import { LibraryPage } from './components/LibraryPage';
import { MonthlyPrayerCalendarView } from './components/MonthlyPrayerCalendarView';
import { WelcomeWalkthrough } from './components/WelcomeWalkthrough';
import { FloatingInteractiveWidgets } from './components/FloatingInteractiveWidgets';
import { FloatingThemeButton } from './components/FloatingThemeButton';
import { PrayerGuideModal } from './components/PrayerGuideModal';
import { QuranModal } from './components/QuranModal';
import { QiblaModal } from './components/QiblaModal';
import { DhikrModal } from './components/DhikrModal';
import { PrayerTimeSettingsModal, PrayerOffsets } from './components/PrayerTimeSettingsModal';
import { DonationModal } from './components/DonationModal';
import { GuestAccountReminderToast } from './components/GuestAccountReminderToast';
import {
  supabase,
  hasUserDonatedLocally,
  checkUserHasDonated,
  syncConnectedAccountToBackend,
} from './lib/supabase';
import { CITIES, METHODS, RECITERS } from './data/islamicData';
import { CityData, Method, Reciter, UserProfile } from './types';
import {
  GREEN_HERO_BACKGROUNDS,
  WHITE_HERO_BACKGROUNDS,
  ALL_HERO_BACKGROUNDS,
  DEFAULT_GIRL_HERO_BG,
} from './utils/heroBackgrounds';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityData>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_selected_city');
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = CITIES.find((c) => c.id === parsed.id || (c.name === parsed.name && c.country === parsed.country));
        if (found) return found;
      }
    } catch (e) {
      // ignore
    }
    const dakar = CITIES.find((c) => c.id === 'dakar');
    return dakar || CITIES[0];
  });

  const handleSelectCity = (city: CityData) => {
    setSelectedCity(city);
    try {
      localStorage.setItem('sanctuaire_selected_city', JSON.stringify(city));
    } catch (e) {
      // ignore
    }
  };
  const [selectedMethod, setSelectedMethod] = useState<Method>(METHODS[0]); // Muslim
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]); // Mishary
  const [activePrayerKey, setActivePrayerKey] = useState<'F' | 'D' | 'A' | 'M' | 'I'>('A');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_dark_mode');
      if (saved === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });
  const [heroBgIndex, setHeroBgIndex] = useState<number>(0);
  const [prevHeroBgId, setPrevHeroBgId] = useState<string | null>(null);

  const activeHeroList = isDarkMode ? GREEN_HERO_BACKGROUNDS : WHITE_HERO_BACKGROUNDS;
  const currentHeroBg =
    activeHeroList[heroBgIndex % activeHeroList.length] || DEFAULT_GIRL_HERO_BG;

  // Rotate landing hero background every 10 seconds smoothly and naturally
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroBgIndex((prev) => {
        const list = isDarkMode ? GREEN_HERO_BACKGROUNDS : WHITE_HERO_BACKGROUNDS;
        const currItem = list[prev % list.length];
        if (currItem) {
          setPrevHeroBgId(currItem.id);
        }
        return prev + 1;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [isDarkMode]);

  // Page Routing State: 'landing', 'login', 'home', 'prayer', 'quran', 'fasting', 'faith', 'library', or 'calendar'
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'home' | 'prayer' | 'quran' | 'fasting' | 'faith' | 'library' | 'calendar'>('landing');
  const [selectedSurahForPage, setSelectedSurahForPage] = useState<number>(1);
  const [selectedBookIdForReader, setSelectedBookIdForReader] = useState<string | undefined>(undefined);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return null;
  });

  // Welcome Walkthrough State
  const [showWelcomeWalkthrough, setShowWelcomeWalkthrough] = useState<boolean>(false);
  const [isRegisteredWelcome, setIsRegisteredWelcome] = useState<boolean>(false);
  const [welcomeMode, setWelcomeMode] = useState<'onboarding' | 'welcome_back'>('onboarding');

  // Modal States
  const [isPrayerGuideOpen, setIsPrayerGuideOpen] = useState<boolean>(false);
  const [isQuranOpen, setIsQuranOpen] = useState<boolean>(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState<boolean>(false);
  const [isDhikrOpen, setIsDhikrOpen] = useState<boolean>(false);
  const [isPrayerSettingsOpen, setIsPrayerSettingsOpen] = useState<boolean>(false);
  const [isDonationOpen, setIsDonationOpen] = useState<boolean>(false);

  // Track whether the logged-in user has made at least 1 donation
  const [hasMadeDonation, setHasMadeDonation] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sanctuaire_user');
      const parsedUser = saved ? JSON.parse(saved) : null;
      return hasUserDonatedLocally(parsedUser);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let isMounted = true;

    const verifyDonationStatus = async () => {
      if (!currentUser) {
        if (isMounted) setHasMadeDonation(false);
        return;
      }
      // Instant local check first
      const localResult = hasUserDonatedLocally(currentUser);
      if (localResult && isMounted) {
        setHasMadeDonation(true);
      }
      // Also verify with Supabase donations table
      const remoteResult = await checkUserHasDonated(currentUser);
      if (isMounted) {
        setHasMadeDonation(remoteResult);
      }
    };

    verifyDonationStatus();

    const handleDonationEvent = () => {
      verifyDonationStatus();
    };

    window.addEventListener('sanctuaire-donation-updated', handleDonationEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('sanctuaire-donation-updated', handleDonationEvent);
    };
  }, [currentUser, isDonationOpen]);

  const canAccessLibrary = Boolean(currentUser && hasMadeDonation);

  // Prayer time adjustments
  const [prayerOffsets, setPrayerOffsets] = useState<PrayerOffsets>(() => {
    try {
      const saved = localStorage.getItem('prayer_offsets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return { F: 0, D: 0, A: 0, M: 0, I: 0 };
  });

  const [asrMethod, setAsrMethod] = useState<'standard' | 'hanafi'>(() => {
    try {
      const saved = localStorage.getItem('asr_method');
      if (saved === 'hanafi') return 'hanafi';
    } catch (e) {
      // ignore
    }
    return 'standard';
  });

  const handleSavePrayerOffsets = (newOffsets: PrayerOffsets, newAsrMethod: 'standard' | 'hanafi') => {
    setPrayerOffsets(newOffsets);
    setAsrMethod(newAsrMethod);
    try {
      localStorage.setItem('prayer_offsets', JSON.stringify(newOffsets));
      localStorage.setItem('asr_method', newAsrMethod);
    } catch (e) {
      // ignore
    }
  };

  // Dark mode effect on html class and localStorage persistence
  useEffect(() => {
    try {
      localStorage.setItem('sanctuaire_dark_mode', String(isDarkMode));
    } catch (e) {
      // ignore
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Automatically synchronize active currentUser to Cloud SQL profiles table & local registry
  useEffect(() => {
    if (!currentUser?.email) return;
    syncConnectedAccountToBackend({
      email: currentUser.email,
      fullName: currentUser.name,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      avatarUrl: currentUser.avatarUrl,
    });
  }, [currentUser]);

  // Supabase session listener for magic links, email verification redirects, and OAuth
  useEffect(() => {
    if (!supabase) return;

    // Check if coming back from an email verification link or saved session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const meta = (user.user_metadata || {}) as Record<string, any>;
        const fullName = meta.full_name || user.email?.split('@')[0] || 'Fidèle';
        const firstName = meta.first_name || fullName.split(' ')[0] || fullName;
        const lastName = meta.last_name || '';

        const profile: UserProfile = {
          name: fullName,
          email: user.email || '',
          firstName,
          lastName,
        };

        setCurrentUser((prev) => {
          if (prev && prev.email === profile.email) return prev;
          try {
            localStorage.setItem('sanctuaire_user', JSON.stringify(profile));
            localStorage.setItem('sanctuaire_has_registered', 'true');
            localStorage.removeItem('sanctuaire_logged_out');
          } catch {
            // ignore
          }
          return profile;
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const user = session.user;
        const meta = (user.user_metadata || {}) as Record<string, any>;
        const fullName = meta.full_name || user.email?.split('@')[0] || 'Fidèle';
        const firstName = meta.first_name || fullName.split(' ')[0] || fullName;
        const lastName = meta.last_name || '';

        const profile: UserProfile = {
          name: fullName,
          email: user.email || '',
          firstName,
          lastName,
        };

        setCurrentUser((prev) => {
          if (prev && prev.email === profile.email) return prev;
          try {
            localStorage.setItem('sanctuaire_user', JSON.stringify(profile));
            localStorage.setItem('sanctuaire_has_registered', 'true');
            localStorage.removeItem('sanctuaire_logged_out');
          } catch {
            // ignore
          }
          return profile;
        });
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleOpenPrayerGuide = (prayerKey?: 'F' | 'D' | 'A' | 'M' | 'I') => {
    if (prayerKey) {
      setActivePrayerKey(prayerKey);
    }
    setCurrentView('prayer');
  };

  const handleOpenQuranPage = (surahNumber?: number) => {
    if (surahNumber) {
      setSelectedSurahForPage(surahNumber);
    }
    setCurrentView('quran');
  };

  const handleOpenFasting = () => {
    setCurrentView('fasting');
  };

  const handleOpenFaith = () => {
    setCurrentView('faith');
  };

  const handleOpenLibrary = (bookId?: string) => {
    setSelectedBookIdForReader(bookId);
    setCurrentView('library');
  };

  // Unified logout handler with memory of previous user session for "Bon retour"
  const handleLogout = () => {
    if (currentUser) {
      try {
        const userKey = currentUser.email || currentUser.name || 'user';
        localStorage.setItem('sanctuaire_was_logged_out_' + userKey, 'true');
      } catch (e) {
        // ignore
      }
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem('sanctuaire_user');
    } catch (e) {
      // ignore
    }
    setCurrentView('landing');
  };

  // Triggered when user clicks "Accéder au site" from landing page
  const handleAccederAuSite = () => {
    // 1. If user is currently logged in, go DIRECTLY to home without showing welcome walkthrough
    if (currentUser) {
      setCurrentView('home');
      return;
    }

    // 2. If guest visitor has already seen the welcome walkthrough once, go DIRECTLY to home
    const hasSeenGuestWelcome = localStorage.getItem('sanctuaire_guest_welcomed') === 'true';
    if (hasSeenGuestWelcome) {
      setCurrentView('home');
      return;
    }

    // 3. First-time guest visitor: show onboarding once
    setIsRegisteredWelcome(false);
    setWelcomeMode('onboarding');
    setShowWelcomeWalkthrough(true);
  };

  // Triggered when user completes or skips the welcome walkthrough
  const handleCompleteWelcome = () => {
    setShowWelcomeWalkthrough(false);
    if (currentUser) {
      const userKey = currentUser.email || currentUser.name || 'user';
      try {
        localStorage.setItem('sanctuaire_welcomed_' + userKey, 'true');
        localStorage.removeItem('sanctuaire_was_logged_out_' + userKey);
      } catch (e) {
        // ignore
      }
    } else {
      try {
        localStorage.setItem('sanctuaire_guest_welcomed', 'true');
      } catch (e) {
        // ignore
      }
    }
    setCurrentView('home');
  };

  // Triggered when user registers or logs in from LoginPage
  const handleLoginSuccess = (user: UserProfile, isNewRegistration: boolean = false) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('sanctuaire_user', JSON.stringify(user));
    } catch (e) {
      // ignore
    }

    const userKey = user.email || user.name || 'user';
    const hasBeenWelcomedBefore = localStorage.getItem('sanctuaire_welcomed_' + userKey) === 'true';
    const wasLoggedOut = localStorage.getItem('sanctuaire_was_logged_out_' + userKey) === 'true';

    // If user previously logged out or has completed onboarding before or is logging in: wish "Bon retour"
    if (wasLoggedOut || hasBeenWelcomedBefore || !isNewRegistration) {
      try {
        localStorage.setItem('sanctuaire_welcomed_' + userKey, 'true');
        localStorage.removeItem('sanctuaire_was_logged_out_' + userKey);
      } catch (e) {
        // ignore
      }
      setIsRegisteredWelcome(true);
      setWelcomeMode('welcome_back');
      setShowWelcomeWalkthrough(true);
    } else {
      // Brand new registration: show personalized onboarding once
      setIsRegisteredWelcome(true);
      setWelcomeMode('onboarding');
      setShowWelcomeWalkthrough(true);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'fasting':
        return (
          <FastingPage
            selectedCity={selectedCity}
            onBackToHome={() => setCurrentView('home')}
            onOpenBookReader={canAccessLibrary ? (bookId) => handleOpenLibrary(bookId) : undefined}
          />
        );

      case 'faith':
        return (
          <FaithPage
            onBackToHome={() => setCurrentView('home')}
            onOpenBookReader={canAccessLibrary ? (bookId) => handleOpenLibrary(bookId) : undefined}
          />
        );

      case 'library':
        if (!canAccessLibrary) {
          return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F7F5] dark:bg-[#14261C] text-neutral-900 dark:text-white">
              <div className="max-w-md w-full rounded-3xl bg-white dark:bg-[#183022] border border-emerald-500/30 p-7 text-center space-y-4 shadow-xl">
                <h2 className="text-xl font-extrabold">Accès réservé aux Membres Bienfaiteurs</h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-emerald-100/80 leading-relaxed">
                  La Bibliothèque & les Livres du Vendredi apparaissent uniquement lorsque vous possédez un compte connecté et avez effectué au moins un don de soutien au Sanctuaire.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  {!currentUser ? (
                    <button
                      onClick={() => setCurrentView('login')}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                    >
                      Créer un compte / Connexion
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsDonationOpen(true)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold cursor-pointer"
                    >
                      Faire un don (Sadaqah)
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentView('home')}
                    className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-emerald-950/60 text-neutral-700 dark:text-emerald-200 text-xs font-semibold cursor-pointer"
                  >
                    Retour
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <LibraryPage
            onBackToHome={() => setCurrentView('home')}
            initialBookId={selectedBookIdForReader}
          />
        );

      case 'quran':
        return (
          <QuranPage
            currentUser={currentUser}
            onBackToHome={() => setCurrentView('home')}
            selectedReciter={selectedReciter}
            onSelectReciter={setSelectedReciter}
            initialSurahNumber={selectedSurahForPage}
            onOpenPrayerPage={() => handleOpenPrayerGuide()}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          />
        );

      case 'login':
        return (
          <LoginPage
            onBackToHome={() => setCurrentView('landing')}
            onLoginSuccess={handleLoginSuccess}
          />
        );

      case 'prayer':
        return (
          <div className="min-h-screen relative font-sans pb-20 md:pb-0">
            <PrayerPage
              currentUser={currentUser}
              onBackToHome={() => setCurrentView('home')}
              selectedCity={selectedCity}
              selectedMethod={selectedMethod}
              initialPrayerKey={activePrayerKey}
              onOpenQibla={() => setIsQiblaOpen(true)}
              onOpenPrayerSettings={() => setIsPrayerSettingsOpen(true)}
              onOpenCalendar={() => setCurrentView('calendar')}
            />
          </div>
        );

      case 'calendar':
        return (
          <div className="min-h-screen relative font-sans pb-20 md:pb-0">
            <VerticalDock
              activeSection="calendar"
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
              onOpenPrayerTimes={() => handleOpenPrayerGuide()}
              onOpenCalendar={() => setCurrentView('calendar')}
              onOpenQuran={() => handleOpenQuranPage()}
              onOpenQibla={() => setIsQiblaOpen(true)}
              onOpenDhikr={() => setIsDhikrOpen(true)}
              onOpenFasting={handleOpenFasting}
              onOpenFaith={handleOpenFaith}
              onOpenLibrary={canAccessLibrary ? () => handleOpenLibrary() : undefined}
            />
            <MonthlyPrayerCalendarView
              currentUser={currentUser}
              onBackToHome={() => setCurrentView('home')}
              selectedCity={selectedCity}
              selectedMethod={selectedMethod}
            />
          </div>
        );

      case 'home':
        return (
          <div className="min-h-screen relative font-sans bg-[#F4F7F5] dark:bg-[#14261C] pb-20 md:pb-0">
            <VerticalDock
              activeSection="home"
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
              onOpenPrayerTimes={() => handleOpenPrayerGuide()}
              onOpenCalendar={() => setCurrentView('calendar')}
              onOpenQuran={() => handleOpenQuranPage()}
              onOpenQibla={() => setIsQiblaOpen(true)}
              onOpenDhikr={() => setIsDhikrOpen(true)}
              onOpenFasting={handleOpenFasting}
              onOpenFaith={handleOpenFaith}
              onOpenLibrary={canAccessLibrary ? () => handleOpenLibrary() : undefined}
            />

            <HomePage
              currentUser={currentUser}
              onLogout={handleLogout}
              onGoToLanding={() => setCurrentView('landing')}
              onOpenAuth={() => setCurrentView('login')}
              selectedCity={selectedCity}
              onSelectCity={handleSelectCity}
              selectedMethod={selectedMethod}
              onSelectMethod={setSelectedMethod}
              selectedReciter={selectedReciter}
              onSelectReciter={setSelectedReciter}
              onOpenPrayerGuide={handleOpenPrayerGuide}
              onOpenCalendar={() => setCurrentView('calendar')}
              onOpenQuran={() => handleOpenQuranPage()}
              onOpenQibla={() => setIsQiblaOpen(true)}
              onOpenDhikr={() => setIsDhikrOpen(true)}
              onOpenFasting={handleOpenFasting}
              onOpenFaith={handleOpenFaith}
              onOpenLibrary={canAccessLibrary ? handleOpenLibrary : undefined}
              onOpenDonations={() => setIsDonationOpen(true)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            />
          </div>
        );

      case 'landing':
      default: {
        return (
          <div className="min-h-screen relative font-sans text-neutral-900 dark:text-neutral-100 bg-[#F4F7F5] dark:bg-[#14261C] overflow-x-hidden selection:bg-emerald-600 selection:text-white transition-colors duration-200">
            {/* 1. TOP HERO ZONE (FULL-BLEED 100% WIDTH & HEIGHT COVERED BY USER BACKGROUND IMAGES) */}
            <div
              className={`relative w-full overflow-hidden transition-colors duration-700 ${
                isDarkMode ? 'bg-[#034223]' : 'bg-[#FEFEFE]'
              }`}
            >
              {/* Full-bleed background covering 100% of the Hero section with seamless natural cross-dissolve */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {ALL_HERO_BACKGROUNDS.map((bgItem) => {
                  const isCurrent = bgItem.id === currentHeroBg.id;
                  const isPrev = bgItem.id === prevHeroBgId && !isCurrent;
                  return (
                    <img
                      key={bgItem.id}
                      src={bgItem.src}
                      alt="Arrière-plan Sanctuaire Islamique"
                      loading="eager"
                      decoding="async"
                      style={{
                        transition: isCurrent ? 'opacity 1800ms ease-in-out' : 'none',
                      }}
                      className={`absolute inset-0 w-full h-full object-cover object-center ${
                        isCurrent
                          ? 'z-20 opacity-100'
                          : isPrev
                            ? 'z-10 opacity-100'
                            : 'z-0 opacity-0'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Hero Content (Header + Hero Section) */}
              <div className="relative z-10 flex flex-col">
                <Header
                  selectedCity={selectedCity}
                  onSelectCity={handleSelectCity}
                  selectedMethod={selectedMethod}
                  onSelectMethod={setSelectedMethod}
                  selectedReciter={selectedReciter}
                  onSelectReciter={setSelectedReciter}
                  onOpenPrayerGuide={() => handleOpenPrayerGuide()}
                  onOpenQuran={() => handleOpenQuranPage()}
                  onOpenFasting={handleOpenFasting}
                  onOpenFaith={handleOpenFaith}
                  onOpenLibrary={canAccessLibrary ? () => handleOpenLibrary() : undefined}
                  onOpenDonations={() => setIsDonationOpen(true)}
                  onOpenAuth={() => setCurrentView('login')}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onGoToHome={handleAccederAuSite}
                  onOpenPrayerSettings={() => setIsPrayerSettingsOpen(true)}
                  isLanding={true}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={() => {
                    setPrevHeroBgId(currentHeroBg.id);
                    setIsDarkMode((prev) => !prev);
                  }}
                />

                <HeroSection
                  onOpenPrayerGuide={handleOpenPrayerGuide}
                  activePrayerKey={activePrayerKey}
                  onSelectPrayerKey={setActivePrayerKey}
                  onAccederSite={handleAccederAuSite}
                  isLightHeroBg={currentHeroBg.mode === 'white'}
                />
              </div>
            </div>

            {/* 2. REST OF THE LANDING PAGE - HARMONIOUS NOCTURNAL SANCTUARY BACKGROUND */}
            <main className="flex-1 w-full bg-[#F4F7F5] dark:bg-[#14261C] relative z-10 transition-colors duration-200">
              <VerseCard />

              <FeatureGrid
                onOpenPrayerGuide={() => handleOpenPrayerGuide()}
                onOpenQuran={() => handleOpenQuranPage()}
                onOpenQibla={() => setIsQiblaOpen(true)}
                onOpenDhikr={() => setIsDhikrOpen(true)}
              />

              <AppPreviewSection
                selectedCity={selectedCity}
                onOpenPrayerGuide={() => handleOpenPrayerGuide()}
                onOpenQuran={() => handleOpenQuranPage()}
                onOpenQibla={() => setIsQiblaOpen(true)}
                onOpenDhikr={() => setIsDhikrOpen(true)}
              />

              <TrustHighlightsSection />

              <FooterSection
                onOpenPrayerGuide={() => handleOpenPrayerGuide()}
                onOpenQuran={() => handleOpenQuranPage()}
                onOpenQibla={() => setIsQiblaOpen(true)}
                onOpenDhikr={() => setIsDhikrOpen(true)}
              />
            </main>
          </div>
        );
      }
    }
  };

  return (
    <div
      className={`${
        currentView === 'quran'
          ? 'h-screen max-h-screen overflow-hidden'
          : 'min-h-screen overflow-x-hidden'
      } relative font-sans bg-[#F4F7F5] dark:bg-[#14261C] ${isDarkMode ? 'dark' : ''}`}
    >
      {/* Rapid, silky and snappy page appearance transition (instant response without sluggish delay) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className={currentView === 'quran' ? 'w-full h-full overflow-hidden' : 'w-full min-h-screen'}
        >
          {renderCurrentView()}
        </motion.div>
      </AnimatePresence>

      {/* Floating Capsule Bottom Navigation Bar (Visible in app views, STRICTLY HIDDEN on landing and login) */}
      {currentView !== 'login' && currentView !== 'landing' && (
        <MobileBottomNav
          currentView={currentView}
          onGoToHome={() => {
            setCurrentView('home');
          }}
          onOpenQuran={() => handleOpenQuranPage()}
          onOpenPrayerGuide={() => handleOpenPrayerGuide()}
          onOpenCalendar={() => setCurrentView('calendar')}
          onOpenQibla={() => setIsQiblaOpen(true)}
          onOpenDhikr={() => setIsDhikrOpen(true)}
          onOpenFasting={() => setCurrentView('fasting')}
          onOpenFaith={() => setCurrentView('faith')}
          onOpenLibrary={canAccessLibrary ? () => setCurrentView('library') : undefined}
          onOpenPrayerSettings={() => setIsPrayerSettingsOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      )}

      {/* Two Floating Draggable Interactive Widgets (Dons & Histoires écrites par l'auteur) - Présents sur mobile et desktop */}
      <AnimatePresence>
        {(currentView === 'home' || currentView === 'landing') && (
          <FloatingInteractiveWidgets
            onOpenLibrary={canAccessLibrary ? () => handleOpenLibrary() : undefined}
            userEmail={currentUser?.email}
            userName={currentUser?.name}
          />
        )}
      </AnimatePresence>

      {/* Interactive Multi-Step Welcome Walkthrough / Welcome Back Overlay */}
      <AnimatePresence>
        {showWelcomeWalkthrough && (
          <WelcomeWalkthrough
            user={currentUser}
            isRegistered={isRegisteredWelcome}
            mode={welcomeMode}
            onComplete={handleCompleteWelcome}
            onSkip={handleCompleteWelcome}
          />
        )}
      </AnimatePresence>

      {/* Floating Theme Button (Bouton circulaire du même type avec badge) sur toutes les pages sauf le Coran */}
      <AnimatePresence>
        {currentView !== 'quran' && (
          <FloatingThemeButton
            isDarkMode={isDarkMode}
            onToggle={() => setIsDarkMode((prev) => !prev)}
          />
        )}
      </AnimatePresence>

      {/* Global Interactive Modals */}
      <PrayerGuideModal
        isOpen={isPrayerGuideOpen}
        onClose={() => setIsPrayerGuideOpen(false)}
        initialPrayerKey={activePrayerKey}
      />

      <QuranModal
        isOpen={isQuranOpen}
        onClose={() => setIsQuranOpen(false)}
        selectedReciter={selectedReciter}
        currentUser={currentUser}
      />

      <QiblaModal
        isOpen={isQiblaOpen}
        onClose={() => setIsQiblaOpen(false)}
        selectedCity={selectedCity}
        selectedMethod={selectedMethod}
        onSelectCity={handleSelectCity}
        onOpenPrayerSettings={() => setIsPrayerSettingsOpen(true)}
      />

      <DhikrModal
        isOpen={isDhikrOpen}
        onClose={() => setIsDhikrOpen(false)}
      />

      <PrayerTimeSettingsModal
        isOpen={isPrayerSettingsOpen}
        onClose={() => setIsPrayerSettingsOpen(false)}
        selectedCity={selectedCity}
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        offsets={prayerOffsets}
        onSaveOffsets={handleSavePrayerOffsets}
        currentAsrMethod={asrMethod}
      />

      {/* Modal de Dons Multi-Canaux (Wave, DunyaPay, Cartes & Supabase) */}
      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        userEmail={currentUser?.email}
        userName={currentUser?.name}
      />

      {/* Persistent 5-minute Guest Reminder for unauthenticated visitors */}
      <GuestAccountReminderToast
        currentUser={currentUser}
        currentView={currentView}
        onOpenSignUp={() => setCurrentView('login')}
      />
    </div>
  );
}
