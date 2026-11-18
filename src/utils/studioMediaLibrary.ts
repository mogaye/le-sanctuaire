export type StudioMediaKind = 'image' | 'video';

export interface StoredStudioMediaRecord {
  id: string;
  name: string;
  kind: StudioMediaKind;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number;
  createdAt: number;
  blob: Blob;
  thumbBlob?: Blob;
  syncedToServer?: boolean;
  serverUrl?: string;
}

export interface StudioMediaSummary {
  id: string;
  name: string;
  kind: StudioMediaKind;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number;
  createdAt: number;
  url?: string;
  syncedToServer?: boolean;
}

export interface HydratedStudioMediaItem {
  id: string;
  name: string;
  kind: StudioMediaKind;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number;
  createdAt: number;
  url: string;
  thumbUrl?: string;
  syncedToServer: boolean;
}

const DB_NAME = 'le_sanctuaire_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_media';
const CLIENT_ID_KEY = 'sanctuaire_studio_client_id';
const PREFS_KEY = 'sanctuaire_studio_bg_prefs_v1';

export type StudioTextColorTarget = 'all' | 'arabic' | 'phonetics' | 'french';

export const STUDIO_TEXT_COLOR_SWATCHES: Array<{ label: string; hex: string }> = [
  { label: 'Blanc Pur', hex: '#FFFFFF' },
  { label: 'Ivoire Crème', hex: '#FAF3E0' },
  { label: 'Or Lumineux', hex: '#FBBF24' },
  { label: 'Sable Doré', hex: '#FDE68A' },
  { label: 'Menthe Douce', hex: '#A7F3D0' },
  { label: 'Émeraude', hex: '#10B981' },
  { label: 'Bleu Ciel', hex: '#93C5FD' },
  { label: 'Corail Doux', hex: '#FDA4AF' },
  { label: 'Gris Ardoise', hex: '#334155' },
  { label: 'Noir Profond', hex: '#0F172A' },
];

export interface StudioBgPreferences {
  bgId?: string;
  textColorOverride?: 'auto' | 'light' | 'dark';
  bgVeilOpacity?: number;
  bgBlackBackdrop?: boolean;
  textShadowBoost?: boolean;
  arabicTextColor?: string | null;
  phoneticsTextColor?: string | null;
  frenchTextColor?: string | null;
  colorTarget?: StudioTextColorTarget;
  bgBrightness?: number;
  bgSharpness?: number;
  bgContrast?: number;
  bgImageMotion?: boolean;
  videoFormatId?: string;
  videoQualityId?: string;
  flowMode?: string;
  customLogoDataUrl?: string | null;
  customLogoName?: string | null;
}

export function computeOptimizedImageDimensions(
  srcWidth: number,
  srcHeight: number,
  maxLongEdge: number = 2048
): { width: number; height: number; resized: boolean } {
  const safeW = Number.isFinite(srcWidth) && srcWidth > 0 ? Math.round(srcWidth) : 1;
  const safeH = Number.isFinite(srcHeight) && srcHeight > 0 ? Math.round(srcHeight) : 1;
  const safeMax = Number.isFinite(maxLongEdge) && maxLongEdge > 0 ? Math.round(maxLongEdge) : 2048;
  const longEdge = Math.max(safeW, safeH);
  if (longEdge <= safeMax) {
    return { width: safeW, height: safeH, resized: false };
  }
  const scale = safeMax / longEdge;
  return {
    width: Math.max(1, Math.round(safeW * scale)),
    height: Math.max(1, Math.round(safeH * scale)),
    resized: true,
  };
}

export function clampBackgroundAdjustment(value: number | undefined, fallback: number = 50): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function loadStudioBgPreferences(): StudioBgPreferences {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStudioBgPreferences(prefs: StudioBgPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}

export function classifyStudioMediaFile(
  fileName: string,
  mimeType: string
): StudioMediaKind | null {
  const mime = (mimeType || '').toLowerCase();
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';

  const lower = (fileName || '').toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(lower)) return 'video';
  if (/\.(png|jpe?g|webp|gif|bmp|avif|svg)$/.test(lower)) return 'image';
  return null;
}

export function formatStudioBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Ko';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  }
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function sanitizeStudioOwnerKey(rawOwner?: string | null): string {
  const clean = String(rawOwner || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_@.-]/g, '_');
  return clean ? clean.slice(0, 80) : 'default_local';
}

export function getActiveStudioOwnerKey(): string {
  if (typeof window === 'undefined') return 'default_local';
  try {
    const savedUser = window.localStorage.getItem('sanctuaire_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed?.email) {
        return sanitizeStudioOwnerKey(parsed.email);
      }
    }
  } catch {
    // ignore malformed user JSON
  }

  try {
    let clientId = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId = `browser_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    return sanitizeStudioOwnerKey(clientId);
  } catch {
    return 'default_local';
  }
}

export function mergeAndSortMediaSummaries(
  localItems: StudioMediaSummary[],
  remoteItems: StudioMediaSummary[]
): StudioMediaSummary[] {
  const map = new Map<string, StudioMediaSummary>();
  for (const r of remoteItems) {
    if (r?.id) map.set(r.id, { ...r, syncedToServer: true });
  }
  for (const l of localItems) {
    if (!l?.id) continue;
    const existing = map.get(l.id);
    map.set(l.id, {
      ...l,
      syncedToServer: Boolean(l.syncedToServer || existing),
      url: l.url || existing?.url,
    });
  }
  return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function openStudioMediaDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function getAllLocalMediaRecords(): Promise<StoredStudioMediaRecord[]> {
  const db = await openStudioMediaDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = Array.isArray(req.result) ? req.result : [];
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        resolve(list);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

async function putLocalMediaRecord(record: StoredStudioMediaRecord): Promise<boolean> {
  const db = await openStudioMediaDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function deleteLocalMediaRecord(id: string): Promise<boolean> {
  const db = await openStudioMediaDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export function probeVideoDurationSec(blob: Blob): Promise<number | undefined> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    let settled = false;
    const objUrl = URL.createObjectURL(blob);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.muted = true;
    const done = (val?: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        vid.removeAttribute('src');
        vid.load();
      } catch {}
      try {
        URL.revokeObjectURL(objUrl);
      } catch {}
      resolve(val && Number.isFinite(val) && val > 0 ? Number(val.toFixed(2)) : undefined);
    };
    const trySettleDuration = () => {
      if (Number.isFinite(vid.duration) && vid.duration > 0) {
        done(vid.duration);
      }
    };
    const timer = setTimeout(() => done(undefined), 30000);
    vid.onloadedmetadata = trySettleDuration;
    vid.ondurationchange = trySettleDuration;
    vid.onloadeddata = trySettleDuration;
    vid.onerror = () => done(undefined);
    vid.src = objUrl;
  });
}

async function uploadMediaBlobToServer(
  record: StoredStudioMediaRecord,
  ownerKey: string
): Promise<string | null> {
  if (typeof fetch === 'undefined') return null;
  try {
    const res = await fetch('/api/studio-media', {
      method: 'POST',
      headers: {
        'Content-Type': record.mimeType || 'application/octet-stream',
        'x-media-id': record.id,
        'x-media-name': encodeURIComponent(record.name),
        'x-media-kind': record.kind,
        'x-media-mime': record.mimeType || '',
        'x-media-duration': record.durationSec ? String(record.durationSec) : '',
        'x-media-created': String(record.createdAt),
        'x-media-owner': encodeURIComponent(ownerKey),
      },
      body: record.blob,
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.item?.url || null;
  } catch {
    return null;
  }
}

async function encodeCanvasToOptimizedBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<{ blob: Blob; mimeType: string } | null> {
  const tryType = (type: string) =>
    new Promise<Blob | null>((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), type, quality);
      } catch {
        resolve(null);
      }
    });

  const webp = await tryType('image/webp');
  if (webp && webp.size > 0 && webp.type === 'image/webp') {
    return { blob: webp, mimeType: 'image/webp' };
  }
  const jpeg = await tryType('image/jpeg');
  if (jpeg && jpeg.size > 0) {
    return { blob: jpeg, mimeType: jpeg.type || 'image/jpeg' };
  }
  return null;
}

async function optimizeUploadedImageFile(
  file: File
): Promise<{ blob: Blob; mimeType: string; thumbBlob?: Blob }> {
  if (
    typeof document === 'undefined' ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return { blob: file, mimeType: file.type || 'image/jpeg' };
  }

  let bitmap: ImageBitmap | null = null;
  let imgEl: HTMLImageElement | null = null;
  let objUrl: string | null = null;
  try {
    let srcW = 0;
    let srcH = 0;
    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file);
        srcW = bitmap.width;
        srcH = bitmap.height;
      } catch {
        bitmap = null;
      }
    }
    if (!bitmap) {
      objUrl = URL.createObjectURL(file);
      imgEl = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = objUrl!;
      });
      if (!imgEl || !imgEl.naturalWidth || !imgEl.naturalHeight) {
        return { blob: file, mimeType: file.type || 'image/jpeg' };
      }
      srcW = imgEl.naturalWidth;
      srcH = imgEl.naturalHeight;
    }

    const source: CanvasImageSource = (bitmap || imgEl)!;
    const targetDims = computeOptimizedImageDimensions(srcW, srcH, 2048);

    let mainBlob: Blob = file;
    let mainMime = file.type || 'image/jpeg';

    if (targetDims.resized || file.size > 220 * 1024) {
      const mainCanvas = document.createElement('canvas');
      mainCanvas.width = targetDims.width;
      mainCanvas.height = targetDims.height;
      const mCtx = mainCanvas.getContext('2d');
      if (mCtx) {
        mCtx.imageSmoothingEnabled = true;
        mCtx.imageSmoothingQuality = 'high';
        mCtx.drawImage(source, 0, 0, targetDims.width, targetDims.height);
        const encoded = await encodeCanvasToOptimizedBlob(mainCanvas, 0.82);
        if (encoded && (targetDims.resized || encoded.blob.size < file.size * 0.92)) {
          mainBlob = encoded.blob;
          mainMime = encoded.mimeType;
        }
      }
    }

    let thumbBlob: Blob | undefined;
    const thumbDims = computeOptimizedImageDimensions(srcW, srcH, 240);
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbDims.width;
    thumbCanvas.height = thumbDims.height;
    const tCtx = thumbCanvas.getContext('2d');
    if (tCtx) {
      tCtx.imageSmoothingEnabled = true;
      tCtx.imageSmoothingQuality = 'medium';
      tCtx.drawImage(source, 0, 0, thumbDims.width, thumbDims.height);
      const encodedThumb = await encodeCanvasToOptimizedBlob(thumbCanvas, 0.72);
      if (encodedThumb) {
        thumbBlob = encodedThumb.blob;
      }
    }

    return { blob: mainBlob, mimeType: mainMime, thumbBlob };
  } catch {
    return { blob: file, mimeType: file.type || 'image/jpeg' };
  } finally {
    try {
      bitmap?.close();
    } catch {}
    if (objUrl) {
      try {
        URL.revokeObjectURL(objUrl);
      } catch {}
    }
  }
}

function readBlobAsDataUrl(blob: Blob): Promise<string | null> {
  if (typeof FileReader === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    } catch {
      resolve(null);
    }
  });
}

export async function optimizeStudioLogoFile(
  file: File,
  maxLongEdge: number = 480
): Promise<{ dataUrl: string; name: string } | null> {
  const kind = classifyStudioMediaFile(file.name, file.type);
  if (kind !== 'image') return null;

  const cleanName = file.name.replace(/\.[^.]+$/, '') || 'Logo';

  if (
    typeof document === 'undefined' ||
    file.type === 'image/svg+xml' ||
    (file.size <= 160 * 1024 && (file.type === 'image/png' || file.type === 'image/webp'))
  ) {
    const directUrl = await readBlobAsDataUrl(file);
    if (directUrl) {
      return { dataUrl: directUrl, name: cleanName };
    }
  }

  let bitmap: ImageBitmap | null = null;
  let imgEl: HTMLImageElement | null = null;
  let objUrl: string | null = null;
  try {
    let srcW = 0;
    let srcH = 0;
    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file);
        srcW = bitmap.width;
        srcH = bitmap.height;
      } catch {
        bitmap = null;
      }
    }
    if (!bitmap) {
      objUrl = URL.createObjectURL(file);
      imgEl = await new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = objUrl!;
      });
      if (!imgEl || !imgEl.naturalWidth || !imgEl.naturalHeight) {
        const fallbackUrl = await readBlobAsDataUrl(file);
        return fallbackUrl ? { dataUrl: fallbackUrl, name: cleanName } : null;
      }
      srcW = imgEl.naturalWidth;
      srcH = imgEl.naturalHeight;
    }

    const source: CanvasImageSource = (bitmap || imgEl)!;
    const targetDims = computeOptimizedImageDimensions(srcW, srcH, maxLongEdge);
    const canvas = document.createElement('canvas');
    canvas.width = targetDims.width;
    canvas.height = targetDims.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallbackUrl = await readBlobAsDataUrl(file);
      return fallbackUrl ? { dataUrl: fallbackUrl, name: cleanName } : null;
    }
    ctx.clearRect(0, 0, targetDims.width, targetDims.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, targetDims.width, targetDims.height);

    // Prefer PNG for small transparent logo fidelity, fall back to WebP if too large for localStorage
    const pngUrl = canvas.toDataURL('image/png');
    if (pngUrl && pngUrl.length <= 360_000) {
      return { dataUrl: pngUrl, name: cleanName };
    }
    const webpUrl = canvas.toDataURL('image/webp', 0.88);
    if (webpUrl && webpUrl.startsWith('data:image/webp')) {
      return { dataUrl: webpUrl, name: cleanName };
    }
    return pngUrl ? { dataUrl: pngUrl, name: cleanName } : null;
  } catch {
    const fallbackUrl = await readBlobAsDataUrl(file);
    return fallbackUrl ? { dataUrl: fallbackUrl, name: cleanName } : null;
  } finally {
    try {
      bitmap?.close();
    } catch {}
    if (objUrl) {
      try {
        URL.revokeObjectURL(objUrl);
      } catch {}
    }
  }
}

export async function saveStudioMediaFile(
  file: File,
  indexSeed: number = 0
): Promise<HydratedStudioMediaItem | null> {
  const kind = classifyStudioMediaFile(file.name, file.type);
  if (!kind) return null;

  const cleanName =
    file.name.replace(/\.[^.]+$/, '') || (kind === 'video' ? 'Vidéo importée' : 'Image importée');
  const id = `media_${Date.now()}_${indexSeed}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = Date.now();
  const ownerKey = getActiveStudioOwnerKey();

  const durationSec = kind === 'video' ? await probeVideoDurationSec(file) : undefined;
  let finalBlob: Blob = file;
  let finalMime = file.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg');
  let thumbBlob: Blob | undefined;

  if (kind === 'image') {
    const optimized = await optimizeUploadedImageFile(file);
    finalBlob = optimized.blob;
    finalMime = optimized.mimeType;
    thumbBlob = optimized.thumbBlob;
  }

  const record: StoredStudioMediaRecord = {
    id,
    name: cleanName,
    kind,
    mimeType: finalMime,
    sizeBytes: finalBlob.size || 0,
    durationSec,
    createdAt,
    blob: finalBlob,
    thumbBlob,
    syncedToServer: false,
  };

  // 1. Persist immediately into IndexedDB so it stays on this site forever
  await putLocalMediaRecord(record);

  // 2. Sync to server vault so it's also stored remotely on the site (best-effort up to 1 GB)
  let syncedToServer = false;
  if (record.sizeBytes <= 1024 * 1024 * 1024) {
    const serverUrl = await uploadMediaBlobToServer(record, ownerKey);
    if (serverUrl) {
      syncedToServer = true;
      record.syncedToServer = true;
      record.serverUrl = serverUrl;
      await putLocalMediaRecord(record);
    }
  }

  return {
    id: record.id,
    name: record.name,
    kind: record.kind,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    durationSec: record.durationSec,
    createdAt: record.createdAt,
    url: URL.createObjectURL(finalBlob),
    thumbUrl: thumbBlob ? URL.createObjectURL(thumbBlob) : undefined,
    syncedToServer,
  };
}

export async function loadStudioMediaLibrary(): Promise<HydratedStudioMediaItem[]> {
  const ownerKey = getActiveStudioOwnerKey();
  const localRecords = await getAllLocalMediaRecords();
  const localById = new Map<string, StoredStudioMediaRecord>();
  for (const rec of localRecords) {
    if (rec?.id && rec.blob) {
      if (rec.kind === 'video' && !rec.durationSec) {
        const probed = await probeVideoDurationSec(rec.blob);
        if (probed) {
          rec.durationSec = probed;
          putLocalMediaRecord(rec).catch(() => {});
        }
      }
      localById.set(rec.id, rec);
    }
  }

  // Also check server-side saved library for cross-session/cross-device recovery
  let remoteSummaries: StudioMediaSummary[] = [];
  try {
    const res = await fetch(`/api/studio-media?owner=${encodeURIComponent(ownerKey)}`);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data?.items)) {
        remoteSummaries = data.items;
      }
    }
  } catch {
    // offline or static environment: local IndexedDB still works 100%
  }

  // Hydrate any server-only item down into local IndexedDB so playback/canvas capture stays fast & same-origin
  for (const remote of remoteSummaries) {
    if (!remote?.id || localById.has(remote.id) || !remote.url) continue;
    try {
      const fileRes = await fetch(remote.url);
      if (fileRes.ok) {
        const blob = await fileRes.blob();
        if (blob.size > 0) {
          const durationSec =
            remote.kind === 'video'
              ? remote.durationSec || (await probeVideoDurationSec(blob))
              : undefined;
          const downloaded: StoredStudioMediaRecord = {
            id: remote.id,
            name: remote.name,
            kind: remote.kind,
            mimeType: remote.mimeType || blob.type || (remote.kind === 'video' ? 'video/mp4' : 'image/jpeg'),
            sizeBytes: blob.size,
            durationSec,
            createdAt: remote.createdAt || Date.now(),
            blob,
            syncedToServer: true,
            serverUrl: remote.url,
          };
          await putLocalMediaRecord(downloaded);
          localById.set(downloaded.id, downloaded);
        }
      }
    } catch {
      // skip failing item
    }
  }

  // Background-push any local-only record to server vault silently if not yet synced
  for (const rec of localById.values()) {
    if (!rec.syncedToServer && rec.sizeBytes <= 1024 * 1024 * 1024) {
      uploadMediaBlobToServer(rec, ownerKey)
        .then((serverUrl) => {
          if (serverUrl) {
            rec.syncedToServer = true;
            rec.serverUrl = serverUrl;
            putLocalMediaRecord(rec).catch(() => {});
          }
        })
        .catch(() => {});
    }
  }

  const hydrated: HydratedStudioMediaItem[] = Array.from(localById.values())
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .map((rec) => ({
      id: rec.id,
      name: rec.name,
      kind: rec.kind,
      mimeType: rec.mimeType,
      sizeBytes: rec.sizeBytes,
      durationSec: rec.durationSec,
      createdAt: rec.createdAt,
      url: URL.createObjectURL(rec.blob),
      thumbUrl: rec.thumbBlob ? URL.createObjectURL(rec.thumbBlob) : undefined,
      syncedToServer: Boolean(rec.syncedToServer),
    }));

  return hydrated;
}

export async function deleteStudioMediaItem(id: string): Promise<void> {
  const ownerKey = getActiveStudioOwnerKey();
  await deleteLocalMediaRecord(id);
  try {
    await fetch(`/api/studio-media/${encodeURIComponent(ownerKey)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    // ignore remote delete error when offline
  }
}
