import React from 'react';
import { Crown, Medal, Award, TrendingUp, Sparkles, Swords } from 'lucide-react';
import { LeaderboardItem } from '@/types/leaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatScore } from '@/lib/utils';

interface PodiumSectionProps {
  topPlayers: LeaderboardItem[];
  onSelectPlayer: (player: LeaderboardItem) => void;
}

export const PodiumSection: React.FC<PodiumSectionProps> = ({
  topPlayers,
  onSelectPlayer,
}) => {
  if (topPlayers.length < 3) return null;

  const first = topPlayers[0];
  const second = topPlayers[1];
  const third = topPlayers[2];

  return (
    <section className="relative w-full overflow-hidden py-8">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-3/4 rounded-full bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            CHAMPIONSHIP PODIUM
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            TOP TIER CONTENDERS
          </h2>
          <p className="text-xs text-muted-foreground">
            Current season standings for the highest rated competitive players
          </p>
        </div>

        {/* Podium Grid (Order: #2 Silver, #1 Gold, #3 Bronze) */}
        <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-3 md:gap-6">
          
          {/* Rank #2: Silver */}
          <div
            onClick={() => onSelectPlayer(second)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300/50 hover:shadow-slate-400/10 glow-silver"
          >
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-slate-400/40 bg-slate-800/80 px-2.5 py-0.5 text-xs font-black text-slate-300">
              <Medal className="h-3.5 w-3.5 text-slate-300" />
              #02
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3.5">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-slate-400 to-slate-200 opacity-70 blur-sm group-hover:opacity-100 transition-opacity" />
                <Avatar className="relative h-20 w-20 border-2 border-slate-300 shadow-xl ring-2 ring-slate-400/30">
                  <AvatarImage src={second.avatarUrl} alt={second.username} />
                  <AvatarFallback className="bg-slate-800 text-slate-200 font-bold">
                    {second.username.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 className="text-lg font-black text-white group-hover:text-slate-200 transition-colors flex items-center gap-1.5">
                {second.username}
                <span className="text-[11px] font-mono text-muted-foreground font-normal">
                  {second.tag}
                </span>
              </h3>

              <p className="text-xs text-muted-foreground mb-4">
                {second.country} • {second.favoriteAgent} Main
              </p>

              <div className="w-full grid grid-cols-2 gap-2 border-t border-slate-800/90 pt-3 text-center">
                <div className="rounded-xl bg-slate-900/80 p-2 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Win Rate
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    {second.winRate}%
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Rating / LP
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    {formatScore(second.score)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank #1: Gold (Centerpiece) */}
          <div
            onClick={() => onSelectPlayer(first)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-slate-900/95 via-amber-950/20 to-slate-950 p-7 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-400 hover:shadow-amber-500/20 glow-gold md:-translate-y-3"
          >
            {/* Crown Crest & Rank Banner */}
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 to-amber-600/30 px-3 py-1 text-xs font-black text-amber-300 shadow-md">
              <Crown className="h-4 w-4 text-amber-400 fill-amber-400 animate-bounce" />
              #01 CHAMPION
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity" />
                <Avatar className="relative h-24 w-24 border-3 border-amber-400 shadow-2xl ring-4 ring-amber-500/30">
                  <AvatarImage src={first.avatarUrl} alt={first.username} />
                  <AvatarFallback className="bg-amber-900 text-amber-300 font-black text-xl">
                    {first.username.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-1 rounded-full bg-amber-500 p-1 text-slate-950 shadow-md ring-2 ring-slate-900">
                  <Crown className="h-4 w-4 fill-slate-950" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                  {first.username}
                </h3>
                <span className="text-xs font-mono text-amber-400/80 font-bold">
                  {first.tag}
                </span>
              </div>

              <p className="text-xs text-amber-300/80 mb-5 font-medium">
                {first.country} • {first.favoriteAgent} • {first.streak} Match Streak 🔥
              </p>

              <div className="w-full grid grid-cols-2 gap-3 border-t border-amber-500/30 pt-4 text-center">
                <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">
                    Win Rate
                  </div>
                  <div className="text-base font-extrabold text-emerald-400">
                    {first.winRate}%
                  </div>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">
                    Rating / LP
                  </div>
                  <div className="text-base font-mono font-extrabold text-amber-300">
                    {formatScore(first.score)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank #3: Bronze */}
          <div
            onClick={() => onSelectPlayer(third)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-amber-700/30 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-600/50 hover:shadow-amber-700/10 glow-bronze"
          >
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-amber-700/40 bg-slate-800/80 px-2.5 py-0.5 text-xs font-black text-amber-400">
              <Award className="h-3.5 w-3.5 text-amber-500" />
              #03
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3.5">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-700 to-amber-500 opacity-70 blur-sm group-hover:opacity-100 transition-opacity" />
                <Avatar className="relative h-20 w-20 border-2 border-amber-600 shadow-xl ring-2 ring-amber-700/30">
                  <AvatarImage src={third.avatarUrl} alt={third.username} />
                  <AvatarFallback className="bg-slate-800 text-amber-400 font-bold">
                    {third.username.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                {third.username}
                <span className="text-[11px] font-mono text-muted-foreground font-normal">
                  {third.tag}
                </span>
              </h3>

              <p className="text-xs text-muted-foreground mb-4">
                {third.country} • {third.favoriteAgent} Main
              </p>

              <div className="w-full grid grid-cols-2 gap-2 border-t border-slate-800/90 pt-3 text-center">
                <div className="rounded-xl bg-slate-900/80 p-2 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Win Rate
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    {third.winRate}%
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900/80 p-2 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Rating / LP
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    {formatScore(third.score)}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
