import { parseRequestBody, supabaseSelect, supabaseUpsert } from './_supabase.js';

const memoryReviews = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const rows = await supabaseSelect(
        'email_logs',
        'email_type=eq.donor_review&order=created_at.desc'
      );
      const dbReviews = rows
        .map((r) => {
          let meta = {};
          try {
            meta = JSON.parse(r.subject || '{}');
          } catch {
            meta = { name: r.subject || 'Bienfaiteur' };
          }
          return {
            id: String(r.id),
            name: meta.name || (r.sender_email || '').split('@')[0] || 'Membre Bienfaiteur',
            email: r.sender_email,
            city: meta.city || 'Dakar',
            rating: Number(meta.rating) || 5,
            comment: r.body_preview || '',
            createdAt: r.created_at || new Date().toISOString(),
          };
        })
        .filter((r) => Boolean(r.comment));

      const map = new Map();
      for (const item of memoryReviews) map.set(item.id, item);
      for (const item of dbReviews) map.set(item.id, item);

      return res.status(200).json({ reviews: Array.from(map.values()) });
    }

    if (req.method === 'POST') {
      const body = await parseRequestBody(req);
      const { name, email, city, rating, comment } = body || {};
      if (!comment || !String(comment).trim()) {
        return res.status(400).json({ error: 'Veuillez écrire votre avis.' });
      }
      const cleanName = String(name || 'Membre Bienfaiteur').trim();
      const cleanEmail = String(email || 'donateur@sanctuaire.app').trim().toLowerCase();
      const cleanCity = String(city || 'Dakar').trim();
      const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5));
      const cleanComment = String(comment).trim();
      const metaJson = JSON.stringify({
        name: cleanName,
        city: cleanCity,
        rating: cleanRating,
      });

      const insertRes = await supabaseUpsert('email_logs', {
        sender_email: cleanEmail,
        recipient_email: 'landing_page_reviews',
        subject: metaJson,
        body_preview: cleanComment,
        email_type: 'donor_review',
        status: 'published',
      });

      const saved = {
        id:
          Array.isArray(insertRes.data) && insertRes.data[0]?.id
            ? String(insertRes.data[0].id)
            : 'rev_' + Date.now(),
        name: cleanName,
        email: cleanEmail,
        city: cleanCity,
        rating: cleanRating,
        comment: cleanComment,
        createdAt: new Date().toISOString(),
      };
      memoryReviews.unshift(saved);
      return res.status(200).json({ review: saved });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Erreur avis donateur' });
  }
}
