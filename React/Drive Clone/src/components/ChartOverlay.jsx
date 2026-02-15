import { useEffect, useRef } from 'react';

const MIN_BRUSH_DISTANCE = 4;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function ChartOverlay({
  width,
  window,
  onBrushEnd,
  onWheelZoom,
  onPan,
  onBrushPreview
}) {
  const overlayRef = useRef(null);
  const gestureRef = useRef({
    mode: null,
    pointerId: null,
    startX: 0,
    lastX: 0,
    currentX: 0
  });

  const rafRef = useRef({
    pointerFrame: 0,
    wheelFrame: 0,
    pendingPointerClientX: null,
    pendingWheel: null
  });

  const spanMs = Math.max(1, window.endTime - window.startTime);

  const getLocalX = (clientX) => {
    const overlay = overlayRef.current;
    if (!overlay || width <= 0) {
      return 0;
    }

    const rect = overlay.getBoundingClientRect();
    return clamp(clientX - rect.left, 0, width);
  };

  const xToTime = (x) => {
    const ratio = clamp(x / Math.max(1, width), 0, 1);
    return window.startTime + ratio * spanMs;
  };

  const flushPointerMove = () => {
    rafRef.current.pointerFrame = 0;
    const clientX = rafRef.current.pendingPointerClientX;
    rafRef.current.pendingPointerClientX = null;

    if (clientX == null) {
      return;
    }

    const gesture = gestureRef.current;
    const currentX = getLocalX(clientX);

    if (gesture.mode === 'brush') {
      gesture.currentX = currentX;
      const start = Math.min(gesture.startX, currentX);
      const end = Math.max(gesture.startX, currentX);
      onBrushPreview?.({
        startTime: xToTime(start),
        endTime: xToTime(end)
      });
      return;
    }

    if (gesture.mode === 'pan') {
      const deltaPx = currentX - gesture.lastX;
      gesture.lastX = currentX;
      if (Math.abs(deltaPx) > 0) {
        onPan?.(deltaPx / Math.max(1, width));
      }
    }
  };

  const flushWheel = () => {
    rafRef.current.wheelFrame = 0;
    const pending = rafRef.current.pendingWheel;
    rafRef.current.pendingWheel = null;

    if (!pending) {
      return;
    }

    const localX = getLocalX(pending.clientX);
    const anchorTime = xToTime(localX);
    const zoomFactor = clamp(Math.exp(pending.deltaY * 0.0015), 0.5, 2.0);

    onWheelZoom?.({ anchorTime, zoomFactor });
  };

  useEffect(() => {
    return () => {
      if (rafRef.current.pointerFrame) {
        cancelAnimationFrame(rafRef.current.pointerFrame);
      }
      if (rafRef.current.wheelFrame) {
        cancelAnimationFrame(rafRef.current.wheelFrame);
      }
    };
  }, []);

  const handlePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    const localX = getLocalX(event.clientX);
    const gesture = gestureRef.current;

    gesture.pointerId = event.pointerId;
    gesture.startX = localX;
    gesture.lastX = localX;
    gesture.currentX = localX;
    gesture.mode = event.shiftKey ? 'pan' : 'brush';

    if (gesture.mode === 'brush') {
      onBrushPreview?.({
        startTime: xToTime(localX),
        endTime: xToTime(localX)
      });
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event) => {
    const gesture = gestureRef.current;
    if (gesture.mode == null || event.pointerId !== gesture.pointerId) {
      return;
    }

    rafRef.current.pendingPointerClientX = event.clientX;
    if (!rafRef.current.pointerFrame) {
      rafRef.current.pointerFrame = requestAnimationFrame(flushPointerMove);
    }
  };

  const stopGesture = (event) => {
    const gesture = gestureRef.current;
    if (gesture.mode == null || event.pointerId !== gesture.pointerId) {
      return;
    }

    const localX = getLocalX(event.clientX);

    if (gesture.mode === 'brush') {
      const start = Math.min(gesture.startX, localX);
      const end = Math.max(gesture.startX, localX);

      onBrushPreview?.(null);

      if (Math.abs(end - start) >= MIN_BRUSH_DISTANCE) {
        onBrushEnd?.(xToTime(start), xToTime(end));
      }
    }

    gesture.mode = null;
    gesture.pointerId = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event) => {
    event.preventDefault();

    rafRef.current.pendingWheel = {
      clientX: event.clientX,
      deltaY: event.deltaY
    };

    if (!rafRef.current.wheelFrame) {
      rafRef.current.wheelFrame = requestAnimationFrame(flushWheel);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="chart-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopGesture}
      onPointerCancel={stopGesture}
      onWheel={handleWheel}
      onContextMenu={(event) => event.preventDefault()}
      role="presentation"
    />
  );
}
