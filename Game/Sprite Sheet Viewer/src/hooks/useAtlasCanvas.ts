import { useRef, useState, useEffect, useCallback } from 'react';
import { SpriteFrame } from '../types/sprite';

interface UseAtlasCanvasProps {
  image: HTMLImageElement | null;
  frames: Record<string, SpriteFrame>;
  selectedFrameIds: string[];
  activeFrameId: string | null;
  onSelectFrame: (id: string, multi: boolean) => void;
  onSelectMultipleFrames?: (ids: string[]) => void;
  pixelated: boolean;
  showGrid: boolean;
}

export function useAtlasCanvas({
  image,
  frames,
  selectedFrameIds,
  activeFrameId,
  onSelectFrame,
  onSelectMultipleFrames,
  pixelated,
  showGrid,
}: UseAtlasCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(4); // Default 400% zoom for pixel art
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Marquee drag-selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState<boolean>(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);

  // Cursor & Hover HUD telemetry
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null);

  // Convert canvas client coordinates to image pixel space
  const screenToImageCoords = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;

      const imgX = Math.floor((localX - pan.x) / zoom);
      const imgY = Math.floor((localY - pan.y) / zoom);
      return { x: imgX, y: imgY };
    },
    [pan, zoom]
  );

  // Find frame at image coordinate
  const getFrameAtCoord = useCallback(
    (imgX: number, imgY: number): SpriteFrame | null => {
      const frameList = Object.values(frames);
      for (const f of frameList) {
        const { x, y, width, height } = f.sourceRect;
        if (imgX >= x && imgX < x + width && imgY >= y && imgY < y + height) {
          return f;
        }
      }
      return null;
    },
    [frames]
  );

  // Main rendering loop for Atlas Canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background void
    ctx.fillStyle = '#08090D';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Apply pan & zoom translation
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Pixel rendering smoothing
    ctx.imageSmoothingEnabled = !pixelated;

    if (image) {
      // Draw subtle transparent checkerboard behind the texture
      const checkSize = 16;
      const imgW = image.naturalWidth || image.width;
      const imgH = image.naturalHeight || image.height;

      for (let cy = 0; cy < imgH; cy += checkSize) {
        for (let cx = 0; cx < imgW; cx += checkSize) {
          const isEven = (Math.floor(cx / checkSize) + Math.floor(cy / checkSize)) % 2 === 0;
          ctx.fillStyle = isEven ? '#12151F' : '#1A1E2B';
          ctx.fillRect(
            cx,
            cy,
            Math.min(checkSize, imgW - cx),
            Math.min(checkSize, imgH - cy)
          );
        }
      }

      // Draw the actual sprite sheet image
      ctx.drawImage(image, 0, 0);

      // Texture outer border
      ctx.strokeStyle = '#1E2536';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(0, 0, imgW, imgH);

      // Draw grid slices and overlays
      if (showGrid) {
        Object.values(frames).forEach((frame) => {
          const { x, y, width: fw, height: fh } = frame.sourceRect;
          const isSelected = selectedFrameIds.includes(frame.id);
          const isActive = frame.id === activeFrameId;
          const isHovered = frame.id === hoveredFrameId;

          // Frame boundary
          if (isActive) {
            // Active frame cyan halo
            ctx.strokeStyle = '#06B6D4';
            ctx.lineWidth = 2 / zoom;
            ctx.strokeRect(x + 0.5 / zoom, y + 0.5 / zoom, fw - 1 / zoom, fh - 1 / zoom);

            ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.fillRect(x, y, fw, fh);
          } else if (isSelected) {
            // Selected frames
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 1.5 / zoom;
            ctx.strokeRect(x, y, fw, fh);

            ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
            ctx.fillRect(x, y, fw, fh);
          } else if (isHovered) {
            // Hovered frame halo
            ctx.strokeStyle = '#A5F3FC';
            ctx.lineWidth = 1.5 / zoom;
            ctx.strokeRect(x, y, fw, fh);

            ctx.fillStyle = 'rgba(165, 243, 252, 0.08)';
            ctx.fillRect(x, y, fw, fh);
          } else {
            // Regular slice border
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
            ctx.lineWidth = 1 / zoom;
            ctx.strokeRect(x, y, fw, fh);
          }

          // Frame index label pill
          if (zoom >= 1.5) {
            ctx.save();
            const labelText = `#${frame.index}`;
            const fontSize = Math.max(8, Math.min(12, 10 / (zoom / 4)));
            ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
            const textMetrics = ctx.measureText(labelText);
            const pillW = textMetrics.width + 4;
            const pillH = fontSize + 2;

            ctx.fillStyle = isActive ? '#06B6D4' : isSelected ? '#0284C7' : 'rgba(16, 19, 27, 0.85)';
            ctx.fillRect(x + 1, y + 1, pillW, pillH);

            ctx.fillStyle = isActive || isSelected ? '#08090D' : '#94A3B8';
            ctx.fillText(labelText, x + 3, y + fontSize);
            ctx.restore();
          }

          // Draw anchor point marker if active or selected
          if (isActive || isSelected) {
            const ax = x + frame.anchorPoint.x;
            const ay = y + frame.anchorPoint.y;
            ctx.save();
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 1.5 / zoom;
            const arm = 3;
            ctx.beginPath();
            ctx.moveTo(ax - arm, ay);
            ctx.lineTo(ax + arm, ay);
            ctx.moveTo(ax, ay - arm);
            ctx.lineTo(ax, ay + arm);
            ctx.stroke();
            ctx.restore();
          }
        });
      }
    }

    // Draw active drag-selection marquee
    if (isMarqueeSelecting && marqueeStart && marqueeEnd) {
      const mx = Math.min(marqueeStart.x, marqueeEnd.x);
      const my = Math.min(marqueeStart.y, marqueeEnd.y);
      const mw = Math.abs(marqueeStart.x - marqueeEnd.x);
      const mh = Math.abs(marqueeStart.y - marqueeEnd.y);

      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.fillRect(mx, my, mw, mh);

      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([4 / zoom, 2 / zoom]);
      ctx.strokeRect(mx, my, mw, mh);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [
    image,
    frames,
    selectedFrameIds,
    activeFrameId,
    hoveredFrameId,
    pixelated,
    showGrid,
    pan,
    zoom,
    isMarqueeSelecting,
    marqueeStart,
    marqueeEnd,
  ]);

  // Request redraw whenever dependencies update
  useEffect(() => {
    let animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  // Wheel listener: Zoom in/out clamped from 25% to 3200% centered on cursor
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8333;
      const newZoom = Math.max(0.25, Math.min(32, +(zoom * zoomFactor).toFixed(2)));

      if (newZoom !== zoom) {
        // Zoom centered on mouse
        const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
        const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    },
    [pan, zoom]
  );

  // Mouse Down handler: Middle-click/Space drag for pan, Left-click for frame select or marquee
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const isMiddle = e.button === 1 || e.altKey;
      const isRight = e.button === 2;

      if (isMiddle || isRight) {
        // Start pan
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        return;
      }

      if (e.button === 0) {
        // Left click
        const imgCoords = screenToImageCoords(e.clientX, e.clientY);
        const frame = getFrameAtCoord(imgCoords.x, imgCoords.y);

        if (e.shiftKey) {
          // Marquee selection start or multi-select toggle
          if (frame) {
            onSelectFrame(frame.id, true);
          } else {
            setIsMarqueeSelecting(true);
            setMarqueeStart(imgCoords);
            setMarqueeEnd(imgCoords);
          }
        } else {
          if (frame) {
            onSelectFrame(frame.id, false);
          } else {
            // Start marquee selection on blank canvas
            setIsMarqueeSelecting(true);
            setMarqueeStart(imgCoords);
            setMarqueeEnd(imgCoords);
          }
        }
      }
    },
    [pan, screenToImageCoords, getFrameAtCoord, onSelectFrame]
  );

  // Mouse Move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const imgCoords = screenToImageCoords(e.clientX, e.clientY);
      setCursorPos(imgCoords);

      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      if (isMarqueeSelecting && marqueeStart) {
        setMarqueeEnd(imgCoords);
        return;
      }

      // Check hovered frame
      const frame = getFrameAtCoord(imgCoords.x, imgCoords.y);
      setHoveredFrameId(frame ? frame.id : null);
    },
    [isPanning, panStart, isMarqueeSelecting, marqueeStart, screenToImageCoords, getFrameAtCoord]
  );

  // Mouse Up handler
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isMarqueeSelecting && marqueeStart && marqueeEnd) {
      setIsMarqueeSelecting(false);
      // Select all frames intersecting the marquee box
      const minX = Math.min(marqueeStart.x, marqueeEnd.x);
      const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
      const minY = Math.min(marqueeStart.y, marqueeEnd.y);
      const maxY = Math.max(marqueeStart.y, marqueeEnd.y);

      // Only perform marquee selection if dragged more than 2 pixels
      if (Math.abs(maxX - minX) > 2 || Math.abs(maxY - minY) > 2) {
        const selected = Object.values(frames).filter((f) => {
          const { x, y, width: fw, height: fh } = f.sourceRect;
          return (
            x < maxX &&
            x + fw > minX &&
            y < maxY &&
            y + fh > minY
          );
        });

        if (selected.length > 0 && onSelectMultipleFrames) {
          onSelectMultipleFrames(selected.map((s) => s.id));
        }
      }

      setMarqueeStart(null);
      setMarqueeEnd(null);
    }
  }, [isPanning, isMarqueeSelecting, marqueeStart, marqueeEnd, frames, onSelectMultipleFrames]);

  // Center & Fit image to canvas viewport
  const fitToViewport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const imgW = image.naturalWidth || image.width;
    const imgH = image.naturalHeight || image.height;
    const padding = 40;

    const scaleX = (canvas.width - padding * 2) / imgW;
    const scaleY = (canvas.height - padding * 2) / imgH;
    const bestZoom = Math.min(scaleX, scaleY, 16);
    const clampedZoom = Math.max(0.25, Math.floor(bestZoom * 100) / 100);

    const centerX = (canvas.width - imgW * clampedZoom) / 2;
    const centerY = (canvas.height - imgH * clampedZoom) / 2;

    setZoom(clampedZoom);
    setPan({ x: centerX, y: centerY });
  }, [image]);

  return {
    canvasRef,
    zoom,
    setZoom,
    pan,
    setPan,
    cursorPos,
    hoveredFrameId,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    fitToViewport,
  };
}
