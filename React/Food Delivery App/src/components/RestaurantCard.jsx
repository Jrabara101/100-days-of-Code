import React, { useMemo } from 'react';
import { Star, Clock, ShieldCheck, Flame, Zap, PackageCheck, MapPin, Sparkles } from 'lucide-react';
import { formatCents } from '../services/priceCalculator';
import { calculateDynamicETA } from '../services/spatialService';
import { MENU_ITEMS } from '../data/restaurants';

export function RestaurantCard({
  restaurant,
  showTrueCost,
  activeFilters,
  onSelectRestaurant,
  onOpenProvenance
}) {
  const dynamicETA = calculateDynamicETA(restaurant);

  const getLoadBadge = () => {
    switch (restaurant.current_load_status) {
      case 'quiet':
        return {
          icon: <Zap className="w-3 h-3 text-emerald-400" />,
          label: 'Kitchen Quiet • Prep in 12m',
          classes: 'bg-black/60 text-emerald-300 border-emerald-500/30'
        };
      case 'busy':
        return {
          icon: <Flame className="w-3 h-3 text-amber-400" />,
          label: 'Peak Dinner Rush • +15m',
          classes: 'bg-black/60 text-amber-300 border-amber-500/30'
        };
      default:
        return {
          icon: <Clock className="w-3 h-3 text-blue-400" />,
          label: 'Kitchen Normal • Firing in 4m',
          classes: 'bg-black/60 text-blue-300 border-blue-500/30'
        };
    }
  };

  const loadBadge = getLoadBadge();

  // Dynamically re-rank and display matching dishes based on active dietary guardrails
  const matchingDishes = useMemo(() => {
    const dishes = MENU_ITEMS.filter((m) => m.restaurant_id === restaurant.id);
    if (!activeFilters || activeFilters.size === 0) {
      return dishes.slice(0, 2);
    }
    const filtered = dishes.filter((dish) => {
      if (activeFilters.has('gf') && !dish.dietary_flags.includes('gf')) return false;
      if (activeFilters.has('vegan') && !dish.dietary_flags.includes('vegan')) return false;
      if (activeFilters.has('halal') && !dish.dietary_flags.includes('halal') && !dish.dietary_flags.includes('halal-friendly')) return false;
      if (activeFilters.has('high_protein') && dish.protein_grams < 35) return false;
      return true;
    });
    return (filtered.length > 0 ? filtered : dishes).slice(0, 2);
  }, [restaurant.id, activeFilters]);

  return (
    <div
      onClick={() => onSelectRestaurant(restaurant)}
      className="group relative flex flex-col rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-rose-500/50 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Media Stage: Aspect 16/10 */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-900">
        <img
          src={restaurant.hero_image_url}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        {/* Top-Left Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5 font-mono-numbers">
            <Clock className="w-3 h-3 text-rose-400" />
            {dynamicETA.etaWindow}
          </span>

          {restaurant.delivery_fee_cents === 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm">
              🌱 $0 Delivery Fee
            </span>
          )}
        </div>

        {/* Top-Right Provenance Icon */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProvenance(restaurant);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/70 text-white backdrop-blur-md border border-white/20 hover:bg-black/90 transition-all"
            title="Inspect health and kitchen provenance"
          >
            <span>{restaurant.is_virtual_kitchen ? '🍳 Commissary' : '🏛️ Dining Room'}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>

        {/* Bottom Banner inside Image: Live Kitchen Velocity & Promo */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs z-10">
          <div className={`px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] font-medium flex items-center gap-1.5 ${loadBadge.classes}`}>
            {loadBadge.icon}
            <span>{loadBadge.label}</span>
          </div>

          {restaurant.promo_badge && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white font-semibold text-[11px] shadow-sm backdrop-blur-md">
              {restaurant.promo_badge}
            </span>
          )}
        </div>
      </div>

      {/* Meta Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-lg text-[var(--text-primary)] group-hover:text-rose-600 transition-colors">
                {restaurant.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {restaurant.cuisine_tags.join(' • ')} • <span className="font-semibold">{restaurant.price_tier}</span>
              </p>
            </div>

            {/* Rating & Travel Score */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono-numbers text-xs font-bold border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {restaurant.rating_avg.toFixed(1)}
                <span className="text-[10px] text-[var(--text-muted)] font-normal">({restaurant.reviews_count})</span>
              </span>

              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <PackageCheck className="w-3 h-3" />
                {restaurant.travel_quality_score}% arrives hot
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-2 leading-relaxed">
            {restaurant.description}
          </p>

          {/* Matching Dishes Preview Carousel Chips */}
          {matchingDishes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--border-hairline)]">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-rose-500" />
                Dishes:
              </span>
              {matchingDishes.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-hairline)] truncate max-w-[140px]"
                >
                  {d.dietary_flags.includes('vegan') && '🌱'}
                  {d.dietary_flags.includes('gf') && '🌾'}
                  {d.dietary_flags.includes('halal') && '✨'}
                  {d.protein_grams >= 35 && '🥩'}
                  <span>{d.title}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* True-Cost Transparent Sub-line */}
        <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            <span>{restaurant.distance_miles} mi away</span>
          </div>

          <div className="text-right overflow-hidden">
            {showTrueCost ? (
              <span
                key="true-cost"
                className="price-roll-active inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono-numbers"
              >
                Est. {formatCents(restaurant.delivery_fee_cents + Math.round(2500 * (restaurant.service_fee_bps / 10000)))} total landed fees
              </span>
            ) : (
              <span
                key="base-cost"
                className="price-roll-active inline-block text-xs text-[var(--text-muted)] font-mono-numbers"
              >
                Delivery: {restaurant.delivery_fee_cents === 0 ? 'Free' : formatCents(restaurant.delivery_fee_cents)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
