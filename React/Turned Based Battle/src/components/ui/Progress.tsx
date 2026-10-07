import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'health' | 'energy' | 'stagger' | 'heat' | 'shield';
  showLabel?: boolean;
  label?: string;
  segments?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'health',
  showLabel = false,
  label,
  segments,
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantStyles = {
    health:
      'bg-gradient-to-r from-emerald-500 via-emerald-400 to-solar-gold shadow-[0_0_12px_rgba(16,185,129,0.7)]',
    energy:
      'bg-gradient-to-r from-cooling-cyan via-sky-400 to-solar-gold shadow-[0_0_12px_rgba(56,189,248,0.7)]',
    stagger:
      percentage >= 99
        ? 'bg-gradient-to-r from-crimson-heat via-red-500 to-amber-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.9)]'
        : 'bg-gradient-to-r from-amber-600 via-ember-orange to-solar-gold shadow-[0_0_10px_rgba(249,115,22,0.6)]',
    heat:
      'bg-gradient-to-r from-ember-core via-ember-orange to-crimson-heat shadow-[0_0_12px_rgba(249,115,22,0.8)]',
    shield:
      'bg-gradient-to-r from-blue-500 to-cooling-cyan shadow-[0_0_10px_rgba(56,189,248,0.8)]',
  };

  return (
    <div className={cn('w-full flex flex-col gap-1', className)} {...props}>
      {showLabel && (
        <div className="flex items-center justify-between font-mono text-[11px] tracking-wider text-text-muted">
          <span>{label}</span>
          <span className="font-bold text-text-primary">
            {Math.round(value)} / {max}
          </span>
        </div>
      )}
      <div className="relative w-full h-3 bg-magma-950 rounded-sm overflow-hidden border border-magma-700/80 p-0.5">
        {/* Glow fill */}
        <div
          className={cn('h-full rounded-sm transition-all duration-300 ease-out', variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />

        {/* Segmented pips overlay if specified */}
        {segments && segments > 1 && (
          <div className="absolute inset-0 flex pointer-events-none">
            {Array.from({ length: segments }).map((_, idx) => (
              <div
                key={idx}
                className="flex-1 border-r border-magma-950/70 last:border-r-0"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
