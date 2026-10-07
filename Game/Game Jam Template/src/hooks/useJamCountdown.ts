import { useState, useEffect, useCallback, useRef } from 'react';

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMilliseconds: number;
  formattedClock: string;
  isZero: boolean;
  roundTripLatencyMs: number;
  clockDriftOffsetMs: number;
  authoritativeServerTime: number;
}

interface UseJamCountdownOptions {
  targetEndTime: number;
  serverTimeHint?: number;
  sendNtpPing?: (t0: number) => void;
  onZeroHour?: () => void;
}

export function useJamCountdown({
  targetEndTime,
  serverTimeHint,
  sendNtpPing,
  onZeroHour,
}: UseJamCountdownOptions) {
  // Estimated offset: authoritativeServerTime = Date.now() + offsetMs
  const [offsetMs, setOffsetMs] = useState<number>(() => {
    if (serverTimeHint) {
      return serverTimeHint - Date.now();
    }
    return 0;
  });

  const [rttMs, setRttMs] = useState<number>(0);
  const [nowAuth, setNowAuth] = useState<number>(Date.now() + offsetMs);
  const zeroHourTriggeredRef = useRef<boolean>(false);
  const onZeroHourRef = useRef(onZeroHour);
  onZeroHourRef.current = onZeroHour;

  // Handler for NTP PONG responses from WebSocket
  const handleNtpPong = useCallback((t0: number, t1: number, t2: number) => {
    const t3 = Date.now();
    const rtt = Math.max(0, (t3 - t0) - (t2 - t1));
    const calculatedOffset = ((t1 - t0) + (t2 - t3)) / 2;

    setRttMs(rtt);
    // Exponentially smooth offset with jitter resistance
    setOffsetMs(prev => {
      if (prev === 0) return calculatedOffset;
      return prev * 0.7 + calculatedOffset * 0.3;
    });
  }, []);

  // Update offset if serverTimeHint changes dramatically
  useEffect(() => {
    if (serverTimeHint && Math.abs((serverTimeHint - Date.now()) - offsetMs) > 2000) {
      setOffsetMs(serverTimeHint - Date.now());
    }
  }, [serverTimeHint, offsetMs]);

  // Periodic NTP ping every 10 seconds if socket ping is provided
  useEffect(() => {
    if (!sendNtpPing) return;

    const ping = () => {
      sendNtpPing(Date.now());
    };

    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, [sendNtpPing]);

  // Fast animation frame / interval for smooth clock rendering
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const currentAuth = Date.now() + offsetMs;
      setNowAuth(currentAuth);

      if (targetEndTime > 0 && currentAuth >= targetEndTime && !zeroHourTriggeredRef.current) {
        zeroHourTriggeredRef.current = true;
        if (onZeroHourRef.current) {
          onZeroHourRef.current();
        }
      } else if (currentAuth < targetEndTime) {
        zeroHourTriggeredRef.current = false;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [offsetMs, targetEndTime]);

  // Calculations
  const diff = Math.max(0, targetEndTime - nowAuth);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = diff % 1000;

  const pad = (n: number) => n.toString().padStart(2, '0');

  let formattedClock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (days > 0) {
    formattedClock = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  const result: CountdownResult = {
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    totalMilliseconds: diff,
    formattedClock,
    isZero: diff === 0,
    roundTripLatencyMs: Math.round(rttMs),
    clockDriftOffsetMs: Math.round(offsetMs),
    authoritativeServerTime: nowAuth,
  };

  return {
    ...result,
    handleNtpPong,
  };
}
