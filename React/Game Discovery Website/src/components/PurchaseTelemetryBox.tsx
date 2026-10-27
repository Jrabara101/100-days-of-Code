import React from 'react';
import { Heart, Clock, DollarSign, Sparkles, ShieldCheck, Zap, BatteryCharging, ShoppingCart, TrendingDown } from 'lucide-react';
import { GameTitle } from '../types/game';
import { useStore } from '../lib/store';
import { formatPrice, cn } from '../lib/utils';

export interface PurchaseTelemetryBoxProps {
  game: GameTitle;
}

export function PurchaseTelemetryBox({ game }: PurchaseTelemetryBoxProps) {
  const hardwareProfileId = useStore((s) => s.hardwareProfileId);
  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlist = useStore((s) => s.toggleWishlist);

  const isWishlisted = wishlist.includes(game.id);

  const currentPrice = game.priceCents * (1 - game.discountPercent / 100);
  const isHistoricalLow = game.historicalLowCents >= currentPrice;

  // Estimated FPS & Battery
  const estimatedFps = game.estimatedFps[hardwareProfileId] || 60;
  const batteryHours = game.batteryHours?.[hardwareProfileId];

  // Price history sparkline SVG calculation
  const history = game.priceHistory || [];
  const maxPrice = Math.max(1, ...history.map((h) => h.priceCents), game.priceCents);
  const minPrice = Math.min(...history.map((h) => h.priceCents), game.priceCents);

  const sparklineWidth = 320;
  const sparklineHeight = 60;

  const points = history.map((pt, idx) => {
    const x = (idx / Math.max(1, history.length - 1)) * sparklineWidth;
    const y = sparklineHeight - ((pt.priceCents - minPrice) / Math.max(1, maxPrice - minPrice)) * (sparklineHeight - 16) - 8;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full bg-[#101622] rounded-2xl border border-white/10 p-6 space-y-6 shadow-xl">
      {/* Top Price Header & Countdown */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider block">
            Storefront Price
          </span>
          <div className="flex items-center gap-3 mt-1">
            {game.discountPercent > 0 ? (
              <>
                <span className="px-3 py-1.5 rounded-lg bg-[#84CC16] text-[#080B11] font-mono font-extrabold text-lg shadow-md glow-lime">
                  -{game.discountPercent}%
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-mono line-through text-[#94A3B8]">
                    {formatPrice(game.priceCents)}
                  </span>
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {formatPrice(currentPrice)}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-2xl font-mono font-extrabold text-white">
                {formatPrice(game.priceCents)}
              </span>
            )}
          </div>
        </div>

        {/* Sale Countdown */}
        {game.discountPercent > 0 && (
          <div className="text-right">
            <span className="text-[11px] font-mono text-emerald-400 font-bold block flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5" />
              SPECIAL PROMOTION
            </span>
            <span className="text-xs font-mono text-[#94A3B8]">Offer ends in 42h 18m</span>
          </div>
        )}
      </div>

      {/* 12-Month Price History Sparkline & Historical Low */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#94A3B8] flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-[#84CC16]" />
            12-MONTH PRICE HISTORY SPARKLINE:
          </span>
          {isHistoricalLow && (
            <span className="text-[#84CC16] font-bold bg-[#84CC16]/15 px-2 py-0.5 rounded border border-[#84CC16]/30">
              TRUE HISTORICAL LOW
            </span>
          )}
        </div>

        <div className="p-3 rounded-xl bg-[#080B11] border border-white/5 relative overflow-hidden">
          {history.length > 1 ? (
            <svg
              viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
              className="w-full h-14 overflow-visible"
            >
              <polyline
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {/* Highlight lowest point */}
              {history.map((pt, i) => {
                if (pt.isLowest) {
                  const x = (i / (history.length - 1)) * sparklineWidth;
                  const y = sparklineHeight - ((pt.priceCents - minPrice) / Math.max(1, maxPrice - minPrice)) * (sparklineHeight - 16) - 8;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4.5"
                      fill="#84CC16"
                      stroke="#080B11"
                      strokeWidth="2"
                    />
                  );
                }
                return null;
              })}
            </svg>
          ) : (
            <div className="h-14 flex items-center justify-center text-xs font-mono text-[#94A3B8]">
              Single release baseline: {formatPrice(game.priceCents)}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] pt-1 border-t border-white/5">
            <span>Historical Low: {formatPrice(game.historicalLowCents)}</span>
            <span>Regular: {formatPrice(game.priceCents)}</span>
          </div>
        </div>
      </div>

      {/* Cost-Per-Hour Value Index */}
      <div className="p-4 rounded-xl bg-[#192234] border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#94A3B8] uppercase font-bold">Cost-Per-Hour Value Index:</span>
          <span className="text-base font-mono font-extrabold text-[#38BDF8]">
            ${((game.costPerHourCents || 25) / 100).toFixed(2)} / hr
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 text-[#94A3B8]">
          <div className="bg-[#101622] p-2 rounded-lg">
            <span>Main Story:</span>
            <strong className="text-white block mt-0.5">{game.mainStoryHours || 25} hrs</strong>
          </div>
          <div className="bg-[#101622] p-2 rounded-lg">
            <span>Completionist:</span>
            <strong className="text-white block mt-0.5">{game.completionistHours || 90} hrs</strong>
          </div>
        </div>
      </div>

      {/* Live Hardware Compatibility Box */}
      <div className="p-4 rounded-xl bg-[#080B11] border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#94A3B8] font-bold">TELEMETRY BENCHMARK:</span>
          <span className="text-[#06B6D4] font-bold">
            {hardwareProfileId.replace('-', ' ').toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-mono font-extrabold text-white">
              {estimatedFps} FPS Average
            </span>
          </div>

          {batteryHours && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#38BDF8]">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>{batteryHours}h Battery</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={() => alert(`Purchasing ${game.title} for ${formatPrice(currentPrice)}!`)}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891B2] hover:to-[#2563EB] text-white font-display font-extrabold text-sm tracking-wide shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02]"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart • {formatPrice(currentPrice)}</span>
        </button>

        <button
          onClick={() => toggleWishlist(game.id)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border text-sm font-mono font-bold transition-all',
            isWishlisted
              ? 'bg-[#3B82F6] text-white border-blue-400 shadow-md'
              : 'bg-[#192234] text-[#94A3B8] hover:text-white border-white/10 hover:bg-white/10'
          )}
        >
          <Heart className={cn('w-4 h-4', isWishlisted && 'fill-white')} />
          <span>{isWishlisted ? '✓ On Your Wishlist' : 'Add to Wishlist'}</span>
        </button>
      </div>
    </div>
  );
}
