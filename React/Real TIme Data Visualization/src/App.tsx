import React from 'react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { StickyCommandRibbon } from './components/layout/StickyCommandRibbon';
import { NarrativeKPICard } from './components/widgets/NarrativeKPICard';
import { MasterChartStage } from './components/widgets/MasterChartStage';
import { AnomalyAttributionRail } from './components/widgets/AnomalyAttributionRail';
import { ExecutivePulseBriefing } from './components/widgets/ExecutivePulseBriefing';
import { RegionalRadarCard } from './components/widgets/RegionalRadarCard';
import { AnalystDeepDiveCanvas } from './components/widgets/AnalystDeepDiveCanvas';
import { HourlyIntensityHeatmap } from './components/charts/HourlyIntensityHeatmap';
import { CohortBreakdownChart } from './components/charts/CohortBreakdownChart';
import { GoalRunRateCard } from './components/widgets/GoalRunRateCard';
import { ClipInsightModal } from './components/modals/ClipInsightModal';
import { SinceLastCheckedDrawer } from './components/modals/SinceLastCheckedDrawer';
import { MetricId } from './types/telemetry';

const DashboardContent: React.FC = () => {
  const { perspectiveLens, primaryMetricId } = useTelemetry();
  const kpiMetrics: MetricId[] = ['checkout_velocity', 'active_sessions', 'api_latency', 'error_rate'];

  return (
    <div className="min-h-screen bg-[#090B0E] dark:bg-[#090B0E] text-[#F8FAFC] flex flex-col transition-colors">
      {/* 1. Sticky Command & DVR Ribbon */}
      <StickyCommandRibbon />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Perspective Lens Specific Banners */}
        {perspectiveLens === 'executive' && <ExecutivePulseBriefing />}
        {perspectiveLens === 'live_ops' && <RegionalRadarCard />}
        {perspectiveLens === 'analyst' && <AnalystDeepDiveCanvas />}

        {/* 2. Top Row — 4 Narrative KPI Spark-Widgets (12 cols) */}
        <div className="grid grid-cols-12 gap-4">
          {kpiMetrics.map((id) => (
            <NarrativeKPICard key={id} metricId={id} />
          ))}
        </div>

        {/* 3. Center Stage — Master Interactive Chart Stage (8 cols) + Anomaly Attribution Rail (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-8">
            <MasterChartStage />
          </div>
          <div className="lg:col-span-4">
            <AnomalyAttributionRail />
          </div>
        </div>

        {/* 4. Bottom Row — Modular Secondary Bento Cards (4 cols each) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Card 1: Hourly Intensity Heatmap */}
          <div className="lg:col-span-4 rounded-2xl bg-[#11141B] dark:bg-[#11141B] border border-white/[0.07] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Seasonal Diurnal Intensity
              </span>
              <span className="text-[10px] font-mono text-slate-500">7-Day Density</span>
            </div>
            <HourlyIntensityHeatmap metricId={primaryMetricId} height={260} />
          </div>

          {/* Card 2: Cohort Breakdown */}
          <div className="lg:col-span-4 rounded-2xl bg-[#11141B] dark:bg-[#11141B] border border-white/[0.07] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Platform Cohort Share
              </span>
              <span className="text-[10px] font-mono text-sky-400">Mobile + Web</span>
            </div>
            <CohortBreakdownChart metricId={primaryMetricId} height={260} />
          </div>

          {/* Card 3: Goal Run-Rate Weather Forecast */}
          <div className="lg:col-span-4">
            <GoalRunRateCard />
          </div>
        </div>
      </main>

      {/* Footer System Status */}
      <footer className="border-t border-white/[0.05] py-4 px-6 text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-3 max-w-[1600px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Luminous Telemetry Pipeline Connected • LTTB 60fps Safe</span>
        </div>
        <div>
          <span>Observability SLA: 99.99% • Built with React & Vite</span>
        </div>
      </footer>

      {/* Modals & Slide-over Drawers */}
      <ClipInsightModal />
      <SinceLastCheckedDrawer />
    </div>
  );
};

export default function App() {
  return (
    <TelemetryProvider>
      <DashboardContent />
    </TelemetryProvider>
  );
}
