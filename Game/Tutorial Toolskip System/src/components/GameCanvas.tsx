import React, { useRef, useEffect, useCallback } from 'react';
import { EntityState, INPUT_MASK, PlayerInputPacket, ReplayEventMarker } from '../types/replay';
import { GameSimulation } from '../game/GameSimulation';
import { VirtualInputHUD } from './VirtualInputHUD';

interface GameCanvasProps {
  isLiveGameMode: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  interpolatedEntities: EntityState[];
  ghostEntities: EntityState[];
  isGhostEnabled: boolean;
  currentInput: PlayerInputPacket | null;
  activeMarker: ReplayEventMarker | null;
  onLiveTick?: (input: PlayerInputPacket, snapshot?: ReturnType<GameSimulation['createSnapshot']>) => void;
  onLiveMarker?: (marker: Omit<ReplayEventMarker, 'id'>) => void;
}

export const GameCanvas = React.forwardRef<HTMLCanvasElement, GameCanvasProps>(({
  isLiveGameMode,
  isPlaying,
  playbackSpeed,
  interpolatedEntities,
  ghostEntities,
  isGhostEnabled,
  currentInput,
  activeMarker,
  onLiveTick,
  onLiveMarker,
}, forwardedRef) => {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = (forwardedRef as React.RefObject<HTMLCanvasElement>) || internalRef;

  // Local game simulation instance for live gameplay mode
  const liveSimRef = useRef<GameSimulation>(new GameSimulation());
  const keysDownRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 600, y: 350 });

  // Milestone flash animation timer
  const flashAlphaRef = useRef<number>(0);
  const flashColorRef = useRef<string>('#38BDF8');

  // Sync marker flash
  useEffect(() => {
    if (activeMarker) {
      flashAlphaRef.current = 0.35;
      if (activeMarker.category === 'kill') flashColorRef.current = '#F59E0B';
      else if (activeMarker.category === 'death') flashColorRef.current = '#F43F5E';
      else if (activeMarker.category === 'ability') flashColorRef.current = '#8B5CF6';
      else if (activeMarker.category === 'checkpoint') flashColorRef.current = '#10B981';
      else flashColorRef.current = '#38BDF8';
    }
  }, [activeMarker]);

  // Live game mode simulation loop
  useEffect(() => {
    if (!isLiveGameMode) return;

    const sim = liveSimRef.current;
    sim.onEventMarker = (m) => {
      if (onLiveMarker) onLiveMarker(m);
    };

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Capture active input packet
      const inputPacket: PlayerInputPacket = {
        tick: sim.tick,
        dt,
        keys: keysDownRef.current,
        cursor: { ...mousePosRef.current },
      };

      sim.step(inputPacket);

      // Snapshot every 60 ticks
      const snapshot = sim.tick % 60 === 0 ? sim.createSnapshot() : undefined;
      if (onLiveTick) {
        onLiveTick(inputPacket, snapshot);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isLiveGameMode, onLiveTick, onLiveMarker]);

  // Live Keyboard Listeners
  useEffect(() => {
    if (!isLiveGameMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) keysDownRef.current |= INPUT_MASK.UP;
      if (['KeyS', 'ArrowDown'].includes(e.code)) keysDownRef.current |= INPUT_MASK.DOWN;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) keysDownRef.current |= INPUT_MASK.LEFT;
      if (['KeyD', 'ArrowRight'].includes(e.code)) keysDownRef.current |= INPUT_MASK.RIGHT;
      if (['ShiftLeft', 'ShiftRight', 'Space'].includes(e.code)) keysDownRef.current |= INPUT_MASK.DASH;
      if (['KeyQ', 'KeyE'].includes(e.code)) keysDownRef.current |= INPUT_MASK.ABILITY;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['KeyW', 'ArrowUp'].includes(e.code)) keysDownRef.current &= ~INPUT_MASK.UP;
      if (['KeyS', 'ArrowDown'].includes(e.code)) keysDownRef.current &= ~INPUT_MASK.DOWN;
      if (['KeyA', 'ArrowLeft'].includes(e.code)) keysDownRef.current &= ~INPUT_MASK.LEFT;
      if (['KeyD', 'ArrowRight'].includes(e.code)) keysDownRef.current &= ~INPUT_MASK.RIGHT;
      if (['ShiftLeft', 'ShiftRight', 'Space'].includes(e.code)) keysDownRef.current &= ~INPUT_MASK.DASH;
      if (['KeyQ', 'KeyE'].includes(e.code)) keysDownRef.current &= ~INPUT_MASK.ABILITY;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isLiveGameMode]);

  // Mouse Movement & Clicks
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mousePosRef.current = {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      keysDownRef.current |= INPUT_MASK.FIRE;
    } else if (e.button === 2) {
      keysDownRef.current |= INPUT_MASK.ABILITY;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      keysDownRef.current &= ~INPUT_MASK.FIRE;
    } else if (e.button === 2) {
      keysDownRef.current &= ~INPUT_MASK.ABILITY;
    }
  };

  // Main Render Loop (renders both Live Mode and Theater Replay Mode)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Sci-Fi Obsidian Grid Background
      ctx.fillStyle = '#07090E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Lines
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Arena Hazard Border
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Select entities to render (from live simulation or replay interpolation)
      let entitiesToRender: EntityState[] = [];
      if (isLiveGameMode) {
        const liveSnapshot = liveSimRef.current.createSnapshot();
        entitiesToRender = liveSnapshot.entities;
      } else {
        entitiesToRender = interpolatedEntities;
      }

      // 2. Draw Ghost Run Simulation (Translucent Neon Cyan Path & Avatar)
      if (isGhostEnabled && ghostEntities.length > 0) {
        const ghostPlayer = ghostEntities.find(e => e.id === 'player');
        if (ghostPlayer) {
          ctx.save();
          // Ghost trail aura
          ctx.beginPath();
          ctx.arc(ghostPlayer.pos.x, ghostPlayer.pos.y, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.fill();

          // Ghost avatar
          ctx.translate(ghostPlayer.pos.x, ghostPlayer.pos.y);
          ctx.rotate(ghostPlayer.rotation ?? 0);
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(-12, -12);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-12, 12);
          ctx.closePath();
          ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.fill();
          ctx.stroke();

          // Label above ghost
          ctx.setLineDash([]);
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#06B6D4';
          ctx.fillText('GHOST ECHO', -28, -20);
          ctx.restore();
        }
      }

      // 3. Draw Game Entities (Crystals, Enemies, Boss, Player)
      for (const ent of entitiesToRender) {
        ctx.save();

        if (ent.type === 'crystal') {
          // Power Gem
          ctx.beginPath();
          ctx.arc(ent.pos.x, ent.pos.y, ent.radius ?? 10, 0, Math.PI * 2);
          ctx.fillStyle = ent.color ?? '#38BDF8';
          ctx.shadowColor = ent.color ?? '#38BDF8';
          ctx.shadowBlur = 12;
          ctx.fill();
        } else if (ent.type === 'enemy' || ent.type === 'boss') {
          // Enemy Drone / Boss Sentinel
          ctx.translate(ent.pos.x, ent.pos.y);
          ctx.rotate(ent.rotation ?? 0);

          const isBoss = ent.type === 'boss';
          ctx.beginPath();
          if (isBoss) {
            // Octagonal Boss Mech
            const r = ent.radius ?? 28;
            for (let a = 0; a < 8; a++) {
              const angle = (a / 8) * Math.PI * 2;
              const px = Math.cos(angle) * r;
              const py = Math.sin(angle) * r;
              if (a === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = '#1E1B4B';
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#F59E0B';
            ctx.shadowBlur = 18;
          } else {
            // Drone diamond
            ctx.moveTo(14, 0);
            ctx.lineTo(-10, -10);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-10, 10);
            ctx.closePath();
            ctx.fillStyle = '#311018';
            ctx.strokeStyle = '#F43F5E';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#F43F5E';
            ctx.shadowBlur = 10;
          }
          ctx.fill();
          ctx.stroke();

          // Health Bar
          if (ent.health !== undefined && ent.maxHealth !== undefined) {
            ctx.rotate(-(ent.rotation ?? 0));
            const barWidth = isBoss ? 60 : 30;
            const barHeight = 4;
            const hpPct = Math.max(0, ent.health / ent.maxHealth);
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(-barWidth / 2, -35, barWidth, barHeight);
            ctx.fillStyle = isBoss ? '#F59E0B' : '#F43F5E';
            ctx.fillRect(-barWidth / 2, -35, barWidth * hpPct, barHeight);
          }
        } else if (ent.type === 'player') {
          // Player Ship
          ctx.translate(ent.pos.x, ent.pos.y);
          ctx.rotate(ent.rotation ?? 0);

          // Thruster flame
          ctx.beginPath();
          ctx.moveTo(-12, -5);
          ctx.lineTo(-24 - Math.random() * 8, 0);
          ctx.lineTo(-12, 5);
          ctx.fillStyle = '#38BDF8';
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 14;
          ctx.fill();

          // Ship chassis
          ctx.beginPath();
          ctx.moveTo(20, 0);
          ctx.lineTo(-12, -14);
          ctx.lineTo(-6, 0);
          ctx.lineTo(-12, 14);
          ctx.closePath();
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#38BDF8';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.stroke();

          // Shield pulse if active
          if (ent.stateFlags & 2) {
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.strokeStyle = '#8B5CF6';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
            ctx.fill();
            ctx.stroke();
          }

          // Player Health & Energy Bar Overhead
          ctx.rotate(-(ent.rotation ?? 0));
          const pBarW = 40;
          const pHpPct = (ent.health ?? 100) / (ent.maxHealth ?? 100);
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillRect(-pBarW / 2, -28, pBarW, 4);
          ctx.fillStyle = pHpPct > 0.25 ? '#38BDF8' : '#F43F5E';
          ctx.fillRect(-pBarW / 2, -28, pBarW * pHpPct, 4);
        }

        ctx.restore();
      }

      // 4. In Live Mode, render live projectiles & particles
      if (isLiveGameMode) {
        const liveSim = liveSimRef.current;
        for (const p of liveSim.projectiles) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.restore();
        }

        for (const pt of liveSim.particles) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
          ctx.fill();
          ctx.restore();
        }
      }

      // 5. Draw Aiming Reticle
      const cursor = currentInput ? currentInput.cursor : mousePosRef.current;
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 10, 0, Math.PI * 2);
      ctx.moveTo(cursor.x - 14, cursor.y);
      ctx.lineTo(cursor.x + 14, cursor.y);
      ctx.moveTo(cursor.x, cursor.y - 14);
      ctx.lineTo(cursor.x, cursor.y + 14);
      ctx.stroke();
      ctx.restore();

      // 6. Draw Milestone Flash Glow if triggered
      if (flashAlphaRef.current > 0) {
        ctx.save();
        ctx.fillStyle = flashColorRef.current;
        ctx.globalAlpha = flashAlphaRef.current;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        flashAlphaRef.current = Math.max(0, flashAlphaRef.current - 0.03);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isLiveGameMode, interpolatedEntities, ghostEntities, isGhostEnabled, currentInput]);

  const isSlowMo = playbackSpeed < 1.0;

  return (
    <div
      className={`relative w-full aspect-[16/9] max-h-[720px] rounded-2xl overflow-hidden bg-[#07090E] border transition-all duration-300 shadow-2xl ${
        isSlowMo
          ? 'border-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.35)] animate-pulse'
          : 'border-slate-800'
      }`}
    >
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full object-contain cursor-crosshair block"
      />

      {/* On-Canvas Virtual Input Telemetry HUD */}
      <VirtualInputHUD input={currentInput} />

      {/* Slow-Motion Ambient Indicator */}
      {isSlowMo && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-mono text-xs font-bold rounded-lg shadow-lg animate-pulse pointer-events-none">
          ⚡ SLOW-MOTION REPLAY [{playbackSpeed.toFixed(2)}x]
        </div>
      )}

      {/* Live Recording HUD Prompt */}
      {isLiveGameMode && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-mono rounded-lg pointer-events-none">
          WASD Move • M1 Shoot • M2 Shield/EMP • Shift Dash
        </div>
      )}
    </div>
  );
});
GameCanvas.displayName = 'GameCanvas';
