import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioAnalyzer } from '@/audio/useAudioAnalyzer';
import { formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Disc3, Activity, Zap, Sparkles, Music, SlidersHorizontal, Play, Pause } from 'lucide-react';

export const TopHeaderHud: React.FC = () => {
  const {
    trackMeta,
    gameStatus,
    audioMetrics,
    setLoaderOpen,
    setSettingsOpen,
  } = useGameStore();

  const { togglePlay } = useAudioAnalyzer();

  const isPlaying = gameStatus === 'PLAYING';
  const progressPercent =
    trackMeta.duration > 0
      ? Math.min(100, (trackMeta.currentTime / trackMeta.duration) * 100)
      : 0;

  const statusVariants: Record<string, 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate'> = {
    READY: 'emerald',
    PLAYING: 'cyan',
    PAUSED: 'amber',
    GAME_OVER: 'rose',
    LOADING_TRACK: 'amber',
    IDLE: 'slate',
  };

  return (
    <header className="relative z-20 w-full px-6 pt-4 flex flex-col items-center pointer-events-none">
      {/* Top Scrubber Progress Bar */}
      <div
        className="w-full max-w-5xl h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/80 mb-3 pointer-events-auto cursor-pointer relative group"
        title="Track Progress"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 transition-all duration-100 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Dynamic beat markers */}
        <div className="absolute inset-0 flex justify-between pointer-events-none px-4 opacity-30">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="w-0.5 h-full bg-cyan-400" />
          ))}
        </div>
      </div>

      {/* Top Capsule Control Deck */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-surface/90 border border-cyan-500/20 backdrop-blur-xl rounded-2xl px-5 py-2.5 shadow-glass pointer-events-auto">
        {/* Left: Track Meta */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <Disc3
              className={`w-5 h-5 text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '4s' }}
            />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-slate-100 uppercase truncate max-w-[220px] sm:max-w-xs">
                {trackMeta.title}
              </span>
              <Badge variant={statusVariants[gameStatus] || 'slate'}>
                {gameStatus === 'PLAYING' ? 'LIVE' : gameStatus}
              </Badge>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono mt-0.5">
              <span>
                {formatTime(trackMeta.currentTime)} / {formatTime(trackMeta.duration)}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400/90 font-medium">44.1 kHz • 2048 FFT</span>
            </div>
          </div>
        </div>

        {/* Center: Audio Telemetry Pills (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4">
          {/* BPM */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">BPM</span>
            <span className="text-xs font-bold text-cyan-300">{audioMetrics.bpm}</span>
          </div>

          {/* Sub-Bass */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-rose-500/20 font-mono">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] text-slate-400">SUB-BASS</span>
            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all duration-75"
                style={{ width: `${Math.min(100, audioMetrics.bassIntensity * 180)}%` }}
              />
            </div>
          </div>

          {/* Treble */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-amber-500/20 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-slate-400">TREBLE</span>
            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${Math.min(100, audioMetrics.trebleIntensity * 200)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLoaderOpen(true)}
            title="Audio Loader Pipeline"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TRACKS</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            title="Telemetry & Graphics Settings"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-300 hover:text-white" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{gameStatus === 'PAUSED' ? 'RESUME' : 'START RUN'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
