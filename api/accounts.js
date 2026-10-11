import { supabaseSelect } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const [profiles, users] = await Promise.all([
      supabaseSelect('profiles', 'order=updated_at.desc'),
      supabaseSelect('users', 'order=updated_at.desc'),
    ]);

    const map = new Map();

    for (const u of users) {
      if (!u?.email) continue;
      const key = String(u.email).trim().toLowerCase();
      map.set(key, {
        id: u.uid || `acct_${key}`,
        email: key,
        fullName: u.full_name || u.fullName || key.split('@')[0],
        firstName: u.first_name || u.firstName || 'Fidèle',
        lastName: u.last_name || u.lastName || '',
        avatarUrl: u.avatar_url || u.avatarUrl || null,
        cityName: u.city_name || u.cityName || 'Dakar',
        createdAt: u.created_at || u.createdAt || new Date().toISOString(),
        lastConnectedAt: u.updated_at || u.updatedAt || new Date().toISOString(),
      });
    }

    for (const p of profiles) {
      if (!p?.email) continue;
      const key = String(p.email).trim().toLowerCase();
      const existing = map.get(key);
      map.set(key, {
        id: p.id || existing?.id || `acct_${key}`,
        email: key,
        fullName: p.full_name || p.fullName || existing?.fullName || key.split('@')[0],
        firstName: p.first_name || p.firstName || existing?.firstName || 'Fidèle',
        lastName: p.last_name || p.lastName || existing?.lastName || '',
        avatarUrl: p.avatar_url || p.avatarUrl || existing?.avatarUrl || null,
        cityName: p.city_name || p.cityName || existing?.cityName || 'Dakar',
        createdAt: p.created_at || p.createdAt || existing?.createdAt || new Date().toISOString(),
        lastConnectedAt:
          p.last_connected_at ||
          p.lastConnectedAt ||
          p.updated_at ||
          existing?.lastConnectedAt ||
          new Date().toISOString(),
      });
    }

    return res.status(200).json({ accounts: Array.from(map.values()) });
  } catch (err) {
    return res.status(200).json({
      accounts: [],
      error: err?.message,
    });
  }
}
