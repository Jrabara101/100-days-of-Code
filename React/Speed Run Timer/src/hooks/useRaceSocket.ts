import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MultiplayerRaceState, 
  SplitSegmentDefinition, 
  PlayerSegmentRecord,
  RaceParticipant,
  ServerMessage,
  ClientMessage
} from '../types/race';

interface UseRaceSocketOptions {
  onSplitRecorded?: (data: { playerId: string; record: PlayerSegmentRecord; isGold?: boolean; surgeAlert?: boolean }) => void;
  onSurgeAlert?: (data: { playerId: string; username: string; message: string; isGold: boolean }) => void;
  onCountdownTick?: (remainingMs: number) => void;
  onRaceStarted?: (serverStartTimestamp: number) => void;
}

export function useRaceSocket(options?: UseRaceSocketOptions) {
  const [raceState, setRaceState] = useState<MultiplayerRaceState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>(() => {
    return localStorage.getItem('speedsync_player_id') || '';
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [pingRttMs, setPingRttMs] = useState<number>(14);
  const [clockOffsetMs, setClockOffsetMs] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const smoothedOffsetRef = useRef<number>(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Determine WebSocket URL based on current host & protocol
  const getWsUrl = useCallback(() => {
    const isHttps = window.location.protocol === 'https:';
    const proto = isHttps ? 'wss:' : 'ws:';
    // In dev, Vite proxies /ws to Fastify server port 3005
    return `${proto}//${window.location.host}/ws`;
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  // NTP Ping-Pong latency calibration
  const sendPing = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      send({
        type: 'SYNC_PING',
        clientSendTime: performance.now(),
      });
    }
  }, [send]);

  useEffect(() => {
    let reconnectTimeout: number;

    const connect = () => {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);
        // Initial ping-pong calibration
        sendPing();
        // Periodic NTP calibration every 2500ms
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = window.setInterval(sendPing, 2500);

        // Check if URL has ?room=XXXX
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        const savedUsername = localStorage.getItem('speedsync_username') || `Racer_${Math.floor(Math.random() * 900 + 100)}`;
        const savedAvatar = localStorage.getItem('speedsync_avatar') || `https://api.dicebear.com/7.x/bottts/svg?seed=${savedUsername}`;

        if (roomCode) {
          send({
            type: 'JOIN_ROOM',
            roomCode,
            username: savedUsername,
            avatarUrl: savedAvatar,
          });
        } else {
          // Join default initial demo room (NX9Q)
          send({
            type: 'JOIN_ROOM',
            roomCode: 'NX9Q',
            username: savedUsername,
            avatarUrl: savedAvatar,
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            // 1. Monotonic NTP calibration pong
            case 'SYNC_PONG': {
              const now = performance.now();
              const rtt = Math.max(1, now - msg.clientSendTime);
              setPingRttMs(Math.round(rtt));

              // Compute offset: serverTime - (clientSendTime + oneWayLatency)
              const oneWayLatency = rtt / 2;
              const instantOffset = msg.serverTime - (msg.clientSendTime + oneWayLatency);

              // Exponential smoothing filter
              if (smoothedOffsetRef.current === 0) {
                smoothedOffsetRef.current = instantOffset;
              } else {
                smoothedOffsetRef.current = 0.8 * smoothedOffsetRef.current + 0.2 * instantOffset;
              }
              setClockOffsetMs(smoothedOffsetRef.current);
              break;
            }

            // 2. Room State Initial Load
            case 'ROOM_STATE': {
              setRaceState(msg.state);
              setMyPlayerId(msg.yourPlayerId);
              localStorage.setItem('speedsync_player_id', msg.yourPlayerId);
              break;
            }

            // 3. Room State Dynamic Update
            case 'ROOM_UPDATE': {
              setRaceState(msg.state);
              break;
            }

            // 4. Countdown Tick
            case 'COUNTDOWN_TICK': {
              if (optionsRef.current?.onCountdownTick) {
                optionsRef.current.onCountdownTick(msg.remainingMs);
              }
              break;
            }

            // 5. Race Started
            case 'RACE_STARTED': {
              if (optionsRef.current?.onRaceStarted) {
                optionsRef.current.onRaceStarted(msg.serverStartTimestamp);
              }
              break;
            }

            // 6. Authoritative Split Recorded
            case 'SPLIT_RECORDED': {
              if (optionsRef.current?.onSplitRecorded) {
                optionsRef.current.onSplitRecorded({
                  playerId: msg.playerId,
                  record: msg.splitRecord,
                  isGold: msg.isGold,
                  surgeAlert: msg.surgeAlert,
                });
              }
              break;
            }

            // 7. Audio-Visual Surge Alert
            case 'SURGE_ALERT': {
              if (optionsRef.current?.onSurgeAlert) {
                optionsRef.current.onSurgeAlert({
                  playerId: msg.playerId,
                  username: msg.username,
                  message: msg.message,
                  isGold: msg.isGold,
                });
              }
              break;
            }

            // 8. Error
            case 'ERROR': {
              setErrorMessage(msg.message);
              break;
            }
          }
        } catch (e) {
          console.error('Error handling WebSocket message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        reconnectTimeout = window.setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      clearTimeout(reconnectTimeout);
      if (socketRef.current) socketRef.current.close();
    };
  }, [getWsUrl, send, sendPing]);

  // Actions
  const createRoom = useCallback((
    gameTitle: string,
    categoryName: string,
    segments?: SplitSegmentDefinition[],
    username?: string,
    avatarUrl?: string
  ) => {
    const user = username || localStorage.getItem('speedsync_username') || 'Runner 1';
    const avatar = avatarUrl || localStorage.getItem('speedsync_avatar') || `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`;
    send({
      type: 'CREATE_ROOM',
      gameTitle,
      categoryName,
      segments,
      username: user,
      avatarUrl: avatar,
    });
  }, [send]);

  const joinRoom = useCallback((roomCode: string, username?: string, avatarUrl?: string) => {
    const user = username || localStorage.getItem('speedsync_username') || `Rival_${Math.floor(Math.random() * 900 + 100)}`;
    const avatar = avatarUrl || localStorage.getItem('speedsync_avatar') || `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`;
    send({
      type: 'JOIN_ROOM',
      roomCode: roomCode.trim().toUpperCase(),
      username: user,
      avatarUrl: avatar,
    });
  }, [send]);

  const toggleReady = useCallback(() => {
    if (!raceState || !myPlayerId) return;
    send({
      type: 'TOGGLE_READY',
      roomId: raceState.roomId,
      playerId: myPlayerId,
    });
  }, [raceState, myPlayerId, send]);

  const changeCategory = useCallback((templateId: string) => {
    if (!raceState || !myPlayerId) return;
    send({
      type: 'CHANGE_CATEGORY',
      roomId: raceState.roomId,
      playerId: myPlayerId,
      templateId,
    });
  }, [raceState, myPlayerId, send]);

  const startCountdown = useCallback(() => {
    if (!raceState || !myPlayerId) return;
    send({
      type: 'START_COUNTDOWN',
      roomId: raceState.roomId,
      playerId: myPlayerId,
    });
  }, [raceState, myPlayerId, send]);

  const submitSplit = useCallback((splitIndex: number, elapsedClientMs: number) => {
    if (!raceState || !myPlayerId) return;
    send({
      type: 'SUBMIT_SPLIT',
      roomId: raceState.roomId,
      playerId: myPlayerId,
      splitIndex,
      elapsedClientMs,
    });
  }, [raceState, myPlayerId, send]);

  const undoSplit = useCallback(() => {
    if (!raceState || !myPlayerId) return;
    send({
      type: 'UNDO_SPLIT',
      roomId: raceState.roomId,
      playerId: myPlayerId,
    });
  }, [raceState, myPlayerId, send]);

  const skipSplit = useCallback(() => {
    if (!raceState || !myPlayerId) return;
    send({
      type: 'SKIP_SPLIT',
      roomId: raceState.roomId,
      playerId: myPlayerId,
    });
  }, [raceState, myPlayerId, send]);

  const resetRun = useCallback(() => {
    if (!raceState || !myPlayerId) return;
    send({
      type: 'RESET_RUN',
      roomId: raceState.roomId,
      playerId: myPlayerId,
    });
  }, [raceState, myPlayerId, send]);

  const addGhost = useCallback((ghostType: 'WR' | 'PB' | 'DEV_TARGET') => {
    if (!raceState) return;
    send({
      type: 'ADD_GHOST',
      roomId: raceState.roomId,
      ghostType,
    });
  }, [raceState, send]);

  const removeGhost = useCallback((ghostId: string) => {
    if (!raceState) return;
    send({
      type: 'REMOVE_GHOST',
      roomId: raceState.roomId,
      ghostId,
    });
  }, [raceState, send]);

  const updateTelemetry = useCallback((runTimeMs: number, apm?: number, velocity?: number) => {
    if (!raceState || !myPlayerId) return;
    send({
      type: 'UPDATE_TELEMETRY',
      roomId: raceState.roomId,
      playerId: myPlayerId,
      currentRunTimeMs: runTimeMs,
      inputRate: apm,
      velocity,
    });
  }, [raceState, myPlayerId, send]);

  // Derived current player
  const myParticipant: RaceParticipant | undefined = raceState?.participants.find(
    p => p.playerId === myPlayerId
  );

  return {
    raceState,
    myPlayerId,
    myParticipant,
    isConnected,
    pingRttMs,
    clockOffsetMs,
    errorMessage,
    setErrorMessage,
    createRoom,
    joinRoom,
    toggleReady,
    changeCategory,
    startCountdown,
    submitSplit,
    undoSplit,
    skipSplit,
    resetRun,
    addGhost,
    removeGhost,
    updateTelemetry,
  };
}
