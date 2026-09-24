import React, { useState, useRef } from 'react';
import { useGalleryStore } from '../../store/useGalleryStore';
import { Dialog } from '../ui/dialog';
import { Slider } from '../ui/slider';
import { HistogramScope } from './HistogramScope';
import { ExifInspector } from './ExifInspector';
import { LODImage } from '../gallery/LODImage';

export const LightboxStudio: React.FC = () => {
  const activeLightboxId = useGalleryStore((s) => s.activeLightboxId);
  const openLightbox = useGalleryStore((s) => s.openLightbox);
  const media = useGalleryStore((s) => s.media);
  const allIds = useGalleryStore((s) => s.allIds);

  const [zoom, setZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [activeLut, setActiveLut] = useState<string>('none');
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!activeLightboxId) return null;
  const currentItem = media[activeLightboxId];
  if (!currentItem) return null;

  const currentIndex = allIds.indexOf(activeLightboxId);
  const handlePrev = () => {
    if (currentIndex > 0) {
      openLightbox(allIds[currentIndex - 1]);
      setZoom(100);
      setPan({ x: 0, y: 0 });
    }
  };
  const handleNext = () => {
    if (currentIndex < allIds.length - 1) {
      openLightbox(allIds[currentIndex + 1]);
      setZoom(100);
      setPan({ x: 0, y: 0 });
    }
  };

  // Mouse pan handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 100) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Dynamic filter CSS based on active LUT
  const getFilterStyle = () => {
    switch (activeLut) {
      case 'cyan':
        return 'hue-rotate(185deg) contrast(1.15) saturate(1.25)';
      case 'noir':
        return 'grayscale(100%) contrast(1.35) brightness(0.95)';
      case 'golden':
        return 'sepia(0.35) saturate(1.4) contrast(1.1)';
      default:
        return 'none';
    }
  };

  return (
    <Dialog isOpen={!!activeLightboxId} onClose={() => openLightbox(null)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full h-[90vh] overflow-hidden">
        {/* Left Stage Canvas: Interactive Viewport (8 Columns on desktop) */}
        <div className="lg:col-span-8 relative bg-black flex flex-col justify-between p-3 sm:p-5 border-b lg:border-b-0 lg:border-r border-outline-variant/30 select-none overflow-hidden">
          {/* Top Stage Floating Controls */}
          <div className="flex items-center justify-between z-20 gap-2">
            <div className="flex items-center gap-2 bg-surface-container-lowest/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <span className="material-symbols-outlined text-[16px] text-primary">view_in_ar</span>
              <span className="font-mono-data text-xs text-on-surface font-semibold tracking-wide truncate max-w-[200px] sm:max-w-md">
                {currentItem.title.toUpperCase().replace(/\s+/g, '_')}.{currentItem.format}
              </span>
            </div>

            {/* Top Right: Histogram Scope & Close button */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block w-48">
                <HistogramScope spectralRGB={currentItem.spectralRGB} />
              </div>
              <button
                type="button"
                onClick={() => openLightbox(null)}
                className="w-8 h-8 rounded-lg bg-surface-container-lowest/80 backdrop-blur-md text-on-surface-variant hover:text-white hover:bg-surface-container-high flex items-center justify-center border border-white/10 transition-colors"
                title="Close Studio (Esc)"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Central Image Focal Viewport with Pan and Zoom */}
          <div
            className={`relative flex-1 w-full my-auto flex items-center justify-center overflow-hidden py-2 ${
              zoom > 100 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Prev arrow */}
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface hover:text-primary flex items-center justify-center border border-white/10 transition-all hover:scale-110"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
            )}

            {/* Next arrow */}
            {currentIndex < allIds.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-on-surface hover:text-primary flex items-center justify-center border border-white/10 transition-all hover:scale-110"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            )}

            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
                filter: getFilterStyle(),
                transition: isPanning ? 'none' : 'transform 0.25s ease-out, filter 0.3s ease',
              }}
              className="relative max-w-2xl max-h-[65vh] rounded-lg overflow-hidden shadow-2xl flex items-center justify-center"
            >
              <LODImage
                srcThumbnail={currentItem.srcThumbnail}
                srcFull={currentItem.srcFull}
                alt={currentItem.title}
                loadFullRes={true}
                className="w-full h-auto max-h-[65vh] object-contain rounded-lg"
              />

              {/* Overlay Rule-of-Thirds Grid */}
              {showGrid && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40 z-10">
                  <div className="border-r border-b border-primary/50" />
                  <div className="border-r border-b border-primary/50" />
                  <div className="border-b border-primary/50" />
                  <div className="border-r border-b border-primary/50" />
                  <div className="border-r border-b border-primary/50" />
                  <div className="border-b border-primary/50" />
                  <div className="border-r border-primary/50" />
                  <div className="border-r border-primary/50" />
                  <div />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Stage Pan / Zoom / Matrix Controls */}
          <div className="flex flex-wrap items-center justify-between z-20 pt-2 gap-2">
            <div className="flex items-center gap-2 bg-surface-container-lowest/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setZoom(100);
                  setPan({ x: 0, y: 0 });
                }}
                className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                  zoom === 100
                    ? 'bg-surface-container-highest text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                FIT
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(150);
                  setPan({ x: 0, y: 0 });
                }}
                className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                  zoom === 150
                    ? 'bg-surface-container-highest text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                1.5X
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(200);
                  setPan({ x: 0, y: 0 });
                }}
                className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                  zoom === 200
                    ? 'bg-surface-container-highest text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                2X
              </button>

              <span className="h-3 w-[1px] bg-outline-variant/40 mx-1" />

              <span className="material-symbols-outlined text-[16px] text-outline">zoom_in</span>
              <Slider
                min={100}
                max={400}
                value={zoom}
                unit="%"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-24 sm:w-32"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-surface-container-lowest/85 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                  showGrid
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
                }`}
                title="Toggle Rule-of-Thirds Grid"
              >
                <span className="material-symbols-outlined text-[18px]">grid_on</span>
              </button>

              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container transition-colors"
                title="Rotate 90° Clockwise"
              >
                <span className="material-symbols-outlined text-[18px]">rotate_right</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(100);
                  setPan({ x: 0, y: 0 });
                  setRotation(0);
                  setActiveLut('none');
                }}
                className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-surface-container transition-colors"
                title="Reset Stage View"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Inspector Panel (4 Columns on desktop) */}
        <div className="lg:col-span-4 bg-surface-container-low p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
          <ExifInspector item={currentItem} activeLut={activeLut} onSelectLut={setActiveLut} />
        </div>
      </div>
    </Dialog>
  );
};
