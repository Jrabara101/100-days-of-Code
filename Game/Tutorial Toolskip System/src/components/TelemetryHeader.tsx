import React from 'react';
import { PlaybackStatus, ReplayEventMarker, ReplayMetadata } from '../types/replay';
import { formatBytes, formatTime, getCategoryColor } from '../lib/utils';
import { Radio, HardDrive, Sparkles, Film, Gamepad2, Award } from 'lucide-react';
import { SAMPLE_REPLAYS } from '../game/SampleReplays';

interface TelemetryHeaderProps {
  status: PlaybackStatus;
  metadata: ReplayMetadata;
  activeMarker: ReplayEventMarker | null;
  memoryBytes: number;
  isLiveGameMode: boolean;
  onToggleLiveGameMode: () => void;
  onSelectSampleReplay: (key: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const TelemetryHeader: React.FC<TelemetryHeaderProps> = ({
  status,
  metadata,
  activeMarker,
  memoryBytes,
  isLiveGameMode,
  onToggleLiveGameMode,
  onSelectSampleReplay,
  onStartRecording,
  onStopRecording,
}) => {
  const isRecording = status === 'RECORDING';
  const memoryPct = Math.min(100, Math.round((memoryBytes / (1024 * 1024 * 8)) * 100)); // out of 8MB ring buffer

  return (
    <header className="w-full flex items-center justify-between px-5 py-3 bg-[#0E1424CC] backdrop-blur-xl border-b border-slate-800/80 z-30">
      {/* Left: Branding & Status Badge */}
      <div className="flex items-center gap-4">
        {/* Brand Logo & Rec Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 p-0.5 shadow-[0_0_15px_rgba(56,189,248,0.4)]">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <Film className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-extrabold text-sm tracking-wider text-slate-100">
                CYBER-BLACKBOX
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-cyan-400 rounded border border-slate-700">
                v1.0 MVP
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-[280px]">
              {metadata.gameTitle}
            </p>
          </div>
        </div>

        {/* Recording or Playback Capsule */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          {isRecording ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/60 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-rose-300">● REC LIVE STREAM</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-cyan-300">
                ▶ {status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Active Highlight / Climax Radar Callout */}
      <div className="flex items-center justify-center">
        {activeMarker ? (
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-lg transition-all transform scale-105 animate-pulse ${
              getCategoryColor(activeMarker.category).bg
            } ${getCategoryColor(activeMarker.category).border}`}
          >
            <Sparkles
              className="w-4 h-4"
              style={{ color: getCategoryColor(activeMarker.category).color }}
            />
            <span className="text-xs font-sans font-bold text-slate-100 tracking-wide">
              {activeMarker.label}
            </span>
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
              style={{
                backgroundColor: `${getCategoryColor(activeMarker.category).color}33`,
                color: getCategoryColor(activeMarker.category).color,
              }}
            >
              {activeMarker.category.toUpperCase()}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400">
            <span className="text-slate-500">AUTHOR:</span>
            <span className="text-slate-300 font-semibold">{metadata.authorName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">TICKS:</span>
            <span className="text-cyan-400 font-semibold">{metadata.totalTicks}</span>
          </div>
        )}
      </div>

      {/* Right: Mode Toggle, Memory Gauge & Replay Selector */}
      <div className="flex items-center gap-4">
        {/* Memory Buffer Meter */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex flex-col text-[10px] font-mono leading-tight">
            <span className="text-slate-400">RING BUFFER</span>
            <span className="text-cyan-300 font-bold">
              {formatBytes(memoryBytes)} ({memoryPct}%)
            </span>
          </div>
        </div>

        {/* Preloaded Match Selector */}
        {!isLiveGameMode && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <select
              defaultValue="clutch-solo"
              onChange={(e) => onSelectSampleReplay(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="clutch-solo" className="bg-slate-900">Match 1: Sector 7 Clutch</option>
              <option value="speedrun-pb" className="bg-slate-900">Match 2: Speedrun PB</option>
              <option value="ghost-rival" className="bg-slate-900">Match 3: Rival Run</option>
            </select>
          </div>
        )}

        {/* Live Gameplay vs Cinema Mode Switch */}
        <button
          onClick={onToggleLiveGameMode}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
            isLiveGameMode
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-cyan-600/30'
          }`}
        >
          {isLiveGameMode ? (
            <>
              <Gamepad2 className="w-4 h-4" />
              <span>LIVE PLAY MODE</span>
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              <span>THEATER MODE</span>
            </>
          )}
        </button>

        {/* Recording Toggle in Live Mode */}
        {isLiveGameMode && (
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isRecording
                ? 'bg-rose-950 border-rose-500 text-rose-300 hover:bg-rose-900'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRecording ? 'bg-rose-500 animate-ping' : 'bg-rose-500'
              }`}
            />
            <span>{isRecording ? 'STOP REC' : 'REC MATCH'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
