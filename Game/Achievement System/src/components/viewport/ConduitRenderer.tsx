import React from 'react';
import { AchievementNode } from '../../types/achievement';
import { ViewportBounds } from '../../hooks/useInfiniteViewport';

interface ConduitRendererProps {
  nodes: Record<string, AchievementNode>;
  visibleBounds: ViewportBounds;
  pulsingLinks?: Array<[string, string]>; // Pair of [parentId, childId] pulsing
}

export const ConduitRenderer: React.FC<ConduitRendererProps> = ({
  nodes,
  visibleBounds,
  pulsingLinks = [],
}) => {
  // Collect all edges from child nodes' parentIds
  const edges: Array<{
    source: AchievementNode;
    target: AchievementNode;
    key: string;
    isSourceUnlocked: boolean;
    isTargetUnlocked: boolean;
    isPulsing: boolean;
  }> = [];

  for (const childId of Object.keys(nodes)) {
    const child = nodes[childId];
    if (!child.parentIds || child.parentIds.length === 0) continue;

    for (const parentId of child.parentIds) {
      const parent = nodes[parentId];
      if (!parent) continue;

      // Viewport culling check: At least one end or the bounding box should intersect visible bounds
      const minX = Math.min(parent.gridCoordinates.x, child.gridCoordinates.x);
      const maxX = Math.max(parent.gridCoordinates.x, child.gridCoordinates.x) + 64;
      const minY = Math.min(parent.gridCoordinates.y, child.gridCoordinates.y);
      const maxY = Math.max(parent.gridCoordinates.y, child.gridCoordinates.y) + 64;

      const inView =
        maxX >= visibleBounds.minX &&
        minX <= visibleBounds.maxX &&
        maxY >= visibleBounds.minY &&
        minY <= visibleBounds.maxY;

      if (!inView) continue;

      const isPulsing = pulsingLinks.some(
        ([p, c]) => (p === parent.id && c === child.id) || (p === child.id && c === parent.id)
      );

      edges.push({
        source: parent,
        target: child,
        key: `${parent.id}->${child.id}`,
        isSourceUnlocked: parent.isUnlocked,
        isTargetUnlocked: child.isUnlocked,
        isPulsing,
      });
    }
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
      <defs>
        {/* Glow filter for conduits */}
        <filter id="conduit-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="conduit-intense-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Linear gradient along flow */}
        <linearGradient id="conduit-active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#7dd3fc" stopOpacity="1" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
        </linearGradient>

        <linearGradient id="conduit-pulse-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
        </linearGradient>
      </defs>

      {edges.map(({ source, target, key, isSourceUnlocked, isTargetUnlocked, isPulsing }) => {
        // Block centers are coordinates + 32px (since blocks are 64x64px)
        const x1 = source.gridCoordinates.x + 32;
        const y1 = source.gridCoordinates.y + 32;
        const x2 = target.gridCoordinates.x + 32;
        const y2 = target.gridCoordinates.y + 32;

        const dx = (x2 - x1) * 0.5;
        // Cubic bezier spline path
        const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        return (
          <g key={key}>
            {/* Background Conduit Pipe */}
            <path
              d={d}
              fill="none"
              stroke="#1e293b"
              strokeWidth="6"
              strokeLinecap="round"
              className="transition-colors"
            />
            <path
              d={d}
              fill="none"
              stroke={isSourceUnlocked ? 'rgba(56, 189, 248, 0.25)' : 'rgba(51, 65, 85, 0.4)'}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Glowing Circuit Energy Flow (When parent unlocked) */}
            {isSourceUnlocked && (
              <path
                d={d}
                fill="none"
                stroke="url(#conduit-active-grad)"
                strokeWidth={isTargetUnlocked ? '3' : '2'}
                strokeDasharray="8 14"
                filter="url(#conduit-glow)"
                className="animate-conduit-pulse"
              />
            )}

            {/* High-voltage Energetic Burst Pulse (When milestone unlocked or pulse triggered) */}
            {isPulsing && (
              <path
                d={d}
                fill="none"
                stroke="url(#conduit-pulse-grad)"
                strokeWidth="5"
                filter="url(#conduit-intense-glow)"
                strokeDasharray="16 8"
                className="animate-conduit-pulse"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};
