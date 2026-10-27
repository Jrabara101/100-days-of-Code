import React from 'react';
import { Sheet } from './ui/Sheet';
import { GameTitle } from '../types/game';
import { useStore } from '../lib/store';
import { formatPrice, cn } from '../lib/utils';
import { Trash2, ShoppingCart, ExternalLink, Sparkles } from 'lucide-react';

export interface WishlistDrawerProps {
  games: GameTitle[];
  isOpen: boolean;
  onClose: () => void;
}

export function WishlistDrawer({ games, isOpen, onClose }: WishlistDrawerProps) {
  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const setSelectedGame = useStore((s) => s.setSelectedGame);

  const wishlistedGames = games.filter((g) => wishlist.includes(g.id));

  // Calculate totals
  const totalOriginalCents = wishlistedGames.reduce((acc, g) => acc + g.priceCents, 0);
  const totalCurrentCents = wishlistedGames.reduce(
    (acc, g) => acc + g.priceCents * (1 - g.discountPercent / 100),
    0
  );
  const totalSavingsCents = totalOriginalCents - totalCurrentCents;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>WISHLIST VAULT</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#06B6D4]/20 text-[#38BDF8] border border-[#06B6D4]/40">
            {wishlistedGames.length} Items
          </span>
        </div>
      }
    >
      <div className="flex flex-col h-full justify-between gap-6">
        {/* Wishlist Items List */}
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {wishlistedGames.length === 0 ? (
            <div className="p-12 text-center text-[#94A3B8] font-mono text-xs space-y-2">
              <p className="text-white font-display text-sm">Your wishlist is empty.</p>
              <p>Explore titles and click the heart icon to save games for instant price-drop alerts.</p>
            </div>
          ) : (
            wishlistedGames.map((game) => {
              const currentPrice = game.priceCents * (1 - game.discountPercent / 100);
              return (
                <div
                  key={game.id}
                  className="p-3.5 rounded-xl bg-[#101622] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3 group"
                >
                  <img
                    src={game.media.capsuleUrl}
                    alt={game.title}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 cursor-pointer"
                    onClick={() => {
                      onClose();
                      setSelectedGame(game);
                    }}
                  />

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      onClose();
                      setSelectedGame(game);
                    }}
                  >
                    <h4 className="font-display font-bold text-sm text-white group-hover:text-[#38BDF8] transition-colors truncate">
                      {game.title}
                    </h4>
                    <span className="text-xs font-mono text-[#94A3B8] block mt-0.5">
                      {game.developer}
                    </span>

                    <div className="flex items-center gap-2 mt-1">
                      {game.discountPercent > 0 ? (
                        <>
                          <span className="px-1.5 py-0.5 rounded bg-[#84CC16] text-[#080B11] font-mono font-extrabold text-[10px]">
                            -{game.discountPercent}%
                          </span>
                          <span className="text-xs font-mono font-bold text-white">
                            {formatPrice(currentPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-mono font-bold text-white">
                          {formatPrice(game.priceCents)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => toggleWishlist(game.id)}
                    title="Remove from Wishlist"
                    className="p-2 rounded-lg text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Checkout Summary */}
        {wishlistedGames.length > 0 && (
          <div className="p-4 rounded-xl bg-[#101622] border border-white/10 space-y-3">
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[#94A3B8]">
                <span>Total Catalog Value:</span>
                <span>{formatPrice(totalOriginalCents)}</span>
              </div>
              {totalSavingsCents > 0 && (
                <div className="flex justify-between text-[#84CC16] font-bold">
                  <span>Total Discount Savings:</span>
                  <span>-{formatPrice(totalSavingsCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                <span>Total Due:</span>
                <span className="text-[#38BDF8]">{formatPrice(totalCurrentCents)}</span>
              </div>
            </div>

            <button
              onClick={() => alert(`Purchasing ${wishlistedGames.length} titles for ${formatPrice(totalCurrentCents)}!`)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891B2] hover:to-[#2563EB] text-white font-display font-bold text-xs tracking-wider shadow-lg shadow-cyan-500/25 transition-all hover:scale-102"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Purchase All Wishlisted Items</span>
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
