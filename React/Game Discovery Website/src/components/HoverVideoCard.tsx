import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, Sparkles, Gamepad2, Laptop, Monitor, AlertCircle, Play } from 'lucide-react';
import { GameTitle } from '../types/game';
import { useStore } from '../lib/store';
import { formatPrice, cn } from '../lib/utils';
import { Badge } from './ui/Badge';

export interface HoverVideoCardProps {
  game: GameTitle & { similarityScore?: number };
  onSelect?: (game: GameTitle) => void;
  priority?: boolean;
}

export function HoverVideoCard({ game, onSelect, priority = false }: HoverVideoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);

  const hardwareProfileId = useStore((s) => s.hardwareProfileId);
  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const setSelectedGame = useStore((s) => s.setSelectedGame);
  const setQuickLookGame = useStore((s) => s.setQuickLookGame);
  const setHoveredGameId = useStore((s) => s.setHoveredGameId);

  const isWishlisted = wishlist.includes(game.id);

  // Chapters fallback if not provided
  const chapters = game.media.chapters && game.media.chapters.length > 0
    ? game.media.chapters
    : [
        { time: 0, title: 'Combat Loop', label: 'Fast-paced action' },
        { time: 10, title: 'Boss Encounter', label: 'Epic phase transition' },
        { time: 20, title: 'UI / Inventory', label: 'Tactical upgrade tree' },
      ];

  // Automatic IntersectionObserver memory cleanup & pausing
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isPlaying) {
            // Pause video and clean up memory when card leaves viewport
            if (videoRef.current) {
              videoRef.current.pause();
            }
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, [isPlaying]);

  // Handle hover-to-trailer with 250ms delay
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setHoveredGameId(game.id);

    hoverTimerRef.current = setTimeout(() => {
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.currentTime = chapters[0]?.time || 0;
        videoRef.current.play().catch(() => {
          // Fallback if browser autoplay policy blocks video
          setVideoError(true);
        });
      }
    }, 250);
  }, [chapters, game.id, setHoveredGameId]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setHoveredGameId(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [setHoveredGameId]);

  // Keyboard Space listener for instant Quick-Look while hovered
  useEffect(() => {
    if (!isHovered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setQuickLookGame(game);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered, game, setQuickLookGame]);

  const handleChapterClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveChapterIndex(index);
    if (videoRef.current && chapters[index]) {
      videoRef.current.currentTime = chapters[index].time;
      if (!isPlaying) {
        setIsPlaying(true);
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(game);
    } else {
      setSelectedGame(game);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(game.id);
  };

  // Hardware FPS badge calculation
  const currentFps = game.estimatedFps[hardwareProfileId] || game.estimatedFps['steam-deck-oled'] || 60;
  const batteryLife = game.batteryHours?.[hardwareProfileId];

  const getHardwareBadge = () => {
    if (hardwareProfileId === 'steam-deck-oled') {
      if (game.deckCompatibility === 'VERIFIED') {
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Deck Verified: {currentFps} FPS {batteryLife ? `• ${batteryLife}h` : ''}
          </span>
        );
      }
      if (game.deckCompatibility === 'PLAYABLE') {
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Deck Playable: {currentFps} FPS
          </span>
        );
      }
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400 bg-rose-950/80 border border-rose-500/30 px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3" />
          Unsupported
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-[11px] font-mono text-[#38BDF8] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2 py-0.5 rounded-full">
        <Sparkles className="w-3 h-3 text-[#06B6D4]" />
        Est. {currentFps} FPS
      </span>
    );
  };

  const currentPrice = game.priceCents * (1 - game.discountPercent / 100);
  const isHistoricalLow = game.historicalLowCents >= currentPrice;

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className={cn(
        'group relative flex flex-col bg-[#101622] rounded-xl border border-white/5 overflow-hidden cursor-pointer hover-card-transition select-none',
        isHovered
          ? 'z-30 scale-[1.03] border-[#06B6D4]/40 shadow-2xl shadow-[#06B6D4]/15'
          : 'hover:border-white/20'
      )}
    >
      {/* Media Micro-Theater Bay */}
      <div className="relative aspect-video w-full bg-[#080B11] overflow-hidden">
        {/* Static Cover Image */}
        <img
          src={game.media.capsuleUrl}
          alt={game.title}
          loading={priority ? 'eager' : 'lazy'}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isPlaying && !videoError ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
          )}
        />

        {/* Muted 60fps Gameplay Micro-Trailer */}
        {isHovered && !videoError && (
          <video
            ref={videoRef}
            src={game.media.microTrailerWebmUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              isPlaying ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}

        {/* Ambient Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101622] via-transparent to-black/40 pointer-events-none" />

        {/* Cosine Similarity Pill (if Alchemist active) */}
        {game.similarityScore !== undefined && game.similarityScore > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#06B6D4]/25 text-[#38BDF8] border border-[#06B6D4]/50 backdrop-blur-md shadow-lg">
              <Sparkles className="w-3 h-3 text-[#06B6D4]" />
              {Math.round(game.similarityScore * 100)}% Match
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          aria-label="Toggle Wishlist"
          className={cn(
            'absolute top-2.5 right-2.5 z-20 p-2 rounded-full backdrop-blur-md transition-all duration-200',
            isWishlisted
              ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/40 scale-110'
              : 'bg-black/50 text-[#94A3B8] hover:text-white hover:bg-black/80'
          )}
        >
          <Heart className={cn('w-4 h-4', isWishlisted && 'fill-white')} />
        </button>

        {/* Spacebar Quick-Look Hint (Appears on Hover) */}
        {isHovered && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-in fade-in duration-200">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/80 text-white border border-[#06B6D4]/60 text-xs font-mono font-semibold backdrop-blur-md shadow-xl glow-cyan">
              <Play className="w-3 h-3 text-[#06B6D4] fill-[#06B6D4]" />
              [Space] Quick Look Demo
            </span>
          </div>
        )}

        {/* Interactive Chapter Scrubber Overlay */}
        {isHovered && (
          <div className="absolute bottom-2 left-2 right-2 z-20 flex gap-1 p-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 animate-in fade-in duration-150">
            {chapters.map((chap, idx) => (
              <button
                key={idx}
                onClick={(e) => handleChapterClick(e, idx)}
                title={chap.label}
                className={cn(
                  'flex-1 text-[10px] font-mono py-0.5 rounded transition-colors text-center truncate',
                  activeChapterIndex === idx
                    ? 'bg-[#06B6D4] text-black font-bold'
                    : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
                )}
              >
                {chap.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Card Body & Telemetry Tray */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        {/* Title and Top Tags */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-base text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors leading-snug line-clamp-1">
              {game.title}
            </h3>
          </div>

          <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-1">{game.developer}</p>

          {/* Genre / Mood Pills */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {game.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.name}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#192234] text-[#94A3B8] border border-white/5"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* Telemetry Row: Hardware FPS badge & Community Sentiment */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
          {getHardwareBadge()}

          <span
            className={cn(
              'font-mono text-xs font-semibold',
              game.reviewSummary.allTimeScore >= 90
                ? 'text-[#38BDF8]'
                : game.reviewSummary.allTimeScore >= 70
                ? 'text-[#F59E0B]'
                : 'text-[#F43F5E]'
            )}
          >
            {game.reviewSummary.allTimeScore}% Positive
          </span>
        </div>

        {/* Price & Historical Low Tray */}
        <div className="flex items-center justify-between pt-1">
          {/* Dual-Compartment Discount Block */}
          {game.discountPercent > 0 ? (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-[#84CC16] text-[#080B11] font-mono font-extrabold text-xs shadow-md glow-lime">
                -{game.discountPercent}%
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-[11px] font-mono line-through text-[#94A3B8]">
                  {formatPrice(game.priceCents)}
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  {formatPrice(currentPrice)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm font-mono font-bold text-white">
              {formatPrice(game.priceCents)}
            </span>
          )}

          {/* True Historical Low Indicator */}
          {isHistoricalLow && game.discountPercent > 0 && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#84CC16] bg-[#84CC16]/10 px-2 py-0.5 rounded border border-[#84CC16]/30">
              Hist. Low
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
