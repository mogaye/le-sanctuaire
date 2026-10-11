import nodemailer from 'nodemailer';
import {
  parseRequestBody,
  supabaseSelect,
  supabaseUpsert,
  upsertUserAndProfileInSupabase,
} from './_supabase.js';

const recentThankYouEmails = new Map();

export async function sendDonorThankYouEmail({ donorEmail, donorName, provider, appOrigin }) {
  const cleanEmail = String(donorEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { sent: false, reason: 'invalid_email' };
  }

  const lastSent = recentThankYouEmails.get(cleanEmail) || 0;
  if (Date.now() - lastSent < 2 * 60 * 1000) {
    return { sent: true, reason: 'already_sent_recently' };
  }

  const name = String(donorName || cleanEmail.split('@')[0] || 'Fidèle Bienfaiteur').trim();
  const providerLabel = provider === 'orange_money' ? 'Orange Money' : 'Wave';
  const appUrl = (
    appOrigin ||
    process.env.APP_URL ||
    'https://le-sanctuaire.vercel.app'
  ).replace(/\/$/, '');
  const reviewUrl = `${appUrl}/?avis=donateur`;

  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = (process.env.SMTP_USER || 'mgaye60000@gmail.com').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const isPlaceholderPass =
    !rawPass ||
    rawPass.includes('VOTRE_MOT_DE_PASSE') ||
    rawPass.includes('16_LETTRES') ||
    rawPass === 'your-app-password';
  const smtpPass = isPlaceholderPass ? '' : rawPass;

  if (!smtpPass) {
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subject = `Qu'Allah accepte votre Sadaqah Jariyah — Merci & Rappel | Le Sanctuaire`;
    const html = `
<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0F261A; color: #FFFFFF; border-radius: 22px; overflow: hidden; border: 1px solid #22543D;">
  <div style="padding: 30px 24px; text-align: center; background: linear-gradient(135deg, #153826 0%, #0B1E14 100%); border-bottom: 1px solid rgba(52, 211, 153, 0.25);">
    <p style="font-size: 24px; margin: 0 0 8px 0; color: #FCD34D;">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
    <h1 style="margin: 0; font-size: 21px; font-weight: 800; color: #FFFFFF;">BarakAllahu Fikum pour votre Sadaqah Jariyah</h1>
    <p style="margin: 6px 0 0 0; font-size: 12px; color: #A7F3D0;">Le Sanctuaire Spirituel Quotidien • Soutien via ${providerLabel}</p>
  </div>

  <div style="padding: 28px 24px; background-color: #122B1E; line-height: 1.7;">
    <p style="font-size: 15px; color: #F8FAFC; margin-top: 0;">
      As-salāmu 'alaykum wa rahmatullāhi wa barakātuh <strong>${name}</strong>,
    </p>

    <p style="font-size: 14px; color: #E2E8F0;">
      Nous vous remercions du fond du cœur pour votre don généreux en soutien au <strong>Sanctuaire</strong>. Qu'Allah (Exalté soit-Il) accepte votre aumône continue (<em>Sadaqah Jariyah</em>), purifie vos biens, multiplie vos récompenses et vous accorde Sa bénédiction dans cette vie ainsi que dans l'au-delà.
    </p>

    <div style="margin: 22px 0; padding: 20px; background-color: #0A1911; border-left: 4px solid #FCD34D; border-radius: 14px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #FCD34D;">
        Rappel &amp; Encouragement sur le Droit Chemin (As-Sirāt Al-Mustaqīm)
      </p>
      <p style="margin: 0 0 10px 0; font-size: 18px; text-align: right; color: #A7F3D0; font-family: serif;">
        ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ
      </p>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #E2E8F0; font-style: italic;">
        « Guide-nous dans le droit chemin. » (Sourate Al-Fatiha, 1:6)
      </p>
      <p style="margin: 0; font-size: 13px; color: #CBD5E1;">
        Cher frère, chère sœur en Allah, demeurez ferme et serein(e) sur le droit chemin. Préservez vos 5 prières quotidiennes à l'heure, nourrissez votre cœur par la lecture régulière du Noble Coran et multipliez le Dhikr matin et soir.
      </p>
    </div>

    <div style="margin: 24px 0 10px 0; padding: 20px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(245, 158, 11, 0.12) 100%); border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 16px; text-align: center;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 800; color: #FFFFFF;">
        Partagez votre avis avec la communauté
      </h3>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #D1FAE5;">
        En tant que membre bienfaiteur, votre témoignage est précieux. Laissez-nous votre avis sur votre expérience avec Le Sanctuaire : il sera affiché directement sur notre page d'accueil (Landing Page) pour inspirer et encourager d'autres fidèles.
      </p>
      <a href="${reviewUrl}" style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: #052E16; font-weight: 800; font-size: 13px; text-decoration: none; border-radius: 12px;">
        Donner mon avis pour la page d'accueil
      </a>
    </div>

    <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 22px 0 0 0;">
      Qu'Allah vous garde sur la droiture et illumine votre foyer.<br/>
      <strong>L'équipe Le Sanctuaire</strong>
    </p>
  </div>
</div>`;

    await transporter.sendMail({
      from: `"Le Sanctuaire" <${smtpUser}>`,
      to: cleanEmail,
      subject,
      html,
    });

    recentThankYouEmails.set(cleanEmail, Date.now());

    await supabaseUpsert('email_logs', {
      sender_email: smtpUser,
      recipient_email: cleanEmail,
      subject,
      body_preview: `Remerciement de don et demande d'avis envoyé à ${cleanEmail}`,
      email_type: 'donation_thank_you',
      status: 'sent',
    });

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err?.message || 'smtp_error' };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = String(req.query?.action || '').trim();
  const urlStr = String(req.url || '');

  // GET /api/donations/check
  if (
    req.method === 'GET' &&
    (action === 'check' ||
      urlStr.includes('/check') ||
      req.query?.email !== undefined ||
      req.query?.userId !== undefined)
  ) {
    try {
      const email = String(req.query?.email || '').trim().toLowerCase();
      const userId = String(req.query?.userId || '').trim();

      if (email) {
        const rows = await supabaseSelect(
          'donations',
          `donor_email=ilike.${encodeURIComponent(email)}&status=neq.failed&limit=1`
        );
        if (rows.length > 0) {
          return res.status(200).json({ hasDonated: true });
        }
      }

      if (userId) {
        const rows = await supabaseSelect(
          'donations',
          `user_id=eq.${encodeURIComponent(userId)}&status=neq.failed&limit=1`
        );
        if (rows.length > 0) {
          return res.status(200).json({ hasDonated: true });
        }
      }

      return res.status(200).json({ hasDonated: false });
    } catch {
      return res.status(200).json({ hasDonated: false });
    }
  }

  // GET /api/donations
  if (req.method === 'GET') {
    const donations = await supabaseSelect('donations', 'select=*&order=created_at.desc&limit=100');
    return res.status(200).json({ donations });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = await parseRequestBody(req);

    // POST /api/donations/thank-you
    if (
      action === 'thank-you' ||
      urlStr.includes('/thank-you') ||
      (body.email && !body.amount && !body.donorEmail)
    ) {
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
    }

    // POST /api/donations (Record donation & donor in Supabase)
    const cleanEmail = body.donorEmail ? String(body.donorEmail).trim().toLowerCase() : null;
    const safeAmount = Number(body.amount) > 0 ? Number(body.amount) : 5000;
    const safeRef =
      body.transactionReference ||
      `DON-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    let resolvedId = body.userId || null;
    if (cleanEmail && cleanEmail.includes('@')) {
      const existingProfile = await supabaseSelect(
        'profiles',
        `email=ilike.${encodeURIComponent(cleanEmail)}&limit=1`
      );
      if (existingProfile.length > 0 && existingProfile[0]?.id) {
        resolvedId = existingProfile[0].id;
      } else if (!resolvedId) {
        resolvedId = `acct_${cleanEmail}`;
      }

      await upsertUserAndProfileInSupabase({
        id: resolvedId,
        email: cleanEmail,
        fullName: body.donorName || cleanEmail.split('@')[0],
      });
    } else if (!resolvedId) {
      resolvedId = `guest_${safeRef}`;
    }

    const existingDonation = await supabaseSelect(
      'donations',
      `transaction_reference=eq.${encodeURIComponent(safeRef)}&limit=1`
    );
    if (existingDonation.length > 0) {
      return res.status(200).json({
        donation: existingDonation[0],
        supabaseSaved: true,
        emailSent: false,
      });
    }

    const resolvedDonorName =
      body.donorName || (cleanEmail ? cleanEmail.split('@')[0] : 'Donateur Sadaqah');

    const donationPayload = {
      user_id: resolvedId,
      amount: safeAmount,
      currency: body.currency || 'XOF',
      provider: body.provider || 'wave',
      status: body.status || 'succeeded',
      cause: body.cause || 'Sadaqah Jariyah - Le Sanctuaire',
      donor_name: resolvedDonorName,
      donor_email: cleanEmail,
      donor_phone: body.donorPhone || null,
      is_anonymous: Boolean(body.isAnonymous),
      transaction_reference: safeRef,
    };

    let insertRes = await supabaseUpsert('donations', donationPayload);

    if (!insertRes.ok) {
      const { user_id, ...withoutUid } = donationPayload;
      insertRes = await supabaseUpsert('donations', {
        ...withoutUid,
        provider:
          withoutUid.provider === 'orange_money' ? 'direct_transfer' : withoutUid.provider || 'wave',
      });
    }

    if (!insertRes.ok) {
      insertRes = await supabaseUpsert('donations', {
        amount: safeAmount,
        currency: body.currency || 'XOF',
        provider: body.provider === 'orange_money' ? 'direct_transfer' : body.provider || 'wave',
        status: body.status || 'succeeded',
        cause: body.cause || 'Sadaqah Jariyah - Le Sanctuaire',
        donor_name: resolvedDonorName,
        donor_email: cleanEmail,
      });
    }

    let emailResult = { sent: false };
    if (cleanEmail && cleanEmail.includes('@')) {
      const origin = req.headers.origin || 'https://le-sanctuaire.vercel.app';
      emailResult = await sendDonorThankYouEmail({
        donorEmail: cleanEmail,
        donorName: resolvedDonorName,
        provider: body.provider,
        appOrigin: origin,
      });
    }

    return res.status(200).json({
      donation: insertRes.data?.[0] || donationPayload,
      supabaseSaved: Boolean(insertRes.ok),
      supabaseError: insertRes.ok ? undefined : insertRes.error,
      emailSent: emailResult.sent,
      emailReason: emailResult.reason,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to record donation' });
  }
}
