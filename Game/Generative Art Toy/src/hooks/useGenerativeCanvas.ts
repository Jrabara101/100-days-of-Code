import { useEffect, useRef, useState, useCallback } from 'react';
import { ArtToySettings, AttractorPoint, AlgorithmType } from '@/types';
import { FlowFieldEngine } from '@/lib/algorithms/flowField';
import { KaleidoscopeEngine } from '@/lib/algorithms/kaleidoscope';
import { GravityOrbitEngine } from '@/lib/algorithms/gravityOrbit';
import { PhyllotaxisEngine } from '@/lib/algorithms/phyllotaxis';
import { samplePalette } from '@/lib/algorithms/colorPalettes';
import { soundSynth } from '@/lib/algorithms/audioEngine';
import { VectorStroke } from '@/lib/exporters';

const MAX_PARTICLES = 10000;

interface UseGenerativeCanvasProps {
  settings: ArtToySettings;
  isPlaying: boolean;
  attractors: AttractorPoint[];
  seed: string;
  onFpsUpdate?: (fps: number) => void;
}

export function useGenerativeCanvas({
  settings,
  isPlaying,
  attractors,
  seed,
  onFpsUpdate
}: UseGenerativeCanvasProps) {
  const trailsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction State
  const pointerPos = useRef<{ x: number; y: number; active: boolean; prevX: number; prevY: number }>({
    x: -1,
    y: -1,
    active: false,
    prevX: -1,
    prevY: -1
  });

  // Vector strokes recorder for plotter SVG export
  const vectorStrokesRef = useRef<VectorStroke[]>([]);
  const maxVectorStrokes = 800;

  // Particle pools using contiguous typed arrays (Zero GC overhead)
  const posRef = useRef(new Float32Array(MAX_PARTICLES * 2));
  const prevPosRef = useRef(new Float32Array(MAX_PARTICLES * 2));
  const velRef = useRef(new Float32Array(MAX_PARTICLES * 2));
  const accRef = useRef(new Float32Array(MAX_PARTICLES * 2));
  const lifeRef = useRef(new Float32Array(MAX_PARTICLES * 2)); // [life, maxLife]
  const colorDataRef = useRef(new Float32Array(MAX_PARTICLES * 2)); // [seedOffset, speedNorm]

  // Algorithm Engines
  const flowFieldRef = useRef(new FlowFieldEngine(12345));
  const gravityRef = useRef(new GravityOrbitEngine());
  const phyllotaxisRef = useRef(new PhyllotaxisEngine());

  // Dimensions & DPI
  const dimensionsRef = useRef({ width: window.innerWidth, height: window.innerHeight, dpr: 1 });
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(performance.now());

  // HUD Visibility timer
  const [isHudVisible, setIsHudVisible] = useState(true);
  const hudInactivityTimerRef = useRef<number | null>(null);

  // Reset/Initialize particle pool
  const initParticles = useCallback((w: number, h: number, count: number) => {
    const pos = posRef.current;
    const prevPos = prevPosRef.current;
    const vel = velRef.current;
    const acc = accRef.current;
    const life = lifeRef.current;
    const cData = colorDataRef.current;

    for (let i = 0; i < count; i++) {
      const idx2 = i * 2;
      const x = Math.random() * w;
      const y = Math.random() * h;
      pos[idx2] = x;
      pos[idx2 + 1] = y;
      prevPos[idx2] = x;
      prevPos[idx2 + 1] = y;

      vel[idx2] = (Math.random() - 0.5) * 2;
      vel[idx2 + 1] = (Math.random() - 0.5) * 2;

      acc[idx2] = 0;
      acc[idx2 + 1] = 0;

      const maxLife = 80 + Math.random() * 120;
      life[idx2] = Math.random() * maxLife;
      life[idx2 + 1] = maxLife;

      cData[idx2] = Math.random(); // color seed offset
      cData[idx2 + 1] = 0; // speed normalized
    }
  }, []);

  // Update seed
  useEffect(() => {
    let numericSeed = 0;
    for (let i = 0; i < seed.length; i++) {
      numericSeed = (numericSeed * 31 + seed.charCodeAt(i)) >>> 0;
    }
    flowFieldRef.current.setSeed(numericSeed || 42);
    if (dimensionsRef.current.width > 0) {
      initParticles(dimensionsRef.current.width, dimensionsRef.current.height, settings.particleCount);
    }
  }, [seed, initParticles, settings.particleCount]);

  // Handle Resize
  const handleResize = useCallback(() => {
    const trailsCanvas = trailsCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!trailsCanvas || !overlayCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for mobile performance
    const w = window.innerWidth;
    const h = window.innerHeight;

    dimensionsRef.current = { width: w, height: h, dpr };

    trailsCanvas.width = Math.floor(w * dpr);
    trailsCanvas.height = Math.floor(h * dpr);
    trailsCanvas.style.width = `${w}px`;
    trailsCanvas.style.height = `${h}px`;

    overlayCanvas.width = Math.floor(w * dpr);
    overlayCanvas.height = Math.floor(h * dpr);
    overlayCanvas.style.width = `${w}px`;
    overlayCanvas.style.height = `${h}px`;

    const trailsCtx = trailsCanvas.getContext('2d', { alpha: false });
    if (trailsCtx) {
      trailsCtx.scale(dpr, dpr);
      trailsCtx.fillStyle = settings.invertedBackground ? '#FFFFFF' : '#0A0B0E';
      trailsCtx.fillRect(0, 0, w, h);
    }

    const overlayCtx = overlayCanvas.getContext('2d');
    if (overlayCtx) {
      overlayCtx.scale(dpr, dpr);
    }

    initParticles(w, h, settings.particleCount);
  }, [initParticles, settings.particleCount, settings.invertedBackground]);

  // Setup Resize Listener
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Clear Canvas Function
  const clearCanvas = useCallback(() => {
    const trailsCanvas = trailsCanvasRef.current;
    if (!trailsCanvas) return;
    const ctx = trailsCanvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = dimensionsRef.current;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = settings.invertedBackground ? '#FFFFFF' : '#0A0B0E';
    ctx.fillRect(0, 0, trailsCanvas.width, trailsCanvas.height);
    ctx.restore();
    vectorStrokesRef.current = [];
  }, [settings.invertedBackground]);

  // HUD Inactivity Ping
  const pingHudActivity = useCallback(() => {
    setIsHudVisible(true);
    if (hudInactivityTimerRef.current) {
      window.clearTimeout(hudInactivityTimerRef.current);
    }
    hudInactivityTimerRef.current = window.setTimeout(() => {
      // Auto-hide HUD when user is actively interacting or drawing
      if (pointerPos.current.active) {
        setIsHudVisible(false);
      }
    }, 2800);
  }, []);

  // Pointer Interaction Handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pointerPos.current = { x, y, active: true, prevX: x, prevY: y };
    pingHudActivity();

    // Trigger audio chime
    if (settings.soundEnabled) {
      const normY = 1.0 - Math.min(1, Math.max(0, y / window.innerHeight));
      const pan = (x / window.innerWidth) * 2 - 1;
      soundSynth.triggerChime(normY, 0.7, pan);
    }
  }, [pingHudActivity, settings.soundEnabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = pointerPos.current;
    p.prevX = p.x;
    p.prevY = p.y;
    p.x = x;
    p.y = y;

    pingHudActivity();

    if (p.active && settings.soundEnabled) {
      const dx = p.x - p.prevX;
      const dy = p.y - p.prevY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      if (speed > 8) {
        const normY = 1.0 - Math.min(1, Math.max(0, y / window.innerHeight));
        const pan = (x / window.innerWidth) * 2 - 1;
        soundSynth.triggerChime(normY, Math.min(1, speed / 35), pan);
      }
    }
  }, [pingHudActivity, settings.soundEnabled]);

  const handlePointerUp = useCallback(() => {
    pointerPos.current.active = false;
    setIsHudVisible(true);
    if (hudInactivityTimerRef.current) {
      window.clearTimeout(hudInactivityTimerRef.current);
    }
  }, []);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const trailsCanvas = trailsCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!trailsCanvas || !overlayCanvas) return;

    const trailsCtx = trailsCanvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!trailsCtx || !overlayCtx) return;

    let isSubscribed = true;

    const renderLoop = (timestamp: number) => {
      if (!isSubscribed) return;

      const dt = Math.min(timestamp - lastTimeRef.current, 50); // Clamped delta time
      lastTimeRef.current = timestamp;

      // Telemetry FPS Counter
      frameCountRef.current++;
      if (timestamp - fpsTimerRef.current >= 400) {
        const fps = Math.round((frameCountRef.current * 1000) / (timestamp - fpsTimerRef.current));
        frameCountRef.current = 0;
        fpsTimerRef.current = timestamp;
        if (onFpsUpdate) onFpsUpdate(fps);
      }

      const { width: w, height: h } = dimensionsRef.current;
      const pointer = pointerPos.current;

      // 1. Trails Canvas: Alpha decay fading
      if (isPlaying) {
        trailsCtx.fillStyle = settings.invertedBackground
          ? `rgba(255, 255, 255, ${settings.trailDecay})`
          : `rgba(10, 11, 14, ${settings.trailDecay})`;
        trailsCtx.fillRect(0, 0, w, h);
      }

      // 2. Clear Ephemeral Overlay Canvas
      overlayCtx.clearRect(0, 0, w, h);

      // 3. Render Ephemeral Guides & Attractors
      if (settings.algorithm === 'kaleidoscope') {
        KaleidoscopeEngine.drawGuideLines(
          overlayCtx,
          w * 0.5,
          h * 0.5,
          Math.min(w, h) * 0.45,
          settings.symmetryFolds,
          settings.invertedBackground
        );
      } else if (settings.algorithm === 'gravity_orbit') {
        GravityOrbitEngine.drawAttractorOverlays(overlayCtx, attractors, timestamp);
      }

      // Draw active pointer reticle / ripple
      if (pointer.active && pointer.x >= 0) {
        overlayCtx.save();
        overlayCtx.beginPath();
        overlayCtx.arc(pointer.x, pointer.y, 18, 0, Math.PI * 2);
        overlayCtx.strokeStyle = settings.invertedBackground ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.45)';
        overlayCtx.lineWidth = 1.5;
        overlayCtx.setLineDash([3, 4]);
        overlayCtx.stroke();

        overlayCtx.beginPath();
        overlayCtx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2);
        overlayCtx.fillStyle = '#00F0FF';
        overlayCtx.shadowColor = '#00F0FF';
        overlayCtx.shadowBlur = 8;
        overlayCtx.fill();
        overlayCtx.restore();
      }

      // 4. Update Particle Physics & Render
      if (isPlaying) {
        const count = settings.particleCount;
        const pos = posRef.current;
        const prevPos = prevPosRef.current;
        const vel = velRef.current;
        const acc = accRef.current;
        const life = lifeRef.current;
        const cData = colorDataRef.current;

        const cx = w * 0.5;
        const cy = h * 0.5;

        // Update engines time
        flowFieldRef.current.updateTime(dt, settings.baseSpeed);
        phyllotaxisRef.current.updateTime(dt, settings.baseSpeed);

        trailsCtx.save();
        trailsCtx.lineWidth = settings.strokeWidth;
        trailsCtx.lineCap = 'round';
        trailsCtx.lineJoin = 'round';

        for (let i = 0; i < count; i++) {
          const idx2 = i * 2;
          let px = pos[idx2];
          let py = pos[idx2 + 1];

          prevPos[idx2] = px;
          prevPos[idx2 + 1] = py;

          let vx = vel[idx2];
          let vy = vel[idx2 + 1];
          let currentLife = life[idx2];
          const maxLife = life[idx2 + 1];

          // Algorithm computation
          switch (settings.algorithm) {
            case 'flow_field': {
              const { vx: fvx, vy: fvy, speedNorm } = flowFieldRef.current.getVector(
                px,
                py,
                w,
                h,
                settings.flowTurbulence,
                pointer.x,
                pointer.y,
                pointer.active
              );
              cData[idx2 + 1] = speedNorm;
              const spd = settings.baseSpeed * (1.2 + speedNorm * 1.5);
              vx = vx * 0.9 + fvx * spd * 0.1;
              vy = vy * 0.9 + fvy * spd * 0.1;
              px += vx;
              py += vy;
              break;
            }

            case 'kaleidoscope': {
              // Kaleidoscope particles move in organic orbits around center or follow pointer
              const dx = px - cx;
              const dy = py - cy;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const angle = Math.atan2(dy, dx) + 0.015 * settings.baseSpeed;
              const targetR = (dist + Math.sin(timestamp * 0.001 + i) * 1.5);
              
              vx = (cx + Math.cos(angle) * targetR) - px;
              vy = (cy + Math.sin(angle) * targetR) - py;

              if (pointer.active) {
                const pdx = pointer.x - px;
                const pdy = pointer.y - py;
                const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
                if (pDist < 200 && pDist > 1) {
                  vx += (pdx / pDist) * 3;
                  vy += (pdy / pDist) * 3;
                }
              }

              px += vx * 0.1;
              py += vy * 0.1;
              cData[idx2 + 1] = Math.min(1, Math.sqrt(vx * vx + vy * vy) / 6);
              break;
            }

            case 'gravity_orbit': {
              const { ax, ay } = gravityRef.current.calculateNetAcceleration(
                px,
                py,
                attractors,
                pointer.x,
                pointer.y,
                pointer.active ? settings.pointerForce * 2.5 : 0
              );
              vx = (vx + ax * 0.016) * 0.985;
              vy = (vy + ay * 0.016) * 0.985;
              px += vx * settings.baseSpeed;
              py += vy * settings.baseSpeed;
              cData[idx2 + 1] = Math.min(1, Math.sqrt(vx * vx + vy * vy) / 8);
              break;
            }

            case 'phyllotaxis': {
              const { targetX, targetY } = phyllotaxisRef.current.getTargetPosition(
                i,
                cx,
                cy,
                4.5 * settings.baseSpeed,
                pointer.active ? pointer.x : -1,
                pointer.active ? pointer.y : -1
              );
              px = px * 0.88 + targetX * 0.12;
              py = py * 0.88 + targetY * 0.12;
              cData[idx2 + 1] = (i % 100) / 100;
              break;
            }
          }

          // Boundary checks & respawn
          currentLife++;
          let needsRespawn = currentLife >= maxLife || px < -20 || px > w + 20 || py < -20 || py > h + 20;

          if (needsRespawn) {
            px = Math.random() * w;
            py = Math.random() * h;
            prevPos[idx2] = px;
            prevPos[idx2 + 1] = py;
            vx = (Math.random() - 0.5) * 1.5;
            vy = (Math.random() - 0.5) * 1.5;
            currentLife = 0;
          }

          pos[idx2] = px;
          pos[idx2 + 1] = py;
          vel[idx2] = vx;
          vel[idx2 + 1] = vy;
          life[idx2] = currentLife;

          // Color derivation
          let color = '#FFFFFF';
          const seedOffset = cData[idx2];
          const speedNorm = cData[idx2 + 1];

          switch (settings.colorMode) {
            case 'cycle':
              color = samplePalette(settings.colorPalette, seedOffset + timestamp * 0.00015);
              break;
            case 'velocity':
              color = samplePalette(settings.colorPalette, speedNorm);
              break;
            case 'random':
              color = samplePalette(settings.colorPalette, seedOffset);
              break;
            case 'monochrome':
              color = settings.invertedBackground ? '#111827' : '#F9FAFB';
              break;
          }

          // Render strokes
          if (settings.algorithm === 'kaleidoscope') {
            const symFolds = settings.symmetryFolds;
            const points1 = KaleidoscopeEngine.getSymmetricPoints(px, py, cx, cy, symFolds, true);
            const points0 = KaleidoscopeEngine.getSymmetricPoints(prevPos[idx2], prevPos[idx2 + 1], cx, cy, symFolds, true);

            trailsCtx.strokeStyle = color;
            trailsCtx.beginPath();
            for (let s = 0; s < points1.length; s++) {
              trailsCtx.moveTo(points0[s].x, points0[s].y);
              trailsCtx.lineTo(points1[s].x, points1[s].y);
            }
            trailsCtx.stroke();
          } else {
            trailsCtx.strokeStyle = color;
            trailsCtx.beginPath();
            trailsCtx.moveTo(prevPos[idx2], prevPos[idx2 + 1]);
            trailsCtx.lineTo(px, py);
            trailsCtx.stroke();

            // Record vector stroke sample for AxiDraw / laser plotter SVG export
            if (i % 12 === 0 && vectorStrokesRef.current.length < maxVectorStrokes) {
              vectorStrokesRef.current.push({
                points: [[prevPos[idx2], prevPos[idx2 + 1]], [px, py]],
                color,
                width: settings.strokeWidth
              });
            }
          }
        }
        trailsCtx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, settings, attractors, onFpsUpdate]);

  return {
    trailsCanvasRef,
    overlayCanvasRef,
    isHudVisible,
    pingHudActivity,
    clearCanvas,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    vectorStrokesRef,
  };
}
