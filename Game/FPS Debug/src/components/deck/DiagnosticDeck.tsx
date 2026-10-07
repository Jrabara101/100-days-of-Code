import React, { useState } from 'react';
import type { PerformanceSummary, HardwareProfile, DiagnosticSnapshot } from '../../types/telemetry';
import type { Float32CircularBuffer, IncidentFlightRecorder } from '../../utils/circularBuffer';
import { PacingHistogramTab } from './tabs/PacingHistogramTab';
import { SystemHardwareTab } from './tabs/SystemHardwareTab';
import { ChaosLabTab } from './tabs/ChaosLabTab';
import { FlightRecorderTab } from './tabs/FlightRecorderTab';
import { FleetTelemetryTab } from './tabs/FleetTelemetryTab';
import { generateMarkdownPassport, exportDiagnosticJson } from '../../utils/passport';
import {
  X,
  Activity,
  Cpu,
  Flame,
  Camera,
  Radio,
  Copy,
  Check,
  Download,
  Crosshair,
  Shield,
  Layers,
} from 'lucide-react';

interface DiagnosticDeckProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: PerformanceSummary;
  hardware: HardwareProfile | null;
  ringBuffer: Float32CircularBuffer;
  flightRecorder: IncidentFlightRecorder;
  snapshots: DiagnosticSnapshot[];
  onTakeSnapshot: (reason?: string) => DiagnosticSnapshot;
  onDeleteSnapshot: (id: string) => void;
  targetFps: number;
  onSetTargetFps: (fps: number) => void;
}

export const DiagnosticDeck: React.FC<DiagnosticDeckProps> = ({
  isOpen,
  onClose,
  metrics,
  hardware,
  ringBuffer,
  flightRecorder,
  snapshots,
  onTakeSnapshot,
  onDeleteSnapshot,
  targetFps,
  onSetTargetFps,
}) => {
  const [activeTab, setActiveTab] = useState<'pacing' | 'hardware' | 'chaos' | 'flight' | 'fleet'>('pacing');
  const [copiedPassport, setCopiedPassport] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyCurrentPassport = () => {
    const snap = onTakeSnapshot('Manual Passport Generation');
    const md = generateMarkdownPassport(snap);
    navigator.clipboard.writeText(md);
    setCopiedPassport(true);
    setTimeout(() => setCopiedPassport(false), 2000);
  };

  const handleExportJson = () => {
    const snap = onTakeSnapshot('Manual JSON Export');
    exportDiagnosticJson(snap);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      {/* Cockpit Shell Window */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-800 bg-[#070A12]/95 shadow-2xl shadow-black overflow-hidden">
        {/* Top Avionics Header Ribbon */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/90 bg-[#090D18]">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold font-mono-avionics text-white tracking-wider uppercase">
                  Avionics Diagnostic Deck
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-avionics bg-cyan-950 text-cyan-300 border border-cyan-800">
                  v1.4.2 Precision HUD
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono-avionics">
                Sub-millisecond profiling · Typed ring buffer · 1% Low hitch radar
              </p>
            </div>
          </div>

          {/* Quick Actions & Close */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyCurrentPassport}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-avionics transition-all flex items-center space-x-1.5 border ${
                copiedPassport
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300 animate-copy-bloom'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:border-slate-500'
              }`}
            >
              {copiedPassport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPassport ? 'Passport Copied!' : 'Copy Passport'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              title="Download full JSON diagnostic snapshot"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center px-4 border-b border-slate-800/80 bg-[#0A0E1A] overflow-x-auto text-xs font-mono-avionics">
          {[
            { id: 'pacing', label: 'Pacing & Histograms', icon: Activity },
            { id: 'hardware', label: 'System & Hardware', icon: Cpu },
            { id: 'chaos', label: 'Chaos Rig Sandbox', icon: Flame },
            { id: 'flight', label: `Flight Recorder (${snapshots.length})`, icon: Camera },
            { id: 'fleet', label: 'Fleet Telemetry Matrix', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Viewport */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#05070C] space-y-4">
          {activeTab === 'pacing' && (
            <PacingHistogramTab
              metrics={metrics}
              hardware={hardware}
              ringBuffer={ringBuffer}
              targetFps={targetFps}
              onSetTargetFps={onSetTargetFps}
            />
          )}

          {activeTab === 'hardware' && (
            <SystemHardwareTab
              hardware={hardware}
              metrics={metrics}
            />
          )}

          {activeTab === 'chaos' && (
            <ChaosLabTab />
          )}

          {activeTab === 'flight' && (
            <FlightRecorderTab
              flightRecorder={flightRecorder}
              snapshots={snapshots}
              onTakeSnapshot={onTakeSnapshot}
              onDeleteSnapshot={onDeleteSnapshot}
            />
          )}

          {activeTab === 'fleet' && (
            <FleetTelemetryTab
              currentSnapshot={snapshots[0] || null}
            />
          )}
        </div>

        {/* Bottom Tactical Status Footer */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 border-t border-slate-800 bg-[#080C16] text-[11px] font-mono-avionics text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white font-bold">{Math.round(metrics.currentFps)} FPS</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>1% Low: <strong className="text-amber-300">{Math.round(metrics.onePercentLowFps)}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Delta: <strong className="text-cyan-300">{metrics.currentFrameTimeMs.toFixed(1)}ms</strong></span>
            <span className="text-slate-600">|</span>
            <span>GPU: <strong className="text-slate-300">{hardware?.gpuRenderer.slice(0, 32)}</strong></span>
          </div>

          <div className="text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">F2</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">~</kbd> to Toggle HUD
          </div>
        </div>
      </div>
    </div>
  );
};
