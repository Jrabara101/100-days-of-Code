import React, { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { diffDays, addDays, formatDateStr, parseDate } from '../../utils/dateHelpers';
import { Diamond, ShieldAlert, Check, Flame } from 'lucide-react';

export default function GanttTaskBar({
  task,
  timelineStartDate,
  dayWidth,
  rowHeight = 36,
  rowIndex,
  onStartDragWire,
  onHoverTargetNode,
}) {
  const {
    teammates,
    selectedTaskId,
    setSelectedTaskId,
    showBaseline,
    showCriticalPath,
    criticalPath,
    updateTaskDates,
    collaboratorGhostDrag,
  } = useProject();

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'move' | 'resize-left' | 'resize-right'
  const dragStartRef = useRef({ mouseX: 0, origStart: '', origEnd: '' });

  const assignee = teammates.find(m => m.id === task.assignee_id);
  const isSelected = selectedTaskId === task.id;
  const isCritical = criticalPath.criticalTaskIds.has(task.id);
  const isDimmed = showCriticalPath && !isCritical;

  // Calculate pixel bounds
  const startOffsetDays = diffDays(timelineStartDate, task.start_date);
  const durationDays = task.is_milestone
    ? 0
    : Math.max(1, diffDays(task.start_date, task.end_date) + 1);

  const leftPx = startOffsetDays * dayWidth;
  const widthPx = task.is_milestone ? 24 : Math.max(28, durationDays * dayWidth);
  const topPx = rowIndex * rowHeight + (rowHeight - 24) / 2; // Center 24px bar in 36px row

  // Calculate baseline variance bounds
  const hasBaseline = showBaseline && task.baseline_start && task.baseline_end;
  const baselineStartOffset = hasBaseline ? diffDays(timelineStartDate, task.baseline_start) : 0;
  const baselineDuration = hasBaseline
    ? Math.max(1, diffDays(task.baseline_start, task.baseline_end) + 1)
    : 0;
  const baselineLeftPx = baselineStartOffset * dayWidth;
  const baselineWidthPx = Math.max(20, baselineDuration * dayWidth);

  // Status background style
  const getBarStyle = () => {
    if (task.status === 'blocked') {
      return 'blocked-hazard-pattern border border-rose-500 text-white';
    }
    if (task.status === 'done') {
      return 'bg-emerald-600/85 hover:bg-emerald-600 text-white border border-emerald-500/30';
    }
    if (task.status === 'in_review') {
      return 'bg-amber-600/90 hover:bg-amber-600 text-white border border-amber-400/40';
    }
    return 'bg-cobalt hover:bg-blue-600 text-white border border-blue-400/40';
  };

  // Mouse drag handlers for dragging the bar or resizing edges
  const handleMouseDown = (e, mode) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    dragStartRef.current = {
      mouseX: e.clientX,
      origStart: task.start_date,
      origEnd: task.end_date,
    };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.mouseX;
      const dayDelta = Math.round(deltaX / dayWidth);

      if (dayDelta === 0) return;

      const origStart = parseDate(dragStartRef.current.origStart);
      const origEnd = parseDate(dragStartRef.current.origEnd);

      if (mode === 'move') {
        const newStart = addDays(origStart, dayDelta);
        const newEnd = addDays(origEnd, dayDelta);
        updateTaskDates(task.id, formatDateStr(newStart), formatDateStr(newEnd));
      } else if (mode === 'resize-left') {
        const newStart = addDays(origStart, dayDelta);
        if (newStart <= origEnd) {
          updateTaskDates(task.id, formatDateStr(newStart), formatDateStr(origEnd));
        }
      } else if (mode === 'resize-right') {
        const newEnd = addDays(origEnd, dayDelta);
        if (newEnd >= origStart) {
          updateTaskDates(task.id, formatDateStr(origStart), formatDateStr(newEnd));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* Milestone Glyph (Royal Violet Diamond) */}
      {task.is_milestone ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTaskId(task.id);
          }}
          style={{
            position: 'absolute',
            left: `${leftPx + dayWidth / 2 - 10}px`,
            top: `${topPx + 2}px`,
            width: '20px',
            height: '20px',
          }}
          className={`cursor-pointer transition-transform hover:scale-125 z-20 group ${
            isDimmed ? 'opacity-25' : 'opacity-100'
          }`}
          title={`${task.title} (Milestone on ${task.start_date})`}
        >
          <div className="w-5 h-5 bg-violet-600 rotate-45 rounded-xs shadow-md border border-violet-300 flex items-center justify-center text-white">
            <span className="-rotate-45 text-[9px] font-bold font-mono">◆</span>
          </div>

          {/* Milestone tooltip label */}
          <div className="absolute left-6 top-0 hidden group-hover:flex items-center px-2 py-0.5 rounded bg-black/90 text-white font-mono text-[10px] whitespace-nowrap z-40 border border-violet-500/40">
            {task.title} ({task.start_date})
          </div>
        </div>
      ) : (
        /* Regular Task Capsule Bar */
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTaskId(task.id);
          }}
          style={{
            position: 'absolute',
            left: `${leftPx}px`,
            top: `${topPx}px`,
            width: `${widthPx}px`,
            height: '24px',
          }}
          className={`rounded-md shadow-xs select-none transition-opacity duration-200 cursor-grab active:cursor-grabbing z-10 ${
            getBarStyle()
          } ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-black' : ''} ${
            isCritical && showCriticalPath ? 'ring-2 ring-rose-500 shadow-glow-crimson' : ''
          } ${isDimmed ? 'opacity-20 hover:opacity-80' : 'opacity-100'}`}
        >
          {/* Progress fill shading */}
          {task.status !== 'blocked' && task.progress > 0 && task.progress < 100 && (
            <div
              className="absolute left-0 top-0 bottom-0 bg-blue-800/50 rounded-l-md pointer-events-none"
              style={{ width: `${task.progress}%` }}
            />
          )}

          {/* Bar Content */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            className="w-full h-full px-2 flex items-center justify-between overflow-hidden relative text-[11px] font-medium leading-none"
          >
            {/* Assignee Avatar & Task Name */}
            <div className="flex items-center gap-1.5 truncate">
              {assignee && (
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="w-3.5 h-3.5 rounded-full object-cover shrink-0 ring-1 ring-white/50"
                />
              )}
              <span className="truncate tracking-tight">{task.title}</span>
            </div>

            {/* Blocked or Progress indicator */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {task.status === 'blocked' ? (
                <ShieldAlert className="w-3 h-3 text-white" />
              ) : task.status === 'done' ? (
                <Check className="w-3 h-3 text-emerald-200 stroke-[3]" />
              ) : (
                <span className="font-mono text-[9px] opacity-80">{task.progress}%</span>
              )}
            </div>
          </div>

          {/* Left Resize Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
            className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/40 cursor-col-resize rounded-l-md"
            title="Drag to adjust Start Date"
          />

          {/* Right Resize Handle */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
            className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/40 cursor-col-resize rounded-r-md"
            title="Drag to adjust End Date"
          />

          {/* Circular Dependency Anchor Handles (visible on hover) */}
          {(isHovered || isDragging) && (
            <>
              {/* Incoming / Left Node (Successor target) */}
              <div
                onMouseEnter={() => onHoverTargetNode && onHoverTargetNode(task.id, 'target')}
                onMouseLeave={() => onHoverTargetNode && onHoverTargetNode(null, null)}
                className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shadow-sm hover:scale-125 transition-transform cursor-crosshair z-30"
                title="Connect upstream dependency here"
              />

              {/* Outgoing / Right Node (Predecessor source) */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartDragWire && onStartDragWire(task.id, e);
                }}
                className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shadow-sm hover:scale-125 transition-transform cursor-crosshair z-30"
                title="Click and drag wire to link downstream task"
              />
            </>
          )}

          {/* Baseline Variance Ghost Bar (Subtle ghost bar beneath active bar) */}
          {hasBaseline && (
            <div
              style={{
                position: 'absolute',
                left: `${baselineLeftPx - leftPx}px`,
                top: '27px',
                width: `${baselineWidthPx}px`,
                height: '4px',
              }}
              className="rounded-full bg-slate-400/40 dark:bg-slate-500/30 border border-slate-400/20 pointer-events-none"
              title={`Original Baseline: ${task.baseline_start} → ${task.baseline_end}`}
            />
          )}
        </div>
      )}

      {/* Multiplayer Ghost Drag Simulation Bar (Sarah dragging +2d) */}
      {collaboratorGhostDrag && collaboratorGhostDrag.taskId === task.id && (
        <div
          style={{
            position: 'absolute',
            left: `${leftPx + collaboratorGhostDrag.offsetDays * dayWidth}px`,
            top: `${topPx - 2}px`,
            width: `${widthPx}px`,
            height: '28px',
          }}
          className="rounded-md border-2 border-dashed border-blue-400 bg-blue-500/20 backdrop-blur-2xs shadow-lg pointer-events-none z-30 animate-pulse flex items-center justify-between px-2 text-[10px] text-blue-200"
        >
          <span className="font-mono font-semibold">
            👤 {collaboratorGhostDrag.userName} (+{collaboratorGhostDrag.offsetDays}d)
          </span>
          <span className="font-mono text-[9px] bg-blue-600 px-1 rounded text-white">Live</span>
        </div>
      )}
    </>
  );
}
