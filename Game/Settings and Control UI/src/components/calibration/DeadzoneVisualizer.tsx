import React, { useState, useRef, useEffect } from 'react';
import { Crosshair, Move } from 'lucide-react';

export interface DeadzoneVisualizerProps {
  deadzone: number; // 0.0 to 0.5
  rawX: number; // -1 to 1
  rawY: number; // -1 to 1
  onSimulateStick?: (x: number, y: number) => void;
}

export const DeadzoneVisualizer: React.FC<DeadzoneVisualizerProps> = ({
  deadzone,
  rawX,
  rawY,
  onSimulateStick,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = 80; // visual radius in px
  const center = 90; // SVG viewBox center (180x180)

  // Calculate magnitude and effective position
  const magnitude = Math.hypot(rawX, rawY);
  const isInsideDeadzone = magnitude < deadzone;

  // Post-deadzone scaled vector
  let effX = 0;
  let effY = 0;
  if (!isInsideDeadzone && magnitude > 0) {
    const scaled = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
    effX = (rawX / magnitude) * scaled;
    effY = (rawY / magnitude) * scaled;
  }

  // Handle manual stick simulation via dragging
  const handlePointer = (e: React.PointerEvent) => {
    if (!containerRef.current || !onSimulateStick) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = ((clientX - rect.width / 2) / (rect.width / 2));
    const normY = ((clientY - rect.height / 2) / (rect.height / 2));

    const mag = Math.hypot(normX, normY);
    if (mag > 1) {
      onSimulateStick(normX / mag, normY / mag);
    } else {
      onSimulateStick(normX, normY);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handlePointer(e);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    onSimulateStick?.(0, 0);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[#0E1118] border border-[#1E2538] shadow-inner">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#38BDF8]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Deflection Radar
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isInsideDeadzone
              ? 'bg-amber-950/60 border-amber-600/80 text-amber-300'
              : 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300'
          }`}
        >
          {isInsideDeadzone ? 'IN DEADZONE' : 'ACTIVE DEFLECTION'}
        </span>
      </div>

      {/* SVG Circular Vector Tracking */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-[180px] h-[180px] rounded-full bg-[#08090D] border-2 border-slate-800 cursor-crosshair touch-none select-none shadow-inner flex items-center justify-center"
      >
        {/* Sweep effect */}
        <div className="absolute inset-0 rounded-full radar-sweep-effect pointer-events-none" />

        <svg viewBox="0 0 180 180" className="w-full h-full">
          {/* Axis crosshair lines */}
          <line x1="90" y1="10" x2="90" y2="170" stroke="#1E2538" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="10" y1="90" x2="170" y2="90" stroke="#1E2538" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Outer Saturation ring (radius = 80) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#283145"
            strokeWidth="1.5"
          />

          {/* Inner Deadzone Circle (radius = deadzone * radius) */}
          <circle
            cx={center}
            cy={center}
            r={deadzone * radius}
            fill="rgba(245, 158, 11, 0.08)"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Raw input vector line */}
          <line
            x1={center}
            y1={center}
            x2={center + rawX * radius}
            y2={center + rawY * radius}
            stroke="#64748B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Raw Deflection Marker */}
          <circle
            cx={center + rawX * radius}
            cy={center + rawY * radius}
            r="4"
            fill="#64748B"
          />

          {/* Effective Post-Deadzone Vector Line */}
          {!isInsideDeadzone && (
            <line
              x1={center}
              y1={center}
              x2={center + effX * radius}
              y2={center + effY * radius}
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Active Post-Deadzone Crosshair Head */}
          <circle
            cx={center + effX * radius}
            cy={center + effY * radius}
            r="6"
            fill={isInsideDeadzone ? '#F59E0B' : '#38BDF8'}
            className="filter drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
          />
        </svg>

        {/* Center pivot pip */}
        <div className="absolute w-2 h-2 rounded-full bg-slate-500 pointer-events-none" />
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
        <Move className="w-3 h-3 text-cyan-400" />
        <span>Drag radar or nudge physical stick</span>
      </div>

      {/* Telemetry coordinates */}
      <div className="grid grid-cols-3 gap-2 w-full text-center font-mono text-[11px] pt-2 border-t border-[#1E2538]">
        <div className="p-1.5 rounded bg-[#131722] border border-[#1E2538]">
          <span className="block text-[9px] text-slate-500">DEFLECTION X</span>
          <span className="font-bold text-slate-200">
            {rawX > 0 ? `+${rawX.toFixed(2)}` : rawX.toFixed(2)}
          </span>
        </div>
        <div className="p-1.5 rounded bg-[#131722] border border-[#1E2538]">
          <span className="block text-[9px] text-slate-500">DEFLECTION Y</span>
          <span className="font-bold text-slate-200">
            {rawY > 0 ? `+${rawY.toFixed(2)}` : rawY.toFixed(2)}
          </span>
        </div>
        <div className="p-1.5 rounded bg-[#131722] border border-[#1E2538]">
          <span className="block text-[9px] text-slate-500">MAGNITUDE</span>
          <span className="font-bold text-[#38BDF8]">{magnitude.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
