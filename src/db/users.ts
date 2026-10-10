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

    const result = await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        fullName: resolvedFull,
        firstName: resolvedFirst,
        lastName: resolvedLast,
        avatarUrl: avatarUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: cleanEmail,
          fullName: resolvedFull,
          firstName: resolvedFirst,
          lastName: resolvedLast,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Also synchronize into profiles table so all connected accounts are tracked
    await db
      .insert(profiles)
      .values({
        id: uid,
        email: cleanEmail,
        fullName: resolvedFull,
        firstName: resolvedFirst,
        lastName: resolvedLast,
        avatarUrl: avatarUrl || null,
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
      });

    return result[0];
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
    const resolvedFull = data.fullName || cleanEmail.split('@')[0] || 'Fidèle';
    const resolvedFirst = data.firstName || resolvedFull.split(' ')[0] || 'Fidèle';
    const resolvedLast = data.lastName || resolvedFull.split(' ').slice(1).join(' ') || '';

    const result = await db
      .insert(profiles)
      .values({
        id: data.id || `acct_${cleanEmail}`,
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
    const rows = await db
      .select()
      .from(prayerLogs)
      .where(and(eq(prayerLogs.userId, userId), eq(prayerLogs.date, date)));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getPrayerLogFromDb:', error);
    throw new Error('Failed to fetch prayer log.', { cause: error });
  }
}

export async function upsertPrayerLogInDb(
  userId: string,
  date: string,
  prayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  completed: boolean
) {
  try {
    const existing = await getPrayerLogFromDb(userId, date);
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
          userId,
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
    const result = await db
      .insert(donations)
      .values({
        userId: data.userId || null,
        amount: data.amount,
        currency: data.currency,
        provider: data.provider,
        status: data.status,
        cause: data.cause,
        donorName: data.donorName || null,
        donorEmail: data.donorEmail || null,
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
