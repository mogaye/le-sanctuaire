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
import { computeQuizFrameState } from './quizVideoUtils';

export interface QuizCanvasRenderConfig {
  questions: QuizQuestionItem[];
  quizTitle?: string;
  thinkSec: number;
  revealSec: number;
  showExplanation: boolean;
  design?: QuizVisualDesign;
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

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

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
  const cardIsDark = isHexColorDark(design.cardBgColor);

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

  // Measure Question Text (bind trailing French punctuation with NBSP to avoid orphan '?' / '!')
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

  // Timer / Reveal Status Row
  const statusBarH = Math.round((geom.isPortrait ? 40 : 34) * resScale);
  const gapAfterQuestion = Math.round((geom.isPortrait ? 18 : 13) * resScale);
  const gapAfterStatus = Math.round((geom.isPortrait ? 16 : 12) * resScale);

  // Options Text Sizing & Row Heights (stacked beneath the Question Space)
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

  // Explanation box during reveal phase
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

  // Vertical centering inside safe stage
  const blockStartY =
    stageTopY + Math.max(Math.round(4 * resScale), Math.round((stageH - totalBlockH) / 2));

  // 3. Draw Dedicated Espace Question Card according to design.questionBoxStyle
  ctx.save();
  const qCardRadius =
    design.optionShape === 'sharp'
      ? Math.round(6 * resScale)
      : design.optionShape === 'pill'
        ? Math.round(24 * resScale)
        : Math.round(18 * resScale);

  if (design.questionBoxStyle === 'minimal') {
    // Clean minimal top & bottom rule framing the question without solid box fill
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

    // Accent top bar inside banner
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
    // 'framed'
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

  // 4. Draw Countdown Timer OR Reveal Indicator according to design.timerStyle
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
      // 'bar_circle'
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
    // Reveal Phase Badge ("✓ Bonne réponse")
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

  // 5. Draw Options A / B / C / D stacked beneath the Question Space
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

    // Letter Badge (A / B / C / D)
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

    // Option Text
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

  // 6. Optional Explanation Note during Reveal Phase
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
