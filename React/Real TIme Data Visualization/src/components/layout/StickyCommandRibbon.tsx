import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { PerspectiveLens } from '../../types/telemetry';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Sun,
  Moon,
  Sparkles,
  Zap,
  PlusCircle,
  Clock,
  Layers,
  ChevronDown
} from 'lucide-react';

export const StickyCommandRibbon: React.FC = () => {
  const {
    perspectiveLens,
    setPerspectiveLens,
    isStreaming,
    toggleStreaming,
    speed,
    setSpeed,
    playbackMode,
    setPlaybackMode,
    dvrPosition,
    setDvrPosition,
    rewindMinutes,
    timeWindowMinutes,
    setTimeWindowMinutes,
    theme,
    toggleTheme,
    setIsSinceLastCheckedOpen,
    injectNewEvent,
    isInspectionLocked,
    bufferedTicksCount
  } = useTelemetry();

  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  const [injectTitle, setInjectTitle] = useState('Flash Sale Promo Launch');
  const [injectCategory, setInjectCategory] = useState<'marketing' | 'deploy' | 'infrastructure'>('marketing');

  const lenses: { id: PerspectiveLens; label: string; icon: string }[] = [
    { id: 'executive', label: '60s Executive Pulse', icon: '☕' },
    { id: 'live_ops', label: 'Live Operations & Radar', icon: '📡' },
    { id: 'analyst', label: 'Analyst Deep-Dive', icon: '🔬' }
  ];

  const windows = [
    { mins: 15, label: '15m' },
    { mins: 60, label: '1h' },
    { mins: 240, label: '4h' },
    { mins: 1440, label: '24h' }
  ];

  const handleInjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!injectTitle.trim()) return;
    injectNewEvent(
      injectTitle.trim(),
      injectCategory,
      injectCategory === 'infrastructure' ? 'api_latency' : 'checkout_velocity'
    );
    setIsInjectModalOpen(false);
    setInjectTitle('');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#11141B]/90 dark:bg-[#11141B]/90 border-b border-white/[0.08] transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left Zone: Branding & Perspective Lenses */}
        <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-glow-cyan text-white font-bold font-mono text-sm">
              LT
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Luminous Telemetry
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Real-Time Analytical Engine
              </div>
            </div>
          </div>

          {/* Perspective Lens Switcher */}
          <div className="flex items-center bg-[#171B24] p-1 rounded-xl border border-white/5 text-xs font-medium">
            {lenses.map((lens) => (
              <button
                key={lens.id}
                onClick={() => setPerspectiveLens(lens.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  perspectiveLens === lens.id
                    ? 'bg-sky-500/20 text-sky-200 font-semibold shadow-sm border border-sky-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{lens.icon}</span>
                <span className="hidden lg:inline">{lens.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center Zone: Live Stream Controller & DVR Scrubber */}
        <div className="hidden sm:flex items-center gap-2.5 bg-[#171B24]/90 px-3 py-1.5 rounded-full border border-white/[0.08] shadow-inner">
          {/* Live / Paused Status Indicator */}
          <button
            onClick={() => {
              if (playbackMode === 'dvr') {
                setPlaybackMode('live');
                setDvrPosition(100);
              } else {
                toggleStreaming();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2 py-0.5 rounded-full transition-all"
            title="Toggle Live Stream or Return to Head"
          >
            {playbackMode === 'live' && isStreaming && !isInspectionLocked ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold">LIVE</span>
                <span className="text-[10px] text-slate-400 hidden xl:inline">• 1s ticks</span>
              </div>
            ) : isInspectionLocked ? (
              <div className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>INSPECTING</span>
                <span className="text-[10px] text-amber-400/80">(+{bufferedTicksCount})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>DVR PAUSED</span>
              </div>
            )}
          </button>

          <span className="w-px h-4 bg-white/10" />

          {/* DVR Timeline Scrubber */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-[10px]">T-30m</span>
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={playbackMode === 'live' ? 100 : dvrPosition}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPlaybackMode('dvr');
                setDvrPosition(val);
              }}
              className="w-28 sm:w-36 accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-full"
              title="Scrub historical timeline"
            />
            <span className="text-[10px] text-sky-400 font-semibold">
              {playbackMode === 'live' ? 'Now' : `-${Math.round((1 - dvrPosition / 100) * 30)}m`}
            </span>
          </div>

          <span className="w-px h-4 bg-white/10" />

          {/* Quick Rewind 15m button */}
          <button
            onClick={() => rewindMinutes(15)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            title="Rewind 15 minutes"
          >
            <RotateCcw size={11} />
            <span className="hidden xl:inline">Rewind 15m</span>
          </button>

          {/* Speed Selector (1x, 2x, 5x) */}
          <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/5 text-[10px] font-mono">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded ${
                  speed === s ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Time Window quick pills */}
          <div className="hidden lg:flex items-center gap-1 border-l border-white/10 pl-2">
            {windows.map((w) => (
              <button
                key={w.mins}
                onClick={() => setTimeWindowMinutes(w.mins)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  timeWindowMinutes === w.mins
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Zone: Shift Highlights, Event Injection, Theme */}
        <div className="flex items-center gap-2">
          {/* Shifts Since Last Checked Drawer Trigger */}
          <button
            onClick={() => setIsSinceLastCheckedOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 border border-sky-400/30 transition-all shadow-glow-cyan"
            title="View shifts since your last visit"
          >
            <Sparkles size={13} className="text-sky-400" />
            <span className="hidden sm:inline">3 Shifts Today</span>
          </button>

          {/* Inject Event Trigger */}
          <button
            onClick={() => setIsInjectModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#171B24] hover:bg-[#202532] text-slate-200 border border-white/10 transition-all"
            title="Simulate Event or Anomaly"
          >
            <PlusCircle size={13} className="text-amber-400" />
            <span className="hidden md:inline">+ Inject Event</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-white/5"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* Inject Event Modal Overlay */}
      {isInjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#11141B] border border-white/10 p-6 shadow-glass space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-sky-300">
                <Zap size={16} /> Simulate Causal Event & Telemetry Shift
              </h3>
              <button
                onClick={() => setIsInjectModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInjectSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Event Title / Milestone:</label>
                <input
                  type="text"
                  value={injectTitle}
                  onChange={(e) => setInjectTitle(e.target.value)}
                  placeholder="e.g. Flash Promo Blast, Deploy v2.5, Cloudflare Spike"
                  className="w-full bg-[#171B24] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400 font-sans"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Event Category:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'marketing', label: 'Marketing' },
                    { id: 'deploy', label: 'Deploy' },
                    { id: 'infrastructure', label: 'Infra Incident' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setInjectCategory(cat.id as any)}
                      className={`py-2 px-3 rounded-lg border text-center transition-all ${
                        injectCategory === cat.id
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400/40 font-semibold'
                          : 'bg-[#171B24] text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
                ⚡ Injecting this event will generate an on-timeline Causal Event Pin and simulate an immediate metric spike with root-cause driver attribution.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInjectModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-glow-cyan"
                >
                  Inject Event Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
