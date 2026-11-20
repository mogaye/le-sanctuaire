import {
  ContinuousTimeline,
  StudioAyahItem,
  VideoTemplateId,
  computeCoverDrawRect,
  computeFluidScrollYForBlocks,
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
  bgBlackBackdrop?: boolean;
  bgBrightness?: number;
  bgSharpness?: number;
  bgContrast?: number;
  bgImageMotion?: boolean;
  bgMotionTimeSec?: number;
  textShadowBoost?: boolean;
  arabicTextColor?: string | null;
  phoneticsTextColor?: string | null;
  frenchTextColor?: string | null;
  bgImage: HTMLImageElement | null;
  bgVideo?: HTMLVideoElement | null;
  logoImage?: HTMLImageElement | null;
  showArabic: boolean;
  useTajweed: boolean;
  showPhonetics: boolean;
  showFrench: boolean;
  showSurahHeader: boolean;
  textScale: 'compact' | 'standard' | 'grand';
  flowMode: VideoTemplateId;
  reciterName: string;
  showWatermark?: boolean;
}

export function computeGentleBackgroundMotionScale(
  timeSec: number,
  enabled: boolean = false
): number {
  if (!enabled || !Number.isFinite(timeSec) || timeSec <= 0) {
    return 1;
  }
  // 14s meditative cycle (7s slow zoom-in, 7s slow zoom-out) with zero-jerk cosine easing
  // so edges noticeably breathe without abrupt starts, stops, or reading distraction.
  const cycleDurationSec = 14;
  const maxExtraZoom = 0.13;
  const t = Math.max(0, timeSec);
  const phase = (2 * Math.PI * t) / cycleDurationSec;
  return Number((1 + maxExtraZoom * 0.5 * (1 - Math.cos(phase))).toFixed(6));
}

export function buildCanvasBackgroundFilter(
  brightness: number = 50,
  contrast: number = 50,
  sharpness: number = 50,
  blurScale: number = 1
): {
  cssFilter: string;
  sharpenAmount: number;
  blurPx: number;
} {
  const b = Math.max(0, Math.min(100, Number.isFinite(brightness) ? brightness : 50));
  const c = Math.max(0, Math.min(100, Number.isFinite(contrast) ? contrast : 50));
  const s = Math.max(0, Math.min(100, Number.isFinite(sharpness) ? sharpness : 50));

  const brightnessFactor = b <= 50 ? 0.35 + (b / 50) * 0.65 : 1.0 + ((b - 50) / 50) * 0.75;
  const contrastFactor = c <= 50 ? 0.4 + (c / 50) * 0.6 : 1.0 + ((c - 50) / 50) * 0.8;
  const blurPx = s < 50 ? Number((((50 - s) / 50) * 9 * blurScale).toFixed(2)) : 0;
  const sharpenAmount = s > 50 ? Number(((s - 50) / 50).toFixed(2)) : 0;

  const parts: string[] = [];
  if (Math.abs(brightnessFactor - 1) > 0.01) {
    parts.push(`brightness(${brightnessFactor.toFixed(2)})`);
  }
  if (Math.abs(contrastFactor - 1) > 0.01) {
    parts.push(`contrast(${contrastFactor.toFixed(2)})`);
  }
  if (blurPx > 0.05) {
    parts.push(`blur(${blurPx}px)`);
  }

  return {
    cssFilter: parts.length > 0 ? parts.join(' ') : 'none',
    sharpenAmount,
    blurPx,
  };
}

export function isHexColorDark(color?: string | null): boolean {
  if (!color || typeof color !== 'string') return false;
  const trimmed = color.trim();
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(trimmed);
  if (!hexMatch) return false;
  let hex = hexMatch[1];
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 0.34;
}

export function resolveLegibleShadowColor(
  textColor: string | null | undefined,
  isLightSurface: boolean,
  bgBlackBackdrop?: boolean
): string {
  if (bgBlackBackdrop) return 'rgba(0, 0, 0, 0.92)';
  if (textColor) {
    return isHexColorDark(textColor) ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.9)';
  }
  return isLightSurface ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.9)';
}

interface LaidOutVerseBlock {
  ayahNum: number;
  isBismillah?: boolean;
  surahNumber?: number;
  surahName?: string;
  yStart: number;
  centerY: number;
  height: number;
  rawAr: string;
  rawTr: string;
  rawFr: string;
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
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
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
    ? Math.round(136 * resScale)
    : Math.round(56 * resScale);
  const contentWidth = Math.max(220, Math.round((opts.width - horizontalPad * 2) * 0.94));
  const arFontPx = Math.round(44 * scaleFactor);
  const arLineHeightPx = Math.round(arFontPx * 1.72);
  const trFontPx = Math.round(23 * scaleFactor);
  const trLineHeightPx = Math.round(trFontPx * 1.5);
  const frFontPx = Math.round(24 * scaleFactor);
  const frLineHeightPx = Math.round(frFontPx * 1.48);

  const blocks: LaidOutVerseBlock[] = [];
  const wrapCache = new Map<
    string,
    { rawAr: string; rawTr: string; rawFr: string; arLines: string[]; trLines: string[]; frLines: string[] }
  >();
  let cursorY = Math.round((isLandscape ? 140 : 196) * resScale);

  const isDualRibbonLandscape = opts.flowMode === 'dual_ribbon' && isLandscape;
  const dualPadX = Math.round(92 * resScale);
  const dualColGap = Math.round(40 * resScale);
  const dualColW = Math.max(160, Math.round(((opts.width - dualPadX * 2 - dualColGap) / 2 - 12 * resScale) * 0.94));
  const measureWidth = isDualRibbonLandscape ? dualColW : contentWidth;

  const scrollArFontFamily =
    opts.flowMode === 'stream'
      ? "'Scheherazade New', 'Amiri', 'Traditional Arabic', serif"
      : "'Amiri', 'Traditional Arabic', serif";
  const scrollFrFontFamily =
    opts.flowMode === 'night_lantern'
      ? "'Cormorant Garamond', Georgia, serif"
      : "'Plus Jakarta Sans', system-ui, sans-serif";
  const effectiveFrFontPx = opts.flowMode === 'night_lantern' ? Math.round(frFontPx * 1.12) : frFontPx;
  const effectiveFrLineHeightPx = Math.round(effectiveFrFontPx * 1.44);

  for (let i = 0; i < ayahs.length; i++) {
    const ayah = ayahs[i];
    const blockStart = cursorY;
    const rawAr = ayah.isBismillah ? ayah.ar : `${ayah.ar}  ﴿${ayah.num}﴾`;
    const rawTr = ayah.tr ? `« ${ayah.tr} »` : '';
    const rawFr = ayah.fr ? (ayah.isBismillah ? ayah.fr : `${ayah.num}. ${ayah.fr}`) : '';
    const cacheKey = `${ayah.num}|${ayah.isBismillah ? 1 : 0}|${opts.flowMode}|${measureWidth}|${rawAr}|${rawTr}|${rawFr}`;

    let cachedWrap = wrapCache.get(cacheKey);
    if (!cachedWrap) {
      ctx.font = `400 ${arFontPx}px ${scrollArFontFamily}`;
      const arLines = opts.showArabic
        ? wrapTextLines(rawAr, measureWidth, (txt) => ctx.measureText(txt).width)
        : [];

      ctx.font = `italic 400 ${trFontPx}px Georgia, serif`;
      const trLines =
        opts.showPhonetics && rawTr
          ? wrapTextLines(rawTr, measureWidth, (txt) => ctx.measureText(txt).width)
          : [];

      ctx.font = `500 ${effectiveFrFontPx}px ${scrollFrFontFamily}`;
      const frLines =
        opts.showFrench && rawFr
          ? wrapTextLines(rawFr, measureWidth, (txt) => ctx.measureText(txt).width)
          : [];

      cachedWrap = { rawAr, rawTr, rawFr, arLines, trLines, frLines };
      wrapCache.set(cacheKey, cachedWrap);
    }

    const { arLines, trLines, frLines } = cachedWrap;

    let blockHeight = Math.round(28 * resScale);
    if (isDualRibbonLandscape) {
      const rightColH = arLines.length > 0 ? arLines.length * arLineHeightPx + Math.round(12 * resScale) : 0;
      let leftColH = 0;
      if (trLines.length > 0) leftColH += trLines.length * trLineHeightPx + Math.round(8 * resScale);
      if (frLines.length > 0) leftColH += frLines.length * effectiveFrLineHeightPx + Math.round(10 * resScale);
      blockHeight += Math.max(rightColH, leftColH);
    } else {
      if (arLines.length > 0) blockHeight += arLines.length * arLineHeightPx + Math.round(16 * resScale);
      if (trLines.length > 0) blockHeight += trLines.length * trLineHeightPx + Math.round(10 * resScale);
      if (frLines.length > 0) blockHeight += frLines.length * effectiveFrLineHeightPx + Math.round(10 * resScale);
    }

    const gapAfter = Math.round((opts.flowMode === 'stream' ? 38 : 60) * resScale);
    blocks.push({
      ayahNum: ayah.num,
      isBismillah: ayah.isBismillah,
      surahNumber: ayah.surahNumber,
      surahName: ayah.surahName,
      yStart: blockStart,
      centerY: blockStart + blockHeight / 2,
      height: blockHeight,
      rawAr,
      rawTr,
      rawFr,
      arLines,
      trLines,
      frLines,
      arFontPx,
      arLineHeightPx,
      trFontPx,
      trLineHeightPx,
      frFontPx: effectiveFrFontPx,
      frLineHeightPx: effectiveFrLineHeightPx,
    });

    cursorY += blockHeight + gapAfter;
  }

  return {
    blocks,
    totalRibbonHeight: cursorY + Math.round(260 * resScale),
    centersPx: blocks.map((b) => b.centerY),
  };
}

function fillSafeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth?: number
) {
  if (maxWidth && maxWidth > 0 && ctx.measureText(text).width > maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
}

function drawRtlTajweedLine(
  ctx: CanvasRenderingContext2D,
  lineText: string,
  x: number,
  y: number,
  opts: VideoCanvasRenderOptions,
  fontPx: number,
  textAlign: CanvasTextAlign = 'center',
  colorOverride?: string,
  maxWidth?: number,
  fontFamily: string = "'Amiri', 'Traditional Arabic', serif",
  fontWeight: string = '400'
) {
  ctx.font = `${fontWeight} ${fontPx}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.textAlign = textAlign;
  ctx.fillStyle =
    opts.arabicTextColor || colorOverride || (opts.isLightSurface ? '#0A0A0A' : '#FFFFFF');
  fillSafeText(ctx, lineText, x, y, maxWidth);
  ctx.direction = 'ltr';
}

interface BoxTypographyConfig {
  arFontFamily?: string;
  arFontWeight?: string;
  trFontFamily?: string;
  trFontStyle?: 'italic' | 'normal';
  trFontWeight?: string;
  frFontFamily?: string;
  frFontStyle?: 'italic' | 'normal';
  frFontWeight?: string;
  arMultiplier?: number;
  trMultiplier?: number;
  frMultiplier?: number;
  includeAr?: boolean;
  includeTr?: boolean;
  includeFr?: boolean;
  minScale?: number;
}

interface FittedBoxContent {
  arPx: number;
  arLH: number;
  trPx: number;
  trLH: number;
  frPx: number;
  frLH: number;
  arFontFamily: string;
  arFontWeight: string;
  trFontFamily: string;
  trFontStyle: 'italic' | 'normal';
  trFontWeight: string;
  frFontFamily: string;
  frFontStyle: 'italic' | 'normal';
  frFontWeight: string;
  arLines: string[];
  trLines: string[];
  frLines: string[];
  contentH: number;
  overflowPx: number;
  panOffsetPx: number;
  fitScale: number;
}

function computeFluidPanT(segmentProgress: number): number {
  if (segmentProgress <= 0.06) return 0;
  if (segmentProgress >= 0.90) return 1;
  const t = (segmentProgress - 0.06) / 0.84;
  return t * t * (3 - 2 * t);
}

/**
 * Dynamically scales & wraps any verse (from 1 word to Ayat 2:282) inside (boxW, boxH)
 * using the exact font families & weights configured for the active template.
 * If even the smallest readable scale exceeds boxH, computes a smooth internal vertical pan offset
 * so the verse never clips outside its safe zone and stays 100% readable from start to end.
 */
function fitVerseIntoBox(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  boxW: number,
  boxH: number,
  segmentProgress: number,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  config?: BoxTypographyConfig
): FittedBoxContent {
  const safeW = Math.max(120, Math.round(boxW * 0.94));
  const safeH = Math.max(60, boxH - Math.round(8 * resScale));
  const arMult = config?.arMultiplier ?? 1;
  const trMult = config?.trMultiplier ?? 1;
  const frMult = config?.frMultiplier ?? 1;
  const useAr = config?.includeAr ?? opts.showArabic;
  const useTr = config?.includeTr ?? opts.showPhonetics;
  const useFr = config?.includeFr ?? opts.showFrench;
  const minScale = config?.minScale ?? 0.46;

  const arFontFamily = config?.arFontFamily ?? "'Amiri', 'Traditional Arabic', serif";
  const arFontWeight = config?.arFontWeight ?? '400';
  const trFontFamily = config?.trFontFamily ?? 'Georgia, serif';
  const trFontStyle = config?.trFontStyle ?? 'italic';
  const trFontWeight = config?.trFontWeight ?? '400';
  const frFontFamily = config?.frFontFamily ?? "'Plus Jakarta Sans', system-ui, sans-serif";
  const frFontStyle = config?.frFontStyle ?? 'normal';
  const frFontWeight = config?.frFontWeight ?? '500';

  const measureAtScale = (fitScale: number) => {
    const arPx = Math.max(Math.round(14 * resScale), Math.round(block.arFontPx * arMult * fitScale));
    const arLH = Math.round(arPx * 1.66);
    const trPx = Math.max(Math.round(10 * resScale), Math.round(block.trFontPx * trMult * fitScale));
    const trLH = Math.round(trPx * 1.46);
    const frPx = Math.max(Math.round(11 * resScale), Math.round(block.frFontPx * frMult * fitScale));
    const frLH = Math.round(frPx * 1.44);

    ctx.font = `${arFontWeight} ${arPx}px ${arFontFamily}`;
    const arLines = useAr && block.rawAr
      ? wrapTextLines(block.rawAr, safeW, (t) => ctx.measureText(t).width)
      : [];

    ctx.font = `${trFontStyle} ${trFontWeight} ${trPx}px ${trFontFamily}`;
    const trLines = useTr && block.rawTr
      ? wrapTextLines(block.rawTr, safeW, (t) => ctx.measureText(t).width)
      : [];

    ctx.font = `${frFontStyle} ${frFontWeight} ${frPx}px ${frFontFamily}`;
    const frLines = useFr && block.rawFr
      ? wrapTextLines(block.rawFr, safeW, (t) => ctx.measureText(t).width)
      : [];

    const hasAr = arLines.length > 0;
    const hasTr = trLines.length > 0;
    const hasFr = frLines.length > 0;

    let contentH = 0;
    if (hasAr) contentH += arLines.length * arLH;
    if (hasAr && (hasTr || hasFr)) contentH += Math.round(16 * resScale * fitScale);
    if (hasTr) contentH += trLines.length * trLH + (hasFr ? Math.round(8 * resScale * fitScale) : 0);
    if (hasFr) contentH += frLines.length * frLH;

    return { arPx, arLH, trPx, trLH, frPx, frLH, arLines, trLines, frLines, contentH, fitScale };
  };

  const scaleSteps = [1.0, 0.9, 0.8, 0.72, 0.64, 0.56, minScale];
  let chosen = measureAtScale(scaleSteps[0]);
  for (const s of scaleSteps) {
    const attempt = measureAtScale(s);
    chosen = attempt;
    if (attempt.contentH <= safeH) {
      break;
    }
  }

  const overflowPx = Math.max(0, chosen.contentH - safeH);
  const panOffsetPx = overflowPx > 0 ? Math.round(overflowPx * computeFluidPanT(segmentProgress)) : 0;

  return {
    ...chosen,
    arFontFamily,
    arFontWeight,
    trFontFamily,
    trFontStyle,
    trFontWeight,
    frFontFamily,
    frFontStyle,
    frFontWeight,
    overflowPx,
    panOffsetPx,
  };
}

function drawFittedVerseInBox(
  ctx: CanvasRenderingContext2D,
  fit: FittedBoxContent,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  options?: {
    align?: CanvasTextAlign;
    highlightProgress?: number;
    drawDivider?: boolean;
    arColor?: string;
    trColor?: string;
    frColor?: string;
    dividerColor?: string;
  }
) {
  const { isLightSurface } = opts;
  const align = options?.align ?? 'center';
  const centerX = align === 'center' ? boxX + boxW / 2 : align === 'right' ? boxX + boxW : boxX;
  const maxLineW = Math.max(80, boxW - Math.round(8 * resScale));

  ctx.save();
  ctx.beginPath();
  ctx.rect(boxX, boxY, boxW, boxH);
  ctx.clip();

  const firstLH =
    fit.arLines.length > 0 ? fit.arLH : fit.trLines.length > 0 ? fit.trLH : fit.frLH;
  const startY =
    fit.overflowPx > 0
      ? boxY + Math.round(4 * resScale) + firstLH * 0.45 - fit.panOffsetPx
      : boxY + Math.max(0, (boxH - fit.contentH) / 2) + firstLH * 0.45;

  let yCursor = startY;
  const totalLines = fit.arLines.length + fit.trLines.length + fit.frLines.length;
  let lineCounter = 0;

  const hasMediaBg = Boolean(opts.bgVideo || opts.bgImage);
  const boostShadow = Boolean(opts.textShadowBoost);
  const applyLegibleShadow = (textColor: string | null | undefined) => {
    if (!boostShadow && !hasMediaBg) return;
    ctx.shadowColor = resolveLegibleShadowColor(textColor, isLightSurface, opts.bgBlackBackdrop);
    ctx.shadowBlur = Math.round((boostShadow ? 12 : 6) * resScale);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.round((boostShadow ? 1.5 : 1) * resScale);
  };

  for (const line of fit.arLines) {
    let lineAlpha = 1;
    let lineColor = opts.arabicTextColor || options?.arColor;
    if (typeof options?.highlightProgress === 'number' && totalLines > 0) {
      const linePos = lineCounter / Math.max(1, totalLines - 1);
      const active = options.highlightProgress >= linePos - 0.12;
      lineAlpha = active ? 1 : 0.48;
      if (active && options.highlightProgress - linePos < 0.25 && !opts.arabicTextColor) {
        lineColor = isLightSurface ? '#047857' : '#FDE68A';
      }
    }
    ctx.save();
    ctx.globalAlpha *= lineAlpha;
    applyLegibleShadow(lineColor || (isLightSurface ? '#0A0A0A' : '#FFFFFF'));
    drawRtlTajweedLine(
      ctx,
      line,
      align === 'left' ? boxX + boxW : centerX,
      yCursor,
      opts,
      fit.arPx,
      align === 'left' ? 'right' : align,
      lineColor,
      maxLineW,
      fit.arFontFamily,
      fit.arFontWeight
    );
    ctx.restore();
    yCursor += fit.arLH;
    lineCounter++;
  }

  if (fit.arLines.length > 0 && (fit.trLines.length > 0 || fit.frLines.length > 0)) {
    if (options?.drawDivider !== false) {
      const rw = Math.min(Math.round(90 * resScale), boxW * 0.34);
      const ruleX = align === 'center' ? centerX - rw / 2 : align === 'right' ? boxX + boxW - rw : boxX;
      ctx.fillStyle =
        options?.dividerColor ||
        (isLightSurface && !opts.bgBlackBackdrop
          ? 'rgba(4, 120, 87, 0.24)'
          : 'rgba(251, 191, 36, 0.32)');
      ctx.fillRect(
        ruleX,
        yCursor - Math.round(fit.arLH * 0.18),
        rw,
        Math.max(1, Math.round(1.2 * resScale))
      );
    }
    yCursor += Math.round(14 * resScale * fit.fitScale);
  }

  ctx.textBaseline = 'middle';
  ctx.textAlign = align;

  if (fit.trLines.length > 0) {
    ctx.font = `${fit.trFontStyle} ${fit.trFontWeight} ${fit.trPx}px ${fit.trFontFamily}`;
    const resolvedTrColor =
      opts.phoneticsTextColor || options?.trColor || (isLightSurface ? '#065F46' : '#CBD5E1');
    for (const line of fit.trLines) {
      let lineAlpha = 1;
      if (typeof options?.highlightProgress === 'number' && totalLines > 0) {
        const linePos = lineCounter / Math.max(1, totalLines - 1);
        lineAlpha = options.highlightProgress >= linePos - 0.12 ? 1 : 0.55;
      }
      ctx.save();
      ctx.globalAlpha *= lineAlpha;
      applyLegibleShadow(resolvedTrColor);
      ctx.fillStyle = resolvedTrColor;
      fillSafeText(ctx, line, align === 'right' ? boxX + boxW : align === 'left' ? boxX : centerX, yCursor, maxLineW);
      ctx.restore();
      yCursor += fit.trLH;
      lineCounter++;
    }
    if (fit.frLines.length > 0) {
      yCursor += Math.round(6 * resScale * fit.fitScale);
    }
  }

  if (fit.frLines.length > 0) {
    ctx.font = `${fit.frFontStyle} ${fit.frFontWeight} ${fit.frPx}px ${fit.frFontFamily}`;
    const resolvedFrColor =
      opts.frenchTextColor || options?.frColor || (isLightSurface ? '#171717' : '#F8FAFC');
    for (const line of fit.frLines) {
      let lineAlpha = 1;
      if (typeof options?.highlightProgress === 'number' && totalLines > 0) {
        const linePos = lineCounter / Math.max(1, totalLines - 1);
        lineAlpha = options.highlightProgress >= linePos - 0.12 ? 1 : 0.58;
      }
      ctx.save();
      ctx.globalAlpha *= lineAlpha;
      applyLegibleShadow(resolvedFrColor);
      ctx.fillStyle = resolvedFrColor;
      fillSafeText(ctx, line, align === 'right' ? boxX + boxW : align === 'left' ? boxX : centerX, yCursor, maxLineW);
      ctx.restore();
      yCursor += fit.frLH;
      lineCounter++;
    }
  }

  ctx.restore();
}

export interface BottomFooterMetrics {
  padX: number;
  bottomPad: number;
  dividerW: number;
  brandFontPx: number;
  subFontPx: number;
  iconR: number;
  gap: number;
  pairGap: number;
  watermarkH: number;
  logoMaxW: number;
  logoMaxH: number;
}

export function computeBottomFooterMetrics(
  width: number,
  height: number,
  resScale: number
): BottomFooterMetrics {
  const isPortrait = height > width;
  const padX = Math.round((isPortrait ? 34 : 46) * resScale);
  const bottomPad = Math.round((isPortrait ? 18 : 16) * resScale);
  const dividerW = Math.round((isPortrait ? 128 : 122) * resScale);
  const brandFontPx = Math.round((isPortrait ? 17 : 16) * resScale);
  const subFontPx = Math.round((isPortrait ? 11.5 : 10.5) * resScale);
  const iconR = Math.round((isPortrait ? 7 : 6.5) * resScale);
  const gap = Math.round(7 * resScale);
  const pairGap = Math.round((isPortrait ? 36 : 46) * resScale);
  const watermarkH = Math.round((isPortrait ? 52 : 48) * resScale);
  const logoMaxW = Math.round((isPortrait ? 236 : 260) * resScale);
  const logoMaxH = Math.round((isPortrait ? 104 : 96) * resScale);

  return {
    padX,
    bottomPad,
    dividerW,
    brandFontPx,
    subFontPx,
    iconR,
    gap,
    pairGap,
    watermarkH,
    logoMaxW,
    logoMaxH,
  };
}

export function computeBottomRightLogoRect(
  width: number,
  height: number,
  resScale: number,
  imgWidth: number,
  imgHeight: number,
  watermarkWidth: number = 0
): { x: number; y: number; w: number; h: number; footerCenterY: number } | null {
  const safeW = Number.isFinite(imgWidth) && imgWidth > 0 ? imgWidth : 0;
  const safeH = Number.isFinite(imgHeight) && imgHeight > 0 ? imgHeight : 0;
  if (safeW <= 0 || safeH <= 0) return null;

  const m = computeBottomFooterMetrics(width, height, resScale);
  const scale = Math.min(m.logoMaxW / safeW, m.logoMaxH / safeH);
  const drawW = Math.max(1, Math.round(safeW * scale));
  const drawH = Math.max(1, Math.round(safeH * scale));

  const footerBlockH = Math.max(m.watermarkH, drawH);
  const footerCenterY = height - m.bottomPad - footerBlockH / 2;
  const drawY = Math.round(footerCenterY - drawH / 2);

  if (watermarkWidth > 0) {
    const totalPairW = watermarkWidth + m.pairGap + drawW;
    const pairLeft = Math.round((width - totalPairW) / 2);
    const drawX = Math.min(width - m.padX - drawW, pairLeft + watermarkWidth + m.pairGap);
    return { x: drawX, y: drawY, w: drawW, h: drawH, footerCenterY };
  }

  const drawX = Math.round((width - drawW) / 2);
  return { x: drawX, y: drawY, w: drawW, h: drawH, footerCenterY };
}

/**
 * Draws the mandatory, non-removable "Le Sanctuaire" watermark and optional custom image logo
 * centered horizontally & vertically together at the bottom of the video.
 */
function drawMandatoryBottomWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  resScale: number,
  isLightSurface: boolean,
  logoImage?: HTMLImageElement | null,
  showWatermark: boolean = true
) {
  const rawLogoW = logoImage ? (logoImage as any).naturalWidth || logoImage.width || 0 : 0;
  const rawLogoH = logoImage ? (logoImage as any).naturalHeight || logoImage.height || 0 : 0;
  const hasLogo = Boolean(logoImage && rawLogoW > 0 && rawLogoH > 0);

  if (!showWatermark && !hasLogo) {
    return;
  }

  ctx.save();
  const m = computeBottomFooterMetrics(width, height, resScale);

  const brandFont = `800 ${m.brandFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const subFont = `600 ${m.subFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;

  ctx.font = brandFont;
  const brandTextWidth = ctx.measureText(MANDATORY_WATERMARK_BRAND).width;
  ctx.font = subFont;
  const subTextWidth = ctx.measureText(MANDATORY_WATERMARK_TAGLINE).width;

  const brandRowWidth = m.iconR * 2 + m.gap + brandTextWidth;
  const watermarkWidth = Math.ceil(Math.max(m.dividerW, brandRowWidth, subTextWidth));

  const logoRect = hasLogo
    ? computeBottomRightLogoRect(width, height, resScale, rawLogoW, rawLogoH, watermarkWidth)
    : null;

  if (!showWatermark && logoImage && logoRect) {
    // Pro / MAX / Admin without Le Sanctuaire watermark: center user's custom logo cleanly at bottom
    const centeredLogoX = Math.round((width - logoRect.w) / 2);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.72)' : 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = Math.round(6 * resScale);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.round(1 * resScale);
    ctx.drawImage(logoImage, centeredLogoX, logoRect.y, logoRect.w, logoRect.h);
    ctx.restore();
    ctx.restore();
    return;
  }

  const footerCenterY = logoRect
    ? logoRect.footerCenterY
    : height - m.bottomPad - m.watermarkH / 2;

  const wmCenterX = logoRect
    ? Math.max(
        m.padX + watermarkWidth / 2,
        logoRect.x - m.pairGap - watermarkWidth / 2
      )
    : width / 2;

  const ruleOffsetFromCenter = -m.watermarkH * 0.42;
  const brandOffsetFromCenter = -m.watermarkH * 0.06;
  const subOffsetFromCenter = m.watermarkH * 0.34;

  const dividerY = Math.round(footerCenterY + ruleOffsetFromCenter);
  const brandY = Math.round(footerCenterY + brandOffsetFromCenter);
  const subY = Math.round(footerCenterY + subOffsetFromCenter);

  // Subtle ornamental rule centered above the watermark text
  ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.36)' : 'rgba(251, 191, 36, 0.44)';
  ctx.fillRect(
    Math.round(wmCenterX - m.dividerW / 2),
    dividerY,
    m.dividerW,
    Math.max(1.5, Math.round(1.5 * resScale))
  );

  // Soft legibility shadow over any custom background
  ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.88)' : 'rgba(0, 0, 0, 0.84)';
  ctx.shadowBlur = Math.round(8 * resScale);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(1 * resScale);

  const unitLeft = wmCenterX - brandRowWidth / 2;
  const crescentCx = unitLeft + m.iconR;
  const crescentCy = brandY;
  ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
  ctx.beginPath();
  ctx.arc(crescentCx, crescentCy, m.iconR, 0.35 * Math.PI, 1.65 * Math.PI, false);
  ctx.arc(
    crescentCx + m.iconR * 0.42,
    crescentCy - m.iconR * 0.12,
    m.iconR * 0.78,
    1.55 * Math.PI,
    0.45 * Math.PI,
    true
  );
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = brandFont;
  ctx.fillStyle = isLightSurface ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(MANDATORY_WATERMARK_BRAND, unitLeft + m.iconR * 2 + m.gap, brandY);

  ctx.font = subFont;
  ctx.textAlign = 'center';
  ctx.fillStyle = isLightSurface ? 'rgba(51, 65, 85, 0.86)' : 'rgba(226, 232, 240, 0.84)';
  ctx.fillText(MANDATORY_WATERMARK_TAGLINE, wmCenterX, subY);

  // Opposite right side of the centered pair: optional user custom image logo
  if (logoImage && logoRect) {
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    const sepH = Math.round(Math.min(Math.max(m.watermarkH, logoRect.h) * 0.56, 52 * resScale));
    const sepX = Math.round((wmCenterX + watermarkWidth / 2 + logoRect.x) / 2);
    const sepY = Math.round(footerCenterY - sepH / 2);
    ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.24)' : 'rgba(251, 191, 36, 0.28)';
    ctx.fillRect(sepX, sepY, Math.max(1, Math.round(1.2 * resScale)), sepH);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.72)' : 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = Math.round(6 * resScale);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.round(1 * resScale);
    ctx.drawImage(logoImage, logoRect.x, logoRect.y, logoRect.w, logoRect.h);
    ctx.restore();
  }

  ctx.restore();
}

function computeSegmentFadeAlpha(segmentProgress: number, isInitialFrame: boolean = false): number {
  if (isInitialFrame && segmentProgress <= 0.02) {
    return 1.0;
  }
  const fadeInEnd = 0.07;
  const fadeOutStart = 0.93;
  if (segmentProgress < fadeInEnd) {
    const t = Math.max(0, segmentProgress / fadeInEnd);
    return 0.22 + 0.78 * (t * t * (3 - 2 * t));
  }
  if (segmentProgress > fadeOutStart) {
    const t = Math.max(0, (1 - segmentProgress) / (1 - fadeOutStart));
    return 0.22 + 0.78 * (t * t * (3 - 2 * t));
  }
  return 1.0;
}

function drawRubElHizbStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  strokeColor: string,
  lineWidth: number
) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.rect(cx - r * 0.72, cy - r * 0.72, r * 1.44, r * 1.44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// FRAMELESS PURE ARABIC: CALLIGRAPHIE ARABE (Scheherazade New, Arabic Only)
// ============================================================================
function renderArabicPureKhattTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const availH = bottomSafeY - topSafeY;
  const boxW = width - Math.round((isLandscape ? 160 : 52) * resScale);
  const boxX = (width - boxW) / 2;

  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);
  ctx.save();
  ctx.globalAlpha = alpha;

  const headerH = Math.round(34 * resScale);
  ctx.font = `700 ${Math.round(14 * resScale)}px 'Scheherazade New', 'Amiri', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.78)' : 'rgba(251, 191, 36, 0.85)';
  ctx.fillText(
    block.isBismillah ? '﴿ البسملة ﴾' : `﴿ الآية ${block.ayahNum} ﴾`,
    width / 2,
    topSafeY + Math.round(18 * resScale),
    boxW
  );

  const innerTop = topSafeY + headerH + Math.round(8 * resScale);
  const innerH = Math.max(80, availH - headerH - Math.round(16 * resScale));

  const fit = fitVerseIntoBox(ctx, block, boxW, innerH, segmentProgress, opts, resScale, {
    arFontFamily: "'Scheherazade New', 'Amiri', 'Traditional Arabic', serif",
    arFontWeight: '700',
    arMultiplier: isLandscape ? 1.42 : 1.32,
    includeAr: true,
    includeTr: false,
    includeFr: false,
    minScale: 0.62,
  });

  ctx.save();
  ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.78)' : 'rgba(0, 0, 0, 0.72)';
  ctx.shadowBlur = Math.round(8 * resScale);
  drawFittedVerseInBox(ctx, fit, boxX, innerTop, boxW, innerH, opts, resScale, {
    drawDivider: false,
  });
  ctx.restore();

  ctx.restore();
}

// ============================================================================
// FRAMELESS PURE FRENCH: POÉSIE FRANÇAISE (Cormorant Garamond, French Only)
// ============================================================================
function renderFrenchPurePoetryTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const availH = bottomSafeY - topSafeY;
  const boxW = width - Math.round((isLandscape ? 210 : 64) * resScale);
  const boxX = (width - boxW) / 2;

  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);
  ctx.save();
  ctx.globalAlpha = alpha;

  const eyebrowH = Math.round(42 * resScale);
  ctx.font = `600 ${Math.round(13 * resScale)}px 'Cinzel', Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.84)' : 'rgba(253, 224, 71, 0.88)';
  ctx.fillText(
    block.isBismillah ? 'BISMILLAH' : `VERSET ${block.ayahNum}`,
    width / 2,
    topSafeY + Math.round(16 * resScale),
    boxW
  );

  const ruleW = Math.round(48 * resScale);
  ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.35)' : 'rgba(251, 191, 36, 0.42)';
  ctx.fillRect(width / 2 - ruleW / 2, topSafeY + Math.round(31 * resScale), ruleW, Math.max(1.5, Math.round(1.5 * resScale)));

  const innerTop = topSafeY + eyebrowH + Math.round(8 * resScale);
  const innerH = Math.max(80, availH - eyebrowH - Math.round(14 * resScale));

  const frenchBlock: LaidOutVerseBlock = block.rawFr
    ? block
    : { ...block, rawFr: block.rawTr || `Verset ${block.ayahNum}` };

  const fit = fitVerseIntoBox(ctx, frenchBlock, boxW, innerH, segmentProgress, opts, resScale, {
    frFontFamily: "'Cormorant Garamond', Georgia, serif",
    frFontStyle: 'italic',
    frFontWeight: '600',
    frMultiplier: isLandscape ? 1.56 : 1.42,
    includeAr: false,
    includeTr: false,
    includeFr: true,
    minScale: 0.62,
  });

  drawFittedVerseInBox(ctx, fit, boxX, innerTop, boxW, innerH, opts, resScale, {
    drawDivider: false,
    frColor: isLightSurface ? '#111827' : '#F8FAFC',
  });

  ctx.restore();
}

// ============================================================================
// TEMPLATE: SOUS-TITRES CINÉMA (Frameless Floating Gradient Fade, Zero Box)
// ============================================================================
function renderCinemaSubtitlesTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const availH = bottomSafeY - topSafeY;
  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);

  ctx.save();
  ctx.globalAlpha = alpha;

  const hasSubtitles = (opts.showPhonetics && Boolean(block.rawTr)) || (opts.showFrench && Boolean(block.rawFr));
  const arBoxW = width - Math.round((isLandscape ? 170 : 58) * resScale);
  const arBoxX = (width - arBoxW) / 2;

  const subMaxW = isLandscape
    ? Math.min(width - Math.round(160 * resScale), Math.round(1080 * resScale))
    : width - Math.round(52 * resScale);
  const subBoxX = (width - subMaxW) / 2;

  const maxSubBoxH = hasSubtitles ? Math.round(availH * 0.42) : 0;
  const subFit = hasSubtitles
    ? fitVerseIntoBox(ctx, block, subMaxW, Math.max(60, maxSubBoxH - Math.round(20 * resScale)), segmentProgress, opts, resScale, {
        frFontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        frFontWeight: '600',
        includeAr: false,
        includeTr: opts.showPhonetics,
        includeFr: opts.showFrench,
      })
    : null;

  const subBoxH = subFit
    ? Math.min(maxSubBoxH, Math.max(Math.round(52 * resScale), subFit.contentH + Math.round(20 * resScale)))
    : 0;
  const subBoxY = bottomSafeY - subBoxH - Math.round(10 * resScale);

  const upperFieldTop = topSafeY + Math.round(12 * resScale);
  const upperFieldBot = hasSubtitles ? subBoxY - Math.round(16 * resScale) : bottomSafeY - Math.round(12 * resScale);
  const upperFieldH = Math.max(80, upperFieldBot - upperFieldTop);

  if (opts.showArabic && block.rawAr) {
    const arFit = fitVerseIntoBox(ctx, block, arBoxW, upperFieldH, segmentProgress, opts, resScale, {
      arFontFamily: "'Amiri', 'Traditional Arabic', serif",
      arFontWeight: '700',
      arMultiplier: isLandscape ? 1.18 : 1.08,
      includeAr: true,
      includeTr: false,
      includeFr: false,
    });
    ctx.save();
    ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)';
    ctx.shadowBlur = Math.round(12 * resScale);
    drawFittedVerseInBox(ctx, arFit, arBoxX, upperFieldTop, arBoxW, upperFieldH, opts, resScale, {
      drawDivider: false,
    });
    ctx.restore();
  }

  if (subFit && subBoxH > 0) {
    if (typeof ctx.createLinearGradient === 'function') {
      const gradTop = Math.max(topSafeY, subBoxY - Math.round(44 * resScale));
      const scrim = ctx.createLinearGradient(0, gradTop, 0, bottomSafeY);
      if (isLightSurface && !opts.bgBlackBackdrop) {
        scrim.addColorStop(0, 'rgba(255, 255, 255, 0)');
        scrim.addColorStop(1, 'rgba(255, 255, 255, 0.72)');
      } else {
        scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
        scrim.addColorStop(1, 'rgba(0, 0, 0, 0.64)');
      }
      ctx.fillStyle = scrim;
      ctx.fillRect(0, gradTop, width, bottomSafeY - gradTop);
    }

    ctx.save();
    ctx.shadowColor = isLightSurface ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.88)';
    ctx.shadowBlur = Math.round(10 * resScale);
    drawFittedVerseInBox(
      ctx,
      subFit,
      subBoxX,
      subBoxY + Math.round(8 * resScale),
      subMaxW,
      subBoxH - Math.round(12 * resScale),
      opts,
      resScale,
      { drawDivider: false, frColor: isLightSurface ? '#0F172A' : '#FFFFFF' }
    );
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// TEMPLATE: ÉDITION BILINGUE SPLIT (Frameless Open Two-Column Typography)
// ============================================================================
function renderMushafSplitTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, height, isLightSurface } = opts;
  const isLandscape = width > height;
  const availH = bottomSafeY - topSafeY;
  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);

  ctx.save();
  ctx.globalAlpha = alpha;

  if (isLandscape || width === height) {
    const padX = Math.round(72 * resScale);
    const colGap = Math.round(52 * resScale);
    const colW = (width - padX * 2 - colGap) / 2;
    const leftX = padX;
    const rightX = padX + colW + colGap;

    const areaTop = topSafeY + Math.round(16 * resScale);
    const areaH = availH - Math.round(32 * resScale);

    // Right column: Arabic Calligraphy
    const arFit = fitVerseIntoBox(ctx, block, colW - Math.round(12 * resScale), areaH - Math.round(12 * resScale), segmentProgress, opts, resScale, {
      arFontFamily: "'Amiri', 'Traditional Arabic', serif",
      arMultiplier: 1.05,
      includeAr: opts.showArabic,
      includeTr: false,
      includeFr: false,
    });
    drawFittedVerseInBox(
      ctx,
      arFit,
      rightX + Math.round(6 * resScale),
      areaTop + Math.round(6 * resScale),
      colW - Math.round(12 * resScale),
      areaH - Math.round(12 * resScale),
      opts,
      resScale,
      { drawDivider: false }
    );

    // Left column: Eyebrow + Phonetics + Literary French Serif
    const badgeH = Math.round(32 * resScale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(12.5 * resScale)}px 'Cinzel', Georgia, serif`;
    ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
    ctx.fillText(
      block.isBismillah ? 'BISMILLAH' : `AYAH ${block.ayahNum}`,
      leftX + colW / 2,
      areaTop + Math.round(18 * resScale)
    );

    const transFit = fitVerseIntoBox(
      ctx,
      block,
      colW - Math.round(16 * resScale),
      areaH - badgeH - Math.round(16 * resScale),
      segmentProgress,
      opts,
      resScale,
      {
        frFontFamily: "'Cormorant Garamond', Georgia, serif",
        frFontWeight: '600',
        frMultiplier: 1.15,
        includeAr: false,
        includeTr: opts.showPhonetics,
        includeFr: opts.showFrench,
      }
    );
    drawFittedVerseInBox(
      ctx,
      transFit,
      leftX + Math.round(8 * resScale),
      areaTop + badgeH + Math.round(4 * resScale),
      colW - Math.round(16 * resScale),
      areaH - badgeH - Math.round(16 * resScale),
      opts,
      resScale,
      { drawDivider: false }
    );
  } else {
    const boxW = width - Math.round(64 * resScale);
    const boxX = (width - boxW) / 2;
    const midY = topSafeY + availH * 0.47;

    const upperH = Math.max(60, midY - topSafeY - Math.round(12 * resScale));
    const arFit = fitVerseIntoBox(ctx, block, boxW, upperH, segmentProgress, opts, resScale, {
      arFontFamily: "'Amiri', 'Traditional Arabic', serif",
      includeAr: opts.showArabic,
      includeTr: false,
      includeFr: false,
    });
    drawFittedVerseInBox(ctx, arFit, boxX, topSafeY + Math.round(8 * resScale), boxW, upperH, opts, resScale, {
      drawDivider: false,
    });

    const lowerTop = midY + Math.round(12 * resScale);
    const lowerH = Math.max(60, bottomSafeY - lowerTop - Math.round(8 * resScale));
    const transFit = fitVerseIntoBox(ctx, block, boxW, lowerH, segmentProgress, opts, resScale, {
      frFontFamily: "'Cormorant Garamond', Georgia, serif",
      frFontWeight: '600',
      frMultiplier: 1.14,
      includeAr: false,
      includeTr: opts.showPhonetics,
      includeFr: opts.showFrench,
    });
    drawFittedVerseInBox(ctx, transFit, boxX, lowerTop, boxW, lowerH, opts, resScale, {
      drawDivider: false,
    });
  }

  ctx.restore();
}

// ============================================================================
// TEMPLATE: CONTEMPLATION & ONDES (Open Serif + Gentle Wave)
// ============================================================================
function renderMeditationMinimalTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  currentSec: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const centerX = width / 2;
  const availH = bottomSafeY - topSafeY;
  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);

  ctx.save();
  ctx.globalAlpha = alpha;

  const starSpace = Math.round(42 * resScale);
  const waveSpace = Math.round(46 * resScale);
  const boxW = width - Math.round((width > opts.height ? 220 : 72) * resScale);
  const boxX = (width - boxW) / 2;
  const innerH = Math.max(80, availH - starSpace - waveSpace);

  const starCy = topSafeY + Math.round(20 * resScale);
  drawRubElHizbStar(
    ctx,
    centerX,
    starCy,
    Math.round(12 * resScale),
    isLightSurface ? 'rgba(4, 120, 87, 0.65)' : 'rgba(251, 191, 36, 0.78)',
    Math.max(1.5, Math.round(1.6 * resScale))
  );

  const fit = fitVerseIntoBox(ctx, block, boxW, innerH, segmentProgress, opts, resScale, {
    frFontFamily: "'Cormorant Garamond', Georgia, serif",
    frFontStyle: 'italic',
    frFontWeight: '600',
    frMultiplier: 1.16,
  });
  drawFittedVerseInBox(ctx, fit, boxX, topSafeY + starSpace, boxW, innerH, opts, resScale);

  const waveY = bottomSafeY - Math.round(22 * resScale);
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

// ============================================================================
// TEMPLATE: ÉCHO LUMINEUX (Line-by-Line Reading Glow)
// ============================================================================
function renderKaraokeGlowTemplate(
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
  const boxW = width - Math.round((isLandscape ? 180 : 58) * resScale);
  const boxX = (width - boxW) / 2;
  const badgeH = Math.round(36 * resScale);
  const barH = Math.round(18 * resScale);
  const innerH = Math.max(80, bottomSafeY - topSafeY - badgeH - barH);

  ctx.save();

  const pillW = Math.min(Math.round(220 * resScale), boxW * 0.55);
  const pillH = Math.max(3, Math.round(3.5 * resScale));
  const pillX = width / 2 - pillW / 2;
  const pillY = topSafeY + Math.round(14 * resScale);
  ctx.fillStyle = isLightSurface ? 'rgba(4, 120, 87, 0.16)' : 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(pillX, pillY, pillW, pillH);
  ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
  ctx.fillRect(pillX, pillY, Math.round(pillW * Math.max(0.05, Math.min(1, segmentProgress))), pillH);

  ctx.font = `700 ${Math.round(12 * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? '#047857' : '#FCD34D';
  ctx.fillText(
    block.isBismillah ? 'BISMILLAH' : `VERSET ${block.ayahNum}`,
    width / 2,
    pillY + Math.round(18 * resScale)
  );

  const fit = fitVerseIntoBox(ctx, block, boxW, innerH, segmentProgress, opts, resScale);
  drawFittedVerseInBox(ctx, fit, boxX, topSafeY + badgeH + Math.round(12 * resScale), boxW, innerH, opts, resScale, {
    highlightProgress: segmentProgress,
  });

  ctx.restore();
}

// ============================================================================
// TEMPLATE: ÉDITORIAL MINIMAL (Frameless Left-Aligned Literary Editorial)
// ============================================================================
function renderEditorialMagazineTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const padX = Math.round((isLandscape ? 120 : 44) * resScale);
  const contentW = Math.max(140, width - padX * 2);
  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.font = `700 ${Math.round(12.5 * resScale)}px 'Cinzel', Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? '#047857' : '#FCD34D';
  ctx.fillText(
    block.isBismillah ? '00 · BISMILLAH' : `${String(block.ayahNum).padStart(2, '0')} · ${block.surahName || opts.surahName}`,
    padX,
    topSafeY + Math.round(24 * resScale),
    contentW
  );

  const accentRuleW = Math.round(54 * resScale);
  ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
  ctx.fillRect(padX, topSafeY + Math.round(38 * resScale), accentRuleW, Math.max(2, Math.round(2 * resScale)));

  const innerY = topSafeY + Math.round(52 * resScale);
  const innerH = Math.max(70, bottomSafeY - innerY - Math.round(18 * resScale));

  const fit = fitVerseIntoBox(ctx, block, contentW, innerH, segmentProgress, opts, resScale, {
    frFontFamily: "'Cormorant Garamond', Georgia, serif",
    frFontWeight: '600',
    frMultiplier: 1.14,
  });
  drawFittedVerseInBox(ctx, fit, padX, innerY, contentW, innerH, opts, resScale, {
    align: 'left',
  });

  ctx.restore();
}

// ============================================================================
// TEMPLATE: FOCUS SÉQUENTIEL (Frameless Watermark Numeral + Centered Typography)
// ============================================================================
function renderVerseTickerTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const availH = bottomSafeY - topSafeY;
  const boxW = width - Math.round((isLandscape ? 180 : 54) * resScale);
  const boxX = (width - boxW) / 2;

  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);
  ctx.save();
  ctx.globalAlpha = alpha;

  // Watermark verse numeral in the center background (frameless)
  const bgGlyph = block.isBismillah ? '۞' : String(block.ayahNum);
  const watermarkPx = Math.round((isLandscape ? 210 : 175) * resScale);
  ctx.save();
  ctx.globalAlpha *= isLightSurface ? 0.08 : 0.09;
  ctx.font = `800 ${watermarkPx}px 'Cinzel', Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
  ctx.fillText(bgGlyph, width / 2, topSafeY + availH / 2);
  ctx.restore();

  const fit = fitVerseIntoBox(ctx, block, boxW, availH - Math.round(24 * resScale), segmentProgress, opts, resScale, {
    arFontFamily: "'Amiri', 'Traditional Arabic', serif",
    arFontWeight: '700',
    arMultiplier: 1.06,
    frFontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    frFontWeight: '500',
  });
  drawFittedVerseInBox(ctx, fit, boxX, topSafeY + Math.round(12 * resScale), boxW, availH - Math.round(24 * resScale), opts, resScale);

  ctx.restore();
}

// ============================================================================
// TEMPLATE: PLUME RUQ'AH (Aref Ruqaa Arabic + Light Plus Jakarta Sans)
// ============================================================================
function renderArabicRuqaaModernTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const boxW = width - Math.round((isLandscape ? 175 : 54) * resScale);
  const boxX = (width - boxW) / 2;
  const availH = bottomSafeY - topSafeY;

  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);
  ctx.save();
  ctx.globalAlpha = alpha;

  const fit = fitVerseIntoBox(ctx, block, boxW, availH - Math.round(20 * resScale), segmentProgress, opts, resScale, {
    arFontFamily: "'Aref Ruqaa', 'Amiri', serif",
    arFontWeight: '700',
    arMultiplier: 1.14,
    frFontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    frFontWeight: '300',
    frMultiplier: 0.94,
    trMultiplier: 0.88,
  });

  drawFittedVerseInBox(
    ctx,
    fit,
    boxX,
    topSafeY + Math.round(10 * resScale),
    boxW,
    availH - Math.round(20 * resScale),
    opts,
    resScale,
    {
      arColor: isLightSurface ? '#064E3B' : '#FEF3C7',
      frColor: isLightSurface ? '#334155' : '#E2E8F0',
    }
  );

  ctx.restore();
}

// ============================================================================
// TEMPLATE: KUFI GÉOMÉTRIQUE (Noto Kufi Arabic + Engraved Cinzel Header)
// ============================================================================
function renderKufiEditorialTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const boxW = width - Math.round((isLandscape ? 180 : 54) * resScale);
  const boxX = (width - boxW) / 2;
  const availH = bottomSafeY - topSafeY;

  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);
  ctx.save();
  ctx.globalAlpha = alpha;

  const headerH = Math.round(38 * resScale);
  ctx.font = `700 ${Math.round(13.5 * resScale)}px 'Cinzel', Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isLightSurface ? '#047857' : '#FBBF24';
  ctx.fillText(
    block.isBismillah ? 'BISMILLAH' : `${(block.surahName || opts.surahName).toUpperCase()}  •  ${block.ayahNum}`,
    width / 2,
    topSafeY + Math.round(20 * resScale),
    boxW
  );

  const innerTop = topSafeY + headerH + Math.round(6 * resScale);
  const innerH = Math.max(70, availH - headerH - Math.round(16 * resScale));

  const fit = fitVerseIntoBox(ctx, block, boxW, innerH, segmentProgress, opts, resScale, {
    arFontFamily: "'Noto Kufi Arabic', 'Amiri', sans-serif",
    arFontWeight: '600',
    arMultiplier: 0.92,
    frFontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    frFontWeight: '500',
    frMultiplier: 0.98,
  });

  drawFittedVerseInBox(ctx, fit, boxX, innerTop, boxW, innerH, opts, resScale);

  ctx.restore();
}

// ============================================================================
// TEMPLATE: FOCUS PHONÉTIQUE (Dominant Italic Phonetics for Pronunciation)
// ============================================================================
function renderPhoneticsFocusTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const boxW = width - Math.round((isLandscape ? 175 : 54) * resScale);
  const boxX = (width - boxW) / 2;
  const availH = bottomSafeY - topSafeY;

  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);
  ctx.save();
  ctx.globalAlpha = alpha;

  const hasTr = Boolean(block.rawTr);
  const fit = fitVerseIntoBox(ctx, block, boxW, availH - Math.round(20 * resScale), segmentProgress, opts, resScale, {
    arFontFamily: "'Amiri', 'Traditional Arabic', serif",
    arMultiplier: 0.78,
    trFontFamily: "'Cormorant Garamond', Georgia, serif",
    trFontStyle: 'italic',
    trFontWeight: '600',
    trMultiplier: 1.44,
    frFontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    frFontWeight: '400',
    frMultiplier: 0.86,
    includeAr: opts.showArabic,
    includeTr: hasTr,
    includeFr: opts.showFrench,
  });

  drawFittedVerseInBox(
    ctx,
    fit,
    boxX,
    topSafeY + Math.round(10 * resScale),
    boxW,
    availH - Math.round(20 * resScale),
    opts,
    resScale,
    {
      arColor: isLightSurface ? 'rgba(23, 23, 23, 0.72)' : 'rgba(226, 232, 240, 0.74)',
      trColor: isLightSurface ? '#047857' : '#FDE68A',
      frColor: isLightSurface ? '#334155' : '#F1F5F9',
    }
  );

  ctx.restore();
}

// ============================================================================
// TEMPLATE: ARABE MONUMENTAL (Giant Scheherazade + Whisper Italic French)
// ============================================================================
function renderArabicGiantWhisperFrTemplate(
  ctx: CanvasRenderingContext2D,
  block: LaidOutVerseBlock,
  segmentProgress: number,
  isInitialFrame: boolean,
  opts: VideoCanvasRenderOptions,
  resScale: number,
  topSafeY: number,
  bottomSafeY: number
) {
  const { width, isLightSurface } = opts;
  const isLandscape = width > opts.height;
  const boxW = width - Math.round((isLandscape ? 160 : 50) * resScale);
  const boxX = (width - boxW) / 2;
  const availH = bottomSafeY - topSafeY;

  const alpha = computeSegmentFadeAlpha(segmentProgress, isInitialFrame);
  ctx.save();
  ctx.globalAlpha = alpha;

  const fit = fitVerseIntoBox(ctx, block, boxW, availH - Math.round(18 * resScale), segmentProgress, opts, resScale, {
    arFontFamily: "'Scheherazade New', 'Amiri', 'Traditional Arabic', serif",
    arFontWeight: '700',
    arMultiplier: 1.32,
    frFontFamily: "'Cormorant Garamond', Georgia, serif",
    frFontStyle: 'italic',
    frFontWeight: '400',
    frMultiplier: 0.86,
    includeAr: opts.showArabic,
    includeTr: false,
    includeFr: opts.showFrench,
    minScale: 0.42,
  });

  drawFittedVerseInBox(
    ctx,
    fit,
    boxX,
    topSafeY + Math.round(9 * resScale),
    boxW,
    availH - Math.round(18 * resScale),
    opts,
    resScale,
    {
      drawDivider: false,
      frColor: isLightSurface ? 'rgba(30, 41, 59, 0.78)' : 'rgba(226, 232, 240, 0.78)',
    }
  );

  ctx.restore();
}

const lastVideoFrameCache =
  typeof WeakMap !== 'undefined' ? new WeakMap<HTMLVideoElement, HTMLCanvasElement>() : null;
const lastVideoFrameTicks =
  typeof WeakMap !== 'undefined' ? new WeakMap<HTMLVideoElement, number>() : null;

function snapshotLastVideoFrame(videoEl: HTMLVideoElement): void {
  if (!lastVideoFrameCache || typeof document === 'undefined') return;
  try {
    const ticks = (lastVideoFrameTicks?.get(videoEl) || 0) + 1;
    lastVideoFrameTicks?.set(videoEl, ticks);
    let cacheCanvas = lastVideoFrameCache.get(videoEl);
    if (cacheCanvas && ticks % 12 !== 1) {
      return;
    }
    const maxEdge = 480;
    const scale = Math.min(1, maxEdge / Math.max(1, videoEl.videoWidth, videoEl.videoHeight));
    const targetW = Math.max(1, Math.round(videoEl.videoWidth * scale));
    const targetH = Math.max(1, Math.round(videoEl.videoHeight * scale));
    if (
      !cacheCanvas ||
      cacheCanvas.width !== targetW ||
      cacheCanvas.height !== targetH
    ) {
      cacheCanvas = document.createElement('canvas');
      cacheCanvas.width = targetW;
      cacheCanvas.height = targetH;
      lastVideoFrameCache.set(videoEl, cacheCanvas);
    }
    const cacheCtx = cacheCanvas.getContext('2d');
    if (cacheCtx) {
      cacheCtx.drawImage(videoEl, 0, 0, cacheCanvas.width, cacheCanvas.height);
    }
  } catch {
    // ignore cross-origin or transient canvas readback restrictions
  }
}

const sharpenedImageCache =
  typeof WeakMap !== 'undefined'
    ? new WeakMap<HTMLImageElement, { key: string; canvas: HTMLCanvasElement }>()
    : null;

function getSharpenedImageSource(
  img: HTMLImageElement,
  sharpenAmount: number
): CanvasImageSource {
  if (
    !sharpenedImageCache ||
    sharpenAmount <= 0.04 ||
    typeof document === 'undefined' ||
    !img.width ||
    !img.height
  ) {
    return img;
  }
  const bucket = Math.round(sharpenAmount * 20);
  const key = `${img.width}x${img.height}_${bucket}`;
  const cached = sharpenedImageCache.get(img);
  if (cached && cached.key === key) {
    return cached.canvas;
  }

  try {
    const maxEdge = 1280;
    const scale = Math.min(1, maxEdge / Math.max(1, img.width, img.height));
    const w = Math.max(3, Math.round(img.width * scale));
    const h = Math.max(3, Math.round(img.height * scale));
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = w;
    srcCanvas.height = h;
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) return img;
    srcCtx.drawImage(img, 0, 0, w, h);
    const srcData = srcCtx.getImageData(0, 0, w, h);
    const outData = srcCtx.createImageData(w, h);
    const s = srcData.data;
    const d = outData.data;
    const strength = sharpenAmount * 1.15;

    for (let y = 0; y < h; y++) {
      const yUp = y > 0 ? y - 1 : y;
      const yDn = y < h - 1 ? y + 1 : y;
      for (let x = 0; x < w; x++) {
        const xLt = x > 0 ? x - 1 : x;
        const xRt = x < w - 1 ? x + 1 : x;
        const idx = (y * w + x) * 4;
        const up = (yUp * w + x) * 4;
        const dn = (yDn * w + x) * 4;
        const lt = (y * w + xLt) * 4;
        const rt = (y * w + xRt) * 4;

        for (let c = 0; c < 3; c++) {
          const avg = (s[up + c] + s[dn + c] + s[lt + c] + s[rt + c]) * 0.25;
          const val = s[idx + c] + (s[idx + c] - avg) * strength;
          d[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
        }
        d[idx + 3] = s[idx + 3];
      }
    }

    srcCtx.putImageData(outData, 0, 0);
    sharpenedImageCache.set(img, { key, canvas: srcCanvas });
    return srcCanvas;
  } catch {
    return img;
  }
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

  // 2. Background Video OR Image (cover fit + Ken Burns + 0-100 Brightness/Contrast/Sharpness)
  const videoEl = opts.bgVideo;
  const bgFilter = buildCanvasBackgroundFilter(
    opts.bgBrightness,
    opts.bgContrast,
    opts.bgSharpness,
    resScale
  );
  const applyBgFilter = () => {
    if ('filter' in ctx) {
      ctx.filter = bgFilter.cssFilter;
    }
  };
  const resetBgFilter = () => {
    if ('filter' in ctx) {
      ctx.filter = 'none';
    }
  };

  if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
    const rect = computeCoverDrawRect(videoEl.videoWidth, videoEl.videoHeight, width, height);
    const bleed = bgFilter.blurPx > 0.2 ? 1.04 : 1;
    const dw = rect.w * bleed;
    const dh = rect.h * bleed;
    const dx = rect.x - (dw - rect.w) / 2;
    const dy = rect.y - (dh - rect.h) / 2;
    applyBgFilter();
    ctx.drawImage(videoEl, dx, dy, dw, dh);
    resetBgFilter();
    snapshotLastVideoFrame(videoEl);
  } else if (videoEl && lastVideoFrameCache?.get(videoEl)) {
    const cachedFrame = lastVideoFrameCache.get(videoEl)!;
    if (cachedFrame.width > 0 && cachedFrame.height > 0) {
      const rect = computeCoverDrawRect(cachedFrame.width, cachedFrame.height, width, height);
      applyBgFilter();
      ctx.drawImage(cachedFrame, rect.x, rect.y, rect.w, rect.h);
      resetBgFilter();
    }
  } else if (opts.bgImage) {
    const imgSource =
      bgFilter.sharpenAmount > 0.04
        ? getSharpenedImageSource(opts.bgImage, bgFilter.sharpenAmount)
        : opts.bgImage;
    const rect = computeCoverDrawRect(opts.bgImage.width, opts.bgImage.height, width, height);
    const motionTimeSec =
      typeof opts.bgMotionTimeSec === 'number' && Number.isFinite(opts.bgMotionTimeSec)
        ? opts.bgMotionTimeSec
        : currentSec;
    const motionScale = computeGentleBackgroundMotionScale(
      motionTimeSec,
      Boolean(opts.bgImageMotion)
    );
    const kbZoom = motionScale * (bgFilter.blurPx > 0.2 ? 1.04 : 1);
    const zoomedW = rect.w * kbZoom;
    const zoomedH = rect.h * kbZoom;
    const zoomedX = rect.x - (zoomedW - rect.w) / 2;
    const zoomedY = rect.y - (zoomedH - rect.h) / 2;
    applyBgFilter();
    ctx.drawImage(imgSource, zoomedX, zoomedY, zoomedW, zoomedH);
    resetBgFilter();
  }

  // Veil OR Black Counter-Backdrop ("Contre-fond noir") to tame bright photos/videos cleanly
  if (videoEl || opts.bgImage || opts.bgBlackBackdrop) {
    const useBlackScrim = Boolean(opts.bgBlackBackdrop) || !isLightSurface;
    const rawVeil =
      typeof opts.bgVeilOpacity === 'number'
        ? Math.max(0, Math.min(0.92, opts.bgVeilOpacity))
        : isLightSurface
        ? 0.14
        : 0.28;
    const veilAlpha = opts.bgBlackBackdrop ? Math.max(0.25, rawVeil) : rawVeil;
    if (veilAlpha > 0.005) {
      ctx.fillStyle = useBlackScrim
        ? `rgba(0, 0, 0, ${veilAlpha})`
        : `rgba(255, 255, 255, ${veilAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
    if (opts.bgBlackBackdrop && typeof ctx.createRadialGradient === 'function') {
      const cx = width / 2;
      const cy = height / 2;
      const scrimGrad = ctx.createRadialGradient(
        cx,
        cy,
        Math.min(width, height) * 0.14,
        cx,
        cy,
        Math.max(width, height) * 0.72
      );
      scrimGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(0.55, veilAlpha * 0.65).toFixed(2)})`);
      scrimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
      ctx.fillStyle = scrimGrad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  const { activeIndex, segmentProgress } = findActiveTimelineEntry(timeline, currentSec);
  const isPortrait = height > width;
  const topSafeY = Math.round(
    (opts.showSurahHeader ? (isPortrait ? 146 : 114) : isPortrait ? 56 : 32) * resScale
  );
  const hasCustomLogo = Boolean(
    opts.logoImage &&
      ((opts.logoImage as any).naturalWidth || opts.logoImage.width) > 0 &&
      ((opts.logoImage as any).naturalHeight || opts.logoImage.height) > 0
  );
  const showWatermark = opts.showWatermark !== false;
  const bottomSafeY =
    height -
    Math.round(
      (hasCustomLogo
        ? isPortrait
          ? 134
          : 124
        : showWatermark
          ? isPortrait
            ? 92
            : 82
          : isPortrait
            ? 44
            : 36) * resScale
    );
  const hasMediaBg = Boolean(videoEl || opts.bgImage);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topSafeY, width, Math.max(100, bottomSafeY - topSafeY));
  ctx.clip();

  const activeBlock = layout.blocks[activeIndex] || layout.blocks[0];
  const isInitialFrame = currentSec <= 0.05;

  if (activeBlock && opts.flowMode === 'arabic_pure_khatt') {
    renderArabicPureKhattTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'french_pure_poetry') {
    renderFrenchPurePoetryTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'cinema_subtitles') {
    renderCinemaSubtitlesTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'mushaf_split') {
    renderMushafSplitTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'meditation_minimal') {
    renderMeditationMinimalTemplate(ctx, activeBlock, segmentProgress, currentSec, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'karaoke_glow') {
    renderKaraokeGlowTemplate(ctx, activeBlock, segmentProgress, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'editorial_magazine') {
    renderEditorialMagazineTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'verse_ticker') {
    renderVerseTickerTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'arabic_ruqaa_modern') {
    renderArabicRuqaaModernTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'kufi_editorial') {
    renderKufiEditorialTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'phonetics_focus') {
    renderPhoneticsFocusTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else if (activeBlock && opts.flowMode === 'arabic_giant_whisper_fr') {
    renderArabicGiantWhisperFrTemplate(ctx, activeBlock, segmentProgress, isInitialFrame, opts, resScale, topSafeY, bottomSafeY);
  } else {
    // Continuous frameless fluid scroll modes:
    // 'teleprompter', 'stream', 'night_lantern', 'dual_ribbon'
    const isNightLantern = opts.flowMode === 'night_lantern';
    const isDualRibbon = opts.flowMode === 'dual_ribbon';
    const scrollArFont =
      opts.flowMode === 'stream'
        ? "'Scheherazade New', 'Amiri', 'Traditional Arabic', serif"
        : "'Amiri', 'Traditional Arabic', serif";
    const scrollFrFont = isNightLantern
      ? "'Cormorant Garamond', Georgia, serif"
      : "'Plus Jakarta Sans', system-ui, sans-serif";

    const scrollY = computeFluidScrollYForBlocks(
      layout.blocks,
      timeline,
      currentSec,
      topSafeY,
      bottomSafeY
    );

    const horizontalPad = isLandscape ? Math.round(136 * resScale) : Math.round(56 * resScale);
    const maxLineW = Math.max(200, width - horizontalPad * 2);

    for (let i = 0; i < layout.blocks.length; i++) {
      const block = layout.blocks[i];
      const screenY = block.yStart - scrollY;

      if (screenY + block.height < topSafeY - 60 * resScale || screenY > bottomSafeY + 60 * resScale) {
        continue;
      }

      const isActive = i === activeIndex;
      const distance = Math.abs(i - activeIndex);

      let alpha = 1.0;
      if (opts.flowMode === 'teleprompter' || isNightLantern) {
        alpha = isActive ? 1.0 : distance === 1 ? 0.44 : 0.22;
      } else {
        alpha = isActive ? 1.0 : 0.68;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      if (isActive && typeof ctx.createRadialGradient === 'function') {
        const auraCx = width / 2;
        const auraCy = screenY + block.height / 2;
        const auraR = Math.max(width * (isNightLantern ? 0.54 : 0.48), block.height * 0.65);
        const auraGrad = ctx.createRadialGradient(auraCx, auraCy, 10 * resScale, auraCx, auraCy, auraR);
        if (isLightSurface) {
          auraGrad.addColorStop(0, isNightLantern ? 'rgba(4, 120, 87, 0.11)' : 'rgba(4, 120, 87, 0.06)');
          auraGrad.addColorStop(1, 'rgba(4, 120, 87, 0)');
        } else {
          auraGrad.addColorStop(0, isNightLantern ? 'rgba(251, 191, 36, 0.14)' : 'rgba(251, 191, 36, 0.08)');
          auraGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        }
        ctx.fillStyle = auraGrad;
        ctx.fillRect(0, screenY - 24 * resScale, width, block.height + 48 * resScale);
      }

      if (hasMediaBg || opts.textShadowBoost) {
        const primaryColor = opts.arabicTextColor || opts.frenchTextColor || opts.phoneticsTextColor;
        ctx.shadowColor = resolveLegibleShadowColor(
          primaryColor,
          isLightSurface,
          opts.bgBlackBackdrop
        );
        ctx.shadowBlur = Math.round((opts.textShadowBoost ? 12 : 6) * resScale);
        ctx.shadowOffsetY = Math.round((opts.textShadowBoost ? 1.5 : 1) * resScale);
      }

      if (isDualRibbon && isLandscape) {
        const padX = Math.round(92 * resScale);
        const colGap = Math.round(40 * resScale);
        const colW = (width - padX * 2 - colGap) / 2;
        const leftCenterX = padX + colW / 2;
        const rightCenterX = padX + colW + colGap + colW / 2;
        const arW = Math.max(160, Math.round((colW - 12 * resScale) * 0.94));

        let arY = screenY + Math.round(28 * resScale);
        for (const line of block.arLines) {
          drawRtlTajweedLine(ctx, line, rightCenterX, arY, opts, block.arFontPx, 'center', undefined, arW, scrollArFont);
          arY += block.arLineHeightPx;
        }

        let leftY = screenY + Math.round(28 * resScale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (block.trLines.length > 0) {
          ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
          ctx.fillStyle =
            opts.phoneticsTextColor || (isLightSurface ? '#065F46' : '#CBD5E1');
          for (const line of block.trLines) {
            fillSafeText(ctx, line, leftCenterX, leftY, arW);
            leftY += block.trLineHeightPx;
          }
          leftY += Math.round(8 * resScale);
        }
        if (block.frLines.length > 0) {
          ctx.font = `500 ${block.frFontPx}px ${scrollFrFont}`;
          ctx.fillStyle =
            opts.frenchTextColor || (isLightSurface ? '#171717' : '#F1F5F9');
          for (const line of block.frLines) {
            fillSafeText(ctx, line, leftCenterX, leftY, arW);
            leftY += block.frLineHeightPx;
          }
        }
      } else {
        let yCursor = screenY + Math.round(28 * resScale);
        const centerX = width / 2;

        for (const line of block.arLines) {
          drawRtlTajweedLine(ctx, line, centerX, yCursor, opts, block.arFontPx, 'center', undefined, maxLineW, scrollArFont);
          yCursor += block.arLineHeightPx;
        }

        if (block.arLines.length > 0 && (block.trLines.length > 0 || block.frLines.length > 0)) {
          if (isNightLantern) {
            drawRubElHizbStar(
              ctx,
              centerX,
              yCursor - Math.round(block.arLineHeightPx * 0.2),
              Math.round(7 * resScale),
              isLightSurface ? 'rgba(4, 120, 87, 0.5)' : 'rgba(251, 191, 36, 0.65)',
              Math.max(1.2, Math.round(1.3 * resScale))
            );
          } else {
            const ruleW = Math.round(90 * resScale);
            const ruleY = yCursor - Math.round(block.arLineHeightPx * 0.25);
            ctx.fillStyle = isLightSurface
              ? 'rgba(4, 120, 87, 0.2)'
              : 'rgba(251, 191, 36, 0.25)';
            ctx.fillRect(centerX - ruleW / 2, ruleY, ruleW, Math.max(1, Math.round(1.2 * resScale)));
          }
          yCursor += Math.round(14 * resScale);
        } else if (block.arLines.length > 0) {
          yCursor += Math.round(14 * resScale);
        }

        if (block.trLines.length > 0) {
          ctx.font = `italic 400 ${block.trFontPx}px Georgia, serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle =
            opts.phoneticsTextColor || (isLightSurface ? '#065F46' : '#CBD5E1');
          for (const line of block.trLines) {
            fillSafeText(ctx, line, centerX, yCursor, maxLineW);
            yCursor += block.trLineHeightPx;
          }
          yCursor += Math.round(10 * resScale);
        }

        if (block.frLines.length > 0) {
          ctx.font = `500 ${block.frFontPx}px ${scrollFrFont}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle =
            opts.frenchTextColor || (isLightSurface ? '#171717' : '#F1F5F9');
          for (const line of block.frLines) {
            fillSafeText(ctx, line, centerX, yCursor, maxLineW);
            yCursor += block.frLineHeightPx;
          }
        }
      }

      ctx.restore();
    }

    if (!hasMediaBg && typeof ctx.createLinearGradient === 'function') {
      const baseColor = opts.bgSurfaceColor || (isLightSurface ? '#FCFCFB' : '#000000');
      if (baseColor === '#000000' || baseColor === '#050505' || baseColor === '#FCFCFB') {
        const fadeH = Math.round(44 * resScale);
        const rgb = isLightSurface ? '252, 252, 251' : baseColor === '#050505' ? '5, 5, 5' : '0, 0, 0';
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
    const headerTitleY = Math.round((isPortrait ? 88 : 46) * resScale);
    const headerSubY = Math.round((isPortrait ? 116 : 72) * resScale);
    const headerMaxW = width - Math.round(64 * resScale);

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
    fillSafeText(ctx, headerText, width / 2, headerTitleY, headerMaxW);
    ctx.font = `500 ${Math.round((isLandscape ? 14 : 15) * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = isLightSurface ? 'rgba(82, 82, 82, 0.82)' : 'rgba(226, 232, 240, 0.78)';
    fillSafeText(ctx, opts.reciterName, width / 2, headerSubY, headerMaxW);
    ctx.restore();
  }

  // 6. Tier-based bottom watermark (Test/Basique) + optional custom logo
  drawMandatoryBottomWatermark(
    ctx,
    width,
    height,
    resScale,
    isLightSurface && !opts.bgBlackBackdrop,
    opts.logoImage,
    opts.showWatermark !== false
  );
}
