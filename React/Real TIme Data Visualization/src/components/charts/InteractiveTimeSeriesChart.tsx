import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { CausalEventPin, DeltaMeasurement, MetricId, TelemetryPoint } from '../../types/telemetry';
import { generateWhatIfProjection } from '../../engine/narrative';
import {
  Rocket,
  Megaphone,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  Camera,
  Layers,
  Sliders,
  MessageSquarePlus,
  X
} from 'lucide-react';

interface Props {
  metricId: MetricId;
  height?: number;
  showWhatIf?: boolean;
  onOpenWhatIf?: () => void;
  onOpenClip?: () => void;
  compact?: boolean;
}

export const InteractiveTimeSeriesChart: React.FC<Props> = ({
  metricId,
  height = 320,
  showWhatIf = true,
  onOpenWhatIf,
  onOpenClip,
  compact = false
}) => {
  const {
    getSeriesData,
    hoveredTimestamp,
    setHoveredTimestamp,
    setInspectionLocked,
    isInspectionLocked,
    bufferedTicksCount,
    causalEvents,
    setSelectedEvent,
    selectedEvent,
    hypothesisNotes,
    addHypothesis,
    whatIfScenario,
    deltaMeasurement,
    setDeltaMeasurement,
    theme
  } = useTelemetry();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Drag to measure state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragCurrentX, setDragCurrentX] = useState<number | null>(null);

  // Add hypothesis note state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTimestamp, setNoteTimestamp] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  // Active highlighted event from hover
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  const meta = METRIC_METAS[metricId];
  const rawData = getSeriesData(metricId, 160);

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 800,
          height: height
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [height]);

  // Compute Scales and Coordinates
  const margin = { top: 24, right: 28, bottom: 36, left: 56 };
  const chartWidth = Math.max(100, dimensions.width - margin.left - margin.right);
  const chartHeight = Math.max(100, dimensions.height - margin.top - margin.bottom);

  // Data ranges
  const { minVal, maxVal, minTime, maxTime, latestPoint } = useMemo(() => {
    if (rawData.length === 0) {
      return { minVal: 0, maxVal: 100, minTime: Date.now() - 60000, maxTime: Date.now(), latestPoint: undefined };
    }

    let min = Infinity;
    let max = -Infinity;

    rawData.forEach((d) => {
      min = Math.min(min, d.value, d.confidenceBandLow, d.baseline);
      max = Math.max(max, d.value, d.confidenceBandHigh, d.baseline);
    });

    const padding = (max - min) * 0.15 || 10;
    return {
      minVal: Math.max(0, min - padding),
      maxVal: max + padding,
      minTime: rawData[0].timestamp,
      maxTime: rawData[rawData.length - 1].timestamp,
      latestPoint: rawData[rawData.length - 1]
    };
  }, [rawData]);

  // What-If simulated curve
  const whatIfPoints = useMemo(() => {
    if (!whatIfScenario.active || !latestPoint) return [];
    return generateWhatIfProjection(latestPoint, whatIfScenario, 25, 45000);
  }, [whatIfScenario, latestPoint]);

  // Extend maxTime if whatIf is active
  const effectiveMaxTime = useMemo(() => {
    if (whatIfPoints.length > 0) {
      return whatIfPoints[whatIfPoints.length - 1].timestamp;
    }
    return maxTime;
  }, [whatIfPoints, maxTime]);

  // Coordinate conversion functions
  const getX = useCallback(
    (timestamp: number) => {
      if (effectiveMaxTime === minTime) return margin.left;
      return margin.left + ((timestamp - minTime) / (effectiveMaxTime - minTime)) * chartWidth;
    },
    [minTime, effectiveMaxTime, margin.left, chartWidth]
  );

  const getY = useCallback(
    (value: number) => {
      if (maxVal === minVal) return margin.top + chartHeight / 2;
      return margin.top + chartHeight - ((value - minVal) / (maxVal - minVal)) * chartHeight;
    },
    [minVal, maxVal, margin.top, chartHeight]
  );

  // Generate SVG Paths
  const { livePath, areaPath, baselinePath, confidenceBandPath, whatIfPath } = useMemo(() => {
    if (rawData.length < 2) {
      return { livePath: '', areaPath: '', baselinePath: '', confidenceBandPath: '', whatIfPath: '' };
    }

    // Live curve
    let lp = `M ${getX(rawData[0].timestamp)},${getY(rawData[0].value)}`;
    let bp = `M ${getX(rawData[0].timestamp)},${getY(rawData[0].baseline)}`;

    // Confidence band corridor (top polygon forward, bottom polygon backward)
    let bandTop = `M ${getX(rawData[0].timestamp)},${getY(rawData[0].confidenceBandHigh)}`;
    let bandBottom = '';

    for (let i = 1; i < rawData.length; i++) {
      const x = getX(rawData[i].timestamp);
      const y = getY(rawData[i].value);
      const by = getY(rawData[i].baseline);
      const bHigh = getY(rawData[i].confidenceBandHigh);
      const bLow = getY(rawData[i].confidenceBandLow);

      lp += ` L ${x},${y}`;
      bp += ` L ${x},${by}`;
      bandTop += ` L ${x},${bHigh}`;
      bandBottom = ` L ${x},${bLow}` + bandBottom;
    }

    // Complete confidence band polygon
    bandBottom = ` L ${getX(rawData[0].timestamp)},${getY(rawData[0].confidenceBandLow)} Z`;
    const confBand = bandTop + bandBottom;

    // Complete live area gradient path
    const lastX = getX(rawData[rawData.length - 1].timestamp);
    const firstX = getX(rawData[0].timestamp);
    const zeroY = getY(minVal);
    const ap = `${lp} L ${lastX},${zeroY} L ${firstX},${zeroY} Z`;

    // What-If projected path
    let wip = '';
    if (whatIfPoints.length > 0 && latestPoint) {
      wip = `M ${getX(latestPoint.timestamp)},${getY(latestPoint.value)}`;
      whatIfPoints.forEach((pt) => {
        wip += ` L ${getX(pt.timestamp)},${getY(pt.value)}`;
      });
    }

    return {
      livePath: lp,
      areaPath: ap,
      baselinePath: bp,
      confidenceBandPath: confBand,
      whatIfPath: wip
    };
  }, [rawData, whatIfPoints, latestPoint, getX, getY, minVal]);

  // Find point closest to mouse or hovered timestamp
  const activeHoverPoint = useMemo(() => {
    if (rawData.length === 0) return null;

    const targetTime = hoveredTimestamp;
    if (!targetTime && !mousePos) return null;

    let searchTime = targetTime;
    if (mousePos) {
      const relX = mousePos.x - margin.left;
      const ratio = Math.max(0, Math.min(1, relX / chartWidth));
      searchTime = minTime + ratio * (effectiveMaxTime - minTime);
    }

    if (!searchTime) return null;

    // Find closest item in rawData
    let closest = rawData[0];
    let minDiff = Math.abs(closest.timestamp - searchTime);

    for (let i = 1; i < rawData.length; i++) {
      const diff = Math.abs(rawData[i].timestamp - searchTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = rawData[i];
      }
    }

    return closest;
  }, [rawData, hoveredTimestamp, mousePos, minTime, effectiveMaxTime, chartWidth, margin.left]);

  // Handle Mouse Events for Hover-Freeze & Drag-to-Measure
  const handleMouseEnter = () => {
    setIsHovered(true);
    setInspectionLocked(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setInspectionLocked(false);
    setMousePos(null);
    setHoveredTimestamp(null);
    if (isDragging) {
      setIsDragging(false);
      setDragStartX(null);
      setDragCurrentX(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Broadcast hovered timestamp for magnetic crosshair
    const relX = x - margin.left;
    const ratio = Math.max(0, Math.min(1, relX / chartWidth));
    const timestamp = minTime + ratio * (effectiveMaxTime - minTime);
    setHoveredTimestamp(timestamp);

    if (isDragging && dragStartX !== null) {
      setDragCurrentX(x);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !containerRef.current) return; // Left click only
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Only allow drag inside chart area
    if (x >= margin.left && x <= margin.left + chartWidth) {
      setIsDragging(true);
      setDragStartX(x);
      setDragCurrentX(x);
      setDeltaMeasurement(null);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartX !== null && dragCurrentX !== null) {
      const diffX = Math.abs(dragCurrentX - dragStartX);
      if (diffX > 15) {
        // Legitimate span selected
        const leftX = Math.min(dragStartX, dragCurrentX);
        const rightX = Math.max(dragStartX, dragCurrentX);

        const leftRatio = (leftX - margin.left) / chartWidth;
        const rightRatio = (rightX - margin.left) / chartWidth;

        const startTime = minTime + leftRatio * (effectiveMaxTime - minTime);
        const endTime = minTime + rightRatio * (effectiveMaxTime - minTime);

        // Find nearest points
        const startPt = rawData.find((p) => p.timestamp >= startTime) || rawData[0];
        const endPt = [...rawData].reverse().find((p) => p.timestamp <= endTime) || rawData[rawData.length - 1];

        if (startPt && endPt) {
          const deltaVal = endPt.value - startPt.value;
          const deltaPct = startPt.value !== 0 ? (deltaVal / startPt.value) * 100 : 0;
          const durationMinutes = Math.max(0.1, (endPt.timestamp - startPt.timestamp) / 60000);

          // Find causal events in this span
          const eventsInSpan = causalEvents.filter(
            (ev) => ev.timestamp >= startPt.timestamp && ev.timestamp <= endPt.timestamp
          );

          setDeltaMeasurement({
            isActive: true,
            startX: leftX,
            endX: rightX,
            startTime: startPt.timestamp,
            endTime: endPt.timestamp,
            startVal: startPt.value,
            endVal: endPt.value,
            deltaVal,
            deltaPct,
            durationMinutes,
            eventsInSpan
          });
        }
      }
    }
    setIsDragging(false);
    setDragStartX(null);
    setDragCurrentX(null);
  };

  // Click on chart to drop hypothesis note
  const handleChartClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (deltaMeasurement || isDragging) return;
    if (!containerRef.current) return;

    // Only if user clicked with Alt key or clicked specifically
    if (e.altKey && activeHoverPoint) {
      setNoteTimestamp(activeHoverPoint.timestamp);
      setIsAddingNote(true);
    }
  };

  const submitHypothesisNote = () => {
    if (!noteText.trim()) return;
    addHypothesis(metricId, noteText.trim());
    setNoteText('');
    setIsAddingNote(false);
    setNoteTimestamp(null);
  };

  // Y-axis tick marks
  const yTicks = useMemo(() => {
    const ticksCount = 4;
    const ticks = [];
    for (let i = 0; i <= ticksCount; i++) {
      const val = minVal + (i / ticksCount) * (maxVal - minVal);
      ticks.push({
        value: val,
        y: getY(val),
        label: meta.format(val)
      });
    }
    return ticks;
  }, [minVal, maxVal, getY, meta]);

  // X-axis time ticks
  const xTicks = useMemo(() => {
    if (rawData.length === 0) return [];
    const ticksCount = Math.max(3, Math.floor(chartWidth / 140));
    const ticks = [];
    for (let i = 0; i < ticksCount; i++) {
      const time = minTime + (i / (ticksCount - 1)) * (effectiveMaxTime - minTime);
      const d = new Date(time);
      ticks.push({
        time,
        x: getX(time),
        label: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    }
    return ticks;
  }, [minTime, effectiveMaxTime, chartWidth, getX, rawData]);

  // Filter events that fall in the current time domain
  const visibleEvents = useMemo(() => {
    return causalEvents.filter(
      (ev) => ev.timestamp >= minTime && ev.timestamp <= effectiveMaxTime && ev.affectedMetrics.includes(metricId)
    );
  }, [causalEvents, minTime, effectiveMaxTime, metricId]);

  // Filter hypotheses notes that fall in time domain
  const visibleNotes = useMemo(() => {
    return hypothesisNotes.filter(
      (n) => n.timestamp >= minTime && n.timestamp <= effectiveMaxTime && n.metricId === metricId
    );
  }, [hypothesisNotes, minTime, effectiveMaxTime, metricId]);

  // Highlight corridor for hovered event
  const highlightedEventCorridor = useMemo(() => {
    const eventId = highlightedEventId || selectedEvent?.id;
    if (!eventId) return null;
    const ev = causalEvents.find((e) => e.id === eventId);
    if (!ev || ev.timestamp < minTime || ev.timestamp > effectiveMaxTime) return null;

    const startX = getX(ev.timestamp);
    // highlight post-event 5-minute window or until next event
    const postTime = Math.min(effectiveMaxTime, ev.timestamp + 5 * 60 * 1000);
    const endX = getX(postTime);
    return {
      x: startX,
      width: Math.max(24, endX - startX),
      event: ev
    };
  }, [highlightedEventId, selectedEvent, causalEvents, minTime, effectiveMaxTime, getX]);

  const activeCrosshairX = activeHoverPoint ? getX(activeHoverPoint.timestamp) : null;
  const activeCrosshairY = activeHoverPoint ? getY(activeHoverPoint.value) : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleChartClick}
    >
      {/* Auto-Freeze on Hover inspection indicator */}
      {isHovered && (
        <div className="absolute top-2 right-3 z-30 flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono bg-[#171B24]/90 dark:bg-[#171B24]/90 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-glass animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>⏸️ Stream Paused for Inspection — +{bufferedTicksCount} ticks buffered</span>
        </div>
      )}

      {/* SVG Canvas Stage */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible block w-full"
      >
        <defs>
          {/* Cyan Primary Gradient */}
          <linearGradient id={`gradient-${metricId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={meta.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={meta.color} stopOpacity="0.0" />
          </linearGradient>

          {/* What-If Projected Gradient */}
          <linearGradient id="gradient-what-if" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>

          {/* Anomaly Highlight Pattern */}
          <pattern id="anomaly-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="3" />
          </pattern>
        </defs>

        {/* Horizontal subtle grid lines */}
        {yTicks.map((tick, idx) => (
          <g key={`ytick-${idx}`} className="transition-opacity duration-200">
            <line
              x1={margin.left}
              y1={tick.y}
              x2={margin.left + chartWidth}
              y2={tick.y}
              stroke="currentColor"
              strokeDasharray="3 3"
              className="text-white/[0.06] dark:text-white/[0.06] text-slate-300"
            />
            <text
              x={margin.left - 8}
              y={tick.y + 4}
              textAnchor="end"
              className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 tabular-nums"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Shaded Confidence Band Corridor */}
        {confidenceBandPath && (
          <path
            d={confidenceBandPath}
            fill="currentColor"
            className="text-slate-400/[0.07] dark:text-slate-400/[0.07]"
          />
        )}

        {/* Post-Event Trajectory Highlight Corridor */}
        {highlightedEventCorridor && (
          <g>
            <rect
              x={highlightedEventCorridor.x}
              y={margin.top}
              width={highlightedEventCorridor.width}
              height={chartHeight}
              fill="rgba(56, 189, 248, 0.08)"
              className="animate-fade-in"
            />
            <line
              x1={highlightedEventCorridor.x}
              y1={margin.top}
              x2={highlightedEventCorridor.x}
              y2={margin.top + chartHeight}
              stroke={highlightedEventCorridor.event.color}
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </g>
        )}

        {/* Drag-to-Measure Selected Span Rectangle */}
        {isDragging && dragStartX !== null && dragCurrentX !== null && (
          <rect
            x={Math.min(dragStartX, dragCurrentX)}
            y={margin.top}
            width={Math.abs(dragCurrentX - dragStartX)}
            height={chartHeight}
            fill="rgba(56, 189, 248, 0.16)"
            stroke="rgba(56, 189, 248, 0.6)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        )}

        {/* Active Delta Measurement Rectangle */}
        {deltaMeasurement && deltaMeasurement.isActive && (
          <g className="animate-fade-in">
            <rect
              x={deltaMeasurement.startX}
              y={margin.top}
              width={deltaMeasurement.endX - deltaMeasurement.startX}
              height={chartHeight}
              fill="rgba(56, 189, 248, 0.14)"
              stroke="rgba(56, 189, 248, 0.7)"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* Primary Area Fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#gradient-${metricId})`}
          />
        )}

        {/* Contextual Baseline Ghost Line (dashed shadow curve for "Typical Tuesday") */}
        {baselinePath && (
          <path
            d={baselinePath}
            fill="none"
            stroke="rgba(148, 163, 184, 0.38)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="transition-all duration-300"
          />
        )}

        {/* Primary Live Metric Curve */}
        {livePath && (
          <path
            d={livePath}
            fill="none"
            stroke={meta.color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-150"
          />
        )}

        {/* What-If Projected Dotted Forecast Curve */}
        {whatIfPath && (
          <path
            d={whatIfPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            className="animate-pulse-subtle"
          />
        )}

        {/* Live endpoint pulsing dot */}
        {latestPoint && !isHovered && (
          <g transform={`translate(${getX(latestPoint.timestamp)}, ${getY(latestPoint.value)})`}>
            <circle r="7" fill={meta.color} opacity="0.3" className="animate-ping" />
            <circle r="4" fill={meta.color} stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        )}

        {/* X-axis Ticks */}
        {xTicks.map((tick, idx) => (
          <g key={`xtick-${idx}`} transform={`translate(${tick.x}, ${margin.top + chartHeight + 18})`}>
            <line y1="-18" y2="-12" stroke="currentColor" className="text-white/20 dark:text-white/20 text-slate-400" />
            <text
              textAnchor="middle"
              className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500 tabular-nums"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Causal Event Pins along Timeline */}
        {visibleEvents.map((ev) => {
          const pinX = getX(ev.timestamp);
          const isSelected = selectedEvent?.id === ev.id;
          return (
            <g
              key={ev.id}
              transform={`translate(${pinX}, ${margin.top + chartHeight + 2})`}
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(isSelected ? null : ev);
              }}
              onMouseEnter={() => setHighlightedEventId(ev.id)}
              onMouseLeave={() => setHighlightedEventId(null)}
            >
              {/* Event vertical line */}
              <line
                y1={-chartHeight}
                y2="0"
                stroke={ev.color}
                strokeWidth={isSelected ? '2' : '1'}
                strokeDasharray={isSelected ? 'none' : '3 3'}
                opacity={isSelected ? 0.9 : 0.5}
              />
              {/* Milestone Pill Pin */}
              <circle
                r="4.5"
                fill={ev.color}
                stroke="#090B0E"
                strokeWidth="2"
                className="transition-transform group-hover:scale-125"
              />
            </g>
          );
        })}

        {/* Hypothesis Sticky Note Markers */}
        {visibleNotes.map((note) => {
          const noteX = getX(note.timestamp);
          return (
            <g
              key={note.id}
              transform={`translate(${noteX}, ${margin.top + 10})`}
              className="cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                alert(`Hypothesis Note by ${note.author} (${new Date(note.timestamp).toLocaleTimeString()}):\n\n"${note.note}"`);
              }}
            >
              <line y1="0" y2={chartHeight - 10} stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              <rect x="-10" y="-12" width="20" height="14" rx="3" fill="#F59E0B" className="shadow-md" />
              <text x="0" y="-2" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#090B0E">
                {note.avatar}
              </text>
            </g>
          );
        })}

        {/* Magnetic Crosshair & Active Point Intersection */}
        {activeCrosshairX !== null && activeCrosshairY !== null && activeHoverPoint && (
          <g className="pointer-events-none">
            {/* Vertical crosshair line */}
            <line
              x1={activeCrosshairX}
              y1={margin.top}
              x2={activeCrosshairX}
              y2={margin.top + chartHeight}
              stroke="rgba(248, 250, 252, 0.45)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            {/* Glowing intersection ring */}
            <circle
              cx={activeCrosshairX}
              cy={activeCrosshairY}
              r="6"
              fill={meta.color}
              stroke="#FFFFFF"
              strokeWidth="2"
              className="shadow-glow-cyan"
            />
            {/* Baseline ghost intersection dot */}
            <circle
              cx={activeCrosshairX}
              cy={getY(activeHoverPoint.baseline)}
              r="3.5"
              fill="rgba(148, 163, 184, 0.9)"
            />
          </g>
        )}
      </svg>

      {/* Floating Glass Tooltip HUD (Follows magnetic cursor) */}
      {isHovered && activeHoverPoint && activeCrosshairX !== null && (
        <div
          className="absolute z-40 pointer-events-none transition-all duration-75"
          style={{
            left: Math.min(dimensions.width - 240, Math.max(margin.left, activeCrosshairX - 110)),
            top: Math.max(8, (activeCrosshairY || margin.top + 40) - 100)
          }}
        >
          <div className="bg-[#11141B]/95 dark:bg-[#11141B]/95 text-white p-3 rounded-xl border border-white/10 shadow-glass backdrop-blur-xl text-xs w-[220px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {activeHoverPoint.timeLabel}
              </span>
              {activeHoverPoint.isAnomaly && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ANOMALY
                </span>
              )}
            </div>

            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  Live Value:
                </span>
                <span className="font-bold text-white tabular-nums">
                  {meta.format(activeHoverPoint.value)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-0.5 bg-slate-400 border-t border-dashed" />
                  Tuesday Baseline:
                </span>
                <span className="tabular-nums">{meta.format(activeHoverPoint.baseline)}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                <span className="text-slate-400">Variance:</span>
                <span
                  className={`tabular-nums font-semibold ${
                    activeHoverPoint.value >= activeHoverPoint.baseline ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {activeHoverPoint.value >= activeHoverPoint.baseline ? '+' : ''}
                  {(
                    ((activeHoverPoint.value - activeHoverPoint.baseline) / activeHoverPoint.baseline) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Measurement Summary Pill (Drag-to-Measure) */}
      {deltaMeasurement && deltaMeasurement.isActive && (
        <div
          className="absolute z-50 transition-all"
          style={{
            left: Math.min(
              dimensions.width - 280,
              Math.max(margin.left, (deltaMeasurement.startX + deltaMeasurement.endX) / 2 - 130)
            ),
            top: margin.top + 8
          }}
        >
          <div className="bg-[#171B24] dark:bg-[#171B24] border border-sky-400/50 rounded-xl p-2.5 shadow-glass backdrop-blur-xl text-xs flex items-center gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-mono font-bold text-sky-300">
                <span>{deltaMeasurement.deltaPct >= 0 ? '▲ +' : '▼ '}</span>
                <span>{deltaMeasurement.deltaPct.toFixed(1)}%</span>
                <span className="text-slate-400 font-normal">
                  ({meta.format(Math.abs(deltaMeasurement.deltaVal))} change)
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Across {deltaMeasurement.durationMinutes.toFixed(1)} mins
                {deltaMeasurement.eventsInSpan.length > 0 &&
                  ` • ${deltaMeasurement.eventsInSpan.length} events inside span`}
              </div>
            </div>
            <button
              onClick={() => setDeltaMeasurement(null)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
              title="Dismiss Measurement"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Causal Event Milestone Pills Bar (Bottom timeline) */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 px-4 overflow-x-auto py-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Info size={11} /> Causal Pins:
        </span>
        {causalEvents.map((ev) => {
          const isSelected = selectedEvent?.id === ev.id;
          return (
            <button
              key={ev.id}
              onClick={() => setSelectedEvent(isSelected ? null : ev)}
              onMouseEnter={() => setHighlightedEventId(ev.id)}
              onMouseLeave={() => setHighlightedEventId(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-sky-500/20 text-sky-200 border-sky-400/60 shadow-glow-cyan'
                  : 'bg-slate-800/60 dark:bg-slate-800/60 text-slate-300 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
              <span>{ev.badge}</span>
            </button>
          );
        })}

        {/* Add Hypothesis Note Pill */}
        <button
          onClick={() => {
            const note = prompt('Enter your hypothesis or experiment note (e.g. "Switched CTA copy here"):');
            if (note) {
              addHypothesis(metricId, note);
            }
          }}
          className="px-2 py-1 rounded-full text-xs font-mono text-amber-300/80 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1 ml-auto"
        >
          <MessageSquarePlus size={12} />
          <span>+ Pin Hypothesis</span>
        </button>
      </div>

      {/* Selected Causal Event Modal / Callout */}
      {selectedEvent && (
        <div className="mt-2.5 mx-4 p-3 rounded-xl bg-slate-900/90 border border-sky-500/30 flex items-start justify-between gap-3 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300">
                {selectedEvent.category}
              </span>
              <span className="text-xs font-semibold text-white">{selectedEvent.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(selectedEvent.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-xs text-slate-300">{selectedEvent.details}</p>
            <div className="text-[11px] font-mono text-emerald-400 font-medium">
              Impact: {selectedEvent.impactSummary}
            </div>
          </div>
          <button
            onClick={() => setSelectedEvent(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
