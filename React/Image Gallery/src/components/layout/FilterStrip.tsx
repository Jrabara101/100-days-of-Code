import React from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { LayoutMode } from '../../types/gallery';

export const FilterStrip: React.FC = () => {
  const layoutMode = useGalleryStore((s) => s.layoutMode);
  const setLayoutMode = useGalleryStore((s) => s.setLayoutMode);
  const selectedIds = useGalleryStore((s) => s.selectedIds);
  const allIds = useGalleryStore((s) => s.allIds);
  const activeFilterTag = useGalleryStore((s) => s.activeFilterTag);
  const setActiveFilterTag = useGalleryStore((s) => s.setActiveFilterTag);
  const activeRatingFilter = useGalleryStore((s) => s.activeRatingFilter);
  const setActiveRatingFilter = useGalleryStore((s) => s.setActiveRatingFilter);
  const formatFilter = useGalleryStore((s) => s.formatFilter);
  const setFormatFilter = useGalleryStore((s) => s.setFormatFilter);

  const tags = ['#alpine', '#neon', '#cyber', '#macro', '#noir', '#iceland'];

  return (
    <div className="w-full bg-surface-container-low/70 backdrop-blur-md rounded-xl p-3 sm:p-4 mb-6 shadow-sm border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Layout Mode Selectors */}
        <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/20">
          {(
            [
              { id: 'masonry', label: '4-Col Masonry', icon: 'grid_view' },
              { id: 'scatter', label: 'Spatial Scatter', icon: 'bubble_chart' },
              { id: 'timeline', label: 'Timeline', icon: 'schedule' },
              { id: 'lens', label: 'Lens Cluster', icon: 'camera' },
            ] as Array<{ id: LayoutMode; label: string; icon: string }>
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setLayoutMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                layoutMode === mode.id
                  ? 'bg-surface-container-highest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{mode.icon}</span>
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Sorting Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg text-xs font-mono-data text-on-surface-variant border border-outline-variant/20">
          <span className="material-symbols-outlined text-[16px] text-outline">swap_vert</span>
          <span>Sort:</span>
          <span className="text-on-surface font-semibold">Capture Timestamp (DESC)</span>
        </div>

        {/* Live Selection Pill */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary font-mono-data text-xs border border-primary/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            <span>
              {selectedIds.length} OF {allIds.length} TILES SELECTED
            </span>
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveFilterTag(activeFilterTag === tag ? null : tag)}
            className={`px-2.5 py-1 rounded text-xs font-mono-data transition-colors ${
              activeFilterTag === tag
                ? 'bg-primary text-[#09090b] font-semibold shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                : 'bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            {tag}
          </button>
        ))}

        {(activeFilterTag || activeRatingFilter || formatFilter) && (
          <button
            type="button"
            onClick={() => {
              setActiveFilterTag(null);
              setActiveRatingFilter(null);
              setFormatFilter(null);
            }}
            className="px-2 py-1 text-xs font-mono-data text-outline hover:text-white transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
