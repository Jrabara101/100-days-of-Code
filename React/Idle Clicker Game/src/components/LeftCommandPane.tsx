import React from 'react';
import Decimal from 'break_infinity.js';
import {
  Sparkles,
  Zap,
  Clock,
  MousePointer,
  RotateCcw,
  Trophy,
  Activity,
  Layers,
  Award,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { formatBigNumber, NotationType, toDecimal } from '../lib/bigNumber';
import { IdleGameState } from '../types/game';

interface LeftCommandPaneProps {
  state: IdleGameState;
  notation: NotationType;
  onCollapseReactor: () => void;
  onOpenConstellation: () => void;
  onOpenLeaderboard: () => void;
  onToggleFloatingNumbers: () => void;
}

export const LeftCommandPane: React.FC<LeftCommandPaneProps> = ({
  state,
  notation,
  onCollapseReactor,
  onOpenConstellation,
  onOpenLeaderboard,
  onToggleFloatingNumbers,
}) => {
  const lifetimeDec = toDecimal(state.lifetimeCurrency);
  const threshold = new Decimal('1e11'); // 100 Billion
  const canPrestige = lifetimeDec.gte(threshold);

  // Calculate prospective shard reward
  let prospectiveShards = 0;
  if (canPrestige) {
    const ratio = lifetimeDec.div(threshold);
    const shardsDec = ratio.pow(0.22).times(5).floor();
    prospectiveShards = Math.max(1, shardsDec.toNumber());
  }

  // Format playtime
  const elapsedSec = Math.floor((Date.now() - state.stats.gameStartTime) / 1000);
  const hours = Math.floor(elapsedSec / 3600);
  const minutes = Math.floor((elapsedSec % 3600) / 60);
  const seconds = elapsedSec % 60;
  const formattedTime = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;

  return (
    <div className="w-full lg:w-[300px] flex flex-col gap-4 p-4 glass-panel border-r border-border-subtle h-full overflow-y-auto">
      {/* 1. Singularity Shards Capsule */}
      <div className="relative rounded-xl p-4 bg-gradient-to-br from-purple-950/60 via-slate-900/80 to-slate-950/90 border border-purple-500/30 shadow-glow-purple flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Antimatter Shards
          </span>
          <Badge variant="purple" className="font-mono text-[11px]">
            Tier {state.stats.totalPrestigeCount}
          </Badge>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-mono font-extrabold text-white tracking-tight">
            {state.prestigeCurrency.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-purple-300">Shards</span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Global Production Bonus:{' '}
          <span className="text-purple-300 font-bold">
            +{(state.prestigeCurrency * 2).toFixed(0)}%
          </span>
        </div>

        {/* Singularity Collapse Action */}
        <div className="mt-2 pt-2 border-t border-purple-900/50 flex flex-col gap-1.5">
          <Button
            variant={canPrestige ? 'purple' : 'outline'}
            size="sm"
            onClick={onCollapseReactor}
            disabled={!canPrestige}
            className={`w-full font-mono text-xs font-bold py-2.5 ${
              canPrestige ? 'animate-pulse' : 'opacity-60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            {canPrestige ? `COLLAPSE REACTOR [+${prospectiveShards} SHARDS]` : 'COLLAPSE LOCKED'}
          </Button>

          {!canPrestige && (
            <span className="text-[10px] font-mono text-slate-500 text-center">
              Requires 100.0 B Lifetime Flux (Currently {formatBigNumber(state.lifetimeCurrency, notation)})
            </span>
          )}

          <Button
            variant="glass"
            size="sm"
            onClick={onOpenConstellation}
            className="w-full text-xs font-mono text-purple-200 border-purple-800/40 hover:bg-purple-950/40"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
            Ascension Tree
          </Button>
        </div>
      </div>

      {/* 2. Stat Telemetry Card */}
      <div className="glass-card rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Core Telemetry
          </span>
          <span className="text-[10px] font-mono text-slate-500">LIVE</span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MousePointer className="w-3 h-3 text-slate-500" />
              Manual Clicks:
            </span>
            <span className="text-slate-200 font-bold">
              {state.stats.totalClicks.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" />
              Peak Velocity (CPS):
            </span>
            <span className="text-amber-300 font-bold">
              {formatBigNumber(state.stats.highestCps, notation)} /s
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Anomalies Sniped:
            </span>
            <span className="text-cyan-300 font-bold">
              {state.stats.totalAnomaliesCaught}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-purple-400" />
              Lifetime Wealth:
            </span>
            <span className="text-purple-300 font-bold">
              {formatBigNumber(state.lifetimeCurrency, notation)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500" />
              Mission Time:
            </span>
            <span className="text-slate-300">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Competitive Quick Command */}
      <div className="mt-auto pt-2 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenLeaderboard}
          className="w-full text-xs font-mono border-amber-500/30 text-amber-300 hover:bg-amber-950/20"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
          Global Leaderboard
        </Button>

        {/* Quick Utility Toggles */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono text-slate-400">
          <span>Floating Numbers</span>
          <button
            onClick={onToggleFloatingNumbers}
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              state.settings.floatingNumbers
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {state.settings.floatingNumbers ? 'ENABLED' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
