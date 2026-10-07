import {
  TrackChunk,
  PlayerPhysicsState,
  EndlessRunnerGameState,
  BiomeType,
  ObstacleEntity,
  CollectibleEntity,
  GhostData,
} from '../types/game';
import { getLaneX, HITBOX } from './physics';
import { LANE_DISTANCE } from './procedural';

export interface RenderParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface SpeedWarpLine {
  x: number;
  y: number;
  z: number;
  length: number;
}

export class Canvas3DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: RenderParticle[] = [];
  private speedLines: SpeedWarpLine[] = [];
  private screenShakeAmount: number = 0;
  private cameraTiltAngle: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.initSpeedLines();
  }

  private initSpeedLines() {
    this.speedLines = [];
    for (let i = 0; i < 40; i++) {
      this.speedLines.push({
        x: (Math.random() - 0.5) * 20,
        y: Math.random() * 8 + 0.5,
        z: Math.random() * 80,
        length: Math.random() * 6 + 4,
      });
    }
  }

  public triggerScreenShake(intensity: number) {
    this.screenShakeAmount = Math.max(this.screenShakeAmount, intensity);
  }

  public addSparks(worldX: number, worldY: number, worldZ: number, count = 25, color = '#00f3ff') {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: worldX,
        y: worldY,
        z: worldZ,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * 10 + 2,
        vz: (Math.random() - 0.5) * 10,
        color: Math.random() > 0.4 ? color : '#ffffff',
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.2,
      });
    }
  }

  public addCoinBurst(worldX: number, worldY: number, worldZ: number) {
    this.addSparks(worldX, worldY, worldZ, 15, '#ffaa00');
  }

  /**
   * 3D to 2D Perspective Projection
   */
  private project(
    x: number,
    y: number,
    z: number,
    camX: number,
    camY: number,
    camZ: number,
    width: number,
    height: number
  ) {
    const fov = 420;
    const dz = z - camZ;

    if (dz <= 0.2) return null;

    const scale = fov / dz;
    const centerX = width / 2;
    const horizonY = height * 0.46;

    const screenX = centerX + (x - camX) * scale;
    const screenY = horizonY - (y - camY) * scale;

    return {
      x: screenX,
      y: screenY,
      scale,
      depth: dz,
    };
  }

  public render(
    player: PlayerPhysicsState,
    state: EndlessRunnerGameState,
    chunks: TrackChunk[],
    ghost: GhostData | null,
    settings: { cameraTilt: number; screenShake: number; showHitboxes: boolean }
  ) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // Apply Screen Shake
    ctx.save();
    if (this.screenShakeAmount > 0) {
      const mult = settings.screenShake / 100;
      const shakeX = (Math.random() * 2 - 1) * this.screenShakeAmount * 14 * mult;
      const shakeY = (Math.random() * 2 - 1) * this.screenShakeAmount * 14 * mult;
      ctx.translate(shakeX, shakeY);
      this.screenShakeAmount = Math.max(0, this.screenShakeAmount - 0.05);
    }

    // Camera setup
    const camZ = state.distanceMeters - 7.5;
    const camY = 3.6 + (player.yPos * 0.25);
    // Smooth Camera tilt with lateral movement
    const targetTilt = ((player.targetX - player.currentX) * -0.04) * (settings.cameraTilt / 100);
    this.cameraTiltAngle += (targetTilt - this.cameraTiltAngle) * 0.15;

    ctx.translate(width / 2, height * 0.46);
    ctx.rotate(this.cameraTiltAngle);
    ctx.translate(-width / 2, -height * 0.46);

    const currentBiome = chunks.length > 0 ? chunks[0].biome : 'neon_city';

    // 1. Draw Biome Background & Sky
    this.drawSkyAndHorizon(ctx, width, height, currentBiome, state);

    // 2. Draw 3D Highway Grid & Rails
    this.drawHighway(ctx, width, height, camZ, camY, player.currentX, currentBiome, state.distanceMeters);

    // 3. Draw Collectibles & Obstacles
    this.drawWorldEntities(ctx, width, height, camZ, camY, player.currentX, chunks, settings.showHitboxes);

    // 4. Draw Ghost Hologram (if present)
    if (ghost) {
      this.drawGhost(ctx, width, height, camZ, camY, player.currentX, ghost, state.distanceMeters);
    }

    // 5. Draw Player Cyber Hovercraft
    this.drawPlayer(ctx, width, height, camZ, camY, player, state);

    // 6. Draw Particle System (Sparks, Bursts)
    this.drawParticles(ctx, width, height, camZ, camY, player.currentX);

    // 7. Draw Overdrive Warp Streaks & Screen Speed Lines
    if (state.isOverdriveActive) {
      this.drawSpeedWarp(ctx, width, height, camZ, camY, player.currentX, state.currentSpeed);
    }

    ctx.restore();
  }

  private drawSkyAndHorizon(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    biome: BiomeType,
    state: EndlessRunnerGameState
  ) {
    const horizonY = height * 0.46;

    // Biome-tailored Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (biome === 'neon_city') {
      skyGrad.addColorStop(0, '#0a001a');
      skyGrad.addColorStop(0.6, '#180736');
      skyGrad.addColorStop(1, '#ff007f33');
    } else if (biome === 'sky_bridge') {
      skyGrad.addColorStop(0, '#000511');
      skyGrad.addColorStop(0.7, '#02183b');
      skyGrad.addColorStop(1, '#00f3ff22');
    } else {
      // magma_vault
      skyGrad.addColorStop(0, '#1a0400');
      skyGrad.addColorStop(0.6, '#3a0c00');
      skyGrad.addColorStop(1, '#ff370033');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // Distant Synthwave Sun or Orbital Planet
    const sunRadius = 68;
    const sunX = width / 2;
    const sunY = horizonY - 32;

    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius);
    if (biome === 'neon_city') {
      sunGrad.addColorStop(0, '#ffea79');
      sunGrad.addColorStop(0.5, '#ff007f');
      sunGrad.addColorStop(1, '#ff007f00');
    } else if (biome === 'sky_bridge') {
      sunGrad.addColorStop(0, '#e0ffff');
      sunGrad.addColorStop(0.5, '#00f3ff');
      sunGrad.addColorStop(1, '#00f3ff00');
    } else {
      sunGrad.addColorStop(0, '#ffff55');
      sunGrad.addColorStop(0.5, '#ff3700');
      sunGrad.addColorStop(1, '#ff174400');
    }

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Synthwave Sun horizontal scanlines
    ctx.fillStyle = 'rgba(10, 0, 26, 0.7)';
    for (let sy = sunY - 10; sy < horizonY; sy += 7) {
      ctx.fillRect(sunX - sunRadius, sy, sunRadius * 2, 2.5);
    }

    // Distant Skyline Silhouettes
    ctx.fillStyle = biome === 'neon_city' ? '#14032d' : biome === 'sky_bridge' ? '#041026' : '#220800';
    const buildingWidths = [45, 60, 35, 75, 50, 40, 65, 80];
    let bX = 0;
    let bIdx = 0;
    while (bX < width) {
      const bw = buildingWidths[bIdx % buildingWidths.length];
      const bh = 40 + ((bIdx * 19) % 85);
      ctx.fillRect(bX, horizonY - bh, bw, bh);
      // Windows glow
      ctx.fillStyle = (bIdx % 2 === 0) ? 'rgba(0, 243, 255, 0.4)' : 'rgba(255, 0, 127, 0.4)';
      ctx.fillRect(bX + 5, horizonY - bh + 6, bw - 10, 2);
      ctx.fillStyle = biome === 'neon_city' ? '#14032d' : biome === 'sky_bridge' ? '#041026' : '#220800';
      bX += bw + 6;
      bIdx++;
    }
  }

  private drawHighway(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camZ: number,
    camY: number,
    playerX: number,
    biome: BiomeType,
    playerDistance: number
  ) {
    const horizonY = height * 0.46;
    const roadHalfWidth = LANE_DISTANCE * 1.85;

    // Road Base Ground
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    if (biome === 'neon_city') {
      groundGrad.addColorStop(0, '#0d021c');
      groundGrad.addColorStop(1, '#05000c');
    } else if (biome === 'sky_bridge') {
      groundGrad.addColorStop(0, '#030f24');
      groundGrad.addColorStop(1, '#010511');
    } else {
      groundGrad.addColorStop(0, '#220802');
      groundGrad.addColorStop(1, '#0c0200');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Segmented Highway Mesh
    const segmentDepth = 6.0;
    const maxVisibleZ = camZ + 120;
    const startSegmentIndex = Math.floor(camZ / segmentDepth);
    const endSegmentIndex = Math.ceil(maxVisibleZ / segmentDepth);

    const primaryColor = biome === 'neon_city' ? '#ff007f' : biome === 'sky_bridge' ? '#00f3ff' : '#ff3700';
    const laneDividerColor = biome === 'neon_city' ? '#00f3ff' : biome === 'sky_bridge' ? '#ffffff' : '#ffaa00';

    for (let i = endSegmentIndex; i >= startSegmentIndex; i--) {
      const zNear = Math.max(camZ + 0.5, i * segmentDepth);
      const zFar = zNear + segmentDepth;

      const pNearLeft = this.project(-roadHalfWidth, 0, zNear, playerX, camY, camZ, width, height);
      const pNearRight = this.project(roadHalfWidth, 0, zNear, playerX, camY, camZ, width, height);
      const pFarLeft = this.project(-roadHalfWidth, 0, zFar, playerX, camY, camZ, width, height);
      const pFarRight = this.project(roadHalfWidth, 0, zFar, playerX, camY, camZ, width, height);

      if (!pNearLeft || !pNearRight || !pFarLeft || !pFarRight) continue;

      // Road Surface Quad with alternating subtle tones
      const isAlt = (i % 2 === 0);
      ctx.fillStyle = isAlt ? 'rgba(25, 12, 45, 0.95)' : 'rgba(16, 7, 32, 0.95)';
      ctx.beginPath();
      ctx.moveTo(pNearLeft.x, pNearLeft.y);
      ctx.lineTo(pNearRight.x, pNearRight.y);
      ctx.lineTo(pFarRight.x, pFarRight.y);
      ctx.lineTo(pFarLeft.x, pFarLeft.y);
      ctx.closePath();
      ctx.fill();

      // Glowing Neon Outer Highway Guard Rails
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = Math.max(1.5, pNearLeft.scale * 0.12);
      ctx.beginPath();
      ctx.moveTo(pNearLeft.x, pNearLeft.y);
      ctx.lineTo(pFarLeft.x, pFarLeft.y);
      ctx.moveTo(pNearRight.x, pNearRight.y);
      ctx.lineTo(pFarRight.x, pFarRight.y);
      ctx.stroke();

      // Lane Divider Dashes (Between Lane 0-1 and Lane 1-2)
      if (i % 2 === 0) {
        const lane1BorderX = -LANE_DISTANCE / 2;
        const lane2BorderX = LANE_DISTANCE / 2;

        const d1Near = this.project(lane1BorderX, 0, zNear, playerX, camY, camZ, width, height);
        const d1Far = this.project(lane1BorderX, 0, zFar, playerX, camY, camZ, width, height);
        const d2Near = this.project(lane2BorderX, 0, zNear, playerX, camY, camZ, width, height);
        const d2Far = this.project(lane2BorderX, 0, zFar, playerX, camY, camZ, width, height);

        if (d1Near && d1Far) {
          ctx.strokeStyle = laneDividerColor;
          ctx.lineWidth = Math.max(1, d1Near.scale * 0.05);
          ctx.beginPath();
          ctx.moveTo(d1Near.x, d1Near.y);
          ctx.lineTo(d1Far.x, d1Far.y);
          ctx.stroke();
        }

        if (d2Near && d2Far) {
          ctx.strokeStyle = laneDividerColor;
          ctx.lineWidth = Math.max(1, d2Near.scale * 0.05);
          ctx.beginPath();
          ctx.moveTo(d2Near.x, d2Near.y);
          ctx.lineTo(d2Far.x, d2Far.y);
          ctx.stroke();
        }
      }
    }
  }

  private drawWorldEntities(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camZ: number,
    camY: number,
    playerX: number,
    chunks: TrackChunk[],
    showHitboxes: boolean
  ) {
    // Gather entities sorted back to front (Painter's algorithm)
    const entities: { type: 'obs' | 'col'; data: any; z: number }[] = [];

    for (const chunk of chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.cleared && obs.zPos > camZ && obs.zPos < camZ + 120) {
          entities.push({ type: 'obs', data: obs, z: obs.zPos });
        }
      }
      for (const col of chunk.collectibles) {
        if (!col.collected && col.zPos > camZ && col.zPos < camZ + 120) {
          entities.push({ type: 'col', data: col, z: col.zPos });
        }
      }
    }

    // Sort descending by z distance
    entities.sort((a, b) => b.z - a.z);

    for (const item of entities) {
      if (item.type === 'obs') {
        this.drawObstacle(ctx, width, height, camZ, camY, playerX, item.data as ObstacleEntity, showHitboxes);
      } else {
        this.drawCollectible(ctx, width, height, camZ, camY, playerX, item.data as CollectibleEntity);
      }
    }
  }

  private drawObstacle(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camZ: number,
    camY: number,
    playerX: number,
    obs: ObstacleEntity,
    showHitboxes: boolean
  ) {
    const laneX = getLaneX(obs.lane);
    const pBase = this.project(laneX, 0, obs.zPos, playerX, camY, camZ, width, height);
    if (!pBase) return;

    const scale = pBase.scale;
    const w = obs.width * scale;

    ctx.save();

    if (obs.type === 'barrier_low') {
      // Low laser barricade (jumpable)
      const h = obs.height * scale;
      const topY = pBase.y - h;

      // Pylons
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(pBase.x - w / 2, topY, w * 0.15, h);
      ctx.fillRect(pBase.x + w / 2 - w * 0.15, topY, w * 0.15, h);

      // Warning laser beam
      ctx.fillStyle = 'rgba(255, 23, 68, 0.75)';
      ctx.fillRect(pBase.x - w / 2, topY + h * 0.2, w, h * 0.6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, scale * 0.04);
      ctx.strokeRect(pBase.x - w / 2, topY + h * 0.2, w, h * 0.6);

      // Hazard stripes
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      for (let s = -w / 2 + 5; s < w / 2 - 5; s += 14) {
        ctx.beginPath();
        ctx.moveTo(pBase.x + s, topY + h * 0.8);
        ctx.lineTo(pBase.x + s + 8, topY + h * 0.2);
        ctx.stroke();
      }
    } else if (obs.type === 'barrier_high') {
      // Overhead barricade (slide underneath)
      const hTotal = obs.height * scale;
      const clearance = 1.05 * scale; // Gap underneath
      const topY = pBase.y - hTotal;

      // Tall support pylons
      ctx.fillStyle = '#9d4edd';
      ctx.fillRect(pBase.x - w / 2, topY, w * 0.15, hTotal);
      ctx.fillRect(pBase.x + w / 2 - w * 0.15, topY, w * 0.15, hTotal);

      // Overhead heavy laser beam block
      const beamHeight = hTotal - clearance;
      ctx.fillStyle = 'rgba(157, 78, 221, 0.85)';
      ctx.fillRect(pBase.x - w / 2, topY, w, beamHeight);

      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = Math.max(1.5, scale * 0.05);
      ctx.strokeRect(pBase.x - w / 2, topY, w, beamHeight);

      // Downward warning arrows
      ctx.fillStyle = '#00f3ff';
      ctx.font = `bold ${Math.max(10, Math.round(scale * 0.4))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('▼ SLIDE ▼', pBase.x, topY + beamHeight * 0.65);
    } else if (obs.type === 'pitfall') {
      // Pitfall hole / chasm
      const pitDepth = 4 * scale;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(pBase.x, pBase.y, w / 2, pitDepth, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing hazard rim
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = Math.max(2, scale * 0.06);
      ctx.stroke();
    } else if (obs.type === 'moving_train') {
      // Armored cyber-drifter moving towards player
      const h = obs.height * scale;
      const topY = pBase.y - h;

      // Body quad
      ctx.fillStyle = '#111827';
      ctx.fillRect(pBase.x - w / 2, topY, w, h);
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = Math.max(2, scale * 0.06);
      ctx.strokeRect(pBase.x - w / 2, topY, w, h);

      // Windshield & high-beam headlights
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(pBase.x - w * 0.35, topY + h * 0.2, w * 0.7, h * 0.25);

      // Blinding headlights
      ctx.fillStyle = '#ffffaa';
      ctx.beginPath();
      ctx.arc(pBase.x - w * 0.3, topY + h * 0.7, Math.max(3, scale * 0.15), 0, Math.PI * 2);
      ctx.arc(pBase.x + w * 0.3, topY + h * 0.7, Math.max(3, scale * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }

    // Debug Hitbox visualization
    if (showHitboxes) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pBase.x - w / 2, pBase.y - obs.height * scale, w, obs.height * scale);
      // Near miss concentric buffer
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
      ctx.strokeRect(
        pBase.x - w / 2 - HITBOX.nearMissBuffer * scale,
        pBase.y - (obs.height + HITBOX.nearMissBuffer) * scale,
        w + HITBOX.nearMissBuffer * 2 * scale,
        (obs.height + HITBOX.nearMissBuffer) * scale
      );
    }

    ctx.restore();
  }

  private drawCollectible(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camZ: number,
    camY: number,
    playerX: number,
    col: CollectibleEntity
  ) {
    const laneX = getLaneX(col.lane);
    const p = this.project(laneX, col.yOffset, col.zPos, playerX, camY, camZ, width, height);
    if (!p) return;

    const scale = p.scale;
    const time = performance.now() * 0.005;

    ctx.save();

    if (col.type === 'coin') {
      // Rotating 3D gold coin
      const coinRadius = Math.max(3, 0.55 * scale);
      const aspect = Math.sin(time + col.zPos);

      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, Math.abs(aspect) * coinRadius + 1, coinRadius, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, scale * 0.04);
      ctx.stroke();
    } else {
      // Power-up orb
      const orbRadius = Math.max(5, 0.8 * scale);
      let orbColor = '#00f3ff';
      let icon = '⚡';

      if (col.type === 'shield') {
        orbColor = '#00ff88';
        icon = '🛡️';
      } else if (col.type === 'coin_magnet') {
        orbColor = '#ff007f';
        icon = '🧲';
      } else if (col.type === 'multiplier_2x') {
        orbColor = '#9d4edd';
        icon = '2X';
      }

      ctx.shadowColor = orbColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = orbColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(8, Math.round(scale * 0.35))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, p.x, p.y);
    }

    ctx.restore();
  }

  private drawPlayer(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camZ: number,
    camY: number,
    player: PlayerPhysicsState,
    state: EndlessRunnerGameState
  ) {
    const pBase = this.project(player.currentX, 0, state.distanceMeters, player.currentX, camY, camZ, width, height);
    if (!pBase) return;

    const scale = pBase.scale;
    const playerZ = state.distanceMeters;
    const isSliding = player.isSliding;

    // Ground Shadow
    ctx.save();
    const shadowWidth = HITBOX.playerWidth * scale * 0.8;
    const shadowHeight = shadowWidth * 0.35;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(pBase.x, pBase.y, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Projected Player Position (including jump height)
    const pPlayer = this.project(player.currentX, player.yPos, playerZ, player.currentX, camY, camZ, width, height);
    if (!pPlayer) return;

    ctx.save();

    // Hovercraft Dimensions
    const w = HITBOX.playerWidth * scale * 0.85;
    const h = (isSliding ? HITBOX.playerHeightSliding : HITBOX.playerHeightNormal) * scale * 0.7;
    const topY = pPlayer.y - h;

    // Overdrive or Shield Aura
    if (state.isOverdriveActive) {
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(pPlayer.x - w / 2 - 4, topY - 4, w + 8, h + 8);
    }

    // Aerodynamic Cyber Suit / Hovercraft Body
    const bodyGrad = ctx.createLinearGradient(pPlayer.x, topY, pPlayer.x, pPlayer.y);
    if (state.isOverdriveActive) {
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.5, '#00f3ff');
      bodyGrad.addColorStop(1, '#ff007f');
    } else {
      bodyGrad.addColorStop(0, '#00f3ff');
      bodyGrad.addColorStop(0.5, '#1e1b4b');
      bodyGrad.addColorStop(1, '#0f172a');
    }

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    if (isSliding) {
      // Streamlined flattened crouch craft
      ctx.roundRect(pPlayer.x - w / 2, topY + h * 0.2, w, h * 0.8, 6);
    } else {
      // Upright futuristic runner silhouette
      ctx.moveTo(pPlayer.x, topY);
      ctx.lineTo(pPlayer.x + w / 2, topY + h * 0.4);
      ctx.lineTo(pPlayer.x + w * 0.4, pPlayer.y);
      ctx.lineTo(pPlayer.x - w * 0.4, pPlayer.y);
      ctx.lineTo(pPlayer.x - w / 2, topY + h * 0.4);
      ctx.closePath();
    }
    ctx.fill();

    // Neon Accent Linework
    ctx.strokeStyle = state.isOverdriveActive ? '#ffff00' : '#00f3ff';
    ctx.lineWidth = Math.max(1.5, scale * 0.05);
    ctx.stroke();

    // Dual Thrusters
    const thrusterColor = state.isOverdriveActive ? '#ff007f' : '#00f3ff';
    ctx.fillStyle = thrusterColor;
    ctx.beginPath();
    ctx.arc(pPlayer.x - w * 0.25, pPlayer.y + 2, Math.max(2, scale * 0.08), 0, Math.PI * 2);
    ctx.arc(pPlayer.x + w * 0.25, pPlayer.y + 2, Math.max(2, scale * 0.08), 0, Math.PI * 2);
    ctx.fill();

    // Spawn exhaust particles
    if (Math.random() > 0.3) {
      this.particles.push({
        x: player.currentX + (Math.random() - 0.5) * 0.5,
        y: player.yPos + 0.2,
        z: playerZ - 0.4,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: -15,
        color: thrusterColor,
        size: Math.random() * 2.5 + 1.5,
        life: 0,
        maxLife: 0.25,
      });
    }

    ctx.restore();
  }

  private drawGhost(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camZ: number,
    camY: number,
    playerX: number,
    ghost: GhostData,
    playerDistance: number
  ) {
    // Interpolate ghost position along track
    // If telemetry exists, find ghost lane and y at relative time
    const ghostZ = ghost.finalDistance;
    if (ghostZ < camZ || ghostZ > camZ + 120) return;

    const ghostP = this.project(0, 0, ghostZ, playerX, camY, camZ, width, height);
    if (!ghostP) return;

    const scale = ghostP.scale;
    const w = HITBOX.playerWidth * scale * 0.8;
    const h = HITBOX.playerHeightNormal * scale * 0.7;

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Hologram wireframe
    ctx.strokeRect(ghostP.x - w / 2, ghostP.y - h, w, h);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
    for (let gy = ghostP.y - h; gy < ghostP.y; gy += 6) {
      ctx.fillRect(ghostP.x - w / 2, gy, w, 2);
    }

    // Ghost Nameplate
    ctx.setLineDash([]);
    ctx.fillStyle = '#00f3ff';
    ctx.font = `bold ${Math.max(9, Math.round(scale * 0.3))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`👻 ${ghost.playerHandle}`, ghostP.x, ghostP.y - h - 6);

    ctx.restore();
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camZ: number,
    camY: number,
    playerX: number
  ) {
    const dt = 1 / 60;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      const pt = this.project(p.x, p.y, p.z, playerX, camY, camZ, width, height);
      if (!pt) continue;

      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(1, p.size * pt.scale * 0.08), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawSpeedWarp(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camZ: number,
    camY: number,
    playerX: number,
    currentSpeed: number
  ) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.6)';
    ctx.lineWidth = 1.5;

    for (const line of this.speedLines) {
      line.z -= currentSpeed * 0.035;
      if (line.z < 2) {
        line.z = 80 + Math.random() * 20;
        line.x = (Math.random() - 0.5) * 22;
        line.y = Math.random() * 9 + 0.2;
      }

      const pStart = this.project(line.x, line.y, line.z, playerX, camY, camZ, width, height);
      const pEnd = this.project(line.x, line.y, line.z + line.length, playerX, camY, camZ, width, height);

      if (pStart && pEnd) {
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
