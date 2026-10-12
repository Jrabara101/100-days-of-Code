import React, { useRef, useState } from 'react';
import {
  Gamepad2,
  Download,
  Upload,
  Sparkles,
  Undo2,
  Redo2,
  Grid,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { SpriteAtlasProject } from '../types/sprite';

interface TopNavbarProps {
  project: SpriteAtlasProject;
  onUpdateTitle: (title: string) => void;
  onUploadImage: (file: File) => void;
  onSelectSample: (sampleType: 'knight' | 'rogue') => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  onFitToViewport: () => void;
  pixelated: boolean;
  onTogglePixelated: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPlaytest: () => void;
  onOpenExport: () => void;
  onOpenOptimize: () => void;
  onSaveCloud: () => void;
  isSaving: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  project,
  onUpdateTitle,
  onUploadImage,
  onSelectSample,
  zoom,
  onZoomChange,
  onFitToViewport,
  pixelated,
  onTogglePixelated,
  showGrid,
  onToggleGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenPlaytest,
  onOpenExport,
  onOpenOptimize,
  onSaveCloud,
  isSaving,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(project.title);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadImage(e.target.files[0]);
    }
  };

  return (
    <header className="h-12 bg-dock border-b border-border-subtle flex items-center justify-between px-3 z-30 select-none">
      {/* Left: Branding, Title & Quick Presets */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-accent-cyan to-accent-emerald flex items-center justify-center font-mono font-bold text-xs text-void shadow-glow-cyan">
            2D
          </div>
          <span className="font-extrabold text-xs tracking-wider text-accent-cyan uppercase hidden sm:inline">
            Sprite Studio
          </span>
        </div>

        <div className="h-4 w-[1px] bg-border-subtle" />

        {/* Inline editable title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            autoFocus
            className="bg-card text-text-display px-2 py-0.5 text-xs rounded border border-accent-cyan outline-none font-medium w-48"
          />
        ) : (
          <button
            onClick={() => {
              setTitleInput(project.title);
              setIsEditingTitle(true);
            }}
            title="Click to rename project"
            className="text-xs font-semibold text-text-display hover:text-accent-cyan transition-colors px-1.5 py-0.5 rounded hover:bg-card max-w-[200px] truncate"
          >
            {project.title}
          </button>
        )}

        {/* Dimension & Format Badge */}
        <span className="font-mono text-[10px] text-text-muted bg-card px-2 py-0.5 rounded border border-border-subtle">
          PNG • {project.imageDimensions.width}×{project.imageDimensions.height}px
        </span>

        {/* Sample Asset Picker */}
        <div className="relative">
          <button
            onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
            className="flex items-center space-x-1 text-[11px] font-medium text-text-muted hover:text-text-display px-2 py-1 rounded bg-card hover:bg-border-subtle transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Demos</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {sampleMenuOpen && (
            <div className="absolute left-0 top-8 bg-card border border-border-subtle rounded shadow-xl py-1 w-44 z-50">
              <button
                onClick={() => {
                  onSelectSample('knight');
                  setSampleMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-display hover:bg-dock flex items-center justify-between"
              >
                <span>Cyber Knight</span>
                <span className="text-[10px] text-text-muted font-mono">32×32</span>
              </button>
              <button
                onClick={() => {
                  onSelectSample('rogue');
                  setSampleMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-display hover:bg-dock flex items-center justify-between"
              >
                <span>Pixel Rogue</span>
                <span className="text-[10px] text-text-muted font-mono">24×24</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center: Viewport Telemetry & View Controls */}
      <div className="hidden md:flex items-center space-x-1.5 bg-card px-2.5 py-1 rounded-full border border-border-subtle">
        {/* Zoom controls */}
        <button
          onClick={() => onZoomChange(Math.max(0.25, zoom * 0.8))}
          title="Zoom Out"
          className="p-1 rounded text-text-muted hover:text-text-display hover:bg-dock transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[11px] text-accent-cyan font-bold min-w-[48px] text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => onZoomChange(Math.min(32, zoom * 1.25))}
          title="Zoom In"
          className="p-1 rounded text-text-muted hover:text-text-display hover:bg-dock transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onFitToViewport}
          title="Fit Canvas to Screen"
          className="p-1 rounded text-text-muted hover:text-text-display hover:bg-dock transition-colors ml-1"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-[1px] bg-border-subtle mx-1" />

        {/* Grid Snap Toggle */}
        <button
          onClick={onToggleGrid}
          title="Toggle Grid Lines"
          className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
            showGrid
              ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/40'
              : 'text-text-muted hover:text-text-display'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        {/* Pixel Smoothing Toggle [Z] */}
        <button
          onClick={onTogglePixelated}
          title="Toggle Nearest-Neighbor (Crisp) vs Bilinear [Z]"
          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
            pixelated
              ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/40'
              : 'text-text-muted hover:text-text-display'
          }`}
        >
          {pixelated ? 'Pixel: Crisp' : 'Pixel: Smooth'}
        </button>
      </div>

      {/* Right: Actions, Upload, Playtest & Export */}
      <div className="flex items-center space-x-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-card rounded border border-border-subtle p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo [Ctrl+Z]"
            className="p-1 rounded text-text-muted hover:text-text-display disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo [Ctrl+Y]"
            className="p-1 rounded text-text-muted hover:text-text-display disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hidden upload input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload Sprite Sheet (PNG, WebP)"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-card hover:bg-border-subtle text-text-display text-xs font-semibold border border-border-subtle transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="hidden sm:inline">Import</span>
        </button>

        {/* Save to Cloud / SQLite Session */}
        <button
          onClick={onSaveCloud}
          disabled={isSaving}
          title="Save project session to SQLite backend"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-card hover:bg-border-subtle text-text-display text-xs font-medium border border-border-subtle transition-colors"
        >
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>

        {/* Compactor & Redundancy Auditor CTA */}
        <button
          onClick={onOpenOptimize}
          title="Audit VRAM & Repack Atlas with MaxRects"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-gradient-to-r from-accent-violet/20 to-accent-cyan/20 hover:from-accent-violet/30 hover:to-accent-cyan/30 text-accent-cyan text-xs font-semibold border border-accent-cyan/40 shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="hidden md:inline">Audit &amp; Pack</span>
        </button>

        {/* Playtest Sandbox CTA */}
        <button
          onClick={onOpenPlaytest}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-accent-emerald hover:bg-emerald-400 text-void text-xs font-bold shadow-glow-emerald transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Gamepad2 className="w-4 h-4 fill-void" />
          <span>Playtest</span>
        </button>

        {/* Export Metadata Dialog CTA */}
        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-accent-cyan hover:bg-cyan-400 text-void text-xs font-bold shadow-glow-cyan transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
