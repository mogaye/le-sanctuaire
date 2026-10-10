const VERIFIED_KEYS = {
  masterKey: 'DbDQF7UZ-eGTd-AvLI-rKX0-TRalACuat69v',
  publicKey: 'live_public_sQarWhJMc6Tgjy1uDroFvTxuSer',
  privateKey: 'live_private_vp0fK771yioUfxI5MUz9pDscnrY',
  token: 'pBMNpVEEk3jX2VINqMvJ',
};

async function parseRequestBody(req) {
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

  // Fallback: read stream directly if body was not pre-parsed by runtime
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

async function callPayDunya(payload, keys) {
  const res = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': keys.masterKey.trim(),
      'PAYDUNYA-PUBLIC-KEY': keys.publicKey.trim(),
      'PAYDUNYA-PRIVATE-KEY': keys.privateKey.trim(),
      'PAYDUNYA-TOKEN': keys.token.trim(),
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const rawBody = await parseRequestBody(req);
    const origin = req.headers.origin || 'https://le-sanctuaire.vercel.app';

    const payload = rawBody && rawBody.invoice
      ? rawBody
      : {
          invoice: {
            total_amount: Number(rawBody?.amount) || 5000,
            description: rawBody?.description || 'Don Sadaqah - Le Sanctuaire',
          },
          store: {
            name: 'Le Sanctuaire',
            website_url: origin,
          },
          actions: {
            cancel_url: origin,
            return_url: origin,
          },
        };

    // Always try verified live merchant credentials first so stale Vercel env vars never break checkout
    let data = await callPayDunya(payload, VERIFIED_KEYS);

    // If custom env vars are provided and differ, try them as fallback if needed
    const envMaster = process.env.PAYDUNYA_MASTER_KEY || process.env.VITE_PAYDUNYA_MASTER_KEY;
    const envPublic = process.env.PAYDUNYA_PUBLIC_KEY || process.env.VITE_PAYDUNYA_PUBLIC_KEY;
    const envPrivate = process.env.PAYDUNYA_PRIVATE_KEY || process.env.VITE_PAYDUNYA_PRIVATE_KEY;
    const envToken = process.env.PAYDUNYA_TOKEN || process.env.VITE_PAYDUNYA_TOKEN;

    if (data.response_code !== '00' && envMaster && envPrivate && envToken && envPublic) {
      data = await callPayDunya(payload, {
        masterKey: envMaster,
        publicKey: envPublic,
        privateKey: envPrivate,
        token: envToken,
      });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ response_code: '99', error: String(err) });
  }
}
