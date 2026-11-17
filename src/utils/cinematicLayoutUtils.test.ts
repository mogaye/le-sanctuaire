import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMobileRootFontSizePx,
  detectIsMobileDeviceContext,
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

test('computeMobileRootFontSizePx scales wide-DPI smartphones while leaving desktop null', () => {
  assert.equal(computeMobileRootFontSizePx(1440, 900, false), null);
  assert.equal(computeMobileRootFontSizePx(390, 844, true), 16.5);
  assert.equal(computeMobileRootFontSizePx(844, 390, true), 16.5);
  assert.equal(computeMobileRootFontSizePx(360, 800, true), 16.0);
  const wideAndroid = computeMobileRootFontSizePx(660, 1420, true);
  assert.ok(wideAndroid !== null && wideAndroid >= 27.5 && wideAndroid <= 28.0);
});

test('detectIsMobileDeviceContext keeps rotated/fullscreen smartphones in mobile mode while preserving desktop mode on PC', () => {
  // Rotated smartphone in landscape or fullscreen (e.g. 844x390 iPhone / 915x412 Android)
  assert.equal(
    detectIsMobileDeviceContext({
      width: 844,
      height: 390,
      isCoarsePointer: true,
      maxTouchPoints: 5,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    }),
    true
  );

  // Android phone in fullscreen landscape
  assert.equal(
    detectIsMobileDeviceContext({
      width: 915,
      height: 412,
      isCoarsePointer: true,
      maxTouchPoints: 5,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36',
    }),
    true
  );

  // Mobile UA with desktop-site zoom viewport (980x1742)
  assert.equal(
    detectIsMobileDeviceContext({
      width: 980,
      height: 1742,
      isCoarsePointer: true,
      maxTouchPoints: 5,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36',
    }),
    true
  );

  // Standard desktop monitor / laptop stays desktop even if short window height >= 768
  assert.equal(
    detectIsMobileDeviceContext({
      width: 1440,
      height: 900,
      isCoarsePointer: false,
      maxTouchPoints: 0,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/125.0.0.0',
    }),
    false
  );
});

test('mobile Arabic typography is substantially larger than desktop and allows wide-DPI headroom', () => {
  const shortMobile = getDynamicArabicStyleConfig('بِسْمِ اللَّهِ', true, 1);
  const longMobile = getDynamicArabicStyleConfig('أ'.repeat(400), true, 1);
  const shortDesktop = getDynamicArabicStyleConfig('بِسْمِ اللَّهِ', false, 1);

  assert.match(shortMobile.fontSize, /^clamp\(38px,.*88px\)$/);
  assert.match(longMobile.fontSize, /^clamp\(22px,.*46px\)$/);
  assert.match(shortDesktop.fontSize, /^clamp\(22px,.*50px\)$/);
  assert.ok(shortMobile.lineHeight > longMobile.lineHeight);
});

test('mobile translation and phonetics typography are boosted on mobile only', () => {
  const shortMobileTr = getDynamicTranslationStyleConfig(45, true, 1);
  const longMobileTr = getDynamicTranslationStyleConfig(320, true, 1);
  const shortDesktopTr = getDynamicTranslationStyleConfig(45, false, 1);

  assert.match(shortMobileTr.fontSize, /^clamp\(17px,.*34px\)$/);
  assert.match(longMobileTr.fontSize, /^clamp\(15px,.*30px\)$/);
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
