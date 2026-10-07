import { useEffect, useRef, useCallback } from 'react';
import { formatTime, splitTimeParts } from '../utils/formatters';

interface UsePrecisionStopwatchOptions {
  isRunning: boolean;
  authoritativeStartMonoMs: number;
  clockOffsetMs: number; // calculated from NTP ping-pong
  frozenElapsedMs?: number; // when race has finished or paused
}

export function usePrecisionStopwatch({
  isRunning,
  authoritativeStartMonoMs,
  clockOffsetMs,
  frozenElapsedMs,
}: UsePrecisionStopwatchOptions) {
  const mainTextRef = useRef<HTMLSpanElement | null>(null);
  const msTextRef = useRef<HTMLSpanElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const latestElapsedRef = useRef<number>(0);

  // High-precision getter for exact moment of split
  const getAuthoritativeElapsedMs = useCallback((): number => {
    if (!isRunning) {
      return frozenElapsedMs ?? latestElapsedRef.current;
    }
    const currentMono = performance.now() + clockOffsetMs;
    const elapsed = Math.max(0, currentMono - authoritativeStartMonoMs);
    latestElapsedRef.current = elapsed;
    return elapsed;
  }, [isRunning, authoritativeStartMonoMs, clockOffsetMs, frozenElapsedMs]);

  // RequestAnimationFrame loop writing directly to leaf DOM nodes
  useEffect(() => {
    const updateDom = () => {
      let elapsed = 0;
      if (isRunning && authoritativeStartMonoMs > 0) {
        const currentMono = performance.now() + clockOffsetMs;
        elapsed = Math.max(0, currentMono - authoritativeStartMonoMs);
      } else if (frozenElapsedMs !== undefined) {
        elapsed = frozenElapsedMs;
      }
      latestElapsedRef.current = elapsed;

      const { main, ms } = splitTimeParts(elapsed);

      if (mainTextRef.current && mainTextRef.current.textContent !== main) {
        mainTextRef.current.textContent = main;
      }
      if (msTextRef.current && msTextRef.current.textContent !== ms) {
        msTextRef.current.textContent = `.${ms}`;
      }

      if (isRunning) {
        rafIdRef.current = requestAnimationFrame(updateDom);
      }
    };

    if (isRunning) {
      rafIdRef.current = requestAnimationFrame(updateDom);
    } else {
      updateDom();
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isRunning, authoritativeStartMonoMs, clockOffsetMs, frozenElapsedMs]);

  return {
    mainTextRef,
    msTextRef,
    getAuthoritativeElapsedMs,
  };
}
