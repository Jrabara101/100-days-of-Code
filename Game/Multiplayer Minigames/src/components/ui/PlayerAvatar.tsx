import React from 'react';
import { Shield, Zap } from 'lucide-react';
import { type PlayerRole } from '../../lib/network';
import { cn } from '../../lib/utils';

interface PlayerAvatarProps {
  role: PlayerRole;
  name: string;
  score: number;
  isReady?: boolean;
  isCurrentPlayer?: boolean;
  isOnline?: boolean;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  role,
  name,
  score,
  isReady = false,
  isCurrentPlayer = false,
  isOnline = true,
  className,
}) => {
  const isP1 = role === 'P1';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border backdrop-blur-md transition-all',
        isP1
          ? 'border-[#58A6FF]/40 bg-[#58A6FF]/5 shadow-[0_0_15px_rgba(88,166,255,0.12)]'
          : 'border-[#D29922]/40 bg-[#D29922]/5 shadow-[0_0_15px_rgba(210,153,34,0.12)]',
        isCurrentPlayer && 'ring-2 ring-offset-2 ring-offset-[#0D1117]',
        isCurrentPlayer && (isP1 ? 'ring-[#58A6FF]' : 'ring-[#D29922]'),
        className
      )}
    >
      {/* Hexagonal / Circular Avatar Frame */}
      <div className="relative">
        <div
          className={cn(
            'w-11 h-11 rounded-lg flex items-center justify-center border font-mono font-black text-sm shadow-inner',
            isP1
              ? 'border-[#58A6FF] bg-[#58A6FF]/20 text-[#58A6FF] shadow-[0_0_10px_#58A6FF]'
              : 'border-[#D29922] bg-[#D29922]/20 text-[#D29922] shadow-[0_0_10px_#D29922]'
          )}
        >
          {isP1 ? <Zap className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
        </div>

        {/* Live Indicator Dot */}
        <span
          className={cn(
            'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0D1117]',
            isOnline ? (isP1 ? 'bg-[#58A6FF]' : 'bg-[#D29922]') : 'bg-slate-600'
          )}
        />
      </div>

      {/* Info Block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-xs font-black tracking-wider uppercase truncate',
              isP1 ? 'text-[#58A6FF]' : 'text-[#D29922]'
            )}
          >
            {name}
          </span>
          {isCurrentPlayer && (
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
              YOU
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="text-[11px] font-mono text-slate-400">
            SCORE: <span className="font-bold text-white">{score}</span>
          </div>

          <span
            className={cn(
              'text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border',
              isReady
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 bg-slate-800/60 text-slate-400'
            )}
          >
            {isReady ? 'READY' : 'STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
};
