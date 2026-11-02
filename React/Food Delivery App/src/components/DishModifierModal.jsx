import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Check, ShieldAlert, Sparkles, Plus, Minus } from 'lucide-react';
import { formatCents, calculateItemUnitCents, validateRequiredModifiers } from '../services/priceCalculator';

export function DishModifierModal({
  isOpen,
  onClose,
  dish,
  onAddToCart,
  currentUser = 'You (Host)'
}) {
  // Selected modifiers state: array of { group_id, option_id, name, price_delta_cents, calories_delta }
  const [selectedModifiers, setSelectedModifiers] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [substitutionPolicy, setSubstitutionPolicy] = useState('chef_choice'); // 'chef_choice' | 'refund_item' | 'cancel_order' | 'specific_item'
  const [specificSubstitutionText, setSpecificSubstitutionText] = useState('');

  // Refs for auto-scrolling to next unsatisfied required group
  const groupRefs = useRef({});

  // Reset local state whenever modal opens or dish changes
  useEffect(() => {
    if (isOpen && dish) {
      setSelectedModifiers([]);
      setQuantity(1);
      setSpecialInstructions('');
      setSubstitutionPolicy('chef_choice');
      setSpecificSubstitutionText('');
    }
  }, [isOpen, dish?.id]);

  // Compute unit price & macros safely
  const unitPriceCents = useMemo(() => {
    if (!dish) return 0;
    return calculateItemUnitCents(dish.base_price_cents || 0, selectedModifiers);
  }, [dish?.base_price_cents, selectedModifiers]);

  const totalCalories = useMemo(() => {
    if (!dish) return 0;
    const delta = selectedModifiers.reduce((sum, m) => sum + (m.calories_delta || 0), 0);
    return Math.max(0, (dish.calories || 0) + delta);
  }, [dish?.calories, selectedModifiers]);

  // Validation
  const validation = useMemo(() => {
    if (!dish) return { isValid: true, missingGroups: [], exceededGroups: [] };
    return validateRequiredModifiers(dish.modifier_groups || [], selectedModifiers);
  }, [dish?.modifier_groups, selectedModifiers]);

  if (!isOpen || !dish) return null;

  const handleToggleOption = (group, option) => {
    const isSingleSelect = group.max_select === 1;

    setSelectedModifiers((prev) => {
      let next;
      const alreadySelected = prev.some((m) => m.option_id === option.id);

      if (alreadySelected) {
        // Toggle off
        next = prev.filter((m) => m.option_id !== option.id);
      } else {
        if (isSingleSelect) {
          // Remove others from this group first
          const filtered = prev.filter((m) => m.group_id !== group.id);
          next = [
            ...filtered,
            {
              group_id: group.id,
              option_id: option.id,
              name: option.name,
              price_delta_cents: option.price_delta_cents,
              calories_delta: option.calories_delta
            }
          ];

          // Auto-scroll to next required group if any
          const remainingGroups = (dish.modifier_groups || []).filter(
            (g) => g.id !== group.id && g.is_required
          );
          for (const nextGroup of remainingGroups) {
            const isGroupSatisfied = next.some((m) => m.group_id === nextGroup.id);
            if (!isGroupSatisfied && groupRefs.current[nextGroup.id]) {
              setTimeout(() => {
                groupRefs.current[nextGroup.id]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest'
                });
              }, 100);
              break;
            }
          }
        } else {
          // Multi-select: check max_select
          const currentGroupCount = prev.filter((m) => m.group_id === group.id).length;
          if (currentGroupCount >= group.max_select) {
            return prev; // cap reached
          }
          next = [
            ...prev,
            {
              group_id: group.id,
              option_id: option.id,
              name: option.name,
              price_delta_cents: option.price_delta_cents,
              calories_delta: option.calories_delta
            }
          ];
        }
      }
      return next;
    });
  };

  const handleAdd = () => {
    if (!validation.isValid) return;

    onAddToCart({
      cart_item_id: `cart-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      menu_item_id: dish.id,
      title: dish.title,
      image_url: dish.image_url,
      base_price_cents: dish.base_price_cents,
      unit_computed_cents: unitPriceCents,
      quantity,
      selected_modifiers: selectedModifiers,
      substitution_policy: substitutionPolicy,
      specific_substitution_text: substitutionPolicy === 'specific_item' ? specificSubstitutionText : null,
      special_instructions: specialInstructions,
      participant_name: currentUser,
      packaging_note: dish.packaging_note
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Sticky Header with Close */}
        <div className="relative h-48 sm:h-56 w-full shrink-0 overflow-hidden bg-stone-900">
          <img
            src={dish.image_url}
            alt={dish.title}
            className="w-full h-full object-cover brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-black/30 to-black/60" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-transform active:scale-95 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Dish Badges over photo */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
            {dish.is_featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-stone-950 flex items-center gap-1 shadow-md">
                ★ #1 Most Liked
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-emerald-400 backdrop-blur-md border border-emerald-500/30 flex items-center gap-1">
              📦 {dish.travel_quality_score}/5.0 Travels Great
            </span>
          </div>

          {/* Title on Banner */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="font-display font-bold text-xl sm:text-2xl drop-shadow-sm">
              {dish.title}
            </h2>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-200 mt-1 font-mono-numbers">
              <span className="font-bold text-rose-400 text-base">{formatCents(dish.base_price_cents)}</span>
              <span>•</span>
              <span>{totalCalories} cal</span>
              <span>•</span>
              <span>{dish.protein_grams}g protein</span>
            </div>
          </div>
        </div>

        {/* Scrollable Modifier Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Ingredient Description */}
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
            {dish.description}
          </p>

          {/* Travel Packaging Integrity Note */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
            <span><strong>Packaging Safeguard:</strong> {dish.packaging_note}</span>
          </div>

          {/* Modifier Groups */}
          {(dish.modifier_groups || []).map((group) => {
            const selectedInGroup = selectedModifiers.filter((m) => m.group_id === group.id);
            const isSatisfied = group.is_required
              ? selectedInGroup.length >= group.min_select
              : true;

            return (
              <div
                key={group.id}
                ref={(el) => (groupRefs.current[group.id] = el)}
                className="space-y-3 pt-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)]">
                      {group.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {group.max_select === 1 ? 'Choose 1 option' : `Choose up to ${group.max_select}`}
                    </p>
                  </div>

                  {/* Required vs Completed Pill Shift */}
                  {group.is_required && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all duration-300 ${
                        isSatisfied
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {isSatisfied ? '✓ Completed' : `Required • Select ${group.min_select}`}
                    </span>
                  )}
                  {!group.is_required && (
                    <span className="text-xs font-medium text-[var(--text-muted)] px-2.5 py-0.5 rounded-full bg-[var(--bg-surface)]">
                      Optional
                    </span>
                  )}
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {group.options.map((option) => {
                    const isChecked = selectedModifiers.some((m) => m.option_id === option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggleOption(group, option)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                          isChecked
                            ? 'border-rose-500 bg-rose-500/5 shadow-sm'
                            : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-stone-400 dark:hover:border-stone-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-${group.max_select === 1 ? 'full' : 'md'} border flex items-center justify-center transition-colors ${
                              isChecked
                                ? 'bg-rose-500 border-rose-500 text-white'
                                : 'border-stone-400 dark:border-stone-600'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {option.name}
                          </span>
                        </div>

                        <div className="text-right tabular-nums text-xs font-mono">
                          <span className={option.price_delta_cents > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-[var(--text-muted)]'}>
                            {option.price_delta_cents > 0
                              ? `+${formatCents(option.price_delta_cents)}`
                              : 'Included'}
                          </span>
                          {option.calories_delta !== 0 && (
                            <span className="text-[var(--text-muted)] ml-2 text-[11px]">
                              {option.calories_delta > 0 ? `+${option.calories_delta} cal` : `${option.calories_delta} cal`}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Pre-Authorized "If Sold Out" Fallback Selector */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <div>
                <h4 className="font-display font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                  Pre-Authorized "If Sold Out" Substitution Safeguard
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Eliminates phone tag when an ingredient is 86'd during dinner rush
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSubstitutionPolicy('chef_choice')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  substitutionPolicy === 'chef_choice'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}
              >
                ✓ Swap with Chef's Closest Match
              </button>

              <button
                type="button"
                onClick={() => setSubstitutionPolicy('refund_item')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  substitutionPolicy === 'refund_item'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}
              >
                Refund This Item Only & Keep Order
              </button>

              <button
                type="button"
                onClick={() => setSubstitutionPolicy('cancel_order')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  substitutionPolicy === 'cancel_order'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}
              >
                Cancel Entire Order
              </button>

              <button
                type="button"
                onClick={() => setSubstitutionPolicy('specific_item')}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  substitutionPolicy === 'specific_item'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                }`}
              >
                Replace with Specific Dish...
              </button>
            </div>

            {substitutionPolicy === 'specific_item' && (
              <input
                type="text"
                value={specificSubstitutionText}
                onChange={(e) => setSpecificSubstitutionText(e.target.value)}
                placeholder="e.g. Pappardelle Bolognese or Margherita Pizza"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
              />
            )}
          </div>

          {/* Special Preparation Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Special Chef Instructions
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Extra crispy prosciutto, dressing on side..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-primary)] focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-4 sm:p-5 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-2xl px-3 py-2 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] disabled:opacity-30"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono-numbers font-bold text-sm w-4 text-center text-[var(--text-primary)]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!validation.isValid}
            className={`flex-1 py-3 px-5 rounded-2xl font-semibold text-sm sm:text-base flex items-center justify-between shadow-lg transition-all active:scale-[0.99] ${
              validation.isValid
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                : 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            <span>
              {validation.isValid
                ? 'Add to Order'
                : `Select: ${validation.missingGroups[0] || 'Required Options'}`}
            </span>
            <span className="font-mono-numbers font-bold">
              {formatCents(unitPriceCents * quantity)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
