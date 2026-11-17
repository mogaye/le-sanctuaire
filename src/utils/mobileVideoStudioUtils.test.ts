import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VIDEO_EXPORT_HEIGHT,
  VIDEO_EXPORT_WIDTH,
  buildContinuousTimeline,
  computeContinuousScrollY,
  computeCoverDrawRect,
  findActiveTimelineEntry,
  formatTimeMMSS,
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


