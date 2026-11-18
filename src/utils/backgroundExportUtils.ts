export type BackgroundExportStatus = 'idle' | 'preparing' | 'ready' | 'error';

export const EXPORT_NOTIFICATION_TAG = 'sanctuaire-video-export';

export interface BackgroundExportNotificationInput {
  status: BackgroundExportStatus;
  progressPct: number;
  summaryLabel: string;
  qualityLabel?: string;
  statusLabel?: string;
  filename?: string | null;
  sizeLabel?: string | null;
  errorMsg?: string | null;
}

export interface BackgroundExportNotificationPayload {
  title: string;
  body: string;
  tag: string;
  silent: boolean;
  renotify: boolean;
  requireInteraction: boolean;
}

export function clampProgressPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function buildUnicodeProgressBar(pct: number, width = 12): string {
  const clamped = clampProgressPct(pct);
  const safeWidth = Math.max(4, Math.min(24, Math.round(width)));
  const filled = Math.round((clamped / 100) * safeWidth);
  const empty = Math.max(0, safeWidth - filled);
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

export function formatExportNotificationPayload(
  input: BackgroundExportNotificationInput
): BackgroundExportNotificationPayload {
  const pct = clampProgressPct(input.progressPct);
  const summary = (input.summaryLabel || 'Vidéo Coran').trim();
  const qualityPart = input.qualityLabel ? ` • ${input.qualityLabel}` : '';

  if (input.status === 'preparing') {
    const bar = buildUnicodeProgressBar(pct, 12);
    const stepText = input.statusLabel ? ` • ${input.statusLabel}` : '';
    return {
      title: `Téléchargement vidéo ${pct}% — ${summary}${qualityPart}`,
      body: `${bar} ${pct}%${stepText}`,
      tag: EXPORT_NOTIFICATION_TAG,
      silent: true,
      renotify: false,
      requireInteraction: true,
    };
  }

  if (input.status === 'ready') {
    const sizePart = input.sizeLabel ? ` (${input.sizeLabel})` : '';
    const filePart = input.filename || 'coran-sanctuaire.mp4';
    return {
      title: `Vidéo prête${sizePart} — ${summary}`,
      body: `${filePart} • Touchez pour ouvrir et enregistrer.`,
      tag: EXPORT_NOTIFICATION_TAG,
      silent: false,
      renotify: true,
      requireInteraction: false,
    };
  }

  if (input.status === 'error') {
    return {
      title: `Échec du téléchargement — ${summary}`,
      body: input.errorMsg || 'Le téléchargement vidéo a été interrompu.',
      tag: EXPORT_NOTIFICATION_TAG,
      silent: true,
      renotify: true,
      requireInteraction: false,
    };
  }

  return {
    title: 'Le Sanctuaire',
    body: '',
    tag: EXPORT_NOTIFICATION_TAG,
    silent: true,
    renotify: false,
    requireInteraction: false,
  };
}

export function formatBackgroundDocumentTitle(
  baseTitle: string,
  status: BackgroundExportStatus,
  progressPct: number
): string {
  const cleanBase = baseTitle || 'Le Sanctuaire';
  if (status === 'preparing') {
    const pct = clampProgressPct(progressPct);
    return `${pct}% • Téléchargement vidéo — ${cleanBase}`;
  }
  if (status === 'ready') {
    return `Vidéo prête • ${cleanBase}`;
  }
  return cleanBase;
}

/**
 * Only cancel an active background export when actually exiting/unloading the site
 * (beforeunload or non-persisted pagehide). Switching tabs or placing the mobile
 * browser in recent tasks fires visibilitychange/persisted pagehide and MUST keep running.
 */
export function shouldAbortOnPageHide(event?: { persisted?: boolean } | null): boolean {
  if (event && event.persisted === true) {
    return false;
  }
  return true;
}

/**
 * Generates a compact valid 8kHz mono PCM WAV data URL filled with pure digital silence.
 * Used as an inaudible keepalive loop + MediaSession anchor when backgrounded in mobile recent tasks.
 */
export function createSilentWavDataUrl(durationSec = 1): string {
  const sampleRate = 8000;
  const numSamples = Math.max(800, Math.round(sampleRate * Math.max(0.25, durationSec)));
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);
  // Sample bytes remain 0 (digital silence)

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return `data:audio/wav;base64,${b64}`;
}
