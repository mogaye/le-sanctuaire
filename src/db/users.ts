import { db } from './index.ts';
import {
  users,
  profiles,
  prayerLogs,
  donations,
  quranFavorites,
  emailLogs,
} from './schema.ts';
import { eq, desc, and, ilike } from 'drizzle-orm';

export async function getOrCreateUser(
  uid: string,
  email: string,
  fullName?: string,
  firstName?: string,
  lastName?: string,
  avatarUrl?: string
) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const resolvedFull = fullName || cleanEmail.split('@')[0] || 'Fidèle';
    const resolvedFirst = firstName || resolvedFull.split(' ')[0] || 'Fidèle';
    const resolvedLast = lastName || resolvedFull.split(' ').slice(1).join(' ') || '';

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
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
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
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const defaultId =
      cleanEmail === 'mgaye60000@gmail.com'
        ? 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4'
        : data.id || `acct_${cleanEmail}`;
    const resolvedFull = data.fullName || cleanEmail.split('@')[0] || 'Fidèle';
    const resolvedFirst = data.firstName || resolvedFull.split(' ')[0] || 'Fidèle';
    const resolvedLast = data.lastName || resolvedFull.split(' ').slice(1).join(' ') || '';

    // 1. Upsert into users table (matching by email first so no duplicates are created)
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

    // 2. Upsert into profiles table (matching by email first)
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
    console.error('Database query failed in upsertConnectedProfile:', error);
    throw new Error('Failed to save profile.', { cause: error });
  }
}

export async function getAllConnectedProfiles() {
  try {
    return await db
      .select()
      .from(profiles)
      .orderBy(desc(profiles.lastConnectedAt));
  } catch (error) {
    console.error('Database query failed in getAllConnectedProfiles:', error);
    throw new Error('Failed to fetch connected accounts.', { cause: error });
  }
}

export async function getPrayerLogFromDb(userId: string, date: string) {
  try {
    const cleanId = userId.trim().toLowerCase();
    const rows = await db
      .select()
      .from(prayerLogs)
      .where(and(eq(prayerLogs.userId, cleanId), eq(prayerLogs.date, date)));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getPrayerLogFromDb:', error);
    throw new Error('Failed to fetch prayer log.', { cause: error });
  }
}

export async function getAllPrayerLogsForUserFromDb(userId: string) {
  try {
    const cleanId = userId.trim().toLowerCase();
    const rows = await db
      .select()
      .from(prayerLogs)
      .where(eq(prayerLogs.userId, cleanId))
      .orderBy(desc(prayerLogs.date));
    return rows;
  } catch (error) {
    console.error('Database query failed in getAllPrayerLogsForUserFromDb:', error);
    return [];
  }
}

export async function upsertPrayerLogInDb(
  userId: string,
  date: string,
  prayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  completed: boolean
) {
  try {
    const cleanId = userId.trim().toLowerCase();
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
    console.error('Database query failed in upsertPrayerLogInDb:', error);
    throw new Error('Failed to update prayer log.', { cause: error });
  }
}

export async function upsertFullPrayerLogInDb(
  userId: string,
  date: string,
  log: { fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean }
) {
  try {
    const cleanId = userId.trim().toLowerCase();
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
    console.error('Database query failed in upsertFullPrayerLogInDb:', error);
    return null;
  }
}

export async function getUserSyncStateFromDb(email: string): Promise<Record<string, any> | null> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const rows = await db
      .select()
      .from(emailLogs)
      .where(and(eq(emailLogs.emailType, 'user_sync_state'), eq(emailLogs.senderEmail, cleanEmail)))
      .orderBy(desc(emailLogs.id));

    if (!rows.length || !rows[0].bodyPreview) return null;
    return JSON.parse(rows[0].bodyPreview);
  } catch (error) {
    console.error('Database query failed in getUserSyncStateFromDb:', error);
    return null;
  }
}

export async function saveUserSyncStateInDb(
  email: string,
  stateObj: Record<string, any>
): Promise<void> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const serialized = JSON.stringify(stateObj);
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
  } catch (error) {
    console.error('Database query failed in saveUserSyncStateInDb:', error);
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
  try {
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

    const numericAmount = Number(data.amount);
    const resolvedAmount =
      !isNaN(numericAmount) && numericAmount > 0 ? String(numericAmount) : '5000';

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
    console.error('Database query failed in insertDonationInDb:', error);
    throw new Error('Failed to record donation.', { cause: error });
  }
}

export async function checkDonorStatusInDb(email?: string, userId?: string): Promise<boolean> {
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
    return false;
  } catch (error) {
    console.error('Database query failed in checkDonorStatusInDb:', error);
    throw new Error('Failed to check donation status.', { cause: error });
  }
}

export async function logSentEmailInDb(data: {
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  bodyPreview?: string;
  emailType?: string;
  status?: string;
}) {
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
    console.error('Database query failed in logSentEmailInDb:', error);
    throw new Error('Failed to log email.', { cause: error });
  }
}

export async function getSentEmailsFromDb() {
  try {
    return await db
      .select()
      .from(emailLogs)
      .orderBy(desc(emailLogs.createdAt));
  } catch (error) {
    console.error('Database query failed in getSentEmailsFromDb:', error);
    throw new Error('Failed to fetch email logs.', { cause: error });
  }
}

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

    const row = inserted[0];
    return {
      id: String(row.id),
      name: cleanName,
      email: cleanEmail,
      city: data.city || 'Sénégal',
      rating,
      comment: cleanComment,
      isDonor: verifiedDonor,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in insertDonorReviewInDb:', error);
    return {
      id: 'local_' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      city: data.city || 'Sénégal',
      rating,
      comment: cleanComment,
      isDonor: verifiedDonor,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function getDonorReviewsFromDb(): Promise<DonorReviewRecord[]> {
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

    return rows
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
  } catch (error) {
    console.error('Database query failed in getDonorReviewsFromDb:', error);
    return [];
  }
}

