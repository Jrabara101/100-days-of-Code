import React from 'react';
import { Play, Pause, Zap, BookOpen, Clock, Check, ChevronRight } from 'lucide-react';
import { Episode } from '../types';
import { usePodcast } from '../context/PodcastContext';

interface EpisodeCardProps {
  episode: Episode;
  onSelectEpisodeStage: (episode: Episode) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({ episode, onSelectEpisodeStage }) => {
  const { 
    currentEpisode, 
    isPlaying, 
    playbackRate, 
    togglePlay, 
    playEpisode,
    playSample,
    isSampleMode,
    sampleRemainingSec
  } = usePodcast();

  const isCurrent = currentEpisode.id === episode.id;
  const isCardPlaying = isCurrent && isPlaying && !isSampleMode;
  const isSamplePlayingThisCard = isCurrent && isPlaying && isSampleMode;

  // Calculate speed-adjusted duration
  const adjustedSeconds = Math.round(episode.durationSec / playbackRate);
  const adjustedMins = Math.floor(adjustedSeconds / 60);

  // Guest speaker if any
  const guestSpeaker = episode.speakers.find(s => s.role === 'guest');

  return (
    <article
      className={`group relative p-5 rounded-2xl bg-[var(--canvas-console)] border transition-all duration-300 hover:border-amber-500/40 shadow-sm ${
        isCurrent 
          ? 'border-amber-500/50 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20' 
          : 'border-[var(--border-hairline)]'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        
        {/* Left Column: Artwork & Episode Badge */}
        <div className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-inner bg-neutral-900 border border-[var(--border-hairline)]">
          <img 
            src={episode.coverUrl} 
            alt={episode.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <span className="absolute bottom-1.5 left-1.5 font-mono-tabular text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-amber-400 border border-amber-500/30">
            EP {episode.number}
          </span>
          {isCardPlaying && (
            <div className="absolute top-1.5 right-1.5 flex gap-0.5 items-end h-3">
              <span className="w-0.5 h-3 bg-amber-400 animate-pulse" />
              <span className="w-0.5 h-2 bg-amber-400 animate-pulse delay-75" />
              <span className="w-0.5 h-3.5 bg-amber-400 animate-pulse delay-150" />
            </div>
          )}
        </div>

        {/* Center Content Stack */}
        <div className="flex-1 min-w-0">
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
            <span className="text-[var(--text-muted)] font-mono-tabular text-[11px]">
              {episode.publishDate}
            </span>
            <span className="text-[var(--border-hairline)]">•</span>

            {/* Speed-Adjusted Runtime Badge */}
            <span className="inline-flex items-center gap-1 font-mono-tabular text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/25">
              <Clock className="w-3 h-3 text-amber-500" />
              {adjustedMins}m {playbackRate > 1.0 ? `at ${playbackRate}x` : 'listen'}
            </span>

            {guestSpeaker && (
              <>
                <span className="text-[var(--border-hairline)]">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  w/ {guestSpeaker.name}
                </span>
              </>
            )}
          </div>

          {/* Episode Title */}
          <h3 
            onClick={() => onSelectEpisodeStage(episode)}
            className="font-display font-bold text-lg text-[var(--text-primary)] hover:text-amber-400 cursor-pointer transition-colors leading-tight mb-1 line-clamp-1"
          >
            {episode.title}
          </h3>

          {/* 2-Line Takeaway Summary */}
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-3">
            {episode.takeawaySummary}
          </p>

          {/* Interactive Chapter & Resource Micro-Pill Strip */}
          <div className="flex flex-wrap items-center gap-1.5">
            {episode.chapters.slice(1, 3).map((ch) => {
              const startMins = Math.floor(ch.startTimeSec / 60);
              const startSecs = (ch.startTimeSec % 60).toString().padStart(2, '0');
              return (
                <button
                  key={ch.id}
                  onClick={() => playEpisode(episode.id, ch.startTimeSec)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono-tabular bg-[var(--canvas-stage)] border border-[var(--border-hairline)] hover:border-amber-500/40 text-[var(--text-secondary)] hover:text-amber-400 transition-colors"
                  title={`Jump to chapter: ${ch.title}`}
                >
                  <span className="text-amber-500/80 font-semibold">{startMins}:{startSecs}</span>
                  <span className="truncate max-w-[140px]">{ch.title}</span>
                </button>
              );
            })}

            {episode.resources.length > 0 && (
              <button
                onClick={() => onSelectEpisodeStage(episode)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono-tabular bg-[var(--canvas-stage)] border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <BookOpen className="w-3 h-3 text-amber-500" />
                <span>{episode.resources.length} Links & Books</span>
              </button>
            )}
          </div>

        </div>

        {/* Right Action Column */}
        <div className="flex md:flex-col items-center gap-2.5 shrink-0 self-end md:self-center">
          
          {/* Primary Circular Play Button */}
          <button
            onClick={() => {
              if (isCardPlaying) {
                togglePlay();
              } else {
                playEpisode(episode.id, isCurrent ? undefined : 0);
              }
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/25 transition-transform duration-200 hover:scale-105 active:scale-95"
            title={isCardPlaying ? 'Pause Episode' : 'Play Full Episode'}
          >
            {isCardPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Signature 45s Peak Hook Sampler Button */}
          <button
            onClick={() => playSample(episode.id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-tabular font-bold border transition-all ${
              isSamplePlayingThisCard
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 ring-2 ring-rose-500/30'
                : 'glass-pill border-rose-500/40 text-rose-400 hover:bg-rose-500/15'
            }`}
            title="Sample the #1 peak insight before committing to full runtime"
          >
            {isSamplePlayingThisCard ? (
              <>
                {/* Circular Countdown Ring */}
                <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 -rotate-90">
                    <circle
                      cx="7"
                      cy="7"
                      r="5.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      className="opacity-20"
                    />
                    <circle
                      cx="7"
                      cy="7"
                      r="5.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={34.5}
                      strokeDashoffset={34.5 * (1 - sampleRemainingSec / 45)}
                      className="transition-all duration-300"
                    />
                  </svg>
                </div>
                <span>{sampleRemainingSec}s Hook</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current text-rose-400" />
                <span>⚡ 45s Peak Sample</span>
              </>
            )}
          </button>

        </div>

      </div>
    </article>
  );
};
