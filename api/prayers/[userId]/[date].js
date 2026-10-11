import { supabaseSelect } from '../../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userId = decodeURIComponent(req.query?.userId || '').trim().toLowerCase();
    const date = decodeURIComponent(req.query?.date || '').trim();
    if (!userId || !date) {
      return res.status(200).json({ log: null });
    }

    const rows = await supabaseSelect(
      'prayer_logs',
      `user_id=eq.${encodeURIComponent(userId)}&date=eq.${encodeURIComponent(date)}&limit=1`
    );

    return res.status(200).json({ log: rows[0] || null });
  } catch {
    return res.status(200).json({ log: null });
  }
}
