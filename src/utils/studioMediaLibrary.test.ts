import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyStudioMediaFile,
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
