import { recordDonationInSupabase, DonationRecord } from './supabase';

export interface PaymentRequest {
  amount?: number;
  currency: 'XOF' | 'EUR' | 'USD';
  provider: 'wave';
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
  provider: 'wave';
}

// Lien Marchand Wave Officiel
export const WAVE_MERCHANT_BASE_URL = 'https://pay.wave.com/m/M_sn_HHtFRD3L0nX1/c/sn/';

export const getWaveCheckoutUrl = (): string => {
  return WAVE_MERCHANT_BASE_URL;
};

export const isWaveConfigured = (): boolean => {
  return true;
};

// Process Donation via Wave Merchant Link
export async function processWaveDonation(req: PaymentRequest): Promise<PaymentResponse> {
  const ref = 'WAVE-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  const checkoutUrl = WAVE_MERCHANT_BASE_URL;

  const donationData: DonationRecord = {
    amount: req.amount || 0,
    currency: req.currency || 'XOF',
    provider: 'wave',
    status: 'succeeded',
    cause: req.cause,
    donorName: req.isAnonymous ? 'Donateur Anonyme (Sadaqah)' : req.donorName,
    donorEmail: req.donorEmail,
    donorPhone: req.donorPhone,
    isAnonymous: req.isAnonymous,
    transactionReference: ref,
    userId: req.userId,
  };

  // Non-blocking save in Supabase (waits at most 350ms so redirect is immediate)
  try {
    await Promise.race([
      recordDonationInSupabase(donationData),
      new Promise((resolve) => setTimeout(resolve, 350)),
    ]);
  } catch {
    // Ignore Supabase logging errors so Wave payment never fails
  }

  return {
    success: true,
    paymentReference: ref,
    checkoutUrl,
    message: 'Copier le lien ou ouvrir le QR Code Wave.',
    provider: 'wave',
  };
}


