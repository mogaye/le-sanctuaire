export interface StudioAyahItem {
  num: number;
  globalNum?: number;
  ar: string;
  tr: string;
  fr: string;
  isBismillah?: boolean;
  audioSurahNum?: number;
  audioAyahNum?: number;
  surahNumber?: number;
  surahName?: string;
  surahArabicName?: string;
  surahTotalAyahs?: number;
}

export interface StudioSurahSelection {
  id: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
}

export interface StudioSurahMetaInput {
  number: number;
  name: string;
  arabicName?: string;
  frenchTranslation?: string;
  numberOfAyahs: number;
  openingAyahArabic?: string;
  openingAyahFrench?: string;
}

export const STUDIO_BISMILLAH_ITEM: StudioAyahItem = {
  num: 0,
  isBismillah: true,
  audioSurahNum: 1,
  audioAyahNum: 1,
  ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  tr: 'Bismillaahir Rahmaanir Raheem',
  fr: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux.",
};

export interface ContinuousTimelineSegment {
  index: number;
  ayahNum: number;
  isBismillah?: boolean;
  surahNumber?: number;
  surahName?: string;
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

/**
 * Videos starting at Ayah 1 must begin with Bismillah for all Surahs except
 * Al-Fatiha (1, where Ayah 1 is already Bismillah) and At-Tawbah (9, no Bismillah).
 */
export function shouldPrependBismillah(surahNumber: number, startAyah: number): boolean {
  return startAyah === 1 && surahNumber !== 1 && surahNumber !== 9;
}

function normalizeArabicTokenForMatch(token: string): string {
  return token
    .replace(/[\uFEFF\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .trim();
}

/**
 * Editions like `quran-uthmani` prepend Bismillah directly inside Ayah 1 text of Surahs 2..114.
 * When Bismillah is recited & shown as its own opening segment, strip the duplicate prefix from Ayah 1
 * only if verse text remains after the 4 Bismillah words.
 */
export function stripLeadingBismillahFromAyah1(ar: string): string {
  const cleaned = (ar || '').replace(/^\uFEFF/, '').trim();
  if (!cleaned) return '';
  const tokens = cleaned.split(/\s+/);
  if (tokens.length <= 4) return cleaned;

  const firstFour = tokens.slice(0, 4).map(normalizeArabicTokenForMatch);
  if (
    firstFour[0] === 'بسم' &&
    firstFour[1] === 'الله' &&
    firstFour[2] === 'الرحمن' &&
    firstFour[3] === 'الرحيم'
  ) {
    return tokens.slice(4).join(' ').trim();
  }
  return cleaned;
}

export function buildStudioVideoSequence(
  surahNumber: number,
  ayahs: StudioAyahItem[],
  startAyah: number,
  endAyah: number,
  surahMeta?: Partial<Pick<StudioSurahMetaInput, 'name' | 'arabicName' | 'numberOfAyahs'>>
): StudioAyahItem[] {
  const sliced = sliceSelectedAyahs(ayahs, startAyah, endAyah);
  if (sliced.length === 0) return [];

  const withMeta = (item: StudioAyahItem): StudioAyahItem => ({
    ...item,
    audioSurahNum: item.audioSurahNum ?? surahNumber,
    audioAyahNum: item.audioAyahNum ?? item.num,
    surahNumber: item.surahNumber ?? surahNumber,
    surahName: item.surahName ?? surahMeta?.name,
    surahArabicName: item.surahArabicName ?? surahMeta?.arabicName,
    surahTotalAyahs: item.surahTotalAyahs ?? surahMeta?.numberOfAyahs,
  });

  if (!shouldPrependBismillah(surahNumber, startAyah)) {
    return sliced.map(withMeta);
  }

  const normalizedVerses = sliced.map((item, idx) => {
    const enriched = withMeta(item);
    if (idx === 0 && item.num === 1) {
      return {
        ...enriched,
        ar: stripLeadingBismillahFromAyah1(item.ar),
      };
    }
    return enriched;
  });

  return [
    {
      ...STUDIO_BISMILLAH_ITEM,
      surahNumber,
      surahName: surahMeta?.name,
      surahArabicName: surahMeta?.arabicName,
      surahTotalAyahs: surahMeta?.numberOfAyahs,
    },
    ...normalizedVerses,
  ];
}

export function buildSurahPlaceholderAyahs(meta: StudioSurahMetaInput): StudioAyahItem[] {
  const count = Math.max(1, meta.numberOfAyahs || 1);
  return Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    return {
      num,
      ar:
        idx === 0 && meta.openingAyahArabic
          ? meta.openingAyahArabic
          : 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      tr: idx === 0 ? `Sourate ${meta.name}` : `Verset ${num}`,
      fr:
        idx === 0 && meta.openingAyahFrench
          ? meta.openingAyahFrench
          : `${meta.frenchTranslation || meta.name} — Verset ${num}`,
      audioSurahNum: meta.number,
      audioAyahNum: num,
      surahNumber: meta.number,
      surahName: meta.name,
      surahArabicName: meta.arabicName,
      surahTotalAyahs: meta.numberOfAyahs,
    };
  });
}

/**
 * Builds an ordered continuous video sequence across one or multiple selected Surahs,
 * preserving each Surah's Bismillah intro (when starting at verse 1 outside Surahs 1 & 9),
 * exact audio coordinates (audioSurahNum/audioAyahNum), and full verse counts.
 */
export function buildMultiSurahVideoSequence(
  selections: StudioSurahSelection[],
  versesBySurah: Map<number, StudioAyahItem[]> | Record<number, StudioAyahItem[]>,
  surahCatalog: StudioSurahMetaInput[]
): StudioAyahItem[] {
  if (!Array.isArray(selections) || selections.length === 0) return [];

  const getVerses = (num: number): StudioAyahItem[] | undefined =>
    versesBySurah instanceof Map ? versesBySurah.get(num) : versesBySurah[num];

  const sequence: StudioAyahItem[] = [];

  for (const sel of selections) {
    const meta = surahCatalog.find((s) => s.number === sel.surahNumber);
    const loaded = getVerses(sel.surahNumber);
    const sourceAyahs =
      loaded && loaded.length > 0
        ? loaded
        : meta
        ? buildSurahPlaceholderAyahs(meta)
        : [];
    if (sourceAyahs.length === 0) continue;

    const maxAyahs = Math.max(sourceAyahs.length, meta?.numberOfAyahs || 1);
    const normalized = normalizeVerseRange(sel.startAyah, sel.endAyah, maxAyahs);
    const part = buildStudioVideoSequence(
      sel.surahNumber,
      sourceAyahs,
      normalized.startAyah,
      normalized.endAyah,
      meta
    );
    sequence.push(...part);
  }

  return sequence;
}

export function buildStudioExportFilename(params: {
  selections: Array<Pick<StudioSurahSelection, 'surahNumber' | 'startAyah' | 'endAyah'>>;
  aspectLabel: string;
  extension: string;
  qualityId?: VideoQualityId;
}): string {
  const aspect = params.aspectLabel.replace(':', 'x');
  const ext = params.extension || 'mp4';
  const qualitySuffix = params.qualityId ? `-${params.qualityId}` : '';
  if (!params.selections || params.selections.length === 0) {
    return `coran-studio-${aspect}${qualitySuffix}.${ext}`;
  }
  if (params.selections.length === 1) {
    const s = params.selections[0];
    return `coran-s${s.surahNumber}-v${s.startAyah}-${s.endAyah}-${aspect}${qualitySuffix}.${ext}`;
  }
  const nums = params.selections
    .slice(0, 4)
    .map((s) => s.surahNumber)
    .join('-');
  return `coran-${params.selections.length}sourates-s${nums}-${aspect}${qualitySuffix}.${ext}`;
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
  ayahs: Array<Pick<StudioAyahItem, 'num' | 'ar' | 'fr' | 'isBismillah' | 'surahNumber' | 'surahName'>>,
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
      isBismillah: ayah.isBismillah,
      surahNumber: ayah.surahNumber,
      surahName: ayah.surahName,
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
  const hours = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
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

export type VideoQualityId = '4k' | '1080p' | '720p' | '480p';

export interface VideoQualityPreset {
  id: VideoQualityId;
  label: string;
  shortLabel: string;
  description: string;
  shortSidePx: number;
  longSide169Px: number;
}

export const VIDEO_QUALITY_PRESETS: VideoQualityPreset[] = [
  {
    id: '4k',
    label: '4K Ultra HD',
    shortLabel: '4K',
    description: '2160p · Netteté maximale',
    shortSidePx: 2160,
    longSide169Px: 3840,
  },
  {
    id: '1080p',
    label: 'Full HD 1080p',
    shortLabel: '1080p',
    description: '1080p · Haute définition',
    shortSidePx: 1080,
    longSide169Px: 1920,
  },
  {
    id: '720p',
    label: 'HD 720p',
    shortLabel: '720p',
    description: '720p · Export rapide',
    shortSidePx: 720,
    longSide169Px: 1280,
  },
  {
    id: '480p',
    label: 'Éco 480p',
    shortLabel: '480p',
    description: '480p · Fichier léger',
    shortSidePx: 480,
    longSide169Px: 854,
  },
];

export function getVideoQualityPreset(qualityId?: string | null): VideoQualityPreset {
  return VIDEO_QUALITY_PRESETS.find((q) => q.id === qualityId) || VIDEO_QUALITY_PRESETS[1];
}

export function resolveFormatDimensionsForQuality(
  baseFormat: VideoFormatPreset,
  qualityId: VideoQualityId
): VideoFormatPreset {
  const q = getVideoQualityPreset(qualityId);
  let width = q.longSide169Px;
  let height = q.shortSidePx;
  let previewWidth = 1280;
  let previewHeight = 720;

  if (baseFormat.aspectLabel === '9:16') {
    width = q.shortSidePx;
    height = q.longSide169Px;
    previewWidth = qualityId === '480p' ? 480 : 720;
    previewHeight = qualityId === '480p' ? 854 : 1280;
  } else if (baseFormat.aspectLabel === '1:1') {
    width = q.shortSidePx;
    height = q.shortSidePx;
    previewWidth = qualityId === '480p' ? 480 : 720;
    previewHeight = qualityId === '480p' ? 480 : 720;
  } else {
    width = q.longSide169Px;
    height = q.shortSidePx;
    previewWidth = qualityId === '480p' ? 854 : 1280;
    previewHeight = qualityId === '480p' ? 480 : 720;
  }

  const baseAspectName =
    baseFormat.aspectLabel === '16:9'
      ? 'Paysage 16:9'
      : baseFormat.aspectLabel === '9:16'
      ? 'Vertical 9:16'
      : 'Carré 1:1';

  return {
    ...baseFormat,
    width,
    height,
    previewWidth,
    previewHeight,
    label: `${baseAspectName} · ${q.label}`,
    shortLabel: `${baseFormat.aspectLabel} ${q.shortLabel}`,
    platformHint: `${q.description} (${width}×${height})`,
  };
}

const QUALITY_CANONICAL_ORDER: VideoQualityId[] = ['4k', '1080p', '720p', '480p'];

export function toggleRenderQualitySelection(
  selected: VideoQualityId[],
  qualityId: VideoQualityId
): VideoQualityId[] {
  const current = new Set<VideoQualityId>(selected);
  if (current.has(qualityId)) {
    if (current.size <= 1) return QUALITY_CANONICAL_ORDER.filter((q) => current.has(q));
    current.delete(qualityId);
  } else {
    current.add(qualityId);
  }
  return QUALITY_CANONICAL_ORDER.filter((q) => current.has(q));
}

export function inferVideoQualityFromDimensions(width: number, height: number): VideoQualityId {
  const shortSide = Math.min(width, height);
  if (shortSide >= 2000) return '4k';
  if (shortSide >= 1000) return '1080p';
  if (shortSide >= 680) return '720p';
  return '480p';
}

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

export function computeVideoSeekTime(targetTimeSec: number, videoDurationSec: number): number {
  if (!Number.isFinite(videoDurationSec) || videoDurationSec <= 0.08) {
    return 0;
  }
  const safeTarget = Number.isFinite(targetTimeSec) && targetTimeSec >= 0 ? targetTimeSec : 0;
  const wrapped = safeTarget % videoDurationSec;
  return Math.max(0, Math.min(videoDurationSec - 0.04, wrapped));
}

export function extendSequenceToTargetDuration<T extends Pick<StudioAyahItem, 'ar' | 'fr'>, D>(
  sequence: T[],
  decodedItems: D[],
  measuredDurationsSec: Array<number | undefined>,
  targetDurationSec: number,
  paceMultiplier: number = 1
): {
  sequence: T[];
  decodedItems: D[];
  measuredDurationsSec: Array<number | undefined>;
} {
  if (
    !Array.isArray(sequence) ||
    sequence.length === 0 ||
    !Number.isFinite(targetDurationSec) ||
    targetDurationSec <= 0
  ) {
    return { sequence, decodedItems, measuredDurationsSec };
  }

  const safePace = Math.max(0.5, Math.min(2.0, paceMultiplier || 1));
  const segDurs = sequence.map((ayah, idx) => {
    const measured = measuredDurationsSec[idx];
    return typeof measured === 'number' && Number.isFinite(measured) && measured > 0.4
      ? Number((measured / safePace).toFixed(3))
      : estimateAyahDurationSeconds(ayah, safePace);
  });

  const singlePassSec = segDurs.reduce((acc, d) => acc + d, 0);
  if (singlePassSec <= 0 || singlePassSec >= targetDurationSec - 0.1) {
    return { sequence, decodedItems, measuredDurationsSec };
  }

  const outSeq: T[] = [];
  const outDecoded: D[] = [];
  const outMeasured: Array<number | undefined> = [];
  let accumSec = 0;

  while (accumSec < targetDurationSec - 0.05) {
    let addedInPass = 0;
    for (let i = 0; i < sequence.length; i++) {
      if (accumSec >= targetDurationSec - 0.05) break;
      outSeq.push(sequence[i]);
      if (i < decodedItems.length) {
        outDecoded.push(decodedItems[i]);
      }
      outMeasured.push(measuredDurationsSec[i]);
      accumSec += segDurs[i];
      addedInPass++;
    }
    if (addedInPass === 0 || singlePassSec <= 0) break;
  }

  return {
    sequence: outSeq,
    decodedItems: outDecoded,
    measuredDurationsSec: outMeasured,
  };
}

export function getResolutionFallbackTiers(
  requestedWidth: number,
  requestedHeight: number,
  targetDurationSec: number = 60
): Array<{ w: number; h: number; bitrate: number }> {
  const w = Math.max(320, Math.round(requestedWidth));
  const h = Math.max(320, Math.round(requestedHeight));
  const dur = Number.isFinite(targetDurationSec) && targetDurationSec > 0 ? targetDurationSec : 60;
  const bitrateScale = dur > 1800 ? 0.35 : dur > 420 ? 0.45 : dur > 180 ? 0.62 : 1.0;
  const scaleBps = (bps: number) => Math.max(1_600_000, Math.round((bps * bitrateScale) / 100_000) * 100_000);

  // Landscape 16:9
  if (w > h) {
    if (w >= 3840) {
      return [
        { w: 3840, h: 2160, bitrate: scaleBps(22_000_000) },
        { w: 3840, h: 2160, bitrate: scaleBps(14_000_000) },
        { w: 1920, h: 1080, bitrate: scaleBps(8_000_000) },
        { w: 1280, h: 720, bitrate: scaleBps(4_500_000) },
        { w: 854, h: 480, bitrate: scaleBps(2_400_000) },
      ];
    }
    if (w >= 1920) {
      return [
        { w: 1920, h: 1080, bitrate: scaleBps(8_000_000) },
        { w: 1920, h: 1080, bitrate: scaleBps(5_000_000) },
        { w: 1280, h: 720, bitrate: scaleBps(4_500_000) },
        { w: 960, h: 540, bitrate: scaleBps(2_800_000) },
      ];
    }
    if (w >= 1280) {
      return [
        { w: 1280, h: 720, bitrate: scaleBps(5_000_000) },
        { w: 1280, h: 720, bitrate: scaleBps(3_500_000) },
        { w: 854, h: 480, bitrate: scaleBps(2_200_000) },
      ];
    }
    return [
      { w, h, bitrate: scaleBps(2_600_000) },
      { w, h, bitrate: scaleBps(1_800_000) },
    ];
  }

  // Square 1:1
  if (w === h) {
    if (w >= 2160) {
      return [
        { w: 2160, h: 2160, bitrate: scaleBps(18_000_000) },
        { w: 2160, h: 2160, bitrate: scaleBps(12_000_000) },
        { w: 1080, h: 1080, bitrate: scaleBps(6_500_000) },
        { w: 720, h: 720, bitrate: scaleBps(3_500_000) },
      ];
    }
    if (w >= 1080) {
      return [
        { w, h, bitrate: scaleBps(6_500_000) },
        { w, h, bitrate: scaleBps(4_500_000) },
        { w: 720, h: 720, bitrate: scaleBps(3_500_000) },
      ];
    }
    if (w >= 720) {
      return [
        { w, h, bitrate: scaleBps(3_800_000) },
        { w: 480, h: 480, bitrate: scaleBps(2_000_000) },
      ];
    }
    return [
      { w, h, bitrate: scaleBps(2_200_000) },
      { w, h, bitrate: scaleBps(1_600_000) },
    ];
  }

  // Portrait 9:16
  if (h >= 3840) {
    return [
      { w: 2160, h: 3840, bitrate: scaleBps(22_000_000) },
      { w: 2160, h: 3840, bitrate: scaleBps(14_000_000) },
      { w: 1080, h: 1920, bitrate: scaleBps(8_000_000) },
      { w: 720, h: 1280, bitrate: scaleBps(4_500_000) },
      { w: 480, h: 854, bitrate: scaleBps(2_400_000) },
    ];
  }
  if (h >= 1920) {
    return [
      { w, h, bitrate: scaleBps(8_000_000) },
      { w, h, bitrate: scaleBps(5_000_000) },
      { w: 720, h: 1280, bitrate: scaleBps(4_500_000) },
      { w: 540, h: 960, bitrate: scaleBps(3_000_000) },
    ];
  }
  if (h >= 1280) {
    return [
      { w, h, bitrate: scaleBps(4_500_000) },
      { w, h, bitrate: scaleBps(3_200_000) },
      { w: 480, h: 854, bitrate: scaleBps(2_200_000) },
    ];
  }
  return [
    { w, h, bitrate: scaleBps(2_400_000) },
    { w, h, bitrate: scaleBps(1_600_000) },
  ];
}

export interface YouTubeSurahSummaryItem {
  surahNumber: number;
  surahName: string;
  surahArabicName?: string;
  startAyah: number;
  endAyah: number;
  totalAyahsInSurah: number;
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
  selectedSurahs?: YouTubeSurahSummaryItem[];
}): { title: string; description: string } {
  const surahs =
    params.selectedSurahs && params.selectedSurahs.length > 0
      ? params.selectedSurahs
      : [
          {
            surahNumber: params.surahNumber,
            surahName: params.surahName,
            surahArabicName: params.surahArabicName,
            startAyah: params.startAyah,
            endAyah: params.endAyah,
            totalAyahsInSurah: params.totalAyahsInSurah,
          },
        ];

  const isMultiSurah = surahs.length > 1;
  const first = surahs[0];
  const isFirstFull =
    first.startAyah === 1 && first.endAyah >= first.totalAyahsInSurah;
  const singleRangeLabel = isFirstFull
    ? `Sourate complète (${first.totalAyahsInSurah} versets)`
    : `Versets ${first.startAyah} à ${first.endAyah}`;

  const title = isMultiSurah
    ? surahs.length <= 3
      ? `Sourates ${surahs.map((s) => `${s.surahName} (${s.surahNumber})`).join(', ')} | ${params.reciterName} (Arabe, Phonétique & Français)`
      : `Compilation Coran : ${surahs.length} sourates (${surahs[0].surahName} à ${surahs[surahs.length - 1].surahName}) | ${params.reciterName}`
    : `Sourate ${first.surahName} (${first.surahNumber}) — ${singleRangeLabel} | ${params.reciterName} (Arabe, Phonétique & Français)`;

  // Sample chapters cleanly (at most 40 entries for super long surahs, or every verse up to 35 verses)
  const segments = params.timeline.segments;
  const step = segments.length > 40 ? Math.ceil(segments.length / 30) : 1;
  const chapterLines: string[] = [];
  const formatSegLabel = (seg: ContinuousTimelineSegment) => {
    const base = seg.isBismillah ? 'Bismillah' : `Verset ${seg.ayahNum}`;
    return isMultiSurah && seg.surahName ? `${seg.surahName} — ${base}` : base;
  };
  for (let i = 0; i < segments.length; i += step) {
    const seg = segments[i];
    chapterLines.push(`${formatTimeMMSS(seg.startSec)} ${formatSegLabel(seg)}`);
  }
  if (segments.length > 1 && (segments.length - 1) % step !== 0) {
    const lastSeg = segments[segments.length - 1];
    chapterLines.push(`${formatTimeMMSS(lastSeg.startSec)} ${formatSegLabel(lastSeg)}`);
  }

  const introSummary = isMultiSurah
    ? [
        `Récitation apaisante de ${surahs.length} sourates du Noble Coran :`,
        ...surahs.map((s) => {
          const full = s.startAyah === 1 && s.endAyah >= s.totalAyahsInSurah;
          return `• Sourate ${s.surahName}${s.surahArabicName ? ` (${s.surahArabicName})` : ''} — ${
            full ? `Complète (${s.totalAyahsInSurah} versets)` : `Versets ${s.startAyah} à ${s.endAyah}`
          }`;
        }),
      ].join('\n')
    : `Récitation apaisante de la Sourate ${first.surahName}${
        first.surahArabicName ? ` (${first.surahArabicName})` : ''
      } — ${singleRangeLabel}.`;

  const hashtags = surahs
    .slice(0, 4)
    .map((s) => `#Sourate${s.surahName.replace(/[^a-zA-Z0-9]/g, '')}`)
    .join(' ');

  const description = [
    `بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ`,
    ``,
    introSummary,
    `Récitateur : ${params.reciterName}`,
    `Texte arabe, transcription phonétique et traduction en français.`,
    ``,
    `Chapitres :`,
    ...chapterLines,
    ``,
    `Créé avec Le Sanctuaire — La Voie de la Sérénité`,
    `#Coran #Quran ${hashtags} #Islam`,
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

export const TOP_LEVEL_MAX_DIRECT_STAGE_BYTES = 250 * 1024 * 1024;

/**
 * Determines whether the generated MP4 should be staged on `/api/video/stage-download`
 * so native HTTP `Content-Disposition: attachment` downloads work reliably in iframes,
 * mobile WebViews, and desktop browsers.
 */
export function shouldStageVideoDownload(
  blobSizeBytes: number,
  inIframe: boolean,
  maxStageBytes: number
): boolean {
  if (!Number.isFinite(blobSizeBytes) || blobSizeBytes <= 0 || blobSizeBytes > maxStageBytes) {
    return false;
  }
  if (inIframe) return true;
  return blobSizeBytes <= TOP_LEVEL_MAX_DIRECT_STAGE_BYTES;
}

export function resolveVideoDownloadLinkState(params: {
  inIframe: boolean;
  stagedDownloadUrl: string | null;
  objectUrl: string | null;
  filename: string;
}): {
  href: string | null;
  filename: string;
  usesServerRelay: boolean;
} {
  const safeFilename = (params.filename || 'coran-sanctuaire.mp4').trim() || 'coran-sanctuaire.mp4';
  if (params.stagedDownloadUrl) {
    return {
      href: params.stagedDownloadUrl,
      filename: safeFilename,
      usesServerRelay: true,
    };
  }
  if (params.objectUrl) {
    return {
      href: params.objectUrl,
      filename: safeFilename,
      usesServerRelay: false,
    };
  }
  return {
    href: null,
    filename: safeFilename,
    usesServerRelay: false,
  };
}

export interface StudioRenderListItem {
  id: string;
  qualityId: VideoQualityId;
  qualityLabel: string;
  aspectLabel: '16:9' | '9:16' | '1:1';
  width: number;
  height: number;
  filename: string;
  sizeBytes: number;
  durationSec: number;
  summaryLabel: string;
  templateName: string;
  createdAt: number;
}

export function appendRenderListItem<T extends { id: string }>(list: T[], item: T): T[] {
  return [item, ...list.filter((existing) => existing.id !== item.id)];
}

export function removeRenderListItem<T extends { id: string }>(
  list: T[],
  targetId: string,
  currentActiveId: string | null
): { items: T[]; nextActiveId: string | null } {
  const items = list.filter((item) => item.id !== targetId);
  if (items.length === 0) {
    return { items, nextActiveId: null };
  }
  if (currentActiveId && currentActiveId !== targetId && items.some((i) => i.id === currentActiveId)) {
    return { items, nextActiveId: currentActiveId };
  }
  return { items, nextActiveId: items[0].id };
}


