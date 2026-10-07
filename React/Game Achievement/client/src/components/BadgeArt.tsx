import React from 'react';
import { BadgeTier } from '../types/achievement';
import { Lock, Sparkles, Shield, Compass, Cpu, EyeOff, Award, Flame } from 'lucide-react';

interface BadgeArtProps {
  tier: BadgeTier;
  category: string;
  isUnlocked: boolean;
  isSecret?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BadgeArt: React.FC<BadgeArtProps> = ({
  tier,
  category,
  isUnlocked,
  isSecret = false,
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  const iconSizeMap = {
    sm: 16,
    md: 22,
    lg: 32,
    xl: 52
  };

  const getTierGradients = () => {
    switch (tier) {
      case 'bronze':
        return {
          border: 'border-amber-700/80',
          bg: 'from-amber-950/80 via-amber-900/40 to-slate-950',
          glow: 'shadow-[0_0_12px_rgba(217,119,6,0.3)]',
          iconColor: 'text-amber-400',
          strokeColor: '#D97706'
        };
      case 'silver':
        return {
          border: 'border-slate-500/80',
          bg: 'from-slate-700/80 via-slate-800/40 to-slate-950',
          glow: 'shadow-[0_0_15px_rgba(148,163,184,0.35)]',
          iconColor: 'text-slate-200',
          strokeColor: '#CBD5E1'
        };
      case 'gold':
        return {
          border: 'border-amber-400',
          bg: 'from-amber-500/40 via-yellow-700/30 to-slate-950',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]',
          iconColor: 'text-amber-300',
          strokeColor: '#F59E0B'
        };
      case 'prismatic':
        return {
          border: 'border-purple-400/90',
          bg: 'from-purple-900/70 via-indigo-950/50 to-slate-950',
          glow: 'shadow-[0_0_25px_rgba(168,85,247,0.6)] animate-pulse-glow',
          iconColor: 'text-fuchsia-300',
          strokeColor: '#A855F7'
        };
      default:
        return {
          border: 'border-slate-800',
          bg: 'from-slate-900 to-slate-950',
          glow: '',
          iconColor: 'text-slate-500',
          strokeColor: '#64748B'
        };
    }
  };

  const style = getTierGradients();

  const getCategoryIcon = () => {
    if (isSecret && !isUnlocked) {
      return <Lock size={iconSizeMap[size]} className="text-slate-400 animate-pulse" />;
    }
    switch (category) {
      case 'combat':
        return <Flame size={iconSizeMap[size]} className={style.iconColor} />;
      case 'exploration':
        return <Compass size={iconSizeMap[size]} className={style.iconColor} />;
      case 'mastery':
        return <Cpu size={iconSizeMap[size]} className={style.iconColor} />;
      case 'secrets':
        return <Sparkles size={iconSizeMap[size]} className={style.iconColor} />;
      default:
        return <Award size={iconSizeMap[size]} className={style.iconColor} />;
    }
  };

  return (
    <div
      className={`relative rounded-2xl flex items-center justify-center p-0.5 border ${
        isUnlocked ? style.border : 'border-slate-800'
      } ${isUnlocked ? style.glow : ''} ${sizeMap[size]} ${className}`}
    >
      {/* Background Crest Plate */}
      <div
        className={`w-full h-full rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br ${
          isUnlocked ? style.bg : 'from-slate-900/90 to-slate-950'
        } backdrop-blur-md relative`}
      >
        {/* Subtle grid mesh circuit */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none" />

        {/* Tier holographic shimmer line for Prismatic */}
        {tier === 'prismatic' && isUnlocked && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent -translate-x-full animate-[shimmerSweep_3s_infinite]" />
        )}

        {/* Outer crest SVG framing */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        >
          <polygon
            points="50,4 96,25 96,75 50,96 4,75 4,25"
            fill="none"
            stroke={isUnlocked ? style.strokeColor : '#334155'}
            strokeWidth="2.5"
            strokeDasharray={tier === 'prismatic' ? '4 2' : 'none'}
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={isUnlocked ? style.strokeColor : '#1e293b'}
            strokeWidth="1"
            opacity="0.6"
          />
        </svg>

        {/* Center Icon */}
        <div className="relative z-10 filter drop-shadow-md">
          {getCategoryIcon()}
        </div>

        {/* Locked state greyed overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
            {isSecret ? (
              <EyeOff size={iconSizeMap[size] * 0.75} className="text-slate-500/70" />
            ) : null}
          </div>
        )}
      </div>

      {/* Radiant crown particle for top-tier Prismatic */}
      {tier === 'prismatic' && isUnlocked && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
        </span>
      )}
    </div>
  );
};
