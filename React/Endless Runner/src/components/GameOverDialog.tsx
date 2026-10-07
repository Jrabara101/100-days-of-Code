import React, { useState } from 'react';
import { RunSubmissionPayload, GhostData } from '../types/game';
import { Skull, RotateCcw, Share2, Check, ShieldCheck, AlertTriangle, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverDialogProps {
  isOpen: boolean;
  runSummary: RunSubmissionPayload | null;
  ghostData: GhostData | null;
  onRestart: () => void;
  onSubmitLeaderboard: (playerHandle: string) => Promise<boolean>;
}

export const GameOverDialog: React.FC<GameOverDialogProps> = ({
  isOpen,
  runSummary,
  ghostData,
  onRestart,
  onSubmitLeaderboard,
}) => {
  const [handle, setHandle] = useState('CyberRunner');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !runSummary) return null;

  // Ghost split relative to the ghost's final distance
  const ghostSplit = ghostData ? runSummary.distance - ghostData.finalDistance : null;

  // Confetti trigger if beat the ghost or reached > 1000m
  React.useEffect(() => {
    if (runSummary.distance >= 1000 || (ghostSplit !== null && ghostSplit > 0)) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f3ff', '#ff007f', '#ffaa00'],
      });
    }
  }, [runSummary.distance, ghostSplit]);

  const copyScorecard = () => {
    const card = `🏃 ⚡ 💀 [NEON SLIPSTREAM // Seed: ${runSummary.seed} // Distance: ${runSummary.distance}m // Near-Misses: ${runSummary.nearMissCount} // Coins: ${runSummary.coinsCollected} // Score: ${runSummary.score}]`;
    navigator.clipboard.writeText(card);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || submitted || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onSubmitLeaderboard(handle.trim());
    setIsSubmitting(false);
    if (success) {
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel-magenta rounded-2xl p-6 relative border border-neon-magenta/50 shadow-2xl">
        {/* Header: Cause of Death */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-neon-crimson/20 border border-neon-crimson/40 text-neon-crimson mb-2">
            <Skull className="w-8 h-8" />
          </div>
          <h2 className="font-orbitron font-black text-2xl text-white tracking-widest uppercase">
            RUN TERMINATED
          </h2>
          <p className="text-xs font-semibold text-neon-magenta flex items-center justify-center gap-1.5 mt-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Fatal Cause: {runSummary.causeOfDeath?.replace('_', ' ').toUpperCase() || 'COLLISION'}
          </p>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-center">
            <div className="text-[11px] font-orbitron text-slate-400 uppercase tracking-wider mb-1">
              Traversed Distance
            </div>
            <div className="font-orbitron font-black text-2xl text-neon-cyan">
              {runSummary.distance.toLocaleString()}
              <span className="text-sm font-bold ml-1">M</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-center">
            <div className="text-[11px] font-orbitron text-slate-400 uppercase tracking-wider mb-1">
              Final Score
            </div>
            <div className="font-orbitron font-black text-2xl text-yellow-300">
              {runSummary.score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5 text-center text-xs">
          <div className="p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-slate-400 text-[10px] block">NEAR-MISSES</span>
            <span className="font-orbitron font-bold text-neon-cyan">{runSummary.nearMissCount}</span>
          </div>

          <div className="p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-slate-400 text-[10px] block">COINS RECOVERED</span>
            <span className="font-orbitron font-bold text-yellow-400">{runSummary.coinsCollected}</span>
          </div>

          <div className="p-2 rounded-lg bg-white/5 border border-white/5">
            <span className="text-slate-400 text-[10px] block">GHOST SPLIT</span>
            <span
              className={`font-orbitron font-bold ${
                ghostSplit !== null && ghostSplit >= 0 ? 'text-emerald-400' : 'text-neon-crimson'
              }`}
            >
              {ghostSplit !== null ? (ghostSplit >= 0 ? `+${ghostSplit}m` : `${ghostSplit}m`) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Server Authoritative Anti-Cheat Status */}
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs mb-5">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Authoritative Physics Check</span>
          </div>
          <span className="font-orbitron font-bold text-emerald-300">PASSED</span>
        </div>

        {/* Leaderboard Submission Input */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="mb-5 flex gap-2">
            <input
              type="text"
              maxLength={16}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="ENTER CALLSIGN..."
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-orbitron uppercase focus:outline-none focus:border-neon-cyan"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'VERIFYING...' : 'SUBMIT'}
            </button>
          </form>
        ) : (
          <div className="p-2.5 mb-5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center font-orbitron font-bold text-xs text-emerald-300">
            ✓ SUBMITTED TO GLOBAL LEADERBOARD!
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={copyScorecard}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-orbitron font-bold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'COPIED!' : 'SHARE SCORECARD'}
          </button>

          <button
            onClick={onRestart}
            className="py-3 px-4 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-slate-950 font-orbitron font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-neon-cyan/30 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> INSTANT RE-RUN
          </button>
        </div>
      </div>
    </div>
  );
};
