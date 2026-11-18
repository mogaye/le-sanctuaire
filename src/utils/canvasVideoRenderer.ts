import {
  ContinuousTimeline,
  StudioAyahItem,
  VideoTemplateId,
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
  selectedSurahsCount?: number;
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
  flowMode: VideoTemplateId;
  reciterName: string;
}

interface LaidOutVerseBlock {
  ayahNum: number;
  isBismillah?: boolean;
  surahNumber?: number;
  surahName?: string;
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

function getEffectiveResScale(width: number, height: number): number {
  return Math.max(0.5, Math.min(width, height) / 720);
}

export function precomputeVideoCanvasLayout(
  ctx: CanvasRenderingContext2D,
  ayahs: StudioAyahItem[],
  opts: VideoCanvasRenderOptions
): PrecomputedCanvasLayout {
  const resScale = getEffectiveResScale(opts.width, opts.height);
  const isLandscape = opts.width > opts.height;
  const scaleFactor =
    (opts.textScale === 'compact' ? 0.88 : opts.textScale === 'grand' ? 1.14 : 1.0) * resScale;

  const horizontalPad = isLandscape
    ? Math.round(130 * resScale)
    : Math.round(48 * resScale);
  const contentWidth = Math.max(240, opts.width - horizontalPad * 2);
  const arFontPx = Math.round(44 * scaleFactor);
  const arLineHeightPx = Math.round(arFontPx * 1.72);
  const trFontPx = Math.round(23 * scaleFactor);
  const trLineHeightPx = Math.round(trFontPx * 1.5);
  const frFontPx = Math.round(24 * scaleFactor);
  const frLineHeightPx = Math.round(frFontPx * 1.48);

  const blocks: LaidOutVerseBlock[] = [];
  let cursorY = Math.round((isLandscape ? 140 : 196) * resScale);

  for (let i = 0; i < ayahs.length; i++) {
    const ayah = ayahs[i];
    const blockStart = cursorY;

    // Arabic lines
    ctx.font = `400 ${arFontPx}px 'Amiri', 'Traditional Arabic', serif`;
    const arTextWithBadge = ayah.isBismillah ? ayah.ar : `${ayah.ar}  ﴿${ayah.num}﴾`;
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
    const frLabelText = ayah.isBismillah ? ayah.fr : `${ayah.num}. ${ayah.fr}`;
    const frLines =
      opts.showFrench && ayah.fr
        ? wrapTextLines(frLabelText, contentWidth, (txt) => ctx.measureText(txt).width)
        : [];

    let blockHeight = Math.round(24 * resScale);
    if (arLines.length > 0) blockHeight += arLines.length * arLineHeightPx + Math.round(16 * resScale);
    if (trLines.length > 0) blockHeight += trLines.length * trLineHeightPx + Math.round(10 * resScale);
    if (frLines.length > 0) blockHeight += frLines.length * frLineHeightPx + Math.round(10 * resScale);

    const gapAfter = Math.round((opts.flowMode === 'stream' ? 38 : 60) * resScale);
    blocks.push({
      ayahNum: ayah.num,
      isBismillah: ayah.isBismillah,
      surahNumber: ayah.surahNumber,
      surahName: ayah.surahName,
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
  fontPx: number,
  textAlign: CanvasTextAlign = 'center'
) {
  ctx.font = `400 ${fontPx}px 'Amiri', 'Traditional Arabic', serif`;
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.textAlign = textAlign;
  ctx.fillStyle = opts.isLightSurface ? '#0A0A0A' : '#FFFFFF';
  ctx.fillText(lineText, centerX, y);
  ctx.direction = 'ltr';
}

/**
 * Draws the mandatory, non-removable "Le Sanctuaire" watermark at the bottom of the video.
 */
function drawMandatoryBottomWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  resScale: number,
  isLightSurface: boolean
) {
  ctx.save();
  const isLandscape = width > height;
  const centerX = width / 2;
  const dividerY = height - Math.round((isLandscape ? 82 : 146) * resScale);
  const dividerW = Math.round((isLandscape ? 140 : 168) * resScale);

  // Subtle ornamental rule right below the reading viewport
  ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.34)' : 'rgba(251, 191, 36, 0.42)';
  ctx.fillRect(centerX - dividerW / 2, dividerY, dividerW, Math.max(2, Math.round(2 * resScale)));

  // Soft legibility shadow over any custom background
  ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.84)';
  ctx.shadowBlur = Math.round(10 * resScale);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(1 * resScale);

  const brandFontPx = Math.round((isLandscape ? 18 : 22) * resScale);
  const subFontPx = Math.round((isLandscape ? 11.5 : 13.5) * resScale);
  const brandY = height - Math.round((isLandscape ? 54 : 112) * resScale);
  const subY = height - Math.round((isLandscape ? 30 : 82) * resScale);

  ctx.font = `800 ${brandFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const brandTextWidth = ctx.measureText(MANDATORY_WATERMARK_BRAND).width;
  const iconR = Math.round((isLandscape ? 7 : 8.5) * resScale);
  const gap = Math.round(8 * resScale);
  const totalUnitW = iconR * 2 + gap + brandTextWidth;
  const unitLeft = centerX - totalUnitW / 2;

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

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.96)';
  ctx.fillText(MANDATORY_WATERMARK_BRAND, unitLeft + iconR * 2 + gap, brandY);

  ctx.font = `600 ${subFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = isLightSurface ? 'rgba(51, 65, 85, 0.85)' : 'rgba(226, 232, 240, 0.82)';
  ctx.fillText(MANDATORY_WATERMARK_TAGLINE, centerX, subY);

  ctx.restore();
}

function computeSegmentFadeAlpha(segmentProgress: number): number {
  const fadeInEnd = 0.12;
  const fadeOutStart = 0.88;
  if (segmentProgress < fadeInEnd) {
    return Math.max(0.08, segmentProgress / fadeInEnd);
  }
  if (segmentProgress > fadeOutStart) {
    return Math.max(0.08, (1 - segmentProgress) / (1 - fadeOutStart));
  }
  return 1.0;
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cornerLen: number,
  color: string,
  lineWidth: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  // Top-left
  ctx.moveTo(x, y + cornerLen);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cornerLen, y);
  // Top-right
  ctx.moveTo(x + w - cornerLen, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + cornerLen);
  // Bottom-left
  ctx.moveTo(x, y + h - cornerLen);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + cornerLen, y + h);
  // Bottom-right
  ctx.moveTo(x + w - cornerLen, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - cornerLen);
  ctx.stroke();
  ctx.restore();
}

function renderSpotlightCardTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const availH = bottomSafeY - topSafeY;
  const cardW = isLandscape
    ? Math.min(width - Math.round(180 * resScale), Math.round(980 * resScale))
    : width - Math.round(64 * resScale);
  const innerPadX = Math.round((isLandscape ? 54 : 32) * resScale);
  const textMaxW = cardW - innerPadX * 2;

  const measureWrap = (fitScale: number) => {
    const arPx = Math.round(block.arFontPx * fitScale);
    const arLH = Math.round(arPx * 1.64);
    const trPx = Math.round(block.trFontPx * fitScale);
    const trLH = Math.round(trPx * 1.44);
    const frPx = Math.round(block.frFontPx * fitScale);
    const frLH = Math.round(frPx * 1.42);

    ctx.font = `400 ${arPx}px 'Amiri', 'Traditional Arabic', serif`;
    const arLines = opts.showArabic
      ? wrapTextLines(block.arLines.join(' '), textMaxW, (t) => ctx.measureText(t).width)
      : [];
    ctx.font = `italic 400 ${trPx}px Georgia, serif`;
    const trLines = opts.showPhonetics
      ? wrapTextLines(block.trLines.join(' '), textMaxW, (t) => ctx.measureText(t).width)
      : [];
    ctx.font = `500 ${frPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    const frLines = opts.showFrench
      ? wrapTextLines(block.frLines.join(' '), textMaxW, (t) => ctx.measureText(t).width)
      : [];

    const neededH =
      Math.round(100 * resScale) +
      arLines.length * arLH +
      (trLines.length > 0 ? trLines.length * trLH + Math.round(14 * resScale) : 0) +
      (frLines.length > 0 ? frLines.length * frLH + Math.round(12 * resScale) : 0) +
      Math.round(32 * resScale);

    return { arPx, arLH, trPx, trLH, frPx, frLH, arLines, trLines, frLines, neededH };
  };

  let fit = measureWrap(1.0);
  const maxCardH = availH - Math.round(16 * resScale);
  if (fit.neededH > maxCardH) {
    fit = measureWrap(0.84);
  }
  if (fit.neededH > maxCardH) {
    fit = measureWrap(0.70);
  }

  const cardX = (width - cardW) / 2;
  const cardH = Math.min(maxCardH, Math.max(Math.round(250 * resScale), fit.neededH));
  const cardY = topSafeY + (availH - cardH) / 2;

  const alpha = computeSegmentFadeAlpha(segmentProgress);
  ctx.save();
  ctx.globalAlpha = alpha;

  // Card backing
  ctx.fillStyle = isLightSurface ? 'rgba(255, 255, 255, 0.84)' : 'rgba(8, 14, 12, 0.78)';
  ctx.fillRect(cardX, cardY, cardW, cardH);

  // Subtle hairline frame
  ctx.strokeStyle = isLightSurface ? 'rgba(4, 120, 87, 0.25)' : 'rgba(251, 191, 36, 0.35)';
  ctx.lineWidth = Math.max(1, Math.round(1.5 * resScale));
  ctx.beginPath();
  ctx.rect(cardX, cardY, cardW, cardH);
  ctx.stroke();

  // Architectural gold corner brackets
  drawCornerBrackets(
    ctx,
    cardX + Math.round(10 * resScale),
    cardY + Math.round(10 * resScale),
    cardW - Math.round(20 * resScale),
    cardH - Math.round(20 * resScale),
    Math.round(22 * resScale),
    isLightSurface ? '#047857' : '#FBBF24',
    Math.max(2, Math.round(2.5 * resScale))
  );

  // Verse badge at top of card with generous clearance above Arabic diacritics
  ctx.font = `700 ${Math.round(13.5 * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? '#047857' : '#FCD34D';
  ctx.fillText(
    block.isBismillah ? 'BISMILLAH' : `VERSET ${block.ayahNum}`,
    width / 2,
    cardY + Math.round(30 * resScale)
  );

  let yCursor = cardY + Math.round(96 * resScale);
  const centerX = width / 2;

  for (const line of fit.arLines) {
    drawRtlTajweedLine(ctx, line, centerX, yCursor, opts, fit.arPx);
    yCursor += fit.arLH;
  }

  if (fit.arLines.length > 0 && (fit.trLines.length > 0 || fit.frLines.length > 0)) {
    const rw = Math.round(120 * resScale);
    ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.28)' : 'rgba(251, 191, 36, 0.35)';
    ctx.fillRect(centerX - rw / 2, yCursor - Math.round(6 * resScale), rw, Math.max(1.5, Math.round(1.5 * resScale)));
    yCursor += Math.round(14 * resScale);
  }

  if (fit.trLines.length > 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `italic 400 ${fit.trPx}px Georgia, serif`;
    ctx.fillStyle = isLightSurface ? '#065F46' : '#CBD5E1';
    for (const line of fit.trLines) {
      ctx.fillText(line, centerX, yCursor);
      yCursor += fit.trLH;
    }
    yCursor += Math.round(6 * resScale);
  }

  if (fit.frLines.length > 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `500 ${fit.frPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? '#171717' : '#F8FAFC';
    for (const line of fit.frLines) {
      ctx.fillText(line, centerX, yCursor);
      yCursor += fit.frLH;
    }
  }

  ctx.restore();
}

function renderCinemaSubtitlesTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const centerX = width / 2;
  const alpha = computeSegmentFadeAlpha(segmentProgress);

  ctx.save();
  ctx.globalAlpha = alpha;

  // 1. Arabic calligraphy floats majestically in upper-center cinema field
  const arFontPx = Math.round(block.arFontPx * (isLandscape ? 1.18 : 1.06));
  const arLineH = Math.round(arFontPx * 1.68);
  const arMaxW = width - Math.round((isLandscape ? 200 : 72) * resScale);
  ctx.font = `400 ${arFontPx}px 'Amiri', 'Traditional Arabic', serif`;
  const arLines = opts.showArabic
    ? wrapTextLines(block.arLines.join(' '), arMaxW, (t) => ctx.measureText(t).width)
    : [];

  // Subtitle lower-third band dimensions
  const subMaxW = isLandscape ? Math.min(width - Math.round(160 * resScale), Math.round(1080 * resScale)) : width - Math.round(56 * resScale);
  ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
  const trLines = opts.showPhonetics
    ? wrapTextLines(block.trLines.join(' '), subMaxW - Math.round(48 * resScale), (t) => ctx.measureText(t).width)
    : [];
  ctx.font = `500 ${block.frFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const frLines = opts.showFrench
    ? wrapTextLines(block.frLines.join(' '), subMaxW - Math.round(48 * resScale), (t) => ctx.measureText(t).width)
    : [];

  const hasSubtitles = trLines.length > 0 || frLines.length > 0;
  const subBoxH = hasSubtitles
    ? Math.round(34 * resScale) +
      trLines.length * block.trLineHeightPx +
      frLines.length * block.frLineHeightPx
    : 0;
  const subBoxY = bottomSafeY - subBoxH - Math.round(14 * resScale);

  const upperFieldTop = topSafeY + Math.round(16 * resScale);
  const upperFieldBot = hasSubtitles ? subBoxY - Math.round(18 * resScale) : bottomSafeY;
  const arTotalH = arLines.length * arLineH;
  let arY = upperFieldTop + Math.max(0, (upperFieldBot - upperFieldTop - arTotalH) / 2) + arLineH * 0.4;

  ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)';
  ctx.shadowBlur = Math.round(12 * resScale);
  for (const line of arLines) {
    drawRtlTajweedLine(ctx, line, centerX, arY, opts, arFontPx);
    arY += arLineH;
  }

  // 2. Sleek Cinema Subtitle Bar in the lower third
  if (hasSubtitles) {
    const subBoxX = (width - subMaxW) / 2;
    ctx.shadowBlur = 0;
    ctx.fillStyle = isLightSurface ? 'rgba(255, 255, 255, 0.86)' : 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(subBoxX, subBoxY, subMaxW, subBoxH);

    // Top gold cinema accent rule
    ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
    ctx.fillRect(subBoxX, subBoxY, subMaxW, Math.max(2, Math.round(2.5 * resScale)));

    let subY = subBoxY + Math.round(24 * resScale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (trLines.length > 0) {
      ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
      ctx.fillStyle = isLightSurface ? '#065F46' : '#E2E8F0';
      for (const line of trLines) {
        ctx.fillText(line, centerX, subY);
        subY += block.trLineHeightPx;
      }
    }

    if (frLines.length > 0) {
      ctx.font = `600 ${block.frFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.fillStyle = isLightSurface ? '#0F172A' : '#FFFFFF';
      for (const line of frLines) {
        ctx.fillText(line, centerX, subY);
        subY += block.frLineHeightPx;
      }
    }
  }

  ctx.restore();
}

function renderMushafSplitTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, height, isLightSurface } = opts;
  const isLandscape = width > height;
  const availH = bottomSafeY - topSafeY;
  const alpha = computeSegmentFadeAlpha(segmentProgress);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (isLandscape || width === height) {
    // 2-Column Editorial Split: Left = Translation + Phonetics, Right = Arabic Calligraphy
    const padX = Math.round(76 * resScale);
    const colGap = Math.round(48 * resScale);
    const colW = (width - padX * 2 - colGap) / 2;
    const leftCenterX = padX + colW / 2;
    const rightCenterX = padX + colW + colGap + colW / 2;
    const dividerX = width / 2;

    // Central golden editorial divider
    ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.25)' : 'rgba(251, 191, 36, 0.36)';
    ctx.fillRect(
      dividerX - Math.round(1 * resScale),
      topSafeY + Math.round(36 * resScale),
      Math.max(2, Math.round(2 * resScale)),
      availH - Math.round(72 * resScale)
    );

    // Subtle tinted card behind translation side
    ctx.fillStyle = isLightSurface ? 'rgba(255, 255, 255, 0.68)' : 'rgba(10, 18, 15, 0.62)';
    ctx.fillRect(
      padX - Math.round(16 * resScale),
      topSafeY + Math.round(24 * resScale),
      colW + Math.round(24 * resScale),
      availH - Math.round(48 * resScale)
    );

    // Right column: Arabic Calligraphy
    const arFontPx = Math.round(block.arFontPx * 1.04);
    const arLineH = Math.round(arFontPx * 1.72);
    ctx.font = `400 ${arFontPx}px 'Amiri', 'Traditional Arabic', serif`;
    const arLines = opts.showArabic
      ? wrapTextLines(block.arLines.join(' '), colW - Math.round(24 * resScale), (t) => ctx.measureText(t).width)
      : [];
    const arTotalH = arLines.length * arLineH;
    let arY = topSafeY + (availH - arTotalH) / 2 + arLineH * 0.4;
    for (const line of arLines) {
      drawRtlTajweedLine(ctx, line, rightCenterX, arY, opts, arFontPx);
      arY += arLineH;
    }

    // Left column: Verse number badge + Phonetics + French
    ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
    const trLines = opts.showPhonetics
      ? wrapTextLines(block.trLines.join(' '), colW - Math.round(24 * resScale), (t) => ctx.measureText(t).width)
      : [];
    ctx.font = `500 ${block.frFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    const frLines = opts.showFrench
      ? wrapTextLines(block.frLines.join(' '), colW - Math.round(24 * resScale), (t) => ctx.measureText(t).width)
      : [];

    const leftTotalH =
      Math.round(38 * resScale) +
      trLines.length * block.trLineHeightPx +
      (trLines.length > 0 && frLines.length > 0 ? Math.round(18 * resScale) : 0) +
      frLines.length * block.frLineHeightPx;
    let leftY = topSafeY + (availH - leftTotalH) / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(14 * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
    ctx.fillText(
      block.isBismillah ? 'BISMILLAH' : `AYAH ${block.ayahNum}`,
      leftCenterX,
      leftY
    );
    leftY += Math.round(36 * resScale);

    if (trLines.length > 0) {
      ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
      ctx.fillStyle = isLightSurface ? '#065F46' : '#CBD5E1';
      for (const line of trLines) {
        ctx.fillText(line, leftCenterX, leftY);
        leftY += block.trLineHeightPx;
      }
      leftY += Math.round(16 * resScale);
    }

    if (frLines.length > 0) {
      ctx.font = `500 ${block.frFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.fillStyle = isLightSurface ? '#0F172A' : '#F8FAFC';
      for (const line of frLines) {
        ctx.fillText(line, leftCenterX, leftY);
        leftY += block.frLineHeightPx;
      }
    }
  } else {
    // Portrait 9:16 Top/Bottom Editorial Split
    const centerX = width / 2;
    const midY = topSafeY + availH * 0.46;
    const boxW = width - Math.round(72 * resScale);
    const boxX = (width - boxW) / 2;

    // Horizontal gold rule
    ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.28)' : 'rgba(251, 191, 36, 0.42)';
    ctx.fillRect(boxX + Math.round(48 * resScale), midY, boxW - Math.round(96 * resScale), Math.max(2, Math.round(2 * resScale)));

    // Upper Arabic panel
    const arTotalH = block.arLines.length * block.arLineHeightPx;
    let arY = topSafeY + (midY - topSafeY - arTotalH) / 2 + block.arLineHeightPx * 0.45;
    for (const line of block.arLines) {
      drawRtlTajweedLine(ctx, line, centerX, arY, opts, block.arFontPx);
      arY += block.arLineHeightPx;
    }

    // Lower French / Phonetics panel
    const lowerAvail = bottomSafeY - midY;
    const lowerTotalH =
      block.trLines.length * block.trLineHeightPx +
      block.frLines.length * block.frLineHeightPx +
      Math.round(24 * resScale);
    let lowY = midY + Math.max(Math.round(32 * resScale), (lowerAvail - lowerTotalH) / 2);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (block.trLines.length > 0) {
      ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
      ctx.fillStyle = isLightSurface ? '#065F46' : '#CBD5E1';
      for (const line of block.trLines) {
        ctx.fillText(line, centerX, lowY);
        lowY += block.trLineHeightPx;
      }
      lowY += Math.round(12 * resScale);
    }
    if (block.frLines.length > 0) {
      ctx.font = `500 ${block.frFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.fillStyle = isLightSurface ? '#0F172A' : '#F8FAFC';
      for (const line of block.frLines) {
        ctx.fillText(line, centerX, lowY);
        lowY += block.frLineHeightPx;
      }
    }
  }

  ctx.restore();
}

function renderMeditationMinimalTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  currentSec: number,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const centerX = width / 2;
  const availH = bottomSafeY - topSafeY;
  const alpha = computeSegmentFadeAlpha(segmentProgress);

  ctx.save();
  ctx.globalAlpha = alpha;

  const contentTotalH =
    Math.round(52 * resScale) +
    block.arLines.length * block.arLineHeightPx +
    block.trLines.length * block.trLineHeightPx +
    block.frLines.length * block.frLineHeightPx +
    Math.round(54 * resScale);

  let yCursor = topSafeY + Math.max(Math.round(18 * resScale), (availH - contentTotalH) / 2);

  // Delicate 8-pointed Rub el Hizb geometric emblem above verse
  const starR = Math.round(12 * resScale);
  const starCy = yCursor;
  ctx.strokeStyle = isLightSurface ? 'rgba(4, 120, 87, 0.6)' : 'rgba(251, 191, 36, 0.72)';
  ctx.lineWidth = Math.max(1.5, Math.round(1.6 * resScale));
  // Square 1 (axis-aligned)
  ctx.beginPath();
  ctx.rect(centerX - starR * 0.72, starCy - starR * 0.72, starR * 1.44, starR * 1.44);
  ctx.stroke();
  // Square 2 (diamond)
  ctx.beginPath();
  ctx.moveTo(centerX, starCy - starR);
  ctx.lineTo(centerX + starR, starCy);
  ctx.lineTo(centerX, starCy + starR);
  ctx.lineTo(centerX - starR, starCy);
  ctx.closePath();
  ctx.stroke();

  yCursor += Math.round(44 * resScale);

  for (const line of block.arLines) {
    drawRtlTajweedLine(ctx, line, centerX, yCursor, opts, block.arFontPx);
    yCursor += block.arLineHeightPx;
  }

  yCursor += Math.round(12 * resScale);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (block.trLines.length > 0) {
    ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
    ctx.fillStyle = isLightSurface ? '#065F46' : '#CBD5E1';
    for (const line of block.trLines) {
      ctx.fillText(line, centerX, yCursor);
      yCursor += block.trLineHeightPx;
    }
    yCursor += Math.round(8 * resScale);
  }

  if (block.frLines.length > 0) {
    ctx.font = `500 ${block.frFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? '#171717' : '#F1F5F9';
    for (const line of block.frLines) {
      ctx.fillText(line, centerX, yCursor);
      yCursor += block.frLineHeightPx;
    }
  }

  // Symmetrical subtle breathing audio-wave bars synced to playback clock
  const waveY = Math.min(bottomSafeY - Math.round(26 * resScale), yCursor + Math.round(28 * resScale));
  const barCount = 15;
  const barW = Math.max(2, Math.round(3 * resScale));
  const barGap = Math.round(7 * resScale);
  const totalWaveW = barCount * barW + (barCount - 1) * barGap;
  const waveLeft = centerX - totalWaveW / 2;

  ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.5)' : 'rgba(251, 191, 36, 0.58)';
  for (let b = 0; b < barCount; b++) {
    const distFromCenter = Math.abs(b - Math.floor(barCount / 2));
    const envelope = 1 - distFromCenter / (barCount * 0.6);
    const pulse = 0.45 + 0.55 * Math.abs(Math.sin(currentSec * 3.4 + b * 0.55));
    const barH = Math.round((6 + 18 * envelope * pulse) * resScale);
    ctx.fillRect(waveLeft + b * (barW + barGap), waveY - barH / 2, barW, barH);
  }

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
  const resScale = getEffectiveResScale(width, height);
  const isLandscape = width > height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Solid base
  ctx.fillStyle = opts.bgSurfaceColor || (isLightSurface ? '#FCFCFB' : '#000000');
  ctx.fillRect(0, 0, width, height);

  // 2. Background Video OR Image (cover fit + gentle Ken Burns motion on still images)
  const videoEl = opts.bgVideo;
  if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
    const rect = computeCoverDrawRect(videoEl.videoWidth, videoEl.videoHeight, width, height);
    ctx.drawImage(videoEl, rect.x, rect.y, rect.w, rect.h);
  } else if (opts.bgImage) {
    const rect = computeCoverDrawRect(opts.bgImage.width, opts.bgImage.height, width, height);
    const kbZoom = 1 + Math.min(0.055, Math.max(0, currentSec) * 0.0024);
    const zoomedW = rect.w * kbZoom;
    const zoomedH = rect.h * kbZoom;
    const zoomedX = rect.x - (zoomedW - rect.w) / 2;
    const zoomedY = rect.y - (zoomedH - rect.h) / 2;
    ctx.drawImage(opts.bgImage, zoomedX, zoomedY, zoomedW, zoomedH);
  }

  // Subtle veil to preserve spotless text contrast over photos or videos
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

  const { activeIndex, segmentProgress } = findActiveTimelineEntry(timeline, currentSec);
  const topSafeY = Math.round(
    (opts.showSurahHeader ? (isLandscape ? 114 : 146) : isLandscape ? 32 : 56) * resScale
  );
  const bottomSafeY = height - Math.round((isLandscape ? 122 : 172) * resScale);
  const hasMediaBg = Boolean(videoEl || opts.bgImage);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topSafeY, width, Math.max(100, bottomSafeY - topSafeY));
  ctx.clip();

  const activeBlock = layout.blocks[activeIndex] || layout.blocks[0];

  if (activeBlock && opts.flowMode === 'spotlight_card') {
    renderSpotlightCardTemplate(ctx, activeBlock, segmentProgress, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'cinema_subtitles') {
    renderCinemaSubtitlesTemplate(ctx, activeBlock, segmentProgress, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'mushaf_split') {
    renderMushafSplitTemplate(ctx, activeBlock, segmentProgress, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'meditation_minimal') {
    renderMeditationMinimalTemplate(
      ctx,
      activeBlock,
      segmentProgress,
      currentSec,
      opts,
      resScale,
      topSafeY,
      bottomSafeY
    );
  } else {
    // 'teleprompter' or 'stream' continuous scroll across the entire verse ribbon
    const scrollY = computeContinuousScrollY(layout.centersPx, timeline, currentSec, height);

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

      if (isActive && typeof ctx.createRadialGradient === 'function') {
        const auraCx = width / 2;
        const auraCy = screenY + block.height / 2;
        const auraR = Math.max(width * 0.48, block.height * 0.65);
        const auraGrad = ctx.createRadialGradient(auraCx, auraCy, 10 * resScale, auraCx, auraCy, auraR);
        if (isLightSurface) {
          auraGrad.addColorStop(0, 'rgba(4, 120, 87, 0.06)');
          auraGrad.addColorStop(1, 'rgba(4, 120, 87, 0)');
        } else {
          auraGrad.addColorStop(0, 'rgba(251, 191, 36, 0.08)');
          auraGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        }
        ctx.fillStyle = auraGrad;
        ctx.fillRect(0, screenY - 24 * resScale, width, block.height + 48 * resScale);
      }

      if (hasMediaBg) {
        ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.72)';
        ctx.shadowBlur = Math.round(6 * resScale);
        ctx.shadowOffsetY = Math.round(1 * resScale);
      }

      if (isActive) {
        const barX = isLandscape ? Math.round(76 * resScale) : Math.round(28 * resScale);
        ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.34)' : 'rgba(251, 191, 36, 0.5)';
        ctx.fillRect(
          barX,
          screenY + Math.round(8 * resScale),
          Math.max(3, Math.round(4 * resScale)),
          Math.max(Math.round(36 * resScale), block.height - Math.round(24 * resScale))
        );
      }

      let yCursor = screenY + Math.round(28 * resScale);
      const centerX = width / 2;

      for (const line of block.arLines) {
        drawRtlTajweedLine(ctx, line, centerX, yCursor, opts, block.arFontPx);
        yCursor += block.arLineHeightPx;
      }

      if (block.arLines.length > 0 && (block.trLines.length > 0 || block.frLines.length > 0)) {
        const ruleW = Math.round(120 * resScale);
        const ruleY = yCursor - Math.round(block.arLineHeightPx * 0.25);
        ctx.fillStyle = isLightSurface
          ? 'rgba(4, 120, 87, 0.22)'
          : 'rgba(251, 191, 36, 0.28)';
        ctx.fillRect(centerX - ruleW / 2, ruleY, ruleW, Math.max(1.5, Math.round(1.5 * resScale)));
        yCursor += Math.round(14 * resScale);
      } else if (block.arLines.length > 0) {
        yCursor += Math.round(14 * resScale);
      }

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

    if (!hasMediaBg && typeof ctx.createLinearGradient === 'function') {
      const baseColor = opts.bgSurfaceColor || (isLightSurface ? '#FCFCFB' : '#000000');
      if (baseColor === '#000000' || baseColor === '#FCFCFB' || baseColor.startsWith('#')) {
        const fadeH = Math.round(44 * resScale);
        const rgb = isLightSurface ? '252, 252, 251' : baseColor === '#050505' ? '5, 5, 5' : '0, 0, 0';
        if (baseColor === '#000000' || baseColor === '#050505' || baseColor === '#FCFCFB') {
          const topGrad = ctx.createLinearGradient(0, topSafeY, 0, topSafeY + fadeH);
          topGrad.addColorStop(0, `rgba(${rgb}, 0.96)`);
          topGrad.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, topSafeY, width, fadeH);

          const botGrad = ctx.createLinearGradient(0, bottomSafeY - fadeH, 0, bottomSafeY);
          botGrad.addColorStop(0, `rgba(${rgb}, 0)`);
          botGrad.addColorStop(1, `rgba(${rgb}, 0.96)`);
          ctx.fillStyle = botGrad;
          ctx.fillRect(0, bottomSafeY - fadeH, width, fadeH);
        }
      }
    }
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
    const headerTitleY = Math.round((isLandscape ? 46 : 88) * resScale);
    const headerSubY = Math.round((isLandscape ? 72 : 116) * resScale);

    const activeSurahName = activeBlock?.surahName || opts.surahName;
    const activeSurahNum = activeBlock?.surahNumber || opts.surahNumber;
    const isMultiSurah = (opts.selectedSurahsCount || 1) > 1;
    const headerText = isMultiSurah
      ? `Sourate ${activeSurahName} (${activeSurahNum})  •  ${
          activeBlock?.isBismillah ? 'Bismillah' : `Verset ${activeBlock?.ayahNum ?? opts.startAyah}`
        }`
      : `Sourate ${activeSurahName} (${activeSurahNum})  •  Versets ${opts.startAyah}–${opts.endAyah}`;

    ctx.font = `700 ${Math.round((isLandscape ? 19 : 20) * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? 'rgba(23, 23, 23, 0.88)' : 'rgba(251, 191, 36, 0.96)';
    ctx.fillText(headerText, width / 2, headerTitleY);
    ctx.font = `500 ${Math.round((isLandscape ? 14 : 15) * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? 'rgba(82, 82, 82, 0.82)' : 'rgba(226, 232, 240, 0.78)';
    ctx.fillText(opts.reciterName, width / 2, headerSubY);
    ctx.restore();
  }

  // 6. Mandatory non-removable bottom watermark (no progress bar or timer!)
  drawMandatoryBottomWatermark(ctx, width, height, resScale, isLightSurface);
}
