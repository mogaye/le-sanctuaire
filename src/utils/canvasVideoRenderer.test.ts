import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANDATORY_WATERMARK_BRAND,
  MANDATORY_WATERMARK_TAGLINE,
  VideoCanvasRenderOptions,
  precomputeVideoCanvasLayout,
  renderVideoCanvasFrame,
} from './canvasVideoRenderer';
import { buildContinuousTimeline } from './mobileVideoStudioUtils';

function createMockCanvasContext() {
  const fillTexts: Array<{ text: string; x: number; y: number }> = [];
  const fillRects: Array<{ x: number; y: number; w: number; h: number }> = [];

  const ctx: any = {
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: 'left',
    textBaseline: 'alphabetic',
    direction: 'ltr',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetY: 0,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    measureText: (txt: string) => ({ width: (txt || '').length * 10 }),
    fillText: (text: string, x: number, y: number) => {
      fillTexts.push({ text, x, y });
    },
    fillRect: (x: number, y: number, w: number, h: number) => {
      fillRects.push({ x, y, w, h });
    },
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    beginPath: () => {},
    closePath: () => {},
    rect: () => {},
    arc: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    clip: () => {},
    save: () => {},
    restore: () => {},
    drawImage: () => {},
  };

  return { ctx: ctx as CanvasRenderingContext2D, fillTexts, fillRects };
}

test('renderVideoCanvasFrame always embeds mandatory watermark at the bottom and omits progress bar & timer', () => {
  const ayahs = [
    {
      num: 1,
      ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      tr: 'Bismillaahir Rahmaanir Raheem',
      fr: 'Au nom d Allah, le Tout Misericordieux, le Tres Misericordieux.',
    },
  ];
  const timeline = buildContinuousTimeline(ayahs, [5.0], 1);

  for (const isLightSurface of [false, true]) {
    const { ctx, fillTexts, fillRects } = createMockCanvasContext();
    const opts: VideoCanvasRenderOptions = {
      width: 1080,
      height: 1920,
      surahName: 'Al-Fatiha',
      surahNumber: 1,
      startAyah: 1,
      endAyah: 1,
      isLightSurface,
      bgImage: null,
      showArabic: true,
      useTajweed: true,
      showPhonetics: true,
      showFrench: true,
      showSurahHeader: true,
      textScale: 'standard',
      flowMode: 'teleprompter',
      reciterName: 'Mishary Rashid Alafasy',
    };

    const layout = precomputeVideoCanvasLayout(ctx, ayahs, opts);
    renderVideoCanvasFrame(ctx, layout, timeline, 2.5, opts);

    const brandCall = fillTexts.find((c) => c.text === MANDATORY_WATERMARK_BRAND);
    const taglineCall = fillTexts.find((c) => c.text === MANDATORY_WATERMARK_TAGLINE);
    assert.ok(brandCall, 'Mandatory watermark brand must always be drawn');
    assert.ok(taglineCall, 'Mandatory watermark tagline must always be drawn');
    assert.ok(
      brandCall.y > opts.height * 0.85,
      `Watermark brand should be placed at the bottom (got y=${brandCall.y})`
    );

    // Ensure no timer text (MM:SS / MM:SS) is drawn anywhere
    const timerCall = fillTexts.find((c) => /\d{2}:\d{2}\s*\/\s*\d{2}:\d{2}/.test(c.text));
    assert.equal(timerCall, undefined, 'Bottom progress timer must never be drawn');

    // Ensure no thin horizontal progress bar rect is drawn near the bottom edge
    const progressBarRect = fillRects.find(
      (r) => r.y > opts.height - 120 && r.h <= 10 && r.w > opts.width * 0.2
    );
    assert.equal(progressBarRect, undefined, 'Bottom progress bar rect must never be drawn');
  }
});

test('precomputeVideoCanvasLayout scales text proportionally for Full HD 1080x1920', () => {
  const ayahs = [{ num: 1, ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ', tr: 'Qul huwallahu ahad', fr: 'Dis: Il est Allah, Unique.' }];
  const { ctx } = createMockCanvasContext();
  const baseOpts: VideoCanvasRenderOptions = {
    width: 720,
    height: 1280,
    surahName: 'Al-Ikhlas',
    surahNumber: 112,
    startAyah: 1,
    endAyah: 1,
    isLightSurface: false,
    bgImage: null,
    showArabic: true,
    useTajweed: false,
    showPhonetics: true,
    showFrench: true,
    showSurahHeader: true,
    textScale: 'standard',
    flowMode: 'teleprompter',
    reciterName: 'Alafasy',
  };

  const layout720 = precomputeVideoCanvasLayout(ctx, ayahs, baseOpts);
  const layout1080 = precomputeVideoCanvasLayout(ctx, ayahs, {
    ...baseOpts,
    width: 1080,
    height: 1920,
  });

  assert.equal(layout720.blocks[0].arFontPx, 44);
  assert.equal(layout1080.blocks[0].arFontPx, 66);

  const layoutYt1080 = precomputeVideoCanvasLayout(ctx, ayahs, {
    ...baseOpts,
    width: 1920,
    height: 1080,
  });
  // Landscape 1920x1080 uses min(w,h)/720 = 1.5 scale so typography stays balanced instead of overflowing
  assert.equal(layoutYt1080.blocks[0].arFontPx, 66);
});

test('renderVideoCanvasFrame renders cleanly in 1920x1080 YouTube 16:9 across all 6 templates', () => {
  const ayahs = [
    {
      num: 1,
      ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      tr: 'Bismillaahir Rahmaanir Raheem',
      fr: 'Au nom d Allah, le Tout Misericordieux, le Tres Misericordieux.',
    },
    {
      num: 2,
      ar: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
      tr: 'Alhamdu lillaahi Rabbil aalameen',
      fr: 'Louange a Allah, Seigneur de l univers.',
    },
  ];
  const timeline = buildContinuousTimeline(ayahs, [5.0, 5.0], 1);
  const templates: VideoCanvasRenderOptions['flowMode'][] = [
    'teleprompter',
    'stream',
    'spotlight_card',
    'cinema_subtitles',
    'mushaf_split',
    'meditation_minimal',
  ];

  for (const flowMode of templates) {
    const { ctx, fillTexts, fillRects } = createMockCanvasContext();
    const opts: VideoCanvasRenderOptions = {
      width: 1920,
      height: 1080,
      surahName: 'Al-Fatiha',
      surahNumber: 1,
      startAyah: 1,
      endAyah: 2,
      isLightSurface: false,
      bgImage: null,
      showArabic: true,
      useTajweed: true,
      showPhonetics: true,
      showFrench: true,
      showSurahHeader: true,
      textScale: 'standard',
      flowMode,
      reciterName: 'Mishary Rashid Alafasy',
    };

    const layout = precomputeVideoCanvasLayout(ctx, ayahs, opts);
    renderVideoCanvasFrame(ctx, layout, timeline, 2.5, opts);

    const brandCall = fillTexts.find((c) => c.text === MANDATORY_WATERMARK_BRAND);
    assert.ok(brandCall, `Template ${flowMode} must include mandatory watermark`);
    assert.ok(
      brandCall.y > opts.height * 0.85,
      `Template ${flowMode} watermark must stay near bottom (y=${brandCall.y})`
    );
    const timerCall = fillTexts.find((c) => /\d{2}:\d{2}\s*\/\s*\d{2}:\d{2}/.test(c.text));
    assert.equal(timerCall, undefined, `Template ${flowMode} must omit timer`);
    const progressBarRect = fillRects.find(
      (r) => r.y > opts.height - 100 && r.h <= 10 && r.w > opts.width * 0.2
    );
    assert.equal(progressBarRect, undefined, `Template ${flowMode} must omit progress bar`);
  }
});
