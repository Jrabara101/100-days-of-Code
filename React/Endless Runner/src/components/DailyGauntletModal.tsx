import React, { useState, useEffect } from 'react';
import { X, Trophy, Copy, Check, Sparkles, Flame, Play } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface DailyGauntletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeed: string;
  onSelectSeed: (seed: string) => void;
}

export const DailyGauntletModal: React.FC<DailyGauntletModalProps> = ({
  isOpen,
  onClose,
  currentSeed,
  onSelectSeed,
}) => {
  const [copied, setCopied] = useState(false);
  const [customSeedInput, setCustomSeedInput] = useState('');
  const [dailyData, setDailyData] = useState<{
    date: string;
    seed: string;
    modifierName: string;
    modifierDescription: string;
    topDistance: number;
  }>({
    date: new Date().toISOString().slice(0, 10),
    seed: `DAILY-${new Date().toISOString().slice(0, 10)}`,
    modifierName: 'Slipstream Resonance',
    modifierDescription: 'Near-misses generate +25% Overdrive energy today!',
    topDistance: 3420,
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch daily seed and leaderboard info from backend
    fetch('/api/runs/daily')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDailyData(data);
          return fetch(`/api/leaderboard?seed=${data.seed}`);
        }
        return null;
      })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((lead) => {
        if (lead && lead.leaderboard) {
          setLeaderboard(lead.leaderboard);
        }
      })
      .catch(() => {
        // Fallback demo data if offline
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const copyChallengeLink = () => {
    const url = `${window.location.origin}/?seed=${dailyData.seed}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyCustomSeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSeedInput.trim()) {
      onSelectSeed(customSeedInput.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-2xl p-6 relative border border-neon-cyan/40 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-orbitron font-black text-xl text-white tracking-wider flex items-center gap-2">
              DAILY GAUNTLET <Sparkles className="w-4 h-4 text-neon-cyan" />
            </h2>
            <p className="text-xs text-slate-400">
              Synchronized global track generated from calendar seed: <span className="text-neon-cyan font-mono">{dailyData.date}</span>
            </p>
          </div>
        </div>

        {/* Daily Modifier Card */}
        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 mb-5">
          <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-neon-magenta mb-1">
            <Flame className="w-4 h-4" /> ACTIVE MODIFIER: {dailyData.modifierName}
          </div>
          <p className="text-xs text-slate-300">
            {dailyData.modifierDescription}
          </p>
        </div>

        {/* Challenge Link Share */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-300 truncate">
            {window.location.origin}/?seed={dailyData.seed}
          </div>
          <button
            onClick={copyChallengeLink}
            className="py-2.5 px-4 rounded-xl bg-neon-cyan hover:bg-neon-cyan/90 text-slate-950 font-orbitron font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-neon-cyan/20 whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'COPIED!' : 'COPY LINK'}
          </button>
        </div>

        {/* Daily Top Leaderboard */}
        <div className="mb-6">
          <div className="text-xs font-orbitron text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
            <span>Daily Global Standings</span>
            <span className="text-neon-cyan">Seed: {dailyData.seed}</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {leaderboard.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No runs recorded yet today. Be the first to set the benchmark!
              </div>
            ) : (
              leaderboard.map((entry, idx) => (
                <div
                  key={entry.id || idx}
                  className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`font-orbitron font-bold w-5 text-center ${
                        idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-white">{entry.playerHandle}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-orbitron font-bold text-neon-cyan">{entry.distance}m</span>
                    <span className="text-yellow-400/90 font-mono text-[11px]">{entry.score} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Seed Input Form */}
        <form onSubmit={handleApplyCustomSeed} className="pt-4 border-t border-white/10 flex gap-2">
          <input
            type="text"
            placeholder="ENTER CUSTOM SEED..."
            value={customSeedInput}
            onChange={(e) => setCustomSeedInput(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-neon-cyan"
          />
          <button
            type="submit"
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-orbitron font-bold text-xs flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5" /> LOAD SEED
          </button>
        </form>
      </div>
    </div>
  );
};
