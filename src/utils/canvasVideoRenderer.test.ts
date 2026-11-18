import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANDATORY_WATERMARK_BRAND,
  MANDATORY_WATERMARK_TAGLINE,
  VideoCanvasRenderOptions,
  buildCanvasBackgroundFilter,
  computeBottomFooterMetrics,
  computeBottomRightLogoRect,
  computeGentleBackgroundMotionScale,
  precomputeVideoCanvasLayout,
  renderVideoCanvasFrame,
  resolveLegibleShadowColor,
} from './canvasVideoRenderer';
import { VIDEO_TEMPLATE_PRESETS, buildContinuousTimeline } from './mobileVideoStudioUtils';

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
      brandCall.y > opts.height * 0.9,
      `Watermark brand should stay placed near bottom (got y=${brandCall.y})`
    );
    assert.ok(
      Math.abs(taglineCall.x - opts.width / 2) <= 2,
      `Standalone watermark must be horizontally centered at bottom (got tagline.x=${taglineCall.x})`
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

test('renderVideoCanvasFrame renders cleanly in 1920x1080, 1080x1920, and 1080x1080 across ALL 16 templates', () => {
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
  const templates = VIDEO_TEMPLATE_PRESETS.map((t) => t.id);
  assert.equal(templates.length, 16);

  const dimensions: Array<[number, number]> = [
    [1920, 1080],
    [1080, 1920],
    [1080, 1080],
  ];

  for (const [width, height] of dimensions) {
    for (const flowMode of templates) {
      const { ctx, fillTexts, fillRects } = createMockCanvasContext();
      const opts: VideoCanvasRenderOptions = {
        width,
        height,
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
      assert.ok(brandCall, `Template ${flowMode} (${width}x${height}) must include mandatory watermark`);
      assert.ok(
        brandCall.y > opts.height * 0.85,
        `Template ${flowMode} (${width}x${height}) watermark must stay near bottom (y=${brandCall.y})`
      );
      const timerCall = fillTexts.find((c) => /\d{2}:\d{2}\s*\/\s*\d{2}:\d{2}/.test(c.text));
      assert.equal(timerCall, undefined, `Template ${flowMode} must omit timer`);
      const progressBarRect = fillRects.find(
        (r) => r.y > opts.height - 100 && r.h <= 10 && r.w > opts.width * 0.2
      );
      assert.equal(progressBarRect, undefined, `Template ${flowMode} must omit progress bar`);

      for (const call of fillTexts) {
        assert.ok(call.x >= 0 && call.x <= width, `Text x out of bounds on ${flowMode}: ${call.x}`);
        assert.ok(call.y >= 0 && call.y <= height, `Text y out of bounds on ${flowMode}: ${call.y}`);
      }
    }
  }
});

test('ultra-long verses (e.g. Ayat al-Kursi & 2:282) never overflow horizontally or escape card/viewport bounds across all 16 templates', () => {
  const ultraLongAyahs = [
    {
      num: 255,
      ar: Array.from({ length: 40 }, () => 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ').join(' '),
      tr: Array.from({ length: 40 }, () => 'Allaahu laaa ilaaha illaa Huwal Haiyul Qaiyoom').join(' '),
      fr: Array.from(
        { length: 40 },
        () => 'Allah! Point de divinite a part Lui, le Vivant, Celui qui subsiste par lui-meme.'
      ).join(' '),
    },
    {
      num: 256,
      ar: 'لَا إِكْرَاهَ فِي الدِّينِ قَد تَّبَيَّنَ الرُّشْدُ مِنَ الْغَيِّ',
      tr: 'Laaa ikraaha fid deeni qat tabaiyanar rushdu minal ghaiy',
      fr: 'Nulle contrainte en religion! Car le bon chemin s est distingue de l egarement.',
    },
  ];

  const timeline = buildContinuousTimeline(ultraLongAyahs, [24.0, 6.0], 1);
  const templates = VIDEO_TEMPLATE_PRESETS.map((t) => t.id);

  for (const [width, height] of [
    [1920, 1080],
    [1080, 1920],
  ] as Array<[number, number]>) {
    for (const flowMode of templates) {
      const early = createMockCanvasContext();
      const late = createMockCanvasContext();
      const opts: VideoCanvasRenderOptions = {
        width,
        height,
        surahName: 'Al-Baqarah',
        surahNumber: 2,
        startAyah: 255,
        endAyah: 256,
        isLightSurface: false,
        bgImage: null,
        showArabic: true,
        useTajweed: true,
        showPhonetics: true,
        showFrench: true,
        showSurahHeader: true,
        textScale: 'grand',
        flowMode,
        reciterName: 'Mishary Rashid Alafasy',
      };

      const layout = precomputeVideoCanvasLayout(early.ctx, ultraLongAyahs, opts);
      assert.ok(
        layout.blocks[0].yStart + layout.blocks[0].height < layout.blocks[1].yStart,
        `Blocks must never collide vertically in ${flowMode} (${width}x${height})`
      );

      for (const line of layout.blocks[0].arLines) {
        assert.ok(line.length * 10 <= width, `Arabic line exceeded canvas width in ${flowMode}`);
      }
      for (const line of layout.blocks[0].frLines) {
        assert.ok(line.length * 10 <= width, `French line exceeded canvas width in ${flowMode}`);
      }

      renderVideoCanvasFrame(early.ctx, layout, timeline, 2.0, opts);
      renderVideoCanvasFrame(late.ctx, layout, timeline, 20.0, opts);

      const earlyYs = early.fillTexts.map((c) => c.y).join(',');
      const lateYs = late.fillTexts.map((c) => c.y).join(',');
      assert.notEqual(
        earlyYs,
        lateYs,
        `Long verse in ${flowMode} (${width}x${height}) must pan/scroll smoothly over time for fluid reading`
      );
    }
  }
});

test('renderVideoCanvasFrame renders Bismillah intro cleanly without verse 0 labels', () => {
  const seq = [
    {
      num: 0,
      isBismillah: true,
      audioSurahNum: 1,
      audioAyahNum: 1,
      ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      tr: 'Bismillaahir Rahmaanir Raheem',
      fr: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux.",
    },
    {
      num: 1,
      ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      tr: 'Qul huwallahu ahad',
      fr: 'Dis: Il est Allah, Unique.',
    },
  ];
  const timeline = buildContinuousTimeline(seq, [4.5, 4.5], 1);

  for (const flowMode of ['french_pure_poetry', 'kufi_editorial', 'mushaf_split', 'teleprompter'] as const) {
    const { ctx, fillTexts } = createMockCanvasContext();
    const opts: VideoCanvasRenderOptions = {
      width: 1920,
      height: 1080,
      surahName: 'Al-Ikhlas',
      surahNumber: 112,
      startAyah: 1,
      endAyah: 1,
      isLightSurface: false,
      bgImage: null,
      showArabic: true,
      useTajweed: true,
      showPhonetics: true,
      showFrench: true,
      showSurahHeader: true,
      textScale: 'standard',
      flowMode,
      reciterName: 'Alafasy',
    };

    const layout = precomputeVideoCanvasLayout(ctx, seq, opts);
    renderVideoCanvasFrame(ctx, layout, timeline, 1.5, opts);

    assert.equal(
      fillTexts.some((c) => /VERSET 0|AYAH 0|﴿0﴾|^0\./.test(c.text)),
      false,
      `Template ${flowMode} must never display verse 0 for Bismillah`
    );
    if (flowMode === 'french_pure_poetry' || flowMode === 'kufi_editorial' || flowMode === 'mushaf_split') {
      assert.ok(
        fillTexts.some((c) => c.text === 'BISMILLAH'),
        `Template ${flowMode} should display BISMILLAH badge`
      );
    }
  }
});

test('arabic_pure_khatt renders ONLY Arabic and french_pure_poetry renders ONLY French regardless of toggles', () => {
  const ayahs = [
    {
      num: 1,
      ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      tr: 'Qul huwal laahu ahad',
      fr: 'Dis : Il est Allah, Unique.',
    },
  ];
  const timeline = buildContinuousTimeline(ayahs, [5.0], 1);

  const arabicOnlyCtx = createMockCanvasContext();
  const arabicFontsUsed = new Set<string>();
  const origArFontDescriptor = Object.getOwnPropertyDescriptor(arabicOnlyCtx.ctx, 'font');
  let capturedArFont = '';
  Object.defineProperty(arabicOnlyCtx.ctx, 'font', {
    get: () => capturedArFont,
    set: (v: string) => {
      capturedArFont = v;
      arabicFontsUsed.add(v);
    },
  });
  if (origArFontDescriptor && !origArFontDescriptor.configurable) {
    // noop safeguard
  }

  const baseOpts: VideoCanvasRenderOptions = {
    width: 1920,
    height: 1080,
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
    showSurahHeader: false,
    textScale: 'standard',
    flowMode: 'arabic_pure_khatt',
    reciterName: 'Alafasy',
  };

  const arLayout = precomputeVideoCanvasLayout(arabicOnlyCtx.ctx, ayahs, baseOpts);
  renderVideoCanvasFrame(arabicOnlyCtx.ctx, arLayout, timeline, 2.5, baseOpts);

  const arTexts = arabicOnlyCtx.fillTexts.map((c) => c.text).join(' ');
  assert.ok(arTexts.includes('قُلْ'), 'arabic_pure_khatt must render Arabic verse text');
  assert.equal(arTexts.includes('Qul'), false, 'arabic_pure_khatt must omit phonetics');
  assert.equal(arTexts.includes('Unique'), false, 'arabic_pure_khatt must omit French translation');
  assert.ok(
    Array.from(arabicFontsUsed).some((f) => f.includes('Scheherazade New')),
    'arabic_pure_khatt must use Scheherazade New calligraphy font'
  );

  const frenchOnlyCtx = createMockCanvasContext();
  const frenchFontsUsed = new Set<string>();
  let capturedFrFont = '';
  Object.defineProperty(frenchOnlyCtx.ctx, 'font', {
    get: () => capturedFrFont,
    set: (v: string) => {
      capturedFrFont = v;
      frenchFontsUsed.add(v);
    },
  });

  const frOpts: VideoCanvasRenderOptions = {
    ...baseOpts,
    flowMode: 'french_pure_poetry',
  };
  const frLayout = precomputeVideoCanvasLayout(frenchOnlyCtx.ctx, ayahs, frOpts);
  renderVideoCanvasFrame(frenchOnlyCtx.ctx, frLayout, timeline, 2.5, frOpts);

  const frTexts = frenchOnlyCtx.fillTexts.map((c) => c.text).join(' ');
  assert.ok(frTexts.includes('Unique'), 'french_pure_poetry must render French translation');
  assert.equal(frTexts.includes('قُلْ'), false, 'french_pure_poetry must omit Arabic text');
  assert.equal(frTexts.includes('Qul'), false, 'french_pure_poetry must omit phonetics');
  assert.ok(
    Array.from(frenchFontsUsed).some((f) => f.includes('Cormorant Garamond')),
    'french_pure_poetry must use Cormorant Garamond serif font'
  );
});

test('new typographic templates use distinct webfont families and render zero enclosing card boxes', () => {
  const ayahs = [
    {
      num: 1,
      ar: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
      tr: 'Alhamdu lillaahi Rabbil aalameen',
      fr: 'Louange a Allah, Seigneur des mondes.',
    },
  ];
  const timeline = buildContinuousTimeline(ayahs, [5.0], 1);

  const expectedFonts: Array<[VideoCanvasRenderOptions['flowMode'], string]> = [
    ['arabic_ruqaa_modern', 'Aref Ruqaa'],
    ['kufi_editorial', 'Noto Kufi Arabic'],
    ['phonetics_focus', 'Cormorant Garamond'],
    ['arabic_giant_whisper_fr', 'Scheherazade New'],
  ];

  for (const [flowMode, expectedFont] of expectedFonts) {
    const mock = createMockCanvasContext();
    const fontsUsed = new Set<string>();
    let curFont = '';
    Object.defineProperty(mock.ctx, 'font', {
      get: () => curFont,
      set: (v: string) => {
        curFont = v;
        fontsUsed.add(v);
      },
    });

    const opts: VideoCanvasRenderOptions = {
      width: 1920,
      height: 1080,
      surahName: 'Al-Fatiha',
      surahNumber: 1,
      startAyah: 1,
      endAyah: 1,
      isLightSurface: false,
      bgImage: null,
      showArabic: true,
      useTajweed: false,
      showPhonetics: true,
      showFrench: true,
      showSurahHeader: false,
      textScale: 'standard',
      flowMode,
      reciterName: 'Alafasy',
    };

    const layout = precomputeVideoCanvasLayout(mock.ctx, ayahs, opts);
    renderVideoCanvasFrame(mock.ctx, layout, timeline, 2.5, opts);

    assert.ok(
      Array.from(fontsUsed).some((f) => f.includes(expectedFont)),
      `Template ${flowMode} must apply ${expectedFont} font`
    );

    // Ensure no medium/large card box fillRect is drawn inside content area (only full canvas bg 1920x1080 is allowed)
    const boxRect = mock.fillRects.find(
      (r) => !(r.x === 0 && r.y === 0 && r.w === 1920 && r.h === 1080) && r.w > 200 && r.h > 80
    );
    assert.equal(boxRect, undefined, `Frameless template ${flowMode} must not draw enclosing card rectangles`);
  }
});

test('renderVideoCanvasFrame dynamically updates top header Surah name when multi-surah timeline advances', () => {
  const seq = [
    {
      num: 1,
      surahNumber: 112,
      surahName: 'Al-Ikhlas',
      ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      tr: 'Qul huwallahu ahad',
      fr: 'Dis: Il est Allah, Unique.',
    },
    {
      num: 1,
      surahNumber: 113,
      surahName: 'Al-Falaq',
      ar: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ',
      tr: 'Qul aoodhu bi rabbil falaq',
      fr: 'Dis: Je cherche protection auprès du Seigneur de l aube naissante.',
    },
  ];
  const timeline = buildContinuousTimeline(seq, [5.0, 5.0], 1);
  const opts: VideoCanvasRenderOptions = {
    width: 1080,
    height: 1920,
    surahName: 'Al-Ikhlas',
    surahNumber: 112,
    startAyah: 1,
    endAyah: 1,
    selectedSurahsCount: 2,
    isLightSurface: false,
    bgImage: null,
    showArabic: true,
    useTajweed: true,
    showPhonetics: true,
    showFrench: true,
    showSurahHeader: true,
    textScale: 'standard',
    flowMode: 'teleprompter',
    reciterName: 'Alafasy',
  };

  const first = createMockCanvasContext();
  const layout = precomputeVideoCanvasLayout(first.ctx, seq, opts);
  renderVideoCanvasFrame(first.ctx, layout, timeline, 2.0, opts);
  assert.ok(first.fillTexts.some((c) => c.text.includes('Al-Ikhlas (112)')));

  const second = createMockCanvasContext();
  renderVideoCanvasFrame(second.ctx, layout, timeline, 7.0, opts);
  assert.ok(second.fillTexts.some((c) => c.text.includes('Al-Falaq (113)')));
});

test('renderVideoCanvasFrame draws bgVideo frames instead of falling back to static cover and handles >3 min timelines', () => {
  const ayahs = Array.from({ length: 42 }, (_, i) => ({
    num: (i % 7) + 1,
    ar: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
    tr: `Verset ${i + 1}`,
    fr: `Traduction du verset ${i + 1}`,
  }));
  const timeline = buildContinuousTimeline(
    ayahs,
    ayahs.map(() => 5.0),
    1
  );
  assert.equal(timeline.totalDurationSec, 210);

  const drawImageCalls: any[] = [];
  const { ctx } = createMockCanvasContext();
  (ctx as any).drawImage = (...args: any[]) => {
    drawImageCalls.push(args);
  };

  const mockBgVideo: any = {
    readyState: 4,
    videoWidth: 1280,
    videoHeight: 720,
  };
  const mockBgImage: any = {
    width: 1280,
    height: 720,
  };

  const opts: VideoCanvasRenderOptions = {
    width: 1080,
    height: 1920,
    surahName: 'Al-Fatiha',
    surahNumber: 1,
    startAyah: 1,
    endAyah: 7,
    isLightSurface: false,
    bgImage: mockBgImage,
    bgVideo: mockBgVideo,
    showArabic: true,
    useTajweed: true,
    showPhonetics: true,
    showFrench: true,
    showSurahHeader: true,
    textScale: 'standard',
    flowMode: 'teleprompter',
    reciterName: 'Alafasy',
  };

  const layout = precomputeVideoCanvasLayout(ctx, ayahs, opts);
  renderVideoCanvasFrame(ctx, layout, timeline, 195.0, opts);

  assert.ok(drawImageCalls.length >= 1, 'Expected bgVideo drawImage call');
  assert.equal(drawImageCalls[0][0], mockBgVideo, 'Ready bgVideo must be drawn instead of static cover');
});

test('buildCanvasBackgroundFilter maps 0..100 brightness, contrast, and sharpness accurately', () => {
  const neutral = buildCanvasBackgroundFilter(50, 50, 50);
  assert.equal(neutral.cssFilter, 'none');
  assert.equal(neutral.blurPx, 0);
  assert.equal(neutral.sharpenAmount, 0);

  const dimmedSoft = buildCanvasBackgroundFilter(0, 25, 0);
  assert.ok(dimmedSoft.cssFilter.includes('brightness(0.35)'));
  assert.ok(dimmedSoft.cssFilter.includes('contrast(0.70)'));
  assert.ok(dimmedSoft.cssFilter.includes('blur('));
  assert.ok(dimmedSoft.blurPx > 0);
  assert.equal(dimmedSoft.sharpenAmount, 0);

  const crispHigh = buildCanvasBackgroundFilter(100, 100, 100);
  assert.ok(crispHigh.cssFilter.includes('brightness(1.75)'));
  assert.ok(crispHigh.cssFilter.includes('contrast(1.80)'));
  assert.equal(crispHigh.blurPx, 0);
  assert.equal(crispHigh.sharpenAmount, 1);

  assert.equal(resolveLegibleShadowColor('#0F172A', false, false), 'rgba(255, 255, 255, 0.88)');
  assert.equal(resolveLegibleShadowColor('#FBBF24', true, false), 'rgba(0, 0, 0, 0.9)');
  assert.equal(resolveLegibleShadowColor('#FFFFFF', true, true), 'rgba(0, 0, 0, 0.92)');
});

test('custom Arabic, Phonetics, and French text colors and black counter-backdrop apply cleanly across boxed and scroll templates', () => {
  const ayahs = [
    {
      num: 1,
      ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      tr: 'Qul huwallahu ahad',
      fr: 'Dis: Il est Allah, Unique.',
    },
  ];
  const timeline = buildContinuousTimeline(ayahs, [5.0], 1);

  for (const flowMode of ['teleprompter', 'kufi_editorial', 'dual_ribbon'] as const) {
    const { ctx } = createMockCanvasContext();
    const fillStylesUsed = new Set<string>();
    const fillStyleAssignments: Array<{ fillStyle: string; text?: string }> = [];
    let currentFillStyle = '';
    Object.defineProperty(ctx, 'fillStyle', {
      get: () => currentFillStyle,
      set: (v: string) => {
        currentFillStyle = v;
        if (typeof v === 'string') fillStylesUsed.add(v);
      },
    });
    const origFillText = ctx.fillText;
    ctx.fillText = (text: string, x: number, y: number) => {
      fillStyleAssignments.push({ fillStyle: currentFillStyle, text });
      return origFillText(text, x, y);
    };

    const opts: VideoCanvasRenderOptions = {
      width: 1920,
      height: 1080,
      surahName: 'Al-Ikhlas',
      surahNumber: 112,
      startAyah: 1,
      endAyah: 1,
      isLightSurface: true,
      bgBlackBackdrop: true,
      bgVeilOpacity: 0.45,
      arabicTextColor: '#FBBF24',
      phoneticsTextColor: '#93C5FD',
      frenchTextColor: '#A7F3D0',
      bgImage: { width: 1280, height: 720 } as any,
      showArabic: true,
      useTajweed: false,
      showPhonetics: true,
      showFrench: true,
      showSurahHeader: false,
      textScale: 'standard',
      flowMode,
      reciterName: 'Alafasy',
    };

    const layout = precomputeVideoCanvasLayout(ctx, ayahs, opts);
    renderVideoCanvasFrame(ctx, layout, timeline, 2.5, opts);

    assert.ok(
      fillStyleAssignments.some((c) => c.text?.includes('قُلْ') && c.fillStyle === '#FBBF24'),
      `${flowMode}: Arabic line must use custom arabicTextColor`
    );
    assert.ok(
      fillStyleAssignments.some((c) => c.text?.includes('Qul') && c.fillStyle === '#93C5FD'),
      `${flowMode}: Phonetics line must use custom phoneticsTextColor`
    );
    assert.ok(
      fillStyleAssignments.some((c) => c.text?.includes('Unique') && c.fillStyle === '#A7F3D0'),
      `${flowMode}: French line must use custom frenchTextColor`
    );
    assert.ok(
      Array.from(fillStylesUsed).some((s) => s.startsWith('rgba(0, 0, 0,')),
      `${flowMode}: bgBlackBackdrop must draw black scrim even on light surface`
    );
  }
});

test('computeGentleBackgroundMotionScale creates slow subtle zoom-dezoom cycles until video end when enabled', () => {
  assert.equal(computeGentleBackgroundMotionScale(9, false), 1);
  assert.equal(computeGentleBackgroundMotionScale(0, true), 1);

  const midZoomIn = computeGentleBackgroundMotionScale(4.5, true);
  const peakZoom = computeGentleBackgroundMotionScale(9, true);
  const midZoomOut = computeGentleBackgroundMotionScale(13.5, true);
  const cycleEnd = computeGentleBackgroundMotionScale(18, true);
  const secondCyclePeak = computeGentleBackgroundMotionScale(27, true);
  const secondCycleEnd = computeGentleBackgroundMotionScale(36, true);

  assert.ok(midZoomIn > 1 && midZoomIn < peakZoom, 'Zoom-in should ease upward gently');
  assert.ok(peakZoom > 1.04 && peakZoom <= 1.06, `Peak zoom must stay subtle (got ${peakZoom})`);
  assert.ok(midZoomOut > 1 && midZoomOut < peakZoom, 'Zoom-out should return gently');
  assert.ok(Math.abs(cycleEnd - 1) < 1e-5, `Cycle end at 18s must return cleanly to 1.0 (got ${cycleEnd})`);
  assert.ok(Math.abs(secondCyclePeak - peakZoom) < 1e-5, 'Second cycle peak should repeat smoothly');
  assert.ok(Math.abs(secondCycleEnd - 1) < 1e-5, 'Second cycle end should return cleanly to 1.0');

  const ayahs = [
    {
      num: 1,
      ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      tr: 'Qul huwallahu ahad',
      fr: 'Dis: Il est Allah, Unique.',
    },
  ];
  const timeline = buildContinuousTimeline(ayahs, [30.0], 1);
  const captureDraw = (bgImageMotion: boolean, atSec: number) => {
    const calls: Array<{ x: number; y: number; w: number; h: number }> = [];
    const { ctx } = createMockCanvasContext();
    (ctx as any).drawImage = (_src: any, x: number, y: number, w: number, h: number) => {
      calls.push({ x, y, w, h });
    };
    const opts: VideoCanvasRenderOptions = {
      width: 1080,
      height: 1920,
      surahName: 'Al-Ikhlas',
      surahNumber: 112,
      startAyah: 1,
      endAyah: 1,
      isLightSurface: false,
      bgImage: { width: 1080, height: 1920 } as any,
      bgImageMotion,
      showArabic: true,
      useTajweed: false,
      showPhonetics: true,
      showFrench: true,
      showSurahHeader: false,
      textScale: 'standard',
      flowMode: 'teleprompter',
      reciterName: 'Alafasy',
    };
    const layout = precomputeVideoCanvasLayout(ctx, ayahs, opts);
    renderVideoCanvasFrame(ctx, layout, timeline, atSec, opts);
    return calls[0];
  };

  const steady0 = captureDraw(false, 0);
  const steady9 = captureDraw(false, 9);
  assert.equal(steady9.w, steady0.w, 'Disabled motion must keep image width steady');

  const motion0 = captureDraw(true, 0);
  const motion9 = captureDraw(true, 9);
  const motion18 = captureDraw(true, 18);
  assert.ok(motion9.w > motion0.w && motion9.w <= motion0.w * 1.06, 'Peak draw rect must gently zoom in');
  assert.ok(motion9.x < 0 && motion9.y < 0, 'Zoomed draw rect must stay centered with zero bare edges');
  assert.ok(Math.abs(motion18.w - motion0.w) < 0.01, 'Draw rect must gently zoom back out at cycle end');
});

test('mandatory watermark and custom logo center cleanly both horizontally and vertically as a readable pair across 16:9, 9:16, and 1:1', () => {
  const ayahs = [
    {
      num: 1,
      ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      tr: 'Qul huwallahu ahad',
      fr: 'Dis: Il est Allah, Unique.',
    },
  ];
  const timeline = buildContinuousTimeline(ayahs, [5.0], 1);
  const squareLogo: any = { naturalWidth: 512, naturalHeight: 512, width: 512, height: 512 };

  for (const [width, height] of [
    [1920, 1080],
    [1080, 1920],
    [1080, 1080],
  ] as Array<[number, number]>) {
    const resScale = Math.max(0.5, Math.min(width, height) / 720);
    const metrics = computeBottomFooterMetrics(width, height, resScale);

    // Wide 3:1 logo preserves aspect ratio & fits within footer bounds
    const wideRect = computeBottomRightLogoRect(width, height, resScale, 600, 200, 220);
    assert.ok(wideRect, 'Expected computed logo rect for valid wide logo');
    assert.ok(wideRect.w <= metrics.logoMaxW && wideRect.h <= metrics.logoMaxH);
    assert.ok(Math.abs(wideRect.w / wideRect.h - 3) < 0.15, 'Aspect ratio must be preserved');

    // Render with square logo on solid canvas (so logo drawImage is the only drawImage call)
    const drawCalls: Array<{ img: any; x: number; y: number; w: number; h: number }> = [];
    const { ctx, fillTexts } = createMockCanvasContext();
    (ctx as any).drawImage = (img: any, x: number, y: number, w: number, h: number) => {
      drawCalls.push({ img, x, y, w, h });
    };

    const opts: VideoCanvasRenderOptions = {
      width,
      height,
      surahName: 'Al-Ikhlas',
      surahNumber: 112,
      startAyah: 1,
      endAyah: 1,
      isLightSurface: false,
      bgImage: null,
      logoImage: squareLogo,
      showArabic: true,
      useTajweed: false,
      showPhonetics: true,
      showFrench: true,
      showSurahHeader: false,
      textScale: 'standard',
      flowMode: 'teleprompter',
      reciterName: 'Alafasy',
    };

    const layout = precomputeVideoCanvasLayout(ctx, ayahs, opts);
    renderVideoCanvasFrame(ctx, layout, timeline, 2.5, opts);

    const brandCall = fillTexts.find((c) => c.text === MANDATORY_WATERMARK_BRAND);
    const taglineCall = fillTexts.find((c) => c.text === MANDATORY_WATERMARK_TAGLINE);
    assert.ok(brandCall && taglineCall, `Watermark must always be present on ${width}x${height}`);
    assert.ok(brandCall.y > height * 0.85, `Watermark brand must sit at bottom (${brandCall.y})`);
    assert.ok(taglineCall.y > height * 0.85, `Watermark tagline must sit at bottom (${taglineCall.y})`);

    const logoCall = drawCalls.find((d) => d.img === squareLogo);
    assert.ok(logoCall, `Custom logo must be drawn on ${width}x${height}`);
    assert.ok(taglineCall.x < width / 2, `Watermark sits left of center (${taglineCall.x})`);
    assert.ok(logoCall.x > width / 2, `Logo sits right of center (${logoCall.x})`);
    assert.ok(logoCall.y > height * 0.82, `Custom logo must sit near bottom (${logoCall.y})`);
    assert.ok(logoCall.x + logoCall.w < width, 'Logo must respect right safe padding');
    assert.ok(logoCall.y + logoCall.h < height, 'Logo must respect bottom safe padding');

    // Vertical centers of watermark and logo should align closely on the same footer midline
    const wmCenterY = (brandCall.y + taglineCall.y) / 2;
    const logoCenterY = logoCall.y + logoCall.h / 2;
    assert.ok(
      Math.abs(wmCenterY - logoCenterY) <= Math.round(12 * resScale),
      `Watermark (${wmCenterY}) and logo (${logoCenterY}) must be vertically centered together`
    );

    assert.ok(logoCall.h >= Math.round(92 * resScale), `Logo should be clearly legible (got h=${logoCall.h})`);
    assert.ok(logoCall.w <= metrics.logoMaxW && logoCall.h <= metrics.logoMaxH, 'Logo must stay within corner bounds');

    // Without custom logo, watermark must shift back to the exact horizontal center
    const noLogo = createMockCanvasContext();
    renderVideoCanvasFrame(noLogo.ctx, layout, timeline, 2.5, { ...opts, logoImage: null });
    const soloTagline = noLogo.fillTexts.find((c) => c.text === MANDATORY_WATERMARK_TAGLINE);
    assert.ok(soloTagline, `Standalone watermark tagline must render on ${width}x${height}`);
    assert.ok(
      Math.abs(soloTagline.x - width / 2) <= 2,
      `Without custom logo, watermark shifts back to exact center (${soloTagline.x} vs ${width / 2})`
    );
  }
});



