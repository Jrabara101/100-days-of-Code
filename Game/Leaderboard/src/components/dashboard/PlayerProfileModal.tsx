import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Trophy, 
  Target, 
  Flame, 
  Shield, 
  Activity, 
  Crosshair, 
  UserCheck, 
  Share2, 
  Swords, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { LeaderboardItem } from '@/types/leaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatScore, getTierTheme } from '@/lib/utils';

interface PlayerProfileModalProps {
  player: LeaderboardItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  isOpen,
  onClose,
}) => {
  if (!player) return null;

  const tierTheme = getTierTheme(player.tier);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 border border-border/80 bg-slate-950 shadow-2xl">
        
        {/* Banner Header with Tier Glow */}
        <div className={`relative h-32 w-full bg-gradient-to-r ${tierTheme.glow} border-b border-border/60 p-6 flex items-end justify-between`}>
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex items-end gap-4 translate-y-7">
            <div className="relative">
              <Avatar className={`h-20 w-20 border-3 ${tierTheme.border} shadow-2xl ring-4 ring-slate-950`}>
                <AvatarImage src={player.avatarUrl} alt={player.username} />
                <AvatarFallback className="bg-slate-800 text-lg font-black text-white">
                  {player.username.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md ring-2 ring-slate-950">
                <CheckCircle2 className="h-4 w-4 stroke-[3]" />
              </div>
            </div>

            <div className="flex flex-col mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {player.username}
                </h3>
                <span className="font-mono text-sm text-slate-400 font-bold">
                  {player.tag}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border ${tierTheme.badge}`}>
                  {player.tier}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {player.country} • Registered Competitor
              </p>
            </div>
          </div>

          <div className="relative z-10 text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Global Rank
            </span>
            <span className="text-xl font-black font-mono text-emerald-400">
              #{player.rank}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-10 space-y-6">
          
          {/* Core Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* K/D Ratio */}
            <div className="rounded-xl border border-border/60 bg-slate-900/80 p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-muted-foreground mb-1">
                <Target className="h-3 w-3 text-emerald-400" />
                K/D Ratio
              </div>
              <div className="text-xl font-mono font-black text-white">
                {player.kdRatio}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                Top 3% Region
              </div>
            </div>

            {/* Headshot Accuracy */}
            <div className="rounded-xl border border-border/60 bg-slate-900/80 p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-muted-foreground mb-1">
                <Crosshair className="h-3 w-3 text-cyan-400" />
                Headshot %
              </div>
              <div className="text-xl font-mono font-black text-cyan-300">
                {player.headshotPct}%
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Precision Tier
              </div>
            </div>

            {/* Win Rate */}
            <div className="rounded-xl border border-border/60 bg-slate-900/80 p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-muted-foreground mb-1">
                <Trophy className="h-3 w-3 text-amber-400" />
                Win Rate
              </div>
              <div className="text-xl font-mono font-black text-amber-300">
                {player.winRate}%
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {player.matches} Matches
              </div>
            </div>

            {/* Rating / LP */}
            <div className="rounded-xl border border-border/60 bg-slate-900/80 p-3 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-muted-foreground mb-1">
                <Flame className="h-3 w-3 text-purple-400" />
                Score / LP
              </div>
              <div className="text-xl font-mono font-black text-white">
                {formatScore(player.score)}
              </div>
              <div className="text-[10px] text-purple-400 font-semibold mt-0.5">
                {player.streak} Win Streak 🔥
              </div>
            </div>

          </div>

          {/* Recent Form (Last 5 Matches) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5 text-emerald-400" />
                Recent Match History (Form)
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {player.recentMatches.filter(m => m.outcome === 'victory').length}W - {player.recentMatches.filter(m => m.outcome === 'defeat').length}L
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {player.recentMatches.map((match) => {
                const isWin = match.outcome === 'victory';
                return (
                  <div
                    key={match.id}
                    className={`rounded-xl border p-2.5 text-center transition-all ${
                      isWin
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isWin ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {match.outcome}
                    </span>
                    <div className="font-mono text-xs font-black text-white mt-1">
                      {match.score}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {match.map}
                    </div>
                    <div className="font-mono text-[9px] text-slate-400 mt-1">
                      {match.kda}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges & Achievements */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              Verified Achievements & Badges
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {player.badges.map((b, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-sm"
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  {b}
                </div>
              ))}
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm">
                <Flame className="h-3.5 w-3.5 text-emerald-400" />
                Active Competitor
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/80 bg-slate-900/90 px-6 py-4">
          <div className="text-xs text-muted-foreground">
            Player ID: <span className="font-mono text-slate-400">{player.userId}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
            <Button
              variant="esports"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert(`Player profile link for ${player.username} copied to clipboard!`);
              }}
              className="gap-1.5 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Profile
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
