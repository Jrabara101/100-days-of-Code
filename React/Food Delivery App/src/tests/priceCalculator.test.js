import { describe, it, expect } from 'vitest';
import {
  formatCents,
  calculateItemUnitCents,
  validateRequiredModifiers,
  calculateCartTotals,
  calculateSplitBill
} from '../services/priceCalculator.js';

describe('priceCalculator tests', () => {
  it('formats integer cents correctly into USD string', () => {
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(2450)).toBe('$24.50');
    expect(formatCents(99)).toBe('$0.99');
    expect(formatCents(-200)).toBe('-$2.00');
  });

  it('calculates item unit price with modifiers without floating point drift', () => {
    const base = 2200; // $22.00
    const modifiers = [
      { id: '1', price_delta_cents: 250 }, // +$2.50
      { id: '2', price_delta_cents: 450 }  // +$4.50
    ];
    const total = calculateItemUnitCents(base, modifiers);
    expect(total).toBe(2900); // $29.00
  });

  it('validates required modifier groups properly', () => {
    const groups = [
      { id: 'g1', name: 'Choice of Pasta Shape', min_select: 1, is_required: true },
      { id: 'g2', name: 'Spice Level', min_select: 1, is_required: true },
      { id: 'g3', name: 'Extra Cheese', min_select: 0, is_required: false }
    ];

    const selectedPartial = [
      { group_id: 'g1', option_id: 'o1' }
    ];

    const result = validateRequiredModifiers(groups, selectedPartial);
    expect(result.isValid).toBe(false);
    expect(result.missingGroups).toContain('Spice Level');

    const selectedFull = [
      { group_id: 'g1', option_id: 'o1' },
      { group_id: 'g2', option_id: 'o2' }
    ];
    const fullResult = validateRequiredModifiers(groups, selectedFull);
    expect(fullResult.isValid).toBe(true);
    expect(fullResult.missingGroups).toHaveLength(0);
  });

  it('calculates cart totals with routing tiers and free delivery unlocks', () => {
    const items = [
      { unit_computed_cents: 2200, quantity: 1 },
      { unit_computed_cents: 1800, quantity: 1 }
    ]; // $40.00 total (unlocks $35 free delivery threshold)

    const totals = calculateCartTotals(items, {
      baseDeliveryFeeCents: 299,
      freeDeliveryMinCents: 3500,
      routingTier: 'standard',
      serviceFeeBps: 1000 // 10%
    });

    expect(totals.itemsSubtotalCents).toBe(4000);
    expect(totals.isFreeDeliveryUnlocked).toBe(true);
    expect(totals.deliveryFeeCents).toBe(0);
    expect(totals.serviceFeeCents).toBe(400); // 10% of $40.00
  });

  it('calculates Eco-Saver and Priority Direct routing correctly', () => {
    const items = [{ unit_computed_cents: 2000, quantity: 1 }]; // $20.00

    const priorityTotals = calculateCartTotals(items, {
      baseDeliveryFeeCents: 299,
      freeDeliveryMinCents: 3500,
      routingTier: 'priority_direct'
    });
    // $2.99 base + $2.99 priority = $5.98
    expect(priorityTotals.deliveryFeeCents).toBe(598);

    const ecoTotals = calculateCartTotals(items, {
      baseDeliveryFeeCents: 299,
      freeDeliveryMinCents: 3500,
      routingTier: 'eco_saver'
    });
    // $2.99 base - $2.00 discount = $0.99 (99 cents)
    expect(ecoTotals.deliveryFeeCents).toBe(99);
  });

  it('calculates split bill proportionally with zero penny leakage', () => {
    const items = [
      { participant_name: 'Host', unit_computed_cents: 3000, quantity: 1 }, // $30
      { participant_name: 'Maya', unit_computed_cents: 1000, quantity: 1 }  // $10
    ]; // $40 subtotal, Host is 75%, Maya is 25%

    const totals = calculateCartTotals(items, {
      baseDeliveryFeeCents: 0,
      freeDeliveryMinCents: 0,
      serviceFeeBps: 1000, // $4.00
      taxRateBps: 1000,    // $4.00
      tipPercentage: 20    // $8.00
    }); // Total overhead = $16.00 ($4 + $4 + $8)

    const splits = calculateSplitBill(items, totals);
    expect(splits).toHaveLength(2);

    const hostSplit = splits.find(s => s.name === 'Host');
    const mayaSplit = splits.find(s => s.name === 'Maya');

    expect(hostSplit.itemsSubtotalCents).toBe(3000);
    expect(mayaSplit.itemsSubtotalCents).toBe(1000);

    // Sum of split totals must equal grand total exactly
    const sumSplits = hostSplit.totalOwedCents + mayaSplit.totalOwedCents;
    expect(sumSplits).toBe(totals.totalChargedCents);
  });
});
