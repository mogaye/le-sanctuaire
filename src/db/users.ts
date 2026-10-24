import { db } from './index.ts';
import {
  users,
  profiles,
  prayerLogs,
  donations,
  emailLogs,
} from './schema.ts';
import { eq, desc, and, ilike } from 'drizzle-orm';

function hasDatabaseConfig(): boolean {
  return Boolean(
    process.env.SQL_HOST ||
    process.env.DATABASE_URL ||
    process.env.PGHOST
  );
}

// In-Memory store fallback (resilient across sessions without external DB)
const memoryUsers = new Map<string, any>();
const memoryProfiles = new Map<string, any>();
const memoryPrayerLogs = new Map<string, any>();
const memoryDonations: any[] = [];
const memoryEmailLogs: any[] = [];

export interface DonorReviewRecord {
  id: string;
  name: string;
  email?: string;
  city?: string;
  rating: number;
  comment: string;
  isDonor?: boolean;
  createdAt: string;
}

const memoryReviews: DonorReviewRecord[] = [
  {
    id: 'rev_1',
    name: 'Cheikh Ahmadou Bamba Diop',
    email: 'ahmadou.diop@sanctuaire.sn',
    city: 'Dakar',
    rating: 5,
    comment: 'Alhamdoulillah, cette application m’aide énormément à maintenir la ponctualité de mes 5 prières quotidiennes. La boussole Qibla et le Coran sont fluides.',
    isDonor: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'rev_2',
    name: 'Fatou Binetou Ndiaye',
    email: 'fatou.ndiaye@sanctuaire.sn',
    city: 'Thiès',
    rating: 5,
    comment: 'Une réalisation magnifique pour notre communauté musulmane. Le guide illustré pas-à-pas de la prière est particulièrement pédagogique.',
    isDonor: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'rev_3',
    name: 'Moussa Traoré',
    email: 'moussa.traore@sanctuaire.sn',
    city: 'Saint-Louis',
    rating: 5,
    comment: 'La synchronisation entre mon téléphone et mon ordinateur est instantanée. Qu’Allah récompense grandement l’équipe.',
    isDonor: true,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

export async function getOrCreateUser(
  uid: string,
  email: string,
  fullName?: string,
  firstName?: string,
  lastName?: string,
  avatarUrl?: string
) {
  const cleanEmail = email.trim().toLowerCase();
  const resolvedFull = fullName || cleanEmail.split('@')[0] || 'Fidèle';
  const resolvedFirst = firstName || resolvedFull.split(' ')[0] || 'Fidèle';
  const resolvedLast = lastName || resolvedFull.split(' ').slice(1).join(' ') || '';

  if (hasDatabaseConfig()) {
    try {
      const profile = await upsertConnectedProfile({
        id: uid,
        email: cleanEmail,
        fullName: resolvedFull,
        firstName: resolvedFirst,
        lastName: resolvedLast,
        avatarUrl,
      });

      const existingUsers = await db
        .select()
        .from(users)
        .where(ilike(users.email, cleanEmail));

      return existingUsers[0] || profile;
    } catch (error) {
      console.warn('Database query failed in getOrCreateUser (using in-memory fallback):', error);
    }
  }

  // In-memory fallback
  let user = memoryUsers.get(cleanEmail);
  if (!user) {
    user = {
      id: memoryUsers.size + 1,
      uid,
      email: cleanEmail,
      fullName: resolvedFull,
      firstName: resolvedFirst,
      lastName: resolvedLast,
      avatarUrl: avatarUrl || null,
      cityName: 'Dakar',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryUsers.set(cleanEmail, user);
  }
  memoryProfiles.set(cleanEmail, {
    id: uid,
    email: cleanEmail,
    fullName: resolvedFull,
    firstName: resolvedFirst,
    lastName: resolvedLast,
    avatarUrl: avatarUrl || null,
    cityName: 'Dakar',
    lastConnectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return user;
}

export async function upsertConnectedProfile(data: {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  cityName?: string;
}) {
  const cleanEmail = data.email.trim().toLowerCase();
  const defaultId =
    cleanEmail === 'mgaye60000@gmail.com'
      ? 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4'
      : data.id || `acct_${cleanEmail}`;
  const resolvedFull = data.fullName || cleanEmail.split('@')[0] || 'Fidèle';
  const resolvedFirst = data.firstName || resolvedFull.split(' ')[0] || 'Fidèle';
  const resolvedLast = data.lastName || resolvedFull.split(' ').slice(1).join(' ') || '';

  if (hasDatabaseConfig()) {
    try {
      // 1. Upsert into users table
      const existingUsersByEmail = await db
        .select()
        .from(users)
        .where(ilike(users.email, cleanEmail));

      let canonicalUid = defaultId;

      if (existingUsersByEmail.length > 0) {
        canonicalUid = existingUsersByEmail[0].uid || defaultId;
        await db
          .update(users)
          .set({
            email: cleanEmail,
            fullName: resolvedFull,
            firstName: resolvedFirst,
            lastName: resolvedLast,
            avatarUrl: data.avatarUrl || existingUsersByEmail[0].avatarUrl || null,
            cityName: data.cityName || existingUsersByEmail[0].cityName || 'Dakar',
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUsersByEmail[0].id));
      } else {
        await db
          .insert(users)
          .values({
            uid: canonicalUid,
            email: cleanEmail,
            fullName: resolvedFull,
            firstName: resolvedFirst,
            lastName: resolvedLast,
            avatarUrl: data.avatarUrl || null,
            cityName: data.cityName || 'Dakar',
          })
          .onConflictDoUpdate({
            target: users.uid,
            set: {
              email: cleanEmail,
              fullName: resolvedFull,
              firstName: resolvedFirst,
              lastName: resolvedLast,
              avatarUrl: data.avatarUrl || null,
              cityName: data.cityName || 'Dakar',
              updatedAt: new Date(),
            },
          });
      }

      // 2. Upsert into profiles table
      const existingProfilesByEmail = await db
        .select()
        .from(profiles)
        .where(ilike(profiles.email, cleanEmail));

      if (existingProfilesByEmail.length > 0) {
        const updated = await db
          .update(profiles)
          .set({
            email: cleanEmail,
            fullName: resolvedFull,
            firstName: resolvedFirst,
            lastName: resolvedLast,
            avatarUrl: data.avatarUrl || existingProfilesByEmail[0].avatarUrl || null,
            cityName: data.cityName || existingProfilesByEmail[0].cityName || 'Dakar',
            lastConnectedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, existingProfilesByEmail[0].id))
          .returning();
        return updated[0];
      } else {
        const result = await db
          .insert(profiles)
          .values({
            id: canonicalUid,
            email: cleanEmail,
            fullName: resolvedFull,
            firstName: resolvedFirst,
            lastName: resolvedLast,
            avatarUrl: data.avatarUrl || null,
            cityName: data.cityName || 'Dakar',
            lastConnectedAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: profiles.id,
            set: {
              email: cleanEmail,
              fullName: resolvedFull,
              firstName: resolvedFirst,
              lastName: resolvedLast,
              lastConnectedAt: new Date(),
              updatedAt: new Date(),
            },
          })
          .returning();

        return result[0];
      }
    } catch (error) {
      console.warn('Database query failed in upsertConnectedProfile (using in-memory fallback):', error);
    }
  }

  // In-memory fallback
  const existingProfile = memoryProfiles.get(cleanEmail);
  const profileRecord = {
    id: existingProfile?.id || defaultId,
    email: cleanEmail,
    fullName: resolvedFull,
    firstName: resolvedFirst,
    lastName: resolvedLast,
    avatarUrl: data.avatarUrl || existingProfile?.avatarUrl || null,
    cityName: data.cityName || existingProfile?.cityName || 'Dakar',
    country: 'Sénégal',
    calculationMethod: 'MuslimWorldLeague',
    themePreference: 'dark',
    lastConnectedAt: new Date(),
    createdAt: existingProfile?.createdAt || new Date(),
    updatedAt: new Date(),
  };
  memoryProfiles.set(cleanEmail, profileRecord);
  memoryUsers.set(cleanEmail, {
    id: memoryUsers.size + 1,
    uid: profileRecord.id,
    email: cleanEmail,
    fullName: resolvedFull,
    firstName: resolvedFirst,
    lastName: resolvedLast,
    avatarUrl: profileRecord.avatarUrl,
    cityName: profileRecord.cityName,
    createdAt: profileRecord.createdAt,
    updatedAt: profileRecord.updatedAt,
  });
  return profileRecord;
}

export async function getAllConnectedProfiles() {
  if (hasDatabaseConfig()) {
    try {
      return await db
        .select()
        .from(profiles)
        .orderBy(desc(profiles.lastConnectedAt));
    } catch (error) {
      console.warn('Database query failed in getAllConnectedProfiles (using in-memory fallback):', error);
    }
  }

  return Array.from(memoryProfiles.values()).sort(
    (a, b) => new Date(b.lastConnectedAt || 0).getTime() - new Date(a.lastConnectedAt || 0).getTime()
  );
}

export async function getPrayerLogFromDb(userId: string, date: string) {
  const cleanId = userId.trim().toLowerCase();
  if (hasDatabaseConfig()) {
    try {
      const rows = await db
        .select()
        .from(prayerLogs)
        .where(and(eq(prayerLogs.userId, cleanId), eq(prayerLogs.date, date)));
      return rows[0] || null;
    } catch (error) {
      console.warn('Database query failed in getPrayerLogFromDb (using in-memory fallback):', error);
    }
  }

  return memoryPrayerLogs.get(`${cleanId}_${date}`) || null;
}

export async function getAllPrayerLogsForUserFromDb(userId: string) {
  const cleanId = userId.trim().toLowerCase();
  if (hasDatabaseConfig()) {
    try {
      const rows = await db
        .select()
        .from(prayerLogs)
        .where(eq(prayerLogs.userId, cleanId))
        .orderBy(desc(prayerLogs.date));
      return rows;
    } catch (error) {
      console.warn('Database query failed in getAllPrayerLogsForUserFromDb (using in-memory fallback):', error);
    }
  }

  const results: any[] = [];
  for (const [key, val] of memoryPrayerLogs.entries()) {
    if (key.startsWith(`${cleanId}_`)) {
      results.push(val);
    }
  }
  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export async function upsertPrayerLogInDb(
  userId: string,
  date: string,
  prayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  completed: boolean
) {
  const cleanId = userId.trim().toLowerCase();
  if (hasDatabaseConfig()) {
    try {
      const existing = await getPrayerLogFromDb(cleanId, date);
      if (existing) {
        const updated = await db
          .update(prayerLogs)
          .set({ [prayerKey]: completed, updatedAt: new Date() })
          .where(eq(prayerLogs.id, existing.id))
          .returning();
        return updated[0];
      } else {
        const inserted = await db
          .insert(prayerLogs)
          .values({
            userId: cleanId,
            date,
            [prayerKey]: completed,
          })
          .returning();
        return inserted[0];
      }
    } catch (error) {
      console.warn('Database query failed in upsertPrayerLogInDb (using in-memory fallback):', error);
    }
  }

  const key = `${cleanId}_${date}`;
  const existing = memoryPrayerLogs.get(key) || {
    id: memoryPrayerLogs.size + 1,
    userId: cleanId,
    date,
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
    createdAt: new Date(),
  };
  const updated = {
    ...existing,
    [prayerKey]: completed,
    updatedAt: new Date(),
  };
  memoryPrayerLogs.set(key, updated);
  return updated;
}

export async function upsertFullPrayerLogInDb(
  userId: string,
  date: string,
  log: { fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean }
) {
  const cleanId = userId.trim().toLowerCase();
  if (hasDatabaseConfig()) {
    try {
      const existing = await getPrayerLogFromDb(cleanId, date);
      if (existing) {
        const updated = await db
          .update(prayerLogs)
          .set({
            fajr: Boolean(log.fajr),
            dhuhr: Boolean(log.dhuhr),
            asr: Boolean(log.asr),
            maghrib: Boolean(log.maghrib),
            isha: Boolean(log.isha),
            updatedAt: new Date(),
          })
          .where(eq(prayerLogs.id, existing.id))
          .returning();
        return updated[0];
      } else {
        const inserted = await db
          .insert(prayerLogs)
          .values({
            userId: cleanId,
            date,
            fajr: Boolean(log.fajr),
            dhuhr: Boolean(log.dhuhr),
            asr: Boolean(log.asr),
            maghrib: Boolean(log.maghrib),
            isha: Boolean(log.isha),
          })
          .returning();
        return inserted[0];
      }
    } catch (error) {
      console.warn('Database query failed in upsertFullPrayerLogInDb (using in-memory fallback):', error);
    }
  }

  const key = `${cleanId}_${date}`;
  const existing = memoryPrayerLogs.get(key);
  const updated = {
    id: existing?.id || memoryPrayerLogs.size + 1,
    userId: cleanId,
    date,
    fajr: Boolean(log.fajr),
    dhuhr: Boolean(log.dhuhr),
    asr: Boolean(log.asr),
    maghrib: Boolean(log.maghrib),
    isha: Boolean(log.isha),
    createdAt: existing?.createdAt || new Date(),
    updatedAt: new Date(),
  };
  memoryPrayerLogs.set(key, updated);
  return updated;
}

export async function getUserSyncStateFromDb(email: string): Promise<Record<string, any> | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (hasDatabaseConfig()) {
    try {
      const rows = await db
        .select()
        .from(emailLogs)
        .where(and(eq(emailLogs.emailType, 'user_sync_state'), eq(emailLogs.senderEmail, cleanEmail)))
        .orderBy(desc(emailLogs.id));

      if (rows.length && rows[0].bodyPreview) {
        return JSON.parse(rows[0].bodyPreview);
      }
    } catch (error) {
      console.warn('Database query failed in getUserSyncStateFromDb (using in-memory fallback):', error);
    }
  }

  const entry = memoryEmailLogs
    .filter((e) => e.emailType === 'user_sync_state' && e.senderEmail === cleanEmail)
    .pop();
  if (entry && entry.bodyPreview) {
    try {
      return JSON.parse(entry.bodyPreview);
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveUserSyncStateInDb(
  email: string,
  stateObj: Record<string, any>
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const serialized = JSON.stringify(stateObj);

  if (hasDatabaseConfig()) {
    try {
      const existing = await db
        .select()
        .from(emailLogs)
        .where(and(eq(emailLogs.emailType, 'user_sync_state'), eq(emailLogs.senderEmail, cleanEmail)))
        .orderBy(desc(emailLogs.id));

      if (existing.length > 0) {
        await db
          .update(emailLogs)
          .set({
            bodyPreview: serialized,
            subject: `sync_${Date.now()}`,
          })
          .where(eq(emailLogs.id, existing[0].id));
      } else {
        await db.insert(emailLogs).values({
          senderEmail: cleanEmail,
          recipientEmail: cleanEmail,
          subject: `sync_${Date.now()}`,
          bodyPreview: serialized,
          emailType: 'user_sync_state',
          status: 'synced',
        });
      }
      return;
    } catch (error) {
      console.warn('Database query failed in saveUserSyncStateInDb (using in-memory fallback):', error);
    }
  }

  const existingIdx = memoryEmailLogs.findIndex(
    (e) => e.emailType === 'user_sync_state' && e.senderEmail === cleanEmail
  );
  if (existingIdx >= 0) {
    memoryEmailLogs[existingIdx].bodyPreview = serialized;
    memoryEmailLogs[existingIdx].subject = `sync_${Date.now()}`;
  } else {
    memoryEmailLogs.push({
      id: memoryEmailLogs.length + 1,
      senderEmail: cleanEmail,
      recipientEmail: cleanEmail,
      subject: `sync_${Date.now()}`,
      bodyPreview: serialized,
      emailType: 'user_sync_state',
      status: 'synced',
      createdAt: new Date(),
    });
  }
}

export async function insertDonationInDb(data: {
  userId?: string;
  amount: string;
  currency: string;
  provider: string;
  status: string;
  cause: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  transactionReference?: string;
}) {
  const cleanEmail = data.donorEmail ? data.donorEmail.trim().toLowerCase() : undefined;
  let resolvedUserId =
    data.userId ||
    (cleanEmail === 'mgaye60000@gmail.com'
      ? 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4'
      : cleanEmail
        ? `acct_${cleanEmail}`
        : null);
  let resolvedDonorName =
    data.donorName || (cleanEmail ? cleanEmail.split('@')[0] : 'Donateur Sadaqah');

  const numericAmount = Number(data.amount);
  const resolvedAmount =
    !isNaN(numericAmount) && numericAmount > 0 ? String(numericAmount) : '5000';

  if (hasDatabaseConfig()) {
    try {
      if (cleanEmail && cleanEmail.includes('@')) {
        try {
          const syncedProfile = await upsertConnectedProfile({
            id: resolvedUserId || `acct_${cleanEmail}`,
            email: cleanEmail,
            fullName: resolvedDonorName,
          });
          if (syncedProfile?.id) {
            resolvedUserId = syncedProfile.id;
          }
          if (syncedProfile?.fullName) {
            resolvedDonorName = syncedProfile.fullName;
          }
        } catch {
          // non-fatal
        }
      }

      if (data.transactionReference) {
        const existingRef = await db
          .select()
          .from(donations)
          .where(eq(donations.transactionReference, data.transactionReference));
        if (existingRef.length > 0) {
          const updated = await db
            .update(donations)
            .set({
              userId: resolvedUserId || existingRef[0].userId,
              amount: resolvedAmount,
              donorName: resolvedDonorName || existingRef[0].donorName,
              donorEmail: cleanEmail || existingRef[0].donorEmail,
              status: data.status || existingRef[0].status,
            })
            .where(eq(donations.id, existingRef[0].id))
            .returning();
          return updated[0];
        }
      }

      const result = await db
        .insert(donations)
        .values({
          userId: resolvedUserId,
          amount: resolvedAmount,
          currency: data.currency || 'XOF',
          provider: data.provider || 'wave',
          status: data.status || 'succeeded',
          cause: data.cause || 'Sadaqah Jariyah - Le Sanctuaire',
          donorName: resolvedDonorName,
          donorEmail: cleanEmail || null,
          donorPhone: data.donorPhone || null,
          isAnonymous: Boolean(data.isAnonymous),
          transactionReference: data.transactionReference || null,
        })
        .returning();
      return result[0];
    } catch (error) {
      console.warn('Database query failed in insertDonationInDb (using in-memory fallback):', error);
    }
  }

  const record = {
    id: memoryDonations.length + 1,
    userId: resolvedUserId,
    amount: resolvedAmount,
    currency: data.currency || 'XOF',
    provider: data.provider || 'wave',
    status: data.status || 'succeeded',
    cause: data.cause || 'Sadaqah Jariyah - Le Sanctuaire',
    donorName: resolvedDonorName,
    donorEmail: cleanEmail || null,
    donorPhone: data.donorPhone || null,
    isAnonymous: Boolean(data.isAnonymous),
    transactionReference: data.transactionReference || `DON-${Date.now()}`,
    createdAt: new Date(),
  };
  memoryDonations.push(record);
  return record;
}

export async function checkDonorStatusInDb(email?: string, userId?: string): Promise<boolean> {
  if (hasDatabaseConfig()) {
    try {
      if (email) {
        const rows = await db
          .select()
          .from(donations)
          .where(ilike(donations.donorEmail, email.trim()));
        if (rows.some((r) => r.status !== 'failed')) return true;
      }
      if (userId) {
        const rows = await db
          .select()
          .from(donations)
          .where(eq(donations.userId, userId));
        if (rows.some((r) => r.status !== 'failed')) return true;
      }
    } catch (error) {
      console.warn('Database query failed in checkDonorStatusInDb (using in-memory fallback):', error);
    }
  }

  const cleanEmail = email ? email.trim().toLowerCase() : null;
  return memoryDonations.some((d) => {
    if (d.status === 'failed') return false;
    if (cleanEmail && d.donorEmail && d.donorEmail.toLowerCase() === cleanEmail) return true;
    if (userId && d.userId && d.userId === userId) return true;
    return false;
  });
}

export async function logSentEmailInDb(data: {
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  bodyPreview?: string;
  emailType?: string;
  status?: string;
}) {
  if (hasDatabaseConfig()) {
    try {
      const result = await db
        .insert(emailLogs)
        .values({
          senderEmail: data.senderEmail,
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          bodyPreview: data.bodyPreview || null,
          emailType: data.emailType || 'general',
          status: data.status || 'sent',
        })
        .returning();
      return result[0];
    } catch (error) {
      console.warn('Database query failed in logSentEmailInDb (using in-memory fallback):', error);
    }
  }

  const entry = {
    id: memoryEmailLogs.length + 1,
    senderEmail: data.senderEmail,
    recipientEmail: data.recipientEmail,
    subject: data.subject,
    bodyPreview: data.bodyPreview || null,
    emailType: data.emailType || 'general',
    status: data.status || 'sent',
    createdAt: new Date(),
  };
  memoryEmailLogs.push(entry);
  return entry;
}

export async function getSentEmailsFromDb() {
  if (hasDatabaseConfig()) {
    try {
      return await db
        .select()
        .from(emailLogs)
        .orderBy(desc(emailLogs.createdAt));
    } catch (error) {
      console.warn('Database query failed in getSentEmailsFromDb (using in-memory fallback):', error);
    }
  }

  return [...memoryEmailLogs].reverse();
}

export async function insertDonorReviewInDb(data: {
  name: string;
  email?: string;
  city?: string;
  rating: number;
  comment: string;
  isDonor?: boolean;
}): Promise<DonorReviewRecord> {
  const cleanName = (data.name || 'Membre du Sanctuaire').trim();
  const cleanEmail = (data.email || 'membre@sanctuaire.app').trim().toLowerCase();
  const rating = Math.min(5, Math.max(1, Number(data.rating) || 5));
  const cleanComment = data.comment.trim();

  let verifiedDonor = Boolean(data.isDonor);
  if (
    !verifiedDonor &&
    cleanEmail &&
    cleanEmail !== 'membre@sanctuaire.app' &&
    cleanEmail !== 'donateur@sanctuaire.app'
  ) {
    try {
      verifiedDonor = await checkDonorStatusInDb(cleanEmail);
    } catch {
      // ignore
    }
  }

  const metaJson = JSON.stringify({
    name: cleanName,
    city: data.city || 'Sénégal',
    rating,
    isDonor: verifiedDonor,
  });

  const record: DonorReviewRecord = {
    id: 'rev_' + Date.now(),
    name: cleanName,
    email: cleanEmail,
    city: data.city || 'Sénégal',
    rating,
    comment: cleanComment,
    isDonor: verifiedDonor,
    createdAt: new Date().toISOString(),
  };

  memoryReviews.unshift(record);

  if (hasDatabaseConfig()) {
    try {
      const inserted = await db
        .insert(emailLogs)
        .values({
          senderEmail: cleanEmail,
          recipientEmail: 'landing_page_reviews',
          subject: metaJson,
          bodyPreview: cleanComment,
          emailType: 'donor_review',
          status: 'published',
        })
        .returning();

      if (inserted[0]) {
        record.id = String(inserted[0].id);
      }
    } catch (error) {
      console.warn('Database query failed in insertDonorReviewInDb (using in-memory review):', error);
    }
  }

  return record;
}

export async function getDonorReviewsFromDb(): Promise<DonorReviewRecord[]> {
  if (hasDatabaseConfig()) {
    try {
      const [rows, donationRows] = await Promise.all([
        db
          .select()
          .from(emailLogs)
          .where(eq(emailLogs.emailType, 'donor_review'))
          .orderBy(desc(emailLogs.createdAt)),
        db.select().from(donations),
      ]);

      const donorEmails = new Set(
        donationRows
          .filter((d) => d.status !== 'failed' && d.donorEmail)
          .map((d) => String(d.donorEmail).trim().toLowerCase())
      );
      const donorNames = new Set(
        donationRows
          .filter((d) => d.status !== 'failed' && d.donorName)
          .map((d) => String(d.donorName).trim().toLowerCase())
      );

      const dbReviews = rows
        .map((r) => {
          let meta: { name?: string; city?: string; rating?: number; isDonor?: boolean } = {};
          try {
            meta = JSON.parse(r.subject || '{}');
          } catch {
            meta = { name: r.subject || 'Membre du Sanctuaire' };
          }
          const emailLower = (r.senderEmail || '').trim().toLowerCase();
          const nameLower = (meta.name || '').trim().toLowerCase();
          const isDonor = Boolean(
            meta.isDonor ||
              (emailLower &&
                emailLower !== 'membre@sanctuaire.app' &&
                emailLower !== 'donateur@sanctuaire.app' &&
                donorEmails.has(emailLower)) ||
              (nameLower && donorNames.has(nameLower))
          );
          return {
            id: String(r.id),
            name: meta.name || r.senderEmail.split('@')[0] || 'Membre du Sanctuaire',
            email: r.senderEmail,
            city: meta.city || 'Dakar',
            rating: Number(meta.rating) || 5,
            comment: r.bodyPreview || '',
            isDonor,
            createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
          };
        })
        .filter((r) => Boolean(r.comment));

      if (dbReviews.length > 0) {
        return dbReviews;
      }
    } catch (error) {
      console.warn('Database query failed in getDonorReviewsFromDb (using in-memory fallback):', error);
    }
  }

  return memoryReviews;
}
