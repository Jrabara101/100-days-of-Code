import React from 'react';

interface DualProgressRingProps {
  watchedPercent: number; // 0 - 100
  retentionPercent: number; // 0 - 100
  size?: number; // width/height in px
  strokeWidth?: number;
  label?: string;
}

export const DualProgressRing: React.FC<DualProgressRingProps> = ({
  watchedPercent,
  retentionPercent,
  size = 56,
  strokeWidth = 4,
  label
}) => {
  const center = size / 2;
  const outerRadius = center - strokeWidth;
  const innerRadius = center - strokeWidth * 2.5;

  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const outerOffset = outerCircumference - (Math.min(100, Math.max(0, watchedPercent)) / 100) * outerCircumference;
  const innerOffset = innerCircumference - (Math.min(100, Math.max(0, retentionPercent)) / 100) * innerCircumference;

  // Retention color: Emerald if >= 85, Amber if 65-84, Crimson if < 65
  const retentionColor = retentionPercent >= 85 
    ? '#10B981' 
    : retentionPercent >= 65 
      ? '#F59E0B' 
      : '#EF4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Outer Background Track */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-black/10 dark:text-white/10"
        />
        {/* Outer Watched Ring (Indigo) */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="transparent"
          stroke="#6366F1"
          strokeWidth={strokeWidth}
          strokeDasharray={outerCircumference}
          strokeDashoffset={outerOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Inner Background Track */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-black/10 dark:text-white/10"
        />
        {/* Inner Retention Ring (Emerald / Amber) */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="transparent"
          stroke={retentionColor}
          strokeWidth={strokeWidth}
          strokeDasharray={innerCircumference}
          strokeDashoffset={innerOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center percentage label if provided */}
      {label && (
        <span className="absolute text-[10px] font-mono font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {label}
        </span>
      )}
    </div>
  );
};

