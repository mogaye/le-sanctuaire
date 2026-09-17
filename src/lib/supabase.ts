import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

// Retrieve environment variables with the newly dedicated Supabase project as the active default
const activeProjectUrl = 'https://bkfklfnnturdwtfjoxci.supabase.co';
const activeAnonKey = 'sb_publishable_f7aV7Gkq4oxnwGcy5QcxkQ_l1valfZN';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Always use the dedicated project (or an env var if pointing to the new project)
const supabaseUrl = envUrl && envUrl.includes('bkfklfnnturdwtfjoxci') ? envUrl : activeProjectUrl;
const supabaseAnonKey = envAnonKey && !envAnonKey.includes('cX19V8m_fhJo') ? envAnonKey : activeAnonKey;

// Detect if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes('your-project-id') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0 &&
    !supabaseAnonKey.includes('your-anon-public-key')
  );
};

// Singleton instance
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Helper: current user session
export async function getCurrentUser() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
}

// Authentication: Sign In with Email & Password
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    // Fallback mode for preview when Supabase credentials aren't entered yet
    console.warn('Supabase not configured. Using local fallback.');
    return {
      data: {
        user: {
          id: 'local-user-' + Date.now(),
          email: email.trim(),
          user_metadata: { full_name: email.split('@')[0] },
        },
      },
      error: null,
      isFallback: true,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  return { data, error, isFallback: false };
}

// Authentication: Sign Up with Email & Password
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();
  const redirectUrl = window.location.origin;

  if (!supabase) {
    console.warn('Supabase not configured. Using local fallback.');
    return {
      data: {
        user: {
          id: 'local-user-' + Date.now(),
          email: cleanEmail,
          user_metadata: { full_name: cleanName, first_name: cleanName.split(' ')[0] },
        },
        session: null,
      },
      error: null,
      isFallback: true,
      needsEmailVerification: true,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        first_name: cleanName.split(' ')[0],
      },
      emailRedirectTo: redirectUrl,
    },
  });

  // When Supabase has email confirmation enabled, data.session is null until the email link is clicked
  const needsEmailVerification = !data?.session && !!data?.user;

  return {
    data,
    error,
    isFallback: false,
    needsEmailVerification,
  };
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const redirectUrl = window.location.origin;

  if (!supabase) {
    return { data: {}, error: null, isFallback: true };
  }

  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  return { data, error, isFallback: false };
}

// Authentication: Sign In with Google OAuth
export async function signInWithGoogle() {
  if (!supabase) {
    // Fallback simulated Google sign-in
    console.warn('Supabase not configured. Simulating Google OAuth.');
    return {
      data: {
        user: {
          id: 'google-user-' + Date.now(),
          email: 'utilisateur@sanctuaire.app',
          user_metadata: { full_name: 'Fidèle' },
        },
      },
      error: null,
      isFallback: true,
    };
  }

  // When inside an iframe or preview, redirect to current href
  const redirectTo = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      skipBrowserRedirect: false,
    },
  });

  return { data, error, isFallback: false };
}

// Authentication: Sign Out
export async function signOutUser() {
  if (!supabase) {
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Database: User Profile Management
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) {
    const saved = localStorage.getItem('sanctuaire_user');
    return saved ? JSON.parse(saved) : null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      name: data.full_name || data.email,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      avatarUrl: data.avatar_url,
      city: data.city_name,
    };
  } catch (e) {
    console.error('Error fetching user profile:', e);
    return null;
  }
}

export async function upsertUserProfile(userId: string, profile: Partial<UserProfile>) {
  if (!supabase) {
    try {
      const current = localStorage.getItem('sanctuaire_user');
      const parsed = current ? JSON.parse(current) : {};
      localStorage.setItem('sanctuaire_user', JSON.stringify({ ...parsed, ...profile }));
    } catch (e) {
      // ignore
    }
    return;
  }

  try {
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: profile.name,
      first_name: profile.firstName,
      last_name: profile.lastName,
      avatar_url: profile.avatarUrl,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Error updating user profile in Supabase:', e);
  }
}

// Database: Daily Prayer Completion Tracking
export interface DailyPrayerLog {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export async function fetchDailyPrayerLog(userId: string, date: string): Promise<DailyPrayerLog> {
  const defaultLog: DailyPrayerLog = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };

  if (!supabase) {
    try {
      const local = localStorage.getItem(`prayer_log_${date}`);
      return local ? JSON.parse(local) : defaultLog;
    } catch {
      return defaultLog;
    }
  }

  try {
    const { data, error } = await supabase
      .from('prayer_logs')
      .select('fajr, dhuhr, asr, maghrib, isha')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error || !data) {
      return defaultLog;
    }

    return {
      fajr: !!data.fajr,
      dhuhr: !!data.dhuhr,
      asr: !!data.asr,
      maghrib: !!data.maghrib,
      isha: !!data.isha,
    };
  } catch (e) {
    console.error('Error loading prayer log:', e);
    return defaultLog;
  }
}

export async function updateDailyPrayerLog(
  userId: string,
  date: string,
  prayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  completed: boolean
) {
  // Always save locally for instant UI update & offline reliability
  try {
    const currentLocal = localStorage.getItem(`prayer_log_${date}`);
    const parsed = currentLocal
      ? JSON.parse(currentLocal)
      : { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
    parsed[prayerKey] = completed;
    localStorage.setItem(`prayer_log_${date}`, JSON.stringify(parsed));
  } catch (e) {
    // ignore
  }

  if (!supabase) return;

  try {
    const { data: existing } = await supabase
      .from('prayer_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (existing) {
      await supabase
        .from('prayer_logs')
        .update({ [prayerKey]: completed, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase.from('prayer_logs').insert({
        user_id: userId,
        date,
        [prayerKey]: completed,
      });
    }
  } catch (e) {
    console.error('Error updating prayer log in Supabase:', e);
  }
}

// Database: Record Donation in Supabase
export interface DonationRecord {
  amount: number;
  currency: 'XOF' | 'EUR' | 'USD';
  provider: 'wave' | 'dunyapay' | 'direct_transfer';
  status: 'pending' | 'succeeded' | 'failed';
  cause: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  transactionReference?: string;
  userId?: string;
}

export async function recordDonationInSupabase(donation: DonationRecord) {
  // Local persistence backup
  try {
    const history = JSON.parse(localStorage.getItem('sanctuaire_donations') || '[]');
    history.push({ ...donation, date: new Date().toISOString() });
    localStorage.setItem('sanctuaire_donations', JSON.stringify(history));
  } catch (e) {
    // ignore
  }

  if (!supabase) {
    return { success: true, localOnly: true };
  }

  try {
    const { data, error } = await supabase.from('donations').insert({
      amount: donation.amount,
      currency: donation.currency,
      provider: donation.provider,
      status: donation.status,
      cause: donation.cause,
      donor_name: donation.donorName || null,
      donor_email: donation.donorEmail || null,
      donor_phone: donation.donorPhone || null,
      is_anonymous: !!donation.isAnonymous,
      transaction_reference: donation.transactionReference || null,
      user_id: donation.userId || null,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (e) {
    console.error('Error saving donation to Supabase:', e);
    return { success: false, error: e };
  }
}

// Database: Quran Favorites Synchronization
export interface QuranFavoriteRecord {
  id?: string;
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  ayahText: string;
  ayahTranslation: string;
}

export async function fetchQuranFavorites(userId: string): Promise<QuranFavoriteRecord[]> {
  if (!supabase) {
    try {
      const local = localStorage.getItem(`quran_favs_${userId}`);
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('quran_favorites')
      .select('id, surah_number, ayah_number, surah_name, ayah_text, ayah_translation')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((item) => ({
      id: item.id,
      surahNumber: item.surah_number,
      ayahNumber: item.ayah_number,
      surahName: item.surah_name,
      ayahText: item.ayah_text,
      ayahTranslation: item.ayah_translation,
    }));
  } catch (err) {
    console.error('Error fetching Quran favorites:', err);
    return [];
  }
}

export async function toggleQuranFavorite(
  userId: string,
  record: QuranFavoriteRecord,
  isFavorite: boolean
) {
  if (!supabase) {
    try {
      const local = JSON.parse(localStorage.getItem(`quran_favs_${userId}`) || '[]');
      let updated;
      if (isFavorite) {
        updated = [...local, record];
      } else {
        updated = local.filter(
          (f: QuranFavoriteRecord) =>
            !(f.surahNumber === record.surahNumber && f.ayahNumber === record.ayahNumber)
        );
      }
      localStorage.setItem(`quran_favs_${userId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return;
  }

  try {
    if (isFavorite) {
      await supabase.from('quran_favorites').upsert({
        user_id: userId,
        surah_number: record.surahNumber,
        ayah_number: record.ayahNumber,
        surah_name: record.surahName,
        ayah_text: record.ayahText,
        ayah_translation: record.ayahTranslation,
      });
    } else {
      await supabase
        .from('quran_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('surah_number', record.surahNumber)
        .eq('ayah_number', record.ayahNumber);
    }
  } catch (err) {
    console.error('Error updating Quran favorite in Supabase:', err);
  }
}

