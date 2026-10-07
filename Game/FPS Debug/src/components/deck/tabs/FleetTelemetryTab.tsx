import React, { useState, useEffect, useCallback } from 'react';
import type { FleetSummaryResponse, DiagnosticSnapshot } from '../../../types/telemetry';
import { telemetryClient } from '../../../services/telemetryClient';
import { Radio, ShieldAlert, Cpu, Layers, RefreshCw, Send, CheckCircle2, TrendingUp } from 'lucide-react';

interface FleetTelemetryTabProps {
  currentSnapshot?: DiagnosticSnapshot | null;
}

export const FleetTelemetryTab: React.FC<FleetTelemetryTabProps> = ({ currentSnapshot }) => {
  const [fleetData, setFleetData] = useState<FleetSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transmitting, setTransmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const data = await telemetryClient.fetchFleetSummary();
    setFleetData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleTransmitCurrent = async () => {
    if (!currentSnapshot) return;
    setTransmitting(true);
    setStatusMessage('Transmitting live beacon to backend ingest...');
    const res = await telemetryClient.submitReport(currentSnapshot);
    if (res.success) {
      setStatusMessage('Beacon successfully recorded in fleet matrix!');
      await fetchSummary();
    } else {
      setStatusMessage(`Ingest notice: ${res.error || 'Check server connection'}`);
    }
    setTransmitting(false);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-4 font-mono-avionics text-xs">
      {/* Top Beacon Ingest Header */}
      <div className="rounded-xl border border-slate-800 bg-[#090D15] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <span className="text-white font-bold text-sm block">
              Fleet Telemetry Matrix &amp; Regression Beacon (Fastify + SQLite)
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              Aggregates client sessions across hardware tiers to detect performance regressions on specific GPUs or driver versions.
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentSnapshot && (
            <button
              type="button"
              disabled={transmitting}
              onClick={handleTransmitCurrent}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-cyan-600/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{transmitting ? 'Transmitting...' : 'Dispatch Session Beacon'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchSummary}
            title="Refresh Fleet Data"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/60 text-cyan-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Fleet Macro Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="p-3 rounded-xl border border-slate-800 bg-[#0D1322]">
          <span className="text-[10px] text-slate-400 uppercase">Fleet Sessions</span>
          <div className="text-xl font-bold text-white mt-1">
            {fleetData ? fleetData.totalReports : '...'}
          </div>
          <span className="text-[10px] text-slate-500">Ingested reports</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-[#0D1322]">
          <span className="text-[10px] text-emerald-400 uppercase">Global Stability</span>
          <div className="text-xl font-bold text-emerald-300 mt-1">
            {fleetData ? `${fleetData.fleetStabilityScore}%` : '...'}
          </div>
          <span className="text-[10px] text-slate-500">Fleet compliance</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-[#0D1322]">
          <span className="text-[10px] text-cyan-400 uppercase">Fleet Avg FPS</span>
          <div className="text-xl font-bold text-cyan-300 mt-1">
            {fleetData ? `${fleetData.fleetAverageFps} FPS` : '...'}
          </div>
          <span className="text-[10px] text-slate-500">Cross-device average</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-[#0D1322]">
          <span className="text-[10px] text-amber-400 uppercase">P99 Frame Latency</span>
          <div className="text-xl font-bold text-amber-300 mt-1">
            {fleetData ? `${fleetData.fleetP99Ms} ms` : '...'}
          </div>
          <span className="text-[10px] text-slate-500">Worst 1% threshold</span>
        </div>
      </div>

      {/* Flagged Regressions Matrix */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-slate-200 font-semibold flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Automated Regression Alerts ({fleetData?.regressions.length || 0} Flagged)</span>
          </span>
          <span className="text-[11px] text-slate-500">Threshold: 1% Low &lt; 30 FPS or &gt;3 Long Tasks</span>
        </div>

        {fleetData && fleetData.regressions.length > 0 ? (
          <div className="space-y-2">
            {fleetData.regressions.map((reg) => (
              <div
                key={reg.id}
                className="p-3 rounded-lg bg-[#080C16] border border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-800 uppercase font-bold">
                      {reg.severity}
                    </span>
                    <span className="text-white font-bold text-xs">{reg.gpuRenderer}</span>
                  </div>
                  <div className="text-[11px] text-red-300/80">
                    Reason: {reg.reason}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-[11px] font-mono-avionics text-right shrink-0">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Avg FPS</span>
                    <span className="text-slate-200 font-bold">{reg.avgFps}</span>
                  </div>
                  <div>
                    <span className="text-red-400 block text-[9px]">1% Low</span>
                    <span className="text-red-300 font-bold">{reg.onePercentLowFps}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 italic text-center py-4">
            Zero hardware regressions flagged in recent fleet ingestion cycles.
          </div>
        )}
      </div>

      {/* Hardware Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* GPU Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4 space-y-2">
          <span className="text-slate-200 font-semibold block pb-1 border-b border-slate-800 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Fleet GPU Renderer Distribution</span>
          </span>

          <div className="space-y-1.5 pt-1">
            {fleetData?.hardwareDistribution.gpus.map((gpu, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-[#080C16] text-[11px]">
                <div className="truncate pr-2 max-w-[220px]">
                  <span className="text-slate-200 block truncate">{gpu.name}</span>
                  <span className="text-[10px] text-slate-500">{gpu.count} Devices</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-cyan-300 font-bold">{gpu.avgFps} FPS</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Ingested Sessions */}
        <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4 space-y-2">
          <span className="text-slate-200 font-semibold block pb-1 border-b border-slate-800 flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Recent Telemetry Beacons</span>
          </span>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 pt-1">
            {fleetData?.recentSessions.map((sess, idx) => (
              <div key={idx} className="p-2 rounded bg-[#080C16] border border-slate-800/60 flex items-center justify-between text-[11px]">
                <div className="truncate pr-2">
                  <span className="text-slate-300 block truncate font-medium">{sess.gpuRenderer}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(sess.timestamp).toLocaleTimeString()} · Stability {sess.stabilityScore}%
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-white font-bold">{sess.avgFps} FPS</span>
                  <span className="text-[10px] text-slate-500 block">1% {sess.onePercentLowFps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
