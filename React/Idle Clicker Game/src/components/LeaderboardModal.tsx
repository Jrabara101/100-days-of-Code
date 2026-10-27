import React from 'react';
import {
  Trophy,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  Medal,
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { LeaderboardItem } from '../hooks/useGameWebSocket';
import { formatBigNumber, NotationType } from '../lib/bigNumber';

interface LeaderboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaderboard: LeaderboardItem[];
  currentPlayerId: string;
  notation: NotationType;
  onRefresh: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  open,
  onOpenChange,
  leaderboard,
  currentPlayerId,
  notation,
  onRefresh,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Trophy className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Galactic Championship
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-xs font-mono text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>
        <DialogTitle className="text-2xl text-white">
          Competitive Season Leaderboard
        </DialogTitle>
        <DialogDescription>
          Server-authoritative ranking filtered by Poisson cadence anti-cheat heuristic analysis.
        </DialogDescription>
      </DialogHeader>

      {/* Leaderboard Table Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden my-2 max-h-[55vh] overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Commander</th>
              <th className="py-2.5 px-3">Ascension</th>
              <th className="py-2.5 px-3">Peak CPS</th>
              <th className="py-2.5 px-3 text-right">Lifetime Flux</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Connecting to global leaderboard telemetry...
                </td>
              </tr>
            ) : (
              leaderboard.map((entry, idx) => {
                const isMe = entry.playerId === currentPlayerId;
                const isTop3 = idx < 3;

                return (
                  <tr
                    key={entry.playerId}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-amber-500/10 font-bold border-l-2 border-l-amber-400'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-3 px-3">
                      {idx === 0 ? (
                        <Medal className="w-4 h-4 text-amber-400 inline" />
                      ) : idx === 1 ? (
                        <Medal className="w-4 h-4 text-slate-300 inline" />
                      ) : idx === 2 ? (
                        <Medal className="w-4 h-4 text-amber-600 inline" />
                      ) : (
                        <span className="text-slate-500">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={isMe ? 'text-amber-300' : 'text-slate-200'}>
                          {entry.handle}
                        </span>
                        {entry.isVerified && (
                          <span title="Server Monotonic & Poisson Integrity Verified">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                        {isMe && (
                          <Badge variant="gold" className="text-[9px] px-1 py-0">
                            YOU
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-purple-300">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>{entry.prestigeShards}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <Zap className="w-3 h-3" />
                        <span>{formatBigNumber(entry.highestCps, notation)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-bold">
                      {formatBigNumber(entry.lifetimeCurrency, notation)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Inhuman cadence patterns (&gt;25 CPS square-wave) filtered automatically
        </span>
        <span>Top 25 Worldwide</span>
      </div>
    </Dialog>
  );
};
