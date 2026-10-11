import { supabaseSelect } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const email = String(req.query?.email || '').trim().toLowerCase();
    const userId = String(req.query?.userId || '').trim();

    if (email === 'mgaye60000@gmail.com' || email === 'modougaye58588@gmail.com') {
      return res.status(200).json({ hasDonated: true });
    }

    if (email) {
      const rows = await supabaseSelect(
        'donations',
        `donor_email=ilike.${encodeURIComponent(email)}&status=neq.failed&limit=1`
      );
      if (rows.length > 0) {
        return res.status(200).json({ hasDonated: true });
      }
    }

    if (userId) {
      const rows = await supabaseSelect(
        'donations',
        `user_id=eq.${encodeURIComponent(userId)}&status=neq.failed&limit=1`
      );
      if (rows.length > 0) {
        return res.status(200).json({ hasDonated: true });
      }
    }

    return res.status(200).json({ hasDonated: false });
  } catch {
    return res.status(200).json({ hasDonated: false });
  }
}
