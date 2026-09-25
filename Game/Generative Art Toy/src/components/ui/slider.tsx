import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  className
}: SliderProps) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70 font-medium tracking-wide">{label}</span>
        <span className="font-mono text-[11px] text-white/90 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
          {typeof value === 'number' && step < 1 ? value.toFixed(step < 0.01 ? 3 : 2) : value}
          {unit}
        </span>
      </div>
      <div className="relative flex items-center h-4 group cursor-pointer">
        {/* Track background */}
        <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm relative">
          {/* Active fill */}
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Real HTML input over track */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {/* Thumb */}
        <div
          className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)] pointer-events-none transition-transform group-hover:scale-125"
          style={{ left: `calc(${percentage}% - 7px)` }}
        />
      </div>
    </div>
  );
}
