import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNetwork } from './NetworkContext';
import { INITIAL_GAME_STATE, checkPhase1Completion, checkPhase2Completion } from '../utils/puzzleEngine';
import { soundSynth } from '../utils/audioSynth';
import confetti from 'canvas-confetti';

const GameStateContext = createContext(null);

export function GameStateProvider({ children }) {
  const { sendEvent, addEventListener, playerRole } = useNetwork();
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const isSyncingFromRemoteRef = useRef(false);

  // Sync state broadcast helper
  const syncState = useCallback((updater) => {
    setGameState((prev) => {
      const nextState = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      if (!isSyncingFromRemoteRef.current) {
        sendEvent('STATE_SYNC', { gameState: nextState });
      }
      return nextState;
    });
  }, [sendEvent]);

  // Log message helper
  const addLog = useCallback((sender, text, color = 'text-outline') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    syncState((prev) => ({
      ...prev,
      logs: [
        ...prev.logs.slice(-25), // keep last 25 logs
        {
          id: Math.random().toString(36).substring(2, 9),
          time: timeStr,
          sender,
          text,
          color
        }
      ]
    }));
  }, [syncState]);

  // Listen to remote network events
  useEffect(() => {
    const removeListener = addEventListener((data) => {
      if (data.type === 'STATE_SYNC' && data.payload?.gameState) {
        isSyncingFromRemoteRef.current = true;
        setGameState(data.payload.gameState);
        setTimeout(() => {
          isSyncingFromRemoteRef.current = false;
        }, 30);
      } else if (data.type === 'CHAT_MSG') {
        addLog(data.payload.sender, data.payload.text, data.payload.color);
        soundSynth.playClick(600);
      } else if (data.type === 'HAZARD_OVERRIDE') {
        soundSynth.playWarning();
      }
    });

    return removeListener;
  }, [addEventListener, addLog]);

  // Reactor countdown timer
  useEffect(() => {
    if (!gameState.isTimerRunning || gameState.phase >= 4) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.countdownSeconds <= 0.1) {
          clearInterval(interval);
          return { ...prev, countdownSeconds: 0, isTimerRunning: false };
        }
        return { ...prev, countdownSeconds: Math.max(0, prev.countdownSeconds - 0.1) };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.isTimerRunning, gameState.phase]);

  // --- ALPHA ACTIONS (Player 1 / Cyan) ---
  const toggleAlphaNode = (nodeId) => {
    soundSynth.playClick(750);
    syncState((prev) => {
      const exists = prev.alpha.activeNodes.includes(nodeId);
      const nextNodes = exists
        ? prev.alpha.activeNodes.filter((id) => id !== nodeId)
        : [...prev.alpha.activeNodes, nodeId];

      return {
        ...prev,
        alpha: {
          ...prev.alpha,
          activeNodes: nextNodes
        }
      };
    });
  };

  const updateAlphaControl = (key, value) => {
    if (typeof value === 'boolean') {
      soundSynth.playToggle(value);
    } else {
      soundSynth.playClick(900);
    }
    syncState((prev) => ({
      ...prev,
      alpha: {
        ...prev.alpha,
        [key]: value
      }
    }));
  };

  const pulseFrequency = () => {
    soundSynth.playPulse();
    const result = checkPhase1Completion(gameState.alpha, gameState.beta);

    if (result.success) {
      soundSynth.playStageComplete();
      addLog('SYS', result.message, 'text-tertiary');
      syncState((prev) => ({
        ...prev,
        phase: Math.max(prev.phase, 2),
        syncLock: 55.0,
        overcharge: Math.max(10, prev.overcharge - 6)
      }));
    } else {
      soundSynth.playError();
      addLog('SYS', result.message, 'text-error');
      syncState((prev) => ({
        ...prev,
        overcharge: Math.min(100, prev.overcharge + 8)
      }));
    }
  };

  // --- BETA ACTIONS (Player 2 / Amber) ---
  const rotateBetaHex = (hexId) => {
    soundSynth.playClick(550);
    syncState((prev) => {
      const currentRot = prev.beta.hexRotations[hexId] || 0;
      const nextRot = (currentRot + 60) % 360;

      return {
        ...prev,
        beta: {
          ...prev.beta,
          hexRotations: {
            ...prev.beta.hexRotations,
            [hexId]: nextRot
          }
        }
      };
    });
  };

  const updateBetaControl = (key, value) => {
    if (typeof value === 'boolean') {
      soundSynth.playToggle(value);
    } else {
      soundSynth.playClick(650);
    }
    syncState((prev) => ({
      ...prev,
      beta: {
        ...prev.beta,
        [key]: value
      }
    }));
  };

  const dispatchFlux = () => {
    soundSynth.playPulse();
    const result = checkPhase2Completion(gameState.alpha, gameState.beta);

    if (result.success) {
      soundSynth.playStageComplete();
      addLog('SYS', result.message, 'text-tertiary');
      syncState((prev) => ({
        ...prev,
        phase: Math.max(prev.phase, 3),
        syncLock: 87.4,
        overcharge: Math.max(5, prev.overcharge - 10)
      }));
    } else {
      soundSynth.playError();
      addLog('SYS', result.message, 'text-error');
      syncState((prev) => ({
        ...prev,
        overcharge: Math.min(100, prev.overcharge + 10)
      }));
    }
  };

  // --- STAGE 3 CIPHER & DUAL-KEY INTERLOCK ---
  const submitCipherCode = (code) => {
    if (code === gameState.cipher.solutionCode) {
      soundSynth.playStageComplete();
      addLog('SYS', 'DECRYPTION VERIFIED: Dual-Key interlock magnetic clamps released.', 'text-tertiary');
      syncState((prev) => ({
        ...prev,
        cipher: {
          ...prev.cipher,
          enteredCode: code,
          codeUnlocked: true
        }
      }));
      return true;
    } else {
      soundSynth.playError();
      addLog('SYS', 'CIPHER REJECTED: Invalid checksum vector.', 'text-error');
      return false;
    }
  };

  const setKeyInterlockHeld = (role, isHeld) => {
    const now = isHeld ? Date.now() : null;
    soundSynth.playClick(isHeld ? 950 : 350);

    syncState((prev) => {
      const nextAlphaKey = role === 'p1' ? isHeld : prev.alpha.keyHeld;
      const nextBetaKey = role === 'p2' ? isHeld : prev.beta.keyHeld;
      const nextAlphaTime = role === 'p1' ? now : prev.alpha.keyHeldAt;
      const nextBetaTime = role === 'p2' ? now : prev.beta.keyHeldAt;

      let nextPhase = prev.phase;
      let nextSyncLock = prev.syncLock;

      // Check if both keys are held down simultaneously
      if (nextAlphaKey && nextBetaKey) {
        soundSynth.playVictory();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        nextPhase = 4; // ESCAPED!
        nextSyncLock = 100.0;
        addLog('SYS', 'QUANTUM BUS SYNCHRONIZED // FACILITY LOCK RELEASED! ESCAPE COMPLETE.', 'text-tertiary');
      }

      return {
        ...prev,
        phase: nextPhase,
        syncLock: nextSyncLock,
        alpha: {
          ...prev.alpha,
          keyHeld: nextAlphaKey,
          keyHeldAt: nextAlphaTime
        },
        beta: {
          ...prev.beta,
          keyHeld: nextBetaKey,
          keyHeldAt: nextBetaTime
        }
      };
    });
  };

  // --- MANUAL HAZARD EMERGENCY LATCH ---
  const pullHazardLatch = () => {
    soundSynth.playWarning();
    addLog('SYS', 'EMERGENCY HAZARD LATCH PULLED: Pressure vented, +60s window gained.', 'text-error');
    sendEvent('HAZARD_OVERRIDE', {});

    syncState((prev) => ({
      ...prev,
      hazardSafetyOn: false,
      overcharge: Math.max(10, prev.overcharge - 30),
      countdownSeconds: prev.countdownSeconds + 60
    }));
  };

  const resetGame = () => {
    soundSynth.playClick();
    syncState(INITIAL_GAME_STATE);
  };

  return (
    <GameStateContext.Provider
      value={{
        gameState,
        toggleAlphaNode,
        updateAlphaControl,
        pulseFrequency,
        rotateBetaHex,
        updateBetaControl,
        dispatchFlux,
        submitCipherCode,
        setKeyInterlockHeld,
        pullHazardLatch,
        addLog,
        resetGame
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}
