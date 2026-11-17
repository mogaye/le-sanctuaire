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
    minPx = isMobile ? 22 : 14;
    preferredVw = isMobile ? 5.8 : 1.8;
    preferredVh = isMobile ? 3.5 : 2.8;
    maxPx = isMobile ? 30 : 24;
    lineHt = 1.62;
  } else if (len > 220) {
    minPx = isMobile ? 25 : 16;
    preferredVw = isMobile ? 6.7 : 2.2;
    preferredVh = isMobile ? 4.0 : 3.3;
    maxPx = isMobile ? 35 : 28;
    lineHt = 1.68;
  } else if (len > 130) {
    minPx = isMobile ? 29 : 17;
    preferredVw = isMobile ? 7.8 : 2.6;
    preferredVh = isMobile ? 4.6 : 3.8;
    maxPx = isMobile ? 41 : 34;
    lineHt = 1.72;
  } else if (len > 60) {
    minPx = isMobile ? 33 : 19;
    preferredVw = isMobile ? 8.9 : 3.0;
    preferredVh = isMobile ? 5.3 : 4.4;
    maxPx = isMobile ? 47 : 40;
    lineHt = 1.78;
  } else {
    minPx = isMobile ? 38 : 22;
    preferredVw = isMobile ? 10.2 : 3.8;
    preferredVh = isMobile ? 6.2 : 5.2;
    maxPx = isMobile ? 56 : 50;
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
  let minPx = isMobile ? 17 : 12;
  let preferredVw = isMobile ? 4.8 : 1.2;
  let preferredVh = isMobile ? 2.8 : 1.9;
  let maxPx = isMobile ? 22 : 16;
  let lineHt = isMobile ? 1.56 : 1.55;

  if (len > 280) {
    minPx = isMobile ? 15 : 10.5;
    preferredVw = isMobile ? 4.2 : 1.0;
    preferredVh = isMobile ? 2.4 : 1.5;
    maxPx = isMobile ? 19 : 13.5;
    lineHt = isMobile ? 1.5 : 1.55;
  }

  return {
    fontSize: `clamp(${Math.round(minPx * m)}px, min(${(preferredVw * m).toFixed(2)}vw, ${(preferredVh * m).toFixed(2)}vh), ${Math.round(maxPx * m)}px)`,
    lineHeight: lineHt,
  };
}

export function shouldHideAllChrome(isFullscreen: boolean, isHudVisible: boolean): boolean {
  return !isHudVisible || isFullscreen;
}

export function isLightCinematicSurface(
  themeId: string,
  bgPolarity?: 'dark' | 'light'
): boolean {
  return themeId === 'pure_white' || bgPolarity === 'light';
}
