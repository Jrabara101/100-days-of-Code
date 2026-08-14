import React, { useEffect, useRef } from 'react';
import { Compass } from 'lucide-react';
import { LIFE_STAGES } from '../engine/antEntity.js';

export default function Minimap({
  sim,
  camera,
  canvasSize,
  onNavigate
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !sim) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background terrain map
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const scaleX = w / sim.worldWidth;
    const scaleY = h / sim.worldHeight;

    // Draw Nest
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(sim.nest.x * scaleX, sim.nest.y * scaleY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Food Nodes
    for (const food of sim.foodNodes) {
      if (food.type === 'sugar') ctx.fillStyle = '#38bdf8';
      else if (food.type === 'leaf') ctx.fillStyle = '#22c55e';
      else if (food.type === 'protein') ctx.fillStyle = '#f43f5e';
      else ctx.fillStyle = '#f59e0b';

      ctx.beginPath();
      ctx.arc(food.x * scaleX, food.y * scaleY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Ants
    for (const ant of sim.ants) {
      if (ant.stage !== LIFE_STAGES.ADULT) continue;
      ctx.fillStyle = ant.caste.color;
      ctx.fillRect(ant.x * scaleX, ant.y * scaleY, 1.5, 1.5);
    }

    // Draw Predators
    for (const pred of sim.predators) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pred.x * scaleX, pred.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Viewport Bounding Box
    if (camera && canvasSize) {
      const viewW = canvasSize.width / camera.zoom;
      const viewH = canvasSize.height / camera.zoom;
      const viewX = camera.x;
      const viewY = camera.y;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(
        viewX * scaleX,
        viewY * scaleY,
        viewW * scaleX,
        viewH * scaleY
      );
    }
  }, [sim, camera, canvasSize]);

  const handleMinimapClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = (clickX / canvas.width) * sim.worldWidth;
    const worldY = (clickY / canvas.height) * sim.worldHeight;

    onNavigate(worldX, worldY);
  };

  return (
    <div className="absolute right-3 bottom-3 z-30 glass-panel p-2 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 px-1">
        <span className="flex items-center gap-1 text-emerald-400">
          <Compass className="w-3 h-3" /> RADAR
        </span>
        <span className="text-slate-500">2000x1400</span>
      </div>

      <div
        className="w-44 h-32 rounded-xl overflow-hidden border border-slate-800 cursor-crosshair relative shadow-inner"
        onClick={handleMinimapClick}
      >
        <canvas
          ref={canvasRef}
          width={176}
          height={128}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
