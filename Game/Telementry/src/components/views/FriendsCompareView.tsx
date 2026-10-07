import React from 'react';
import { FriendComparison, PlayerProfile } from '../../types/telemetry';
import { Users, Shield, CheckCircle2, HeartHandshake, Sparkles } from 'lucide-react';

interface FriendsCompareViewProps {
  friend: FriendComparison;
  player: PlayerProfile;
}

export const FriendsCompareView: React.FC<FriendsCompareViewProps> = ({
  friend,
  player
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-lg bg-[#0d1322] border border-cyan-500/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
              Duo Mutual Telemetry // 1-on-1 Side-by-Side
            </h2>
          </div>
          <p className="font-['Inter'] text-xs text-slate-400 mt-1 max-w-xl">
            Opt-in both ways. Framed for squad synergy and cooperative growth, never public leaderboard shaming.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-['JetBrains_Mono']">
          <HeartHandshake className="w-4 h-4" />
          <span>Mutual Duo Consent Verified</span>
        </div>
      </section>

      {/* Duo Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* You */}
        <div className="p-4 rounded-lg bg-[#0d1322] border border-cyan-500/30 flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-gradient-to-br from-cyan-600 to-indigo-700 flex items-center justify-center font-['JetBrains_Mono'] font-bold text-white text-sm border border-cyan-400/50">
            {player.avatarSeed.slice(0, 2)}
          </div>
          <div>
            <span className="text-[10px] font-['JetBrains_Mono'] text-cyan-400 block uppercase">
              OPERATOR // YOU
            </span>
            <div className="font-['Space_Grotesk'] text-lg font-bold text-slate-100">
              {player.displayName}
            </div>
            <div className="text-xs font-['JetBrains_Mono'] text-slate-400">
              {player.rankTier} • ELO {player.elo}
            </div>
          </div>
        </div>

        {/* Friend */}
        <div className="p-4 rounded-lg bg-[#0d1322] border border-[#1f293d] flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center font-['JetBrains_Mono'] font-bold text-white text-sm border border-purple-400/50">
            {friend.friendAvatar.slice(0, 2)}
          </div>
          <div>
            <span className="text-[10px] font-['JetBrains_Mono'] text-purple-400 block uppercase">
              DUO PARTNER // MUTUAL OPT-IN
            </span>
            <div className="font-['Space_Grotesk'] text-lg font-bold text-slate-100">
              {friend.friendName}
            </div>
            <div className="text-xs font-['JetBrains_Mono'] text-slate-400">
              {friend.friendRank} • {friend.sharedSessionsCount} Matches Together
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Metrics Table */}
      <section className="rounded-lg bg-[#0d1322] border border-[#1f293d] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
          Comparative Performance Readouts
        </h3>

        <div className="space-y-3 font-['JetBrains_Mono'] text-xs">
          {friend.metrics.map((metric, idx) => {
            return (
              <div
                key={idx}
                className="p-3 rounded bg-[#090d16] border border-[#1f293d] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <span className="font-['Space_Grotesk'] text-slate-300 font-semibold text-xs sm:w-1/3">
                  {metric.name}
                </span>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-2/3">
                  {/* Player Value */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">YOU</span>
                    <span className={`text-sm font-bold tabular-nums ${
                      metric.playerAdvantage === true ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {metric.playerVal}
                    </span>
                  </div>

                  <span className="text-slate-600 text-xs font-normal">vs</span>

                  {/* Friend Value */}
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 block">{friend.friendName}</span>
                    <span className={`text-sm font-bold tabular-nums ${
                      metric.playerAdvantage === false ? 'text-purple-300' : 'text-slate-200'
                    }`}>
                      {metric.friendVal}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
