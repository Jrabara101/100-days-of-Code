import React from 'react';
import { useResumeStore } from '../../store/useResumeStore';
import { calculateAtsDiagnostics } from '../../utils/atsDiagnostics';

interface HeaderBarProps {
  totalPages?: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ totalPages = 2 }) => {
  const {
    documentTitle,
    setDocumentTitle,
    canUndo,
    canRedo,
    undo,
    redo,
    zoom,
    setZoom,
    viewMode,
    setViewMode,
    present,
  } = useResumeStore();

  const ats = calculateAtsDiagnostics(present);

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="fixed top-0 left-16 right-0 h-14 bg-surface-container-lowest/90 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.25)] no-print">
      <div className="h-14 w-full px-gutter flex items-center justify-between gap-space-md">
        {/* Left: Brand + Title + Undo/Redo + Auto-save */}
        <div className="flex items-center gap-space-md shrink-0">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[20px]">layers</span>
            <span className="font-title text-title text-on-surface tracking-tight hidden lg:inline-block font-bold">
              Spatial Career Engine
            </span>
          </div>
          <span className="text-outline-variant font-code-metric text-code-metric">/</span>
          
          {/* Document File Name Input */}
          <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-space-xs rounded-lg hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-[16px]">description</span>
            <input
              aria-label="Document title"
              className="bg-transparent text-on-surface font-code-metric text-code-metric focus:outline-none w-56 truncate"
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
            />
          </div>

          {/* Time-Travel Undo/Redo Replay Stack */}
          <div className="flex items-center bg-surface-container-low rounded-lg p-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                canUndo
                  ? 'text-on-surface hover:bg-surface-container active:scale-95'
                  : 'text-on-surface-variant/40 cursor-not-allowed'
              }`}
              title="Undo (⌘Z / Ctrl+Z)"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">undo</span>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                canRedo
                  ? 'text-on-surface hover:bg-surface-container active:scale-95'
                  : 'text-on-surface-variant/40 cursor-not-allowed'
              }`}
              title="Redo (⇧⌘Z / Ctrl+Y)"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">redo</span>
            </button>
          </div>

          {/* Auto-saved Beacon */}
          <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span>Auto-saved</span>
          </div>
        </div>

        {/* Center: Zoom & View Mode Switcher */}
        <div className="flex items-center gap-space-md shrink-0">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-surface-container-low rounded-full px-space-xs py-0.5">
            <button
              className="w-6 h-6 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              title="Zoom out"
              type="button"
              onClick={() => setZoom(zoom - 0.1)}
            >
              <span className="material-symbols-outlined text-[14px]">remove</span>
            </button>
            <span className="px-space-xs font-code-metric text-code-metric text-on-surface-variant">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="w-6 h-6 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              title="Zoom in"
              type="button"
              onClick={() => setZoom(zoom + 0.1)}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>

          {/* View Mode Switcher */}
          <nav className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-space-sm py-space-xs rounded-md font-label-md text-label-md transition-colors ${
                viewMode === 'editor'
                  ? 'bg-surface-container-highest text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-space-sm py-space-xs rounded-md font-label-md text-label-md transition-colors ${
                viewMode === 'split'
                  ? 'bg-surface-container-highest text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-space-sm py-space-xs rounded-md font-label-md text-label-md transition-colors flex items-center gap-1 ${
                viewMode === 'preview'
                  ? 'bg-primary text-on-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              <span>Preview</span>
            </button>
          </nav>

          {/* Page Counter */}
          <div className="hidden lg:flex items-center gap-space-xs px-space-sm py-space-xs rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">auto_stories</span>
            <span>Page 1 of {totalPages}</span>
          </div>
        </div>

        {/* Right: ATS Pill + Exit Preview / Export PDF */}
        <div className="flex items-center gap-space-md shrink-0">
          {/* Active Collaborators */}
          <div className="hidden xl:flex items-center -space-x-2">
            <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center ring-2 ring-surface-container-lowest text-on-secondary font-label-sm text-label-sm font-semibold">
              AC
            </div>
            <div className="w-6 h-6 rounded-full bg-tertiary-container flex items-center justify-center ring-2 ring-surface-container-lowest text-on-tertiary font-label-sm text-label-sm font-semibold">
              SR
            </div>
          </div>

          {/* If Preview Mode: Show "Exit Preview" pill */}
          {viewMode === 'preview' && (
            <button
              onClick={() => setViewMode('split')}
              className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container text-primary hover:bg-surface-container-high transition-colors font-label-md text-label-md border border-primary/30"
              title="Return to Split View"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">splitscreen</span>
              <span>Exit Preview</span>
            </button>
          )}

          {/* ATS Score Indicator */}
          <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-secondary-container/20 text-secondary font-code-metric text-code-metric">
            <span className="material-symbols-outlined text-secondary text-[14px]">verified</span>
            <span className="font-label-md text-label-md font-bold">ATS: {ats.score}</span>
          </div>

          {/* PDF Export Button */}
          <div className="flex items-center">
            <button
              onClick={handlePrint}
              className="flex items-center gap-space-xs bg-primary text-on-primary px-space-md py-space-xs rounded-lg hover:bg-primary-fixed-dim transition-colors font-label-md text-label-md font-semibold shadow-md active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
