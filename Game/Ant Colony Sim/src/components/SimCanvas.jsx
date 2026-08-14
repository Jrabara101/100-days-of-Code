import React, { useRef, useEffect, useState } from 'react';
import { LIFE_STAGES } from '../engine/antEntity.js';

export default function SimCanvas({
  sim,
  activeTool,
  pheromoneFilters,
  onSelectEntity,
  camera,
  setCamera,
  setCanvasSize
}) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCanvasSize]);

  // Main Render Loop
  useEffect(() => {
    let animationFrameId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      // Clear Screen
      ctx.clearRect(0, 0, w, h);

      // Camera Transformation
      ctx.save();
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.x, -camera.y);

      // Viewport bounds
      const viewX = camera.x;
      const viewY = camera.y;
      const viewW = w / camera.zoom;
      const viewH = h / camera.zoom;

      // 1. Render Subsoil Terrain Background
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, sim.worldWidth, sim.worldHeight);

      // Terrain Grid pattern
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const step = 80;
      for (let x = 0; x < sim.worldWidth; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, sim.worldHeight);
        ctx.stroke();
      }
      for (let y = 0; y < sim.worldHeight; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(sim.worldWidth, y);
        ctx.stroke();
      }

      // 2. Render Nest Mound and Chambers
      const nest = sim.nest;
      // Underground Chamber tunnels
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      nest.chambers.forEach(ch => {
        ctx.beginPath();
        ctx.moveTo(nest.x, nest.y);
        ctx.lineTo(ch.x, ch.y);
        ctx.stroke();
      });

      // Chambers
      nest.chambers.forEach(ch => {
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(ch.x, ch.y, ch.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.beginPath();
        ctx.arc(ch.x, ch.y, ch.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Central Nest Mound
      ctx.fillStyle = '#311042';
      ctx.beginPath();
      ctx.arc(nest.x, nest.y, nest.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#090514';
      ctx.beginPath();
      ctx.arc(nest.x, nest.y, nest.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // 3. Render Pheromone Heatmap Grid
      sim.pheromones.renderToCanvas(ctx, viewX, viewY, viewW, viewH, pheromoneFilters);

      // 4. Render Obstacles
      for (const obs of sim.obstacles) {
        obs.render(ctx);
      }

      // 5. Render Food Nodes
      for (const food of sim.foodNodes) {
        food.render(ctx);
      }

      // 6. Render Active Rally Beacon
      if (sim.rallyPoint) {
        ctx.save();
        ctx.translate(sim.rallyPoint.x, sim.rallyPoint.y);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        const timeNow = performance.now() * 0.003;
        const pulse = 15 + Math.sin(timeNow) * 8;
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. Render Ants
      for (const ant of sim.ants) {
        ant.render(ctx);
      }

      // 8. Render Predators
      for (const pred of sim.predators) {
        pred.render(ctx);
      }

      // 9. Selected Entity Halo
      if (sim.selectedEntity) {
        const ent = sim.selectedEntity;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(ent.x, ent.y, (ent.caste?.size || ent.radius || 15) + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 10. Weather Effects: Rain ripples & night overlay
      if (sim.rainIntensity > 0.05) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${sim.rainIntensity * 0.4})`;
        ctx.lineWidth = 1.2;
        const now = performance.now() * 0.05;
        for (let i = 0; i < 70; i++) {
          const rx = (Math.sin(i * 99 + now * 0.1) * 0.5 + 0.5) * viewW + viewX;
          const ry = (Math.cos(i * 33 + now * 0.2) * 0.5 + 0.5) * viewH + viewY;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 8, ry + 16);
          ctx.stroke();
        }
      }

      ctx.restore();

      // 11. Screen-space Day/Night Ambient Filter
      const hNorm = sim.gameHour / 24.0;
      let nightAlpha = 0;
      if (sim.gameHour < 5 || sim.gameHour > 20) {
        nightAlpha = 0.45;
      } else if (sim.gameHour < 7) {
        nightAlpha = ((7 - sim.gameHour) / 2) * 0.45;
      } else if (sim.gameHour > 18) {
        nightAlpha = ((sim.gameHour - 18) / 2) * 0.45;
      }

      if (nightAlpha > 0.01) {
        ctx.fillStyle = `rgba(10, 15, 30, ${nightAlpha})`;
        ctx.fillRect(0, 0, w, h);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [camera, pheromoneFilters, sim]);

  // Pointer & Tool Interactions
  const screenToWorld = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const wx = sx / camera.zoom + camera.x;
    const wy = sy / camera.zoom + camera.y;
    return { x: wx, y: wy };
  };

  const handlePointerDown = (e) => {
    if (e.button === 1 || e.button === 2) {
      // Middle or Right click drags camera
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const { x, y } = screenToWorld(e.clientX, e.clientY);

    // Apply active tool action
    switch (activeTool) {
      case 'INSPECT': {
        // Find clicked ant
        const ant = sim.getNearestAnt(x, y, 20);
        if (ant) {
          sim.selectedEntity = ant;
          onSelectEntity(ant);
          return;
        }

        // Find clicked food
        const food = sim.getNearestFood(x, y, 25);
        if (food) {
          sim.selectedEntity = food;
          onSelectEntity(food);
          return;
        }

        // Find clicked predator
        const pred = sim.getNearestEnemy(x, y, 25);
        if (pred) {
          sim.selectedEntity = pred;
          onSelectEntity(pred);
          return;
        }

        sim.selectedEntity = null;
        onSelectEntity(null);
        break;
      }
      case 'DROP_SUGAR':
        sim.dropFood(x, y, 'sugar', 80);
        break;
      case 'DROP_HONEY':
        sim.dropFood(x, y, 'honey', 120);
        break;
      case 'DROP_LEAF':
        sim.dropFood(x, y, 'leaf', 100);
        break;
      case 'PLACE_STONE':
        sim.placeObstacle(x, y, 'stone', 28);
        break;
      case 'PLACE_BEACON':
        sim.setRallyBeacon(x, y);
        break;
      case 'SPAWN_WORKER':
        sim.spawnAntAt(x, y, 'WORKER');
        break;
      case 'SPAWN_SOLDIER':
        sim.spawnAntAt(x, y, 'SOLDIER');
        break;
      case 'SQUISH':
        sim.squishEntityAt(x, y);
        break;
      default:
        break;
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.x) / camera.zoom;
    const dy = (e.clientY - dragStart.y) / camera.zoom;

    setCamera(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  // Native Non-Passive Wheel Listener for Smooth Zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      setCamera(prev => {
        const newZoom = Math.max(0.4, Math.min(2.5, prev.zoom * zoomFactor));
        return {
          ...prev,
          zoom: newZoom,
        };
      });
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, [setCamera]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={e => e.preventDefault()}
      className="absolute inset-0 w-full h-full cursor-crosshair"
    />
  );
}
