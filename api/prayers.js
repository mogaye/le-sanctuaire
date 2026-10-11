import { parseRequestBody, supabaseSelect, supabasePatch, supabaseUpsert } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { userId, date, prayerKey, completed } = body || {};
    if (!userId || !date || !prayerKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanId = String(userId).trim().toLowerCase();
    const validKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    if (!validKeys.includes(prayerKey)) {
      return res.status(400).json({ error: 'Invalid prayerKey' });
    }

    const existing = await supabaseSelect(
      'prayer_logs',
      `user_id=eq.${encodeURIComponent(cleanId)}&date=eq.${encodeURIComponent(date)}&limit=1`
    );

    if (existing.length > 0) {
      const patchRes = await supabasePatch(
        'prayer_logs',
        `user_id=eq.${encodeURIComponent(cleanId)}&date=eq.${encodeURIComponent(date)}`,
        {
          [prayerKey]: Boolean(completed),
          updated_at: new Date().toISOString(),
        }
      );
      return res.status(200).json({ log: patchRes.data?.[0] || existing[0] });
    } else {
      const payload = {
        user_id: cleanId,
        date,
        fajr: prayerKey === 'fajr' ? Boolean(completed) : false,
        dhuhr: prayerKey === 'dhuhr' ? Boolean(completed) : false,
        asr: prayerKey === 'asr' ? Boolean(completed) : false,
        maghrib: prayerKey === 'maghrib' ? Boolean(completed) : false,
        isha: prayerKey === 'isha' ? Boolean(completed) : false,
        updated_at: new Date().toISOString(),
      };
      let insRes = await supabaseUpsert('prayer_logs', payload, 'user_id,date');
      if (!insRes.ok) {
        insRes = await supabaseUpsert('prayer_logs', payload);
      }
      return res.status(200).json({ log: insRes.data?.[0] || payload });
    }
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to update prayer log' });
  }
}
