import React from 'react';
import { StarRating } from '../common/StarRating';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { renderSanitizedText } from '../common/RedactionPill';
import { formatDate } from '../../lib/utils';

export function CustomerMediaLightbox({
  mediaItem,
  review,
  onClose,
  onQuickViewVariant
}) {
  if (!mediaItem || !review) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 lg:p-8 animate-fadeIn">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-50 transition-colors"
      >
        <span className="material-symbols-outlined text-[24px]">close</span>
      </button>

      {/* Main Split-Screen Modal Container */}
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl border border-outline-variant/30">
        {/* Left: Media Display Stage */}
        <div className="md:w-3/5 bg-stone-950 flex flex-col items-center justify-center relative min-h-[360px] md:min-h-[500px] overflow-hidden select-none">
          <img
            src={mediaItem.sanitizedUrl || mediaItem.previewUrl || mediaItem.originalPath}
            alt={mediaItem.filename || 'Customer Unboxing'}
            className="w-full h-full object-contain max-h-[70vh]"
          />

          {/* Privacy Protection Watermark Pill */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-label-code-sm border border-white/10">
            <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
            <span>EXIF GPS Stripped · Privacy Shield Active</span>
          </div>

          {/* Media Metadata Pill Bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/80 font-mono text-[11px] px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
            <span>{mediaItem.filename} · {mediaItem.dimensions}</span>
            <span className="text-primary font-semibold">{mediaItem.perceptualHash}</span>
          </div>
        </div>

        {/* Right: Review Details & Shoppable Variant Trigger */}
        <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-surface-container-lowest">
          <div className="flex flex-col gap-4">
            {/* Header: Reviewer info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-headline-sm font-bold flex items-center justify-center">
                  {review.reviewerName?.slice(0, 2).toUpperCase() || 'DK'}
                </div>
                <div>
                  <div className="font-headline-sm font-semibold text-on-surface">
                    {review.reviewerName}
                  </div>
                  <div className="font-mono text-xs text-outline">
                    {review.reviewerLocation}
                  </div>
                </div>
              </div>
              <ProvenanceBadge type={review.provenanceType} orderId={review.orderId} />
            </div>

            {/* Shoppable SKU Tag */}
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-outline uppercase tracking-wider">
                  Verified Purchased SKU
                </span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
                  {review.variantTitle || review.productTitle}
                </span>
              </div>
              <button
                onClick={() => onQuickViewVariant && onQuickViewVariant(review.variantTitle)}
                className="px-2.5 py-1 rounded bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/40 text-primary font-mono text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Quick View</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>

            {/* Stars & Title */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size={18} />
                <span className="font-mono text-xs text-outline">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md font-semibold text-on-surface">
                {review.title}
              </h3>
            </div>

            {/* Sanitized Text Body */}
            <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {renderSanitizedText(review.bodySanitized || review.bodyOriginal)}
            </div>

            {/* Longitudinal update if any */}
            {review.followUpUpdate && (
              <div className="bg-primary-fixed/20 border-l-2 border-primary p-3 rounded-r-lg">
                <span className="font-mono text-label-code-sm text-primary font-bold block mb-1">
                  {review.followUpUpdate.label}
                </span>
                <p className="font-body-sm text-body-sm text-on-surface">
                  {review.followUpUpdate.text}
                </p>
              </div>
            )}
          </div>

          {/* Footer: Helpful & Verification */}
          <div className="pt-6 border-t border-outline-variant/30 mt-6 flex items-center justify-between">
            <span className="font-mono text-label-code-sm text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
              <span>Delivery Hash Verified</span>
            </span>
            <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">thumb_up</span>
              <span>{review.helpfulVotes || 0} found helpful</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

