import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VIDEO_EXPORT_HEIGHT,
  VIDEO_EXPORT_WIDTH,
  VIDEO_TEMPLATE_PRESETS,
  buildContinuousTimeline,
  computeContinuousScrollY,
  computeCoverDrawRect,
  findActiveTimelineEntry,
  formatTimeMMSS,
  generateYouTubePublishPack,
  getResolutionFallbackTiers,
  getVideoFormatPreset,
  normalizeVerseRange,
  selectPreferredVideoMimeType,
  sliceSelectedAyahs,
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



