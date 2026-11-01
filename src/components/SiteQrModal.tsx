import React, { useState } from 'react';
import { X, QrCode, Download, Copy, Check, Share2, Sparkles, ExternalLink } from 'lucide-react';

interface SiteQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteUrl?: string;
}

export const SiteQrModal: React.FC<SiteQrModalProps> = ({
  isOpen,
  onClose,
  siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://le-sanctuaire-seven.vercel.app',
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  // URL propre et directe vers le site
  const targetUrl = siteUrl || 'https://le-sanctuaire-seven.vercel.app';
  
  // Générateur QR code haute définition (500x500) avec marge propre
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=20&data=${encodeURIComponent(
    targetUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Le Sanctuaire — Votre Compagnon Spirituel',
          text: 'Scannez le QR Code ou accédez directement au Sanctuaire Islamique :',
          url: targetUrl,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = async () => {
    try {
      setDownloading(true);
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'le-sanctuaire-qr-code.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      // Fallback
      window.open(qrCodeImageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#162D20] rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200 dark:border-emerald-500/30 text-neutral-900 dark:text-white flex flex-col items-center text-center space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 text-neutral-500 dark:text-emerald-200 transition cursor-pointer"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
            <QrCode className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
            QR Code d’accès au site
          </h3>
          <p className="text-xs text-neutral-600 dark:text-emerald-200/80 max-w-xs leading-relaxed font-medium">
            Scannez ce code avec l’appareil photo d’un smartphone pour accéder instantanément au Sanctuaire.
          </p>
        </div>

        {/* QR Code Container with visual frame */}
        <div className="relative p-3 rounded-2xl bg-white border-2 border-emerald-500/30 shadow-md group">
          <img
            src={qrCodeImageUrl}
            alt="QR Code Le Sanctuaire"
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl object-contain"
          />

          {/* Petit logo ou badge discret au centre */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-white shadow-lg p-1 border border-emerald-500/30 flex items-center justify-center">
              <img
                src="/images/sanctuaire_logo.jpg"
                alt="Logo Sanctuaire"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Target URL Pill */}
        <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-[#0F2218] border border-neutral-200 dark:border-emerald-500/20 text-xs">
          <span className="font-mono text-neutral-700 dark:text-emerald-300 truncate text-[11px] select-all">
            {targetUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shrink-0 cursor-pointer"
            title="Copier le lien"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Actions : Télécharger l'image PNG / Partager */}
        <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleDownloadQr}
            disabled={downloading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Téléchargement...' : 'Enregistrer PNG'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 text-neutral-800 dark:text-emerald-200 border border-neutral-200 dark:border-emerald-500/30 text-xs font-bold transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Partager</span>
          </button>
        </div>

        {/* Practical usage tips */}
        <div className="w-full text-[11px] text-neutral-500 dark:text-emerald-300/70 border-t border-neutral-200/80 dark:border-emerald-500/20 pt-3 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Idéal pour imprimer sur vos affiches, flyers ou statuts WhatsApp !</span>
        </div>

      </div>
    </div>
  );
};
