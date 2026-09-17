import React, { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle, ArrowRight, Eye, EyeOff, Sparkles, Database } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const userEmail = email.trim();
    const displayName = isRegister
      ? (name.trim() || (userEmail ? userEmail.split('@')[0] : 'Fidèle'))
      : (userEmail ? userEmail.split('@')[0] : 'Fidèle');

    if (!userEmail) {
      setErrorMessage('Veuillez saisir votre adresse email.');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const { error, isFallback, needsEmailVerification } = await signUpWithEmail(userEmail, password, displayName);
        if (error) {
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        if (needsEmailVerification && !isFallback) {
          setSuccessMessage('Un e-mail de confirmation a été envoyé à votre adresse. Veuillez cliquer sur le lien pour vous connecter automatiquement.');
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Compte créé avec succès ! Bienvenue au Sanctuaire.');
      } else {
        const { data, error } = await signInWithEmail(userEmail, password);
        if (error) {
          setErrorMessage(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : error.message);
          setIsLoading(false);
          return;
        }
        setSuccessMessage('Connexion réussie !');
      }

      setTimeout(() => {
        onLoginSuccess({ name: displayName, email: userEmail });
        setSuccessMessage('');
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur d’authentification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { data, error, isFallback } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }
      if (isFallback) {
        const fallbackName = name.trim() || (email.trim() ? email.split('@')[0] : 'Fidèle');
        const fallbackEmail = email.trim() || 'fidele@sanctuaire.app';
        onLoginSuccess({ name: fallbackName, email: fallbackEmail });
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur OAuth');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-md bg-white dark:bg-[#193226] rounded-2xl sm:rounded-[32px] border border-neutral-200 dark:border-emerald-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-5 border-b border-neutral-100 dark:border-emerald-800/40 gap-2 transition-colors">
          <div className="flex items-center gap-2">
            <img
              src="/images/sanctuaire_logo.jpg"
              alt="Logo Le Sanctuaire"
              referrerPolicy="no-referrer"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-1 ring-emerald-500/30 shadow-2xs"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                {isRegister ? 'Créer un compte' : 'Espace Connexion'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-400 font-bold">
                Le Sanctuaire
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 dark:bg-[#14281E] hover:bg-neutral-200 dark:hover:bg-[#102018] flex items-center justify-center text-neutral-900 dark:text-white transition cursor-pointer active:scale-95"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-neutral-100 dark:border-emerald-800/40 px-4 sm:px-8 pt-2 transition-colors">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 pb-2.5 sm:pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              !isRegister
                ? 'border-emerald-800 dark:border-emerald-400 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Se Connecter
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 pb-2.5 sm:pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              isRegister
                ? 'border-emerald-800 dark:border-emerald-400 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Nouveau Compte
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {successMessage ? (
            <div className="p-4 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {isRegister && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-900 dark:text-white block">Nom complet</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Prénom & Nom"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/30 text-xs text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-900 dark:text-white block">Adresse Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="adresse@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/30 text-xs text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-900 dark:text-white block">Mot de passe</label>
                  {!isRegister && (
                    <button
                      type="button"
                      className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-neutral-50 dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/30 text-xs text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-900 dark:text-white font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-neutral-300 dark:border-neutral-600 accent-emerald-600"
                  />
                  <span>Se souvenir de moi</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-800 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-1 sm:mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Chargement...</span>
                  </span>
                ) : (
                  <>
                    <span>{isRegister ? 'Créer mon compte' : 'Se Connecter'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Google and Quick Demo Access */}
          <div className="pt-2 sm:pt-3 border-t border-neutral-100 dark:border-emerald-800/40 space-y-2">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2 sm:py-2.5 px-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[#14281E] border border-neutral-200 dark:border-emerald-500/30 hover:bg-neutral-50 dark:hover:bg-[#102018] text-neutral-900 dark:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </button>
          </div>

          {/* Value note */}
          <p className="text-[10px] sm:text-[11px] text-center text-neutral-500 dark:text-neutral-400 font-medium">
            🔒 Vos données personnelles sont strictement confidentielles et sécurisées.
          </p>
        </div>
      </div>
    </div>
  );
};
