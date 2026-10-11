import { parseRequestBody, supabaseSelect, supabasePatch, supabaseUpsert } from './_supabase.js';

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
    const { userId, date, prayerKey, completed } = body || {};
    if (!userId || !date || !prayerKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanId = String(userId).trim().toLowerCase();
    const nowIso = new Date().toISOString();
    const payload = {
      user_id: cleanId,
      date,
      [prayerKey]: Boolean(completed),
      updated_at: nowIso,
    };

    let result = await supabaseUpsert('prayer_logs', payload, 'user_id,date');
    if (!result.ok) {
      const existing = await supabaseSelect(
        'prayer_logs',
        `user_id=eq.${encodeURIComponent(cleanId)}&date=eq.${encodeURIComponent(date)}&limit=1`
      );
      if (existing.length > 0 && existing[0]?.id) {
        result = await supabasePatch('prayer_logs', `id=eq.${existing[0].id}`, payload);
      } else {
        result = await supabaseUpsert('prayer_logs', payload);
      }
    }

    return res.status(200).json({
      log: result.data?.[0] || { userId: cleanId, date, [prayerKey]: Boolean(completed) },
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to update prayer log' });
  }
}
