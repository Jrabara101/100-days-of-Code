import React from 'react';
import { CoreStatMetric } from '../../types/telemetry';
import { ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';

interface StatCardProps {
  stat: CoreStatMetric;
  onClick: () => void;
  hasEnoughData: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  stat,
  onClick,
  hasEnoughData
}) => {
  // Sparkline coordinates helper
  const sparklineSvg = () => {
    if (stat.sparkline.length < 2) return null;
    const values = stat.sparkline.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 120;
    const height = 36;
    const points = stat.sparkline.map((p, i) => {
      const x = (i / (stat.sparkline.length - 1)) * width;
      const y = height - ((p.value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = stat.isPositive ? '#10B981' : '#EF4444';
    const gradientId = `grad_${stat.id}`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={`url(#${gradientId})`}
        />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* End dot */}
        {stat.sparkline.length > 0 && (
          <circle
            cx={width}
            cy={height - ((values[values.length - 1] - min) / range) * (height - 8) - 4}
            r="3"
            fill={strokeColor}
            className="animate-pulse"
          />
        )}
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative rounded bg-[#0d1322] border border-[#1f293d] hover:border-cyan-400/50 p-4 transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(0,240,255,0.12)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400"
      aria-label={`${stat.name}: ${stat.formattedValue}. Click for calculation breakdown.`}
    >
      {/* Card Header & Diagnostic Question icon */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="font-['Space_Grotesk'] text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition">
          {stat.name}
        </span>
        <div className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] text-slate-500 group-hover:text-cyan-400 transition">
          <span className="hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
            EXPLAIN
          </span>
          <HelpCircle className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Main Metric Value (Tabular numerals) */}
      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="font-['JetBrains_Mono'] text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight tabular-nums">
          {stat.formattedValue}
        </div>

        {/* 7-Point Sparkline */}
        <div className="hidden sm:block">
          {sparklineSvg()}
        </div>
      </div>

      {/* Delta badge vs Previous Period (Truthful deltas: pair shape + color) */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1a2233] text-xs">
        {hasEnoughData ? (
          <div className="flex items-center gap-1.5 font-['JetBrains_Mono']">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                stat.isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {stat.isPositive ? (
                <>
                  <span aria-hidden="true">▲</span>
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+{Math.abs(stat.delta)}</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">▼</span>
                  <ArrowDownRight className="w-3 h-3" />
                  <span>-{Math.abs(stat.delta)}</span>
                </>
              )}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              vs last period
            </span>
          </div>
        ) : (
          <div className="font-['JetBrains_Mono'] text-[11px] text-slate-500">
            <span>Delta: </span>
            <span className="text-slate-400 italic">— (Needs ≥5 matches)</span>
          </div>
        )}

        <span className="text-[10px] font-['JetBrains_Mono'] text-slate-500">
          {stat.sessionsCount} sessions
        </span>
      </div>
    </div>
  );
};
