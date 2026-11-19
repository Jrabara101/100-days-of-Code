import React, { useMemo } from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { ChartLens } from '../../types/telemetry';
import { generateHeadline } from '../../engine/narrative';
import { InteractiveTimeSeriesChart } from '../charts/InteractiveTimeSeriesChart';
import { CohortBreakdownChart } from '../charts/CohortBreakdownChart';
import { HourlyIntensityHeatmap } from '../charts/HourlyIntensityHeatmap';
import { TelemetryDataTable } from '../charts/TelemetryDataTable';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Table,
  Sliders,
  Camera,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export const MasterChartStage: React.FC = () => {
  const {
    primaryMetricId,
    setPrimaryMetricId,
    chartLens,
    setChartLens,
    whatIfScenario,
    updateWhatIfScenario,
    triggerClipModal,
    getSeriesData,
    getLatestPoint,
    selectedSegmentFilter,
    setSelectedSegmentFilter
  } = useTelemetry();

  const meta = METRIC_METAS[primaryMetricId];
  const series = getSeriesData(primaryMetricId, 160);
  const latestPoint = getLatestPoint(primaryMetricId);

  // Dynamic takeaway headline
  const headline = useMemo(() => {
    return generateHeadline(primaryMetricId, latestPoint, series);
  }, [primaryMetricId, latestPoint, series]);

  const viewModes: { id: ChartLens; label: string; icon: React.ReactNode }[] = [
    { id: 'continuous_trend', label: 'Continuous Trend', icon: <TrendingUp size={13} /> },
    { id: 'cohort_breakdown', label: 'Cohort Breakdown', icon: <BarChart2 size={13} /> },
    { id: 'hourly_heatmap', label: 'Hourly Heatmap', icon: <Calendar size={13} /> },
    { id: 'data_table', label: 'Data Table', icon: <Table size={13} /> }
  ];

  return (
    <div className="rounded-2xl bg-[#11141B] dark:bg-[#11141B] border border-white/[0.07] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
      {/* 1. Narrative Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        {/* Left: Dynamic Headline */}
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {meta.name} • Master Telemetry Stage
            </span>
            {selectedSegmentFilter && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Filtered: {selectedSegmentFilter}
                <button
                  onClick={() => setSelectedSegmentFilter(null)}
                  className="ml-1 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-white leading-snug flex items-start gap-2">
            <Sparkles size={16} className="text-sky-400 mt-1 flex-shrink-0" />
            <span>{headline.headline}</span>
          </h2>
          <p className="text-xs text-slate-400 pl-6">{headline.subhead}</p>
        </div>

        {/* Right: View Switcher, What-If Toggle, & Clip Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Lens View Switcher */}
          <div className="flex items-center bg-[#171B24] p-1 rounded-xl border border-white/5 text-xs font-medium text-slate-300">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setChartLens(mode.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                  chartLens === mode.id
                    ? 'bg-sky-500/20 text-sky-300 font-semibold shadow-sm border border-sky-400/30'
                    : 'hover:text-white hover:bg-white/5'
                }`}
              >
                {mode.icon}
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Inline What-If Simulator Toggle */}
          <button
            onClick={() => updateWhatIfScenario({ active: !whatIfScenario.active })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              whatIfScenario.active
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-glow-emerald'
                : 'bg-[#171B24] text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            <Sliders size={13} className={whatIfScenario.active ? 'text-emerald-400' : ''} />
            <span>What-If Simulator</span>
            {whatIfScenario.active && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Clip Insight Exporter */}
          <button
            onClick={() =>
              triggerClipModal({
                title: meta.name,
                subtitle: headline.headline,
                metricId: primaryMetricId
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#171B24] text-slate-300 border border-white/5 hover:border-white/20 hover:text-white transition-all"
            title="Clip Insight to Story Card"
          >
            <Camera size={13} />
            <span className="hidden sm:inline">Clip Card</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Chart Canvas View */}
      <div className="pt-4 flex-1">
        {chartLens === 'continuous_trend' && (
          <InteractiveTimeSeriesChart metricId={primaryMetricId} height={340} />
        )}
        {chartLens === 'cohort_breakdown' && (
          <CohortBreakdownChart metricId={primaryMetricId} height={340} />
        )}
        {chartLens === 'hourly_heatmap' && (
          <HourlyIntensityHeatmap metricId={primaryMetricId} height={340} />
        )}
        {chartLens === 'data_table' && (
          <TelemetryDataTable metricId={primaryMetricId} height={340} />
        )}
      </div>

      {/* 3. Drag-to-Measure & Inspection Guidance Footnote */}
      <div className="mt-3 pt-3 border-t border-white/[0.05] flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed" /> Typical Tuesday Baseline
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400/10 border border-slate-400/20" /> ±2.2σ Normal Corridor
          </span>
        </div>
        <div className="text-slate-400 flex items-center gap-1">
          💡 Click & drag horizontally across any two points to open <strong className="text-sky-300">Delta Ruler</strong>
        </div>
      </div>
    </div>
  );
};
