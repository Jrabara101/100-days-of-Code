import { useRef, useState, useEffect, useCallback } from 'react';
import { AnimationClip, SpriteFrame, ViewportBackground, BoundingBox } from '../types/sprite';

interface UseSpriteAnimatorProps {
  image: HTMLImageElement | null;
  clip: AnimationClip | null;
  frames: Record<string, SpriteFrame>;
  background: ViewportBackground;
  showOnionSkin: boolean;
  onionSkinOpacity: number;
  showHitboxes: boolean;
  showAnchor: boolean;
  pixelated: boolean;
  onUpdateFrameAnchor?: (frameId: string, anchor: { x: number; y: number }) => void;
  onUpdateHitbox?: (frameId: string, hitbox: BoundingBox) => void;
}

export function useSpriteAnimator({
  image,
  clip,
  frames,
  background,
  showOnionSkin,
  onionSkinOpacity,
  showHitboxes,
  showAnchor,
  pixelated,
  onUpdateFrameAnchor,
  onUpdateHitbox,
}: UseSpriteAnimatorProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [playDirection, setPlayDirection] = useState<1 | -1>(1);
  const [fps, setFps] = useState<number>(clip?.fps || 12);
  const [loop, setLoop] = useState<boolean>(clip?.loop ?? true);
  const [pingPong, setPingPong] = useState<boolean>(clip?.pingPong ?? false);

  // Preview zoom level (default 4x for pixel art)
  const [previewZoom, setPreviewZoom] = useState<number>(4);

  // Dragging states
  const [isDraggingAnchor, setIsDraggingAnchor] = useState<boolean>(false);
  const [draggedHitboxId, setDraggedHitboxId] = useState<string | null>(null);
  const [dragHandleType, setDragHandleType] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync with clip updates
  useEffect(() => {
    if (clip) {
      setFps(clip.fps);
      setLoop(clip.loop);
      setPingPong(clip.pingPong);
      setCurrentFrameIndex(0);
      setPlayDirection(1);
    }
  }, [clip?.id]);

  // Delta time accumulator for frame-perfect playback
  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  // Playback loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !clip || clip.frameIds.length <= 1) {
      lastTimeRef.current = performance.now();
      return;
    }

    let animationFrameId: number;

    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Target frame duration in ms
      const frameDuration = 1000 / Math.max(1, fps);
      accumulatorRef.current += delta;

      if (accumulatorRef.current >= frameDuration) {
        accumulatorRef.current %= frameDuration;

        setCurrentFrameIndex((prevIndex) => {
          const total = clip.frameIds.length;
          if (total <= 1) return 0;

          if (pingPong) {
            let nextIndex = prevIndex + playDirection;
            if (nextIndex >= total) {
              setPlayDirection(-1);
              return Math.max(0, total - 2);
            } else if (nextIndex < 0) {
              setPlayDirection(1);
              return Math.min(total - 1, 1);
            }
            return nextIndex;
          } else {
            let nextIndex = prevIndex + 1;
            if (nextIndex >= total) {
              if (!loop) {
                setIsPlaying(false);
                return total - 1;
              }
              return 0;
            }
            return nextIndex;
          }
        });
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, clip, fps, loop, pingPong, playDirection]);

  // Active frame object
  const activeFrameId = clip?.frameIds[currentFrameIndex] || null;
  const activeFrame = activeFrameId ? frames[activeFrameId] : null;

  // Previous & next frame IDs for onion skinning
  const prevFrameId =
    clip && clip.frameIds.length > 1
      ? clip.frameIds[(currentFrameIndex - 1 + clip.frameIds.length) % clip.frameIds.length]
      : null;
  const nextFrameId =
    clip && clip.frameIds.length > 1
      ? clip.frameIds[(currentFrameIndex + 1) % clip.frameIds.length]
      : null;

  // Render Preview Canvas
  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background
    if (background === 'void') {
      ctx.fillStyle = '#08090D';
      ctx.fillRect(0, 0, width, height);
    } else if (background === 'chroma') {
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(0, 0, width, height);
    } else if (background === 'stage') {
      // Stage floor with dark gradient & horizon
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.7, '#1E293B');
      grad.addColorStop(1, '#0B0F19');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Floor grid line
      const floorY = Math.round(height * 0.72);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(width, floorY);
      ctx.stroke();

      // Floor hatch lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, floorY);
        ctx.lineTo(x - 30, height);
        ctx.stroke();
      }
    } else {
      // Checkerboard pattern
      const tileSize = 12;
      for (let y = 0; y < height; y += tileSize) {
        for (let x = 0; x < width; x += tileSize) {
          const isEven = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
          ctx.fillStyle = isEven ? '#12151F' : '#1A1E2B';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }
    }

    if (!activeFrame) return;

    ctx.save();
    // Pixel smoothing
    ctx.imageSmoothingEnabled = !pixelated;

    // Center the sprite inside preview based on anchor point
    const stageCenterX = Math.round(width / 2);
    const stageCenterY =
      background === 'stage' ? Math.round(height * 0.72) : Math.round(height / 2);

    const zoom = previewZoom;
    const { sourceRect, anchorPoint } = activeFrame;

    // Sprite top-left relative to stage center
    const spriteDrawX = stageCenterX - anchorPoint.x * zoom;
    const spriteDrawY = stageCenterY - anchorPoint.y * zoom;

    // 2. Onion-Skin Ghost Frames (if enabled)
    if (showOnionSkin && onionSkinOpacity > 0 && clip && clip.frameIds.length > 1) {
      // Previous frame (violet tint)
      if (prevFrameId && frames[prevFrameId]) {
        const pf = frames[prevFrameId];
        const pDrawX = stageCenterX - pf.anchorPoint.x * zoom;
        const pDrawY = stageCenterY - pf.anchorPoint.y * zoom;

        ctx.save();
        ctx.globalAlpha = onionSkinOpacity * 0.7;
        ctx.drawImage(
          image,
          pf.sourceRect.x,
          pf.sourceRect.y,
          pf.sourceRect.width,
          pf.sourceRect.height,
          pDrawX,
          pDrawY,
          pf.sourceRect.width * zoom,
          pf.sourceRect.height * zoom
        );
        // Violet wash
        ctx.fillStyle = 'rgba(139, 92, 246, 0.35)';
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillRect(pDrawX, pDrawY, pf.sourceRect.width * zoom, pf.sourceRect.height * zoom);
        ctx.restore();
      }

      // Next frame (cyan tint)
      if (nextFrameId && frames[nextFrameId]) {
        const nf = frames[nextFrameId];
        const nDrawX = stageCenterX - nf.anchorPoint.x * zoom;
        const nDrawY = stageCenterY - nf.anchorPoint.y * zoom;

        ctx.save();
        ctx.globalAlpha = onionSkinOpacity * 0.5;
        ctx.drawImage(
          image,
          nf.sourceRect.x,
          nf.sourceRect.y,
          nf.sourceRect.width,
          nf.sourceRect.height,
          nDrawX,
          nDrawY,
          nf.sourceRect.width * zoom,
          nf.sourceRect.height * zoom
        );
        // Cyan wash
        ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillRect(nDrawX, nDrawY, nf.sourceRect.width * zoom, nf.sourceRect.height * zoom);
        ctx.restore();
      }
    }

    // 3. Active Frame Blit
    ctx.drawImage(
      image,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      spriteDrawX,
      spriteDrawY,
      sourceRect.width * zoom,
      sourceRect.height * zoom
    );

    // Frame perimeter boundary (faint guide)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      spriteDrawX,
      spriteDrawY,
      sourceRect.width * zoom,
      sourceRect.height * zoom
    );

    // 4. Hitbox / Hurtbox / Terrain Colliders Wireframe Overlay
    if (showHitboxes && activeFrame.hitboxes) {
      activeFrame.hitboxes.forEach((hb) => {
        const hx = spriteDrawX + hb.x * zoom;
        const hy = spriteDrawY + hb.y * zoom;
        const hw = hb.width * zoom;
        const hh = hb.height * zoom;

        let strokeCol = '#F59E0B'; // Hurtbox amber
        let fillCol = 'rgba(245, 158, 11, 0.18)';

        if (hb.type === 'hitbox') {
          strokeCol = '#EF4444'; // Hitbox crimson
          fillCol = 'rgba(239, 68, 68, 0.22)';
        } else if (hb.type === 'collision') {
          strokeCol = '#10B981'; // Collision emerald
          fillCol = 'rgba(16, 185, 129, 0.2)';
        }

        ctx.fillStyle = fillCol;
        ctx.fillRect(hx, hy, hw, hh);

        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2;
        ctx.strokeRect(hx, hy, hw, hh);

        // Corner handles
        const hs = 4;
        ctx.fillStyle = strokeCol;
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        ctx.fillRect(hx + hw - hs / 2, hy - hs / 2, hs, hs);
        ctx.fillRect(hx + hw - hs / 2, hy + hh - hs / 2, hs, hs);
        ctx.fillRect(hx - hs / 2, hy + hh - hs / 2, hs, hs);

        // Pill label
        ctx.font = '600 9px "JetBrains Mono", monospace';
        const label = hb.label || hb.type.toUpperCase();
        const textMetrics = ctx.measureText(label);
        ctx.fillStyle = strokeCol;
        ctx.fillRect(hx, hy - 14, textMetrics.width + 6, 12);
        ctx.fillStyle = '#08090D';
        ctx.fillText(label, hx + 3, hy - 5);
      });
    }

    // 5. Interactive Anchor Pivot Marker
    if (showAnchor) {
      const ax = stageCenterX;
      const ay = stageCenterY;

      // Magnetic guide dashed lines
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(spriteDrawX, ay);
      ctx.lineTo(spriteDrawX + sourceRect.width * zoom, ay);
      ctx.moveTo(ax, spriteDrawY);
      ctx.lineTo(ax, spriteDrawY + sourceRect.height * zoom);
      ctx.stroke();
      ctx.restore();

      // Anchor gold crosshair
      ctx.save();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      const arm = 8;
      ctx.beginPath();
      ctx.moveTo(ax - arm, ay);
      ctx.lineTo(ax + arm, ay);
      ctx.moveTo(ax, ay - arm);
      ctx.lineTo(ax, ay + arm);
      ctx.stroke();

      // Outer target ring
      ctx.beginPath();
      ctx.arc(ax, ay, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Center glowing dot
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(ax, ay, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }, [
    image,
    activeFrame,
    clip,
    background,
    showOnionSkin,
    onionSkinOpacity,
    showHitboxes,
    showAnchor,
    pixelated,
    previewZoom,
    prevFrameId,
    nextFrameId,
    frames,
  ]);

  // Run redraw
  useEffect(() => {
    let animId = requestAnimationFrame(drawPreview);
    return () => cancelAnimationFrame(animId);
  }, [drawPreview, currentFrameIndex]);

  // Transport controls
  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    if (!clip || clip.frameIds.length === 0) return;
    setCurrentFrameIndex((prev) => (prev + 1) % clip.frameIds.length);
  }, [clip]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    if (!clip || clip.frameIds.length === 0) return;
    setCurrentFrameIndex((prev) => (prev - 1 + clip.frameIds.length) % clip.frameIds.length);
  }, [clip]);

  const toggleLoop = useCallback(() => setLoop((l) => !l), []);
  const togglePingPong = useCallback(() => setPingPong((pp) => !pp), []);

  return {
    previewCanvasRef,
    isPlaying,
    currentFrameIndex,
    setCurrentFrameIndex,
    fps,
    setFps,
    loop,
    pingPong,
    previewZoom,
    setPreviewZoom,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    toggleLoop,
    togglePingPong,
    activeFrame,
  };
}
