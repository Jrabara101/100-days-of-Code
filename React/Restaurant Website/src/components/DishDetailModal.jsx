import React from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { X, Flame, Wine, ShieldCheck, Utensils, Calendar, AlertTriangle } from 'lucide-react';

export default function DishDetailModal() {
  const {
    dishDetailModal,
    setDishDetailModal,
    openReservationModal,
    dietaryFilters
  } = useRestaurant();

  if (!dishDetailModal) return null;

  const dish = dishDetailModal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={() => setDishDetailModal(null)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
          aria-label="Close dish preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Hero Photography */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0">
          <img
            src={dish.image_url}
            alt={dish.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />
          
          <div className="absolute bottom-4 left-6 right-6 flex items-baseline justify-between">
            <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
              {dish.course_number}
            </span>
            <span className="font-mono-numbers text-2xl font-bold text-white bg-black/60 px-3 py-1 rounded-xl backdrop-blur-md">
              ${(dish.price_cents / 100).toFixed(0)}
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          <div>
            <h3 className="font-editorial text-3xl sm:text-4xl font-light text-[var(--text-primary)]">
              {dish.title}
            </h3>
            <p className="text-sm text-[var(--text-muted)] font-body leading-relaxed mt-2 font-light">
              {dish.description}
            </p>
          </div>

          {/* Chef Provenance Note */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-numbers uppercase text-[var(--accent-gold)] font-medium">
              <Flame className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>Chef Mateo's Provenance Record</span>
            </div>
            <p className="text-xs text-[var(--text-primary)] italic font-editorial leading-relaxed">
              "{dish.chef_provenance_note}"
            </p>
          </div>

          {/* Dietary & Allergen Profile */}
          <div className="space-y-2">
            <span className="text-xs font-mono-numbers uppercase tracking-wider text-[var(--text-muted)] block">
              Dietary Intelligence
            </span>
            <div className="flex flex-wrap gap-2">
              {dish.dietary_tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono-numbers bg-[var(--safe-fill)] text-[var(--safe-text)] border border-[var(--safe-border)]"
                >
                  ✓ {tag.replace('_', ' ').toUpperCase()}
                </span>
              ))}
              {dish.allergens_present && dish.allergens_present.length > 0 && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono-numbers bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  ⚠️ Contains: {dish.allergens_present.join(', ')}
                </span>
              )}
            </div>

            {dish.modification_instructions && (
              <div className="p-3 rounded-lg bg-[var(--modifiable-fill)] border border-[var(--modifiable-border)] text-xs font-mono-numbers text-[var(--modifiable-text)] flex items-start gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{dish.modification_instructions}</span>
              </div>
            )}
          </div>

          {/* Sommelier Pairing */}
          {dish.paired_beverage && (
            <div className="p-4 rounded-xl bg-[var(--wine-fill)] border border-[var(--wine-border)] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-numbers">
                <div className="flex items-center gap-1.5 text-[var(--wine-text)] font-semibold">
                  <Wine className="w-4 h-4" />
                  <span>Sommelier Pairing: {dish.paired_beverage.title}</span>
                </div>
                <span className="text-[var(--text-muted)]">{dish.paired_beverage.price}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-body leading-relaxed">
                {dish.paired_beverage.notes}
              </p>
              <div className="text-[10px] font-mono-numbers text-[var(--accent-gold)]">
                Acidity: {dish.paired_beverage.acidity} • Minerality: {dish.paired_beverage.minerality} • Body: {dish.paired_beverage.body}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between gap-4">
            <span className="text-xs font-mono-numbers text-[var(--text-muted)]">
              ★ Mentioned in {dish.mentions_count} verified diner reviews
            </span>

            <button
              onClick={() => {
                setDishDetailModal(null);
                openReservationModal();
              }}
              className="py-3 px-6 rounded-full bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-semibold shadow-lg shadow-[var(--brand-primary)]/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Reserve a Table to Taste →</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
