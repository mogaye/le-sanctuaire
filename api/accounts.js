import {
  parseRequestBody,
  supabaseSelect,
  upsertUserAndProfileInSupabase,
} from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const {
        id,
        email,
        fullName,
        firstName,
        lastName,
        avatarUrl,
        cityId,
        cityName,
        country,
        calculationMethod,
        themePreference,
      } = body || {};

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const profile = await upsertUserAndProfileInSupabase({
        id,
        email,
        fullName,
        firstName,
        lastName,
        avatarUrl,
        cityId,
        cityName: cityName || 'Dakar',
        country: country || 'Sénégal',
        calculationMethod: calculationMethod || 'MuslimWorldLeague',
        themePreference: themePreference || 'dark',
      });

      return res.status(200).json({ profile });
    } catch (err) {
      return res.status(500).json({ error: err?.message || 'Failed to sync account' });
    }
  }

  try {
    const [profiles, users] = await Promise.all([
      supabaseSelect('profiles', 'order=last_connected_at.desc'),
      supabaseSelect('users', 'order=updated_at.desc'),
    ]);

    const merged = new Map();

    for (const u of users) {
      const email = String(u.email || '').trim().toLowerCase();
      if (!email) continue;
      merged.set(email, {
        id: u.uid || String(u.id || email),
        email,
        full_name: u.full_name || email.split('@')[0],
        first_name: u.first_name || (u.full_name || email).split(' ')[0],
        last_name: u.last_name || '',
        avatar_url: u.avatar_url || null,
        city_name: u.city_name || 'Dakar',
        last_connected_at: u.updated_at || u.created_at || new Date().toISOString(),
        created_at: u.created_at || new Date().toISOString(),
      });
    }

    for (const p of profiles) {
      const email = String(p.email || '').trim().toLowerCase();
      if (!email) continue;
      const existing = merged.get(email);
      merged.set(email, {
        id: p.id || existing?.id || `acct_${email}`,
        email,
        full_name: p.full_name || existing?.full_name || email.split('@')[0],
        first_name: p.first_name || existing?.first_name || (p.full_name || email).split(' ')[0],
        last_name: p.last_name || existing?.last_name || '',
        avatar_url: p.avatar_url || existing?.avatar_url || null,
        city_id: p.city_id || 'dakar',
        city_name: p.city_name || existing?.city_name || 'Dakar',
        country: p.country || 'Sénégal',
        calculation_method: p.calculation_method || 'MuslimWorldLeague',
        theme_preference: p.theme_preference || 'dark',
        last_connected_at:
          p.last_connected_at || p.updated_at || existing?.last_connected_at || new Date().toISOString(),
        created_at: p.created_at || existing?.created_at || new Date().toISOString(),
      });
    }

    const accounts = Array.from(merged.values());
    return res.status(200).json({ accounts });
  } catch (err) {
    return res.status(500).json({ accounts: [], error: err?.message || 'Failed to fetch accounts' });
  }
}
