import React from 'react';
import type { TelemetryData } from '../engine/types';
import { Activity, X, Database, RefreshCw, Cpu, Layers, Bot } from 'lucide-react';

interface TelemetryDrawerProps {
  telemetry: TelemetryData;
  onClose: () => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  telemetry,
  onClose,
}) => {
  const totalCells = telemetry.gridWidth * telemetry.gridHeight;
  const memoryBytes = totalCells; // 1 byte per Uint8Array element

  return (
    <div className="w-full bg-[#121316] text-[#00ff66] brutal-border p-4 brutal-shadow font-mono-code text-xs mb-4 animate-in slide-in-from-top-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00ff66]/30 pb-2 mb-3">
        <div className="flex items-center gap-2 font-display text-sm text-[#ffea00]">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>STAFF SYSTEMS ARCHITECT // TELEMETRY & AI DECISION PIPELINE</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-[#ff0033] p-1 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* 1. Rendering Pipeline */}
        <div className="bg-black/60 p-2.5 brutal-border-2 border-[#00ff66]/40 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#ffea00] font-bold text-[11px]">
            <Cpu className="w-3.5 h-3.5" />
            <span>RENDER PIPELINE</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/70">FPS:</span>
            <span className="font-bold text-white">{telemetry.fps} Hz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Sub-Pixel α:</span>
            <span className="font-bold text-[#00f0ff]">{telemetry.alpha.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Particles:</span>
            <span className="font-bold text-white">{telemetry.particlesCount}</span>
          </div>
        </div>

        {/* 2. Simulation Grid Engine */}
        <div className="bg-black/60 p-2.5 brutal-border-2 border-[#00ff66]/40 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#ffea00] font-bold text-[11px]">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>FIXED TIMESTEP</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/70">Tick Rate:</span>
            <span className="font-bold text-white">{telemetry.tickHz} Hz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Δt Interval:</span>
            <span className="font-bold text-white">{telemetry.tickMs} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Accumulator:</span>
            <span className="font-bold text-white">{telemetry.accumulatorMs} ms</span>
          </div>
        </div>

        {/* 3. 1D Flat Collision Matrix */}
        <div className="bg-black/60 p-2.5 brutal-border-2 border-[#00ff66]/40 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#ffea00] font-bold text-[11px]">
            <Database className="w-3.5 h-3.5" />
            <span>1D SPATIAL MATRIX</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/70">Memory:</span>
            <span className="font-bold text-white">{memoryBytes} Bytes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Grid:</span>
            <span className="font-bold text-white">
              {telemetry.gridWidth} × {telemetry.gridHeight}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Occupancy:</span>
            <span className="font-bold text-[#ffea00]">{telemetry.matrixOccupancy}%</span>
          </div>
        </div>

        {/* 4. AI Decision Engine */}
        <div className="bg-black/60 p-2.5 brutal-border-2 border-[#00ff66]/40 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#ffea00] font-bold text-[11px]">
            <Bot className="w-3.5 h-3.5" />
            <span>AI ENGINE</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/70">Difficulty:</span>
            <span className="font-bold text-[#bd00ff]">{telemetry.aiDifficulty}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Mode:</span>
            <span className="font-bold text-white">{telemetry.opponentMode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Compute:</span>
            <span className="font-bold text-[#00f0ff]">{telemetry.aiDecisionTimeMs || 0.05} ms</span>
          </div>
        </div>

        {/* 5. Game State */}
        <div className="bg-black/60 p-2.5 brutal-border-2 border-[#00ff66]/40 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[#ffea00] font-bold text-[11px]">
            <Layers className="w-3.5 h-3.5" />
            <span>GAME STATE</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/70">Combo:</span>
            <span className="font-bold text-[#00ff66]">x{telemetry.combo.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">Buffs:</span>
            <span className="font-bold text-white">
              {telemetry.ghostTimer > 0
                ? `Ghost (${telemetry.ghostTimer}s)`
                : telemetry.freezeTimer > 0
                ? `Freeze (${telemetry.freezeTimer}s)`
                : 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/70">FIFO Queues:</span>
            <span className="font-bold text-[#00f0ff]">Cap: 2 (O(1))</span>
          </div>
        </div>
      </div>
    </div>
  );
};
