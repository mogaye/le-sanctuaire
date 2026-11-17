import {
  ContinuousTimeline,
  StudioAyahItem,
  computeContinuousScrollY,
  findActiveTimelineEntry,
  formatTimeMMSS,
  wrapTextLines,
} from './mobileVideoStudioUtils';

export interface VideoCanvasRenderOptions {
  width: number;
  height: number;
  surahName: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  isLightSurface: boolean;
  bgImage: HTMLImageElement | null;
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
  const scaleFactor =
    opts.textScale === 'compact' ? 0.88 : opts.textScale === 'grand' ? 1.14 : 1.0;

  const contentWidth = opts.width - 96; // 48px horizontal padding at 720w
  const arFontPx = Math.round(44 * scaleFactor);
  const arLineHeightPx = Math.round(arFontPx * 1.78);
  const trFontPx = Math.round(23 * scaleFactor);
  const trLineHeightPx = Math.round(trFontPx * 1.52);
  const frFontPx = Math.round(24 * scaleFactor);
  const frLineHeightPx = Math.round(frFontPx * 1.5);

  const blocks: LaidOutVerseBlock[] = [];
  let cursorY = 196; // Top margin spacing before first verse in ribbon

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

    let blockHeight = 26; // Top/bottom padding inside block
    if (arLines.length > 0) blockHeight += arLines.length * arLineHeightPx + 18;
    if (trLines.length > 0) blockHeight += trLines.length * trLineHeightPx + 12;
    if (frLines.length > 0) blockHeight += frLines.length * frLineHeightPx + 10;

    const gapAfter = opts.flowMode === 'stream' ? 38 : 64;
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
    totalRibbonHeight: cursorY + 260,
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

export function renderVideoCanvasFrame(
  ctx: CanvasRenderingContext2D,
  layout: PrecomputedCanvasLayout,
  timeline: ContinuousTimeline,
  currentSec: number,
  opts: VideoCanvasRenderOptions
) {
  const { width, height, isLightSurface } = opts;

  // 1. Solid base
  ctx.fillStyle = isLightSurface ? '#FCFCFB' : '#000000';
  ctx.fillRect(0, 0, width, height);

  // 2. Background image (cover fit)
  if (opts.bgImage) {
    const imgRatio = opts.bgImage.width / Math.max(1, opts.bgImage.height);
    const canvasRatio = width / Math.max(1, height);
    let drawW = width;
    let drawH = height;
    let drawX = 0;
    let drawY = 0;
    if (imgRatio > canvasRatio) {
      drawH = height;
      drawW = height * imgRatio;
      drawX = (width - drawW) / 2;
    } else {
      drawW = width;
      drawH = width / Math.max(0.01, imgRatio);
      drawY = (height - drawH) / 2;
    }
    ctx.drawImage(opts.bgImage, drawX, drawY, drawW, drawH);

    // Subtle veil to preserve spotless contrast
    ctx.fillStyle = isLightSurface ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Continuous scroll position across the entire verse ribbon
  const { activeIndex, totalProgress } = findActiveTimelineEntry(timeline, currentSec);
  const scrollY = computeContinuousScrollY(layout.centersPx, timeline, currentSec, height);

  // Clip vertical reading safe area when header is visible
  const topSafeY = opts.showSurahHeader ? 142 : 56;
  const bottomSafeY = height - 92;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topSafeY, width, bottomSafeY - topSafeY);
  ctx.clip();

  // 4. Render all verses in continuous vertical flow
  for (let i = 0; i < layout.blocks.length; i++) {
    const block = layout.blocks[i];
    const screenY = block.yStart - scrollY;

    if (screenY + block.height < topSafeY - 60 || screenY > bottomSafeY + 60) {
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

    // Subtle active accent bar on the side (never a heavy card box)
    if (isActive) {
      ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.18)' : 'rgba(251, 191, 36, 0.25)';
      ctx.fillRect(30, screenY + 8, 4, Math.max(36, block.height - 24));
    }

    let yCursor = screenY + 28;
    const centerX = width / 2;

    // Arabic calligraphy lines
    for (const line of block.arLines) {
      drawRtlTajweedLine(ctx, line, centerX, yCursor, opts, block.arFontPx);
      yCursor += block.arLineHeightPx;
    }
    if (block.arLines.length > 0) {
      yCursor += 14;
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
      yCursor += 10;
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

  // 5. Optional top Surah watermark pill
  if (opts.showSurahHeader) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 20px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? 'rgba(23, 23, 23, 0.84)' : 'rgba(251, 191, 36, 0.94)';
    ctx.fillText(
      `Sourate ${opts.surahName} (${opts.surahNumber})  •  Versets ${opts.startAyah}–${opts.endAyah}`,
      width / 2,
      88
    );
    ctx.font = `500 15px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? 'rgba(82, 82, 82, 0.78)' : 'rgba(226, 232, 240, 0.72)';
    ctx.fillText(opts.reciterName, width / 2, 116);
    ctx.restore();
  }

  // 6. Subtle bottom continuous progress bar & timecode
  ctx.save();
  const barW = width - 96;
  const barX = 48;
  const barY = height - 48;
  ctx.fillStyle = isLightSurface ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(barX, barY, barW, 4);
  ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
  ctx.fillRect(barX, barY, barW * totalProgress, 4);

  ctx.font = `600 14px ui-monospace, SFMono-Regular, monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = isLightSurface ? 'rgba(23, 23, 23, 0.6)' : 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(
    `${formatTimeMMSS(currentSec)} / ${formatTimeMMSS(timeline.totalDurationSec)}`,
    width - 48,
    barY - 8
  );
  ctx.restore();
}
