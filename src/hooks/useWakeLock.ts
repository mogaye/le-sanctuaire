import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWakeLock Hook
 * Empêche l'appareil (smartphone, tablette ou ordinateur) de se mettre en veille
 * pendant la lecture, la récitation du Coran et les prières.
 * Utilise l'API standard Screen Wake Lock avec réacquisition automatique lors du retour sur l'onglet.
 */
export function useWakeLock(enabled: boolean = true) {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'wakeLock' in navigator;
  });
  const wakeLockRef = useRef<any>(null);

  const request = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      setIsSupported(false);
      return false;
    }
    if (document.visibilityState !== 'visible') {
      return false;
    }

    try {
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        setIsLocked(true);
        return true;
      }
      const lock = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current = lock;
      setIsLocked(true);

      lock.addEventListener('release', () => {
        setIsLocked(false);
      });
      return true;
    } catch (err) {
      console.debug('[WakeLock] Impossible d’acquérir le verrou de veille:', err);
      setIsLocked(false);
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.debug('[WakeLock] Erreur lors de la libération du verrou:', err);
      }
      wakeLockRef.current = null;
    }
    setIsLocked(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      release();
      return;
    }

    request();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        request();
      }
    };

    const handleFocus = () => {
      if (enabled) {
        request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      release();
    };
  }, [enabled, request, release]);

  return { isLocked, isSupported, request, release };
}
