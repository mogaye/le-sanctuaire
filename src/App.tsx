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
import { supabase } from './lib/supabase';
import { CITIES, METHODS, RECITERS } from './data/islamicData';
import { CityData, Method, Reciter, UserProfile } from './types';

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

  // Supabase session listener for magic links, email verification redirects, and OAuth
  useEffect(() => {
    if (!supabase) return;

    // Check if coming back from an email verification link or saved session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !currentUser) {
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

        handleLoginSuccess(profile, false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
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

        handleLoginSuccess(profile, false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [currentUser]);

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
            onOpenBookReader={(bookId) => handleOpenLibrary(bookId)}
          />
        );

      case 'faith':
        return (
          <FaithPage
            onBackToHome={() => setCurrentView('home')}
            onOpenBookReader={(bookId) => handleOpenLibrary(bookId)}
          />
        );

      case 'library':
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
              onOpenLibrary={handleOpenLibrary}
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
              onOpenLibrary={handleOpenLibrary}
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
              onOpenLibrary={handleOpenLibrary}
              onOpenDonations={() => setIsDonationOpen(true)}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            />
          </div>
        );

      case 'landing':
      default:
        return (
          <div className="min-h-screen relative font-sans text-neutral-900 dark:text-neutral-100 bg-[#F4F7F5] dark:bg-[#14261C] overflow-x-hidden selection:bg-emerald-600 selection:text-white transition-colors duration-200">
            {/* 1. TOP HERO ZONE (FULL-BLEED 100% WIDTH COVERED BY BACKGROUND IMAGE) */}
            <div className="relative w-full overflow-hidden bg-[#0D2016] transition-colors duration-200">
              {/* Full-width background image - 100% natural, crisp, no white veil */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                  src="/images/backgrounds/user_uploaded_bg.png"
                  alt="Arrière-plan Sanctuaire Islamique"
                  className="w-full h-full object-cover object-right sm:object-center"
                />
                {/* Subtle dark vignette on the left text area only so typography is crystal clear without obscuring the sister or Quran on the right */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#091D13]/90 via-[#091D13]/55 to-transparent" />
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
                  onOpenLibrary={handleOpenLibrary}
                  onOpenDonations={() => setIsDonationOpen(true)}
                  onOpenAuth={() => setCurrentView('login')}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onGoToHome={handleAccederAuSite}
                  onOpenPrayerSettings={() => setIsPrayerSettingsOpen(true)}
                  isLanding={true}
                  isDarkMode={isDarkMode}
                  onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
                />

                <HeroSection
                  onOpenPrayerGuide={handleOpenPrayerGuide}
                  activePrayerKey={activePrayerKey}
                  onSelectPrayerKey={setActivePrayerKey}
                  onAccederSite={handleAccederAuSite}
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
  };

  return (
    <div className={`min-h-screen relative font-sans bg-[#F4F7F5] dark:bg-[#14261C] overflow-x-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Rapid, silky and snappy page appearance transition (instant response without sluggish delay) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full min-h-screen"
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
          onOpenLibrary={() => setCurrentView('library')}
          onOpenPrayerSettings={() => setIsPrayerSettingsOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      )}

      {/* Two Floating Draggable Interactive Widgets (Dons & Histoires écrites par l'auteur) - Présents sur mobile et desktop */}
      <AnimatePresence>
        {(currentView === 'home' || currentView === 'landing') && <FloatingInteractiveWidgets />}
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
