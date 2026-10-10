import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  upsertConnectedProfile,
  getAllConnectedProfiles,
  getPrayerLogFromDb,
  upsertPrayerLogInDb,
  insertDonationInDb,
  checkDonorStatusInDb,
  logSentEmailInDb,
  getSentEmailsFromDb,
} from './src/db/users.ts';

dotenv.config();

const OTP_SECRET =
  process.env.OTP_SECRET ||
  process.env.SMTP_PASS ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sanctuaire-otp-secret-key-2025';

function createOtpSignature(email: string, code: string, expiresAt: number): string {
  const cleanEmail = email.trim().toLowerCase();
  const payload = `${cleanEmail}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return `${expiresAt}.${hmac}`;
}

function verifyOtpSignature(email: string, code: string, signature: string): boolean {
  if (!signature || !signature.includes('.')) return false;
  const [expiresAtStr, expectedHmac] = signature.split('.');
  const expiresAt = Number(expiresAtStr);
  if (!expiresAt || Date.now() > expiresAt) return false;
  const cleanEmail = email.trim().toLowerCase();
  const payload = `${cleanEmail}:${code.trim()}:${expiresAt}`;
  const actualHmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return actualHmac === expectedHmac;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ============================================================================
  // 1. CONNECTED ACCOUNTS & PROFILES ROUTES (PostgreSQL / Supabase Schema)
  // ============================================================================

  // Fetch all connected/registered accounts so the user can see and switch to them
  app.get('/api/accounts', async (_req, res) => {
    try {
      const accounts = await getAllConnectedProfiles();
      res.json({ accounts });
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch accounts', accounts: [] });
    }
  });

  // Synchronize or register a connected profile in the PostgreSQL database
  app.post('/api/accounts/sync', async (req, res) => {
    try {
      const { id, email, fullName, firstName, lastName, avatarUrl, cityName } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const profile = await upsertConnectedProfile({
        id: id || `acct_${email.trim().toLowerCase()}`,
        email,
        fullName,
        firstName,
        lastName,
        avatarUrl,
        cityName,
      });
      res.json({ profile });
    } catch (error: any) {
      console.error('Failed to sync account:', error);
      res.status(500).json({ error: error.message || 'Failed to sync account' });
    }
  });

  // Protected Firebase Auth user synchronization route
  app.post('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userRecord = await getOrCreateUser(
        req.user.uid,
        req.user.email || '',
        req.user.name,
        req.user.name?.split(' ')[0],
        req.user.name?.split(' ').slice(1).join(' '),
        req.user.picture
      );
      res.json({ user: userRecord });
    } catch (error: any) {
      console.error('Failed to sync authenticated user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // ============================================================================
  // 2. PRAYER LOGS & DONATIONS DATABASE ROUTES
  // ============================================================================

  app.get('/api/prayers/:userId/:date', async (req, res) => {
    try {
      const log = await getPrayerLogFromDb(req.params.userId, req.params.date);
      res.json({ log });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch prayer log' });
    }
  });

  app.post('/api/prayers', async (req, res) => {
    try {
      const { userId, date, prayerKey, completed } = req.body || {};
      if (!userId || !date || !prayerKey) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const log = await upsertPrayerLogInDb(userId, date, prayerKey, Boolean(completed));
      res.json({ log });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update prayer log' });
    }
  });

  app.post('/api/donations', async (req, res) => {
    try {
      const body = req.body || {};
      const record = await insertDonationInDb({
        userId: body.userId,
        amount: String(body.amount || 0),
        currency: body.currency || 'XOF',
        provider: body.provider || 'dunyapay',
        status: body.status || 'succeeded',
        cause: body.cause || 'general',
        donorName: body.donorName,
        donorEmail: body.donorEmail,
        donorPhone: body.donorPhone,
        isAnonymous: body.isAnonymous,
        transactionReference: body.transactionReference,
      });
      res.json({ donation: record });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to record donation' });
    }
  });

  app.get('/api/donations/check', async (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email : undefined;
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const hasDonated = await checkDonorStatusInDb(email, userId);
      res.json({ hasDonated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to check donor status', hasDonated: false });
    }
  });

  // ============================================================================
  // 3. EMAIL LOGS ROUTES (Outbox & Verification Email Logs)
  // ============================================================================

  app.get('/api/emails', async (_req, res) => {
    try {
      const emails = await getSentEmailsFromDb();
      res.json({ emails });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch email logs', emails: [] });
    }
  });

  app.post('/api/emails/log', async (req, res) => {
    try {
      const { senderEmail, recipientEmail, subject, bodyPreview, emailType, status } = req.body || {};
      if (!senderEmail || !recipientEmail || !subject) {
        return res.status(400).json({ error: 'Missing required email fields' });
      }
      const entry = await logSentEmailInDb({
        senderEmail,
        recipientEmail,
        subject,
        bodyPreview,
        emailType,
        status,
      });
      res.json({ email: entry });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to log email' });
    }
  });

  // Real 6-digit verification code sender via SMTP
  app.post('/api/auth/send-code', async (req, res) => {
    try {
      const { email: rawEmail, fullName: rawName } = req.body || {};
      const email = String(rawEmail || '').trim().toLowerCase();
      const fullName = String(rawName || email.split('@')[0] || 'Fidèle').trim();

      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'Adresse e-mail invalide.' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000;
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

          const html = `
<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0F261A; color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #22543D;">
  <div style="padding: 28px 24px; text-align: center; background: linear-gradient(135deg, #153826 0%, #0B1E14 100%); border-bottom: 1px solid rgba(52, 211, 153, 0.25);">
    <p style="font-size: 22px; margin: 0 0 6px 0; color: #FCD34D;">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">Le Sanctuaire Spirituel</h1>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #A7F3D0;">Authentification &amp; Code de Vérification</p>
  </div>
  <div style="padding: 28px 24px; background-color: #122B1E; text-align: center;">
    <p style="font-size: 15px; line-height: 1.6; color: #E2E8F0; margin-top: 0;">
      As-salāmu 'alaykum <strong>${fullName}</strong>,
    </p>
    <p style="font-size: 13px; line-height: 1.6; color: #CBD5E1;">
      Voici votre code de vérification officiel à 6 chiffres pour confirmer votre compte (<strong>${email}</strong>) sur <strong>Le Sanctuaire</strong> :
    </p>
    <div style="margin: 24px auto; padding: 18px; max-width: 280px; background-color: #0A1911; border: 2px solid #34D399; border-radius: 16px; text-align: center;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #FCD34D;">
        ${code}
      </span>
    </div>
    <p style="font-size: 12px; color: #94A3B8; margin: 16px 0;">
      Ce code est valable pendant 15 minutes. Saisissez-le sur la page de connexion pour activer votre espace.
    </p>
  </div>
</div>`;

          await transporter.sendMail({
            from: `"Le Sanctuaire" <${smtpUser}>`,
            to: email,
            subject: `Code de vérification Le Sanctuaire : ${code}`,
            html,
          });

          try {
            await logSentEmailInDb({
              senderEmail: smtpUser,
              recipientEmail: email,
              subject: `Code de vérification Le Sanctuaire : ${code}`,
              bodyPreview: `Code OTP envoyé à ${email}`,
              emailType: 'verification',
              status: 'sent',
            });
          } catch {
            // ignore db log error
          }

          return res.json({
            success: true,
            provider: 'smtp',
            smtpSent: true,
            signature,
            code,
            senderEmail: smtpUser,
            message: `Un vrai code de vérification à 6 chiffres a été envoyé à ${email}.`,
          });
        } catch (smtpError: any) {
          console.error('SMTP send error:', smtpError);
          return res.json({
            success: true,
            provider: 'smtp_error',
            smtpSent: false,
            smtpError: smtpError?.message || 'Erreur SMTP Gmail',
            signature,
            code,
            message: 'Envoi via Gmail OAuth requis (SMTP_PASS invalide ou bloqué).',
          });
        }
      }

      return res.json({
        success: true,
        provider: 'gmail_oauth',
        smtpSent: false,
        signature,
        code,
        message: 'Envoi prêt via votre compte Gmail (OAuth) ou Supabase.',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || "Erreur lors de l'envoi du code SMTP.",
      });
    }
  });

  app.post('/api/auth/verify-code', async (req, res) => {
    try {
      const { email, code, signature } = req.body || {};
      if (!email || !code) {
        return res.status(400).json({ verified: false, error: 'E-mail et code requis.' });
      }
      const isValid = verifyOtpSignature(String(email), String(code), String(signature || ''));
      if (!isValid) {
        return res.status(400).json({
          verified: false,
          error: 'Code de vérification invalide ou expiré.',
        });
      }
      return res.json({ verified: true });
    } catch (error: any) {
      res.status(500).json({
        verified: false,
        error: error?.message || 'Erreur lors de la vérification du code.',
      });
    }
  });

  // ============================================================================
  // 4. PAYDUNYA INVOICE CREATION ROUTE
  // ============================================================================

  app.post('/api/paydunya/create-invoice', async (req, res) => {
    try {
      const masterKey = (
        process.env.PAYDUNYA_MASTER_KEY ||
        process.env.VITE_DUNYAPAY_MASTER_KEY ||
        'wQzk9ZwR-Qq9m-4hD0-b55F-c49238295f71'
      ).trim();
      const publicKey = (
        process.env.PAYDUNYA_PUBLIC_KEY ||
        process.env.VITE_DUNYAPAY_PUBLIC_KEY ||
        'live_public_d8A0W4p68G7c8fD2L1C0M9B4K3J'
      ).trim();
      const privateKey = (
        process.env.PAYDUNYA_PRIVATE_KEY ||
        process.env.VITE_DUNYAPAY_PRIVATE_KEY ||
        'live_private_p9L8K7J6H5G4F3D2S1A0Q9W8E7R'
      ).trim();
      const token = (
        process.env.PAYDUNYA_TOKEN ||
        process.env.VITE_DUNYAPAY_TOKEN ||
        'n7M6B5V4C3X2Z1L0K9J8'
      ).trim();

      const response = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PAYDUNYA-MASTER-KEY': masterKey,
          'PAYDUNYA-PUBLIC-KEY': publicKey,
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': token,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({
        response_code: '01',
        response_text: error?.message || 'Erreur serveur PayDunya',
      });
    }
  });

  // ============================================================================
  // 5. VITE MIDDLEWARE / STATIC ASSETS
  // ============================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
