import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STUDIO_TEXT_COLOR_SWATCHES,
  clampBackgroundAdjustment,
  classifyStudioMediaFile,
  computeOptimizedImageDimensions,
  formatStudioBytes,
  mergeAndSortMediaSummaries,
  sanitizeStudioOwnerKey,
} from './studioMediaLibrary.ts';

test('classifyStudioMediaFile detects image and video by MIME type and extension fallback', () => {
  assert.equal(classifyStudioMediaFile('bg.jpg', 'image/jpeg'), 'image');
  assert.equal(classifyStudioMediaFile('clip.mp4', 'video/mp4'), 'video');
  assert.equal(classifyStudioMediaFile('clip.webm', ''), 'video');
  assert.equal(classifyStudioMediaFile('photo.webp', ''), 'image');
  assert.equal(classifyStudioMediaFile('notes.pdf', 'application/pdf'), null);
});

test('formatStudioBytes renders readable Ko, Mo, and Go labels', () => {
  assert.equal(formatStudioBytes(0), '0 Ko');
  assert.equal(formatStudioBytes(48 * 1024), '48 Ko');
  assert.equal(formatStudioBytes(2.5 * 1024 * 1024), '2.5 Mo');
  assert.equal(formatStudioBytes(1.5 * 1024 * 1024 * 1024), '1.50 Go');
});

test('sanitizeStudioOwnerKey prevents unsafe path traversal characters', () => {
  assert.equal(sanitizeStudioOwnerKey('User@Example.COM'), 'user@example.com');
  assert.equal(sanitizeStudioOwnerKey('../../etc/passwd'), '.._.._etc_passwd');
  assert.equal(sanitizeStudioOwnerKey(''), 'default_local');
});

test('mergeAndSortMediaSummaries deduplicates by id and keeps newest items first', () => {
  const merged = mergeAndSortMediaSummaries(
    [
      {
        id: 'm1',
        name: 'A',
        kind: 'image',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        createdAt: 100,
        syncedToServer: false,
      },
    ],
    [
      {
        id: 'm1',
        name: 'A',
        kind: 'image',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        createdAt: 100,
        url: '/api/studio-media/file/u/m1',
      },
      {
        id: 'm2',
        name: 'B',
        kind: 'video',
        mimeType: 'video/mp4',
        sizeBytes: 5000,
        createdAt: 200,
        url: '/api/studio-media/file/u/m2',
      },
    ]
  );
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'm2');
  assert.equal(merged[1].id, 'm1');
  assert.equal(merged[1].syncedToServer, true);
});

test('computeOptimizedImageDimensions shrinks oversized uploads proportionally while keeping smaller photos intact', () => {
  const portrait4k = computeOptimizedImageDimensions(4000, 6000, 2048);
  assert.deepEqual(portrait4k, { width: 1365, height: 2048, resized: true });

  const landscape4k = computeOptimizedImageDimensions(3840, 2160, 2048);
  assert.deepEqual(landscape4k, { width: 2048, height: 1152, resized: true });

  const smallImg = computeOptimizedImageDimensions(900, 1600, 2048);
  assert.deepEqual(smallImg, { width: 900, height: 1600, resized: false });

  const thumb = computeOptimizedImageDimensions(1920, 1080, 240);
  assert.deepEqual(thumb, { width: 240, height: 135, resized: true });
});

test('clampBackgroundAdjustment bounds values cleanly to 0..100 and STUDIO_TEXT_COLOR_SWATCHES provides 10 unique presets', () => {
  assert.equal(clampBackgroundAdjustment(undefined, 50), 50);
  assert.equal(clampBackgroundAdjustment(-20, 50), 0);
  assert.equal(clampBackgroundAdjustment(180, 50), 100);
  assert.equal(clampBackgroundAdjustment(73.4, 50), 73);

  assert.equal(STUDIO_TEXT_COLOR_SWATCHES.length, 10);
  const uniqueHexes = new Set(STUDIO_TEXT_COLOR_SWATCHES.map((s) => s.hex.toUpperCase()));
  assert.equal(uniqueHexes.size, 10);
});
