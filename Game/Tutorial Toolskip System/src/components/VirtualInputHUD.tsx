import React from 'react';
import { INPUT_MASK, PlayerInputPacket } from '../types/replay';
import { Crosshair, Zap, Shield, Move } from 'lucide-react';

interface VirtualInputHUDProps {
  input: PlayerInputPacket | null;
}

export const VirtualInputHUD: React.FC<VirtualInputHUDProps> = ({ input }) => {
  const keys = input ? input.keys : 0;
  const cursor = input ? input.cursor : { x: 0, y: 0 };

  const isUp = !!(keys & INPUT_MASK.UP);
  const isDown = !!(keys & INPUT_MASK.DOWN);
  const isLeft = !!(keys & INPUT_MASK.LEFT);
  const isRight = !!(keys & INPUT_MASK.RIGHT);
  const isFire = !!(keys & INPUT_MASK.FIRE);
  const isAbility = !!(keys & INPUT_MASK.ABILITY);
  const isDash = !!(keys & INPUT_MASK.DASH);

  return (
    <div className="absolute bottom-4 left-4 p-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-2xl flex flex-col gap-2 z-20 pointer-events-none select-none">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1">
        <span className="flex items-center gap-1 text-cyan-400 font-bold">
          <Move className="w-3 h-3" /> INPUT TELEMETRY
        </span>
        <span className="text-slate-500">
          X: {String(cursor.x).padStart(4, '0')} Y: {String(cursor.y).padStart(4, '0')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* WASD Cluster */}
        <div className="flex flex-col items-center gap-1">
          {/* W Key */}
          <div
            className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs border transition-colors ${
              isUp
                ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            W
          </div>

          <div className="flex items-center gap-1">
            {/* A Key */}
            <div
              className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs border transition-colors ${
                isLeft
                  ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              A
            </div>
            {/* S Key */}
            <div
              className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs border transition-colors ${
                isDown
                  ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              S
            </div>
            {/* D Key */}
            <div
              className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs border transition-colors ${
                isRight
                  ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              D
            </div>
          </div>
        </div>

        {/* Action Buttons: Fire, Ability, Dash */}
        <div className="flex flex-col gap-1.5 pl-2 border-l border-slate-800">
          {/* Fire */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
              isFire
                ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>M1 FIRE</span>
          </div>

          {/* EMP Ability */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
              isAbility
                ? 'bg-purple-500 border-purple-300 text-slate-950 shadow-[0_0_8px_rgba(139,92,246,0.8)]'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>M2 EMP</span>
          </div>

          {/* Dash */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
              isDash
                ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>DASH</span>
          </div>
        </div>
      </div>
    </div>
  );
};
