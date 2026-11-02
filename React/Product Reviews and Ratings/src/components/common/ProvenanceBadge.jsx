import React from 'react';

/**
 * ProvenanceBadge
 * Cryptographic Provenance & FTC Disclosure Badges.
 * Formats:
 * - verified_purchase: [ ✓ Verified buyer • Order #MKT-9042 ]
 * - incentivized_gifted: [ 🎁 Gifted / Incentivized Review — Disclosed ]
 * - repeat_buyer: [ 🔁 Repeat Buyer (4x Orders) ]
 * - unverified: [ 🌐 Community Unverified ]
 */
export function ProvenanceBadge({ type, orderId = null, tokenNumber = null, orderCount = null }) {
  switch (type) {
    case 'verified_purchase':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-mono text-label-code-sm font-semibold tracking-tight">
          <span className="material-symbols-outlined text-[13px]">verified</span>
          <span>Verified buyer</span>
          {orderId && <span className="opacity-75">· #{orderId}</span>}
        </span>
      );

    case 'incentivized_gifted':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-mono text-label-code-sm font-semibold tracking-tight">
          <span className="material-symbols-outlined text-[13px]">featured_seasonal_and_gifts</span>
          <span>Gifted · Disclosed FTC</span>
        </span>
      );

    case 'repeat_buyer':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-label-code-sm font-semibold tracking-tight">
          <span className="material-symbols-outlined text-[13px]">repeat</span>
          <span>Repeat buyer {orderCount ? `· ${orderCount} orders` : ''}</span>
        </span>
      );

    case 'unverified':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container text-on-error-container font-mono text-label-code-sm font-semibold tracking-tight">
          <span className="material-symbols-outlined text-[13px]">warning</span>
          <span>Community Unverified</span>
        </span>
      );
  }
}

