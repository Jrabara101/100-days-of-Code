import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Gamepad,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AnimationClip, SpriteFrame } from '../types/sprite';
import { sounds } from '../lib/soundFx';

interface PlaytestModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: HTMLImageElement | null;
  clips: AnimationClip[];
  frames: Record<string, SpriteFrame>;
  pixelated: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

interface DamageNumber {
  x: number;
  y: number;
  text: string;
  color: string;
  vy: number;
  alpha: number;
  life: number;
}

export const PlaytestModal: React.FC<PlaytestModalProps> = ({
  isOpen,
  onClose,
  image,
  clips,
  frames,
  pixelated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gamepadConnected, setGamepadConnected] = useState(false);

  // Character physics state
  const charRef = useRef({
    x: 180,
    y: 320,
    vx: 0,
    vy: 0,
    facingRight: true,
    isGrounded: true,
    isAttacking: false,
    attackTimer: 0,
    activeClipName: 'idle',
    frameIdx: 0,
    accumTime: 0,
  });

  // Training dummy state
  const dummyRef = useRef({
    x: 480,
    y: 320,
    width: 28,
    height: 48,
    health: 100,
    hitFlash: 0,
    shakeX: 0,
  });

  // Floating particles & damage text
  const particlesRef = useRef<Particle[]>([]);
  const damageTextsRef = useRef<DamageNumber[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});

  // Keyboard listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Gamepad connection
    const handleGamepadConnect = () => setGamepadConnected(true);
    const handleGamepadDisconnect = () => setGamepadConnected(false);
    window.addEventListener('gamepadconnected', handleGamepadConnect);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnect);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('gamepadconnected', handleGamepadConnect);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnect);
    };
  }, [isOpen]);

  // Find clip by action keyword
  const getClipForAction = useCallback(
    (action: 'idle' | 'run' | 'jump' | 'attack'): AnimationClip | null => {
      const lower = action.toLowerCase();
      const match = clips.find((c) => c.name.toLowerCase().includes(lower));
      return match || clips[0] || null;
    },
    [clips]
  );

  // Main Physics & Render Loop
  useEffect(() => {
    if (!isOpen || !image) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const keys = keysRef.current;
      const char = charRef.current;
      const dummy = dummyRef.current;

      // 1. Gamepad input polling
      let gpLeft = false;
      let gpRight = false;
      let gpJump = false;
      let gpAttack = false;

      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      if (gamepads && gamepads[0]) {
        const gp = gamepads[0];
        if (gp) {
          gpLeft = gp.axes[0] < -0.3 || gp.buttons[14]?.pressed;
          gpRight = gp.axes[0] > 0.3 || gp.buttons[15]?.pressed;
          gpJump = gp.buttons[0]?.pressed; // A button
          gpAttack = gp.buttons[2]?.pressed; // X button
        }
      }

      const moveLeft = keys['KeyA'] || keys['ArrowLeft'] || gpLeft;
      const moveRight = keys['KeyD'] || keys['ArrowRight'] || gpRight;
      const jumpKey = keys['Space'] || keys['KeyW'] || keys['ArrowUp'] || gpJump;
      const attackKey = keys['KeyJ'] || keys['KeyF'] || gpAttack;

      // 2. Physics simulation
      const speed = 220; // px/sec
      const gravity = 900; // px/sec^2
      const jumpSpeed = -420; // px/sec
      const floorY = 320;

      // Horizontal movement
      if (moveLeft && !moveRight) {
        char.vx = -speed;
        char.facingRight = false;
      } else if (moveRight && !moveLeft) {
        char.vx = speed;
        char.facingRight = true;
      } else {
        char.vx *= 0.65; // Friction
        if (Math.abs(char.vx) < 5) char.vx = 0;
      }

      // Jump
      if (jumpKey && char.isGrounded && !char.isAttacking) {
        char.vy = jumpSpeed;
        char.isGrounded = false;
        if (soundEnabled) sounds.playJump();
      }

      // Attack
      if (attackKey && !char.isAttacking) {
        char.isAttacking = true;
        char.attackTimer = 0.35; // 350ms attack window
        if (soundEnabled) sounds.playSlash();
      }

      if (char.isAttacking) {
        char.attackTimer -= dt;
        if (char.attackTimer <= 0) {
          char.isAttacking = false;
        }
      }

      // Apply gravity
      char.vy += gravity * dt;
      char.x += char.vx * dt;
      char.y += char.vy * dt;

      // Platform & Wall collision
      const minX = 40;
      const maxX = canvas.width - 40;
      if (char.x < minX) {
        char.x = minX;
        char.vx = 0;
      }
      if (char.x > maxX) {
        char.x = maxX;
        char.vx = 0;
      }

      // Floor collision
      if (char.y >= floorY) {
        char.y = floorY;
        char.vy = 0;
        char.isGrounded = true;
      }

      // Determine active clip
      let targetClipAction: 'idle' | 'run' | 'jump' | 'attack' = 'idle';
      if (char.isAttacking) {
        targetClipAction = 'attack';
      } else if (!char.isGrounded) {
        targetClipAction = 'jump';
      } else if (Math.abs(char.vx) > 10) {
        targetClipAction = 'run';
      }

      const activeClip = getClipForAction(targetClipAction);
      if (activeClip) {
        if (char.activeClipName !== activeClip.name) {
          char.activeClipName = activeClip.name;
          char.frameIdx = 0;
          char.accumTime = 0;
        }

        // Animate frames
        char.accumTime += dt;
        const frameDuration = 1 / Math.max(1, activeClip.fps);
        if (char.accumTime >= frameDuration) {
          char.accumTime %= frameDuration;
          if (activeClip.frameIds.length > 0) {
            char.frameIdx = (char.frameIdx + 1) % activeClip.frameIds.length;
          }
        }
      }

      // Get current frame
      const currentFrameId =
        activeClip && activeClip.frameIds.length > 0
          ? activeClip.frameIds[char.frameIdx % activeClip.frameIds.length]
          : null;
      const currentFrame = currentFrameId ? frames[currentFrameId] : null;

      // 3. Hitbox vs Dummy Collision Detection
      const zoom = 2.5;
      let activeHitboxWorld: { x: number; y: number; w: number; h: number } | null = null;

      if (currentFrame && char.isAttacking) {
        const attackBox = currentFrame.hitboxes.find((h) => h.type === 'hitbox');
        if (attackBox) {
          const hw = attackBox.width * zoom;
          const hh = attackBox.height * zoom;
          const hx = char.facingRight
            ? char.x + (attackBox.x - currentFrame.anchorPoint.x) * zoom
            : char.x - (attackBox.x - currentFrame.anchorPoint.x + attackBox.width) * zoom;
          const hy = char.y + (attackBox.y - currentFrame.anchorPoint.y) * zoom;

          activeHitboxWorld = { x: hx, y: hy, w: hw, h: hh };

          // Check AABB collision with dummy
          const dummyX = dummy.x - dummy.width / 2;
          const dummyY = dummy.y - dummy.height;

          const collides =
            hx < dummyX + dummy.width &&
            hx + hw > dummyX &&
            hy < dummyY + dummy.height &&
            hy + hh > dummyY;

          if (collides && dummy.hitFlash <= 0) {
            // HIT TRIGGER!
            dummy.hitFlash = 0.2; // 200ms flash
            dummy.shakeX = 8;
            dummy.health = Math.max(0, dummy.health - 15);
            if (dummy.health === 0) dummy.health = 100;

            if (soundEnabled) sounds.playHit();

            // Spawn sparks
            for (let i = 0; i < 16; i++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 60 + Math.random() * 180;
              particlesRef.current.push({
                x: dummy.x + (Math.random() - 0.5) * 10,
                y: dummy.y - 24 + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 40,
                color: Math.random() > 0.5 ? '#EF4444' : '#F59E0B',
                size: 2 + Math.random() * 3,
                alpha: 1,
                life: 0.4,
              });
            }

            // Spawn floating damage text
            const dmg = 35 + Math.floor(Math.random() * 25);
            damageTextsRef.current.push({
              x: dummy.x,
              y: dummy.y - 50,
              text: `-${dmg} CRIT!`,
              color: '#F43F5E',
              vy: -70,
              alpha: 1,
              life: 0.8,
            });
          }
        }
      }

      // Update dummy shake & flash
      if (dummy.hitFlash > 0) dummy.hitFlash -= dt;
      if (dummy.shakeX > 0) dummy.shakeX = -dummy.shakeX * 0.8;
      if (Math.abs(dummy.shakeX) < 0.5) dummy.shakeX = 0;

      // Update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt / p.life;
        return p.alpha > 0;
      });

      // Update damage texts
      damageTextsRef.current = damageTextsRef.current.filter((d) => {
        d.y += d.vy * dt;
        d.alpha -= dt / d.life;
        return d.alpha > 0;
      });

      // 4. RENDERING STAGE
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyber stage background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#06070B');
      skyGrad.addColorStop(0.65, '#0F1420');
      skyGrad.addColorStop(1, '#05070C');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Backdrop neon pillars
      ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.fillRect(80, 60, 50, floorY - 60);
      ctx.fillRect(canvas.width - 130, 60, 50, floorY - 60);

      // Floor platform
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, floorY);
      ctx.lineTo(canvas.width - 30, floorY);
      ctx.stroke();

      // Neon floor grid hatch
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let px = 30; px <= canvas.width - 30; px += 24) {
        ctx.beginPath();
        ctx.moveTo(px, floorY);
        ctx.lineTo(px - 20, canvas.height);
        ctx.stroke();
      }

      // 5. Draw Training Dummy
      ctx.save();
      const dummyDrawX = dummy.x + dummy.shakeX;
      const dummyDrawY = dummy.y;
      ctx.fillStyle = dummy.hitFlash > 0 ? '#FFFFFF' : '#334155';
      ctx.strokeStyle = '#F59E0B'; // Dummy hurtbox wireframe
      ctx.lineWidth = 2;

      // Dummy body pillar
      ctx.fillRect(dummyDrawX - dummy.width / 2, dummyDrawY - dummy.height, dummy.width, dummy.height);
      ctx.strokeRect(dummyDrawX - dummy.width / 2, dummyDrawY - dummy.height, dummy.width, dummy.height);

      // Dummy head circle
      ctx.fillStyle = dummy.hitFlash > 0 ? '#FFFFFF' : '#475569';
      ctx.beginPath();
      ctx.arc(dummyDrawX, dummyDrawY - dummy.height - 10, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Dummy health bar
      const barW = 36;
      const barH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(dummyDrawX - barW / 2, dummyDrawY - dummy.height - 30, barW, barH);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(
        dummyDrawX - barW / 2,
        dummyDrawY - dummy.height - 30,
        (dummy.health / 100) * barW,
        barH
      );

      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#F59E0B';
      ctx.fillText('DUMMY (HURTBOX)', dummyDrawX - 35, dummyDrawY - dummy.height - 34);
      ctx.restore();

      // 6. Draw Player Character
      if (currentFrame) {
        ctx.save();
        ctx.imageSmoothingEnabled = !pixelated;

        const { sourceRect, anchorPoint } = currentFrame;

        ctx.translate(char.x, char.y);
        if (!char.facingRight) {
          ctx.scale(-1, 1);
        }

        const drawX = -anchorPoint.x * zoom;
        const drawY = -anchorPoint.y * zoom;

        ctx.drawImage(
          image,
          sourceRect.x,
          sourceRect.y,
          sourceRect.width,
          sourceRect.height,
          drawX,
          drawY,
          sourceRect.width * zoom,
          sourceRect.height * zoom
        );

        // Character terrain collision / foot anchor marker
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }

      // Draw attack hitbox wireframe in world space
      if (activeHitboxWorld) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.fillRect(
          activeHitboxWorld.x,
          activeHitboxWorld.y,
          activeHitboxWorld.w,
          activeHitboxWorld.h
        );
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          activeHitboxWorld.x,
          activeHitboxWorld.y,
          activeHitboxWorld.w,
          activeHitboxWorld.h
        );
        ctx.restore();
      }

      // 7. Draw Sparks & Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      });

      // 8. Draw Damage Texts
      damageTextsRef.current.forEach((d) => {
        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.font = '800 13px "JetBrains Mono", monospace';
        ctx.fillText(d.text, d.x, d.y);
        ctx.restore();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, image, clips, frames, pixelated, soundEnabled, getClipForAction]);

  const handleResetPosition = () => {
    charRef.current.x = 180;
    charRef.current.y = 320;
    charRef.current.vx = 0;
    charRef.current.vy = 0;
    charRef.current.isGrounded = true;
    charRef.current.isAttacking = false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-void/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-dock border border-border-subtle rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-12 border-b border-border-subtle px-4 flex items-center justify-between bg-card">
          <div className="flex items-center space-x-2">
            <Gamepad className="w-5 h-5 text-accent-emerald" />
            <h2 className="text-sm font-bold text-text-display">
              Interactive "Micro-Stage" Playtest Sandbox
            </h2>
            <span className="text-[10px] font-mono text-accent-emerald bg-void px-2 py-0.5 rounded border border-border-subtle">
              Live Game Feel Audit
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded hover:bg-dock text-text-muted hover:text-text-display transition-colors"
              title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-accent-cyan" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Reset Position */}
            <button
              onClick={handleResetPosition}
              className="p-1.5 rounded hover:bg-dock text-text-muted hover:text-text-display transition-colors"
              title="Reset Character Position"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-dock text-text-muted hover:text-accent-crimson transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sandbox Canvas Arena */}
        <div className="relative bg-void w-full h-[400px] flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={760}
            height={400}
            className={`w-full h-full block ${pixelated ? 'pixelated' : ''}`}
          />

          {/* Controls HUD */}
          <div className="absolute bottom-3 left-4 flex items-center space-x-3 bg-dock/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border-subtle font-mono text-[11px] text-text-muted">
            <span className="text-accent-cyan font-bold">WASD / Arrows:</span>
            <span>Move</span>
            <span className="text-accent-cyan font-bold ml-2">Space / W:</span>
            <span>Jump</span>
            <span className="text-accent-crimson font-bold ml-2">J / F:</span>
            <span>Attack (Strike Dummy!)</span>
          </div>

          {/* Gamepad Indicator */}
          {gamepadConnected && (
            <div className="absolute top-3 right-4 flex items-center space-x-1.5 bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/40 px-2.5 py-1 rounded-md text-[10px] font-mono">
              <Gamepad className="w-3.5 h-3.5" />
              <span>Gamepad Active</span>
            </div>
          )}
        </div>

        {/* Sandbox Instructions & Telemetry Footer */}
        <div className="p-3 bg-dock border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-accent-amber" />
            <span>
              Real-time animation state-machine automatically triggers Idle, Run, Jump, and Attack combos with hitbox collision feedback.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-card hover:bg-border-subtle text-text-display font-medium border border-border-subtle"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
