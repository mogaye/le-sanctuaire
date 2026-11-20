import { useEffect, useState } from 'react';
import { CompleteSurahItem } from '../data/quranSurahs';
import {
  DecodedVerseBuffer,
  attachAudioStreamKeepalive,
  decodeVerseAudioSequence,
} from './continuousAudioEngine';
import {
  StudioAyahItem,
  StudioSurahSelection,
  VideoTemplateId,
  buildContinuousTimeline,
  buildStudioExportFilename,
  extendSequenceToTargetDuration,
  inferVideoQualityFromDimensions,
  resolveVideoDownloadLinkState,
  shouldStageVideoDownload,
} from './mobileVideoStudioUtils';
import {
  VideoCanvasRenderOptions,
  loadCanvasBackgroundImage,
  precomputeVideoCanvasLayout,
  renderVideoCanvasFrame,
} from './canvasVideoRenderer';
import { exportQuranVideoToMp4 } from './mp4VideoExporter';
import { formatStudioBytes } from './studioMediaLibrary';
import {
  BackgroundExportStatus,
  EXPORT_NOTIFICATION_TAG,
  clampProgressPct,
  createSilentWavDataUrl,
  formatBackgroundDocumentTitle,
  formatExportNotificationPayload,
  shouldAbortOnPageHide,
} from './backgroundExportUtils';
import { recordCreatedVideo } from '../lib/supabase';

const MAX_STAGE_DOWNLOAD_BYTES = 1500 * 1024 * 1024;

export interface BackgroundExportPreparedFile {
  blob: Blob;
  objectUrl: string;
  stagedUrl: string | null;
  filename: string;
  sizeBytes: number;
  downloaded: boolean;
}

export interface BackgroundVideoExportSnapshot {
  status: BackgroundExportStatus;
  progressPct: number;
  statusLabel: string;
  summaryLabel: string;
  qualityLabel: string;
  aspectLabel: string;
  configSignature: string;
  errorMsg: string | null;
  prepared: BackgroundExportPreparedFile | null;
  downloadHref: string | null;
  canShare: boolean;
  isStudioOpen: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
}

export interface StartBackgroundVideoExportParams {
  configSignature: string;
  summaryLabel: string;
  qualityLabel: string;
  aspectLabel: string;
  reciterId: string;
  reciterName: string;
  selectedSurahs: StudioSurahSelection[];
  baseVideoSequence: StudioAyahItem[];
  primarySurahMeta: CompleteSurahItem;
  primaryNormalizedRange: { startAyah: number; endAyah: number };
  targetCustomVideoDurationSec: number;
  durationMode: 'verses' | 'match_video';
  paceMultiplier: number;
  exportWidth: number;
  exportHeight: number;
  activeMediaKind: 'video' | 'image' | 'solid';
  activeMediaUrl: string | null;
  customLogoUrl: string | null;
  isLightSurface: boolean;
  bgSurfaceColor: string;
  bgVeilOpacity: number;
  bgBlackBackdrop: boolean;
  bgBrightness: number;
  bgSharpness: number;
  bgContrast: number;
  bgImageMotion: boolean;
  textShadowBoost: boolean;
  arabicTextColor: string | null;
  phoneticsTextColor: string | null;
  frenchTextColor: string | null;
  showArabic: boolean;
  useTajweed: boolean;
  showPhonetics: boolean;
  showFrench: boolean;
  showSurahHeader: boolean;
  textScale: 'compact' | 'standard' | 'grand';
  flowMode: VideoTemplateId;
  showWatermark?: boolean;
  userEmail?: string;
  userName?: string;
  qualityId?: '480p' | '720p' | '1080p' | '4k';
}

function isRunningInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function triggerFileDownload(url: string, filename: string) {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        a.remove();
      } catch {}
    }, 1000);
  } catch {}
}

function loadExportBackgroundVideo(url: string): Promise<HTMLVideoElement | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      video.crossOrigin = 'anonymous';
    }
    video.style.position = 'fixed';
    video.style.left = '0';
    video.style.bottom = '0';
    video.style.width = '16px';
    video.style.height = '16px';
    video.style.opacity = '0.01';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-1';
    document.body.appendChild(video);

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (!ok) {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
          video.remove();
        } catch {}
        resolve(null);
        return;
      }
      video.play().catch(() => {});
      resolve(video);
    };

    const timeout = setTimeout(() => finish(video.readyState >= 2), 60000);
    video.onloadeddata = () => finish(true);
    video.oncanplay = () => finish(true);
    video.onerror = () => finish(false);
    video.load();
    if (video.readyState >= 2) {
      finish(true);
    }
  });
}

async function stageVideoBlobOnServer(
  blob: Blob,
  filename: string,
  signal?: AbortSignal
): Promise<string | null> {
  if (!blob || blob.size === 0 || blob.size > MAX_STAGE_DOWNLOAD_BYTES) {
    return null;
  }
  const timeoutMs = Math.min(
    60_000,
    Math.max(15_000, Math.round(blob.size / (5 * 1024 * 1024)) * 1000)
  );
  const localCtrl = new AbortController();
  const timer = setTimeout(() => localCtrl.abort(), timeoutMs);
  const onOuterAbort = () => localCtrl.abort();
  signal?.addEventListener('abort', onOuterAbort, { once: true });

  try {
    const res = await fetch('/api/video/stage-download', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'video/mp4',
        'x-download-filename': encodeURIComponent(filename),
        'x-download-mime': blob.type || 'video/mp4',
      },
      body: blob,
      signal: localCtrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return typeof json?.downloadUrl === 'string' ? json.downloadUrl : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }
}

function getNotificationPermissionSafe(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return Notification.permission;
  } catch {
    return 'unsupported';
  }
}

// =========================================================================
// SINGLETON MANAGER STATE
// =========================================================================

let snapshot: BackgroundVideoExportSnapshot = {
  status: 'idle',
  progressPct: 0,
  statusLabel: '',
  summaryLabel: '',
  qualityLabel: '',
  aspectLabel: '',
  configSignature: '',
  errorMsg: null,
  prepared: null,
  downloadHref: null,
  canShare: false,
  isStudioOpen: false,
  notificationPermission: getNotificationPermissionSafe(),
};

const listeners = new Set<() => void>();

let baseDocumentTitle = 'Le Sanctuaire';
let lifecycleInitialized = false;
let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

let activeAbortCtrl: AbortController | null = null;
let activeAudioCtx: AudioContext | null = null;
let activeKeepalive: ReturnType<typeof attachAudioStreamKeepalive> | null = null;
let activeMediaRecorder: MediaRecorder | null = null;
let activeExportBgVideo: HTMLVideoElement | null = null;
let activeOwnedMediaBlobUrl: string | null = null;
let activeExportCanvas: HTMLCanvasElement | null = null;
let activeWakeLock: any = null;
let activeLockAbort: AbortController | null = null;
let keepaliveAudioEl: HTMLAudioElement | null = null;
let silentWavUrlCache: string | null = null;
let pendingAutoDownloadOnVisible = false;

let lastNotifSentAtMs = 0;
let lastNotifPct = -1;
let lastNotifStatus: BackgroundExportStatus = 'idle';

function emitSnapshot() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {}
  }
}

function updateSnapshot(patch: Partial<BackgroundVideoExportSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  syncDocumentTitle();
  emitSnapshot();
}

function syncDocumentTitle() {
  if (typeof document === 'undefined') return;
  try {
    document.title = formatBackgroundDocumentTitle(
      baseDocumentTitle,
      snapshot.status,
      snapshot.progressPct
    );
  } catch {}
}

export function ensureExportServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (swRegistration) return Promise.resolve(swRegistration);
  if (swRegistrationPromise) return swRegistrationPromise;

  swRegistrationPromise = navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then(async (reg) => {
      swRegistration = reg;
      try {
        const readyReg = await navigator.serviceWorker.ready;
        swRegistration = readyReg || reg;
      } catch {}
      return swRegistration;
    })
    .catch(() => null);

  return swRegistrationPromise;
}

export async function requestBackgroundNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  void ensureExportServiceWorkerRegistered();
  try {
    const result =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
    updateSnapshot({ notificationPermission: result });
    if (result === 'granted' && snapshot.status !== 'idle') {
      void pushPhoneTopBarNotification(true);
    }
    return result;
  } catch {
    const perm = getNotificationPermissionSafe();
    updateSnapshot({ notificationPermission: perm });
    return perm;
  }
}

async function pushPhoneTopBarNotification(force = false) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const now = Date.now();
  const pct = clampProgressPct(snapshot.progressPct);
  const statusChanged = snapshot.status !== lastNotifStatus;
  if (
    !force &&
    !statusChanged &&
    snapshot.status === 'preparing' &&
    Math.abs(pct - lastNotifPct) < 4 &&
    now - lastNotifSentAtMs < 1100
  ) {
    return;
  }

  lastNotifSentAtMs = now;
  lastNotifPct = pct;
  lastNotifStatus = snapshot.status;

  if (snapshot.status === 'idle') {
    await clearPhoneTopBarNotification();
    return;
  }

  const sizeLabel = snapshot.prepared?.sizeBytes
    ? formatStudioBytes(snapshot.prepared.sizeBytes)
    : null;

  const payload = formatExportNotificationPayload({
    status: snapshot.status,
    progressPct: pct,
    summaryLabel: snapshot.summaryLabel,
    qualityLabel: snapshot.qualityLabel,
    statusLabel: snapshot.statusLabel,
    filename: snapshot.prepared?.filename || null,
    sizeLabel,
    errorMsg: snapshot.errorMsg,
  });

  const reg = swRegistration || (await ensureExportServiceWorkerRegistered());
  const options: NotificationOptions & { renotify?: boolean; ongoing?: boolean } = {
    body: payload.body,
    tag: payload.tag,
    icon: '/images/sanctuaire_logo.jpg',
    badge: '/images/sanctuaire_logo.jpg',
    silent: payload.silent,
    renotify: payload.renotify,
    requireInteraction: payload.requireInteraction,
    ongoing: snapshot.status === 'preparing',
  };

  if (reg && typeof reg.showNotification === 'function') {
    try {
      await reg.showNotification(payload.title, options);
      return;
    } catch {}
  }

  // Desktop fallback when SW isn't active yet
  try {
    new Notification(payload.title, options);
  } catch {}
}

async function clearPhoneTopBarNotification() {
  lastNotifStatus = 'idle';
  lastNotifPct = -1;
  try {
    const reg =
      swRegistration ||
      (typeof navigator !== 'undefined' && 'serviceWorker' in navigator
        ? await navigator.serviceWorker.getRegistration().catch(() => null)
        : null);
    if (reg) {
      reg.active?.postMessage({ type: 'CLEAR_EXPORT_NOTIFICATIONS' });
      const list = await reg.getNotifications({ tag: EXPORT_NOTIFICATION_TAG }).catch(() => []);
      for (const n of list) {
        try {
          n.close();
        } catch {}
      }
    }
  } catch {}
}

function updateMediaSessionProgress(pct: number, summaryLabel: string, status: BackgroundExportStatus) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    if (status === 'idle' || status === 'error') {
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.metadata = null;
      return;
    }

    const clamped = clampProgressPct(pct);
    const title =
      status === 'ready'
        ? `Vidéo prête (100%)`
        : `Téléchargement vidéo • ${clamped}%`;
    const artist = summaryLabel || 'Le Sanctuaire';

    if (typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album: 'Le Sanctuaire — Export MP4',
        artwork: [
          {
            src: '/images/sanctuaire_logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });
    }

    navigator.mediaSession.playbackState = status === 'preparing' ? 'playing' : 'paused';
    if (typeof navigator.mediaSession.setPositionState === 'function') {
      navigator.mediaSession.setPositionState({
        duration: 100,
        playbackRate: status === 'preparing' ? 1 : 0,
        position: Math.min(100, Math.max(0, clamped)),
      });
    }
  } catch {}
}

function startSilentAudioAndMediaSessionKeepalive(summaryLabel: string) {
  if (typeof document === 'undefined') return;
  try {
    if (!silentWavUrlCache) {
      silentWavUrlCache = createSilentWavDataUrl(1);
    }
    if (!keepaliveAudioEl) {
      keepaliveAudioEl = document.createElement('audio');
      keepaliveAudioEl.loop = true;
      keepaliveAudioEl.preload = 'auto';
      keepaliveAudioEl.setAttribute('playsinline', 'true');
      keepaliveAudioEl.style.display = 'none';
      keepaliveAudioEl.src = silentWavUrlCache;
    }
    keepaliveAudioEl.volume = 1;
    keepaliveAudioEl.play().catch(() => {});

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('pause', () => {
          // Keepalive remains active unless user cancels inside app
          keepaliveAudioEl?.play().catch(() => {});
        });
        navigator.mediaSession.setActionHandler('play', () => {
          keepaliveAudioEl?.play().catch(() => {});
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          cancelBackgroundVideoExport();
        });
      } catch {}
    }

    updateMediaSessionProgress(snapshot.progressPct, summaryLabel, 'preparing');
  } catch {}
}

function stopSilentAudioAndMediaSessionKeepalive() {
  try {
    if (keepaliveAudioEl) {
      keepaliveAudioEl.pause();
      keepaliveAudioEl.currentTime = 0;
    }
  } catch {}
  updateMediaSessionProgress(0, '', 'idle');
}

async function acquireExportWakeAndWebLocks() {
  if (typeof navigator === 'undefined') return;

  if ('wakeLock' in navigator && document.visibilityState === 'visible') {
    try {
      if (!activeWakeLock || activeWakeLock.released) {
        activeWakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch {}
  }

  if ('locks' in navigator && !activeLockAbort) {
    const lockCtrl = new AbortController();
    activeLockAbort = lockCtrl;
    try {
      void (navigator as any).locks
        .request(
          'sanctuaire_background_video_export',
          { mode: 'exclusive' },
          () =>
            new Promise<void>((resolve) => {
              if (lockCtrl.signal.aborted) {
                resolve();
                return;
              }
              lockCtrl.signal.addEventListener('abort', () => resolve(), { once: true });
            })
        )
        .catch(() => {});
    } catch {}
  }
}

function releaseExportWakeAndWebLocks() {
  if (activeLockAbort) {
    try {
      activeLockAbort.abort();
    } catch {}
    activeLockAbort = null;
  }
  if (activeWakeLock) {
    try {
      void activeWakeLock.release();
    } catch {}
    activeWakeLock = null;
  }
}

function disposeActiveRuntimeResources() {
  if (activeKeepalive) {
    try {
      activeKeepalive.dispose();
    } catch {}
    activeKeepalive = null;
  }
  if (activeExportBgVideo) {
    try {
      activeExportBgVideo.pause();
      activeExportBgVideo.removeAttribute('src');
      activeExportBgVideo.load();
      activeExportBgVideo.remove();
    } catch {}
    activeExportBgVideo = null;
  }
  if (activeMediaRecorder && activeMediaRecorder.state !== 'inactive') {
    try {
      activeMediaRecorder.stop();
    } catch {}
  }
  activeMediaRecorder = null;
  if (activeOwnedMediaBlobUrl) {
    try {
      URL.revokeObjectURL(activeOwnedMediaBlobUrl);
    } catch {}
    activeOwnedMediaBlobUrl = null;
  }
  if (activeExportCanvas) {
    activeExportCanvas.width = 1;
    activeExportCanvas.height = 1;
    activeExportCanvas = null;
  }
  if (activeAudioCtx) {
    try {
      void activeAudioCtx.close();
    } catch {}
    activeAudioCtx = null;
  }
  stopSilentAudioAndMediaSessionKeepalive();
  releaseExportWakeAndWebLocks();
}

function revokePreparedUrls(file: BackgroundExportPreparedFile | null) {
  if (!file?.objectUrl) return;
  try {
    URL.revokeObjectURL(file.objectUrl);
  } catch {}
}

export function initBackgroundExportLifecycle() {
  if (typeof window === 'undefined' || lifecycleInitialized) return;
  lifecycleInitialized = true;

  if (document.title && !document.title.includes('Téléchargement vidéo')) {
    baseDocumentTitle = document.title;
  }

  void ensureExportServiceWorkerRegistered();

  const handleSiteExit = () => {
    pendingAutoDownloadOnVisible = false;
    if (activeAbortCtrl) {
      try {
        activeAbortCtrl.abort();
      } catch {}
      activeAbortCtrl = null;
    }
    disposeActiveRuntimeResources();
    if (snapshot.prepared) {
      revokePreparedUrls(snapshot.prepared);
    }
    void clearPhoneTopBarNotification();
    updateSnapshot({
      status: 'idle',
      progressPct: 0,
      statusLabel: '',
      errorMsg: null,
      prepared: null,
      downloadHref: null,
    });
  };

  window.addEventListener('beforeunload', handleSiteExit);
  window.addEventListener('pagehide', (event) => {
    if (shouldAbortOnPageHide(event)) {
      handleSiteExit();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (snapshot.status === 'preparing') {
        void acquireExportWakeAndWebLocks();
      } else if (
        pendingAutoDownloadOnVisible &&
        snapshot.status === 'ready' &&
        snapshot.downloadHref &&
        snapshot.prepared?.filename
      ) {
        pendingAutoDownloadOnVisible = false;
        triggerFileDownload(snapshot.downloadHref, snapshot.prepared.filename);
        updateSnapshot({
          prepared: { ...snapshot.prepared, downloaded: true },
        });
      }
    }
  });
}

export function setBackgroundExportStudioOpen(isOpen: boolean) {
  if (snapshot.isStudioOpen === isOpen) return;
  updateSnapshot({ isStudioOpen: isOpen });
}

export function markBackgroundVideoDownloaded() {
  if (!snapshot.prepared) return;
  pendingAutoDownloadOnVisible = false;
  updateSnapshot({
    prepared: { ...snapshot.prepared, downloaded: true },
  });
}

export function dismissBackgroundVideoExport() {
  if (snapshot.status === 'preparing') return;
  pendingAutoDownloadOnVisible = false;
  revokePreparedUrls(snapshot.prepared);
  void clearPhoneTopBarNotification();
  updateSnapshot({
    status: 'idle',
    progressPct: 0,
    statusLabel: '',
    errorMsg: null,
    prepared: null,
    downloadHref: null,
    canShare: false,
  });
}

export function invalidateReadyBackgroundExportIfMatches(nextSignature: string) {
  if (snapshot.status !== 'ready') return;
  if (snapshot.configSignature && snapshot.configSignature !== nextSignature) {
    dismissBackgroundVideoExport();
  }
}

export function cancelBackgroundVideoExport() {
  pendingAutoDownloadOnVisible = false;
  if (activeAbortCtrl) {
    try {
      activeAbortCtrl.abort();
    } catch {}
    activeAbortCtrl = null;
  }
  disposeActiveRuntimeResources();
  revokePreparedUrls(snapshot.prepared);
  void clearPhoneTopBarNotification();
  updateSnapshot({
    status: 'idle',
    progressPct: 0,
    statusLabel: '',
    errorMsg: null,
    prepared: null,
    downloadHref: null,
    canShare: false,
  });
}

export async function sharePreparedBackgroundVideo() {
  const prepared = snapshot.prepared;
  if (!prepared) return;
  const file = new File([prepared.blob], prepared.filename, {
    type: prepared.blob.type,
  });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: snapshot.summaryLabel || 'Vidéo Coran — Le Sanctuaire',
        files: [file],
      });
    } catch {}
  }
}

export async function startBackgroundVideoExport(
  params: StartBackgroundVideoExportParams
): Promise<void> {
  initBackgroundExportLifecycle();

  if (params.baseVideoSequence.length === 0 || snapshot.status === 'preparing') {
    return;
  }

  // Ask notification permission right on user tap so phone top-bar progress appears
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    void requestBackgroundNotificationPermission();
  }

  revokePreparedUrls(snapshot.prepared);
  pendingAutoDownloadOnVisible = false;

  const abortCtrl = new AbortController();
  activeAbortCtrl = abortCtrl;

  updateSnapshot({
    status: 'preparing',
    progressPct: 1,
    statusLabel: 'Préparation audio & rendu...',
    summaryLabel: params.summaryLabel,
    qualityLabel: params.qualityLabel,
    aspectLabel: params.aspectLabel,
    configSignature: params.configSignature,
    errorMsg: null,
    prepared: null,
    downloadHref: null,
    canShare: false,
    notificationPermission: getNotificationPermissionSafe(),
  });

  // Start silent audio keepalive, MediaSession bar, Web Lock & WakeLock inside user gesture
  startSilentAudioAndMediaSessionKeepalive(params.summaryLabel);
  void acquireExportWakeAndWebLocks();
  void pushPhoneTopBarNotification(true);

  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextCtor();
    activeAudioCtx = ctx;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    // If custom background uses a blob: URL from studio state, clone into a private blob URL
    // so closing/unmounting MobileVerseVideoStudio never revokes active export media.
    let ownedMediaUrl = params.activeMediaUrl;
    if (ownedMediaUrl && ownedMediaUrl.startsWith('blob:')) {
      try {
        const res = await fetch(ownedMediaUrl);
        if (res.ok) {
          const clonedBlob = await res.blob();
          activeOwnedMediaBlobUrl = URL.createObjectURL(clonedBlob);
          ownedMediaUrl = activeOwnedMediaBlobUrl;
        }
      } catch {}
    }

    const bgImgPromise =
      params.activeMediaKind === 'image' && ownedMediaUrl
        ? loadCanvasBackgroundImage(ownedMediaUrl)
        : Promise.resolve(null);
    const bgVideoPromise =
      params.activeMediaKind === 'video' && ownedMediaUrl
        ? loadExportBackgroundVideo(ownedMediaUrl)
        : Promise.resolve(null);
    const logoImgPromise = params.customLogoUrl
      ? loadCanvasBackgroundImage(params.customLogoUrl)
      : Promise.resolve(null);

    const [decodedBase, bgImg, bgVideo, logoImg] = await Promise.all([
      decodeVerseAudioSequence(
        ctx,
        params.primarySurahMeta.number,
        params.baseVideoSequence,
        params.reciterId,
        (loaded, total) => {
          if (abortCtrl.signal.aborted) return;
          const pct = Math.max(2, Math.round((loaded / Math.max(1, total)) * 22));
          updateSnapshot({
            progressPct: pct,
            statusLabel: `Chargement audio (${loaded}/${Math.max(1, total)})...`,
          });
          updateMediaSessionProgress(pct, params.summaryLabel, 'preparing');
          void pushPhoneTopBarNotification(false);
        },
        abortCtrl.signal
      ),
      bgImgPromise,
      bgVideoPromise,
      logoImgPromise,
    ]);

    activeExportBgVideo = bgVideo;

    if (abortCtrl.signal.aborted) {
      disposeActiveRuntimeResources();
      return;
    }

    const okAudioCount = decodedBase.filter((d) => d.buffer !== null).length;
    if (okAudioCount === 0) {
      throw new Error('Audio indisponible pour ces versets.');
    }

    const baseDurations = decodedBase.map((d) =>
      d.effectiveDurationSec > 0 ? d.effectiveDurationSec : undefined
    );

    const detectedBgDurationSec =
      params.targetCustomVideoDurationSec > 0
        ? params.targetCustomVideoDurationSec
        : params.durationMode === 'match_video' &&
          bgVideo &&
          Number.isFinite(bgVideo.duration) &&
          bgVideo.duration > 0
        ? bgVideo.duration
        : 0;

    const expanded =
      detectedBgDurationSec > 0
        ? extendSequenceToTargetDuration(
            params.baseVideoSequence,
            decodedBase,
            baseDurations,
            detectedBgDurationSec,
            params.paceMultiplier
          )
        : {
            sequence: params.baseVideoSequence,
            decodedItems: decodedBase,
            measuredDurationsSec: baseDurations,
          };

    const exportSeq = expanded.sequence;
    const exportDecoded: DecodedVerseBuffer[] = expanded.decodedItems;
    const exactTimeline = buildContinuousTimeline(
      exportSeq,
      expanded.measuredDurationsSec,
      params.paceMultiplier
    );

    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => {});
    }
    if (abortCtrl.signal.aborted) {
      disposeActiveRuntimeResources();
      return;
    }

    // Off-DOM canvas owned independently of MobileVerseVideoStudio mount lifecycle
    const canvas = document.createElement('canvas');
    activeExportCanvas = canvas;
    canvas.width = params.exportWidth;
    canvas.height = params.exportHeight;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) {
      throw new Error('Contexte graphique indisponible.');
    }

    const renderOpts: VideoCanvasRenderOptions = {
      width: params.exportWidth,
      height: params.exportHeight,
      surahName: params.primarySurahMeta.name,
      surahNumber: params.primarySurahMeta.number,
      startAyah: params.primaryNormalizedRange.startAyah,
      endAyah: params.primaryNormalizedRange.endAyah,
      selectedSurahsCount: params.selectedSurahs.length,
      isLightSurface: params.isLightSurface,
      bgSurfaceColor: params.bgSurfaceColor,
      bgVeilOpacity: params.bgVeilOpacity,
      bgBlackBackdrop: params.bgBlackBackdrop,
      bgBrightness: params.bgBrightness,
      bgSharpness: params.bgSharpness,
      bgContrast: params.bgContrast,
      bgImageMotion: params.bgImageMotion,
      textShadowBoost: params.textShadowBoost,
      arabicTextColor: params.arabicTextColor,
      phoneticsTextColor: params.phoneticsTextColor,
      frenchTextColor: params.frenchTextColor,
      bgImage: bgImg,
      bgVideo,
      logoImage: logoImg,
      showArabic: params.showArabic,
      useTajweed: params.useTajweed,
      showPhonetics: params.showPhonetics,
      showFrench: params.showFrench,
      showSurahHeader: params.showSurahHeader,
      textScale: params.textScale,
      flowMode: params.flowMode,
      reciterName: params.reciterName,
      showWatermark: params.showWatermark !== false,
    };

    const layout = precomputeVideoCanvasLayout(canvasCtx, exportSeq, renderOpts);
    renderVideoCanvasFrame(canvasCtx, layout, exactTimeline, 0, renderOpts);

    if (ctx.state !== 'running') {
      await ctx.resume().catch(() => {});
    }

    const exportResult = await exportQuranVideoToMp4({
      canvas,
      canvasCtx,
      layout,
      ayahs: exportSeq,
      timeline: exactTimeline,
      renderOpts,
      audioCtx: ctx,
      decodedBuffers: exportDecoded,
      paceMultiplier: params.paceMultiplier,
      monitorAudioDuringExport: false,
      abortSignal: abortCtrl.signal,
      onProgress: (pct, _elapsedSec, statusText) => {
        if (abortCtrl.signal.aborted) return;
        const clamped = Math.max(22, Math.min(99, Math.round(pct)));
        updateSnapshot({
          progressPct: clamped,
          statusLabel: statusText,
        });
        updateMediaSessionProgress(clamped, params.summaryLabel, 'preparing');
        void pushPhoneTopBarNotification(false);
      },
      onKeepaliveReady: (ka) => {
        activeKeepalive = ka;
      },
      onMediaRecorderReady: (rec) => {
        activeMediaRecorder = rec;
      },
    });

    if (abortCtrl.signal.aborted) {
      disposeActiveRuntimeResources();
      return;
    }

    const actualQualityId = inferVideoQualityFromDimensions(
      exportResult.width,
      exportResult.height
    );
    const objectUrl = URL.createObjectURL(exportResult.blob);
    const nextFilename = buildStudioExportFilename({
      selections: params.selectedSurahs,
      aspectLabel: params.aspectLabel,
      extension: exportResult.extension,
      qualityId: actualQualityId,
    });

    const inIframe = isRunningInIframe();
    let readyStagedUrl: string | null = null;
    if (shouldStageVideoDownload(exportResult.blob.size, inIframe, MAX_STAGE_DOWNLOAD_BYTES)) {
      updateSnapshot({
        progressPct: 98,
        statusLabel: 'Préparation du lien de téléchargement...',
      });
      readyStagedUrl = await stageVideoBlobOnServer(
        exportResult.blob,
        nextFilename,
        abortCtrl.signal
      );
    }

    if (abortCtrl.signal.aborted) {
      URL.revokeObjectURL(objectUrl);
      disposeActiveRuntimeResources();
      return;
    }

    const linkState = resolveVideoDownloadLinkState({
      inIframe,
      stagedDownloadUrl: readyStagedUrl,
      objectUrl,
      filename: nextFilename,
    });

    const isVisibleNow =
      typeof document === 'undefined' || document.visibilityState === 'visible';
    const preparedFile: BackgroundExportPreparedFile = {
      blob: exportResult.blob,
      objectUrl,
      stagedUrl: readyStagedUrl,
      filename: linkState.filename,
      sizeBytes: exportResult.blob.size,
      downloaded: isVisibleNow,
    };

    disposeActiveRuntimeResources();
    activeAbortCtrl = null;

    updateSnapshot({
      status: 'ready',
      progressPct: 100,
      statusLabel: 'Vidéo prête !',
      errorMsg: null,
      prepared: preparedFile,
      downloadHref: linkState.href || null,
      canShare:
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        Boolean(exportResult.blob),
    });

    updateMediaSessionProgress(100, params.summaryLabel, 'ready');
    void pushPhoneTopBarNotification(true);

    // Record completed video export in subscription ledger (decrements quota countdown)
    if (params.userEmail) {
      const verseCount = params.baseVideoSequence.filter((v) => !v.isBismillah).length || params.baseVideoSequence.length;
      const totalDur = Math.round(exactTimeline.totalDurationSec || 0);
      void recordCreatedVideo({
        email: params.userEmail,
        userName: params.userName,
        surahSummary: params.summaryLabel,
        verseCount,
        quality: params.qualityId || actualQualityId,
        aspectRatio: params.aspectLabel,
        hasCustomLogo: Boolean(params.customLogoUrl),
        durationSec: totalDur,
      }).catch(() => {});
    }

    if (linkState.href) {
      if (isVisibleNow) {
        triggerFileDownload(linkState.href, linkState.filename);
      } else {
        // Trigger download once user comes back to foreground tab, while keeping manual 1-tap button ready
        pendingAutoDownloadOnVisible = true;
      }
    }
  } catch (err: any) {
    disposeActiveRuntimeResources();
    activeAbortCtrl = null;
    if (!abortCtrl.signal.aborted) {
      updateSnapshot({
        status: 'error',
        statusLabel: '',
        errorMsg: err?.message || 'Téléchargement impossible sur cet appareil.',
      });
      void pushPhoneTopBarNotification(true);
    }
  }
}

export function getBackgroundVideoExportSnapshot(): BackgroundVideoExportSnapshot {
  return snapshot;
}

export function useBackgroundVideoExport(): BackgroundVideoExportSnapshot {
  const [state, setState] = useState<BackgroundVideoExportSnapshot>(snapshot);

  useEffect(() => {
    const sync = () => setState(snapshot);
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  return state;
}
