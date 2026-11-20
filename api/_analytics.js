import {
  getSupabaseCreds,
  supabaseSelect,
  supabaseUpsert,
  supabasePatch,
  upsertUserAndProfileInSupabase,
} from './_supabase.js';

export const SUPER_ADMIN_EMAIL = 'mgaye60000@gmail.com';

export const VIDEO_PLANS = {
  test: {
    id: 'test',
    name: 'Test',
    priceFcfa: 0,
    monthlyLimit: 3,
    hasWatermark: true,
    maxVerses: 3,
    allowCustomLogo: false,
    maxQuality: '720p',
  },
  basique: {
    id: 'basique',
    name: 'Basique',
    priceFcfa: 3000,
    monthlyLimit: 30,
    hasWatermark: true,
    maxVerses: Number.POSITIVE_INFINITY,
    allowCustomLogo: true,
    maxQuality: '720p',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceFcfa: 5000,
    monthlyLimit: 60,
    hasWatermark: false,
    maxVerses: Number.POSITIVE_INFINITY,
    allowCustomLogo: true,
    maxQuality: '1080p',
  },
  max: {
    id: 'max',
    name: 'MAX',
    priceFcfa: 10000,
    monthlyLimit: Number.POSITIVE_INFINITY,
    hasWatermark: false,
    maxVerses: Number.POSITIVE_INFINITY,
    allowCustomLogo: true,
    maxQuality: '4k',
  },
  admin: {
    id: 'admin',
    name: 'Super Admin',
    priceFcfa: 0,
    monthlyLimit: Number.POSITIVE_INFINITY,
    hasWatermark: false,
    maxVerses: Number.POSITIVE_INFINITY,
    allowCustomLogo: true,
    maxQuality: '4k',
  },
};

const QUALITY_RANK = {
  '480p': 1,
  '720p': 2,
  '1080p': 3,
  '4k': 4,
};

export function isSuperAdminEmail(email) {
  return String(email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function normalizePlanId(raw) {
  const val = String(raw || '').trim().toLowerCase();
  if (val === 'basique' || val === 'pro' || val === 'max' || val === 'admin' || val === 'test') {
    return val;
  }
  return 'test';
}

export function getEffectivePlanId(email, storedPlan) {
  if (isSuperAdminEmail(email)) return 'admin';
  return normalizePlanId(storedPlan);
}

export function getPlanRules(planId, email) {
  const effective = getEffectivePlanId(email, planId);
  return VIDEO_PLANS[effective] || VIDEO_PLANS.test;
}

export function getRemainingVideos(planId, videosUsedThisMonth, email) {
  const rules = getPlanRules(planId, email);
  if (!Number.isFinite(rules.monthlyLimit)) {
    return Number.POSITIVE_INFINITY;
  }
  const used = Math.max(0, Math.floor(Number(videosUsedThisMonth) || 0));
  return Math.max(0, rules.monthlyLimit - used);
}

export function evaluateVideoCreationAccess({
  email,
  planId,
  videosUsedThisMonth,
  verseCount,
  qualityId,
  hasCustomLogo,
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const plan = getPlanRules(planId, cleanEmail);
  const remaining = getRemainingVideos(plan.id, videosUsedThisMonth, cleanEmail);

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
    typeof verseCount === 'number' &&
    Number.isFinite(plan.maxVerses) &&
    verseCount > plan.maxVerses
  ) {
    return {
      allowed: false,
      reasonCode: 'VERSE_LIMIT_EXCEEDED',
      message: `Le forfait ${plan.name} est limité à ${plan.maxVerses} versets de suite maximum. Passez à Basique, Pro ou MAX pour des versets illimités.`,
      plan,
      remainingVideos: remaining,
    };
  }

  if (qualityId) {
    const targetRank = QUALITY_RANK[String(qualityId).toLowerCase()] || 1;
    const maxRank = QUALITY_RANK[plan.maxQuality] || 2;
    if (targetRank > maxRank) {
      return {
        allowed: false,
        reasonCode: 'QUALITY_LOCKED',
        message: `La qualité ${String(qualityId).toUpperCase()} nécessite un forfait supérieur (max ${plan.maxQuality.toUpperCase()} pour ${plan.name}).`,
        plan,
        remainingVideos: remaining,
      };
    }
  }

  if (hasCustomLogo && !plan.allowCustomLogo) {
    return {
      allowed: false,
      reasonCode: 'LOGO_LOCKED',
      message: 'L’ajout de votre propre logo est disponible à partir du forfait Basique (3 000 FCFA/mois).',
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

export function getTodayDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function formatShortDayLabel(dateStr) {
  try {
    const [, m, day] = String(dateStr).split('-');
    return `${day}/${m}`;
  } catch {
    return String(dateStr);
  }
}

export function buildStatusDTO({
  email,
  plan,
  videosUsedThisMonth = 0,
  totalVideosCreated = 0,
  totalAmountPaidFcfa = 0,
  timeSpentSeconds = 0,
}) {
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  if (!cleanEmail || !cleanEmail.includes('@')) {
    const testRules = VIDEO_PLANS.test;
    return {
      authenticated: false,
      email: null,
      role: 'user',
      plan: 'test',
      planName: testRules.name,
      priceFcfa: testRules.priceFcfa,
      monthlyLimit: testRules.monthlyLimit,
      videosUsedThisMonth: 0,
      totalVideosCreated: 0,
      remainingVideos: 0,
      hasWatermark: true,
      maxVerses: testRules.maxVerses,
      allowCustomLogo: false,
      maxQuality: testRules.maxQuality,
      totalAmountPaidFcfa: 0,
      timeSpentSeconds: 0,
    };
  }

  const rules = getPlanRules(plan, cleanEmail);
  const rem = getRemainingVideos(rules.id, videosUsedThisMonth, cleanEmail);

  return {
    authenticated: true,
    email: cleanEmail,
    role: isSuperAdminEmail(cleanEmail) ? 'admin' : 'user',
    plan: rules.id,
    planName: rules.name,
    priceFcfa: rules.priceFcfa,
    monthlyLimit: Number.isFinite(rules.monthlyLimit) ? rules.monthlyLimit : null,
    videosUsedThisMonth: Math.max(0, Number(videosUsedThisMonth) || 0),
    totalVideosCreated: Math.max(0, Number(totalVideosCreated) || 0),
    remainingVideos: Number.isFinite(rem) ? rem : null,
    hasWatermark: rules.hasWatermark,
    maxVerses: Number.isFinite(rules.maxVerses) ? rules.maxVerses : null,
    allowCustomLogo: rules.allowCustomLogo,
    maxQuality: rules.maxQuality,
    totalAmountPaidFcfa: Math.max(0, Number(totalAmountPaidFcfa) || 0),
    timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0),
  };
}

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export async function loadSubStateMapFromEmailLogs() {
  const rows = await supabaseSelect(
    'email_logs',
    'email_type=eq.sub_state&order=created_at.desc&limit=500'
  );
  const map = new Map();
  for (const r of rows) {
    const email = String(r.sender_email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) continue;
    const meta = safeJsonParse(r.subject, null);
    if (!meta || typeof meta !== 'object') continue;
    if (!map.has(email)) {
      map.set(email, meta);
    }
  }
  return map;
}

export async function persistSubStateToProfileAndFallback(cleanEmail, state) {
  const creds = getSupabaseCreds();
  if (!creds) return;

  const existing = await supabaseSelect(
    'profiles',
    `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
  );

  const fullPatch = {
    email: cleanEmail,
    plan: state.plan,
    role: state.role,
    videos_used_this_month: state.videosUsedThisMonth,
    total_videos_created: state.totalVideosCreated,
    total_amount_paid_fcfa: state.totalAmountPaidFcfa,
    time_spent_seconds: state.timeSpentSeconds,
    plan_period_start: state.planPeriodStart || new Date().toISOString(),
    plan_updated_at: state.planUpdatedAt || new Date().toISOString(),
    last_connected_at: state.lastConnectedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let patchedProfile = false;
  if (existing.length > 0) {
    const res = await supabasePatch(
      'profiles',
      `email=ilike.${encodeURIComponent(cleanEmail)}`,
      fullPatch
    );
    patchedProfile = Boolean(res.ok);
  } else {
    await upsertUserAndProfileInSupabase({
      id: state.id || `acct_${cleanEmail}`,
      email: cleanEmail,
      fullName: state.fullName || cleanEmail.split('@')[0],
      cityName: state.cityName || 'Dakar',
    });
    const res = await supabasePatch(
      'profiles',
      `email=ilike.${encodeURIComponent(cleanEmail)}`,
      fullPatch
    );
    patchedProfile = Boolean(res.ok);
  }

  // Always maintain resilient sub_state record in email_logs if profiles schema hasn't migrated yet (or as sync backup)
  const existingSubLogs = await supabaseSelect(
    'email_logs',
    `email_type=eq.sub_state&sender_email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
  );
  const metaJson = JSON.stringify({
    plan: state.plan,
    role: state.role,
    videosUsedThisMonth: state.videosUsedThisMonth,
    totalVideosCreated: state.totalVideosCreated,
    totalAmountPaidFcfa: state.totalAmountPaidFcfa,
    timeSpentSeconds: state.timeSpentSeconds,
    planPeriodStart: state.planPeriodStart || new Date().toISOString(),
    planUpdatedAt: state.planUpdatedAt || new Date().toISOString(),
    lastConnectedAt: state.lastConnectedAt || new Date().toISOString(),
  });

  if (existingSubLogs.length > 0 && existingSubLogs[0]?.id) {
    const patchLogRes = await supabasePatch('email_logs', `id=eq.${existingSubLogs[0].id}`, {
      subject: metaJson,
      body_preview: `plan=${state.plan} videos=${state.totalVideosCreated}`,
      status: patchedProfile ? 'synced' : 'fallback',
    });
    if (!patchLogRes.ok) {
      await supabaseUpsert('email_logs', {
        sender_email: cleanEmail,
        recipient_email: 'subscription_state',
        subject: metaJson,
        body_preview: `plan=${state.plan} videos=${state.totalVideosCreated}`,
        email_type: 'sub_state',
        status: patchedProfile ? 'synced' : 'fallback',
      });
    }
  } else {
    await supabaseUpsert('email_logs', {
      sender_email: cleanEmail,
      recipient_email: 'subscription_state',
      subject: metaJson,
      body_preview: `plan=${state.plan} videos=${state.totalVideosCreated}`,
      email_type: 'sub_state',
      status: patchedProfile ? 'synced' : 'fallback',
    });
  }
}

export async function resolveUserState(cleanEmail) {
  const [profRows, userRows, subLogs, videoRows, videoLogRows, donationRows] = await Promise.all([
    supabaseSelect('profiles', `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`),
    supabaseSelect('users', `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`),
    supabaseSelect(
      'email_logs',
      `email_type=eq.sub_state&sender_email=ilike.${encodeURIComponent(cleanEmail)}&order=created_at.desc&limit=1`
    ),
    supabaseSelect('video_creations', `user_email=ilike.${encodeURIComponent(cleanEmail)}&limit=500`),
    supabaseSelect(
      'email_logs',
      `email_type=eq.video_creation&sender_email=ilike.${encodeURIComponent(cleanEmail)}&limit=500`
    ),
    supabaseSelect('donations', `donor_email=ilike.${encodeURIComponent(cleanEmail)}&status=neq.failed&limit=200`),
  ]);

  const prof = profRows[0] || {};
  const usr = userRows[0] || {};
  const subMeta = subLogs[0]?.subject ? safeJsonParse(subLogs[0].subject, {}) || {} : {};

  // Determine plan (latest/paid wins between profile & sub_state)
  const profPlan = prof.plan ? normalizePlanId(prof.plan) : null;
  const metaPlan = subMeta.plan ? normalizePlanId(subMeta.plan) : null;

  let chosenPlan = 'test';
  if (isSuperAdminEmail(cleanEmail)) {
    chosenPlan = 'admin';
  } else if (prof.plan_updated_at && subMeta.planUpdatedAt) {
    chosenPlan =
      new Date(subMeta.planUpdatedAt).getTime() >= new Date(prof.plan_updated_at).getTime()
        ? metaPlan || profPlan || 'test'
        : profPlan || metaPlan || 'test';
  } else if (
    (metaPlan === 'basique' || metaPlan === 'pro' || metaPlan === 'max') &&
    (!profPlan || profPlan === 'test') &&
    !prof.plan_updated_at
  ) {
    chosenPlan = metaPlan;
  } else {
    chosenPlan = profPlan || metaPlan || 'test';
  }

  const countedVideos = Math.max(
    Array.isArray(videoRows) ? videoRows.length : 0,
    Array.isArray(videoLogRows) ? videoLogRows.length : 0
  );

  let videosUsedThisMonth = Math.max(
    Number(prof.videos_used_this_month) || 0,
    Number(subMeta.videosUsedThisMonth) || 0
  );
  const totalVideosCreated = Math.max(
    Number(prof.total_videos_created) || 0,
    Number(subMeta.totalVideosCreated) || 0,
    countedVideos
  );

  // Reset monthly counter if 30 days elapsed on paid plans
  let planPeriodStart = prof.plan_period_start || subMeta.planPeriodStart || new Date().toISOString();
  if (chosenPlan === 'basique' || chosenPlan === 'pro' || chosenPlan === 'max') {
    const startMs = new Date(planPeriodStart).getTime();
    if (startMs && !Number.isNaN(startMs) && Date.now() - startMs >= 30 * 24 * 60 * 60 * 1000) {
      videosUsedThisMonth = 0;
      planPeriodStart = new Date().toISOString();
    }
  }

  const donationsSum = (donationRows || []).reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0
  );
  const totalAmountPaidFcfa = Math.max(
    Number(prof.total_amount_paid_fcfa) || 0,
    Number(subMeta.totalAmountPaidFcfa) || 0,
    donationsSum
  );

  const timeSpentSeconds = Math.max(
    Number(prof.time_spent_seconds) || 0,
    Number(subMeta.timeSpentSeconds) || 0
  );

  const fullName =
    prof.full_name || usr.full_name || cleanEmail.split('@')[0] || 'Fidèle';
  const firstName = prof.first_name || usr.first_name || fullName.split(' ')[0] || 'Fidèle';
  const lastName = prof.last_name || usr.last_name || '';

  return {
    id: prof.id || usr.uid || `acct_${cleanEmail}`,
    email: cleanEmail,
    fullName,
    firstName,
    lastName,
    cityName: prof.city_name || usr.city_name || 'Dakar',
    role: isSuperAdminEmail(cleanEmail) ? 'admin' : 'user',
    plan: getEffectivePlanId(cleanEmail, chosenPlan),
    videosUsedThisMonth,
    totalVideosCreated,
    totalAmountPaidFcfa,
    timeSpentSeconds,
    planPeriodStart,
    planUpdatedAt: prof.plan_updated_at || subMeta.planUpdatedAt || new Date().toISOString(),
    lastConnectedAt: prof.last_connected_at || subMeta.lastConnectedAt || new Date().toISOString(),
    createdAt: prof.created_at || usr.created_at || new Date().toISOString(),
  };
}

export async function incrementDailyAnalytics(field, delta = 1) {
  const today = getTodayDateKey();
  const existing = await supabaseSelect('site_analytics_daily', `date=eq.${encodeURIComponent(today)}&limit=1`);
  const snakeField =
    field === 'paidUpgrades'
      ? 'paid_upgrades'
      : field === 'videosCreated'
      ? 'videos_created'
      : field;

  if (existing.length > 0) {
    const curr = existing[0];
    const patchRes = await supabasePatch('site_analytics_daily', `date=eq.${encodeURIComponent(today)}`, {
      [snakeField]: (Number(curr[snakeField]) || 0) + delta,
      updated_at: new Date().toISOString(),
    });
    if (patchRes.ok) return;
  } else {
    const insRes = await supabaseUpsert(
      'site_analytics_daily',
      {
        date: today,
        visits: field === 'visits' ? delta : 0,
        signups: field === 'signups' ? delta : 0,
        paid_upgrades: field === 'paidUpgrades' ? delta : 0,
        videos_created: field === 'videosCreated' ? delta : 0,
        updated_at: new Date().toISOString(),
      },
      'date'
    );
    if (insRes.ok) return;
  }

  // Fallback into email_logs if site_analytics_daily table not yet created
  const logRows = await supabaseSelect(
    'email_logs',
    `email_type=eq.daily_stat&sender_email=eq.${encodeURIComponent(today)}&limit=1`
  );
  if (logRows.length > 0) {
    const prev = safeJsonParse(logRows[0].subject, {}) || {};
    const next = {
      visits: Number(prev.visits) || 0,
      signups: Number(prev.signups) || 0,
      paidUpgrades: Number(prev.paidUpgrades) || 0,
      videosCreated: Number(prev.videosCreated) || 0,
    };
    next[field] = (next[field] || 0) + delta;
    await supabasePatch('email_logs', `id=eq.${logRows[0].id}`, {
      subject: JSON.stringify(next),
    });
  } else {
    const next = { visits: 0, signups: 0, paidUpgrades: 0, videosCreated: 0 };
    next[field] = delta;
    await supabaseUpsert('email_logs', {
      sender_email: today,
      recipient_email: 'site_analytics_daily',
      subject: JSON.stringify(next),
      body_preview: today,
      email_type: 'daily_stat',
      status: 'recorded',
    });
  }
}
