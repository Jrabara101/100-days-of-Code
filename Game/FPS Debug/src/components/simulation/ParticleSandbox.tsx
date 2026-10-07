import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Sparkles, Zap, RefreshCw, Layers } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export const ParticleSandbox: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particleCount, setParticleCount] = useState<number>(12000);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [vortexActive, setVortexActive] = useState<boolean>(true);
  const [trailsActive, setTrailsActive] = useState<boolean>(true);
  const [physicsCollisions, setPhysicsCollisions] = useState<boolean>(false);

  const particlesRef = useRef<Particle[]>([]);
  const mousePosRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false });

  // Initialize particles
  const initParticles = useCallback((count: number, w: number, h: number) => {
    const colors = ['#06B6D4', '#38BDF8', '#818CF8', '#10B981', '#F59E0B', '#EC4899'];
    const arr: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.35 + Math.random() * 0.65,
      });
    }
    particlesRef.current = arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    initParticles(particleCount, w, h);
  }, [particleCount, initParticles]);

  // Main interactive particle animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let running = true;

    const render = () => {
      if (!running) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Trail fade effect or full clear
      if (trailsActive) {
        ctx.fillStyle = 'rgba(5, 7, 12, 0.22)';
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      if (!isPaused) {
        const particles = particlesRef.current;
        const n = particles.length;
        const mx = mousePosRef.current.x;
        const my = mousePosRef.current.y;
        const isMouseDown = mousePosRef.current.isDown;

        // Center vortex anchor
        const cx = w / 2;
        const cy = h / 2;

        for (let i = 0; i < n; i++) {
          const p = particles[i];

          // Vortex physics
          if (vortexActive) {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 0.08 / Math.max(0.5, dist * 0.015);
            // Perpendicular swirl vector
            p.vx += (-dy / dist) * force * 1.5 + (dx / dist) * force * 0.3;
            p.vy += (dx / dist) * force * 1.5 + (dy / dist) * force * 0.3;
          }

          // Mouse gravity or repulsion
          if (mx > 0 && my > 0) {
            const mdx = mx - p.x;
            const mdy = my - p.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
            if (mdist < 220) {
              const mForce = (220 - mdist) / 220;
              const dir = isMouseDown ? -1 : 1; // click to explode, hover to gravitate
              p.vx += (mdx / mdist) * mForce * 1.8 * dir;
              p.vy += (mdy / mdist) * mForce * 1.8 * dir;
            }
          }

          // Artificial CPU load if physics collision is active (heavy N-body test)
          if (physicsCollisions && i % 4 === 0) {
            for (let j = 0; j < 35; j++) {
              Math.atan2(p.vy, p.vx) * Math.hypot(p.vx, p.vy);
            }
          }

          // Damping
          p.vx *= 0.985;
          p.vy *= 0.985;

          // Integrate position
          p.x += p.vx;
          p.y += p.vy;

          // Screen wrap
          if (p.x < 0) p.x = w;
          else if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          else if (p.y > h) p.y = 0;

          // Draw particle
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
    };
  }, [isPaused, vortexActive, trailsActive, physicsCollisions]);

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePosRef.current.x = e.clientX - rect.left;
    mousePosRef.current.y = e.clientY - rect.top;
  };

  const handlePointerLeave = () => {
    mousePosRef.current.x = -1;
    mousePosRef.current.y = -1;
    mousePosRef.current.isDown = false;
  };

  const triggerShockwave = () => {
    const particles = particlesRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - cx;
      const dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      p.vx += (dx / dist) * (15 + Math.random() * 20);
      p.vy += (dy / dist) * (15 + Math.random() * 20);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[620px] rounded-xl overflow-hidden border border-slate-800/80 bg-[#05070C] flex flex-col justify-between">
      {/* Background Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseMove={handlePointerMove}
        onMouseDown={() => (mousePosRef.current.isDown = true)}
        onMouseUp={() => (mousePosRef.current.isDown = false)}
        onMouseLeave={handlePointerLeave}
      />

      {/* Top Avionics Overlay Bar */}
      <div className="relative z-10 p-4 pointer-events-none flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <span className="text-xs uppercase font-mono-avionics tracking-wider text-cyan-400 font-semibold block">
              Simulated Runtime Sandbox // Particle Rig
            </span>
            <span className="text-[11px] text-slate-400">
              Interactive physics stress environment for live telemetry and stutter benchmarking
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono-avionics text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 pointer-events-auto">
          <span className="text-cyan-400 font-bold">{particleCount.toLocaleString()}</span>
          <span>Entities</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">Click & Drag to Repel</span>
        </div>
      </div>

      {/* Bottom Interactive Sandbox Controls */}
      <div className="relative z-10 p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-[#05070C] via-[#05070C]/90 to-transparent">
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono-avionics">
          {/* Pause / Play */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume Rig' : 'Pause'}</span>
          </button>

          {/* Vortex Swirl */}
          <button
            type="button"
            onClick={() => setVortexActive(!vortexActive)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 ${
              vortexActive
                ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vortex Core</span>
          </button>

          {/* Heavy N-Body Collision Stress */}
          <button
            type="button"
            onClick={() => setPhysicsCollisions(!physicsCollisions)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 ${
              physicsCollisions
                ? 'bg-red-950/70 border-red-500/80 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Heavy Collision Burn {physicsCollisions ? '(ON)' : '(OFF)'}</span>
          </button>

          {/* Trails */}
          <button
            type="button"
            onClick={() => setTrailsActive(!trailsActive)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 ${
              trailsActive
                ? 'bg-slate-800/90 border-slate-600 text-slate-200'
                : 'bg-slate-900/80 border-slate-800 text-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Motion Trails</span>
          </button>

          {/* Shockwave Burst */}
          <button
            type="button"
            onClick={triggerShockwave}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/80 transition-colors flex items-center space-x-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Detonate Shockwave</span>
          </button>
        </div>

        {/* Entity Load Slider */}
        <div className="flex items-center space-x-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono-avionics">
          <span className="text-slate-400">Load Scale:</span>
          <input
            type="range"
            min="2000"
            max="60000"
            step="2000"
            value={particleCount}
            onChange={(e) => setParticleCount(Number(e.target.value))}
            className="w-32 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <span className="text-cyan-300 font-bold w-14 text-right">
            {(particleCount / 1000).toFixed(0)}k
          </span>
          <button
            type="button"
            onClick={() => initParticles(particleCount, canvasRef.current?.clientWidth || 800, canvasRef.current?.clientHeight || 600)}
            title="Reset simulation particles"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
