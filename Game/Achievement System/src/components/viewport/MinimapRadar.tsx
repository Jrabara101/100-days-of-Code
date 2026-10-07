import React, { useRef, useCallback } from 'react';
import { AchievementNode } from '../../types/achievement';
import { ViewportState } from '../../hooks/useInfiniteViewport';

interface MinimapRadarProps {
  nodes: Record<string, AchievementNode>;
  viewport: ViewportState;
  worldWidth: number;
  worldHeight: number;
  containerWidth: number;
  containerHeight: number;
  onNavigate: (worldX: number, worldY: number) => void;
}

export const MinimapRadar: React.FC<MinimapRadarProps> = ({
  nodes,
  viewport,
  worldWidth,
  worldHeight,
  containerWidth,
  containerHeight,
  onNavigate,
}) => {
  const minimapRef = useRef<HTMLDivElement | null>(null);

  // Minimap dimensions in px
  const mapW = 160;
  const mapH = 110;

  const scaleX = mapW / worldWidth;
  const scaleY = mapH / worldHeight;

  // Viewport indicator rect in minimap space
  const visibleWorldW = containerWidth / viewport.zoom;
  const visibleWorldH = containerHeight / viewport.zoom;

  const viewMinX = -viewport.x / viewport.zoom;
  const viewMinY = -viewport.y / viewport.zoom;

  const rectLeft = Math.max(0, Math.min(mapW, viewMinX * scaleX));
  const rectTop = Math.max(0, Math.min(mapH, viewMinY * scaleY));
  const rectW = Math.max(12, Math.min(mapW, visibleWorldW * scaleX));
  const rectH = Math.max(10, Math.min(mapH, visibleWorldH * scaleY));

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const rect = minimapRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert minimap coords to world coords
      const targetWorldX = clickX / scaleX;
      const targetWorldY = clickY / scaleY;

      onNavigate(targetWorldX, targetWorldY);
    },
    [scaleX, scaleY, onNavigate]
  );

  return (
    <div
      ref={minimapRef}
      onPointerDown={handlePointerDown}
      className="absolute bottom-6 right-6 z-30 w-40 h-28 rounded-xl bg-surface/90 border border-slate-700/80 p-1 shadow-2xl backdrop-blur-md cursor-crosshair select-none overflow-hidden transition-all hover:border-primary/60 group"
    >
      <div className="relative w-full h-full rounded-lg bg-surface-dim/80 overflow-hidden border border-slate-800">
        {/* Radar grid subtle scan lines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.1)_0%,_transparent_75%)] pointer-events-none" />

        {/* Miniature Node Dots */}
        {Object.values(nodes).map((node) => {
          const dotX = (node.gridCoordinates.x + 32) * scaleX;
          const dotY = (node.gridCoordinates.y + 32) * scaleY;

          let color = '#475569';
          if (node.isUnlocked) {
            color =
              node.biome === 'overworld'
                ? '#22c55e'
                : node.biome === 'nether'
                ? '#f97316'
                : node.biome === 'crystal_depths'
                ? '#a855f7'
                : '#eab308';
          } else if (node.progress.current > 0) {
            color = '#38bdf8';
          }

          return (
            <div
              key={node.id}
              className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform group-hover:scale-125"
              style={{
                left: `${dotX}px`,
                top: `${dotY}px`,
                backgroundColor: color,
                boxShadow: node.isUnlocked ? `0 0 4px ${color}` : undefined,
              }}
            />
          );
        })}

        {/* Draggable Viewport Rect Frame */}
        <div
          className="absolute border border-primary bg-primary/20 rounded pointer-events-none transition-all duration-75 shadow-[0_0_8px_rgba(56,189,248,0.4)]"
          style={{
            left: `${rectLeft}px`,
            top: `${rectTop}px`,
            width: `${rectW}px`,
            height: `${rectH}px`,
          }}
        />

        {/* Radar Overlay Label */}
        <div className="absolute top-1 left-1.5 text-[8px] font-mono font-bold tracking-wider text-primary/80 uppercase pointer-events-none">
          Radar 2.4K
        </div>
      </div>
    </div>
  );
};
