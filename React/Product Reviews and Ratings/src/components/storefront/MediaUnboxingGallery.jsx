import React from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function MediaUnboxingGallery({
  onSelectMedia,
  onQuickViewVariant
}) {
  const { reviews, activeProductId } = useTrustStore();

  // Collect all media items from approved/featured reviews of this product
  const mediaList = [];
  reviews
    .filter(r => r.productId === activeProductId && (r.moderationStatus === 'approved' || r.id === 'REV-094182'))
    .forEach(review => {
      (review.media || []).forEach(mediaItem => {
        mediaList.push({
          mediaItem,
          review
        });
      });
    });

  if (mediaList.length === 0) return null;

  return (
    <section className="w-full bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">photo_library</span>
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
            Customer Unboxing Gallery
          </h2>
          <span className="font-mono text-label-code-sm bg-surface-container px-2 py-0.5 rounded text-outline font-medium">
            {mediaList.length} photos
          </span>
        </div>
        <span className="font-mono text-label-code-sm text-outline hidden sm:inline">
          EXIF GPS scrubbed · Variant Tagged
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mediaList.map(({ mediaItem, review }, index) => (
          <div
            key={mediaItem.id || index}
            className="group relative rounded-xl overflow-hidden bg-surface-container aspect-square border border-outline-variant/30 shadow-xs cursor-pointer"
            onClick={() => onSelectMedia(mediaItem, review)}
          >
            {/* Image */}
            <img
              src={mediaItem.sanitizedUrl || mediaItem.previewUrl || mediaItem.originalPath}
              alt={mediaItem.filename || 'Unboxing Photo'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-primary/90 px-1.5 py-0.5 rounded text-white font-semibold">
                  <span className="material-symbols-outlined text-[11px]">verified</span>
                  <span>Verified Buyer</span>
                </span>
                <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] font-semibold truncate text-white/95">
                  Ordered: {review.variantTitle || 'Matte Black · 1 L'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickViewVariant(review.variantTitle);
                  }}
                  className="w-full text-center py-1 bg-white text-on-surface font-mono text-[10px] font-bold rounded hover:bg-surface-container transition-colors shadow-xs"
                >
                  Quick View Variant
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

