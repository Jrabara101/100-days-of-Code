import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, Progress } from '../ui/dialog';
import { Button } from '../ui/button';
import { globalAudioEngine } from '../../audio/RhythmAudioEngine';
import { Sliders, Volume2, CheckCircle2, RotateCcw, Crosshair } from 'lucide-react';

interface LatencyCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOffsetMs: number;
  onSaveOffset: (newOffsetMs: number) => void;
}

export const LatencyCalibrationModal: React.FC<LatencyCalibrationModalProps> = ({
  isOpen,
  onClose,
  currentOffsetMs,
  onSaveOffset,
}) => {
  const [offsetMs, setOffsetMs] = useState<number>(currentOffsetMs);
  const [tapSamples, setTapSamples] = useState<number[]>([]);
  const [isAutoTesting, setIsAutoTesting] = useState<boolean>(false);
  const [calculatedOffset, setCalculatedOffset] = useState<number | null>(null);

  // Metronome beat ticker
  const intervalMs = 600; // 100 BPM calibration pulse
  const [beatPhase, setBeatPhase] = useState<number>(0);
  const nextBeatTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setOffsetMs(currentOffsetMs);
  }, [currentOffsetMs]);

  // Audio clicker loop during calibration modal
  useEffect(() => {
    if (!isOpen) return;
    globalAudioEngine.init();

    let lastBeat = performance.now();
    nextBeatTimeRef.current = lastBeat + intervalMs;

    const tick = () => {
      const now = performance.now();
      if (now >= nextBeatTimeRef.current) {
        globalAudioEngine.playCalibrationClick(true);
        nextBeatTimeRef.current += intervalMs;
        setBeatPhase(prev => (prev + 1) % 4);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  // Player tap handler for 10-tap benchmark
  const handleUserTap = useCallback(() => {
    const now = performance.now();
    // Calculate distance to closest beat
    const timeToNext = nextBeatTimeRef.current - now;
    const timeSinceLast = intervalMs - timeToNext;
    
    // Delta in ms: negative means early, positive means late
    let delta = 0;
    if (timeSinceLast < timeToNext) {
      delta = timeSinceLast; // player tapped slightly after the beat
    } else {
      delta = -timeToNext; // player tapped slightly before the beat
    }

    globalAudioEngine.playHitSound('PERFECT');

    setTapSamples(prev => {
      const next = [...prev, delta];
      if (next.length >= 10) {
        // Compute median calibration offset
        const sorted = [...next].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const rounded = Math.round(median);
        setCalculatedOffset(rounded);
        setOffsetMs(rounded);
        setIsAutoTesting(false);
      }
      return next.slice(-10);
    });
  }, [intervalMs]);

  const resetTest = () => {
    setTapSamples([]);
    setCalculatedOffset(null);
    setIsAutoTesting(true);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Hardware Latency Calibrator"
      description="Sub-millisecond audio/display synchronization wizard"
      className="max-w-lg"
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Metronome Visualizer */}
        <div className="flex flex-col items-center gap-3 bg-surface-mid/80 p-5 rounded-xl border border-white/10">
          <div className="text-xs font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-primary" /> Visual & Audio Sync Metronome
          </div>

          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map(step => (
              <div
                key={step}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg transition-all duration-75 ${
                  beatPhase === step
                    ? 'bg-primary text-black shadow-neon-cyan scale-110'
                    : 'bg-surface-high text-gray-400'
                }`}
              >
                {step + 1}
              </div>
            ))}
          </div>
          <div className="text-[11px] font-mono text-gray-400">
            Listen to the audio click and watch the pulse. They should align simultaneously.
          </div>
        </div>

        {/* 10-Tap Auto Benchmark Mini-Game */}
        <div className="flex flex-col gap-3 bg-surface-mid/40 p-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-secondary" />
              <span className="font-mono text-sm font-bold text-white">10-Tap Hardware Benchmark</span>
            </div>
            <span className="text-xs font-mono text-primary font-bold">
              {tapSamples.length}/10 Taps
            </span>
          </div>

          <Progress value={tapSamples.length} max={10} color="bg-secondary" />

          {tapSamples.length < 10 ? (
            <button
              onClick={handleUserTap}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-cyan-400 hover:from-primary-dim hover:to-cyan-500 text-black font-display font-black text-lg uppercase tracking-wider shadow-neon-cyan active:scale-95 transition-all"
            >
              TAP IN SYNC WITH BEAT
            </button>
          ) : (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Benchmark Complete: {calculatedOffset !== null && calculatedOffset >= 0 ? `+${calculatedOffset}` : calculatedOffset}ms
              </div>
              <Button size="sm" variant="ghost" onClick={resetTest}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Re-test
              </Button>
            </div>
          )}
        </div>

        {/* Fine Tuning Manual Slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm font-mono">
            <span className="text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-primary" /> Audio Latency Offset
            </span>
            <span className="font-bold text-primary font-mono text-base">
              {offsetMs >= 0 ? `+${offsetMs}` : offsetMs} ms
            </span>
          </div>

          <input
            type="range"
            min="-200"
            max="200"
            step="1"
            value={offsetMs}
            onChange={(e) => setOffsetMs(parseInt(e.target.value, 10))}
            className="w-full accent-primary h-2 bg-surface-high rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-mono text-gray-500">
            <span>-200ms (Heads-up / Early)</span>
            <span>0ms (Balanced)</span>
            <span>+200ms (Bluetooth Lag)</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onSaveOffset(offsetMs);
              onClose();
            }}
          >
            Apply Calibration
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
