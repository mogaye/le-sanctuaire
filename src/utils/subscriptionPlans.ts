export type SubscriptionPlanId = 'test' | 'basique' | 'pro' | 'max' | 'admin';

export type StudioQualityTier = '480p' | '720p' | '1080p' | '4k';

export const SUPER_ADMIN_EMAIL = 'mgaye60000@gmail.com';
export const SUPER_ADMIN_PASSWORD_HASH_INPUT = 'momo@lesanctuaire2026';

export interface VideoPlanSpec {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  priceFcfa: number;
  priceLabel: string;
  monthlyLimit: number; // Infinity for unlimited
  hasWatermark: boolean;
  maxVerses: number; // Infinity for unlimited
  allowCustomLogo: boolean;
  maxQuality: StudioQualityTier;
  badgeText?: string;
  features: string[];
}

export const VIDEO_PLANS: Record<SubscriptionPlanId, VideoPlanSpec> = {
  test: {
    id: 'test',
    name: 'Test',
    tagline: 'Découverte gratuite avec compte',
    priceFcfa: 0,
    priceLabel: 'Gratuit',
    monthlyLimit: 3,
    hasWatermark: true,
    maxVerses: 3,
    allowCustomLogo: false,
    maxQuality: '720p',
    features: [
      '3 vidéos maximum',
      'Maximum 3 versets de suite',
      'Qualité jusqu’à 720p HD',
      'Avec filigrane Le Sanctuaire',
      'Sans logo personnalisé',
    ],
  },
  basique: {
    id: 'basique',
    name: 'Basique',
    tagline: 'Pour créateurs réguliers',
    priceFcfa: 3000,
    priceLabel: '3 000 FCFA / mois',
    monthlyLimit: 30,
    hasWatermark: true,
    maxVerses: Number.POSITIVE_INFINITY,
    allowCustomLogo: true,
    maxQuality: '720p',
    features: [
      '30 vidéos par mois',
      'Versets illimités (sourates complètes)',
      'Qualité jusqu’à 720p HD',
      'Logo personnalisé autorisé',
      'Avec filigrane Le Sanctuaire',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Rendu professionnel sans filigrane',
    priceFcfa: 5000,
    priceLabel: '5 000 FCFA / mois',
    monthlyLimit: 60,
    hasWatermark: false,
    maxVerses: Number.POSITIVE_INFINITY,
    allowCustomLogo: true,
    maxQuality: '1080p',
    badgeText: 'Populaire',
    features: [
      '60 vidéos par mois',
      'Sans filigrane (sans watermark)',
      'Versets illimités',
      'Logo personnalisé autorisé',
      'Qualité Full HD 1080p',
    ],
  },
  max: {
    id: 'max',
    name: 'MAX',
    tagline: 'Puissance maximale 4K illimitée',
    priceFcfa: 10000,
    priceLabel: '10 000 FCFA / mois',
    monthlyLimit: Number.POSITIVE_INFINITY,
    hasWatermark: false,
    maxVerses: Number.POSITIVE_INFINITY,
    allowCustomLogo: true,
    maxQuality: '4k',
    badgeText: 'Illimité 4K',
    features: [
      'Vidéos illimitées / mois',
      'Sans filigrane (sans watermark)',
      'Versets illimités',
      'Logo personnalisé autorisé',
      'Ultra HD 4K (2160p)',
    ],
  },
  admin: {
    id: 'admin',
    name: 'Super Admin',
    tagline: 'Accès administrateur complet',
    priceFcfa: 0,
    priceLabel: 'Illimité (Admin)',
    monthlyLimit: Number.POSITIVE_INFINITY,
    hasWatermark: false,
    maxVerses: Number.POSITIVE_INFINITY,
    allowCustomLogo: true,
    maxQuality: '4k',
    badgeText: 'Admin',
    features: [
      'Création de vidéos gratuite et illimitée',
      'Sans filigrane',
      'Versets illimités',
      'Logo personnalisé autorisé',
      'Qualité jusqu’à 4K Ultra HD',
    ],
  },
};

export const PUBLIC_VIDEO_PLAN_ORDER: SubscriptionPlanId[] = ['test', 'basique', 'pro', 'max'];

const QUALITY_RANK: Record<StudioQualityTier, number> = {
  '480p': 1,
  '720p': 2,
  '1080p': 3,
  '4k': 4,
};

export function normalizePlanId(raw?: string | null): SubscriptionPlanId {
  const val = String(raw || '').trim().toLowerCase();
  if (val === 'basique' || val === 'pro' || val === 'max' || val === 'admin' || val === 'test') {
    return val;
  }
  return 'test';
}

export function isSuperAdminEmail(email?: string | null): boolean {
  return String(email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function getEffectivePlanId(email?: string | null, storedPlan?: string | null): SubscriptionPlanId {
  if (isSuperAdminEmail(email)) return 'admin';
  return normalizePlanId(storedPlan);
}

export function getPlanRules(planId?: string | null, email?: string | null): VideoPlanSpec {
  const effective = getEffectivePlanId(email, planId);
  return VIDEO_PLANS[effective] || VIDEO_PLANS.test;
}

export function getRemainingVideos(
  planId: SubscriptionPlanId,
  videosUsedThisMonth: number,
  email?: string | null
): number {
  const rules = getPlanRules(planId, email);
  if (!Number.isFinite(rules.monthlyLimit)) {
    return Number.POSITIVE_INFINITY;
  }
  const used = Math.max(0, Math.floor(Number(videosUsedThisMonth) || 0));
  return Math.max(0, rules.monthlyLimit - used);
}

export function isQualityAllowedForPlan(
  qualityId: StudioQualityTier,
  planId: SubscriptionPlanId,
  email?: string | null
): boolean {
  const rules = getPlanRules(planId, email);
  const targetRank = QUALITY_RANK[qualityId] || 1;
  const maxRank = QUALITY_RANK[rules.maxQuality] || 2;
  return targetRank <= maxRank;
}

export function clampQualityForPlan(
  qualityId: StudioQualityTier,
  planId: SubscriptionPlanId,
  email?: string | null
): StudioQualityTier {
  if (isQualityAllowedForPlan(qualityId, planId, email)) {
    return qualityId;
  }
  return getPlanRules(planId, email).maxQuality;
}

export interface VideoAccessCheckResult {
  allowed: boolean;
  reasonCode?: 'AUTH_REQUIRED' | 'QUOTA_EXHAUSTED' | 'VERSE_LIMIT_EXCEEDED' | 'QUALITY_LOCKED' | 'LOGO_LOCKED';
  message?: string;
  plan: VideoPlanSpec;
  remainingVideos: number;
}

export function evaluateVideoCreationAccess(params: {
  email?: string | null;
  planId?: string | null;
  videosUsedThisMonth: number;
  verseCount?: number;
  qualityId?: StudioQualityTier;
  hasCustomLogo?: boolean;
}): VideoAccessCheckResult {
  const cleanEmail = String(params.email || '').trim().toLowerCase();
  const plan = getPlanRules(params.planId, cleanEmail);
  const remaining = getRemainingVideos(plan.id, params.videosUsedThisMonth, cleanEmail);

  if (!cleanEmail) {
    return {
      allowed: false,
      reasonCode: 'AUTH_REQUIRED',
      message: 'Créez ou connectez votre compte pour créer une vidéo (3 vidéos d’essai offertes).',
      plan,
      remainingVideos: 0,
    };
  }

  if (remaining <= 0) {
    return {
      allowed: false,
      reasonCode: 'QUOTA_EXHAUSTED',
      message: `Votre quota mensuel de ${plan.monthlyLimit} vidéos (${plan.name}) est atteint. Passez au forfait supérieur pour continuer.`,
      plan,
      remainingVideos: 0,
    };
  }

  if (
    typeof params.verseCount === 'number' &&
    Number.isFinite(plan.maxVerses) &&
    params.verseCount > plan.maxVerses
  ) {
    return {
      allowed: false,
      reasonCode: 'VERSE_LIMIT_EXCEEDED',
      message: `Le forfait ${plan.name} est limité à ${plan.maxVerses} versets de suite maximum. Passez à Basique, Pro ou MAX pour des versets illimités.`,
      plan,
      remainingVideos: remaining,
    };
  }

  if (params.qualityId && !isQualityAllowedForPlan(params.qualityId, plan.id, cleanEmail)) {
    return {
      allowed: false,
      reasonCode: 'QUALITY_LOCKED',
      message: `La qualité ${params.qualityId.toUpperCase()} nécessite un forfait supérieur (max ${plan.maxQuality.toUpperCase()} pour ${plan.name}).`,
      plan,
      remainingVideos: remaining,
    };
  }

  if (params.hasCustomLogo && !plan.allowCustomLogo) {
    return {
      allowed: false,
      reasonCode: 'LOGO_LOCKED',
      message: `L’ajout de votre propre logo est disponible à partir du forfait Basique (3 000 FCFA/mois).`,
      plan,
      remainingVideos: remaining,
    };
  }

  return {
    allowed: true,
    plan,
    remainingVideos: remaining,
  };
}

export function enforceVerseRangeForPlan(
  startAyah: number,
  endAyah: number,
  surahTotalAyahs: number,
  planId: SubscriptionPlanId,
  email?: string | null,
  alreadySelectedOtherVerses = 0
): { startAyah: number; endAyah: number; wasCapped: boolean } {
  const safeMax = Math.max(1, Math.floor(surahTotalAyahs) || 1);
  const start = Math.min(safeMax, Math.max(1, Math.floor(startAyah) || 1));
  let end = Math.min(safeMax, Math.max(start, Math.floor(endAyah) || start));
  const rules = getPlanRules(planId, email);

  if (!Number.isFinite(rules.maxVerses)) {
    return { startAyah: start, endAyah: end, wasCapped: false };
  }

  const remainingVerseBudget = Math.max(1, rules.maxVerses - Math.max(0, alreadySelectedOtherVerses));
  const maxAllowedEnd = Math.min(safeMax, start + remainingVerseBudget - 1);
  if (end > maxAllowedEnd) {
    end = maxAllowedEnd;
    return { startAyah: start, endAyah: end, wasCapped: true };
  }
  return { startAyah: start, endAyah: end, wasCapped: false };
}

export function formatFcfa(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0 FCFA';
  return `${Math.round(amount).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} FCFA`;
}

export function formatDurationFrench(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  }
  if (mins > 0) {
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${secs}s`;
}
