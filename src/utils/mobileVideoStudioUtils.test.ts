import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VIDEO_EXPORT_HEIGHT,
  VIDEO_EXPORT_WIDTH,
  VIDEO_QUALITY_PRESETS,
  VIDEO_TEMPLATE_PRESETS,
  appendRenderListItem,
  buildContinuousTimeline,
  buildMultiSurahVideoSequence,
  buildStudioExportFilename,
  buildStudioVideoSequence,
  buildSurahPlaceholderAyahs,
  computeContinuousScrollY,
  computeCoverDrawRect,
  computeFluidScrollYForBlocks,
  computeVideoSeekTime,
  extendSequenceToTargetDuration,
  findActiveTimelineEntry,
  formatTimeMMSS,
  generateYouTubePublishPack,
  getResolutionFallbackTiers,
  getVideoFormatPreset,
  inferVideoQualityFromDimensions,
  normalizeVerseRange,
  removeRenderListItem,
  resolveFormatDimensionsForQuality,
  resolveVideoDownloadLinkState,
  selectPreferredVideoMimeType,
  shouldPrependBismillah,
  shouldStageVideoDownload,
  sliceSelectedAyahs,
  stripLeadingBismillahFromAyah1,
  toggleRenderQualitySelection,
  wrapTextLines,
} from './mobileVideoStudioUtils';

test('normalizeVerseRange clamps and orders start/end ayahs cleanly', () => {
  assert.deepEqual(normalizeVerseRange(0, 20, 7), { startAyah: 1, endAyah: 7, count: 7 });
  assert.deepEqual(normalizeVerseRange(5, 2, 10), { startAyah: 5, endAyah: 5, count: 1 });
  assert.deepEqual(normalizeVerseRange(2, 6, 10), { startAyah: 2, endAyah: 6, count: 5 });
});

test('sliceSelectedAyahs extracts exact inclusive range for continuous video stream', () => {
  const sample = [1, 2, 3, 4, 5, 6].map((num) => ({ num, ar: `v${num}`, tr: '', fr: '' }));
  const sliced = sliceSelectedAyahs(sample, 2, 4);
  assert.deepEqual(
    sliced.map((a) => a.num),
    [2, 3, 4]
  );
});

test('buildContinuousTimeline produces strictly gapless contiguous segments', () => {
  const ayahs = [
    { num: 1, ar: 'بِسْمِ اللَّهِ', fr: 'Au nom d Allah' },
    { num: 2, ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', fr: 'Louange a Allah' },
    { num: 3, ar: 'الرَّحْمَٰنِ الرَّحِيمِ', fr: 'Le Tout Misericordieux' },
  ];
  const timeline = buildContinuousTimeline(ayahs, [4.2, 5.8, 3.5], 1);
  assert.equal(timeline.segments.length, 3);
  assert.equal(timeline.segments[0].startSec, 0);
  assert.equal(timeline.segments[0].endSec, timeline.segments[1].startSec);
  assert.equal(timeline.segments[1].endSec, timeline.segments[2].startSec);
  assert.equal(timeline.totalDurationSec, 13.5);
});

test('findActiveTimelineEntry maps continuous playback clock accurately across verses', () => {
  const timeline = buildContinuousTimeline(
    [
      { num: 1, ar: 'a', fr: 'a' },
      { num: 2, ar: 'b', fr: 'b' },
      { num: 3, ar: 'c', fr: 'c' },
    ],
    [4, 6, 5],
    1
  );

  const midFirst = findActiveTimelineEntry(timeline, 2);
  assert.equal(midFirst.activeIndex, 0);
  assert.equal(midFirst.segmentProgress, 0.5);

  const inSecond = findActiveTimelineEntry(timeline, 7);
  assert.equal(inSecond.activeIndex, 1);
  assert.equal(inSecond.segmentProgress, 0.5);

  const atEnd = findActiveTimelineEntry(timeline, 20);
  assert.equal(atEnd.activeIndex, 2);
  assert.equal(atEnd.totalProgress, 1);
});

test('computeContinuousScrollY smoothly interpolates across ribbon centers without step jumps', () => {
  const timeline = buildContinuousTimeline(
    [
      { num: 1, ar: 'a', fr: 'a' },
      { num: 2, ar: 'b', fr: 'b' },
    ],
    [10, 10],
    1
  );
  const earlyScroll = computeContinuousScrollY([400, 900], timeline, 2, 600);
  const lateScroll = computeContinuousScrollY([400, 900], timeline, 9, 600);
  assert.ok(lateScroll > earlyScroll);
});

test('wrapTextLines and formatTimeMMSS behave deterministically including >=1h HH:MM:SS', () => {
  const lines = wrapTextLines('Louange à Allah Seigneur des mondes', 120, (s) => s.length * 10);
  assert.ok(lines.length >= 3);
  assert.equal(formatTimeMMSS(75), '01:15');
  assert.equal(formatTimeMMSS(3665), '01:01:05');
  assert.equal(formatTimeMMSS(7200), '02:00:00');
});

test('export dimensions target Full HD 1080x1920 9:16 resolution', () => {
  assert.equal(VIDEO_EXPORT_WIDTH, 1080);
  assert.equal(VIDEO_EXPORT_HEIGHT, 1920);
});

test('selectPreferredVideoMimeType prioritizes explicit H.264+AAC MP4 and avoids Opus-in-MP4 / bare video/mp4 over WebM Opus', () => {
  const mp4AndWebm = new Set([
    'video/mp4;codecs=avc1.4d002a,mp4a.40.2',
    'video/webm;codecs=vp9,opus',
  ]);
  assert.deepEqual(selectPreferredVideoMimeType((m) => mp4AndWebm.has(m)), {
    mimeType: 'video/mp4;codecs=avc1.4d002a,mp4a.40.2',
    extension: 'mp4',
  });

  const chromeBareOrOpusMp4 = new Set([
    'video/mp4;codecs=avc1.42E01E,opus',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]);
  assert.deepEqual(selectPreferredVideoMimeType((m) => chromeBareOrOpusMp4.has(m)), {
    mimeType: 'video/webm;codecs=vp9,opus',
    extension: 'webm',
  });
});

test('computeCoverDrawRect cover-fits landscape video or tall media inside 1080x1920 9:16 frame', () => {
  const landscape = computeCoverDrawRect(1920, 1080, 1080, 1920);
  assert.equal(landscape.h, 1920);
  assert.ok(landscape.w > 1080);
  assert.ok(landscape.x < 0);

  const exact = computeCoverDrawRect(1080, 1920, 1080, 1920);
  assert.deepEqual(exact, { x: 0, y: 0, w: 1080, h: 1920 });
});

test('getVideoFormatPreset unlocks YouTube 16:9 & Square 1:1 on PC while strictly locking Mobile to 9:16', () => {
  const pcYt1080 = getVideoFormatPreset('youtube_1080p', false);
  assert.equal(pcYt1080.width, 1920);
  assert.equal(pcYt1080.height, 1080);
  assert.equal(pcYt1080.aspectLabel, '16:9');

  const pcYt720 = getVideoFormatPreset('youtube_720p', false);
  assert.equal(pcYt720.width, 1280);
  assert.equal(pcYt720.height, 720);

  const pcSquare = getVideoFormatPreset('square_1080', false);
  assert.equal(pcSquare.width, 1080);
  assert.equal(pcSquare.height, 1080);

  // Mobile MUST stay locked to 9:16 even if PC saved youtube_1080p
  const mobileForced = getVideoFormatPreset('youtube_1080p', true);
  assert.equal(mobileForced.id, 'shorts_916');
  assert.equal(mobileForced.width, 1080);
  assert.equal(mobileForced.height, 1920);
  assert.equal(mobileForced.aspectLabel, '9:16');
});

test('getResolutionFallbackTiers preserves 16:9, 1:1, and 9:16 aspect ratios across all fallback tiers', () => {
  const tiers169 = getResolutionFallbackTiers(1920, 1080);
  for (const t of tiers169) {
    assert.ok(Math.abs(t.w / t.h - 16 / 9) < 0.01, `Expected 16:9, got ${t.w}x${t.h}`);
  }

  const tiers11 = getResolutionFallbackTiers(1080, 1080);
  for (const t of tiers11) {
    assert.equal(t.w, t.h);
  }

  const tiers916 = getResolutionFallbackTiers(1080, 1920);
  for (const t of tiers916) {
    assert.ok(Math.abs(t.w / t.h - 9 / 16) < 0.01, `Expected 9:16, got ${t.w}x${t.h}`);
  }
});

test('VIDEO_TEMPLATE_PRESETS exposes 16 frameless typography & language templates without any framed cards', () => {
  assert.equal(VIDEO_TEMPLATE_PRESETS.length, 16);
  const ids = new Set(VIDEO_TEMPLATE_PRESETS.map((t) => t.id));
  assert.equal(ids.size, 16);
  for (const expectedId of [
    'teleprompter',
    'stream',
    'arabic_pure_khatt',
    'french_pure_poetry',
    'cinema_subtitles',
    'mushaf_split',
    'meditation_minimal',
    'karaoke_glow',
    'editorial_magazine',
    'night_lantern',
    'dual_ribbon',
    'verse_ticker',
    'arabic_ruqaa_modern',
    'kufi_editorial',
    'phonetics_focus',
    'arabic_giant_whisper_fr',
  ] as const) {
    assert.ok(ids.has(expectedId), `Missing preset ${expectedId}`);
  }
  for (const removedId of [
    'spotlight_card',
    'parchment_scroll',
    'mihrab_arch',
    'quran_page_classic',
    'royal_medallion',
    'serene_glass',
  ]) {
    assert.equal(ids.has(removedId as any), false, `Removed framed template ${removedId} must not exist`);
  }
});

test('wrapTextLines breaks ultra-long unbroken tokens cleanly below maxWidth', () => {
  const longToken = 'A'.repeat(60);
  const lines = wrapTextLines(longToken, 100, (s) => s.length * 10);
  assert.ok(lines.length >= 6);
  for (const line of lines) {
    assert.ok(line.length * 10 <= 100, `Line exceeded maxWidth: ${line.length * 10}`);
  }
});

test('computeFluidScrollYForBlocks pans tall verses smoothly from top to bottom and flows cleanly on standard verses', () => {
  const tallTimeline = buildContinuousTimeline(
    [
      { num: 1, ar: 'a', fr: 'short' },
      { num: 2, ar: 'b'.repeat(400), fr: 'very long verse' },
      { num: 3, ar: 'c', fr: 'next' },
    ],
    [5, 20, 5],
    1
  );
  const blocks = [
    { yStart: 180, centerY: 280, height: 200 },
    { yStart: 440, centerY: 1140, height: 1400 },
    { yStart: 1900, centerY: 2000, height: 200 },
  ];
  const topSafeY = 120;
  const bottomSafeY = 960;

  // Standard block 0 flows continuously toward block 1
  const s0Start = computeFluidScrollYForBlocks(blocks, tallTimeline, 0.2, topSafeY, bottomSafeY);
  const s0Mid = computeFluidScrollYForBlocks(blocks, tallTimeline, 2.5, topSafeY, bottomSafeY);
  const s0End = computeFluidScrollYForBlocks(blocks, tallTimeline, 4.9, topSafeY, bottomSafeY);
  assert.ok(s0End > s0Mid && s0Mid >= s0Start, `Expected smooth monotonic flow: ${s0Start} -> ${s0Mid} -> ${s0End}`);

  // Tall block 1 starts near yStart and pans smoothly down to bottom before moving to block 2
  const b1Early = computeFluidScrollYForBlocks(blocks, tallTimeline, 6.0, topSafeY, bottomSafeY);
  const b1Mid = computeFluidScrollYForBlocks(blocks, tallTimeline, 13.0, topSafeY, bottomSafeY);
  const b1Late = computeFluidScrollYForBlocks(blocks, tallTimeline, 20.5, topSafeY, bottomSafeY);
  assert.ok(b1Mid > b1Early, `Expected tall verse pan to advance: ${b1Early} -> ${b1Mid}`);
  assert.ok(b1Late > b1Mid, `Expected tall verse pan to continue to end: ${b1Mid} -> ${b1Late}`);
});

test('generateYouTubePublishPack creates timestamped chapters and full surah metadata', () => {
  const ayahs = Array.from({ length: 7 }, (_, i) => ({
    num: i + 1,
    ar: 'بِسْمِ اللَّهِ',
    fr: 'Texte',
  }));
  const timeline = buildContinuousTimeline(ayahs, [5, 5, 5, 5, 5, 5, 5], 1);
  const pack = generateYouTubePublishPack({
    surahName: 'Al-Fatiha',
    surahArabicName: 'الفاتحة',
    surahNumber: 1,
    startAyah: 1,
    endAyah: 7,
    totalAyahsInSurah: 7,
    reciterName: 'Mishary Rashid Alafasy',
    timeline,
  });

  assert.ok(pack.title.includes('Al-Fatiha'));
  assert.ok(pack.title.includes('Sourate complète (7 versets)'));
  assert.ok(pack.description.includes('00:00 Verset 1'));
  assert.ok(pack.description.includes('00:10 Verset 3'));
  assert.ok(pack.description.includes('00:30 Verset 7'));
});

test('shouldPrependBismillah applies only when starting at Ayah 1 for Surahs other than 1 and 9', () => {
  assert.equal(shouldPrependBismillah(1, 1), false); // Al-Fatiha Ayah 1 already IS Bismillah
  assert.equal(shouldPrependBismillah(9, 1), false); // At-Tawbah has no Bismillah
  assert.equal(shouldPrependBismillah(2, 1), true);
  assert.equal(shouldPrependBismillah(18, 1), true);
  assert.equal(shouldPrependBismillah(112, 1), true);
  assert.equal(shouldPrependBismillah(2, 2), false);
  assert.equal(shouldPrependBismillah(112, 2), false);
});

test('stripLeadingBismillahFromAyah1 removes glued Uthmani Bismillah prefix when verse body follows', () => {
  const uthmaniAyah1 =
    '\uFEFFبِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ';
  assert.equal(stripLeadingBismillahFromAyah1(uthmaniAyah1), 'قُلْ هُوَ ٱللَّهُ أَحَدٌ');

  const bismillahOnly = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
  assert.equal(stripLeadingBismillahFromAyah1(bismillahOnly), bismillahOnly);
});

test('buildStudioVideoSequence prepends Bismillah audio+text intro when starting at verse 1 and labels YouTube 00:00 Bismillah', () => {
  const sampleSurah112 = [
    {
      num: 1,
      ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ هُوَ ٱللَّهُ أَحَدٌ',
      tr: 'Qul huwal laahu ahad',
      fr: 'Dis: «Il est Allah, Unique.',
    },
    {
      num: 2,
      ar: 'ٱللَّهُ ٱلصَّمَدُ',
      tr: 'Allaahus Samad',
      fr: 'Allah, Le Seul à être imploré pour ce que nous désirons.',
    },
  ];

  // Starting at verse 1 of Surah 112 -> prepends Bismillah (audioSurahNum 1, audioAyahNum 1) & strips glued prefix from Ayah 1
  const seqFrom1 = buildStudioVideoSequence(112, sampleSurah112, 1, 2);
  assert.equal(seqFrom1.length, 3);
  assert.equal(seqFrom1[0].isBismillah, true);
  assert.equal(seqFrom1[0].audioSurahNum, 1);
  assert.equal(seqFrom1[0].audioAyahNum, 1);
  assert.equal(seqFrom1[1].num, 1);
  assert.equal(seqFrom1[1].ar, 'قُلْ هُوَ ٱللَّهُ أَحَدٌ');

  // YouTube chapters begin at 00:00 Bismillah
  const tl = buildContinuousTimeline(seqFrom1, [4, 4, 4], 1);
  const pack = generateYouTubePublishPack({
    surahName: 'Al-Ikhlas',
    surahNumber: 112,
    startAyah: 1,
    endAyah: 2,
    totalAyahsInSurah: 4,
    reciterName: 'Alafasy',
    timeline: tl,
  });
  assert.ok(pack.description.includes('00:00 Bismillah'));
  assert.ok(pack.description.includes('00:04 Verset 1'));

  // Starting at verse 2 -> no Bismillah intro
  const seqFrom2 = buildStudioVideoSequence(112, sampleSurah112, 2, 2);
  assert.equal(seqFrom2.length, 1);
  assert.equal(seqFrom2[0].isBismillah, undefined);
  assert.equal(seqFrom2[0].num, 2);

  // Surah 1 (Al-Fatiha) -> no duplicate Bismillah
  const seqFatiha = buildStudioVideoSequence(
    1,
    [{ num: 1, ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', tr: 'Bismillah', fr: 'Au nom d Allah' }],
    1,
    1
  );
  assert.equal(seqFatiha.length, 1);
  assert.equal(seqFatiha[0].isBismillah, undefined);

  // Surah 9 (At-Tawbah) -> no Bismillah
  const seqTawbah = buildStudioVideoSequence(
    9,
    [{ num: 1, ar: 'بَرَاءَةٌ مِنَ اللَّهِ', tr: 'Baraa-atum', fr: 'Désaveu...' }],
    1,
    1
  );
  assert.equal(seqTawbah.length, 1);
  assert.equal(seqTawbah[0].isBismillah, undefined);
});

test('buildMultiSurahVideoSequence preserves ALL selected surahs, full lengths, and total duration > 9s', () => {
  const catalog = [
    { number: 112, name: 'Al-Ikhlas', arabicName: 'الإخلاص', numberOfAyahs: 4 },
    { number: 113, name: 'Al-Falaq', arabicName: 'الفلق', numberOfAyahs: 5 },
    { number: 114, name: 'An-Nas', arabicName: 'الناس', numberOfAyahs: 6 },
    { number: 78, name: 'An-Naba', arabicName: 'النبأ', numberOfAyahs: 40 },
  ];

  const makeVerses = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      num: i + 1,
      ar: `بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ آيَة ${i + 1}`,
      tr: `Verset ${i + 1}`,
      fr: `Traduction du verset ${i + 1}`,
    }));

  const versesBySurah = new Map([
    [112, makeVerses(4)],
    [113, makeVerses(5)],
    [114, makeVerses(6)],
  ]);

  // 3 Qul selected: 4 + 5 + 6 = 15 verses + 3 Bismillah intros = 18 items
  const seq = buildMultiSurahVideoSequence(
    [
      { id: '112', surahNumber: 112, startAyah: 1, endAyah: 4 },
      { id: '113', surahNumber: 113, startAyah: 1, endAyah: 5 },
      { id: '114', surahNumber: 114, startAyah: 1, endAyah: 6 },
    ],
    versesBySurah,
    catalog
  );

  assert.equal(seq.length, 18);
  assert.equal(seq[0].surahNumber, 112);
  assert.equal(seq[0].isBismillah, true);
  assert.equal(seq[0].audioSurahNum, 1);
  assert.equal(seq[1].surahNumber, 112);
  assert.equal(seq[1].audioSurahNum, 112);
  assert.equal(seq[1].audioAyahNum, 1);

  assert.equal(seq[5].surahNumber, 113);
  assert.equal(seq[5].isBismillah, true);
  assert.equal(seq[6].audioSurahNum, 113);

  assert.equal(seq[11].surahNumber, 114);
  assert.equal(seq[11].isBismillah, true);
  assert.equal(seq[12].audioSurahNum, 114);

  const tl = buildContinuousTimeline(seq, undefined, 1);
  assert.ok(tl.totalDurationSec > 45, `Multi-surah duration must reflect all surahs, got ${tl.totalDurationSec}s`);

  // Verify placeholder generator does NOT cap long surahs to 10 verses while loading/offline
  const placeholders = buildSurahPlaceholderAyahs(catalog[3]);
  assert.equal(placeholders.length, 40);

  // Verify multi-surah YouTube pack lists all surahs and prefixed chapters
  const multiPack = generateYouTubePublishPack({
    surahName: 'Al-Ikhlas',
    surahNumber: 112,
    startAyah: 1,
    endAyah: 4,
    totalAyahsInSurah: 4,
    reciterName: 'Alafasy',
    timeline: tl,
    selectedSurahs: [
      { surahNumber: 112, surahName: 'Al-Ikhlas', startAyah: 1, endAyah: 4, totalAyahsInSurah: 4 },
      { surahNumber: 113, surahName: 'Al-Falaq', startAyah: 1, endAyah: 5, totalAyahsInSurah: 5 },
      { surahNumber: 114, surahName: 'An-Nas', startAyah: 1, endAyah: 6, totalAyahsInSurah: 6 },
    ],
  });
  assert.ok(multiPack.title.includes('Al-Ikhlas'));
  assert.ok(multiPack.title.includes('Al-Falaq'));
  assert.ok(multiPack.title.includes('An-Nas'));
  assert.ok(multiPack.description.includes('Al-Ikhlas — Bismillah'));
  assert.ok(multiPack.description.includes('An-Nas — Verset 6'));
});

test('buildStudioExportFilename formats single and multi-surah filenames cleanly', () => {
  assert.equal(
    buildStudioExportFilename({
      selections: [{ surahNumber: 112, startAyah: 1, endAyah: 4 }],
      aspectLabel: '9:16',
      extension: 'mp4',
    }),
    'coran-s112-v1-4-9x16.mp4'
  );
  assert.equal(
    buildStudioExportFilename({
      selections: [
        { surahNumber: 112, startAyah: 1, endAyah: 4 },
        { surahNumber: 113, startAyah: 1, endAyah: 5 },
        { surahNumber: 114, startAyah: 1, endAyah: 6 },
      ],
      aspectLabel: '16:9',
      extension: 'mp4',
    }),
    'coran-3sourates-s112-113-114-16x9.mp4'
  );
});

test('computeVideoSeekTime wraps multi-minute clocks cleanly below video end-of-stream', () => {
  assert.equal(computeVideoSeekTime(0, 12), 0);
  assert.equal(computeVideoSeekTime(5.5, 12), 5.5);
  assert.equal(computeVideoSeekTime(12.0, 12), 0);
  assert.ok(Math.abs(computeVideoSeekTime(195.25, 60) - 15.25) < 0.001);
  assert.ok(computeVideoSeekTime(11.999, 12) <= 11.96);
  assert.equal(computeVideoSeekTime(10, 0), 0);
  assert.equal(computeVideoSeekTime(-3, 20), 0);
});

test('extendSequenceToTargetDuration loops short verse sequence to cover multi-minute custom videos (>3 min)', () => {
  const shortSeq = [
    { num: 1, ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ', tr: 'Qul huwallahu ahad', fr: 'Dis: Il est Allah, Unique.' },
    { num: 2, ar: 'اللَّهُ الصَّمَدُ', tr: 'Allahus Samad', fr: 'Allah, Le Seul a etre implore.' },
  ];
  const decoded = ['buf1', 'buf2'];
  const measured = [4.0, 4.0];

  const extended = extendSequenceToTargetDuration(shortSeq, decoded, measured, 200, 1);
  assert.equal(extended.sequence.length, 50);
  assert.equal(extended.decodedItems.length, 50);
  assert.equal(extended.measuredDurationsSec.length, 50);

  const extendedTimeline = buildContinuousTimeline(
    extended.sequence,
    extended.measuredDurationsSec,
    1
  );
  assert.ok(
    extendedTimeline.totalDurationSec >= 200,
    `Expected timeline >= 200s, got ${extendedTimeline.totalDurationSec}s`
  );

  // If sequence already meets target duration, keep untouched
  const untouched = extendSequenceToTargetDuration(shortSeq, decoded, measured, 6, 1);
  assert.equal(untouched.sequence.length, 2);
});

test('extendSequenceToTargetDuration supports multi-hour videos without any 800-item or duration cap', () => {
  const shortSeq = [
    { num: 1, ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ', tr: 'Qul huwallahu ahad', fr: 'Dis: Il est Allah, Unique.' },
    { num: 2, ar: 'اللَّهُ الصَّمَدُ', tr: 'Allahus Samad', fr: 'Allah, Le Seul a etre implore.' },
  ];
  const decoded = ['buf1', 'buf2'];
  const measured = [4.0, 4.0];

  // 2 hours = 7200s -> 1800 repeated items (far above old 800-item cap)
  const twoHours = extendSequenceToTargetDuration(shortSeq, decoded, measured, 7200, 1);
  assert.equal(twoHours.sequence.length, 1800);
  assert.equal(twoHours.decodedItems.length, 1800);
  assert.equal(twoHours.measuredDurationsSec.length, 1800);

  const twoHourTimeline = buildContinuousTimeline(
    twoHours.sequence,
    twoHours.measuredDurationsSec,
    1
  );
  assert.ok(
    twoHourTimeline.totalDurationSec >= 7200,
    `Expected timeline >= 7200s (2 hours), got ${twoHourTimeline.totalDurationSec}s`
  );
});

test('getResolutionFallbackTiers scales bitrate cleanly for multi-minute and multi-hour exports', () => {
  const shortTiers = getResolutionFallbackTiers(1080, 1920, 45);
  const threeMinPlusTiers = getResolutionFallbackTiers(1080, 1920, 240);
  const sevenMinPlusTiers = getResolutionFallbackTiers(1080, 1920, 500);
  const oneHourPlusTiers = getResolutionFallbackTiers(1080, 1920, 3600);

  assert.equal(shortTiers[0].bitrate, 8_000_000);
  assert.ok(threeMinPlusTiers[0].bitrate < shortTiers[0].bitrate);
  assert.ok(sevenMinPlusTiers[0].bitrate < threeMinPlusTiers[0].bitrate);
  assert.ok(oneHourPlusTiers[0].bitrate <= sevenMinPlusTiers[0].bitrate);
  assert.ok(oneHourPlusTiers[0].bitrate >= 1_600_000);
});

test('shouldStageVideoDownload enables HTTP attachment staging reliably across iframes and top-level browsers', () => {
  const maxBytes = 1500 * 1024 * 1024;
  assert.equal(shouldStageVideoDownload(0, true, maxBytes), false);
  assert.equal(shouldStageVideoDownload(5_000_000, true, maxBytes), true);
  assert.equal(shouldStageVideoDownload(5_000_000, false, maxBytes), true);
  assert.equal(shouldStageVideoDownload(400 * 1024 * 1024, false, maxBytes), false);
  assert.equal(shouldStageVideoDownload(400 * 1024 * 1024, true, maxBytes), true);
  assert.equal(shouldStageVideoDownload(maxBytes + 1, true, maxBytes), false);
});

test('resolveVideoDownloadLinkState provides a ready synchronous download URL for browser downloads', () => {
  assert.deepEqual(
    resolveVideoDownloadLinkState({
      inIframe: true,
      stagedDownloadUrl: '/api/video/download/abc123',
      objectUrl: 'blob:http://localhost:3000/123',
      filename: 'coran-s112-v1-4-16x9.mp4',
    }),
    {
      href: '/api/video/download/abc123',
      filename: 'coran-s112-v1-4-16x9.mp4',
      usesServerRelay: true,
    }
  );

  assert.deepEqual(
    resolveVideoDownloadLinkState({
      inIframe: false,
      stagedDownloadUrl: null,
      objectUrl: 'blob:http://localhost:3000/456',
      filename: 'coran-s1-v1-7-9x16.mp4',
    }),
    {
      href: 'blob:http://localhost:3000/456',
      filename: 'coran-s1-v1-7-9x16.mp4',
      usesServerRelay: false,
    }
  );

  assert.deepEqual(
    resolveVideoDownloadLinkState({
      inIframe: false,
      stagedDownloadUrl: null,
      objectUrl: null,
      filename: '   ',
    }),
    {
      href: null,
      filename: 'coran-sanctuaire.mp4',
      usesServerRelay: false,
    }
  );
});

test('VIDEO_QUALITY_PRESETS and resolveFormatDimensionsForQuality support 4K UHD down to 480p across all aspects', () => {
  assert.deepEqual(
    VIDEO_QUALITY_PRESETS.map((q) => q.id),
    ['4k', '1080p', '720p', '480p']
  );

  const landscapeBase = getVideoFormatPreset('youtube_1080p', false);
  const portraitBase = getVideoFormatPreset('shorts_916', true);
  const squareBase = getVideoFormatPreset('square_1080', false);

  const l4k = resolveFormatDimensionsForQuality(landscapeBase, '4k');
  assert.equal(l4k.width, 3840);
  assert.equal(l4k.height, 2160);
  assert.equal(l4k.previewWidth, 1280);
  assert.equal(l4k.previewHeight, 720);

  const l480 = resolveFormatDimensionsForQuality(landscapeBase, '480p');
  assert.equal(l480.width, 854);
  assert.equal(l480.height, 480);
  assert.equal(l480.previewWidth, 854);
  assert.equal(l480.previewHeight, 480);

  const p4k = resolveFormatDimensionsForQuality(portraitBase, '4k');
  assert.equal(p4k.width, 2160);
  assert.equal(p4k.height, 3840);

  const p480 = resolveFormatDimensionsForQuality(portraitBase, '480p');
  assert.equal(p480.width, 480);
  assert.equal(p480.height, 854);

  const s4k = resolveFormatDimensionsForQuality(squareBase, '4k');
  assert.equal(s4k.width, 2160);
  assert.equal(s4k.height, 2160);

  const s480 = resolveFormatDimensionsForQuality(squareBase, '480p');
  assert.equal(s480.width, 480);
  assert.equal(s480.height, 480);

  assert.equal(inferVideoQualityFromDimensions(3840, 2160), '4k');
  assert.equal(inferVideoQualityFromDimensions(2160, 3840), '4k');
  assert.equal(inferVideoQualityFromDimensions(1920, 1080), '1080p');
  assert.equal(inferVideoQualityFromDimensions(1280, 720), '720p');
  assert.equal(inferVideoQualityFromDimensions(854, 480), '480p');
});

test('getResolutionFallbackTiers supports 4K UHD top tiers with clean aspect-preserving fallbacks', () => {
  const tiers169_4k = getResolutionFallbackTiers(3840, 2160, 45);
  assert.equal(tiers169_4k[0].w, 3840);
  assert.equal(tiers169_4k[0].h, 2160);
  assert.ok(tiers169_4k[0].bitrate >= 20_000_000);
  for (const t of tiers169_4k) {
    assert.ok(Math.abs(t.w / t.h - 16 / 9) < 0.01);
  }

  const tiers916_4k = getResolutionFallbackTiers(2160, 3840, 45);
  assert.equal(tiers916_4k[0].w, 2160);
  assert.equal(tiers916_4k[0].h, 3840);
  for (const t of tiers916_4k) {
    assert.ok(Math.abs(t.w / t.h - 9 / 16) < 0.01);
  }

  const tiers480p = getResolutionFallbackTiers(854, 480, 45);
  assert.equal(tiers480p[0].w, 854);
  assert.equal(tiers480p[0].h, 480);
});

test('toggleRenderQualitySelection, buildStudioExportFilename with quality, and multi-render list helpers work cleanly', () => {
  let selected = toggleRenderQualitySelection(['1080p'], '4k');
  assert.deepEqual(selected, ['4k', '1080p']);
  selected = toggleRenderQualitySelection(selected, '480p');
  assert.deepEqual(selected, ['4k', '1080p', '480p']);
  selected = toggleRenderQualitySelection(selected, '1080p');
  assert.deepEqual(selected, ['4k', '480p']);
  // Cannot unselect the very last quality
  selected = toggleRenderQualitySelection(['4k'], '4k');
  assert.deepEqual(selected, ['4k']);

  assert.equal(
    buildStudioExportFilename({
      selections: [{ surahNumber: 1, startAyah: 1, endAyah: 7 }],
      aspectLabel: '16:9',
      extension: 'mp4',
      qualityId: '4k',
    }),
    'coran-s1-v1-7-16x9-4k.mp4'
  );

  const r1 = { id: 'r1', label: '480p' };
  const r2 = { id: 'r2', label: '4k' };
  let list = appendRenderListItem([], r1);
  list = appendRenderListItem(list, r2);
  assert.deepEqual(list.map((r) => r.id), ['r2', 'r1']);

  const removedInactive = removeRenderListItem(list, 'r1', 'r2');
  assert.deepEqual(removedInactive.items.map((r) => r.id), ['r2']);
  assert.equal(removedInactive.nextActiveId, 'r2');

  const removedActive = removeRenderListItem(list, 'r2', 'r2');
  assert.deepEqual(removedActive.items.map((r) => r.id), ['r1']);
  assert.equal(removedActive.nextActiveId, 'r1');

  const removedLast = removeRenderListItem([r1], 'r1', 'r1');
  assert.equal(removedLast.items.length, 0);
  assert.equal(removedLast.nextActiveId, null);
});

