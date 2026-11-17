import {
  ContinuousTimeline,
  StudioAyahItem,
  computeContinuousScrollY,
  computeCoverDrawRect,
  findActiveTimelineEntry,
  wrapTextLines,
} from './mobileVideoStudioUtils';

export const MANDATORY_WATERMARK_BRAND = 'Le Sanctuaire';
export const MANDATORY_WATERMARK_TAGLINE = 'La Voie de la Sérénité';

export interface VideoCanvasRenderOptions {
  width: number;
  height: number;
  surahName: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  isLightSurface: boolean;
  bgSurfaceColor?: string;
  bgVeilOpacity?: number;
  bgImage: HTMLImageElement | null;
  bgVideo?: HTMLVideoElement | null;
  showArabic: boolean;
  useTajweed: boolean;
  showPhonetics: boolean;
  showFrench: boolean;
  showSurahHeader: boolean;
  textScale: 'compact' | 'standard' | 'grand';
  flowMode: 'teleprompter' | 'stream';
  reciterName: string;
}

interface LaidOutVerseBlock {
  ayahNum: number;
  yStart: number;
  centerY: number;
  height: number;
  arLines: string[];
  trLines: string[];
  frLines: string[];
  arFontPx: number;
  arLineHeightPx: number;
  trFontPx: number;
  trLineHeightPx: number;
  frFontPx: number;
  frLineHeightPx: number;
}

export interface PrecomputedCanvasLayout {
  blocks: LaidOutVerseBlock[];
  totalRibbonHeight: number;
  centersPx: number[];
}

export function loadCanvasBackgroundImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function precomputeVideoCanvasLayout(
  ctx: CanvasRenderingContext2D,
  ayahs: StudioAyahItem[],
  opts: VideoCanvasRenderOptions
): PrecomputedCanvasLayout {
  const resScale = Math.max(0.5, opts.width / 720);
  const scaleFactor =
    (opts.textScale === 'compact' ? 0.88 : opts.textScale === 'grand' ? 1.14 : 1.0) * resScale;

  const horizontalPad = Math.round(48 * resScale);
  const contentWidth = opts.width - horizontalPad * 2;
  const arFontPx = Math.round(44 * scaleFactor);
  const arLineHeightPx = Math.round(arFontPx * 1.78);
  const trFontPx = Math.round(23 * scaleFactor);
  const trLineHeightPx = Math.round(trFontPx * 1.52);
  const frFontPx = Math.round(24 * scaleFactor);
  const frLineHeightPx = Math.round(frFontPx * 1.5);

  const blocks: LaidOutVerseBlock[] = [];
  let cursorY = Math.round(196 * resScale);

  for (let i = 0; i < ayahs.length; i++) {
    const ayah = ayahs[i];
    const blockStart = cursorY;

    // Arabic lines
    ctx.font = `400 ${arFontPx}px 'Amiri', 'Traditional Arabic', serif`;
    const arTextWithBadge = `${ayah.ar}  ﴿${ayah.num}﴾`;
    const arLines = opts.showArabic
      ? wrapTextLines(arTextWithBadge, contentWidth, (txt) => ctx.measureText(txt).width)
      : [];

    // Phonetic lines
    ctx.font = `italic 400 ${trFontPx}px Georgia, serif`;
    const trLines =
      opts.showPhonetics && ayah.tr
        ? wrapTextLines(`« ${ayah.tr} »`, contentWidth, (txt) => ctx.measureText(txt).width)
        : [];

    // French lines
    ctx.font = `500 ${frFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    const frLines =
      opts.showFrench && ayah.fr
        ? wrapTextLines(`${ayah.num}. ${ayah.fr}`, contentWidth, (txt) => ctx.measureText(txt).width)
        : [];

    let blockHeight = Math.round(26 * resScale);
    if (arLines.length > 0) blockHeight += arLines.length * arLineHeightPx + Math.round(18 * resScale);
    if (trLines.length > 0) blockHeight += trLines.length * trLineHeightPx + Math.round(12 * resScale);
    if (frLines.length > 0) blockHeight += frLines.length * frLineHeightPx + Math.round(10 * resScale);

    const gapAfter = Math.round((opts.flowMode === 'stream' ? 38 : 64) * resScale);
    blocks.push({
      ayahNum: ayah.num,
      yStart: blockStart,
      centerY: blockStart + blockHeight / 2,
      height: blockHeight,
      arLines,
      trLines,
      frLines,
      arFontPx,
      arLineHeightPx,
      trFontPx,
      trLineHeightPx,
      frFontPx,
      frLineHeightPx,
    });

    cursorY += blockHeight + gapAfter;
  }

  return {
    blocks,
    totalRibbonHeight: cursorY + Math.round(260 * resScale),
    centersPx: blocks.map((b) => b.centerY),
  };
}

function drawRtlTajweedLine(
  ctx: CanvasRenderingContext2D,
  lineText: string,
  centerX: number,
  y: number,
  opts: VideoCanvasRenderOptions,
  fontPx: number
) {
  ctx.font = `400 ${fontPx}px 'Amiri', 'Traditional Arabic', serif`;
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = opts.isLightSurface ? '#0A0A0A' : '#FFFFFF';
  ctx.fillText(lineText, centerX, y);
  ctx.direction = 'ltr';
}

/**
 * Draws the mandatory, non-removable "Le Sanctuaire" watermark at the bottom of the video,
 * positioned directly beneath the reading viewport so it accompanies the bottom verse/surah.
 */
function drawMandatoryBottomWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  resScale: number,
  isLightSurface: boolean
) {
  ctx.save();
  const centerX = width / 2;
  const dividerY = height - Math.round(146 * resScale);
  const dividerW = Math.round(168 * resScale);

  // Subtle ornamental rule right below the reading viewport
  ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.34)' : 'rgba(251, 191, 36, 0.42)';
  ctx.fillRect(centerX - dividerW / 2, dividerY, dividerW, Math.max(2, Math.round(2 * resScale)));

  // Soft legibility shadow over any custom background
  ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.84)';
  ctx.shadowBlur = Math.round(10 * resScale);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(1 * resScale);

  const brandFontPx = Math.round(22 * resScale);
  const subFontPx = Math.round(13.5 * resScale);
  const brandY = height - Math.round(112 * resScale);
  const subY = height - Math.round(82 * resScale);

  // Measure brand text to center crescent emblem + brand cleanly as a single unit
  ctx.font = `800 ${brandFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const brandTextWidth = ctx.measureText(MANDATORY_WATERMARK_BRAND).width;
  const iconR = Math.round(8.5 * resScale);
  const gap = Math.round(9 * resScale);
  const totalUnitW = iconR * 2 + gap + brandTextWidth;
  const unitLeft = centerX - totalUnitW / 2;

  // Vector crescent emblem (guaranteed to render identically on every OS/font)
  const crescentCx = unitLeft + iconR;
  const crescentCy = brandY;
  ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
  ctx.beginPath();
  ctx.arc(crescentCx, crescentCy, iconR, 0.35 * Math.PI, 1.65 * Math.PI, false);
  ctx.arc(
    crescentCx + iconR * 0.42,
    crescentCy - iconR * 0.12,
    iconR * 0.78,
    1.55 * Math.PI,
    0.45 * Math.PI,
    true
  );
  ctx.closePath();
  ctx.fill();

  // Brand name
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)';
  ctx.fillText(MANDATORY_WATERMARK_BRAND, unitLeft + iconR * 2 + gap, brandY);

  // Tagline directly below
  ctx.font = `600 ${subFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = isLightSurface ? 'rgba(51, 65, 85, 0.85)' : 'rgba(226, 232, 240, 0.82)';
  ctx.fillText(MANDATORY_WATERMARK_TAGLINE, centerX, subY);

  ctx.restore();
}

export function renderVideoCanvasFrame(
  ctx: CanvasRenderingContext2D,
  layout: PrecomputedCanvasLayout,
  timeline: ContinuousTimeline,
  currentSec: number,
  opts: VideoCanvasRenderOptions
) {
  const { width, height, isLightSurface } = opts;
  const resScale = Math.max(0.5, width / 720);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Solid base
  ctx.fillStyle = opts.bgSurfaceColor || (isLightSurface ? '#FCFCFB' : '#000000');
  ctx.fillRect(0, 0, width, height);

  // 2. Background Video OR Image (cover fit inside 9:16 frame)
  const videoEl = opts.bgVideo;
  if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
    const rect = computeCoverDrawRect(videoEl.videoWidth, videoEl.videoHeight, width, height);
    ctx.drawImage(videoEl, rect.x, rect.y, rect.w, rect.h);
  } else if (opts.bgImage) {
    const rect = computeCoverDrawRect(opts.bgImage.width, opts.bgImage.height, width, height);
    ctx.drawImage(opts.bgImage, rect.x, rect.y, rect.w, rect.h);
  }

  // Subtle veil to preserve spotless text contrast over user photos or videos
  if (videoEl || opts.bgImage) {
    const veilAlpha =
      typeof opts.bgVeilOpacity === 'number'
        ? Math.max(0, Math.min(0.85, opts.bgVeilOpacity))
        : isLightSurface
        ? 0.14
        : 0.28;
    if (veilAlpha > 0.005) {
      ctx.fillStyle = isLightSurface
        ? `rgba(255, 255, 255, ${veilAlpha})`
        : `rgba(0, 0, 0, ${veilAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // 3. Continuous scroll position across the entire verse ribbon
  const { activeIndex } = findActiveTimelineEntry(timeline, currentSec);
  const scrollY = computeContinuousScrollY(layout.centersPx, timeline, currentSec, height);

  // Clip vertical reading safe area above the mandatory bottom watermark
  const topSafeY = Math.round((opts.showSurahHeader ? 142 : 56) * resScale);
  const bottomSafeY = height - Math.round(168 * resScale);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topSafeY, width, bottomSafeY - topSafeY);
  ctx.clip();

  const hasMediaBg = Boolean(videoEl || opts.bgImage);

  // 4. Render all verses in continuous vertical flow
  for (let i = 0; i < layout.blocks.length; i++) {
    const block = layout.blocks[i];
    const screenY = block.yStart - scrollY;

    if (screenY + block.height < topSafeY - 60 * resScale || screenY > bottomSafeY + 60 * resScale) {
      continue;
    }

    const isActive = i === activeIndex;
    const distance = Math.abs(i - activeIndex);

    let alpha = 1.0;
    if (opts.flowMode === 'teleprompter') {
      alpha = isActive ? 1.0 : distance === 1 ? 0.42 : 0.22;
    } else {
      alpha = isActive ? 1.0 : 0.62;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    if (hasMediaBg) {
      ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.72)';
      ctx.shadowBlur = Math.round(6 * resScale);
      ctx.shadowOffsetY = Math.round(1 * resScale);
    }

    // Subtle active accent bar on the side
    if (isActive) {
      ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.28)' : 'rgba(251, 191, 36, 0.42)';
      ctx.fillRect(
        Math.round(28 * resScale),
        screenY + Math.round(8 * resScale),
        Math.max(3, Math.round(4 * resScale)),
        Math.max(Math.round(36 * resScale), block.height - Math.round(24 * resScale))
      );
    }

    let yCursor = screenY + Math.round(28 * resScale);
    const centerX = width / 2;

    // Arabic calligraphy lines
    for (const line of block.arLines) {
      drawRtlTajweedLine(ctx, line, centerX, yCursor, opts, block.arFontPx);
      yCursor += block.arLineHeightPx;
    }
    if (block.arLines.length > 0) {
      yCursor += Math.round(14 * resScale);
    }

    // Phonetic transcription lines
    if (block.trLines.length > 0) {
      ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLightSurface ? '#065F46' : '#CBD5E1';
      for (const line of block.trLines) {
        ctx.fillText(line, centerX, yCursor);
        yCursor += block.trLineHeightPx;
      }
      yCursor += Math.round(10 * resScale);
    }

    // French translation lines
    if (block.frLines.length > 0) {
      ctx.font = `500 ${block.frFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLightSurface ? '#171717' : '#F1F5F9';
      for (const line of block.frLines) {
        ctx.fillText(line, centerX, yCursor);
        yCursor += block.frLineHeightPx;
      }
    }

    ctx.restore();
  }

  ctx.restore();

  // 5. Optional top Surah header
  if (opts.showSurahHeader) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (hasMediaBg) {
      ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = Math.round(6 * resScale);
    }
    ctx.font = `700 ${Math.round(20 * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? 'rgba(23, 23, 23, 0.88)' : 'rgba(251, 191, 36, 0.96)';
    ctx.fillText(
      `Sourate ${opts.surahName} (${opts.surahNumber})  •  Versets ${opts.startAyah}–${opts.endAyah}`,
      width / 2,
      Math.round(88 * resScale)
    );
    ctx.font = `500 ${Math.round(15 * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? 'rgba(82, 82, 82, 0.82)' : 'rgba(226, 232, 240, 0.78)';
    ctx.fillText(opts.reciterName, width / 2, Math.round(116 * resScale));
    ctx.restore();
  }

  // 6. Mandatory non-removable bottom watermark (no progress bar or timer!)
  drawMandatoryBottomWatermark(ctx, width, height, resScale, isLightSurface);
}
