-- ==============================================================================
-- SCRIPT COMPLET SUPABASE (SCHEMA PUBLIC) POUR LE SANCTUAIRE
-- Dans votre tableau de bord Supabase (à gauche, icône "SQL Editor" sous "Table Editor"),
-- collez ce script et cliquez sur "Run" (Exécuter).
-- ==============================================================================

-- 1. Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  city_name TEXT DEFAULT 'Dakar',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Table: profiles (Comptes connectés)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  city_id TEXT DEFAULT 'dakar',
  city_name TEXT DEFAULT 'Dakar',
  country TEXT DEFAULT 'Sénégal',
  calculation_method TEXT DEFAULT 'MuslimWorldLeague',
  theme_preference TEXT DEFAULT 'dark',
  last_connected_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des profils" ON public.profiles;
CREATE POLICY "Lecture publique des profils"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Gestion des profils" ON public.profiles;
CREATE POLICY "Gestion des profils"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Déclencheur automatique lors d'une inscription via Supabase Auth (auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, last_connected_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    TIMEZONE('utc', NOW()),
    TIMEZONE('utc', NOW())
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    last_connected_at = TIMEZONE('utc', NOW()),
    updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insertion immédiate de vos comptes déjà connectés
INSERT INTO public.profiles (id, email, full_name, first_name, last_name, city_name)
VALUES
  ('acct_mgaye60000@gmail.com', 'mgaye60000@gmail.com', 'Modou Gaye', 'Modou', 'Gaye', 'Dakar'),
  ('acct_modougaye58588@gmail.com', 'modougaye58588@gmail.com', 'Modou Gaye', 'Modou', 'Gaye', 'Dakar')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (uid, email, full_name, first_name, last_name, city_name)
VALUES
  ('acct_mgaye60000@gmail.com', 'mgaye60000@gmail.com', 'Modou Gaye', 'Modou', 'Gaye', 'Dakar'),
  ('acct_modougaye58588@gmail.com', 'modougaye58588@gmail.com', 'Modou Gaye', 'Modou', 'Gaye', 'Dakar')
ON CONFLICT (uid) DO NOTHING;

-- 3. Table: prayer_logs (Suivi quotidien des 5 prières)
CREATE TABLE IF NOT EXISTS public.prayer_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  fajr BOOLEAN DEFAULT FALSE NOT NULL,
  dhuhr BOOLEAN DEFAULT FALSE NOT NULL,
  asr BOOLEAN DEFAULT FALSE NOT NULL,
  maghrib BOOLEAN DEFAULT FALSE NOT NULL,
  isha BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestion prayer_logs" ON public.prayer_logs;
CREATE POLICY "Gestion prayer_logs"
  ON public.prayer_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Table: donations (Dons PayDunya / Wave / Sadaqah)
CREATE TABLE IF NOT EXISTS public.donations (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'XOF' NOT NULL,
  provider TEXT DEFAULT 'dunyapay' NOT NULL,
  status TEXT DEFAULT 'succeeded' NOT NULL,
  cause TEXT DEFAULT 'general' NOT NULL,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  transaction_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestion donations" ON public.donations;
CREATE POLICY "Gestion donations"
  ON public.donations FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Table: quran_favorites (Favoris du Coran)
CREATE TABLE IF NOT EXISTS public.quran_favorites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  surah_number INT NOT NULL,
  ayah_number INT NOT NULL,
  surah_name TEXT NOT NULL,
  ayah_text TEXT NOT NULL,
  ayah_translation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, surah_number, ayah_number)
);

ALTER TABLE public.quran_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestion quran_favorites" ON public.quran_favorites;
CREATE POLICY "Gestion quran_favorites"
  ON public.quran_favorites FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Table: dhikr_logs (Suivi du Tasbih & Dhikr)
CREATE TABLE IF NOT EXISTS public.dhikr_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  dhikr_phrase TEXT NOT NULL,
  count INT DEFAULT 0 NOT NULL,
  target INT DEFAULT 33,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.dhikr_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestion dhikr_logs" ON public.dhikr_logs;
CREATE POLICY "Gestion dhikr_logs"
  ON public.dhikr_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Table: email_logs (Historique des e-mails d'authentification envoyés)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id SERIAL PRIMARY KEY,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_preview TEXT,
  email_type TEXT DEFAULT 'verification' NOT NULL,
  status TEXT DEFAULT 'sent' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestion email_logs" ON public.email_logs;
CREATE POLICY "Gestion email_logs"
  ON public.email_logs FOR ALL
  USING (true)
  WITH CHECK (true);
