-- ==============================================================================
-- SCHEMA SUPABASE POUR LE SANCTUAIRE ISLAMIQUE
-- Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase :
-- https://supabase.com/dashboard/project/bkfklfnnturdwtfjoxci/sql
-- ==============================================================================

-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  city_name TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Active le Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour les profils
CREATE POLICY "Les utilisateurs peuvent consulter leur propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent créer leur propre profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Déclencheur automatique pour créer un profil dès l'inscription auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Table de suivi des prières quotidiennes (Prayer Logs)
CREATE TABLE IF NOT EXISTS public.prayer_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  fajr BOOLEAN DEFAULT FALSE,
  dhuhr BOOLEAN DEFAULT FALSE,
  asr BOOLEAN DEFAULT FALSE,
  maghrib BOOLEAN DEFAULT FALSE,
  isha BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs voient leurs propres prières"
  ON public.prayer_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs enregistrent leurs propres prières"
  ON public.prayer_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs mettent à jour leurs propres prières"
  ON public.prayer_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Table des dons (Donations)
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF' NOT NULL,
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  cause TEXT NOT NULL,
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  transaction_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent consulter leurs propres dons"
  ON public.donations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Permettre l'insertion d'un don pour tous (authentifié ou invité)"
  ON public.donations FOR INSERT
  WITH CHECK (true);

-- 5. Table des favoris du Coran (Bookmarks)
CREATE TABLE IF NOT EXISTS public.quran_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  surah_number INT NOT NULL,
  ayah_number INT NOT NULL,
  surah_name TEXT NOT NULL,
  ayah_text TEXT NOT NULL,
  ayah_translation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, surah_number, ayah_number)
);

ALTER TABLE public.quran_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs gèrent leurs versets favoris"
  ON public.quran_favorites FOR ALL
  USING (auth.uid() = user_id);
