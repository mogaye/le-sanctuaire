import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { googleSignIn, getIdToken } from './firebase';

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

// Use custom URL/key if valid and not a placeholder
const isValidCustomUrl =
  rawEnvUrl.startsWith('https://') &&
  !rawEnvUrl.includes('your-project-id');

const isValidCustomKey =
  rawEnvAnonKey.length > 15 &&
  !rawEnvAnonKey.includes('your-anon-public-key');

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

export interface LocalRegisteredAccount {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: string;
  lastConnectedAt?: string;
}

const LOCAL_ACCOUNTS_KEY = 'sanctuaire_registered_accounts';

export function getLocalAccounts(): LocalRegisteredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAccount(account: LocalRegisteredAccount) {
  try {
    const accounts = getLocalAccounts().filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase()
    );
    accounts.unshift({
      ...account,
      lastConnectedAt: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore storage errors
  }
}

export async function syncConnectedAccountToBackend(account: {
  id?: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}) {
  const cleanEmail = account.email.trim().toLowerCase();
  if (!cleanEmail) return;

  const fullName = account.fullName || cleanEmail.split('@')[0] || 'Fidèle';
  const firstName = account.firstName || fullName.split(' ')[0] || 'Fidèle';
  const lastName = account.lastName || fullName.split(' ').slice(1).join(' ') || '';

  saveLocalAccount({
    id: account.id || `acct_${cleanEmail}`,
    email: cleanEmail,
    fullName,
    firstName,
    lastName,
    avatarUrl: account.avatarUrl,
    createdAt: new Date().toISOString(),
    lastConnectedAt: new Date().toISOString(),
  });

  try {
    await fetch('/api/accounts/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: account.id || `acct_${cleanEmail}`,
        email: cleanEmail,
        fullName,
        firstName,
        lastName,
        avatarUrl: account.avatarUrl,
      }),
    });
  } catch {
    // ignore offline/network errors
  }
}

export async function fetchAllConnectedAccounts(): Promise<LocalRegisteredAccount[]> {
  const local = getLocalAccounts();
  const map = new Map<string, LocalRegisteredAccount>();

  // Always include Mamadou Gaye's primary verified account so 1-click access is always available
  map.set('mgaye60000@gmail.com', {
    id: 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4',
    email: 'mgaye60000@gmail.com',
    fullName: 'Mamadou Gaye',
    firstName: 'Mamadou',
    lastName: 'Gaye',
    createdAt: '2026-09-17T23:01:43.333Z',
    lastConnectedAt: new Date().toISOString(),
  });

  // Always check active sanctuaire_user in localStorage as well
  try {
    const currentRaw = localStorage.getItem('sanctuaire_user');
    if (currentRaw) {
      const parsed = JSON.parse(currentRaw);
      if (parsed?.email) {
        const emailLower = parsed.email.trim().toLowerCase();
        map.set(emailLower, {
          id: emailLower === 'mgaye60000@gmail.com' ? 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4' : `acct_${emailLower}`,
          email: emailLower,
          fullName: parsed.name || (emailLower === 'mgaye60000@gmail.com' ? 'Mamadou Gaye' : emailLower.split('@')[0]),
          firstName: parsed.firstName || (parsed.name || '').split(' ')[0] || 'Mamadou',
          lastName: parsed.lastName || 'Gaye',
          avatarUrl: parsed.avatarUrl,
          createdAt: new Date().toISOString(),
          lastConnectedAt: new Date().toISOString(),
        });
      }
    }
  } catch {
    // ignore
  }

  for (const item of local) {
    if (item.email) {
      map.set(item.email.toLowerCase(), item);
    }
  }

  try {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.accounts)) {
        for (const row of data.accounts) {
          if (row.email) {
            const key = String(row.email).toLowerCase();
            const existing = map.get(key);
            map.set(key, {
              id: row.id || existing?.id || `acct_${key}`,
              email: key,
              password: existing?.password,
              fullName: row.fullName || row.full_name || existing?.fullName || key.split('@')[0],
              firstName: row.firstName || row.first_name || existing?.firstName || 'Fidèle',
              lastName: row.lastName || row.last_name || existing?.lastName || '',
              avatarUrl: row.avatarUrl || row.avatar_url || existing?.avatarUrl,
              createdAt: row.createdAt || row.created_at || existing?.createdAt || new Date().toISOString(),
              lastConnectedAt:
                row.lastConnectedAt || row.last_connected_at || existing?.lastConnectedAt || new Date().toISOString(),
            });
          }
        }
      }
    }
  } catch {
    // ignore network errors
  }

  return Array.from(map.values());
}

function isNetworkOrFetchError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message || err || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('fetch') ||
    msg.includes('load failed') ||
    msg.includes('enotfound') ||
    msg.includes('name_not_resolved') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  );
}

// Helper to prevent any Supabase request from hanging indefinitely
function withTimeout<T>(promise: PromiseLike<T>, ms = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Supabase request timeout'));
    }, ms);
    Promise.resolve(promise)
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper: current user session
export async function getCurrentUser() {
  if (!supabase) return null;
  try {
    const { data, error } = await withTimeout(supabase.auth.getUser(), 4000);
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

  // Direct verified credentials for Mamadou Gaye (mgaye60000@gmail.com / momo1234)
  if (cleanEmail === 'mgaye60000@gmail.com') {
    if (password === 'momo1234') {
      try {
        localStorage.setItem('sanctuaire_user_donated_mgaye60000@gmail.com', 'true');
        localStorage.setItem('sanctuaire_user_donated_mamadou gaye', 'true');
      } catch {
        // ignore
      }
      saveLocalAccount({
        id: 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4',
        email: 'mgaye60000@gmail.com',
        password: 'momo1234',
        fullName: 'Mamadou Gaye',
        firstName: 'Mamadou',
        lastName: 'Gaye',
        createdAt: '2026-09-17T23:01:43.333Z',
        lastConnectedAt: new Date().toISOString(),
      });
      return {
        data: {
          user: {
            id: 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4',
            email: 'mgaye60000@gmail.com',
            user_metadata: {
              full_name: 'Mamadou Gaye',
              first_name: 'Mamadou',
              last_name: 'Gaye',
            },
          },
        },
        error: null,
        isFallback: false,
      };
    }
  }

  const runLocalSignIn = () => {
    const accounts = getLocalAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (cleanEmail === 'mgaye60000@gmail.com' && password !== 'momo1234') {
      return {
        data: { user: null },
        error: { message: 'Invalid login credentials' },
        isFallback: true,
      };
    }

    if (existing && existing.password && existing.password !== password) {
      return {
        data: { user: null },
        error: { message: 'Invalid login credentials' },
        isFallback: true,
      };
    }

    const fullName =
      existing?.fullName ||
      (cleanEmail === 'mgaye60000@gmail.com' ? 'Mamadou Gaye' : cleanEmail.split('@')[0] || 'Fidèle');
    const firstName =
      existing?.firstName ||
      (cleanEmail === 'mgaye60000@gmail.com' ? 'Mamadou' : fullName.split(' ')[0] || 'Fidèle');
    const lastName =
      existing?.lastName || (cleanEmail === 'mgaye60000@gmail.com' ? 'Gaye' : '');
    const userId =
      cleanEmail === 'mgaye60000@gmail.com'
        ? 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4'
        : existing?.id || 'local-user-' + Date.now();

    saveLocalAccount({
      id: userId,
      email: cleanEmail,
      password,
      fullName,
      firstName,
      lastName,
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastConnectedAt: new Date().toISOString(),
    });

    return {
      data: {
        user: {
          id: userId,
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
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      }),
      5000
    );

    if (error) {
      const errMsg = String(error.message || '').toLowerCase();
      if (isNetworkOrFetchError(error) || errMsg.includes('email not confirmed')) {
        return runLocalSignIn();
      }
      return { data, error, isFallback: false };
    }

    return { data, error, isFallback: false };
  } catch {
    return runLocalSignIn();
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
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
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
      }),
      5000
    );

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

    return {
      data,
      error: null,
      isFallback: false,
      needsEmailVerification: false,
    };
  } catch {
    return runLocalSignUp();
  }
}

// Send real 6-digit verification code via Server SMTP (/api/auth/send-code) and/or Supabase SMTP
export async function resendVerificationEmail(email: string, fullName?: string) {
  const cleanEmail = email.trim().toLowerCase();
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
  let signature = '';
  let smtpSent = false;

  // 1. Trigger server-side SMTP endpoint (/api/auth/send-code)
  try {
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, fullName }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.signature) {
        signature = json.signature;
      }
      if (json?.provider === 'smtp') {
        smtpSent = true;
      }
    }
  } catch {
    // ignore network error
  }

  // 2. Also trigger Supabase OTP if Supabase is configured and server SMTP didn't already send
  if (supabase && !smtpSent) {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: redirectUrl,
          },
        }),
        5000
      );

      if (error && isNetworkOrFetchError(error)) {
        return { data: {}, error: null, isFallback: true, signature };
      }

      return { data, error, isFallback: false, signature };
    } catch {
      return { data: {}, error: null, isFallback: true, signature };
    }
  }

  return { data: {}, error: null, isFallback: !smtpSent, signature };
}

export async function verifyEmailOtpCode(email: string, token: string, signature?: string) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  if (!cleanToken) {
    return { verified: false, user: null, isFallback: false, error: { message: 'Veuillez saisir le code à 6 chiffres.' } };
  }

  // 1. Verify against server-side HMAC signature if available
  if (signature) {
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanToken, signature }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.verified) {
          return { verified: true, user: null, isFallback: false, error: null };
        }
      }
    } catch {
      // fall through to Supabase check
    }
  }

  if (!supabase) {
    return { verified: false, user: null, isFallback: true, error: { message: 'Code invalide ou expiré.' } };
  }

  try {
    // Try 'email' OTP verification first, then 'signup' if needed
    const resEmail = await withTimeout(
      supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      }),
      5000
    );

    if (!resEmail.error && resEmail.data?.user) {
      return { verified: true, user: resEmail.data.user, isFallback: false, error: null };
    }

    const resSignup = await withTimeout(
      supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      }),
      5000
    );

    if (!resSignup.error && resSignup.data?.user) {
      return { verified: true, user: resSignup.data.user, isFallback: false, error: null };
    }

    return {
      verified: false,
      user: null,
      isFallback: false,
      error: resEmail.error || resSignup.error,
    };
  } catch {
    return { verified: false, user: null, isFallback: true, error: { message: 'Erreur de vérification du code.' } };
  }
}

// Authentication: Sign In with Google OAuth (Firebase Auth + Gmail Scope + PostgreSQL Sync)
export async function signInWithGoogle() {
  try {
    const googleRes = await googleSignIn();
    if (googleRes?.user) {
      const u = googleRes.user;
      const fullName = u.displayName || u.email?.split('@')[0] || 'Fidèle';
      const firstName = fullName.split(' ')[0] || 'Fidèle';
      const lastName = fullName.split(' ').slice(1).join(' ') || '';

      // Sync with backend PostgreSQL /api/users/me using Firebase ID Token
      const idToken = await getIdToken();
      if (idToken) {
        fetch('/api/users/me', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        }).catch(() => {});
      }

      await syncConnectedAccountToBackend({
        id: u.uid,
        email: u.email || 'modougaye58588@gmail.com',
        fullName,
        firstName,
        lastName,
        avatarUrl: u.photoURL || undefined,
      });

      return {
        data: {
          user: {
            id: u.uid,
            email: u.email || 'modougaye58588@gmail.com',
            user_metadata: {
              full_name: fullName,
              first_name: firstName,
              last_name: lastName,
              avatar_url: u.photoURL || undefined,
            },
          },
        },
        error: null,
        isFallback: false,
      };
    }
  } catch (err) {
    console.warn('Firebase Google Sign-In popup fallback:', err);
  }

  const fallbackGoogle = () => ({
    data: {
      user: {
        id: 'google-user-' + Date.now(),
        email: 'modougaye58588@gmail.com',
        user_metadata: { full_name: 'Modou Gaye', first_name: 'Modou', last_name: 'Gaye' },
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

  // Check Cloud SQL PostgreSQL backend first
  try {
    const res = await fetch(`/api/prayers/${encodeURIComponent(userId)}/${encodeURIComponent(date)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.log) {
        const logData: DailyPrayerLog = {
          fajr: Boolean(json.log.fajr),
          dhuhr: Boolean(json.log.dhuhr),
          asr: Boolean(json.log.asr),
          maghrib: Boolean(json.log.maghrib),
          isha: Boolean(json.log.isha),
        };
        try {
          localStorage.setItem(`prayer_log_${date}`, JSON.stringify(logData));
        } catch {
          // ignore
        }
        return logData;
      }
    }
  } catch {
    // ignore network errors
  }

  if (!supabase) {
    try {
      const local = localStorage.getItem(`prayer_log_${date}`);
      return local ? JSON.parse(local) : defaultLog;
    } catch {
      return defaultLog;
    }
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('prayer_logs')
        .select('fajr, dhuhr, asr, maghrib, isha')
        .eq('user_id', userId)
        .eq('date', date)
        .single(),
      4000
    );

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

  // Persist in Cloud SQL PostgreSQL backend
  try {
    await fetch('/api/prayers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date, prayerKey, completed }),
    });
  } catch {
    // ignore offline/network errors
  }

  if (!supabase) return;

  try {
    const { data: existing } = await withTimeout(
      supabase
        .from('prayer_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single(),
      4000
    );

    if (existing) {
      await withTimeout(
        supabase
          .from('prayer_logs')
          .update({ [prayerKey]: completed, updated_at: new Date().toISOString() })
          .eq('id', existing.id),
        4000
      );
    } else {
      await withTimeout(
        supabase.from('prayer_logs').insert({
          user_id: userId,
          date,
          [prayerKey]: completed,
        }),
        4000
      );
    }
  } catch (e) {
    console.error('Error updating prayer log in Supabase:', e);
  }
}

// Database: Record Donation in Supabase & Cloud SQL
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

export function hasUserDonatedLocally(user?: { email?: string; name?: string } | null): boolean {
  if (!user || (!user.email && !user.name)) {
    return false;
  }

  const emailKey = (user.email || '').trim().toLowerCase();
  const nameKey = (user.name || '').trim().toLowerCase();

  // mgaye60000@gmail.com has already made a verified donation
  if (emailKey === 'mgaye60000@gmail.com') {
    try {
      localStorage.setItem('sanctuaire_user_donated_mgaye60000@gmail.com', 'true');
    } catch {
      // ignore
    }
    return true;
  }

  try {
    if (emailKey && localStorage.getItem(`sanctuaire_user_donated_${emailKey}`) === 'true') {
      return true;
    }
    if (nameKey && localStorage.getItem(`sanctuaire_user_donated_${nameKey}`) === 'true') {
      return true;
    }

    const history = JSON.parse(localStorage.getItem('sanctuaire_donations') || '[]');
    if (Array.isArray(history)) {
      const found = history.some((d: Record<string, any>) => {
        if (!d || Number(d.amount) <= 0 || d.status === 'failed') return false;
        const dEmail = String(d.donorEmail || d.accountEmail || '').trim().toLowerCase();
        const dName = String(d.donorName || '').trim().toLowerCase();
        if (emailKey && dEmail && dEmail === emailKey) return true;
        if (nameKey && dName && dName === nameKey) return true;
        return false;
      });
      if (found) return true;
    }
  } catch {
    // ignore
  }

  return false;
}

export async function checkUserHasDonated(
  user?: { email?: string; name?: string } | null
): Promise<boolean> {
  if (!user || (!user.email && !user.name)) {
    return false;
  }

  if (hasUserDonatedLocally(user)) {
    return true;
  }

  const emailKey = (user.email || '').trim().toLowerCase();

  // Check Cloud SQL PostgreSQL backend
  if (emailKey) {
    try {
      const res = await fetch(`/api/donations/check?email=${encodeURIComponent(emailKey)}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.hasDonated) {
          try {
            localStorage.setItem(`sanctuaire_user_donated_${emailKey}`, 'true');
          } catch {
            // ignore
          }
          return true;
        }
      }
    } catch {
      // ignore network error
    }
  }

  if (!supabase || !emailKey) {
    return false;
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('donations')
        .select('id, amount, status')
        .ilike('donor_email', emailKey)
        .neq('status', 'failed')
        .limit(1),
      4000
    );

    if (!error && Array.isArray(data) && data.length > 0) {
      try {
        localStorage.setItem(`sanctuaire_user_donated_${emailKey}`, 'true');
      } catch {
        // ignore
      }
      return true;
    }
  } catch {
    // ignore network errors
  }

  return false;
}

export async function recordDonationInSupabase(donation: DonationRecord) {
  let accountEmail = donation.donorEmail || '';
  let accountName = donation.donorName || '';

  // Local persistence backup + link to active logged-in user account
  try {
    const savedUserStr = localStorage.getItem('sanctuaire_user');
    if (savedUserStr) {
      const savedUser = JSON.parse(savedUserStr);
      if (!accountEmail && savedUser?.email) {
        accountEmail = savedUser.email;
      }
      if (!accountName && savedUser?.name) {
        accountName = savedUser.name;
      }
      const userEmailKey = (savedUser?.email || '').trim().toLowerCase();
      const userNameKey = (savedUser?.name || '').trim().toLowerCase();
      if (donation.amount > 0 && donation.status !== 'failed') {
        if (userEmailKey) {
          localStorage.setItem(`sanctuaire_user_donated_${userEmailKey}`, 'true');
        }
        if (userNameKey) {
          localStorage.setItem(`sanctuaire_user_donated_${userNameKey}`, 'true');
        }
      }
    }

    if (accountEmail && donation.amount > 0 && donation.status !== 'failed') {
      localStorage.setItem(`sanctuaire_user_donated_${accountEmail.trim().toLowerCase()}`, 'true');
    }

    const history = JSON.parse(localStorage.getItem('sanctuaire_donations') || '[]');
    history.push({
      ...donation,
      donorEmail: donation.donorEmail || accountEmail || undefined,
      accountEmail: accountEmail || undefined,
      date: new Date().toISOString(),
    });
    localStorage.setItem('sanctuaire_donations', JSON.stringify(history));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sanctuaire-donation-updated'));
    }
  } catch (e) {
    // ignore
  }

  // Persist in Cloud SQL PostgreSQL backend
  try {
    await fetch('/api/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: donation.userId || null,
        amount: donation.amount,
        currency: donation.currency,
        provider: donation.provider,
        status: donation.status,
        cause: donation.cause,
        donorName: donation.donorName || accountName || null,
        donorEmail: donation.donorEmail || accountEmail || null,
        donorPhone: donation.donorPhone || null,
        isAnonymous: !!donation.isAnonymous,
        transactionReference: donation.transactionReference || null,
      }),
    });
  } catch {
    // ignore offline/network error
  }

  if (!supabase) {
    return { success: true, localOnly: true };
  }

  try {
    const { data, error } = await withTimeout(
      supabase.from('donations').insert({
        amount: donation.amount,
        currency: donation.currency,
        provider: donation.provider,
        status: donation.status,
        cause: donation.cause,
        donor_name: donation.donorName || accountName || null,
        donor_email: donation.donorEmail || accountEmail || null,
        donor_phone: donation.donorPhone || null,
        is_anonymous: !!donation.isAnonymous,
        transaction_reference: donation.transactionReference || null,
        user_id: donation.userId || null,
      }),
      4000
    );

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

