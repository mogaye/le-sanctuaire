import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuestionsByPackId } from '../data/islamicQuizBank';
import { buildQuizTimeline } from './quizVideoUtils';
import {
  computeQuizCanvasGeometry,
  renderQuizCanvasFrame,
} from './quizCanvasRenderer';
import { VideoCanvasRenderOptions } from './canvasVideoRenderer';

function createMockCanvasContext() {
  const filledTexts: string[] = [];
  const ctx: any = {
    font: '16px sans-serif',
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    globalAlpha: 1,
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    textAlign: 'left',
    textBaseline: 'top',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    arc() {},
    rect() {},
    clip() {},
    fill() {},
    stroke() {},
    fillRect() {},
    drawImage() {},
    measureText(text: string) {
      return { width: (text || '').length * 9 };
    },
    fillText(text: string) {
      filledTexts.push(String(text));
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
  };
  return { ctx: ctx as CanvasRenderingContext2D, filledTexts };
}

test('computeQuizCanvasGeometry stacks choices cleanly in 1 column beneath the question space across 9:16, 1:1, and 16:9', () => {
  const portrait = computeQuizCanvasGeometry(1080, 1920, {
    showHeader: true,
    hasCustomLogo: false,
    showWatermark: true,
  });
  assert.equal(portrait.optionColumns, 1);
  assert.equal(portrait.isPortrait, true);
  assert.ok(portrait.bottomSafeY > portrait.topSafeY + 900);

  const square = computeQuizCanvasGeometry(1080, 1080, {
    showHeader: true,
    hasCustomLogo: false,
    showWatermark: true,
  });
  assert.equal(square.optionColumns, 1);
  assert.equal(square.isLandscape, false);

  const landscape = computeQuizCanvasGeometry(1920, 1080, {
    showHeader: true,
    hasCustomLogo: false,
    showWatermark: true,
  });
  assert.equal(landscape.optionColumns, 1);
  assert.equal(landscape.isLandscape, true);
  assert.equal(landscape.optionW, landscape.contentW);
  assert.ok(landscape.bottomSafeY - landscape.topSafeY > 700);
});

test('renderQuizCanvasFrame renders question countdown and reveal phase cleanly without throwing', () => {
  const questions = getQuestionsByPackId('pack_decouverte');
  const timeline = buildQuizTimeline(questions, 5, 3, 1);

  const opts: VideoCanvasRenderOptions = {
    width: 1080,
    height: 1920,
    surahName: 'Quiz Islam',
    surahNumber: 1,
    startAyah: 1,
    endAyah: 3,
    isLightSurface: false,
    bgSurfaceColor: '#050505',
    bgImage: null,
    showArabic: false,
    useTajweed: false,
    showPhonetics: false,
    showFrench: true,
    showSurahHeader: true,
    textScale: 'standard',
    flowMode: 'teleprompter',
    reciterName: '',
    showWatermark: true,
  };

  const config = {
    questions,
    quizTitle: 'Quiz Islam',
    thinkSec: 5,
    revealSec: 3,
    showExplanation: true,
  };

  // Phase 1: Question countdown at t=1.2s
  const mock1 = createMockCanvasContext();
  renderQuizCanvasFrame(mock1.ctx, config, timeline, 1.2, opts);
  assert.ok(mock1.filledTexts.some((t) => t.includes('QUIZ ISLAM')));
  assert.ok(mock1.filledTexts.includes('4')); // 4s left on 5s timer at t=1.2s
  assert.ok(!mock1.filledTexts.some((t) => t.includes('Bonne réponse')));

  // Phase 2: Reveal phase at t=5.8s
  const mock2 = createMockCanvasContext();
  renderQuizCanvasFrame(mock2.ctx, config, timeline, 5.8, opts);
  assert.ok(mock2.filledTexts.some((t) => t.includes('Bonne réponse')));
  assert.ok(mock2.filledTexts.includes('✓'));
});
