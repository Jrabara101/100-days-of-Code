import React, { useState, useMemo } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';
import { ReviewItem } from './ReviewItem';

export function ReviewFeed({
  activeRatingFilter,
  setActiveRatingFilter,
  activeTopicFilter,
  setActiveTopicFilter,
  verifiedOnly,
  setVerifiedOnly,
  withMediaOnly,
  setWithMediaOnly,
  personaFilters,
  setPersonaFilters,
  sortBy,
  onOpenMediaLightbox,
  onOpenOwnershipUpdate
}) {
  const { reviews, activeProductId } = useTrustStore();
  const [visibleCount, setVisibleCount] = useState(6);

  // Filter & sort logic
  const filteredReviews = useMemo(() => {
    let list = reviews.filter(
      r => r.productId === activeProductId && (r.moderationStatus === 'approved' || r.id === 'REV-094182')
    );

    // Star rating filter
    if (activeRatingFilter) {
      list = list.filter(r => r.rating === activeRatingFilter);
    }

    // Verified only filter
    if (verifiedOnly) {
      list = list.filter(r => r.provenanceType === 'verified_purchase' || r.provenanceType === 'repeat_buyer');
    }

    // With media filter
    if (withMediaOnly) {
      list = list.filter(r => r.media && r.media.length > 0);
    }

    // Sentiment / topic filter
    if (activeTopicFilter && activeTopicFilter !== 'All reviews') {
      const query = activeTopicFilter.toLowerCase();
      list = list.filter(r => {
        const fullText = `${r.title} ${r.bodyOriginal} ${r.bodySanitized}`.toLowerCase();
        return fullText.includes(query);
      });
    }

    // "People Like Me" persona filters
    if (personaFilters.variant) {
      list = list.filter(r => r.variantTitle === personaFilters.variant);
    }
    if (personaFilters.height) {
      list = list.filter(r => r.reviewerAttributes?.height === personaFilters.height);
    }
    if (personaFilters.usualSize) {
      list = list.filter(r => r.reviewerAttributes?.usualSize === personaFilters.usualSize);
    }
    if (personaFilters.experienceLevel) {
      list = list.filter(r => r.reviewerAttributes?.experienceLevel === personaFilters.experienceLevel);
    }
    if (personaFilters.location) {
      list = list.filter(r => r.reviewerLocation === personaFilters.location);
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'highest_rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'lowest_rating') {
        return a.rating - b.rating;
      }
      // default: most_helpful
      return (b.helpfulVotes || 0) - (a.helpfulVotes || 0);
    });
  }, [
    reviews,
    activeProductId,
    activeRatingFilter,
    verifiedOnly,
    withMediaOnly,
    activeTopicFilter,
    personaFilters,
    sortBy
  ]);

  const displayedReviews = filteredReviews.slice(0, visibleCount);
  const hasMore = visibleCount < filteredReviews.length;

  const hasAnyFilter =
    activeRatingFilter ||
    (activeTopicFilter && activeTopicFilter !== 'All reviews') ||
    verifiedOnly ||
    withMediaOnly ||
    Object.keys(personaFilters).length > 0;

  const clearAllFilters = () => {
    setActiveRatingFilter(null);
    setActiveTopicFilter(null);
    setVerifiedOnly(false);
    setWithMediaOnly(false);
    setPersonaFilters({});
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Active Filter Chips Bar */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-body-sm">
          <span className="font-mono text-xs text-outline font-semibold">Active filters:</span>
          {activeRatingFilter && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/40 font-mono text-xs">
              <span>{activeRatingFilter}★ Stars</span>
              <button onClick={() => setActiveRatingFilter(null)} className="hover:text-error">×</button>
            </span>
          )}
          {activeTopicFilter && activeTopicFilter !== 'All reviews' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/40 font-mono text-xs">
              <span>Topic: "{activeTopicFilter}"</span>
              <button onClick={() => setActiveTopicFilter(null)} className="hover:text-error">×</button>
            </span>
          )}
          {verifiedOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/40 font-mono text-xs">
              <span>Verified Only</span>
              <button onClick={() => setVerifiedOnly(false)} className="hover:text-error">×</button>
            </span>
          )}
          {withMediaOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/40 font-mono text-xs">
              <span>With Media</span>
              <button onClick={() => setWithMediaOnly(false)} className="hover:text-error">×</button>
            </span>
          )}
          {Object.entries(personaFilters).map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant/40 font-mono text-xs">
              <span>{k}: {v}</span>
              <button
                onClick={() => {
                  const next = { ...personaFilters };
                  delete next[k];
                  setPersonaFilters(next);
                }}
                className="hover:text-error"
              >
                ×
              </button>
            </span>
          ))}

          <button
            onClick={clearAllFilters}
            className="font-mono text-xs text-primary font-bold hover:underline ml-auto"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Reviews Stream */}
      {displayedReviews.length > 0 ? (
        displayedReviews.map(review => (
          <ReviewItem
            key={review.id}
            review={review}
            onOpenMediaLightbox={onOpenMediaLightbox}
            onOpenOwnershipUpdate={onOpenOwnershipUpdate}
          />
        ))
      ) : (
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/30 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[24px]">filter_list_off</span>
          </div>
          <h3 className="font-headline-md font-semibold text-on-surface">
            No matching verified reviews found
          </h3>
          <p className="font-body-sm text-outline max-w-md">
            Try adjusting or resetting your dimensional and persona filters to see more verified community reviews.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-2 px-4 py-2 bg-primary text-white font-mono text-xs font-semibold rounded-lg hover:bg-primary-container transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Show Next 10 Action */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => setVisibleCount(prev => prev + 6)}
            className="px-6 py-2.5 bg-surface-container-high text-on-surface rounded-lg font-headline-sm text-headline-sm hover:bg-surface-container-highest transition-colors shadow-xs flex items-center gap-2 cursor-pointer border border-outline-variant/30"
          >
            <span>Show Next Verified Reviews</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
        </div>
      )}

      {/* Hollis Trust Transparency Banner (matching line 370 of Stitch prototype) */}
      <section className="w-full bg-surface-container rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs border border-outline-variant/30 mt-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Protected by Hollis Trust Consumer Protocol
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Every review is matched against encrypted warehouse shipping manifestations. Inappropriate contact data and unverified health assertions are systematically sanitized by our compliance moderators to protect personal safety without removing legitimate critique.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-outline bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
            Ledger #HL-992-SEC
          </span>
        </div>
      </section>
    </div>
  );
}

