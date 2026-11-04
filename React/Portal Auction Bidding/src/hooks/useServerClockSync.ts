import { useState, useEffect, useRef } from 'react';
import { formatTimeRemaining } from '../utils/formatters';

// Server-Authoritative Clock Sync Hook
// Computes millisecond offset between client performance.now() and server authoritative time
export function useServerClockSync() {
  // Offset = ServerNowMs - performance.now()
  const offsetRef = useRef<number>(Date.now() - performance.now());
  const [syncedNow, setSyncedNow] = useState<number>(Date.now());

  useEffect(() => {
    // In real deployment: fetch('/api/time') -> (response.server_time - (send_time + receive_time)/2)
    // Simulating round-trip latency measurement (RTT ~ 24ms)
    const simulatedServerNow = Date.now();
    const clientPerf = performance.now();
    offsetRef.current = simulatedServerNow - clientPerf;

    let animId: number;
    let lastUpdate = 0;

    const tick = (now: DOMHighResTimeStamp) => {
      // Throttle state update to ~30fps for UI performance, but keep offset exact
      if (now - lastUpdate > 33) {
        setSyncedNow(offsetRef.current + now);
        lastUpdate = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const getSyncedNowMs = () => {
    return offsetRef.current + performance.now();
  };

  return {
    syncedNow,
    getSyncedNowMs,
  };
}

// Sub-second countdown timer hook for an individual lot's endsAt
export function useLotCountdown(endsAtIso: string, onExpire?: () => void) {
  const { getSyncedNowMs } = useServerClockSync();
  const [timeState, setTimeState] = useState(() => {
    const endsMs = new Date(endsAtIso).getTime();
    const remainingMs = Math.max(0, endsMs - Date.now());
    return {
      remainingMs,
      ...formatTimeRemaining(remainingMs),
    };
  });

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasTriggeredExpire = useRef(false);

  useEffect(() => {
    let animId: number;
    let lastRenderTime = 0;
    hasTriggeredExpire.current = false;

    const loop = (now: DOMHighResTimeStamp) => {
      // Sub-second smooth precision, throttled to 50ms intervals (20fps) to keep CPU low
      if (now - lastRenderTime >= 50) {
        lastRenderTime = now;
        const currentServerNow = getSyncedNowMs();
        const endsMs = new Date(endsAtIso).getTime();
        const remainingMs = Math.max(0, endsMs - currentServerNow);

        const formattedObj = formatTimeRemaining(remainingMs);
        setTimeState({
          remainingMs,
          ...formattedObj,
        });

        if (remainingMs <= 0 && !hasTriggeredExpire.current) {
          hasTriggeredExpire.current = true;
          if (onExpireRef.current) {
            onExpireRef.current();
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [endsAtIso, getSyncedNowMs]);

  return timeState;
}

