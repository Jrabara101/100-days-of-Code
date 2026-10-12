import React from 'react';
import {
  Grid,
  Sparkles,
  CheckSquare,
  Square,
  PlusCircle,
  Sliders,
  Scissors,
  Layers,
} from 'lucide-react';
import { SliceConfig } from '../types/sprite';

interface LeftDockProps {
  sliceConfig: SliceConfig;
  onUpdateSliceConfig: (config: Partial<SliceConfig>) => void;
  onApplySlice: () => void;
  frameCount: number;
  selectedCount: number;
  onSelectAllFrames: () => void;
  onClearSelection: () => void;
  onAddSelectedToClip: () => void;
  activeClipName: string;
}

export const LeftDock: React.FC<LeftDockProps> = ({
  sliceConfig,
  onUpdateSliceConfig,
  onApplySlice,
  frameCount,
  selectedCount,
  onSelectAllFrames,
  onClearSelection,
  onAddSelectedToClip,
  activeClipName,
}) => {
  const presets = [
    { label: '16×16', w: 16, h: 16 },
    { label: '24×24', w: 24, h: 24 },
    { label: '32×32', w: 32, h: 32 },
    { label: '48×48', w: 48, h: 48 },
    { label: '64×64', w: 64, h: 64 },
  ];

  return (
    <aside className="w-[280px] bg-dock border-r border-border-subtle flex flex-col h-[calc(100vh-3rem)] overflow-y-auto select-none p-3 space-y-4">
      {/* Slicing Mode ToggleGroup */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center space-x-1">
          <Scissors className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Slicing Engine</span>
        </label>
        <div className="grid grid-cols-2 gap-1 bg-void p-1 rounded-lg border border-border-subtle">
          <button
            onClick={() => onUpdateSliceConfig({ mode: 'grid' })}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded text-xs font-semibold transition-all ${
              sliceConfig.mode === 'grid'
                ? 'bg-card text-accent-cyan shadow-sm border border-border-subtle'
                : 'text-text-muted hover:text-text-display'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Uniform Grid</span>
          </button>
          <button
            onClick={() => onUpdateSliceConfig({ mode: 'auto' })}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded text-xs font-semibold transition-all ${
              sliceConfig.mode === 'auto'
                ? 'bg-card text-accent-cyan shadow-sm border border-border-subtle'
                : 'text-text-muted hover:text-text-display'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alpha Island</span>
          </button>
        </div>
      </div>

      {sliceConfig.mode === 'grid' ? (
        <>
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Grid Tile Presets
            </label>
            <div className="grid grid-cols-5 gap-1">
              {presets.map((p) => {
                const isActive =
                  sliceConfig.frameWidth === p.w && sliceConfig.frameHeight === p.h;
                return (
                  <button
                    key={p.label}
                    onClick={() => {
                      onUpdateSliceConfig({ frameWidth: p.w, frameHeight: p.h });
                    }}
                    className={`py-1 text-[11px] font-mono rounded border transition-all ${
                      isActive
                        ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan font-bold'
                        : 'bg-card text-text-muted border-border-subtle hover:text-text-display hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Dimensions (W, H) */}
          <div className="space-y-2 bg-card p-3 rounded-lg border border-border-subtle">
            <div className="flex items-center justify-between text-xs font-semibold text-text-display">
              <span className="flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Tile Dimensions</span>
              </span>
              <span className="font-mono text-[11px] text-accent-cyan">
                {sliceConfig.frameWidth} × {sliceConfig.frameHeight} px
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-text-muted font-mono block mb-1">
                  Width (px)
                </span>
                <input
                  type="number"
                  min="4"
                  max="1024"
                  value={sliceConfig.frameWidth}
                  onChange={(e) =>
                    onUpdateSliceConfig({ frameWidth: Math.max(4, parseInt(e.target.value) || 4) })
                  }
                  className="w-full bg-void border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-display focus:border-accent-cyan outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-mono block mb-1">
                  Height (px)
                </span>
                <input
                  type="number"
                  min="4"
                  max="1024"
                  value={sliceConfig.frameHeight}
                  onChange={(e) =>
                    onUpdateSliceConfig({ frameHeight: Math.max(4, parseInt(e.target.value) || 4) })
                  }
                  className="w-full bg-void border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-display focus:border-accent-cyan outline-none"
                />
              </div>
            </div>
          </div>

          {/* Offsets & Spacing */}
          <div className="space-y-2 bg-card p-3 rounded-lg border border-border-subtle">
            <span className="text-xs font-semibold text-text-display block">
              Margins &amp; Spacing
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-text-muted font-mono block mb-1">Offset X</span>
                <input
                  type="number"
                  min="0"
                  max="256"
                  value={sliceConfig.offsetX}
                  onChange={(e) =>
                    onUpdateSliceConfig({ offsetX: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-void border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-display focus:border-accent-cyan outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-mono block mb-1">Offset Y</span>
                <input
                  type="number"
                  min="0"
                  max="256"
                  value={sliceConfig.offsetY}
                  onChange={(e) =>
                    onUpdateSliceConfig({ offsetY: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-void border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-display focus:border-accent-cyan outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-mono block mb-1">Spacing X</span>
                <input
                  type="number"
                  min="0"
                  max="64"
                  value={sliceConfig.spacingX}
                  onChange={(e) =>
                    onUpdateSliceConfig({ spacingX: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-void border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-display focus:border-accent-cyan outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-text-muted font-mono block mb-1">Spacing Y</span>
                <input
                  type="number"
                  min="0"
                  max="64"
                  value={sliceConfig.spacingY}
                  onChange={(e) =>
                    onUpdateSliceConfig({ spacingY: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-void border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-display focus:border-accent-cyan outline-none"
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Heuristic Alpha Cluster Options */
        <div className="space-y-3 bg-card p-3 rounded-lg border border-border-subtle">
          <div className="flex items-center justify-between text-xs font-semibold text-text-display">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Alpha Heuristics</span>
            </span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-muted">Alpha Threshold</span>
              <span className="font-mono text-accent-cyan">{sliceConfig.alphaThreshold || 15}</span>
            </div>
            <input
              type="range"
              min="1"
              max="128"
              value={sliceConfig.alphaThreshold || 15}
              onChange={(e) =>
                onUpdateSliceConfig({ alphaThreshold: parseInt(e.target.value) })
              }
              className="w-full cursor-pointer h-1.5 bg-void rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text-muted">Min Cluster Size</span>
              <span className="font-mono text-accent-cyan">{sliceConfig.minClusterSize || 8}px</span>
            </div>
            <input
              type="range"
              min="4"
              max="32"
              value={sliceConfig.minClusterSize || 8}
              onChange={(e) =>
                onUpdateSliceConfig({ minClusterSize: parseInt(e.target.value) })
              }
              className="w-full cursor-pointer h-1.5 bg-void rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Slice Atlas CTA Button */}
      <button
        onClick={onApplySlice}
        className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-accent-cyan to-cyan-500 hover:from-cyan-400 hover:to-cyan-500 text-void font-bold text-xs shadow-glow-cyan transition-all flex items-center justify-center space-x-1.5 active:scale-[0.98]"
      >
        <Scissors className="w-4 h-4" />
        <span>Re-Slice Atlas</span>
      </button>

      {/* Frame Detection Telemetry Pill */}
      <div className="bg-card p-3 rounded-lg border border-border-subtle space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Audit Count:</span>
          <span className="font-mono text-xs font-bold text-accent-cyan bg-void px-2 py-0.5 rounded border border-border-subtle">
            {frameCount} Frames
          </span>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Selected:</span>
            <span className="font-mono text-xs font-semibold text-accent-emerald bg-void px-2 py-0.5 rounded border border-border-subtle">
              {selectedCount} Selected
            </span>
          </div>
        )}

        {/* Selection Tools */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={onSelectAllFrames}
            className="flex items-center justify-center space-x-1 py-1 px-2 rounded bg-void hover:bg-border-subtle text-[11px] text-text-display border border-border-subtle transition-colors"
          >
            <CheckSquare className="w-3 h-3 text-accent-cyan" />
            <span>Select All</span>
          </button>
          <button
            onClick={onClearSelection}
            className="flex items-center justify-center space-x-1 py-1 px-2 rounded bg-void hover:bg-border-subtle text-[11px] text-text-display border border-border-subtle transition-colors"
          >
            <Square className="w-3 h-3 text-text-muted" />
            <span>Deselect</span>
          </button>
        </div>

        {/* Add selected frames to active clip */}
        {selectedCount > 0 && (
          <button
            onClick={onAddSelectedToClip}
            className="w-full mt-2 py-1.5 px-2 rounded bg-accent-violet/20 hover:bg-accent-violet/30 text-accent-violet border border-accent-violet/40 text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add to "{activeClipName}"</span>
          </button>
        )}
      </div>

      {/* Keyboard Shortcuts Hint Card */}
      <div className="bg-void/60 p-2.5 rounded-lg border border-border-subtle mt-auto space-y-1 text-[10px] font-mono text-text-muted">
        <div className="text-[11px] font-bold text-text-display flex items-center space-x-1 mb-1 font-sans">
          <Layers className="w-3 h-3 text-accent-cyan" />
          <span>Hotkeys</span>
        </div>
        <div className="flex justify-between">
          <span>[Space]</span>
          <span className="text-text-display">Play / Pause</span>
        </div>
        <div className="flex justify-between">
          <span>[A] / [D]</span>
          <span className="text-text-display">Step Frame</span>
        </div>
        <div className="flex justify-between">
          <span>[Z]</span>
          <span className="text-text-display">Pixel Crisp</span>
        </div>
        <div className="flex justify-between">
          <span>[Shift + Drag]</span>
          <span className="text-text-display">Box Select</span>
        </div>
      </div>
    </aside>
  );
};
