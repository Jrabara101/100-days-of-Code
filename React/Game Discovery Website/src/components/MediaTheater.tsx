import React, { useState, useRef } from 'react';
import { Play, Pause, Maximize, Film, Image as ImageIcon } from 'lucide-react';
import { GameTitle, MediaChapter } from '../types/game';
import { cn } from '../lib/utils';

export interface MediaTheaterProps {
  game: GameTitle;
}

export function MediaTheater({ game }: MediaTheaterProps) {
  const [activeMedia, setActiveMedia] = useState<{ type: 'video' | 'image'; url: string }>({
    type: 'video',
    url: game.media.microTrailerWebmUrl,
  });
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  const chapters: MediaChapter[] = game.media.chapters && game.media.chapters.length > 0
    ? game.media.chapters
    : [
        { time: 0, title: 'Combat Loop', label: 'Primary mechanics' },
        { time: 12, title: 'Boss Encounter', label: 'Endgame encounters' },
        { time: 24, title: 'UI & Inventory', label: 'Build crafting' },
      ];

  const handleChapterJump = (time: number, index: number) => {
    setActiveChapterIndex(index);
    setActiveMedia({ type: 'video', url: game.media.microTrailerWebmUrl });
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="w-full bg-[#101622] rounded-2xl border border-white/10 overflow-hidden shadow-2xl space-y-3">
      {/* Main Viewport */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
        {activeMedia.type === 'video' ? (
          <video
            ref={videoRef}
            src={activeMedia.url}
            poster={game.media.heroBannerUrl}
            muted
            autoPlay
            loop
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={activeMedia.url}
            alt="Screenshot Preview"
            className="w-full h-full object-contain animate-in fade-in duration-200"
          />
        )}

        {/* Video Controls Bar Overlay */}
        {activeMedia.type === 'video' && (
          <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between gap-3 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Chapter Markers */}
            <div className="flex-1 flex gap-1.5 overflow-x-auto">
              {chapters.map((chap, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChapterJump(chap.time, idx)}
                  className={cn(
                    'flex-1 text-xs font-mono py-1 px-2.5 rounded-lg transition-all text-center truncate',
                    activeChapterIndex === idx
                      ? 'bg-[#06B6D4] text-black font-extrabold shadow-sm'
                      : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
                  )}
                  title={chap.label}
                >
                  {chap.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails Swapper Strip */}
      <div className="px-4 pb-4 flex items-center gap-2.5 overflow-x-auto">
        {/* Video Thumbnail */}
        <button
          onClick={() => {
            setActiveMedia({ type: 'video', url: game.media.microTrailerWebmUrl });
            setIsPlaying(true);
          }}
          className={cn(
            'relative w-28 aspect-video rounded-lg overflow-hidden border shrink-0 transition-all',
            activeMedia.type === 'video'
              ? 'border-[#06B6D4] ring-2 ring-[#06B6D4]/40 scale-102'
              : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
          )}
        >
          <img
            src={game.media.capsuleUrl}
            alt="Trailer Thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Film className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Screenshots */}
        {game.media.screenshots.map((sUrl, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveMedia({ type: 'image', url: sUrl });
              setIsPlaying(false);
            }}
            className={cn(
              'relative w-28 aspect-video rounded-lg overflow-hidden border shrink-0 transition-all',
              activeMedia.type === 'image' && activeMedia.url === sUrl
                ? 'border-[#06B6D4] ring-2 ring-[#06B6D4]/40 scale-102'
                : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
            )}
          >
            <img
              src={sUrl}
              alt={`Screenshot ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
