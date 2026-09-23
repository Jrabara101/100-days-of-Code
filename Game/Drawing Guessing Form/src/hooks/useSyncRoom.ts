import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { DrawAction } from '@/types/game';

interface BroadcastPayload {
  type: 'STROKE' | 'CHAT' | 'SOLVED' | 'CLEAR';
  roomId: string;
  senderId: string;
  action?: DrawAction;
  guessText?: string;
  senderName?: string;
}

export function useSyncRoom() {
  const {
    roomId,
    phase,
    timeLeft,
    decrementTime,
    addCanvasAction,
    clearCanvas,
    addChatMessage,
    targetWord,
    players,
    isSoundEnabled,
  } = useGameStore();

  const { playHeartbeat, playWarmAlert } = useSoundEffects(isSoundEnabled);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Set up BroadcastChannel for local cross-tab real-time sync
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(`doodlr_room_${roomId}`);
      channelRef.current = channel;

      channel.onmessage = (event: MessageEvent<BroadcastPayload>) => {
        const data = event.data;
        if (!data || data.roomId !== roomId) return;

        if (data.type === 'STROKE' && data.action) {
          addCanvasAction(data.action);
        } else if (data.type === 'CLEAR') {
          clearCanvas();
        } else if (data.type === 'CHAT' && data.guessText && data.senderName) {
          addChatMessage({
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.guessText,
            type: 'normal',
          });
        }
      };

      return () => {
        channel.close();
      };
    } catch {
      // BroadcastChannel not available in some restricted contexts
    }
  }, [roomId, addCanvasAction, clearCanvas, addChatMessage]);

  // Broadcast action helper
  const broadcastAction = (payload: Omit<BroadcastPayload, 'roomId'>) => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        ...payload,
        roomId,
      });
    }
  };

  // Timer Tick Interval
  useEffect(() => {
    if (phase !== 'DRAWING' && phase !== 'WORD_SELECTION') return;

    const interval = setInterval(() => {
      decrementTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, decrementTime]);

  // Dynamic Time-Crunch Heartbeat Juice when timeLeft <= 15
  useEffect(() => {
    if (phase !== 'DRAWING' || timeLeft > 15 || timeLeft <= 0) return;

    const urgency = timeLeft <= 5 ? 1.5 : timeLeft <= 10 ? 1.25 : 1.0;
    playHeartbeat(urgency);

    const intervalMs = timeLeft <= 5 ? 700 : timeLeft <= 10 ? 1000 : 1300;
    const interval = setInterval(() => {
      playHeartbeat(urgency);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [phase, timeLeft, playHeartbeat]);

  // Ambient simulated bot guesses for solo demo
  useEffect(() => {
    if (phase !== 'DRAWING' || timeLeft > 38 || timeLeft < 10) return;

    const timer = setTimeout(() => {
      const guessers = players.filter((p) => !p.isDrawing && !p.hasGuessedCorrectly);
      if (guessers.length === 0) return;

      const randomGuesser = guessers[Math.floor(Math.random() * guessers.length)];

      // Produce a witty or warm guess based on targetWord
      const guesses = [
        `is it a ${targetWord.toLowerCase().slice(0, 3)}... ?`,
        `looks like an animal!`,
        `wait, ${targetWord.slice(0, 2)}?`,
      ];
      const randomGuess = guesses[Math.floor(Math.random() * guesses.length)];

      addChatMessage({
        senderId: randomGuesser.id,
        senderName: randomGuesser.username,
        text: randomGuess,
        type: 'normal',
      });

      if (Math.random() > 0.5) {
        playWarmAlert();
      }
    }, 14000);

    return () => clearTimeout(timer);
  }, [phase, timeLeft, targetWord, players, addChatMessage, playWarmAlert]);

  return {
    broadcastAction,
  };
}
