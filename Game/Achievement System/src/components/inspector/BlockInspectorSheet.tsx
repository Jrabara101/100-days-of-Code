import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import {
  Share2,
  Lock,
  CheckCircle2,
  Sparkles,
  Fingerprint,
  Copy,
  Check,
  Award,
  Pin,
  HelpCircle,
} from 'lucide-react';
import { AchievementNode } from '../../types/achievement';
import { Sheet, SheetHeader, SheetTitle } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { truncateHash } from '../../lib/utils';

interface BlockInspectorSheetProps {
  node: AchievementNode | null;
  allNodes: Record<string, AchievementNode>;
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (nodeId: string) => void;
  onPinToPlinth: (nodeId: string) => void;
}

export const BlockInspectorSheet: React.FC<BlockInspectorSheetProps> = ({
  node,
  allNodes,
  isOpen,
  onClose,
  onClaimReward,
  onPinToPlinth,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [shared, setShared] = useState(false);

  if (!node) return null;

  const IconComponent = (Icons as any)[node.icon] || Icons.CircleDot;
  const isPrereqsFulfilled =
    node.parentIds.length === 0 ||
    node.parentIds.every((pid) => allNodes[pid] && allNodes[pid].isUnlocked);

  const progressPercent = Math.min(
    100,
    Math.max(0, (node.progress.current / node.progress.target) * 100)
  );

  const handleCopyToken = () => {
    if (node.unlockToken) {
      navigator.clipboard.writeText(node.unlockToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleShare = () => {
    const shareText = `🏆 [Achievement Matrix Unlocked] ${node.title} (${node.tier.toUpperCase()} - +${
      node.points
    } PTS)\nGlobal Rarity: ${node.globalRarityPercent}%\nLedger Hash: ${
      node.unlockToken || 'PENDING'
    }`;
    navigator.clipboard.writeText(shareText);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose} side="right">
      <SheetHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge tier={node.tier}>{node.tier}</Badge>
          <Badge biome={node.biome}>{node.biome.replace('_', ' ')}</Badge>
          {node.isSecret && (
            <Badge variant="outline" className="border-pink-500/40 text-pink-300">
              Riddle Geode
            </Badge>
          )}
        </div>
        <SheetTitle className="text-2xl font-extrabold font-display text-white">
          {node.title}
        </SheetTitle>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>
            Grid: X: {node.gridCoordinates.x} // Y: {node.gridCoordinates.y}
          </span>
          <span>•</span>
          <span className="text-amber-400 font-bold">
            Global: {node.globalRarityPercent}% Unlocked
          </span>
        </div>
      </SheetHeader>

      <div className="mt-4 flex flex-col gap-5">
        {/* Block Hero Display */}
        <div className="p-4 rounded-2xl bg-surface-container border border-slate-700/80 flex items-center gap-4 relative overflow-hidden">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-xl relative ${
              node.isUnlocked
                ? 'voxel-block bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/50'
                : 'voxel-block-locked bg-slate-950 border border-slate-800'
            }`}
          >
            <IconComponent
              className={`w-10 h-10 ${
                node.isUnlocked ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]' : 'text-slate-600'
              }`}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
              Reward Value
            </span>
            <span className="text-2xl font-extrabold text-amber-300 font-display">
              +{node.points} PTS
            </span>
            <span className="text-[11px] font-mono text-slate-400 mt-0.5">
              Status:{' '}
              {node.isUnlocked ? (
                <span className="text-emerald-400 font-bold">VERIFIED & CLAIMED</span>
              ) : isPrereqsFulfilled ? (
                <span className="text-cyan-400 font-bold">IN PROGRESS</span>
              ) : (
                <span className="text-slate-500 font-bold">LOCKED BY PREREQS</span>
              )}
            </span>
          </div>
        </div>

        {/* Description & Secret Lore Fragment */}
        <div className="p-3.5 rounded-xl bg-surface-container/60 border border-slate-800/90 flex flex-col gap-2">
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {node.description}
          </p>

          {node.secretDescription && (
            <div className="mt-1 p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">
                  Ancient Decryption Fragment
                </span>
                <span className="text-xs text-purple-200/90 italic">
                  "{node.secretDescription}"
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Prerequisites DAG Path */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Prerequisite Dependencies (DAG)
          </span>
          {node.parentIds.length === 0 ? (
            <div className="p-2 rounded-lg bg-surface-container/40 text-xs text-slate-400 font-mono">
              None — Root Genesis Milestone
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {node.parentIds.map((pId) => {
                const parent = allNodes[pId];
                if (!parent) return null;
                return (
                  <div
                    key={pId}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-container border border-slate-800 text-xs"
                  >
                    <span className="font-semibold text-slate-200">{parent.title}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        parent.isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {parent.isUnlocked ? 'COMPLETED' : 'LOCKED'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Criteria Progress Tracker */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase font-bold">Criteria Verification</span>
            <span className="font-extrabold text-white">
              {node.progress.current.toLocaleString()} / {node.progress.target.toLocaleString()}{' '}
              {node.progress.unit}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>

        {/* Milestone Claim Rewards & Cryptographic Ledger Stamp */}
        <div className="grid grid-cols-2 gap-2.5">
          {node.reward && (
            <div className="p-3 rounded-xl bg-surface-container border border-slate-800 flex flex-col">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Granted Operator Item
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white truncate">{node.reward.title}</span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-surface-container border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                HMAC Ledger Stamp
              </span>
              {node.unlockToken && (
                <button
                  onClick={handleCopyToken}
                  className="text-slate-400 hover:text-white p-0.5"
                  title="Copy Token"
                >
                  {copiedToken ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 truncate">
              <Fingerprint className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-mono text-cyan-300 font-bold truncate">
                {truncateHash(node.unlockToken)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Button
              variant={node.isUnlocked ? 'secondary' : 'primary'}
              disabled={node.isUnlocked || !isPrereqsFulfilled}
              onClick={() => onClaimReward(node.id)}
              className="flex-1 h-11 text-sm font-bold gap-2"
            >
              {node.isUnlocked ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Milestone Conquered</span>
                </>
              ) : isPrereqsFulfilled ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Claim / Authorize Unlock</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Prerequisites Incomplete</span>
                </>
              )}
            </Button>

            {node.isUnlocked && (
              <Button
                variant="outline"
                onClick={() => onPinToPlinth(node.id)}
                className="h-11 px-3 text-amber-300 border-amber-500/40 hover:bg-amber-500/10"
                title="Pin to Flex Plinth Showcase"
              >
                <Pin className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleShare}
              className="h-11 px-3 text-slate-300 hover:text-white"
              title="Share Milestone"
            >
              {shared ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
};
