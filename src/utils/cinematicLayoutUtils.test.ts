import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isMobileViewport,
  getCinematicOrientationMode,
  getDynamicArabicStyleConfig,
  getDynamicTranslationStyleConfig,
  shouldHideAllChrome,
} from './cinematicLayoutUtils';

test('mobile viewport detection triggers vertical 9:16 mode', () => {
  assert.equal(isMobileViewport(360), true);
  assert.equal(isMobileViewport(390), true);
  assert.equal(isMobileViewport(767), true);
  assert.equal(isMobileViewport(768), false);
  assert.equal(getCinematicOrientationMode(390), 'vertical-9-16');
  assert.equal(getCinematicOrientationMode(1440), 'desktop-fullscreen');
});

test('dynamic Arabic style scales smoothly for 9:16 mobile vertical layout', () => {
  const shortMobile = getDynamicArabicStyleConfig('بِسْمِ اللَّهِ', true, 1);
  const longMobile = getDynamicArabicStyleConfig('أ'.repeat(400), true, 1);
  assert.match(shortMobile.fontSize, /^clamp\(28px,/);
  assert.match(longMobile.fontSize, /^clamp\(16px,/);
  assert.ok(shortMobile.lineHeight > longMobile.lineHeight);
});

test('dynamic translation style stays compact for long verses on mobile', () => {
  const shortTr = getDynamicTranslationStyleConfig(45, true, 1);
  const longTr = getDynamicTranslationStyleConfig(320, true, 1);
  assert.match(shortTr.fontSize, /^clamp\(13px,/);
  assert.match(longTr.fontSize, /^clamp\(12px,/);
});

test('fullscreen or hidden HUD hides all floating chrome', () => {
  assert.equal(shouldHideAllChrome(true, true), true);
  assert.equal(shouldHideAllChrome(false, false), true);
  assert.equal(shouldHideAllChrome(false, true), false);
});
