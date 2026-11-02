import React from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';
import { StarRating } from '../common/StarRating';

export function ScorecardBento({
  onOpenWriteReview,
  activeRatingFilter,
  setActiveRatingFilter
}) {
  const { activeProduct } = useTrustStore();
  const dist = activeProduct.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const total = activeProduct.totalReviews || 1;

  const getPercent = (count) => Math.round(((count || 0) / total) * 100);

  return (
    <section className="w-full bg-surface-container-low rounded-xl p-7 shadow-xs border border-outline-variant/30">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Bento Col 1: High-Level Overall Score */}
        <div className="lg:col-span-4 flex flex-col gap-4 pr-0 lg:pr-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-outline font-mono text-label-code-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
              <span>Cryptographic Audit Rating</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-headline-lg text-on-surface font-bold text-4xl leading-none">
                {activeProduct.bayesianScore || activeProduct.rating}
              </span>
              <div className="flex items-center text-amber-500">
                <StarRating rating={activeProduct.bayesianScore || activeProduct.rating} size={22} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary-fixed text-on-primary-fixed font-mono text-label-code-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>{activeProduct.recommendPercent || 94}% Recommend</span>
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              {activeProduct.totalReviews.toLocaleString()} reviews · {activeProduct.verifiedReviews.toLocaleString()} verified
            </span>
          </div>

          <p className="font-body-sm text-body-sm text-outline leading-relaxed">
            All reviews aggregated through the Hollis Trust ledger. Purchases verified against merchant delivery records prior to inclusion in the index.
          </p>

          <div className="pt-2">
            <button
              onClick={onOpenWriteReview}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary rounded-lg font-headline-sm text-headline-sm hover:bg-primary-container transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Write a Verified Review</span>
            </button>
          </div>
        </div>

        {/* Bento Col 2: Star Distribution Histogram with Interactive Filter */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 bg-surface-container-lowest p-5 rounded-lg shadow-xs border border-outline-variant/30">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-label-code-sm text-outline tracking-wider uppercase font-semibold">
              Score Distribution
            </span>
            {activeRatingFilter && (
              <button
                onClick={() => setActiveRatingFilter(null)}
                className="font-mono text-xs text-primary hover:underline font-medium"
              >
                Clear filter
              </button>
            )}
          </div>

          {[5, 4, 3, 2, 1].map((star) => {
            const count = dist[star] || 0;
            const pct = getPercent(count);
            const isSelected = activeRatingFilter === star;

            return (
              <div
                key={star}
                onClick={() => setActiveRatingFilter(isSelected ? null : star)}
                className={`flex items-center gap-3 py-1 px-1.5 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/10 ring-1 ring-primary'
                    : 'hover:bg-surface-container-low'
                }`}
                title={`Filter by ${star} star reviews`}
              >
                <span className="font-mono text-label-code-sm text-on-surface w-6 font-semibold">
                  {star}★
                </span>
                <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSelected ? 'bg-primary' : 'bg-primary/85'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-label-code-sm text-on-surface-variant text-right w-24">
                  {pct}% ({count})
                </span>
              </div>
            );
          })}
        </div>

        {/* Bento Col 3: Dimension Breakdown Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-3 bg-surface-container-lowest p-5 rounded-lg shadow-xs border border-outline-variant/30">
          <span className="font-mono text-label-code-sm text-outline tracking-wider uppercase mb-1 font-semibold">
            Product Dimensions
          </span>

          {activeProduct.dimensionalScores?.map((dim) => {
            if (dim.id === 'flow_dynamic') {
              return (
                <div
                  key={dim.id}
                  className="mt-2 pt-2 flex items-center justify-between bg-surface-container-low px-3 py-2 rounded border border-outline-variant/20"
                >
                  <span className="font-mono text-label-code-sm text-outline">{dim.label}</span>
                  <span className="font-mono text-label-code-sm text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">tune</span>
                    <span>{dim.status || 'Calibrated Optimal'}</span>
                  </span>
                </div>
              );
            }

            return (
              <div key={dim.id} className="flex flex-col gap-1">
                <div className="flex justify-between font-mono text-label-code-sm">
                  <span className="text-on-surface font-medium">{dim.label}</span>
                  <span className="text-on-surface font-bold">
                    {dim.score} / {dim.max || 5.0}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${dim.percent || 90}%` }}
                  />
                </div>
                {dim.highlight && (
                  <span className="text-[11px] text-outline font-sans -mt-0.5">
                    {dim.highlight}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

