import { useEffect, useState } from 'react';
import {
  computeMobileRootFontSizePx,
  detectIsMobileDeviceContext,
} from '../utils/cinematicLayoutUtils';

export interface MobileDeviceState {
  isMobile: boolean;
  width: number;
  height: number;
}

function readCurrentDeviceState(): MobileDeviceState {
  if (typeof window === 'undefined') {
    return { isMobile: false, width: 1024, height: 768 };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isCoarsePointer =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;

  const isMobile = detectIsMobileDeviceContext({
    width,
    height,
    isCoarsePointer,
    maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent || '' : '',
  });

  return { isMobile, width, height };
}

function applyRootMobileFontScale(state: MobileDeviceState) {
  if (typeof document === 'undefined') return;
  const rootPx = computeMobileRootFontSizePx(state.width, state.height, state.isMobile);
  const nextFontSize = rootPx !== null ? `${rootPx}px` : '';
  if (document.documentElement.style.fontSize !== nextFontSize) {
    document.documentElement.style.fontSize = nextFontSize;
  }
}

export function useMobileDevice(): MobileDeviceState {
  const [state, setState] = useState<MobileDeviceState>(() => {
    const initial = readCurrentDeviceState();
    applyRootMobileFontScale(initial);
    return initial;
  });

  useEffect(() => {
    const sync = () => {
      const next = readCurrentDeviceState();
      applyRootMobileFontScale(next);
      setState((prev) =>
        prev.isMobile === next.isMobile &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next
      );
    };

    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);

    const mediaQuery =
      typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)') : null;
    mediaQuery?.addEventListener?.('change', sync);

    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      mediaQuery?.removeEventListener?.('change', sync);
    };
  }, []);

  return state;
}
