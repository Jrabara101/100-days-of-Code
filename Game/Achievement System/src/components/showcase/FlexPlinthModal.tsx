import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import {
  Sparkles,
  Copy,
  Check,
  Trash2,
  Share2,
  Crown,
  Shield,
  Layers,
  Award,
} from 'lucide-react';
import { AchievementNode, PlinthState } from '../../types/achievement';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface FlexPlinthModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Record<string, AchievementNode>;
  plinthState: PlinthState;
  onUpdatePlinth: (newState: PlinthState) => void;
}

export const FlexPlinthModal: React.FC<FlexPlinthModalProps> = ({
  isOpen,
  onClose,
  nodes,
  plinthState,
  onUpdatePlinth,
}) => {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);

  const unlockedNodes = Object.values(nodes).filter((n) => n.isUnlocked);
  const totalSlots = plinthState.size * plinthState.size;

  // Calculate Flex Score & Rarest on Plinth
  const pinnedIds = Object.values(plinthState.slots).filter(Boolean) as string[];
  const pinnedNodes = pinnedIds.map((id) => nodes[id]).filter(Boolean);

  const flexPoints = pinnedNodes.reduce((sum, n) => sum + n.points, 0);
  const avgRarity =
    pinnedNodes.length > 0
      ? (
          pinnedNodes.reduce((sum, n) => sum + n.globalRarityPercent, 0) / pinnedNodes.length
        ).toFixed(1)
      : '0.0';

  const handleSlotClick = (index: number) => {
    setSelectedSlotIndex(index);
  };

  const handleAssignNode = (nodeId: string) => {
    if (selectedSlotIndex === null) return;
    const nextSlots = { ...plinthState.slots, [selectedSlotIndex]: nodeId };
    onUpdatePlinth({ ...plinthState, slots: nextSlots });
    setSelectedSlotIndex(null);
  };

  const handleClearSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSlots = { ...plinthState.slots };
    delete nextSlots[index];
    onUpdatePlinth({ ...plinthState, slots: nextSlots });
  };

  const handleToggleSize = (newSize: 3 | 5) => {
    onUpdatePlinth({ ...plinthState, size: newSize });
    setSelectedSlotIndex(null);
  };

  const handleCopyCardMarkdown = () => {
    const plinthNames = pinnedNodes.map((n) => `✦ ${n.title} [${n.tier.toUpperCase()} - ${n.points} PTS]`).join('\n');
    const badgeText = `╔══════════════════════════════════════╗
║  🏆 OPERATOR TROPHY FLEX PLINTH     ║
║  Score: ${flexPoints} PTS | Avg Rarity: ${avgRarity}%   ║
╠══════════════════════════════════════╣
${plinthNames || '║  (No trophies currently socketed)   ║'}
╚══════════════════════════════════════╝
Authenticated by Voxel DAG Archipelago Matrix v4.2`;

    navigator.clipboard.writeText(badgeText);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Operator Flex Plinth</DialogTitle>
              <DialogDescription className="text-xs">
                Socket your rarest conquered voxel blocks to generate your showcase badge.
              </DialogDescription>
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-4 mt-2">
        {/* Plinth Telemetry Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-slate-700/80">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Flex Plinth Score
              </span>
              <span className="text-lg font-extrabold text-amber-300 font-mono">
                {flexPoints.toLocaleString()} PTS
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Average Rarity
              </span>
              <span className="text-lg font-extrabold text-cyan-400 font-mono">
                {avgRarity}%
              </span>
            </div>
          </div>

          {/* Size Switcher 3x3 / 5x5 */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface-dim border border-slate-800">
            <button
              onClick={() => handleToggleSize(3)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                plinthState.size === 3
                  ? 'bg-primary text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3x3
            </button>
            <button
              onClick={() => handleToggleSize(5)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                plinthState.size === 5
                  ? 'bg-primary text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5x5
            </button>
          </div>
        </div>

        {/* Isometric / Grid Plinth Showcase Stage */}
        <div
          className={`grid gap-2.5 p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-black/90 border border-slate-700/90 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] justify-center mx-auto`}
          style={{
            gridTemplateColumns: `repeat(${plinthState.size}, minmax(0, 1fr))`,
            width: plinthState.size === 3 ? '270px' : '360px',
          }}
        >
          {Array.from({ length: totalSlots }).map((_, index) => {
            const nodeId = plinthState.slots[index];
            const node = nodeId ? nodes[nodeId] : null;
            const IconComponent = node ? (Icons as any)[node.icon] || Icons.CircleDot : null;

            return (
              <div
                key={index}
                onClick={() => handleSlotClick(index)}
                className={`relative rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-200 select-none group ${
                  plinthState.size === 3 ? 'w-20 h-20' : 'w-14 h-14'
                } ${
                  node
                    ? 'voxel-block bg-surface-high border-amber-500/50 hover:scale-105 shadow-md'
                    : 'border-dashed border-slate-800 hover:border-slate-600 bg-surface-dim/50'
                } ${selectedSlotIndex === index ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              >
                {node && IconComponent ? (
                  <>
                    <IconComponent
                      className={`text-amber-400 ${plinthState.size === 3 ? 'w-8 h-8' : 'w-6 h-6'}`}
                    />
                    <div className="absolute -bottom-1.5 px-1 rounded bg-black/90 text-[8px] font-mono text-amber-300 font-bold border border-slate-800 truncate max-w-full">
                      {node.title.slice(0, 8)}..
                    </div>
                    {/* Clear Button on Hover */}
                    <button
                      onClick={(e) => handleClearSlot(index, e)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-slate-600 text-xs font-mono group-hover:text-slate-400">
                    +{index + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Slot Selection Drawer: Pick from Unlocked Trophies */}
        {selectedSlotIndex !== null && (
          <div className="p-3 rounded-xl bg-surface-container border border-slate-700 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">
                Socket Trophy into Slot #{selectedSlotIndex + 1}
              </span>
              <button
                onClick={() => setSelectedSlotIndex(null)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {unlockedNodes.length === 0 ? (
              <p className="text-xs text-slate-400">
                No trophies unlocked yet. Complete milestones on the matrix to socket them!
              </p>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {unlockedNodes.map((n) => {
                  const Icon = (Icons as any)[n.icon] || Icons.CircleDot;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleAssignNode(n.id)}
                      className="flex flex-col items-center p-2 rounded-lg bg-surface-high hover:bg-surface-highest border border-slate-700 min-w-[76px] transition-transform active:scale-95"
                    >
                      <Icon className="w-5 h-5 text-amber-400 mb-1" />
                      <span className="text-[10px] font-bold text-white truncate max-w-[64px]">
                        {n.title}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-semibold">
                        +{n.points}p
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400">
            {pinnedNodes.length} / {totalSlots} Sockets Bound
          </span>
          <Button
            variant="primary"
            onClick={handleCopyCardMarkdown}
            className="gap-2 text-xs font-bold"
          >
            {copiedCard ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>Copy Discord / Social Card</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
