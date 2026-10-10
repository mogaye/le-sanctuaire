import React, { useState } from 'react';
import {
  X,
  Heart,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  Phone,
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

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'wave' | 'orange_money'>('wave');
  const [copiedWave, setCopiedWave] = useState<boolean>(false);
  const [copiedOrange, setCopiedOrange] = useState<boolean>(false);
  const hasRecordedInModalRef = React.useRef<boolean>(false);

  // Resolve active user account from props or localStorage (sanctuaire_user or latest sanctuaire_registered_accounts)
  const resolvedAccount = React.useMemo(() => {
    if (userEmail) {
      return { email: userEmail.trim(), name: (userName || userEmail.split('@')[0]).trim() };
    }
    try {
      const saved = localStorage.getItem('sanctuaire_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          return {
            email: String(parsed.email).trim(),
            name: String(parsed.name || parsed.firstName || parsed.email.split('@')[0]).trim(),
          };
        }
      }
      const regRaw = localStorage.getItem('sanctuaire_registered_accounts');
      if (regRaw) {
        const regList = JSON.parse(regRaw);
        if (Array.isArray(regList) && regList.length > 0 && regList[0]?.email) {
          return {
            email: String(regList[0].email).trim(),
            name: String(regList[0].fullName || regList[0].firstName || regList[0].email.split('@')[0]).trim(),
          };
        }
      }
    } catch {
      // ignore
    }
    return null;
  }, [userEmail, userName, isOpen]);

  const triggerDonorGratitudeFlow = React.useCallback(
    (provider: 'wave' | 'orange_money') => {
      if (hasRecordedInModalRef.current) return;
      hasRecordedInModalRef.current = true;
      processWaveDonation({
        currency: 'XOF',
        provider,
        cause: 'Sadaqah Jariyah - Le Sanctuaire',
        donorName: resolvedAccount?.name || userName || undefined,
        donorEmail: resolvedAccount?.email || userEmail || undefined,
      }).catch(() => {});
    },
    [resolvedAccount, userName, userEmail]
  );

  // Reset deduplication flag when modal closes; if user scans QR code directly while modal is open for >2s, record automatically
  React.useEffect(() => {
    if (!isOpen) {
      hasRecordedInModalRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (resolvedAccount?.email) {
        triggerDonorGratitudeFlow(activeTab);
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [isOpen, activeTab, resolvedAccount, triggerDonorGratitudeFlow]);

  if (!isOpen) return null;

  const waveQrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodeURIComponent(
    WAVE_MERCHANT_BASE_URL
  )}`;

  const handleCopyWaveLink = () => {
    navigator.clipboard.writeText(WAVE_MERCHANT_BASE_URL);
    setCopiedWave(true);
    setTimeout(() => setCopiedWave(false), 2500);
    hasRecordedInModalRef.current = false;
    triggerDonorGratitudeFlow('wave');
  };

  const handleOpenWaveLink = () => {
    hasRecordedInModalRef.current = false;
    triggerDonorGratitudeFlow('wave');
  };

  const handleCopyOrangeMoney = () => {
    navigator.clipboard.writeText(ORANGE_MONEY_NUMBER);
    setCopiedOrange(true);
    setTimeout(() => setCopiedOrange(false), 2500);
    hasRecordedInModalRef.current = false;
    triggerDonorGratitudeFlow('orange_money');
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
              onClick={() => setActiveTab('wave')}
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
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-[#1DC8FF]/15 via-sky-500/10 to-emerald-500/10 border border-[#1DC8FF]/40">
                <div className="bg-white p-3 rounded-2xl shadow-md border border-[#1DC8FF]/30">
                  <img
                    src={waveQrCodeImageUrl}
                    alt="QR Code Wave"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto rounded-lg"
                  />
                </div>
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
              {/* Visuel officiel Orange Money (sans QR Code) */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-[#FF7900]/15 via-orange-500/10 to-amber-500/5 border border-[#FF7900]/40">
                <div className="w-24 h-24 rounded-2xl bg-neutral-950 border-2 border-[#FF7900] shadow-lg flex flex-col items-center justify-center p-3 gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-black text-xs tracking-tight">Orange</span>
                    <span className="text-[#FF7900] font-black text-xs tracking-tight">Money</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#FF7900] flex items-center justify-center text-white shadow-inner">
                    <Phone className="w-5 h-5 stroke-[2.4]" />
                  </div>
                </div>
              </div>

              {/* Action Button Orange Money: Copier le numéro de téléphone */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleCopyOrangeMoney}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#FF7900] hover:bg-[#E56D00] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer ring-2 ring-[#FF7900]/40"
                >
                  {copiedOrange ? (
                    <>
                      <Check className="w-4 h-4 text-white stroke-[2.5]" />
                      <span>Numéro de téléphone copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white stroke-[2.2]" />
                      <span>Copier le numéro de téléphone</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
