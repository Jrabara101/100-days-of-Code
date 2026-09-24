import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { useMasonryWorker } from '../../hooks/useMasonryWorker';
import { MediaCard } from './MediaCard';

export const VirtualizedMasonry: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(window.innerHeight);

  const media = useGalleryStore((s) => s.media);
  const allIds = useGalleryStore((s) => s.allIds);
  const activeAlbumId = useGalleryStore((s) => s.activeAlbumId);
  const searchQuery = useGalleryStore((s) => s.searchQuery);
  const activeFilterTag = useGalleryStore((s) => s.activeFilterTag);
  const activeRatingFilter = useGalleryStore((s) => s.activeRatingFilter);
  const formatFilter = useGalleryStore((s) => s.formatFilter);
  const columnCount = useGalleryStore((s) => s.columnCount);

  // Measure container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Track window scroll for spatial viewport culling
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate scroll relative to the gallery container top
        const relativeScroll = Math.max(0, -rect.top);
        setScrollTop(relativeScroll);
      }
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Filter items based on active album and search/tags
  const filteredItems = useMemo(() => {
    return allIds
      .map((id) => media[id])
      .filter((item) => {
        if (!item) return false;

        // Album filter
        if (activeAlbumId && item.albumId !== activeAlbumId) {
          return false;
        }

        // Tag filter
        if (activeFilterTag && (!item.tags || !item.tags.includes(activeFilterTag))) {
          return false;
        }

        // Rating filter
        if (activeRatingFilter && item.rating < activeRatingFilter) {
          return false;
        }

        // Format filter
        if (formatFilter && item.format !== formatFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCamera = item.exif.camera?.toLowerCase().includes(q);
          const matchLens = item.exif.lens?.toLowerCase().includes(q);
          const matchLocation = item.exif.locationName?.toLowerCase().includes(q);
          const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchCamera && !matchLens && !matchLocation && !matchTags) {
            return false;
          }
        }

        return true;
      });
  }, [media, allIds, activeAlbumId, activeFilterTag, activeRatingFilter, formatFilter, searchQuery]);

  // Spatial Masonry Web Worker Layout & Spatial Culling
  const { bounds, totalHeight, visibleIds, isCalculating } = useMasonryWorker({
    items: filteredItems,
    containerWidth,
    columnCount,
    gutter: 16,
    scrollTop,
    viewportHeight,
    bufferZone: 450, // 450px pre-render buffer for zero-stutter scrolling
  });

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Telemetry Indicator Strip */}
      <div className="flex items-center justify-between px-1 text-xs text-outline font-mono-data">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-on-surface">Spatial Engine:</span>
            <span className="text-primary font-semibold">
              {visibleIds.length} Mounted / {filteredItems.length} Total
            </span>
          </span>
          <span className="hidden sm:inline text-outline-variant">•</span>
          <span className="hidden sm:inline">Buffer: ±450px</span>
        </div>
        <div className="flex items-center gap-2">
          {isCalculating && (
            <span className="text-primary-fixed-dim text-[11px] animate-pulse">
              Computing spatial geometry...
            </span>
          )}
          <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">
            60 FPS VIRTUALIZED
          </span>
        </div>
      </div>

      {/* Main Virtualized Container */}
      <div
        ref={containerRef}
        style={{ height: Math.max(400, totalHeight) }}
        className="relative w-full transition-height duration-200"
      >
        {filteredItems.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest/50">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">
              photo_library
            </span>
            <h3 className="text-base font-semibold text-on-surface">No Media Assets Found</h3>
            <p className="text-xs text-outline max-w-sm mt-1">
              No photos match your current filter parameters or active album query. Try clearing
              your search filters.
            </p>
          </div>
        ) : (
          visibleIds.map((id) => {
            const item = media[id];
            const itemBounds = bounds[id];
            if (!item || !itemBounds) return null;

            return (
              <MediaCard
                key={id}
                item={item}
                style={{
                  top: `${itemBounds.top}px`,
                  left: `${itemBounds.left}px`,
                  width: `${itemBounds.width}px`,
                  height: `${itemBounds.height}px`,
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
