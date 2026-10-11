import { parseRequestBody, upsertUserAndProfileInSupabase } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { id, email, fullName, firstName, lastName, avatarUrl, cityName } = body || {};

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
      cityName,
    });

    return res.status(200).json({ profile });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to sync account' });
  }
}
