import React, { useEffect, useState } from 'react';
import {
  Check,
  Crown,
  Lock,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Wallet,
  X,
  Loader2,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  SubscriptionStatusDTO,
  fetchMySubscription,
  upgradeMyVideoPlan,
} from '../lib/supabase';
import {
  PUBLIC_VIDEO_PLAN_ORDER,
  SubscriptionPlanId,
  VIDEO_PLANS,
  formatFcfa,
  isSuperAdminEmail,
} from '../utils/subscriptionPlans';

interface VideoPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  currentUser: UserProfile | null;
  subscriptionStatus: SubscriptionStatusDTO | null;
  onRequestAuth: () => void;
  onPlanActivated?: (nextStatus: SubscriptionStatusDTO) => void;
}

type PaymentMethod = 'wave' | 'orange_money' | 'paydunya';

export const VideoPlansModal: React.FC<VideoPlansModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  currentUser,
  subscriptionStatus,
  onRequestAuth,
  onPlanActivated,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wave');
  const [activatingPlan, setActivatingPlan] = useState<'basique' | 'pro' | 'max' | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [localStatus, setLocalStatus] = useState<SubscriptionStatusDTO | null>(subscriptionStatus);

  useEffect(() => {
    setLocalStatus(subscriptionStatus);
  }, [subscriptionStatus]);

  useEffect(() => {
    if (!isOpen || !currentUser?.email) return;
    let mounted = true;
    fetchMySubscription(currentUser.email)
      .then((fresh) => {
        if (mounted && fresh) {
          setLocalStatus(fresh);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [isOpen, currentUser?.email]);

  if (!isOpen) return null;

  const effectiveStatus = localStatus || subscriptionStatus;
  const isAdmin = isSuperAdminEmail(currentUser?.email);
  const currentPlanId: SubscriptionPlanId = isAdmin
    ? 'admin'
    : effectiveStatus?.plan || currentUser?.plan || 'test';
  const currentPlanSpec = VIDEO_PLANS[currentPlanId] || VIDEO_PLANS.test;

  const handleActivatePlan = async (planId: 'basique' | 'pro' | 'max') => {
    setStatusMessage(null);
    if (!currentUser?.email) {
      onClose();
      onRequestAuth();
      return;
    }
    setActivatingPlan(planId);
    try {
      const providerLabel =
        selectedMethod === 'wave'
          ? 'Wave'
          : selectedMethod === 'orange_money'
          ? 'Orange Money'
          : 'PayDunya';
      const result = await upgradeMyVideoPlan({
        email: currentUser.email,
        plan: planId,
        provider: providerLabel,
      });
      if (!result.ok || !result.status) {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Impossible d’activer ce forfait pour le moment.',
        });
        return;
      }
      onPlanActivated?.(result.status);
      setLocalStatus(result.status);
      setStatusMessage({
        type: 'success',
        text: `Forfait ${VIDEO_PLANS[planId].name} activé (${providerLabel}). Votre nouveau quota est disponible immédiatement.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Erreur lors de la mise à niveau.',
      });
    } finally {
      setActivatingPlan(null);
    }
  };

  return (
    <div
      data-testid="video-plans-modal"
      className="fixed inset-0 z-[10065] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden my-auto ${
          isDarkMode
            ? 'bg-[#0F1814] border-white/15 text-[#F2F5F3]'
            : 'bg-[#F8F6F1] border-[#D4D1C8] text-[#18221D]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between gap-4 px-5 sm:px-7 py-5 border-b ${
            isDarkMode ? 'border-white/10 bg-[#13201A]' : 'border-[#E2DFD7] bg-white'
          }`}
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B573E] dark:text-[#6EE7B7]">
              <Crown className="w-4 h-4" />
              <span>Forfaits Studio Vidéo Le Sanctuaire</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Créez des récitations coraniques à votre rythme
            </h2>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-white/70' : 'text-[#565C58]'}`}>
              Un compte est requis pour exporter. Chaque vidéo générée décompte automatiquement votre quota mensuel.
            </p>
          </div>

          <button
            type="button"
            data-testid="video-plans-close-btn"
            onClick={onClose}
            aria-label="Fermer les forfaits"
            className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${
              isDarkMode
                ? 'border-white/15 hover:bg-white/10 text-white'
                : 'border-[#D4D1C8] hover:bg-[#ECE9E1] text-[#18221D]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Super Admin / Current Account Status Banner */}
        <div className="px-5 sm:px-7 pt-4 space-y-3">
          {isAdmin ? (
            <div className="rounded-2xl px-4 py-3 bg-[#1B573E]/15 border border-[#1B573E]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#1B573E] dark:text-[#6EE7B7] shrink-0" />
                <div>
                  <div className="text-sm font-bold">Mode Super Administrateur actif</div>
                  <div className="text-xs opacity-80">
                    La création vidéo est gratuite, illimitée, en 4K et sans filigrane sur votre compte ({currentUser?.email}).
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#1B573E] text-white text-xs font-bold whitespace-nowrap">
                Illimité
              </span>
            </div>
          ) : (
            <div
              className={`rounded-2xl px-4 py-3 border flex flex-wrap items-center justify-between gap-3 ${
                isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-[#E2DFD7]'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                <Wallet className="w-4 h-4 text-[#1B573E] dark:text-[#6EE7B7] shrink-0" />
                {currentUser?.email ? (
                  <span>
                    Compte connecté : <strong>{currentUser.email}</strong> • Forfait actuel :{' '}
                    <strong className="text-[#1B573E] dark:text-[#6EE7B7]">
                      {currentPlanSpec.name}
                    </strong>{' '}
                    {!Number.isFinite(currentPlanSpec.monthlyLimit)
                      ? '(Illimité)'
                      : `(${
                          typeof effectiveStatus?.remainingVideos === 'number'
                            ? effectiveStatus.remainingVideos
                            : currentPlanSpec.monthlyLimit
                        }/${
                          typeof effectiveStatus?.monthlyLimit === 'number'
                            ? effectiveStatus.monthlyLimit
                            : currentPlanSpec.monthlyLimit
                        } vidéos restantes)`}
                  </span>
                ) : (
                  <span>
                    Non connecté — créez un compte gratuit pour obtenir <strong>3 vidéos d’essai</strong>.
                  </span>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="opacity-70 mr-1 hidden sm:inline">Paiement :</span>
                {(
                  [
                    { id: 'wave' as const, label: 'Wave' },
                    { id: 'orange_money' as const, label: 'Orange Money' },
                    { id: 'paydunya' as const, label: 'PayDunya' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`h-7 px-2.5 rounded-full font-semibold cursor-pointer transition-all whitespace-nowrap border ${
                      selectedMethod === m.id
                        ? 'bg-[#1B573E] text-white border-[#1B573E]'
                        : isDarkMode
                        ? 'border-white/15 text-white/75 hover:bg-white/10'
                        : 'border-[#D4D1C8] text-[#4F5551] hover:bg-[#ECE9E1]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {statusMessage && (
            <div
              data-testid="video-plans-status-msg"
              className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-500/15 border-red-500/35 text-red-800 dark:text-red-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* 4 Plan Cards */}
        <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PUBLIC_VIDEO_PLAN_ORDER.map((planId) => {
            const spec = VIDEO_PLANS[planId];
            const isCurrent = currentPlanId === planId;
            const isFeatured = planId === 'pro';
            const isPaid = planId === 'basique' || planId === 'pro' || planId === 'max';

            return (
              <div
                key={planId}
                data-testid={`video-plan-card-${planId}`}
                className={`rounded-2xl p-4 sm:p-5 border flex flex-col justify-between gap-4 transition-all ${
                  isFeatured
                    ? isDarkMode
                      ? 'bg-[#152B22] border-[#34D399]/50 shadow-lg'
                      : 'bg-white border-[#1B573E] shadow-lg'
                    : isDarkMode
                    ? 'bg-[#131E19] border-white/12'
                    : 'bg-white border-[#DEDAD0]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold">{spec.name}</span>
                    {spec.badgeText && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isFeatured
                            ? 'bg-[#1B573E] text-white'
                            : 'bg-[#D4A373]/20 text-[#9A6B2F] dark:text-[#F6D399]'
                        }`}
                      >
                        {spec.badgeText}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-2xl font-extrabold tabular-nums tracking-tight">
                      {spec.priceFcfa === 0 ? '0 FCFA' : formatFcfa(spec.priceFcfa)}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-white/60' : 'text-[#565C58]'}`}>
                      {spec.priceFcfa === 0 ? 'Essai avec compte' : 'par mois'} • {spec.tagline}
                    </div>
                  </div>

                  {/* Concrete Limits Spec Rows */}
                  <ul className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10 text-xs">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span className="font-semibold tabular-nums">
                        {Number.isFinite(spec.monthlyLimit)
                          ? `${spec.monthlyLimit} vidéos${spec.id === 'test' ? ' max' : ' / mois'}`
                          : 'Vidéos illimitées'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      {spec.hasWatermark ? (
                        <Sparkles className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      )}
                      <span>
                        {spec.hasWatermark ? 'Avec filigrane Le Sanctuaire' : 'Sans filigrane'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>
                        {Number.isFinite(spec.maxVerses)
                          ? `Max ${spec.maxVerses} versets de suite`
                          : 'Versets illimités'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      {spec.allowCustomLogo ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-[#9B3431] shrink-0 mt-0.5" />
                      )}
                      <span className={!spec.allowCustomLogo ? 'opacity-70' : ''}>
                        {spec.allowCustomLogo ? 'Logo personnalisé autorisé' : 'Logo personnalisé bloqué'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-[#1B573E] dark:text-[#6EE7B7] shrink-0 mt-0.5" />
                      <span className="tabular-nums">Qualité max : {spec.maxQuality.toUpperCase()}</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  {isAdmin ? (
                    <div className="h-10 rounded-full border border-[#1B573E]/30 bg-[#1B573E]/10 text-[#1B573E] dark:text-[#6EE7B7] text-xs font-bold flex items-center justify-center">
                      Inclus dans Admin
                    </div>
                  ) : isCurrent ? (
                    <div className="h-10 rounded-full border border-[#1B573E]/40 bg-[#1B573E]/10 text-[#1B573E] dark:text-[#6EE7B7] text-xs font-bold flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Forfait actuel</span>
                    </div>
                  ) : !isPaid ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser?.email) {
                          onClose();
                          onRequestAuth();
                        } else {
                          onClose();
                        }
                      }}
                      className={`w-full h-10 rounded-full border text-xs font-bold cursor-pointer transition-colors ${
                        isDarkMode
                          ? 'border-white/15 hover:bg-white/10'
                          : 'border-[#D4D1C8] hover:bg-[#ECE9E1]'
                      }`}
                    >
                      {currentUser?.email ? 'Compte actif' : 'Créer un compte'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`activate-plan-${planId}-btn`}
                      disabled={activatingPlan !== null}
                      onClick={() => handleActivatePlan(planId)}
                      className={`w-full h-10 rounded-full text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                        isFeatured
                          ? 'bg-[#1B573E] hover:bg-[#154631] text-white shadow-md'
                          : isDarkMode
                          ? 'bg-[#D4A373] hover:bg-[#C69261] text-[#111915]'
                          : 'bg-[#18221D] hover:bg-[#2A3A32] text-white'
                      }`}
                    >
                      {activatingPlan === planId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      <span>
                        {!currentUser?.email
                          ? 'Se connecter'
                          : `Activer ${spec.name}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
