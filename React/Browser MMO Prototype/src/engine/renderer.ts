import { TilemapRenderer, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './tilemapRenderer.js';
import { SpriteRenderer } from './spriteRenderer.js';
import type { WorldPlayerEntity, GroundLootEntity } from '../types/mmo.js';

export interface WorldParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export class WorldRenderer {
  public tilemap: TilemapRenderer;
  private particles: WorldParticle[] = [];

  constructor() {
    this.tilemap = new TilemapRenderer();
    this.initAmbientParticles();
  }

  private initAmbientParticles() {
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * MAP_WIDTH * TILE_SIZE,
        y: Math.random() * MAP_HEIGHT * TILE_SIZE,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        life: Math.random() * 200,
        maxLife: 200,
        color: Math.random() > 0.5 ? '#38BDF8' : '#F59E0B',
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camX: number,
    camY: number,
    localPlayer: WorldPlayerEntity | null,
    players: Record<string, WorldPlayerEntity>,
    groundLoot: Record<string, GroundLootEntity>,
    selectedTargetId: string | null,
    time: number
  ) {
    // Clear viewport with deep void
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, width, height);

    // 1. Render Base Tilemap with Culling
    this.tilemap.render(ctx, camX, camY, width, height, time);

    // 2. Render Ground Loot Drops
    const pX = localPlayer?.x || 0;
    const pY = localPlayer?.y || 0;

    for (const loot of Object.values(groundLoot)) {
      // Viewport culling
      if (
        loot.x >= camX - 60 &&
        loot.x <= camX + width + 60 &&
        loot.y >= camY - 60 &&
        loot.y <= camY + height + 60
      ) {
        const distSq = (loot.x - pX) ** 2 + (loot.y - pY) ** 2;
        const isNear = distSq < 100 * 100;
        SpriteRenderer.renderGroundLoot(ctx, loot, camX, camY, time, isNear);
      }
    }

    // 3. Render Players & Remote Avatars (Sort by Y coordinate for depth ordering)
    const allEntities = Object.values(players);
    allEntities.sort((a, b) => a.y - b.y);

    for (const player of allEntities) {
      if (
        player.x >= camX - 80 &&
        player.x <= camX + width + 80 &&
        player.y >= camY - 80 &&
        player.y <= camY + height + 80
      ) {
        const isLocal = player.id === localPlayer?.id;
        const isSelected = player.id === selectedTargetId;
        SpriteRenderer.renderPlayer(ctx, player, camX, camY, time, isLocal, isSelected);
      }
    }

    // 4. Render Ambient Aether Motes Particles
    this.renderParticles(ctx, camX, camY, width, height);
  }

  private renderParticles(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number
  ) {
    for (const p of this.particles) {
      p.x += p.vx * 0.05;
      p.y += p.vy * 0.05;
      p.life++;

      if (p.life > p.maxLife || p.y < 0) {
        p.x = camX + Math.random() * viewW;
        p.y = camY + viewH + 10;
        p.life = 0;
      }

      const sx = p.x - camX;
      const sy = p.y - camY;

      if (sx >= 0 && sx <= viewW && sy >= 0 && sy <= viewH) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // Minimap 2D Radar Renderer
  public renderMinimap(
    ctx: CanvasRenderingContext2D,
    radarSize: number,
    localPlayer: WorldPlayerEntity | null,
    players: Record<string, WorldPlayerEntity>,
    groundLoot: Record<string, GroundLootEntity>
  ) {
    ctx.clearRect(0, 0, radarSize, radarSize);

    // Dark radar background
    ctx.fillStyle = '#0B0F19EE';
    ctx.fillRect(0, 0, radarSize, radarSize);

    // World scale
    const worldW = MAP_WIDTH * TILE_SIZE;
    const worldH = MAP_HEIGHT * TILE_SIZE;
    const scaleX = radarSize / worldW;
    const scaleY = radarSize / worldH;

    // Draw Town Plaza rectangle
    ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.fillRect(18 * TILE_SIZE * scaleX, 18 * TILE_SIZE * scaleY, 14 * TILE_SIZE * scaleX, 14 * TILE_SIZE * scaleY);

    // Draw Fountain
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(24 * TILE_SIZE * scaleX, 24 * TILE_SIZE * scaleY, 3 * TILE_SIZE * scaleX, 3 * TILE_SIZE * scaleY);

    // Draw ground loot blips (small amber dots)
    ctx.fillStyle = '#F59E0B';
    for (const loot of Object.values(groundLoot)) {
      ctx.fillRect(loot.x * scaleX - 1, loot.y * scaleY - 1, 2, 2);
    }

    // Draw player blips
    for (const p of Object.values(players)) {
      const px = p.x * scaleX;
      const py = p.y * scaleY;
      const isLocal = p.id === localPlayer?.id;

      if (isLocal) {
        // Local player is bright cyan dot with ping circle
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Remote players are emerald / red / gold dots
        ctx.fillStyle = p.isBot ? '#34D399' : '#FBBF24';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Subtle radar border
    ctx.strokeStyle = '#263147';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, radarSize, radarSize);
  }
}
