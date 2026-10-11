import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
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
  DonorReviewRecord,
} from './src/db/users.ts';

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
      ''
    ).trim();
    const isValidKey =
      key.length > 15 &&
      !key.includes('your-anon-public-key') &&
      !key.includes('VOTRE_CLE');
    return isValidKey ? { url, key } : null;
  };

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

      // Mirror to Supabase REST API if key is present in env
      await Promise.all([
        mirrorToSupabaseRest(
          'users',
          {
            uid: resolvedId,
            email: cleanEmail,
            full_name: resolvedFull,
            first_name: resolvedFirst,
            last_name: resolvedLast,
            avatar_url: avatarUrl || null,
            city_name: cityName || 'Dakar',
            updated_at: new Date().toISOString(),
          },
          'uid'
        ),
        mirrorToSupabaseRest(
          'profiles',
          {
            id: resolvedId,
            email: cleanEmail,
            full_name: resolvedFull,
            first_name: resolvedFirst,
            last_name: resolvedLast,
            avatar_url: avatarUrl || null,
            city_name: cityName || 'Dakar',
            last_connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          'email'
        ),
      ]);

      res.json({ profile });
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
      const { name, email, city, rating, comment } = req.body || {};
      if (!comment || !String(comment).trim()) {
        return res.status(400).json({ error: 'Veuillez écrire votre avis.' });
      }
      const saved = await insertDonorReviewInDb({
        name: String(name || 'Membre Bienfaiteur').trim(),
        email: email ? String(email).trim() : undefined,
        city: String(city || 'Dakar').trim(),
        rating: Number(rating) || 5,
        comment: String(comment).trim(),
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
