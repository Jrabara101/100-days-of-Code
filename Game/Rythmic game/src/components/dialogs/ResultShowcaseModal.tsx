import React, { useEffect } from 'react';
import { ScoreValidationResult, HitJudgement } from '../../types/game';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { RotateCcw, Share2, ShieldCheck, Trophy, Sparkles, Ghost, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScoreValidationResult | null;
  songTitle: string;
  onReplay: () => void;
  onSelectTrack: () => void;
  onStartGhostDuel?: () => void;
}

export const ResultShowcaseModal: React.FC<ResultShowcaseModalProps> = ({
  isOpen,
  onClose,
  result,
  songTitle,
  onReplay,
  onSelectTrack,
  onStartGhostDuel,
}) => {
  useEffect(() => {
    if (isOpen && result && ['SSS', 'SS', 'S'].includes(result.grade)) {
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#ff007f', '#ffd166', '#ffffff'],
        });
      } catch (e) {
        // Fallback if canvas-confetti is not rendered
      }
    }
  }, [isOpen, result]);

  if (!result) return null;

  const copyScorecard = () => {
    const text = `🎮 CYBER//BEAT SCORECARD\nTrack: ${songTitle}\nGrade: ${result.grade} | Score: ${result.score.toLocaleString()}\nAccuracy: ${result.accuracy}%\nMax Combo: ${result.maxCombo}\nJudgements: MARV:${result.judgementCounts.MARVELOUS} PERF:${result.judgementCounts.PERFECT} GREAT:${result.judgementCounts.GREAT} MISS:${result.judgementCounts.MISS}\n[Server-Verified Anti-Cheat]`;
    navigator.clipboard.writeText(text);
    alert('Scorecard copied to clipboard!');
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'SSS': return 'from-amber-300 via-yellow-400 to-amber-500 shadow-neon-gold text-black';
      case 'SS': return 'from-cyan-300 to-primary shadow-neon-cyan text-black';
      case 'S': return 'from-emerald-300 to-emerald-500 text-black';
      case 'A': return 'from-purple-400 to-pink-500 text-white';
      case 'B': return 'from-blue-400 to-indigo-600 text-white';
      case 'C': return 'from-amber-600 to-orange-700 text-white';
      case 'D': return 'from-gray-500 to-gray-700 text-white';
      default: return 'from-red-600 to-rose-900 text-white';
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Stage Clear // Telemetry Analysis"
      description={songTitle}
      className="max-w-xl"
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Top Grade Crest & Score Hero */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-surface-mid/70 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
          {/* Grade Crest */}
          <div className="flex flex-col items-center">
            <div
              className={`w-24 h-24 rounded-2xl flex items-center justify-center font-display text-5xl font-black bg-gradient-to-br tracking-tight drop-shadow-xl ${getGradeColor(
                result.grade
              )}`}
            >
              {result.grade}
            </div>
            <span className="font-mono text-[11px] text-gray-400 mt-2 font-bold tracking-widest uppercase">
              RATING GRADE
            </span>
          </div>

          {/* Authoritative Score */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
            <span className="text-xs font-mono uppercase text-gray-400 tracking-widest">
              FINAL AUTHORITATIVE SCORE
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
              {result.score.toLocaleString().padStart(7, '0')}
            </div>
            <div className="flex items-center gap-3 mt-1.5 font-mono text-xs font-bold">
              <span className="text-primary">{result.accuracy}% ACCURACY</span>
              <span className="text-gray-500">•</span>
              <span className="text-accent-gold">{result.maxCombo} MAX COMBO</span>
            </div>
          </div>
        </div>

        {/* Server Anti-Cheat Integrity Verification Badge */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SERVER ANTI-CHEAT VERIFICATION: VALID</span>
          </div>
          <span className="text-[10px] text-emerald-300/80">AUTHORITATIVE</span>
        </div>

        {/* Hit Judgement Accuracy Breakdown */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono uppercase text-gray-400 tracking-wider">
            JUDGEMENT BREAKDOWN
          </div>

          <div className="grid grid-cols-5 gap-2 font-mono text-center">
            <div className="p-2.5 rounded-xl bg-surface-mid/80 border border-amber-400/30">
              <div className="text-[10px] text-amber-300 font-bold">MARVELOUS</div>
              <div className="text-base font-extrabold text-white mt-1">
                {result.judgementCounts.MARVELOUS}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-mid/80 border border-primary/30">
              <div className="text-[10px] text-primary font-bold">PERFECT</div>
              <div className="text-base font-extrabold text-white mt-1">
                {result.judgementCounts.PERFECT}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-mid/80 border border-emerald-400/30">
              <div className="text-[10px] text-emerald-400 font-bold">GREAT</div>
              <div className="text-base font-extrabold text-white mt-1">
                {result.judgementCounts.GREAT}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-mid/80 border border-purple-400/30">
              <div className="text-[10px] text-purple-300 font-bold">GOOD</div>
              <div className="text-base font-extrabold text-white mt-1">
                {result.judgementCounts.GOOD}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-mid/80 border border-rose-500/30">
              <div className="text-[10px] text-rose-400 font-bold">MISS</div>
              <div className="text-base font-extrabold text-white mt-1">
                {result.judgementCounts.MISS}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
          <Button variant="outline" onClick={onSelectTrack}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Stage Select
          </Button>

          <Button variant="secondary" onClick={copyScorecard}>
            <Share2 className="w-4 h-4 mr-1.5" /> Share Card
          </Button>

          <Button variant="primary" onClick={onReplay}>
            <RotateCcw className="w-4 h-4 mr-1.5" /> Retry Track
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
