import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PIXELS_PER_METER } from '../engine/Vehicle.js';
import { ArcTrack, StraightTrack } from '../engine/RoadGeometry.js';

export function SimulationCanvas({
  engine,
  visualOptions = { showHeatmap: false, showHeadways: true, showStopLines: true },
  onSelectVehicle,
  selectedVehicleId
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Camera pan & zoom state
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1.0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Speed-to-Color Heatmap helper (Green = Fast, Yellow = Moderate, Red = Stalled/Shockwave)
  const getSpeedHeatmapColor = (speedKmh, maxSpeedKmh = 90) => {
    const ratio = Math.max(0, Math.min(1, speedKmh / maxSpeedKmh));
    if (ratio < 0.25) return '#ef4444'; // Red (Stalled / Shockwave)
    if (ratio < 0.55) return '#f59e0b'; // Amber / Yellow (Congested)
    if (ratio < 0.8) return '#38bdf8';  // Light Blue
    return '#10b981';                   // Green (Free Flow)
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(width / 2 + camera.x, height / 2 + camera.y);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-engine.canvasWidth / 2, -engine.canvasHeight / 2);

    // 1. DRAW SCENARIO ENVIRONMENT / ROADS
    drawRoadNetwork(ctx, engine);

    // 2. DRAW TRAFFIC LIGHTS & STOP LINES
    if (visualOptions.showStopLines && engine.trafficLight) {
      drawTrafficSignals(ctx, engine);
    }

    // 3. DRAW HEADWAY VECTORS (Optional)
    if (visualOptions.showHeadways) {
      drawHeadwayVectors(ctx, engine);
    }

    // 4. DRAW VEHICLES
    drawVehicles(ctx, engine, visualOptions, selectedVehicleId);

    // 5. DRAW BOTTLENECK CONES (If applicable)
    if (engine.bottleneck) {
      drawBottleneckBarriers(ctx, engine);
    }

    ctx.restore();
  }, [engine, camera, visualOptions, selectedVehicleId]);

  // Main Animation Loop
  useEffect(() => {
    let animId;
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      engine.step(dt);
      render();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine, render]);

  // Resize Canvas to Match Container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
        engine.canvasWidth = clientWidth;
        engine.canvasHeight = clientHeight;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [engine]);

  // Mouse Interactivity: Pan, Zoom, Click-to-Select
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - camera.x, y: e.clientY - camera.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingRef.current) {
      setCamera(prev => ({
        ...prev,
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      }));
    }
  };

  const handleMouseUp = (e) => {
    if (isDraggingRef.current) {
      const movedDist = Math.hypot(e.clientX - dragStartRef.current.x - camera.x, e.clientY - dragStartRef.current.y - camera.y);
      isDraggingRef.current = false;

      // If clicked without dragging, perform hit-test on vehicles
      if (movedDist < 5) {
        handleCanvasClick(e);
      }
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setCamera(prev => ({
      ...prev,
      zoom: Math.max(0.4, Math.min(3.0, prev.zoom * zoomFactor))
    }));
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click position to world coordinates
    const worldX = (clickX - (canvas.width / 2 + camera.x)) / camera.zoom + engine.canvasWidth / 2;
    const worldY = (clickY - (canvas.height / 2 + camera.y)) / camera.zoom + engine.canvasHeight / 2;

    // Find nearest vehicle
    let clickedId = null;
    let minDistance = 25; // Hit radius (pixels)

    for (let i = 0; i < engine.vehicles.length; i++) {
      const v = engine.vehicles[i];
      const tf = engine.getVehicleWorldTransform(v);
      const dist = Math.hypot(tf.x - worldX, tf.y - worldY);
      if (dist < minDistance) {
        minDistance = dist;
        clickedId = v.id;
      }
    }

    onSelectVehicle(clickedId);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-cyber-950">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="cursor-grab active:cursor-grabbing w-full h-full block"
      />

      {/* Camera Reset Pill */}
      <button
        onClick={() => setCamera({ x: 0, y: 0, zoom: 1.0 })}
        className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-lg glass-panel text-[11px] font-mono text-sky-400 hover:text-sky-300 hover:border-sky-400/40 transition-all flex items-center gap-1.5 shadow-lg"
      >
        <span>🎯 Reset View</span>
        <span className="text-slate-500">({Math.round(camera.zoom * 100)}%)</span>
      </button>
    </div>
  );
}

// ----------------------------------------------------
// CANVAS DRAWING HELPER ROUTINES
// ----------------------------------------------------

function drawRoadNetwork(ctx, engine) {
  const rw = engine.scenarioConfig?.roadWidth || 40;

  ctx.fillStyle = '#0f172a'; // Asphalt dark slate
  ctx.strokeStyle = '#1e293b';

  // Draw Ring Road
  if (engine.tracks.ring) {
    const ring = engine.tracks.ring;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.radiusPx, 0, Math.PI * 2);
    ctx.lineWidth = rw;
    ctx.strokeStyle = '#111c34';
    ctx.stroke();

    // Outer and Inner Road Curbs
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.radiusPx - rw / 2, 0, Math.PI * 2);
    ctx.arc(ring.cx, ring.cy, ring.radiusPx + rw / 2, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.stroke();

    // Center Dashed Lane Marker
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.radiusPx, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#facc15';
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw Roundabout
  if (engine.tracks.RING) {
    const ring = engine.tracks.RING;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.radiusPx, 0, Math.PI * 2);
    ctx.lineWidth = rw;
    ctx.strokeStyle = '#111c34';
    ctx.stroke();

    // Central Island Grass/Concrete
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, ring.radiusPx - rw / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#09152a';
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Draw Straight Roads (Intersections, Highways, Roundabout Approaches)
  Object.values(engine.tracks).forEach(track => {
    if (track instanceof StraightTrack) {
      ctx.beginPath();
      ctx.moveTo(track.x1, track.y1);
      ctx.lineTo(track.x2, track.y2);
      ctx.lineWidth = rw;
      ctx.strokeStyle = '#111c34';
      ctx.stroke();

      // Road boundary borders
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.stroke();

      // Dashed lane divider
      ctx.beginPath();
      ctx.moveTo(track.x1, track.y1);
      ctx.lineTo(track.x2, track.y2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.setLineDash([10, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Crosswalk / Intersection Center Box Highlight
  if (engine.scenarioConfig?.scenarioType === 'intersection') {
    const cx = engine.canvasWidth / 2;
    const cy = engine.canvasHeight / 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - rw / 2, cy - rw / 2, rw, rw);
  }
}

function drawTrafficSignals(ctx, engine) {
  const tf = engine.trafficLight;
  if (!tf) return;

  const cx = engine.canvasWidth / 2;
  const cy = engine.canvasHeight / 2;
  const rw = engine.scenarioConfig?.roadWidth || 54;

  const drawSignalHead = (x, y, state, label) => {
    ctx.save();
    ctx.fillStyle = '#090f1d';
    ctx.fillRect(x - 8, y - 8, 16, 16);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 8, y - 8, 16, 16);

    let bulbColor = '#ef4444';
    let glow = 'rgba(239, 68, 68, 0.6)';
    if (state === 'GREEN') { bulbColor = '#10b981'; glow = 'rgba(16, 185, 129, 0.8)'; }
    if (state === 'YELLOW') { bulbColor = '#f59e0b'; glow = 'rgba(245, 158, 11, 0.8)'; }

    // Bulb Glow
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = bulbColor;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const nsState = tf.getLaneSignalState('NS_SOUTHBOUND');
  const ewState = tf.getLaneSignalState('EW_EASTBOUND');

  // North, South, West, East Signal Posts
  drawSignalHead(cx - rw / 2 - 14, cy - rw / 2 - 14, nsState, 'N');
  drawSignalHead(cx + rw / 2 + 14, cy + rw / 2 + 14, nsState, 'S');
  drawSignalHead(cx - rw / 2 - 14, cy + rw / 2 + 14, ewState, 'W');
  drawSignalHead(cx + rw / 2 + 14, cy - rw / 2 - 14, ewState, 'E');

  // Draw White Stop Lines on Asphalt
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 3;
  // NS Stop lines
  ctx.beginPath();
  ctx.moveTo(cx, cy - rw / 2 - 10); ctx.lineTo(cx + rw / 2, cy - rw / 2 - 10);
  ctx.moveTo(cx - rw / 2, cy + rw / 2 + 10); ctx.lineTo(cx, cy + rw / 2 + 10);
  // EW Stop lines
  ctx.moveTo(cx - rw / 2 - 10, cy); ctx.lineTo(cx - rw / 2 - 10, cy + rw / 2);
  ctx.moveTo(cx + rw / 2 + 10, cy - rw / 2); ctx.lineTo(cx + rw / 2 + 10, cy);
  ctx.stroke();
}

function drawHeadwayVectors(ctx, engine) {
  for (let i = 0; i < engine.vehicles.length; i++) {
    const v = engine.vehicles[i];
    if (v.actualHeadway > 0 && v.actualHeadway < 40) {
      const tf1 = engine.getVehicleWorldTransform(v);
      const targetS = v.s + v.actualHeadway;
      const track = engine.tracks[v.laneId];
      if (track) {
        const tf2 = track.getTransform(targetS, v.lateralOffset);
        ctx.beginPath();
        ctx.moveTo(tf1.x, tf1.y);
        ctx.lineTo(tf2.x, tf2.y);
        ctx.strokeStyle = v.isBraking ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
}

function drawVehicles(ctx, engine, visualOptions, selectedVehicleId) {
  for (let i = 0; i < engine.vehicles.length; i++) {
    const v = engine.vehicles[i];
    const tf = engine.getVehicleWorldTransform(v);

    const lengthPx = v.getPixelLength();
    const widthPx = v.getPixelWidth();
    const isSelected = v.id === selectedVehicleId;

    ctx.save();
    ctx.translate(tf.x, tf.y);
    ctx.rotate(tf.angle);

    // 1. Vehicle Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-lengthPx / 2 + 2, -widthPx / 2 + 2, lengthPx, widthPx);

    // 2. Body Color
    let bodyColor = v.color;
    if (visualOptions.showHeatmap) {
      bodyColor = visualOptions.getHeatmapColor ? visualOptions.getHeatmapColor(v.getSpeedKmh()) : '#38bdf8';
    }

    if (v.isStalled) {
      bodyColor = '#475569'; // Stalled grey
    }

    // Vehicle Chassis
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-lengthPx / 2, -widthPx / 2, lengthPx, widthPx, 3);
    ctx.fill();

    // Chassis Stroke
    ctx.strokeStyle = isSelected ? '#00f0ff' : 'rgba(15, 23, 42, 0.8)';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    // 3. Windshield & Roof Design
    ctx.fillStyle = '#090f1d';
    ctx.fillRect(-lengthPx / 6, -widthPx / 2 + 1.5, lengthPx / 2.5, widthPx - 3);

    // 4. Headlights (White-Cyan Beam)
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(lengthPx / 2 - 1, -widthPx / 2 + 1, 2, 2.5);
    ctx.fillRect(lengthPx / 2 - 1, widthPx / 2 - 3.5, 2, 2.5);

    // 5. Red Brake Lights (Intense Glow when decelerating via IDM)
    if (v.isBraking || v.isStalled) {
      ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-lengthPx / 2 - 1.5, -widthPx / 2 + 1, 2.5, 2.5);
      ctx.fillRect(-lengthPx / 2 - 1.5, widthPx / 2 - 3.5, 2.5, 2.5);
    }

    // 6. Hazard / Turn Blinkers (Amber)
    if (v.blinker) {
      const isBlinkOn = Math.floor(performance.now() / 250) % 2 === 0;
      if (isBlinkOn) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
        ctx.shadowBlur = 6;
        if (v.blinker === 'left' || v.blinker === 'hazard') {
          ctx.fillRect(-lengthPx / 2, -widthPx / 2 - 1, 2, 2);
          ctx.fillRect(lengthPx / 2 - 2, -widthPx / 2 - 1, 2, 2);
        }
        if (v.blinker === 'right' || v.blinker === 'hazard') {
          ctx.fillRect(-lengthPx / 2, widthPx / 2 - 1, 2, 2);
          ctx.fillRect(lengthPx / 2 - 2, widthPx / 2 - 1, 2, 2);
        }
      }
    }

    // 7. Selection Reticle
    if (isSelected) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-lengthPx / 2 - 6, -widthPx / 2 - 6, lengthPx + 12, widthPx + 12);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}

function drawBottleneckBarriers(ctx, engine) {
  const b = engine.bottleneck;
  const track = engine.tracks[b.laneId];
  if (!track) return;

  const tf = track.getTransform(b.dropPointMeters);

  ctx.save();
  ctx.translate(tf.x, tf.y);
  ctx.rotate(tf.angle);

  // Draw construction striped barrier
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-4, -14, 8, 28);
  ctx.strokeStyle = '#090f1d';
  ctx.lineWidth = 2;
  ctx.strokeRect(-4, -14, 8, 28);

  ctx.fillStyle = '#090f1d';
  ctx.beginPath();
  ctx.moveTo(-4, -14); ctx.lineTo(4, -6); ctx.lineTo(4, -14); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-4, 0); ctx.lineTo(4, 8); ctx.lineTo(4, 0); ctx.lineTo(-4, -8); ctx.fill();

  ctx.restore();
}
