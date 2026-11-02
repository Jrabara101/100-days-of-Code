import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Star,
  MapPin,
  Search,
  Heart
} from 'lucide-react';
import { DishCard } from './DishCard';
import { MENU_ITEMS } from '../data/restaurants';
import { calculateDynamicETA } from '../services/spatialService';

export function RestaurantStorefrontView({
  restaurant,
  onBack,
  showTrueCost,
  cartItems,
  onSelectDish,
  onOpenGroupModal,
  onOpenProvenance,
  groupRoom
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [menuSearch, setMenuSearch] = useState('');
  const [highlightDietary, setHighlightDietary] = useState(null); // 'gf' | 'high-protein' | 'vegan'
  const [isFavorite, setIsFavorite] = useState(false);

  const dynamicETA = calculateDynamicETA(restaurant);

  // Dishes for this restaurant
  const restaurantDishes = useMemo(() => {
    return MENU_ITEMS.filter((m) => m.restaurant_id === restaurant.id);
  }, [restaurant.id]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(restaurantDishes.map((d) => d.category));
    return ['All', ...Array.from(set)];
  }, [restaurantDishes]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return restaurantDishes.filter((dish) => {
      if (activeCategory !== 'All' && dish.category !== activeCategory) {
        return false;
      }
      if (menuSearch.trim()) {
        const query = menuSearch.toLowerCase();
        const matches =
          dish.title.toLowerCase().includes(query) ||
          dish.description.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (highlightDietary) {
        if (highlightDietary === 'high-protein' && dish.protein_grams < 30) return false;
        if (highlightDietary === 'gf' && !dish.dietary_flags.includes('gf')) return false;
        if (highlightDietary === 'vegan' && !dish.dietary_flags.includes('vegan')) return false;
      }
      return true;
    });
  }, [restaurantDishes, activeCategory, menuSearch, highlightDietary]);

  // Cart quantity lookup for each dish
  const cartQuantityByDishId = useMemo(() => {
    const map = {};
    for (const item of cartItems) {
      map[item.menu_item_id] = (map[item.menu_item_id] || 0) + (item.quantity || 1);
    }
    return map;
  }, [cartItems]);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-rose-500 text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenGroupModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group Cart ({groupRoom.code})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 rounded-full border border-[var(--border-hairline)] transition-colors cursor-pointer ${
              isFavorite ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Panoramic Food Hero Banner with Elevated Restaurant Vitals */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 border border-[var(--border-hairline)] shadow-xl">
        <div className="h-48 sm:h-64 w-full relative overflow-hidden">
          <img
            src={restaurant.hero_image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-canvas)] via-black/40 to-black/60" />

          {/* Quick Badges inside Banner */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 text-white backdrop-blur-md border border-white/20 font-mono-numbers">
              ⚡ {dynamicETA.etaWindow}
            </span>
            <button
              type="button"
              onClick={() => onOpenProvenance(restaurant)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-black/70 text-white backdrop-blur-md border border-white/20 hover:bg-black/90 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{restaurant.is_virtual_kitchen ? '🍳 Commissary' : '🏛️ Dining Room'}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Elevated Vitals Card */}
        <div className="p-6 sm:p-8 -mt-12 relative z-20 mx-4 sm:mx-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)]">
                  {restaurant.name}
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] font-bold">
                  {restaurant.price_tier}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                {restaurant.cuisine_tags.join(' • ')} • {restaurant.description}
              </p>

              {/* Physical Street Address Link */}
              <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{restaurant.physical_street_address}</span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <button
                  type="button"
                  onClick={() => onOpenProvenance(restaurant)}
                  className="text-rose-600 hover:underline font-semibold"
                >
                  View Health & Inspection Audit ({restaurant.health_score}/100)
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onOpenGroupModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Start Group Order</span>
              </button>
            </div>
          </div>

          {/* Vitals Pills Row */}
          <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-wrap items-center gap-4 text-xs font-mono-numbers">
            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {restaurant.rating_avg.toFixed(1)} ({restaurant.reviews_count} reviews)
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              📦 {restaurant.travel_quality_score}% arrives hot & crispy
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
              ⚡ Firing in ~4m
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Menu Category Bar & Dietary Filters */}
      <div className="sticky top-16 z-30 backdrop-blur-xl bg-[var(--bg-canvas)]/95 py-3 border-y border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* In-Menu Search & Dietary Toggles */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setHighlightDietary(highlightDietary === 'gf' ? null : 'gf')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                highlightDietary === 'gf'
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-[var(--border-hairline)] text-[var(--text-muted)]'
              }`}
            >
              GF Only
            </button>
            <button
              type="button"
              onClick={() => setHighlightDietary(highlightDietary === 'vegan' ? null : 'vegan')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                highlightDietary === 'vegan'
                  ? 'border-teal-500 bg-teal-500/20 text-teal-700 dark:text-teal-300'
                  : 'border-[var(--border-hairline)] text-[var(--text-muted)]'
              }`}
            >
              Vegan
            </button>
            <button
              type="button"
              onClick={() => setHighlightDietary(highlightDietary === 'high-protein' ? null : 'high-protein')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                highlightDietary === 'high-protein'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'border-[var(--border-hairline)] text-[var(--text-muted)]'
              }`}
            >
              High-Protein
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Menu Items Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">
            {activeCategory === 'All' ? 'Culinary Selections' : activeCategory} ({filteredDishes.length})
          </h2>
          {showTrueCost && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              💡 Upfront all-in landed fees active
            </span>
          )}
        </div>

        {filteredDishes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                restaurant={restaurant}
                showTrueCost={showTrueCost}
                cartQuantity={cartQuantityByDishId[dish.id] || 0}
                onSelectDish={onSelectDish}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs text-[var(--text-muted)]">
            No dishes found matching your search and dietary filters in this category.
          </div>
        )}
      </div>
    </div>
  );
}
