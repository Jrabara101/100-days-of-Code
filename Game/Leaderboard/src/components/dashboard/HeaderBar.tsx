import React, { useState } from 'react';
import { 
  Trophy, 
  Swords, 
  Flame, 
  History, 
  Activity, 
  Sparkles, 
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

interface HeaderBarProps {
  onlineCount: number;
  userRankData: {
    rank: number;
    score: number;
    tier: string;
    username: string;
    tag: string;
    winRate: number;
  };
  onSimulateMatch: () => void;
  isSimulating: boolean;
  onOpenHallOfFame: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onlineCount,
  userRankData,
  onSimulateMatch,
  isSimulating,
  onOpenHallOfFame,
}) => {
  const [matchNotification, setMatchNotification] = useState<string | null>(null);

  const handleSimulate = () => {
    onSimulateMatch();
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.25 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#38bdf8'],
    });

    setMatchNotification('+45 LP • Victory on Ascent (13 - 7)!');
    setTimeout(() => {
      setMatchNotification(null);
    }, 4000);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Brand & Season Badge */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
              <Trophy className="h-6 w-6 text-slate-950 stroke-[2.5]" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-emerald-400 ring-1 ring-emerald-500/50">
                4
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white sm:text-xl">
                  APEX ELITE
                </span>
                <Badge variant="outline" className="hidden border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-400 sm:inline-flex">
                  PRO CIRCUIT
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {onlineCount.toLocaleString()}
                  </span>{' '}
                  live competitors
                </span>

                <span className="hidden text-slate-600 sm:inline">•</span>
                <span className="hidden text-emerald-400/90 font-medium sm:inline">
                  Season 4 ends in 18d
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar & User Profile Summary Widget */}
          <div className="flex items-center gap-3">
            
            {/* Hall of Fame Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenHallOfFame}
              className="hidden gap-1.5 border-border/80 text-xs font-semibold sm:flex hover:border-amber-500/40 hover:text-amber-400"
            >
              <History className="h-3.5 w-3.5 text-amber-400" />
              Hall of Fame
            </Button>

            {/* Simulate Match Play Button */}
            <Button
              variant="esports"
              size="sm"
              disabled={isSimulating}
              onClick={handleSimulate}
              className="gap-1.5 text-xs shadow-md"
            >
              <Play className={`h-3.5 w-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Simulate Match</span>
              <span className="sm:hidden">Play</span>
            </Button>

            {/* User Personal Rank Badge Card */}
            <div className="relative flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-slate-900/90 px-3.5 py-1.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Flame className="h-5 w-5" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-white">
                    Rank #{userRankData.rank}
                  </span>
                  <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[9px] font-black uppercase text-purple-400 border border-purple-500/30">
                    MASTER
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  {userRankData.score.toLocaleString()} LP{' '}
                  <span className="text-[10px] text-emerald-300/70">(+124)</span>
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Dynamic Match Outcome Banner */}
        {matchNotification && (
          <div className="animate-in fade-in slide-in-from-top-2 mb-2 flex items-center justify-between rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-400 shadow-lg shadow-emerald-500/10">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-300 animate-spin" />
              {matchNotification}
            </span>
            <span className="text-[10px] text-emerald-300/80">Leaderboard Updated</span>
          </div>
        )}

      </div>
    </header>
  );
};
