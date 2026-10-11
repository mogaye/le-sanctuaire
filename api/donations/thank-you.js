import { parseRequestBody } from '../_supabase.js';
import { sendDonorThankYouEmail } from '../donations.js';

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
    const { email, name, provider } = body || {};
    if (!email || !String(email).includes('@')) {
      return res.status(400).json({ sent: false, error: 'E-mail du compte requis.' });
    }
    const origin = req.headers.origin || 'https://le-sanctuaire.vercel.app';
    const result = await sendDonorThankYouEmail({
      donorEmail: String(email),
      donorName: name,
      provider,
      appOrigin: origin,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ sent: false, error: err?.message || 'Erreur envoi e-mail' });
  }
}
