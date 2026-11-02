import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import {
  Star,
  ShieldCheck,
  Volume2,
  Utensils,
  Filter,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function VerifiedReviewShowcase() {
  const {
    reviews,
    setReviewModalOpen,
    setDishDetailModal,
    menuItems
  } = useRestaurant();

  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');
  const [selectedDishFilter, setSelectedDishFilter] = useState('all');

  // Top recommended dishes
  const topRecommendedDishes = [
    { title: 'Agnolotti del Plin', count: 94, dishId: 'dish-3' },
    { title: 'Wood-Fired Breton Turbot', count: 88, dishId: 'dish-5' },
    { title: 'Dry-Aged Rohan Duck Breast', count: 78, dishId: 'dish-6' },
    { title: 'Burnt Basque Hearth Cheesecake', count: 61, dishId: 'dish-8' }
  ];

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const zoneMatches = selectedZoneFilter === 'all' || rev.seated_zone_name.includes(selectedZoneFilter);
      const dishMatches = selectedDishFilter === 'all' || (rev.favorite_dish_names && rev.favorite_dish_names.includes(selectedDishFilter));
      return zoneMatches && dishMatches;
    });
  }, [reviews, selectedZoneFilter, selectedDishFilter]);

  const handleDishTagClick = (dishName) => {
    const dish = menuItems.find(m => m.title.toLowerCase() === dishName.toLowerCase());
    if (dish) {
      setDishDetailModal(dish);
    } else {
      setSelectedDishFilter(dishName === selectedDishFilter ? 'all' : dishName);
    }
  };

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-[var(--bg-canvas)] border-b border-[var(--border-hairline)] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--accent-gold)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Reservation-Verified Diner Ledger</span>
          </div>
          
          <h2 className="font-editorial text-4xl sm:text-5xl font-light text-[var(--text-primary)] tracking-tight">
            Verified Diner Sentiment
          </h2>
          
          <p className="text-base text-[var(--text-muted)] font-body font-light leading-relaxed">
            Every review is stamped with cryptographic proof of a completed table reservation, seating zone, and meal pacing. Zero unverified noise.
          </p>
        </div>

        {/* 4-Column Bento Hospitality Scorecard Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* Card 1: Overall Score */}
          <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-sm space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider block">
                Overall Hospitality
              </span>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="font-editorial text-5xl font-light text-[var(--text-primary)]">
                  4.92
                </span>
                <span className="font-editorial text-2xl text-[var(--accent-gold)]">★</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-hairline)]">
              <span className="text-xs font-mono-numbers text-[var(--text-muted)]">
                Based on 640 reservation-verified visits
              </span>
            </div>
          </div>

          {/* Card 2: Dimensional Breakdown */}
          <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-sm space-y-3">
            <span className="text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider block">
              Dimensional Execution
            </span>

            <div className="space-y-2 text-xs font-mono-numbers">
              <div>
                <div className="flex justify-between text-[var(--text-primary)] mb-1">
                  <span>Culinary Execution</span>
                  <span className="font-semibold">4.9 / 5.0</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--brand-primary)] rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[var(--text-primary)] mb-1">
                  <span>Service Warmth</span>
                  <span className="font-semibold">4.9 / 5.0</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent-gold)] rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[var(--text-primary)] mb-1">
                  <span>Pacing &amp; Timing</span>
                  <span className="font-semibold">4.8 / 5.0</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Live Acoustic & Noise Meter */}
          <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider">
                  Noise &amp; Acoustic Meter
                </span>
                <Volume2 className="w-4 h-4 text-[var(--accent-gold)]" />
              </div>

              <div className="pt-2">
                <span className="font-editorial text-2xl font-normal text-[var(--text-primary)] block">
                  Intimate &amp; Conversational
                </span>
                <span className="text-xs font-mono-numbers text-emerald-500 font-medium">
                  Average ~64 Decibels
                </span>
              </div>
            </div>

            {/* Spectrum Bar */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--border-hairline)]">
              <div className="relative h-2 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full"
                  style={{ width: '100%' }}
                />
                <div
                  className="absolute top-0 bottom-0 w-2.5 h-2.5 -mt-0.25 bg-white border border-black rounded-full shadow-md"
                  style={{ left: '48%' }}
                />
              </div>

              <div className="flex justify-between text-[9px] font-mono-numbers text-[var(--text-muted)] uppercase">
                <span>Quiet (52 dB)</span>
                <span className="text-[var(--text-primary)] font-bold">~64 dB Active</span>
                <span>Lively (74 dB)</span>
              </div>
            </div>
          </div>

          {/* Card 4: Review Submission Trigger */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] tracking-wider block">
                Post-Meal Feedback
              </span>
              <h4 className="font-editorial text-xl text-[var(--text-primary)] mt-1">
                Dined with us recently?
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-body leading-relaxed mt-1">
                Submit your verified dining notes using your reservation confirmation code.
              </p>
            </div>

            <button
              onClick={() => setReviewModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-md"
            >
              + Submit Verified Review
            </button>
          </div>

        </div>

        {/* Most-Mentioned Dishes Cross-Linking Strip */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
            <span className="text-xs font-mono-numbers uppercase tracking-wider text-[var(--text-primary)] font-semibold">
              Top Diner-Recommended Plates:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {topRecommendedDishes.map(rec => (
              <button
                key={rec.title}
                onClick={() => handleDishTagClick(rec.title)}
                className="px-3 py-1.5 rounded-full bg-[var(--bg-canvas)] hover:bg-[var(--brand-primary)]/10 border border-[var(--border-hairline)] hover:border-[var(--brand-primary)] text-xs font-mono-numbers text-[var(--text-primary)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{rec.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--border-hairline)] text-[var(--text-muted)]">
                  ★ {rec.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar by Zone */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          <span className="text-[11px] font-mono-numbers text-[var(--text-muted)] uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Atmosphere:</span>
          </span>

          {['all', 'Counter', 'Courtyard', 'Main Dining', 'Vault'].map(zoneKey => (
            <button
              key={zoneKey}
              onClick={() => setSelectedZoneFilter(zoneKey)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono-numbers transition-all cursor-pointer ${
                selectedZoneFilter === zoneKey
                  ? 'bg-[var(--brand-primary)] text-[#FAF7F2] font-semibold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
              }`}
            >
              {zoneKey === 'all' ? 'All Dining Zones' : zoneKey}
            </button>
          ))}

          {selectedDishFilter !== 'all' && (
            <button
              onClick={() => setSelectedDishFilter('all')}
              className="px-3 py-1.5 rounded-full text-xs font-mono-numbers bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1"
            >
              <span>Dish: {selectedDishFilter} ✕</span>
            </button>
          )}
        </div>

        {/* Verified Reviews Stream */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map(review => (
            <div
              key={review.id}
              className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-sm space-y-4 hover:border-[var(--accent-gold)]/40 transition-colors"
            >
              {/* Review Card Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
                <div>
                  <h4 className="font-editorial text-xl font-normal text-[var(--text-primary)]">
                    {review.reviewer_name}
                  </h4>
                  <div className="flex items-center gap-1 text-[var(--accent-gold)] text-xs font-mono-numbers mt-0.5">
                    {Array.from({ length: review.rating_overall }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                    <span className="ml-1 text-[var(--text-muted)] text-[11px]">• {review.visited_at}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono-numbers font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Reservation</span>
                  </span>
                  <span className="text-[10px] font-mono-numbers text-[var(--text-muted)] mt-1">
                    {review.seated_zone_name} • Party of {review.party_size}
                  </span>
                </div>
              </div>

              {/* Review Comment Body */}
              <p className="text-sm font-body text-[var(--text-muted)] leading-relaxed font-light">
                "{review.comment}"
              </p>

              {/* Tagged Favorite Dishes */}
              {review.favorite_dish_names && review.favorite_dish_names.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono-numbers text-[var(--text-muted)] uppercase">Ordered:</span>
                  {review.favorite_dish_names.map(dishName => (
                    <button
                      key={dishName}
                      onClick={() => handleDishTagClick(dishName)}
                      className="px-2 py-0.5 rounded text-[11px] font-mono-numbers bg-[var(--bg-surface)] hover:bg-[var(--brand-primary)]/10 text-[var(--text-primary)] border border-[var(--border-hairline)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                    >
                      🍽️ {dishName}
                    </button>
                  ))}
                </div>
              )}

              {/* Management Reply Note */}
              {review.management_reply && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border-l-2 border-[var(--brand-primary)] text-xs space-y-1">
                  <span className="font-mono-numbers text-[10px] uppercase font-semibold text-[var(--accent-gold)] block">
                    Response from General Manager &amp; Chef Mateo:
                  </span>
                  <p className="font-body text-[var(--text-muted)] italic leading-relaxed">
                    "{review.management_reply}"
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
