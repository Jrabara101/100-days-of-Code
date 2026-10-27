import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Heart,
  Ban,
  UserPlus,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Gamepad2,
  Users,
  CheckCircle,
} from 'lucide-react';
import { GameTitle } from '../types/game';
import { useStore } from '../lib/store';
import { formatPrice, cn } from '../lib/utils';
import { voteSquadGame } from '../lib/api';

export interface DiscoveryQueueModalProps {
  games: GameTitle[];
  isOpen: boolean;
  onClose: () => void;
}

export function DiscoveryQueueModal({ games, isOpen, onClose }: DiscoveryQueueModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<'wishlist' | 'ignore' | 'follow' | null>(null);
  const [history, setHistory] = useState<{ index: number; action: string }[]>([]);

  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const ignoreGame = useStore((s) => s.ignoreGame);
  const followCreator = useStore((s) => s.followCreator);
  const setSelectedGame = useStore((s) => s.setSelectedGame);
  const setQuickLookGame = useStore((s) => s.setQuickLookGame);
  const squadRoom = useStore((s) => s.squadRoom);

  const currentGame = games[currentIndex];

  const handleNext = useCallback(
    (actionType: 'wishlist' | 'ignore' | 'follow') => {
      if (!currentGame) return;

      setActionFeedback(actionType);
      setHistory((prev) => [...prev, { index: currentIndex, action: actionType }]);

      // Perform action
      if (actionType === 'wishlist') {
        if (!wishlist.includes(currentGame.id)) {
          toggleWishlist(currentGame.id);
        }
        // If in squad room, vote yes
        if (squadRoom) {
          voteSquadGame(squadRoom.code, squadRoom.members[0] || 'Captain', currentGame.id, 'yes').catch(
            () => {}
          );
        }
      } else if (actionType === 'ignore') {
        ignoreGame(currentGame.id);
      } else if (actionType === 'follow') {
        followCreator(currentGame.developer);
      }

      setTimeout(() => {
        setActionFeedback(null);
        if (currentIndex < games.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Finished queue
          setCurrentIndex(games.length);
        }
      }, 250);
    },
    [currentGame, currentIndex, games.length, wishlist, toggleWishlist, ignoreGame, followCreator, squadRoom]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(last.index);
  }, [history]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !currentGame) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext('wishlist');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNext('ignore');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNext('follow');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setSelectedGame(currentGame);
      } else if (e.code === 'Space') {
        e.preventDefault();
        setQuickLookGame(currentGame);
      } else if (e.key === 'z' || e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentGame, handleNext, handleUndo, onClose, setSelectedGame, setQuickLookGame]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl glass-popover rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-10 text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#101622]/90">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-pulse" />
            <h3 className="text-base font-bold font-display text-white tracking-wide">
              DISCOVERY QUEUE // Rapid Curation Deck
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#94A3B8]">
              {Math.min(currentIndex + 1, games.length)} of {games.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Card */}
        {currentGame && currentIndex < games.length ? (
          <div className="relative p-6 flex flex-col gap-6">
            {/* Visual Action Stamp Animation Overlay */}
            {actionFeedback && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in zoom-in-75 duration-150">
                {actionFeedback === 'wishlist' && (
                  <span className="text-2xl font-mono font-extrabold px-6 py-2 rounded-xl bg-blue-600/90 text-white border-2 border-white shadow-2xl transform rotate-12">
                    ✓ WISHLISTED
                  </span>
                )}
                {actionFeedback === 'ignore' && (
                  <span className="text-2xl font-mono font-extrabold px-6 py-2 rounded-xl bg-rose-600/90 text-white border-2 border-white shadow-2xl transform -rotate-12">
                    ✕ IGNORED
                  </span>
                )}
                {actionFeedback === 'follow' && (
                  <span className="text-2xl font-mono font-extrabold px-6 py-2 rounded-xl bg-cyan-600/90 text-white border-2 border-white shadow-2xl">
                    ★ FOLLOWING CREATOR
                  </span>
                )}
              </div>
            )}

            {/* Media Viewport */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black shadow-lg">
              <img
                src={currentGame.media.heroBannerUrl}
                alt={currentGame.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101622] via-transparent to-transparent pointer-events-none" />

              {/* Floating Review & Price Tags */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10">
                <span className="text-xs font-mono font-bold text-[#38BDF8] bg-black/70 px-3 py-1 rounded-md border border-white/10 backdrop-blur-md">
                  {currentGame.reviewSummary.allTimeScore}% Positive (
                  {currentGame.reviewSummary.tier.replace('_', ' ')})
                </span>

                <div className="flex items-center gap-2">
                  {currentGame.discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#84CC16] text-[#080B11] font-mono font-bold text-xs">
                      -{currentGame.discountPercent}%
                    </span>
                  )}
                  <span className="text-base font-mono font-bold text-white bg-black/70 px-3 py-1 rounded-md border border-white/10 backdrop-blur-md">
                    {formatPrice(
                      currentGame.priceCents * (1 - currentGame.discountPercent / 100)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-2xl font-extrabold font-display text-white">
                  {currentGame.title}
                </h2>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Developer: <span className="text-white/90">{currentGame.developer}</span> • Release:{' '}
                {currentGame.releaseDate}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {currentGame.tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#192234] text-[#94A3B8] border border-white/5"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Tactile Key Guide & Buttons */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => handleNext('ignore')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 transition-all hover:scale-102"
              >
                <div className="flex items-center gap-1.5 font-bold font-display text-sm">
                  <Ban className="w-4 h-4 text-rose-400" />
                  <span>Ignore</span>
                </div>
                <span className="text-[10px] font-mono text-rose-400/80 mt-1">[←] Left Arrow</span>
              </button>

              <button
                onClick={() => handleNext('follow')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-102"
              >
                <div className="flex items-center gap-1.5 font-bold font-display text-sm">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>Follow Dev</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400/80 mt-1">[↑] Up Arrow</span>
              </button>

              <button
                onClick={() => handleNext('wishlist')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-500/40 transition-all hover:scale-102 shadow-lg shadow-blue-500/15"
              >
                <div className="flex items-center gap-1.5 font-bold font-display text-sm">
                  <Heart className="w-4 h-4 text-blue-400 fill-blue-400" />
                  <span>Wishlist</span>
                </div>
                <span className="text-[10px] font-mono text-blue-400/80 mt-1">[→] Right Arrow</span>
              </button>
            </div>

            {/* Secondary actions: Deep Dive [Enter] & Quick Look [Space] & Undo */}
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedGame(currentGame)}
                  className="hover:text-white flex items-center gap-1 text-[#06B6D4]"
                >
                  <span>[Enter] Deep Dive Store Page</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setQuickLookGame(currentGame)}
                  className="hover:text-white flex items-center gap-1 text-[#38BDF8]"
                >
                  <span>[Space] Quick Look Demo</span>
                </button>
              </div>

              {history.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>[Z] Undo</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Finished Queue Screen */
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">Queue Completed!</h3>
            <p className="text-sm text-[#94A3B8] max-w-md">
              You reviewed all titles in your rapid discovery deck. New recommendations will adapt to
              your updated taste vector.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setHistory([]);
                }}
                className="px-4 py-2 rounded-xl bg-[#192234] hover:bg-[#1E293B] text-white text-xs font-mono font-bold border border-white/10"
              >
                Replay Queue
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white text-xs font-mono font-bold shadow-lg"
              >
                Return to Storefront
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
