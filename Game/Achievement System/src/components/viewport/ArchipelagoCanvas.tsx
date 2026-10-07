import React, { useState, useEffect } from 'react';
import { Plus, Minus, Compass, Focus } from 'lucide-react';
import { AchievementNode, BlockBiome } from '../../types/achievement';
import { useInfiniteViewport } from '../../hooks/useInfiniteViewport';
import { ConduitRenderer } from './ConduitRenderer';
import { BlockNode } from './BlockNode';
import { MinimapRadar } from './MinimapRadar';
import { Button } from '../ui/button';

interface ArchipelagoCanvasProps {
  nodes: Record<string, AchievementNode>;
  selectedNodeId: string | null;
  activeBiomeFilter: BlockBiome | 'all';
  onSelectNode: (nodeId: string) => void;
  onHoverNode?: () => void;
  pulsingLinks?: Array<[string, string]>;
  focusNodeId?: string | null;
}

const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = 1800;

export const ArchipelagoCanvas: React.FC<ArchipelagoCanvasProps> = ({
  nodes,
  selectedNodeId,
  activeBiomeFilter,
  onSelectNode,
  onHoverNode,
  pulsingLinks = [],
  focusNodeId,
}) => {
  const {
    viewport,
    isPanning,
    containerRef,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    panTo,
    resetCamera,
    zoomIn,
    zoomOut,
    getVisibleBounds,
  } = useInfiniteViewport({
    initialZoom: 0.85,
    initialX: -260,
    initialY: -120,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
  });

  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [containerRef]);

  // Focus node pan effect
  useEffect(() => {
    if (focusNodeId && nodes[focusNodeId]) {
      const node = nodes[focusNodeId];
      panTo(node.gridCoordinates.x + 32, node.gridCoordinates.y + 32, 1.15, 600);
    }
  }, [focusNodeId, nodes, panTo]);

  // Visible bounds for viewport culling
  const visibleBounds = getVisibleBounds();

  // Filter nodes based on active biome filter
  const allNodesList = Object.values(nodes);
  const filteredNodes =
    activeBiomeFilter === 'all'
      ? allNodesList
      : allNodesList.filter((n) => n.biome === activeBiomeFilter);

  // Culled nodes: only render if within visible world coordinates
  const visibleNodes = filteredNodes.filter((node) => {
    const x = node.gridCoordinates.x;
    const y = node.gridCoordinates.y;
    return (
      x + 64 >= visibleBounds.minX &&
      x <= visibleBounds.maxX &&
      y + 64 >= visibleBounds.minY &&
      y <= visibleBounds.maxY
    );
  });

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full overflow-hidden bg-[#07090e] canvas-grid-bg select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Biome Ambient Background Highlights */}
      <div className="absolute top-40 left-60 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-96 left-[1100px] w-[500px] h-[500px] rounded-full bg-orange-600/5 blur-3xl pointer-events-none" />
      <div className="absolute top-[800px] left-[900px] w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-[1300px] w-[500px] h-[500px] rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

      {/* Transformable Infinite World Canvas with GPU Acceleration */}
      <div
        className="absolute origin-top-left will-change-transform"
        style={{
          width: `${WORLD_WIDTH}px`,
          height: `${WORLD_HEIGHT}px`,
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
      >
        {/* SVG Bezier Conduits Layer */}
        <ConduitRenderer
          nodes={nodes}
          visibleBounds={visibleBounds}
          pulsingLinks={pulsingLinks}
        />

        {/* 2D Block Elements with Viewport Culling */}
        {visibleNodes.map((node) => {
          const isParentsUnlocked =
            node.parentIds.length === 0 ||
            node.parentIds.every((pid) => nodes[pid] && nodes[pid].isUnlocked);

          return (
            <BlockNode
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              isParentsUnlocked={isParentsUnlocked}
              onSelect={onSelectNode}
              onHover={onHoverNode}
            />
          );
        })}
      </div>

      {/* Floating Coordinates & Viewport HUD Badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/85 backdrop-blur-md border border-slate-700/80 shadow-lg text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>
            X: {Math.round(-viewport.x)} // Y: {Math.round(-viewport.y)}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-primary font-bold">{viewport.zoom.toFixed(2)}x</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">
            {visibleNodes.length}/{filteredNodes.length} Culled
          </span>
        </div>
      </div>

      {/* Floating Canvas Camera Control Dock */}
      <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-1.5 bg-surface/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-2xl">
        <Button
          size="icon"
          variant="secondary"
          onClick={zoomIn}
          title="Zoom In"
          className="h-9 w-9 text-slate-200"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={zoomOut}
          title="Zoom Out"
          className="h-9 w-9 text-slate-200"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={resetCamera}
          title="Recenter Matrix"
          className="h-9 w-9 text-slate-200"
        >
          <Focus className="h-4 w-4" />
        </Button>
      </div>

      {/* Mini-Map Radar */}
      <MinimapRadar
        nodes={nodes}
        viewport={viewport}
        worldWidth={WORLD_WIDTH}
        worldHeight={WORLD_HEIGHT}
        containerWidth={containerSize.width}
        containerHeight={containerSize.height}
        onNavigate={(worldX, worldY) => panTo(worldX, worldY, undefined, 400)}
      />
    </div>
  );
};
