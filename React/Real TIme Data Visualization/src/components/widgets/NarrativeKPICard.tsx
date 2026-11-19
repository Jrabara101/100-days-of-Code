import React, { useMemo } from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { MetricId } from '../../types/telemetry';
import { generateHeadline } from '../../engine/narrative';
import { Maximize2, Minimize2, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  metricId: MetricId;
}

export const NarrativeKPICard: React.FC<Props> = ({ metricId }) => {
  const {
    getSeriesData,
    getLatestPoint,
    primaryMetricId,
    setPrimaryMetricId,
    widgetSizes,
    cycleWidgetSize,
    hoveredTimestamp
  } = useTelemetry();

  const meta = METRIC_METAS[metricId];
  const series = getSeriesData(metricId, 40);
  const latestPoint = getLatestPoint(metricId);
  const isSelected = primaryMetricId === metricId;
  const currentSize = widgetSizes[metricId] || 'standard';

  // Plain-Language takeaway
  const headline = useMemo(() => {
    return generateHeadline(metricId, latestPoint, series);
  }, [metricId, latestPoint, series]);

  // Delta vs Baseline
  const { variancePct, isPositive } = useMemo(() => {
    if (!latestPoint || !latestPoint.baseline) return { variancePct: 0, isPositive: true };
    const v = ((latestPoint.value - latestPoint.baseline) / latestPoint.baseline) * 100;
    return { variancePct: v, isPositive: v >= 0 };
  }, [latestPoint]);

  // Mini Sparkline SVG path
  const sparklineData = useMemo(() => {
    if (series.length < 2) return { path: '', area: '', band: '', min: 0, max: 100 };
    const w = 110;
    const h = 42;
    let min = Infinity;
    let max = -Infinity;

    series.forEach((d) => {
      min = Math.min(min, d.value, d.confidenceBandLow);
      max = Math.max(max, d.value, d.confidenceBandHigh);
    });

    const range = max - min || 1;
    const pts = series.map((d, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((d.value - min) / range) * (h - 6) - 3;
      return { x, y };
    });

    let p = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      p += ` L ${pts[i].x},${pts[i].y}`;
    }

    const a = `${p} L ${w},${h} L 0,${h} Z`;

    return { path: p, area: a, min, max, last: pts[pts.length - 1] };
  }, [series]);

  return (
    <div
      onClick={() => setPrimaryMetricId(metricId)}
      className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
        isSelected
          ? 'bg-[#171B24] dark:bg-[#171B24] border-sky-400/60 shadow-glow-cyan'
          : 'bg-[#11141B] dark:bg-[#11141B] border-white/[0.07] hover:border-white/20 hover:bg-[#141822]'
      } ${
        currentSize === 'compact' ? 'col-span-12 sm:col-span-6 lg:col-span-3' : 'col-span-12 sm:col-span-6 lg:col-span-3'
      }`}
    >
      {/* Top Row: Kicker & Pace Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
          {meta.kicker}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold flex items-center gap-1 ${
              isPositive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
            }`}
          >
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{isPositive ? '+' : ''}{variancePct.toFixed(1)}%</span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              cycleWidgetSize(metricId);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-opacity"
            title="Cycle Widget Size"
          >
            {currentSize === 'compact' ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Middle Row: Hero KPI Value & Micro-Sparkline */}
      <div className="flex items-end justify-between gap-3 my-1">
        <div className="space-y-0.5">
          <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white tabular-nums">
            {latestPoint ? meta.format(latestPoint.value) : '---'}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Baseline: {latestPoint ? meta.format(latestPoint.baseline) : '---'}
          </div>
        </div>

        {/* 110px x 42px Micro Sparkline */}
        <div className="w-[110px] h-[42px] relative flex-shrink-0">
          <svg width="110" height="42" className="overflow-visible">
            <defs>
              <linearGradient id={`spark-${metricId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={meta.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {sparklineData.area && <path d={sparklineData.area} fill={`url(#spark-${metricId})`} />}
            {sparklineData.path && (
              <path
                d={sparklineData.path}
                fill="none"
                stroke={meta.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {sparklineData.last && (
              <circle
                cx={sparklineData.last.x}
                cy={sparklineData.last.y}
                r="3.5"
                fill={meta.color}
                stroke="#FFFFFF"
                strokeWidth="1"
                className="animate-pulse-live"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Bottom Row: Plain-Language Micro-Takeaway */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.07] flex items-start gap-1.5 text-xs text-slate-300 leading-snug line-clamp-2">
        <Sparkles size={13} className="text-sky-400 flex-shrink-0 mt-0.5" />
        <span className="font-normal">{headline.headline}</span>
      </div>
    </div>
  );
};
