import React, { useRef, useEffect } from 'react';
import { useReader } from '../context/ReaderContext';
import { Play, Pause, X, Maximize2, Compass, Volume2, Film } from 'lucide-react';
import { getArticleById } from '../services/editorialEngine';

interface VideoPlayerPipProps {
  onScrollToCurrentChapter: (headingId: string) => void;
}

export const VideoPlayerPip: React.FC<VideoPlayerPipProps> = ({ onScrollToCurrentChapter }) => {
  const { pip, closePipVideo, setPipPlaying, setPipTime, settings } = useReader();
  const videoRef = useRef<HTMLVideoElement>(null);

  const article = pip.articleId ? getArticleById(pip.articleId) : null;
  const videoMeta = article?.videoMetadata;

  useEffect(() => {
    if (!videoRef.current) return;
    if (pip.isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [pip.isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (Math.abs(videoRef.current.currentTime - pip.currentTime) > 2) {
      videoRef.current.currentTime = pip.currentTime;
    }
  }, [pip.currentTime]);

  if (!pip.isActive || !videoMeta) return null;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPipTime(videoRef.current.currentTime);
    }
  };

  const handleTogglePlay = () => {
    setPipPlaying(!pip.isPlaying);
  };

  // Find active chapter based on current time
  const activeChapter = [...videoMeta.chapters]
    .reverse()
    .find((c) => pip.currentTime >= c.timestampSec) || videoMeta.chapters[0];

  return (
    <aside
      aria-label="Companion video player"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-72 sm:w-80 rounded-xl overflow-hidden shadow-2xl border border-black/20 dark:border-white/20 bg-black text-white animate-slide-up"
    >
      {/* Video Container */}
      <div className="relative aspect-video bg-neutral-900 group">
        <video
          ref={videoRef}
          src={videoMeta.videoUrl}
          poster={videoMeta.posterUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPipPlaying(false)}
          className="w-full h-full object-cover"
          playsInline
        />

        {/* Video Overlay Controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-[10px] font-mono-tabular bg-purple-600/80 px-2 py-0.5 rounded-full font-bold">
              <Film className="w-2.5 h-2.5" />
              PIP STREAM
            </span>
            <button
              onClick={closePipVideo}
              title="Close mini-player"
              className="p-1 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center Play Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTogglePlay}
              className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center hover:scale-105 transition-transform"
            >
              {pip.isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ml-0.5" />
              )}
            </button>
          </div>

          {/* Bottom Bar: Time and Sync */}
          <div className="flex items-center justify-between text-[11px] font-mono-tabular">
            <span>
              {Math.floor(pip.currentTime / 60)}:
              {Math.floor(pip.currentTime % 60).toString().padStart(2, '0')} /{' '}
              {videoMeta.durationFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* Chapter & Sync Bar */}
      <div className="p-3 bg-neutral-900 border-t border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-mono-tabular text-purple-400 font-bold uppercase truncate">
            {activeChapter.timestampFormatted} • {activeChapter.title}
          </div>
          <div className="text-[11px] opacity-70 truncate">{article?.title}</div>
        </div>

        {/* Sync Scroll to Video Button */}
        <button
          onClick={() => onScrollToCurrentChapter(activeChapter.headingId)}
          title="Scroll article prose to match current video section"
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Compass className="w-3 h-3" />
          <span>Sync</span>
        </button>
      </div>
    </aside>
  );
};
