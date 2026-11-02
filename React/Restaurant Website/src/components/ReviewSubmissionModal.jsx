import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { X, Star, ShieldCheck, Check, Sparkles } from 'lucide-react';

export default function ReviewSubmissionModal() {
  const {
    reviewModalOpen,
    setReviewModalOpen,
    submitReview,
    menuItems,
    diningZones
  } = useRestaurant();

  const [form, setForm] = useState({
    name: '',
    confirmationCode: 'RES-8492',
    zoneName: "Chef's Open-Fire Counter",
    partySize: 2,
    ratingOverall: 5,
    ratingFood: 5,
    ratingService: 5,
    ratingAmbience: 5,
    noiseLevel: 'conversational',
    comment: '',
    favoriteDishes: ['Wood-Fired Breton Turbot', 'Agnolotti del Plin']
  });

  if (!reviewModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.comment) return;
    submitReview(form);
  };

  const toggleFavoriteDish = (dishTitle) => {
    setForm(prev => {
      const exists = prev.favoriteDishes.includes(dishTitle);
      return {
        ...prev,
        favoriteDishes: exists
          ? prev.favoriteDishes.filter(d => d !== dishTitle)
          : [...prev.favoriteDishes, dishTitle]
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-hairline)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-mono-numbers">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Diner Feedback</span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
              Submit Your Dining Notes
            </h3>
          </div>

          <button
            onClick={() => setReviewModalOpen(false)}
            className="p-2 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Reservation Verification Box */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] grid grid-cols-2 gap-3 text-xs font-mono-numbers">
            <div>
              <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">
                Reservation Code *
              </label>
              <input
                type="text"
                required
                value={form.confirmationCode}
                onChange={(e) => setForm(prev => ({ ...prev, confirmationCode: e.target.value }))}
                className="w-full p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                placeholder="Eleanor Vance"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Seated Zone & Party */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
                Seating Atmosphere
              </label>
              <select
                value={form.zoneName}
                onChange={(e) => setForm(prev => ({ ...prev, zoneName: e.target.value }))}
                className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:outline-none"
              >
                {diningZones.map(z => (
                  <option key={z.id} value={z.name} className="bg-[var(--bg-elevated)]">
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
                Acoustic Noise Perception
              </label>
              <select
                value={form.noiseLevel}
                onChange={(e) => setForm(prev => ({ ...prev, noiseLevel: e.target.value }))}
                className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--text-primary)] focus:outline-none"
              >
                <option value="quiet" className="bg-[var(--bg-elevated)]">Quiet &amp; Reverent (~52 dB)</option>
                <option value="conversational" className="bg-[var(--bg-elevated)]">Intimate &amp; Conversational (~64 dB)</option>
                <option value="lively" className="bg-[var(--bg-elevated)]">Lively &amp; Energetic (~74 dB)</option>
              </select>
            </div>
          </div>

          {/* Star Ratings Grid */}
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
            <span className="text-[11px] font-mono-numbers uppercase tracking-wider text-[var(--text-muted)] block">
              Dimensional Ratings (1 to 5 Stars)
            </span>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs font-mono-numbers">
              {[
                { key: 'ratingOverall', label: 'Overall Hospitality' },
                { key: 'ratingFood', label: 'Culinary Execution' },
                { key: 'ratingService', label: 'Service Warmth' },
                { key: 'ratingAmbience', label: 'Ambience & Acoustics' }
              ].map(ratingItem => (
                <div key={ratingItem.key} className="flex items-center justify-between">
                  <span className="text-[var(--text-primary)]">{ratingItem.label}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, [ratingItem.key]: star }))}
                        className={`text-base cursor-pointer transition-colors ${
                          star <= form[ratingItem.key] ? 'text-[var(--accent-gold)]' : 'text-[var(--border-hairline)]'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Dishes Multi-Select */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)]">
              Tag Dishes Ordered &amp; Loved
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
              {menuItems.map(dish => {
                const isSelected = form.favoriteDishes.includes(dish.title);
                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => toggleFavoriteDish(dish.title)}
                    className={`px-2 py-1 rounded text-[11px] font-mono-numbers transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--brand-primary)] text-[#FAF7F2]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
                    }`}
                  >
                    {dish.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Field */}
          <div>
            <label className="block text-[11px] font-mono-numbers uppercase text-[var(--text-muted)] mb-1">
              Your Review &amp; Culinary Experience *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Tell other diners about the food, the wood-smoke finish, table acoustics, and service timing..."
              value={form.comment}
              onChange={(e) => setForm(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-body text-[var(--text-primary)] focus:border-[var(--brand-primary)] focus:outline-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-bold shadow-lg shadow-[var(--brand-primary)]/20 transition-all cursor-pointer"
          >
            Post Verified Review to Ledger →
          </button>
        </form>

      </div>
    </div>
  );
}
