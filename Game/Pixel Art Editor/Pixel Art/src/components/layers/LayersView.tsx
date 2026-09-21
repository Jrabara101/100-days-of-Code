import React, { useRef, useEffect } from 'react';
import { usePixelStore } from '../../store/usePixelStore';
import { BlendModeType } from '../../types/pixel';
import { compositeFrameToCanvas } from '../../lib/exportUtils';
import { 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Layers, 
  ArrowDown, 
  ArrowUp, 
  Merge, 
  Sliders,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const LayersView: React.FC = () => {
  const {
    dimensions,
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    duplicateLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    setLayerOpacity,
    setLayerBlendMode,
    mergeDown,
    reorderLayers,
    frames,
    activeFrameIndex,
  } = usePixelStore();

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];
  const activeLayerIndex = layers.findIndex((l) => l.id === activeLayerId);

  // Composite preview onto canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    const frameCanvas = compositeFrameToCanvas(currentFrame, layers, dimensions.width, dimensions.height);
    ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
  }, [frames, layers, activeFrameIndex, dimensions]);

  const blendModes: { value: BlendModeType; label: string }[] = [
    { value: 'source-over', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'lighter', label: 'Add / Linear Dodge' },
    { value: 'color-dodge', label: 'Color Dodge' },
    { value: 'color-burn', label: 'Color Burn' },
    { value: 'hard-light', label: 'Hard Light' },
    { value: 'difference', label: 'Difference' },
  ];

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-bg-canvas text-on-surface select-none">
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Center Canvas Stage Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-dim relative overflow-hidden">
          <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-surface-panel/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md border border-border-subtle">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-xs text-on-surface">Compositing Viewport</span>
            <span className="text-text-muted">|</span>
            <span className="font-mono text-xs text-on-surface-variant">
              {dimensions.width}×{dimensions.height}px
            </span>
            <span className="text-text-muted">|</span>
            <span className="font-mono text-xs text-secondary">
              {layers.length} Layers Active
            </span>
          </div>

          {/* Canvas container */}
          <div className="relative w-[380px] h-[380px] bg-surface-container-lowest rounded-2xl shadow-2xl flex items-center justify-center border border-border-subtle overflow-hidden">
            <div className="absolute inset-0 bg-checkerboard opacity-20 pointer-events-none" />
            <canvas
              ref={previewCanvasRef}
              width={280}
              height={280}
              className="relative z-10 w-72 h-72 pixelated drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Right Inspector Dock: Layers & Compositing Engine */}
        <aside className="w-96 bg-surface-panel flex flex-col border-l border-border-subtle shrink-0 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-border-subtle bg-surface-container-low">
            <span className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" /> Layer Compositor
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={addLayer}
                className="p-1.5 text-primary hover:bg-surface-container rounded-lg transition-colors flex items-center gap-1 text-xs font-mono font-bold"
                title="New Layer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Compositing Controls Bar for Active Layer */}
          {activeLayer && (
            <div className="p-4 bg-surface flex flex-col gap-3 border-b border-border-subtle">
              <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                Active: <span className="text-primary font-bold">{activeLayer.name}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Blend Mode Dropdown */}
                <div className="flex-1 flex items-center justify-between bg-surface-container px-2.5 py-1.5 rounded-lg border border-border-subtle">
                  <select
                    value={activeLayer.blendMode || 'source-over'}
                    onChange={(e) => setLayerBlendMode(activeLayer.id, e.target.value as BlendModeType)}
                    className="w-full bg-transparent text-xs font-mono text-on-surface outline-none cursor-pointer"
                  >
                    {blendModes.map((bm) => (
                      <option key={bm.value} value={bm.value} className="bg-surface-panel text-on-surface">
                        {bm.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted pointer-events-none" />
                </div>

                {/* Opacity Value */}
                <div className="w-24 flex items-center gap-1 bg-surface-container px-2 py-1.5 rounded-lg border border-border-subtle">
                  <span className="text-[10px] font-mono text-text-muted">OP</span>
                  <span className="text-xs font-mono font-bold text-on-surface text-right w-full">
                    {Math.round(activeLayer.opacity * 100)}%
                  </span>
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(activeLayer.opacity * 100)}
                  onChange={(e) => setLayerOpacity(activeLayer.id, parseInt(e.target.value, 10) / 100)}
                  className="w-full accent-primary h-1.5 bg-surface-container rounded cursor-pointer"
                />
              </div>

              {/* Quick Reorder and Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <button
                    disabled={activeLayerIndex >= layers.length - 1}
                    onClick={() => reorderLayers(activeLayerIndex, activeLayerIndex + 1)}
                    className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
                    title="Move Layer Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={activeLayerIndex <= 0}
                    onClick={() => reorderLayers(activeLayerIndex, activeLayerIndex - 1)}
                    className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-30 transition-colors"
                    title="Move Layer Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={activeLayerIndex <= 0}
                    onClick={() => mergeDown(activeLayer.id)}
                    className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary disabled:opacity-30 transition-colors"
                    title="Merge Layer Down"
                  >
                    <Merge className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateLayer(activeLayer.id)}
                    className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                    title="Duplicate Layer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={layers.length <= 1}
                    onClick={() => deleteLayer(activeLayer.id)}
                    className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-error disabled:opacity-30 transition-colors"
                    title="Delete Layer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Layer Stack List */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {layers.slice().reverse().map((layer) => {
              const isActive = layer.id === activeLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayerId(layer.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-surface-container-high border-primary/70 ring-1 ring-primary/40 shadow-lg'
                      : 'bg-surface-container border-border-subtle hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-3">
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

                    <div className="flex flex-col">
                      <span className={`text-xs font-semibold ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {layer.name}
                      </span>
                      <span className="font-mono text-[10px] text-text-muted">
                        {layer.blendMode || 'Normal'} • {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
        </aside>
      </div>
    </div>
  );
};
