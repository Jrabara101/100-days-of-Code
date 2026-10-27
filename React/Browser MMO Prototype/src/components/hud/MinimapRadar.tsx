import React, { useState, useEffect } from 'react';
import type { MMOGameState } from '../../types/mmo.js';
import { Wifi, Compass, Users } from 'lucide-react';
import { TILE_SIZE } from '../../engine/tilemapRenderer.js';

interface MinimapRadarProps {
  state: MMOGameState;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement>;
  localPosRef: React.MutableRefObject<{ x: number; y: number }>;
}

export const MinimapRadar: React.FC<MinimapRadarProps> = ({
  state,
  minimapCanvasRef,
  localPosRef,
}) => {
  const [coords, setCoords] = useState({ x: 1200, y: 1344, tileX: 25, tileY: 28 });

  // Update telemetry readout periodically (5Hz / 200ms) without triggering 60fps churn
  useEffect(() => {
    const timer = setInterval(() => {
      const curX = Math.round(localPosRef.current.x);
      const curY = Math.round(localPosRef.current.y);
      setCoords({
        x: curX,
        y: curY,
        tileX: Math.floor(curX / TILE_SIZE),
        tileY: Math.floor(curY / TILE_SIZE),
      });
    }, 200);

    return () => clearInterval(timer);
  }, [localPosRef]);

  const playerCount = Object.keys(state.players).length;

  // Ping status color
  const pingColor =
    state.pingMs < 60 ? 'text-emerald-400' : state.pingMs < 130 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1.5 select-none">
      {/* 2D Minimap Canvas Frame */}
      <div className="relative p-1.5 rounded-2xl bg-[#0B0F19]/85 backdrop-blur-md border border-slate-700/60 shadow-2xl overflow-hidden">
        <canvas
          ref={minimapCanvasRef}
          width={140}
          height={140}
          className="rounded-xl border border-slate-800/80 block"
        />

        {/* Compass Cardinal Heading Overlay */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-amber-400/90 drop-shadow">
          N
        </div>
      </div>

      {/* Cartography & Network Telemetry Pill */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0B0F19]/85 backdrop-blur-md border border-slate-700/60 shadow text-[11px] font-mono text-slate-300">
        {/* Coordinates */}
        <div className="flex items-center gap-1">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>
            {coords.tileX}, {coords.tileY}
          </span>
        </div>

        <span className="text-slate-600">|</span>

        {/* Players Online */}
        <div className="flex items-center gap-1 text-slate-300">
          <Users className="w-3 h-3 text-amber-400" />
          <span>{playerCount}</span>
        </div>

        <span className="text-slate-600">|</span>

        {/* Ping Indicator */}
        <div className="flex items-center gap-1 font-semibold">
          <Wifi className={`w-3 h-3 ${pingColor}`} />
          <span className={pingColor}>{state.pingMs}ms</span>
        </div>
      </div>
    </div>
  );
};
