import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Star, 
  Trophy, 
  Medal, 
  Award,
  Flame
} from 'lucide-react';
import { LeaderboardItem } from '@/types/leaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatScore, getRankBadgeClass, getTierTheme } from '@/lib/utils';

interface LeaderboardRowProps {
  player: LeaderboardItem;
  isFavorite: boolean;
  onToggleFavorite: (userId: string, e: React.MouseEvent) => void;
  onSelectPlayer: (player: LeaderboardItem) => void;
}

export const LeaderboardRow = React.memo<LeaderboardRowProps>(({
  player,
  isFavorite,
  onToggleFavorite,
  onSelectPlayer,
}) => {
  const delta = player.previousRank - player.rank;
  const tierTheme = getTierTheme(player.tier);

  const renderRankMedal = () => {
    if (player.rank === 1) {
      return (
        <span className="flex items-center gap-1 font-black text-amber-400">
          <Trophy className="h-4 w-4 fill-amber-400 text-amber-400" />
          #1
        </span>
      );
    }
    if (player.rank === 2) {
      return (
        <span className="flex items-center gap-1 font-black text-slate-300">
          <Medal className="h-4 w-4 fill-slate-300 text-slate-300" />
          #2
        </span>
      );
    }
    if (player.rank === 3) {
      return (
        <span className="flex items-center gap-1 font-black text-amber-600">
          <Award className="h-4 w-4 fill-amber-600 text-amber-600" />
          #3
        </span>
      );
    }
    return (
      <span className="font-mono font-bold text-slate-300">
        #{player.rank}
      </span>
    );
  };

  const renderDelta = () => {
    if (delta > 0) {
      return (
        <div className="flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-extrabold text-emerald-400 border border-emerald-500/20">
          <ArrowUp className="h-3 w-3 stroke-[3]" />
          +{delta}
        </div>
      );
    }
    if (delta < 0) {
      return (
        <div className="flex items-center gap-0.5 rounded bg-red-500/15 px-1.5 py-0.5 text-[11px] font-extrabold text-red-400 border border-red-500/20">
          <ArrowDown className="h-3 w-3 stroke-[3]" />
          {delta}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">
        <Minus className="h-3 w-3" />
        0
      </div>
    );
  };

  return (
    <div
      onClick={() => onSelectPlayer(player)}
      className="group relative flex h-16 w-full items-center justify-between border-b border-border/60 bg-slate-950/40 px-4 transition-all duration-150 hover:bg-slate-800/60 cursor-pointer"
    >
      {/* Left Column: Rank + Delta Ticker */}
      <div className="flex w-24 sm:w-28 items-center gap-2.5 shrink-0">
        <div className="w-10 text-left text-sm">
          {renderRankMedal()}
        </div>
        <div>
          {renderDelta()}
        </div>
      </div>

      {/* Player Identity: Avatar + Name + Tag + Country */}
      <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
        <div className="relative shrink-0">
          <Avatar className={`h-10 w-10 border ${tierTheme.border} ring-1 ring-white/10 group-hover:scale-105 transition-transform`}>
            <AvatarImage src={player.avatarUrl} alt={player.username} />
            <AvatarFallback className="bg-slate-800 text-xs font-bold text-white">
              {player.username.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {player.streak >= 4 && (
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 p-0.5 text-amber-400 ring-1 ring-amber-500/50" title={`${player.streak} Win Streak`}>
              <Flame className="h-3 w-3 fill-amber-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              {player.username}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {player.tag}
            </span>
            {player.isFriend && (
              <span className="rounded bg-cyan-500/10 px-1 py-0.2 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">
                FRIEND
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {player.country} • {player.favoriteAgent}
          </span>
        </div>
      </div>

      {/* Tier Badge Column */}
      <div className="hidden sm:flex w-28 items-center justify-center shrink-0">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border ${tierTheme.badge}`}>
          {player.tier}
        </span>
      </div>

      {/* Win Rate & Matches Progress Bar Column */}
      <div className="hidden md:flex w-44 flex-col justify-center px-2 shrink-0">
        <div className="flex items-center justify-between text-xs font-semibold mb-1">
          <span className="text-emerald-400 font-mono font-bold">{player.winRate}%</span>
          <span className="text-[10px] text-slate-400">{player.matches} matches</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
            style={{ width: `${player.winRate}%` }}
          />
        </div>
      </div>

      {/* Score Column */}
      <div className="flex w-28 items-center justify-end text-right shrink-0 pr-2">
        <div className="flex flex-col items-end">
          <span className="font-mono text-sm font-extrabold text-white group-hover:text-emerald-300 transition-colors">
            {formatScore(player.score)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold">
            LP
          </span>
        </div>
      </div>

      {/* Bookmark / Favorite Action */}
      <div className="flex w-9 items-center justify-center shrink-0">
        <button
          onClick={(e) => onToggleFavorite(player.userId, e)}
          className="rounded-lg p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors"
          title={isFavorite ? 'Remove from favorites' : 'Bookmark player'}
        >
          <Star
            className={`h-4 w-4 ${
              isFavorite
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-600 hover:text-amber-400'
            }`}
          />
        </button>
      </div>
    </div>
  );
});

LeaderboardRow.displayName = 'LeaderboardRow';
