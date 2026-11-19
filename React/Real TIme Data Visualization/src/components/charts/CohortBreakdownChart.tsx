import React, { useMemo } from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { MetricId } from '../../types/telemetry';

interface Props {
  metricId: MetricId;
  height?: number;
}

export const CohortBreakdownChart: React.FC<Props> = ({ metricId, height = 320 }) => {
  const { getSeriesData } = useTelemetry();
  const rawData = getSeriesData(metricId, 60);
  const meta = METRIC_METAS[metricId];

  // Cohort breakdown metrics
  const cohorts = useMemo(() => [
    { key: 'mobile', name: 'Mobile (iOS & Android)', color: '#38BDF8', share: '58%' },
    { key: 'desktop', name: 'Desktop Web App', color: '#A855F7', share: '34%' },
    { key: 'tablet', name: 'Tablet & POS Terminals', color: '#2DD4BF', share: '8%' }
  ], []);

  // Compute normalized bars
  const bars = useMemo(() => {
    return rawData.slice(-24).map((pt) => {
      const b = pt.breakdown || {
        mobile: pt.value * 0.58,
        desktop: pt.value * 0.34,
        tablet: pt.value * 0.08
      };
      const total = b.mobile + b.desktop + b.tablet || 1;
      return {
        timestamp: pt.timestamp,
        timeLabel: pt.timeLabel,
        mobilePct: (b.mobile / total) * 100,
        desktopPct: (b.desktop / total) * 100,
        tabletPct: (b.tablet / total) * 100,
        totalVal: pt.value
      };
    });
  }, [rawData]);

  return (
    <div className="w-full flex flex-col justify-between" style={{ minHeight: height }}>
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-4 text-xs font-mono">
          {cohorts.map((c) => (
            <div key={c.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
              <span className="text-slate-300">{c.name}</span>
              <span className="text-slate-500 font-semibold">{c.share}</span>
            </div>
          ))}
        </div>
        <span className="text-[11px] text-slate-500 font-mono">24-Tick Cohort Density</span>
      </div>

      {/* Stacked Cohort Bars */}
      <div className="flex-1 flex items-end gap-1.5 px-4 pt-6 pb-2">
        {bars.map((bar, idx) => (
          <div
            key={bar.timestamp || idx}
            className="flex-1 flex flex-col justify-end h-52 group relative"
          >
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col gap-1 bg-[#11141B] border border-white/10 p-2 rounded-lg text-[10px] font-mono text-white shadow-glass z-20 pointer-events-none whitespace-nowrap">
              <span className="text-slate-400">{bar.timeLabel}</span>
              <span className="text-sky-300">Mobile: {bar.mobilePct.toFixed(1)}%</span>
              <span className="text-purple-300">Desktop: {bar.desktopPct.toFixed(1)}%</span>
              <span className="text-teal-300">Tablet: {bar.tabletPct.toFixed(1)}%</span>
              <span className="font-bold text-white pt-1 border-t border-white/10">
                Total: {meta.format(bar.totalVal)}
              </span>
            </div>

            {/* Tablet segment */}
            <div
              style={{ height: `${bar.tabletPct}%`, backgroundColor: cohorts[2].color }}
              className="w-full rounded-t-sm transition-all duration-300 opacity-90 group-hover:opacity-100"
            />
            {/* Desktop segment */}
            <div
              style={{ height: `${bar.desktopPct}%`, backgroundColor: cohorts[1].color }}
              className="w-full transition-all duration-300 opacity-85 group-hover:opacity-100"
            />
            {/* Mobile segment */}
            <div
              style={{ height: `${bar.mobilePct}%`, backgroundColor: cohorts[0].color }}
              className="w-full rounded-b-sm transition-all duration-300 opacity-80 group-hover:opacity-100"
            />
          </div>
        ))}
      </div>

      {/* Bottom labels */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[10px] font-mono text-slate-500">
        <span>{bars[0]?.timeLabel || 'T-24m'}</span>
        <span>Relative Cohort Volume Distribution</span>
        <span>{bars[bars.length - 1]?.timeLabel || 'Now'}</span>
      </div>
    </div>
  );
};
