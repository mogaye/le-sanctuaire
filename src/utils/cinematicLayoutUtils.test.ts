import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isMobileViewport,
  getCinematicOrientationMode,
  getDynamicArabicStyleConfig,
  getDynamicTranslationStyleConfig,
  shouldHideAllChrome,
  isLightCinematicSurface,
} from './cinematicLayoutUtils';

test('mobile viewport detection triggers vertical 9:16 mode', () => {
  assert.equal(isMobileViewport(360), true);
  assert.equal(isMobileViewport(390), true);
  assert.equal(isMobileViewport(767), true);
  assert.equal(isMobileViewport(768), false);
  assert.equal(getCinematicOrientationMode(390), 'vertical-9-16');
  assert.equal(getCinematicOrientationMode(1440), 'desktop-fullscreen');
});

test('mobile Arabic typography is substantially larger than desktop while preserving desktop scale', () => {
  const shortMobile = getDynamicArabicStyleConfig('بِسْمِ اللَّهِ', true, 1);
  const longMobile = getDynamicArabicStyleConfig('أ'.repeat(400), true, 1);
  const shortDesktop = getDynamicArabicStyleConfig('بِسْمِ اللَّهِ', false, 1);

  assert.match(shortMobile.fontSize, /^clamp\(38px,/);
  assert.match(longMobile.fontSize, /^clamp\(22px,/);
  assert.match(shortDesktop.fontSize, /^clamp\(22px,/);
  assert.ok(shortMobile.lineHeight > longMobile.lineHeight);
});

test('mobile translation and phonetics typography are boosted on mobile only', () => {
  const shortMobileTr = getDynamicTranslationStyleConfig(45, true, 1);
  const longMobileTr = getDynamicTranslationStyleConfig(320, true, 1);
  const shortDesktopTr = getDynamicTranslationStyleConfig(45, false, 1);

  assert.match(shortMobileTr.fontSize, /^clamp\(17px,/);
  assert.match(longMobileTr.fontSize, /^clamp\(15px,/);
  assert.match(shortDesktopTr.fontSize, /^clamp\(12px,/);
});

test('fullscreen or hidden HUD hides all floating chrome', () => {
  assert.equal(shouldHideAllChrome(true, true), true);
  assert.equal(shouldHideAllChrome(false, false), true);
  assert.equal(shouldHideAllChrome(false, true), false);
});

test('light white surface polarity is detected for pure white theme or light background', () => {
  assert.equal(isLightCinematicSurface('pure_white', 'dark'), true);
  assert.equal(isLightCinematicSurface('oled', 'light'), true);
  assert.equal(isLightCinematicSurface('oled', 'dark'), false);
});
