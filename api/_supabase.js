const DEFAULT_SUPABASE_URL = 'https://bkfklfnnturdwtfjoxci.supabase.co';

export function getSupabaseCreds() {
  const url = (
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL
  )
    .trim()
    .replace(/\/$/, '');

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

export async function supabaseSelect(table, queryString = '') {
  const creds = getSupabaseCreds();
  if (!creds) return [];
  try {
    const q = queryString ? `?${queryString.replace(/^\?/, '')}` : '';
    const res = await fetch(`${creds.url}/rest/v1/${table}${q}`, {
      method: 'GET',
      headers: {
        apikey: creds.key,
        Authorization: `Bearer ${creds.key}`,
        Accept: 'application/json',
      },
    });
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
}) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail) return null;

  const resolvedId = id || `acct_${cleanEmail}`;
  const resolvedFull = fullName || cleanEmail.split('@')[0] || 'Fidèle';
  const resolvedFirst = firstName || resolvedFull.split(' ')[0] || 'Fidèle';
  const resolvedLast = lastName || resolvedFull.split(' ').slice(1).join(' ') || '';
  const nowIso = new Date().toISOString();

  // 1. Upsert into public.users
  const existingUsers = await supabaseSelect(
    'users',
    `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
  );
  if (existingUsers.length > 0) {
    await supabasePatch('users', `email=ilike.${encodeURIComponent(cleanEmail)}`, {
      email: cleanEmail,
      full_name: resolvedFull,
      first_name: resolvedFirst,
      last_name: resolvedLast,
      avatar_url: avatarUrl || existingUsers[0].avatar_url || null,
      city_name: cityName || existingUsers[0].city_name || 'Dakar',
      updated_at: nowIso,
    });
  } else {
    const userRes = await supabaseUpsert(
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
      await supabaseUpsert('users', {
        uid: resolvedId,
        email: cleanEmail,
        full_name: resolvedFull,
        first_name: resolvedFirst,
        last_name: resolvedLast,
        avatar_url: avatarUrl || null,
        city_name: cityName || 'Dakar',
        updated_at: nowIso,
      });
    }
  }

  // 2. Upsert into public.profiles
  const existingProfiles = await supabaseSelect(
    'profiles',
    `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
  );
  if (existingProfiles.length > 0) {
    await supabasePatch('profiles', `email=ilike.${encodeURIComponent(cleanEmail)}`, {
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
      last_connected_at: nowIso,
      updated_at: nowIso,
    });
  } else {
    const profRes = await supabaseUpsert(
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
        last_connected_at: nowIso,
        updated_at: nowIso,
      },
      'email'
    );
    if (!profRes.ok) {
      const fallbackRes = await supabaseUpsert(
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
      if (!fallbackRes.ok) {
        await supabaseUpsert('profiles', {
          id: resolvedId,
          email: cleanEmail,
          full_name: resolvedFull,
          first_name: resolvedFirst,
          last_name: resolvedLast,
        });
      }
    }
  }

  return {
    id: resolvedId,
    email: cleanEmail,
    fullName: resolvedFull,
    firstName: resolvedFirst,
    lastName: resolvedLast,
    avatarUrl: avatarUrl || null,
    cityName: cityName || 'Dakar',
    lastConnectedAt: nowIso,
  };
}
