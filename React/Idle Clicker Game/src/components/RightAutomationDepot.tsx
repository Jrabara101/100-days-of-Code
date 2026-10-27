import React, { useState } from 'react';
import Decimal from 'break_infinity.js';
import {
  Bot,
  Flame,
  Sun,
  Orbit,
  Satellite,
  Atom,
  Sparkles,
  Zap,
  Globe,
  Radio,
  Lock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ToggleGroup } from './ui/ToggleGroup';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import {
  formatBigNumber,
  calculateBulkGeneratorCost,
  calculateMaxAffordableGenerators,
  NotationType,
  toDecimal,
} from '../lib/bigNumber';
import { GeneratorConfig, BuyMultiplier } from '../types/game';

interface RightAutomationDepotProps {
  generators: Record<string, GeneratorConfig>;
  currency: string;
  totalCps: string;
  notation: NotationType;
  onBuyGenerator: (id: string, multiplier: BuyMultiplier) => void;
  onOpenUpgrades: () => void;
  purchasedUpgradesCount: number;
  totalUpgradesCount: number;
}

const GENERATOR_ICONS: Record<string, React.ReactNode> = {
  nanobot: <Bot className="w-4 h-4 text-emerald-400" />,
  plasma_extractor: <Flame className="w-4 h-4 text-emerald-400" />,
  fusion_dynamo: <Sun className="w-4 h-4 text-amber-400" />,
  quantum_collider: <Orbit className="w-4 h-4 text-cyan-400" />,
  orbital_array: <Satellite className="w-4 h-4 text-amber-400" />,
  antimatter_siphon: <Atom className="w-4 h-4 text-purple-400" />,
  dyson_harvester: <Sparkles className="w-4 h-4 text-cyan-400" />,
  tachyon_condenser: <Zap className="w-4 h-4 text-red-400" />,
  dark_matter_forge: <Globe className="w-4 h-4 text-purple-400" />,
  celestial_weaver: <Radio className="w-4 h-4 text-cyan-400" />,
  singularity_engine: <Atom className="w-4 h-4 text-purple-400" />,
  omega_foundry: <Sparkles className="w-4 h-4 text-amber-400" />,
};

export const RightAutomationDepot: React.FC<RightAutomationDepotProps> = ({
  generators,
  currency,
  totalCps,
  notation,
  onBuyGenerator,
  onOpenUpgrades,
  purchasedUpgradesCount,
  totalUpgradesCount,
}) => {
  const [multiplier, setMultiplier] = useState<BuyMultiplier>(1);
  const curDec = toDecimal(currency);
  const totalCpsDec = toDecimal(totalCps);

  const multiplierOptions = [
    { label: 'x1', value: 1 as BuyMultiplier },
    { label: 'x10', value: 10 as BuyMultiplier },
    { label: 'x100', value: 100 as BuyMultiplier },
    { label: 'MAX', value: 'MAX' as BuyMultiplier },
  ];

  return (
    <div className="w-full lg:w-[410px] flex flex-col glass-panel border-l border-border-subtle h-full">
      {/* Automation Depot Header */}
      <div className="p-3.5 border-b border-border-subtle flex items-center justify-between gap-2 bg-slate-950/40">
        <div>
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-production-mint" />
            Automation Depot
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            {Object.values(generators).filter((g) => g.unlocked).length} Systems Operational
          </span>
        </div>

        {/* Buy Multiplier Selector */}
        <ToggleGroup
          value={multiplier}
          onValueChange={setMultiplier}
          options={multiplierOptions}
          size="sm"
        />
      </div>

      {/* Generator Cards Scroll Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {Object.values(generators).map((gen) => {
          if (!gen.unlocked) {
            return (
              <div
                key={gen.id}
                className="rounded-xl p-3 border border-dashed border-slate-800 bg-slate-950/40 flex items-center justify-between opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Classified Facility
                    </span>
                    <p className="text-[10px] font-mono text-slate-600">
                      Unlocks at {formatBigNumber(toDecimal(gen.baseCost).times(0.65), notation)} Lifetime
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // Compute purchase calculation based on multiplier
          let countToBuy = 0;
          let cost = new Decimal(0);

          if (multiplier === 'MAX') {
            const maxRes = calculateMaxAffordableGenerators(
              gen.baseCost,
              gen.costExponent,
              gen.owned,
              curDec
            );
            countToBuy = maxRes.maxCount;
            cost = maxRes.totalCost;
          } else {
            countToBuy = multiplier;
            cost = calculateBulkGeneratorCost(
              gen.baseCost,
              gen.costExponent,
              gen.owned,
              countToBuy
            );
          }

          const canAfford = countToBuy > 0 && curDec.gte(cost);

          // Individual CPS calculation
          const singleCps = toDecimal(gen.baseProductionPerSec);
          const totalGenCps = singleCps.times(gen.owned);
          const cpsSharePercent = totalCpsDec.gt(0)
            ? totalGenCps.div(totalCpsDec).times(100).toNumber()
            : 0;

          // Milestone progress (next milestone: 25, 50, 100, 200, 500)
          const milestones = [25, 50, 100, 200, 500];
          const nextMilestone = milestones.find((m) => m > gen.owned) || gen.owned + 100;
          const prevMilestone = [...milestones].reverse().find((m) => m <= gen.owned) || 0;
          const milestoneProgress = Math.min(
            100,
            Math.max(0, ((gen.owned - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
          );

          return (
            <div
              key={gen.id}
              className={`rounded-xl p-3 glass-card transition-all relative overflow-hidden ${
                canAfford
                  ? 'border-production-mint/40 hover:border-production-mint/70 hover:shadow-glow-mint'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Left: Icon & Title */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      gen.owned > 0
                        ? 'bg-slate-900/90 border-slate-700 shadow-sm'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {GENERATOR_ICONS[gen.id] || <Bot className="w-4 h-4 text-emerald-400" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-100 font-display truncate">
                        {gen.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                        x{gen.owned}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                      <span className="text-emerald-400 font-semibold">
                        +{formatBigNumber(totalGenCps, notation)} /s
                      </span>
                      {totalCpsDec.gt(0) && (
                        <span className="text-slate-500">
                          ({cpsSharePercent.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Buy Button */}
                <div className="shrink-0 text-right">
                  <Button
                    variant={canAfford ? 'mint' : 'default'}
                    size="sm"
                    disabled={!canAfford}
                    onClick={() => onBuyGenerator(gen.id, multiplier)}
                    className={`font-mono text-xs font-bold px-3 py-1.5 min-w-[95px] flex flex-col items-center justify-center ${
                      canAfford ? 'sheen-effect' : 'opacity-50'
                    }`}
                  >
                    <span className="text-[11px] leading-tight">
                      {multiplier === 'MAX' ? (countToBuy > 0 ? `+${countToBuy}` : 'MAX') : `+${countToBuy}`}
                    </span>
                    <span className="text-[10px] text-amber-300 font-extrabold leading-tight">
                      {cost.gt(0) ? formatBigNumber(cost, notation) : 'N/A'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Milestone Progress Bar */}
              {gen.owned > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2">
                  <div className="flex-1">
                    <Progress
                      value={milestoneProgress}
                      indicatorColor="mint"
                      className="h-1"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 shrink-0">
                    {gen.owned}/{nextMilestone}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrades Quick Bar */}
      <div className="p-3 border-t border-border-subtle bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono text-slate-300">
            Researched Tech:
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {purchasedUpgradesCount}/{totalUpgradesCount}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenUpgrades}
          className="text-xs font-mono text-cyan-300 border-cyan-500/30 hover:bg-cyan-950/30"
        >
          <span>Open Tree</span>
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
};
