import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPORT_NOTIFICATION_TAG,
  buildUnicodeProgressBar,
  clampProgressPct,
  createSilentWavDataUrl,
  formatBackgroundDocumentTitle,
  formatExportNotificationPayload,
  shouldAbortOnPageHide,
} from './backgroundExportUtils';

test('clampProgressPct clamps out-of-range and non-finite percentages cleanly', () => {
  assert.equal(clampProgressPct(-12), 0);
  assert.equal(clampProgressPct(42.6), 43);
  assert.equal(clampProgressPct(130), 100);
  assert.equal(clampProgressPct(Number.NaN), 0);
});

test('buildUnicodeProgressBar renders accurate filled and empty blocks', () => {
  assert.equal(buildUnicodeProgressBar(0, 10), '░░░░░░░░░░');
  assert.equal(buildUnicodeProgressBar(50, 10), '█████░░░░░');
  assert.equal(buildUnicodeProgressBar(100, 10), '██████████');
});

test('formatExportNotificationPayload builds silent ongoing progress notification in preparing state', () => {
  const payload = formatExportNotificationPayload({
    status: 'preparing',
    progressPct: 50,
    summaryLabel: 'Sourate Al-Kahf (1–5)',
    qualityLabel: '1080p',
    statusLabel: 'Génération MP4 (1080×1920) 50%...',
  });

  assert.equal(payload.tag, EXPORT_NOTIFICATION_TAG);
  assert.equal(payload.silent, true);
  assert.equal(payload.renotify, false);
  assert.equal(payload.requireInteraction, true);
  assert.ok(payload.title.includes('50%'));
  assert.ok(payload.title.includes('Sourate Al-Kahf'));
  assert.ok(payload.body.includes('██████░░░░░░ 50%'));
});

test('formatExportNotificationPayload builds ready and error notifications', () => {
  const ready = formatExportNotificationPayload({
    status: 'ready',
    progressPct: 100,
    summaryLabel: 'Al-Fatiha',
    filename: 'Al-Fatiha-9x16.mp4',
    sizeLabel: '8.4 Mo',
  });
  assert.equal(ready.silent, false);
  assert.equal(ready.renotify, true);
  assert.ok(ready.title.includes('Vidéo prête'));
  assert.ok(ready.title.includes('8.4 Mo'));
  assert.ok(ready.body.includes('Al-Fatiha-9x16.mp4'));

  const err = formatExportNotificationPayload({
    status: 'error',
    progressPct: 30,
    summaryLabel: 'Al-Fatiha',
    errorMsg: 'Réseau indisponible',
  });
  assert.ok(err.title.includes('Échec'));
  assert.equal(err.body, 'Réseau indisponible');
});

test('formatBackgroundDocumentTitle reflects progress while exporting and restores on idle', () => {
  assert.equal(
    formatBackgroundDocumentTitle('Le Sanctuaire', 'preparing', 64),
    '64% • Téléchargement vidéo — Le Sanctuaire'
  );
  assert.equal(
    formatBackgroundDocumentTitle('Le Sanctuaire', 'ready', 100),
    'Vidéo prête • Le Sanctuaire'
  );
  assert.equal(
    formatBackgroundDocumentTitle('Le Sanctuaire', 'idle', 0),
    'Le Sanctuaire'
  );
});

test('shouldAbortOnPageHide distinguishes persisted mobile app-switch/BFCache from real site exit', () => {
  assert.equal(shouldAbortOnPageHide({ persisted: true }), false);
  assert.equal(shouldAbortOnPageHide({ persisted: false }), true);
  assert.equal(shouldAbortOnPageHide(undefined), true);
});

test('createSilentWavDataUrl outputs valid PCM RIFF WAVE base64 data URI', () => {
  const url = createSilentWavDataUrl(0.5);
  assert.ok(url.startsWith('data:audio/wav;base64,'));
  const raw = Buffer.from(url.split(',')[1], 'base64');
  assert.equal(raw.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(raw.subarray(8, 12).toString('ascii'), 'WAVE');
  // Sample payload should be pure zeros (silent)
  const audioPayload = raw.subarray(44);
  assert.ok(audioPayload.length >= 1600);
  assert.equal(audioPayload.every((b) => b === 0), true);
});
