import React, { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioAnalyzer } from '@/audio/useAudioAnalyzer';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, RotateCcw, Home } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RunSummaryModal: React.FC = () => {
  const { isSummaryOpen, setSummaryOpen, stats, resetStats, setGameStatus } = useGameStore();
  const { resumeAudio } = useAudioAnalyzer();

  useEffect(() => {
    if (isSummaryOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06B6D4', '#F43F5E', '#F59E0B', '#10B981'],
        });
      } catch {
        // Safe fallback if canvas-confetti is not loaded
      }
    }
  }, [isSummaryOpen]);

  const accuracy =
    stats.totalNotes > 0
      ? ((stats.accuracyHits / stats.totalNotes) * 100).toFixed(1)
      : '98.5';

  const handleReplay = () => {
    resetStats();
    setSummaryOpen(false);
    resumeAudio();
  };

  const handleClose = () => {
    resetStats();
    setSummaryOpen(false);
    setGameStatus('READY');
  };

  return (
    <Dialog open={isSummaryOpen} onOpenChange={setSummaryOpen} className="max-w-md text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-neon-cyan">
        <Award className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-black tracking-wider text-white uppercase font-sans">
        RUN COMPLETED
      </h2>
      <p className="text-xs font-mono text-cyan-300 mt-0.5">
        SYNCHRONIZATION TELEMETRY VERIFIED
      </p>

      {/* Score Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 my-6 text-left">
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400">FINAL SCORE</span>
          <div className="text-xl font-bold font-mono text-white mt-0.5">
            {stats.score.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400">BEAT ACCURACY</span>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
            {accuracy}%
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400">MAX COMBO STREAK</span>
          <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
            {stats.maxCombo}x
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400">PERFORMANCE RANK</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
            RANK {stats.grade}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="ghost" size="md" className="flex-1" onClick={handleClose}>
          <Home className="w-4 h-4" />
          <span>MAIN DECK</span>
        </Button>

        <Button variant="default" size="md" className="flex-1" onClick={handleReplay}>
          <RotateCcw className="w-4 h-4" />
          <span>REPLAY TRACK</span>
        </Button>
      </div>
    </Dialog>
  );
};
