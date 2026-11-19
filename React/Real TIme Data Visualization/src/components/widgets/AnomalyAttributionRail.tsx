import React, { useState } from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { calculateGoalPace } from '../../engine/narrative';
import {
  Sparkles,
  Sliders,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  MessageSquare,
  Zap,
  Radio
} from 'lucide-react';

export const AnomalyAttributionRail: React.FC = () => {
  const {
    primaryMetricId,
    getLatestPoint,
    whatIfScenario,
    updateWhatIfScenario,
    resetWhatIfScenario,
    selectedSegmentFilter,
    setSelectedSegmentFilter,
    causalEvents,
    hypothesisNotes
  } = useTelemetry();

  const [activeTab, setActiveTab] = useState<'attribution' | 'whatif' | 'collaborate'>('attribution');

  const meta = METRIC_METAS[primaryMetricId];
  const latestPoint = getLatestPoint(primaryMetricId);

  // Default attribution drivers if none in latest point
  const drivers = latestPoint?.drivers || [
    { dimension: 'Region: US-East (Virginia)', contribution: '+64% of surge', percentage: 64, color: '#38BDF8', category: 'region' as const },
    { dimension: 'Channel: Direct iOS App', contribution: '+24% of surge', percentage: 24, color: '#A855F7', category: 'device' as const },
    { dimension: 'Checkout: 1-Tap Apple Pay', contribution: 'Avg 1.8s faster', percentage: 12, color: '#10B981', category: 'payment' as const }
  ];

  // Pace forecast calculation
  const pace = calculateGoalPace(latestPoint?.value || 4200, meta.goalTarget);

  return (
    <div className="rounded-2xl bg-[#11141B] dark:bg-[#11141B] border border-white/[0.07] p-5 shadow-sm flex flex-col justify-between">
      {/* Top Header & Tabs */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-1.5 bg-[#171B24] p-1 rounded-xl border border-white/5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('attribution')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'attribution'
                  ? 'bg-sky-500/20 text-sky-300 font-semibold shadow-sm border border-sky-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={12} />
              <span>Root Cause</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('whatif');
                if (!whatIfScenario.active) updateWhatIfScenario({ active: true });
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'whatif'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm border border-emerald-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders size={12} />
              <span>What-If</span>
            </button>
            <button
              onClick={() => setActiveTab('collaborate')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'collaborate'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm border border-amber-400/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare size={12} />
              <span>Notes ({hypothesisNotes.length})</span>
            </button>
          </div>

          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 hidden sm:inline">
            Attribution Engine
          </span>
        </div>

        {/* TAB 1: Root-Cause Attribution */}
        {activeTab === 'attribution' && (
          <div className="pt-4 space-y-4 animate-fade-in">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  Top Drivers Accounting for Variance
                </span>
                {latestPoint?.isAnomaly && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ANOMALY ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-dimensional delta decomposition for current {meta.name} shift. Click any driver to isolate that cohort.
              </p>
            </div>

            {/* Contributing dimension bars */}
            <div className="space-y-3">
              {drivers.map((driver, idx) => {
                const isSelected = selectedSegmentFilter === driver.dimension;
                return (
                  <div
                    key={idx}
                    onClick={() =>
                      setSelectedSegmentFilter(isSelected ? null : driver.dimension)
                    }
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-400/50 shadow-sm'
                        : 'bg-[#171B24] border-white/5 hover:border-white/15 hover:bg-[#1a1f2a]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-200 group-hover:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: driver.color }} />
                        {driver.dimension}
                      </span>
                      <span className="font-mono font-semibold text-white tabular-nums">
                        {driver.contribution}
                      </span>
                    </div>

                    {/* Proportional fill meter */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${driver.percentage}%`,
                          backgroundColor: driver.color
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Causal Event Context Box */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-sky-400">
                  <Zap size={12} /> Causal Event Correlation
                </span>
                <span>Active Anchor</span>
              </div>
              <div className="font-semibold text-white">v2.4 Checkout Deploy (T-12m)</div>
              <p className="text-[11px] text-slate-300">
                Metric acceleration coincided with global CDN activation and Apple Pay 1-tap checkout.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: What-If Goal Simulator */}
        {activeTab === 'whatif' && (
          <div className="pt-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sliders size={13} className="text-emerald-400" />
                  Tactile Forecast Simulator
                </h4>
                <p className="text-[11px] text-slate-400">
                  Bend projected curves in real-time to model milestone velocity.
                </p>
              </div>
              <button
                onClick={resetWhatIfScenario}
                className="p-1 text-slate-400 hover:text-white"
                title="Reset scenario"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Slider 1: Traffic Growth */}
            <div className="space-y-1.5 bg-[#171B24] p-3 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Adjust Traffic Growth:</span>
                <span className="font-bold text-sky-400 tabular-nums">
                  {whatIfScenario.trafficGrowth >= 0 ? '+' : ''}
                  {whatIfScenario.trafficGrowth}%
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="100"
                step="5"
                value={whatIfScenario.trafficGrowth}
                onChange={(e) => updateWhatIfScenario({ trafficGrowth: Number(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>-30%</span>
                <span>Baseline (0%)</span>
                <span>+100%</span>
              </div>
            </div>

            {/* Slider 2: Conversion Lift */}
            <div className="space-y-1.5 bg-[#171B24] p-3 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Adjust Conversion Lift:</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {whatIfScenario.conversionLift >= 0 ? '+' : ''}
                  {whatIfScenario.conversionLift}%
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="2"
                value={whatIfScenario.conversionLift}
                onChange={(e) => updateWhatIfScenario({ conversionLift: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>-20%</span>
                <span>Nominal (0%)</span>
                <span>+50% Lift</span>
              </div>
            </div>

            {/* Target Milestone Crossing Card */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Projected Milestone Impact
              </span>
              <div className="text-xs font-semibold text-white">
                At this pace, you will cross <span className="text-emerald-300">$1.2M Monthly GMV</span> on{' '}
                <span className="underline decoration-emerald-500/50">Thursday at 2:00 PM</span>
              </div>
              <p className="text-[11px] text-emerald-200/70 font-mono">
                Extrapolated using 4-week seasonal diurnal decay curves + 3.8% lift cushion.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Collaborative Notes & Hypotheses */}
        {activeTab === 'collaborate' && (
          <div className="pt-4 space-y-3 animate-fade-in max-h-72 overflow-y-auto">
            <div className="text-[11px] text-slate-400">
              Live hypothesis pins dropped onto the telemetry timeline by team members.
            </div>

            {hypothesisNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-[#171B24] border border-white/5 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center">
                      {note.avatar}
                    </span>
                    <span className="font-semibold text-white">{note.author}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(note.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-300 pl-7 text-[11px]">{note.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Run-Rate / Weather Forecast Pace Box */}
      <div className="mt-4 pt-3 border-t border-white/[0.07] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <TrendingUp size={13} className="text-emerald-400" />
            Goal Run-Rate Pace
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Target: {meta.format(meta.goalTarget)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${pace.percentageComplete}%` }}
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
          />
        </div>

        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>{pace.badge}</span>
        </div>
      </div>
    </div>
  );
};
