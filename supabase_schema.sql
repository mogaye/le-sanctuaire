-- ==============================================================================
-- SCRIPT COMPLET SUPABASE (SCHEMA PUBLIC) POUR LE SANCTUAIRE (TOUTES LES 7 TABLES)
-- Dans votre tableau de bord Supabase (à gauche, icône "SQL Editor" sous "Table Editor"),
-- collez l'intégralité de ce script et cliquez sur "Run" (Exécuter).
-- Aucun compte ni donneur n'est codé en dur : chaque utilisateur, donneur, prière,
-- favori du Coran, Tasbih/Dhikr et e-mail est enregistré et lié automatiquement.
-- ==============================================================================

-- ==============================================================================
-- 1. TABLE : public.users (Tous les comptes utilisateurs)
-- ==============================================================================
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

CREATE UNIQUE INDEX IF NOT EXISTS users_uid_unique_idx ON public.users (uid);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des users" ON public.users;
DROP POLICY IF EXISTS "Gestion des users" ON public.users;
CREATE POLICY "Gestion des users"
  ON public.users FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 2. TABLE : public.profiles (Profils détaillés & préférences des comptes)
-- ==============================================================================
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

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_id TEXT DEFAULT 'dakar';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_name TEXT DEFAULT 'Dakar';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Sénégal';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calculation_method TEXT DEFAULT 'MuslimWorldLeague';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_connected_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx ON public.profiles (email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les profils sont visibles par leur propriétaire" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Insertion automatique de profil" ON public.profiles;
DROP POLICY IF EXISTS "Lecture publique des profils" ON public.profiles;
DROP POLICY IF EXISTS "Gestion des profils" ON public.profiles;
CREATE POLICY "Gestion des profils"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Déclencheur 1A : Inscription / connexion via Supabase Auth (auth.users) -> synchronise public.profiles ET public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_full TEXT;
  v_first TEXT;
  v_last TEXT;
BEGIN
  v_email := LOWER(TRIM(COALESCE(NEW.email, '')));
  IF v_email = '' THEN
    RETURN NEW;
  END IF;

  v_full := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), SPLIT_PART(v_email, '@', 1));
  v_first := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), SPLIT_PART(v_full, ' ', 1));
  v_last := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), '');

  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, last_connected_at, updated_at)
  VALUES (NEW.id::text, v_email, v_full, v_first, v_last, TIMEZONE('utc', NOW()), TIMEZONE('utc', NOW()))
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
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    updated_at = TIMEZONE('utc', NOW());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Déclencheur 1B : Chaque profil ajouté/modifié dans public.profiles est automatiquement enregistré dans public.users
CREATE OR REPLACE FUNCTION public.sync_profile_to_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND TRIM(NEW.email) <> '' THEN
    INSERT INTO public.users (uid, email, full_name, first_name, last_name, avatar_url, city_name, updated_at)
    VALUES (
      COALESCE(NULLIF(TRIM(NEW.id), ''), 'acct_' || LOWER(TRIM(NEW.email))),
      LOWER(TRIM(NEW.email)),
      COALESCE(NEW.full_name, SPLIT_PART(LOWER(TRIM(NEW.email)), '@', 1)),
      COALESCE(NEW.first_name, SPLIT_PART(COALESCE(NEW.full_name, LOWER(TRIM(NEW.email))), ' ', 1)),
      COALESCE(NEW.last_name, ''),
      NEW.avatar_url,
      COALESCE(NEW.city_name, 'Dakar'),
      TIMEZONE('utc', NOW())
    )
    ON CONFLICT (uid) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
      last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      city_name = COALESCE(EXCLUDED.city_name, public.users.city_name),
      updated_at = TIMEZONE('utc', NOW());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_sync_to_users ON public.profiles;
CREATE TRIGGER on_profile_sync_to_users
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_users();

-- Synchronisation dynamique des comptes déjà présents dans auth.users (sans aucun e-mail codé en dur)
INSERT INTO public.profiles (id, email, full_name, first_name, last_name, city_name)
SELECT
  id::text,
  LOWER(TRIM(email)),
  COALESCE(raw_user_meta_data->>'full_name', SPLIT_PART(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'first_name', SPLIT_PART(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'last_name', ''),
  'Dakar'
FROM auth.users
WHERE email IS NOT NULL AND TRIM(email) <> ''
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (uid, email, full_name, first_name, last_name, city_name)
SELECT
  id,
  LOWER(TRIM(email)),
  full_name,
  first_name,
  last_name,
  COALESCE(city_name, 'Dakar')
FROM public.profiles
WHERE email IS NOT NULL AND TRIM(email) <> ''
ON CONFLICT (uid) DO NOTHING;

-- ==============================================================================
-- 3. TABLE : public.prayer_logs (Suivi quotidien des 5 prières pour chaque fidèle)
-- ==============================================================================
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

ALTER TABLE public.prayer_logs DROP CONSTRAINT IF EXISTS prayer_logs_user_id_fkey;
ALTER TABLE public.prayer_logs ALTER COLUMN user_id TYPE TEXT USING user_id::text;
CREATE UNIQUE INDEX IF NOT EXISTS prayer_logs_user_id_date_idx ON public.prayer_logs (user_id, date);

ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "L'utilisateur consulte ses propres journaux de prière" ON public.prayer_logs;
DROP POLICY IF EXISTS "L'utilisateur insère son journal de prière" ON public.prayer_logs;
DROP POLICY IF EXISTS "L'utilisateur met à jour son journal de prière" ON public.prayer_logs;
DROP POLICY IF EXISTS "Gestion prayer_logs" ON public.prayer_logs;
CREATE POLICY "Gestion prayer_logs"
  ON public.prayer_logs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_prayer_log_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.user_id := LOWER(TRIM(COALESCE(NULLIF(NEW.user_id, ''), 'visiteur_anonyme')));
  NEW.fajr := COALESCE(NEW.fajr, FALSE);
  NEW.dhuhr := COALESCE(NEW.dhuhr, FALSE);
  NEW.asr := COALESCE(NEW.asr, FALSE);
  NEW.maghrib := COALESCE(NEW.maghrib, FALSE);
  NEW.isha := COALESCE(NEW.isha, FALSE);
  NEW.updated_at := TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_prayer_log_before_write ON public.prayer_logs;
CREATE TRIGGER on_prayer_log_before_write
  BEFORE INSERT OR UPDATE ON public.prayer_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_prayer_log_before_write();

-- ==============================================================================
-- 4. TABLE : public.donations (Tous les donneurs Sadaqah / Wave / Orange Money / PayDunya)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 5000,
  currency TEXT DEFAULT 'XOF' NOT NULL,
  provider TEXT DEFAULT 'wave' NOT NULL,
  status TEXT DEFAULT 'succeeded' NOT NULL,
  cause TEXT DEFAULT 'Sadaqah Jariyah - Le Sanctuaire' NOT NULL,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  transaction_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_user_id_fkey;
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_provider_check;
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_amount_check;
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_currency_check;
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_status_check;
ALTER TABLE public.donations ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.donations ALTER COLUMN amount SET DEFAULT 5000;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "L'utilisateur consulte ses propres dons" ON public.donations;
DROP POLICY IF EXISTS "Tout le monde peut créer un enregistrement de don" ON public.donations;
DROP POLICY IF EXISTS "Donations publiques en lecture (stats globales)" ON public.donations;
DROP POLICY IF EXISTS "Tout le monde peut enregistrer une intention de don" ON public.donations;
DROP POLICY IF EXISTS "Gestion donations" ON public.donations;
CREATE POLICY "Gestion donations"
  ON public.donations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_donation_donor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_uid TEXT;
BEGIN
  v_email := LOWER(TRIM(COALESCE(NEW.donor_email, '')));
  v_name := COALESCE(NULLIF(TRIM(NEW.donor_name), ''), SPLIT_PART(v_email, '@', 1), 'Donateur Sadaqah');

  IF v_email <> '' AND POSITION('@' IN v_email) > 0 THEN
    SELECT id INTO v_uid FROM public.profiles WHERE LOWER(email) = v_email LIMIT 1;
    IF v_uid IS NULL THEN
      v_uid := COALESCE(NULLIF(TRIM(NEW.user_id), ''), 'acct_' || v_email);
    END IF;
    NEW.user_id := v_uid;
    NEW.donor_email := v_email;
    NEW.donor_name := v_name;

    INSERT INTO public.profiles (id, email, full_name, first_name, city_name, last_connected_at, updated_at)
    VALUES (v_uid, v_email, v_name, SPLIT_PART(v_name, ' ', 1), 'Dakar', TIMEZONE('utc', NOW()), TIMEZONE('utc', NOW()))
    ON CONFLICT (email) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      updated_at = TIMEZONE('utc', NOW());

    INSERT INTO public.users (uid, email, full_name, first_name, city_name, updated_at)
    VALUES (v_uid, v_email, v_name, SPLIT_PART(v_name, ' ', 1), 'Dakar', TIMEZONE('utc', NOW()))
    ON CONFLICT (uid) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      updated_at = TIMEZONE('utc', NOW());
  ELSE
    NEW.donor_name := v_name;
    IF NEW.user_id IS NULL OR TRIM(NEW.user_id) = '' THEN
      NEW.user_id := 'guest_' || COALESCE(NEW.transaction_reference, EXTRACT(EPOCH FROM NOW())::TEXT);
    END IF;
  END IF;

  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    NEW.amount := 5000;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_donation_before_insert ON public.donations;
CREATE TRIGGER on_donation_before_insert
  BEFORE INSERT ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_donation_donor();

-- ==============================================================================
-- 5. TABLE : public.quran_favorites (Favoris & Marque-pages du Noble Coran)
-- ==============================================================================
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

ALTER TABLE public.quran_favorites DROP CONSTRAINT IF EXISTS quran_favorites_user_id_fkey;
ALTER TABLE public.quran_favorites ALTER COLUMN user_id TYPE TEXT USING user_id::text;
CREATE UNIQUE INDEX IF NOT EXISTS quran_favorites_user_surah_ayah_idx
  ON public.quran_favorites (user_id, surah_number, ayah_number);

ALTER TABLE public.quran_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestion quran_favorites" ON public.quran_favorites;
CREATE POLICY "Gestion quran_favorites"
  ON public.quran_favorites FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_quran_favorite_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.user_id := LOWER(TRIM(COALESCE(NULLIF(NEW.user_id, ''), 'visiteur_anonyme')));
  NEW.surah_name := COALESCE(NULLIF(TRIM(NEW.surah_name), ''), 'Sourate ' || NEW.surah_number::text);
  NEW.ayah_text := COALESCE(NEW.ayah_text, '');
  NEW.ayah_translation := COALESCE(NEW.ayah_translation, '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_quran_favorite_before_write ON public.quran_favorites;
CREATE TRIGGER on_quran_favorite_before_write
  BEFORE INSERT OR UPDATE ON public.quran_favorites
  FOR EACH ROW EXECUTE FUNCTION public.handle_quran_favorite_before_write();

-- ==============================================================================
-- 6. TABLE : public.dhikr_logs (Suivi quotidien du Tasbih & Invocations Adhkar)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dhikr_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  dhikr_phrase TEXT NOT NULL,
  count INT DEFAULT 0 NOT NULL,
  target INT DEFAULT 33,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, date, dhikr_phrase)
);

ALTER TABLE public.dhikr_logs DROP CONSTRAINT IF EXISTS dhikr_logs_user_id_fkey;
ALTER TABLE public.dhikr_logs ALTER COLUMN user_id TYPE TEXT USING user_id::text;
CREATE UNIQUE INDEX IF NOT EXISTS dhikr_logs_user_date_phrase_idx
  ON public.dhikr_logs (user_id, date, dhikr_phrase);

ALTER TABLE public.dhikr_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "L'utilisateur gère son Dhikr" ON public.dhikr_logs;
DROP POLICY IF EXISTS "Gestion dhikr_logs" ON public.dhikr_logs;
CREATE POLICY "Gestion dhikr_logs"
  ON public.dhikr_logs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_dhikr_log_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.user_id := LOWER(TRIM(COALESCE(NULLIF(NEW.user_id, ''), 'visiteur_anonyme')));
  NEW.date := COALESCE(NULLIF(TRIM(NEW.date), ''), TO_CHAR(TIMEZONE('utc', NOW()), 'YYYY-MM-DD'));
  NEW.dhikr_phrase := COALESCE(NULLIF(TRIM(NEW.dhikr_phrase), ''), 'SubhanAllah');
  NEW.target := COALESCE(NULLIF(NEW.target, 0), 33);
  NEW.count := GREATEST(0, COALESCE(NEW.count, 0));
  NEW.completed := (NEW.count >= NEW.target) OR COALESCE(NEW.completed, FALSE);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_dhikr_log_before_write ON public.dhikr_logs;
CREATE TRIGGER on_dhikr_log_before_write
  BEFORE INSERT OR UPDATE ON public.dhikr_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_dhikr_log_before_write();

-- ==============================================================================
-- 7. TABLE : public.email_logs (Historique des e-mails, avis donateurs & synchro)
-- ==============================================================================
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

CREATE OR REPLACE FUNCTION public.handle_email_log_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.sender_email := LOWER(TRIM(COALESCE(NULLIF(NEW.sender_email, ''), 'system@sanctuaire.app')));
  NEW.recipient_email := LOWER(TRIM(COALESCE(NULLIF(NEW.recipient_email, ''), 'user@sanctuaire.app')));
  NEW.subject := COALESCE(NEW.subject, 'Notification Le Sanctuaire');
  NEW.email_type := COALESCE(NULLIF(TRIM(NEW.email_type), ''), 'general');
  NEW.status := COALESCE(NULLIF(TRIM(NEW.status), ''), 'sent');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_email_log_before_write ON public.email_logs;
CREATE TRIGGER on_email_log_before_write
  BEFORE INSERT ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_log_before_write();
