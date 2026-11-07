import React from 'react';
import { Coffee, Train, Brain, Layers, Gauge, Clock } from 'lucide-react';
import { usePodcast } from '../context/PodcastContext';
import { CommuteFilterType, PlaybackSpeed } from '../types';

export const CommuteFilterBar: React.FC = () => {
  const { 
    commuteFilter, 
    setCommuteFilter, 
    playbackRate, 
    setPlaybackRate,
    episodes 
  } = usePodcast();

  const speedOptions: PlaybackSpeed[] = [1.0, 1.25, 1.5, 2.0];

  // Calculate dynamic finish time for current queue / selected filter
  const filteredEpisodes = episodes.filter(ep => {
    if (commuteFilter === 'all') return true;
    return ep.commuteCategory === commuteFilter;
  });

  const totalFilteredSec = filteredEpisodes.reduce((acc, ep) => acc + (ep.durationSec / playbackRate), 0);
  const now = new Date();
  const finishTime = new Date(now.getTime() + totalFilteredSec * 1000);
  const formattedFinishTime = finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full glass-dock border-y border-[var(--border-hairline)] px-4 sm:px-8 py-3 transition-all">
      <div className="max-w-[1380px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left: Commute Window Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-mono-tabular uppercase tracking-wider text-[var(--text-muted)] font-semibold mr-2 shrink-0 hidden sm:inline">
            Commute Filter:
          </span>

          <button
            onClick={() => setCommuteFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              commuteFilter === 'all'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm shadow-amber-500/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Catalog</span>
          </button>

          <button
            onClick={() => setCommuteFilter('break')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              commuteFilter === 'break'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm shadow-amber-500/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-hairline)]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-emerald-400" />
            <span>☕ 15-Min Coffee Break</span>
            <span className="font-mono-tabular text-[10px] opacity-80">
              ({Math.round(15 / playbackRate)}m @ {playbackRate}x)
            </span>
          </button>

          <button
            onClick={() => setCommuteFilter('commute')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              commuteFilter === 'commute'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm shadow-amber-500/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-hairline)]'
            }`}
          >
            <Train className="w-3.5 h-3.5 text-blue-400" />
            <span>🚇 30-Min Commute</span>
            <span className="font-mono-tabular text-[10px] opacity-80">
              ({Math.round(30 / playbackRate)}m @ {playbackRate}x)
            </span>
          </button>

          <button
            onClick={() => setCommuteFilter('deep-dive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
              commuteFilter === 'deep-dive'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm shadow-amber-500/20'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-[var(--border-hairline)]'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>🧠 Deep-Dive Conversation</span>
            <span className="font-mono-tabular text-[10px] opacity-80">
              (45m+ @ {playbackRate}x)
            </span>
          </button>
        </div>

        {/* Right: Dynamic Speed Recalculator & Finish Clock */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
          
          {/* Finish By Clock Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-mono-tabular">
            <Clock className="w-3.5 h-3.5 text-amber-500/70" />
            <span>Finish queue by: <strong className="text-[var(--text-primary)]">{formattedFinishTime}</strong></span>
          </div>

          {/* Speed Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--canvas-stage)] border border-[var(--border-hairline)]">
            <div className="flex items-center gap-1 px-2 text-[10px] font-mono-tabular text-[var(--text-muted)] uppercase tracking-wider">
              <Gauge className="w-3 h-3 text-amber-500" />
              <span>Speed:</span>
            </div>
            {speedOptions.map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackRate(speed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-tabular font-bold transition-all ${
                  playbackRate === speed
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                }`}
              >
                {speed.toFixed(speed === 1.0 ? 1 : 2)}x
              </button>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
