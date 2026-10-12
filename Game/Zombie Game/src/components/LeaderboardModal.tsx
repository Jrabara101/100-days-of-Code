import React, { useState, useEffect } from 'react';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LeaderboardEntry } from '../types/game';
import { Trophy, ShieldCheck, Flame, Calendar, Globe, RefreshCw } from 'lucide-react';

interface LeaderboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSeed: string;
}

export function LeaderboardModal({ open, onOpenChange, currentSeed }: LeaderboardModalProps) {
  const [filter, setFilter] = useState<'daily' | 'all'>('daily');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScores = async () => {
    setIsLoading(true);
    try {
      const url = filter === 'daily' ? `/api/leaderboard?seed=${currentSeed}` : `/api/leaderboard`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      // Fallback offline mock data if backend not yet hit
      setEntries([
        {
          id: 1,
          player_handle: 'Vanguard-Alpha',
          run_seed: currentSeed,
          waves_cleared: 22,
          duration_ms: 940000,
          scrap_collected: 3420,
          final_score: 38500,
          favorite_weapon: 'Tesla Arc Shotgun',
          verified: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          player_handle: 'Ghost_Operator',
          run_seed: currentSeed,
          waves_cleared: 18,
          duration_ms: 765000,
          scrap_collected: 2810,
          final_score: 29200,
          favorite_weapon: 'Incendiary Rifle',
          verified: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          player_handle: 'Raven_9',
          run_seed: currentSeed,
          waves_cleared: 15,
          duration_ms: 620000,
          scrap_collected: 2190,
          final_score: 22400,
          favorite_weapon: 'Cryo Scattergun',
          verified: 1,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchScores();
    }
  }, [open, filter, currentSeed]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="QUARANTINE SECTOR // GLOBAL LEADERBOARD" className="max-w-2xl">
      <div className="space-y-4">
        {/* Filter Toggle */}
        <div className="flex items-center justify-between bg-[#13191C] p-2 rounded-md border border-[#1E272B]">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'daily' ? 'hazard' : 'ghost'}
              size="sm"
              onClick={() => setFilter('daily')}
              className="text-xs h-7"
            >
              <Calendar className="w-3.5 h-3.5 mr-1" /> TODAY'S SEED
            </Button>
            <Button
              variant={filter === 'all' ? 'hazard' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs h-7"
            >
              <Globe className="w-3.5 h-3.5 mr-1" /> ALL-TIME ELITE
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchScores} className="text-xs h-7 text-slate-400">
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
          </Button>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[#0C1012] border border-[#1E272B] rounded-md overflow-hidden">
          <div className="grid grid-cols-12 gap-2 p-2.5 bg-[#13191C] text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-[#1E272B]">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4">OPERATOR</div>
            <div className="col-span-2 text-center">WAVES</div>
            <div className="col-span-3">SYNERGY WEAPON</div>
            <div className="col-span-2 text-right">SCORE</div>
          </div>

          <div className="divide-y divide-[#1E272B] max-h-[320px] overflow-y-auto font-mono text-xs">
            {entries.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                NO VERIFIED RUNS DETECTED FOR CURRENT PROTOCOL.
              </div>
            ) : (
              entries.map((entry, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={entry.id || index}
                    className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-slate-900/40 transition-colors"
                  >
                    {/* Rank */}
                    <div className="col-span-1 text-center font-bold">
                      {rank === 1 ? (
                        <span className="text-amber-400 flex items-center justify-center">
                          <Trophy className="w-3.5 h-3.5" />
                        </span>
                      ) : rank === 2 ? (
                        <span className="text-slate-300">2</span>
                      ) : rank === 3 ? (
                        <span className="text-amber-600">3</span>
                      ) : (
                        <span className="text-slate-500">{rank}</span>
                      )}
                    </div>

                    {/* Operator Handle */}
                    <div className="col-span-4 font-bold text-white flex items-center gap-1.5 truncate">
                      <span className="truncate">{entry.player_handle}</span>
                      {entry.verified ? (
                        <span title="Anti-Cheat Verified">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </span>
                      ) : null}
                    </div>

                    {/* Waves Survived */}
                    <div className="col-span-2 text-center text-amber-400 font-bold">
                      {entry.waves_cleared}
                    </div>

                    {/* Favorite Weapon */}
                    <div className="col-span-3 text-slate-300 text-[11px] truncate">
                      {entry.favorite_weapon}
                    </div>

                    {/* Score */}
                    <div className="col-span-2 text-right font-bold text-emerald-400">
                      {entry.final_score.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            CLOSE
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
