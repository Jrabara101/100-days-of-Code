import React from 'react';
import type { PerformanceSummary } from '../../types/telemetry';

interface AmbientEdgeProps {
  enabled: boolean;
  metrics: PerformanceSummary;
  isStuttering: boolean;
}

export const AmbientEdge: React.FC<AmbientEdgeProps> = ({ enabled, metrics, isStuttering }) => {
  if (!enabled) return null;

  // Determine ambient lighting status:
  // Emerald for stable 60/120 FPS, Amber for frame dips, Crimson for severe stutters
  const isCritical = isStuttering || metrics.currentFps < 30 || metrics.stabilityScore < 70;
  const isWarning = !isCritical && (metrics.currentFps < 55 || metrics.onePercentLowFps < 45 || metrics.stabilityScore < 88);

  const glowClass = isCritical
    ? 'ambient-edge-critical border-red-500/70'
    : isWarning
    ? 'ambient-edge-warning border-amber-500/60'
    : 'ambient-edge-optimal border-emerald-500/50';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-40 border-[3px] transition-colors duration-200 ${glowClass}`}
      style={{
        boxShadow: isCritical
          ? 'inset 0 0 50px rgba(239, 68, 68, 0.45)'
          : isWarning
          ? 'inset 0 0 40px rgba(245, 158, 11, 0.35)'
          : 'inset 0 0 30px rgba(16, 185, 129, 0.25)',
      }}
    >
      {/* Corner avionics status brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-current opacity-80" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-current opacity-80" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-current opacity-80" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-current opacity-80" />
    </div>
  );
};
