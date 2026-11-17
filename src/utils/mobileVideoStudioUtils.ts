export interface StudioAyahItem {
  num: number;
  globalNum?: number;
  ar: string;
  tr: string;
  fr: string;
}

export interface ContinuousTimelineSegment {
  index: number;
  ayahNum: number;
  startSec: number;
  endSec: number;
  durationSec: number;
}

export interface ContinuousTimeline {
  segments: ContinuousTimelineSegment[];
  totalDurationSec: number;
}

export interface TimelineLookupResult {
  activeIndex: number;
  segmentProgress: number;
  totalProgress: number;
}

export function normalizeVerseRange(
  startAyah: number,
  endAyah: number,
  maxAyahs: number
): { startAyah: number; endAyah: number; count: number } {
  const safeMax = Math.max(1, Math.floor(maxAyahs) || 1);
  const clampedStart = Math.min(safeMax, Math.max(1, Math.floor(startAyah) || 1));
  const clampedEnd = Math.min(safeMax, Math.max(clampedStart, Math.floor(endAyah) || clampedStart));
  return {
    startAyah: clampedStart,
    endAyah: clampedEnd,
    count: clampedEnd - clampedStart + 1,
  };
}

export function sliceSelectedAyahs<T extends { num: number }>(
  ayahs: T[],
  startAyah: number,
  endAyah: number
): T[] {
  if (!Array.isArray(ayahs) || ayahs.length === 0) return [];
  const lo = Math.min(startAyah, endAyah);
  const hi = Math.max(startAyah, endAyah);
  return ayahs.filter((a) => a.num >= lo && a.num <= hi);
}

export function estimateAyahDurationSeconds(
  ayah: Pick<StudioAyahItem, 'ar' | 'fr'>,
  paceMultiplier: number = 1
): number {
  const arLen = (ayah.ar || '').trim().length;
  const frLen = (ayah.fr || '').trim().length;
  const baseSec = Math.max(3.2, arLen * 0.085 + frLen * 0.025 + 1.1);
  const safePace = Math.max(0.5, Math.min(2.0, paceMultiplier || 1));
  return Number((baseSec / safePace).toFixed(2));
}

export function buildContinuousTimeline(
  ayahs: Array<Pick<StudioAyahItem, 'num' | 'ar' | 'fr'>>,
  measuredDurationsSec?: Array<number | undefined | null>,
  paceMultiplier: number = 1
): ContinuousTimeline {
  const segments: ContinuousTimelineSegment[] = [];
  let cursor = 0;

  for (let i = 0; i < ayahs.length; i++) {
    const ayah = ayahs[i];
    const measured = measuredDurationsSec?.[i];
    const safeDuration =
      typeof measured === 'number' && Number.isFinite(measured) && measured > 0.4
        ? Number((measured / Math.max(0.5, Math.min(2.0, paceMultiplier || 1))).toFixed(3))
        : estimateAyahDurationSeconds(ayah, paceMultiplier);

    const startSec = Number(cursor.toFixed(3));
    const endSec = Number((cursor + safeDuration).toFixed(3));
    segments.push({
      index: i,
      ayahNum: ayah.num,
      startSec,
      endSec,
      durationSec: Number((endSec - startSec).toFixed(3)),
    });
    cursor = endSec;
  }

  return {
    segments,
    totalDurationSec: Number(cursor.toFixed(3)),
  };
}

export function findActiveTimelineEntry(
  timeline: ContinuousTimeline,
  currentSec: number
): TimelineLookupResult {
  const { segments, totalDurationSec } = timeline;
  if (!segments.length || totalDurationSec <= 0) {
    return { activeIndex: 0, segmentProgress: 0, totalProgress: 0 };
  }

  const clamped = Math.max(0, Math.min(totalDurationSec, currentSec));
  const totalProgress = Math.max(0, Math.min(1, clamped / totalDurationSec));

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;
    if (clamped < seg.endSec || isLast) {
      const segElapsed = Math.max(0, clamped - seg.startSec);
      const segmentProgress =
        seg.durationSec > 0 ? Math.max(0, Math.min(1, segElapsed / seg.durationSec)) : 1;
      return {
        activeIndex: i,
        segmentProgress,
        totalProgress,
      };
    }
  }

  return {
    activeIndex: segments.length - 1,
    segmentProgress: 1,
    totalProgress: 1,
  };
}

/**
 * Computes a continuous vertical scroll offset across the whole verse ribbon so
 * the active verse focal point glides continuously with zero jumps between verses.
 */
export function computeContinuousScrollY(
  itemCentersPx: number[],
  timeline: ContinuousTimeline,
  currentSec: number,
  viewportHeightPx: number
): number {
  if (!itemCentersPx.length || !timeline.segments.length) return 0;

  const { activeIndex, segmentProgress } = findActiveTimelineEntry(timeline, currentSec);
  const currentCenter = itemCentersPx[activeIndex] ?? itemCentersPx[0];
  const nextCenter = itemCentersPx[Math.min(activeIndex + 1, itemCentersPx.length - 1)] ?? currentCenter;

  // Gentle ease-in-out glide toward the next verse in the final 45% of the current verse
  const glideT = segmentProgress <= 0.55 ? 0 : (segmentProgress - 0.55) / 0.45;
  const smoothT = glideT * glideT * (3 - 2 * glideT);
  const focalY = currentCenter + (nextCenter - currentCenter) * smoothT;

  return Math.max(0, Math.round(focalY - viewportHeightPx * 0.46));
}

export function wrapTextLines(
  text: string,
  maxWidth: number,
  measureWidth: (candidate: string) => number
): string[] {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  if (maxWidth <= 0) return [cleaned];

  const words = cleaned.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (measureWidth(candidate) <= maxWidth || !currentLine) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export function formatTimeMMSS(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '00:00';
  const rounded = Math.floor(totalSec);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const VIDEO_EXPORT_WIDTH = 1080;
export const VIDEO_EXPORT_HEIGHT = 1920;

export type VideoFormatId = 'youtube_1080p' | 'youtube_720p' | 'shorts_916' | 'square_1080';

export type VideoTemplateId =
  | 'teleprompter'
  | 'stream'
  | 'spotlight_card'
  | 'cinema_subtitles'
  | 'mushaf_split'
  | 'meditation_minimal';

export interface VideoFormatPreset {
  id: VideoFormatId;
  label: string;
  shortLabel: string;
  platformHint: string;
  aspectLabel: '16:9' | '9:16' | '1:1';
  width: number;
  height: number;
  previewWidth: number;
  previewHeight: number;
  pcOnly: boolean;
}

export const VIDEO_FORMAT_PRESETS: VideoFormatPreset[] = [
  {
    id: 'youtube_1080p',
    label: 'YouTube 16:9 Full HD',
    shortLabel: 'YouTube 1080p',
    platformHint: 'Vidéos longues & Sourates complètes (1920×1080)',
    aspectLabel: '16:9',
    width: 1920,
    height: 1080,
    previewWidth: 1280,
    previewHeight: 720,
    pcOnly: true,
  },
  {
    id: 'youtube_720p',
    label: 'YouTube 16:9 HD Rapide',
    shortLabel: 'YouTube 720p',
    platformHint: 'Idéal très longues sourates (1280×720)',
    aspectLabel: '16:9',
    width: 1280,
    height: 720,
    previewWidth: 960,
    previewHeight: 540,
    pcOnly: true,
  },
  {
    id: 'shorts_916',
    label: 'Vertical 9:16 (Shorts / Reels)',
    shortLabel: 'Vertical 9:16',
    platformHint: 'YouTube Shorts, Reels & TikTok (1080×1920)',
    aspectLabel: '9:16',
    width: 1080,
    height: 1920,
    previewWidth: 720,
    previewHeight: 1280,
    pcOnly: false,
  },
  {
    id: 'square_1080',
    label: 'Carré 1:1 (Publication)',
    shortLabel: 'Carré 1:1',
    platformHint: 'Format éditorial équilibré (1080×1080)',
    aspectLabel: '1:1',
    width: 1080,
    height: 1080,
    previewWidth: 720,
    previewHeight: 720,
    pcOnly: true,
  },
];

export interface VideoTemplatePreset {
  id: VideoTemplateId;
  name: string;
  subtitle: string;
  recommendedFor: string;
  isNew?: boolean;
}

export const VIDEO_TEMPLATE_PRESETS: VideoTemplatePreset[] = [
  {
    id: 'teleprompter',
    name: 'Téléprompteur Cinéma',
    subtitle: 'Glissement continu avec halo lumineux sur le verset actif.',
    recommendedFor: 'Shorts & Récitation guidée',
  },
  {
    id: 'stream',
    name: 'Flux Intégral Mushaf',
    subtitle: 'Page continue fluide gardant les versets voisins lisibles.',
    recommendedFor: 'Lecture suivie',
  },
  {
    id: 'spotlight_card',
    name: 'Cadre Calligraphique',
    subtitle: 'Carte sacrée aux filets dorés et transition en fondu enchaîné.',
    recommendedFor: 'Méditation & Partage',
    isNew: true,
  },
  {
    id: 'cinema_subtitles',
    name: 'Sous-Titres Cinéma',
    subtitle: 'Calligraphie majestueuse au centre et traduction en bandeau bas.',
    recommendedFor: 'YouTube Paysage 16:9',
    isNew: true,
  },
  {
    id: 'mushaf_split',
    name: 'Édition Bilingue Split',
    subtitle: 'Arabe d’un côté, phonétique et traduction française structurées de l’autre.',
    recommendedFor: 'Sourates longues YouTube',
    isNew: true,
  },
  {
    id: 'meditation_minimal',
    name: 'Contemplation & Ondes',
    subtitle: 'Étoile géométrique, respiration typographique et onde sonore discrète.',
    recommendedFor: 'Tadabbur & Relaxation',
    isNew: true,
  },
];

export function getVideoFormatPreset(
  formatId: VideoFormatId,
  isMobile: boolean
): VideoFormatPreset {
  const shorts = VIDEO_FORMAT_PRESETS.find((f) => f.id === 'shorts_916')!;
  if (isMobile) {
    return shorts;
  }
  return VIDEO_FORMAT_PRESETS.find((f) => f.id === formatId) || VIDEO_FORMAT_PRESETS[0];
}

export function getResolutionFallbackTiers(
  requestedWidth: number,
  requestedHeight: number
): Array<{ w: number; h: number; bitrate: number }> {
  const w = Math.max(320, Math.round(requestedWidth));
  const h = Math.max(320, Math.round(requestedHeight));

  // Landscape 16:9
  if (w > h) {
    if (w >= 1920) {
      return [
        { w: 1920, h: 1080, bitrate: 8_000_000 },
        { w: 1920, h: 1080, bitrate: 5_000_000 },
        { w: 1280, h: 720, bitrate: 4_500_000 },
        { w: 960, h: 540, bitrate: 2_800_000 },
      ];
    }
    return [
      { w, h, bitrate: 5_000_000 },
      { w, h, bitrate: 3_500_000 },
      { w: 960, h: 540, bitrate: 2_500_000 },
    ];
  }

  // Square 1:1
  if (w === h) {
    return [
      { w, h, bitrate: 6_500_000 },
      { w, h, bitrate: 4_500_000 },
      { w: 720, h: 720, bitrate: 3_500_000 },
    ];
  }

  // Portrait 9:16
  return [
    { w, h, bitrate: 8_000_000 },
    { w, h, bitrate: 5_000_000 },
    { w: 720, h: 1280, bitrate: 4_500_000 },
    { w: 540, h: 960, bitrate: 3_000_000 },
  ];
}

export function generateYouTubePublishPack(params: {
  surahName: string;
  surahArabicName?: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  totalAyahsInSurah: number;
  reciterName: string;
  timeline: ContinuousTimeline;
}): { title: string; description: string } {
  const isFullSurah =
    params.startAyah === 1 && params.endAyah >= params.totalAyahsInSurah;
  const rangeLabel = isFullSurah
    ? `Sourate complète (${params.totalAyahsInSurah} versets)`
    : `Versets ${params.startAyah} à ${params.endAyah}`;

  const title = `Sourate ${params.surahName} (${params.surahNumber}) — ${rangeLabel} | ${params.reciterName} (Arabe, Phonétique & Français)`;

  // Sample chapters cleanly (at most 40 entries for super long surahs, or every verse up to 35 verses)
  const segments = params.timeline.segments;
  const step = segments.length > 40 ? Math.ceil(segments.length / 30) : 1;
  const chapterLines: string[] = [];
  for (let i = 0; i < segments.length; i += step) {
    const seg = segments[i];
    chapterLines.push(`${formatTimeMMSS(seg.startSec)} Verset ${seg.ayahNum}`);
  }
  if (segments.length > 1 && (segments.length - 1) % step !== 0) {
    const lastSeg = segments[segments.length - 1];
    chapterLines.push(`${formatTimeMMSS(lastSeg.startSec)} Verset ${lastSeg.ayahNum}`);
  }

  const description = [
    `بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ`,
    ``,
    `Récitation apaisante de la Sourate ${params.surahName}${
      params.surahArabicName ? ` (${params.surahArabicName})` : ''
    } — ${rangeLabel}.`,
    `Récitateur : ${params.reciterName}`,
    `Texte arabe, transcription phonétique et traduction en français.`,
    ``,
    `Chapitres :`,
    ...chapterLines,
    ``,
    `Créé avec Le Sanctuaire — La Voie de la Sérénité`,
    `#Coran #Quran #Sourate${params.surahName.replace(/[^a-zA-Z0-9]/g, '')} #Islam`,
  ].join('\n');

  return { title, description };
}

/**
 * Selects a MediaRecorder MIME type that explicitly guarantees an audio+video codec pair,
 * preferring H.264 + AAC MP4 first when natively supported, while avoiding bare `video/mp4`
 * over WebM Opus so WebAudio tracks are never silently dropped before FFmpeg MP4 muxing.
 */
export function selectPreferredVideoMimeType(
  isTypeSupported: (mime: string) => boolean
): { mimeType: string; extension: 'mp4' | 'webm' } {
  const orderedCandidates: Array<{ mimeType: string; extension: 'mp4' | 'webm' }> = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1.4d002a,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
    { mimeType: 'video/mp4', extension: 'mp4' },
  ];

  for (const candidate of orderedCandidates) {
    try {
      if (isTypeSupported(candidate.mimeType)) {
        return candidate;
      }
    } catch {
      // ignore unsupported query errors
    }
  }

  return { mimeType: '', extension: 'webm' };
}

/**
 * Computes CSS object-fit: cover draw bounds for any landscape/square/vertical image or video
 * inside the target canvas frame.
 */
export function computeCoverDrawRect(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number
): { x: number; y: number; w: number; h: number } {
  const safeSrcW = Math.max(1, srcWidth || 1);
  const safeSrcH = Math.max(1, srcHeight || 1);
  const imgRatio = safeSrcW / safeSrcH;
  const dstRatio = dstWidth / Math.max(1, dstHeight);

  if (imgRatio > dstRatio) {
    const h = dstHeight;
    const w = dstHeight * imgRatio;
    return { x: (dstWidth - w) / 2, y: 0, w, h };
  }

  const w = dstWidth;
  const h = dstWidth / Math.max(0.01, imgRatio);
  return { x: 0, y: (dstHeight - h) / 2, w, h };
}


