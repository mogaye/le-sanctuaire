import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Share2,
  X,
} from 'lucide-react';
import {
  cancelBackgroundVideoExport,
  dismissBackgroundVideoExport,
  markBackgroundVideoDownloaded,
  requestBackgroundNotificationPermission,
  sharePreparedBackgroundVideo,
  useBackgroundVideoExport,
} from '../utils/backgroundVideoExportManager';
import { formatStudioBytes } from '../utils/studioMediaLibrary';

export const BackgroundVideoExportBar: React.FC = () => {
  const exportState = useBackgroundVideoExport();
  const [isMinimized, setIsMinimized] = useState(false);

  // When MobileVerseVideoStudio is open, its built-in StudioLiveMonitor bar already displays progress
  if (exportState.status === 'idle' || exportState.isStudioOpen) {
    return null;
  }

  const isPreparing = exportState.status === 'preparing';
  const isReady = exportState.status === 'ready';
  const isError = exportState.status === 'error';
  const showNotifPrompt =
    isPreparing && exportState.notificationPermission === 'default';

  if (isMinimized) {
    return (
      <div
        data-testid="background-video-export-bar"
        data-export-status={exportState.status}
        role="status"
        aria-live="polite"
        className="fixed bottom-[88px] md:bottom-5 left-1/2 -translate-x-1/2 z-[10055] pointer-events-auto"
      >
        <button
          type="button"
          data-testid="bg-export-expand-btn"
          onClick={() => setIsMinimized(false)}
          aria-label={`Afficher la progression vidéo (${exportState.progressPct}%)`}
          className="h-10 px-3.5 rounded-full bg-[#13291E]/95 dark:bg-[#0D2117]/95 text-white border border-emerald-400/40 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md inline-flex items-center gap-2 text-xs font-bold cursor-pointer hover:border-emerald-300/70 transition-all"
        >
          {isPreparing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300 shrink-0" />
          ) : isReady ? (
            <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[2.5] shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-rose-300 shrink-0" />
          )}
          <span className="tabular-nums">
            {isPreparing
              ? `${exportState.progressPct}%`
              : isReady
              ? 'Vidéo prête'
              : 'Erreur vidéo'}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-emerald-200/80 shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="background-video-export-bar"
      data-export-status={exportState.status}
      role="status"
      aria-live="polite"
      className="fixed bottom-[88px] md:bottom-5 left-1/2 -translate-x-1/2 z-[10055] w-[calc(100%-1.5rem)] max-w-md pointer-events-auto"
    >
      <div className="rounded-2xl bg-[#13291E]/95 dark:bg-[#0B1E14]/95 text-white border border-emerald-400/35 shadow-[0_14px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl px-3.5 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isError
                  ? 'bg-rose-500/20 text-rose-300'
                  : isReady
                  ? 'bg-emerald-500/25 text-emerald-300'
                  : 'bg-emerald-400/15 text-emerald-300'
              }`}
            >
              {isPreparing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isReady ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-white truncate">
                  {exportState.summaryLabel || 'Export vidéo'}
                </span>
                {exportState.qualityLabel && (
                  <span className="text-[10px] font-mono font-semibold text-amber-300/90 shrink-0">
                    {exportState.qualityLabel}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-100/80 truncate leading-tight">
                {isPreparing
                  ? exportState.statusLabel || 'Téléchargement en arrière-plan...'
                  : isReady
                  ? exportState.prepared?.sizeBytes
                    ? `Prête (${formatStudioBytes(exportState.prepared.sizeBytes)})`
                    : 'Vidéo MP4 prête à enregistrer'
                  : exportState.errorMsg || 'Téléchargement interrompu'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isPreparing && (
              <span
                data-testid="bg-export-pct"
                className="text-xs font-mono font-extrabold text-emerald-300 tabular-nums px-1.5"
              >
                {exportState.progressPct}%
              </span>
            )}

            {showNotifPrompt && (
              <button
                type="button"
                data-testid="bg-export-enable-notif-btn"
                onClick={() => void requestBackgroundNotificationPermission()}
                title="Afficher la progression dans la barre haute du téléphone"
                aria-label="Afficher la progression dans la barre du téléphone"
                className="h-7 px-2 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-[10.5px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Bell className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">Barre tél.</span>
              </button>
            )}

            {isReady && exportState.canShare && (
              <button
                type="button"
                data-testid="bg-export-share-btn"
                onClick={() => void sharePreparedBackgroundVideo()}
                aria-label="Partager la vidéo"
                title="Partager"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            {isReady && exportState.downloadHref && exportState.prepared?.filename && (
              <a
                data-testid="bg-export-download-link"
                href={exportState.downloadHref}
                download={exportState.prepared.filename}
                onClick={() => markBackgroundVideoDownloaded()}
                className="h-7 px-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#071A10] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors no-underline"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Télécharger</span>
              </a>
            )}

            <button
              type="button"
              data-testid="bg-export-minimize-btn"
              onClick={() => setIsMinimized(true)}
              aria-label="Réduire la barre de progression"
              title="Réduire"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100/80 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              data-testid="bg-export-cancel-btn"
              onClick={() =>
                isPreparing
                  ? cancelBackgroundVideoExport()
                  : dismissBackgroundVideoExport()
              }
              aria-label={isPreparing ? 'Annuler le téléchargement' : 'Fermer'}
              title={isPreparing ? 'Annuler' : 'Fermer'}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-rose-500/35 text-emerald-100/80 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isPreparing && (
          <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
            <div
              data-testid="bg-export-progress-fill"
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 transition-all duration-200"
              style={{ width: `${Math.max(2, exportState.progressPct)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
