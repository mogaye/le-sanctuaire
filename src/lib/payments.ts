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

// PayDunya / DunyaPay 4 Verified Merchant Credentials
export interface DunyaPayConfig {
  masterKey: string;
  privateKey: string;
  token: string;
  publicKey: string;
}

export const getDunyaPayConfig = (): DunyaPayConfig => {
  return {
    masterKey: (
      import.meta.env.VITE_PAYDUNYA_MASTER_KEY ||
      import.meta.env.VITE_DUNYAPAY_MERCHANT_ID ||
      'DbDQF7UZ-eGTd-AvLI-rKX0-TRalACuat69v'
    ).trim(),
    privateKey: (
      import.meta.env.VITE_PAYDUNYA_PRIVATE_KEY ||
      import.meta.env.VITE_DUNYAPAY_SECRET_KEY ||
      'live_private_vp0fK771yioUfxI5MUz9pDscnrY'
    ).trim(),
    token: (
      import.meta.env.VITE_PAYDUNYA_TOKEN ||
      import.meta.env.VITE_DUNYAPAY_TOKEN_KEY ||
      'pBMNpVEEk3jX2VINqMvJ'
    ).trim(),
    publicKey: (
      import.meta.env.VITE_PAYDUNYA_PUBLIC_KEY ||
      import.meta.env.VITE_DUNYAPAY_API_KEY ||
      'live_public_sQarWhJMc6Tgjy1uDroFvTxuSer'
    ).trim(),
  };
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

// Call PayDunya API to generate live payment invoice URL
async function requestPayDunyaInvoice(amount: number, description: string, ref: string, cancelUrl: string, returnUrl: string): Promise<{ url?: string; token?: string; error?: string }> {
  const conf = getDunyaPayConfig();

  const payload = {
    invoice: {
      total_amount: amount,
      description: description || 'Sadaqah Jariyah',
    },
    store: {
      name: 'Plateforme Islamique',
      website_url: window.location.origin,
    },
    custom_data: {
      transaction_id: ref,
    },
    actions: {
      cancel_url: cancelUrl,
      return_url: returnUrl,
    },
  };

  // 1. Try local Vite API proxy
  try {
    const proxyRes = await fetch('/api/paydunya/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.response_code === '00' && data.response_text) {
        return { url: data.response_text, token: data.token };
      }
    }
  } catch {
    // Fall back to direct PayDunya API
  }

  // 2. Direct PayDunya API call (CORS supported)
  try {
    const directRes = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': conf.masterKey,
        'PAYDUNYA-PUBLIC-KEY': conf.publicKey,
        'PAYDUNYA-PRIVATE-KEY': conf.privateKey,
        'PAYDUNYA-TOKEN': conf.token,
      },
      body: JSON.stringify(payload),
    });

    const data = await directRes.json();
    if (data.response_code === '00' && data.response_text) {
      return { url: data.response_text, token: data.token };
    }
    return { error: data.response_text || 'Erreur lors de la création de la facture PayDunya' };
  } catch (err) {
    return { error: String(err) };
  }
}

// Process Donation via PayDunya (Orange Money, Wave, Free Money, Carte Bancaire)
export async function processDunyaPayDonation(req: PaymentRequest): Promise<PaymentResponse> {
  const ref = 'DP-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  const currentUrl = window.location.href;

  const invoiceResult = await requestPayDunyaInvoice(
    req.amount,
    `Don Sadaqah (${req.cause || 'Projet Spirituel'})`,
    ref,
    currentUrl,
    currentUrl
  );

  const checkoutUrl = invoiceResult.url;
  const paymentToken = invoiceResult.token || ref;

  // Record donation in Supabase
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

  await recordDonationInSupabase(donationData);

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
    success: true,
    paymentReference: ref,
    checkoutUrl: undefined,
    message: invoiceResult.error
      ? `Attention: ${invoiceResult.error}. Votre intention de don a été enregistrée avec la référence ${ref}.`
      : `Votre intention de don de ${req.amount.toLocaleString('fr-FR')} FCFA a été enregistrée avec succès.`,
    provider: 'dunyapay',
    isSandbox: false,
  };
}
