import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Search, 
  Maximize2,
  ShieldCheck
} from 'lucide-react';

export default function PdfReader({ file }) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(4);
  const [totalPages] = useState(file.pages || 18);
  const [activeTab, setActiveTab] = useState('visual'); // visual | text
  const [searchText, setSearchText] = useState('');

  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(250, Math.max(50, prev + delta)));
  };

  return (
    <div className="flex flex-col w-full bg-surface-container-lowest rounded-xl border border-surface-container overflow-hidden shadow-sm">
      {/* Top PDF Controls Header */}
      <div className="p-2.5 bg-surface-container-low flex items-center justify-between gap-2 border-b border-surface-container flex-wrap">
        {/* Left: Sheet title & Page nav */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded-lg border border-outline-variant/40 text-xs font-mono">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="hover:text-primary disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="hover:text-primary disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-xs font-medium text-on-surface truncate hidden sm:inline">
            {file.activeSheet || `Page ${currentPage} of ${totalPages}`}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'visual' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Blueprint Layout
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === 'text' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant'
            }`}
          >
            Extracted Text Layer
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(-25)}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface-container hover:bg-surface-container-high text-on-secondary-container"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1 min-w-[42px] text-center text-on-surface-variant">
            {zoomLevel}%
          </span>
          <button
            onClick={() => handleZoom(25)}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface-container hover:bg-surface-container-high text-on-secondary-container"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Document Content Canvas */}
      <div className="relative w-full min-h-[300px] max-h-[460px] bg-slate-950 overflow-auto flex items-center justify-center p-4 select-none">
        {activeTab === 'visual' ? (
          <div 
            className="relative transition-transform duration-200 shadow-2xl rounded-sm overflow-hidden border border-slate-700 bg-slate-900"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
          >
            {/* Visual Blueprint Image */}
            <img
              src={file.previewUrl || "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"}
              alt="CAD Blueprint"
              className="max-w-[500px] h-auto object-cover opacity-90 brightness-95"
            />

            {/* Precision Technical CAD Blueprint Overlay Lines & Stamp */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                  SECTION A-A // ELEVATION 42.0m
                </div>
                <div className="bg-emerald-950/90 backdrop-blur-md px-2.5 py-1 rounded border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>SEALED &amp; SIGNED</span>
                </div>
              </div>

              {/* Dynamic Watermark Overlay */}
              <div className="w-full text-center text-slate-500/30 text-xs font-mono select-none tracking-widest transform -rotate-12">
                CONFIDENTIAL • TRUSTMEDIA ARCHIVE • ENCLAVE PROTECTED
              </div>

              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded border border-slate-700 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>SCALE: 1:50 @ A1</span>
                <span>GRID: 6000x8000mm</span>
                <span>DWG-REV-4</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-slate-900 rounded-lg p-5 border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed overflow-y-auto max-h-[380px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                Embedded Text Extraction Stream
              </span>
              <span className="text-[10px] text-slate-400">Encoding: UTF-8 • PDF/A-3b</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-300">
              {file.content || 'Extracted textual contents parsed from verified document chunks.'}
            </pre>
          </div>
        )}
      </div>

      {/* Reader Footer Info */}
      <div className="p-2.5 bg-surface-container-low flex items-center justify-between text-xs text-on-surface-variant border-t border-surface-container font-mono">
        <span className="truncate">
          SHA-256: {file.sha256 ? `${file.sha256.slice(0, 16)}...` : 'Computing...'}
        </span>
        <span className="text-[11px] text-on-tertiary-container font-semibold">
          Immutable Layer Active
        </span>
      </div>
    </div>
  );
}

