import React from 'react';
import { Session, CoreStatMetric } from '../../types/telemetry';
import { 
  X, 
  Trophy, 
  Clock, 
  MapPin, 
  Swords, 
  Crosshair, 
  Target, 
  Flame, 
  Shield, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SessionDetailDrawerProps {
  session: Session | null;
  onClose: () => void;
  thirtyDayAvgKd: number;
  thirtyDayAvgAccuracy: number;
  thirtyDayAvgDamage: number;
}

export const SessionDetailDrawer: React.FC<SessionDetailDrawerProps> = ({
  session,
  onClose,
  thirtyDayAvgKd,
  thirtyDayAvgAccuracy,
  thirtyDayAvgDamage
}) => {
  if (!session) return null;

  const isVictory = session.result === 'VICTORY';

  // Comparisons against 30-day average (not vs other players per Decision 1)
  const kdDiff = Number((session.kdRatio - thirtyDayAvgKd).toFixed(2));
  const accDiff = Number((session.accuracyPercent - thirtyDayAvgAccuracy).toFixed(1));
  const dmgDiff = session.damageDealt - thirtyDayAvgDamage;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-drawer-title"
    >
      <div 
        className="w-full max-w-xl h-full bg-[#0d1322] border-l border-cyan-500/30 p-6 overflow-y-auto shadow-[-10px_0_40px_rgba(0,0,0,0.8)] flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#1f293d]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-['JetBrains_Mono'] font-bold ${
                    isVictory
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {session.result}
                </span>
                <span className="font-['JetBrains_Mono'] text-xs text-slate-400">
                  {session.roundsWon} - {session.roundsLost}
                </span>
                <span className="font-['JetBrains_Mono'] text-xs text-cyan-400 font-bold">
                  {session.eloChange > 0 ? `+${session.eloChange} Elo` : `${session.eloChange} Elo`}
                </span>
              </div>
              <h2 id="session-drawer-title" className="font-['Space_Grotesk'] text-xl font-bold text-slate-100">
                {session.mode} • {session.map}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-['JetBrains_Mono']">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {session.durationMinutes}m duration
                </span>
                <span>•</span>
                <span>{new Date(session.startTime).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded bg-[#111827] hover:bg-[#1a2233] text-slate-400 hover:text-white transition border border-[#1f293d]"
              aria-label="Close session details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notable Badges (PRs, Clutches, Aces) */}
          {session.notableBadges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {session.notableBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-400/40 font-['JetBrains_Mono'] text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Section: This Session vs. Your 30-Day Average */}
          <div className="mt-6 p-4 rounded-lg bg-[#090d16] border border-[#1f293d]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-cyan-400 uppercase tracking-wider">
                // THIS SESSION VS. YOUR 30-DAY AVERAGE
              </span>
              <span className="text-[10px] text-slate-500 font-['JetBrains_Mono']">
                Past-Self Baseline
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-['JetBrains_Mono']">
              {/* K/D Comparison */}
              <div className="p-2.5 rounded bg-[#111827] border border-[#1a2233]">
                <span className="text-[10px] text-slate-500 block">K/D RATIO</span>
                <span className="text-base font-bold text-slate-100 tabular-nums">
                  {session.kdRatio.toFixed(2)}
                </span>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  {kdDiff >= 0 ? (
                    <span className="text-emerald-400 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      +{kdDiff}
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                      {kdDiff}
                    </span>
                  )}
                  <span className="text-slate-500 text-[10px]">vs avg</span>
                </div>
              </div>

              {/* Accuracy Comparison */}
              <div className="p-2.5 rounded bg-[#111827] border border-[#1a2233]">
                <span className="text-[10px] text-slate-500 block">ACCURACY</span>
                <span className="text-base font-bold text-slate-100 tabular-nums">
                  {session.accuracyPercent}%
                </span>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  {accDiff >= 0 ? (
                    <span className="text-emerald-400 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      +{accDiff}%
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                      {accDiff}%
                    </span>
                  )}
                  <span className="text-slate-500 text-[10px]">vs avg</span>
                </div>
              </div>

              {/* Damage Comparison */}
              <div className="p-2.5 rounded bg-[#111827] border border-[#1a2233]">
                <span className="text-[10px] text-slate-500 block">DAMAGE DEALT</span>
                <span className="text-base font-bold text-slate-100 tabular-nums">
                  {session.damageDealt.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  {dmgDiff >= 0 ? (
                    <span className="text-emerald-400 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      +{dmgDiff}
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                      {dmgDiff}
                    </span>
                  )}
                  <span className="text-slate-500 text-[10px]">vs avg</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1a2233] flex items-center justify-between text-[11px] text-slate-400 font-['JetBrains_Mono']">
              <span>Primary Weapon: <strong className="text-cyan-300">{session.primaryWeapon}</strong></span>
              <span>Peak Round: <strong className="text-amber-300">{session.peakRoundDamage} DMG</strong></span>
            </div>
          </div>

          {/* Section: Match Timeline (Moments, Clutches, Kills, Deaths) */}
          <div className="mt-6">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
              Match Timeline & Critical Rounds
            </h3>

            <div className="relative pl-6 space-y-4 border-l border-[#1f293d] ml-2">
              {session.timeline.map((moment, index) => {
                let badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                if (moment.type === 'pr' || moment.type === 'ace') {
                  badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-400/50';
                } else if (moment.type === 'round_win') {
                  badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                } else if (moment.type === 'death') {
                  badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                }

                return (
                  <div key={index} className="relative group">
                    {/* Circle marker on border line */}
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#0d1322] border-2 border-cyan-400 group-hover:scale-125 transition-transform" />

                    <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-slate-500 mb-0.5">
                      <span>Round {moment.round}</span>
                      <span>+{Math.floor(moment.timeOffsetSec / 60)}m {moment.timeOffsetSec % 60}s</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#111827] border border-[#1f293d] group-hover:border-cyan-400/40 transition">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold border ${badgeColor}`}>
                          {moment.type.toUpperCase()}
                        </span>
                        <span className="font-['Inter'] text-xs font-medium text-slate-200">
                          {moment.description}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="mt-8 pt-4 border-t border-[#1f293d] flex items-center justify-between">
          <span className="text-[11px] font-['JetBrains_Mono'] text-slate-500">
            Session UUID: {session.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-[#090d16] font-['Space_Grotesk'] text-xs font-bold transition shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  );
};
