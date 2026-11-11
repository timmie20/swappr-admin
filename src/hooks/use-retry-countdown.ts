'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A wait after a 429: start(seconds) locks for that long, and secondsLeft
 * counts down once a second. Nothing retries on its own.
 */
export function useRetryCountdown() {
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) setLockedUntil(null);
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const start = useCallback((seconds: number | null) => {
    if (seconds === null || seconds <= 0) return;
    const current = Date.now();
    setNow(current);
    setLockedUntil(current + seconds * 1000);
  }, []);

  const secondsLeft = lockedUntil
    ? Math.max(0, Math.ceil((lockedUntil - now) / 1000))
    : 0;

  return { secondsLeft, isLocked: secondsLeft > 0, start };
}
