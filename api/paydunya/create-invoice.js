export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const masterKey = process.env.VITE_PAYDUNYA_MASTER_KEY || 'DbDQF7UZ-eGTd-AvLI-rKX0-TRalACuat69v';
    const publicKey = process.env.VITE_PAYDUNYA_PUBLIC_KEY || 'live_public_sQarWhJMc6Tgjy1uDroFvTxuSer';
    const privateKey = process.env.VITE_PAYDUNYA_PRIVATE_KEY || 'live_private_vp0fK771yioUfxI5MUz9pDscnrY';
    const token = process.env.VITE_PAYDUNYA_TOKEN || 'pBMNpVEEk3jX2VINqMvJ';

    const paydunyaRes = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': masterKey,
        'PAYDUNYA-PUBLIC-KEY': publicKey,
        'PAYDUNYA-PRIVATE-KEY': privateKey,
        'PAYDUNYA-TOKEN': token,
      },
      body: JSON.stringify(body),
    });

    const data = await paydunyaRes.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ response_code: '99', error: String(err) });
  }
}
