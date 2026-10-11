import { recordDonationInSupabase, DonationRecord } from './supabase';

export interface PaymentRequest {
  amount?: number;
  currency: 'XOF' | 'EUR' | 'USD';
  provider: 'wave' | 'orange_money';
  cause: string;
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  userId?: string;
}

export interface PaymentResponse {
  success: boolean;
  checkoutUrl: string;
  paymentReference: string;
  message: string;
  provider: 'wave' | 'orange_money';
}

// Lien Marchand Wave Officiel
export const WAVE_MERCHANT_BASE_URL = 'https://pay.wave.com/m/M_sn_HHtFRD3L0nX1/c/sn/';

// Numéro Orange Money (non affiché en clair dans l'interface, uniquement copié)
export const ORANGE_MONEY_NUMBER = '789139036';

export const getWaveCheckoutUrl = (): string => {
  return WAVE_MERCHANT_BASE_URL;
};

export const isWaveConfigured = (): boolean => {
  return true;
};

// Process Donation via Wave or Orange Money
export async function processWaveDonation(req: PaymentRequest): Promise<PaymentResponse> {
  const prefix = req.provider === 'orange_money' ? 'OM-' : 'WAVE-';
  const ref = prefix + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  const checkoutUrl = WAVE_MERCHANT_BASE_URL;

  const donationData: DonationRecord = {
    amount: req.amount && req.amount > 0 ? req.amount : 5000,
    currency: req.currency || 'XOF',
    provider: req.provider,
    status: 'succeeded',
    cause: req.cause || 'Sadaqah Jariyah - Le Sanctuaire',
    donorName: req.isAnonymous ? 'Donateur Anonyme (Sadaqah)' : req.donorName || 'Donateur Sadaqah',
    donorEmail: req.donorEmail,
    donorPhone: req.donorPhone,
    isAnonymous: req.isAnonymous,
    transactionReference: ref,
    userId: req.userId,
  };

  // Non-blocking save in Supabase (continues in background even if UI proceeds after 450ms)
  try {
    await Promise.race([
      recordDonationInSupabase(donationData),
      new Promise((resolve) => setTimeout(resolve, 450)),
    ]);
  } catch {
    // Ignore Supabase logging errors so payment action never fails
  }

  return {
    success: true,
    paymentReference: ref,
    checkoutUrl,
    message:
      req.provider === 'orange_money'
        ? 'Copier le numéro de téléphone Orange Money.'
        : 'Copier le lien ou ouvrir le QR Code Wave.',
    provider: req.provider,
  };
}



