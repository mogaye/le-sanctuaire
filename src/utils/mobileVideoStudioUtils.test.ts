import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VIDEO_EXPORT_HEIGHT,
  VIDEO_EXPORT_WIDTH,
  VIDEO_TEMPLATE_PRESETS,
  buildContinuousTimeline,
  buildMultiSurahVideoSequence,
  buildStudioExportFilename,
  buildStudioVideoSequence,
  buildSurahPlaceholderAyahs,
  computeContinuousScrollY,
  computeCoverDrawRect,
  findActiveTimelineEntry,
  formatTimeMMSS,
  generateYouTubePublishPack,
  getResolutionFallbackTiers,
  getVideoFormatPreset,
  normalizeVerseRange,
  selectPreferredVideoMimeType,
  shouldPrependBismillah,
  sliceSelectedAyahs,
  stripLeadingBismillahFromAyah1,
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

test('wrapTextLines and formatTimeMMSS behave deterministically', () => {
  const lines = wrapTextLines('Louange à Allah Seigneur des mondes', 120, (s) => s.length * 10);
  assert.ok(lines.length >= 3);
  assert.equal(formatTimeMMSS(75), '01:15');
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

test('VIDEO_TEMPLATE_PRESETS exposes 6 distinct templates (2 existing + 4 new)', () => {
  assert.equal(VIDEO_TEMPLATE_PRESETS.length, 6);
  const ids = new Set(VIDEO_TEMPLATE_PRESETS.map((t) => t.id));
  assert.equal(ids.size, 6);
  assert.ok(ids.has('spotlight_card'));
  assert.ok(ids.has('cinema_subtitles'));
  assert.ok(ids.has('mushaf_split'));
  assert.ok(ids.has('meditation_minimal'));
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
