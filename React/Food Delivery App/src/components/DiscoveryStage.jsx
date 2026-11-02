import React, { useState, useMemo } from 'react';
import { RestaurantCard } from './RestaurantCard';
import { CRAVING_CATEGORIES, DIETARY_GUARDRAILS, MENU_ITEMS } from '../data/restaurants';
import { Sparkles, SlidersHorizontal, RotateCcw, ShieldCheck, Flame, Zap } from 'lucide-react';
import { calculateDynamicETA } from '../services/spatialService';

export function DiscoveryStage({
  restaurants,
  showTrueCost,
  onSelectRestaurant,
  onOpenProvenance
}) {
  const [selectedCraving, setSelectedCraving] = useState('all');
  const [activeFilters, setActiveFilters] = useState(new Set());

  const handleToggleFilter = (filterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSelectedCraving('all');
    setActiveFilters(new Set());
  };

  // Filter restaurants based on category and guardrail chips
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      // Craving category
      if (selectedCraving !== 'all') {
        const cravingObj = CRAVING_CATEGORIES.find((c) => c.id === selectedCraving);
        if (cravingObj && cravingObj.tag) {
          const hasTag = r.cuisine_tags.some((t) =>
            t.toLowerCase().includes(cravingObj.tag.toLowerCase())
          );
          if (!hasTag) return false;
        }
      }

      // Guardrail filters
      if (activeFilters.has('free_delivery') && r.delivery_fee_cents > 0) {
        return false;
      }
      if (activeFilters.has('brick_mortar') && r.is_virtual_kitchen) {
        return false;
      }
      if (activeFilters.has('top_rated') && r.rating_avg < 4.8) {
        return false;
      }
      if (activeFilters.has('under_30')) {
        const eta = calculateDynamicETA(r);
        if (eta.transitMinutes + eta.prepMinutes > 25) return false;
      }

      // Dietary matching (check if restaurant has menu items satisfying dietary requirement)
      if (activeFilters.has('gf')) {
        const hasGF = MENU_ITEMS.some(
          (m) => m.restaurant_id === r.id && m.dietary_flags.includes('gf')
        );
        if (!hasGF) return false;
      }
      if (activeFilters.has('vegan')) {
        const hasVegan = MENU_ITEMS.some(
          (m) => m.restaurant_id === r.id && m.dietary_flags.includes('vegan')
        );
        if (!hasVegan) return false;
      }
      if (activeFilters.has('high_protein')) {
        const hasHighProtein = MENU_ITEMS.some(
          (m) => m.restaurant_id === r.id && m.protein_grams >= 35
        );
        if (!hasHighProtein) return false;
      }
      if (activeFilters.has('halal')) {
        const hasHalal = MENU_ITEMS.some(
          (m) => m.restaurant_id === r.id && (m.dietary_flags.includes('halal') || m.dietary_flags.includes('halal-friendly'))
        );
        if (!hasHalal) return false;
      }

      return true;
    });
  }, [restaurants, selectedCraving, activeFilters]);

  return (
    <div className="space-y-8 pb-16">
      {/* Editorial Hero Value Proposition Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 border border-[var(--border-hairline)] text-white p-6 sm:p-10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/90 to-rose-950/40" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> High-Trust Culinary Logistics
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight leading-tight">
            Zero fee surprises. Real dish travel-ability. Synchronized group dining.
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Every restaurant is stamped with live POS kitchen velocity, physical dining room inspection scores, and pre-authorized substitution safeguards.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-stone-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> 100% Verified Health Audits
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <Flame className="w-4 h-4" /> Live Kitchen Velocity Meter
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <Zap className="w-4 h-4" /> 6-Stage WebGL GPS Telemetry
            </span>
          </div>
        </div>
      </div>

      {/* Row 1: Visual Cuisine & Craving Icons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base sm:text-lg text-[var(--text-primary)]">
            Explore Curated Cravings
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Mission District & Hayes Valley</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {CRAVING_CATEGORIES.map((cat) => {
            const isActive = selectedCraving === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCraving(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/20 scale-102'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-rose-500/40'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Quick Guardrail Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-semibold shrink-0 pr-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Guardrails:</span>
          </div>

          {DIETARY_GUARDRAILS.map((chip) => {
            const isActive = activeFilters.has(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleToggleFilter(chip.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shrink-0 transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'bg-[var(--bg-surface)] border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-stone-400'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            );
          })}

          {(activeFilters.size > 0 || selectedCraving !== 'all') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold px-2.5 py-1 rounded-full shrink-0"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Restaurant Discovery Bento Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg sm:text-xl text-[var(--text-primary)]">
            Open Kitchens ({filteredRestaurants.length})
          </h2>
          {showTrueCost && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              💡 Upfront all-in landed fees active
            </span>
          )}
        </div>

        {filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                showTrueCost={showTrueCost}
                activeFilters={activeFilters}
                onSelectRestaurant={onSelectRestaurant}
                onOpenProvenance={onOpenProvenance}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No restaurants match your active guardrail filters.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Try relaxing your dietary constraints or selecting all cravings.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-md"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
