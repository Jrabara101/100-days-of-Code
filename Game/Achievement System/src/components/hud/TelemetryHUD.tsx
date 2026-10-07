import React, { useState } from 'react';
import { Gauge, ChevronDown, ChevronUp, Zap, Target, Flame, Compass, Sun, Shield } from 'lucide-react';
import { AchievementNode, BlockBiome } from '../../types/achievement';
import { Progress } from '../ui/progress';

interface TelemetryHUDProps {
  nodes: Record<string, AchievementNode>;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ nodes }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const nodeList = Object.values(nodes);
  const total = nodeList.length;
  const unlocked = nodeList.filter((n) => n.isUnlocked).length;

  // Category breakdown
  const biomes: BlockBiome[] = ['overworld', 'nether', 'crystal_depths', 'celestial'];
  const biomeStats = biomes.map((b) => {
    const biomeNodes = nodeList.filter((n) => n.biome === b);
    const biomeUnlocked = biomeNodes.filter((n) => n.isUnlocked).length;
    const pct = biomeNodes.length > 0 ? (biomeUnlocked / biomeNodes.length) * 100 : 0;
    return {
      biome: b,
      total: biomeNodes.length,
      unlocked: biomeUnlocked,
      percentage: pct,
    };
  });

  // Calculate Rarest Unlocked Achievement
  const unlockedNodes = nodeList.filter((n) => n.isUnlocked);
  const rarestUnlocked = unlockedNodes.reduce<AchievementNode | null>((rarest, current) => {
    if (!rarest) return current;
    return current.globalRarityPercent < rarest.globalRarityPercent ? current : rarest;
  }, null);

  // Playstyle Velocity & Trajectory
  const velocityPerDay = (unlocked / Math.max(1, 14)).toFixed(1); // simulated 14 days
  const remainingMilestones = total - unlocked;
  const estimatedDaysTo100 = remainingMilestones > 0 ? Math.ceil(remainingMilestones / (unlocked / 14 || 1)) : 0;

  return (
    <div className="absolute top-16 left-4 z-30 flex flex-col w-72 rounded-2xl bg-surface/90 border border-slate-700/80 p-3 shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* HUD Header */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary/20 text-primary">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white font-display block leading-none">
              Completionist Radar
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Velocity: {velocityPerDay} unlocks/day
            </span>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Metrics Drawer */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-3">
          {/* Biome Mastery Mini Bars */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Biome Milestones Velocity
            </span>
            {biomeStats.map((stat) => {
              const iconMap: Record<BlockBiome, any> = {
                overworld: Compass,
                nether: Flame,
                crystal_depths: Shield,
                celestial: Sun,
              };
              const Icon = iconMap[stat.biome];
              const colorMap: Record<BlockBiome, string> = {
                overworld: 'bg-emerald-400',
                nether: 'bg-orange-500',
                crystal_depths: 'bg-purple-400',
                celestial: 'bg-yellow-400',
              };

              return (
                <div key={stat.biome} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-300 capitalize flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-slate-400" />
                      {stat.biome.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400">
                      {stat.unlocked}/{stat.total} ({stat.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress
                    value={stat.percentage}
                    className="h-1.5"
                    indicatorClassName={colorMap[stat.biome]}
                  />
                </div>
              );
            })}
          </div>

          {/* Rarest Trophy Card */}
          {rarestUnlocked && (
            <div className="p-2 rounded-xl bg-surface-container border border-slate-700/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                ★
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  Apex Trophy Rarity
                </span>
                <span className="text-xs font-bold text-white truncate">{rarestUnlocked.title}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  Global: Only {rarestUnlocked.globalRarityPercent}% Unlocked
                </span>
              </div>
            </div>
          )}

          {/* Velocity Trajectory Estimate */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-[11px] font-mono">
            <span className="text-slate-400">Est. 100% Horizon:</span>
            <span className="text-primary font-bold">
              {remainingMilestones === 0 ? 'COMPLETED!' : `~${estimatedDaysTo100} Days`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
