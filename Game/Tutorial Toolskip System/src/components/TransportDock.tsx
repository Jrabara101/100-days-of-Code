import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Repeat,
  Maximize2,
  ListOrdered,
  Scissors,
  Ghost,
  ShieldCheck,
} from 'lucide-react';

interface TransportDockProps {
  isPlaying: boolean;
  playbackSpeed: number;
  isLooping: boolean;
  isGhostEnabled: boolean;
  totalBookmarks: number;
  onTogglePlay: () => void;
  onStepFrame: (delta: number) => void;
  onJumpTime: (seconds: number) => void;
  onSetSpeed: (speed: number) => void;
  onToggleLoop: () => void;
  onToggleGhost: () => void;
  onOpenEvents: () => void;
  onOpenClipForge: () => void;
  onOpenVerifier: () => void;
  onToggleFullscreen: () => void;
}

const SPEED_OPTIONS = [0.1, 0.25, 0.5, 1.0, 1.5, 2.0];

export const TransportDock: React.FC<TransportDockProps> = ({
  isPlaying,
  playbackSpeed,
  isLooping,
  isGhostEnabled,
  totalBookmarks,
  onTogglePlay,
  onStepFrame,
  onJumpTime,
  onSetSpeed,
  onToggleLoop,
  onToggleGhost,
  onOpenEvents,
  onOpenClipForge,
  onOpenVerifier,
  onToggleFullscreen,
}) => {
  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'KeyJ':
          e.preventDefault();
          onJumpTime(-5);
          break;
        case 'KeyL':
          e.preventDefault();
          onJumpTime(5);
          break;
        case 'Comma': // [,]
          e.preventDefault();
          onStepFrame(-1);
          break;
        case 'Period': // [.]
          e.preventDefault();
          onStepFrame(1);
          break;
        case 'KeyG':
          e.preventDefault();
          onToggleGhost();
          break;
        case 'KeyM':
          e.preventDefault();
          onToggleLoop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onJumpTime, onStepFrame, onToggleGhost, onToggleLoop]);

  return (
    <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-xl shadow-2xl">
      {/* Left Action Cluster: Mode and Speed */}
      <div className="flex items-center gap-3">
        {/* Speed Selector Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-sans text-[11px]">RATE:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => onSetSpeed(parseFloat(e.target.value))}
            className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
          >
            {SPEED_OPTIONS.map((speed) => (
              <option key={speed} value={speed} className="bg-slate-900 text-slate-200">
                {speed.toFixed(speed < 1 ? 2 : 1)}x
              </option>
            ))}
          </select>
        </div>

        {/* Ghost Toggle Button */}
        <button
          onClick={onToggleGhost}
          title="Toggle Ghost Echo Comparative Layer [G]"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isGhostEnabled
              ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Ghost className={`w-3.5 h-3.5 ${isGhostEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span>GHOST ECHO</span>
          <span className="text-[10px] font-mono text-cyan-400/80">[G]</span>
        </button>

        {/* Loop Toggle */}
        <button
          onClick={onToggleLoop}
          title="Toggle Loop Segment [M]"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isLooping
              ? 'bg-sky-950/60 border-sky-500/50 text-sky-300'
              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'text-sky-400' : 'text-slate-500'}`} />
          <span>LOOP</span>
        </button>
      </div>

      {/* Center Transport Cluster: Main playback controls */}
      <div className="flex items-center gap-2">
        {/* Jump -5s */}
        <button
          onClick={() => onJumpTime(-5)}
          title="Jump -5 Seconds [J]"
          className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Step Backward 1 Frame */}
        <button
          onClick={() => onStepFrame(-1)}
          title="Step Backward Frame [,]"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Main Play / Pause Button */}
        <button
          onClick={onTogglePlay}
          title="Play / Pause [Space]"
          className={`p-3 rounded-full text-slate-950 font-bold transition-all transform active:scale-95 shadow-lg ${
            isPlaying
              ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/30'
              : 'bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/40'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-slate-950" />
          ) : (
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          )}
        </button>

        {/* Step Forward 1 Frame */}
        <button
          onClick={() => onStepFrame(1)}
          title="Step Forward Frame [.]"
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Jump +5s */}
        <button
          onClick={() => onJumpTime(5)}
          title="Jump +5 Seconds [L]"
          className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Right Action Cluster: Events, Clip Forge, Anti-Tamper & Fullscreen */}
      <div className="flex items-center gap-2">
        {/* Event Log Trigger */}
        <button
          onClick={onOpenEvents}
          title="Open Chronological Event Feed"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors"
        >
          <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
          <span>EVENTS</span>
          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[10px] rounded font-mono font-bold">
            {totalBookmarks}
          </span>
        </button>

        {/* Clip Forge / Trimming Dialog */}
        <button
          onClick={onOpenClipForge}
          title="Open Clip Forge & Export Dialog"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-950/70 hover:bg-sky-900/80 border border-sky-500/40 rounded-lg text-xs font-semibold text-sky-200 transition-colors shadow-sm"
        >
          <Scissors className="w-3.5 h-3.5 text-sky-400" />
          <span>CLIP FORGE</span>
        </button>

        {/* Anti-Tamper Verifier Trigger */}
        <button
          onClick={onOpenVerifier}
          title="Run Server-Authoritative Anti-Tamper Verifier"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/40 rounded-lg text-xs font-medium text-emerald-300 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>VERIFY</span>
        </button>

        {/* Fullscreen Trigger */}
        <button
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
