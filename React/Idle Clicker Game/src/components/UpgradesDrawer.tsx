import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Bot,
  Flame,
  Sun,
  Orbit,
  Satellite,
  Atom,
  Layers,
  Check,
  Lock,
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { formatBigNumber, NotationType, toDecimal } from '../lib/bigNumber';
import { UpgradeConfig } from '../types/game';

interface UpgradesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  upgrades: Record<string, UpgradeConfig>;
  currency: string;
  notation: NotationType;
  onBuyUpgrade: (id: string) => void;
}

const UPGRADE_ICONS: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-4 h-4 text-amber-400" />,
  Bot: <Bot className="w-4 h-4 text-emerald-400" />,
  Cpu: <Layers className="w-4 h-4 text-cyan-400" />,
  Flame: <Flame className="w-4 h-4 text-emerald-400" />,
  Sun: <Sun className="w-4 h-4 text-amber-400" />,
  Orbit: <Orbit className="w-4 h-4 text-cyan-400" />,
  Satellite: <Satellite className="w-4 h-4 text-amber-400" />,
  Atom: <Atom className="w-4 h-4 text-purple-400" />,
  Sparkles: <Sparkles className="w-4 h-4 text-cyan-400" />,
  Layers: <Layers className="w-4 h-4 text-purple-400" />,
  Radio: <Zap className="w-4 h-4 text-amber-400" />,
  Globe: <Orbit className="w-4 h-4 text-cyan-400" />,
  Share2: <Sparkles className="w-4 h-4 text-purple-400" />,
};

export const UpgradesDrawer: React.FC<UpgradesDrawerProps> = ({
  open,
  onOpenChange,
  upgrades,
  currency,
  notation,
  onBuyUpgrade,
}) => {
  const [selectedTier, setSelectedTier] = useState<number | 'ALL'>('ALL');
  const curDec = toDecimal(currency);

  const upgradeList = Object.values(upgrades);
  const filtered = upgradeList.filter((u) =>
    selectedTier === 'ALL' ? true : u.tier === selectedTier
  );

  const purchasedCount = upgradeList.filter((u) => u.isPurchased).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Research & Development
            </span>
          </div>
          <Badge variant="cyan" className="font-mono text-xs">
            {purchasedCount} / {upgradeList.length} Unlocked
          </Badge>
        </div>
        <DialogTitle className="text-2xl text-white">
          Quantum Tech Tree
        </DialogTitle>
        <DialogDescription>
          Unlock permanent compounding multipliers for kinetic core tapping, autonomous drones, and global matter yields.
        </DialogDescription>
      </DialogHeader>

      {/* Tier Filter Tabs */}
      <div className="flex items-center gap-1.5 pb-3 border-b border-slate-800 overflow-x-auto">
        {(['ALL', 1, 2, 3, 4, 5] as const).map((tier) => (
          <button
            key={String(tier)}
            onClick={() => setSelectedTier(tier)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              selectedTier === tier
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tier === 'ALL' ? 'All Tiers' : `Tier ${tier}`}
          </button>
        ))}
      </div>

      {/* Upgrades List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pt-3 pr-1">
        {filtered.map((upg) => {
          const costDec = toDecimal(upg.cost);
          const canAfford = !upg.isPurchased && curDec.gte(costDec);

          return (
            <div
              key={upg.id}
              className={`rounded-xl p-3.5 glass-card flex flex-col justify-between gap-3 border transition-all ${
                upg.isPurchased
                  ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75'
                  : canAfford
                  ? 'border-cyan-500/50 shadow-glow-cyan'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        upg.isPurchased
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                    >
                      {UPGRADE_ICONS[upg.icon || 'Zap'] || <Zap className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold font-display text-slate-100">
                        {upg.name}
                      </h3>
                      <span className="text-[10px] font-mono text-cyan-400">
                        Tier {upg.tier} • {upg.targetType} Multiplier
                      </span>
                    </div>
                  </div>

                  {upg.isPurchased && (
                    <Badge variant="mint" className="text-[10px] px-1.5 py-0">
                      <Check className="w-3 h-3 mr-0.5" /> Acquired
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                  {upg.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-amber-300">
                  {upg.isPurchased ? 'PURCHASED' : `${formatBigNumber(upg.cost, notation)} FLUX`}
                </span>

                {!upg.isPurchased && (
                  <Button
                    variant={canAfford ? 'cyan' : 'default'}
                    size="sm"
                    disabled={!canAfford}
                    onClick={() => onBuyUpgrade(upg.id)}
                    className="text-xs font-mono font-bold"
                  >
                    {canAfford ? 'Research' : 'Insufficient Flux'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
};
