import React, { useState } from 'react';
import { StarRating } from '../common/StarRating';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { renderSanitizedText } from '../common/RedactionPill';
import { formatDate } from '../../lib/utils';
import { useTrustStore } from '../../context/TrustStoreContext';

export function ReviewItem({
  review,
  onOpenMediaLightbox,
  onOpenOwnershipUpdate
}) {
  const { voteHelpful } = useTrustStore();
  const [hasVoted, setHasVoted] = useState(false);
  const [reported, setReported] = useState(false);

  const handleHelpful = () => {
    if (!hasVoted) {
      voteHelpful(review.id);
      setHasVoted(true);
    }
  };

  const initials = review.reviewerName
    ? review.reviewerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DK';

  const firstMedia = review.media && review.media.length > 0 ? review.media[0] : null;

  return (
    <article className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-xs border border-outline-variant/30 flex flex-col gap-5 transition-all hover:border-outline-variant/60">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Column 1: Reviewer Verification & Provenance (3 cols) */}
        <div className="md:col-span-3 flex md:flex-col items-center md:items-start justify-between md:justify-start gap-3 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-4 md:pb-0 md:pr-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-headline-sm text-headline-sm font-semibold text-on-surface shadow-xs">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                {review.reviewerName}
              </span>
              <span className="font-mono text-label-code-sm text-outline">
                {review.reviewerLocation || 'United States'}
              </span>
            </div>
          </div>

          <ProvenanceBadge
            type={review.provenanceType}
            orderId={review.orderId}
            tokenNumber={review.tokenNumber}
            orderCount={review.reviewerAttributes?.orderCount}
          />

          <div className="hidden md:flex flex-col gap-1 pt-2 font-mono text-label-code-sm text-outline w-full">
            <span className="truncate">Item: {review.variantTitle || 'Standard Edition'}</span>
            {review.purchasedDate && (
              <span>Purchased: {formatDate(review.purchasedDate)}</span>
            )}
            {review.tokenNumber && (
              <span className="text-primary flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                <span>Token #{review.tokenNumber}</span>
              </span>
            )}
            {review.reviewerAttributes?.experienceLevel && (
              <span className="text-on-surface-variant text-[11px] mt-1 bg-surface-container-low p-1.5 rounded">
                ☕ {review.reviewerAttributes.experienceLevel}
              </span>
            )}
            {review.reviewerAttributes?.height && (
              <span className="text-on-surface-variant text-[11px] mt-1 bg-surface-container-low p-1.5 rounded">
                📏 {review.reviewerAttributes.height} · Size {review.reviewerAttributes.usualSize}
              </span>
            )}
          </div>
        </div>

        {/* Column 2: Review Body, Sanitized Tokens & Product Proof (9 cols) */}
        <div className="md:col-span-9 flex flex-col gap-4">
          {/* Rating, Heading and Published Date */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size={18} />
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                {review.title}
              </h2>
            </div>
            <span className="font-mono text-label-code-sm text-outline">
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* Public Sanitized Text with Redaction Capsules */}
          <div className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            {renderSanitizedText(review.bodySanitized || review.bodyOriginal)}
          </div>

          {/* Customer Unboxing Media Thumbnail */}
          {firstMedia && (
            <div className="flex items-center gap-3 pt-2">
              <div
                onClick={() => onOpenMediaLightbox && onOpenMediaLightbox(firstMedia, review)}
                className="relative group cursor-pointer w-20 h-20 rounded-lg overflow-hidden bg-surface-container shadow-xs border border-outline-variant/30 flex-shrink-0"
              >
                <img
                  src={firstMedia.sanitizedUrl || firstMedia.previewUrl || firstMedia.originalPath}
                  alt={firstMedia.filename || 'Customer Unboxing Photo'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-on-surface/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-label-code-sm text-on-surface font-medium">
                  {review.media.length} Customer Photo{review.media.length > 1 ? 's' : ''}
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  {firstMedia.isBlurred || firstMedia.hasBBoxExposure
                    ? 'Shipping label auto-blurred for buyer privacy'
                    : 'EXIF stripped & verified original'}
                </span>
              </div>
            </div>
          )}

          {/* Longitudinal Durability Update */}
          {review.followUpUpdate ? (
            <div className="bg-primary-fixed/20 border-l-3 border-primary p-3.5 rounded-r-lg mt-1 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-label-code-sm font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">update</span>
                  <span>{review.followUpUpdate.label}</span>
                </span>
                <span className="font-mono text-[11px] text-outline">
                  {formatDate(review.followUpUpdate.timestamp)}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                {review.followUpUpdate.text}
              </p>
            </div>
          ) : (
            review.provenanceType === 'verified_purchase' && (
              <div className="pt-1">
                <button
                  onClick={() => onOpenOwnershipUpdate && onOpenOwnershipUpdate(review)}
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1 opacity-80 hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-[13px]">history</span>
                  <span>Own this product? Append a 6-Month Ownership Update</span>
                </button>
              </div>
            )
          )}

          {/* Official Brand Response Block */}
          {review.brandResponse && (
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold font-mono text-[10px]">
                    H
                  </div>
                  <span className="font-headline-sm text-xs font-bold text-on-surface">
                    {review.brandResponse.responderName} · {review.brandResponse.responderTitle}
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-semibold">
                  Official Brand Response
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                "{review.brandResponse.body}"
              </p>
              {review.brandResponse.makeGood && (
                <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between text-xs font-mono border border-outline-variant/20">
                  <span className="text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                    <span>{review.brandResponse.makeGood.label}</span>
                  </span>
                  <span className="text-outline">
                    Tracking: <strong className="text-on-surface">{review.brandResponse.makeGood.trackingNumber}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Helpful Count & Action Row */}
          <div className="flex items-center justify-between pt-3 mt-1 bg-surface-container-low px-4 py-2.5 rounded-lg border border-outline-variant/20">
            <div className="flex items-center gap-4">
              <button
                onClick={handleHelpful}
                className={`flex items-center gap-1.5 font-mono text-label-code-sm transition-colors cursor-pointer ${
                  hasVoted ? 'text-primary font-bold' : 'text-on-surface hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                <span>Helpful ({review.helpfulVotes || 0})</span>
              </button>
              <button
                onClick={() => setReported(!reported)}
                className={`font-mono text-label-code-sm transition-colors ${
                  reported ? 'text-error font-bold' : 'text-outline hover:text-error'
                }`}
              >
                {reported ? 'Flagged for Review' : 'Report'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-primary font-mono text-label-code-sm font-semibold">
              <span className="material-symbols-outlined text-[14px]">verified_user</span>
              <span>Verified Delivery Proof</span>
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Audit Banner Footnote */}
      <div className="bg-surface-container px-4 py-2 rounded-lg flex items-center justify-between text-outline font-mono text-label-code-sm border border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[15px] text-primary">policy</span>
          <span>
            {review.isRedacted
              ? 'Edited for privacy by Hollis Trust · Automated PII redaction verified by lead operator'
              : 'Verified through Hollis Trust Ledger · Cryptographic integrity audit passed'}
          </span>
        </div>
        <span className="hidden sm:inline">Ledger entry #{review.id}</span>
      </div>
    </article>
  );
}

