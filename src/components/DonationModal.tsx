import React, { useState } from 'react';
import {
  X,
  Heart,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';
import {
  processWaveDonation,
  WAVE_MERCHANT_BASE_URL,
  ORANGE_MONEY_NUMBER,
} from '../lib/payments';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

// Matrice 29x29 fidèle à la carte QR Orange Money / Max It fournie
const ORANGE_QR_MATRIX: string[] = [
  '111111100101111001001101111111'.slice(0, 29),
  '10000010011110100110101000001',
  '10111010101000110000001011101',
  '10111010011101101101001011101',
  '10111010011000110100001011101',
  '10000010001010101001001000001',
  '11111110101010101010101111111',
  '00000000111001010011100000000',
  '11101111101000110100011000100',
  '00001000110100001010100100110',
  '11111010101111011000110101110',
  '00100101001000110110111110001',
  '10011111001000000000101001101',
  '10110000100000000001101011000',
  '11100011011000000001010111110',
  '01100001110000000000110100001',
  '00111111011000000110111001101',
  '10011000011111100000111011111',
  '10101110111101101001100111010',
  '11010001011100101011001011011',
  '00011111001101011010111111100',
  '00000000110110010111100010110',
  '11111110101111111010101010100',
  '10000010100010101000100010001',
  '10111010010111110001111110000',
  '10111010011111001011000101000',
  '10111010100110010011100111110',
  '10000010100100100001001110100',
  '11111110101101000010010010100',
];

export const OrangeMoneyQrCard: React.FC<{ size?: 'normal' | 'large' }> = ({
  size = 'normal',
}) => {
  const dimension = size === 'large' ? 'w-64 h-64 sm:w-72 sm:h-72' : 'w-44 h-44 sm:w-48 sm:h-48';

  return (
    <div className="relative bg-white p-3.5 rounded-2xl shadow-md border border-[#FF7900]/35 overflow-hidden">
      {/* Bandes décoratives diagonales de la carte QR Orange Money */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
      >
        <polygon points="10,200 50,200 200,90 200,60" fill="#F5BA84" opacity="0.7" />
        <polygon points="75,200 105,200 200,130 200,108" fill="#A3D9C2" opacity="0.75" />
        <polygon points="140,200 170,200 200,178 200,155" fill="#9ED3F0" opacity="0.75" />
      </svg>

      {/* Grille QR Code 29x29 + badge caméra orange central */}
      <svg
        viewBox="0 0 29 29"
        shapeRendering="crispEdges"
        className={`relative z-10 ${dimension} mx-auto rounded-lg bg-white/95 p-1`}
        aria-label="QR Code Orange Money"
      >
        <rect width="29" height="29" fill="#FFFFFF" />
        {ORANGE_QR_MATRIX.map((row, rIdx) =>
          row.split('').map((cell, cIdx) => {
            // Zone centrale réservée au logo caméra Orange
            if (rIdx >= 12 && rIdx <= 16 && cIdx >= 12 && cIdx <= 16) {
              return null;
            }
            if (cell === '1') {
              return (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx}
                  y={rIdx}
                  width={1}
                  height={1}
                  fill="#000000"
                />
              );
            }
            return null;
          })
        )}

        {/* Badge central Orange Money (icône appareil photo sur fond blanc arrondi) */}
        <g shapeRendering="geometricPrecision">
          <rect
            x="11.7"
            y="11.7"
            width="5.6"
            height="5.6"
            rx="1.2"
            fill="#FFFFFF"
            stroke="#E5E7EB"
            strokeWidth="0.25"
          />
          {/* Corps de l'appareil photo orange */}
          <path
            d="M13.6 13.1 L14.0 12.7 H15.0 L15.4 13.1 H16.1 C16.38 13.1 16.6 13.32 16.6 13.6 V15.7 C16.6 15.98 16.38 16.2 16.1 16.2 H12.9 C12.62 16.2 12.4 15.98 12.4 15.7 V13.6 C12.4 13.32 12.62 13.1 12.9 13.1 H13.6 Z"
            fill="#FF7900"
          />
          {/* Objectif central blanc */}
          <circle cx="14.5" cy="14.65" r="0.72" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'wave' | 'orange_money'>('wave');
  const [copiedWave, setCopiedWave] = useState<boolean>(false);
  const [copiedOrange, setCopiedOrange] = useState<boolean>(false);
  const [showFullOrangeQr, setShowFullOrangeQr] = useState<boolean>(false);

  if (!isOpen) return null;

  const waveQrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(
    WAVE_MERCHANT_BASE_URL
  )}`;

  const handleCopyWaveLink = () => {
    navigator.clipboard.writeText(WAVE_MERCHANT_BASE_URL);
    setCopiedWave(true);
    setTimeout(() => setCopiedWave(false), 2500);

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

  const handleCopyOrangeMoney = () => {
    navigator.clipboard.writeText(ORANGE_MONEY_NUMBER);
    setCopiedOrange(true);
    setTimeout(() => setCopiedOrange(false), 2500);

    processWaveDonation({
      currency: 'XOF',
      provider: 'orange_money',
      cause: 'Sadaqah Jariyah - Le Sanctuaire',
      donorName: userName || undefined,
      donorEmail: userEmail || undefined,
    }).catch(() => {});
  };

  const handleOpenOrangeQr = () => {
    setShowFullOrangeQr(true);
    processWaveDonation({
      currency: 'XOF',
      provider: 'orange_money',
      cause: 'Sadaqah Jariyah - Le Sanctuaire',
      donorName: userName || undefined,
      donorEmail: userEmail || undefined,
    }).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-md bg-white dark:bg-[#162a20] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-emerald-500/25 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-emerald-800/40 bg-neutral-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                activeTab === 'wave'
                  ? 'bg-[#1DC8FF]/20 border-[#1DC8FF]/40 text-[#0095D9] dark:text-[#38BDF8]'
                  : 'bg-[#FF7900]/20 border-[#FF7900]/40 text-[#FF7900]'
              }`}
            >
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight flex items-center gap-2">
                Faire un don (Sadaqah)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-emerald-300/80">
                Soutenir Le Sanctuaire
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

        {/* Sélecteur Wave / Orange Money */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-100 dark:bg-emerald-950/60 border border-neutral-200/80 dark:border-emerald-800/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab('wave');
                setShowFullOrangeQr(false);
              }}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'wave'
                  ? 'bg-[#1DC8FF] text-neutral-950 shadow-sm'
                  : 'text-neutral-600 dark:text-emerald-200/70 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>Wave</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orange_money')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'orange_money'
                  ? 'bg-[#FF7900] text-white shadow-sm'
                  : 'text-neutral-600 dark:text-emerald-200/70 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>Orange Money</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-center">
          {activeTab === 'wave' ? (
            <>
              {/* QR Code Wave */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#1DC8FF]/15 via-sky-500/10 to-emerald-500/10 border border-[#1DC8FF]/40 space-y-3">
                <div className="bg-white p-3 rounded-2xl shadow-md border border-[#1DC8FF]/30">
                  <img
                    src={waveQrCodeImageUrl}
                    alt="QR Code Wave"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto rounded-lg"
                  />
                </div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-emerald-100">
                  Scannez le QR Code Wave ou utilisez les boutons ci-dessous
                </p>
              </div>

              {/* Action Buttons Wave: Copier le lien & Ouvrir QR Code Wave */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleCopyWaveLink}
                  className="w-full py-3.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-neutral-900 dark:text-white font-bold text-sm border border-neutral-200 dark:border-emerald-700/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedWave ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                      <span>Lien copié !</span>
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
            </>
          ) : (
            <>
              {/* QR Code Orange Money */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#FF7900]/15 via-amber-500/10 to-emerald-500/10 border border-[#FF7900]/40 space-y-3">
                <OrangeMoneyQrCard size={showFullOrangeQr ? 'large' : 'normal'} />
                <p className="text-xs font-semibold text-neutral-700 dark:text-emerald-100">
                  Scannez le QR Code Orange Money ou copiez le numéro de téléphone
                </p>
              </div>

              {/* Action Buttons Orange Money: Copier le numéro de téléphone (sans afficher le numéro) & Ouvrir QR Code */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleCopyOrangeMoney}
                  className="w-full py-3.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/70 text-neutral-900 dark:text-white font-bold text-sm border border-neutral-200 dark:border-emerald-700/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedOrange ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                      <span>Numéro de téléphone copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#FF7900] stroke-[2.2]" />
                      <span>Copier le numéro de téléphone</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenOrangeQr}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#FF7900] hover:bg-[#E56D00] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-[#FF7900]/40"
                >
                  <QrCode className="w-4 h-4 stroke-[2.3]" />
                  <span>Ouvrir QR Code Orange Money</span>
                  <Maximize2 className="w-4 h-4 stroke-[2.3]" />
                </button>
              </div>
            </>
          )}

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              {activeTab === 'wave'
                ? 'Paiement direct et sécurisé sur Wave'
                : 'Paiement direct et sécurisé sur Orange Money'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};




