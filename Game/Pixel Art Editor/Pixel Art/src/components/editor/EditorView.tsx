import React, { useState } from 'react';
import { usePixelStore } from '../../store/usePixelStore';
import { PixelCanvas } from '../canvas/PixelCanvas';
import { Tooltip } from '../ui/Tooltip';
import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { 
  Pencil, 
  Eraser, 
  PaintBucket, 
  Pipette, 
  SquareDashed, 
  Move, 
  Undo2, 
  Redo2, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Play, 
  Pause, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Layers as LayersIcon,
  Palette as PaletteIcon,
  Sparkles
} from 'lucide-react';
import { ToolType } from '../../types/pixel';

export const EditorView: React.FC = () => {
  const {
    dimensions,
    zoom,
    showGrid,
    cursorPos,
    activeTool,
    setActiveTool,
    brushSize,
    setBrushSize,
    pixelPerfect,
    setPixelPerfect,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    swapColors,
    palette,
    activePaletteName,
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    frames,
    activeFrameIndex,
    setActiveFrameIndex,
    addFrame,
    duplicateFrame,
    deleteFrame,
    isPlaying,
    togglePlay,
    fps,
    canUndo,
    canRedo,
    undo,
    redo,
    clearCanvas,
    addColorToPalette,
  } = usePixelStore();

  const [inspectorTab, setInspectorTab] = useState<'layers' | 'swatches'>('layers');

  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'pencil', label: 'Pencil', icon: <Pencil className="w-5 h-5" />, shortcut: 'B' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-5 h-5" />, shortcut: 'E' },
    { id: 'bucket', label: 'Paint Bucket', icon: <PaintBucket className="w-5 h-5" />, shortcut: 'G' },
    { id: 'picker', label: 'Eyedropper', icon: <Pipette className="w-5 h-5" />, shortcut: 'I' },
    { id: 'select', label: 'Marquee Select', icon: <SquareDashed className="w-5 h-5" />, shortcut: 'M' },
    { id: 'move', label: 'Pan / Move', icon: <Move className="w-5 h-5" />, shortcut: 'V' },
  ];

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-bg-canvas select-none">
      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Tool Dock */}
        <aside className="w-14 bg-surface-panel border-r border-border-subtle flex flex-col items-center py-3 gap-2 z-20 shadow-xl">
          {tools.map((t) => {
            const isActive = activeTool === t.id;
            return (
              <Tooltip key={t.id} content={t.label} shortcut={t.shortcut} side="right">
                <button
                  onClick={() => setActiveTool(t.id)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-lg ring-2 ring-primary scale-105'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t.icon}
                </button>
              </Tooltip>
            );
          })}

          <div className="w-8 h-[1px] bg-border-subtle my-1" />

          {/* Brush Size Selector */}
          <div className="flex flex-col items-center gap-1 w-full px-2">
            <span className="text-[10px] font-mono text-text-muted">SIZE</span>
            <div className="flex flex-col gap-1 w-full">
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  className={`h-5 w-full rounded text-[11px] font-mono font-bold transition-colors ${
                    brushSize === s
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'text-text-muted hover:bg-surface-container'
                  }`}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          <div className="w-8 h-[1px] bg-border-subtle my-1" />

          {/* Pixel Perfect Toggle */}
          <Tooltip content="Pixel Perfect Stroke Filter (Smooth lines without corner clusters)" side="right">
            <button
              onClick={() => setPixelPerfect(!pixelPerfect)}
              className={`w-10 h-7 rounded text-[9px] font-mono font-bold border transition-colors ${
                pixelPerfect
                  ? 'bg-secondary/20 border-secondary text-secondary'
                  : 'border-border-subtle text-text-muted hover:text-on-surface'
              }`}
            >
              PIX
            </button>
          </Tooltip>

          {/* Color Chips Dock */}
          <div className="mt-auto mb-2 flex flex-col items-center">
            <div className="relative w-10 h-10">
              <ColorPickerPopover 
                color={primaryColor} 
                onChange={setPrimaryColor}
                onAddColorToPalette={addColorToPalette}
              >
                <div
                  className="w-7 h-7 rounded border border-white/30 shadow-md cursor-pointer absolute top-0 left-0 hover:scale-105 transition-transform z-10"
                  style={{ backgroundColor: primaryColor }}
                  title="Primary Color (Click to inspect)"
                />
              </ColorPickerPopover>

              <ColorPickerPopover 
                color={secondaryColor} 
                onChange={setSecondaryColor}
                onAddColorToPalette={addColorToPalette}
              >
                <div
                  className="w-7 h-7 rounded border border-white/20 shadow-md cursor-pointer absolute bottom-0 right-0 hover:scale-105 transition-transform"
                  style={{ backgroundColor: secondaryColor }}
                  title="Secondary Color (Click to inspect)"
                />
              </ColorPickerPopover>
            </div>

            <button
              onClick={swapColors}
              className="mt-2 text-[10px] font-mono text-text-muted hover:text-primary transition-colors"
              title="Swap Colors (X)"
            >
              Swap (X)
            </button>
          </div>
        </aside>

        {/* Center Workspace & Interactive Canvas */}
        <div className="flex-1 bg-surface-dim flex flex-col relative overflow-hidden">
          {/* Ambient Background Glow */}
          <div className="absolute w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

          {/* Floating Canvas HUD (Top Left) */}
          <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-3 shadow-xl border border-border-subtle text-on-surface-variant z-10 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-xs">Zoom:</span>
              <span className="font-mono text-xs text-on-surface font-semibold">{zoom}%</span>
            </div>
            <div className="w-[1px] h-3 bg-surface-bright" />
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-xs">Grid:</span>
              <span className={`font-mono text-xs font-semibold ${showGrid ? 'text-secondary' : 'text-text-muted'}`}>
                {showGrid ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-surface-bright" />
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-xs">Pos:</span>
              <span className="font-mono text-xs text-primary font-semibold">
                {cursorPos ? `X: ${cursorPos.x} Y: ${cursorPos.y}` : '—'}
              </span>
            </div>
          </div>

          {/* Quick Action Overlay (Top Right) */}
          <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur-md p-1 rounded-lg flex items-center gap-1 shadow-xl border border-border-subtle z-10">
            <Tooltip content="Undo" shortcut="Ctrl+Z">
              <button
                disabled={!canUndo}
                onClick={undo}
                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </Tooltip>

            <Tooltip content="Redo" shortcut="Ctrl+Y">
              <button
                disabled={!canRedo}
                onClick={redo}
                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </Tooltip>

            <div className="w-[1px] h-4 bg-surface-bright mx-1" />

            <Tooltip content="Clear Active Layer">
              <button
                onClick={clearCanvas}
                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-surface-container rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          {/* Core Interactive Canvas Engine */}
          <PixelCanvas />

          {/* Coordinate & Palette Footer Tag */}
          <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-text-muted shadow-lg border border-border-subtle z-10 pointer-events-none">
            Canvas: <span className="text-on-surface font-semibold">{dimensions.width}×{dimensions.height}px</span> | Palette: <span className="text-primary font-semibold">{activePaletteName}</span>
          </div>
        </div>

        {/* Right Dock: Inspector & Layers / Swatches */}
        <aside className="w-80 bg-surface-panel border-l border-border-subtle flex flex-col z-20 shadow-xl">
          {/* Tab Selector */}
          <div className="flex bg-surface-container-low p-2 gap-1 border-b border-border-subtle">
            <button
              onClick={() => setInspectorTab('layers')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                inspectorTab === 'layers'
                  ? 'bg-surface-container text-on-surface shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
              }`}
            >
              <LayersIcon className="w-3.5 h-3.5 text-primary" />
              <span>Layers</span>
            </button>
            <button
              onClick={() => setInspectorTab('swatches')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                inspectorTab === 'swatches'
                  ? 'bg-surface-container text-on-surface shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
              }`}
            >
              <PaletteIcon className="w-3.5 h-3.5 text-secondary" />
              <span>Swatches</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col overflow-y-auto p-3 gap-4">
            {inspectorTab === 'layers' ? (
              /* Layer Stack */
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface tracking-wide">Layer Stack</span>
                  <button
                    onClick={addLayer}
                    className="px-2 py-1 text-xs text-primary hover:bg-surface-container rounded transition-colors flex items-center gap-1 font-mono"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Layer
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {layers.slice().reverse().map((layer) => {
                    const isActive = layer.id === activeLayerId;
                    return (
                      <div
                        key={layer.id}
                        onClick={() => setActiveLayerId(layer.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isActive
                            ? 'bg-surface-container-high border-primary/60 shadow-md ring-1 ring-primary/40'
                            : 'bg-surface-container border-border-subtle hover:bg-surface-container-high'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerVisibility(layer.id);
                            }}
                            className="text-on-surface-variant hover:text-primary transition-colors"
                          >
                            {layer.visible ? (
                              <Eye className="w-4 h-4 text-primary" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-text-muted" />
                            )}
                          </button>
                          <span className={`text-xs font-medium ${isActive ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                            {layer.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerLock(layer.id);
                            }}
                            className="text-text-muted hover:text-on-surface transition-colors"
                          >
                            {layer.locked ? (
                              <Lock className="w-3.5 h-3.5 text-error" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Color Swatches Grid */
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface">Active Swatches</span>
                  <span className="font-mono text-xs text-text-muted">{palette.length} Colors</span>
                </div>

                <div className="grid grid-cols-6 gap-2 bg-surface-container p-2.5 rounded-lg border border-border-subtle">
                  {palette.map((color, idx) => {
                    const isSelected = color.toUpperCase() === primaryColor.toUpperCase();
                    return (
                      <div
                        key={idx}
                        onClick={() => setPrimaryColor(color)}
                        className={`aspect-square rounded-md cursor-pointer border transition-all hover:scale-105 shadow-sm ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary scale-105 z-10'
                            : 'border-white/10 hover:border-white/40'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    );
                  })}
                </div>

                {/* Quick Add Custom Color */}
                <ColorPickerPopover 
                  color={primaryColor} 
                  onChange={setPrimaryColor} 
                  onAddColorToPalette={addColorToPalette}
                >
                  <button className="w-full py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-mono text-primary flex items-center justify-center gap-1.5 border border-border-subtle transition-colors mt-2">
                    <Plus className="w-3.5 h-3.5" /> Pick & Add Custom Color
                  </button>
                </ColorPickerPopover>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Frame Sequencer / Quick Timeline */}
      <footer className="h-24 bg-surface-panel border-t border-border-subtle flex flex-col justify-between px-6 py-2 z-30 shadow-2xl">
        {/* Top bar of sequencer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Animation Sequencer
            </span>
            <span className="font-mono text-xs text-text-muted">FPS: <strong className="text-on-surface">{fps}</strong></span>
            <span className="font-mono text-xs text-text-muted">Total: <strong className="text-secondary">{frames.length} frames</strong></span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFrameIndex(0)}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
              title="First Frame"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isPlaying ? 'bg-secondary text-on-secondary shadow-md' : 'bg-primary text-on-primary hover:bg-primary-container shadow-md'
              }`}
              title={isPlaying ? "Pause" : "Play Loop"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => setActiveFrameIndex(frames.length - 1)}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded transition-colors"
              title="Last Frame"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-3.5 bg-border-subtle mx-1" />

            <button
              onClick={addFrame}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-mono text-on-surface transition-colors border border-border-subtle"
            >
              <Plus className="w-3 h-3 text-primary" /> Add Frame
            </button>

            <button
              onClick={() => duplicateFrame()}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-xs font-mono text-on-surface transition-colors border border-border-subtle"
            >
              <Copy className="w-3 h-3 text-secondary" /> Duplicate
            </button>
          </div>
        </div>

        {/* Thumbnail Frame Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {frames.map((_, idx) => {
            const isActive = idx === activeFrameIndex;
            return (
              <div
                key={idx}
                onClick={() => setActiveFrameIndex(idx)}
                className={`flex flex-col items-center gap-1 cursor-pointer group shrink-0 transition-transform ${
                  isActive ? 'scale-105' : 'hover:scale-102'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-lg flex items-center justify-center relative overflow-hidden transition-all ${
                    isActive
                      ? 'bg-surface-container-high ring-2 ring-primary shadow-lg'
                      : 'bg-surface-container group-hover:bg-surface-container-high border border-border-subtle'
                  }`}
                >
                  <span className={`font-mono text-xs font-bold ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                    #{idx + 1}
                  </span>
                </div>
                <span className={`font-mono text-[9px] ${isActive ? 'text-primary font-bold' : 'text-text-muted'}`}>
                  {(1 / fps).toFixed(2)}s
                </span>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
