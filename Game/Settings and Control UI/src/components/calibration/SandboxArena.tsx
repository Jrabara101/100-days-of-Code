import React, { useRef, useEffect, useState } from 'react';
import { Play, RotateCcw, Zap, Target, Gauge } from 'lucide-react';
import { SettingsState } from '@/types/settings';
import { soundEngine } from '@/services/audioService';

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

interface TargetDummy {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  hitAnim: number;
}

export interface SandboxArenaProps {
  settings: SettingsState;
  rawStickX: number;
  rawStickY: number;
  rawRightX: number;
  rawRightY: number;
}

export const SandboxArena: React.FC<SandboxArenaProps> = ({
  settings,
  rawStickX,
  rawStickY,
  rawRightX,
  rawRightY,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [latency] = useState<number>(3.8);
  const [actionLog, setActionLog] = useState<string>('Arena Initialized. Ready for calibration.');
  const [dpiVelocity, setDpiVelocity] = useState<number>(0);

  // Avatar state
  const avatarRef = useRef({
    x: 120,
    y: 100,
    vx: 0,
    vy: 0,
    z: 0, // for jump
    vz: 0,
    isJumping: false,
    isSprinting: false,
    isCrouching: false,
    aimAngle: 0,
  });

  const mousePosRef = useRef({ x: 120, y: 100, lastX: 120, lastY: 100 });
  const projectilesRef = useRef<Projectile[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const targetsRef = useRef<TargetDummy[]>([
    { x: 300, y: 60, radius: 18, hp: 100, maxHp: 100, hitAnim: 0 },
    { x: 320, y: 150, radius: 18, hp: 100, maxHp: 100, hitAnim: 0 },
  ]);

  // Keys active set
  const activeKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      activeKeysRef.current.add(e.code);

      // Check jump
      if (e.code === settings.controls.jump.primary.code || e.code === settings.controls.jump.secondary?.code) {
        if (!avatarRef.current.isJumping) {
          avatarRef.current.isJumping = true;
          avatarRef.current.vz = 5.5;
          soundEngine.playJump();
          setActionLog('Action: Tactical Jump / Mantle');
        }
      }

      // Check reload
      if (e.code === settings.controls.reload.primary.code || e.code === settings.controls.reload.secondary?.code) {
        soundEngine.playSelectClick();
        setActionLog('Action: Reloading Weapon Magazine');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      activeKeysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [settings.controls]);

  // Fire action helper
  const triggerFire = (originX: number, originY: number, angle: number) => {
    soundEngine.playFire();
    const speed = 12;
    projectilesRef.current.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 50,
    });
    setActionLog('Action: Primary Fire Discharged');
  };

  // Main Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const avatar = avatarRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Calculate movement input
      let moveX = 0;
      let moveY = 0;

      // Keyboard WASD check
      if (activeKeysRef.current.has(settings.controls.move_forward.primary.code) || activeKeysRef.current.has(settings.controls.move_forward.secondary?.code || '')) {
        moveY -= 1;
      }
      if (activeKeysRef.current.has(settings.controls.move_backward.primary.code) || activeKeysRef.current.has(settings.controls.move_backward.secondary?.code || '')) {
        moveY += 1;
      }
      if (activeKeysRef.current.has(settings.controls.move_left.primary.code) || activeKeysRef.current.has(settings.controls.move_left.secondary?.code || '')) {
        moveX -= 1;
      }
      if (activeKeysRef.current.has(settings.controls.move_right.primary.code) || activeKeysRef.current.has(settings.controls.move_right.secondary?.code || '')) {
        moveX += 1;
      }

      // Add Gamepad stick input
      const deadzone = settings.gameplaySettings.stickDeadzone;
      const stickMag = Math.hypot(rawStickX, rawStickY);
      if (stickMag > deadzone) {
        moveX += rawStickX;
        moveY += rawStickY;
      }

      // Sprint check
      const sprintKeyActive = activeKeysRef.current.has(settings.controls.sprint.primary.code) || activeKeysRef.current.has(settings.controls.sprint.secondary?.code || '');
      avatar.isSprinting = sprintKeyActive;

      // Crouch check
      const crouchKeyActive = activeKeysRef.current.has(settings.controls.crouch.primary.code) || activeKeysRef.current.has(settings.controls.crouch.secondary?.code || '');
      avatar.isCrouching = crouchKeyActive;

      // Calculate speed
      const baseSpeed = avatar.isCrouching ? 60 : avatar.isSprinting ? 220 : 130;
      const moveMag = Math.hypot(moveX, moveY);
      if (moveMag > 0) {
        avatar.vx = (moveX / moveMag) * baseSpeed;
        avatar.vy = (moveY / moveMag) * baseSpeed;
      } else {
        avatar.vx *= 0.8;
        avatar.vy *= 0.8;
      }

      avatar.x += avatar.vx * dt;
      avatar.y += avatar.vy * dt;

      // Bounds clamping
      avatar.x = Math.max(20, Math.min(width - 20, avatar.x));
      avatar.y = Math.max(20, Math.min(height - 20, avatar.y));

      // Jump physics
      if (avatar.isJumping) {
        avatar.z += avatar.vz;
        avatar.vz -= 18 * dt;
        if (avatar.z <= 0) {
          avatar.z = 0;
          avatar.vz = 0;
          avatar.isJumping = false;
        }
      }

      // Aim direction
      const rightStickMag = Math.hypot(rawRightX, rawRightY);
      if (rightStickMag > 0.2) {
        avatar.aimAngle = Math.atan2(rawRightY, rawRightX);
      } else {
        const dx = mousePosRef.current.x - avatar.x;
        const dy = mousePosRef.current.y - avatar.y;
        avatar.aimAngle = Math.atan2(dy, dx);
      }

      // 2. Render Arena Chamber
      ctx.clearRect(0, 0, width, height);

      // Grid Lines
      ctx.strokeStyle = '#1E2538';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render Targets
      targetsRef.current.forEach((target) => {
        if (target.hitAnim > 0) target.hitAnim -= dt * 4;

        ctx.save();
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fillStyle = target.hitAnim > 0 ? '#EF4444' : '#1C2232';
        ctx.fill();
        ctx.strokeStyle = target.hitAnim > 0 ? '#FCA5A5' : '#38BDF8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner bullseye
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = target.hitAnim > 0 ? '#FFFFFF' : '#0284C7';
        ctx.fill();

        // HP bar above target
        const barWidth = 32;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(target.x - barWidth / 2, target.y - target.radius - 10, barWidth, 4);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(target.x - barWidth / 2, target.y - target.radius - 10, (target.hp / target.maxHp) * barWidth, 4);

        ctx.restore();
      });

      // Render Projectiles & Collision Check
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const p = projectilesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        // Collision with targets
        targetsRef.current.forEach((target) => {
          const dist = Math.hypot(p.x - target.x, p.y - target.y);
          if (dist < target.radius + 4) {
            p.life = 0;
            target.hitAnim = 1;
            target.hp = Math.max(10, target.hp - 25);
            if (target.hp <= 10) target.hp = 100; // auto respawn hp

            // Spawn sparks
            for (let s = 0; s < 6; s++) {
              const spAngle = Math.random() * Math.PI * 2;
              const spSpeed = Math.random() * 4 + 2;
              sparksRef.current.push({
                x: p.x,
                y: p.y,
                vx: Math.cos(spAngle) * spSpeed,
                vy: Math.sin(spAngle) * spSpeed,
                color: '#38BDF8',
                life: 15,
              });
            }
          }
        });

        if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          projectilesRef.current.splice(i, 1);
          continue;
        }

        // Draw projectile laser bolt
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      }

      // Render Sparks
      for (let s = sparksRef.current.length - 1; s >= 0; s--) {
        const sp = sparksRef.current[s];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= 1;
        if (sp.life <= 0) {
          sparksRef.current.splice(s, 1);
          continue;
        }
        ctx.fillStyle = sp.color;
        ctx.fillRect(sp.x, sp.y, 2, 2);
      }

      // Render Avatar Shadow (scaled with jump height)
      const shadowRadius = Math.max(4, 12 - avatar.z * 0.4);
      ctx.beginPath();
      ctx.ellipse(avatar.x, avatar.y, shadowRadius, shadowRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Render Avatar Body
      const drawY = avatar.y - avatar.z;
      ctx.save();
      ctx.translate(avatar.x, drawY);

      // Sprint particle trail
      if (avatar.isSprinting && moveMag > 0) {
        ctx.beginPath();
        ctx.arc(-Math.cos(avatar.aimAngle) * 14, -Math.sin(avatar.aimAngle) * 14, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fill();
      }

      // Rotate towards aim angle
      ctx.rotate(avatar.aimAngle);

      // Chassis body
      ctx.beginPath();
      const bodyRadius = avatar.isCrouching ? 9 : 12;
      ctx.arc(0, 0, bodyRadius, 0, Math.PI * 2);
      ctx.fillStyle = avatar.isSprinting ? '#0284C7' : '#1C2232';
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tactical Visor / Direction pointer
      ctx.beginPath();
      ctx.moveTo(bodyRadius - 2, -4);
      ctx.lineTo(bodyRadius + 7, 0);
      ctx.lineTo(bodyRadius - 2, 4);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();

      ctx.restore();

      // Render crosshair at mouse or stick position
      ctx.save();
      const crossX = rightStickMag > 0.2 ? avatar.x + Math.cos(avatar.aimAngle) * 80 : mousePosRef.current.x;
      const crossY = rightStickMag > 0.2 ? avatar.y + Math.sin(avatar.aimAngle) * 80 : mousePosRef.current.y;

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(crossX, crossY, 6, 0, Math.PI * 2);
      ctx.moveTo(crossX - 10, crossY);
      ctx.lineTo(crossX + 10, crossY);
      ctx.moveTo(crossX, crossY - 10);
      ctx.lineTo(crossX, crossY + 10);
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [rawStickX, rawStickY, rawRightX, rawRightY, settings.controls, settings.gameplaySettings.stickDeadzone]);

  // Track mouse movement inside canvas for aim and DPI velocity calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const dx = currentX - mousePosRef.current.lastX;
    const dy = currentY - mousePosRef.current.lastY;
    const dist = Math.hypot(dx, dy);
    setDpiVelocity(Math.min(999, Math.round(dist * settings.gameplaySettings.mouseSensitivity * 10)));

    mousePosRef.current.x = currentX;
    mousePosRef.current.y = currentY;
    mousePosRef.current.lastX = currentX;
    mousePosRef.current.lastY = currentY;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      // Primary Fire
      const avatar = avatarRef.current;
      triggerFire(avatar.x, avatar.y - avatar.z, avatar.aimAngle);
    } else if (e.button === 2) {
      // ADS toggle
      setActionLog('Action: Aim Down Sights (ADS) Engaged');
    }
  };

  const resetAvatar = () => {
    soundEngine.playHoverTick();
    avatarRef.current.x = 120;
    avatarRef.current.y = 100;
    avatarRef.current.vx = 0;
    avatarRef.current.vy = 0;
    avatarRef.current.z = 0;
    setActionLog('Avatar coordinates calibrated to origin.');
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#0E1118] border border-[#1E2538] shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Live Input Calibration & Arena Sandbox
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/50">
            <Zap className="w-3 h-3 animate-pulse" />
            LATENCY: {latency}ms
          </span>
          <button
            type="button"
            onClick={resetAvatar}
            title="Reset avatar position"
            className="p-1 rounded bg-[#1C2232] hover:bg-[#283145] text-slate-300 border border-[#1E2538]"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-[#1E2538] bg-[#08090D] shadow-inner cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={380}
          height={210}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-[210px] block"
        />

        {/* Telemetry Overlay Pills */}
        <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-slate-700 text-[10px] font-mono text-slate-300">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span>DPI VEL: {dpiVelocity} px/s</span>
          </div>
        </div>

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm truncate max-w-[280px]">
            {actionLog}
          </span>
          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700">
            LIVE 60FPS
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#1E2538]">
        <span>[WASD] Move</span>
        <span>[SPACE] Jump</span>
        <span>[L-SHIFT] Sprint</span>
        <span>[CLICK] Fire</span>
        <span>[R] Reload</span>
      </div>
    </div>
  );
};
