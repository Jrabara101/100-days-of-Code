import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { formatCents, estimateTrueOutOfDoorPrice } from '../services/priceCalculator';

export function DishCard({
  dish,
  restaurant,
  showTrueCost,
  cartQuantity = 0,
  onSelectDish
}) {
  const trueOutOfDoorPrice = estimateTrueOutOfDoorPrice(dish.base_price_cents, restaurant);

  return (
    <div
      onClick={() => onSelectDish(dish)}
      className="group relative p-4 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-rose-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row justify-between gap-4"
    >
      {/* Left Info Column */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Badges Strip */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {dish.is_featured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                ★ Top Liked
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              📦 Travels Great ({dish.travel_quality_score}/5.0)
            </span>
            {dish.dietary_flags?.includes('gf') && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)]">
                🌾 GF
              </span>
            )}
            {dish.dietary_flags?.includes('vegan') && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                🌱 Vegan
              </span>
            )}
            {(dish.dietary_flags?.includes('halal') || dish.dietary_flags?.includes('halal-friendly')) && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                ✨ Halal
              </span>
            )}
            {dish.protein_grams >= 30 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                🥩 {dish.protein_grams}g Protein
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-base text-[var(--text-primary)] group-hover:text-rose-600 transition-colors">
            {dish.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
            {dish.description}
          </p>
        </div>

        {/* Smart Pairing Drawer snippet */}
        {dish.pairings && dish.pairings.length > 0 && (
          <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">
              Pair with <strong>{dish.pairings[0].name}</strong> ({formatCents(dish.pairings[0].price_cents)}) • {dish.pairings[0].reason}
            </span>
          </div>
        )}

        {/* Pricing & Macros Row */}
        <div className="flex items-center gap-3 pt-1">
          {/* Price with True-Cost Rollup */}
          <div className="flex items-baseline gap-1.5 font-mono-numbers overflow-hidden">
            <span
              key={showTrueCost ? 'true-cost' : 'base-cost'}
              className="price-roll-active inline-block font-bold text-base text-[var(--text-primary)]"
            >
              {showTrueCost ? formatCents(trueOutOfDoorPrice) : formatCents(dish.base_price_cents)}
            </span>
            {showTrueCost && (
              <span className="text-[10px] font-sans font-medium text-emerald-600 dark:text-emerald-400">
                All-in est.
              </span>
            )}
          </div>

          <span className="text-stone-300 dark:text-stone-700">•</span>

          <span className="text-xs text-[var(--text-muted)] font-mono-numbers">
            {dish.calories} cal
          </span>
        </div>
      </div>

      {/* Right Media Column */}
      <div className="relative w-full sm:w-28 h-32 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
        <img
          src={dish.image_url}
          alt={dish.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Floating Quick Add / Count Button */}
        <div className="absolute bottom-2 right-2">
          {cartQuantity > 0 ? (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white font-mono font-bold text-xs shadow-lg ring-2 ring-white dark:ring-stone-900">
              {cartQuantity}
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDish(dish);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/95 dark:bg-stone-900/95 text-[var(--text-primary)] hover:bg-rose-600 hover:text-white shadow-md backdrop-blur-sm transition-all active:scale-90"
              title="Customize & Add"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
