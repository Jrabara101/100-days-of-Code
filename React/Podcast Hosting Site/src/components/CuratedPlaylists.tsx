import React from 'react';
import { Play, Sparkles, Compass, Clock, CheckCircle2 } from 'lucide-react';
import { MOCK_CURATED_PLAYLISTS } from '../data/mockPodcastData';
import { usePodcast } from '../context/PodcastContext';

export const CuratedPlaylists: React.FC = () => {
  const { playEpisode, playbackRate, currentEpisode } = usePodcast();

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-500" />
          <h2 className="font-display font-bold text-sm tracking-tight text-[var(--text-primary)] uppercase">
            Curated Onboarding Tracks
          </h2>
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
            — Zero-friction entry points into our back-catalog
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_CURATED_PLAYLISTS.map((playlist) => {
          const speedAdjustedMins = Math.round((playlist.totalDurationSec / playbackRate) / 60);
          const isCurrentlyActive = playlist.episodeIds.includes(currentEpisode.id);

          return (
            <div
              key={playlist.id}
              className={`group relative p-5 rounded-2xl bg-[var(--canvas-console)] border transition-all duration-300 hover:border-amber-500/40 hover:-translate-y-0.5 shadow-sm ${
                isCurrentlyActive 
                  ? 'border-amber-500/40 shadow-amber-500/5 ring-1 ring-amber-500/20' 
                  : 'border-[var(--border-hairline)]'
              }`}
            >
              {/* Header Badge & Duration */}
              <div className="flex items-center justify-between mb-3">
                <span 
                  className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${playlist.accentColor}18`,
                    color: playlist.accentColor,
                    border: `1px solid ${playlist.accentColor}33`
                  }}
                >
                  {playlist.badge}
                </span>

                <div className="flex items-center gap-1 text-[11px] font-mono-tabular text-[var(--text-muted)]">
                  <Clock className="w-3 h-3 text-amber-500/70" />
                  <span>
                    {speedAdjustedMins}m @ {playbackRate}x
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h3 className="font-display font-bold text-base text-[var(--text-primary)] group-hover:text-amber-400 transition-colors mb-1.5 leading-snug">
                {playlist.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                {playlist.subtitle}
              </p>

              {/* Action Trigger */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-hairline)]">
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{playlist.episodeIds.length} Curated Tracks</span>
                </div>

                <button
                  onClick={() => playEpisode(playlist.episodeIds[0], 0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-sm group-hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Track</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
