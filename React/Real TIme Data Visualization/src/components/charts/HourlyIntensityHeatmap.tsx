import React, { useMemo, useState } from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { MetricId } from '../../types/telemetry';

interface Props {
  metricId: MetricId;
  height?: number;
}

export const HourlyIntensityHeatmap: React.FC<Props> = ({ metricId, height = 320 }) => {
  const { theme } = useTelemetry();
  const meta = METRIC_METAS[metricId];
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; val: number } | null>(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate 7x24 intensity grid based on metric baseline diurnal curve
  const grid = useMemo(() => {
    return days.map((day, dIdx) => {
      const isWeekend = dIdx >= 5;
      const dayFactor = isWeekend ? 0.78 : 1.0;
      return hours.map((hour) => {
        // Business peak between 10 AM and 3 PM
        const diurnal = Math.sin(((hour - 4) / 24) * 2 * Math.PI);
        const base = meta.goalTarget * (0.55 + diurnal * 0.35) * dayFactor;
        const jitter = (Math.sin(hour * 13 + dIdx * 7) * 0.08) * base;
        const val = Math.max(0, base + jitter);
        const intensity = Math.min(1, Math.max(0.1, val / meta.goalTarget));
        return {
          day,
          hour,
          val,
          intensity
        };
      });
    });
  }, [days, hours, meta.goalTarget]);

  return (
    <div className="w-full flex flex-col justify-between p-4" style={{ minHeight: height }}>
      {/* Header and status */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Seasonal Hourly Density</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20">
            Typical Tuesday Peak: 2:00 PM
          </span>
        </div>
        {hoveredCell && (
          <div className="text-xs font-mono text-white animate-fade-in">
            <span className="text-slate-400">{hoveredCell.day} at {hoveredCell.hour}:00 — </span>
            <span className="font-bold text-sky-400">{meta.format(hoveredCell.val)}</span>
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="flex-1 flex flex-col justify-center py-2 space-y-1.5">
        {grid.map((row, dIdx) => (
          <div key={days[dIdx]} className="flex items-center gap-1.5">
            <span className="w-8 text-[11px] font-mono font-medium text-slate-400 text-right pr-1">
              {days[dIdx]}
            </span>
            <div className="flex-1 grid grid-cols-24 gap-1">
              {row.map((cell) => {
                const isHovered = hoveredCell?.day === cell.day && hoveredCell?.hour === cell.hour;
                const isCurrentHour = cell.day === 'Tue' && cell.hour === 10;
                return (
                  <div
                    key={cell.hour}
                    onMouseEnter={() => setHoveredCell({ day: cell.day, hour: cell.hour, val: cell.val })}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      backgroundColor: isCurrentHour
                        ? '#38BDF8'
                        : `rgba(56, 189, 248, ${cell.intensity * 0.85})`
                    }}
                    className={`h-5 rounded-sm transition-all cursor-pointer relative ${
                      isCurrentHour ? 'ring-2 ring-white ring-offset-1 ring-offset-[#11141B]' : ''
                    } ${isHovered ? 'scale-115 z-10 brightness-125' : 'hover:opacity-100'}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Hour ticks */}
      <div className="flex items-center pl-9.5 pr-1 text-[10px] font-mono text-slate-500 justify-between border-t border-white/5 pt-2">
        <span>12 AM</span>
        <span>04 AM</span>
        <span>08 AM</span>
        <span>12 PM (Peak)</span>
        <span>04 PM</span>
        <span>08 PM</span>
        <span>11 PM</span>
      </div>
    </div>
  );
};
