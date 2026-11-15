import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Sliders, Eye, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function ImageReader({ file }) {
  const [filterMode, setFilterMode] = useState('normal'); // normal | bw | grayscale | vibrant | inverted
  const [zoomLevel, setZoomLevel] = useState(100);

  const filterStyles = {
    normal: '',
    bw: 'grayscale contrast-[180%] brightness-105',
    grayscale: 'grayscale contrast-[115%]',
    vibrant: 'saturate-[160%] contrast-[110%]',
    inverted: 'invert hue-rotate-180'
  };

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden shadow-sm">
      {/* Top Filter & Zoom Bar */}
      <div className="p-2.5 bg-surface-container-low flex items-center justify-between gap-2 border-b border-surface-container flex-wrap">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] uppercase font-bold text-on-surface-variant font-mono mr-1">
            Filter:
          </span>
          {[
            { id: 'normal', label: 'Original' },
            { id: 'bw', label: 'Clean B&W' },
            { id: 'grayscale', label: 'Grayscale' },
            { id: 'vibrant', label: 'Vibrant' },
            { id: 'inverted', label: 'Invert' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap transition-colors ${
                filterMode === f.id
                  ? 'bg-primary-container text-white font-semibold'
                  : 'bg-surface-container text-on-surface-variant hover:text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel(z => Math.max(50, z - 25))}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface-container hover:bg-surface-container-high"
          >
            <ZoomOut className="w-3.5 h-3.5 text-on-secondary-container" />
          </button>
          <span className="text-[10px] font-mono px-1 min-w-[36px] text-center text-on-surface-variant">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel(z => Math.min(250, z + 25))}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface-container hover:bg-surface-container-high"
          >
            <ZoomIn className="w-3.5 h-3.5 text-on-secondary-container" />
          </button>
        </div>
      </div>

      {/* Visual Canvas Display */}
      <div className="relative w-full min-h-[280px] max-h-[440px] bg-slate-950 overflow-hidden flex items-center justify-center p-3 select-none">
        <div
          className="relative transition-transform duration-200 flex items-center justify-center"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <img
            src={file.previewUrl || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80"}
            alt={file.name}
            className={`max-w-full max-h-[380px] object-contain rounded shadow-lg transition-all ${filterStyles[filterMode]}`}
          />
        </div>

        {/* Telemetry Tag */}
        <div className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/60 text-[10px] font-mono text-slate-300">
          {file.resolution || 'RAW 8192x5464'} • {file.camera || 'Direct Enclave Sensor'}
        </div>
      </div>
    </div>
  );
}

