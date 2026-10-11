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
      const [rows, donationRows] = await Promise.all([
        supabaseSelect('email_logs', 'email_type=eq.donor_review&order=created_at.desc'),
        supabaseSelect('donations', 'status=neq.failed&select=donor_email,donor_name'),
      ]);

      const donorEmails = new Set(
        (donationRows || [])
          .map((d) => String(d.donor_email || '').trim().toLowerCase())
          .filter(Boolean)
      );
      const donorNames = new Set(
        (donationRows || [])
          .map((d) => String(d.donor_name || '').trim().toLowerCase())
          .filter(Boolean)
      );

      const dbReviews = rows
        .map((r) => {
          let meta = {};
          try {
            meta = JSON.parse(r.subject || '{}');
          } catch {
            meta = { name: r.subject || 'Membre du Sanctuaire' };
          }
          const emailLower = String(r.sender_email || '').trim().toLowerCase();
          const nameLower = String(meta.name || '').trim().toLowerCase();
          const isDonor = Boolean(
            meta.isDonor ||
              (emailLower &&
                emailLower !== 'membre@sanctuaire.app' &&
                emailLower !== 'donateur@sanctuaire.app' &&
                donorEmails.has(emailLower)) ||
              (nameLower && donorNames.has(nameLower))
          );
          return {
            id: String(r.id),
            name: meta.name || (r.sender_email || '').split('@')[0] || 'Membre du Sanctuaire',
            email: r.sender_email,
            city: meta.city || 'Dakar',
            rating: Number(meta.rating) || 5,
            comment: r.body_preview || '',
            isDonor,
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
      const { name, email, city, rating, comment, isDonor: bodyIsDonor } = body || {};
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(401).json({ error: 'Compte requis.' });
      }
      if (!comment || !String(comment).trim()) {
        return res.status(400).json({ error: 'Veuillez écrire votre avis.' });
      }
      const cleanName = String(name || cleanEmail.split('@')[0] || 'Membre du Sanctuaire').trim();
      const cleanCity = String(city || 'Dakar').trim();
      const cleanRating = Math.min(5, Math.max(1, Number(rating) || 5));
      const cleanComment = String(comment).trim();

      let verifiedDonor = Boolean(bodyIsDonor);
      if (!verifiedDonor) {
        const donorCheck = await supabaseSelect(
          'donations',
          `donor_email=ilike.${encodeURIComponent(cleanEmail)}&status=neq.failed&limit=1`
        );
        if (Array.isArray(donorCheck) && donorCheck.length > 0) {
          verifiedDonor = true;
        }
      }

      const metaJson = JSON.stringify({
        name: cleanName,
        city: cleanCity,
        rating: cleanRating,
        isDonor: verifiedDonor,
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
        isDonor: verifiedDonor,
        createdAt: new Date().toISOString(),
      };
      memoryReviews.unshift(saved);
      return res.status(200).json({ review: saved });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Erreur lors de la publication de votre avis' });
  }
}
