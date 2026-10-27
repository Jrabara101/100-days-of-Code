import React, { useRef, useEffect, useState, useCallback } from 'react';
import Decimal from 'break_infinity.js';
import { AnomalyCollectible } from '../types/game';
import { formatBigNumber, NotationType } from '../lib/bigNumber';

interface FloatingNumberParticle {
  id: number;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  isCrit: boolean;
  color: string;
  alpha: number;
  scale: number;
  age: number;
  maxAge: number;
}

interface DustParticle {
  x: number;
  y: number;
  radius: number;
  angle: number;
  speed: number;
  color: string;
  alpha: number;
}

interface ShockwaveRing {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface ReactorCanvasProps {
  onCoreTap: (e: { clientX: number; clientY: number }) => { yieldAmount: Decimal; isCrit: boolean } | undefined;
  activeAnomalies: AnomalyCollectible[];
  onCatchAnomaly: (id: string) => void;
  notation: NotationType;
  floatingNumbersEnabled: boolean;
  isFrenzyActive: boolean;
  cpsString: string;
}

// Particle pool size
const MAX_FLOATING_PARTICLES = 40;
const DUST_PARTICLES_COUNT = 60;

export const ReactorCanvas: React.FC<ReactorCanvasProps> = ({
  onCoreTap,
  activeAnomalies,
  onCatchAnomaly,
  notation,
  floatingNumbersEnabled,
  isFrenzyActive,
  cpsString,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Spring physics variables
  const springRef = useRef({
    scaleX: 1.0,
    scaleY: 1.0,
    targetScale: 1.0,
    vx: 0,
    vy: 0,
    stiffness: 0.22,
    damping: 0.72,
    rotation: 0,
  });

  // Pre-allocated object pools
  const floatingPoolRef = useRef<FloatingNumberParticle[]>([]);
  const dustParticlesRef = useRef<DustParticle[]>([]);
  const shockwavesRef = useRef<ShockwaveRing[]>([]);
  const nextParticleIdRef = useRef(1);

  // Initialize particle pool on mount
  useEffect(() => {
    const pool: FloatingNumberParticle[] = [];
    for (let i = 0; i < MAX_FLOATING_PARTICLES; i++) {
      pool.push({
        id: i,
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        text: '',
        isCrit: false,
        color: '#F59E0B',
        alpha: 0,
        scale: 1,
        age: 0,
        maxAge: 60,
      });
    }
    floatingPoolRef.current = pool;

    const dust: DustParticle[] = [];
    for (let i = 0; i < DUST_PARTICLES_COUNT; i++) {
      dust.push({
        x: 0,
        y: 0,
        radius: 60 + Math.random() * 150,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() - 0.5) * 0.02,
        color: Math.random() > 0.5 ? '#06B6D4' : '#A855F7',
        alpha: 0.2 + Math.random() * 0.6,
      });
    }
    dustParticlesRef.current = dust;
  }, []);

  const spawnFloatingText = useCallback(
    (x: number, y: number, text: string, isCrit: boolean) => {
      if (!floatingNumbersEnabled) return;
      const pool = floatingPoolRef.current;
      const p = pool.find((item) => !item.active) || pool[0]; // reuse inactive or oldest

      p.active = true;
      // Random lateral jitter
      p.x = x + (Math.random() - 0.5) * 44;
      p.y = y - 10 + (Math.random() - 0.5) * 20;
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vy = isCrit ? -4.2 - Math.random() * 1.5 : -2.8 - Math.random() * 1.2;
      p.text = text;
      p.isCrit = isCrit;
      p.color = isCrit ? '#EF4444' : isFrenzyActive ? '#F59E0B' : '#38BDF8';
      p.alpha = 1.0;
      p.scale = isCrit ? 1.6 : 1.1;
      p.age = 0;
      p.maxAge = isCrit ? 55 : 45;
    },
    [floatingNumbersEnabled, isFrenzyActive]
  );

  const spawnShockwave = useCallback((x: number, y: number, isCrit: boolean) => {
    shockwavesRef.current.push({
      id: nextParticleIdRef.current++,
      x,
      y,
      radius: 40,
      maxRadius: isCrit ? 180 : 130,
      alpha: 0.85,
      color: isCrit ? '#EF4444' : isFrenzyActive ? '#F59E0B' : '#06B6D4',
    });
    if (shockwavesRef.current.length > 8) {
      shockwavesRef.current.shift();
    }
  }, [isFrenzyActive]);

  // Handle core click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Check if clicked an anomaly
    for (const anomaly of activeAnomalies) {
      const ax = (anomaly.x / 100) * canvas.width;
      const ay = (anomaly.y / 100) * canvas.height;
      const dist = Math.hypot(clickX - ax, clickY - ay);
      if (dist <= anomaly.size * 1.5) {
        onCatchAnomaly(anomaly.id);
        spawnFloatingText(ax, ay, `+FRENZY OVERDRIVE!`, true);
        spawnShockwave(ax, ay, true);
        return;
      }
    }

    // Distance to core center
    const coreDist = Math.hypot(clickX - centerX, clickY - centerY);
    const coreRadius = 120;

    if (coreDist <= coreRadius) {
      // Trigger Spring deformation (squash & stretch)
      const spring = springRef.current;
      spring.scaleX = 0.88; // squash horizontally
      spring.scaleY = 1.14; // stretch vertically
      spring.vx = 0.05;
      spring.vy = -0.05;

      const result = onCoreTap({ clientX: e.clientX, clientY: e.clientY });
      if (result) {
        const text = `+${formatBigNumber(result.yieldAmount, notation)}${result.isCrit ? ' CRIT!' : ''}`;
        spawnFloatingText(clickX, clickY, text, result.isCrit);
        spawnShockwave(centerX, centerY, result.isCrit);
      }
    }
  };

  // Main 60FPS animation & rendering loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // --- 1. Update Spring Physics ---
      const spring = springRef.current;
      const fx = -spring.stiffness * (spring.scaleX - spring.targetScale);
      spring.vx = (spring.vx + fx) * spring.damping;
      spring.scaleX += spring.vx;

      const fy = -spring.stiffness * (spring.scaleY - spring.targetScale);
      spring.vy = (spring.vy + fy) * spring.damping;
      spring.scaleY += spring.vy;

      // Rotation speed scales slightly with CPS
      const spinSpeed = isFrenzyActive ? 0.025 : 0.008;
      spring.rotation += spinSpeed;

      // --- 2. Render Ambient Kinetic Dust & Orbital Rings ---
      const dust = dustParticlesRef.current;
      for (let i = 0; i < dust.length; i++) {
        const p = dust[i];
        p.angle += p.speed;
        const px = centerX + Math.cos(p.angle) * p.radius;
        const py = centerY + Math.sin(p.angle) * (p.radius * 0.75); // orbital perspective

        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1.0;

      // Concentric Decorative Quantum Rings
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(spring.rotation * 0.4);

      // Outer dashed orbital ring
      ctx.beginPath();
      ctx.ellipse(0, 0, 160, 120, spring.rotation * 0.2, 0, Math.PI * 2);
      ctx.strokeStyle = isFrenzyActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.stroke();

      // Middle counter-rotating ring
      ctx.beginPath();
      ctx.ellipse(0, 0, 135, 135, -spring.rotation * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = isFrenzyActive ? 'rgba(245, 158, 11, 0.5)' : 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // --- 3. Render Shockwaves ---
      const shockwaves = shockwavesRef.current;
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 4.5;
        sw.alpha *= 0.92;

        if (sw.radius >= sw.maxRadius || sw.alpha <= 0.05) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = sw.color;
        ctx.stroke();
        ctx.restore();
      }

      // --- 4. Render The Kinetic Reactor Core (With Spring Deformation) ---
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(spring.scaleX, spring.scaleY);

      const coreRadius = 88;

      // Glow backdrop
      const radialGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, coreRadius * 1.5);
      if (isFrenzyActive) {
        radialGradient.addColorStop(0, '#EF4444');
        radialGradient.addColorStop(0.4, '#F59E0B');
        radialGradient.addColorStop(0.8, 'rgba(239, 68, 68, 0.2)');
        radialGradient.addColorStop(1, 'transparent');
      } else {
        radialGradient.addColorStop(0, '#FFFFFF');
        radialGradient.addColorStop(0.3, '#06B6D4');
        radialGradient.addColorStop(0.7, '#A855F7');
        radialGradient.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = radialGradient;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Metallic containment shell
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
      const shellGrad = ctx.createLinearGradient(-coreRadius, -coreRadius, coreRadius, coreRadius);
      shellGrad.addColorStop(0, '#1E293B');
      shellGrad.addColorStop(0.5, '#0C101D');
      shellGrad.addColorStop(1, '#05070B');
      ctx.fillStyle = shellGrad;
      ctx.fill();
      ctx.strokeStyle = isFrenzyActive ? '#EF4444' : '#F59E0B';
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = isFrenzyActive ? 25 : 18;
      ctx.shadowColor = isFrenzyActive ? '#EF4444' : '#F59E0B';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner Luminous Core
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 0.62, 0, Math.PI * 2);
      const innerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * 0.62);
      innerGrad.addColorStop(0, '#FFFFFF');
      innerGrad.addColorStop(0.4, isFrenzyActive ? '#F59E0B' : '#06B6D4');
      innerGrad.addColorStop(1, isFrenzyActive ? '#EF4444' : '#A855F7');
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // Luminous rotating plasma arcs
      ctx.rotate(spring.rotation);
      for (let j = 0; j < 4; j++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(coreRadius * 0.2, 0);
        ctx.lineTo(coreRadius * 0.58, 0);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFFFFF';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // --- 5. Render Active Anomalies (Drifting Collectibles) ---
      for (const anomaly of activeAnomalies) {
        const ax = (anomaly.x / 100) * width;
        const ay = (anomaly.y / 100) * height;

        ctx.save();
        ctx.translate(ax, ay);

        // Pulsing glow aura
        const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, (anomaly.size / 2) * pulse * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = anomaly.color;
        ctx.globalAlpha = 0.35;
        ctx.shadowBlur = 20;
        ctx.shadowColor = anomaly.color;
        ctx.fill();

        // Shard diamond geometry
        ctx.rotate(Date.now() * 0.003);
        ctx.beginPath();
        ctx.moveTo(0, -anomaly.size / 2);
        ctx.lineTo(anomaly.size / 2, 0);
        ctx.lineTo(0, anomaly.size / 2);
        ctx.lineTo(-anomaly.size / 2, 0);
        ctx.closePath();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.strokeStyle = anomaly.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.restore();
      }

      // --- 6. Render Pooled Floating Numbers ---
      const pool = floatingPoolRef.current;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // slight gravity deceleration
        p.age += 1;
        p.alpha = Math.max(0, 1 - p.age / p.maxAge);

        if (p.age >= p.maxAge || p.alpha <= 0) {
          p.active = false;
          continue;
        }

        ctx.save();
        ctx.font = `${p.isCrit ? 'bold 18px' : 'bold 14px'} 'JetBrains Mono', monospace`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = p.isCrit ? 12 : 6;
        ctx.shadowColor = p.color;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeAnomalies, isFrenzyActive, notation, onCoreTap, onCatchAnomaly]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        width={480}
        height={440}
        onClick={handleCanvasClick}
        className="cursor-pointer max-w-full touch-none active:scale-[0.99] transition-transform"
        style={{ width: '480px', height: '440px' }}
      />
      <div className="text-center mt-[-10px] text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-energy-cyan animate-ping" />
        <span>Tap Central Core to generate kinetic flux</span>
      </div>
    </div>
  );
};
