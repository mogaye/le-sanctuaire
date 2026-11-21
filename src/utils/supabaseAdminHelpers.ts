import {
  getEffectivePlanId,
  getPlanRules,
  getRemainingVideos,
  isSuperAdminEmail,
  normalizePlanId,
  SubscriptionPlanId,
} from './subscriptionPlans';

export const SUPABASE_TABLE_NAMES = [
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
] as const;

export type SupabaseTableName = (typeof SUPABASE_TABLE_NAMES)[number];

export interface MergedAdminAccount {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  cityName: string;
  role: 'admin' | 'user';
  plan: SubscriptionPlanId;
  videosUsedThisMonth: number;
  totalVideosCreated: number;
  remainingVideos: number | null;
  monthlyLimit: number | null;
  totalAmountPaidFcfa: number;
  timeSpentSeconds: number;
  lastConnectedAt: string;
  createdAt: string;
}

const PLAN_PRIORITY: Record<SubscriptionPlanId, number> = {
  test: 1,
  basique: 2,
  pro: 3,
  max: 4,
  admin: 5,
};

function pickHigherOrNewerPlan(
  email: string,
  prevPlan: SubscriptionPlanId | undefined,
  nextRawPlan: string | undefined
): SubscriptionPlanId {
  if (isSuperAdminEmail(email)) return 'admin';
  const prev = normalizePlanId(prevPlan);
  const next = nextRawPlan ? normalizePlanId(nextRawPlan) : prev;
  if (!prevPlan) return next;
  if (!nextRawPlan) return prev;
  return PLAN_PRIORITY[next] >= PLAN_PRIORITY[prev] ? next : prev;
}

export function mergeAccountSources(params: {
  serverUsers?: Array<Record<string, any>>;
  supabaseProfiles?: Array<Record<string, any>>;
  supabaseUsers?: Array<Record<string, any>>;
  localAccounts?: Array<Record<string, any>>;
}): MergedAdminAccount[] {
  const map = new Map<string, MergedAdminAccount>();

  const upsertRow = (row: Record<string, any>) => {
    const rawEmail = String(row?.email || '').trim().toLowerCase();
    if (!rawEmail || !rawEmail.includes('@')) return;

    const prev = map.get(rawEmail);
    const resolvedRole: 'admin' | 'user' = isSuperAdminEmail(rawEmail) ? 'admin' : 'user';
    const resolvedPlan = getEffectivePlanId(
      rawEmail,
      pickHigherOrNewerPlan(rawEmail, prev?.plan, row.plan)
    );
    const rules = getPlanRules(resolvedPlan, rawEmail);

    const used = Math.max(
      Number(row.videosUsedThisMonth ?? row.videos_used_this_month ?? 0) || 0,
      prev?.videosUsedThisMonth || 0
    );
    const totalVids = Math.max(
      Number(row.totalVideosCreated ?? row.total_videos_created ?? 0) || 0,
      prev?.totalVideosCreated || 0
    );
    const totalPaid = Math.max(
      Number(row.totalAmountPaidFcfa ?? row.total_amount_paid_fcfa ?? 0) || 0,
      prev?.totalAmountPaidFcfa || 0
    );
    const timeSpent = Math.max(
      Number(row.timeSpentSeconds ?? row.time_spent_seconds ?? 0) || 0,
      prev?.timeSpentSeconds || 0
    );
    const rem = getRemainingVideos(resolvedPlan, used, rawEmail);

    const candidateLastConnected = String(
      row.lastConnectedAt ||
        row.last_connected_at ||
        row.updated_at ||
        prev?.lastConnectedAt ||
        new Date().toISOString()
    );
    const candidateCreatedAt = String(
      prev?.createdAt || row.createdAt || row.created_at || new Date().toISOString()
    );

    map.set(rawEmail, {
      id: String(row.id || row.uid || prev?.id || `acct_${rawEmail}`),
      email: rawEmail,
      fullName: String(
        row.fullName ||
          row.full_name ||
          prev?.fullName ||
          rawEmail.split('@')[0] ||
          'Fidèle'
      ),
      firstName: row.firstName || row.first_name || prev?.firstName,
      lastName: row.lastName || row.last_name || prev?.lastName,
      cityName: String(row.cityName || row.city_name || prev?.cityName || 'Dakar'),
      role: resolvedRole,
      plan: resolvedPlan,
      videosUsedThisMonth: used,
      totalVideosCreated: totalVids,
      remainingVideos: Number.isFinite(rem) ? rem : null,
      monthlyLimit: Number.isFinite(rules.monthlyLimit) ? rules.monthlyLimit : null,
      totalAmountPaidFcfa: totalPaid,
      timeSpentSeconds: timeSpent,
      lastConnectedAt: candidateLastConnected,
      createdAt: candidateCreatedAt,
    });
  };

  for (const r of params.localAccounts || []) upsertRow(r);
  for (const r of params.supabaseUsers || []) upsertRow(r);
  for (const r of params.supabaseProfiles || []) upsertRow(r);
  for (const r of params.serverUsers || []) upsertRow(r);

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastConnectedAt).getTime() - new Date(a.lastConnectedAt).getTime()
  );
}

export const SUPABASE_SETUP_SQL = `-- ==============================================================================
-- SCRIPT COMPLET & IDEMPOTENT SUPABASE — LE SANCTUAIRE (10 TABLES)
-- Collez ce script dans Supabase -> SQL Editor -> New query -> Run
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users', 'profiles', 'prayer_logs', 'donations', 'quran_favorites',
        'dhikr_logs', 'email_logs', 'video_creations', 'user_reports', 'site_analytics_daily'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;

  FOR r IN (
    SELECT tc.constraint_name, tc.table_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_schema = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN (
        'users', 'profiles', 'prayer_logs', 'donations', 'quran_favorites',
        'dhikr_logs', 'email_logs', 'video_creations', 'user_reports', 'site_analytics_daily'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
  END LOOP;
END $$;

-- 1. public.users
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  city_name TEXT DEFAULT 'Dakar',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.users ALTER COLUMN uid TYPE TEXT USING uid::text;
ALTER TABLE public.users ALTER COLUMN email TYPE TEXT USING LOWER(TRIM(email::text));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city_name TEXT DEFAULT 'Dakar';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
UPDATE public.users SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;
DELETE FROM public.users a USING public.users b WHERE a.ctid < b.ctid AND a.uid = b.uid;
CREATE UNIQUE INDEX IF NOT EXISTS users_uid_unique_idx ON public.users (uid);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion des users" ON public.users;
CREATE POLICY "Gestion des users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 2. public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  city_id TEXT DEFAULT 'dakar',
  city_name TEXT DEFAULT 'Dakar',
  country TEXT DEFAULT 'Sénégal',
  calculation_method TEXT DEFAULT 'MuslimWorldLeague',
  theme_preference TEXT DEFAULT 'dark',
  role TEXT DEFAULT 'user',
  plan TEXT DEFAULT 'test',
  videos_used_this_month INT DEFAULT 0,
  total_videos_created INT DEFAULT 0,
  total_amount_paid_fcfa NUMERIC(12, 2) DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  plan_period_start TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  plan_updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  last_connected_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.profiles ALTER COLUMN email TYPE TEXT USING LOWER(TRIM(email::text));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_id TEXT DEFAULT 'dakar';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_name TEXT DEFAULT 'Dakar';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Sénégal';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calculation_method TEXT DEFAULT 'MuslimWorldLeague';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'test';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS videos_used_this_month INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_videos_created INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_amount_paid_fcfa NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS time_spent_seconds INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_period_start TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());
UPDATE public.profiles SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;
UPDATE public.profiles SET role = 'admin', plan = 'admin' WHERE LOWER(TRIM(email)) = 'mgaye60000@gmail.com';
UPDATE public.profiles SET role = COALESCE(NULLIF(role, ''), 'user'), plan = COALESCE(NULLIF(plan, ''), 'test') WHERE LOWER(TRIM(email)) <> 'mgaye60000@gmail.com';
DELETE FROM public.profiles a USING public.profiles b WHERE a.ctid < b.ctid AND a.email = b.email;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles (email);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion des profils" ON public.profiles;
CREATE POLICY "Gestion des profils" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT; v_full TEXT; v_first TEXT; v_last TEXT; v_role TEXT; v_plan TEXT;
BEGIN
  v_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  IF v_email = '' THEN RETURN NEW; END IF;
  v_full := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(v_email, '@', 1));
  v_first := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), SPLIT_PART(v_full, ' ', 1));
  v_last := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), '');
  v_role := CASE WHEN v_email = 'mgaye60000@gmail.com' THEN 'admin' ELSE 'user' END;
  v_plan := CASE WHEN v_email = 'mgaye60000@gmail.com' THEN 'admin' ELSE 'test' END;

  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, role, plan, last_connected_at, updated_at)
  VALUES (NEW.id::text, v_email, v_full, v_first, v_last, v_role, v_plan, TIMEZONE('utc', NOW()), TIMEZONE('utc', NOW()))
  ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
    last_connected_at = TIMEZONE('utc', NOW()),
    updated_at = TIMEZONE('utc', NOW());

  INSERT INTO public.users (uid, email, full_name, first_name, last_name, city_name, updated_at)
  VALUES (NEW.id::text, v_email, v_full, v_first, v_last, 'Dakar', TIMEZONE('utc', NOW()))
  ON CONFLICT (uid) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, full_name, first_name, last_name, city_name, role, plan)
SELECT id::text, LOWER(TRIM(email)), COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'first_name', SPLIT_PART(email, '@', 1)), COALESCE(raw_user_meta_data->>'last_name', ''),
  'Dakar',
  CASE WHEN LOWER(TRIM(email)) = 'mgaye60000@gmail.com' THEN 'admin' ELSE 'user' END,
  CASE WHEN LOWER(TRIM(email)) = 'mgaye60000@gmail.com' THEN 'admin' ELSE 'test' END
FROM auth.users WHERE email IS NOT NULL AND TRIM(email) <> '' ON CONFLICT (email) DO NOTHING;

-- 3..10. Tables complémentaires
CREATE TABLE IF NOT EXISTS public.prayer_logs (
  id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL,
  fajr BOOLEAN DEFAULT FALSE NOT NULL, dhuhr BOOLEAN DEFAULT FALSE NOT NULL, asr BOOLEAN DEFAULT FALSE NOT NULL,
  maghrib BOOLEAN DEFAULT FALSE NOT NULL, isha BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL, updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS prayer_logs_user_id_date_idx ON public.prayer_logs (user_id, date);
ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion prayer_logs" ON public.prayer_logs;
CREATE POLICY "Gestion prayer_logs" ON public.prayer_logs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.donations (
  id SERIAL PRIMARY KEY, user_id TEXT, amount NUMERIC(12, 2) NOT NULL DEFAULT 5000, currency TEXT DEFAULT 'XOF' NOT NULL,
  provider TEXT DEFAULT 'wave' NOT NULL, status TEXT DEFAULT 'succeeded' NOT NULL,
  cause TEXT DEFAULT 'Sadaqah Jariyah - Le Sanctuaire' NOT NULL, donor_name TEXT, donor_email TEXT, donor_phone TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE, transaction_reference TEXT, created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion donations" ON public.donations;
CREATE POLICY "Gestion donations" ON public.donations FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.quran_favorites (
  id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, surah_number INT NOT NULL, ayah_number INT NOT NULL,
  surah_name TEXT NOT NULL, ayah_text TEXT NOT NULL, ayah_translation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS quran_favorites_user_surah_ayah_idx ON public.quran_favorites (user_id, surah_number, ayah_number);
ALTER TABLE public.quran_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion quran_favorites" ON public.quran_favorites;
CREATE POLICY "Gestion quran_favorites" ON public.quran_favorites FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.dhikr_logs (
  id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL, dhikr_phrase TEXT NOT NULL,
  count INT DEFAULT 0 NOT NULL, target INT DEFAULT 33, completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS dhikr_logs_user_date_phrase_idx ON public.dhikr_logs (user_id, date, dhikr_phrase);
ALTER TABLE public.dhikr_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion dhikr_logs" ON public.dhikr_logs;
CREATE POLICY "Gestion dhikr_logs" ON public.dhikr_logs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id SERIAL PRIMARY KEY, sender_email TEXT NOT NULL, recipient_email TEXT NOT NULL, subject TEXT NOT NULL,
  body_preview TEXT, email_type TEXT DEFAULT 'verification' NOT NULL, status TEXT DEFAULT 'sent' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion email_logs" ON public.email_logs;
CREATE POLICY "Gestion email_logs" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.video_creations (
  id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, user_name TEXT, plan_at_creation TEXT DEFAULT 'test' NOT NULL,
  surah_summary TEXT NOT NULL, verse_count INT DEFAULT 1 NOT NULL, quality TEXT DEFAULT '720p' NOT NULL,
  aspect_ratio TEXT DEFAULT '9:16' NOT NULL, had_watermark BOOLEAN DEFAULT TRUE NOT NULL, duration_sec INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.video_creations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion video_creations" ON public.video_creations;
CREATE POLICY "Gestion video_creations" ON public.video_creations FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.user_reports (
  id SERIAL PRIMARY KEY, reporter_email TEXT, reporter_name TEXT, category TEXT DEFAULT 'bug' NOT NULL,
  subject TEXT NOT NULL, description TEXT NOT NULL, page_context TEXT DEFAULT 'accueil' NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL, admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL, updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion user_reports" ON public.user_reports;
CREATE POLICY "Gestion user_reports" ON public.user_reports FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.site_analytics_daily (
  date TEXT PRIMARY KEY, visits INT DEFAULT 0 NOT NULL, signups INT DEFAULT 0 NOT NULL,
  paid_upgrades INT DEFAULT 0 NOT NULL, videos_created INT DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
ALTER TABLE public.site_analytics_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gestion site_analytics_daily" ON public.site_analytics_daily;
CREATE POLICY "Gestion site_analytics_daily" ON public.site_analytics_daily FOR ALL USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
`;
