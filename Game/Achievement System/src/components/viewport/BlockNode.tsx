import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { AchievementNode, BlockTier } from '../../types/achievement';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/tooltip';

interface BlockNodeProps {
  node: AchievementNode;
  isSelected: boolean;
  isParentsUnlocked: boolean;
  onSelect: (nodeId: string) => void;
  onHover?: () => void;
}

export const BlockNode: React.FC<BlockNodeProps> = ({
  node,
  isSelected,
  isParentsUnlocked,
  onSelect,
  onHover,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine Visual State: 'unlocked' | 'in-progress' | 'locked' | 'secret'
  let visualState: 'unlocked' | 'in-progress' | 'locked' | 'secret' = 'locked';
  if (node.isUnlocked) {
    visualState = 'unlocked';
  } else if (node.isSecret && !isParentsUnlocked) {
    visualState = 'secret';
  } else if (node.progress.current > 0 || isParentsUnlocked) {
    visualState = 'in-progress';
  }

  // Tier Colors
  const tierColorMap: Record<BlockTier, string> = {
    common: '#10b981', // Emerald
    uncommon: '#06b6d4', // Cyan
    rare: '#8b5cf6', // Violet
    epic: '#ec4899', // Pink
    legendary: '#f59e0b', // Amber/Gold
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, (node.progress.current / node.progress.target) * 100)
  );

  // Dynamic Lucide Icon
  const IconComponent = (Icons as any)[node.icon] || Icons.CircleDot;

  // Mystery Geode sharpening effect
  const isSecretRiddle = node.isSecret && !node.isUnlocked;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${node.gridCoordinates.x}px`,
        top: `${node.gridCoordinates.y}px`,
        width: '64px',
        height: '64px',
      }}
      className="z-10 select-none"
    >
      <Tooltip
        content={
          <div className="flex flex-col gap-1 p-1 max-w-[240px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-white text-xs truncate">
                {isSecretRiddle && !isParentsUnlocked ? '??? [Cracked Mystery Geode]' : node.title}
              </span>
              <span
                className="text-[10px] font-mono px-1 rounded font-bold uppercase"
                style={{ color: tierColorMap[node.tier] }}
              >
                {node.tier}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {isSecretRiddle && !isParentsUnlocked
                ? 'Cryptic obsidian vibrations resonate. Satisfy prerequisite milestones to decrypt this riddle block.'
                : node.description}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
              <span>
                {node.isUnlocked
                  ? 'CLAIMED'
                  : `${node.progress.current} / ${node.progress.target} ${node.progress.unit}`}
              </span>
              <span className="text-amber-400 font-bold">+{node.points} PTS</span>
            </div>
          </div>
        }
      >
        <button
          onClick={() => {
            onSelect(node.id);
          }}
          onMouseEnter={() => {
            setIsHovered(true);
            onHover?.();
          }}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'relative w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-200 outline-none',
            visualState === 'unlocked' &&
              'voxel-block animate-block-bob hover:scale-110 cursor-pointer shadow-lg',
            visualState === 'in-progress' &&
              'voxel-block hover:scale-105 cursor-pointer bg-slate-900 border border-slate-700/80',
            visualState === 'locked' &&
              'voxel-block-locked opacity-70 hover:opacity-90 cursor-pointer bg-[#12161f] border border-slate-800',
            visualState === 'secret' &&
              'voxel-block cursor-pointer bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950 border border-purple-900/60 hover:scale-105',
            isSelected && 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-110 z-20'
          )}
          style={{
            borderColor: isSelected
              ? '#38bdf8'
              : visualState === 'unlocked'
              ? tierColorMap[node.tier]
              : undefined,
          }}
        >
          {/* Radial Progress Border for In-Progress State */}
          {visualState === 'in-progress' && (
            <svg
              className="absolute inset-0 w-16 h-16 -rotate-90 pointer-events-none"
              viewBox="0 0 64 64"
            >
              {/* Background circle track */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(51, 65, 85, 0.5)"
                strokeWidth="3"
              />
              {/* Radial progress stroke */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={tierColorMap[node.tier]}
                strokeWidth="3"
                strokeDasharray="175.9"
                strokeDashoffset={175.9 - (175.9 * progressPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
          )}

          {/* Biome Thematic Background Textures */}
          {visualState === 'unlocked' && (
            <div
              className="absolute inset-0 rounded-xl opacity-25 pointer-events-none"
              style={{
                backgroundColor: tierColorMap[node.tier],
                boxShadow: `inset 0 0 15px ${tierColorMap[node.tier]}`,
              }}
            />
          )}

          {/* Mystery Geode Shrouded Overlay (Animated runes/glyphs) */}
          {visualState === 'secret' && (
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/30 via-transparent to-black" />
              <div className="absolute inset-0 flex items-center justify-center opacity-40 font-mono text-[9px] text-pink-300 tracking-tighter select-none">
                ✦ ⬡ ✧
              </div>
            </div>
          )}

          {/* Central Icon Rendering */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {visualState === 'secret' ? (
              <Icons.HelpCircle className="w-7 h-7 text-purple-400 animate-glyph-pulse" />
            ) : visualState === 'unlocked' ? (
              <IconComponent
                className="w-7 h-7 drop-shadow-md transition-transform duration-200"
                style={{
                  color: '#ffffff',
                  filter: `drop-shadow(0 0 8px ${tierColorMap[node.tier]})`,
                }}
              />
            ) : visualState === 'in-progress' ? (
              <IconComponent className="w-6 h-6 text-slate-300" />
            ) : (
              <Icons.Lock className="w-5 h-5 text-slate-600" />
            )}
          </div>

          {/* Points Pill Tag on Bottom */}
          <div
            className={cn(
              'absolute -bottom-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold tracking-tight shadow-md border',
              visualState === 'unlocked'
                ? 'bg-slate-900 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            )}
          >
            {node.points}
          </div>

          {/* Subtle Corner Biome Dot */}
          <div
            className={cn(
              'absolute top-1 right-1 w-2 h-2 rounded-full',
              node.biome === 'overworld' && 'bg-emerald-400',
              node.biome === 'nether' && 'bg-orange-500',
              node.biome === 'crystal_depths' && 'bg-purple-400',
              node.biome === 'celestial' && 'bg-yellow-400'
            )}
          />
        </button>
      </Tooltip>

      {/* Label Underneath Node */}
      <div
        className="absolute top-18 left-1/2 -translate-x-1/2 w-32 text-center pointer-events-none transition-opacity duration-200"
        style={{ top: '68px' }}
      >
        <span
          className={cn(
            'text-[11px] font-semibold tracking-tight truncate block',
            visualState === 'unlocked' ? 'text-slate-100 font-bold' : 'text-slate-400',
            visualState === 'secret' && 'text-purple-300 italic'
          )}
        >
          {visualState === 'secret' ? '??? Geode' : node.title}
        </span>
      </div>
    </div>
  );
};
