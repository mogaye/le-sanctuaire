export interface DynamicTextStyle {
  fontSize: string;
  lineHeight: number;
}

export type CinematicOrientationMode = 'vertical-9-16' | 'desktop-fullscreen';

export function isMobileViewport(width: number): boolean {
  return width < 768;
}

export function getCinematicOrientationMode(viewportWidth: number): CinematicOrientationMode {
  return isMobileViewport(viewportWidth) ? 'vertical-9-16' : 'desktop-fullscreen';
}

export function getDynamicArabicStyleConfig(
  arText: string,
  isMobile: boolean,
  fontSizeLevel: number
): DynamicTextStyle {
  const len = arText?.length || 0;

  let minPx = 18;
  let preferredVw = 3.6;
  let preferredVh = 4.8;
  let maxPx = 48;
  let lineHt = 1.75;

  if (len > 350) {
    minPx = isMobile ? 16 : 14;
    preferredVw = isMobile ? 4.1 : 1.8;
    preferredVh = isMobile ? 2.5 : 2.8;
    maxPx = isMobile ? 22 : 24;
    lineHt = 1.62;
  } else if (len > 220) {
    minPx = isMobile ? 18 : 16;
    preferredVw = isMobile ? 4.6 : 2.2;
    preferredVh = isMobile ? 3.0 : 3.3;
    maxPx = isMobile ? 26 : 28;
    lineHt = 1.68;
  } else if (len > 130) {
    minPx = isMobile ? 21 : 17;
    preferredVw = isMobile ? 5.2 : 2.6;
    preferredVh = isMobile ? 3.6 : 3.8;
    maxPx = isMobile ? 31 : 34;
    lineHt = 1.74;
  } else if (len > 60) {
    minPx = isMobile ? 24 : 19;
    preferredVw = isMobile ? 6.0 : 3.0;
    preferredVh = isMobile ? 4.2 : 4.4;
    maxPx = isMobile ? 36 : 40;
    lineHt = 1.78;
  } else {
    minPx = isMobile ? 28 : 22;
    preferredVw = isMobile ? 7.0 : 3.8;
    preferredVh = isMobile ? 5.0 : 5.2;
    maxPx = isMobile ? 44 : 50;
    lineHt = 1.85;
  }

  const multipliers = [0.85, 1.0, 1.15, 1.3];
  const m = multipliers[fontSizeLevel] || 1.0;

  const finalMin = Math.round(minPx * m);
  const finalVw = (preferredVw * m).toFixed(2);
  const finalVh = (preferredVh * m).toFixed(2);
  const finalMax = Math.round(maxPx * m);

  return {
    fontSize: `clamp(${finalMin}px, min(${finalVw}vw, ${finalVh}vh), ${finalMax}px)`,
    lineHeight: lineHt,
  };
}

export function getDynamicTranslationStyleConfig(
  len: number,
  isMobile: boolean,
  fontSizeLevel: number
): DynamicTextStyle {
  const multipliers = [0.85, 1.0, 1.15, 1.3];
  const m = multipliers[fontSizeLevel] || 1.0;
  let minPx = isMobile ? 13 : 12;
  let preferredVw = isMobile ? 3.6 : 1.2;
  let preferredVh = isMobile ? 2.1 : 1.9;
  let maxPx = isMobile ? 16 : 16;

  if (len > 280) {
    minPx = isMobile ? 11.5 : 10.5;
    preferredVw = isMobile ? 3.1 : 1.0;
    preferredVh = isMobile ? 1.7 : 1.5;
    maxPx = isMobile ? 14 : 13.5;
  }

  return {
    fontSize: `clamp(${Math.round(minPx * m)}px, min(${(preferredVw * m).toFixed(2)}vw, ${(preferredVh * m).toFixed(2)}vh), ${Math.round(maxPx * m)}px)`,
    lineHeight: 1.55,
  };
}

export function shouldHideAllChrome(isFullscreen: boolean, isHudVisible: boolean): boolean {
  return !isHudVisible || isFullscreen;
}
