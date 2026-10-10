import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

// Retrieve Supabase environment variables from Vite or Vercel Supabase integration
const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

const rawEnvUrl = (
  metaEnv.VITE_SUPABASE_URL ||
  metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
  metaEnv.SUPABASE_URL ||
  ''
).trim();

const rawEnvAnonKey = (
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  metaEnv.SUPABASE_ANON_KEY ||
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  ''
).trim();

// Only use a custom URL/key if valid and not a placeholder or dead/paused project
const isValidCustomUrl =
  rawEnvUrl.startsWith('https://') &&
  !rawEnvUrl.includes('your-project-id') &&
  !rawEnvUrl.includes('bkfklfnnturdwtfjoxci');

const isValidCustomKey =
  rawEnvAnonKey.length > 15 &&
  !rawEnvAnonKey.includes('your-anon-public-key') &&
  !rawEnvAnonKey.includes('cX19V8m_fhJo');

const supabaseUrl = isValidCustomUrl ? rawEnvUrl : '';
const supabaseAnonKey = isValidCustomKey ? rawEnvAnonKey : '';

// Detect if a live, reachable Supabase project is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
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

interface LocalRegisteredAccount {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

const LOCAL_ACCOUNTS_KEY = 'sanctuaire_registered_accounts';

function getLocalAccounts(): LocalRegisteredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccount(account: LocalRegisteredAccount) {
  try {
    const accounts = getLocalAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase()
    );
    accounts.push(account);
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore storage errors
  }
}

function isNetworkOrFetchError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message || err || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('fetch') ||
    msg.includes('load failed') ||
    msg.includes('enotfound') ||
    msg.includes('name_not_resolved')
  );
}

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
  const cleanEmail = email.trim().toLowerCase();

  const runLocalSignIn = () => {
    const accounts = getLocalAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing && existing.password && existing.password !== password) {
      return {
        data: { user: null },
        error: { message: 'Invalid login credentials' },
        isFallback: true,
      };
    }

    const fullName = existing?.fullName || cleanEmail.split('@')[0] || 'Fidèle';
    const firstName = existing?.firstName || fullName.split(' ')[0] || 'Fidèle';
    const lastName = existing?.lastName || '';

    return {
      data: {
        user: {
          id: existing?.id || 'local-user-' + Date.now(),
          email: cleanEmail,
          user_metadata: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
          },
        },
      },
      error: null,
      isFallback: true,
    };
  };

  if (!supabase) {
    return runLocalSignIn();
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error && isNetworkOrFetchError(error)) {
      return runLocalSignIn();
    }

    return { data, error, isFallback: false };
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      return runLocalSignIn();
    }
    return {
      data: { user: null },
      error: { message: (err as Error)?.message || 'Erreur de connexion' },
      isFallback: false,
    };
  }
}

// Authentication: Sign Up with Email & Password
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim() || cleanEmail.split('@')[0] || 'Fidèle';
  const parts = cleanName.split(' ');
  const firstName = parts[0] || 'Fidèle';
  const lastName = parts.slice(1).join(' ');
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const runLocalSignUp = () => {
    const newAccount: LocalRegisteredAccount = {
      id: 'local-user-' + Date.now(),
      email: cleanEmail,
      password,
      fullName: cleanName,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
    };
    saveLocalAccount(newAccount);

    return {
      data: {
        user: {
          id: newAccount.id,
          email: cleanEmail,
          user_metadata: {
            full_name: cleanName,
            first_name: firstName,
            last_name: lastName,
          },
        },
        session: { user: { id: newAccount.id, email: cleanEmail } },
      },
      error: null,
      isFallback: true,
      needsEmailVerification: false,
    };
  };

  if (!supabase) {
    return runLocalSignUp();
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      if (isNetworkOrFetchError(error) || String(error.message).toLowerCase().includes('rate limit')) {
        return runLocalSignUp();
      }
      return {
        data,
        error,
        isFallback: false,
        needsEmailVerification: false,
      };
    }

    // Save locally as backup as well
    saveLocalAccount({
      id: data?.user?.id || 'local-user-' + Date.now(),
      email: cleanEmail,
      password,
      fullName: cleanName,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
    });

    // When Supabase has email confirmation enabled, data.session is null until the email link is clicked
    const needsEmailVerification = !data?.session && !!data?.user;

    return {
      data,
      error: null,
      isFallback: false,
      needsEmailVerification,
    };
  } catch (err) {
    if (isNetworkOrFetchError(err)) {
      return runLocalSignUp();
    }
    return {
      data: { user: null, session: null },
      error: { message: (err as Error)?.message || 'Erreur lors de la création du compte' },
      isFallback: false,
      needsEmailVerification: false,
    };
  }
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

  if (!supabase) {
    return { data: {}, error: null, isFallback: true };
  }

  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error && isNetworkOrFetchError(error)) {
      return { data: {}, error: null, isFallback: true };
    }

    return { data, error, isFallback: false };
  } catch {
    return { data: {}, error: null, isFallback: true };
  }
}

// Authentication: Sign In with Google OAuth
export async function signInWithGoogle() {
  const fallbackGoogle = () => ({
    data: {
      user: {
        id: 'google-user-' + Date.now(),
        email: 'utilisateur@sanctuaire.app',
        user_metadata: { full_name: 'Fidèle' },
      },
    },
    error: null,
    isFallback: true,
  });

  if (!supabase) {
    return fallbackGoogle();
  }

  try {
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

    if (error && isNetworkOrFetchError(error)) {
      return fallbackGoogle();
    }

    return { data, error, isFallback: false };
  } catch {
    return fallbackGoogle();
  }
}

// Authentication: Sign Out
export async function signOutUser() {
  if (!supabase) {
    return { error: null };
  }
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch {
    return { error: null };
  }
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

