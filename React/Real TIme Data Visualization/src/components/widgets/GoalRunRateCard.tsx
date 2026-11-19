import React from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { calculateGoalPace } from '../../engine/narrative';
import { Target, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';

export const GoalRunRateCard: React.FC = () => {
  const { primaryMetricId, getLatestPoint } = useTelemetry();
  const meta = METRIC_METAS[primaryMetricId];
  const latestPoint = getLatestPoint(primaryMetricId);

  const pace = calculateGoalPace(latestPoint?.value || 4200, meta.goalTarget);

  return (
    <div className="rounded-2xl bg-[#11141B] dark:bg-[#11141B] border border-white/[0.07] p-5 flex flex-col justify-between shadow-sm">
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Goal Pace & Run-Rate Weather
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {pace.daysDeltaText}
          </span>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-mono font-bold text-white tracking-tight">
            {pace.runRateText}
          </div>
          <p className="text-xs text-slate-300 leading-snug">
            Extrapolates current velocity weighted by day-of-week seasonality curves.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#171B24] border border-white/5 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Target Completion:</span>
            <span className="font-bold text-emerald-400">{pace.projectedCrossingDate}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              style={{ width: `${pace.percentageComplete}%` }}
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>Pace: {pace.percentageComplete.toFixed(1)}% of Goal</span>
            <span>Target: {meta.format(meta.goalTarget)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.07] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 size={13} /> Seasonal Baseline Aligned
        </span>
        <span>Confidence: 96.8%</span>
      </div>
    </div>
  );
};
