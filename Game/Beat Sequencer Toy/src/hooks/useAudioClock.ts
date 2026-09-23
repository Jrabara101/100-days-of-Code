import { useEffect, useRef, useCallback } from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { audioEngine } from '../audio/audioGraph';
import { triggerTrackSound } from '../audio/synthesizer';

const LOOKAHEAD_MS = 25.0; // 25ms tick
const SCHEDULE_AHEAD_TIME = 0.1; // 100ms lookahead

interface VisualQueueItem {
  step: number;
  time: number;
}

export function useAudioClock() {
  const isPlaying = useSequencerStore((s) => s.isPlaying);
  const bpm = useSequencerStore((s) => s.bpm);
  const swing = useSequencerStore((s) => s.swing);
  const activeKit = useSequencerStore((s) => s.activeKit);
  const tracks = useSequencerStore((s) => s.tracks);
  const activeStutter = useSequencerStore((s) => s.masterEffects.activeStutter);
  const tapeStopActive = useSequencerStore((s) => s.masterEffects.tapeStopActive);
  const setCurrentStep = useSequencerStore((s) => s.setCurrentStep);

  // References to keep scheduler callbacks updated without restarting timers
  const stateRef = useRef({
    isPlaying,
    bpm,
    swing,
    activeKit,
    tracks,
    activeStutter,
    tapeStopActive,
  });

  useEffect(() => {
    stateRef.current = {
      isPlaying,
      bpm,
      swing,
      activeKit,
      tracks,
      activeStutter,
      tapeStopActive,
    };
  }, [isPlaying, bpm, swing, activeKit, tracks, activeStutter, tapeStopActive]);

  const nextStepTimeRef = useRef<number>(0.0);
  const scheduledStepRef = useRef<number>(0);
  const timerIdRef = useRef<number | null>(null);
  const visualQueueRef = useRef<VisualQueueItem[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Step audio advancement
  const advanceStep = useCallback(() => {
    const { bpm: currentBpm, swing: currentSwing } = stateRef.current;
    const secondsPerBeat = 60.0 / currentBpm;
    const sixteenthTime = 0.25 * secondsPerBeat;

    // Swing modifies odd 16th steps (1, 3, 5, 7, etc.)
    const isOddStep = scheduledStepRef.current % 2 === 1;
    const swingFactor = currentSwing * 0.75;
    const stepDuration = isOddStep
      ? sixteenthTime * (1 + swingFactor)
      : sixteenthTime * (1 - swingFactor);

    nextStepTimeRef.current += Math.max(0.02, stepDuration);
    scheduledStepRef.current = (scheduledStepRef.current + 1) % 16;
  }, []);

  // Schedule notes for a single step
  const scheduleStepNotes = useCallback((stepIndex: number, time: number) => {
    const { tracks: currentTracks, activeKit: currentKit, activeStutter: currentStutter, bpm: currentBpm } = stateRef.current;

    // Push into visual queue for 60fps rAF scanner
    visualQueueRef.current.push({ step: stepIndex, time });

    const hasAnySolo = currentTracks.some((t) => t.isSoloed);

    currentTracks.forEach((track) => {
      if (track.steps[stepIndex]) {
        const isPlayable = hasAnySolo ? track.isSoloed : !track.isMuted;
        if (isPlayable) {
          triggerTrackSound(track.id, time, currentKit, track.pitchOffset);

          // Stutter roll repetitions
          if (currentStutter !== 'none') {
            const secondsPerBeat = 60.0 / currentBpm;
            const divSec =
              currentStutter === '1/8'
                ? secondsPerBeat * 0.5
                : currentStutter === '1/16'
                ? secondsPerBeat * 0.25
                : secondsPerBeat * 0.125;
            triggerTrackSound(track.id, time + divSec * 0.5, currentKit, track.pitchOffset);
          }
        }
      }
    });
  }, []);

  // Scheduler tick running every 25ms
  const schedulerTick = useCallback(() => {
    if (!stateRef.current.isPlaying || !audioEngine.ctx) return;

    while (nextStepTimeRef.current < audioEngine.ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleStepNotes(scheduledStepRef.current, nextStepTimeRef.current);
      advanceStep();
    }

    timerIdRef.current = window.setTimeout(schedulerTick, LOOKAHEAD_MS);
  }, [scheduleStepNotes, advanceStep]);

  // 60fps decoupled visual playhead render loop
  const playheadRenderLoop = useCallback(() => {
    if (audioEngine.ctx && visualQueueRef.current.length > 0) {
      const curTime = audioEngine.ctx.currentTime;
      while (visualQueueRef.current.length > 0 && visualQueueRef.current[0].time <= curTime) {
        const item = visualQueueRef.current.shift();
        if (item) {
          setCurrentStep(item.step);
        }
      }
    }
    animFrameIdRef.current = requestAnimationFrame(playheadRenderLoop);
  }, [setCurrentStep]);

  // Playback control
  useEffect(() => {
    if (isPlaying) {
      audioEngine.init();
      audioEngine.registerTracks(tracks);

      if (audioEngine.ctx && audioEngine.ctx.state === 'suspended') {
        audioEngine.ctx.resume();
      }

      scheduledStepRef.current = 0;
      nextStepTimeRef.current = (audioEngine.ctx?.currentTime || 0) + 0.05;
      visualQueueRef.current = [];

      schedulerTick();
      animFrameIdRef.current = requestAnimationFrame(playheadRenderLoop);
    } else {
      if (timerIdRef.current !== null) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      visualQueueRef.current = [];
      setCurrentStep(-1);
    }

    return () => {
      if (timerIdRef.current !== null) clearTimeout(timerIdRef.current);
      if (animFrameIdRef.current !== null) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, schedulerTick, playheadRenderLoop, tracks, setCurrentStep]);
}
