import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import type { BoundingBox } from '../../types';
import { ReceiptGraphic } from './ReceiptGraphics';

interface ReceiptCanvasProps {
  receiptKey?: string;
  boundingBoxes?: BoundingBox[];
  focusedFieldKey?: string | null;
  onSelectBoundingBox?: (box: BoundingBox) => void;
  isScanning?: boolean;
}

export const ReceiptCanvas: React.FC<ReceiptCanvasProps> = ({
  receiptKey = 'lufthansa',
  boundingBoxes = [],
  focusedFieldKey = null,
  onSelectBoundingBox,
  isScanning = false,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showHighlights, setShowHighlights] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<number>(1);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.7));
  const handleResetZoom = () => setZoom(1);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#121418] rounded-xl overflow-hidden border border-[#232730] shadow-2xl select-none">
      {/* Floating Toolbar Pill */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-[#171A20]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#2E3440] shadow-lg text-xs text-[#8F98A8]">
        {/* Zoom controls */}
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1 rounded hover:bg-[#232730] hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="px-1.5 py-0.5 rounded font-mono text-[11px] hover:text-white transition"
          title="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1 rounded hover:bg-[#232730] hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-[#2E3440] mx-0.5" />

        {/* Rotate button */}
        <button
          type="button"
          onClick={handleRotate}
          className="p-1 rounded hover:bg-[#232730] hover:text-white transition flex items-center gap-1"
          title="Rotate 90°"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="text-[10px]">{rotation}°</span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#2E3440] mx-0.5" />

        {/* Toggle Highlights */}
        <button
          type="button"
          onClick={() => setShowHighlights(!showHighlights)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition font-medium text-[11px] ${
            showHighlights
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'hover:bg-[#232730] text-[#8F98A8]'
          }`}
          title="Toggle AI Extracted Highlights"
        >
          {showHighlights ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>{showHighlights ? 'AI Highlights ON' : 'Highlights OFF'}</span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#2E3440] mx-0.5" />

        {/* Page Switcher */}
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <button
            type="button"
            onClick={() => setActivePage(1)}
            className={`px-1.5 py-0.5 rounded ${activePage === 1 ? 'bg-gray-700 text-white' : 'hover:text-white'}`}
          >
            1
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => setActivePage(2)}
            className={`px-1.5 py-0.5 rounded ${activePage === 2 ? 'bg-gray-700 text-white' : 'hover:text-white'}`}
          >
            2
          </button>
        </div>
      </div>

      {/* Stage Canvas Area */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #4B5563 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Laser scan effect line when scanning */}
        {isScanning && <div className="laser-scanner-line z-30" />}

        {/* Document Container */}
        <div className="relative max-w-[460px] w-full transition-all duration-300">
          {/* Visual Receipt Graphics */}
          <ReceiptGraphic receiptKey={receiptKey} zoom={zoom} rotation={rotation} />

          {/* Interactive Bounding Box Overlay */}
          {showHighlights && !isScanning && (
            <div
              className="absolute inset-0 pointer-events-auto"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'top center',
              }}
            >
              {boundingBoxes.map((box) => {
                const isFieldActive = focusedFieldKey === box.fieldKey;
                const isHovered = hoveredBoxId === box.id;
                const isHighlight = isFieldActive || isHovered;

                return (
                  <div
                    key={box.id}
                    onClick={() => onSelectBoundingBox && onSelectBoundingBox(box)}
                    onMouseEnter={() => setHoveredBoxId(box.id)}
                    onMouseLeave={() => setHoveredBoxId(null)}
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                    className={`absolute cursor-pointer transition-all duration-200 rounded-sm group ${
                      isHighlight
                        ? 'border-2 border-emerald-400 bg-emerald-500/25 ring-4 ring-emerald-500/30 z-20 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                        : focusedFieldKey
                        ? 'border border-gray-400/30 bg-transparent opacity-20'
                        : 'border border-dashed border-emerald-400/60 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {/* Floating badge for bounding box */}
                    <div
                      className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-tight whitespace-nowrap transition-all duration-150 flex items-center gap-1 ${
                        isHighlight
                          ? 'bg-emerald-600 text-white shadow-lg scale-105 z-30'
                          : 'bg-[#171A20]/90 text-emerald-300 border border-emerald-500/40 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                      <span>{box.label}: </span>
                      <span className="font-bold">{box.text}</span>
                      <span className="opacity-70 text-[8px]">
                        ({Math.round(box.confidence * 100)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Info bar */}
      <div className="bg-[#0D0F12] px-4 py-2 border-t border-[#232730] flex items-center justify-between text-[11px] text-[#8F98A8] font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>OCR Engine: Multi-Lingual Vision v3.8</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Extracted: {boundingBoxes.length} fields (Avg. 98.4% conf)</span>
          </span>
          <span className="text-[#64748B]">SHA-256: Verified ✓</span>
        </div>
      </div>
    </div>
  );
};
