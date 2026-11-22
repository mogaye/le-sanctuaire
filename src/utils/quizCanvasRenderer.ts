import { QuizQuestionItem, getQuizCategoryLabel } from '../data/islamicQuizBank';
import {
  drawMandatoryBottomWatermark,
  getEffectiveResScale,
  renderVideoBackgroundLayer,
  VideoCanvasRenderOptions,
} from './canvasVideoRenderer';
import { ContinuousTimeline, wrapTextLines } from './mobileVideoStudioUtils';
import {
  DEFAULT_QUIZ_DESIGN,
  QuizVisualDesign,
  hexToRgba,
  isHexColorDark,
} from './quizDesignPresets';
import { QuizFrameState, computeQuizFrameState } from './quizVideoUtils';

export interface QuizCanvasRenderConfig {
  questions: QuizQuestionItem[];
  quizTitle?: string;
  thinkSec: number;
  revealSec: number;
  showExplanation: boolean;
  design?: QuizVisualDesign;
  useSignatureBackdrop?: boolean;
}

export interface QuizCanvasGeometry {
  resScale: number;
  isLandscape: boolean;
  isPortrait: boolean;
  padX: number;
  contentW: number;
  topSafeY: number;
  bottomSafeY: number;
  optionColumns: 1 | 2;
  optionGapX: number;
  optionGapY: number;
  optionW: number;
}

export function computeQuizCanvasGeometry(
  width: number,
  height: number,
  options: {
    showHeader: boolean;
    hasCustomLogo: boolean;
    showWatermark: boolean;
  }
): QuizCanvasGeometry {
  const resScale = getEffectiveResScale(width, height);
  const isLandscape = width > height;
  const isPortrait = height > width;

  const padX = Math.round((isLandscape ? 160 : isPortrait ? 52 : 64) * resScale);
  const contentW = Math.max(220, width - padX * 2);

  const topSafeY = Math.round(
    (options.showHeader ? (isPortrait ? 128 : 82) : isPortrait ? 52 : 34) * resScale
  );

  const bottomSafeY =
    height -
    Math.round(
      (options.hasCustomLogo
        ? isPortrait
          ? 130
          : 112
        : options.showWatermark
          ? isPortrait
            ? 92
            : 76
          : isPortrait
            ? 42
            : 30) * resScale
    );

  // Stack choices A / B / C / D cleanly beneath the Question Space in all formats
  const optionColumns: 1 | 2 = 1;
  const optionGapX = 0;
  const optionGapY = Math.round((isPortrait ? 12 : 9) * resScale);
  const optionW = contentW;

  return {
    resScale,
    isLandscape,
    isPortrait,
    padX,
    contentW,
    topSafeY,
    bottomSafeY,
    optionColumns,
    optionGapX,
    optionGapY,
    optionW,
  };
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number | undefined,
  strokeColor: string,
  strokeWidth: number
) {
  if (typeof ctx.strokeText === 'function' && strokeWidth > 0) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    if (maxWidth !== undefined) ctx.strokeText(text, x, y, maxWidth);
    else ctx.strokeText(text, x, y);
  }
  if (maxWidth !== undefined) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

/**
 * Model 1 (Download 14 - Flash List 1..N):
 * Top red header pill, bold centered active prompt -> CHRONO -> ✅ Answer,
 * and numbered list 1) .. N) accumulating revealed answers cleanly below.
 */
function renderFlashListTemplate(
  ctx: CanvasRenderingContext2D,
  quizConfig: QuizCanvasRenderConfig,
  state: QuizFrameState,
  opts: VideoCanvasRenderOptions,
  design: QuizVisualDesign,
  resScale: number,
  hasCustomLogo: boolean,
  showWatermark: boolean
) {
  const { width, height } = opts;
  const isPortrait = height > width;
  const isLandscape = width > height;
  const padX = Math.round((isLandscape ? 120 : isPortrait ? 48 : 56) * resScale);
  const contentW = Math.max(220, width - padX * 2);
  const textScaleFactor =
    opts.textScale === 'compact' ? 0.9 : opts.textScale === 'grand' ? 1.1 : 1.0;

  const titlePrefix = (quizConfig.quizTitle?.trim() || 'QUIZ ISLAM').toUpperCase();

  // 1. Top Red Pill Header
  if (opts.showSurahHeader) {
    ctx.save();
    const headerFontPx = Math.round((isPortrait ? 24 : 21) * resScale);
    ctx.font = `800 ${headerFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    const headerW = Math.min(
      contentW,
      Math.max(Math.round(230 * resScale), ctx.measureText(titlePrefix).width + Math.round(54 * resScale))
    );
    const headerH = Math.round((isPortrait ? 48 : 42) * resScale);
    const headerX = Math.round((width - headerW) / 2);
    const headerY = Math.round((isPortrait ? 52 : 28) * resScale);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.round(14 * resScale);
    ctx.shadowOffsetY = Math.round(4 * resScale);
    drawRoundedRectPath(ctx, headerX, headerY, headerW, headerH, Math.round(14 * resScale));
    ctx.fillStyle = design.accentColor || '#DC2626';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(titlePrefix, width / 2, headerY + headerH / 2 + 0.5, headerW - Math.round(20 * resScale));
    ctx.restore();
  }

  // 2. Active Question / Chrono / Reveal Prompt
  const promptTopY = Math.round(
    (opts.showSurahHeader ? (isPortrait ? 132 : 92) : isPortrait ? 64 : 36) * resScale
  );

  ctx.save();
  const promptFontPx = Math.round((isPortrait ? 30 : 25) * resScale * textScaleFactor);
  const promptLineH = Math.round(promptFontPx * 1.24);
  ctx.font = `800 ${promptFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const correctAnswerText =
    state.question.options[state.question.correctIndex] || 'Réponse';

  let promptBottomY = promptTopY;

  if (state.phase === 'question') {
    const qFormatted = state.question.question
      .replace(/\s+([?!:;])/g, '\u00A0$1')
      .toUpperCase()
      .trim();
    const lines = wrapTextLines(qFormatted, contentW * 0.94, (t) => ctx.measureText(t).width).slice(0, 3);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.round(8 * resScale);
    ctx.shadowOffsetY = Math.round(2 * resScale);
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < lines.length; i++) {
      drawOutlinedText(
        ctx,
        lines[i],
        width / 2,
        promptTopY + i * promptLineH,
        contentW * 0.96,
        '#000000',
        Math.round(5 * resScale)
      );
    }

    // Countdown badge directly below active question
    const pillY = promptTopY + lines.length * promptLineH + Math.round(12 * resScale);
    const pillW = Math.round(150 * resScale);
    const pillH = Math.round(32 * resScale);
    const pillX = Math.round((width - pillW) / 2);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fillStyle = state.countdownRemainingSec <= 2 ? design.accentColor : 'rgba(15, 23, 42, 0.8)';
    ctx.fill();
    ctx.lineWidth = Math.max(1.2, Math.round(1.8 * resScale));
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.font = `800 ${Math.round(15 * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CHRONO · ${state.countdownRemainingSec}s`, width / 2, pillY + pillH / 2 + 0.5);
    promptBottomY = pillY + pillH;
  } else {
    // Reveal Phase: ✅ + Answer headline
    const badgeSize = Math.round(36 * resScale);
    const badgeX = Math.round((width - badgeSize) / 2);
    drawRoundedRectPath(ctx, badgeX, promptTopY, badgeSize, badgeSize, Math.round(9 * resScale));
    ctx.fillStyle = '#22C55E';
    ctx.fill();
    ctx.font = `900 ${Math.round(22 * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', width / 2, promptTopY + badgeSize / 2 + 1);

    const ansY = promptTopY + badgeSize + Math.round(10 * resScale);
    ctx.font = `800 ${Math.round(promptFontPx * 1.05)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.round(8 * resScale);
    ctx.fillStyle = '#86EFAC';
    const ansLines = wrapTextLines(
      correctAnswerText.toUpperCase(),
      contentW * 0.94,
      (t) => ctx.measureText(t).width
    ).slice(0, 2);
    for (let i = 0; i < ansLines.length; i++) {
      drawOutlinedText(
        ctx,
        ansLines[i],
        width / 2,
        ansY + i * promptLineH,
        contentW * 0.96,
        '#000000',
        Math.round(5 * resScale)
      );
    }
    promptBottomY = ansY + ansLines.length * promptLineH;
  }
  ctx.restore();

  // 3. Numbered List 1) .. N) Accumulating Revealed Answers
  const bottomSafeY =
    height -
    Math.round(
      (hasCustomLogo ? (isPortrait ? 130 : 108) : showWatermark ? (isPortrait ? 92 : 76) : 34) *
        resScale
    );
  const listTopY = promptBottomY + Math.round((isPortrait ? 28 : 18) * resScale);
  const availListH = Math.max(120, bottomSafeY - listTopY);

  const totalQ = quizConfig.questions.length;
  const maxVisible = 10;
  let startIdx = 0;
  if (totalQ > maxVisible) {
    startIdx = Math.max(0, Math.min(totalQ - maxVisible, state.activeIndex - 4));
  }
  const endIdx = Math.min(totalQ, startIdx + maxVisible);
  const visibleCount = Math.max(1, endIdx - startIdx);

  const twoCols = isLandscape && visibleCount > 5;
  const rowsPerCol = twoCols ? Math.ceil(visibleCount / 2) : visibleCount;
  const rowFontPx = Math.round(
    (isPortrait ? 25 : isLandscape ? 21 : 21) * resScale * textScaleFactor
  );
  const rowStep = Math.min(
    Math.round((isPortrait ? 48 : 42) * resScale),
    Math.floor(availListH / Math.max(1, rowsPerCol))
  );

  ctx.save();
  ctx.font = `800 ${rowFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = Math.round(6 * resScale);
  ctx.shadowOffsetY = Math.round(2 * resScale);

  const colW = twoCols
    ? Math.floor((contentW - Math.round(32 * resScale)) / 2)
    : isLandscape
      ? Math.min(contentW, Math.round(620 * resScale))
      : contentW;
  const baseLeftX = twoCols
    ? padX + Math.round(16 * resScale)
    : isLandscape
      ? Math.round((width - colW) / 2)
      : padX + Math.round(16 * resScale);

  for (let vi = 0; vi < visibleCount; vi++) {
    const qIdx = startIdx + vi;
    const item = quizConfig.questions[qIdx];
    const col = twoCols ? Math.floor(vi / rowsPerCol) : 0;
    const row = twoCols ? vi % rowsPerCol : vi;
    const x = baseLeftX + col * (colW + Math.round(32 * resScale));
    const y = listTopY + row * rowStep + rowStep / 2;

    const isRevealedItem =
      qIdx < state.activeIndex ||
      (qIdx === state.activeIndex && state.phase === 'reveal');
    const isCurrent = qIdx === state.activeIndex;
    const answerStr =
      isRevealedItem && item
        ? item.options[item.correctIndex] || ''
        : '';

    const lineText = isRevealedItem ? `${qIdx + 1}) ${answerStr}` : `${qIdx + 1})`;
    ctx.fillStyle =
      isCurrent && state.phase === 'reveal'
        ? '#86EFAC'
        : isCurrent
          ? '#FDE047'
          : '#FFFFFF';

    drawOutlinedText(
      ctx,
      lineText,
      x,
      y,
      colW - Math.round(12 * resScale),
      '#000000',
      Math.round(4.5 * resScale)
    );
  }
  ctx.restore();

  drawMandatoryBottomWatermark(
    ctx,
    width,
    height,
    resScale,
    opts.isLightSurface,
    opts.logoImage,
    showWatermark
  );
}

/**
 * Model 2 (Download 12 - Carte Blanche & Chrono Circulaire):
 * Bold 3D header, crisp white Question box with circular '?' badge overlapping top edge,
 * pure white pill choices (winner turns bright green on reveal), and bottom circular pie timer.
 */
function renderCarteBlancheTemplate(
  ctx: CanvasRenderingContext2D,
  quizConfig: QuizCanvasRenderConfig,
  state: QuizFrameState,
  opts: VideoCanvasRenderOptions,
  design: QuizVisualDesign,
  resScale: number,
  hasCustomLogo: boolean,
  showWatermark: boolean
) {
  const { width, height } = opts;
  const isPortrait = height > width;
  const isLandscape = width > height;
  const padX = Math.round((isLandscape ? 190 : isPortrait ? 52 : 68) * resScale);
  const contentW = Math.max(220, width - padX * 2);
  const textScaleFactor =
    opts.textScale === 'compact' ? 0.9 : opts.textScale === 'grand' ? 1.1 : 1.0;

  const titlePrefix = (quizConfig.quizTitle?.trim() || 'QUIZ ISLAM').toUpperCase();
  const bottomSafeY =
    height -
    Math.round(
      (hasCustomLogo ? (isPortrait ? 130 : 108) : showWatermark ? (isPortrait ? 92 : 76) : 34) *
        resScale
    );

  // 1. Chunky 3D Header
  const topHeaderY = Math.round((isPortrait ? 56 : 30) * resScale);
  if (opts.showSurahHeader) {
    ctx.save();
    const hPx = Math.round((isPortrait ? 38 : 30) * resScale);
    ctx.font = `900 ${hPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.round(10 * resScale);
    ctx.shadowOffsetY = Math.round(4 * resScale);
    ctx.fillStyle = '#FFFFFF';
    drawOutlinedText(
      ctx,
      titlePrefix,
      width / 2,
      topHeaderY,
      contentW,
      '#111827',
      Math.round(6 * resScale)
    );
    ctx.restore();
  }

  const stageTopY = Math.round(
    (opts.showSurahHeader ? (isPortrait ? 138 : 88) : isPortrait ? 58 : 34) * resScale
  );
  const stageH = Math.max(180, bottomSafeY - stageTopY);

  // Measure Question inside white card
  const formattedQ = state.question.question.replace(/\s+([?!:;])/g, '\u00A0$1').trim();
  const qFontPx = Math.round((isPortrait ? 27 : 23) * resScale * textScaleFactor);
  const qLineH = Math.round(qFontPx * 1.28);
  const qPadX = Math.round(28 * resScale);
  const qPadTop = Math.round((isPortrait ? 32 : 24) * resScale);
  const qPadBot = Math.round((isPortrait ? 22 : 16) * resScale);
  const qMaxW = Math.max(150, contentW - qPadX * 2);

  ctx.save();
  ctx.font = `800 ${qFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const qLines = wrapTextLines(formattedQ, qMaxW, (t) => ctx.measureText(t).width).slice(0, 4);
  ctx.restore();

  const qCardH = Math.max(
    Math.round(78 * resScale),
    qLines.length * qLineH + qPadTop + qPadBot
  );
  const qBadgeR = Math.round((isPortrait ? 21 : 17) * resScale);

  // Choice Pills
  const optFontPx = Math.round((isPortrait ? 22 : 18) * resScale * textScaleFactor);
  const optLineH = Math.round(optFontPx * 1.2);
  const optH = Math.round((isPortrait ? 60 : 46) * resScale);
  const optGap = Math.round((isPortrait ? 14 : 9) * resScale);
  const optGridH = 4 * optH + 3 * optGap;
  const gapAfterQ = Math.round((isPortrait ? 24 : 14) * resScale);

  // Bottom Countdown Pie
  const pieR = Math.round((isPortrait ? 38 : 26) * resScale);
  const gapBeforePie = Math.round((isPortrait ? 24 : 14) * resScale);
  const pieAreaH = pieR * 2;

  const totalH = qBadgeR + qCardH + gapAfterQ + optGridH + gapBeforePie + pieAreaH;
  const startY = stageTopY + Math.max(0, Math.round((stageH - totalH) / 2)) + qBadgeR;

  // 2. Draw White Question Card
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = Math.round(18 * resScale);
  ctx.shadowOffsetY = Math.round(6 * resScale);
  drawRoundedRectPath(ctx, padX, startY, contentW, qCardH, Math.round(20 * resScale));
  ctx.fillStyle = design.cardBgColor || '#FFFFFF';
  ctx.fill();

  // Overlapping '?' circle on top edge
  ctx.shadowBlur = Math.round(10 * resScale);
  ctx.beginPath();
  ctx.arc(width / 2, startY, qBadgeR, 0, Math.PI * 2);
  ctx.fillStyle = '#3F3A36';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, Math.round(2 * resScale));
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.font = `900 ${Math.round(qBadgeR * 1.05)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', width / 2, startY + 1);

  // Question Text
  ctx.font = `800 ${qFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = design.questionTextColor || '#111827';
  ctx.textBaseline = 'top';
  const qTextY = startY + qPadTop + Math.max(0, (qCardH - qPadTop - qPadBot - qLines.length * qLineH) / 2);
  for (let i = 0; i < qLines.length; i++) {
    ctx.fillText(qLines[i], width / 2, qTextY + i * qLineH, qMaxW);
  }
  ctx.restore();

  // 3. Draw Pure White Pill Choice Cards
  const optStartY = startY + qCardH + gapAfterQ;
  const isReveal = state.phase === 'reveal';
  const revealPulse = isReveal ? Math.min(1, state.revealProgress * 5) : 0;

  for (let i = 0; i < 4; i++) {
    const isCorrect = i === state.question.correctIndex;
    const pillY = optStartY + i * (optH + optGap);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = Math.round(12 * resScale);
    ctx.shadowOffsetY = Math.round(4 * resScale);
    drawRoundedRectPath(ctx, padX, pillY, contentW, optH, optH / 2);

    if (isReveal && isCorrect) {
      ctx.fillStyle = design.accentColor || '#22C55E';
      ctx.fill();
    } else if (isReveal) {
      const fadeAmt = revealPulse;
      ctx.fillStyle = hexToRgba(design.cardBgColor || '#FFFFFF', 1 - 0.34 * fadeAmt);
      ctx.fill();
    } else {
      ctx.fillStyle = design.cardBgColor || '#FFFFFF';
      ctx.fill();
    }

    ctx.shadowColor = 'transparent';
    ctx.font = `800 ${optFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (isReveal && isCorrect) {
      ctx.fillStyle = isHexColorDark(design.accentColor || '#22C55E') ? '#FFFFFF' : '#0F172A';
    } else if (isReveal) {
      ctx.fillStyle = hexToRgba(design.questionTextColor || '#111827', 0.56);
    } else {
      ctx.fillStyle = design.questionTextColor || '#111827';
    }
    const rawOpt = state.question.options[i] || '';
    const labelText = isReveal && isCorrect ? `✓  ${rawOpt}` : rawOpt;
    ctx.fillText(labelText, width / 2, pillY + optH / 2 + 0.5, contentW - Math.round(36 * resScale));
    ctx.restore();
  }

  // 4. Bottom Radial Pie Countdown OR Wrapped Reveal Note
  const pieCy = optStartY + optGridH + gapBeforePie + pieR;
  if (!isReveal) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, pieCy, pieR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();

    // Sweeping dark wedge
    ctx.beginPath();
    ctx.moveTo(width / 2, pieCy);
    ctx.arc(
      width / 2,
      pieCy,
      pieR - Math.round(3 * resScale),
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * state.countdownFraction
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fill();

    ctx.lineWidth = Math.max(2, Math.round(3 * resScale));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(width / 2, pieCy, pieR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `900 ${Math.round(pieR * 0.95)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawOutlinedText(
      ctx,
      String(state.countdownRemainingSec),
      width / 2,
      pieCy + 1,
      undefined,
      '#111827',
      Math.round(4 * resScale)
    );
    ctx.restore();
  } else if (quizConfig.showExplanation && state.question.explanation) {
    ctx.save();
    const expW = Math.min(contentW, Math.round(640 * resScale));
    const expFontPx = Math.round((isPortrait ? 15.5 : 14) * resScale);
    const expLineH = Math.round(expFontPx * 1.32);
    const expMaxTextW = Math.max(160, expW - Math.round(32 * resScale));
    ctx.font = `600 ${expFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    const expLines = wrapTextLines(
      state.question.explanation,
      expMaxTextW,
      (t) => ctx.measureText(t).width
    ).slice(0, 2);
    const expH = Math.max(
      Math.round(38 * resScale),
      expLines.length * expLineH + Math.round(18 * resScale)
    );
    const expX = Math.round((width - expW) / 2);
    const expY = Math.min(
      bottomSafeY - expH - Math.round(6 * resScale),
      Math.round(pieCy - expH / 2)
    );
    drawRoundedRectPath(ctx, expX, expY, expW, expH, Math.round(14 * resScale));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const firstExpY = expY + Math.round((expH - expLines.length * expLineH) / 2);
    for (let li = 0; li < expLines.length; li++) {
      ctx.fillText(expLines[li], width / 2, firstExpY + li * expLineH, expMaxTextW);
    }
    ctx.restore();
  }

  drawMandatoryBottomWatermark(
    ctx,
    width,
    height,
    resScale,
    opts.isLightSurface,
    opts.logoImage,
    showWatermark
  );
}

/**
 * Model 3 (Download 11 - Émeraude & Cadre Illustration):
 * Teal-bordered crisp white Question box, centered illustration/vignette window
 * with stopwatch badge in top-right, and teal-outlined white pill choices below.
 */
function renderEmeraudeCadreTemplate(
  ctx: CanvasRenderingContext2D,
  quizConfig: QuizCanvasRenderConfig,
  state: QuizFrameState,
  opts: VideoCanvasRenderOptions,
  design: QuizVisualDesign,
  resScale: number,
  hasCustomLogo: boolean,
  showWatermark: boolean
) {
  const { width, height } = opts;
  const isPortrait = height > width;
  const isLandscape = width > height;

  // If using default studio dark surface, render signature organic emerald/teal blob background
  const hasCustomMedia = Boolean(opts.bgImage || opts.bgVideo);
  const isFallbackDefaultDark =
    !hasCustomMedia &&
    (!opts.bgSurfaceColor ||
      ['#050505', '#080c0a', '#06261b'].includes(opts.bgSurfaceColor.toLowerCase()));

  if (quizConfig.useSignatureBackdrop || isFallbackDefaultDark) {
    ctx.save();
    ctx.fillStyle = '#117A70';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0B4F4A';
    ctx.beginPath();
    ctx.arc(width * 0.14, height * 0.16, Math.min(width, height) * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.86, height * 0.84, Math.min(width, height) * 0.38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(45, 212, 191, 0.24)';
    ctx.beginPath();
    ctx.arc(width * 0.82, height * 0.28, Math.min(width, height) * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.18, height * 0.72, Math.min(width, height) * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const padX = Math.round((isLandscape ? 170 : isPortrait ? 52 : 64) * resScale);
  const contentW = Math.max(220, width - padX * 2);
  const textScaleFactor =
    opts.textScale === 'compact' ? 0.9 : opts.textScale === 'grand' ? 1.1 : 1.0;

  const topSafeY = Math.round((isPortrait ? 64 : 30) * resScale);
  const bottomSafeY =
    height -
    Math.round(
      (hasCustomLogo ? (isPortrait ? 130 : 108) : showWatermark ? (isPortrait ? 92 : 76) : 34) *
        resScale
    );
  const stageH = Math.max(180, bottomSafeY - topSafeY);

  // Measure Question Box
  const formattedQ = state.question.question.replace(/\s+([?!:;])/g, '\u00A0$1').trim();
  const qFontPx = Math.round((isPortrait ? 27 : 22.5) * resScale * textScaleFactor);
  const qLineH = Math.round(qFontPx * 1.28);
  const qPadX = Math.round(24 * resScale);
  const qPadY = Math.round((isPortrait ? 20 : 13) * resScale);
  const qMaxW = Math.max(150, contentW - qPadX * 2);

  ctx.save();
  ctx.font = `800 ${qFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const qLines = wrapTextLines(formattedQ, qMaxW, (t) => ctx.measureText(t).width).slice(0, 4);
  ctx.restore();

  const qCardH = Math.max(
    Math.round(74 * resScale),
    qLines.length * qLineH + qPadY * 2
  );

  // Center illustration / stopwatch vignette rendered cleanly in ALL formats (9:16, 1:1, 16:9)
  const vignetteH = Math.round((isPortrait ? 148 : isLandscape ? 78 : 96) * resScale);
  const vignetteW = Math.round(contentW * (isPortrait ? 0.72 : isLandscape ? 0.56 : 0.68));
  const gap1 = Math.round((isPortrait ? 22 : 12) * resScale);
  const gap2 = Math.round((isPortrait ? 24 : 12) * resScale);

  // Stacked pill options
  const optFontPx = Math.round((isPortrait ? 22 : 18) * resScale * textScaleFactor);
  const optH = Math.round((isPortrait ? 60 : 46) * resScale);
  const optGap = Math.round((isPortrait ? 14 : 9) * resScale);
  const optGridH = 4 * optH + 3 * optGap;

  const totalH = qCardH + gap1 + vignetteH + gap2 + optGridH;
  const startY = topSafeY + Math.max(0, Math.round((stageH - totalH) / 2));

  const borderTeal = design.borderColor || '#5EEAD4';
  const accentTeal = design.accentColor || '#14B8A6';

  // 1. White Question Card with Teal Border
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = Math.round(14 * resScale);
  ctx.shadowOffsetY = Math.round(4 * resScale);
  drawRoundedRectPath(ctx, padX, startY, contentW, qCardH, Math.round(24 * resScale));
  ctx.fillStyle = design.cardBgColor || '#FFFFFF';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(2.5, Math.round(4 * resScale));
  ctx.strokeStyle = borderTeal;
  ctx.stroke();

  ctx.font = `800 ${qFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = design.questionTextColor || '#0F172A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const qTextY = startY + (qCardH - qLines.length * qLineH) / 2;
  for (let i = 0; i < qLines.length; i++) {
    ctx.fillText(qLines[i], width / 2, qTextY + i * qLineH, qMaxW);
  }
  ctx.restore();

  // 2. Vignette Window + Animated Stopwatch Overlay
  const vigY = startY + qCardH + gap1;
  const vigX = Math.round((width - vignetteW) / 2);

  ctx.save();
  drawRoundedRectPath(ctx, vigX, vigY, vignetteW, vignetteH, Math.round(18 * resScale));
  ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, Math.round(3 * resScale));
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // Category / Quiz Title badge inside vignette window
  ctx.font = `700 ${Math.round((isPortrait ? 14 : 12.5) * resScale)}px 'Cinzel', 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = '#99F6E4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const catName = getQuizCategoryLabel(state.question.category).toUpperCase();
  ctx.fillText(
    `${(quizConfig.quizTitle || 'QUIZ ISLAM').toUpperCase()} · ${state.activeIndex + 1}/${state.totalQuestions}`,
    width / 2,
    vigY + vignetteH * 0.36,
    vignetteW - Math.round(32 * resScale)
  );
  ctx.font = `700 ${Math.round((isPortrait ? 17 : 15) * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(
    state.phase === 'reveal' ? '✓ Bonne réponse' : catName,
    width / 2,
    vigY + vignetteH * 0.66,
    vignetteW - Math.round(32 * resScale)
  );

  // Stopwatch circle in top-right of vignette during countdown
  const watchR = Math.round((isPortrait ? 24 : 19) * resScale);
  const watchCx = vigX + vignetteW - watchR * 0.32;
  const watchCy = vigY + watchR * 0.32;
  ctx.beginPath();
  ctx.arc(watchCx, watchCy, watchR, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = Math.max(2, Math.round(3.5 * resScale));
  ctx.strokeStyle = state.phase === 'reveal' ? '#10B981' : '#1E293B';
  ctx.stroke();

  ctx.font = `900 ${Math.round((isPortrait ? 16 : 14) * resScale)}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = state.phase === 'reveal' ? '#047857' : '#0F172A';
  ctx.fillText(
    state.phase === 'reveal' ? '✓' : `${state.countdownRemainingSec}`,
    watchCx,
    watchCy + 1
  );
  ctx.restore();

  // 3. Stacked Pill Options with Teal Outline
  const optStartY = vigY + vignetteH + gap2;
  const isReveal = state.phase === 'reveal';
  const revealPulse = isReveal ? Math.min(1, state.revealProgress * 5) : 0;

  for (let i = 0; i < 4; i++) {
    const isCorrect = i === state.question.correctIndex;
    const pillY = optStartY + i * (optH + optGap);

    ctx.save();
    if (isReveal && !isCorrect) {
      ctx.globalAlpha = 1 - 0.32 * revealPulse;
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = Math.round(10 * resScale);
    ctx.shadowOffsetY = Math.round(4 * resScale);
    drawRoundedRectPath(ctx, padX, pillY, contentW, optH, optH / 2);

    if (isReveal && isCorrect) {
      ctx.fillStyle = accentTeal;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = Math.max(2, Math.round(3.5 * resScale));
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    } else {
      ctx.fillStyle = design.cardBgColor || '#FFFFFF';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = Math.max(2, Math.round(3.5 * resScale));
      ctx.strokeStyle = borderTeal;
      ctx.stroke();
    }

    ctx.font = `800 ${optFontPx}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle =
      isReveal && isCorrect ? '#FFFFFF' : design.questionTextColor || '#0F172A';
    const rawOpt = state.question.options[i] || '';
    const displayLabel = isReveal && isCorrect ? `✓  ${rawOpt}` : rawOpt;
    ctx.fillText(displayLabel, width / 2, pillY + optH / 2 + 0.5, contentW - Math.round(36 * resScale));
    ctx.restore();
  }

  drawMandatoryBottomWatermark(
    ctx,
    width,
    height,
    resScale,
    opts.isLightSurface,
    opts.logoImage,
    showWatermark
  );
}

export function renderQuizCanvasFrame(
  ctx: CanvasRenderingContext2D,
  quizConfig: QuizCanvasRenderConfig,
  timeline: ContinuousTimeline,
  currentSec: number,
  opts: VideoCanvasRenderOptions
) {
  const { width, height, isLightSurface } = opts;
  const resScale = renderVideoBackgroundLayer(ctx, currentSec, opts);

  const hasCustomLogo = Boolean(
    opts.logoImage &&
      ((opts.logoImage as any).naturalWidth || opts.logoImage.width) > 0 &&
      ((opts.logoImage as any).naturalHeight || opts.logoImage.height) > 0
  );
  const showWatermark = opts.showWatermark !== false;
  const design = quizConfig.design || DEFAULT_QUIZ_DESIGN;

  const state = computeQuizFrameState(
    quizConfig.questions,
    timeline,
    currentSec,
    quizConfig.thinkSec,
    quizConfig.revealSec
  );

  if (!state) {
    drawMandatoryBottomWatermark(
      ctx,
      width,
      height,
      resScale,
      isLightSurface,
      opts.logoImage,
      showWatermark
    );
    return;
  }

  // Dispatch to the 3 viral TikTok / Shorts template models if selected
  if (design.templateStyle === 'flash_list') {
    renderFlashListTemplate(
      ctx,
      quizConfig,
      state,
      opts,
      design,
      resScale,
      hasCustomLogo,
      showWatermark
    );
    return;
  }
  if (design.templateStyle === 'carte_blanche') {
    renderCarteBlancheTemplate(
      ctx,
      quizConfig,
      state,
      opts,
      design,
      resScale,
      hasCustomLogo,
      showWatermark
    );
    return;
  }
  if (design.templateStyle === 'emeraude_cadre') {
    renderEmeraudeCadreTemplate(
      ctx,
      quizConfig,
      state,
      opts,
      design,
      resScale,
      hasCustomLogo,
      showWatermark
    );
    return;
  }

  // Default 'classic' Sanctuaire layout
  const cardIsDark = isHexColorDark(design.cardBgColor);

  const geom = computeQuizCanvasGeometry(width, height, {
    showHeader: opts.showSurahHeader,
    hasCustomLogo,
    showWatermark,
  });

  const textScaleFactor =
    opts.textScale === 'compact' ? 0.9 : opts.textScale === 'grand' ? 1.1 : 1.0;

  const fontFamily =
    design.fontStyle === 'serif'
      ? "'Amiri', 'Cinzel', Georgia, serif"
      : "'Plus Jakarta Sans', system-ui, sans-serif";
  const questionFontWeight = design.fontStyle === 'bold_display' ? '800' : '700';

  const primaryTextColor = opts.frenchTextColor || design.questionTextColor;
  const mutedTextColor = cardIsDark
    ? 'rgba(226, 232, 240, 0.86)'
    : 'rgba(51, 65, 85, 0.88)';
  const accentColor = design.accentColor;
  const accentGoldColor = design.goldColor;

  const applySoftTextShadow = () => {
    if (opts.textShadowBoost !== false) {
      ctx.shadowColor = cardIsDark
        ? 'rgba(0, 0, 0, 0.72)'
        : 'rgba(255, 255, 255, 0.55)';
      ctx.shadowBlur = Math.round(9 * resScale);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = Math.round(2 * resScale);
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
  };

  // 1. Optional Header: Quiz Islam · Question X / N · Category
  if (opts.showSurahHeader) {
    ctx.save();
    const headerFontPx = Math.round(15 * resScale);
    ctx.font = `700 ${headerFontPx}px ${
      design.fontStyle === 'serif' ? "'Cinzel', Georgia, serif" : "'Plus Jakarta Sans', system-ui, sans-serif"
    }`;

    const categoryLabel = getQuizCategoryLabel(state.question.category).toUpperCase();
    const titlePrefix = quizConfig.quizTitle?.trim()
      ? quizConfig.quizTitle.trim().toUpperCase()
      : 'QUIZ ISLAM';
    const headerText = `${titlePrefix}  ·  ${state.activeIndex + 1} / ${state.totalQuestions}  ·  ${categoryLabel}`;
    const headerY = Math.round((geom.isPortrait ? 86 : 46) * resScale);
    const measuredHeaderW = Math.min(
      geom.contentW,
      ctx.measureText(headerText).width + Math.round(36 * resScale)
    );
    const headerPillH = Math.round(30 * resScale);

    drawRoundedRectPath(
      ctx,
      Math.round((width - measuredHeaderW) / 2),
      Math.round(headerY - headerPillH / 2),
      measuredHeaderW,
      headerPillH,
      design.optionShape === 'sharp' ? Math.round(6 * resScale) : headerPillH / 2
    );
    ctx.fillStyle = hexToRgba(design.cardBgColor, Math.min(0.88, design.cardOpacity));
    ctx.fill();
    ctx.lineWidth = Math.max(1, Math.round(1.2 * resScale));
    ctx.strokeStyle = hexToRgba(design.borderColor, 0.36);
    ctx.stroke();

    applySoftTextShadow();
    ctx.fillStyle = accentGoldColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      headerText,
      width / 2,
      headerY + 0.5,
      Math.max(120, measuredHeaderW - Math.round(24 * resScale))
    );
    ctx.restore();
  }

  // 2. Compute Stage Metrics within Safe Bounds
  const stageTopY = geom.topSafeY;
  const stageH = Math.max(180, geom.bottomSafeY - stageTopY);

  const formattedQuestion = state.question.question
    .replace(/\s+([?!:;])/g, '\u00A0$1')
    .trim();
  const baseQuestionPx = geom.isLandscape ? 25 : geom.isPortrait ? 28 : 25;
  const questionFontPx = Math.round(baseQuestionPx * resScale * textScaleFactor);
  const questionLineH = Math.round(questionFontPx * 1.3);
  const qCardPadX = Math.round((geom.isPortrait ? 22 : 26) * resScale);
  const qCardPadY = Math.round((geom.isPortrait ? 18 : 14) * resScale);
  const qTextMaxW = Math.max(160, geom.contentW - qCardPadX * 2);

  ctx.save();
  ctx.font = `${questionFontWeight} ${questionFontPx}px ${fontFamily}`;
  const questionLines = wrapTextLines(
    formattedQuestion,
    qTextMaxW,
    (txt) => ctx.measureText(txt).width
  ).slice(0, 4);
  ctx.restore();

  const questionCardH = Math.max(
    Math.round(64 * resScale),
    questionLines.length * questionLineH + qCardPadY * 2
  );

  const statusBarH = Math.round((geom.isPortrait ? 40 : 34) * resScale);
  const gapAfterQuestion = Math.round((geom.isPortrait ? 18 : 13) * resScale);
  const gapAfterStatus = Math.round((geom.isPortrait ? 16 : 12) * resScale);

  const optFontPx = Math.round(
    (geom.isPortrait ? 21 : 18.5) * resScale * textScaleFactor
  );
  const optLineH = Math.round(optFontPx * 1.24);
  const optBadgeR = Math.round((geom.isPortrait ? 17 : 15) * resScale);
  const optPadX = Math.round(16 * resScale);
  const optPadY = Math.round((geom.isPortrait ? 11 : 9) * resScale);
  const optTextMaxW = Math.max(
    90,
    geom.optionW - optPadX * 2 - optBadgeR * 2 - Math.round(14 * resScale)
  );

  ctx.save();
  ctx.font = `600 ${optFontPx}px ${fontFamily}`;
  const optionLayouts = state.question.options.map((optText) => {
    const lines = wrapTextLines(optText, optTextMaxW, (txt) => ctx.measureText(txt).width).slice(
      0,
      2
    );
    const neededH = Math.max(
      optBadgeR * 2 + optPadY * 2,
      lines.length * optLineH + optPadY * 2
    );
    return { lines, neededH };
  });
  ctx.restore();

  const rowHeight = Math.max(
    Math.round((geom.isPortrait ? 62 : 50) * resScale),
    ...optionLayouts.map((o) => o.neededH)
  );

  const optionRowsCount = 4;
  const optionsGridH =
    optionRowsCount * rowHeight + (optionRowsCount - 1) * geom.optionGapY;

  let explanationLines: string[] = [];
  const expFontPx = Math.round((geom.isPortrait ? 16.5 : 15) * resScale);
  const expLineH = Math.round(expFontPx * 1.36);
  const expInnerPadX = Math.round(24 * resScale);
  const expTextMaxW = Math.max(150, geom.contentW - expInnerPadX * 2);
  if (
    state.phase === 'reveal' &&
    quizConfig.showExplanation &&
    state.question.explanation
  ) {
    ctx.save();
    ctx.font = `500 ${expFontPx}px ${fontFamily}`;
    explanationLines = wrapTextLines(
      state.question.explanation,
      expTextMaxW,
      (txt) => ctx.measureText(txt).width
    ).slice(0, 2);
    ctx.restore();
  }
  const explanationGap =
    explanationLines.length > 0 ? Math.round((geom.isPortrait ? 18 : 12) * resScale) : 0;
  const explanationBoxH =
    explanationLines.length > 0
      ? explanationLines.length * expLineH + Math.round((geom.isPortrait ? 24 : 18) * resScale)
      : 0;

  const totalBlockH =
    questionCardH +
    gapAfterQuestion +
    statusBarH +
    gapAfterStatus +
    optionsGridH +
    explanationGap +
    explanationBoxH;

  const blockStartY =
    stageTopY + Math.max(Math.round(4 * resScale), Math.round((stageH - totalBlockH) / 2));

  // 3. Draw Dedicated Espace Question Card
  ctx.save();
  const qCardRadius =
    design.optionShape === 'sharp'
      ? Math.round(6 * resScale)
      : design.optionShape === 'pill'
        ? Math.round(24 * resScale)
        : Math.round(18 * resScale);

  if (design.questionBoxStyle === 'minimal') {
    ctx.fillStyle = hexToRgba(accentColor, 0.72);
    const barMiniW = Math.min(Math.round(160 * resScale), geom.contentW * 0.4);
    ctx.fillRect(
      Math.round((width - barMiniW) / 2),
      blockStartY + questionCardH - Math.round(4 * resScale),
      barMiniW,
      Math.max(2, Math.round(3 * resScale))
    );
  } else if (design.questionBoxStyle === 'banner') {
    drawRoundedRectPath(ctx, geom.padX, blockStartY, geom.contentW, questionCardH, qCardRadius);
    ctx.fillStyle = hexToRgba(design.cardBgColor, Math.min(0.94, design.cardOpacity + 0.08));
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, Math.round(2 * resScale));
    ctx.strokeStyle = hexToRgba(accentColor, 0.65);
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.fillRect(
      geom.padX + Math.round(28 * resScale),
      blockStartY,
      Math.max(40, geom.contentW - Math.round(56 * resScale)),
      Math.max(3, Math.round(4 * resScale))
    );
  } else if (design.questionBoxStyle === 'double_gold') {
    drawRoundedRectPath(ctx, geom.padX, blockStartY, geom.contentW, questionCardH, qCardRadius);
    ctx.fillStyle = hexToRgba(design.cardBgColor, design.cardOpacity);
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, Math.round(2 * resScale));
    ctx.strokeStyle = hexToRgba(design.borderColor, 0.75);
    ctx.stroke();

    const inset = Math.round(5 * resScale);
    drawRoundedRectPath(
      ctx,
      geom.padX + inset,
      blockStartY + inset,
      geom.contentW - inset * 2,
      questionCardH - inset * 2,
      Math.max(2, qCardRadius - inset)
    );
    ctx.lineWidth = Math.max(1, Math.round(1 * resScale));
    ctx.strokeStyle = hexToRgba(design.goldColor, 0.42);
    ctx.stroke();
  } else {
    drawRoundedRectPath(ctx, geom.padX, blockStartY, geom.contentW, questionCardH, qCardRadius);
    ctx.fillStyle = hexToRgba(design.cardBgColor, design.cardOpacity);
    ctx.fill();
    ctx.lineWidth = Math.max(1.2, Math.round(1.6 * resScale));
    ctx.strokeStyle = hexToRgba(design.borderColor, 0.4);
    ctx.stroke();
  }

  applySoftTextShadow();
  ctx.font = `${questionFontWeight} ${questionFontPx}px ${fontFamily}`;
  ctx.fillStyle = primaryTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const qTextTotalH = questionLines.length * questionLineH;
  const qTextStartY = blockStartY + (questionCardH - qTextTotalH) / 2;
  for (let i = 0; i < questionLines.length; i++) {
    ctx.fillText(questionLines[i], width / 2, qTextStartY + i * questionLineH, qTextMaxW);
  }
  ctx.restore();

  // 4. Countdown Timer OR Reveal Indicator
  const statusY = blockStartY + questionCardH + gapAfterQuestion;
  const barW = Math.min(Math.round(460 * resScale), geom.contentW * 0.92);
  const barX = Math.round((width - barW) / 2);

  if (state.phase === 'question') {
    const activeTimerColor =
      state.countdownRemainingSec <= 2 ? accentGoldColor : accentColor;
    const centerY = statusY + Math.round(statusBarH / 2);
    ctx.save();

    if (design.timerStyle === 'pill_badge') {
      const pillW = Math.min(Math.round(136 * resScale), geom.contentW * 0.42);
      const pillH = Math.round(30 * resScale);
      const pillX = Math.round((width - pillW) / 2);
      const pillY = Math.round(centerY - pillH / 2);

      drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = hexToRgba(activeTimerColor, 0.22);
      ctx.fill();
      ctx.lineWidth = Math.max(1.2, Math.round(1.5 * resScale));
      ctx.strokeStyle = activeTimerColor;
      ctx.stroke();

      ctx.font = `800 ${Math.round(14.5 * resScale)}px ${fontFamily}`;
      ctx.fillStyle = primaryTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${state.countdownRemainingSec} s`, width / 2, centerY + 0.5);
    } else if (design.timerStyle === 'bar_only') {
      const trackW = Math.max(120, barW - Math.round(46 * resScale));
      const trackH = Math.round(10 * resScale);
      const trackY = Math.round(centerY - trackH / 2);

      drawRoundedRectPath(ctx, barX, trackY, trackW, trackH, trackH / 2);
      ctx.fillStyle = cardIsDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(15, 23, 42, 0.12)';
      ctx.fill();

      const fillW = Math.max(trackH, Math.round(trackW * state.countdownFraction));
      drawRoundedRectPath(ctx, barX, trackY, fillW, trackH, trackH / 2);
      ctx.fillStyle = activeTimerColor;
      ctx.fill();

      ctx.font = `800 ${Math.round(15 * resScale)}px ${fontFamily}`;
      ctx.fillStyle = activeTimerColor;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${state.countdownRemainingSec}s`, barX + barW, centerY + 0.5);
    } else {
      const circleR = Math.round(17 * resScale);
      const circleX = barX + circleR;

      ctx.lineWidth = Math.max(2.5, Math.round(3.5 * resScale));
      ctx.strokeStyle = cardIsDark
        ? 'rgba(255, 255, 255, 0.18)'
        : 'rgba(15, 23, 42, 0.14)';
      ctx.beginPath();
      ctx.arc(circleX, centerY, circleR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = activeTimerColor;
      ctx.beginPath();
      ctx.arc(
        circleX,
        centerY,
        circleR,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * state.countdownFraction
      );
      ctx.stroke();

      ctx.font = `800 ${Math.round(15 * resScale)}px ${fontFamily}`;
      ctx.fillStyle = primaryTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(state.countdownRemainingSec), circleX, centerY + 0.5);

      const trackX = circleX + circleR + Math.round(14 * resScale);
      const trackW = Math.max(80, barX + barW - trackX);
      const trackH = Math.round(10 * resScale);
      const trackY = Math.round(centerY - trackH / 2);

      drawRoundedRectPath(ctx, trackX, trackY, trackW, trackH, trackH / 2);
      ctx.fillStyle = cardIsDark
        ? 'rgba(255, 255, 255, 0.16)'
        : 'rgba(15, 23, 42, 0.12)';
      ctx.fill();

      const fillW = Math.max(trackH, Math.round(trackW * state.countdownFraction));
      drawRoundedRectPath(ctx, trackX, trackY, fillW, trackH, trackH / 2);
      ctx.fillStyle = activeTimerColor;
      ctx.fill();
    }

    ctx.restore();
  } else {
    const fadeIn = Math.min(1, state.revealProgress * 4.5);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * fadeIn;
    const badgeW = Math.min(Math.round(230 * resScale), geom.contentW * 0.72);
    const badgeH = Math.round(32 * resScale);
    const badgeX = Math.round((width - badgeW) / 2);
    const badgeY = Math.round(statusY + (statusBarH - badgeH) / 2);

    drawRoundedRectPath(
      ctx,
      badgeX,
      badgeY,
      badgeW,
      badgeH,
      design.optionShape === 'sharp' ? Math.round(6 * resScale) : badgeH / 2
    );
    ctx.fillStyle = accentColor;
    ctx.fill();

    ctx.font = `700 ${Math.round(14 * resScale)}px ${fontFamily}`;
    ctx.fillStyle = isHexColorDark(accentColor) ? '#FFFFFF' : '#0F172A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓  Bonne réponse', width / 2, badgeY + badgeH / 2);
    ctx.restore();
  }

  // 5. Options A / B / C / D
  const optionsStartY = statusY + statusBarH + gapAfterStatus;

  const optionCornerRadius =
    design.optionShape === 'pill'
      ? rowHeight / 2
      : design.optionShape === 'sharp'
        ? Math.round(6 * resScale)
        : Math.round(15 * resScale);

  const revealTextIsWhite = isHexColorDark(accentColor);

  for (let i = 0; i < 4; i++) {
    const cardX = geom.padX;
    const cardY = optionsStartY + i * (rowHeight + geom.optionGapY);

    const isReveal = state.phase === 'reveal';
    const isCorrect = i === state.question.correctIndex;
    const revealPulse = isReveal ? Math.min(1, state.revealProgress * 5) : 0;

    ctx.save();
    if (isReveal && !isCorrect) {
      ctx.globalAlpha = 1 - 0.54 * revealPulse;
    }

    drawRoundedRectPath(ctx, cardX, cardY, geom.optionW, rowHeight, optionCornerRadius);

    if (isReveal && isCorrect) {
      ctx.fillStyle = hexToRgba(accentColor, 0.94);
      ctx.fill();
      ctx.lineWidth = Math.max(2, Math.round(2.5 * resScale));
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    } else if (design.optionShape === 'outline') {
      ctx.fillStyle = hexToRgba(design.cardBgColor, Math.min(0.32, design.cardOpacity * 0.45));
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, Math.round(1.8 * resScale));
      ctx.strokeStyle = hexToRgba(design.borderColor, 0.55);
      ctx.stroke();
    } else {
      ctx.fillStyle = hexToRgba(design.cardBgColor, Math.max(0.42, design.cardOpacity - 0.06));
      ctx.fill();
      ctx.lineWidth = Math.max(1, Math.round(1.4 * resScale));
      ctx.strokeStyle = cardIsDark
        ? hexToRgba(design.borderColor, 0.24)
        : 'rgba(15, 23, 42, 0.14)';
      ctx.stroke();
    }

    const letterCx = cardX + optPadX + optBadgeR;
    const letterCy = cardY + rowHeight / 2;
    const badgeSize = optBadgeR * 2;
    const badgeLeft = letterCx - optBadgeR;
    const badgeTop = letterCy - optBadgeR;

    if (design.badgeShape === 'rounded_square') {
      drawRoundedRectPath(
        ctx,
        badgeLeft,
        badgeTop,
        badgeSize,
        badgeSize,
        Math.round(8 * resScale)
      );
    } else {
      ctx.beginPath();
      ctx.arc(letterCx, letterCy, optBadgeR, 0, Math.PI * 2);
    }

    if (isReveal && isCorrect) {
      ctx.fillStyle = revealTextIsWhite ? '#FFFFFF' : '#0F172A';
    } else if (design.badgeShape === 'solid_pill') {
      ctx.fillStyle = hexToRgba(accentColor, 0.28);
    } else {
      ctx.fillStyle = cardIsDark
        ? 'rgba(255, 255, 255, 0.14)'
        : hexToRgba(accentColor, 0.14);
    }
    ctx.fill();

    ctx.font = `800 ${Math.round(15 * resScale)}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle =
      isReveal && isCorrect
        ? accentColor
        : cardIsDark
          ? '#F8FAFC'
          : accentColor;
    ctx.fillText(
      isReveal && isCorrect ? '✓' : OPTION_LETTERS[i],
      letterCx,
      letterCy + 0.5
    );

    const textX = letterCx + optBadgeR + Math.round(14 * resScale);
    const lines = optionLayouts[i].lines;
    const textTotalH = lines.length * optLineH;
    const firstLineY = cardY + (rowHeight - textTotalH) / 2;

    ctx.font = `600 ${optFontPx}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle =
      isReveal && isCorrect
        ? revealTextIsWhite
          ? '#FFFFFF'
          : '#0F172A'
        : primaryTextColor;
    for (let li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], textX, firstLineY + li * optLineH, optTextMaxW);
    }

    ctx.restore();
  }

  // 6. Optional Explanation Note
  if (explanationLines.length > 0) {
    const expY = optionsStartY + optionsGridH + explanationGap;
    const fadeIn = Math.min(1, state.revealProgress * 3.5);
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.85 * fadeIn;
    drawRoundedRectPath(
      ctx,
      geom.padX,
      expY,
      geom.contentW,
      explanationBoxH,
      design.optionShape === 'sharp' ? Math.round(6 * resScale) : Math.round(14 * resScale)
    );
    ctx.fillStyle = hexToRgba(design.cardBgColor, Math.max(0.55, design.cardOpacity - 0.05));
    ctx.fill();
    ctx.lineWidth = Math.max(1, Math.round(1.2 * resScale));
    ctx.strokeStyle = hexToRgba(accentColor, 0.34);
    ctx.stroke();

    ctx.font = `500 ${expFontPx}px ${fontFamily}`;
    ctx.fillStyle = mutedTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const textStartY = expY + Math.round(13 * resScale);
    for (let li = 0; li < explanationLines.length; li++) {
      ctx.fillText(
        explanationLines[li],
        width / 2,
        textStartY + li * expLineH,
        expTextMaxW
      );
    }
    ctx.restore();
  }

  // 7. Mandatory Footer Watermark & Custom Logo
  drawMandatoryBottomWatermark(
    ctx,
    width,
    height,
    resScale,
    isLightSurface,
    opts.logoImage,
    showWatermark
  );
}
