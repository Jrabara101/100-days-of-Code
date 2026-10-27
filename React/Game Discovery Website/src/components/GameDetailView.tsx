import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Heart,
  Share2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Gamepad2,
  Calendar,
  Users,
  ChevronLeft,
} from 'lucide-react';
import { GameTitle } from '../types/game';
import { fetchGameDetails, fetchGameReviews } from '../lib/api';
import { MediaTheater } from './MediaTheater';
import { PurchaseTelemetryBox } from './PurchaseTelemetryBox';
import { SentimentTimelineChart } from './SentimentTimelineChart';
import { ReviewFeed } from './ReviewFeed';
import { useStore } from '../lib/store';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

export interface GameDetailViewProps {
  game: GameTitle;
  onClose: () => void;
}

export function GameDetailView({ game: initialGame, onClose }: GameDetailViewProps) {
  const [selectedPatchFilter, setSelectedPatchFilter] = useState<string>('all');

  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const setQuickLookGame = useStore((s) => s.setQuickLookGame);

  // Fetch full game details with potential live review mutation score
  const { data: game = initialGame } = useQuery<GameTitle>({
    queryKey: ['game', initialGame.id],
    queryFn: () => fetchGameDetails(initialGame.id),
    initialData: initialGame,
  });

  // Fetch reviews for anomaly status
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', game.id],
    queryFn: () => fetchGameReviews(game.id),
  });

  const isWishlisted = wishlist.includes(game.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#080B11]/95 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Ambient Radial Backlight Glow derived from game art */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full bg-gradient-to-b from-[#06B6D4]/15 to-transparent blur-3xl pointer-events-none -z-10"
      />

      {/* Detail Navigation Header */}
      <div className="sticky top-0 z-40 bg-[#080B11]/85 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-mono text-[#94A3B8] hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuickLookGame(game)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#192234] hover:bg-[#1E293B] text-xs font-mono font-bold text-[#38BDF8] border border-[#06B6D4]/30"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>[Space] Quick Look Demo</span>
          </button>

          <button
            onClick={() => toggleWishlist(game.id)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all',
              isWishlisted
                ? 'bg-[#3B82F6] text-white border-blue-400'
                : 'bg-[#192234] text-[#94A3B8] hover:text-white border-white/10'
            )}
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-white')} />
            <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Title & Headline Bar */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
              {game.title}
            </h1>
            <Badge variant="cyan">
              {game.reviewSummary.allTimeScore}% {game.reviewSummary.tier.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#94A3B8]">
            <span>
              Developer: <strong className="text-white">{game.developer}</strong>
            </span>
            <span>•</span>
            <span>
              Publisher: <strong className="text-white">{game.publisher}</strong>
            </span>
            <span>•</span>
            <span>Release Date: {game.releaseDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {game.concurrentPlayers.toLocaleString()} IN-GAME
            </span>
          </div>
        </div>

        {/* 2-Column Asymmetric Split: Left 65% Media, Right 35% Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Media Theater & Charts */}
          <div className="lg:col-span-8 space-y-8">
            <MediaTheater game={game} />

            {/* Sentiment Timeline Dual-Bar Histogram */}
            <SentimentTimelineChart
              timelineBuckets={reviewsData?.timelineBuckets || []}
              patchNotes={game.patchNotes}
              anomalyDetected={reviewsData?.anomalyDetected || game.anomalyDetected}
              anomalyMessage={reviewsData?.anomalyMessage || game.anomalyMessage}
              selectedPatch={selectedPatchFilter}
              onSelectPatch={setSelectedPatchFilter}
            />

            {/* Playtime-Verified Review Feed */}
            <ReviewFeed
              gameId={game.id}
              initialPatchFilter={selectedPatchFilter}
            />
          </div>

          {/* Right Column (4 cols): Sticky Purchase Telemetry Sidebar */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <PurchaseTelemetryBox game={game} />

            {/* System Requirements & Telemetry Specs */}
            <div className="bg-[#101622] rounded-2xl border border-white/10 p-6 space-y-4 text-xs font-mono">
              <h4 className="font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                SYSTEM REQUIREMENTS TELEMETRY
              </h4>
              <div className="space-y-2 text-[#94A3B8]">
                <div className="flex justify-between">
                  <span>OS:</span>
                  <span className="text-white">Windows 10/11 64-bit // SteamOS 3.5</span>
                </div>
                <div className="flex justify-between">
                  <span>Processor:</span>
                  <span className="text-white">Ryzen 5 3600 / Intel i5-10400</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span className="text-white">16 GB RAM</span>
                </div>
                <div className="flex justify-between">
                  <span>Graphics:</span>
                  <span className="text-white">RTX 2060 (6GB) / RX 5700</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="text-white">45 GB NVMe High Speed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
