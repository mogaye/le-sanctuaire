import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildContinuousTimeline,
  computeContinuousScrollY,
  findActiveTimelineEntry,
  formatTimeMMSS,
  normalizeVerseRange,
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
