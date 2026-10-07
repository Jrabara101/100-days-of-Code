import React, { useState } from 'react';
import type { PerformanceSummary, HardwareProfile } from '../../../types/telemetry';
import type { Float32CircularBuffer } from '../../../utils/circularBuffer';
import { SparklineCanvas } from '../../canvas/SparklineCanvas';
import { Activity, Gauge, TrendingDown, Clock, ShieldAlert, BarChart3, LineChart } from 'lucide-react';

interface PacingHistogramTabProps {
  metrics: PerformanceSummary;
  hardware: HardwareProfile | null;
  ringBuffer: Float32CircularBuffer;
  onSetTargetFps: (fps: number) => void;
  targetFps: number;
}

export const PacingHistogramTab: React.FC<PacingHistogramTabProps> = ({
  metrics,
  hardware,
  ringBuffer,
  onSetTargetFps,
  targetFps,
}) => {
  const [viewMode, setViewMode] = useState<'sparkline' | 'histogram'>('sparkline');
  const [hoverDetail, setHoverDetail] = useState<{ frameTimeMs: number; fps: number } | null>(null);

  const targetHz = targetFps > 0 ? targetFps : (hardware?.screenRefreshRate || 60);

  return (
    <div className="space-y-4">
      {/* Top Sparkline Container */}
      <div className="rounded-xl border border-slate-800 bg-[#090D15] p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono-avionics text-slate-200 uppercase font-semibold">
              Live Sub-Millisecond Frame Pacing Sparkline (Last 120 Frames)
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('sparkline')}
              className={`px-2 py-1 rounded text-[11px] font-mono-avionics transition-colors flex items-center space-x-1 ${
                viewMode === 'sparkline'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3 h-3" />
              <span>Area Trace</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('histogram')}
              className={`px-2 py-1 rounded text-[11px] font-mono-avionics transition-colors flex items-center space-x-1 ${
                viewMode === 'histogram'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Histogram</span>
            </button>
          </div>
        </div>

        {/* Live Canvas */}
        <div className="h-28 w-full">
          <SparklineCanvas
            ringBuffer={ringBuffer}
            height={112}
            sampleCount={120}
            showTargetLines={true}
            targetHz={targetHz}
            mode={viewMode}
            interactive={true}
            onHoverSample={(sample) => setHoverDetail(sample ? { frameTimeMs: sample.frameTimeMs, fps: sample.fps } : null)}
          />
        </div>

        {/* Dynamic Scrub Inspector Footer */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-avionics text-slate-400">
          <div>
            Scrub canvas with cursor to inspect individual frame latency
          </div>
          {hoverDetail ? (
            <div className="text-cyan-300">
              Reticle Latency: <strong className="text-white">{hoverDetail.frameTimeMs.toFixed(2)} ms</strong> ({hoverDetail.fps.toFixed(1)} FPS)
            </div>
          ) : (
            <div className="text-slate-500">
              Target Reference: <span className="text-cyan-400">8.33ms (120Hz)</span> · <span className="text-emerald-400">16.66ms (60Hz)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2x2 Tactical Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card A: Frame Pacing & Lows */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0D1322] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-mono-avionics text-slate-300 flex items-center space-x-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Rolling Pacing &amp; 1% Lows</span>
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono-avionics ${
              metrics.stabilityScore >= 90
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                : metrics.stabilityScore >= 70
                ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                : 'bg-red-950/70 text-red-300 border border-red-800'
            }`}>
              {metrics.stabilityScore.toFixed(1)}% Stability
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono-avionics">
            <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-slate-400 uppercase">Average FPS</div>
              <div className="text-lg font-bold text-white mt-0.5">{metrics.averageFps.toFixed(1)}</div>
              <div className="text-[9px] text-slate-500">{(1000 / (metrics.averageFps || 60)).toFixed(1)}ms</div>
            </div>

            <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-amber-400 uppercase">1% Low (P99)</div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">{metrics.onePercentLowFps.toFixed(1)}</div>
              <div className="text-[9px] text-slate-500">{(1000 / (metrics.onePercentLowFps || 60)).toFixed(1)}ms</div>
            </div>

            <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-red-400 uppercase">0.1% Low</div>
              <div className="text-lg font-bold text-red-300 mt-0.5">{metrics.pointOnePercentLowFps.toFixed(1)}</div>
              <div className="text-[9px] text-slate-500">{(1000 / (metrics.pointOnePercentLowFps || 60)).toFixed(1)}ms</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 font-mono-avionics">
            1% Low gauges gameplay smoothness by sorting the slowest 1% of frame intervals, exposing stutters disguised by average framerates.
          </p>
        </div>

        {/* Card B: Latency Bounds & Dropped Frames */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0D1322] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-mono-avionics text-slate-300 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Frame Latency Bounds</span>
            </span>
            <span className="text-xs text-slate-400 font-mono-avionics">
              {metrics.totalFrames.toLocaleString()} Frames
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono-avionics">
            <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-slate-400 uppercase">Current Delta</div>
              <div className="text-lg font-bold text-cyan-300 mt-0.5">{metrics.currentFrameTimeMs.toFixed(1)}ms</div>
              <div className="text-[9px] text-slate-500">{metrics.currentFps.toFixed(0)} FPS</div>
            </div>

            <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-emerald-400 uppercase">Min Frame</div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5">{metrics.minFrameTimeMs.toFixed(1)}ms</div>
              <div className="text-[9px] text-slate-500">Fastest render</div>
            </div>

            <div className="bg-[#080C16] p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-red-400 uppercase">Max Peak Hitch</div>
              <div className="text-lg font-bold text-red-400 mt-0.5">{metrics.maxFrameTimeMs.toFixed(1)}ms</div>
              <div className="text-[9px] text-slate-500">Worst freeze</div>
            </div>
          </div>

          {/* Dropped frame & long task count tags */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-xs font-mono-avionics">
            <div className="flex items-center space-x-1.5 text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Dropped Frames: <strong>{metrics.droppedFrames}</strong></span>
            </div>
            <div className="text-red-400">
              Long Tasks (&gt;50ms): <strong>{metrics.longTaskCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Target FPS Lock Ribbon */}
      <div className="rounded-xl border border-slate-800/80 bg-[#090D15] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-avionics">
        <div className="flex items-center space-x-2 text-slate-300">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>Active FPS Target Calibration:</span>
        </div>

        <div className="flex items-center space-x-2">
          {[30, 45, 60, 120, 0].map((fps) => (
            <button
              key={fps}
              type="button"
              onClick={() => onSetTargetFps(fps)}
              className={`px-3 py-1 rounded-lg border transition-all ${
                targetFps === fps
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {fps === 0 ? 'UNCAPPED' : `${fps} FPS`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
