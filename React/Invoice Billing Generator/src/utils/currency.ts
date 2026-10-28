import { Invoice, InvoiceLineItem } from '../types';

/**
 * Format integer-cents into formatted currency strings with proper symbols and locale
 */
export function formatCents(cents: number, currency: string = 'USD'): string {
  const value = (cents || 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format basis points to percentage display (e.g. 825 -> 8.25%, 200 -> 2%)
 */
export function formatBps(bps: number): string {
  const pct = (bps || 0) / 100;
  return `${pct.toFixed(pct % 1 === 0 ? 0 : 2)}%`;
}

/**
 * Strict integer-cents invoice calculation engine
 */
export function calculateInvoiceTotals(
  items: InvoiceLineItem[],
  discountCents: number = 0,
  lateFeeCents: number = 0,
  earlyDiscountBps: number = 0,
  isEarlyDiscountApplied: boolean = false
) {
  // Only include items that are NOT optional add-ons OR optional add-ons that are SELECTED
  const activeItems = items.filter(
    (item) => !item.is_optional_addon || item.is_addon_selected
  );

  let subtotalCents = 0;
  let taxCents = 0;

  for (const item of activeItems) {
    const itemTotalCents = Math.round(Number(item.quantity) * Number(item.unit_price_cents));
    subtotalCents += itemTotalCents;

    if (item.tax_rate_bps > 0) {
      const itemTax = Math.round((itemTotalCents * item.tax_rate_bps) / 10000);
      taxCents += itemTax;
    }
  }

  // Subtotal discount
  const clampedDiscountCents = Math.min(discountCents, subtotalCents);
  let totalCents = Math.max(0, subtotalCents - clampedDiscountCents + taxCents + lateFeeCents);

  // Early payment discount (e.g. 200 bps = 2%)
  let earlyDiscountSavingsCents = 0;
  if (earlyDiscountBps > 0) {
    earlyDiscountSavingsCents = Math.round((totalCents * earlyDiscountBps) / 10000);
    if (isEarlyDiscountApplied) {
      totalCents = Math.max(0, totalCents - earlyDiscountSavingsCents);
    }
  }

  return {
    subtotalCents,
    taxCents,
    discountCents: clampedDiscountCents,
    lateFeeCents,
    totalCents,
    earlyDiscountSavingsCents,
  };
}

/**
 * Calculate estimated gateway processing fee & merchant net payout
 */
export function calculateGatewayBreakdown(
  grossCents: number,
  rail: 'stripe_card' | 'stripe_ach' | 'paypal',
  passFeeToClient: boolean = false
) {
  let feeCents = 0;

  if (rail === 'stripe_card') {
    // 2.9% + 30 cents ($0.30 = 30 cents)
    feeCents = Math.round(grossCents * 0.029 + 30);
  } else if (rail === 'paypal') {
    // 3.49% + 49 cents ($0.49 = 49 cents)
    feeCents = Math.round(grossCents * 0.0349 + 49);
  } else if (rail === 'stripe_ach') {
    // 0.8% capped at $5.00 ($5.00 = 500 cents), or $0 fee promotional
    feeCents = Math.min(500, Math.round(grossCents * 0.008));
  }

  const surchargeCents = passFeeToClient && rail !== 'stripe_ach' ? feeCents : 0;
  const clientBilledCents = grossCents + surchargeCents;
  const netPayoutCents = clientBilledCents - feeCents;

  return {
    grossCents,
    feeCents,
    surchargeCents,
    clientBilledCents,
    netPayoutCents,
  };
}

/**
 * Relative time formatter for telemetry & due dates
 */
export function formatRelativeDueDate(dueDateStr: string): { label: string; isOverdue: boolean } {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
  } else if (diffDays === 0) {
    return { label: `Due today`, isOverdue: false };
  } else {
    return { label: `Due in ${diffDays}d`, isOverdue: false };
  }
}
