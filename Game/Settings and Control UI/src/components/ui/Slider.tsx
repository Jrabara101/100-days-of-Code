import React from 'react';
import { clsx } from 'clsx';
import { soundEngine } from '@/services/audioService';

export interface SliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  altered?: boolean;
  onResetDefault?: () => void;
  onChange: (val: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  altered = false,
  onResetDefault,
  onChange,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    onChange(newVal);
    soundEngine.playHoverTick();
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#131722]/80 border border-[#1E2538] hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {altered && (
            <span
              title="Parameter altered from default"
              className="inline-block w-2 h-2 rounded-full bg-[#10B981] shadow-glow-emerald animate-pulse"
            />
          )}
          <span className="text-sm font-semibold text-[#F8FAFC] tracking-wide">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-0.5 rounded bg-[#1C2232] border border-[#1E2538] font-mono text-xs font-bold text-[#38BDF8]">
            {step < 1 ? value.toFixed(2) : value}
            {suffix}
          </div>
          {altered && onResetDefault && (
            <button
              onClick={onResetDefault}
              title="Reset parameter to default"
              className="text-[11px] font-mono text-slate-400 hover:text-amber-400 transition-colors px-1.5 py-0.5 rounded hover:bg-[#1E2538]"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {description && <p className="text-xs text-[#64748B] leading-relaxed">{description}</p>}

      <div className="relative flex items-center w-full py-1">
        <div className="absolute w-full h-1.5 bg-[#0C0E14] rounded-full overflow-hidden border border-[#1E2538]">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-[#38BDF8] rounded-full transition-all duration-75"
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="relative z-10 w-full h-4 opacity-0 cursor-pointer"
        />
        {/* Thumb vector marker */}
        <div
          className="absolute z-20 w-3.5 h-3.5 bg-[#F8FAFC] border-2 border-[#38BDF8] rounded-full shadow-glow-cyan pointer-events-none transition-transform active:scale-125"
          style={{
            left: `calc(${percentage}% - 7px)`,
          }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
        <span>{min}{suffix}</span>
        <span>{((min + max) / 2).toFixed(step < 1 ? 1 : 0)}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
};
