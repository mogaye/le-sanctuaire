import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  User,
  Database,
  Check,
  MailCheck,
  RefreshCw,
  Edit3,
  ShieldCheck,
  Sparkles,
  Users,
  Send,
  X,
} from 'lucide-react';
import sujudImage from '../Portrait serein avec Coran sur fond vert.png';
import { UserProfile } from '../types';
import {
  signInWithEmail,
  signUpWithEmail,
  resendVerificationEmail,
  verifyEmailOtpCode,
  signInWithGoogle,
  isSupabaseConfigured,
  supabase,
  fetchAllConnectedAccounts,
  syncConnectedAccountToBackend,
  LocalRegisteredAccount,
} from '../lib/supabase';
import {
  sendEmailWithGmailAccount,
  buildVerificationEmailHtml,
} from '../lib/gmailService';

interface LoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (user: UserProfile, isNewRegistration?: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Connected / Existing Accounts State
  const [connectedAccounts, setConnectedAccounts] = useState<LocalRegisteredAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Email Verification & Gmail Sending State
  const [isWaitingVerification, setIsWaitingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [pendingFirstName, setPendingFirstName] = useState('');
  const [pendingLastName, setPendingLastName] = useState('');
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [generatedOtpCode, setGeneratedOtpCode] = useState('');
  const [otpSignature, setOtpSignature] = useState('');
  const [enteredOtpCode, setEnteredOtpCode] = useState('');

  // Gmail Send Confirmation Modal (Mandatory confirmation before sending email via Gmail API)
  const [gmailConfirmPayload, setGmailConfirmPayload] = useState<{
    to: string;
    subject: string;
    htmlBody: string;
    recipientName: string;
    otpCode: string;
  } | null>(null);
  const [isSendingGmail, setIsSendingGmail] = useState(false);

  const isConfigured = isSupabaseConfigured();

  // Load already connected / registered accounts from PostgreSQL & local storage
  useEffect(() => {
    let active = true;
    setLoadingAccounts(true);
    fetchAllConnectedAccounts()
      .then((list) => {
        if (active) {
          setConnectedAccounts(list);
          setLoadingAccounts(false);
        }
      })
      .catch(() => {
        if (active) setLoadingAccounts(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Quick login when clicking an already connected account
  const handleQuickReconnect = async (acc: LocalRegisteredAccount) => {
    setFeedback({
      type: 'success',
      message: `Reconnexion au compte ${acc.fullName} (${acc.email})...`,
    });
    await syncConnectedAccountToBackend({
      id: acc.id,
      email: acc.email,
      fullName: acc.fullName,
      firstName: acc.firstName,
      lastName: acc.lastName,
      avatarUrl: acc.avatarUrl,
    });
    setTimeout(() => {
      onLoginSuccess(
        {
          name: acc.fullName,
          email: acc.email,
          firstName: acc.firstName,
          lastName: acc.lastName,
          avatarUrl: acc.avatarUrl,
        },
        false
      );
    }, 350);
  };

  // Prepare Gmail verification email with explicit user confirmation modal
  const handlePrepareGmailVerification = (targetEmail: string, targetName: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtpCode(code);
    const subject = `Code de vérification Le Sanctuaire : ${code}`;
    const htmlBody = buildVerificationEmailHtml(targetName, code);
    setGmailConfirmPayload({
      to: targetEmail,
      subject,
      htmlBody,
      recipientName: targetName,
      otpCode: code,
    });
  };

  const handleConfirmSendGmail = async () => {
    if (!gmailConfirmPayload) return;
    setIsSendingGmail(true);
    try {
      const result = await sendEmailWithGmailAccount(
        {
          to: gmailConfirmPayload.to,
          subject: gmailConfirmPayload.subject,
          htmlBody: gmailConfirmPayload.htmlBody,
          textBody: `Code de vérification Le Sanctuaire : ${gmailConfirmPayload.otpCode}`,
          emailType: 'verification',
        },
        'mgaye60000@gmail.com'
      );

      setGmailConfirmPayload(null);
      if (result.success) {
        setFeedback({
          type: 'success',
          message: `E-mail envoyé avec succès depuis votre compte Gmail (${result.senderEmail || 'mgaye60000@gmail.com'}) vers ${gmailConfirmPayload.to} !`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.error || "Erreur lors de l'envoi de l'e-mail via Gmail.",
        });
      }
    } catch (err: any) {
      setGmailConfirmPayload(null);
      setFeedback({
        type: 'error',
        message: err?.message || "Erreur lors de l'envoi Gmail.",
      });
    } finally {
      setIsSendingGmail(false);
    }
  };

  // Cooldown timer for resending verification email
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Real-time listener and polling for automatic connection upon email verification
  React.useEffect(() => {
    if (!isWaitingVerification) return;

    let isMounted = true;

    let authSubscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          setVerificationSuccess(true);
          setTimeout(() => {
            if (!isMounted) return;
            onLoginSuccess(
              {
                name: pendingName || session.user.user_metadata?.full_name || 'Fidèle',
                email: session.user.email || pendingEmail,
                firstName: pendingFirstName || session.user.user_metadata?.first_name || 'Fidèle',
                lastName: pendingLastName || session.user.user_metadata?.last_name || '',
              },
              true
            );
          }, 800);
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      isMounted = false;
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, [isWaitingVerification, pendingEmail, pendingName, pendingFirstName, pendingLastName, onLoginSuccess]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const res = await resendVerificationEmail(pendingEmail, pendingName);
      if (res.signature) {
        setOtpSignature(res.signature);
      }
      setFeedback({
        type: 'success',
        message: `Un nouveau code de vérification à 6 chiffres a été envoyé à ${pendingEmail}.`,
      });
      setResendCooldown(60);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Impossible de renvoyer l’e-mail. Veuillez patienter.',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSimulateEmailVerification = async () => {
    const code = enteredOtpCode.trim();
    if (!code || code.length < 6) {
      setFeedback({
        type: 'error',
        message: 'Veuillez saisir le code de vérification à 6 chiffres reçu par e-mail.',
      });
      return;
    }

    if (generatedOtpCode && code === generatedOtpCode) {
      // Verified via Gmail OAuth direct send
    } else {
      const otpRes = await verifyEmailOtpCode(pendingEmail, code, otpSignature);
      if (!otpRes.verified) {
        setFeedback({
          type: 'error',
          message: 'Code de vérification invalide ou expiré. Vérifiez les 6 chiffres reçus dans votre boîte mail.',
        });
        return;
      }
    }

    setVerificationSuccess(true);
    await syncConnectedAccountToBackend({
      email: pendingEmail,
      fullName: pendingName || 'Fidèle',
      firstName: pendingFirstName || 'Fidèle',
      lastName: pendingLastName || '',
    });
    setTimeout(() => {
      onLoginSuccess(
        {
          name: pendingName || 'Fidèle',
          email: pendingEmail,
          firstName: pendingFirstName || 'Fidèle',
          lastName: pendingLastName || '',
        },
        true
      );
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        setFeedback({
          type: 'error',
          message: 'Veuillez saisir votre prénom et votre nom pour personnaliser votre espace.',
        });
        return;
      }
      if (!email.trim() || !password) {
        setFeedback({ type: 'error', message: 'Veuillez saisir une adresse email et un mot de passe.' });
        return;
      }
      if (password.length < 6) {
        setFeedback({ type: 'error', message: 'Le mot de passe doit comporter au moins 6 caractères.' });
        return;
      }

      setIsLoading(true);
      const cleanFirst = firstName.trim();
      const cleanLast = lastName.trim();
      const full = `${cleanFirst} ${cleanLast}`;
      const cleanEmail = email.trim().toLowerCase();

      try {
        const res = await signUpWithEmail(cleanEmail, password, full);

        if (res.error) {
          setFeedback({
            type: 'error',
            message: res.error.message || 'Erreur lors de la création du compte.',
          });
          setIsLoading(false);
          return;
        }

        // Send real 6-digit verification code via SMTP / Supabase
        const otpSend = await resendVerificationEmail(cleanEmail, full);
        if (otpSend.signature) {
          setOtpSignature(otpSend.signature);
        }

        setPendingEmail(cleanEmail);
        setPendingName(full);
        setPendingFirstName(cleanFirst);
        setPendingLastName(cleanLast);
        setIsWaitingVerification(true);
        setFeedback({
          type: 'success',
          message: `Un code de vérification à 6 chiffres a été envoyé à ${cleanEmail}.`,
        });
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err.message || 'Erreur inattendue lors de la connexion.',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !password) {
        setFeedback({ type: 'error', message: 'Veuillez saisir votre adresse email et votre mot de passe.' });
        return;
      }
      if (password.length < 6) {
        setFeedback({ type: 'error', message: 'Le mot de passe doit comporter au moins 6 caractères.' });
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await signInWithEmail(email, password);

        if (error) {
          setFeedback({
            type: 'error',
            message:
              error.message === 'Invalid login credentials'
                ? 'Identifiants incorrects. Vérifiez votre e-mail et mot de passe.'
                : error.message,
          });
          setIsLoading(false);
          return;
        }

        const meta = (data?.user?.user_metadata || {}) as Record<string, any>;
        const userFullName = meta.full_name || (email.trim() ? email.split('@')[0] : 'Fidèle');
        const userFirst = meta.first_name || userFullName.split(' ')[0] || userFullName;
        const userLast = meta.last_name || userFullName.split(' ').slice(1).join(' ') || '';

        await syncConnectedAccountToBackend({
          id: data?.user?.id,
          email: email.trim().toLowerCase(),
          fullName: userFullName,
          firstName: userFirst,
          lastName: userLast,
        });

        setFeedback({
          type: 'success',
          message: 'Connexion réussie ! Redirection vers votre sanctuaire...',
        });

        setTimeout(() => {
          onLoginSuccess(
            {
              name: userFullName,
              email: email.trim().toLowerCase(),
              firstName: userFirst,
              lastName: userLast,
            },
            false
          );
        }, 500);
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err.message || 'Erreur inattendue.',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSocialClick = async (provider: string) => {
    if (provider === 'Google') {
      setIsLoading(true);
      setFeedback({ type: 'success', message: 'Connexion avec votre compte Google en cours...' });
      try {
        const { data, error } = await signInWithGoogle();
        if (error) {
          setFeedback({ type: 'error', message: error.message });
          setIsLoading(false);
          return;
        }

        if (data && 'user' in data && data.user) {
          const meta = (data.user.user_metadata || {}) as Record<string, any>;
          const userFull = meta.full_name || data.user.email?.split('@')[0] || 'Modou Gaye';
          const userFirst = meta.first_name || userFull.split(' ')[0] || 'Modou';
          const userLast = meta.last_name || userFull.split(' ').slice(1).join(' ') || '';
          const userMail = data.user.email || 'modougaye58588@gmail.com';

          setTimeout(() => {
            onLoginSuccess(
              {
                name: userFull,
                email: userMail,
                firstName: userFirst,
                lastName: userLast,
                avatarUrl: meta.avatar_url,
              },
              false
            );
          }, 400);
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Erreur OAuth Google' });
      } finally {
        setIsLoading(false);
      }
    } else {
      const userFull =
        firstName.trim() && lastName.trim()
          ? `${firstName.trim()} ${lastName.trim()}`
          : firstName.trim() || (email.trim() ? email.split('@')[0] : 'Fidèle');
      const userMail = email.trim() || 'fidele@sanctuaire.app';
      await syncConnectedAccountToBackend({
        email: userMail,
        fullName: userFull,
        firstName: firstName.trim() || userFull.split(' ')[0] || 'Fidèle',
        lastName: lastName.trim() || '',
      });
      setFeedback({ type: 'success', message: `Connexion avec ${provider}... Préparation de votre sanctuaire.` });
      setTimeout(() => {
        onLoginSuccess(
          {
            name: userFull,
            email: userMail,
            firstName: firstName.trim() || userFull.split(' ')[0] || 'Fidèle',
            lastName: lastName.trim() || '',
          },
          false
        );
      }, 400);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-100 dark:bg-[#14261C] flex flex-col justify-center items-center p-3 sm:p-6 md:p-8 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-600 selection:text-white relative transition-colors duration-300">
      
      {/* Discreet floating top navigation */}
      <header className="w-full max-w-[960px] flex items-center justify-between pb-3 px-2">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-emerald-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-[#193226] hover:bg-neutral-100 dark:hover:bg-emerald-900/60 px-3.5 py-1.5 rounded-full border border-neutral-300 dark:border-emerald-500/30 shadow-xs transition-all cursor-pointer backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à l'accueil</span>
        </button>

        <span className="text-xs text-neutral-800 dark:text-emerald-200/80 font-bold tracking-tight">
          Le Sanctuaire
        </span>
      </header>

      {/* OUTER SLEEK FRAME */}
      <div className="w-full max-w-[960px] bg-white dark:bg-[#193226] p-2 sm:p-3 rounded-3xl sm:rounded-[44px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_90px_rgba(10,25,18,0.4)] border border-neutral-200 dark:border-emerald-500/25 relative transition-colors duration-300">
        
        {/* INNER 50/50 SPLIT CONTAINER */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 relative items-stretch">
          
          {/* ========================================================
              LEFT PANEL (VISUAL SIDE):
              Full-bleed photo of a Muslim man praying in sujud position on a prayer mat.
             ======================================================== */}
          <div className="relative rounded-2xl sm:rounded-[34px] overflow-hidden min-h-[160px] sm:min-h-[420px] lg:min-h-[600px] bg-[#14281E] flex flex-col justify-between p-3.5 sm:p-7 border border-neutral-200 dark:border-emerald-500/20">
            
            {/* Full-bleed photo of Muslim man praying in sujud */}
            <img
              src={sujudImage}
              alt="Muslim man praying in humble sujud on a prayer mat"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-[center_center] pointer-events-none select-none"
            />

            {/* Subtle atmospheric vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />

            <div /> {/* Spacer for top */}

            {/* DARK GLASSMORPHISM CARD AT BOTTOM LEFT: Leaf Logo + Updated text */}
            <div className="relative z-10 self-start">
              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-black/60 backdrop-blur-md border border-emerald-500/30 text-white shadow-2xl">
                {/* Minimalist leaf logo */}
                <div className="text-emerald-300 flex-shrink-0">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                </div>

                <div className="text-left leading-tight">
                  <div className="text-[11px] sm:text-[11.5px] font-medium text-white tracking-tight">
                    Focus on your spiritual flow.
                  </div>
                  <div className="text-[9.5px] sm:text-[10px] text-emerald-200/70 font-normal mt-0.5">
                    Build inner peace.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              CENTER CONNECTOR (Desktop only):
             ======================================================== */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-[6px] -translate-y-1/2 z-30 pointer-events-none items-center justify-start">
            <div className="relative flex items-center">
              {/* Smooth organic speech-bubble curved SVG notch matching the frame */}
              <svg
                width="72"
                height="136"
                viewBox="0 0 72 136"
                fill="none"
                className="text-white dark:text-[#193226] transition-colors"
              >
                <path
                  d="M 0 0 C 10 32, 34 54, 62 67 C 65 68, 65 70, 62 71 C 34 84, 10 106, 0 136 Z"
                  fill="currentColor"
                />
              </svg>

              {/* Center pagination dots nestled inside the speech notch */}
              <div className="absolute left-[16px] flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setActiveSlide(0)}
                  aria-label="Slide 1"
                  className={`transition-all rounded-full cursor-pointer ${
                    activeSlide === 0
                      ? 'w-5 h-2 bg-emerald-600 dark:bg-emerald-300 shadow-xs'
                      : 'w-2 h-2 bg-neutral-300 dark:bg-emerald-900 border border-neutral-400 dark:border-emerald-500/30 hover:bg-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setActiveSlide(1)}
                  aria-label="Slide 2"
                  className={`transition-all rounded-full cursor-pointer ${
                    activeSlide === 1
                      ? 'w-5 h-2 bg-emerald-600 dark:bg-emerald-300 shadow-xs'
                      : 'w-2 h-2 bg-neutral-300 dark:bg-emerald-900 border border-neutral-400 dark:border-emerald-500/30 hover:bg-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setActiveSlide(2)}
                  aria-label="Slide 3"
                  className={`transition-all rounded-full cursor-pointer ${
                    activeSlide === 2
                      ? 'w-5 h-2 bg-emerald-600 dark:bg-emerald-300 shadow-xs'
                      : 'w-2 h-2 bg-neutral-300 dark:bg-emerald-900 border border-neutral-400 dark:border-emerald-500/30 hover:bg-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT PANEL (FORM SIDE):
             ======================================================== */}
          <div className="relative rounded-2xl sm:rounded-[34px] overflow-hidden p-4 sm:p-10 flex flex-col justify-between bg-neutral-50/70 dark:bg-gradient-to-br dark:from-[#14281E] dark:to-[#193226] border border-neutral-200 dark:border-emerald-500/20 shadow-inner transition-colors duration-300">
            {/* Top right text: "Already have an account? Log In" */}
            <div className="flex items-center justify-end text-[11px] sm:text-xs text-neutral-600 dark:text-emerald-300/80">
              {isWaitingVerification ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsWaitingVerification(false);
                    setFeedback(null);
                  }}
                  className="font-semibold text-emerald-700 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Modifier mes informations</span>
                </button>
              ) : isSignUp ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setFeedback(null);
                    }}
                    className="font-bold text-emerald-700 dark:text-amber-300 hover:text-emerald-800 dark:hover:text-amber-200 hover:underline cursor-pointer ml-0.5"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setFeedback(null);
                    }}
                    className="font-bold text-emerald-700 dark:text-amber-300 hover:text-emerald-800 dark:hover:text-amber-200 hover:underline cursor-pointer ml-0.5"
                  >
                    Sign Up
                  </button>
                </p>
              )}
            </div>

            {/* Main Center Content Block */}
            <div className="w-full max-w-[340px] mx-auto my-auto py-2 space-y-4 sm:space-y-5">
              
              {isWaitingVerification ? (
                /* ========================================================
                    EMAIL VERIFICATION WAITING SCREEN (AUTO-CONNECT)
                   ======================================================== */
                <div className="space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
                  {/* Header Badge & Icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center relative shadow-xs shrink-0">
                      <MailCheck className="w-5 h-5" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Sécurité & Activation</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
                        Confirmez votre e-mail
                      </h2>
                    </div>
                  </div>

                  {/* Feedback message if any */}
                  {feedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        feedback.type === 'success'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {feedback.type === 'success' && (
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span>{feedback.message}</span>
                    </div>
                  )}

                  {/* Verification Instructions & OTP Code Entry Card */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#12231A] border border-neutral-200 dark:border-emerald-500/20 shadow-xs space-y-3">
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      Adresse e-mail en cours d'authentification :
                    </p>

                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200 truncate font-mono">
                          {pendingEmail}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrepareGmailVerification(pendingEmail, pendingName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10.5px] font-bold shrink-0 cursor-pointer transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Envoyer avec mon Gmail</span>
                      </button>
                    </div>

                    {/* 6-digit OTP verification code input */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[11px] font-semibold text-neutral-700 dark:text-emerald-200">
                        Code de vérification reçu par e-mail (6 chiffres) :
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Ex: 482910"
                        value={enteredOtpCode}
                        onChange={(e) => setEnteredOtpCode(e.target.value)}
                        className="w-full h-[42px] px-3.5 rounded-xl bg-neutral-50 dark:bg-[#0E1C14] border border-emerald-500/30 text-center font-mono text-base font-bold tracking-[0.35em] text-emerald-900 dark:text-amber-300 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Live Status Beacon */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100/90 dark:bg-[#152B20] border border-neutral-200/80 dark:border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      {verificationSuccess ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 animate-bounce" />
                      ) : (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                      )}
                      <span className="text-neutral-700 dark:text-neutral-200 font-medium">
                        {verificationSuccess
                          ? 'E-mail confirmé ! Connexion en cours...'
                          : 'Prêt pour validation par e-mail Gmail'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrepareGmailVerification(pendingEmail, pendingName)}
                      className="w-full h-[42px] px-4 rounded-[14px] bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer le code avec mon compte Gmail</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulateEmailVerification}
                      className="w-full h-[40px] px-4 rounded-[14px] bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-600/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Valider le code et accéder à mon espace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsWaitingVerification(false);
                        setFeedback(null);
                      }}
                      className="w-full py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Retour au formulaire</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Main Headline & Subtitle */}
                  <div className="space-y-1 sm:space-y-1.5 text-left">
                    <h1 className="text-2xl sm:text-[32px] font-bold text-neutral-900 dark:text-white tracking-[-0.02em] leading-tight">
                      {isSignUp ? 'Créer votre Compte' : 'Bienvenue au Sanctuaire'}
                    </h1>
                    <p className="text-[11px] sm:text-[12px] text-neutral-600 dark:text-emerald-200/70 font-normal leading-relaxed">
                      {isSignUp
                        ? 'Inscrivez-vous ou authentifiez-vous par e-mail.'
                        : 'Reconnectez-vous en un clic ou utilisez vos identifiants.'}
                    </p>
                  </div>

                  {/* ========================================================
                      ALREADY CONNECTED ACCOUNTS SECTION (Database & Local)
                     ======================================================== */}
                  {connectedAccounts.length > 0 && (
                    <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-[#112219] border border-emerald-200/80 dark:border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                          <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Comptes déjà connectés ({connectedAccounts.length})</span>
                        </div>
                        <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/70 font-medium">
                          Accès 1-clic
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-[148px] overflow-y-auto pr-0.5">
                        {connectedAccounts.map((acc) => (
                          <div
                            key={acc.email}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#172E22] border border-emerald-200/60 dark:border-emerald-600/25 hover:border-emerald-500/60 transition-all shadow-2xs"
                          >
                            <button
                              type="button"
                              onClick={() => handleQuickReconnect(acc)}
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-emerald-400/30 group-hover:scale-105 transition-transform">
                                {(acc.fullName || acc.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                  {acc.fullName}
                                </div>
                                <div className="text-[10.5px] text-neutral-500 dark:text-emerald-200/70 truncate font-mono">
                                  {acc.email}
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                title="Envoyer un code de vérification par e-mail avec mon Gmail"
                                onClick={() => {
                                  setPendingEmail(acc.email);
                                  setPendingName(acc.fullName);
                                  setPendingFirstName(acc.firstName);
                                  setPendingLastName(acc.lastName);
                                  setIsWaitingVerification(true);
                                  handlePrepareGmailVerification(acc.email, acc.fullName);
                                }}
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300/50 dark:border-amber-500/30 cursor-pointer transition-colors"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickReconnect(acc)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10.5px] font-bold cursor-pointer transition-colors"
                              >
                                Connecter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback banners */}
                  {feedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        feedback.type === 'success'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      {feedback.type === 'success' && (
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                      <span>{feedback.message}</span>
                    </div>
                  )}

              {/* Form with inputs */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* When Signing up: Prénom and Nom fields */}
                {isSignUp && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Prénom */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-emerald-400/80">
                        <User className="w-[17px] h-[17px] stroke-[1.5]" />
                      </div>
                      <input
                        type="text"
                        required={isSignUp}
                        placeholder="Prénom"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full h-[46px] pl-10 pr-3 rounded-[14px] bg-white dark:bg-[#12231A] hover:bg-neutral-50 dark:hover:bg-[#152B20] focus:bg-white dark:focus:bg-[#152B20] border border-neutral-300 dark:border-emerald-500/25 focus:border-emerald-600 dark:focus:border-emerald-400 text-xs sm:text-[13px] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-emerald-400/50 font-normal transition-all outline-none shadow-xs"
                      />
                    </div>

                    {/* Nom */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-emerald-400/80">
                        <User className="w-[17px] h-[17px] stroke-[1.5]" />
                      </div>
                      <input
                        type="text"
                        required={isSignUp}
                        placeholder="Nom"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full h-[46px] pl-10 pr-3 rounded-[14px] bg-white dark:bg-[#12231A] hover:bg-neutral-50 dark:hover:bg-[#152B20] focus:bg-white dark:focus:bg-[#152B20] border border-neutral-300 dark:border-emerald-500/25 focus:border-emerald-600 dark:focus:border-emerald-400 text-xs sm:text-[13px] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-emerald-400/50 font-normal transition-all outline-none shadow-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-emerald-400/80">
                    <Mail className="w-[17px] h-[17px] stroke-[1.5]" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[46px] pl-10 pr-4 rounded-[14px] bg-white dark:bg-[#12231A] hover:bg-neutral-50 dark:hover:bg-[#152B20] focus:bg-white dark:focus:bg-[#152B20] border border-neutral-300 dark:border-emerald-500/25 focus:border-emerald-600 dark:focus:border-emerald-400 text-xs sm:text-[13px] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-emerald-400/50 font-normal transition-all outline-none shadow-xs"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 dark:text-emerald-400/80">
                    <Lock className="w-[17px] h-[17px] stroke-[1.5]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[46px] pl-10 pr-11 rounded-[14px] bg-white dark:bg-[#12231A] hover:bg-neutral-50 dark:hover:bg-[#152B20] focus:bg-white dark:focus:bg-[#152B20] border border-neutral-300 dark:border-emerald-500/25 focus:border-emerald-600 dark:focus:border-emerald-400 text-xs sm:text-[13px] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-emerald-400/50 font-normal transition-all outline-none shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 dark:text-emerald-400/60 dark:hover:text-emerald-300 cursor-pointer"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-[17px] h-[17px] stroke-[1.5]" />
                    ) : (
                      <Eye className="w-[17px] h-[17px] stroke-[1.5]" />
                    )}
                  </button>
                </div>

                {/* Solid CTA button: "Sign Up" / "Log In" with right arrow */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[46px] px-5 rounded-[14px] bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-xs sm:text-[13px] shadow-sm transition-all border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer mt-1.5 group"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>{isSignUp ? "Création du compte..." : "Connexion en cours..."}</span>
                    </span>
                  ) : (
                    <>
                      <span>{isSignUp ? "Créer mon compte" : "Se connecter"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* Email authentication via User's Gmail Account button */}
                <button
                  type="button"
                  onClick={() => {
                    const targetMail = email.trim() || 'mgaye60000@gmail.com';
                    const targetFull =
                      firstName.trim() || lastName.trim()
                        ? `${firstName.trim()} ${lastName.trim()}`.trim()
                        : targetMail.split('@')[0] || 'Fidèle';
                    setPendingEmail(targetMail);
                    setPendingName(targetFull);
                    setPendingFirstName(firstName.trim() || targetFull.split(' ')[0] || 'Fidèle');
                    setPendingLastName(lastName.trim() || '');
                    setIsWaitingVerification(true);
                    handlePrepareGmailVerification(targetMail, targetFull);
                  }}
                  className="w-full h-[40px] px-4 rounded-[14px] bg-amber-50 dark:bg-amber-950/35 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-300/70 dark:border-amber-500/35 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Authentifier par e-mail (Envoyer avec mon Gmail)</span>
                </button>
              </form>

              {/* Divider: "or continue with" */}
              <div className="relative flex items-center justify-center pt-2 pb-1">
                <div className="border-t border-neutral-200 dark:border-emerald-800/40 w-full" />
                <span className="px-3 text-[11px] text-neutral-500 dark:text-emerald-400/70 font-normal whitespace-nowrap">
                  ou continuer avec
                </span>
                <div className="border-t border-neutral-200 dark:border-emerald-800/40 w-full" />
              </div>

              {/* Three Social Login Buttons: Google, Apple, Telegram */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialClick('Google')}
                  className="h-[40px] flex items-center justify-center gap-1.5 px-2 rounded-[14px] bg-white hover:bg-neutral-100 dark:bg-[#12231A] dark:hover:bg-[#152B20] border border-neutral-200 dark:border-emerald-500/25 text-neutral-800 dark:text-neutral-200 text-[11.5px] font-medium shadow-2xs transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
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
                  <span>Google</span>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => handleSocialClick('Apple')}
                  className="h-[40px] flex items-center justify-center gap-1.5 px-2 rounded-[14px] bg-white hover:bg-neutral-100 dark:bg-[#12231A] dark:hover:bg-[#152B20] border border-neutral-200 dark:border-emerald-500/25 text-neutral-800 dark:text-neutral-200 text-[11.5px] font-medium shadow-2xs transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-black dark:fill-white flex-shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12-14.43-6-9.15-10.79-19.49-14.38-31.03-3.59-11.53-5.38-22.65-5.38-33.34 0-14.07 3.51-26.06 10.53-35.96 7.02-9.9 15.82-14.96 26.4-15.18 5.12 0 10.82 1.43 17.11 4.29 6.29 2.85 10.37 4.35 12.24 4.49 1.54-.14 5.86-1.74 12.98-4.79 7.12-3.05 13.06-4.38 17.81-3.99 13.25.98 23.49 5.85 30.73 14.61-11.66 7.08-17.38 16.89-17.15 29.43.23 9.8 4.07 17.97 11.53 24.51 7.46 6.54 16.27 10.27 26.43 11.19-2.22 6.84-5.06 13.78-8.52 20.83zM119.22 33.56c0-7.3 2.66-14.18 7.99-20.65 5.33-6.47 11.96-10.77 19.89-12.91.46 3.15.53 5.42.21 6.81-.66 6.97-3.47 13.75-8.43 20.35-4.96 6.6-11.2 10.75-18.73 12.45-.48-2.07-.93-4.09-.93-6.05z" />
                  </svg>
                  <span>Apple</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => handleSocialClick('Telegram')}
                  className="h-[40px] flex items-center justify-center gap-1.5 px-2 rounded-[14px] bg-white hover:bg-neutral-100 dark:bg-[#12231A] dark:hover:bg-[#152B20] border border-neutral-200 dark:border-emerald-500/25 text-neutral-800 dark:text-neutral-200 text-[11.5px] font-medium shadow-2xs transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-[#2AABEE] flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.942z" />
                  </svg>
                  <span>Telegram</span>
                </button>
              </div>
            </>
          )}

        </div>

            {/* Footer terms text at the bottom */}
            <div className="text-center pt-3 pb-1">
              <p className="text-[10px] sm:text-[10.5px] text-neutral-500 dark:text-emerald-300/60 font-normal leading-relaxed">
                En créant un compte, vous acceptez nos<br />
                <span className="text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer font-medium">
                  Conditions d'utilisation
                </span>{' '}
                et notre{' '}
                <span className="text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer font-medium">
                  Politique de confidentialité
                </span>
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* ========================================================
          GMAIL SEND CONFIRMATION MODAL
         ======================================================== */}
      {gmailConfirmPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#14281E] border border-emerald-500/30 shadow-2xl p-6 space-y-4 text-neutral-900 dark:text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-emerald-800/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Confirmer l'envoi avec votre Gmail</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-emerald-300/75">
                    Authentification par e-mail via Google OAuth
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGmailConfirmPayload(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-emerald-900/50 text-neutral-500 dark:text-emerald-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-neutral-50 dark:bg-[#0F1F17] p-3.5 rounded-2xl border border-neutral-200 dark:border-emerald-800/40">
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500 dark:text-emerald-300/70">Expéditeur Gmail :</span>
                <span className="font-semibold font-mono text-emerald-700 dark:text-emerald-300">
                  mgaye60000@gmail.com
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500 dark:text-emerald-300/70">Destinataire :</span>
                <span className="font-semibold font-mono">{gmailConfirmPayload.to}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500 dark:text-emerald-300/70">Objet :</span>
                <span className="font-semibold">{gmailConfirmPayload.subject}</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 dark:border-emerald-800/40 flex items-center justify-between">
                <span className="text-neutral-500 dark:text-emerald-300/70">Code généré :</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-amber-300 font-mono font-bold tracking-widest text-sm">
                  {gmailConfirmPayload.otpCode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setGmailConfirmPayload(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-emerald-950/60 hover:bg-neutral-200 dark:hover:bg-emerald-900/60 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSendingGmail}
                onClick={handleConfirmSendGmail}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingGmail ? 'Envoi Gmail...' : 'Confirmer et Envoyer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
