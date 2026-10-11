import { supabaseSelect } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const emails = await supabaseSelect('email_logs', 'order=created_at.desc&limit=50');
    return res.status(200).json({ emails });
  } catch {
    return res.status(200).json({ emails: [] });
  }
}
