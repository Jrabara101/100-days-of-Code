import React, { useState } from 'react';
import type { DiagnosticSnapshot } from '../../../types/telemetry';
import type { IncidentFlightRecorder, IncidentFrameRecord } from '../../../utils/circularBuffer';
import { FlamegraphCanvas } from '../../canvas/FlamegraphCanvas';
import { generateMarkdownPassport, generateDiscordScorecard, exportDiagnosticJson } from '../../../utils/passport';
import { telemetryClient } from '../../../services/telemetryClient';
import { Shield, Camera, Copy, Check, Download, Trash2, AlertTriangle, Play, Radio, Terminal } from 'lucide-react';

interface FlightRecorderTabProps {
  flightRecorder: IncidentFlightRecorder;
  snapshots: DiagnosticSnapshot[];
  onTakeSnapshot: (reason?: string) => DiagnosticSnapshot;
  onDeleteSnapshot: (id: string) => void;
}

export const FlightRecorderTab: React.FC<FlightRecorderTabProps> = ({
  flightRecorder,
  snapshots,
  onTakeSnapshot,
  onDeleteSnapshot,
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<DiagnosticSnapshot | null>(
    snapshots.length > 0 ? snapshots[0] : null
  );
  const [activeFrameInspect, setActiveFrameInspect] = useState<IncidentFrameRecord | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [beaconStatus, setBeaconStatus] = useState<string | null>(null);

  // If viewing live circular buffer vs saved snapshot
  const liveFrames = flightRecorder.getRecentChronological(360);
  const longTasks = flightRecorder.getLongTasks();
  const errorLogs = flightRecorder.getErrors();

  const handleCapture = () => {
    const snap = onTakeSnapshot('Manual Black-Box Capture');
    setSelectedSnapshot(snap);
  };

  const copyPassport = (snap: DiagnosticSnapshot) => {
    const md = generateMarkdownPassport(snap);
    navigator.clipboard.writeText(md);
    setCopiedType('markdown');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const copyDiscord = (snap: DiagnosticSnapshot) => {
    const discord = generateDiscordScorecard(snap);
    navigator.clipboard.writeText(discord);
    setCopiedType('discord');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const transmitBeacon = async (snap: DiagnosticSnapshot) => {
    setBeaconStatus('Transmitting beacon...');
    const res = await telemetryClient.submitReport(snap);
    if (res.success) {
      setBeaconStatus('Beacon successfully enqueued to fleet backend!');
    } else {
      setBeaconStatus(`Beacon dispatch: ${res.error || 'Saved locally'}`);
    }
    setTimeout(() => setBeaconStatus(null), 4000);
  };

  // Convert snapshot frame numbers into dummy or real IncidentFrameRecords
  const displayedFrames: IncidentFrameRecord[] = selectedSnapshot
    ? selectedSnapshot.recentFrameHistory.map((delta, i) => ({
        timestamp: Date.now() - (selectedSnapshot.recentFrameHistory.length - i) * 16.6,
        deltaMs: delta,
        instantFps: delta > 0 ? Math.min(240, 1000 / delta) : 60,
        isLongTask: delta > 33.33,
      }))
    : liveFrames;

  return (
    <div className="space-y-4 font-mono-avionics text-xs">
      {/* Flight Recorder Ribbon */}
      <div className="rounded-xl border border-slate-800 bg-[#090D15] p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <span className="text-white font-bold text-sm block">
              15-Second Black-Box Incident Buffer
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              Continuous rolling telemetry captures exact pre-stutter states, garbage collection stalls, and long tasks.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCapture}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-2"
        >
          <Camera className="w-4 h-4" />
          <span>Snapshot Pre-Stutter Trace (F2)</span>
        </button>
      </div>

      {beaconStatus && (
        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/60 text-emerald-300 text-xs flex items-center space-x-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>{beaconStatus}</span>
        </div>
      )}

      {/* Flamegraph Replay Canvas Container */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4 space-y-2">
        <div className="flex items-center justify-between pb-1">
          <span className="text-slate-300 font-semibold text-xs flex items-center space-x-1.5">
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {selectedSnapshot ? `Replaying Snapshot: ${selectedSnapshot.id}` : 'Live 15s Circular Buffer Flamegraph'}
            </span>
          </span>

          {selectedSnapshot && (
            <button
              type="button"
              onClick={() => setSelectedSnapshot(null)}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Switch to Live Buffer
            </button>
          )}
        </div>

        <FlamegraphCanvas
          frames={displayedFrames}
          longTasks={selectedSnapshot ? selectedSnapshot.longTaskLogs : longTasks}
          height={130}
          onSelectFrame={(f) => setActiveFrameInspect(f)}
        />
      </div>

      {/* Captured Snapshots Drawer / Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-slate-200 font-semibold">
            Black-Box Incident Archive ({snapshots.length} Snapshots)
          </span>
          <span className="text-slate-500 text-[11px]">Hitches snapshot automatically</span>
        </div>

        {snapshots.length === 0 ? (
          <div className="text-center py-6 text-slate-500 italic">
            No incident snapshots taken yet. Hit "Snapshot Pre-Stutter Trace" or press F2 anytime a hitch occurs.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {snapshots.map((snap) => {
              const isSelected = selectedSnapshot?.id === snap.id;
              return (
                <div
                  key={snap.id}
                  onClick={() => setSelectedSnapshot(snap)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-[#080C16] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${snap.metrics.stabilityScore >= 90 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div>
                      <div className="text-slate-200 font-bold flex items-center space-x-2">
                        <span>{snap.id}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {new Date(snap.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        <strong className="text-white">{snap.metrics.averageFps.toFixed(1)} FPS</strong> · 1% Low:{' '}
                        <strong className="text-amber-400">{snap.metrics.onePercentLowFps.toFixed(1)}</strong> · Max:{' '}
                        <strong className="text-red-400">{snap.metrics.maxFrameTimeMs.toFixed(1)}ms</strong> · Drops:{' '}
                        {snap.metrics.droppedFrames}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => copyPassport(snap)}
                      title="Copy Markdown Benchmark Passport"
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 flex items-center space-x-1"
                    >
                      {copiedType === 'markdown' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Passport</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyDiscord(snap)}
                      title="Copy Discord Scorecard"
                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 flex items-center space-x-1"
                    >
                      <span>Discord</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => exportDiagnosticJson(snap)}
                      title="Download JSON Bundle"
                      className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => transmitBeacon(snap)}
                      title="Transmit Telemetry Beacon to Backend"
                      className="p-1 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300 hover:bg-cyan-900"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSnapshot(snap.id)}
                      title="Delete Snapshot"
                      className="p-1 rounded text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Event Ticker & Long Task Console */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4 space-y-2">
        <span className="text-slate-200 font-semibold flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Live Long Task (&gt;50ms) &amp; Exception Stream</span>
        </span>

        {longTasks.length === 0 && errorLogs.length === 0 ? (
          <div className="p-3 bg-[#080C16] rounded border border-slate-800/60 text-slate-500 text-center">
            Zero thread-blocking long tasks or unhandled exceptions detected. Frame pacing nominal.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {longTasks.map((lt, idx) => (
              <div key={idx} className="p-2 rounded bg-red-950/30 border border-red-900/60 text-red-300 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>PerformanceObserver [LongTask]: {lt.name || 'Main Thread Task'}</span>
                </div>
                <span className="font-bold text-white bg-red-900/60 px-2 py-0.5 rounded">
                  {lt.durationMs.toFixed(1)} ms freeze
                </span>
              </div>
            ))}
            {errorLogs.map((err, idx) => (
              <div key={idx} className="p-2 rounded bg-amber-950/30 border border-amber-900/60 text-amber-300 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="break-all">{err.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
