import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, CheckCircle, ShieldCheck, ArrowRight, Smartphone, CreditCard, Sparkles, KeyRound, ExternalLink } from 'lucide-react';
import { processDunyaPayDonation, isDunyaPayConfigured, getDunyaPayConfig } from '../lib/payments';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, userEmail, userName }) => {
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [cause, setCause] = useState<string>('Sadaqah Jariyah - Développement & Hébergement du Sanctuaire');
  const [donorName, setDonorName] = useState<string>(userName || '');
  const [donorPhone, setDonorPhone] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<{ reference: string; message: string; checkoutUrl?: string } | null>(null);

  if (!isOpen) return null;

  const currentAmount = isCustom ? (parseInt(customAmount, 10) || 0) : amount;
  const isConfigured = isDunyaPayConfigured();
  const dunyaPayConfig = getDunyaPayConfig();

  const handleSelectPreset = (val: number) => {
    setIsCustom(false);
    setAmount(val);
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount < 500) {
      alert('Le montant minimum pour un don est de 500 FCFA.');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        amount: currentAmount,
        currency: 'XOF' as const,
        provider: 'dunyapay' as const,
        cause,
        donorName: donorName.trim() || undefined,
        donorEmail: userEmail || undefined,
        donorPhone: donorPhone.trim() || undefined,
        isAnonymous,
      };

      const res = await processDunyaPayDonation(payload);

      setSuccessResult({
        reference: res.paymentReference,
        message: res.message,
        checkoutUrl: res.checkoutUrl,
      });

      // Try opening the PayDunya checkout window safely
      if (res.checkoutUrl) {
        try {
          window.open(res.checkoutUrl, '_blank');
        } catch (e) {
          console.warn('Popup blocked, using fallback button', e);
        }
      }
    } catch (err) {
      console.error('Erreur lors du don DunyaPay:', err);
      alert('Une erreur est survenue lors de l’initialisation du don. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#162a20] rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-emerald-500/25 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-emerald-800/40 bg-neutral-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight flex items-center gap-2">
                Faire un don (Sadaqah)
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  DunyaPay
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-emerald-400/80">
                Paiement sécurisé via Orange Money, Wave, Free Money et Cartes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {successResult ? (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Barak’Allahu Feek !
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-sm mx-auto">
                  {successResult.message}
                </p>
              </div>

              <div className="p-3 bg-neutral-100 dark:bg-emerald-950/40 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                Référence DunyaPay : {successResult.reference}
              </div>

              <p className="text-xs italic text-emerald-700 dark:text-emerald-300">
                « Ceux qui dépensent leurs biens dans le sentier d’Allah sont semblables à un grain d’où germent sept épis, portant chacun cent grains. » (Sourate 2, v. 261)
              </p>

              {successResult.checkoutUrl && (
                <div className="space-y-2 pt-2">
                  <a
                    href={successResult.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer ring-2 ring-emerald-400/30"
                  >
                    <span>Ouvrir la page de paiement sécurisée PayDunya</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Accepte Orange Money, Wave, Free Money et Cartes Bancaires
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setSuccessResult(null);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-semibold transition-colors text-sm"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Gateway Banner: DunyaPay Multi-Money */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-amber-500/10 to-teal-500/10 border border-emerald-500/25 dark:border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    DP
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <span>Passerelle DunyaPay</span>
                      {isConfigured ? (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-300/40">
                          Connecté
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded-full border border-amber-300/40">
                          Prêt pour vos 4 clés
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-emerald-300/80">
                      Orange Money • Wave • Free Money • Cartes Bancaires
                    </p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  1. Montant du don (FCFA)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelectPreset(val)}
                      className={`py-2 px-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors ${
                        !isCustom && amount === val
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500'
                      }`}
                    >
                      {val.toLocaleString('fr-FR')} F
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectCustom}
                    className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                      isCustom
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-transparent'
                    }`}
                  >
                    Montant libre :
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      placeholder="Autre montant..."
                      value={customAmount}
                      onChange={(e) => {
                        setIsCustom(true);
                        setCustomAmount(e.target.value);
                      }}
                      onFocus={() => setIsCustom(true)}
                      className="w-full py-1.5 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-neutral-400">FCFA</span>
                  </div>
                </div>
              </div>

              {/* Donor Contact */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    2. Numéro de téléphone pour la notification DunyaPay
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: +221 77 123 45 67"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="anonymous-check"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="anonymous-check" className="text-xs text-neutral-600 dark:text-neutral-400 select-none cursor-pointer">
                    Faire ce don de manière anonyme (Sadaqah cachée)
                  </label>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Transactions sécurisées via la passerelle officielle DunyaPay avec journalisation Supabase.</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing || currentAmount < 500}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Initialisation DunyaPay...
                  </span>
                ) : (
                  <>
                    <span>Confirmer le don de {currentAmount.toLocaleString('fr-FR')} FCFA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

