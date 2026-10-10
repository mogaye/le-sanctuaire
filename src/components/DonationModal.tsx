import React, { useState } from 'react';
import {
  X,
  Heart,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import {
  processWaveDonation,
  WAVE_MERCHANT_BASE_URL,
} from '../lib/payments';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  if (!isOpen) return null;

  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(
    WAVE_MERCHANT_BASE_URL
  )}`;

  const handleCopyWaveLink = () => {
    navigator.clipboard.writeText(WAVE_MERCHANT_BASE_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);

    processWaveDonation({
      currency: 'XOF',
      provider: 'wave',
      cause: 'Sadaqah Jariyah - Le Sanctuaire',
      donorName: userName || undefined,
      donorEmail: userEmail || undefined,
    }).catch(() => {});
  };

  const handleOpenWaveLink = () => {
    processWaveDonation({
      currency: 'XOF',
      provider: 'wave',
      cause: 'Sadaqah Jariyah - Le Sanctuaire',
      donorName: userName || undefined,
      donorEmail: userEmail || undefined,
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-md bg-white dark:bg-[#162a20] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-emerald-500/25 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-emerald-800/40 bg-neutral-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1DC8FF]/20 border border-[#1DC8FF]/40 flex items-center justify-center text-[#0095D9] dark:text-[#38BDF8]">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight flex items-center gap-2">
                Faire un don (Sadaqah)
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#1DC8FF]/20 text-[#0077B6] dark:text-[#38BDF8] border border-[#1DC8FF]/40">
                  Wave
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-emerald-300/80">
                Soutenir Le Sanctuaire via Wave
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-center">
          {/* QR Code Wave */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#1DC8FF]/15 via-sky-500/10 to-emerald-500/10 border border-[#1DC8FF]/40 space-y-3">
            <div className="bg-white p-3 rounded-2xl shadow-md border border-[#1DC8FF]/30">
              <img
                src={qrCodeImageUrl}
                alt="QR Code Wave"
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto rounded-lg"
              />
            </div>
            <p className="text-xs font-semibold text-neutral-700 dark:text-emerald-100">
              Scannez le QR Code ou utilisez les boutons ci-dessous
            </p>
          </div>

          {/* Action Buttons: Copier le lien & Ouvrir QR Code Wave */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCopyWaveLink}
              className="w-full py-3.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-neutral-900 dark:text-white font-bold text-sm border border-neutral-200 dark:border-emerald-700/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span>Lien Wave copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#0095D9] dark:text-[#38BDF8] stroke-[2.2]" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>

            <a
              href={WAVE_MERCHANT_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenWaveLink}
              className="w-full py-3.5 px-4 rounded-xl bg-[#1DC8FF] hover:bg-[#00B4F0] text-neutral-950 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-[#1DC8FF]/40"
            >
              <QrCode className="w-4 h-4 stroke-[2.3]" />
              <span>Ouvrir QR Code Wave</span>
              <ExternalLink className="w-4 h-4 stroke-[2.3]" />
            </a>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Paiement direct et sécurisé sur Wave</span>
          </div>
        </div>
      </div>
    </div>
  );
};



