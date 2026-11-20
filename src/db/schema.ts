import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Table: users (Firebase Auth UID mapping)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  cityName: text('city_name').default('Dakar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Table: profiles (Supabase-compatible profiles table for user accounts)
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  cityId: text('city_id').default('dakar'),
  cityName: text('city_name').default('Dakar'),
  country: text('country').default('Sénégal'),
  calculationMethod: text('calculation_method').default('MuslimWorldLeague'),
  themePreference: text('theme_preference').default('dark'),
  role: text('role').default('user'),
  plan: text('plan').default('test'),
  videosUsedThisMonth: integer('videos_used_this_month').default(0).notNull(),
  totalVideosCreated: integer('total_videos_created').default(0).notNull(),
  totalAmountPaidFcfa: numeric('total_amount_paid_fcfa', { precision: 12, scale: 2 }).default('0').notNull(),
  timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
  planPeriodStart: timestamp('plan_period_start').defaultNow().notNull(),
  planUpdatedAt: timestamp('plan_updated_at').defaultNow().notNull(),
  lastConnectedAt: timestamp('last_connected_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Table: prayer_logs (Daily 5 prayers tracking)
export const prayerLogs = pgTable('prayer_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  fajr: boolean('fajr').default(false).notNull(),
  dhuhr: boolean('dhuhr').default(false).notNull(),
  asr: boolean('asr').default(false).notNull(),
  maghrib: boolean('maghrib').default(false).notNull(),
  isha: boolean('isha').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Table: donations (Donations ledger via PayDunya / Wave / Direct)
export const donations = pgTable('donations', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('XOF').notNull(),
  provider: text('provider').notNull(),
  status: text('status').default('pending').notNull(),
  cause: text('cause').default('general').notNull(),
  donorName: text('donor_name'),
  donorEmail: text('donor_email'),
  donorPhone: text('donor_phone'),
  isAnonymous: boolean('is_anonymous').default(false),
  transactionReference: text('transaction_reference'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Table: quran_favorites (Quran verse bookmarks)
export const quranFavorites = pgTable('quran_favorites', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  surahNumber: integer('surah_number').notNull(),
  ayahNumber: integer('ayah_number').notNull(),
  surahName: text('surah_name').notNull(),
  ayahText: text('ayah_text').notNull(),
  ayahTranslation: text('ayah_translation').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Table: dhikr_logs (Tasbih & Dhikr counter logs)
export const dhikrLogs = pgTable('dhikr_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  dhikrPhrase: text('dhikr_phrase').notNull(),
  count: integer('count').default(0).notNull(),
  target: integer('target').default(33),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Table: email_logs (Outbox & email verification / notification logs)
export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  senderEmail: text('sender_email').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').notNull(),
  bodyPreview: text('body_preview'),
  emailType: text('email_type').default('general').notNull(), // 'verification', 'welcome', 'notification'
  status: text('status').default('sent').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Table: video_creations (Created & saved Quran videos ledger)
export const videoCreations = pgTable('video_creations', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),
  planAtCreation: text('plan_at_creation').default('test').notNull(),
  surahSummary: text('surah_summary').notNull(),
  verseCount: integer('verse_count').default(1).notNull(),
  quality: text('quality').default('720p').notNull(),
  aspectRatio: text('aspect_ratio').default('9:16').notNull(),
  hadWatermark: boolean('had_watermark').default(true).notNull(),
  durationSec: integer('duration_sec').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Table: user_reports (Signalements & retours utilisateurs)
export const userReports = pgTable('user_reports', {
  id: serial('id').primaryKey(),
  reporterEmail: text('reporter_email'),
  reporterName: text('reporter_name'),
  category: text('category').default('bug').notNull(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  pageContext: text('page_context').default('accueil').notNull(),
  status: text('status').default('open').notNull(), // 'open', 'in_progress', 'resolved'
  adminNote: text('admin_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. Table: site_analytics_daily (Courbes journalières : visites, comptes, comptes payants, vidéos)
export const siteAnalyticsDaily = pgTable('site_analytics_daily', {
  date: text('date').primaryKey(), // YYYY-MM-DD
  visits: integer('visits').default(0).notNull(),
  signups: integer('signups').default(0).notNull(),
  paidUpgrades: integer('paid_upgrades').default(0).notNull(),
  videosCreated: integer('videos_created').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  prayerLogs: many(prayerLogs),
}));
