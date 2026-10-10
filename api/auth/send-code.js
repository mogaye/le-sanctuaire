import nodemailer from 'nodemailer';
import crypto from 'crypto';

const OTP_SECRET =
  process.env.OTP_SECRET ||
  process.env.SMTP_PASS ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sanctuaire-otp-secret-key-2025';

function createOtpSignature(email, code, expiresAt) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const payload = `${cleanEmail}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return `${expiresAt}.${hmac}`;
}

function buildEmailHtml(recipientName, code, recipientEmail) {
  return `
<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0F261A; color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #22543D;">
  <div style="padding: 28px 24px; text-align: center; background: linear-gradient(135deg, #153826 0%, #0B1E14 100%); border-bottom: 1px solid rgba(52, 211, 153, 0.25);">
    <p style="font-size: 22px; margin: 0 0 6px 0; color: #FCD34D;">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">Le Sanctuaire Spirituel</h1>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #A7F3D0;">Authentification &amp; Code de Vérification</p>
  </div>
  <div style="padding: 28px 24px; background-color: #122B1E; text-align: center;">
    <p style="font-size: 15px; line-height: 1.6; color: #E2E8F0; margin-top: 0;">
      As-salāmu 'alaykum <strong>${recipientName || 'Cher croyant'}</strong>,
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: #CBD5E1;">
      Voici votre code de vérification officiel à 6 chiffres pour confirmer votre compte (<strong>${recipientEmail}</strong>) sur <strong>Le Sanctuaire</strong> :
    </p>
    <div style="margin: 24px auto; padding: 18px; max-width: 280px; background-color: #0A1911; border: 2px solid #34D399; border-radius: 16px; text-align: center;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #FCD34D;">
        ${code}
      </span>
    </div>
    <p style="font-size: 12px; color: #94A3B8; margin: 16px 0;">
      Ce code est valable pendant 15 minutes. Saisissez-le sur la page de connexion pour activer votre espace.
    </p>
    <p style="font-size: 11px; line-height: 1.5; color: #64748B; margin-bottom: 0; padding-top: 14px; border-top: 1px solid rgba(52, 211, 153, 0.15);">
      Qu'Allah vous accorde la sérénité, la constance dans la prière et la lumière du Saint Coran.
    </p>
  </div>
</div>`;
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
    const fullName = String(body.fullName || email.split('@')[0] || 'Fidèle').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresse e-mail invalide.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    const signature = createOtpSignature(email, code, expiresAt);

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

    if (smtpPass) {
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

        await transporter.sendMail({
          from: `"Le Sanctuaire" <${smtpUser}>`,
          to: email,
          subject: `Code de vérification Le Sanctuaire : ${code}`,
          html: buildEmailHtml(fullName, code, email),
        });

        return res.status(200).json({
          success: true,
          provider: 'smtp',
          smtpSent: true,
          signature,
          code,
          senderEmail: smtpUser,
          message: `Un vrai code de vérification à 6 chiffres a été envoyé à ${email}.`,
        });
      } catch (smtpError) {
        console.error('SMTP error in /api/auth/send-code:', smtpError);
        return res.status(200).json({
          success: true,
          provider: 'smtp_error',
          smtpSent: false,
          smtpError: smtpError?.message || 'Erreur SMTP Gmail',
          signature,
          code,
          message: 'Envoi via Gmail OAuth requis (SMTP_PASS invalide ou non configuré).',
        });
      }
    }

    return res.status(200).json({
      success: true,
      provider: 'gmail_oauth',
      smtpSent: false,
      signature,
      code,
      message: 'Envoi délégué à Gmail OAuth / Supabase.',
    });
  } catch (error) {
    console.error('Error in /api/auth/send-code:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur lors de l'envoi du code de vérification par SMTP.",
    });
  }
}
