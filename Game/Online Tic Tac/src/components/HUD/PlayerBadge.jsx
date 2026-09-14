import React from 'react';
import { Cpu, User, ShieldCheck } from 'lucide-react';

export const PlayerBadge = ({
  role = 'X',
  label = 'Player 1',
  score = 0,
  isActive = false,
  isAI = false,
  mask = 0,
  peerConnected = false,
}) => {
  const isX = role === 'X';

  const binaryString = mask.toString(2).padStart(9, '0');

  return (
    <div
      className={`relative transition-all duration-300 rounded-2xl p-3.5 sm:p-4 glass-panel ${
        isActive
          ? isX
            ? 'glass-panel-glow-cyan scale-[1.03]'
            : 'glass-panel-glow-magenta scale-[1.03]'
          : 'opacity-85 hover:opacity-100'
      }`}
    >
      {/* Active turn ambient pulse ring */}
      {isActive && (
        <div
          className={`absolute -inset-0.5 rounded-2xl blur-md opacity-40 animate-pulse pointer-events-none ${
            isX ? 'bg-cyan-400' : 'bg-pink-500'
          }`}
        />
      )}

      <div className="relative flex items-center justify-between gap-3 sm:gap-5">
        {/* Role Icon & Identity */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-orbitron font-extrabold text-xl sm:text-2xl shadow-lg border ${
              isX
                ? 'bg-cyan-950/70 border-cyan-400/60 text-neon-cyan shadow-cyan-900/40'
                : 'bg-pink-950/70 border-pink-400/60 text-neon-magenta shadow-pink-900/40'
            }`}
          >
            {role}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-space font-bold text-sm sm:text-base text-slate-100 tracking-wide">
                {label}
              </span>
              {isAI ? (
                <span className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/30">
                  <Cpu className="w-2.5 h-2.5" /> AI
                </span>
              ) : peerConnected ? (
                <span className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-2.5 h-2.5" /> PEER
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  <User className="w-2.5 h-2.5" /> LOCAL
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-slate-400">
                Bitboard: <span className={isX ? 'text-cyan-400' : 'text-pink-400'}>{binaryString}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Score Counter */}
        <div className="text-right pl-2 border-l border-white/10">
          <div className="text-[10px] font-space tracking-wider uppercase text-slate-400">Wins</div>
          <div className="font-orbitron text-xl sm:text-2xl font-bold text-slate-100">{score}</div>
        </div>
      </div>
    </div>
  );
};
