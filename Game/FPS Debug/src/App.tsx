import React, { useState, useEffect } from 'react';
import { useFrameProfiler } from './hooks/useFrameProfiler';
import { CompactPill } from './components/hud/CompactPill';
import { GraphStrip } from './components/hud/GraphStrip';
import { AmbientEdge } from './components/hud/AmbientEdge';
import { DiagnosticDeck } from './components/deck/DiagnosticDeck';
import { ParticleSandbox } from './components/simulation/ParticleSandbox';
import { chaosEngine } from './services/chaosEngine';
import { generateMarkdownPassport, generateDiscordScorecard } from './utils/passport';
import {
  Gauge,
  Activity,
  Layers,
  Sparkles,
  Camera,
  Copy,
  Check,
  Maximize2,
  Zap,
  Sliders,
  Radio,
  Monitor,
  Flame,
} from 'lucide-react';

export function App() {
  const {
    metrics,
    hardware,
    ringBuffer,
    flightRecorder,
    isStuttering,
    stutterCount,
    snapshots,
    takeSnapshot,
    deleteSnapshot,
    resetCounters,
  } = useFrameProfiler();

  const [hudMode, setHudMode] = useState<'pill' | 'strip' | 'hidden'>('pill');
  const [isDeckOpen, setIsDeckOpen] = useState<boolean>(false);
  const [ambientEdgeEnabled, setAmbientEdgeEnabled] = useState<boolean>(true);
  const [targetFps, setTargetFps] = useState<number>(0);
  const [quickCopied, setQuickCopied] = useState<boolean>(false);

  // Global hotkeys (F2 or ~ to toggle Deck / cycle HUD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || e.key === '`' || e.key === '~') {
        e.preventDefault();
        setIsDeckOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isDeckOpen) {
        setIsDeckOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeckOpen]);

  const handleSetTargetFps = (fps: number) => {
    setTargetFps(fps);
    chaosEngine.updateSettings({ targetFpsCap: fps });
  };

  const handleCopyScorecard = () => {
    const snap = takeSnapshot('Quick Scorecard Copy');
    const scorecard = generateDiscordScorecard(snap);
    navigator.clipboard.writeText(scorecard);
    setQuickCopied(true);
    setTimeout(() => setQuickCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#05070C] text-[#F8FAFC] flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient Edge Mode Peripheral Border Glow */}
      <AmbientEdge
        enabled={ambientEdgeEnabled}
        metrics={metrics}
        isStuttering={isStuttering}
      />

      {/* Floating Tactical HUD: Pill or Graph Strip */}
      {hudMode === 'pill' && (
        <CompactPill
          metrics={metrics}
          isStuttering={isStuttering}
          onExpand={() => setIsDeckOpen(true)}
        />
      )}

      {hudMode === 'strip' && (
        <GraphStrip
          metrics={metrics}
          ringBuffer={ringBuffer}
          isStuttering={isStuttering}
          onExpand={() => setIsDeckOpen(true)}
          onSwitchPill={() => setHudMode('pill')}
        />
      )}

      {/* Main Command Bar Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#05070C]/90 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold font-mono-avionics text-white tracking-wider">
                  AVIONICS FPS // DEBUG SUITE
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono-avionics bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ACTIVE 0.05ms OVERHEAD
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono-avionics hidden sm:block">
                Sub-millisecond frame pacing · 1% Low radar · Black-box flight recorder · Fleet telemetry
              </p>
            </div>
          </div>

          {/* Quick Action Ribbon */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono-avionics">
            {/* HUD Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setHudMode('pill')}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  hudMode === 'pill' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pill HUD
              </button>
              <button
                type="button"
                onClick={() => setHudMode('strip')}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  hudMode === 'strip' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60' : 'text-slate-400 hover:text-white'
                }`}
              >
                Graph Strip
              </button>
              <button
                type="button"
                onClick={() => setHudMode('hidden')}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  hudMode === 'hidden' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hide
              </button>
            </div>

            {/* Ambient Edge Toggle */}
            <button
              type="button"
              onClick={() => setAmbientEdgeEnabled(!ambientEdgeEnabled)}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 ${
                ambientEdgeEnabled
                  ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ambient Edge {ambientEdgeEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Inject Hitch Test */}
            <button
              type="button"
              onClick={() => chaosEngine.injectInstantHitch(80)}
              className="px-3 py-1.5 rounded-lg bg-red-950/70 border border-red-800/80 text-red-200 hover:bg-red-900/90 transition-all flex items-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>Test Hitch (80ms)</span>
            </button>

            {/* Open Full Deck */}
            <button
              type="button"
              onClick={() => setIsDeckOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-cyan-600/25"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Diagnostic Deck (F2)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Real-time Hardware & Performance Quick Gauge Ribbon */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono-avionics text-xs">
          <div className="p-3 rounded-xl border border-slate-800 bg-[#0C101C]/80">
            <span className="text-[10px] text-slate-400 uppercase">Live FPS</span>
            <div className={`text-xl font-bold mt-0.5 ${metrics.currentFps < 30 ? 'text-red-400' : metrics.currentFps < 55 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {Math.round(metrics.currentFps)} <span className="text-[11px] font-normal text-slate-400">FPS</span>
            </div>
            <span className="text-[10px] text-slate-500">{metrics.currentFrameTimeMs.toFixed(1)}ms delta</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-[#0C101C]/80">
            <span className="text-[10px] text-amber-400 uppercase">1% Low (P99)</span>
            <div className="text-xl font-bold text-amber-300 mt-0.5">
              {Math.round(metrics.onePercentLowFps)} <span className="text-[11px] font-normal text-slate-400">FPS</span>
            </div>
            <span className="text-[10px] text-slate-500">{(1000 / (metrics.onePercentLowFps || 60)).toFixed(1)}ms frame</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-[#0C101C]/80">
            <span className="text-[10px] text-cyan-400 uppercase">0.1% Low</span>
            <div className="text-xl font-bold text-cyan-300 mt-0.5">
              {Math.round(metrics.pointOnePercentLowFps)} <span className="text-[11px] font-normal text-slate-400">FPS</span>
            </div>
            <span className="text-[10px] text-slate-500">Worst micro-hitches</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-[#0C101C]/80">
            <span className="text-[10px] text-emerald-400 uppercase">Stability Score</span>
            <div className="text-xl font-bold text-emerald-300 mt-0.5">
              {metrics.stabilityScore.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">{metrics.droppedFrames} dropped</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-[#0C101C]/80">
            <span className="text-[10px] text-slate-400 uppercase">Screen Refresh</span>
            <div className="text-xl font-bold text-white mt-0.5">
              {hardware?.screenRefreshRate || 60} <span className="text-[11px] font-normal text-slate-400">Hz</span>
            </div>
            <span className="text-[10px] text-slate-500">{hardware?.dpr}x Retina DPR</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-[#0C101C]/80">
            <span className="text-[10px] text-slate-400 uppercase">Hardware Engine</span>
            <div className="text-sm font-bold text-cyan-200 mt-1 truncate" title={hardware?.gpuRenderer}>
              {hardware?.gpuRenderer ? hardware.gpuRenderer.split('/')[0].slice(0, 16) : 'WebGL2'}
            </div>
            <span className="text-[10px] text-slate-500">{hardware?.cores || 8} Logical Cores</span>
          </div>
        </section>

        {/* Interactive Physics / Particle Simulation Playground */}
        <section className="relative">
          <ParticleSandbox />
        </section>

        {/* Quick Benchmark Passport Scorecard Section */}
        <section className="rounded-xl border border-slate-800 bg-[#0A0E1A] p-5 font-mono-avionics">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Instant Benchmark Passport &amp; Discord Scorecard</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Generates pre-formatted hardware and framerate passports for GitHub issues, Discord bug reports, and QA tickets.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyScorecard}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-600/80 text-emerald-300 hover:bg-emerald-900/90 transition-all flex items-center space-x-1.5 text-xs font-bold"
              >
                {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{quickCopied ? 'Scorecard Copied!' : 'Copy Discord Scorecard'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const snap = takeSnapshot('Live Snapshot');
                  const md = generateMarkdownPassport(snap);
                  navigator.clipboard.writeText(md);
                  setQuickCopied(true);
                  setTimeout(() => setQuickCopied(false), 2000);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 transition-colors flex items-center space-x-1.5 text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy GitHub Markdown</span>
              </button>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-[#05070C] border border-slate-800/80 text-slate-300 text-xs overflow-x-auto whitespace-pre font-mono">
            {generateDiscordScorecard({
              id: 'LIVE-SNAP',
              timestamp: new Date().toISOString(),
              hardware: hardware || {
                gpuRenderer: 'Detecting GPU Renderer...',
                cores: 8,
                screenRefreshRate: 60,
                dpr: 1,
                userAgent: navigator.userAgent,
                webglVersion: 'WebGL 2.0',
                maxTextureSize: 4096,
              },
              metrics,
              recentFrameHistory: ringBuffer.getLastN(120),
              longTaskLogs: flightRecorder.getLongTasks(),
              errorLogs: flightRecorder.getErrors(),
            })}
          </div>
        </section>
      </main>

      {/* Expanded Diagnostic Deck Viewport */}
      <DiagnosticDeck
        isOpen={isDeckOpen}
        onClose={() => setIsDeckOpen(false)}
        metrics={metrics}
        hardware={hardware}
        ringBuffer={ringBuffer}
        flightRecorder={flightRecorder}
        snapshots={snapshots}
        onTakeSnapshot={takeSnapshot}
        onDeleteSnapshot={deleteSnapshot}
        targetFps={targetFps}
        onSetTargetFps={handleSetTargetFps}
      />

      {/* Bottom Sticky Status Bar */}
      <footer className="border-t border-slate-800/80 bg-[#05070C] px-6 py-2.5 text-xs font-mono-avionics text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="text-cyan-400 font-semibold">Avionics Telemetry</span>
          <span>·</span>
          <span>Zero-overhead typed Float32Array ring buffer</span>
          <span>·</span>
          <span>PerformanceObserver active</span>
        </div>

        <div className="flex items-center space-x-3">
          <span>Stutter Events: <strong className="text-red-400">{stutterCount}</strong></span>
          <span>·</span>
          <span>Snapshots: <strong className="text-white">{snapshots.length}</strong></span>
          <span>·</span>
          <span className="text-slate-400">Toggle Deck: <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">F2</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">~</kbd></span>
        </div>
      </footer>
    </div>
  );
}

export default App;
