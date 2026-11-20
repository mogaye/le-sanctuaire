import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReadJsonResponse } from './safeFetchJson';

test('parses valid 200 JSON response cleanly', async () => {
  const res = new Response(JSON.stringify({ ok: true, count: 42 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  const parsed = await safeReadJsonResponse(res);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.status, 200);
  assert.deepEqual(parsed.data, { ok: true, count: 42 });
  assert.equal(parsed.error, null);
});

test('handles Vercel 404 plain-text "The page could not be found" without SyntaxError', async () => {
  const res = new Response('The page could not be found\n\nNOT_FOUND', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' },
  });
  const parsed = await safeReadJsonResponse(res, 'Endpoint introuvable sur le serveur.');
  assert.equal(parsed.ok, false);
  assert.equal(parsed.status, 404);
  assert.equal(parsed.data, null);
  assert.equal(parsed.error, 'Endpoint introuvable sur le serveur.');
});

test('handles HTML error page cleanly without throwing', async () => {
  const res = new Response('<!DOCTYPE html><html><body>502 Bad Gateway</body></html>', {
    status: 502,
    headers: { 'Content-Type': 'text/html' },
  });
  const parsed = await safeReadJsonResponse(res, 'Erreur serveur temporaire.');
  assert.equal(parsed.ok, false);
  assert.equal(parsed.status, 502);
  assert.equal(parsed.error, 'Erreur serveur temporaire.');
});

test('extracts API error message from JSON error responses', async () => {
  const res = new Response(JSON.stringify({ ok: false, error: 'Accès réservé au Super Admin.' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
  const parsed = await safeReadJsonResponse(res, 'Accès refusé.');
  assert.equal(parsed.ok, false);
  assert.equal(parsed.status, 403);
  assert.equal(parsed.error, 'Accès réservé au Super Admin.');
});
