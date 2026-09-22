import { AudioMetrics, GameSettings, HighwayNote, HighwayParticle, HighwayRing } from '@/types/game';
import { getTheme } from './themes';
import { globalAudioPipeline } from '@/audio/AudioPipeline';

export interface PlayerState {
  lane: number; // 0: Left, 1: Center, 2: Right
  targetLane: number;
  x: number;
  y: number;
  jumpOffset: number;
  isJumping: boolean;
  jumpVelocity: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private miniCanvas: HTMLCanvasElement | null = null;
  private miniCtx: CanvasRenderingContext2D | null = null;

  public player: PlayerState = {
    lane: 1,
    targetLane: 1,
    x: 0,
    y: 0,
    jumpOffset: 0,
    isJumping: false,
    jumpVelocity: 0,
  };

  public notes: HighwayNote[] = [];
  public rings: HighwayRing[] = [];
  public particles: HighwayParticle[] = [];

  private gridOffset = 0;
  private lastBeatSpawn = 0;
  private lastFrameTime = performance.now();
  private animFrameId: number | null = null;

  // Juice & Camera Effects
  private cameraShakeX = 0;
  private cameraShakeY = 0;
  private cameraShakeTrauma = 0;
  private fovKick = 0;

  // Callbacks for decoupled store sync
  public onScoreUpdate?: (points: number, isHazard: boolean, jumpedOver: boolean) => void;
  public onMissUpdate?: () => void;
  public onTimeTick?: (currentTimeDelta: number) => void;
  public onCallout?: (message: string, type: 'sync' | 'jump' | 'hazard', color: string) => void;
  public onAudioMetricsUpdate?: (metrics: AudioMetrics) => void;

  // Configuration accessors
  public getSettings: () => GameSettings;
  public getIsPlaying: () => boolean;

  constructor(
    canvas: HTMLCanvasElement,
    miniCanvas: HTMLCanvasElement | null,
    getSettings: () => GameSettings,
    getIsPlaying: () => boolean
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.miniCanvas = miniCanvas;
    if (miniCanvas) {
      this.miniCtx = miniCanvas.getContext('2d');
    }
    this.getSettings = getSettings;
    this.getIsPlaying = getIsPlaying;

    this.resizeCanvas();
    this.player.x = this.canvas.width * 0.5;
  }

  public resizeCanvas(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  public setMiniCanvas(miniCanvas: HTMLCanvasElement | null): void {
    this.miniCanvas = miniCanvas;
    if (miniCanvas) {
      this.miniCtx = miniCanvas.getContext('2d');
    }
  }

  public start(): void {
    if (this.animFrameId !== null) return;
    this.lastFrameTime = performance.now();
    this.renderLoop(this.lastFrameTime);
  }

  public stop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public addTrauma(amount: number): void {
    this.cameraShakeTrauma = Math.min(1.0, this.cameraShakeTrauma + amount);
  }

  // ================= Lateral Steering & Jump Controls =================
  public shiftLane(direction: -1 | 1): void {
    this.player.targetLane = Math.max(0, Math.min(2, this.player.targetLane + direction));
  }

  public setLane(lane: number): void {
    this.player.targetLane = Math.max(0, Math.min(2, lane));
  }

  public jump(): void {
    if (!this.player.isJumping) {
      this.player.isJumping = true;
      this.player.jumpVelocity = 15;
    }
  }

  // ================= Spawning Procedural Beatscape =================
  private spawnHighwayElements(metrics: AudioMetrics, settings: GameSettings, colors: ReturnType<typeof getTheme>): void {
    const now = performance.now();
    const minSpawnInterval = 280 / Math.max(0.5, settings.speed);

    if (metrics.isBeat && now - this.lastBeatSpawn > minSpawnInterval) {
      this.lastBeatSpawn = now;
      const lane = Math.floor(Math.random() * 3);

      // Determine note type from frequency spectrum
      // Sub-bass heavy -> Warp Ring & Speed Gate
      // Mid-synth heavy -> Collectible tempo ring / diamond note
      // High-frequency transients -> Reactive hazard spike
      const isSubBassDrop = metrics.bassIntensity > 0.65;
      const isHighHatTransient = metrics.trebleIntensity > 0.45;
      const isHazard = !settings.zenMode && isHighHatTransient && Math.random() > 0.4;

      const noteType: HighwayNote['type'] = isHazard ? 'spike' : isSubBassDrop ? 'ring' : 'diamond';

      this.notes.push({
        z: 1.0, // Start at horizon
        lane,
        isHazard,
        color: isHazard ? colors.secondary : isSubBassDrop ? colors.accent : colors.primary,
        size: isHazard ? 24 : isSubBassDrop ? 22 : 18,
        hit: false,
        type: noteType,
      });

      // Spawn highway warp ring on beat
      this.rings.push({
        z: 1.0,
        color: isHazard ? colors.secondary : colors.primary,
        alpha: 0.85,
      });

      // Bass drop camera kick
      if (isSubBassDrop && settings.cameraShake) {
        this.addTrauma(0.35);
        this.fovKick = 12;
      }
    }
  }

  // ================= Particle FX =================
  public createExplosion(x: number, y: number, color: string, count: number = 18): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1.0,
      });
    }
  }

  // ================= Main Locked 60FPS Render Loop =================
  private renderLoop = (now: number): void => {
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = now;

    const settings = this.getSettings();
    const isPlaying = this.getIsPlaying();
    const colors = getTheme(settings.visualTheme);

    // 1. Update Decoupled Audio Metrics
    const metrics = globalAudioPipeline.updateMetrics(settings.sensitivity);
    if (this.onAudioMetricsUpdate) {
      this.onAudioMetricsUpdate(metrics);
    }

    if (isPlaying && this.onTimeTick) {
      this.onTimeTick(dt);
    }

    // 2. Camera Shake Physics
    if (this.cameraShakeTrauma > 0) {
      const shakePower = Math.pow(this.cameraShakeTrauma, 2) * 16;
      this.cameraShakeX = (Math.random() * 2 - 1) * shakePower;
      this.cameraShakeY = (Math.random() * 2 - 1) * shakePower;
      this.cameraShakeTrauma = Math.max(0, this.cameraShakeTrauma - dt * 2.2);
    } else {
      this.cameraShakeX = 0;
      this.cameraShakeY = 0;
    }

    if (this.fovKick > 0) {
      this.fovKick = Math.max(0, this.fovKick - dt * 40);
    }

    // Canvas dimensions (CSS pixels)
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    // 3. Motion Blur / Alpha persistence clear
    const motionBlurAlpha = Math.max(0.12, 1.0 - (settings.motionBlur || 0.65));
    this.ctx.fillStyle = `rgba(3, 7, 18, ${motionBlurAlpha})`;
    this.ctx.fillRect(0, 0, cw, ch);

    this.ctx.save();
    // Apply camera shake & kick
    this.ctx.translate(this.cameraShakeX, this.cameraShakeY + this.fovKick * 0.4);

    const horizonY = ch * 0.42;
    const originX = cw * 0.5;

    // 4. Reactive Horizon Glow & Sun Disk
    const bassScale = metrics.bassIntensity * 45 * settings.sensitivity;
    const horizonGradient = this.ctx.createRadialGradient(
      originX,
      horizonY,
      10,
      originX,
      horizonY,
      Math.max(cw * 0.6, 500)
    );
    horizonGradient.addColorStop(0, colors.glow);
    horizonGradient.addColorStop(0.4, 'rgba(11, 17, 32, 0.4)');
    horizonGradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = horizonGradient;
    this.ctx.fillRect(0, 0, cw, horizonY + 80);

    // Cyber Horizon Sun / Pulse Node
    this.ctx.beginPath();
    this.ctx.arc(originX, horizonY - 15, 36 + bassScale * 0.5, 0, Math.PI * 2);
    const sunGrad = this.ctx.createLinearGradient(originX, horizonY - 60, originX, horizonY + 20);
    sunGrad.addColorStop(0, colors.accent);
    sunGrad.addColorStop(1, colors.primary);
    this.ctx.fillStyle = sunGrad;
    this.ctx.shadowColor = colors.primary;
    this.ctx.shadowBlur = 30 + bassScale;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // 5. Perspective 3-Lane Frequency Highway ("Wave Surfer")
    const roadBottomWidth = Math.min(cw * 0.88, 780);
    const roadTopWidth = 70;
    const roadBottomY = ch * 0.94;

    // Undulating highway surface ribbon
    const lanes = [-1, -0.33, 0.33, 1];
    this.ctx.strokeStyle = colors.grid;
    this.ctx.lineWidth = 1.6;

    lanes.forEach((laneFactor) => {
      const topX = originX + laneFactor * roadTopWidth * 0.5;
      const botX = originX + laneFactor * roadBottomWidth * 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(topX, horizonY);
      this.ctx.lineTo(botX, roadBottomY);
      this.ctx.stroke();
    });

    // Highway horizontal speed grid bars
    this.gridOffset = (this.gridOffset + dt * 1.8 * settings.speed) % 1;
    const gridCount = 14;
    for (let i = 0; i < gridCount; i++) {
      const p = (i / gridCount + this.gridOffset) % 1;
      const py = horizonY + Math.pow(p, 2.2) * (roadBottomY - horizonY);
      const pWidth = roadTopWidth + Math.pow(p, 2.2) * (roadBottomWidth - roadTopWidth);
      const leftX = originX - pWidth * 0.5;
      const rightX = originX + pWidth * 0.5;

      this.ctx.strokeStyle = `rgba(6, 182, 212, ${p * 0.45})`;
      this.ctx.beginPath();
      this.ctx.moveTo(leftX, py);
      this.ctx.lineTo(rightX, py);
      this.ctx.stroke();
    }

    // 6. Draw Warp Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.z -= dt * 0.65 * settings.speed;
      if (ring.z <= 0.05) {
        this.rings.splice(i, 1);
        continue;
      }
      const p = 1.0 - ring.z;
      const ry = horizonY + Math.pow(p, 2.0) * (roadBottomY - horizonY);
      const rw = (roadTopWidth + Math.pow(p, 2.0) * (roadBottomWidth - roadTopWidth)) * 1.25;
      const rh = 45 * p + bassScale * p;

      this.ctx.strokeStyle = ring.color;
      this.ctx.globalAlpha = Math.max(0, ring.z * ring.alpha);
      this.ctx.lineWidth = 2.5 * p;
      this.ctx.strokeRect(originX - rw * 0.5, ry - rh, rw, rh * 1.6);
    }
    this.ctx.globalAlpha = 1.0;

    // 7. Spawn & Update Highway Notes
    if (isPlaying) {
      this.spawnHighwayElements(metrics, settings, colors);
    }

    const getLaneX = (laneIndex: number, depthFactor: number): number => {
      const currentRoadW = roadTopWidth + Math.pow(depthFactor, 2.2) * (roadBottomWidth - roadTopWidth);
      const laneSpan = currentRoadW / 3;
      const multiplier = laneIndex === 0 ? -1 : laneIndex === 2 ? 1 : 0;
      return originX + multiplier * laneSpan;
    };

    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      note.z -= dt * 0.72 * settings.speed;

      const p = 1.0 - note.z;
      const noteY = horizonY + Math.pow(p, 2.2) * (roadBottomY - horizonY);
      const noteX = getLaneX(note.lane, p);
      const scale = 0.35 + Math.pow(p, 2) * 1.45;

      // Strike line collision check
      if (note.z < 0.18 && note.z > 0.02 && !note.hit) {
        const sameLane = this.player.lane === note.lane;
        const jumpedOver = this.player.isJumping && note.isHazard;

        if (sameLane) {
          if (note.isHazard) {
            if (jumpedOver) {
              // Successfully jumped over crimson spike!
              note.hit = true;
              this.createExplosion(noteX, noteY, colors.accent, 22);
              this.onScoreUpdate?.(300, true, true);
              this.onCallout?.('CLEAN JUMP!', 'jump', colors.accent);
            } else if (!settings.zenMode) {
              // Collision penalty
              note.hit = true;
              this.addTrauma(0.5);
              this.createExplosion(noteX, noteY, colors.secondary, 26);
              this.onScoreUpdate?.(0, true, false);
              this.onCallout?.('HAZARD BREACH', 'hazard', colors.secondary);
            } else {
              // Zen mode: safe cruise through
              note.hit = true;
              this.createExplosion(noteX, noteY, colors.primary, 10);
            }
          } else {
            // Rhythm pickup hit!
            note.hit = true;
            this.createExplosion(noteX, noteY, colors.primary, 16);
            this.onScoreUpdate?.(150, false, false);
            this.onCallout?.('PERFECT SYNC', 'sync', colors.primary);
          }
        }
      }

      // Off-screen culling
      if (note.z <= 0.01) {
        if (!note.hit && !note.isHazard && !settings.zenMode) {
          this.onMissUpdate?.();
        }
        this.notes.splice(i, 1);
        continue;
      }

      // Render Highway Note
      this.ctx.save();
      this.ctx.shadowColor = note.color;
      this.ctx.shadowBlur = 18 * scale;
      this.ctx.fillStyle = note.color;

      if (note.isHazard) {
        // Crimson spike obstacle
        this.ctx.beginPath();
        this.ctx.moveTo(noteX, noteY - 24 * scale);
        this.ctx.lineTo(noteX - 16 * scale, noteY + 10 * scale);
        this.ctx.lineTo(noteX + 16 * scale, noteY + 10 * scale);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1.5 * scale;
        this.ctx.stroke();
      } else if (note.type === 'ring') {
        // Collectible golden tempo ring
        this.ctx.beginPath();
        this.ctx.arc(noteX, noteY, 16 * scale, 0, Math.PI * 2);
        this.ctx.strokeStyle = note.color;
        this.ctx.lineWidth = 4 * scale;
        this.ctx.stroke();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(noteX, noteY, 5 * scale, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Glowing rhythm diamond
        this.ctx.beginPath();
        this.ctx.arc(noteX, noteY, 13 * scale, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 8. Player Avatar Glider Physics & Smooth Interpolation
    const playerStrikeY = roadBottomY - 20;
    const targetX = getLaneX(this.player.targetLane, 0.95);
    this.player.x += (targetX - this.player.x) * (dt * 18);
    this.player.lane = this.player.targetLane;

    if (this.player.isJumping) {
      this.player.jumpVelocity -= 52 * dt; // gravity
      this.player.jumpOffset += this.player.jumpVelocity;
      if (this.player.jumpOffset <= 0) {
        this.player.jumpOffset = 0;
        this.player.isJumping = false;
        this.player.jumpVelocity = 0;
      }
    }

    // Render Light-Craft Cockpit Glider
    const playerY = playerStrikeY - this.player.jumpOffset;
    this.ctx.save();
    this.ctx.shadowColor = colors.primary;
    this.ctx.shadowBlur = 28;

    // Thruster Trail Glow
    this.ctx.fillStyle = this.player.isJumping ? colors.accent : colors.primary;
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.x, playerY - 20);
    this.ctx.lineTo(this.player.x - 24, playerY + 16);
    this.ctx.lineTo(this.player.x, playerY + 9);
    this.ctx.lineTo(this.player.x + 24, playerY + 16);
    this.ctx.closePath();
    this.ctx.fill();

    // Inner Neon Core
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(this.player.x, playerY + 2, 4.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Spawn subtle thruster particles
    if (Math.random() > 0.4) {
      this.particles.push({
        x: this.player.x + (Math.random() * 8 - 4),
        y: playerY + 14,
        vx: (Math.random() * 2 - 1) * 0.8,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 3 + 1.5,
        color: this.player.isJumping ? colors.accent : colors.primary,
        alpha: 0.85,
      });
    }

    // 9. Particle System Update & Draw
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= dt * 1.6;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    this.ctx.globalAlpha = 1.0;

    this.ctx.restore(); // Restore camera shake

    // 10. Mini Audio Spectrum Strip
    this.renderMiniSpectrum();

    this.animFrameId = requestAnimationFrame(this.renderLoop);
  };

  private renderMiniSpectrum(): void {
    if (!this.miniCanvas || !this.miniCtx || !globalAudioPipeline.dataArray) return;
    const w = this.miniCanvas.width;
    const h = this.miniCanvas.height;

    this.miniCtx.clearRect(0, 0, w, h);
    const data = globalAudioPipeline.dataArray;
    const barCount = 32;
    const barWidth = w / barCount - 2;

    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor(i * (data.length / (barCount * 2)));
      const val = data[freqIndex] / 255;
      const barHeight = val * (h - 4);
      const x = i * (barWidth + 2);
      const y = h - barHeight;

      const hue = 180 + (i / barCount) * 120;
      this.miniCtx.fillStyle = `hsl(${hue}, 85%, 55%)`;
      this.miniCtx.fillRect(x, y, barWidth, barHeight);
    }
  }
}
