import { useState, useEffect, useRef, useCallback } from 'react';

export interface TickerMessage {
  id: string;
  text: string;
  type: 'INFO' | 'RECORD' | 'ALERT';
  timestamp: number;
}

export function useGameRelay() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlinePilots, setOnlinePilots] = useState<number>(14);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([
    {
      id: 'init_1',
      text: 'TACTICAL COMMAND: Sector 09 anomaly confirmed. Maintain intercept vector.',
      type: 'INFO',
      timestamp: Date.now(),
    },
  ]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT') {
            if (data.activePilots) setOnlinePilots(data.activePilots);
          } else if (data.type === 'TICKER') {
            setTickerMessages((prev) => [
              {
                id: `msg_${Date.now()}_${Math.random()}`,
                text: data.message,
                type: 'INFO',
                timestamp: data.timestamp || Date.now(),
              },
              ...prev.slice(0, 4),
            ]);
          } else if (data.type === 'NEW_RECORD') {
            setTickerMessages((prev) => [
              {
                id: `rec_${Date.now()}_${Math.random()}`,
                text: `🏆 NEW RECORD: ${data.callsign} logged ${data.score.toLocaleString()} pts (Wave ${data.wave})!`,
                type: 'RECORD',
                timestamp: data.timestamp || Date.now(),
              },
              ...prev.slice(0, 4),
            ]);
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.warn('WebSocket connection not available');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendGhostTelemetry = useCallback((callsign: string, x: number, y: number, wave: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'GHOST_TELEMETRY',
          callsign,
          x,
          y,
          wave,
        })
      );
    }
  }, []);

  return {
    isConnected,
    onlinePilots,
    latestTicker: tickerMessages[0]?.text || 'COMM-LINK: OPTIMAL // MONITORING SECTOR',
    tickerMessages,
    sendGhostTelemetry,
  };
}
