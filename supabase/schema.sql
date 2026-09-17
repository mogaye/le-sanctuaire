-- ==============================================================================
-- LE SANCTUAIRE - SUPABASE DATABASE SCHEMA
-- Schéma complet PostgreSQL pour Supabase avec Row Level Security (RLS) & Triggers
-- ==============================================================================

-- Activer l'extension pgcrypto si nécessaire pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABLE: PROFILES (Profils Utilisateurs liés à auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  city_id TEXT DEFAULT 'dakar',
  city_name TEXT DEFAULT 'Dakar',
  country TEXT DEFAULT 'Sénégal',
  calculation_method TEXT DEFAULT 'MuslimWorldLeague',
  asr_method TEXT DEFAULT 'standard',
  theme_preference TEXT DEFAULT 'dark',
  daily_goal_dhikr INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sécurité RLS pour profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les profils sont visibles par leur propriétaire" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Insertion automatique de profil" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Trigger pour synchroniser automatiquement auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    first_name, 
    last_name, 
    avatar_url
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 2. TABLE: PRAYER_LOGS (Suivi et renouvellement quotidien des 5 prières)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.prayer_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL, -- Format YYYY-MM-DD
  fajr BOOLEAN DEFAULT FALSE NOT NULL,
  dhuhr BOOLEAN DEFAULT FALSE NOT NULL,
  asr BOOLEAN DEFAULT FALSE NOT NULL,
  maghrib BOOLEAN DEFAULT FALSE NOT NULL,
  isha BOOLEAN DEFAULT FALSE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "L'utilisateur consulte ses propres journaux de prière" 
  ON public.prayer_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "L'utilisateur insère son journal de prière" 
  ON public.prayer_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "L'utilisateur met à jour son journal de prière" 
  ON public.prayer_logs FOR UPDATE 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. TABLE: USER_BOOKMARKS (Favoris Coran & Versets)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  surah_number INTEGER NOT NULL,
  ayah_number INTEGER NOT NULL,
  surah_name_ar TEXT,
  surah_name_fr TEXT,
  ayah_text_ar TEXT,
  ayah_text_fr TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, surah_number, ayah_number)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "L'utilisateur gère ses favoris Coran" 
  ON public.user_bookmarks FOR ALL 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. TABLE: DHIKR_LOGS (Historique des invocations et chapelet électronique)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dhikr_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  dhikr_phrase TEXT NOT NULL,
  count INTEGER DEFAULT 0 NOT NULL,
  target INTEGER DEFAULT 33,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.dhikr_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "L'utilisateur gère son Dhikr" 
  ON public.dhikr_logs FOR ALL 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. TABLE: DONATIONS (Dons Sadaqah via Wave Sénégal/CI & DunyaPay)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'XOF' NOT NULL, -- XOF (FCFA), EUR, USD
  provider TEXT NOT NULL CHECK (provider IN ('wave', 'dunyapay', 'direct_transfer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  cause TEXT DEFAULT 'general' NOT NULL, -- 'general', 'quran_printing', 'app_maintenance', 'sadaqah_jariyah'
  donor_name TEXT,
  donor_email TEXT,
  donor_phone TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  transaction_reference TEXT,
  provider_checkout_id TEXT,
  provider_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs connectés peuvent voir leurs propres dons
CREATE POLICY "L'utilisateur consulte ses propres dons" 
  ON public.donations FOR SELECT 
  USING (auth.uid() = user_id);

-- Tout utilisateur (même anonyme) peut initier un don
CREATE POLICY "Tout le monde peut créer un enregistrement de don" 
  ON public.donations FOR INSERT 
  WITH CHECK (true);

-- ==============================================================================
-- 6. TABLE: DAILY_REFLECTIONS (Renouvellement quotidien des versets et hadiths)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_reflections (
  id SERIAL PRIMARY KEY,
  day_of_year INTEGER NOT NULL UNIQUE, -- 1 à 366
  surah_name TEXT NOT NULL,
  verse_reference TEXT NOT NULL,
  verse_arabic TEXT NOT NULL,
  verse_translation TEXT NOT NULL,
  verse_theme TEXT NOT NULL,
  hadith_arabic TEXT,
  hadith_text TEXT NOT NULL,
  hadith_narrator TEXT NOT NULL,
  hadith_source TEXT NOT NULL,
  spiritual_advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- Table publique en lecture pour tous les visiteurs
CREATE POLICY "Tout le monde peut lire les méditations quotidiennes" 
  ON public.daily_reflections FOR SELECT 
  USING (true);

-- Index pour des performances optimales
CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_date ON public.prayer_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON public.user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_user ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reflections_day ON public.daily_reflections(day_of_year);

-- ==============================================================================
-- 7. DONNÉES INITIALES POUR LE RENOUVELLEMENT QUOTIDIEN (Échantillon de départ)
-- ==============================================================================
INSERT INTO public.daily_reflections (day_of_year, surah_name, verse_reference, verse_arabic, verse_translation, verse_theme, hadith_text, hadith_narrator, hadith_source, spiritual_advice)
VALUES 
(
  1,
  'Al-Baqarah',
  'Sourate 2, Verset 186',
  'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
  'Et quand Mes serviteurs te demandent à Mon sujet, Je suis alors tout proche : Je réponds à l''appel de celui qui M''implore lorsqu''il M''implore.',
  'Proximité divine et exaucement des invocations',
  'L''invocation est l''essence même de l''adoration (Ad-Du''a houwa al-''ibadah).',
  'An-Nu''man ibn Bashir',
  'At-Tirmidhi (Sahih)',
  'Prenez quelques minutes aujourd''hui après chaque prière pour faire vos douas personnels avec sincérité et confiance.'
),
(
  2,
  'Al-Inshirah',
  'Sourate 94, Verset 5-6',
  'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا',
  'À côté de la difficulté est, certes, une facilité ! Oui, à côté de la difficulté est, certes, une facilité !',
  'Patience et soulagement dans l''épreuve',
  'Sache que la victoire accompagne l''endurance, que le soulagement accompagne l''affliction, et qu''avec la difficulté vient la facilité.',
  'Ibn Abbas',
  'Rapporté par Ahmad et At-Tirmidhi',
  'Rappelez-vous qu''aucune difficulté n''est permanente ; chaque épreuve porte en son sein la graine du soulagement.'
),
(
  3,
  'Ar-Ra''d',
  'Sourate 13, Verset 28',
  'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  'Ceux qui ont cru et dont les cœurs se tranquillisent à l''évocation d''Allah. N''est-ce point par l''évocation d''Allah que les cœurs se tranquillisent ?',
  'La paix intérieure par le Dhikr',
  'L''exemple de celui qui invoque son Seigneur et de celui qui ne l''invoque pas est comme l''exemple du vivant et du mort.',
  'Abu Musa Al-Ash''ari',
  'Sahih Al-Bukhari (6407)',
  'Faites 33 SubhanAllah, 33 Alhamdulillah et 34 Allahu Akbar pour illuminer votre journée.'
)
ON CONFLICT (day_of_year) DO NOTHING;
