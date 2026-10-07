import React, { useRef } from 'react';
import { CockpitHUD } from './hud/CockpitHUD';
import { SpaceShooterState } from '../types/game';

interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  gameState: SpaceShooterState;
  onDash: () => void;
  onEMP: () => void;
}

export function GameCanvas({ canvasRef, gameState, onDash, onEMP }: GameCanvasProps) {
  return (
    <div className="relative w-full aspect-[16/9] min-h-[580px] max-h-[880px] bg-surface-container-lowest flex flex-col justify-between overflow-hidden shadow-2xl rounded-xl border border-outline-variant/40">
      {/* HTML5 2D Canvas Game Arena */}
      <canvas
        ref={canvasRef as any}
        className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none"
      />

      {/* Peripheral HUD Tactical Pitch Indicators (Decorative Avionics) */}
      <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
        {/* Left Peripheral Pitch Ladder */}
        <div className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 flex-col items-end gap-5 opacity-30 font-mono text-[10px] text-primary select-none">
          <div className="flex items-center gap-1.5">
            <span>+30°</span>
            <div className="w-6 h-0.5 bg-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            <span>+15°</span>
            <div className="w-10 h-0.5 bg-primary" />
          </div>
          <div className="flex items-center gap-1.5 text-secondary font-bold">
            <span>-- 00° --</span>
            <div className="w-14 h-1 bg-secondary" />
          </div>
          <div className="flex items-center gap-1.5">
            <span>-15°</span>
            <div className="w-10 h-0.5 bg-primary" />
          </div>
          <div className="flex items-center gap-1.5">
            <span>-30°</span>
            <div className="w-6 h-0.5 bg-primary" />
          </div>
        </div>

        {/* Right Peripheral Attitude Indicators */}
        <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col items-start gap-5 opacity-30 font-mono text-[10px] text-primary select-none">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-primary" />
            <span>MACH 4.8</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-0.5 bg-primary" />
            <span>ALT 21.4K</span>
          </div>
          <div className="flex items-center gap-1.5 text-secondary font-bold">
            <div className="w-14 h-1 bg-secondary" />
            <span>ORBITAL V</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-0.5 bg-primary" />
            <span>RADAR: 360°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-primary" />
            <span>FLAPS: AUTO</span>
          </div>
        </div>
      </div>

      {/* Glassmorphic Cockpit HUD Overlay positioned above canvas */}
      <CockpitHUD
        state={gameState}
        onDash={onDash}
        onEMP={onEMP}
      />
    </div>
  );
}
