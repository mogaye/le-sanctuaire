import React, { useState, useEffect } from 'react';
import { UserPlus, X, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface GuestAccountReminderToastProps {
  currentUser: UserProfile | null;
  currentView: string;
  onOpenSignUp: () => void;
}

export const GuestAccountReminderToast: React.FC<GuestAccountReminderToastProps> = ({
  currentUser,
  currentView,
  onOpenSignUp,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If the user is logged in or already on the login/signup page, don't show the reminder
    if (currentUser || currentView === 'login') {
      setIsVisible(false);
      return;
    }

    // 5 minutes timer (300,000 milliseconds)
    const FIVE_MINUTES_MS = 5 * 60 * 1000;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, FIVE_MINUTES_MS);

    return () => clearTimeout(timer);
  }, [currentUser, currentView, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    // The useEffect will automatically re-arm the 5-minute timer because isVisible changed to false
  };

  const handleAction = () => {
    setIsVisible(false);
    onOpenSignUp();
  };

  if (!isVisible || currentUser || currentView === 'login') {
    return null;
  }

  return (
    <aside
      aria-label="Invitation à créer un compte"
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 max-w-sm w-[calc(100vw-1.5rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-300 font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="bg-white dark:bg-[#162A20] text-neutral-900 dark:text-neutral-100 rounded-2xl p-4 sm:p-4.5 border border-neutral-200 dark:border-emerald-500/30 shadow-[0_12px_36px_rgba(0,0,0,0.18)] flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
        
        {/* Subtle decorative top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                Rejoignez le Sanctuaire
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Sauvegarde & Rappels personnalisés
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Fermer la notification"
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Vous naviguez en mode invité. Créez votre compte gratuitement pour enregistrer vos prières, vos versets favoris et sécuriser vos dons.
        </p>

        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={handleAction}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>Créer un compte</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClose}
            className="py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-emerald-900/30 rounded-xl transition-colors cursor-pointer"
          >
            Plus tard
          </button>
        </div>
      </div>
    </aside>
  );
};
