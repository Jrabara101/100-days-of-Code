import { useState, useRef, useCallback, useEffect } from 'react';

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface UseInfiniteViewportOptions {
  initialZoom?: number;
  initialX?: number;
  initialY?: number;
  minZoom?: number;
  maxZoom?: number;
  worldWidth?: number;
  worldHeight?: number;
}

export function useInfiniteViewport({
  initialZoom = 0.85,
  initialX = -200,
  initialY = -100,
  minZoom = 0.35,
  maxZoom = 2.4,
  worldWidth = 2600,
  worldHeight = 1800,
}: UseInfiniteViewportOptions = {}) {
  const [viewport, setViewport] = useState<ViewportState>({
    x: initialX,
    y: initialY,
    zoom: initialZoom,
  });

  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Velocity & Inertia Tracking
  const lastPosRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // Touch Pinch Distance
  const touchDistanceRef = useRef<number | null>(null);

  // Stop any ongoing inertia animation
  const stopInertia = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Clamping helper
  const clampViewport = useCallback(
    (x: number, y: number, zoom: number): ViewportState => {
      const clampedZoom = Math.min(maxZoom, Math.max(minZoom, zoom));
      return {
        x,
        y,
        zoom: clampedZoom,
      };
    },
    [minZoom, maxZoom]
  );

  // Wheel Zoom (centered on cursor)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      stopInertia();

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      setViewport((prev) => {
        const nextZoom = Math.min(maxZoom, Math.max(minZoom, prev.zoom * zoomFactor));
        if (nextZoom === prev.zoom) return prev;

        // Keep world position under mouse fixed
        const worldX = (mouseX - prev.x) / prev.zoom;
        const worldY = (mouseY - prev.y) / prev.zoom;

        const nextX = mouseX - worldX * nextZoom;
        const nextY = mouseY - worldY * nextZoom;

        return clampViewport(nextX, nextY, nextZoom);
      });
    },
    [clampViewport, maxZoom, minZoom, stopInertia]
  );

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      stopInertia();
      setIsPanning(true);

      lastPosRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
      velocityRef.current = { vx: 0, vy: 0 };

      // Pointer capture for reliable drag even off container
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch (err) {
        // Ignored
      }
    },
    [stopInertia]
  );

  // Pointer Move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;

      const now = performance.now();
      const dt = Math.max(1, now - lastPosRef.current.time);
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;

      // Track velocity for inertia
      velocityRef.current = {
        vx: dx / dt,
        vy: dy / dt,
      };

      lastPosRef.current = { x: e.clientX, y: e.clientY, time: now };

      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    },
    [isPanning]
  );

  // Pointer Up (Apply Inertia)
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      setIsPanning(false);

      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignored
      }

      // Start momentum/inertia if velocity is significant
      const { vx, vy } = velocityRef.current;
      const speed = Math.hypot(vx, vy);

      if (speed > 0.15) {
        let currentVx = vx * 16; // per frame
        let currentVy = vy * 16;
        const friction = 0.92;

        const step = () => {
          currentVx *= friction;
          currentVy *= friction;

          if (Math.hypot(currentVx, currentVy) < 0.2) {
            stopInertia();
            return;
          }

          setViewport((prev) => ({
            ...prev,
            x: prev.x + currentVx,
            y: prev.y + currentVy,
          }));

          animationFrameRef.current = requestAnimationFrame(step);
        };

        animationFrameRef.current = requestAnimationFrame(step);
      }
    },
    [isPanning, stopInertia]
  );

  // Touch Pinch-to-zoom
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        stopInertia();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchDistanceRef.current = dist;
      }
    },
    [stopInertia]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && touchDistanceRef.current !== null) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / touchDistanceRef.current;
        touchDistanceRef.current = dist;

        setViewport((prev) => {
          const nextZoom = Math.min(maxZoom, Math.max(minZoom, prev.zoom * factor));
          return { ...prev, zoom: nextZoom };
        });
      }
    },
    [maxZoom, minZoom]
  );

  const handleTouchEnd = useCallback(() => {
    touchDistanceRef.current = null;
  }, []);

  // Programmatic Smooth Pan To Node or Coordinate
  const panTo = useCallback(
    (targetWorldX: number, targetWorldY: number, targetZoom?: number, durationMs = 600) => {
      stopInertia();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setViewport((prev) => {
        const finalZoom = targetZoom !== undefined ? Math.min(maxZoom, Math.max(minZoom, targetZoom)) : prev.zoom;
        const startX = prev.x;
        const startY = prev.y;
        const startZoom = prev.zoom;

        const endX = centerX - targetWorldX * finalZoom;
        const endY = centerY - targetWorldY * finalZoom;

        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(1, elapsed / durationMs);
          // EaseInOutCubic
          const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          setViewport({
            x: startX + (endX - startX) * ease,
            y: startY + (endY - startY) * ease,
            zoom: startZoom + (finalZoom - startZoom) * ease,
          });

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            animationFrameRef.current = null;
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return prev;
      });
    },
    [maxZoom, minZoom, stopInertia]
  );

  // Recenter to default
  const resetCamera = useCallback(() => {
    panTo(1000, 600, 0.85, 500);
  }, [panTo]);

  // Zoom In / Out Buttons
  const zoomIn = useCallback(() => {
    setViewport((prev) => clampViewport(prev.x, prev.y, prev.zoom * 1.25));
  }, [clampViewport]);

  const zoomOut = useCallback(() => {
    setViewport((prev) => clampViewport(prev.x, prev.y, prev.zoom * 0.8));
  }, [clampViewport]);

  // Calculate Viewport Bounds in World Coordinates for Culling
  const getVisibleBounds = useCallback((): ViewportBounds => {
    if (!containerRef.current) {
      return { minX: 0, minY: 0, maxX: worldWidth, maxY: worldHeight };
    }
    const rect = containerRef.current.getBoundingClientRect();
    const minX = -viewport.x / viewport.zoom;
    const minY = -viewport.y / viewport.zoom;
    const maxX = (-viewport.x + rect.width) / viewport.zoom;
    const maxY = (-viewport.y + rect.height) / viewport.zoom;

    // Buffer padding around visible area so tiles pop smoothly before entering
    const padding = 120;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [viewport, worldWidth, worldHeight]);

  useEffect(() => {
    return () => stopInertia();
  }, [stopInertia]);

  return {
    viewport,
    setViewport,
    isPanning,
    containerRef,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    panTo,
    resetCamera,
    zoomIn,
    zoomOut,
    getVisibleBounds,
  };
}
