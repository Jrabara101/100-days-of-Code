import React, { useState } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';
import { formatCurrency } from '../../lib/utils';

export function ProductStrip({ onOpenWriteReview }) {
  const { activeProduct } = useTrustStore();
  const [addedToBag, setAddedToBag] = useState(false);

  const handleAddToBag = () => {
    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 2000);
  };

  return (
    <section className="w-full bg-surface-container-lowest border-b border-outline-variant/30 shadow-xs">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Breadcrumb & Item Quick Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden shrink-0 shadow-sm flex items-center justify-center border border-outline-variant/30">
              <img
                src={activeProduct.image}
                alt={activeProduct.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/assets/kettle-countertop.png';
                }}
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-outline font-mono text-label-code-sm tracking-tight mb-0.5">
                <span>Home</span>
                <span>/</span>
                <span className="capitalize">{activeProduct.category}</span>
                <span>/</span>
                <span className="text-on-surface font-medium truncate max-w-[200px]">
                  {activeProduct.title}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                  {activeProduct.title}
                </h1>
                <span className="font-headline-md text-headline-md text-on-surface-variant font-medium">
                  {formatCurrency(activeProduct.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Inventory Pill & Actions */}
          <div className="flex items-center gap-3">
            {activeProduct.isBrigadeLocked ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-mono text-label-code-sm font-semibold animate-pulse">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                <span>Verified-Purchase Lockdown Active</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-mono text-label-code-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>In Stock · {activeProduct.shipEstimate || 'Ships Within 24h'}</span>
              </div>
            )}

            <button
              onClick={handleAddToBag}
              className={`px-4 py-2 rounded-lg font-headline-sm text-headline-sm transition-all shadow-xs ${
                addedToBag
                  ? 'bg-primary text-white scale-95'
                  : 'bg-on-surface text-inverse-on-surface hover:opacity-90'
              }`}
            >
              {addedToBag ? '✓ Added to Bag' : 'Add to Bag'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

