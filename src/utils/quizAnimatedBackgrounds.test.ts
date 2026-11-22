import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_QUIZ_ANIMATED_BG_ID,
  QUIZ_ANIMATED_BACKGROUNDS,
  computeQuizBgMotionSnapshot,
  getQuizAnimatedBgPreset,
  renderQuizAnimatedIslamicBackground,
  resolveValidQuizBgId,
} from './quizAnimatedBackgrounds';

function createTrackingCanvasContext() {
  const arcCalls: Array<{ x: number; y: number; r: number }> = [];
  const moveToCalls: Array<{ x: number; y: number }> = [];
  const ctx: any = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo(x: number, y: number) {
      moveToCalls.push({ x, y });
    },
    lineTo() {},
    quadraticCurveTo() {},
    arc(x: number, y: number, r: number) {
      arcCalls.push({ x, y, r });
    },
    fill() {},
    stroke() {},
    fillRect() {},
    drawImage() {
      throw new Error('Quiz procedural background must never draw raster images');
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
  };
  return { ctx: ctx as CanvasRenderingContext2D, arcCalls, moveToCalls };
}

test('QUIZ_ANIMATED_BACKGROUNDS defines curated Islamic themes without any image URLs', () => {
  assert.ok(QUIZ_ANIMATED_BACKGROUNDS.length >= 18);
  const ids = new Set<string>();
  for (const preset of QUIZ_ANIMATED_BACKGROUNDS) {
    assert.ok(preset.id.startsWith('quiz_'));
    assert.ok(!ids.has(preset.id), `Duplicate preset id: ${preset.id}`);
    ids.add(preset.id);
    assert.ok(preset.name.trim().length > 2);
    assert.match(preset.baseColor, /^#[0-9a-fA-F]{6}$/);
    assert.match(preset.deepBlobColor, /^#[0-9a-fA-F]{6}$/);
    assert.equal('url' in preset, false);
  }
  assert.equal(resolveValidQuizBgId('unknown_id'), DEFAULT_QUIZ_ANIMATED_BG_ID);
  assert.equal(getQuizAnimatedBgPreset('quiz_saphir_fanous').polarity, 'dark');
  assert.equal(getQuizAnimatedBgPreset('quiz_parchemin_rosaces').polarity, 'light');
  assert.equal(getQuizAnimatedBgPreset('quiz_lagon_andalou').polarity, 'dark');
  assert.equal(getQuizAnimatedBgPreset('quiz_azur_matin').polarity, 'light');
});

test('computeQuizBgMotionSnapshot moves blobs, Islamic motifs, and lattice continuously over time', () => {
  const t0 = computeQuizBgMotionSnapshot('quiz_emeraude_croissants', 0, 1080, 1920);
  const t2 = computeQuizBgMotionSnapshot('quiz_emeraude_croissants', 2.0, 1080, 1920);

  assert.equal(t0.blobs.length, 4);
  assert.equal(t0.motifs.length, 6);

  // Every organic blob must move
  for (let i = 0; i < t0.blobs.length; i++) {
    const dist = Math.hypot(t2.blobs[i].x - t0.blobs[i].x, t2.blobs[i].y - t0.blobs[i].y);
    assert.ok(dist > 5, `Blob ${i} did not move enough: ${dist}`);
  }

  // Every Islamic motif must drift/rotate
  for (let i = 0; i < t0.motifs.length; i++) {
    const dist = Math.hypot(t2.motifs[i].x - t0.motifs[i].x, t2.motifs[i].y - t0.motifs[i].y);
    const angleDiff = Math.abs(t2.motifs[i].angle - t0.motifs[i].angle);
    assert.ok(dist > 10, `Motif ${i} did not drift enough: ${dist}`);
    assert.ok(angleDiff > 0.2, `Motif ${i} did not rotate enough: ${angleDiff}`);
  }

  // Geometric lattice must translate
  assert.notEqual(t0.latticeOffsetX, t2.latticeOffsetX);
  assert.notEqual(t0.latticeOffsetY, t2.latticeOffsetY);
});

test('renderQuizAnimatedIslamicBackground renders every preset cleanly with zero drawImage calls and moving geometry', () => {
  for (const preset of QUIZ_ANIMATED_BACKGROUNDS) {
    const m0 = createTrackingCanvasContext();
    const m1 = createTrackingCanvasContext();

    renderQuizAnimatedIslamicBackground(m0.ctx, 0.2, 1080, 1920, preset.id);
    renderQuizAnimatedIslamicBackground(m1.ctx, 2.2, 1080, 1920, preset.id, {
      bgBlackBackdrop: true,
      bgVeilOpacity: 0.4,
    });

    assert.ok(m0.arcCalls.length >= 6);
    assert.ok(m0.moveToCalls.length >= 10);
    assert.notDeepEqual(
      m0.arcCalls.slice(0, 6),
      m1.arcCalls.slice(0, 6),
      `Preset ${preset.id} arcs should move between t=0.2 and t=2.2`
    );
  }
});
