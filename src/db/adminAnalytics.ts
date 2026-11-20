import fs from 'fs';
import path from 'path';
import { db } from './index.ts';
import {
  profiles,
  donations,
  videoCreations,
  userReports,
  siteAnalyticsDaily,
} from './schema.ts';
import { eq, desc, ilike } from 'drizzle-orm';
import {
  SubscriptionPlanId,
  StudioQualityTier,
  VIDEO_PLANS,
  evaluateVideoCreationAccess,
  getEffectivePlanId,
  getPlanRules,
  getRemainingVideos,
  isSuperAdminEmail,
  normalizePlanId,
} from '../utils/subscriptionPlans.ts';
import { getAllConnectedProfiles, upsertConnectedProfile } from './users.ts';

function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.SQL_HOST ||
      process.env.DATABASE_URL ||
      process.env.PGHOST
  );
}

const STORE_PATH = path.join(process.cwd(), '.sanctuaire-analytics-store.json');

export interface ManagedUserStats {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  cityName: string;
  role: 'admin' | 'user';
  plan: SubscriptionPlanId;
  videosUsedThisMonth: number;
  totalVideosCreated: number;
  remainingVideos: number | null; // null represents Infinity in JSON
  monthlyLimit: number | null; // null represents Infinity in JSON
  totalAmountPaidFcfa: number;
  timeSpentSeconds: number;
  planPeriodStart: string;
  planUpdatedAt: string;
  lastConnectedAt: string;
  createdAt: string;
}

export interface VideoCreationRecord {
  id: string;
  userEmail: string;
  userName: string;
  planAtCreation: SubscriptionPlanId;
  surahSummary: string;
  verseCount: number;
  quality: StudioQualityTier;
  aspectRatio: string;
  hadWatermark: boolean;
  durationSec: number;
  createdAt: string;
}

export interface UserReportRecord {
  id: string;
  reporterEmail: string;
  reporterName: string;
  category: 'bug' | 'audio' | 'horaires' | 'paiement' | 'autre';
  subject: string;
  description: string;
  pageContext: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyAnalyticsPoint {
  date: string; // YYYY-MM-DD
  label: string;
  visits: number;
  signups: number;
  paidUpgrades: number;
  videosCreated: number;
}

interface PersistedAnalyticsStore {
  users: Record<string, ManagedUserStats>;
  videos: VideoCreationRecord[];
  reports: UserReportRecord[];
  daily: Record<string, { visits: number; signups: number; paidUpgrades: number; videosCreated: number }>;
  knownVisitSessions: string[];
}

function getTodayDateKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function formatShortDayLabel(dateStr: string): string {
  try {
    const [, m, day] = dateStr.split('-');
    return `${day}/${m}`;
  } catch {
    return dateStr;
  }
}

function createEmptyStore(): PersistedAnalyticsStore {
  const today = getTodayDateKey();
  return {
    users: {
      'mgaye60000@gmail.com': {
        id: 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4',
        email: 'mgaye60000@gmail.com',
        fullName: 'Mamadou Gaye',
        firstName: 'Mamadou',
        lastName: 'Gaye',
        cityName: 'Dakar',
        role: 'admin',
        plan: 'admin',
        videosUsedThisMonth: 0,
        totalVideosCreated: 0,
        remainingVideos: null,
        monthlyLimit: null,
        totalAmountPaidFcfa: 0,
        timeSpentSeconds: 0,
        planPeriodStart: new Date().toISOString(),
        planUpdatedAt: new Date().toISOString(),
        lastConnectedAt: new Date().toISOString(),
        createdAt: '2026-09-17T23:01:43.333Z',
      },
    },
    videos: [],
    reports: [],
    daily: {
      [today]: { visits: 0, signups: 0, paidUpgrades: 0, videosCreated: 0 },
    },
    knownVisitSessions: [],
  };
}

let storeCache: PersistedAnalyticsStore | null = null;

function loadStore(): PersistedAnalyticsStore {
  if (storeCache) return storeCache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        storeCache = {
          users: parsed.users || {},
          videos: Array.isArray(parsed.videos) ? parsed.videos : [],
          reports: Array.isArray(parsed.reports) ? parsed.reports : [],
          daily: parsed.daily || {},
          knownVisitSessions: Array.isArray(parsed.knownVisitSessions)
            ? parsed.knownVisitSessions.slice(-500)
            : [],
        };
        if (!storeCache.users['mgaye60000@gmail.com']) {
          storeCache.users['mgaye60000@gmail.com'] = createEmptyStore().users['mgaye60000@gmail.com'];
        }
        return storeCache;
      }
    }
  } catch {
    // ignore read error
  }
  storeCache = createEmptyStore();
  return storeCache;
}

function persistStore() {
  if (!storeCache) return;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(storeCache, null, 2), 'utf-8');
  } catch {
    // non-fatal
  }
}

// Active visitors in real-time (sessionId -> lastSeen & current page & email)
interface ActiveVisitorSession {
  sessionId: string;
  email?: string;
  view: string;
  lastSeenMs: number;
}

const activeVisitors = new Map<string, ActiveVisitorSession>();
const VISITOR_TTL_MS = 45_000;

export function pruneActiveVisitors(now = Date.now()): ActiveVisitorSession[] {
  for (const [sid, session] of activeVisitors.entries()) {
    if (now - session.lastSeenMs > VISITOR_TTL_MS) {
      activeVisitors.delete(sid);
    }
  }
  return Array.from(activeVisitors.values());
}

function serializeUserWithRules(u: ManagedUserStats): ManagedUserStats {
  const effectivePlan = getEffectivePlanId(u.email, u.plan);
  const rules = getPlanRules(effectivePlan, u.email);
  const rem = getRemainingVideos(effectivePlan, u.videosUsedThisMonth, u.email);
  return {
    ...u,
    role: isSuperAdminEmail(u.email) ? 'admin' : 'user',
    plan: effectivePlan,
    remainingVideos: Number.isFinite(rem) ? rem : null,
    monthlyLimit: Number.isFinite(rules.monthlyLimit) ? rules.monthlyLimit : null,
  };
}

function ensureDailyBucket(store: PersistedAnalyticsStore, dateKey = getTodayDateKey()) {
  if (!store.daily[dateKey]) {
    store.daily[dateKey] = { visits: 0, signups: 0, paidUpgrades: 0, videosCreated: 0 };
  }
  return store.daily[dateKey];
}

function maybeResetMonthlyPeriod(user: ManagedUserStats): boolean {
  if (user.plan === 'test' || user.plan === 'admin') return false;
  const periodStart = user.planPeriodStart ? new Date(user.planPeriodStart).getTime() : 0;
  if (!periodStart || Number.isNaN(periodStart)) return false;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - periodStart >= thirtyDaysMs) {
    user.videosUsedThisMonth = 0;
    user.planPeriodStart = new Date().toISOString();
    return true;
  }
  return false;
}

export async function syncAnalyticsProfileOnConnect(data: {
  id?: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  cityName?: string;
}): Promise<ManagedUserStats> {
  const cleanEmail = data.email.trim().toLowerCase();
  const store = loadStore();
  const existing = store.users[cleanEmail];
  const isNew = !existing;
  const nowIso = new Date().toISOString();

  const resolvedFull = data.fullName || existing?.fullName || cleanEmail.split('@')[0] || 'Fidèle';
  const resolvedFirst = data.firstName || existing?.firstName || resolvedFull.split(' ')[0] || 'Fidèle';
  const resolvedLast = data.lastName || existing?.lastName || '';
  const role: 'admin' | 'user' = isSuperAdminEmail(cleanEmail) ? 'admin' : 'user';
  const plan: SubscriptionPlanId = role === 'admin' ? 'admin' : normalizePlanId(existing?.plan || 'test');

  const updated: ManagedUserStats = {
    id:
      existing?.id ||
      data.id ||
      (role === 'admin' ? 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4' : `acct_${cleanEmail}`),
    email: cleanEmail,
    fullName: resolvedFull,
    firstName: resolvedFirst,
    lastName: resolvedLast,
    cityName: data.cityName || existing?.cityName || 'Dakar',
    role,
    plan,
    videosUsedThisMonth: existing?.videosUsedThisMonth || 0,
    totalVideosCreated: existing?.totalVideosCreated || 0,
    remainingVideos: null,
    monthlyLimit: null,
    totalAmountPaidFcfa: existing?.totalAmountPaidFcfa || 0,
    timeSpentSeconds: existing?.timeSpentSeconds || 0,
    planPeriodStart: existing?.planPeriodStart || nowIso,
    planUpdatedAt: existing?.planUpdatedAt || nowIso,
    lastConnectedAt: nowIso,
    createdAt: existing?.createdAt || nowIso,
  };

  maybeResetMonthlyPeriod(updated);
  store.users[cleanEmail] = serializeUserWithRules(updated);

  if (isNew) {
    const bucket = ensureDailyBucket(store);
    bucket.signups += 1;
    if (hasDatabaseConfig()) {
      await incrementDailyDbCounter('signups', 1);
    }
  }

  persistStore();
  return store.users[cleanEmail];
}

async function incrementDailyDbCounter(
  field: 'visits' | 'signups' | 'paidUpgrades' | 'videosCreated',
  delta = 1
) {
  if (!hasDatabaseConfig()) return;
  const today = getTodayDateKey();
  try {
    const rows = await db
      .select()
      .from(siteAnalyticsDaily)
      .where(eq(siteAnalyticsDaily.date, today));
    if (rows.length > 0) {
      const curr = rows[0];
      await db
        .update(siteAnalyticsDaily)
        .set({
          [field]: (curr[field] || 0) + delta,
          updatedAt: new Date(),
        })
        .where(eq(siteAnalyticsDaily.date, today));
    } else {
      await db.insert(siteAnalyticsDaily).values({
        date: today,
        visits: field === 'visits' ? delta : 0,
        signups: field === 'signups' ? delta : 0,
        paidUpgrades: field === 'paidUpgrades' ? delta : 0,
        videosCreated: field === 'videosCreated' ? delta : 0,
      });
    }
  } catch {
    // non-fatal
  }
}

export async function recordVisitorHeartbeat(params: {
  sessionId: string;
  email?: string;
  view?: string;
  deltaSec?: number;
  isNewVisit?: boolean;
}): Promise<{ activeVisitors: number }> {
  const now = Date.now();
  const sid = String(params.sessionId || '').trim().slice(0, 80) || `anon_${now}`;
  const cleanEmail = params.email ? String(params.email).trim().toLowerCase() : undefined;
  const view = String(params.view || 'accueil').slice(0, 40);
  const deltaSec = Math.min(30, Math.max(0, Math.floor(Number(params.deltaSec) || 0)));

  const wasActive = activeVisitors.has(sid);
  activeVisitors.set(sid, {
    sessionId: sid,
    email: cleanEmail,
    view,
    lastSeenMs: now,
  });

  const store = loadStore();
  const sessionDayKey = `${getTodayDateKey()}_${sid}`;
  if (params.isNewVisit || (!wasActive && !store.knownVisitSessions.includes(sessionDayKey))) {
    const bucket = ensureDailyBucket(store);
    bucket.visits += 1;
    store.knownVisitSessions.push(sessionDayKey);
    if (store.knownVisitSessions.length > 500) {
      store.knownVisitSessions = store.knownVisitSessions.slice(-400);
    }
    await incrementDailyDbCounter('visits', 1);
  }

  if (cleanEmail && cleanEmail.includes('@') && deltaSec > 0) {
    if (!store.users[cleanEmail]) {
      await syncAnalyticsProfileOnConnect({ email: cleanEmail });
    }
    const user = store.users[cleanEmail];
    if (user) {
      user.timeSpentSeconds = (user.timeSpentSeconds || 0) + deltaSec;
      user.lastConnectedAt = new Date().toISOString();
      if (hasDatabaseConfig()) {
        try {
          await db
            .update(profiles)
            .set({
              timeSpentSeconds: user.timeSpentSeconds,
              lastConnectedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(ilike(profiles.email, cleanEmail));
        } catch {
          // non-fatal
        }
      }
    }
  }

  persistStore();
  const active = pruneActiveVisitors(now);
  return { activeVisitors: active.length };
}

export async function getUserSubscriptionStatus(email?: string | null): Promise<{
  authenticated: boolean;
  email: string | null;
  role: 'admin' | 'user';
  plan: SubscriptionPlanId;
  planName: string;
  priceFcfa: number;
  monthlyLimit: number | null;
  videosUsedThisMonth: number;
  totalVideosCreated: number;
  remainingVideos: number | null;
  hasWatermark: boolean;
  maxVerses: number | null;
  allowCustomLogo: boolean;
  maxQuality: StudioQualityTier;
  totalAmountPaidFcfa: number;
  timeSpentSeconds: number;
}> {
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

  const store = loadStore();
  let user = store.users[cleanEmail];

  // Hydrate from PostgreSQL if present and newer
  if (hasDatabaseConfig()) {
    try {
      const dbRows = await db
        .select()
        .from(profiles)
        .where(ilike(profiles.email, cleanEmail));
      if (dbRows[0]) {
        const r = dbRows[0];
        user = {
          id: r.id,
          email: cleanEmail,
          fullName: r.fullName || user?.fullName || cleanEmail.split('@')[0],
          firstName: r.firstName || user?.firstName || 'Fidèle',
          lastName: r.lastName || user?.lastName || '',
          cityName: r.cityName || user?.cityName || 'Dakar',
          role: isSuperAdminEmail(cleanEmail) ? 'admin' : 'user',
          plan: getEffectivePlanId(cleanEmail, r.plan || user?.plan),
          videosUsedThisMonth: Math.max(Number(r.videosUsedThisMonth) || 0, user?.videosUsedThisMonth || 0),
          totalVideosCreated: Math.max(Number(r.totalVideosCreated) || 0, user?.totalVideosCreated || 0),
          remainingVideos: null,
          monthlyLimit: null,
          totalAmountPaidFcfa: Math.max(Number(r.totalAmountPaidFcfa) || 0, user?.totalAmountPaidFcfa || 0),
          timeSpentSeconds: Math.max(Number(r.timeSpentSeconds) || 0, user?.timeSpentSeconds || 0),
          planPeriodStart: r.planPeriodStart ? r.planPeriodStart.toISOString() : new Date().toISOString(),
          planUpdatedAt: r.planUpdatedAt ? r.planUpdatedAt.toISOString() : new Date().toISOString(),
          lastConnectedAt: r.lastConnectedAt ? r.lastConnectedAt.toISOString() : new Date().toISOString(),
          createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      // non-fatal
    }
  }

  if (!user) {
    user = await syncAnalyticsProfileOnConnect({ email: cleanEmail });
  } else {
    if (maybeResetMonthlyPeriod(user)) {
      persistStore();
    }
    user = serializeUserWithRules(user);
    store.users[cleanEmail] = user;
  }

  const rules = getPlanRules(user.plan, cleanEmail);
  const rem = getRemainingVideos(rules.id, user.videosUsedThisMonth, cleanEmail);

  return {
    authenticated: true,
    email: cleanEmail,
    role: user.role,
    plan: rules.id,
    planName: rules.name,
    priceFcfa: rules.priceFcfa,
    monthlyLimit: Number.isFinite(rules.monthlyLimit) ? rules.monthlyLimit : null,
    videosUsedThisMonth: user.videosUsedThisMonth,
    totalVideosCreated: user.totalVideosCreated,
    remainingVideos: Number.isFinite(rem) ? rem : null,
    hasWatermark: rules.hasWatermark,
    maxVerses: Number.isFinite(rules.maxVerses) ? rules.maxVerses : null,
    allowCustomLogo: rules.allowCustomLogo,
    maxQuality: rules.maxQuality,
    totalAmountPaidFcfa: user.totalAmountPaidFcfa,
    timeSpentSeconds: user.timeSpentSeconds,
  };
}

export async function recordCreatedVideoForUser(params: {
  email: string;
  userName?: string;
  surahSummary: string;
  verseCount: number;
  quality: StudioQualityTier;
  aspectRatio: string;
  hasCustomLogo?: boolean;
  durationSec?: number;
}) {
  const cleanEmail = String(params.email || '').trim().toLowerCase();
  const status = await getUserSubscriptionStatus(cleanEmail);

  const check = evaluateVideoCreationAccess({
    email: status.email,
    planId: status.plan,
    videosUsedThisMonth: status.videosUsedThisMonth,
    verseCount: params.verseCount,
    qualityId: params.quality,
    hasCustomLogo: params.hasCustomLogo,
  });

  if (!check.allowed) {
    return {
      ok: false,
      error: check.message || 'Création vidéo non autorisée pour ce forfait.',
      reasonCode: check.reasonCode,
      status,
    };
  }

  const store = loadStore();
  const user = store.users[cleanEmail];
  user.videosUsedThisMonth = (user.videosUsedThisMonth || 0) + 1;
  user.totalVideosCreated = (user.totalVideosCreated || 0) + 1;
  user.lastConnectedAt = new Date().toISOString();
  store.users[cleanEmail] = serializeUserWithRules(user);

  const record: VideoCreationRecord = {
    id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userEmail: cleanEmail,
    userName: params.userName || user.fullName || cleanEmail.split('@')[0],
    planAtCreation: status.plan,
    surahSummary: String(params.surahSummary || 'Saint Coran').slice(0, 140),
    verseCount: Math.max(1, Math.floor(Number(params.verseCount) || 1)),
    quality: params.quality || '720p',
    aspectRatio: params.aspectRatio || '9:16',
    hadWatermark: check.plan.hasWatermark,
    durationSec: Math.max(0, Math.floor(Number(params.durationSec) || 0)),
    createdAt: new Date().toISOString(),
  };

  store.videos.unshift(record);
  if (store.videos.length > 500) {
    store.videos = store.videos.slice(0, 500);
  }

  const bucket = ensureDailyBucket(store);
  bucket.videosCreated += 1;

  if (hasDatabaseConfig()) {
    try {
      await db.insert(videoCreations).values({
        userEmail: record.userEmail,
        userName: record.userName,
        planAtCreation: record.planAtCreation,
        surahSummary: record.surahSummary,
        verseCount: record.verseCount,
        quality: record.quality,
        aspectRatio: record.aspectRatio,
        hadWatermark: record.hadWatermark,
        durationSec: record.durationSec,
      });
      await db
        .update(profiles)
        .set({
          videosUsedThisMonth: user.videosUsedThisMonth,
          totalVideosCreated: user.totalVideosCreated,
          lastConnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(ilike(profiles.email, cleanEmail));
      await incrementDailyDbCounter('videosCreated', 1);
    } catch {
      // non-fatal
    }
  }

  persistStore();
  const nextStatus = await getUserSubscriptionStatus(cleanEmail);
  return { ok: true, record, status: nextStatus };
}

export async function setUserPlanForAccount(params: {
  targetEmail: string;
  newPlan: SubscriptionPlanId;
  addPaymentFcfa?: number;
  resetMonthlyQuota?: boolean;
}) {
  const cleanEmail = String(params.targetEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('E-mail utilisateur invalide.');
  }

  const store = loadStore();
  if (!store.users[cleanEmail]) {
    await syncAnalyticsProfileOnConnect({ email: cleanEmail });
    try {
      await upsertConnectedProfile({
        id: `acct_${cleanEmail}`,
        email: cleanEmail,
      });
    } catch {
      // ignore
    }
  }

  const user = store.users[cleanEmail];
  const resolvedPlan = isSuperAdminEmail(cleanEmail) ? 'admin' : normalizePlanId(params.newPlan);
  const previousPlan = user.plan;
  const nowIso = new Date().toISOString();

  user.plan = resolvedPlan;
  user.role = isSuperAdminEmail(cleanEmail) ? 'admin' : 'user';
  user.planUpdatedAt = nowIso;

  if (params.resetMonthlyQuota !== false && previousPlan !== resolvedPlan) {
    user.videosUsedThisMonth = 0;
    user.planPeriodStart = nowIso;
  }

  const paymentToAdd = Number(params.addPaymentFcfa);
  if (!Number.isNaN(paymentToAdd) && paymentToAdd > 0) {
    user.totalAmountPaidFcfa = (user.totalAmountPaidFcfa || 0) + paymentToAdd;
  }

  const isPaidPlan = resolvedPlan === 'basique' || resolvedPlan === 'pro' || resolvedPlan === 'max';
  if (isPaidPlan && previousPlan !== resolvedPlan) {
    const bucket = ensureDailyBucket(store);
    bucket.paidUpgrades += 1;
    await incrementDailyDbCounter('paidUpgrades', 1);
  }

  store.users[cleanEmail] = serializeUserWithRules(user);

  if (hasDatabaseConfig()) {
    try {
      await db
        .update(profiles)
        .set({
          plan: resolvedPlan,
          role: user.role,
          videosUsedThisMonth: user.videosUsedThisMonth,
          totalAmountPaidFcfa: String(user.totalAmountPaidFcfa),
          planPeriodStart: new Date(user.planPeriodStart),
          planUpdatedAt: new Date(user.planUpdatedAt),
          updatedAt: new Date(),
        })
        .where(ilike(profiles.email, cleanEmail));
    } catch {
      // non-fatal
    }
  }

  persistStore();
  return store.users[cleanEmail];
}

export async function createUserReport(params: {
  reporterEmail?: string;
  reporterName?: string;
  category: UserReportRecord['category'];
  subject: string;
  description: string;
  pageContext?: string;
}): Promise<UserReportRecord> {
  const store = loadStore();
  const nowIso = new Date().toISOString();
  const report: UserReportRecord = {
    id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    reporterEmail: String(params.reporterEmail || 'visiteur@sanctuaire.app').trim().toLowerCase(),
    reporterName: String(params.reporterName || 'Visiteur').trim(),
    category: params.category || 'bug',
    subject: String(params.subject || 'Signalement utilisateur').trim().slice(0, 140),
    description: String(params.description || '').trim().slice(0, 2000),
    pageContext: String(params.pageContext || 'accueil').trim().slice(0, 60),
    status: 'open',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  store.reports.unshift(report);
  if (hasDatabaseConfig()) {
    try {
      const inserted = await db
        .insert(userReports)
        .values({
          reporterEmail: report.reporterEmail,
          reporterName: report.reporterName,
          category: report.category,
          subject: report.subject,
          description: report.description,
          pageContext: report.pageContext,
          status: 'open',
        })
        .returning();
      if (inserted[0]?.id) {
        report.id = String(inserted[0].id);
      }
    } catch {
      // non-fatal
    }
  }

  persistStore();
  return report;
}

export async function listUserReports(): Promise<UserReportRecord[]> {
  const store = loadStore();
  if (hasDatabaseConfig()) {
    try {
      const rows = await db.select().from(userReports).orderBy(desc(userReports.createdAt));
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: String(r.id),
          reporterEmail: r.reporterEmail || 'visiteur@sanctuaire.app',
          reporterName: r.reporterName || 'Visiteur',
          category: (r.category as any) || 'bug',
          subject: r.subject,
          description: r.description,
          pageContext: r.pageContext || 'accueil',
          status: (r.status as any) || 'open',
          adminNote: r.adminNote || undefined,
          createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
        }));
      }
    } catch {
      // non-fatal
    }
  }
  return [...store.reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateUserReportStatus(
  id: string,
  status: UserReportRecord['status'],
  adminNote?: string
): Promise<UserReportRecord | null> {
  const store = loadStore();
  const idx = store.reports.findIndex((r) => r.id === id);
  const nowIso = new Date().toISOString();
  if (idx >= 0) {
    store.reports[idx] = {
      ...store.reports[idx],
      status,
      ...(adminNote !== undefined ? { adminNote } : {}),
      updatedAt: nowIso,
    };
  }

  if (hasDatabaseConfig()) {
    try {
      const numId = Number(id);
      if (Number.isFinite(numId)) {
        await db
          .update(userReports)
          .set({
            status,
            ...(adminNote !== undefined ? { adminNote } : {}),
            updatedAt: new Date(),
          })
          .where(eq(userReports.id, numId));
      }
    } catch {
      // non-fatal
    }
  }

  persistStore();
  return idx >= 0 ? store.reports[idx] : null;
}

export async function mergeExternalProfilesIntoAnalytics(externalProfiles: any[]): Promise<ManagedUserStats[]> {
  const store = loadStore();
  let changed = false;

  // Also include profiles from getAllConnectedProfiles()
  let dbProfiles: any[] = [];
  try {
    dbProfiles = await getAllConnectedProfiles();
  } catch {
    dbProfiles = [];
  }

  const combined = [...(externalProfiles || []), ...(dbProfiles || [])];

  for (const row of combined) {
    const cleanEmail = String(row?.email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) continue;

    const existing = store.users[cleanEmail];
    const rowPlan = row.plan ? normalizePlanId(row.plan) : undefined;
    const resolvedPlan = isSuperAdminEmail(cleanEmail)
      ? 'admin'
      : rowPlan && rowPlan !== 'test'
        ? rowPlan
        : existing?.plan || rowPlan || 'test';

    const merged: ManagedUserStats = {
      id: String(row.id || row.uid || existing?.id || `acct_${cleanEmail}`),
      email: cleanEmail,
      fullName: row.full_name || row.fullName || existing?.fullName || cleanEmail.split('@')[0],
      firstName: row.first_name || row.firstName || existing?.firstName || cleanEmail.split('@')[0],
      lastName: row.last_name || row.lastName || existing?.lastName || '',
      cityName: row.city_name || row.cityName || existing?.cityName || 'Dakar',
      role: isSuperAdminEmail(cleanEmail) ? 'admin' : 'user',
      plan: resolvedPlan,
      videosUsedThisMonth: Math.max(
        Number(row.videos_used_this_month ?? row.videosUsedThisMonth ?? 0) || 0,
        existing?.videosUsedThisMonth || 0
      ),
      totalVideosCreated: Math.max(
        Number(row.total_videos_created ?? row.totalVideosCreated ?? 0) || 0,
        existing?.totalVideosCreated || 0
      ),
      remainingVideos: null,
      monthlyLimit: null,
      totalAmountPaidFcfa: Math.max(
        Number(row.total_amount_paid_fcfa ?? row.totalAmountPaidFcfa ?? 0) || 0,
        existing?.totalAmountPaidFcfa || 0
      ),
      timeSpentSeconds: Math.max(
        Number(row.time_spent_seconds ?? row.timeSpentSeconds ?? 0) || 0,
        existing?.timeSpentSeconds || 0
      ),
      planPeriodStart:
        row.plan_period_start || row.planPeriodStart || existing?.planPeriodStart || new Date().toISOString(),
      planUpdatedAt:
        row.plan_updated_at || row.planUpdatedAt || existing?.planUpdatedAt || new Date().toISOString(),
      lastConnectedAt:
        row.last_connected_at || row.lastConnectedAt || existing?.lastConnectedAt || new Date().toISOString(),
      createdAt: row.created_at || row.createdAt || existing?.createdAt || new Date().toISOString(),
    };

    const serialized = serializeUserWithRules(merged);
    if (!existing) changed = true;
    store.users[cleanEmail] = serialized;
  }

  // Also include donation totals if available in local PG
  if (hasDatabaseConfig()) {
    try {
      const donationRows = await db.select().from(donations);
      const paidByEmail = new Map<string, number>();
      for (const d of donationRows) {
        if (d.status === 'failed' || !d.donorEmail) continue;
        const em = d.donorEmail.trim().toLowerCase();
        paidByEmail.set(em, (paidByEmail.get(em) || 0) + (Number(d.amount) || 0));
      }
      for (const [em, amt] of paidByEmail.entries()) {
        if (store.users[em] && amt > store.users[em].totalAmountPaidFcfa) {
          store.users[em].totalAmountPaidFcfa = amt;
          changed = true;
        }
      }
    } catch {
      // non-fatal
    }
  }

  if (changed) persistStore();

  return Object.values(store.users)
    .map(serializeUserWithRules)
    .sort((a, b) => new Date(b.lastConnectedAt).getTime() - new Date(a.lastConnectedAt).getTime());
}

export async function buildAdminOverviewPayload(params: {
  externalProfiles?: any[];
  externalVideos?: any[];
  externalReports?: any[];
  externalDaily?: any[];
}) {
  const users = await mergeExternalProfilesIntoAnalytics(params.externalProfiles || []);
  const store = loadStore();
  const activeSessions = pruneActiveVisitors();
  const reports = await listUserReports();

  // Merge external videos if any
  const videoMap = new Map<string, VideoCreationRecord>();
  for (const v of store.videos) videoMap.set(v.id, v);
  if (Array.isArray(params.externalVideos)) {
    for (const v of params.externalVideos) {
      const id = String(v.id || `ext_${v.created_at || Math.random()}`);
      if (!videoMap.has(id)) {
        videoMap.set(id, {
          id,
          userEmail: String(v.user_email || v.userEmail || ''),
          userName: String(v.user_name || v.userName || ''),
          planAtCreation: normalizePlanId(v.plan_at_creation || v.planAtCreation),
          surahSummary: String(v.surah_summary || v.surahSummary || 'Saint Coran'),
          verseCount: Number(v.verse_count ?? v.verseCount ?? 1),
          quality: (v.quality as StudioQualityTier) || '720p',
          aspectRatio: String(v.aspect_ratio || v.aspectRatio || '9:16'),
          hadWatermark: Boolean(v.had_watermark ?? v.hadWatermark ?? true),
          durationSec: Number(v.duration_sec ?? v.durationSec ?? 0),
          createdAt: String(v.created_at || v.createdAt || new Date().toISOString()),
        });
      }
    }
  }
  const allVideos = Array.from(videoMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Build 14-day evolution chart series (ending today)
  const dailySeries: DailyAnalyticsPoint[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getTodayDateKey(d);
    const mem = store.daily[key] || { visits: 0, signups: 0, paidUpgrades: 0, videosCreated: 0 };
    const ext = Array.isArray(params.externalDaily)
      ? params.externalDaily.find((r) => r.date === key)
      : null;

    // Count real users created on that date if daily signups wasn't incremented externally
    const signupsOnDate = users.filter((u) => String(u.createdAt || '').slice(0, 10) === key).length;
    const videosOnDate = allVideos.filter((v) => String(v.createdAt || '').slice(0, 10) === key).length;

    dailySeries.push({
      date: key,
      label: formatShortDayLabel(key),
      visits: Math.max(mem.visits || 0, Number(ext?.visits || 0)),
      signups: Math.max(mem.signups || 0, Number(ext?.signups || 0), signupsOnDate),
      paidUpgrades: Math.max(mem.paidUpgrades || 0, Number(ext?.paid_upgrades || 0)),
      videosCreated: Math.max(mem.videosCreated || 0, Number(ext?.videos_created || 0), videosOnDate),
    });
  }

  const paidAccounts = users.filter((u) => u.plan === 'basique' || u.plan === 'pro' || u.plan === 'max');
  const totalVideosFromUsers = users.reduce((acc, u) => acc + (u.totalVideosCreated || 0), 0);
  const totalVideosCreated = Math.max(allVideos.length, totalVideosFromUsers);
  const totalRevenueFcfa = users.reduce((acc, u) => acc + (u.totalAmountPaidFcfa || 0), 0);
  const totalTimeSpentSeconds = users.reduce((acc, u) => acc + (u.timeSpentSeconds || 0), 0);
  const avgTimeSpentSeconds = users.length > 0 ? Math.round(totalTimeSpentSeconds / users.length) : 0;

  // Top 3 Video Creators
  const topCreators = [...users]
    .sort((a, b) => (b.totalVideosCreated || 0) - (a.totalVideosCreated || 0))
    .slice(0, 3);

  // Top 3 Highest Paying Accounts
  const topPayers = [...users]
    .sort((a, b) => {
      const diff = (b.totalAmountPaidFcfa || 0) - (a.totalAmountPaidFcfa || 0);
      if (diff !== 0) return diff;
      return (VIDEO_PLANS[b.plan]?.priceFcfa || 0) - (VIDEO_PLANS[a.plan]?.priceFcfa || 0);
    })
    .slice(0, 3);

  // Plan distribution & Quality distribution
  const planDistribution = {
    test: users.filter((u) => u.plan === 'test').length,
    basique: users.filter((u) => u.plan === 'basique').length,
    pro: users.filter((u) => u.plan === 'pro').length,
    max: users.filter((u) => u.plan === 'max').length,
    admin: users.filter((u) => u.plan === 'admin').length,
  };

  const qualityBreakdown = {
    '480p': allVideos.filter((v) => v.quality === '480p').length,
    '720p': allVideos.filter((v) => v.quality === '720p').length,
    '1080p': allVideos.filter((v) => v.quality === '1080p').length,
    '4k': allVideos.filter((v) => v.quality === '4k').length,
  };

  const openReportsCount = reports.filter((r) => r.status !== 'resolved').length;

  return {
    kpis: {
      realTimeVisitors: Math.max(1, activeSessions.length),
      registeredAccounts: users.length,
      paidAccounts: paidAccounts.length,
      totalVideosCreated,
      openReports: openReportsCount,
      totalReports: reports.length,
      totalRevenueFcfa,
      avgTimeSpentSeconds,
      totalTimeSpentSeconds,
    },
    charts: {
      dailySeries,
    },
    leaderboards: {
      topCreators,
      topPayers,
    },
    statistics: {
      planDistribution,
      qualityBreakdown,
      recentVideos: allVideos.slice(0, 20),
      activeSessionsCount: activeSessions.length,
    },
    reports,
    usersCount: users.length,
  };
}
