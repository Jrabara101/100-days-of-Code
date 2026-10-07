export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 1.0 down to 0.0
  decay: number;
  size: number;
  maxSize: number;
  color: string;
  shape: 'circle' | 'spark' | 'ring' | 'smoke' | 'text';
  text?: string;
  rotation?: number;
  vRot?: number;
}

export class ParticlePool {
  private pool: Particle[];
  private maxSize: number;

  constructor(maxSize: number = 1200) {
    this.maxSize = maxSize;
    this.pool = new Array(maxSize);
    for (let i = 0; i < maxSize; i++) {
      this.pool[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        decay: 0.02,
        size: 2,
        maxSize: 2,
        color: '#4cd7f6',
        shape: 'circle',
      };
    }
  }

  private getNext(): Particle | null {
    for (let i = 0; i < this.maxSize; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    // If saturated, steal oldest (first element)
    return this.pool[0];
  }

  public spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    decay: number = 0.03,
    shape: Particle['shape'] = 'circle',
    text?: string
  ): void {
    const p = this.getNext();
    if (!p) return;

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.color = color;
    p.size = size;
    p.maxSize = size;
    p.life = 1.0;
    p.decay = decay;
    p.shape = shape;
    p.text = text;
    p.rotation = Math.random() * Math.PI * 2;
    p.vRot = (Math.random() - 0.5) * 0.1;
  }

  public spawnExplosion(x: number, y: number, count: number = 24, baseColor: string = '#ffb4ab'): void {
    const colors = [baseColor, '#ff8a80', '#ff5252', '#f59e0b', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 2 + Math.random() * 4.5;
      const decay = 0.015 + Math.random() * 0.03;
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        size,
        decay,
        Math.random() > 0.4 ? 'circle' : 'spark'
      );
    }

    // Expanding shockwave ring
    this.spawnParticle(x, y, 0, 0, baseColor, 8, 0.035, 'ring');
  }

  public spawnGrazeSparks(x: number, y: number): void {
    const colors = ['#4cd7f6', '#4edea3', '#ddb7ff', '#ffffff'];
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        2.5,
        0.05,
        'spark'
      );
    }
  }

  public spawnThrusterFlame(x: number, y: number, vx: number, vy: number, color: string = '#4cd7f6'): void {
    const spreadAngle = (Math.random() - 0.5) * 0.4;
    const speed = 2.5 + Math.random() * 3.5;
    const pVx = vx + Math.sin(spreadAngle) * 1.5;
    const pVy = vy + Math.cos(spreadAngle) * speed;

    this.spawnParticle(
      x + (Math.random() - 0.5) * 4,
      y,
      pVx,
      pVy,
      color,
      2.5 + Math.random() * 2,
      0.06,
      'circle'
    );
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string = '#4cd7f6'): void {
    this.spawnParticle(
      x,
      y,
      (Math.random() - 0.5) * 0.8,
      -1.5 - Math.random() * 0.8,
      color,
      12,
      0.025,
      'text',
      text
    );
  }

  public spawnEMPBlast(x: number, y: number, maxRadius: number = 320): void {
    // Large expanding ionized ring
    this.spawnParticle(x, y, 0, 0, '#06b6d4', maxRadius, 0.02, 'ring');
    // Radial ionized debris
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const speed = 6 + Math.random() * 4;
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        '#ddb7ff',
        3,
        0.025,
        'spark'
      );
    }
  }

  public update(): void {
    for (let i = 0; i < this.maxSize; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.shape === 'ring') {
        p.size += 5.5; // Expanding ring
      } else if (p.shape !== 'text') {
        p.size = p.maxSize * p.life;
      }

      if (p.vRot) {
        p.rotation = (p.rotation || 0) + p.vRot;
      }

      if (p.life <= 0) {
        p.active = false;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.maxSize; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));

      if (p.shape === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
        ctx.stroke();
      } else if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'text' && p.text) {
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillText(p.text, p.x, p.y);
      }

      ctx.restore();
    }
  }

  public clear(): void {
    for (let i = 0; i < this.maxSize; i++) {
      this.pool[i].active = false;
    }
  }
}
