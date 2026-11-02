// ============================================================================
// FINANCIAL INTEGER-CENTS PRICING ENGINE & SPLIT-BILL CALCULATOR
// Zero-drift financial math, modifier integrity and proportional settlement
// ============================================================================

/**
 * Format integer cents into standard USD string
 * e.g., 2450 -> "$24.50"
 */
export function formatCents(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return '$0.00';
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const dollars = Math.floor(absCents / 100);
  const remainingCents = absCents % 100;
  const formatted = `$${dollars}.${remainingCents.toString().padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Validates modifier choices and calculates total unit price in integer cents
 */
export function calculateItemUnitCents(basePriceCents, selectedModifiers = []) {
  if (typeof basePriceCents !== 'number' || basePriceCents < 0) {
    throw new Error('Invalid base price cents');
  }

  const modifiersDeltaCents = selectedModifiers.reduce((sum, mod) => {
    const delta = typeof mod.price_delta_cents === 'number' ? mod.price_delta_cents : 0;
    return sum + delta;
  }, 0);

  return Math.max(0, basePriceCents + modifiersDeltaCents);
}

/**
 * Validates required modifier groups and max selection limits
 * Returns { isValid: boolean, missingGroups: string[], exceededGroups: string[] }
 */
export function validateRequiredModifiers(modifierGroups = [], selectedModifiers = []) {
  const missingGroups = [];
  const exceededGroups = [];

  for (const group of modifierGroups) {
    const selectedCount = selectedModifiers.filter(m => m.group_id === group.id).length;
    if (group.is_required && group.min_select > 0 && selectedCount < group.min_select) {
      missingGroups.push(group.name);
    }
    if (group.max_select > 0 && selectedCount > group.max_select) {
      exceededGroups.push(group.name);
    }
  }

  return {
    isValid: missingGroups.length === 0 && exceededGroups.length === 0,
    missingGroups,
    exceededGroups
  };
}

/**
 * Computes complete cart financials including routing tier, threshold discounts,
 * service fees, tax and courier tips.
 */
export function calculateCartTotals(cartItems = [], config = {}) {
  const {
    baseDeliveryFeeCents = 299,
    freeDeliveryMinCents = 3500,
    serviceFeeBps = 1000, // 1000 bps = 10.00%
    taxRateBps = 863,     // 8.625% San Francisco sales tax rounded to 863 bps
    routingTier = 'standard', // 'priority_direct' | 'standard' | 'eco_saver'
    tipPercentage = 18,
    customTipCents = null,
    discountCents = 0
  } = config;

  // 1. Items subtotal
  const itemsSubtotalCents = cartItems.reduce((sum, item) => {
    const unitPrice = item.unit_computed_cents ?? item.base_price_cents ?? 0;
    const qty = item.quantity ?? 1;
    return sum + (unitPrice * qty);
  }, 0);

  // 2. Unlocked free delivery threshold check
  const isFreeDeliveryUnlocked = freeDeliveryMinCents === 0
    ? (itemsSubtotalCents > 0)
    : (freeDeliveryMinCents > 0 && itemsSubtotalCents >= freeDeliveryMinCents);
  const distanceToFreeDeliveryCents = isFreeDeliveryUnlocked
    ? 0
    : Math.max(0, freeDeliveryMinCents - itemsSubtotalCents);

  // 3. Routing tier modifier
  let tierModifierCents = 0;
  if (routingTier === 'priority_direct') {
    tierModifierCents = 299; // +$2.99 Direct Priority
  } else if (routingTier === 'eco_saver') {
    tierModifierCents = -200; // -$2.00 Eco-Saver Discount
  }

  // 4. Delivery fee
  let rawDeliveryFeeCents = isFreeDeliveryUnlocked ? 0 : baseDeliveryFeeCents;
  let deliveryFeeCents = Math.max(0, rawDeliveryFeeCents + tierModifierCents);

  // If subtotal is 0, delivery fee is 0
  if (itemsSubtotalCents === 0) {
    deliveryFeeCents = 0;
  }

  // 5. Service fee (10% standard, minimum $1.50 if subtotal > 0)
  let serviceFeeCents = 0;
  if (itemsSubtotalCents > 0) {
    serviceFeeCents = Math.max(150, Math.round((itemsSubtotalCents * serviceFeeBps) / 10000));
  }

  // 6. Tax
  const taxCents = itemsSubtotalCents > 0 ? Math.round((itemsSubtotalCents * taxRateBps) / 10000) : 0;

  // 7. Courier tip (100% goes to driver)
  let courierTipCents = 0;
  if (customTipCents !== null && customTipCents >= 0) {
    courierTipCents = customTipCents;
  } else if (itemsSubtotalCents > 0) {
    courierTipCents = Math.round((itemsSubtotalCents * tipPercentage) / 100);
  }

  // 8. Total charged
  const totalChargedCents = Math.max(
    0,
    itemsSubtotalCents + deliveryFeeCents + serviceFeeCents + taxCents + courierTipCents - discountCents
  );

  return {
    itemsSubtotalCents,
    deliveryFeeCents,
    isFreeDeliveryUnlocked,
    distanceToFreeDeliveryCents,
    serviceFeeCents,
    taxCents,
    courierTipCents,
    discountCents,
    totalChargedCents,
    routingTier
  };
}

/**
 * True Out-the-Door Upfront Price Estimator for Discovery Cards & Storefronts
 * Displays true landed cost including estimated delivery & service fee
 */
export function estimateTrueOutOfDoorPrice(dishBasePriceCents, restaurant, options = {}) {
  const { includeTip = false } = options;
  const deliveryFee = restaurant?.delivery_fee_cents ?? 299;
  const serviceFeeBps = restaurant?.service_fee_bps ?? 1000;
  const serviceFee = Math.round((dishBasePriceCents * serviceFeeBps) / 10000);
  const tax = Math.round((dishBasePriceCents * 863) / 10000);
  const tip = includeTip ? Math.round((dishBasePriceCents * 18) / 100) : 0;

  // For a single dish discovery preview, allocate estimated delivery fee proportion
  // (Assuming average 2-item basket)
  const allocatedDeliveryFee = Math.round(deliveryFee / 2);

  return dishBasePriceCents + serviceFee + tax + allocatedDeliveryFee + tip;
}

/**
 * Automated Proportional Split-Bill Calculation
 * Each participant pays their exact items + proportional share of delivery, service, tax, tip.
 * Remainder penny drift is automatically reconciled to the host.
 */
export function calculateSplitBill(cartItems = [], cartTotals) {
  if (!cartItems || !cartItems.length || !cartTotals) {
    return [];
  }

  // Group items by participant
  const participantMap = new Map();

  for (const item of cartItems) {
    const participantName = item.participant_name || 'You (Host)';
    const itemTotal = (item.unit_computed_cents ?? item.base_price_cents ?? 0) * (item.quantity ?? 1);

    if (!participantMap.has(participantName)) {
      participantMap.set(participantName, {
        name: participantName,
        avatar: item.participant_avatar || null,
        color: item.participant_color || '#8B5CF6',
        items: [],
        itemsSubtotalCents: 0
      });
    }

    const participant = participantMap.get(participantName);
    participant.items.push(item);
    participant.itemsSubtotalCents += itemTotal;
  }

  const participants = Array.from(participantMap.values());
  const grandSubtotal = cartTotals.itemsSubtotalCents;
  const totalCharged = cartTotals.totalChargedCents;

  if (participants.length === 0) return [];

  // Identify Host participant for penny drift reconciliation
  const hostIndex = participants.findIndex(
    p => p.name.includes('Host') || p.name.toLowerCase().includes('you')
  );
  const targetHostIndex = hostIndex >= 0 ? hostIndex : 0;

  // Case 1: Total charged is 0 (100% discounted or empty)
  if (totalCharged === 0) {
    return participants.map((p) => ({
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      itemCount: p.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      itemsSubtotalCents: p.itemsSubtotalCents,
      overheadShareCents: 0,
      totalOwedCents: 0,
      ratio: grandSubtotal > 0 ? p.itemsSubtotalCents / grandSubtotal : 1 / participants.length
    }));
  }

  // Case 2: grandSubtotal is 0 but there is overhead (e.g. promo 0 items with delivery/fee)
  if (grandSubtotal === 0) {
    const equalShare = Math.floor(totalCharged / participants.length);
    let remainder = totalCharged - (equalShare * participants.length);

    return participants.map((p, idx) => {
      const share = equalShare + (idx === targetHostIndex ? remainder : 0);
      return {
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        itemCount: p.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        itemsSubtotalCents: 0,
        overheadShareCents: share,
        totalOwedCents: share,
        ratio: 1 / participants.length
      };
    });
  }

  // Case 3: Standard proportional split weighted by itemsSubtotalCents
  let allocatedTotalSum = 0;
  const preliminarySplits = participants.map((p) => {
    const ratio = p.itemsSubtotalCents / grandSubtotal;
    const computedShare = Math.round(totalCharged * ratio);
    allocatedTotalSum += computedShare;

    return {
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      itemCount: p.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      itemsSubtotalCents: p.itemsSubtotalCents,
      totalOwedCents: computedShare,
      ratio
    };
  });

  // Reconcile penny drift explicitly to Host
  const drift = totalCharged - allocatedTotalSum;
  preliminarySplits[targetHostIndex].totalOwedCents += drift;

  // Calculate overhead share for each participant (total owed minus items subtotal)
  return preliminarySplits.map((p) => ({
    ...p,
    overheadShareCents: p.totalOwedCents - p.itemsSubtotalCents
  }));
}
