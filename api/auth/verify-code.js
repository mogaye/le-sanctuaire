import crypto from 'crypto';

const OTP_SECRET =
  process.env.OTP_SECRET ||
  process.env.SMTP_PASS ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sanctuaire-otp-secret-key-2025';

function verifyOtpSignature(email, code, signature) {
  if (!signature || !signature.includes('.')) return false;
  const [expiresAtStr, expectedHmac] = signature.split('.');
  const expiresAt = Number(expiresAtStr);
  if (!expiresAt || Date.now() > expiresAt) {
    return false;
  }
  const cleanEmail = String(email || '').trim().toLowerCase();
  const payload = `${cleanEmail}:${String(code || '').trim()}:${expiresAt}`;
  const actualHmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return actualHmac === expectedHmac;
}

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    const signature = String(body.signature || '').trim();

    if (!email || !code) {
      return res.status(400).json({ verified: false, error: 'E-mail et code requis.' });
    }

    const isValid = verifyOtpSignature(email, code, signature);
    if (!isValid) {
      return res.status(400).json({
        verified: false,
        error: 'Code de vérification invalide ou expiré.',
      });
    }

    return res.status(200).json({ verified: true });
  } catch (error) {
    return res.status(500).json({
      verified: false,
      error: error?.message || 'Erreur lors de la vérification du code.',
    });
  }
}
