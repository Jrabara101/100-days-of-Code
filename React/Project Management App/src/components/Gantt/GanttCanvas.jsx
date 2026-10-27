import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { addDays, diffDays, formatDateStr, isWeekend, parseDate } from '../../utils/dateHelpers';
import GanttTaskBar from './GanttTaskBar';
import GanttDependencyOverlay from './GanttDependencyOverlay';

export default function GanttCanvas({ verticalScrollRef, onScroll }) {
  const {
    tasks,
    dependencies,
    zoomLevel,
    addDependency,
  } = useProject();

  const canvasContainerRef = useRef(null);
  const [dragWireState, setDragWireState] = useState(null);
  const [hoveredTargetNode, setHoveredTargetNode] = useState(null);

  // Set timeline bounds
  const timelineStartDate = '2026-10-12';
  const totalDays = 48; // spans into late November

  // Pixel width per day based on zoom
  const dayWidth = useMemo(() => {
    switch (zoomLevel) {
      case 'week':
        return 28;
      case 'month':
        return 18;
      default: // 'day'
        return 48;
    }
  }, [zoomLevel]);

  const totalWidth = totalDays * dayWidth;
  const rowHeight = 36;

  // Generate array of calendar days
  const daysArray = useMemo(() => {
    const list = [];
    const start = parseDate(timelineStartDate);
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(start, i);
      const dateStr = formatDateStr(d);
      list.push({
        index: i,
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        isWeekend: isWeekend(d),
      });
    }
    return list;
  }, [totalDays]);

  // Group days into Months for the top header tier
  const monthGroups = useMemo(() => {
    const groups = [];
    let currentMonth = -1;
    let currentGroup = null;

    daysArray.forEach((day, idx) => {
      const month = day.date.getMonth();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      if (month !== currentMonth) {
        currentMonth = month;
        currentGroup = {
          name: `${monthNames[month]} ${day.date.getFullYear()}`,
          startIndex: idx,
          count: 1,
        };
        groups.push(currentGroup);
      } else {
        currentGroup.count++;
      }
    });

    return groups;
  }, [daysArray]);

  // Flatten tasks to determine their exact visual row index (matching left TaskTree)
  const { visibleTasks, taskRowIndices } = useMemo(() => {
    // Collect phases in consistent order
    const phasesMap = new Map();
    tasks.forEach(t => {
      const phase = t.phase || 'General Phase';
      if (!phasesMap.has(phase)) phasesMap.set(phase, []);
      phasesMap.get(phase).push(t);
    });

    const visible = [];
    const indices = {};
    let currentRow = 0;

    phasesMap.forEach((phaseTasks) => {
      currentRow++; // Row for the Phase Header in the left tree
      phaseTasks.forEach(task => {
        visible.push(task);
        indices[task.id] = currentRow;
        currentRow++;
      });
    });

    return { visibleTasks: visible, taskRowIndices: indices };
  }, [tasks]);

  const totalCanvasHeight = (Object.keys(taskRowIndices).length + 6) * rowHeight;

  // "Today" line calculation
  // Let's set project "Today" simulation to 2026-10-23
  const simulatedToday = '2026-10-23';
  const todayOffset = diffDays(timelineStartDate, simulatedToday);
  const todayLeftPx = todayOffset * dayWidth + dayWidth / 2;

  // Start dragging a dependency wire from a task node
  const handleStartDragWire = (sourceTaskId, e) => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const scrollLeft = canvasContainerRef.current.scrollLeft;
    const scrollTop = canvasContainerRef.current.scrollTop;

    const mouseX = e.clientX - rect.left + scrollLeft;
    const mouseY = e.clientY - rect.top + scrollTop;

    setDragWireState({
      sourceTaskId,
      fromCoords: { x: mouseX, y: mouseY },
      currentCoords: { x: mouseX, y: mouseY },
      snapped: false,
    });
  };

  // Track mouse movements during wire dragging
  useEffect(() => {
    if (!dragWireState) return;

    const handleMouseMove = (e) => {
      if (!canvasContainerRef.current) return;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const scrollLeft = canvasContainerRef.current.scrollLeft;
      const scrollTop = canvasContainerRef.current.scrollTop;

      let currentX = e.clientX - rect.left + scrollLeft;
      let currentY = e.clientY - rect.top + scrollTop;
      let snapped = false;

      // If hovering near a target node, snap magnetically
      if (hoveredTargetNode && hoveredTargetNode.taskId !== dragWireState.sourceTaskId) {
        const targetRow = taskRowIndices[hoveredTargetNode.taskId];
        const targetTask = tasks.find(t => t.id === hoveredTargetNode.taskId);
        if (targetRow !== undefined && targetTask) {
          const targetOffset = diffDays(timelineStartDate, targetTask.start_date);
          currentX = targetOffset * dayWidth;
          currentY = targetRow * rowHeight + rowHeight / 2;
          snapped = true;
        }
      }

      setDragWireState(prev => (prev ? { ...prev, currentCoords: { x: currentX, y: currentY }, snapped } : null));
    };

    const handleMouseUp = () => {
      if (dragWireState && hoveredTargetNode && hoveredTargetNode.taskId !== dragWireState.sourceTaskId) {
        addDependency(dragWireState.sourceTaskId, hoveredTargetNode.taskId);
      }
      setDragWireState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragWireState, hoveredTargetNode, dayWidth, timelineStartDate, taskRowIndices, tasks, addDependency]);

  return (
    <div
      ref={canvasContainerRef}
      className="flex-1 overflow-x-auto overflow-y-hidden bg-[#FFFFFF] dark:bg-[#0B0C0E] select-none relative transition-colors"
    >
      {/* Scrollable Stage Container */}
      <div
        style={{ width: `${totalWidth}px`, minWidth: '100%' }}
        className="flex flex-col h-full relative"
      >
        {/* TWO-TIER STICKY TIME HEADER (h-14: 56px total) */}
        <div className="sticky top-0 z-20 bg-slate-50 dark:bg-[#0B0C0E] border-b border-[#E2E8F0] dark:border-[#22252B] shrink-0 shadow-2xs">
          {/* Top Tier: Months */}
          <div className="h-6 flex border-b border-slate-200/60 dark:border-[#1e2127]">
            {monthGroups.map((group, idx) => (
              <div
                key={idx}
                style={{ width: `${group.count * dayWidth}px` }}
                className="px-3 flex items-center text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono tracking-wide border-r border-slate-200/60 dark:border-[#1e2127]"
              >
                {group.name}
              </div>
            ))}
          </div>

          {/* Bottom Tier: Days */}
          <div className="h-8 flex">
            {daysArray.map((day) => (
              <div
                key={day.dateStr}
                style={{ width: `${dayWidth}px` }}
                className={`flex flex-col items-center justify-center border-r border-slate-100 dark:border-[#181A1F] text-[10px] font-mono leading-tight ${
                  day.isWeekend
                    ? 'bg-slate-100/60 dark:bg-white/[0.02] text-slate-400 dark:text-slate-600'
                    : 'text-slate-600 dark:text-slate-400'
                } ${day.dateStr === simulatedToday ? 'bg-rose-500/10 font-bold text-rose-500' : ''}`}
              >
                <span>{day.dayNumber}</span>
                <span className="text-[9px] opacity-70">{day.dayName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2D GANTT CANVAS BODY (Synchronized vertical scroll with Left Tree) */}
        <div
          ref={verticalScrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
          style={{ height: 'calc(100% - 56px)' }}
        >
          {/* Full-height canvas background grid */}
          <div
            style={{ width: `${totalWidth}px`, height: `${totalCanvasHeight}px` }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Vertical day columns & weekend shading */}
            <div className="absolute inset-0 flex">
              {daysArray.map((day) => (
                <div
                  key={day.dateStr}
                  style={{ width: `${dayWidth}px` }}
                  className={`h-full border-r border-slate-100 dark:border-[#14161a] ${
                    day.isWeekend ? 'bg-slate-100/40 dark:bg-white/[0.015]' : ''
                  }`}
                />
              ))}
            </div>

            {/* Horizontal 36px row lines */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(to bottom, transparent ${rowHeight - 1}px, rgba(148, 163, 184, 0.08) ${rowHeight}px)`,
                backgroundSize: `100% ${rowHeight}px`,
              }}
            />

            {/* "Today" Marker Line spanning full canvas height */}
            <div
              style={{ left: `${todayLeftPx}px` }}
              className="absolute top-0 bottom-0 w-[1.5px] bg-rose-500 z-20 pointer-events-none shadow-glow-crimson"
            >
              <div className="sticky top-1 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold shadow-md uppercase tracking-wider">
                Today
              </div>
            </div>
          </div>

          {/* SVG Dependency Overlay */}
          <GanttDependencyOverlay
            tasks={visibleTasks}
            dependencies={dependencies}
            timelineStartDate={timelineStartDate}
            dayWidth={dayWidth}
            rowHeight={rowHeight}
            taskRowIndices={taskRowIndices}
            dragWireState={dragWireState}
          />

          {/* Task Bars Layer */}
          <div
            style={{ width: `${totalWidth}px`, height: `${totalCanvasHeight}px` }}
            className="relative"
          >
            {visibleTasks.map((task) => {
              const rowIndex = taskRowIndices[task.id];
              if (rowIndex === undefined) return null;

              return (
                <GanttTaskBar
                  key={task.id}
                  task={task}
                  timelineStartDate={timelineStartDate}
                  dayWidth={dayWidth}
                  rowHeight={rowHeight}
                  rowIndex={rowIndex}
                  onStartDragWire={handleStartDragWire}
                  onHoverTargetNode={(taskId, type) => setHoveredTargetNode(taskId ? { taskId, type } : null)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
