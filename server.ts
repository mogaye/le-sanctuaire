import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  upsertConnectedProfile,
  getAllConnectedProfiles,
  getPrayerLogFromDb,
  getAllPrayerLogsForUserFromDb,
  upsertPrayerLogInDb,
  upsertFullPrayerLogInDb,
  getUserSyncStateFromDb,
  saveUserSyncStateInDb,
  insertDonationInDb,
  checkDonorStatusInDb,
  logSentEmailInDb,
  getSentEmailsFromDb,
  insertDonorReviewInDb,
  getDonorReviewsFromDb,
  type DonorReviewRecord,
} from './src/db/users.ts';
import {
  syncAnalyticsProfileOnConnect,
  recordVisitorHeartbeat,
  getUserSubscriptionStatus,
  recordCreatedVideoForUser,
  setUserPlanForAccount,
  createUserReport,
  listUserReports,
  updateUserReportStatus,
  mergeExternalProfilesIntoAnalytics,
  buildAdminOverviewPayload,
} from './src/db/adminAnalytics.ts';
import {
  VIDEO_PLANS,
  isSuperAdminEmail,
  normalizePlanId,
  type StudioQualityTier,
} from './src/utils/subscriptionPlans.ts';

dotenv.config();

const recentThankYouEmails = new Map<string, number>();
const memoryReviewsCache: DonorReviewRecord[] = [];

export interface SyncedPrayerDay {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  updatedAt: number;
}

export interface SyncedSettingEntry {
  value: any;
  updatedAt: number;
}

export interface UserCloudSyncState {
  prayers: Record<string, SyncedPrayerDay>;
  settings: Record<string, SyncedSettingEntry>;
  lastUpdatedAt: number;
}

const memoryUserSyncCache = new Map<string, UserCloudSyncState>();
const syncLocks = new Map<string, Promise<any>>();
let lastServerSyncTs = 0;

function getNextServerSyncTime(): number {
  const now = Date.now();
  lastServerSyncTs = Math.max(now, lastServerSyncTs + 1);
  return lastServerSyncTs;
}

async function withSyncLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = syncLocks.get(key) || Promise.resolve();
  let release!: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  syncLocks.set(key, prev.then(() => nextLock));
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

async function getSyncAliasesAsync(rawEmail: string): Promise<string[]> {
  const clean = rawEmail.trim().toLowerCase() || 'visiteur_anonyme';
  return [clean];
}

function getCanonicalSyncEmail(rawEmail: string): string {
  const clean = rawEmail.trim().toLowerCase();
  return clean || 'visiteur_anonyme';
}

async function loadMergedUserSyncState(rawEmail: string): Promise<UserCloudSyncState> {
  const canonicalEmail = getCanonicalSyncEmail(rawEmail);
  const aliases = await getSyncAliasesAsync(rawEmail);
  const cached = memoryUserSyncCache.get(canonicalEmail);

  const mergedPrayers: Record<string, SyncedPrayerDay> = {};
  const mergedSettings: Record<string, SyncedSettingEntry> = {};

  for (const alias of aliases) {
    const dbPrayerRows = await getAllPrayerLogsForUserFromDb(alias);
    for (const row of dbPrayerRows) {
      const rowTime = row.updatedAt ? new Date(row.updatedAt).getTime() : 1000;
      const current = mergedPrayers[row.date];
      if (!current || rowTime >= current.updatedAt) {
        mergedPrayers[row.date] = {
          fajr: Boolean(row.fajr),
          dhuhr: Boolean(row.dhuhr),
          asr: Boolean(row.asr),
          maghrib: Boolean(row.maghrib),
          isha: Boolean(row.isha),
          updatedAt: rowTime,
        };
      }
    }

    const dbStateRaw = await getUserSyncStateFromDb(alias);
    if (dbStateRaw && typeof dbStateRaw === 'object') {
      if (dbStateRaw.prayers && typeof dbStateRaw.prayers === 'object') {
        for (const [date, pVal] of Object.entries(dbStateRaw.prayers as Record<string, any>)) {
          if (!pVal || typeof pVal !== 'object') continue;
          const incomingTs = Number(pVal.updatedAt) || 1000;
          const current = mergedPrayers[date];
          if (!current || incomingTs >= current.updatedAt) {
            mergedPrayers[date] = {
              fajr: Boolean(pVal.fajr),
              dhuhr: Boolean(pVal.dhuhr),
              asr: Boolean(pVal.asr),
              maghrib: Boolean(pVal.maghrib),
              isha: Boolean(pVal.isha),
              updatedAt: incomingTs,
            };
          }
        }
      }
      if (dbStateRaw.settings && typeof dbStateRaw.settings === 'object') {
        for (const [sKey, sVal] of Object.entries(dbStateRaw.settings as Record<string, any>)) {
          if (!sVal || typeof sVal !== 'object' || !('value' in sVal)) continue;
          const incomingTs = Number(sVal.updatedAt) || 1000;
          const current = mergedSettings[sKey];
          if (!current || incomingTs >= current.updatedAt) {
            mergedSettings[sKey] = {
              value: sVal.value,
              updatedAt: incomingTs,
            };
          }
        }
      }
    }
  }

  // Merge from in-memory cache if newer
  if (cached) {
    for (const [date, pVal] of Object.entries(cached.prayers)) {
      const current = mergedPrayers[date];
      if (!current || pVal.updatedAt >= current.updatedAt) {
        mergedPrayers[date] = pVal;
      }
    }
    for (const [sKey, sVal] of Object.entries(cached.settings)) {
      const current = mergedSettings[sKey];
      if (!current || sVal.updatedAt >= current.updatedAt) {
        mergedSettings[sKey] = sVal;
      }
    }
  }

  const finalState: UserCloudSyncState = {
    prayers: mergedPrayers,
    settings: mergedSettings,
    lastUpdatedAt: cached?.lastUpdatedAt || getNextServerSyncTime(),
  };

  memoryUserSyncCache.set(canonicalEmail, finalState);
  for (const alias of aliases) {
    memoryUserSyncCache.set(alias, finalState);
  }
  return finalState;
}

async function sendDonorThankYouAndReviewEmail(params: {
  donorEmail: string;
  donorName?: string;
  provider?: string;
  appOrigin?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const cleanEmail = String(params.donorEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { sent: false, reason: 'invalid_email' };
  }

  // Prevent duplicate emails within 2 minutes if user clicks Copy + Open QR consecutively
  const lastSent = recentThankYouEmails.get(cleanEmail) || 0;
  if (Date.now() - lastSent < 2 * 60 * 1000) {
    return { sent: true, reason: 'already_sent_recently' };
  }

  const donorName = String(params.donorName || cleanEmail.split('@')[0] || 'Fidèle Bienfaiteur').trim();
  const providerLabel = params.provider === 'orange_money' ? 'Orange Money' : 'Wave';
  const appUrl = (
    params.appOrigin ||
    process.env.APP_URL ||
    'https://ais-pre-vpioeip2ztaebehizldl4l-40012837727.europe-west2.run.app'
  ).replace(/\/$/, '');
  const reviewUrl = `${appUrl}/?avis=donateur`;

  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = (process.env.SMTP_USER || 'mgaye60000@gmail.com').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const isPlaceholderPass =
    !rawPass ||
    rawPass.includes('VOTRE_MOT_DE_PASSE') ||
    rawPass.includes('16_LETTRES') ||
    rawPass === 'your-app-password';
  const smtpPass = isPlaceholderPass ? '' : rawPass;

  if (!smtpPass) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subject = `Qu'Allah accepte votre Sadaqah Jariyah — Merci & Rappel | Le Sanctuaire`;
    const html = `
<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0F261A; color: #FFFFFF; border-radius: 22px; overflow: hidden; border: 1px solid #22543D;">
  <div style="padding: 30px 24px; text-align: center; background: linear-gradient(135deg, #153826 0%, #0B1E14 100%); border-bottom: 1px solid rgba(52, 211, 153, 0.25);">
    <p style="font-size: 24px; margin: 0 0 8px 0; color: #FCD34D;">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
    <h1 style="margin: 0; font-size: 21px; font-weight: 800; color: #FFFFFF;">BarakAllahu Fikum pour votre Sadaqah Jariyah</h1>
    <p style="margin: 6px 0 0 0; font-size: 12px; color: #A7F3D0;">Le Sanctuaire Spirituel Quotidien • Soutien via ${providerLabel}</p>
  </div>

  <div style="padding: 28px 24px; background-color: #122B1E; line-height: 1.7;">
    <p style="font-size: 15px; color: #F8FAFC; margin-top: 0;">
      As-salāmu 'alaykum wa rahmatullāhi wa barakātuh <strong>${donorName}</strong>,
    </p>

    <p style="font-size: 14px; color: #E2E8F0;">
      Nous vous remercions du fond du cœur pour votre don généreux en soutien au <strong>Sanctuaire</strong>. Qu'Allah (Exalté soit-Il) accepte votre aumône continue (<em>Sadaqah Jariyah</em>), purifie vos biens, multiplie vos récompenses et vous accorde Sa bénédiction dans cette vie ainsi que dans l'au-delà.
    </p>

    <!-- Bloc Encouragement sur le Droit Chemin -->
    <div style="margin: 22px 0; padding: 20px; background-color: #0A1911; border-left: 4px solid #FCD34D; border-radius: 14px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #FCD34D;">
        Rappel &amp; Encouragement sur le Droit Chemin (As-Sirāt Al-Mustaqīm)
      </p>
      <p style="margin: 0 0 10px 0; font-size: 18px; text-align: right; color: #A7F3D0; font-family: serif;">
        ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ
      </p>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #E2E8F0; font-style: italic;">
        « Guide-nous dans le droit chemin. » (Sourate Al-Fatiha, 1:6)
      </p>
      <p style="margin: 0; font-size: 13px; color: #CBD5E1;">
        Cher frère, chère sœur en Allah, demeurez ferme et serein(e) sur le droit chemin. Préservez vos 5 prières quotidiennes à l'heure, nourrissez votre cœur par la lecture régulière du Noble Coran et multipliez le Dhikr matin et soir. Chaque pas sincère vers Allah vous rapproche de Sa miséricorde et de Sa paix intérieure.
      </p>
    </div>

    <!-- Bloc Demande d'Avis pour la Page Landing -->
    <div style="margin: 24px 0 10px 0; padding: 20px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(245, 158, 11, 0.12) 100%); border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 16px; text-align: center;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 800; color: #FFFFFF;">
        Partagez votre avis avec la communauté
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #D1FAE5;">
        En tant que membre bienfaiteur, votre témoignage est précieux. Laissez-nous votre avis sur votre expérience avec Le Sanctuaire : il sera affiché directement sur notre page d'accueil (Landing Page) pour inspirer et encourager d'autres fidèles.
      </p>
      <a href="${reviewUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: #052E16; font-weight: 800; font-size: 13px; text-decoration: none; border-radius: 12px;">
        Donner mon avis pour la page d'accueil
      </a>
    </div>

    <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 22px 0 0 0;">
      Qu'Allah vous garde sur la droiture et illumine votre foyer.<br/>
      <strong>L'équipe Le Sanctuaire</strong>
    </p>
  </div>
</div>`;

    await transporter.sendMail({
      from: `"Le Sanctuaire" <${smtpUser}>`,
      to: cleanEmail,
      subject,
      html,
    });

    recentThankYouEmails.set(cleanEmail, Date.now());

    try {
      await logSentEmailInDb({
        senderEmail: smtpUser,
        recipientEmail: cleanEmail,
        subject,
        bodyPreview: `Remerciement de don, encouragement sur le droit chemin et demande d'avis envoyé à ${cleanEmail}`,
        emailType: 'donation_thank_you',
        status: 'sent',
      });
    } catch {
      // ignore db log error
    }

    return { sent: true };
  } catch (err: any) {
    console.error('Failed to send donor thank-you email:', err);
    return { sent: false, reason: err?.message || 'smtp_error' };
  }
}

const OTP_SECRET =
  process.env.OTP_SECRET ||
  process.env.SMTP_PASS ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sanctuaire-otp-secret-key-2025';

function createOtpSignature(email: string, code: string, expiresAt: number): string {
  const cleanEmail = email.trim().toLowerCase();
  const payload = `${cleanEmail}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return `${expiresAt}.${hmac}`;
}

function verifyOtpSignature(email: string, code: string, signature: string): boolean {
  if (!signature || !signature.includes('.')) return false;
  const [expiresAtStr, expectedHmac] = signature.split('.');
  const expiresAt = Number(expiresAtStr);
  if (!expiresAt || Date.now() > expiresAt) return false;
  const cleanEmail = email.trim().toLowerCase();
  const payload = `${cleanEmail}:${code.trim()}:${expiresAt}`;
  const actualHmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return actualHmac === expectedHmac;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ============================================================================
  // 1. CONNECTED ACCOUNTS & PROFILES ROUTES (PostgreSQL / Supabase Schema)
  // ============================================================================

  // Fetch all connected/registered accounts so the user can see and switch to them
  app.get('/api/accounts', async (_req, res) => {
    try {
      const accounts = await getAllConnectedProfiles();
      res.json({ accounts });
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch accounts', accounts: [] });
    }
  });

  const getServerSupabaseCreds = () => {
    const url = (
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://bkfklfnnturdwtfjoxci.supabase.co'
    )
      .trim()
      .replace(/\/$/, '');
    const key = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      ''
    ).trim();
    const isValidKey =
      key.length > 15 &&
      !key.includes('your-anon-public-key') &&
      !key.includes('VOTRE_CLE');
    return isValidKey ? { url, key } : null;
  };
  const getSupabaseRestCredentials = getServerSupabaseCreds;

  const mirrorToSupabaseRest = async (
    table: string,
    payload: Record<string, any>,
    onConflict?: string
  ): Promise<boolean> => {
    const creds = getServerSupabaseCreds();
    if (!creds) return false;
    try {
      const endpoint = onConflict
        ? `${creds.url}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`
        : `${creds.url}/rest/v1/${table}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: creds.key,
          Authorization: `Bearer ${creds.key}`,
          Prefer: onConflict ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const querySupabaseRest = async (table: string, query = 'select=*&limit=500'): Promise<any[]> => {
    const creds = getServerSupabaseCreds();
    if (!creds) return [];
    const runQuery = async (qs: string) =>
      fetch(`${creds.url}/rest/v1/${table}?${qs}`, {
        headers: {
          apikey: creds.key,
          Authorization: `Bearer ${creds.key}`,
        },
      });
    try {
      let res = await runQuery(query);
      if (!res.ok && res.status === 400 && query.includes('order=')) {
        const stripped = query
          .split('&')
          .filter((p) => p && !p.startsWith('order='))
          .join('&');
        res = await runQuery(stripped || 'select=*&limit=500');
      }
      if (!res.ok) return [];
      const rows = await res.json().catch(() => []);
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  };

  const fetchSupabaseAuthUsersServer = async (): Promise<any[]> => {
    const creds = getServerSupabaseCreds();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!creds || serviceKey.length <= 15) return [];
    try {
      const res = await fetch(`${creds.url}/auth/v1/admin/users?per_page=500`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) return [];
      const json = await res.json().catch(() => null);
      if (Array.isArray(json?.users)) return json.users;
      if (Array.isArray(json)) return json;
      return [];
    } catch {
      return [];
    }
  };

  const mirrorProfileAndUserToSupabase = async (params: {
    id: string;
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    cityName: string;
    analyticsProfile: any;
  }) => {
    const nowIso = new Date().toISOString();
    let usersOk = await mirrorToSupabaseRest(
      'users',
      {
        uid: params.id,
        email: params.email,
        full_name: params.fullName,
        first_name: params.firstName,
        last_name: params.lastName,
        avatar_url: params.avatarUrl || null,
        city_name: params.cityName || 'Dakar',
        updated_at: nowIso,
      },
      'uid'
    );
    if (!usersOk) {
      usersOk = await mirrorToSupabaseRest('users', {
        uid: params.id,
        email: params.email,
        full_name: params.fullName,
      });
    }

    let profilesOk = await mirrorToSupabaseRest(
      'profiles',
      {
        id: params.id,
        email: params.email,
        full_name: params.fullName,
        first_name: params.firstName,
        last_name: params.lastName,
        avatar_url: params.avatarUrl || null,
        city_name: params.cityName || 'Dakar',
        role: params.analyticsProfile.role,
        plan: params.analyticsProfile.plan,
        videos_used_this_month: params.analyticsProfile.videosUsedThisMonth,
        total_videos_created: params.analyticsProfile.totalVideosCreated,
        total_amount_paid_fcfa: params.analyticsProfile.totalAmountPaidFcfa,
        time_spent_seconds: params.analyticsProfile.timeSpentSeconds,
        last_connected_at: nowIso,
        updated_at: nowIso,
      },
      'email'
    );
    if (!profilesOk) {
      profilesOk = await mirrorToSupabaseRest(
        'profiles',
        {
          id: params.id,
          email: params.email,
          full_name: params.fullName,
          first_name: params.firstName,
          last_name: params.lastName,
          city_name: params.cityName || 'Dakar',
          updated_at: nowIso,
        },
        'id'
      );
    }
    if (!profilesOk) {
      profilesOk = await mirrorToSupabaseRest('profiles', {
        id: params.id,
        email: params.email,
        full_name: params.fullName,
      });
    }
    return { usersOk, profilesOk };
  };

  // Synchronize or register a connected profile in the PostgreSQL database (both users and profiles)
  app.post('/api/accounts/sync', async (req, res) => {
    try {
      const { id, email, fullName, firstName, lastName, avatarUrl, cityName } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const resolvedId = id || `acct_${cleanEmail}`;
      const resolvedFull = fullName || cleanEmail.split('@')[0] || 'Fidèle';
      const resolvedFirst = firstName || resolvedFull.split(' ')[0] || 'Fidèle';
      const resolvedLast = lastName || resolvedFull.split(' ').slice(1).join(' ') || '';

      const profile = await upsertConnectedProfile({
        id: resolvedId,
        email: cleanEmail,
        fullName: resolvedFull,
        firstName: resolvedFirst,
        lastName: resolvedLast,
        avatarUrl,
        cityName,
      });

      const analyticsProfile = await syncAnalyticsProfileOnConnect({
        id: resolvedId,
        email: cleanEmail,
        fullName: resolvedFull,
        firstName: resolvedFirst,
        lastName: resolvedLast,
        cityName: cityName || 'Dakar',
      });

      const { usersOk, profilesOk } = await mirrorProfileAndUserToSupabase({
        id: resolvedId,
        email: cleanEmail,
        fullName: resolvedFull,
        firstName: resolvedFirst,
        lastName: resolvedLast,
        avatarUrl,
        cityName: cityName || 'Dakar',
        analyticsProfile,
      });

      res.json({
        profile: { ...profile, ...analyticsProfile },
        supabaseUsersSaved: usersOk,
        supabaseProfilesSaved: profilesOk,
      });
    } catch (error: any) {
      console.error('Failed to sync account:', error);
      res.status(500).json({ error: error.message || 'Failed to sync account' });
    }
  });

  // Protected Firebase Auth user synchronization route
  app.post('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userRecord = await getOrCreateUser(
        req.user.uid,
        req.user.email || '',
        req.user.name,
        req.user.name?.split(' ')[0],
        req.user.name?.split(' ').slice(1).join(' '),
        req.user.picture
      );
      res.json({ user: userRecord });
    } catch (error: any) {
      console.error('Failed to sync authenticated user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // ============================================================================
  // 2. PRAYER LOGS & DONATIONS DATABASE ROUTES
  // ============================================================================

  app.get('/api/prayers/:userId/:date', async (req, res) => {
    try {
      const log = await getPrayerLogFromDb(req.params.userId, req.params.date);
      res.json({ log });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch prayer log' });
    }
  });

  app.post('/api/prayers', async (req, res) => {
    try {
      const { userId, date, prayerKey, completed } = req.body || {};
      if (!userId || !date || !prayerKey) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const cleanId = String(userId).trim().toLowerCase();
      const log = await upsertPrayerLogInDb(cleanId, date, prayerKey, Boolean(completed));
      await mirrorToSupabaseRest(
        'prayer_logs',
        {
          user_id: cleanId,
          date,
          [prayerKey]: Boolean(completed),
          updated_at: new Date().toISOString(),
        },
        'user_id,date'
      );
      res.json({ log });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update prayer log' });
    }
  });

  // ============================================================================
  // 2B. CROSS-DEVICE REAL-TIME ACCOUNT SYNCHRONIZATION (PC <-> MOBILE)
  // ============================================================================

  app.get('/api/sync/:email', async (req, res) => {
    try {
      const rawEmail = decodeURIComponent(req.params.email || '').trim().toLowerCase();
      if (!rawEmail) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const canonicalEmail = getCanonicalSyncEmail(rawEmail);
      const state = await withSyncLock(canonicalEmail, () => loadMergedUserSyncState(rawEmail));
      res.json({ email: rawEmail, state, serverTime: state.lastUpdatedAt });
    } catch (error: any) {
      console.error('Error in GET /api/sync/:email:', error);
      res.status(500).json({ error: error.message || 'Failed to load sync state' });
    }
  });

  app.post('/api/sync/:email', async (req, res) => {
    try {
      const rawEmail = decodeURIComponent(req.params.email || '').trim().toLowerCase();
      if (!rawEmail) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const canonicalEmail = getCanonicalSyncEmail(rawEmail);
      const result = await withSyncLock(canonicalEmail, async () => {
        const incoming = req.body || {};
        const isPushAction = incoming.mode === 'push';
        const serverNow = getNextServerSyncTime();
        const current = await loadMergedUserSyncState(rawEmail);

        let hasChanges = false;
        const datesToPersistInDb: string[] = [];

        // Merge prayer logs by date
        if (incoming.prayers && typeof incoming.prayers === 'object') {
          for (const [date, pVal] of Object.entries(incoming.prayers as Record<string, any>)) {
            if (!pVal || typeof pVal !== 'object') continue;
            const existing = current.prayers[date];
            const isExplicitPush = isPushAction || pVal.pendingPush === true;

            // Only overwrite existing server state on explicit push; on pull, only seed missing dates
            if (!existing || isExplicitPush) {
              const nextDay: SyncedPrayerDay = {
                fajr: Boolean(pVal.fajr),
                dhuhr: Boolean(pVal.dhuhr),
                asr: Boolean(pVal.asr),
                maghrib: Boolean(pVal.maghrib),
                isha: Boolean(pVal.isha),
                updatedAt: serverNow,
              };
              const changed =
                !existing ||
                existing.fajr !== nextDay.fajr ||
                existing.dhuhr !== nextDay.dhuhr ||
                existing.asr !== nextDay.asr ||
                existing.maghrib !== nextDay.maghrib ||
                existing.isha !== nextDay.isha ||
                isExplicitPush;

              current.prayers[date] = nextDay;
              if (changed) {
                hasChanges = true;
                datesToPersistInDb.push(date);
              }
            }
          }
        }

        // Merge settings & actions (city, offsets, tasbih, quran bookmarks, theme, etc.)
        if (incoming.settings && typeof incoming.settings === 'object') {
          for (const [sKey, sVal] of Object.entries(incoming.settings as Record<string, any>)) {
            if (!sVal || typeof sVal !== 'object' || !('value' in sVal)) continue;
            const existing = current.settings[sKey];
            const isExplicitPush = isPushAction || sVal.pendingPush === true;

            // Only overwrite existing server state on explicit push; on pull, only seed missing keys
            if (!existing || isExplicitPush) {
              const prevSerialized = existing ? JSON.stringify(existing.value) : '';
              const nextSerialized = JSON.stringify(sVal.value);
              current.settings[sKey] = {
                value: sVal.value,
                updatedAt: serverNow,
              };
              if (!existing || prevSerialized !== nextSerialized || isExplicitPush) {
                hasChanges = true;
              }
            }
          }
        }

        // Mirror Quran favorites to Supabase public.quran_favorites if provided
        if (Array.isArray(incoming.quranFavorites)) {
          for (const fav of incoming.quranFavorites) {
            if (!fav || !fav.surahNumber || !fav.ayahNumber) continue;
            const sNum = Number(fav.surahNumber);
            const aNum = Number(fav.ayahNumber);
            if (!fav.remove) {
              const qPayload = {
                user_id: rawEmail,
                surah_number: sNum,
                ayah_number: aNum,
                surah_name: String(fav.surahName || `Sourate ${sNum}`),
                ayah_text: String(fav.ayahText || ''),
                ayah_translation: String(fav.ayahTranslation || ''),
              };
              const ok = await mirrorToSupabaseRest(
                'quran_favorites',
                qPayload,
                'user_id,surah_number,ayah_number'
              );
              if (!ok) {
                await mirrorToSupabaseRest('quran_favorites', qPayload);
              }
            }
          }
        }

        // Mirror Dhikr / Tasbih logs to Supabase public.dhikr_logs if provided
        if (Array.isArray(incoming.dhikrLogs)) {
          for (const dLog of incoming.dhikrLogs) {
            if (!dLog || !dLog.dhikrPhrase) continue;
            const dateKey = String(dLog.date || new Date().toISOString().slice(0, 10));
            const phrase = String(dLog.dhikrPhrase).trim();
            const countVal = Math.max(0, Number(dLog.count) || 0);
            const targetVal = Math.max(1, Number(dLog.target) || 33);
            const completedVal = Boolean(dLog.completed || countVal >= targetVal);

            const dPayload = {
              user_id: rawEmail,
              date: dateKey,
              dhikr_phrase: phrase,
              count: countVal,
              target: targetVal,
              completed: completedVal,
            };
            const ok = await mirrorToSupabaseRest(
              'dhikr_logs',
              dPayload,
              'user_id,date,dhikr_phrase'
            );
            if (!ok) {
              await mirrorToSupabaseRest('dhikr_logs', dPayload);
            }
          }
        }

        if (hasChanges) {
          current.lastUpdatedAt = serverNow;
          const aliases = await getSyncAliasesAsync(rawEmail);
          memoryUserSyncCache.set(canonicalEmail, current);
          for (const alias of aliases) {
            memoryUserSyncCache.set(alias, current);
          }

          // Persist updated prayer days in prayer_logs table & mirror to Supabase REST for all aliases
          for (const date of datesToPersistInDb) {
            const dayLog = current.prayers[date];
            if (dayLog) {
              for (const alias of aliases) {
                await upsertFullPrayerLogInDb(alias, date, dayLog);
                const pPayload = {
                  user_id: alias,
                  date,
                  fajr: Boolean(dayLog.fajr),
                  dhuhr: Boolean(dayLog.dhuhr),
                  asr: Boolean(dayLog.asr),
                  maghrib: Boolean(dayLog.maghrib),
                  isha: Boolean(dayLog.isha),
                  updated_at: new Date().toISOString(),
                };
                const ok = await mirrorToSupabaseRest('prayer_logs', pPayload, 'user_id,date');
                if (!ok) {
                  await mirrorToSupabaseRest('prayer_logs', pPayload);
                }
              }
            }
          }

          // Persist complete sync state in PostgreSQL for all aliases
          for (const alias of aliases) {
            await saveUserSyncStateInDb(alias, current);
          }
        }

        return { state: current, serverTime: serverNow };
      });

      res.json({ email: rawEmail, state: result.state, serverTime: result.serverTime });
    } catch (error: any) {
      console.error('Error in POST /api/sync/:email:', error);
      res.status(500).json({ error: error.message || 'Failed to save sync state' });
    }
  });

  app.post('/api/donations', async (req, res) => {
    try {
      const body = req.body || {};
      const safeAmount = Number(body.amount) > 0 ? Number(body.amount) : 5000;
      const cleanEmail = body.donorEmail ? String(body.donorEmail).trim().toLowerCase() : null;
      const safeRef =
        body.transactionReference ||
        `DON-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      const resolvedDonorName =
        body.donorName || (cleanEmail ? cleanEmail.split('@')[0] : 'Donateur Sadaqah');

      let record = null;
      let supabaseSaved = false;
      try {
        record = await insertDonationInDb({
          userId: body.userId || (cleanEmail ? `acct_${cleanEmail}` : `guest_${safeRef}`),
          amount: String(safeAmount),
          currency: body.currency || 'XOF',
          provider: body.provider || 'wave',
          status: body.status || 'succeeded',
          cause: body.cause || 'Sadaqah Jariyah - Le Sanctuaire',
          donorName: resolvedDonorName,
          donorEmail: cleanEmail || undefined,
          donorPhone: body.donorPhone,
          isAnonymous: body.isAnonymous,
          transactionReference: safeRef,
        });

        const basePayload = {
          user_id: record?.userId || body.userId || (cleanEmail ? `acct_${cleanEmail}` : null),
          amount: Number(record?.amount || safeAmount),
          currency: record?.currency || body.currency || 'XOF',
          provider: record?.provider || body.provider || 'wave',
          status: record?.status || body.status || 'succeeded',
          cause: record?.cause || body.cause || 'Sadaqah Jariyah - Le Sanctuaire',
          donor_name: record?.donorName || resolvedDonorName,
          donor_email: record?.donorEmail || cleanEmail,
          donor_phone: record?.donorPhone || body.donorPhone || null,
          is_anonymous: Boolean(body.isAnonymous),
          transaction_reference: record?.transactionReference || safeRef,
        };

        supabaseSaved = await mirrorToSupabaseRest('donations', basePayload);
        if (!supabaseSaved) {
          const { user_id, ...withoutUid } = basePayload;
          supabaseSaved = await mirrorToSupabaseRest('donations', {
            ...withoutUid,
            provider:
              withoutUid.provider === 'orange_money' ? 'direct_transfer' : withoutUid.provider || 'wave',
          });
        }
        if (!supabaseSaved) {
          supabaseSaved = await mirrorToSupabaseRest('donations', {
            amount: Number(record?.amount || safeAmount),
            currency: record?.currency || body.currency || 'XOF',
            provider:
              basePayload.provider === 'orange_money' ? 'direct_transfer' : basePayload.provider || 'wave',
            status: record?.status || body.status || 'succeeded',
            cause: record?.cause || body.cause || 'Sadaqah Jariyah - Le Sanctuaire',
            donor_name: record?.donorName || resolvedDonorName,
            donor_email: record?.donorEmail || cleanEmail,
          });
        }
      } catch (dbErr) {
        console.warn('Non-fatal DB error recording donation:', dbErr);
      }

      // If the donor has an account (donorEmail is present), automatically send thank-you, straight path encouragement & review request email
      let emailResult: { sent: boolean; reason?: string } = { sent: false };
      if (cleanEmail && cleanEmail.includes('@')) {
        const origin =
          (typeof req.headers.origin === 'string' && req.headers.origin) ||
          `${req.protocol}://${req.get('host')}`;
        emailResult = await sendDonorThankYouAndReviewEmail({
          donorEmail: cleanEmail,
          donorName: resolvedDonorName,
          provider: body.provider,
          appOrigin: origin,
        });
      }

      res.json({
        donation: record,
        supabaseSaved,
        emailSent: emailResult.sent,
        emailReason: emailResult.reason,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to record donation' });
    }
  });

  // Dedicated endpoint to trigger or re-trigger the donor thank-you & review invitation email
  app.post('/api/donations/thank-you', async (req, res) => {
    try {
      const { email, name, provider } = req.body || {};
      if (!email || !String(email).includes('@')) {
        return res.status(400).json({ sent: false, error: 'E-mail du compte requis.' });
      }
      const origin =
        (typeof req.headers.origin === 'string' && req.headers.origin) ||
        `${req.protocol}://${req.get('host')}`;
      const result = await sendDonorThankYouAndReviewEmail({
        donorEmail: String(email),
        donorName: name,
        provider,
        appOrigin: origin,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ sent: false, error: error.message || 'Erreur envoi e-mail' });
    }
  });

  // Donor reviews endpoints (displayed on Landing Page)
  app.get('/api/reviews', async (_req, res) => {
    try {
      const dbReviews = await getDonorReviewsFromDb();
      const map = new Map<string, DonorReviewRecord>();
      for (const item of memoryReviewsCache) {
        map.set(item.id, item);
      }
      for (const item of dbReviews) {
        map.set(item.id, item);
      }
      res.json({ reviews: Array.from(map.values()) });
    } catch {
      res.json({ reviews: memoryReviewsCache });
    }
  });

  app.post('/api/reviews', async (req, res) => {
    try {
      const { name, email, city, rating, comment, isDonor } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(401).json({ error: 'Compte requis.' });
      }
      if (!comment || !String(comment).trim()) {
        return res.status(400).json({ error: 'Veuillez écrire votre avis.' });
      }
      const saved = await insertDonorReviewInDb({
        name: String(name || cleanEmail.split('@')[0] || 'Membre du Sanctuaire').trim(),
        email: cleanEmail,
        city: String(city || 'Dakar').trim(),
        rating: Number(rating) || 5,
        comment: String(comment).trim(),
        isDonor: Boolean(isDonor),
      });
      await mirrorToSupabaseRest('email_logs', {
        sender_email: saved.email || 'membre@sanctuaire.app',
        recipient_email: 'landing_page_reviews',
        subject: JSON.stringify({
          name: saved.name,
          city: saved.city || 'Dakar',
          rating: saved.rating,
          isDonor: Boolean(saved.isDonor),
        }),
        body_preview: saved.comment,
        email_type: 'donor_review',
        status: 'published',
      });
      memoryReviewsCache.unshift(saved);
      res.json({ review: saved });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erreur lors de la publication de votre avis.' });
    }
  });

  app.get('/api/donations/check', async (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email : undefined;
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const hasDonated = await checkDonorStatusInDb(email, userId);
      res.json({ hasDonated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to check donor status', hasDonated: false });
    }
  });

  app.get('/api/diagnostics', async (_req, res) => {
    try {
      const creds = getSupabaseRestCredentials();
      const hasServiceRoleKey = Boolean(
        process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 15
      );
      const hasAnonKey = Boolean(
        (
          process.env.VITE_SUPABASE_ANON_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
          ''
        ).trim().length > 15
      );
      const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
      const tables = [
        'users',
        'profiles',
        'donations',
        'prayer_logs',
        'quran_favorites',
        'dhikr_logs',
        'email_logs',
        'video_creations',
        'user_reports',
        'site_analytics_daily',
      ];
      const tableStatuses: Record<string, any> = {};
      const errors: string[] = [];
      const advice: string[] = [];
      let profilesColumnsOk = false;
      let authUsersCount: number | null = null;

      if (!creds) {
        for (const table of tables) {
          tableStatuses[table] = { ok: false, status: 0, error: 'Clé API Supabase non configurée' };
        }
        errors.push(
          'Aucune clé API Supabase détectée côté serveur (VITE_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY).'
        );
        advice.push(
          'Ajoutez VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY dans vos variables d’environnement (Vercel > Settings > Environment Variables ou .env).'
        );
      } else {
        await Promise.all(
          tables.map(async (table) => {
            try {
              const r = await fetch(`${creds.url}/rest/v1/${table}?select=*&limit=1`, {
                headers: {
                  apikey: creds.key,
                  Authorization: `Bearer ${creds.key}`,
                  Prefer: 'count=exact',
                },
              });
              if (!r.ok) {
                const t = await r.text().catch(() => '');
                tableStatuses[table] = { ok: false, status: r.status, error: t };
                errors.push(`Table public.${table} (${r.status}): ${t}`);
              } else {
                const rows = await r.json().catch(() => []);
                const contentRange = r.headers.get('content-range') || '';
                const totalMatch = contentRange.match(/\/(\d+)$/);
                const rowCount = totalMatch ? Number(totalMatch[1]) : Array.isArray(rows) ? rows.length : 0;
                tableStatuses[table] = {
                  ok: true,
                  status: 200,
                  sampleCount: Array.isArray(rows) ? rows.length : 0,
                  rowCount,
                };
              }
            } catch (e: any) {
              tableStatuses[table] = { ok: false, error: e?.message || String(e) };
              errors.push(`Table public.${table}: ${e?.message || String(e)}`);
            }
          })
        );

        try {
          const colRes = await fetch(
            `${creds.url}/rest/v1/profiles?select=id,email,role,plan,videos_used_this_month,total_videos_created,total_amount_paid_fcfa,time_spent_seconds,last_connected_at&limit=1`,
            {
              headers: {
                apikey: creds.key,
                Authorization: `Bearer ${creds.key}`,
              },
            }
          );
          if (colRes.ok) {
            profilesColumnsOk = true;
          } else {
            const colErr = await colRes.text().catch(() => '');
            errors.push(`Colonnes Dashboard manquantes sur public.profiles: ${colErr}`);
            advice.push(
              'Exécutez le script SQL complet (10 tables) dans Supabase -> SQL Editor pour mettre à jour les colonnes de public.profiles.'
            );
          }
        } catch {
          // ignore
        }

        if (hasServiceRoleKey) {
          const authUsers = await fetchSupabaseAuthUsersServer();
          authUsersCount = authUsers.length;
        }
      }

      if (!hasServiceRoleKey && creds) {
        advice.push(
          'Conseil : Ajoutez SUPABASE_SERVICE_ROLE_KEY pour synchroniser aussi directement auth.users.'
        );
      }
      if (!hasSmtp) {
        advice.push(
          'Optionnel : Ajoutez SMTP_USER et SMTP_PASS pour l’envoi direct des e-mails OTP et de remerciement.'
        );
      }

      res.json({
        ok: Boolean(creds) && errors.length === 0,
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrl: creds?.url || 'https://bkfklfnnturdwtfjoxci.supabase.co',
          supabaseKeyConfigured: Boolean(creds),
          hasAnonKey,
          hasServiceRoleKey,
          hasSmtp,
          profilesColumnsOk,
          authUsersCount,
          serverlessFunctionsCount: 11,
          vercelHobbyLimit: 12,
        },
        tables: tableStatuses,
        errors,
        advice,
      });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message || 'Diagnostics error' });
    }
  });

  // ============================================================================
  // 3. EMAIL LOGS ROUTES (Outbox & Verification Email Logs)
  // ============================================================================

  app.get('/api/emails', async (_req, res) => {
    try {
      const emails = await getSentEmailsFromDb();
      res.json({ emails });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch email logs', emails: [] });
    }
  });

  app.post('/api/emails/log', async (req, res) => {
    try {
      const { senderEmail, recipientEmail, subject, bodyPreview, emailType, status } = req.body || {};
      if (!senderEmail || !recipientEmail || !subject) {
        return res.status(400).json({ error: 'Missing required email fields' });
      }
      const entry = await logSentEmailInDb({
        senderEmail,
        recipientEmail,
        subject,
        bodyPreview,
        emailType,
        status,
      });
      res.json({ email: entry });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to log email' });
    }
  });

  // Real 6-digit verification code sender via SMTP
  app.post('/api/auth/send-code', async (req, res) => {
    try {
      const { email: rawEmail, fullName: rawName } = req.body || {};
      const email = String(rawEmail || '').trim().toLowerCase();
      const fullName = String(rawName || email.split('@')[0] || 'Fidèle').trim();

      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Adresse e-mail invalide.' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000;
      const signature = createOtpSignature(email, code, expiresAt);

      const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
      const smtpPort = Number(process.env.SMTP_PORT || 465);
      const smtpUser = (process.env.SMTP_USER || 'mgaye60000@gmail.com').trim();
      const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
      const isPlaceholderPass =
        !rawPass ||
        rawPass.includes('VOTRE_MOT_DE_PASSE') ||
        rawPass.includes('16_LETTRES') ||
        rawPass === 'your-app-password';
      const smtpPass = isPlaceholderPass ? '' : rawPass;

      if (smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          const html = `
<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0F261A; color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #22543D;">
  <div style="padding: 28px 24px; text-align: center; background: linear-gradient(135deg, #153826 0%, #0B1E14 100%); border-bottom: 1px solid rgba(52, 211, 153, 0.25);">
    <p style="font-size: 22px; margin: 0 0 6px 0; color: #FCD34D;">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">Le Sanctuaire Spirituel</h1>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #A7F3D0;">Authentification &amp; Code de Vérification</p>
  </div>
  <div style="padding: 28px 24px; background-color: #122B1E; text-align: center;">
    <p style="font-size: 15px; line-height: 1.6; color: #E2E8F0; margin-top: 0;">
      As-salāmu 'alaykum <strong>${fullName}</strong>,
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: #CBD5E1;">
      Voici votre code de vérification officiel à 6 chiffres pour confirmer votre compte (<strong>${email}</strong>) sur <strong>Le Sanctuaire</strong> :
    </p>
    <div style="margin: 24px auto; padding: 18px; max-width: 280px; background-color: #0A1911; border: 2px solid #34D399; border-radius: 16px; text-align: center;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #FCD34D;">
        ${code}
      </span>
    </div>
    <p style="font-size: 12px; color: #94A3B8; margin: 16px 0;">
      Ce code est valable pendant 15 minutes. Saisissez-le sur la page de connexion pour activer votre espace.
    </p>
  </div>
</div>`;

          await transporter.sendMail({
            from: `"Le Sanctuaire" <${smtpUser}>`,
            to: email,
            subject: `Code de vérification Le Sanctuaire : ${code}`,
            html,
          });

          try {
            await logSentEmailInDb({
              senderEmail: smtpUser,
              recipientEmail: email,
              subject: `Code de vérification Le Sanctuaire : ${code}`,
              bodyPreview: `Code OTP envoyé à ${email}`,
              emailType: 'verification',
              status: 'sent',
            });
          } catch {
            // ignore db log error
          }

          return res.json({
            success: true,
            provider: 'smtp',
            smtpSent: true,
            signature,
            code,
            senderEmail: smtpUser,
            message: `Un vrai code de vérification à 6 chiffres a été envoyé à ${email}.`,
          });
        } catch (smtpError: any) {
          console.error('SMTP send error:', smtpError);
          return res.json({
            success: true,
            provider: 'smtp_error',
            smtpSent: false,
            smtpError: smtpError?.message || 'Erreur SMTP Gmail',
            signature,
            code,
            message: 'Envoi via Gmail OAuth requis (SMTP_PASS invalide ou bloqué).',
          });
        }
      }

      return res.json({
        success: true,
        provider: 'gmail_oauth',
        smtpSent: false,
        signature,
        code,
        message: 'Envoi prêt via votre compte Gmail (OAuth) ou Supabase.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || "Erreur lors de l'envoi du code SMTP.",
      });
    }
  });

  app.post('/api/auth/verify-code', async (req, res) => {
    try {
      const { email, code, signature } = req.body || {};
      if (!email || !code) {
        return res.status(400).json({ verified: false, error: 'E-mail et code requis.' });
      }
      const isValid = verifyOtpSignature(String(email), String(code), String(signature || ''));
      if (!isValid) {
        return res.status(400).json({
          verified: false,
          error: 'Code de vérification invalide ou expiré.',
        });
      }
      return res.json({ verified: true });
    } catch (error: any) {
      res.status(500).json({
        verified: false,
        error: error?.message || 'Erreur lors de la vérification du code.',
      });
    }
  });

  // ============================================================================
  // 3.5. AUTOMATED WEEKLY PRAYER TIMES ENGINE (Exact astronomical calculation per city/region)
  // ============================================================================

  app.get('/api/prayer-times/weekly', async (req, res) => {
    try {
      const { getWeeklyAutomatedPrayers } = await import('./src/services/automatedPrayerService.ts');
      const city = String(req.query.city || 'dakar');
      const method = String(req.query.method || 'muslim');
      const asr = String(req.query.asr || 'standard');
      const dateParam = req.query.date ? new Date(String(req.query.date)) : new Date();

      const schedule = getWeeklyAutomatedPrayers(city, method, asr, dateParam);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.json({
        success: true,
        data: schedule,
      });
    } catch (error: any) {
      console.error('Error computing automated prayer times:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Erreur lors du calcul des horaires.',
      });
    }
  });

  // ============================================================================
  // 3.6. SAME-ORIGIN QURAN AUDIO PROXY (Enables gapless Web Audio & 9:16 Video Export)
  // ============================================================================

  const quranAudioCache = new Map<string, { buf: Buffer; contentType: string }>();

  app.get('/api/quran-audio', async (req, res) => {
    try {
      const surah = Math.floor(Number(req.query.surah));
      const ayah = Math.floor(Number(req.query.ayah));
      const reciter = String(req.query.reciter || 'mishary').trim();

      if (!Number.isFinite(surah) || surah < 1 || surah > 114) {
        return res.status(400).json({ error: 'Invalid surah number (1-114)' });
      }
      if (!Number.isFinite(ayah) || ayah < 1 || ayah > 286) {
        return res.status(400).json({ error: 'Invalid ayah number (1-286)' });
      }
      if (!/^[a-z0-9_]{1,40}$/.test(reciter)) {
        return res.status(400).json({ error: 'Invalid reciter id' });
      }

      const cacheKey = `${reciter}:${surah}:${ayah}`;
      const cached = quranAudioCache.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', cached.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(cached.buf);
      }

      const { getAyahAudioUrl } = await import('./src/utils/quranAudioUtils.ts');
      const targetUrl = getAyahAudioUrl(surah, ayah, reciter);

      let audioBuf: Buffer | null = null;
      let contentType = 'audio/mpeg';
      let lastStatus = 502;

      for (let attempt = 0; attempt < 3; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 10000);
        try {
          const upstream = await fetch(targetUrl, {
            signal: ctrl.signal,
            headers: {
              'User-Agent': 'LeSanctuaire/1.0 (+https://lavoiedelaserenite.app)',
            },
          });
          lastStatus = upstream.status;
          if (upstream.ok) {
            const arr = await upstream.arrayBuffer();
            if (arr.byteLength > 256) {
              audioBuf = Buffer.from(arr);
              contentType = upstream.headers.get('content-type') || 'audio/mpeg';
              break;
            }
          }
        } catch {
          // retry transient upstream failure
        } finally {
          clearTimeout(timer);
        }
      }

      if (!audioBuf) {
        return res.status(lastStatus >= 400 ? lastStatus : 502).json({ error: 'Upstream audio fetch failed' });
      }

      if (quranAudioCache.size >= 120) {
        const oldestKey = quranAudioCache.keys().next().value;
        if (oldestKey) quranAudioCache.delete(oldestKey);
      }
      quranAudioCache.set(cacheKey, { buf: audioBuf, contentType });

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(audioBuf);
    } catch (error: any) {
      console.error('Error proxying quran audio:', error);
      return res.status(502).json({ error: 'Failed to fetch quran audio' });
    }
  });

  // ============================================================================
  // 3.6B. FREE REALISTIC QUIZ NARRATOR TTS PROXY (TikTok Neural FR + Google FR fallback)
  // ============================================================================

  const quizTtsCache = new Map<string, string[]>();

  const synthesizeQuizTtsChunkTikTok = async (
    text: string,
    voice: string
  ): Promise<string | null> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    try {
      const upstream = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
        signal: ctrl.signal,
      });
      if (!upstream.ok) return null;
      const json = (await upstream.json().catch(() => null)) as any;
      if (json?.success && typeof json?.data === 'string' && json.data.length > 64) {
        return json.data;
      }
      return null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const synthesizeQuizTtsChunkGoogle = async (text: string): Promise<string | null> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    try {
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=fr&q=${encodeURIComponent(text)}`;
      const upstream = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: ctrl.signal,
      });
      if (!upstream.ok) return null;
      const arr = await upstream.arrayBuffer();
      if (arr.byteLength < 128) return null;
      return Buffer.from(arr).toString('base64');
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  app.all('/api/quiz-tts', async (req, res) => {
    try {
      const {
        normalizeTextForFrenchNarration,
        resolveValidNarratorVoiceId,
        splitTextForTtsChunks,
      } = await import('./src/utils/quizNarration.ts');

      const source = req.method === 'POST' ? req.body || {} : req.query || {};
      const cleanText = normalizeTextForFrenchNarration(String(source.text || '')).slice(0, 1200);
      const voiceId = resolveValidNarratorVoiceId(
        source.voiceId ? String(source.voiceId) : 'fr_001'
      );

      if (!cleanText) {
        return res.status(400).json({ ok: false, error: 'Texte requis pour la narration.' });
      }

      const cacheKey = `${voiceId}::${cleanText}`;
      const cached = quizTtsCache.get(cacheKey);
      if (cached) {
        return res.json({ ok: true, voiceId, chunks: cached, cached: true });
      }

      const maxLen = voiceId === 'google_fr' ? 175 : 210;
      const parts = splitTextForTtsChunks(cleanText, maxLen);
      const chunks: string[] = [];

      for (const part of parts) {
        let b64: string | null = null;
        if (voiceId === 'fr_001' || voiceId === 'fr_002') {
          b64 = await synthesizeQuizTtsChunkTikTok(part, voiceId);
        }
        if (!b64) {
          b64 = await synthesizeQuizTtsChunkGoogle(part);
        }
        if (!b64) {
          return res.status(502).json({
            ok: false,
            error: 'Synthèse vocale temporairement indisponible.',
          });
        }
        chunks.push(b64);
      }

      if (quizTtsCache.size > 160) {
        const oldestKey = quizTtsCache.keys().next().value;
        if (oldestKey) quizTtsCache.delete(oldestKey);
      }
      quizTtsCache.set(cacheKey, chunks);

      return res.json({ ok: true, voiceId, chunks });
    } catch (error: any) {
      return res.status(500).json({
        ok: false,
        error: error?.message || 'Erreur synthèse vocale.',
      });
    }
  });

  // ============================================================================
  // 3.7. PERSISTENT STUDIO MEDIA LIBRARY VAULT (Images & Videos saved on site)
  // ============================================================================

  const studioVaultRoot = path.join(process.cwd(), '.studio-media-vault');

  const safeVaultOwner = (raw: any): string =>
    String(raw || 'default_local')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_@.-]/g, '_')
      .slice(0, 80) || 'default_local';

  const safeVaultId = (raw: any): string =>
    String(raw || '')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 80);

  app.get('/api/studio-media', async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const owner = safeVaultOwner(req.query.owner);
      const manifestPath = path.join(studioVaultRoot, owner, 'manifest.json');
      const raw = await fs.readFile(manifestPath, 'utf-8').catch(() => '[]');
      const list = JSON.parse(raw);
      return res.json({ items: Array.isArray(list) ? list : [] });
    } catch {
      return res.json({ items: [] });
    }
  });

  app.post(
    '/api/studio-media',
    express.raw({ type: '*/*', limit: '2gb' }),
    async (req, res) => {
      try {
        const fs = await import('fs/promises');
        const owner = safeVaultOwner(decodeURIComponent(String(req.headers['x-media-owner'] || 'default_local')));
        const id = safeVaultId(req.headers['x-media-id']) || `media_${Date.now()}`;
        const rawName = String(req.headers['x-media-name'] || 'Media');
        let name = rawName;
        try {
          name = decodeURIComponent(rawName);
        } catch {}
        const kind = req.headers['x-media-kind'] === 'video' ? 'video' : 'image';
        const mimeType = String(
          req.headers['x-media-mime'] ||
            req.headers['content-type'] ||
            (kind === 'video' ? 'video/mp4' : 'image/jpeg')
        );
        const durationHeader = Number(req.headers['x-media-duration']);
        const durationSec =
          kind === 'video' && Number.isFinite(durationHeader) && durationHeader > 0
            ? Number(durationHeader.toFixed(2))
            : undefined;
        const createdAt = Number(req.headers['x-media-created']) || Date.now();
        const bodyBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);

        if (bodyBuf.length === 0) {
          return res.status(400).json({ error: 'Empty media payload' });
        }

        const ownerDir = path.join(studioVaultRoot, owner);
        await fs.mkdir(ownerDir, { recursive: true });
        await fs.writeFile(path.join(ownerDir, `${id}.bin`), bodyBuf);

        const manifestPath = path.join(ownerDir, 'manifest.json');
        const existingRaw = await fs.readFile(manifestPath, 'utf-8').catch(() => '[]');
        let manifest: any[] = [];
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed)) manifest = parsed;
        } catch {}

        const item = {
          id,
          name: name.slice(0, 120),
          kind,
          mimeType,
          sizeBytes: bodyBuf.length,
          ...(durationSec ? { durationSec } : {}),
          createdAt,
          url: `/api/studio-media/file/${encodeURIComponent(owner)}/${encodeURIComponent(id)}`,
        };

        manifest = [item, ...manifest.filter((m) => m?.id !== id)];
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

        return res.json({ ok: true, item });
      } catch (err: any) {
        console.error('Failed saving studio media:', err);
        return res.status(500).json({ error: 'Failed to store studio media' });
      }
    }
  );

  app.get('/api/studio-media/file/:owner/:id', async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const owner = safeVaultOwner(req.params.owner);
      const id = safeVaultId(req.params.id);
      if (!id) return res.status(400).end();

      const ownerDir = path.join(studioVaultRoot, owner);
      const filePath = path.join(ownerDir, `${id}.bin`);
      const manifestRaw = await fs.readFile(path.join(ownerDir, 'manifest.json'), 'utf-8').catch(() => '[]');
      let mimeType = 'application/octet-stream';
      try {
        const list = JSON.parse(manifestRaw);
        const found = Array.isArray(list) ? list.find((m: any) => m?.id === id) : null;
        if (found?.mimeType) mimeType = found.mimeType;
      } catch {}

      const stat = await fs.stat(filePath);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.sendFile(filePath);
    } catch {
      return res.status(404).json({ error: 'Media not found' });
    }
  });

  app.delete('/api/studio-media/:owner/:id', async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const owner = safeVaultOwner(req.params.owner);
      const id = safeVaultId(req.params.id);
      if (!id) return res.status(400).json({ error: 'Invalid id' });

      const ownerDir = path.join(studioVaultRoot, owner);
      await fs.unlink(path.join(ownerDir, `${id}.bin`)).catch(() => {});

      const manifestPath = path.join(ownerDir, 'manifest.json');
      const existingRaw = await fs.readFile(manifestPath, 'utf-8').catch(() => '[]');
      try {
        const list = JSON.parse(existingRaw);
        if (Array.isArray(list)) {
          const updated = list.filter((m: any) => m?.id !== id);
          await fs.writeFile(manifestPath, JSON.stringify(updated, null, 2), 'utf-8');
        }
      } catch {}

      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'Failed to delete media' });
    }
  });

  // ============================================================================
  // 3.8. FULL HD H.264 + AAC MP4 VIDEO TRANSCODE & MUXING ROUTES (FFmpeg)
  // ============================================================================

  let cachedFfmpegAvailable: boolean | null = null;
  app.get('/api/video/health', async (_req, res) => {
    if (cachedFfmpegAvailable === null) {
      try {
        const { execFile } = await import('child_process');
        const { promisify } = await import('util');
        const execFileAsync = promisify(execFile);
        await execFileAsync('ffmpeg', ['-version'], { timeout: 2000 });
        cachedFfmpegAvailable = true;
      } catch {
        cachedFfmpegAvailable = false;
      }
    }
    res.json({ ffmpeg: cachedFfmpegAvailable });
  });

  app.post(
    '/api/video/convert-mp4',
    express.raw({ type: '*/*', limit: '2gb' }),
    async (req, res) => {
      const fs = await import('fs/promises');
      const os = await import('os');
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      const jobId = `mp4conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tmpDir = os.tmpdir();
      const inputPath = path.join(tmpDir, `${jobId}.webm`);
      const outputPath = path.join(tmpDir, `${jobId}.mp4`);

      try {
        const bodyBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
        if (bodyBuf.length < 256) {
          return res.status(400).json({ error: 'Empty video payload' });
        }

        await fs.writeFile(inputPath, bodyBuf);

        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-i',
            inputPath,
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '18',
            '-vsync',
            'cfr',
            '-r',
            '30',
            '-pix_fmt',
            'yuv420p',
            '-c:a',
            'aac',
            '-b:a',
            '192k',
            '-ar',
            '48000',
            '-movflags',
            '+faststart',
            outputPath,
          ],
          { maxBuffer: 64 * 1024 * 1024 }
        );

        const outData = await fs.readFile(outputPath);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', String(outData.length));
        return res.send(outData);
      } catch (err: any) {
        console.error('FFmpeg convert-mp4 failed:', err?.stderr || err?.message || err);
        return res.status(500).json({ error: 'MP4 transcode failed' });
      } finally {
        await fs.unlink(inputPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
      }
    }
  );

  app.post(
    '/api/video/mux-mp4',
    express.raw({ type: '*/*', limit: '2gb' }),
    async (req, res) => {
      const fs = await import('fs/promises');
      const os = await import('os');
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      const jobId = `mp4mux_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tmpDir = os.tmpdir();
      const videoPath = path.join(tmpDir, `${jobId}_video.mp4`);
      const audioPath = path.join(tmpDir, `${jobId}_audio.wav`);
      const outputPath = path.join(tmpDir, `${jobId}_final.mp4`);

      try {
        const bodyBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
        if (bodyBuf.length < 16) {
          return res.status(400).json({ error: 'Invalid mux payload' });
        }

        const videoLen = bodyBuf.readUInt32BE(0);
        if (videoLen <= 0 || 4 + videoLen >= bodyBuf.length) {
          return res.status(400).json({ error: 'Malformed mux packet bounds' });
        }

        const videoBuf = bodyBuf.subarray(4, 4 + videoLen);
        const audioBuf = bodyBuf.subarray(4 + videoLen);

        await Promise.all([
          fs.writeFile(videoPath, videoBuf),
          fs.writeFile(audioPath, audioBuf),
        ]);

        const transcodeVideoToH264 =
          String(req.headers['x-video-transcode'] || '').toLowerCase() === 'h264';

        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-i',
            videoPath,
            '-i',
            audioPath,
            ...(transcodeVideoToH264
              ? ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-vsync', 'cfr', '-r', '30', '-pix_fmt', 'yuv420p']
              : ['-c:v', 'copy']),
            '-c:a',
            'aac',
            '-b:a',
            '192k',
            '-ar',
            '48000',
            '-shortest',
            '-movflags',
            '+faststart',
            outputPath,
          ],
          { maxBuffer: 64 * 1024 * 1024 }
        );

        const outData = await fs.readFile(outputPath);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', String(outData.length));
        return res.send(outData);
      } catch (err: any) {
        console.error('FFmpeg mux-mp4 failed:', err?.stderr || err?.message || err);
        return res.status(500).json({ error: 'MP4 muxing failed' });
      } finally {
        await fs.unlink(videoPath).catch(() => {});
        await fs.unlink(audioPath).catch(() => {});
        await fs.unlink(outputPath).catch(() => {});
      }
    }
  );

  const stagedVideoDownloads = new Map<
    string,
    { buffer: Buffer; filename: string; mimeType: string; expiresAt: number }
  >();

  const pruneStagedDownloads = () => {
    const now = Date.now();
    for (const [key, entry] of stagedVideoDownloads.entries()) {
      if (entry.expiresAt <= now) {
        stagedVideoDownloads.delete(key);
      }
    }
    while (stagedVideoDownloads.size > 24) {
      const oldestKey = stagedVideoDownloads.keys().next().value;
      if (!oldestKey) break;
      stagedVideoDownloads.delete(oldestKey);
    }
  };

  app.post(
    '/api/video/stage-download',
    express.raw({ type: '*/*', limit: '2gb' }),
    (req, res) => {
      try {
        pruneStagedDownloads();
        const bodyBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
        if (bodyBuf.length < 128) {
          return res.status(400).json({ error: 'Empty video buffer' });
        }
        const rawFilename = String(req.headers['x-download-filename'] || 'coran-sanctuaire.mp4');
        let decodedName = rawFilename;
        try {
          decodedName = decodeURIComponent(rawFilename);
        } catch {}
        const safeFilename =
          decodedName.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120) || 'coran-sanctuaire.mp4';
        const mimeType = String(req.headers['x-download-mime'] || 'video/mp4').slice(0, 64);

        const token = crypto.randomBytes(12).toString('hex');
        stagedVideoDownloads.set(token, {
          buffer: bodyBuf,
          filename: safeFilename,
          mimeType,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });

        return res.json({
          token,
          downloadUrl: `/api/video/download/${token}`,
          filename: safeFilename,
        });
      } catch (err: any) {
        return res.status(500).json({ error: err?.message || 'Stage download failed' });
      }
    }
  );

  app.get('/api/video/download/:token', (req, res) => {
    pruneStagedDownloads();
    const token = String(req.params.token || '').replace(/[^a-f0-9]/gi, '');
    const entry = stagedVideoDownloads.get(token);
    if (!entry) {
      return res.status(404).json({ error: 'Download expired or not found' });
    }
    res.setHeader('Content-Type', entry.mimeType || 'video/mp4');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${entry.filename}"; filename*=UTF-8''${encodeURIComponent(entry.filename)}`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Length', String(entry.buffer.length));
    res.setHeader('Cache-Control', 'no-store');
    return res.send(entry.buffer);
  });

  // ============================================================================
  // 4. PAYDUNYA INVOICE CREATION ROUTE
  // ============================================================================

  app.post('/api/paydunya/create-invoice', async (req, res) => {
    try {
      const masterKey = (
        process.env.PAYDUNYA_MASTER_KEY ||
        process.env.VITE_DUNYAPAY_MASTER_KEY ||
        'wQzk9ZwR-Qq9m-4hD0-b55F-c49238295f71'
      ).trim();
      const publicKey = (
        process.env.PAYDUNYA_PUBLIC_KEY ||
        process.env.VITE_DUNYAPAY_PUBLIC_KEY ||
        'live_public_d8A0W4p68G7c8fD2L1C0M9B4K3J'
      ).trim();
      const privateKey = (
        process.env.PAYDUNYA_PRIVATE_KEY ||
        process.env.VITE_DUNYAPAY_PRIVATE_KEY ||
        'live_private_p9L8K7J6H5G4F3D2S1A0Q9W8E7R'
      ).trim();
      const token = (
        process.env.PAYDUNYA_TOKEN ||
        process.env.VITE_DUNYAPAY_TOKEN ||
        'n7M6B5V4C3X2Z1L0K9J8'
      ).trim();

      const response = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PAYDUNYA-MASTER-KEY': masterKey,
          'PAYDUNYA-PUBLIC-KEY': publicKey,
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': token,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({
        response_code: '01',
        response_text: error?.message || 'Erreur serveur PayDunya',
      });
    }
  });

  // ============================================================================
  // 4B. VIDEO SUBSCRIPTION TIERS, ANALYTICS HEARTBEAT, REPORTS & SUPER ADMIN
  // ============================================================================

  app.post('/api/analytics/heartbeat', async (req, res) => {
    try {
      const { sessionId, email, view, deltaSec, isNewVisit } = req.body || {};
      const result = await recordVisitorHeartbeat({
        sessionId: String(sessionId || ''),
        email: email ? String(email) : undefined,
        view: view ? String(view) : undefined,
        deltaSec: Number(deltaSec) || 0,
        isNewVisit: Boolean(isNewVisit),
      });
      res.json({ ok: true, activeVisitors: result.activeVisitors });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Heartbeat error' });
    }
  });

  app.get('/api/subscription/status', async (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email : undefined;
      if (email && email.includes('@')) {
        const cleanEmail = email.trim().toLowerCase();
        const remoteRows = await querySupabaseRest(
          'profiles',
          `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
        );
        if (remoteRows.length > 0) {
          await mergeExternalProfilesIntoAnalytics(remoteRows);
        }
      }
      const status = await getUserSubscriptionStatus(email);
      res.json({ ok: true, status });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Failed to load subscription status' });
    }
  });

  app.post('/api/subscription/record-video', async (req, res) => {
    try {
      const {
        email,
        userName,
        surahSummary,
        verseCount,
        quality,
        aspectRatio,
        hasCustomLogo,
        durationSec,
      } = req.body || {};

      if (!email || !String(email).includes('@')) {
        return res.status(401).json({
          ok: false,
          reasonCode: 'AUTH_REQUIRED',
          error: 'Créez ou connectez votre compte pour créer une vidéo.',
        });
      }

      const result = await recordCreatedVideoForUser({
        email: String(email),
        userName: userName ? String(userName) : undefined,
        surahSummary: String(surahSummary || 'Saint Coran'),
        verseCount: Number(verseCount) || 1,
        quality: (String(quality || '720p') as StudioQualityTier),
        aspectRatio: String(aspectRatio || '9:16'),
        hasCustomLogo: Boolean(hasCustomLogo),
        durationSec: Number(durationSec) || 0,
      });

      if (!result.ok) {
        return res.status(403).json(result);
      }

      const cleanEmail = String(email).trim().toLowerCase();
      await Promise.all([
        mirrorToSupabaseRest(
          'profiles',
          {
            id: `acct_${cleanEmail}`,
            email: cleanEmail,
            plan: result.status.plan,
            role: result.status.role,
            videos_used_this_month: result.status.videosUsedThisMonth,
            total_videos_created: result.status.totalVideosCreated,
            updated_at: new Date().toISOString(),
          },
          'email'
        ),
        mirrorToSupabaseRest('video_creations', {
          user_email: cleanEmail,
          user_name: result.record?.userName || cleanEmail.split('@')[0],
          plan_at_creation: result.status.plan,
          surah_summary: result.record?.surahSummary || 'Saint Coran',
          verse_count: result.record?.verseCount || 1,
          quality: result.record?.quality || '720p',
          aspect_ratio: result.record?.aspectRatio || '9:16',
          had_watermark: Boolean(result.record?.hadWatermark),
          duration_sec: result.record?.durationSec || 0,
        }),
      ]);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Erreur lors de l’enregistrement vidéo.' });
    }
  });

  app.post('/api/subscription/upgrade', async (req, res) => {
    try {
      const { email, plan, provider, transactionReference } = req.body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(401).json({ ok: false, error: 'Connexion au compte requise avant activation.' });
      }
      const targetPlan = normalizePlanId(plan);
      if (targetPlan !== 'basique' && targetPlan !== 'pro' && targetPlan !== 'max') {
        return res.status(400).json({ ok: false, error: 'Forfait payant invalide (basique, pro ou max).' });
      }
      const planSpec = VIDEO_PLANS[targetPlan];
      const updatedUser = await setUserPlanForAccount({
        targetEmail: cleanEmail,
        newPlan: targetPlan,
        addPaymentFcfa: planSpec.priceFcfa,
        resetMonthlyQuota: true,
      });

      const txRef = transactionReference || `SUB-${targetPlan.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      await Promise.all([
        mirrorToSupabaseRest(
          'profiles',
          {
            id: updatedUser.id,
            email: cleanEmail,
            plan: updatedUser.plan,
            role: updatedUser.role,
            videos_used_this_month: updatedUser.videosUsedThisMonth,
            total_amount_paid_fcfa: updatedUser.totalAmountPaidFcfa,
            plan_period_start: updatedUser.planPeriodStart,
            plan_updated_at: updatedUser.planUpdatedAt,
            updated_at: new Date().toISOString(),
          },
          'email'
        ),
        mirrorToSupabaseRest('donations', {
          user_id: updatedUser.id,
          amount: planSpec.priceFcfa,
          currency: 'XOF',
          provider: provider || 'wave',
          status: 'succeeded',
          cause: `Abonnement Vidéo ${planSpec.name} - Le Sanctuaire`,
          donor_name: updatedUser.fullName,
          donor_email: cleanEmail,
          transaction_reference: txRef,
        }),
      ]);

      const status = await getUserSubscriptionStatus(cleanEmail);
      res.json({ ok: true, user: updatedUser, status, transactionReference: txRef });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Erreur activation forfait.' });
    }
  });

  app.get('/api/reports', async (req, res) => {
    try {
      const reports = await listUserReports();
      res.json({ ok: true, reports });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Failed to fetch reports', reports: [] });
    }
  });

  app.post('/api/reports', async (req, res) => {
    try {
      const { reporterEmail, reporterName, category, subject, description, pageContext } = req.body || {};
      if (!subject || !String(subject).trim() || !description || !String(description).trim()) {
        return res.status(400).json({ ok: false, error: 'Veuillez renseigner un objet et une description.' });
      }
      const report = await createUserReport({
        reporterEmail,
        reporterName,
        category,
        subject: String(subject),
        description: String(description),
        pageContext: pageContext ? String(pageContext) : 'accueil',
      });
      await mirrorToSupabaseRest('user_reports', {
        reporter_email: report.reporterEmail,
        reporter_name: report.reporterName,
        category: report.category,
        subject: report.subject,
        description: report.description,
        page_context: report.pageContext,
        status: report.status,
      });
      res.json({ ok: true, report });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Erreur lors de l’envoi du signalement.' });
    }
  });

  app.patch('/api/reports/:id', async (req, res) => {
    try {
      const { adminEmail, status, adminNote } = req.body || {};
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au Super Admin.' });
      }
      const updated = await updateUserReportStatus(
        String(req.params.id),
        (status as any) || 'resolved',
        adminNote
      );
      res.json({ ok: true, report: updated });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Erreur mise à jour signalement.' });
    }
  });

  const fetchAllExternalAccountRows = async () => {
    const [externalProfiles, externalUsers, externalAuthUsers, externalSubLogs, externalDonations] =
      await Promise.all([
        querySupabaseRest('profiles', 'select=*&order=last_connected_at.desc&limit=500'),
        querySupabaseRest('users', 'select=*&order=updated_at.desc&limit=500'),
        fetchSupabaseAuthUsersServer(),
        querySupabaseRest('email_logs', 'email_type=eq.sub_state&order=created_at.desc&limit=500'),
        querySupabaseRest('donations', 'status=neq.failed&select=donor_email,amount&limit=500'),
      ]);

    const normalizedAuth = externalAuthUsers.map((au: any) => {
      const meta = au.user_metadata || au.raw_user_meta_data || {};
      return {
        id: au.id,
        email: au.email,
        full_name: meta.full_name || meta.name,
        first_name: meta.first_name,
        last_name: meta.last_name,
        last_connected_at: au.last_sign_in_at || au.updated_at || au.created_at,
        created_at: au.created_at,
      };
    });

    const normalizedSubLogs = externalSubLogs
      .map((l: any) => {
        try {
          const parsed = JSON.parse(l.subject || '{}');
          return {
            email: l.sender_email,
            plan: parsed.plan,
            role: parsed.role,
            videos_used_this_month: parsed.videosUsedThisMonth,
            total_videos_created: parsed.totalVideosCreated,
            total_amount_paid_fcfa: parsed.totalAmountPaidFcfa,
            time_spent_seconds: parsed.timeSpentSeconds,
            last_connected_at: parsed.lastConnectedAt || l.created_at,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const paidByEmail = new Map<string, number>();
    for (const d of externalDonations) {
      const em = String(d?.donor_email || '').trim().toLowerCase();
      if (em) paidByEmail.set(em, (paidByEmail.get(em) || 0) + (Number(d.amount) || 0));
    }
    const donationPatches = Array.from(paidByEmail.entries()).map(([email, total]) => ({
      email,
      total_amount_paid_fcfa: total,
    }));

    return [
      ...normalizedAuth,
      ...externalUsers,
      ...normalizedSubLogs,
      ...donationPatches,
      ...externalProfiles,
    ];
  };

  app.get('/api/admin/overview', async (req, res) => {
    try {
      const adminEmail = String(req.query.adminEmail || req.headers['x-admin-email'] || '');
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au compte Super Admin.' });
      }
      const [externalProfiles, externalVideos, externalReports, externalDaily] = await Promise.all([
        fetchAllExternalAccountRows(),
        querySupabaseRest('video_creations', 'select=*&order=created_at.desc&limit=500'),
        querySupabaseRest('user_reports', 'select=*&order=created_at.desc&limit=200'),
        querySupabaseRest('site_analytics_daily', 'select=*&order=date.desc&limit=30'),
      ]);
      const overview = await buildAdminOverviewPayload({
        externalProfiles,
        externalVideos,
        externalReports,
        externalDaily,
      });
      res.json({ ok: true, supabaseConnected: Boolean(getServerSupabaseCreds()), ...overview });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Erreur chargement tableau admin.' });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      const adminEmail = String(req.query.adminEmail || req.headers['x-admin-email'] || '');
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au compte Super Admin.' });
      }
      const externalProfiles = await fetchAllExternalAccountRows();
      const users = await mergeExternalProfilesIntoAnalytics(externalProfiles);
      res.json({ ok: true, users });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Erreur chargement utilisateurs.', users: [] });
    }
  });

  app.post('/api/admin', async (req, res) => {
    try {
      const action = String(req.query.action || '').trim().toLowerCase();
      if (action !== 'resync') {
        return res.status(404).json({ ok: false, error: 'Action admin introuvable.' });
      }
      const adminEmail = String(req.body?.adminEmail || req.headers['x-admin-email'] || '');
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au Super Admin.' });
      }
      const extraAccounts = Array.isArray(req.body?.accounts) ? req.body.accounts : [];
      for (const acc of extraAccounts) {
        if (!acc?.email) continue;
        await syncAnalyticsProfileOnConnect({
          id: acc.id,
          email: acc.email,
          fullName: acc.fullName || acc.full_name,
          firstName: acc.firstName || acc.first_name,
          lastName: acc.lastName || acc.last_name,
          cityName: acc.cityName || acc.city_name || 'Dakar',
        });
      }
      const merged = await mergeExternalProfilesIntoAnalytics(await fetchAllExternalAccountRows());
      let syncedToSupabase = 0;
      for (const u of merged) {
        const resMirror = await mirrorProfileAndUserToSupabase({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          firstName: u.firstName,
          lastName: u.lastName,
          cityName: u.cityName,
          analyticsProfile: u,
        });
        if (resMirror.usersOk || resMirror.profilesOk) {
          syncedToSupabase += 1;
        }
      }
      res.json({
        ok: true,
        supabaseConnected: Boolean(getServerSupabaseCreds()),
        totalProcessed: merged.length,
        syncedToSupabase,
      });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Erreur resynchronisation Supabase.' });
    }
  });

  app.post('/api/admin/users/:email/plan', async (req, res) => {
    try {
      const targetEmail = decodeURIComponent(req.params.email || '').trim().toLowerCase();
      const { adminEmail, plan, recordPayment } = req.body || {};
      if (!isSuperAdminEmail(adminEmail)) {
        return res.status(403).json({ ok: false, error: 'Accès réservé au compte Super Admin.' });
      }
      const normalized = normalizePlanId(plan);
      const addPaymentFcfa = recordPayment ? VIDEO_PLANS[normalized]?.priceFcfa || 0 : 0;
      const updatedUser = await setUserPlanForAccount({
        targetEmail,
        newPlan: normalized,
        addPaymentFcfa,
        resetMonthlyQuota: true,
      });

      await mirrorToSupabaseRest(
        'profiles',
        {
          id: updatedUser.id,
          email: targetEmail,
          full_name: updatedUser.fullName,
          first_name: updatedUser.firstName,
          last_name: updatedUser.lastName,
          city_name: updatedUser.cityName,
          role: updatedUser.role,
          plan: updatedUser.plan,
          videos_used_this_month: updatedUser.videosUsedThisMonth,
          total_videos_created: updatedUser.totalVideosCreated,
          total_amount_paid_fcfa: updatedUser.totalAmountPaidFcfa,
          time_spent_seconds: updatedUser.timeSpentSeconds,
          plan_period_start: updatedUser.planPeriodStart,
          plan_updated_at: updatedUser.planUpdatedAt,
          updated_at: new Date().toISOString(),
        },
        'email'
      );

      res.json({ ok: true, user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error?.message || 'Erreur autorisation forfait.' });
    }
  });

  // ============================================================================
  // 5. VITE MIDDLEWARE / STATIC ASSETS
  // ============================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
