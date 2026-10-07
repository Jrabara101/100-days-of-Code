import React, { useRef, useEffect, useCallback } from 'react';
import { Beatmap, BeatmapNote, HitJudgement, InputTelemetry } from '../../types/game';
import { globalAudioEngine } from '../../audio/RhythmAudioEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  isFever?: boolean;
}

interface HitPopup {
  x: number;
  y: number;
  judgement: HitJudgement;
  alpha: number;
  deltaMs: number;
  scale: number;
  created: number;
}

interface RhythmHighwayProps {
  beatmap: Beatmap;
  getCurrentTimeMs: () => number;
  scrollSpeed: number; // 1.0 - 5.0
  isFeverActive: boolean;
  laneActiveRef: React.MutableRefObject<[boolean, boolean, boolean, boolean]>;
  onJudgement: (judgement: HitJudgement, deltaMs: number, note: BeatmapNote) => void;
  onHoldProgress?: (lane: number, isHolding: boolean) => void;
  ghostTelemetry?: InputTelemetry[];
  className?: string;
  onLaneClick?: (lane: 0 | 1 | 2 | 3) => void;
}

const LANE_COLORS = [
  '#00f0ff', // Lane 0: Cyan (D)
  '#06d6a0', // Lane 1: Emerald (F)
  '#ffd166', // Lane 2: Gold/Yellow (J)
  '#ff007f', // Lane 3: Magenta/Pink (K)
];

const LANE_KEYS = ['D', 'F', 'J', 'K'];

export const RhythmHighway: React.FC<RhythmHighwayProps> = ({
  beatmap,
  getCurrentTimeMs,
  scrollSpeed = 2.5,
  isFeverActive,
  laneActiveRef,
  onJudgement,
  onHoldProgress,
  ghostTelemetry,
  className = '',
  onLaneClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Runtime note state tracking (unprocessed notes)
  const noteStatusRef = useRef<Map<string, {
    processed: boolean;
    holding: boolean;
    holdCompleted: boolean;
    holdStartTime?: number;
    lastHoldTick?: number;
  }>>(new Map());

  // Particles & animations
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<HitPopup[]>([]);
  const shakeOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize or reset note status map on beatmap change
  useEffect(() => {
    const map = new Map();
    beatmap.notes.forEach(note => {
      map.set(note.id, {
        processed: false,
        holding: false,
        holdCompleted: false
      });
    });
    noteStatusRef.current = map;
    particlesRef.current = [];
    popupsRef.current = [];
  }, [beatmap]);

  // Spawn particle burst on note hit
  const spawnHitParticles = useCallback((x: number, y: number, color: string, isFever: boolean = false) => {
    const count = isFever ? 28 : 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isFever ? 9 : 6) + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isFever ? 5 : 3.5) + 1.5,
        color: isFever ? (Math.random() > 0.4 ? '#ffd166' : '#ff0055') : color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 20 + 20,
        isFever,
      });
    }

    // Screen shake burst
    shakeOffsetRef.current = {
      x: (Math.random() - 0.5) * (isFever ? 8 : 4),
      y: (Math.random() - 0.5) * (isFever ? 8 : 4),
    };
  }, []);

  // Main unrolled RequestAnimationFrame render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const currentTimeMs = getCurrentTimeMs();

      // Screen shake decay
      shakeOffsetRef.current.x *= 0.85;
      shakeOffsetRef.current.y *= 0.85;

      ctx.save();
      ctx.translate(shakeOffsetRef.current.x, shakeOffsetRef.current.y);

      // Background clearing with subtle highway depth
      ctx.fillStyle = '#0a0b12';
      ctx.fillRect(0, 0, width, height);

      // Highway geometry
      const highwayWidth = Math.min(width * 0.92, 540);
      const highwayX = (width - highwayWidth) / 2;
      const laneWidth = highwayWidth / 4;
      const judgmentY = height - 90; // Bottom receptor line

      // Approach rate window (how many milliseconds are visible on screen)
      // Speed 1.0 = 1600ms, Speed 3.0 = 700ms, Speed 5.0 = 420ms
      const visibleWindowMs = 1800 / scrollSpeed;

      // -----------------------------------------------------------
      // 1. DRAW HIGHWAY TRACK & LANES
      // -----------------------------------------------------------
      // Highway backing
      const highwayGrad = ctx.createLinearGradient(highwayX, 0, highwayX, height);
      highwayGrad.addColorStop(0, 'rgba(15, 17, 26, 0.4)');
      highwayGrad.addColorStop(0.7, 'rgba(20, 24, 38, 0.8)');
      highwayGrad.addColorStop(1, isFeverActive ? 'rgba(255, 0, 85, 0.15)' : 'rgba(0, 240, 255, 0.08)');
      ctx.fillStyle = highwayGrad;
      ctx.fillRect(highwayX, 0, highwayWidth, height);

      // Glowing outer borders
      ctx.strokeStyle = isFeverActive ? 'rgba(255, 0, 85, 0.6)' : 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(highwayX, 0);
      ctx.lineTo(highwayX, height);
      ctx.moveTo(highwayX + highwayWidth, 0);
      ctx.lineTo(highwayX + highwayWidth, height);
      ctx.stroke();

      // Lane dividers & subtle vertical perspective bars
      for (let i = 1; i < 4; i++) {
        const lx = highwayX + i * laneWidth;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, height);
        ctx.stroke();
      }

      // Fever Overdrive background aura speedlines
      if (isFeverActive) {
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.15)';
        ctx.lineWidth = 1.5;
        for (let s = 0; s < 6; s++) {
          const sx = highwayX + (s / 5) * highwayWidth;
          const offset = ((currentTimeMs * 1.5 + s * 140) % height);
          ctx.beginPath();
          ctx.moveTo(sx, offset);
          ctx.lineTo(sx, offset + 40);
          ctx.stroke();
        }
      }

      // -----------------------------------------------------------
      // 2. JUDGMENT LINE & KEY RECEPTORS
      // -----------------------------------------------------------
      // Glow bar at judgment line
      ctx.shadowBlur = isFeverActive ? 25 : 15;
      ctx.shadowColor = isFeverActive ? '#ff0055' : '#00f0ff';
      ctx.strokeStyle = isFeverActive ? '#ff3377' : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(highwayX - 4, judgmentY);
      ctx.lineTo(highwayX + highwayWidth + 4, judgmentY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw 4 lane receptors
      for (let i = 0; i < 4; i++) {
        const rx = highwayX + i * laneWidth;
        const isPressed = laneActiveRef.current[i];
        const laneColor = LANE_COLORS[i];

        // Receptor box
        ctx.fillStyle = isPressed
          ? (isFeverActive ? 'rgba(255, 0, 85, 0.45)' : `${laneColor}44`)
          : 'rgba(25, 28, 42, 0.7)';
        ctx.strokeStyle = isPressed ? (isFeverActive ? '#ffd166' : laneColor) : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = isPressed ? 2.5 : 1.5;

        const padPadding = 6;
        const padHeight = 36;
        const padY = judgmentY - padHeight / 2;

        ctx.beginPath();
        ctx.roundRect(rx + padPadding, padY, laneWidth - padPadding * 2, padHeight, 8);
        ctx.fill();
        ctx.stroke();

        // Key label (D, F, J, K)
        ctx.fillStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(LANE_KEYS[i], rx + laneWidth / 2, judgmentY);

        // Receptor press shockwave beam
        if (isPressed) {
          const beamGrad = ctx.createLinearGradient(0, judgmentY, 0, judgmentY - 140);
          beamGrad.addColorStop(0, `${laneColor}66`);
          beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = beamGrad;
          ctx.fillRect(rx + padPadding, judgmentY - 140, laneWidth - padPadding * 2, 140);
        }
      }

      // -----------------------------------------------------------
      // 3. GHOST TELEMETRY RIVAL GHOST STREAM (IF ACTIVE)
      // -----------------------------------------------------------
      if (ghostTelemetry && ghostTelemetry.length > 0) {
        ctx.fillStyle = 'rgba(180, 100, 255, 0.35)';
        for (const input of ghostTelemetry) {
          const delta = input.timeMs - currentTimeMs;
          if (delta >= -100 && delta <= visibleWindowMs) {
            const gy = judgmentY - (delta / visibleWindowMs) * judgmentY;
            const gx = highwayX + input.lane * laneWidth + laneWidth / 2;
            ctx.beginPath();
            ctx.arc(gx, gy, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // -----------------------------------------------------------
      // 4. DRAW NOTES & PROCESS HOLD TICKS / MISSES
      // -----------------------------------------------------------
      const noteMap = noteStatusRef.current;

      for (const note of beatmap.notes) {
        const status = noteMap.get(note.id);
        if (!status) continue;

        const timeDiff = note.targetTimeMs - currentTimeMs;
        const duration = note.durationMs || 0;

        // Auto Miss checking for unhit notes
        if (!status.processed && timeDiff < -130) {
          status.processed = true;
          onJudgement('MISS', -130, note);
          globalAudioEngine.playHitSound('MISS');
          popupsRef.current.push({
            x: highwayX + note.lane * laneWidth + laneWidth / 2,
            y: judgmentY - 10,
            judgement: 'MISS',
            alpha: 1.0,
            deltaMs: -130,
            scale: 0.9,
            created: performance.now(),
          });
        }

        // Active hold note sustain checking
        if (note.type === 'hold' && status.holding && !status.holdCompleted) {
          const holdElapsed = currentTimeMs - (status.holdStartTime || note.targetTimeMs);
          const isHoldingKey = laneActiveRef.current[note.lane];

          if (isHoldingKey) {
            // Spawn continuous sparks at judgment line
            if (Math.random() < 0.6) {
              const lx = highwayX + note.lane * laneWidth + laneWidth / 2;
              particlesRef.current.push({
                x: lx + (Math.random() - 0.5) * (laneWidth * 0.6),
                y: judgmentY,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                size: Math.random() * 3 + 1,
                color: note.isFever ? '#ffd166' : LANE_COLORS[note.lane],
                alpha: 1.0,
                life: 0,
                maxLife: 15,
              });
            }

            // Completed hold successfully
            if (currentTimeMs >= note.targetTimeMs + duration) {
              status.holdCompleted = true;
              status.holding = false;
              onJudgement('MARVELOUS', 0, note);
              globalAudioEngine.playHitSound('MARVELOUS');
              spawnHitParticles(highwayX + note.lane * laneWidth + laneWidth / 2, judgmentY, LANE_COLORS[note.lane], note.isFever);
            }
          } else {
            // Dropped hold early
            status.holding = false;
            status.holdCompleted = true;
            onJudgement('GOOD', 80, note);
          }
        }

        // Check if note is in visible frustum
        const noteEndTime = note.targetTimeMs + duration;
        if (noteEndTime < currentTimeMs - 150) continue; // Behind player
        if (note.targetTimeMs > currentTimeMs + visibleWindowMs + 50) continue; // Far ahead

        const laneX = highwayX + note.lane * laneWidth;
        const noteY = judgmentY - (timeDiff / visibleWindowMs) * judgmentY;
        const noteColor = note.isFever ? '#ffd166' : LANE_COLORS[note.lane];
        const noteWidth = laneWidth - 14;
        const noteHeight = 18;

        // DRAW HOLD BODY RIBBON
        if (note.type === 'hold' && duration > 0) {
          const holdEndDiff = (note.targetTimeMs + duration) - currentTimeMs;
          const holdEndY = judgmentY - (holdEndDiff / visibleWindowMs) * judgmentY;
          const bodyY = Math.max(holdEndY, 0);
          const bodyHeight = Math.max(4, noteY - bodyY);

          // Hold ribbon gradient
          const holdGrad = ctx.createLinearGradient(0, bodyY, 0, noteY);
          if (status.holding) {
            holdGrad.addColorStop(0, note.isFever ? 'rgba(255, 209, 102, 0.8)' : `${noteColor}cc`);
            holdGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
          } else {
            holdGrad.addColorStop(0, note.isFever ? 'rgba(255, 209, 102, 0.25)' : `${noteColor}44`);
            holdGrad.addColorStop(1, note.isFever ? 'rgba(255, 209, 102, 0.55)' : `${noteColor}88`);
          }

          ctx.fillStyle = holdGrad;
          ctx.beginPath();
          ctx.roundRect(laneX + 16, bodyY, noteWidth - 18, bodyHeight, 4);
          ctx.fill();

          // Hold rail border
          ctx.strokeStyle = status.holding ? '#ffffff' : noteColor;
          ctx.lineWidth = status.holding ? 2 : 1;
          ctx.stroke();
        }

        // DRAW NOTE HEAD (TAP OR HOLD START)
        if (!status.processed || (note.type === 'hold' && !status.holdCompleted)) {
          ctx.save();
          ctx.shadowBlur = note.isFever ? 20 : 12;
          ctx.shadowColor = noteColor;

          // Note capsule body
          const noteGrad = ctx.createLinearGradient(laneX + 7, noteY - noteHeight / 2, laneX + 7, noteY + noteHeight / 2);
          noteGrad.addColorStop(0, '#ffffff');
          noteGrad.addColorStop(0.3, noteColor);
          noteGrad.addColorStop(1, note.isFever ? '#ff5400' : `${noteColor}cc`);

          ctx.fillStyle = noteGrad;
          ctx.beginPath();
          ctx.roundRect(laneX + 7, noteY - noteHeight / 2, noteWidth, noteHeight, 6);
          ctx.fill();

          // Inner gloss highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.roundRect(laneX + 12, noteY - noteHeight / 2 + 2, noteWidth - 10, 4, 2);
          ctx.fill();

          // Gold Fever Note rotating corona
          if (note.isFever) {
            ctx.strokeStyle = '#fff275';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(laneX + laneWidth / 2, noteY, 14, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // -----------------------------------------------------------
      // 5. DRAW BURST PARTICLES
      // -----------------------------------------------------------
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.life++;
        p.alpha = 1 - (p.life / p.maxLife);

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // -----------------------------------------------------------
      // 6. DRAW HIT JUDGEMENT POPUPS
      // -----------------------------------------------------------
      const popups = popupsRef.current;
      const nowPerf = performance.now();
      for (let i = popups.length - 1; i >= 0; i--) {
        const popup = popups[i];
        const age = nowPerf - popup.created;

        if (age > 650) {
          popups.splice(i, 1);
          continue;
        }

        const progress = age / 650;
        popup.alpha = 1 - progress;
        popup.y -= 0.8; // float up

        ctx.save();
        ctx.globalAlpha = Math.max(0, popup.alpha);

        let color = '#00f0ff';
        if (popup.judgement === 'MARVELOUS') color = '#ffd166';
        else if (popup.judgement === 'PERFECT') color = '#00f0ff';
        else if (popup.judgement === 'GREAT') color = '#06d6a0';
        else if (popup.judgement === 'GOOD') color = '#b5179e';
        else if (popup.judgement === 'MISS') color = '#ff0055';

        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.font = '800 20px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(popup.judgement, popup.x, popup.y);

        // Early/Late delta display
        if (popup.judgement !== 'MISS' && Math.abs(popup.deltaMs) > 10) {
          ctx.font = '600 11px "JetBrains Mono", monospace';
          ctx.fillStyle = popup.deltaMs > 0 ? '#ffb703' : '#38bdf8';
          const timingLabel = popup.deltaMs > 0 ? `LATE +${Math.round(popup.deltaMs)}ms` : `EARLY ${Math.round(popup.deltaMs)}ms`;
          ctx.fillText(timingLabel, popup.x, popup.y + 16);
        }

        ctx.restore();
      }

      ctx.restore(); // Restore shake
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [beatmap, getCurrentTimeMs, scrollSpeed, isFeverActive, onJudgement, spawnHitParticles]);

  // Exposed trigger for key/touch hit judgment
  const registerPlayerHit = useCallback((lane: 0 | 1 | 2 | 3) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentTimeMs = getCurrentTimeMs();
    const noteMap = noteStatusRef.current;
    const highwayWidth = Math.min(canvas.width * 0.92, 540);
    const highwayX = (canvas.width - highwayWidth) / 2;
    const laneWidth = highwayWidth / 4;
    const hitX = highwayX + lane * laneWidth + laneWidth / 2;
    const judgmentY = canvas.height - 90;

    // Search for closest active note in this lane
    // Accuracy windows:
    // MARVELOUS: ±25ms
    // PERFECT:   ±50ms
    // GREAT:     ±85ms
    // GOOD:      ±125ms
    let bestNote: BeatmapNote | null = null;
    let minDelta = Infinity;
    let signedDelta = 0;

    for (const note of beatmap.notes) {
      if (note.lane !== lane) continue;
      const status = noteMap.get(note.id);
      if (status && status.processed) continue;

      const delta = currentTimeMs - note.targetTimeMs;
      const absDelta = Math.abs(delta);

      if (absDelta <= 130 && absDelta < minDelta) {
        minDelta = absDelta;
        signedDelta = delta;
        bestNote = note;
      }
    }

    if (bestNote) {
      const status = noteMap.get(bestNote.id)!;
      let judgement: HitJudgement = 'GOOD';

      if (minDelta <= 25) judgement = 'MARVELOUS';
      else if (minDelta <= 50) judgement = 'PERFECT';
      else if (minDelta <= 85) judgement = 'GREAT';
      else judgement = 'GOOD';

      if (bestNote.type === 'hold') {
        status.holding = true;
        status.holdStartTime = currentTimeMs;
        onJudgement(judgement, signedDelta, bestNote);
        globalAudioEngine.playHitSound(judgement);
        spawnHitParticles(hitX, judgmentY, LANE_COLORS[lane], bestNote.isFever);
      } else {
        status.processed = true;
        onJudgement(judgement, signedDelta, bestNote);
        globalAudioEngine.playHitSound(judgement);
        spawnHitParticles(hitX, judgmentY, LANE_COLORS[lane], bestNote.isFever);
      }

      popupsRef.current.push({
        x: hitX,
        y: judgmentY - 15,
        judgement,
        alpha: 1.0,
        deltaMs: signedDelta,
        scale: 1.2,
        created: performance.now(),
      });
    }
  }, [beatmap, getCurrentTimeMs, onJudgement, spawnHitParticles]);

  // Expose registerPlayerHit to window or parent via custom event
  useEffect(() => {
    const handleHighwayHitEvent = (e: CustomEvent<{ lane: 0 | 1 | 2 | 3 }>) => {
      registerPlayerHit(e.detail.lane);
    };
    window.addEventListener('rhythm:lane_down' as any, handleHighwayHitEvent);
    return () => {
      window.removeEventListener('rhythm:lane_down' as any, handleHighwayHitEvent);
    };
  }, [registerPlayerHit]);

  // Handle canvas resize dynamically
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none touch-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onClick={(e) => {
          if (!canvasRef.current) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const highwayWidth = Math.min(canvasRef.current.width * 0.92, 540);
          const highwayX = (canvasRef.current.width - highwayWidth) / 2;
          const laneWidth = highwayWidth / 4;
          const laneIndex = Math.floor((clickX - highwayX) / laneWidth);
          if (laneIndex >= 0 && laneIndex <= 3) {
            onLaneClick?.(laneIndex as 0 | 1 | 2 | 3);
          }
        }}
      />
    </div>
  );
};
