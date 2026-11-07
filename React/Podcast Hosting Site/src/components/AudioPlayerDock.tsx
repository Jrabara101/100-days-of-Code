import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  FastForward, 
  Zap, 
  Scissors, 
  Check, 
  Radio, 
  Maximize2 
} from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';
import { PlaybackSpeed } from '../types';

export const AudioPlayerDock: React.FC = () => {
  const { 
    currentEpisode, 
    currentTime, 
    duration, 
    isPlaying, 
    togglePlay, 
    seekTo, 
    playbackRate, 
    setPlaybackRate, 
    volume, 
    setVolume, 
    isMuted, 
    toggleMute, 
    activeChapter, 
    skipIntro, 
    isSampleMode, 
    sampleRemainingSec, 
    stopSampleAndPlayFull,
    addToVault,
    setActiveAudiogramClip,
    setIsAudiogramModalOpen
  } = usePodcast();

  const [hoveredWaveform, setHoveredWaveform] = useState<{
    x: number;
    pct: number;
    timestampSec: number;
    chapterTitle: string;
    transcriptSnippet: string;
  } | null>(null);

  const [bookmarkedToast, setBookmarkedToast] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);

  // Speed options
  const speeds: PlaybackSpeed[] = [1.0, 1.25, 1.5, 2.0];
  const nextSpeedIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
  const cycleSpeed = () => setPlaybackRate(speeds[nextSpeedIndex]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isWithinIntroBanter = currentTime < currentEpisode.introBanterEndSec;

  // Waveform Bar Hover & Scrub
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    const hoveredSec = pct * duration;

    // Find chapter for hovered second
    const matchChapter = currentEpisode.chapters.find(
      ch => hoveredSec >= ch.startTimeSec && hoveredSec < ch.endTimeSec
    ) || currentEpisode.chapters[0];

    // Find 5-word transcript preview
    let snippet = "Insights & tactical conversation...";
    for (const blk of currentEpisode.transcript) {
      if (hoveredSec >= blk.startTimeSec && hoveredSec <= blk.endTimeSec) {
        snippet = blk.text.split(' ').slice(0, 6).join(' ') + '...';
        break;
      }
    }

    setHoveredWaveform({
      x,
      pct,
      timestampSec: hoveredSec,
      chapterTitle: matchChapter ? matchChapter.title : 'Overview',
      transcriptSnippet: snippet
    });
  };

  const handleClickWaveform = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    seekTo(pct * duration);
  };

  const handleBookmarkMoment = () => {
    addToVault({
      episodeId: currentEpisode.id,
      episodeTitle: currentEpisode.title,
      speakerName: currentEpisode.speakers[0]?.name || 'Host',
      quoteText: `Bookmarked timestamp at ${formatTime(currentTime)} during "${activeChapter?.title || 'Chapter'}"`,
      startTimeSec: Math.max(0, currentTime - 15),
      endTimeSec: Math.min(duration, currentTime + 15),
      tags: ['Bookmarked Moment']
    });
    setBookmarkedToast(true);
    setTimeout(() => setBookmarkedToast(false), 2000);
  };

  // Generate 80 waveform bars for high fidelity
  const numBars = 80;
  const heatmap = currentEpisode.heatmap || [];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 h-[88px] glass-dock px-4 sm:px-7 flex items-center justify-between gap-4 select-none shadow-2xl transition-colors">
      
      {/* Toast Bookmark Notification */}
      {bookmarkedToast && (
        <div className="absolute -top-12 left-8 z-50 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shadow-lg flex items-center gap-1.5 animate-fadeIn">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Moment bookmarked to Vault!</span>
        </div>
      )}

      {/* LEFT ZONE: Now Playing Identity (25% width) */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[190px] max-w-[340px]">
        <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-md bg-neutral-900 border border-[var(--border-hairline)]">
          <img 
            src={currentEpisode.coverUrl} 
            alt={currentEpisode.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono-tabular text-[10px] uppercase font-bold text-amber-500 truncate">
              EP.{currentEpisode.number}
            </span>
            <span className="text-[var(--text-muted)] text-[10px]">•</span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono-tabular truncate">
              {activeChapter ? activeChapter.title : 'Overview'}
            </span>
          </div>

          <h4 className="font-display font-bold text-xs sm:text-sm text-[var(--text-primary)] truncate leading-snug">
            {currentEpisode.title}
          </h4>

          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={handleBookmarkMoment}
              className="text-[11px] text-[var(--text-muted)] hover:text-amber-500 flex items-center gap-1 transition-colors"
              title="Bookmark this moment to Listening Vault"
            >
              <Bookmark className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">Bookmark</span>
            </button>
          </div>
        </div>
      </div>

      {/* CENTER ZONE: Tactile Transport & Interactive Waveform (50% width) */}
      <div className="flex-1 max-w-2xl flex flex-col items-center justify-center gap-1.5 px-2 sm:px-6">
        
        {/* Top: Transport Controls & Skip Intro Pill */}
        <div className="flex items-center justify-center gap-4">
          
          {/* -15s Rewind */}
          <button
            onClick={() => seekTo(Math.max(0, currentTime - 15))}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            title="Rewind 15 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Primary Circular Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/30 transition-transform duration-200 hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* +30s Fast Forward */}
          <button
            onClick={() => seekTo(Math.min(duration, currentTime + 30))}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
            title="Fast Forward 30 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Dynamic Skip Banter / Intro Button */}
          {isWithinIntroBanter && (
            <button
              onClick={skipIntro}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono-tabular font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-sm"
              title="Skip intro banter and jump to main discussion"
            >
              <FastForward className="w-3 h-3" />
              <span>Skip Banter ({formatTime(currentEpisode.introBanterEndSec)})</span>
            </button>
          )}

          {/* 45s Hook Sample State Indicator */}
          {isSampleMode && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono-tabular text-[11px] font-bold">
              <Zap className="w-3 h-3 fill-current text-rose-400 animate-pulse" />
              <span>45s Sample ({sampleRemainingSec}s)</span>
              <button
                onClick={stopSampleAndPlayFull}
                className="underline hover:text-white ml-1 font-semibold"
              >
                Continue Full
              </button>
            </div>
          )}

        </div>

        {/* Waveform Scrubber & Heatmap Track */}
        <div className="w-full flex items-center gap-3">
          
          {/* Current Timecode */}
          <span className="font-mono-tabular text-[11px] text-[var(--text-muted)] w-10 text-right">
            {formatTime(currentTime)}
          </span>

          {/* Interactive Waveform Well */}
          <div 
            ref={waveformRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredWaveform(null)}
            onClick={handleClickWaveform}
            className="relative flex-1 h-8 cursor-pointer flex items-center justify-between group py-1"
          >
            {/* Background Base Bar & Heatmap Glow */}
            <div className="absolute inset-0 flex items-center justify-between gap-[2px] pointer-events-none">
              {Array.from({ length: numBars }).map((_, i) => {
                const barPct = (i / numBars) * 100;
                const isPlayed = barPct <= progressPercent;
                
                // Sample heatmap intensity
                const heatmapIndex = Math.floor((i / numBars) * heatmap.length);
                const heatScore = heatmap[heatmapIndex] || 0.2;
                const isHeatPeak = heatScore > 0.8;

                // Varied organic bar height
                const heightPct = 25 + Math.sin(i * 0.4) * 20 + (heatScore * 40);

                return (
                  <div
                    key={i}
                    style={{ height: `${Math.min(100, Math.max(15, heightPct))}%` }}
                    className={`w-[2.5px] rounded-full transition-all duration-150 waveform-bar ${
                      isPlayed
                        ? isHeatPeak
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(251,113,133,0.8)]'
                          : 'bg-amber-500'
                        : isHeatPeak
                          ? 'bg-rose-500/35'
                          : 'bg-neutral-600/40 group-hover:bg-neutral-500/50'
                    }`}
                  />
                );
              })}
            </div>

            {/* Chapter Hairline Dividers on Waveform */}
            {currentEpisode.chapters.map(ch => {
              const chPct = (ch.startTimeSec / duration) * 100;
              return (
                <div 
                  key={ch.id}
                  style={{ left: `${chPct}%` }}
                  className="absolute top-0 bottom-0 w-[1.5px] bg-white/20 pointer-events-none"
                  title={ch.title}
                />
              );
            })}

            {/* Hover Tooltip Pill */}
            {hoveredWaveform && (
              <div
                style={{ left: `${hoveredWaveform.x}px` }}
                className="absolute -top-14 -translate-x-1/2 pointer-events-none glass-modal px-2.5 py-1.5 rounded-xl border border-amber-500/40 shadow-xl whitespace-nowrap z-50 text-left animate-fadeIn"
              >
                <div className="flex items-center gap-1.5 font-mono-tabular text-[10px] font-bold text-amber-400">
                  <span>{formatTime(hoveredWaveform.timestampSec)}</span>
                  <span>•</span>
                  <span className="truncate max-w-[120px]">{hoveredWaveform.chapterTitle}</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 max-w-[180px]">
                  "{hoveredWaveform.transcriptSnippet}"
                </p>
              </div>
            )}
          </div>

          {/* Total Duration Timecode */}
          <span className="font-mono-tabular text-[11px] text-[var(--text-muted)] w-10">
            {formatTime(duration)}
          </span>
        </div>

      </div>

      {/* RIGHT ZONE: Utility & Speed Controls (25% width) */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[190px] max-w-[340px]">
        
        {/* Speed Cycle Monospace Button */}
        <button
          onClick={cycleSpeed}
          className="font-mono-tabular text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--canvas-stage)] border border-[var(--border-hairline)] hover:border-amber-500/50 text-amber-500 transition-colors"
          title="Cycle Playback Speed"
        >
          {playbackRate.toFixed(playbackRate === 1.0 ? 1 : 2)}x
        </button>

        {/* Volume Slider with Mute Button */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-[var(--canvas-stage)] rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

      </div>

    </footer>
  );
};
