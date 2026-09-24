import React from 'react';
import { MediaItem } from '../../types/gallery';
import { useGalleryStore } from '../../store/useGalleryStore';
import { LODImage } from './LODImage';

interface MediaCardProps {
  item: MediaItem;
  style?: React.CSSProperties;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, style }) => {
  const isSelected = useGalleryStore((s) => s.selectedIds.includes(item.id));
  const selectedIds = useGalleryStore((s) => s.selectedIds);
  const toggleSelect = useGalleryStore((s) => s.toggleSelectMedia);
  const openLightbox = useGalleryStore((s) => s.openLightbox);

  // Drag-to-album handler
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // If the dragged item is in the selected list, drag all selected items; otherwise drag just this item
    const itemsToDrag = isSelected && selectedIds.length > 0 ? selectedIds : [item.id];
    e.dataTransfer.setData('application/json', JSON.stringify({ mediaIds: itemsToDrag }));
    e.dataTransfer.effectAllowed = 'move';

    // Custom drag ghost preview
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.padding = '8px 14px';
    ghost.style.background = '#09090b';
    ghost.style.border = '1px solid #38bdf8';
    ghost.style.borderRadius = '9999px';
    ghost.style.color = '#38bdf8';
    ghost.style.fontFamily = 'JetBrains Mono, monospace';
    ghost.style.fontSize = '12px';
    ghost.style.fontWeight = '600';
    ghost.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.5)';
    ghost.innerText = `Spatial Relocating: ${itemsToDrag.length} item${itemsToDrag.length > 1 ? 's' : ''}`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  return (
    <div
      style={style}
      draggable
      onDragStart={handleDragStart}
      className={`group absolute rounded-xl overflow-hidden bg-surface-container-high transition-all duration-300 cursor-grab active:cursor-grabbing ${
        isSelected
          ? 'photonic-border scale-[1.01] z-20 shadow-[0_0_20px_-2px_rgba(56,189,248,0.35)]'
          : 'border border-outline-variant/30 hover:border-outline-variant/80 hover:scale-[1.01] shadow-darkroom-card hover:z-10'
      }`}
    >
      <div className="relative w-full h-full overflow-hidden bg-[#0e0e10]">
        {/* 3-Stage LOD Image */}
        <LODImage
          srcThumbnail={item.srcThumbnail}
          srcFull={item.srcFull}
          alt={item.title}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {/* Ambient Darkroom Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-black/40 pointer-events-none" />

        {/* Top Floating Badges & Selection Checkbox */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect(item.id);
            }}
            title={isSelected ? 'Deselect tile' : 'Select tile'}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-primary-container text-[#09090b] shadow-[0_0_10px_rgba(56,189,248,0.6)] font-bold'
                : 'bg-surface-container-lowest/80 text-on-surface-variant hover:text-white hover:bg-surface-container border border-white/10'
            }`}
          >
            {isSelected ? (
              <span className="material-symbols-outlined text-[15px] font-bold">check</span>
            ) : (
              <span className="material-symbols-outlined text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">
                add
              </span>
            )}
          </button>

          <span className="font-mono-data text-[10px] px-2 py-0.5 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-primary font-semibold border border-white/10 shadow-sm">
            {item.format} • {item.exif.megapixels || 'RAW'}
          </span>
        </div>

        {/* Top Right Quick Actions: Fullscreen Lightbox */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(item.id);
            }}
            title="Open Lightbox Studio"
            className="w-7 h-7 rounded-lg bg-surface-container-lowest/85 backdrop-blur-md text-on-surface-variant hover:text-primary hover:bg-surface-container-highest flex items-center justify-center border border-white/10 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">fullscreen</span>
          </button>
        </div>

        {/* Bottom Floating Telemetry Strip */}
        <div
          onClick={() => openLightbox(item.id)}
          className="absolute bottom-2.5 inset-x-2.5 p-2.5 rounded-lg bg-surface-container-lowest/90 backdrop-blur-md border border-white/10 space-y-1 cursor-pointer transition-all hover:bg-surface-container-lowest"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-medium text-xs text-on-surface truncate">{item.title}</span>
            <div className="flex items-center text-primary-fixed-dim text-xs shrink-0">
              <span className="material-symbols-outlined text-[13px] text-primary">star</span>
              <span className="font-mono-data text-[11px] ml-0.5 font-bold">
                {item.rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="font-mono-data text-[10px] text-outline truncate">
            {item.exif.camera?.split(' ')[0]} • {item.exif.lens?.split(' ')[0]} • {item.exif.aperture} •{' '}
            {item.exif.shutter} • ISO {item.exif.iso}
          </div>

          {/* Extracted Color Swatches mini strip on hover */}
          <div className="flex items-center gap-1 pt-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {item.dominantColors?.slice(0, 5).map((color, idx) => (
              <span
                key={idx}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: color.hex }}
                title={`${color.hex} (${color.percentage}%)`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
