import { useEffect, useRef, useCallback } from 'react';

export interface RhythmInputCallbacks {
  onLaneDown: (lane: 0 | 1 | 2 | 3, timestamp: number) => void;
  onLaneUp: (lane: 0 | 1 | 2 | 3, timestamp: number) => void;
  onFeverTrigger?: () => void;
  onPauseToggle?: () => void;
}

export function useRhythmInput(callbacks: RhythmInputCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const laneActiveRef = useRef<[boolean, boolean, boolean, boolean]>([false, false, false, false]);

  // Key mappings for 4 lanes
  const laneKeyMap = useRef<Record<string, 0 | 1 | 2 | 3>>({
    'KeyD': 0,
    'KeyF': 1,
    'KeyJ': 2,
    'KeyK': 3,
    // Alternative / Arrow keys
    'ArrowLeft': 0,
    'ArrowDown': 1,
    'ArrowUp': 2,
    'ArrowRight': 3,
    'KeyA': 0,
    'KeyS': 1,
    'KeyL': 3,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore repeat events while holding
      if (e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault();
        callbacksRef.current.onFeverTrigger?.();
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        callbacksRef.current.onPauseToggle?.();
        return;
      }

      const lane = laneKeyMap.current[e.code];
      if (lane !== undefined) {
        e.preventDefault();
        laneActiveRef.current[lane] = true;
        callbacksRef.current.onLaneDown(lane, e.timeStamp || performance.now());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const lane = laneKeyMap.current[e.code];
      if (lane !== undefined) {
        e.preventDefault();
        laneActiveRef.current[lane] = false;
        callbacksRef.current.onLaneUp(lane, e.timeStamp || performance.now());
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Multi-touch & mobile pointer down/up handlers
  const handleTouchLaneDown = useCallback((lane: 0 | 1 | 2 | 3) => {
    laneActiveRef.current[lane] = true;
    callbacksRef.current.onLaneDown(lane, performance.now());
  }, []);

  const handleTouchLaneUp = useCallback((lane: 0 | 1 | 2 | 3) => {
    laneActiveRef.current[lane] = false;
    callbacksRef.current.onLaneUp(lane, performance.now());
  }, []);

  return {
    laneActiveRef,
    handleTouchLaneDown,
    handleTouchLaneUp,
  };
}
