import React, { useState, useEffect, useRef } from 'react';
import { Play, Heart, Sparkles, ChevronLeft, ChevronRight, Users, Flame, ExternalLink } from 'lucide-react';
import { GameTitle } from '../types/game';
import { useStore } from '../lib/store';
import { formatPrice, formatNumber, cn } from '../lib/utils';
import { Badge } from './ui/Badge';

export interface HeroSpotlightCarouselProps {
  games: GameTitle[];
  onSelectGame?: (game: GameTitle) => void;
}

export function HeroSpotlightCarousel({ games, onSelectGame }: HeroSpotlightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const featuredGames = games.slice(0, 5);
  const currentGame = featuredGames[currentIndex] || games[0];

  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const setSelectedGame = useStore((s) => s.setSelectedGame);
  const setQuickLookGame = useStore((s) => s.setQuickLookGame);

  const isWishlisted = currentGame ? wishlist.includes(currentGame.id) : false;

  // Chapters
  const chapters = currentGame?.media.chapters && currentGame.media.chapters.length > 0
    ? currentGame.media.chapters
    : [
        { time: 0, title: 'Combat Loop', label: 'Core gameplay momentum' },
        { time: 12, title: 'Boss Encounter', label: 'High stakes climax' },
        { time: 24, title: 'UI & Inventory', label: 'Progression and loadouts' },
      ];

  // Auto-advance every 9 seconds unless hovered/interacting
  useEffect(() => {
    if (isPaused || featuredGames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredGames.length);
      setActiveMediaUrl(null);
      setActiveChapterIndex(0);
    }, 9000);

    return () => clearInterval(interval);
  }, [isPaused, featuredGames.length]);

  // When current game changes, play micro trailer
  useEffect(() => {
    if (!currentGame) return;
    setActiveMediaUrl(null);
    setActiveChapterIndex(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex, currentGame]);

  if (!currentGame) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredGames.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredGames.length) % featuredGames.length);
  };

  const handleChapterJump = (time: number, index: number) => {
    setActiveChapterIndex(index);
    setActiveMediaUrl(null);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    }
  };

  const currentPrice = currentGame.priceCents * (1 - currentGame.discountPercent / 100);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#101622] shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Ambient Radial Glow */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#06B6D4]/15 blur-3xl pointer-events-none"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#3B82F6]/15 blur-3xl pointer-events-none"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px] relative z-10">
        {/* Left 65%: Video / Media Viewport (7-8 cols on lg) */}
        <div className="lg:col-span-8 relative bg-black flex flex-col justify-between overflow-hidden">
          {/* Main Media: Video or Screenshot */}
          <div className="relative w-full h-[320px] sm:h-[400px] lg:h-full overflow-hidden">
            {activeMediaUrl ? (
              <img
                src={activeMediaUrl}
                alt={currentGame.title}
                className="w-full h-full object-cover animate-in fade-in duration-200"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentGame.media.microTrailerWebmUrl}
                poster={currentGame.media.heroBannerUrl}
                muted
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            {/* Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101622] via-transparent to-black/30 pointer-events-none" />
            <div className="hidden lg:block absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-[#101622] pointer-events-none" />

            {/* Floating Spacebar Quick-Look Button */}
            <button
              onClick={() => setQuickLookGame(currentGame)}
              className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 text-white border border-[#06B6D4]/50 text-xs font-mono font-bold backdrop-blur-md transition-all hover:scale-105 shadow-xl glow-cyan"
            >
              <Play className="w-3.5 h-3.5 text-[#06B6D4] fill-[#06B6D4]" />
              <span>Press [Space] Quick Look Demo</span>
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              aria-label="Previous Featured Game"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Featured Game"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Chapter Scrubber Bar */}
          <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center gap-2 bg-[#080B11]/85 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-mono text-[#94A3B8] px-2 font-bold uppercase tracking-wider hidden sm:inline">
              Chapters:
            </span>
            <div className="flex-1 flex gap-1.5">
              {chapters.map((chap, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChapterJump(chap.time, idx)}
                  className={cn(
                    'flex-1 text-xs font-mono py-1 px-2 rounded-lg transition-all text-center truncate',
                    activeChapterIndex === idx && !activeMediaUrl
                      ? 'bg-[#06B6D4] text-black font-extrabold shadow-sm'
                      : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
                  )}
                  title={chap.label}
                >
                  {chap.title}
                </button>
              ))}
            </div>

            {/* Indicator dots */}
            <div className="flex items-center gap-1.5 px-2">
              {featuredGames.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    currentIndex === idx ? 'w-5 bg-[#06B6D4]' : 'bg-white/30 hover:bg-white/60'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right 35%: Metadata & Interactive Dock (4 cols on lg) */}
        <div className="lg:col-span-4 p-6 flex flex-col justify-between bg-[#101622] border-t lg:border-t-0 lg:border-l border-white/5">
          <div className="space-y-4">
            {/* Live Ticker: Concurrent Players & Sentiment */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {formatNumber(currentGame.concurrentPlayers)} IN-GAME
              </span>

              <Badge variant="cyan">
                {currentGame.reviewSummary.allTimeScore}% {currentGame.reviewSummary.tier.replace('_', ' ')}
              </Badge>
            </div>

            {/* Game Title & Studio */}
            <div>
              <h2
                onClick={() => setSelectedGame(currentGame)}
                className="text-2xl sm:text-3xl font-extrabold font-display text-white hover:text-[#38BDF8] transition-colors cursor-pointer leading-tight"
              >
                {currentGame.title}
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                By <span className="text-white/90">{currentGame.developer}</span> • Published by{' '}
                <span className="text-white/70">{currentGame.publisher}</span>
              </p>
            </div>

            {/* 2x2 Screenshot Hover-Swap Grid */}
            <div>
              <div className="text-[11px] font-mono text-[#94A3B8] mb-1.5 flex items-center justify-between">
                <span>HOVER TO PREVIEW SCREENS:</span>
                {activeMediaUrl && (
                  <button
                    onClick={() => setActiveMediaUrl(null)}
                    className="text-[#06B6D4] hover:underline"
                  >
                    Resume Video
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currentGame.media.screenshots.slice(0, 4).map((imgUrl, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setActiveMediaUrl(imgUrl)}
                    className={cn(
                      'aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all',
                      activeMediaUrl === imgUrl
                        ? 'border-[#06B6D4] ring-2 ring-[#06B6D4]/40 scale-102'
                        : 'border-white/10 hover:border-white/30'
                    )}
                  >
                    <img
                      src={imgUrl}
                      alt={`Screenshot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Genre DNA Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentGame.tags.map((tag) => (
                <span
                  key={tag.name}
                  className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-[#192234] text-[#94A3B8] border border-white/5"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Dock: Pricing & Action Buttons */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              {/* Dual-Compartment Discount Block */}
              {currentGame.discountPercent > 0 ? (
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1.5 rounded-lg bg-[#84CC16] text-[#080B11] font-mono font-extrabold text-base shadow-lg glow-lime">
                    -{currentGame.discountPercent}%
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono line-through text-[#94A3B8]">
                      {formatPrice(currentGame.priceCents)}
                    </span>
                    <span className="text-xl font-mono font-extrabold text-white">
                      {formatPrice(currentPrice)}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xl font-mono font-extrabold text-white">
                  {formatPrice(currentGame.priceCents)}
                </span>
              )}

              {/* Value Index Badge */}
              {currentGame.costPerHourCents && (
                <span className="text-xs font-mono text-[#38BDF8] bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-2.5 py-1 rounded-md">
                  ${(currentGame.costPerHourCents / 100).toFixed(2)} / hr value
                </span>
              )}
            </div>

            {/* Purchase & Wishlist Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedGame(currentGame)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891B2] hover:to-[#2563EB] text-white font-display font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]"
              >
                <span>View Store Page</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={() => toggleWishlist(currentGame.id)}
                aria-label="Wishlist"
                className={cn(
                  'p-3 rounded-xl border backdrop-blur-md transition-all',
                  isWishlisted
                    ? 'bg-[#3B82F6] border-blue-400 text-white shadow-lg shadow-blue-500/40'
                    : 'bg-[#192234] border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/10'
                )}
              >
                <Heart className={cn('w-5 h-5', isWishlisted && 'fill-white')} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
