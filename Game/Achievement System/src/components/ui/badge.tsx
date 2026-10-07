import * as React from 'react';
import { cn } from '../../lib/utils';
import { BlockTier, BlockBiome } from '../../types/achievement';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'tier' | 'biome' | 'outline' | 'secondary';
  tier?: BlockTier;
  biome?: BlockBiome;
}

export function Badge({
  className,
  variant = 'default',
  tier,
  biome,
  children,
  ...props
}: BadgeProps) {
  let tierStyle = '';
  if (tier) {
    switch (tier) {
      case 'common':
        tierStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        break;
      case 'uncommon':
        tierStyle = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
        break;
      case 'rare':
        tierStyle = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
        break;
      case 'epic':
        tierStyle = 'bg-pink-500/15 text-pink-400 border-pink-500/30';
        break;
      case 'legendary':
        tierStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
        break;
    }
  }

  let biomeStyle = '';
  if (biome) {
    switch (biome) {
      case 'overworld':
        biomeStyle = 'bg-green-500/10 text-green-300 border-green-500/25';
        break;
      case 'nether':
        biomeStyle = 'bg-orange-500/10 text-orange-300 border-orange-500/25';
        break;
      case 'crystal_depths':
        biomeStyle = 'bg-purple-500/10 text-purple-300 border-purple-500/25';
        break;
      case 'celestial':
        biomeStyle = 'bg-yellow-500/10 text-yellow-300 border-yellow-500/25';
        break;
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors font-mono',
        variant === 'default' && 'border-slate-700 bg-surface-high text-slate-200',
        variant === 'secondary' && 'border-slate-800 bg-surface-container text-slate-400',
        variant === 'outline' && 'border-slate-700 text-slate-300',
        tierStyle,
        biomeStyle,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
