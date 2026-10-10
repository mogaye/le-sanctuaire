import { getAccessToken, googleSignIn } from './firebase';

export interface SendGmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  emailType?: 'verification' | 'welcome' | 'notification' | 'general';
}

// Helper to encode a string into Base64URL format required by Gmail API
function encodeBase64Url(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Build RFC 2822 MIME message with UTF-8 Subject & HTML body
function buildMimeMessage(fromEmail: string, toEmail: string, subject: string, htmlBody: string): string {
  const encodedSubject = `=?utf-8?B?${btoa(
    Array.from(new TextEncoder().encode(subject), (b) => String.fromCharCode(b)).join('')
  )}?=`;

  const lines = [
    `From: "Le Sanctuaire Spirituel" <${fromEmail}>`,
    `To: ${toEmail}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlBody,
  ];

  return encodeBase64Url(lines.join('\r\n'));
}

export async function sendEmailWithGmailAccount(
  payload: SendGmailPayload,
  senderEmailHint = 'mgaye60000@gmail.com'
): Promise<{ success: boolean; messageId?: string; senderEmail?: string; error?: string }> {
  try {
    let token = await getAccessToken();
    let activeSenderEmail = senderEmailHint;

    if (!token) {
      const signInResult = await googleSignIn();
      if (!signInResult?.accessToken) {
        return {
          success: false,
          error: 'Autorisation Gmail requise pour envoyer des e-mails depuis votre compte.',
        };
      }
      token = signInResult.accessToken;
      if (signInResult.user?.email) {
        activeSenderEmail = signInResult.user.email;
      }
    }

    const raw = buildMimeMessage(
      activeSenderEmail,
      payload.to.trim(),
      payload.subject,
      payload.htmlBody
    );

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || "Erreur lors de l'envoi via l'API Gmail.",
      };
    }

    // Log the sent email in our PostgreSQL database
    try {
      await fetch('/api/emails/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: activeSenderEmail,
          recipientEmail: payload.to.trim(),
          subject: payload.subject,
          bodyPreview: (payload.textBody || payload.subject).slice(0, 200),
          emailType: payload.emailType || 'general',
          status: 'sent',
        }),
      });
    } catch {
      // ignore logging error
    }

    return {
      success: true,
      messageId: data.id,
      senderEmail: activeSenderEmail,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Impossible d'envoyer l'e-mail avec Gmail.",
    };
  }
}

export function buildVerificationEmailHtml(recipientName: string, verificationCode: string): string {
  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0F261A; color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #22543D;">
      <div style="padding: 28px 24px; text-align: center; background: linear-gradient(135deg, #153826 0%, #0B1E14 100%); border-bottom: 1px solid rgba(52, 211, 153, 0.2);">
        <p style="font-size: 22px; margin: 0 0 6px 0; color: #FCD34D;">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">Le Sanctuaire Spirituel</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #A7F3D0;">Confirmation & Authentification de votre compte</p>
      </div>
      <div style="padding: 28px 24px; background-color: #122B1E;">
        <p style="font-size: 14px; line-height: 1.6; color: #E2E8F0; margin-top: 0;">
          As-salāmu 'alaykum <strong>${recipientName || 'Cher croyant'}</strong>,
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #CBD5E1;">
          Bienvenue dans votre espace spirituel <strong>Le Sanctuaire</strong>. Voici votre code de vérification personnel pour authentifier votre adresse e-mail :
        </p>
        <div style="margin: 24px 0; padding: 18px; background-color: #0A1911; border: 1px solid #34D399; border-radius: 14px; text-align: center;">
          <span style="font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #FCD34D;">
            ${verificationCode}
          </span>
        </div>
        <p style="font-size: 12px; line-height: 1.5; color: #94A3B8; margin-bottom: 0;">
          Qu'Allah vous accorde la sérénité, la constance dans la prière et la lumière du Saint Coran.
        </p>
      </div>
    </div>
  `;
}
