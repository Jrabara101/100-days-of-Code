import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CombatGameState,
  FighterStance,
  ActionCommitPayload,
  CombatRoundResolution,
  TurnEvent,
  FloatingTextItem,
  ServerWsMessage,
  ClientWsMessage,
} from '../types/combat';
import { sound } from '../lib/audio';

const STORAGE_KEY_TOKEN = 'solar_ember_token';
const STORAGE_KEY_CODE = 'solar_ember_code';

export function useCombatEngine() {
  const [gameState, setGameState] = useState<CombatGameState | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>('slash');
  const [selectedStance, setSelectedStance] = useState<FighterStance>('BALANCED');
  const [isCommitted, setIsCommitted] = useState<boolean>(false);
  const [opponentCommitted, setOpponentCommitted] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [activeAttackVfx, setActiveAttackVfx] = useState<{
    actorId: string;
    targetId: string;
    type: string;
  } | null>(null);
  const [combatLogs, setCombatLogs] = useState<string[]>([
    'SYSTEM INITIALIZED: Volcanic Caldera Sector IX ready for tactical engagement.',
  ]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isResolvingStepByStep, setIsResolvingStepByStep] = useState<boolean>(false);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(15000);

  const socketRef = useRef<WebSocket | null>(null);
  const tokenRef = useRef<string | null>(localStorage.getItem(STORAGE_KEY_TOKEN));
  const activeRoundRef = useRef<number>(1);

  // Trigger floating combat text with auto cleanup
  const spawnFloatingText = useCallback(
    (text: string, type: FloatingTextItem['type'], targetFighterId: string) => {
      const id = 'flt-' + Math.random().toString(36).substr(2, 9);
      const xOffset = (Math.random() - 0.5) * 40;
      setFloatingTexts((prev) => [...prev, { id, text, type, targetFighterId, xOffset }]);

      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 1300);
    },
    []
  );

  // Screen shake trigger
  const triggerScreenShake = useCallback(() => {
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 450);
  }, []);

  // Send message helper
  const sendMessage = useCallback((msg: ClientWsMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Sequencer for Step-by-Step Round Resolution
  const playResolutionSequencer = useCallback(
    (resolution: CombatRoundResolution) => {
      setIsResolvingStepByStep(true);
      const events = resolution.turnEvents;
      let delay = 300;

      events.forEach((evt: TurnEvent, index: number) => {
        setTimeout(() => {
          // Play VFX and audio
          if (evt.actionType === 'DEFEND') {
            sound.playBlock();
            spawnFloatingText('DEFENSE PRIMED', 'block', evt.actingFighterId);
          } else if (evt.wasParried) {
            sound.playParry();
            triggerScreenShake();
            spawnFloatingText('PARRY COUNTER!', 'parry', evt.actingFighterId);
          } else if (evt.wasBlocked) {
            sound.playBlock();
            spawnFloatingText(`BLOCKED -${evt.damageDealt}`, 'block', evt.targetFighterId);
          } else if (evt.staggerBreakOccurred) {
            sound.playStaggerBreak();
            triggerScreenShake();
            spawnFloatingText('💥 STAGGER BREAK!', 'break', evt.targetFighterId);
          } else if (evt.wasCritical) {
            sound.playCrit();
            triggerScreenShake();
            spawnFloatingText(`CRIT! -${evt.damageDealt}`, 'crit', evt.targetFighterId);
          } else if (evt.actionType === 'ULTIMATE') {
            sound.playUltimate();
            triggerScreenShake();
            spawnFloatingText(`SUPERNOVA -${evt.damageDealt}`, 'crit', evt.targetFighterId);
          } else {
            sound.playSlash();
            spawnFloatingText(`-${evt.damageDealt}`, 'damage', evt.targetFighterId);
          }

          // Show slash / impact animation
          setActiveAttackVfx({
            actorId: evt.actingFighterId,
            targetId: evt.targetFighterId,
            type: evt.actionType,
          });
          setTimeout(() => setActiveAttackVfx(null), 400);

          // Add to combat log
          setCombatLogs((prev) => [evt.logText, ...prev]);

          // End of playback
          if (index === events.length - 1) {
            setTimeout(() => {
              setIsResolvingStepByStep(false);
            }, 600);
          }
        }, delay);

        delay += 950;
      });
    },
    [spawnFloatingText, triggerScreenShake]
  );

  // WebSocket Connection Lifecycle
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Attempt reconnection if token exists
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const savedCode = localStorage.getItem(STORAGE_KEY_CODE);
      if (savedToken && savedCode) {
        ws.send(
          JSON.stringify({
            type: 'RECONNECT',
            payload: { token: savedToken, roomCode: savedCode },
          })
        );
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerWsMessage;

        switch (msg.type) {
          case 'ROOM_CREATED':
          case 'ROOM_JOINED': {
            const { token, roomCode } = msg.payload;
            tokenRef.current = token;
            localStorage.setItem(STORAGE_KEY_TOKEN, token);
            localStorage.setItem(STORAGE_KEY_CODE, roomCode);
            break;
          }

          case 'STATE_SYNC': {
            const newState = msg.payload;
            setGameState(newState);

            if (newState.roundNumber !== activeRoundRef.current) {
              activeRoundRef.current = newState.roundNumber;
              setIsCommitted(false);
              setOpponentCommitted(false);
              setSelectedActionId('slash');
            }

            if (newState.planningTimeRemainingMs !== undefined) {
              setTimeRemainingMs(newState.planningTimeRemainingMs);
            }
            break;
          }

          case 'OPPONENT_COMMITTED': {
            setOpponentCommitted(msg.payload.isCommitted);
            break;
          }

          case 'ROUND_RESOLVED': {
            playResolutionSequencer(msg.payload);
            break;
          }

          case 'TIMER_TICK': {
            setTimeRemainingMs(msg.payload.timeRemainingMs);
            if (msg.payload.timeRemainingMs <= 3000 && msg.payload.timeRemainingMs > 0) {
              sound.playTick();
            }
            break;
          }

          case 'MATCH_ENDED': {
            if (msg.payload.winnerId === gameState?.playerFighter.id) {
              sound.playVictory();
            }
            break;
          }

          case 'ERROR': {
            console.error('Combat Engine Server Error:', msg.payload.message);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [playResolutionSequencer]);

  // Actions
  const createRoom = useCallback(
    (fighterName: string, isAi: boolean) => {
      sendMessage({
        type: 'CREATE_ROOM',
        payload: { fighterName, isAi },
      });
    },
    [sendMessage]
  );

  const joinRoom = useCallback(
    (roomCode: string, fighterName: string) => {
      sendMessage({
        type: 'JOIN_ROOM',
        payload: { roomCode, fighterName },
      });
    },
    [sendMessage]
  );

  const selectAction = useCallback((actionId: string) => {
    if (!isCommitted) {
      setSelectedActionId(actionId);
    }
  }, [isCommitted]);

  const commitAction = useCallback(() => {
    if (!selectedActionId || !gameState || isCommitted) return;

    const payload: ActionCommitPayload = {
      actionId: selectedActionId,
      targetId: gameState.enemyFighter.id,
      stanceModifier: selectedStance,
    };

    setIsCommitted(true);
    sound.playClick();
    sendMessage({
      type: 'COMMIT_ACTION',
      payload,
    });
  }, [selectedActionId, gameState, isCommitted, selectedStance, sendMessage]);

  const requestRematch = useCallback(() => {
    sendMessage({ type: 'REQUEST_REMATCH' });
  }, [sendMessage]);

  return {
    gameState,
    isConnected,
    isCommitted,
    opponentCommitted,
    selectedActionId,
    selectedStance,
    floatingTexts,
    isScreenShaking,
    activeAttackVfx,
    combatLogs,
    isResolvingStepByStep,
    timeRemainingMs,
    createRoom,
    joinRoom,
    selectAction,
    setStance: setSelectedStance,
    commitAction,
    requestRematch,
  };
}
