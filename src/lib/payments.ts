import { recordDonationInSupabase, DonationRecord } from './supabase';

export interface PaymentRequest {
  amount: number;
  currency: 'XOF' | 'EUR' | 'USD';
  provider: 'wave' | 'dunyapay' | 'direct_transfer';
  cause: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  userId?: string;
}

export interface PaymentResponse {
  success: boolean;
  checkoutUrl?: string;
  paymentReference: string;
  message: string;
  provider: 'wave' | 'dunyapay' | 'direct_transfer';
  isSandbox?: boolean;
}

// PayDunya / DunyaPay 4 Verified Live Merchant Credentials
export interface DunyaPayConfig {
  masterKey: string;
  privateKey: string;
  token: string;
  publicKey: string;
}

const VERIFIED_PAYDUNYA_KEYS: DunyaPayConfig = {
  masterKey: 'DbDQF7UZ-eGTd-AvLI-rKX0-TRalACuat69v',
  privateKey: 'live_private_vp0fK771yioUfxI5MUz9pDscnrY',
  token: 'pBMNpVEEk3jX2VINqMvJ',
  publicKey: 'live_public_sQarWhJMc6Tgjy1uDroFvTxuSer',
};

export const getDunyaPayConfig = (): DunyaPayConfig => {
  return VERIFIED_PAYDUNYA_KEYS;
};

export const isDunyaPayConfigured = (): boolean => {
  const conf = getDunyaPayConfig();
  return (
    conf.masterKey.length > 5 &&
    conf.privateKey.length > 5 &&
    conf.token.length > 5
  );
};

// Wave is paused by user request
export const isWaveConfigured = (): boolean => {
  return false;
};

async function callPayDunyaDirect(payload: Record<string, unknown>, keys: DunyaPayConfig) {
  const directRes = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': keys.masterKey.trim(),
      'PAYDUNYA-PUBLIC-KEY': keys.publicKey.trim(),
      'PAYDUNYA-PRIVATE-KEY': keys.privateKey.trim(),
      'PAYDUNYA-TOKEN': keys.token.trim(),
    },
    body: JSON.stringify(payload),
  });
  return directRes.json();
}

// Call PayDunya API to generate live payment invoice URL
async function requestPayDunyaInvoice(
  amount: number,
  description: string,
  ref: string,
  cancelUrl: string,
  returnUrl: string
): Promise<{ url?: string; token?: string; error?: string }> {
  const cleanOrigin =
    typeof window !== 'undefined' && window.location.origin.startsWith('http')
      ? window.location.origin
      : 'https://le-sanctuaire.vercel.app';
  const safeCancelUrl = cancelUrl && cancelUrl.startsWith('http') ? cancelUrl : cleanOrigin;
  const safeReturnUrl = returnUrl && returnUrl.startsWith('http') ? returnUrl : cleanOrigin;

  const payload = {
    invoice: {
      total_amount: Math.round(Number(amount) || 5000),
      description: description || 'Sadaqah Jariyah - Le Sanctuaire',
    },
    store: {
      name: 'Le Sanctuaire',
      website_url: cleanOrigin,
    },
    custom_data: {
      transaction_id: ref,
    },
    actions: {
      cancel_url: safeCancelUrl,
      return_url: safeReturnUrl,
    },
  };

  // 1. Try direct PayDunya API call with verified live credentials first (fastest on Vercel & browsers)
  try {
    const directData = await callPayDunyaDirect(payload, VERIFIED_PAYDUNYA_KEYS);
    if (directData && directData.response_code === '00' && directData.response_text) {
      const cleanUrl = String(directData.response_text).replace(/\\\//g, '/').trim();
      if (cleanUrl.startsWith('http')) {
        return { url: cleanUrl, token: directData.token };
      }
    }
  } catch {
    // Fall back to serverless API proxy
  }

  // 2. Try Vercel / Vite API proxy (/api/paydunya/create-invoice)
  try {
    const proxyRes = await fetch('/api/paydunya/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.response_code === '00' && data.response_text) {
        const cleanUrl = String(data.response_text).replace(/\\\//g, '/').trim();
        if (cleanUrl.startsWith('http')) {
          return { url: cleanUrl, token: data.token };
        }
      }
      if (data && data.response_text) {
        return { error: String(data.response_text) };
      }
    }
  } catch (err) {
    return { error: String(err) };
  }

  return { error: 'Impossible de joindre le service PayDunya. Veuillez réessayer.' };
}

// Process Donation via PayDunya (Orange Money, Wave, Free Money, Carte Bancaire)
export async function processDunyaPayDonation(req: PaymentRequest): Promise<PaymentResponse> {
  const ref = 'DP-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://le-sanctuaire.vercel.app';

  const invoiceResult = await requestPayDunyaInvoice(
    req.amount,
    `Don Sadaqah (${req.cause || 'Projet Spirituel'})`,
    ref,
    currentUrl,
    currentUrl
  );

  const checkoutUrl = invoiceResult.url;
  const paymentToken = invoiceResult.token || ref;

  // Record donation in Supabase without blocking the PayDunya redirect
  const donationData: DonationRecord = {
    amount: req.amount,
    currency: req.currency,
    provider: 'dunyapay',
    status: checkoutUrl ? 'succeeded' : 'pending',
    cause: req.cause,
    donorName: req.isAnonymous ? 'Donateur Anonyme (Sadaqah)' : req.donorName,
    donorEmail: req.donorEmail,
    donorPhone: req.donorPhone,
    isAnonymous: req.isAnonymous,
    transactionReference: paymentToken,
    userId: req.userId,
  };

  // Non-blocking save (waits at most 400ms so user activation / redirect is instantaneous)
  try {
    await Promise.race([
      recordDonationInSupabase(donationData),
      new Promise((resolve) => setTimeout(resolve, 400)),
    ]);
  } catch {
    // Ignore Supabase logging errors so payment never fails
  }

  if (checkoutUrl) {
    return {
      success: true,
      paymentReference: paymentToken,
      checkoutUrl,
      message: `Votre facture de don de ${req.amount.toLocaleString('fr-FR')} FCFA a été générée avec succès sur PayDunya.`,
      provider: 'dunyapay',
      isSandbox: false,
    };
  }

  return {
    success: false,
    paymentReference: ref,
    checkoutUrl: undefined,
    message: invoiceResult.error
      ? `Erreur PayDunya : ${invoiceResult.error}`
      : `Impossible de générer le lien de paiement PayDunya. Veuillez réessayer.`,
    provider: 'dunyapay',
    isSandbox: false,
  };
}
