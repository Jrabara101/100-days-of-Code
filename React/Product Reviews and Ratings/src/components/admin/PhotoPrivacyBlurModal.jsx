import React, { useState, useRef, useEffect } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';

export function PhotoPrivacyBlurModal({ isOpen, onClose, review, mediaItem }) {
  const { blurMediaItem } = useTrustStore();

  const [blurMode, setBlurMode] = useState('blur'); // 'blur' | 'pixelate'
  const [blurRadius, setBlurRadius] = useState(14);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Box coordinates (relative percentages or px)
  const [boxPosition, setBoxPosition] = useState({
    x: 39, // %
    y: 60, // %
    w: 184, // px
    h: 162  // px
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  if (!isOpen || !review) return null;

  const targetMedia = mediaItem || (review.media && review.media[0]);

  // Auto blur detected label (pre-computes address box)
  const autoBlurDetectedLabel = () => {
    setBoxPosition({
      x: 32,
      y: 65,
      w: 220,
      h: 120
    });
    setBlurRadius(16);
  };

  const resetOriginal = () => {
    setBoxPosition({
      x: 39,
      y: 60,
      w: 184,
      h: 162
    });
    setBlurRadius(14);
  };

  // Start dragging blur box
  const handleMouseDownBox = (e) => {
    if (e.target.dataset.handle) return; // Ignore if clicking resize handle
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Start resizing
  const handleMouseDownHandle = (handle, e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging && !isResizing) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      setBoxPosition(prev => ({
        ...prev,
        x: Math.min(85, Math.max(5, prev.x + (dx / 6))),
        y: Math.min(85, Math.max(5, prev.y + (dy / 4)))
      }));
    } else if (isResizing) {
      setBoxPosition(prev => {
        let newW = prev.w;
        let newH = prev.h;
        if (resizeHandle.includes('e')) newW = Math.max(60, prev.w + dx);
        if (resizeHandle.includes('w')) newW = Math.max(60, prev.w - dx);
        if (resizeHandle.includes('s')) newH = Math.max(40, prev.h + dy);
        if (resizeHandle.includes('n')) newH = Math.max(40, prev.h - dy);
        return { ...prev, w: newW, h: newH };
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Commit blurred media
  const handleCommitBlur = () => {
    if (targetMedia) {
      blurMediaItem(review.id, targetMedia.id);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-6 select-none animate-fadeIn"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl border border-outline-variant/40 overflow-hidden">
        {/* Stage Header */}
        <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-headline-lg text-lg text-on-surface font-bold tracking-tight">
                "{review.title}"
              </span>
              <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-mono text-xs font-semibold">
                Verified Purchase
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-outline mt-0.5">
              <span className="text-on-surface font-semibold">{review.reviewerName}</span>
              <span>·</span>
              <span>Order #{review.orderId}</span>
              <span>·</span>
              <span>SKU: {review.productSku}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-mono text-xs font-semibold">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              <span>Physical Address PII on Shipping Label</span>
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Stage Toolbar */}
        <div className="h-12 bg-surface-container-lowest border-b border-outline-variant/30 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBlurMode('blur')}
              className={`h-8 px-3 rounded font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                blurMode === 'blur'
                  ? 'bg-inverse-surface text-inverse-on-surface'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">blur_circular</span>
              <span>Drag to Blur</span>
              <kbd className="px-1 py-0.2 rounded bg-surface-variant text-[10px]">B</kbd>
            </button>

            <button
              onClick={autoBlurDetectedLabel}
              className="h-8 px-3 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-mono text-xs font-medium flex items-center gap-1.5 transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">auto_fix_high</span>
              <span>Auto-Blur Detected Label</span>
            </button>

            <button
              onClick={() => setBlurMode(blurMode === 'pixelate' ? 'blur' : 'pixelate')}
              className={`h-8 px-3 rounded font-mono text-xs font-medium flex items-center gap-1.5 transition-colors border border-outline-variant/30 ${
                blurMode === 'pixelate' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">grid_view</span>
              <span>Pixelate</span>
            </button>

            <div className="h-4 w-px bg-outline-variant/40 mx-1" />

            <button
              onClick={resetOriginal}
              className="h-8 px-3 rounded text-error hover:bg-error-container/40 font-mono text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              <span>Reset Original</span>
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="flex items-center bg-surface-container-low rounded border border-outline-variant/30 px-1 py-0.5">
              <button
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                -
              </button>
              <span className="px-2 font-semibold text-on-surface">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Center Inspection Canvas Stage */}
        <div
          ref={containerRef}
          className="relative w-full h-[540px] bg-stone-950 overflow-hidden flex items-center justify-center shadow-inner"
        >
          {/* Target Photo */}
          <img
            src={targetMedia?.sanitizedUrl || targetMedia?.previewUrl || targetMedia?.originalPath || '/assets/kettle-countertop.png'}
            alt="Inspection Target"
            className="w-full h-full object-contain max-h-full"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          />

          {/* Interactive Privacy Blur Overlay Layer */}
          <div
            onMouseDown={handleMouseDownBox}
            className="absolute cursor-move transition-shadow"
            style={{
              left: `${boxPosition.x}%`,
              top: `${boxPosition.y}%`,
              width: `${boxPosition.w}px`,
              height: `${boxPosition.h}px`,
              backdropFilter: blurMode === 'blur' ? `blur(${blurRadius}px) saturate(120%)` : 'none',
              background: blurMode === 'pixelate'
                ? 'repeating-linear-gradient(45deg, rgba(200,200,200,0.4), rgba(200,200,200,0.4) 6px, rgba(100,100,100,0.6) 6px, rgba(100,100,100,0.6) 12px)'
                : 'rgba(255, 255, 255, 0.28)',
              boxShadow: '0 0 0 1.5px #006948, 0 8px 24px rgba(0,0,0,0.35)'
            }}
          >
            {/* Status Pill on Top Edge */}
            <div className="absolute -top-7 left-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-primary text-white font-mono text-[11px] font-bold shadow-md pointer-events-none whitespace-nowrap">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              <span>PII Redacted ({blurRadius}px {blurMode === 'pixelate' ? 'Pixelated' : 'Gaussian'})</span>
            </div>

            {/* Crosshair Center Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-3 h-px bg-primary" />
              <div className="h-3 w-px bg-primary" />
            </div>

            {/* 8 Geometric Resize Handles */}
            <div
              data-handle="nw"
              onMouseDown={(e) => handleMouseDownHandle('nw', e)}
              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-xs ring-1 ring-primary cursor-nwse-resize"
            />
            <div
              data-handle="n"
              onMouseDown={(e) => handleMouseDownHandle('n', e)}
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-xs ring-1 ring-primary cursor-ns-resize"
            />
            <div
              data-handle="ne"
              onMouseDown={(e) => handleMouseDownHandle('ne', e)}
              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-xs ring-1 ring-primary cursor-nesw-resize"
            />
            <div
              data-handle="e"
              onMouseDown={(e) => handleMouseDownHandle('e', e)}
              className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white rounded-xs ring-1 ring-primary cursor-ew-resize"
            />
            <div
              data-handle="se"
              onMouseDown={(e) => handleMouseDownHandle('se', e)}
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-xs ring-1 ring-primary cursor-nwse-resize"
            />
            <div
              data-handle="s"
              onMouseDown={(e) => handleMouseDownHandle('s', e)}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-xs ring-1 ring-primary cursor-ns-resize"
            />
            <div
              data-handle="sw"
              onMouseDown={(e) => handleMouseDownHandle('sw', e)}
              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-xs ring-1 ring-primary cursor-nesw-resize"
            />
            <div
              data-handle="w"
              onMouseDown={(e) => handleMouseDownHandle('w', e)}
              className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white rounded-xs ring-1 ring-primary cursor-ew-resize"
            />
          </div>

          {/* Bottom Left Badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>EXIF Clean · Box Coordinates: [{boxPosition.w}×{boxPosition.h} @ x:{Math.round(boxPosition.x)}%, y:{Math.round(boxPosition.y)}%]</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
          <div className="text-body-sm text-outline font-mono text-xs">
            Applies non-destructive sanitized derivative to CDN storage
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container font-mono text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCommitBlur}
              className="px-5 py-2 bg-primary hover:bg-primary-container text-white font-headline-sm text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Commit Sanitized Photo &amp; Ready for Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

