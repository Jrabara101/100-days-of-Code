import { useState, useEffect, useRef } from 'react';

export interface LeaderboardItem {
  playerId: string;
  handle: string;
  lifetimeCurrency: string;
  prestigeShards: number;
  highestCps: string;
  updatedAt: number;
  isVerified: boolean;
}

export function useGameWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial leaderboard via REST
  const refreshLeaderboard = async () => {
    try {
      const res = await fetch('/api/idle/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    refreshLeaderboard();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    let socket: WebSocket;
    let retryTimeout: any;

    const connect = () => {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'INITIAL_STATE' && data.payload?.leaderboard) {
              setLeaderboard(data.payload.leaderboard);
            } else if (data.type === 'LEADERBOARD_UPDATE') {
              if (data.payload?.leaderboard) {
                setLeaderboard(data.payload.leaderboard);
              } else {
                refreshLeaderboard();
              }
              if (data.payload?.handle && data.payload?.awardedShards) {
                setLatestAnnouncement(
                  `✨ ${data.payload.handle} just collapsed their reactor and ascended with +${data.payload.awardedShards} Shards!`
                );
                setTimeout(() => setLatestAnnouncement(null), 8000);
              }
            } else if (data.type === 'COSMIC_ANOMALY') {
              setLatestAnnouncement(`⚡ Planetary Cosmic Event: ${data.payload.type} anomaly detected in sector!`);
              setTimeout(() => setLatestAnnouncement(null), 6000);
            }
          } catch {
            // ignore non-json
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          retryTimeout = setTimeout(connect, 5000);
        };

        socket.onerror = () => {
          setIsConnected(false);
          socket.close();
        };
      } catch {
        setIsConnected(false);
        retryTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    // Heartbeat ping every 25s
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      clearTimeout(retryTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    leaderboard,
    latestAnnouncement,
    refreshLeaderboard,
  };
}
