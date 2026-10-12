import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  MousePointer,
  HardDrive,
  UploadCloud,
} from 'lucide-react';
import { useAtlasCanvas } from '../hooks/useAtlasCanvas';
import { SpriteFrame } from '../types/sprite';
import { calculateVramBytes, formatBytes } from '../lib/atlasMath';

interface AtlasViewportProps {
  image: HTMLImageElement | null;
  imageDimensions: { width: number; height: number };
  frames: Record<string, SpriteFrame>;
  selectedFrameIds: string[];
  activeFrameId: string | null;
  onSelectFrame: (id: string, multi: boolean) => void;
  onSelectMultipleFrames?: (ids: string[]) => void;
  pixelated: boolean;
  showGrid: boolean;
  onUploadImage: (file: File) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
}

export const AtlasViewport: React.FC<AtlasViewportProps> = ({
  image,
  imageDimensions,
  frames,
  selectedFrameIds,
  activeFrameId,
  onSelectFrame,
  onSelectMultipleFrames,
  pixelated,
  showGrid,
  onUploadImage,
  zoom,
  onZoomChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const {
    canvasRef,
    pan,
    setZoom,
    cursorPos,
    hoveredFrameId,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    fitToViewport,
  } = useAtlasCanvas({
    image,
    frames,
    selectedFrameIds,
    activeFrameId,
    onSelectFrame,
    onSelectMultipleFrames,
    pixelated,
    showGrid,
  });

  // Keep parent zoom in sync
  useEffect(() => {
    setZoom(zoom);
  }, [zoom, setZoom]);

  // Resize canvas when container size changes
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  // Handle Drag & Drop of sprite files onto the canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUploadImage(file);
      }
    }
  };

  // Hovered frame object for HUD
  const hoveredFrame = hoveredFrameId ? frames[hoveredFrameId] : null;
  const vramBytes = calculateVramBytes(imageDimensions.width, imageDimensions.height);

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex-1 h-[calc(100vh-3rem)] bg-void overflow-hidden select-none cursor-crosshair"
    >
      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full h-full block ${pixelated ? 'pixelated' : ''}`}
      />

      {/* Drag & Drop Neon Glowing Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-40 bg-void/85 border-4 border-dashed border-accent-emerald flex flex-col items-center justify-center space-y-3 pointer-events-none animate-pulse">
          <UploadCloud className="w-16 h-16 text-accent-emerald" />
          <div className="text-center">
            <h3 className="text-lg font-bold text-accent-emerald">Drop Sprite Sheet to Ingest</h3>
            <p className="text-xs text-text-muted font-mono">PNG, WebP lossless textures supported</p>
          </div>
        </div>
      )}

      {/* Bottom-Left Floating Telemetry HUD */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-2 bg-dock/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border-subtle shadow-lg font-mono text-[11px] text-text-muted">
        {/* Cursor image coordinates */}
        <div className="flex items-center space-x-1">
          <MousePointer className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-text-display font-medium">
            X: {cursorPos.x}, Y: {cursorPos.y}
          </span>
        </div>

        <div className="h-3 w-[1px] bg-border-subtle" />

        {/* Hovered frame readout */}
        {hoveredFrame ? (
          <span className="text-accent-cyan font-bold">
            Frame #{hoveredFrame.index} ({hoveredFrame.sourceRect.width}×
            {hoveredFrame.sourceRect.height}px)
          </span>
        ) : (
          <span className="text-text-muted">No frame hovered</span>
        )}

        <div className="h-3 w-[1px] bg-border-subtle" />

        {/* VRAM memory footprint */}
        <div className="flex items-center space-x-1">
          <HardDrive className="w-3.5 h-3.5 text-accent-emerald" />
          <span>VRAM: {formatBytes(vramBytes)}</span>
        </div>
      </div>

      {/* Bottom-Right Floating Navigation Pills */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center space-x-1 bg-dock/90 backdrop-blur-md p-1 rounded-lg border border-border-subtle shadow-lg">
        <button
          onClick={() => onZoomChange(Math.max(0.25, zoom * 0.8))}
          title="Zoom Out"
          className="p-1.5 rounded text-text-muted hover:text-text-display hover:bg-card transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => onZoomChange(1)}
          title="Reset Zoom to 100%"
          className="px-2 py-1 rounded text-text-muted hover:text-text-display hover:bg-card text-xs font-mono transition-colors"
        >
          1:1
        </button>

        <button
          onClick={() => onZoomChange(Math.min(32, zoom * 1.25))}
          title="Zoom In"
          className="p-1.5 rounded text-text-muted hover:text-text-display hover:bg-card transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={fitToViewport}
          title="Fit Sprite to Screen"
          className="p-1.5 rounded text-accent-cyan hover:bg-card transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
