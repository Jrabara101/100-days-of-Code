import React, { useEffect, useRef } from 'react';
import {
  HeatmapPoint,
  LevelEntity,
  LevelMap,
  TileData,
  EditorTool,
} from '../types/index.js';
import { useTilemapCanvas } from '../hooks/useTilemapCanvas.js';
import { PlaytestHUD } from './PlaytestHUD.js';

interface CanvasViewportProps {
  map: LevelMap;
  activeLayerId: string;
  activeTool: EditorTool;
  selectedTileDef: TileData | null;
  selectedEntityId: string | null;
  gridSettings: { showGrid: boolean; snapToGrid: boolean; size: number };
  isPlaytesting: boolean;
  onTogglePlaytest: () => void;
  onResetPlaytest: () => void;
  isAutoTileEnabled: boolean;
  activeBiomeId: string;
  heatmapPoints: HeatmapPoint[];
  showHeatmap: boolean;
  onTileChange: (
    layerId: string,
    changes: { key: string; before: TileData | null; after: TileData | null }[]
  ) => void;
  onEntityChange: (entities: LevelEntity[]) => void;
  onSelectEntity: (id: string | null) => void;
  onRecordTelemetry?: (event: any) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  map,
  activeLayerId,
  activeTool,
  selectedTileDef,
  selectedEntityId,
  gridSettings,
  isPlaytesting,
  onTogglePlaytest,
  onResetPlaytest,
  isAutoTileEnabled,
  activeBiomeId,
  heatmapPoints,
  showHeatmap,
  onTileChange,
  onEntityChange,
  onSelectEntity,
  onRecordTelemetry,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    canvasRef,
    viewport,
    setViewport,
    hoverGridPos,
    hoverWorldPos,
    simulation,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  } = useTilemapCanvas({
    map,
    activeLayerId,
    activeTool,
    selectedTileDef,
    selectedEntityId,
    gridSettings,
    isPlaytesting,
    isAutoTileEnabled,
    activeBiomeId,
    heatmapPoints,
    showHeatmap,
    onTileChange,
    onEntityChange,
    onSelectEntity,
    onRecordTelemetry,
  });

  // Resize canvas to match container size dynamically
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasRef]);

  // Count total placed tiles across all layers
  const totalPlacedTiles = map.layers.reduce(
    (sum, layer) => sum + Object.keys(layer.grid).length,
    0
  );

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full w-full bg-[#0A0C10] overflow-hidden select-none outline-none transition-all duration-200 ${
        isPlaytesting
          ? 'ring-2 ring-emerald-500/50 shadow-inner'
          : 'ring-1 ring-[#222B3D]'
      }`}
    >
      {/* HTML5 Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full block cursor-crosshair touch-none"
      />

      {/* Instant Playtest HUD Overlay */}
      {isPlaytesting && simulation && (
        <PlaytestHUD
          elapsedMs={simulation.state.elapsedMs}
          score={simulation.state.score}
          deathCount={simulation.state.deathCount}
          onReset={onResetPlaytest}
          onExit={onTogglePlaytest}
        />
      )}

      {/* Floating Canvas HUD pill (bottom-left telemetry) */}
      <div className="absolute bottom-3 left-3 bg-[#121620]/90 backdrop-blur-md border border-[#222B3D] rounded-lg px-3 py-1.5 flex items-center gap-3 text-[11px] font-mono text-[#94A3B8] shadow-lg pointer-events-none z-10">
        <span className="flex items-center gap-1">
          <span className="text-[#64748B]">Tile:</span>
          <strong className="text-cyan-400">
            [{hoverGridPos.x}, {hoverGridPos.y}]
          </strong>
        </span>

        <span className="text-[#64748B]">•</span>

        <span className="flex items-center gap-1">
          <span className="text-[#64748B]">World:</span>
          <strong className="text-white">
            [{hoverWorldPos.x}, {hoverWorldPos.y}]
          </strong>
        </span>

        <span className="text-[#64748B]">•</span>

        <span className="flex items-center gap-1">
          <span className="text-[#64748B]">Zoom:</span>
          <strong className="text-emerald-400">{Math.round(viewport.zoom * 100)}%</strong>
        </span>

        <span className="text-[#64748B]">•</span>

        <span className="flex items-center gap-1">
          <span className="text-[#64748B]">Placed:</span>
          <strong className="text-amber-400">{totalPlacedTiles}</strong>
        </span>
      </div>
    </div>
  );
};
