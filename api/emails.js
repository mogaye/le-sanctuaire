import { parseRequestBody, supabaseSelect, supabaseUpsert } from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { senderEmail, recipientEmail, subject, bodyPreview, emailType, status } = body || {};
      if (!senderEmail || !recipientEmail || !subject) {
        return res.status(400).json({ error: 'Missing required email fields' });
      }

      const resInsert = await supabaseUpsert('email_logs', {
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        subject,
        body_preview: bodyPreview || null,
        email_type: emailType || 'general',
        status: status || 'sent',
      });

      return res.status(200).json({ email: resInsert.data?.[0] || body });
    } catch (err) {
      return res.status(500).json({ error: err?.message || 'Failed to log email' });
    }
  }

  try {
    const emails = await supabaseSelect('email_logs', 'order=created_at.desc&limit=50');
    return res.status(200).json({ emails });
  } catch {
    return res.status(200).json({ emails: [] });
  }
}
