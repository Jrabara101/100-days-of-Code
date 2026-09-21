import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePixelStore } from '../../store/usePixelStore';
import { getLinePixels, getBrushOffsets, filterPixelPerfect } from '../../lib/algorithms';
import { compositeFrameToCanvas } from '../../lib/exportUtils';

export const PixelCanvas: React.FC = () => {
  const {
    dimensions,
    zoom,
    pan,
    setPan,
    setZoom,
    showGrid,
    activeTool,
    brushSize,
    pixelPerfect,
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    layers,
    activeLayerId,
    frames,
    activeFrameIndex,
    onionSkin,
    selection,
    setSelection,
    setCursorPos,
    setPixel,
    applyStroke,
    applyFloodFill,
    pushHistory,
    peerJam,
    broadcastCursor,
  } = usePixelStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const onionCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isPointerDown, setIsPointerDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const strokePixelsRef = useRef<{ x: number; y: number }[]>([]);
  const panStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number } | null>(null);
  const selectStartRef = useRef<{ x: number; y: number } | null>(null);

  const { width, height } = dimensions;

  // Convert client viewport coordinates to canvas pixel coordinates (0 to width-1, 0 to height-1)
  const getCanvasPixelCoords = useCallback((clientX: number, clientY: number) => {
    if (!renderCanvasRef.current) return null;
    const rect = renderCanvasRef.current.getBoundingClientRect();
    const rawX = (clientX - rect.left) / rect.width;
    const rawY = (clientY - rect.top) / rect.height;

    const pixelX = Math.floor(rawX * width);
    const pixelY = Math.floor(rawY * height);

    if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) {
      return null;
    }
    return { x: pixelX, y: pixelY };
  }, [width, height]);

  // 1. Render Background Grid Canvas (Checkerboard & Pixel grid lines)
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Checkerboard
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isEven = (x + y) % 2 === 0;
        ctx.fillStyle = isEven ? '#12131A' : '#1A1C26';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [width, height]);

  // 2. Render Onion Skin Layer (Previous / Next frame ghosts)
  useEffect(() => {
    const canvas = onionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (!onionSkin.enabled || frames.length <= 1) return;

    // Previous frames (ghosted red/violet)
    for (let b = onionSkin.framesBefore; b >= 1; b--) {
      const prevIdx = activeFrameIndex - b;
      if (prevIdx >= 0) {
        const prevCanvas = compositeFrameToCanvas(frames[prevIdx], layers, width, height);
        ctx.save();
        ctx.globalAlpha = 0.25 / b;
        ctx.drawImage(prevCanvas, 0, 0);
        // Optional red tint for past frames
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = '#ff8080';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }

    // Next frames (ghosted cyan/blue)
    for (let a = 1; a <= onionSkin.framesAfter; a++) {
      const nextIdx = activeFrameIndex + a;
      if (nextIdx < frames.length) {
        const nextCanvas = compositeFrameToCanvas(frames[nextIdx], layers, width, height);
        ctx.save();
        ctx.globalAlpha = 0.25 / a;
        ctx.drawImage(nextCanvas, 0, 0);
        // Optional cyan tint for future frames
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = '#4cd7f6';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }, [onionSkin, frames, layers, activeFrameIndex, width, height]);

  // 3. Render Active Drawing Canvas (Composited layers of active frame)
  useEffect(() => {
    const canvas = renderCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;

    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    layers.forEach((layer, lIdx) => {
      if (!layer.visible) return;
      const grid = currentFrame[lIdx];
      if (!grid) return;

      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = width;
      layerCanvas.height = height;
      const layerCtx = layerCanvas.getContext('2d');
      if (!layerCtx) return;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = grid[y]?.[x];
          if (color) {
            layerCtx.fillStyle = color;
            layerCtx.fillRect(x, y, 1, 1);
          }
        }
      }

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode || 'source-over';
      ctx.drawImage(layerCanvas, 0, 0);
      ctx.restore();
    });
  }, [frames, layers, activeFrameIndex, width, height]);

  // 4. Render Cursor Hover, Grid Lines, and Selection Overlay
  const drawOverlay = useCallback((hoverPixel: { x: number; y: number } | null) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Optional pixel grid overlay lines
    if (showGrid && zoom >= 300) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.05;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Selection Marquee Box
    if (selection) {
      ctx.save();
      ctx.strokeStyle = '#4cd7f6';
      ctx.lineWidth = 0.15;
      ctx.setLineDash([0.3, 0.3]);
      ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
      ctx.fillStyle = 'rgba(76, 215, 246, 0.15)';
      ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
      ctx.restore();
    }

    // Hover Cursor Indicator
    if (hoverPixel && !isPanning) {
      const offsets = getBrushOffsets(brushSize);
      ctx.save();
      for (const off of offsets) {
        const px = hoverPixel.x + off.dx;
        const py = hoverPixel.y + off.dy;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          if (activeTool === 'eraser') {
            ctx.fillStyle = 'rgba(255, 100, 100, 0.4)';
            ctx.fillRect(px, py, 1, 1);
            ctx.strokeStyle = '#ff6464';
            ctx.lineWidth = 0.1;
            ctx.strokeRect(px, py, 1, 1);
          } else if (activeTool === 'picker') {
            ctx.fillStyle = 'rgba(76, 215, 246, 0.3)';
            ctx.fillRect(px, py, 1, 1);
            ctx.strokeStyle = '#4cd7f6';
            ctx.lineWidth = 0.1;
            ctx.strokeRect(px, py, 1, 1);
          } else if (activeTool === 'pencil') {
            ctx.fillStyle = primaryColor + '66';
            ctx.fillRect(px, py, 1, 1);
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 0.1;
            ctx.strokeRect(px, py, 1, 1);
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 0.1;
            ctx.strokeRect(px, py, 1, 1);
          }
        }
      }
      ctx.restore();
    }

    // Live Peer Cursors
    if (peerJam.enabled && peerJam.peers.length > 0) {
      for (const peer of peerJam.peers) {
        ctx.save();
        ctx.fillStyle = peer.color;
        ctx.fillRect(peer.x, peer.y, 1, 1);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.1;
        ctx.strokeRect(peer.x, peer.y, 1, 1);
        ctx.restore();
      }
    }
  }, [width, height, showGrid, zoom, selection, brushSize, activeTool, isPanning, primaryColor, peerJam]);

  // Pointer Down Handler
  const handlePointerDown = (e: React.PointerEvent) => {
    // Middle click or Move tool triggers pan
    if (e.button === 1 || activeTool === 'move' || e.shiftKey) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      return;
    }

    if (e.button !== 0) return; // Only primary button
    const coords = getCanvasPixelCoords(e.clientX, e.clientY);
    if (!coords) return;

    setIsPointerDown(true);
    lastPointerRef.current = coords;
    strokePixelsRef.current = [];

    // Push undo state before starting drawing stroke
    pushHistory(`Tool ${activeTool}`);

    if (activeTool === 'picker') {
      // Sample color from composite canvas
      const renderCanvas = renderCanvasRef.current;
      if (renderCanvas) {
        const ctx = renderCanvas.getContext('2d');
        if (ctx) {
          const pixelData = ctx.getImageData(coords.x, coords.y, 1, 1).data;
          if (pixelData[3] > 0) {
            const hex = `#${pixelData[0].toString(16).padStart(2, '0')}${pixelData[1].toString(16).padStart(2, '0')}${pixelData[2].toString(16).padStart(2, '0')}`.toUpperCase();
            setPrimaryColor(hex);
          }
        }
      }
      return;
    }

    if (activeTool === 'bucket') {
      applyFloodFill(coords.x, coords.y, primaryColor);
      return;
    }

    if (activeTool === 'select') {
      selectStartRef.current = coords;
      setSelection({ x: coords.x, y: coords.y, w: 1, h: 1 });
      return;
    }

    // Pencil or Eraser
    const drawColor = activeTool === 'eraser' ? '' : primaryColor;
    const offsets = getBrushOffsets(brushSize);
    const strokePoints: { x: number; y: number }[] = [];

    for (const off of offsets) {
      strokePoints.push({ x: coords.x + off.dx, y: coords.y + off.dy });
    }
    applyStroke(strokePoints, drawColor);
    strokePixelsRef.current.push(coords);
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent) => {
    // Pan mode handling
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.startPanX + dx,
        y: panStartRef.current.startPanY + dy,
      });
      return;
    }

    const coords = getCanvasPixelCoords(e.clientX, e.clientY);
    setCursorPos(coords);
    drawOverlay(coords);

    if (coords && peerJam.enabled) {
      broadcastCursor(coords.x, coords.y);
    }

    if (!isPointerDown || !coords || !lastPointerRef.current) return;

    if (activeTool === 'select' && selectStartRef.current) {
      const start = selectStartRef.current;
      const minX = Math.min(start.x, coords.x);
      const minY = Math.min(start.y, coords.y);
      const w = Math.abs(coords.x - start.x) + 1;
      const h = Math.abs(coords.y - start.y) + 1;
      setSelection({ x: minX, y: minY, w, h });
      return;
    }

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      const drawColor = activeTool === 'eraser' ? '' : primaryColor;
      const linePoints = getLinePixels(
        lastPointerRef.current.x,
        lastPointerRef.current.y,
        coords.x,
        coords.y
      );

      const filtered = pixelPerfect ? filterPixelPerfect(linePoints) : linePoints;
      const offsets = getBrushOffsets(brushSize);
      const allPoints: { x: number; y: number }[] = [];

      for (const pt of filtered) {
        for (const off of offsets) {
          allPoints.push({ x: pt.x + off.dx, y: pt.y + off.dy });
        }
      }

      applyStroke(allPoints, drawColor);
      lastPointerRef.current = coords;
      strokePixelsRef.current.push(coords);
    }
  };

  // Pointer Up Handler
  const handlePointerUp = () => {
    setIsPointerDown(false);
    setIsPanning(false);
    panStartRef.current = null;
    selectStartRef.current = null;
    lastPointerRef.current = null;
  };

  // Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 50 : -50;
    setZoom((prev) => Math.max(100, Math.min(2400, prev + zoomDelta)));
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        handlePointerUp();
        setCursorPos(null);
        drawOverlay(null);
      }}
      onWheel={handleWheel}
      className={`relative flex-1 w-full h-full overflow-hidden flex items-center justify-center select-none bg-bg-canvas ${
        activeTool === 'move' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
    >
      {/* Scaled & Panned Canvas Viewport using 60fps CSS transform */}
      <div
        className="relative shadow-2xl transition-transform duration-75 ease-out rounded-sm ring-1 ring-border-subtle/50"
        style={{
          width: `${(width * zoom) / 100}px`,
          height: `${(height * zoom) / 100}px`,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
        }}
      >
        {/* Layer 1: Background Grid Canvas */}
        <canvas
          ref={gridCanvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full pixelated pointer-events-none"
        />

        {/* Layer 2: Onion Skinning Ghost Canvas */}
        <canvas
          ref={onionCanvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full pixelated pointer-events-none"
        />

        {/* Layer 3: Active Composited Layers Canvas */}
        <canvas
          ref={renderCanvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full pixelated"
        />

        {/* Layer 4: Overlay (Grid lines, brush hover square, marquee selection) */}
        <canvas
          ref={overlayCanvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full pixelated pointer-events-none z-10"
        />
      </div>
    </div>
  );
};
