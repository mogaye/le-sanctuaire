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

/**
 * Selects a MediaRecorder MIME type that explicitly guarantees an audio+video codec pair
 * before falling back to bare containers (e.g. avoids Chromium's bare `video/mp4` dropping WebAudio).
 */
export function selectPreferredVideoMimeType(
  isTypeSupported: (mime: string) => boolean
): { mimeType: string; extension: 'mp4' | 'webm' } {
  const orderedCandidates: Array<{ mimeType: string; extension: 'mp4' | 'webm' }> = [
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4;codecs=avc1.42E01E,opus', extension: 'mp4' },
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
 * inside the 9:16 vertical video canvas.
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

