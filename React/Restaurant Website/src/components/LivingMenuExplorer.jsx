import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { SERVICE_PERIODS, DIETARY_PRESETS } from '../data/mockData';
import {
  Wine,
  Sparkles,
  Flame,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Camera,
  RotateCcw,
  Sliders,
  Filter
} from 'lucide-react';

export default function LivingMenuExplorer() {
  const {
    activeServicePeriod,
    setActiveServicePeriod,
    dietaryFilters,
    toggleDietaryFilter,
    clearDietaryFilters,
    dietaryAssessment,
    menuItems,
    setDishDetailModal,
    openReservationModal
  } = useRestaurant();

  // Expanded sommelier pairing card state (set of dish IDs)
  const [expandedPairings, setExpandedPairings] = useState(new Set());

  const togglePairing = (dishId) => {
    setExpandedPairings(prev => {
      const next = new Set(prev);
      if (next.has(dishId)) {
        next.delete(dishId);
      } else {
        next.add(dishId);
      }
      return next;
    });
  };

  // Filter dishes by active service period
  const filteredDishes = useMemo(() => {
    return menuItems.filter(item => {
      if (activeServicePeriod === 'beverage') return true; // Sommelier shows all with pairings
      return item.service_period === activeServicePeriod;
    });
  }, [menuItems, activeServicePeriod]);

  // Group dishes by course
  const coursesGrouped = useMemo(() => {
    const groups = {};
    filteredDishes.forEach(dish => {
      const course = dish.course_number || '01 // SPECIALTIES';
      if (!groups[course]) groups[course] = [];
      groups[course].push(dish);
    });
    return groups;
  }, [filteredDishes]);

  const { itemsStatus, safeCount, modifiableCount, dimmedCount } = dietaryAssessment;

  return (
    <section id="menu" className="py-20 lg:py-28 bg-[var(--bg-canvas)] border-b border-[var(--border-hairline)] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-xs font-mono-numbers text-[var(--accent-gold)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Living Culinary Menu • Zero-PDF Ergonomics</span>
          </div>
          
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-light text-[var(--text-primary)] tracking-tight">
            The Living Culinary Ledger
          </h2>
          
          <p className="text-base text-[var(--text-muted)] font-body font-light leading-relaxed">
            Sub-millisecond dietary intelligence that guarantees safe dining without hiding the culinary craft. Select your guardrails below to illuminate compatible plates.
          </p>
        </div>

        {/* Sticky Control Deck */}
        <div className="sticky top-20 z-30 mb-12 -mx-4 sm:mx-0 p-4 sm:p-5 rounded-2xl bg-[var(--bg-canvas)]/95 backdrop-blur-xl border border-[var(--border-hairline)] shadow-lg space-y-4">
          
          {/* Row 1 — Service Chapter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SERVICE_PERIODS.map(period => {
              const isActive = activeServicePeriod === period.id;
              return (
                <button
                  key={period.id}
                  onClick={() => setActiveServicePeriod(period.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-mono-numbers uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--brand-primary)] text-[#FAF7F2] font-semibold shadow-md shadow-[var(--brand-primary)]/20'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-hairline)]'
                  }`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>

          {/* Row 2 — Personal Dietary & Allergen Guardrail Bar */}
          <div className="pt-2 border-t border-[var(--border-hairline)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
              <span className="text-[11px] font-mono-numbers text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-[var(--accent-gold)]" />
                <span>Guardrails:</span>
              </span>

              {DIETARY_PRESETS.map(preset => {
                const isSelected = dietaryFilters.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    onClick={() => toggleDietaryFilter(preset.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-numbers transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--safe-fill)] text-[var(--safe-text)] border border-[var(--safe-border)] font-medium shadow-sm'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)]'
                    }`}
                    title={preset.description}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}

              {dietaryFilters.length > 0 && (
                <button
                  onClick={clearDietaryFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono-numbers text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Filter Summary Pill */}
            {dietaryFilters.length > 0 && (
              <div className="text-[11px] font-mono-numbers text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-full border border-[var(--border-hairline)] whitespace-nowrap self-start sm:self-auto">
                <span className="text-[var(--safe-text)] font-semibold">{safeCount} safe</span>
                <span className="opacity-40"> • </span>
                <span className="text-[var(--modifiable-text)] font-semibold">{modifiableCount} modifiable</span>
                <span className="opacity-40"> • </span>
                <span className="opacity-60">{dimmedCount} dimmed</span>
              </div>
            )}
          </div>

        </div>

        {/* 2-Column Editorial Menu Layout */}
        <div className="space-y-16">
          {Object.entries(coursesGrouped).map(([courseName, dishes]) => (
            <div key={courseName} className="space-y-6">
              
              {/* Course Section Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <h3 className="font-mono-numbers text-xs sm:text-sm uppercase tracking-[0.2em] text-[var(--accent-gold)] font-medium">
                  {courseName}
                </h3>
                <span className="font-mono-numbers text-[11px] text-[var(--text-muted)]">
                  {dishes.length} {dishes.length === 1 ? 'Preparation' : 'Preparations'}
                </span>
              </div>

              {/* Dish Items Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-10">
                {dishes.map(dish => {
                  const statusInfo = itemsStatus[dish.id] || { status: 'SAFE' };
                  const isDimmed = statusInfo.status === 'CONTAINS_ALLERGEN';
                  const isModifiable = statusInfo.status === 'MODIFIABLE';
                  const isSafeFiltered = dietaryFilters.length > 0 && statusInfo.status === 'SAFE';
                  const pairingExpanded = expandedPairings.has(dish.id);

                  return (
                    <article
                      key={dish.id}
                      className={`group relative p-5 rounded-xl border transition-all duration-300 ${
                        isDimmed
                          ? 'opacity-35 hover:opacity-75 bg-[var(--bg-surface)]/20 border-dashed border-[var(--border-hairline)]'
                          : isModifiable
                          ? 'bg-[var(--modifiable-fill)]/40 border-[var(--modifiable-border)] shadow-sm'
                          : isSafeFiltered
                          ? 'bg-[var(--safe-fill)]/30 border-[var(--safe-border)] shadow-sm'
                          : 'bg-[var(--bg-surface)]/60 hover:bg-[var(--bg-elevated)] border-[var(--border-hairline)] hover:border-[var(--accent-gold)]/40'
                      }`}
                    >
                      {/* Top Row: Title, Dietary Badges, Dotted Line, Tabular Price */}
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h4 className="font-editorial text-2xl sm:text-2xl font-normal text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                            {dish.title}
                          </h4>

                          {/* Live Dietary Badges */}
                          {dish.dietary_tags.map(tag => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono-numbers uppercase tracking-wider bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-muted)]"
                            >
                              {tag.replace('_', ' ')}
                            </span>
                          ))}
                        </div>

                        {/* Leader & Price */}
                        <div className="flex items-baseline gap-2 pl-2 whitespace-nowrap">
                          <span className="font-mono-numbers text-lg font-medium text-[var(--text-primary)]">
                            ${(dish.price_cents / 100).toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Ingredients & Provenance Description */}
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed font-body font-light mb-2">
                        {dish.description}
                      </p>

                      <p className="text-xs text-[var(--accent-gold)] italic font-editorial leading-normal mb-3">
                        Provenance: {dish.chef_provenance_note}
                      </p>

                      {/* Conditional Dietary Guardrail Callout */}
                      {dietaryFilters.length > 0 && (
                        <div className="mb-3">
                          {isModifiable && (
                            <div className="p-2.5 rounded-lg bg-[var(--modifiable-fill)] border border-[var(--modifiable-border)] text-xs font-mono-numbers text-[var(--modifiable-text)] flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{statusInfo.instruction}</span>
                            </div>
                          )}
                          {isDimmed && (
                            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-mono-numbers text-rose-400 flex items-center gap-2">
                              <span>⚠️ Contains non-omittable {statusInfo.reasons?.join(', ')}.</span>
                            </div>
                          )}
                          {isSafeFiltered && (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono-numbers text-[var(--safe-text)]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verified Naturally Safe for your profile</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Live Scarcity & Social Proof Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)]/50 text-[11px] font-mono-numbers">
                        <div className="flex items-center gap-2">
                          {dish.is_86d ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium">
                              🚫 86'd for Tonight
                            </span>
                          ) : dish.remaining_portions !== null && dish.remaining_portions <= 5 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-semibold animate-pulse">
                              <Flame className="w-3 h-3" />
                              <span>Only {dish.remaining_portions} portions remaining tonight</span>
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">
                              ★ Mentioned in {dish.mentions_count} verified reviews
                            </span>
                          )}
                        </div>

                        {/* Dish Photo Lightbox Trigger */}
                        <button
                          onClick={() => setDishDetailModal(dish)}
                          className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <Camera className="w-3 h-3 text-[var(--brand-primary)]" />
                          <span>View Plate</span>
                        </button>
                      </div>

                      {/* Expandable Sommelier Beverage Pairing Drawer */}
                      {dish.paired_beverage && (
                        <div className="mt-3">
                          <button
                            onClick={() => togglePairing(dish.id)}
                            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[var(--wine-fill)] hover:bg-[var(--wine-fill)]/80 border border-[var(--wine-border)] text-xs font-mono-numbers text-[var(--wine-text)] transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Wine className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                Sommelier Pairing: {dish.paired_beverage.title} ({dish.paired_beverage.price.split('•')[0]})
                              </span>
                            </div>
                            {pairingExpanded ? (
                              <ChevronUp className="w-4 h-4 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 shrink-0" />
                            )}
                          </button>

                          {/* Expanded Sommelier Card */}
                          {pairingExpanded && (
                            <div className="mt-2 p-3.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--wine-border)] space-y-2.5 animate-fadeIn">
                              <div className="flex items-baseline justify-between border-b border-[var(--border-hairline)] pb-1.5">
                                <span className="font-editorial text-base text-[var(--text-primary)]">
                                  {dish.paired_beverage.title}
                                </span>
                                <span className="text-[11px] font-mono-numbers text-[var(--wine-text)]">
                                  {dish.paired_beverage.price}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono-numbers text-[var(--text-muted)]">
                                <div>
                                  <span className="block opacity-60 uppercase">Acidity</span>
                                  <span className="text-[var(--text-primary)] font-medium">{dish.paired_beverage.acidity}</span>
                                </div>
                                <div>
                                  <span className="block opacity-60 uppercase">Minerality</span>
                                  <span className="text-[var(--text-primary)] font-medium truncate">{dish.paired_beverage.minerality}</span>
                                </div>
                                <div>
                                  <span className="block opacity-60 uppercase">Body</span>
                                  <span className="text-[var(--text-primary)] font-medium">{dish.paired_beverage.body}</span>
                                </div>
                              </div>

                              <p className="text-xs text-[var(--text-muted)] font-body leading-relaxed">
                                {dish.paired_beverage.notes}
                              </p>

                              <div className="text-[10px] font-mono-numbers text-[var(--accent-gold)] pt-1">
                                <span>Curated by Master Sommelier Hélène Vance • {dish.paired_beverage.region}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </article>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Reservation Reminder Bar */}
        <div className="mt-16 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-editorial text-2xl text-[var(--text-primary)]">
              Experience these dishes at the Hearth
            </h4>
            <p className="text-xs font-mono-numbers text-[var(--text-muted)]">
              Pick your exact seat in our interactive architectural floorplan with sightline previews.
            </p>
          </div>

          <button
            onClick={() => openReservationModal()}
            className="px-6 py-3 rounded-full bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-[#FAF7F2] text-xs font-mono-numbers uppercase tracking-wider font-semibold shadow-lg shadow-[var(--brand-primary)]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Select Your Table on the Floorplan →
          </button>
        </div>

      </div>
    </section>
  );
}
