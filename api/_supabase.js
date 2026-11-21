const DEFAULT_SUPABASE_URL = 'https://bkfklfnnturdwtfjoxci.supabase.co';

export function getSupabaseUrl() {
  return (
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  )
    .trim()
    .replace(/\/$/, '');
}

export function getSupabaseCreds() {
  const url = getSupabaseUrl();

  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    ''
  ).trim();

  const isValidKey =
    key.length > 15 &&
    !key.includes('your-anon-public-key') &&
    !key.includes('VOTRE_CLE');

  return isValidKey ? { url, key } : null;
}

export function getSupabaseAdminAuthCreds() {
  const url = getSupabaseUrl();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const isValidKey =
    serviceKey.length > 15 &&
    !serviceKey.includes('your-service-role-key') &&
    !serviceKey.includes('VOTRE_CLE');
  return isValidKey ? { url, key: serviceKey } : null;
}

export async function fetchSupabaseAuthUsers() {
  const adminCreds = getSupabaseAdminAuthCreds();
  if (!adminCreds) return [];
  try {
    const res = await fetch(`${adminCreds.url}/auth/v1/admin/users?per_page=500`, {
      method: 'GET',
      headers: {
        apikey: adminCreds.key,
        Authorization: `Bearer ${adminCreds.key}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    if (Array.isArray(json?.users)) return json.users;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
}

export async function parseRequestBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf-8'));
      } catch {
        return {};
      }
    }
    if (typeof req.body === 'object') {
      return req.body;
    }
  }

  try {
    let raw = '';
    for await (const chunk of req) {
      raw += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
    }
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function stripOrderParam(queryString) {
  return String(queryString || '')
    .split('&')
    .filter((part) => part && !part.startsWith('order='))
    .join('&');
}

export async function supabaseSelect(table, queryString = '') {
  const creds = getSupabaseCreds();
  if (!creds) return [];
  const runFetch = async (qs) => {
    const q = qs ? `?${qs.replace(/^\?/, '')}` : '';
    return fetch(`${creds.url}/rest/v1/${table}${q}`, {
      method: 'GET',
      headers: {
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
        Accept: 'application/json',
      },
    });
  };
  try {
    let res = await runFetch(queryString);
    if (!res.ok && res.status === 400 && String(queryString).includes('order=')) {
      const stripped = stripOrderParam(queryString);
      res = await runFetch(stripped);
    }
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function supabaseUpsert(table, payload, onConflict) {
  const creds = getSupabaseCreds();
  if (!creds) return { ok: false, reason: 'missing_supabase_key' };
  try {
    const endpoint = onConflict
      ? `${creds.url}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`
      : `${creds.url}/rest/v1/${table}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
        Prefer: onConflict
          ? 'resolution=merge-duplicates,return=representation'
          : 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: errText };
    }

    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function supabasePatch(table, filterQuery, payload) {
  const creds = getSupabaseCreds();
  if (!creds) return { ok: false, reason: 'missing_supabase_key' };
  try {
    const res = await fetch(`${creds.url}/rest/v1/${table}?${filterQuery}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: errText };
    }
    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function supabaseDelete(table, filterQuery) {
  const creds = getSupabaseCreds();
  if (!creds) return { ok: false, reason: 'missing_supabase_key' };
  try {
    const res = await fetch(`${creds.url}/rest/v1/${table}?${filterQuery}`, {
      method: 'DELETE',
      headers: {
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
      },
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: errText };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function upsertUserAndProfileInSupabase({
  id,
  email,
  fullName,
  firstName,
  lastName,
  avatarUrl,
  cityId = 'dakar',
  cityName = 'Dakar',
  country = 'Sénégal',
  calculationMethod = 'MuslimWorldLeague',
  themePreference = 'dark',
  role,
  plan,
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return null;

  const isAdmin = cleanEmail === 'mgaye60000@gmail.com';
  const resolvedId = id || (isAdmin ? 'adf9b87e-cf15-4fcc-a76b-2673c0ee74e4' : `acct_${cleanEmail}`);
  const resolvedFull = fullName || cleanEmail.split('@')[0] || 'Fidèle';
  const resolvedFirst = firstName || resolvedFull.split(' ')[0] || 'Fidèle';
  const resolvedLast = lastName || resolvedFull.split(' ').slice(1).join(' ') || '';
  const resolvedRole = isAdmin ? 'admin' : role === 'admin' ? 'user' : role || 'user';
  const resolvedPlan = isAdmin ? 'admin' : plan || 'test';
  const nowIso = new Date().toISOString();

  let supabaseUsersSaved = false;
  let supabaseProfilesSaved = false;

  // 1. Upsert into public.users
  const existingUsers = await supabaseSelect(
    'users',
    `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
  );
  if (existingUsers.length > 0) {
    let uPatch = await supabasePatch('users', `email=ilike.${encodeURIComponent(cleanEmail)}`, {
      email: cleanEmail,
      full_name: resolvedFull,
      first_name: resolvedFirst,
      last_name: resolvedLast,
      avatar_url: avatarUrl || existingUsers[0].avatar_url || null,
      city_name: cityName || existingUsers[0].city_name || 'Dakar',
      updated_at: nowIso,
    });
    if (!uPatch.ok) {
      uPatch = await supabasePatch('users', `email=ilike.${encodeURIComponent(cleanEmail)}`, {
        email: cleanEmail,
        full_name: resolvedFull,
      });
    }
    supabaseUsersSaved = Boolean(uPatch.ok);
  } else {
    let userRes = await supabaseUpsert(
      'users',
      {
        uid: resolvedId,
        email: cleanEmail,
        full_name: resolvedFull,
        first_name: resolvedFirst,
        last_name: resolvedLast,
        avatar_url: avatarUrl || null,
        city_name: cityName || 'Dakar',
        updated_at: nowIso,
      },
      'uid'
    );
    if (!userRes.ok) {
      userRes = await supabaseUpsert('users', {
        uid: resolvedId,
        email: cleanEmail,
        full_name: resolvedFull,
        first_name: resolvedFirst,
        last_name: resolvedLast,
        city_name: cityName || 'Dakar',
      });
    }
    if (!userRes.ok) {
      userRes = await supabaseUpsert('users', {
        uid: resolvedId,
        email: cleanEmail,
        full_name: resolvedFull,
      });
    }
    supabaseUsersSaved = Boolean(userRes.ok);
  }

  // 2. Upsert into public.profiles
  const existingProfiles = await supabaseSelect(
    'profiles',
    `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
  );
  if (existingProfiles.length > 0) {
    let pPatch = await supabasePatch('profiles', `email=ilike.${encodeURIComponent(cleanEmail)}`, {
      email: cleanEmail,
      full_name: resolvedFull,
      first_name: resolvedFirst,
      last_name: resolvedLast,
      avatar_url: avatarUrl || existingProfiles[0].avatar_url || null,
      city_id: cityId || existingProfiles[0].city_id || 'dakar',
      city_name: cityName || existingProfiles[0].city_name || 'Dakar',
      country: country || existingProfiles[0].country || 'Sénégal',
      calculation_method:
        calculationMethod || existingProfiles[0].calculation_method || 'MuslimWorldLeague',
      theme_preference: themePreference || existingProfiles[0].theme_preference || 'dark',
      role: resolvedRole,
      ...(existingProfiles[0].plan ? {} : { plan: resolvedPlan }),
      last_connected_at: nowIso,
      updated_at: nowIso,
    });
    if (!pPatch.ok) {
      pPatch = await supabasePatch('profiles', `email=ilike.${encodeURIComponent(cleanEmail)}`, {
        email: cleanEmail,
        full_name: resolvedFull,
        first_name: resolvedFirst,
        last_name: resolvedLast,
        city_name: cityName || 'Dakar',
        updated_at: nowIso,
      });
    }
    if (!pPatch.ok) {
      pPatch = await supabasePatch('profiles', `email=ilike.${encodeURIComponent(cleanEmail)}`, {
        email: cleanEmail,
        full_name: resolvedFull,
      });
    }
    supabaseProfilesSaved = Boolean(pPatch.ok);
  } else {
    let profRes = await supabaseUpsert(
      'profiles',
      {
        id: resolvedId,
        email: cleanEmail,
        full_name: resolvedFull,
        first_name: resolvedFirst,
        last_name: resolvedLast,
        avatar_url: avatarUrl || null,
        city_id: cityId || 'dakar',
        city_name: cityName || 'Dakar',
        country: country || 'Sénégal',
        calculation_method: calculationMethod || 'MuslimWorldLeague',
        theme_preference: themePreference || 'dark',
        role: resolvedRole,
        plan: resolvedPlan,
        last_connected_at: nowIso,
        updated_at: nowIso,
      },
      'email'
    );
    if (!profRes.ok) {
      profRes = await supabaseUpsert(
        'profiles',
        {
          id: resolvedId,
          email: cleanEmail,
          full_name: resolvedFull,
          first_name: resolvedFirst,
          last_name: resolvedLast,
          avatar_url: avatarUrl || null,
          city_name: cityName || 'Dakar',
          updated_at: nowIso,
        },
        'id'
      );
    }
    if (!profRes.ok) {
      profRes = await supabaseUpsert('profiles', {
        id: resolvedId,
        email: cleanEmail,
        full_name: resolvedFull,
        first_name: resolvedFirst,
        last_name: resolvedLast,
      });
    }
    supabaseProfilesSaved = Boolean(profRes.ok);
  }

  return {
    id: resolvedId,
    email: cleanEmail,
    fullName: resolvedFull,
    firstName: resolvedFirst,
    lastName: resolvedLast,
    avatarUrl: avatarUrl || null,
    cityName: cityName || 'Dakar',
    role: resolvedRole,
    plan: resolvedPlan,
    lastConnectedAt: nowIso,
    supabaseUsersSaved,
    supabaseProfilesSaved,
  };
}

export async function runSupabaseDiagnostics() {
  const creds = getSupabaseCreds();
  const hasServiceRoleKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim().length > 15
  );
  const hasAnonKey = Boolean(
    (
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      ''
    ).trim().length > 15
  );
  const hasSmtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

  const tables = [
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
  ];

  const tableStatuses = {};
  const errors = [];
  const advice = [];
  let profilesColumnsOk = false;
  let authUsersCount = null;

  if (!creds) {
    for (const table of tables) {
      tableStatuses[table] = { ok: false, status: 0, error: 'Clé API Supabase non configurée' };
    }
    errors.push(
      'Aucune clé API Supabase détectée dans les variables d’environnement (VITE_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY).'
    );
    advice.push(
      'Ajoutez VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY dans vos variables d’environnement (Vercel > Settings > Environment Variables ou .env), puis redéployez.'
    );
  } else {
    await Promise.all(
      tables.map(async (table) => {
        try {
          const res = await fetch(`${creds.url}/rest/v1/${table}?select=*&limit=1`, {
            method: 'GET',
            headers: {
              apikey: creds.key,
              Authorization: `Bearer ${creds.key}`,
              Accept: 'application/json',
              Prefer: 'count=exact',
            },
          });
          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            tableStatuses[table] = { ok: false, status: res.status, error: errText };
            errors.push(`Table public.${table} (HTTP ${res.status}): ${errText}`);
          } else {
            const rows = await res.json().catch(() => []);
            const contentRange = res.headers.get('content-range') || '';
            const totalMatch = contentRange.match(/\/(\d+)$/);
            const rowCount = totalMatch ? Number(totalMatch[1]) : Array.isArray(rows) ? rows.length : 0;
            tableStatuses[table] = {
              ok: true,
              status: 200,
              sampleCount: Array.isArray(rows) ? rows.length : 0,
              rowCount,
            };
          }
        } catch (err) {
          tableStatuses[table] = { ok: false, error: err?.message || String(err) };
          errors.push(`Table public.${table}: ${err?.message || String(err)}`);
        }
      })
    );

    // Check that extended dashboard columns exist on public.profiles
    try {
      const colRes = await fetch(
        `${creds.url}/rest/v1/profiles?select=id,email,role,plan,videos_used_this_month,total_videos_created,total_amount_paid_fcfa,time_spent_seconds,last_connected_at&limit=1`,
        {
          method: 'GET',
          headers: {
            apikey: creds.key,
            Authorization: `Bearer ${creds.key}`,
            Accept: 'application/json',
          },
        }
      );
      if (colRes.ok) {
        profilesColumnsOk = true;
      } else {
        const colErr = await colRes.text().catch(() => '');
        errors.push(`Colonnes Dashboard manquantes sur public.profiles: ${colErr}`);
        advice.push(
          'Exécutez le script SQL complet (10 tables) dans Supabase -> SQL Editor pour ajouter les colonnes plan, role et compteurs vidéo sur public.profiles.'
        );
      }
    } catch {
      // ignore
    }

    if (hasServiceRoleKey) {
      const authUsers = await fetchSupabaseAuthUsers();
      authUsersCount = authUsers.length;
    }
  }

  if (!hasServiceRoleKey && creds) {
    advice.push(
      'Conseil : Ajoutez SUPABASE_SERVICE_ROLE_KEY dans les variables d’environnement pour lire directement auth.users et contourner tout blocage RLS côté serveur.'
    );
  }
  if (!hasSmtp) {
    advice.push(
      'Optionnel : Ajoutez SMTP_USER et SMTP_PASS pour l’envoi direct des e-mails OTP et de remerciement.'
    );
  }

  return {
    ok: Boolean(creds) && errors.length === 0,
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: creds?.url || getSupabaseUrl(),
      supabaseKeyConfigured: Boolean(creds),
      hasAnonKey,
      hasServiceRoleKey,
      hasSmtp,
      profilesColumnsOk,
      authUsersCount,
      serverlessFunctionsCount: 11,
      vercelHobbyLimit: 12,
    },
    tables: tableStatuses,
    errors,
    advice,
  };
}
