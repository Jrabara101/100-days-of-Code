import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { diffDays } from '../../utils/dateHelpers';

export default function GanttDependencyOverlay({
  tasks,
  dependencies,
  timelineStartDate,
  dayWidth,
  rowHeight = 36,
  taskRowIndices,
  dragWireState,
}) {
  const { showCriticalPath, criticalPath } = useProject();

  // Helper to compute node coordinates for a task
  const getNodeCoords = (taskId, isSource = false) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    const rowIndex = taskRowIndices[taskId];
    if (rowIndex === undefined) return null;

    const startOffset = diffDays(timelineStartDate, task.start_date);
    const duration = task.is_milestone
      ? 0
      : Math.max(1, diffDays(task.start_date, task.end_date) + 1);

    const y = rowIndex * rowHeight + rowHeight / 2;

    if (task.is_milestone) {
      const x = startOffset * dayWidth + dayWidth / 2;
      return { x, y };
    }

    if (isSource) {
      // Right edge (Outgoing)
      const x = (startOffset + duration) * dayWidth;
      return { x, y };
    } else {
      // Left edge (Incoming)
      const x = startOffset * dayWidth;
      return { x, y };
    }
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      <defs>
        {/* Standard arrowhead marker */}
        <marker
          id="dep-arrow-standard"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
        </marker>

        {/* Critical path arrowhead marker */}
        <marker
          id="dep-arrow-critical"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
        </marker>

        {/* Active wiring arrowhead marker */}
        <marker
          id="dep-arrow-active"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366F1" />
        </marker>
      </defs>

      {/* Render all existing DAG dependency curves */}
      {dependencies.map(dep => {
        const fromCoords = getNodeCoords(dep.predecessor_id, true);
        const toCoords = getNodeCoords(dep.successor_id, false);

        if (!fromCoords || !toCoords) return null;

        const isCritical = criticalPath.criticalDepIds.has(dep.id);
        const isDimmed = showCriticalPath && !isCritical;

        const { x: x1, y: y1 } = fromCoords;
        const { x: x2, y: y2 } = toCoords;

        // Cubic Bezier curve control points
        const dx = Math.max(30, Math.abs(x2 - x1) * 0.45);
        const c1x = x1 + dx;
        const c1y = y1;
        const c2x = x2 - dx;
        const c2y = y2;

        const pathData = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;

        return (
          <g key={dep.id} className="transition-opacity duration-200">
            {/* Wider transparent stroke for easier hover hit test if needed */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="8"
              className="pointer-events-auto cursor-pointer"
            />
            {/* Visible curve */}
            <path
              d={pathData}
              fill="none"
              stroke={isCritical && showCriticalPath ? '#EF4444' : '#64748B'}
              strokeWidth={isCritical && showCriticalPath ? '2.5' : '1.5'}
              strokeDasharray={dep.type === 'SS' ? '4,4' : 'none'}
              markerEnd={isCritical && showCriticalPath ? 'url(#dep-arrow-critical)' : 'url(#dep-arrow-standard)'}
              className={`${isCritical && showCriticalPath ? 'critical-path-connector' : ''}`}
              style={{
                opacity: isDimmed ? 0.15 : isCritical && showCriticalPath ? 1 : 0.65,
              }}
            />
          </g>
        );
      })}

      {/* Live Interactive Wiring Curve (While dragging from node) */}
      {dragWireState && dragWireState.fromCoords && (
        <g>
          {(() => {
            const { x: x1, y: y1 } = dragWireState.fromCoords;
            const { x: x2, y: y2 } = dragWireState.currentCoords;
            const dx = Math.max(30, Math.abs(x2 - x1) * 0.45);
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return (
              <>
                <path
                  d={pathData}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2.5"
                  strokeDasharray="5,4"
                  markerEnd="url(#dep-arrow-active)"
                  className="animate-pulse"
                />
                {/* Magnetic snap glow around target if hovered */}
                {dragWireState.snapped && (
                  <circle
                    cx={x2}
                    cy={y2}
                    r="8"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    className="animate-ping"
                  />
                )}
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
}
