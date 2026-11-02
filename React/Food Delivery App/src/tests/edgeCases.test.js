import { describe, it, expect } from 'vitest';
import {
  validateRequiredModifiers,
  calculateCartTotals,
  calculateSplitBill
} from '../services/priceCalculator.js';
import {
  calculateDistanceMeters,
  metersToMiles,
  calculateDynamicETA
} from '../services/spatialService.js';

describe('Edge Cases & Boundary Value Tests', () => {
  describe('Cart Financials Boundary Conditions', () => {
    it('handles empty cart safely without NaN or negative values', () => {
      const emptyTotals = calculateCartTotals([], {
        baseDeliveryFeeCents: 299,
        freeDeliveryMinCents: 3500
      });
      expect(emptyTotals.itemsSubtotalCents).toBe(0);
      expect(emptyTotals.deliveryFeeCents).toBe(0);
      expect(emptyTotals.serviceFeeCents).toBe(0);
      expect(emptyTotals.taxCents).toBe(0);
      expect(emptyTotals.courierTipCents).toBe(0);
      expect(emptyTotals.totalChargedCents).toBe(0);
      expect(emptyTotals.isFreeDeliveryUnlocked).toBe(false);
      expect(emptyTotals.distanceToFreeDeliveryCents).toBe(3500);
    });

    it('tests threshold boundary: $34.99 vs $35.00 for free delivery', () => {
      // 3499 cents ($34.99) -> Delivery fee should apply
      const belowThreshold = calculateCartTotals(
        [{ unit_computed_cents: 3499, quantity: 1 }],
        { baseDeliveryFeeCents: 299, freeDeliveryMinCents: 3500 }
      );
      expect(belowThreshold.isFreeDeliveryUnlocked).toBe(false);
      expect(belowThreshold.deliveryFeeCents).toBe(299);
      expect(belowThreshold.distanceToFreeDeliveryCents).toBe(1);

      // 3500 cents ($35.00) -> Unlocks free delivery
      const atThreshold = calculateCartTotals(
        [{ unit_computed_cents: 3500, quantity: 1 }],
        { baseDeliveryFeeCents: 299, freeDeliveryMinCents: 3500 }
      );
      expect(atThreshold.isFreeDeliveryUnlocked).toBe(true);
      expect(atThreshold.deliveryFeeCents).toBe(0);
      expect(atThreshold.distanceToFreeDeliveryCents).toBe(0);
    });

    it('ensures Eco-Saver discount cannot reduce delivery fee below $0', () => {
      // Free delivery unlocked (base fee = 0), eco_saver (-$2.00) shouldn't produce negative fee
      const ecoTotals = calculateCartTotals(
        [{ unit_computed_cents: 4000, quantity: 1 }],
        { baseDeliveryFeeCents: 299, freeDeliveryMinCents: 3500, routingTier: 'eco_saver' }
      );
      expect(ecoTotals.deliveryFeeCents).toBe(0);
      expect(ecoTotals.deliveryFeeCents).toBeGreaterThanOrEqual(0);
    });

    it('allows $0 custom tip without defaulting to percentage', () => {
      const zeroTipTotals = calculateCartTotals(
        [{ unit_computed_cents: 2000, quantity: 1 }],
        { customTipCents: 0, tipPercentage: 20 }
      );
      expect(zeroTipTotals.courierTipCents).toBe(0);
    });
  });

  describe('Multiplayer Split-Bill Exact Reconciliation', () => {
    it('ensures three-way uneven split accounts for every single penny without leakage', () => {
      const items = [
        { participant_name: 'Alex', unit_computed_cents: 1433, quantity: 1 },
        { participant_name: 'Maya', unit_computed_cents: 1999, quantity: 1 },
        { participant_name: 'Host', unit_computed_cents: 2311, quantity: 1 }
      ];

      const totals = calculateCartTotals(items, {
        baseDeliveryFeeCents: 349,
        freeDeliveryMinCents: 10000,
        serviceFeeBps: 1000,
        taxRateBps: 863,
        tipPercentage: 18
      });

      const splits = calculateSplitBill(items, totals);
      expect(splits).toHaveLength(3);

      const sumOwed = splits.reduce((acc, s) => acc + s.totalOwedCents, 0);
      expect(sumOwed).toBe(totals.totalChargedCents);

      const sumOverhead = splits.reduce((acc, s) => acc + s.overheadShareCents, 0);
      const expectedOverhead = totals.totalChargedCents - totals.itemsSubtotalCents;
      expect(sumOverhead).toBe(expectedOverhead);
    });

    it('handles single participant in group cart properly', () => {
      const items = [{ participant_name: 'Solo Diner', unit_computed_cents: 2500, quantity: 1 }];
      const totals = calculateCartTotals(items);
      const splits = calculateSplitBill(items, totals);

      expect(splits).toHaveLength(1);
      expect(splits[0].totalOwedCents).toBe(totals.totalChargedCents);
    });

    it('reconciles penny drift to Host regardless of Host position in participants array', () => {
      // Host is in the middle
      const itemsMiddleHost = [
        { participant_name: 'Alex Rivera', unit_computed_cents: 1000, quantity: 1 },
        { participant_name: 'You (Host)', unit_computed_cents: 1000, quantity: 1 },
        { participant_name: 'Maya Lin', unit_computed_cents: 1000, quantity: 1 }
      ];
      // $30 subtotal + fees that don't divide evenly by 3
      const totals = calculateCartTotals(itemsMiddleHost, {
        baseDeliveryFeeCents: 299,
        freeDeliveryMinCents: 5000,
        serviceFeeBps: 1000,
        tipPercentage: 18
      });
      const splits = calculateSplitBill(itemsMiddleHost, totals);
      const totalOwed = splits.reduce((sum, s) => sum + s.totalOwedCents, 0);
      expect(totalOwed).toBe(totals.totalChargedCents);
      expect(splits).toHaveLength(3);

      // Verify that Host entry is present and valid
      const hostEntry = splits.find(s => s.name === 'You (Host)');
      expect(hostEntry).toBeDefined();
      expect(hostEntry.totalOwedCents).toBeGreaterThan(0);
    });

    it('handles large discounts exceeding subtotal by clamping to 0 with zero drift', () => {
      const items = [
        { participant_name: 'You (Host)', unit_computed_cents: 2000, quantity: 1 },
        { participant_name: 'Maya Lin', unit_computed_cents: 1500, quantity: 1 }
      ];
      const totals = calculateCartTotals(items, {
        baseDeliveryFeeCents: 299,
        discountCents: 100000 // $1,000 discount
      });
      expect(totals.totalChargedCents).toBe(0);

      const splits = calculateSplitBill(items, totals);
      expect(splits).toHaveLength(2);
      expect(splits[0].totalOwedCents).toBe(0);
      expect(splits[1].totalOwedCents).toBe(0);
      const sum = splits.reduce((s, p) => s + p.totalOwedCents, 0);
      expect(sum).toBe(0);
    });

    it('handles zero subtotal items with non-zero delivery fee equally among participants', () => {
      const items = [
        { participant_name: 'You (Host)', unit_computed_cents: 0, quantity: 1 },
        { participant_name: 'Alex Rivera', unit_computed_cents: 0, quantity: 1 }
      ];
      // Force a delivery fee with 0 subtotal items
      const totals = {
        itemsSubtotalCents: 0,
        deliveryFeeCents: 300,
        serviceFeeCents: 0,
        taxCents: 0,
        courierTipCents: 0,
        discountCents: 0,
        totalChargedCents: 300
      };
      const splits = calculateSplitBill(items, totals);
      expect(splits).toHaveLength(2);
      const sum = splits.reduce((s, p) => s + p.totalOwedCents, 0);
      expect(sum).toBe(300);
      expect(splits[0].totalOwedCents).toBe(150);
      expect(splits[1].totalOwedCents).toBe(150);
    });

    it('handles null, empty, or undefined inputs safely in calculateSplitBill', () => {
      expect(calculateSplitBill(null, null)).toEqual([]);
      expect(calculateSplitBill([], null)).toEqual([]);
      expect(calculateSplitBill([{ unit_computed_cents: 1000 }], null)).toEqual([]);
    });

    it('respects zero delivery fee restaurants and $0 free delivery thresholds', () => {
      const items = [{ unit_computed_cents: 1500, quantity: 1 }];
      const zeroFeeTotals = calculateCartTotals(items, {
        baseDeliveryFeeCents: 0,
        freeDeliveryMinCents: 0
      });
      expect(zeroFeeTotals.deliveryFeeCents).toBe(0);
      expect(zeroFeeTotals.isFreeDeliveryUnlocked).toBe(true);
      expect(zeroFeeTotals.distanceToFreeDeliveryCents).toBe(0);
    });
  });

  describe('Modifier Validation Edge Cases', () => {
    it('handles items with no modifier groups as valid', () => {
      const result = validateRequiredModifiers([], []);
      expect(result.isValid).toBe(true);
      expect(result.missingGroups).toHaveLength(0);
    });

    it('catches multiple missing required groups', () => {
      const groups = [
        { id: 'g1', name: 'Protein', is_required: true, min_select: 1 },
        { id: 'g2', name: 'Bread', is_required: true, min_select: 1 },
        { id: 'g3', name: 'Sauce', is_required: false, min_select: 0 }
      ];

      const result = validateRequiredModifiers(groups, []);
      expect(result.isValid).toBe(false);
      expect(result.missingGroups).toEqual(['Protein', 'Bread']);
    });

    it('catches modifier selections exceeding max_select limit', () => {
      const groups = [
        { id: 'g-split', name: 'Half-and-Half Toppings', is_required: false, min_select: 0, max_select: 2 }
      ];

      const selectedOver = [
        { group_id: 'g-split', option_id: 'opt-1' },
        { group_id: 'g-split', option_id: 'opt-2' },
        { group_id: 'g-split', option_id: 'opt-3' }
      ];

      const result = validateRequiredModifiers(groups, selectedOver);
      expect(result.isValid).toBe(false);
      expect(result.exceededGroups).toContain('Half-and-Half Toppings');
    });
  });

  describe('Spatial Service & ETA Edge Cases', () => {
    it('handles paused kitchen load status properly', () => {
      const pausedRestaurant = {
        base_prep_minutes: 15,
        current_load_status: 'paused',
        location: { lat: 37.7749, lng: -122.4194 }
      };
      const eta = calculateDynamicETA(pausedRestaurant);
      expect(eta.prepMinutes).toBeGreaterThan(900);
    });

    it('calculates zero distance for identical coordinates', () => {
      const dist = calculateDistanceMeters(37.7749, -122.4194, 37.7749, -122.4194);
      expect(dist).toBe(0);
      expect(metersToMiles(dist)).toBe(0);
    });
  });
});
