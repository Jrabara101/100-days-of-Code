import { CellType, DIRECTION_VECTORS } from '../engine/types';
import type { SnakeState, Vector2D } from '../engine/types';
import { SnakeEngine } from '../engine/SnakeEngine';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: SnakeEngine;

  constructor(canvas: HTMLCanvasElement, engine: SnakeEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.engine = engine;
  }

  public render(timestamp: number): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const gridW = this.engine.settings.gridWidth;
    const gridH = this.engine.settings.gridHeight;
    const cellW = width / gridW;
    const cellH = height / gridH;

    const alpha = this.engine.settings.subpixelInterpolation ? this.engine.alpha : 1;
    const shakeX = this.engine.settings.screenShake ? this.engine.particles.shakeX : 0;
    const shakeY = this.engine.settings.screenShake ? this.engine.particles.shakeY : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Clear & Background
    ctx.fillStyle = '#0f1117';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Grid Pattern
    this.drawGrid(ctx, width, height, cellW, cellH, gridW, gridH);

    // 3. Draw Synergy Electrical Arc between heads when close
    this.drawSynergyArc(ctx, cellW, cellH, alpha, timestamp);

    // 4. Draw Food Items
    this.drawFoods(ctx, cellW, cellH, timestamp);

    // 5. Draw Snakes (P1 & P2)
    if (this.engine.p1.status !== 'DOWNED') {
      this.drawSnake(ctx, this.engine.p1, cellW, cellH, alpha, timestamp);
    }
    if (this.engine.p2.status !== 'DOWNED') {
      this.drawSnake(ctx, this.engine.p2, cellW, cellH, alpha, timestamp);
    }

    // 6. Draw Particles and Shockwaves
    this.engine.particles.render(ctx);

    // 7. Draw In-Game Floating Popups
    this.drawFloatingTexts(ctx);

    // 8. Draw Outer Cyber-Hazard Border
    this.drawHazardBorder(ctx, width, height);

    ctx.restore();
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cellW: number,
    cellH: number,
    gridW: number,
    gridH: number
  ): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = 0; x <= gridW; x++) {
      ctx.moveTo(x * cellW, 0);
      ctx.lineTo(x * cellW, height);
    }
    for (let y = 0; y <= gridH; y++) {
      ctx.moveTo(0, y * cellH);
      ctx.lineTo(width, y * cellH);
    }
    ctx.stroke();

    // Dot accents at intersections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let x = 0; x <= gridW; x += 2) {
      for (let y = 0; y <= gridH; y += 2) {
        ctx.fillRect(x * cellW - 1.5, y * cellH - 1.5, 3, 3);
      }
    }
  }

  private drawSynergyArc(
    ctx: CanvasRenderingContext2D,
    cellW: number,
    cellH: number,
    alpha: number,
    timestamp: number
  ): void {
    if (this.engine.p1.status === 'DOWNED' || this.engine.p2.status === 'DOWNED') return;

    const head1 = this.getInterpolatedSegment(this.engine.p1, 0, alpha);
    const head2 = this.getInterpolatedSegment(this.engine.p2, 0, alpha);

    const dx = head1.x - head2.x;
    const dy = head1.y - head2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5.0) {
      const p1x = (head1.x + 0.5) * cellW;
      const p1y = (head1.y + 0.5) * cellH;
      const p2x = (head2.x + 0.5) * cellW;
      const p2y = (head2.y + 0.5) * cellH;

      ctx.save();
      ctx.strokeStyle = '#00ff66';
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2 + Math.sin(timestamp * 0.02) * 1;
      ctx.globalAlpha = 0.8 * (1 - dist / 5.0);

      ctx.beginPath();
      ctx.moveTo(p1x, p1y);

      // Create lightning zigzag steps
      const steps = 6;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const midX = p1x + (p2x - p1x) * t + (Math.random() * 2 - 1) * 8;
        const midY = p1y + (p2y - p1y) * t + (Math.random() * 2 - 1) * 8;
        ctx.lineTo(midX, midY);
      }
      ctx.lineTo(p2x, p2y);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawFoods(
    ctx: CanvasRenderingContext2D,
    cellW: number,
    cellH: number,
    timestamp: number
  ): void {
    for (const food of this.engine.foods) {
      const cx = (food.x + 0.5) * cellW;
      const cy = (food.y + 0.5) * cellH;
      const hover = Math.sin(timestamp * 0.005 + food.x * 2) * (cellH * 0.08);
      const size = Math.min(cellW, cellH) * 0.38;

      ctx.save();
      ctx.translate(cx, cy + hover);

      if (food.type === CellType.FOOD_NORMAL) {
        // Neon Apple / Energy Orb
        const pulse = 1 + Math.sin(timestamp * 0.008) * 0.08;
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#ffea00';
        ctx.beginPath();
        ctx.arc(0, 0, size * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(size * 0.25, -size * 0.25, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // White sheen
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === CellType.FOOD_SUPER) {
        // Golden Battery Core
        const rot = timestamp * 0.003;
        ctx.rotate(rot);
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;

        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-size, -size, size * 2, size * 2);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
      } else if (food.type === CellType.FOOD_FREEZE) {
        // Freeze Diamond
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#00f0ff';

        ctx.beginPath();
        ctx.moveTo(0, -size * 1.3);
        ctx.lineTo(size * 1.1, 0);
        ctx.lineTo(0, size * 1.3);
        ctx.lineTo(-size * 1.1, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (food.type === CellType.FOOD_GHOST) {
        // Ethereal Ghost Orb
        ctx.shadowColor = '#bd00ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#bd00ff';

        ctx.beginPath();
        ctx.arc(0, 0, size * 1.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);
      } else if (food.type === CellType.REVIVE_BEACON) {
        // Emergency Revive Radar Beacon
        const radarRadius = (size * 1.8) * ((timestamp % 1000) / 1000);
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radarRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#00ff66';

        // Plus / Cross shape
        const crossW = size * 0.6;
        const crossL = size * 1.5;
        ctx.fillRect(-crossW / 2, -crossL / 2, crossW, crossL);
        ctx.fillRect(-crossL / 2, -crossW / 2, crossL, crossW);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px Archivo Black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('REVIVE', 0, 0);
      }

      ctx.restore();
    }
  }

  private getInterpolatedSegment(
    snake: SnakeState,
    index: number,
    alpha: number
  ): Vector2D {
    const curr = snake.segments[index];
    if (!curr) return { x: 0, y: 0 };
    const prev = snake.prevSegments[index] ?? curr;

    return {
      x: prev.x + (curr.x - prev.x) * alpha,
      y: prev.y + (curr.y - prev.y) * alpha,
    };
  }

  private drawSnake(
    ctx: CanvasRenderingContext2D,
    snake: SnakeState,
    cellW: number,
    cellH: number,
    alpha: number,
    timestamp: number
  ): void {
    const segments = snake.segments;
    if (segments.length === 0) return;

    const isGhost = snake.status === 'GHOST' || this.engine.settings.friendlyPassThrough;
    const isInvulnerable = snake.invulnerableTicks > 0;
    const baseAlpha = isGhost ? 0.65 : isInvulnerable ? (Math.sin(timestamp * 0.03) > 0 ? 0.4 : 0.9) : 1.0;

    const radius = Math.min(cellW, cellH) * 0.42;

    ctx.save();
    ctx.globalAlpha = baseAlpha;

    // 1. Draw Snake Body Ribbons & Segments
    for (let i = segments.length - 1; i >= 1; i--) {
      const pos = this.getInterpolatedSegment(snake, i, alpha);
      const nextPos = this.getInterpolatedSegment(snake, i - 1, alpha);

      const px = (pos.x + 0.5) * cellW;
      const py = (pos.y + 0.5) * cellH;
      const nx = (nextPos.x + 0.5) * cellW;
      const ny = (nextPos.y + 0.5) * cellH;

      const segRadius = radius * (0.65 + 0.35 * (1 - i / segments.length));

      // Body connector line
      ctx.strokeStyle = snake.color;
      ctx.lineWidth = segRadius * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Inner glow spine
      ctx.strokeStyle = snake.glowColor;
      ctx.lineWidth = segRadius * 0.8;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Outer brutal border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 2. Draw Snake Head
    const headPos = this.getInterpolatedSegment(snake, 0, alpha);
    const hx = (headPos.x + 0.5) * cellW;
    const hy = (headPos.y + 0.5) * cellH;
    const headRadius = radius * 1.15;

    ctx.save();
    ctx.translate(hx, hy);

    // Glow aura
    ctx.shadowColor = snake.glowColor;
    ctx.shadowBlur = 14;

    // Head circle / pill
    ctx.fillStyle = snake.color;
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Visor / Eyes facing direction
    const dirVec = DIRECTION_VECTORS[snake.direction] as Vector2D;
    const eyeOffsetX = dirVec.x * headRadius * 0.45;
    const eyeOffsetY = dirVec.y * headRadius * 0.45;

    // Eye visor
    ctx.fillStyle = snake.glowColor;
    ctx.shadowColor = snake.glowColor;
    ctx.shadowBlur = 8;

    if (dirVec.x !== 0) {
      // Moving Horizontal: draw vertical eye slit or dual eyes
      ctx.fillRect(eyeOffsetX - 2, -headRadius * 0.5, 4, headRadius);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eyeOffsetX - 1, -headRadius * 0.3, 2, headRadius * 0.6);
    } else {
      // Moving Vertical: draw horizontal eye slit
      ctx.fillRect(-headRadius * 0.5, eyeOffsetY - 2, headRadius, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-headRadius * 0.3, eyeOffsetY - 1, headRadius * 0.6, 2);
    }

    // Player ID Tag
    ctx.fillStyle = '#000000';
    ctx.font = '900 10px Archivo Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P${snake.id}`, -dirVec.x * 3, -dirVec.y * 3);

    ctx.restore();
    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    for (const ft of this.engine.floatingTexts) {
      const progress = ft.life / ft.maxLife;
      const alpha = Math.max(0, 1 - progress);
      const scale = 1 + progress * 0.3;

      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      ctx.font = `900 ${ft.size}px 'Archivo Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow / stroke
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, 0, 0);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
  }

  private drawHazardBorder(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    // Corner Brutal Accents
    const cornerSize = 18;
    ctx.fillStyle = '#ffea00';

    // Top-left
    ctx.fillRect(0, 0, cornerSize, 6);
    ctx.fillRect(0, 0, 6, cornerSize);

    // Top-right
    ctx.fillRect(width - cornerSize, 0, cornerSize, 6);
    ctx.fillRect(width - 6, 0, 6, cornerSize);

    // Bottom-left
    ctx.fillRect(0, height - 6, cornerSize, 6);
    ctx.fillRect(0, height - cornerSize, 6, cornerSize);

    // Bottom-right
    ctx.fillRect(width - cornerSize, height - 6, cornerSize, 6);
    ctx.fillRect(width - 6, height - cornerSize, 6, cornerSize);

    ctx.restore();
  }
}
