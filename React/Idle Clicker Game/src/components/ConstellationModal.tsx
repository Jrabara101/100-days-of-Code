import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Clock,
  Bot,
  Activity,
  Layers,
  Check,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { PrestigePerk } from '../types/game';

interface ConstellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perks: Record<string, PrestigePerk>;
  prestigeShards: number;
  onUpgradePerk: (perkId: string) => void;
}

const PERK_ICONS: Record<string, React.ReactNode> = {
  perk_critical_core: <Zap className="w-5 h-5 text-amber-400" />,
  perk_chrono_compression: <Clock className="w-5 h-5 text-cyan-400" />,
  perk_drone_overclock: <Bot className="w-5 h-5 text-emerald-400" />,
  perk_auto_buyer: <Layers className="w-5 h-5 text-purple-400" />,
  perk_anomaly_magnet: <Activity className="w-5 h-5 text-red-400" />,
  perk_singularity_mastery: <Sparkles className="w-5 h-5 text-purple-300" />,
};

export const ConstellationModal: React.FC<ConstellationModalProps> = ({
  open,
  onOpenChange,
  perks,
  prestigeShards,
  onUpgradePerk,
}) => {
  const [selectedPerkId, setSelectedPerkId] = useState<string>('perk_critical_core');
  const selectedPerk = perks[selectedPerkId] || Object.values(perks)[0];

  const canAffordSelected =
    selectedPerk &&
    selectedPerk.level < selectedPerk.maxLevel &&
    prestigeShards >= selectedPerk.shardCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Celestial Ascension Matrix
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Available:</span>
            <Badge variant="purple" className="font-mono text-xs font-bold px-2.5 py-0.5">
              {prestigeShards.toLocaleString()} Antimatter Shards
            </Badge>
          </div>
        </div>
        <DialogTitle className="text-2xl text-white">
          Singularity Constellation Tree
        </DialogTitle>
        <DialogDescription>
          Spend permanent Antimatter Shards harvested from Singularity Collapses to unlock non-linear cosmic archetypes.
        </DialogDescription>
      </DialogHeader>

      {/* Constellation Canvas & Layout */}
      <div className="relative w-full h-64 my-3 rounded-2xl bg-gradient-to-b from-[#0B0D19] via-[#05070B] to-[#0A0D18] border border-purple-900/40 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Constellation SVG lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {Object.values(perks).map((source) => {
            if (!source.connections || source.connections.length === 0) return null;
            return source.connections.map((targetId) => {
              const target = perks[targetId];
              if (!target) return null;

              const isSourceActive = source.level > 0;
              const isTargetActive = target.level > 0;
              const isLineActive = isSourceActive && isTargetActive;

              return (
                <line
                  key={`${source.id}-${target.id}`}
                  x1={`${source.x || 50}%`}
                  y1={`${source.y || 50}%`}
                  x2={`${target.x || 50}%`}
                  y2={`${target.y || 50}%`}
                  stroke={isLineActive ? '#A855F7' : 'rgba(75, 85, 99, 0.4)'}
                  strokeWidth={isLineActive ? '2.5' : '1.5'}
                  strokeDasharray={isLineActive ? undefined : '4 4'}
                  className={isLineActive ? 'shadow-glow-purple' : ''}
                />
              );
            });
          })}
        </svg>

        {/* Constellation Interactive Node Buttons */}
        {Object.values(perks).map((perk) => {
          const isSelected = selectedPerkId === perk.id;
          const isMaxed = perk.level >= perk.maxLevel;
          const isActive = perk.level > 0;

          return (
            <button
              key={perk.id}
              onClick={() => setSelectedPerkId(perk.id)}
              style={{
                left: `${perk.x || 50}%`,
                top: `${perk.y || 50}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute p-2.5 rounded-xl border transition-all select-none group z-10 ${
                isSelected
                  ? 'bg-purple-900/90 border-purple-400 shadow-glow-purple scale-110 ring-2 ring-purple-400/50'
                  : isActive
                  ? 'bg-slate-900/90 border-purple-500/70 text-purple-300 hover:scale-105'
                  : 'bg-slate-950/80 border-slate-700 text-slate-500 hover:border-slate-500'
              }`}
            >
              <div className="relative">
                {PERK_ICONS[perk.id] || <Sparkles className="w-5 h-5 text-purple-400" />}
                {isMaxed && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-[9px] flex items-center justify-center text-slate-950 font-bold">
                    ✓
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Card */}
      {selectedPerk && (
        <div className="p-4 rounded-xl glass-card border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/50 flex items-center justify-center shrink-0 shadow-glow-purple">
              {PERK_ICONS[selectedPerk.id] || <Sparkles className="w-6 h-6 text-purple-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-display text-white">
                  {selectedPerk.name}
                </h3>
                <Badge variant={selectedPerk.level >= selectedPerk.maxLevel ? 'mint' : 'purple'}>
                  Rank {selectedPerk.level} / {selectedPerk.maxLevel}
                </Badge>
              </div>
              <p className="text-xs font-mono text-slate-300 mt-1 leading-relaxed">
                {selectedPerk.description}
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto text-right">
            {selectedPerk.level >= selectedPerk.maxLevel ? (
              <Badge variant="mint" className="text-xs px-3 py-1 font-mono">
                <Check className="w-3.5 h-3.5 mr-1" /> MAX CONVERGENCE
              </Badge>
            ) : (
              <Button
                variant={canAffordSelected ? 'purple' : 'default'}
                size="md"
                disabled={!canAffordSelected}
                onClick={() => onUpgradePerk(selectedPerk.id)}
                className="w-full md:w-auto font-mono text-xs font-bold py-2 px-4 shadow-glow-purple"
              >
                <span>Attune ({selectedPerk.shardCost} Shards)</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};
