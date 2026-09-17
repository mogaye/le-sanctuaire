import { useState, useEffect, useCallback } from 'react';
import { SPIRITUAL_VERSES, SpiritualVerse } from '../data/spiritualVerses';

/**
 * Hook to rotate spiritual Quranic verses every minute (60 seconds) randomly.
 * @param intervalMs rotation interval in milliseconds (defaults to 60000 ms = 1 minute)
 * @param initialOffset optional offset to prevent multiple cards on same page having identical verse
 */
export function useSpiritualVerseTimer(intervalMs: number = 60000, initialOffset: number = 0) {
  const [verseIndex, setVerseIndex] = useState<number>(() => {
    if (SPIRITUAL_VERSES.length === 0) return 0;
    return (Math.floor(Math.random() * SPIRITUAL_VERSES.length) + initialOffset) % SPIRITUAL_VERSES.length;
  });

  const nextRandomVerse = useCallback(() => {
    setVerseIndex((prevIndex) => {
      if (SPIRITUAL_VERSES.length <= 1) return 0;
      let nextIndex = Math.floor(Math.random() * SPIRITUAL_VERSES.length);
      // Ensure it doesn't repeat the exact same verse consecutively
      while (nextIndex === prevIndex) {
        nextIndex = Math.floor(Math.random() * SPIRITUAL_VERSES.length);
      }
      return nextIndex;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      nextRandomVerse();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, nextRandomVerse]);

  const currentVerse: SpiritualVerse = SPIRITUAL_VERSES[verseIndex] || SPIRITUAL_VERSES[0];

  return {
    currentVerse,
    verseIndex,
    totalVerses: SPIRITUAL_VERSES.length,
    nextRandomVerse,
  };
}
