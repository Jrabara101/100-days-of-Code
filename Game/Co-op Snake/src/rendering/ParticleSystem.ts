export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'circle' | 'square' | 'spark';
  rotation: number;
  vRot: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  width: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public shockwaves: Shockwave[] = [];
  public shakeMagnitude: number = 0;
  public shakeDecay: number = 0.9;
  public shakeX: number = 0;
  public shakeY: number = 0;

  public update(dt: number): void {
    // Update screen shake
    if (this.shakeMagnitude > 0.1) {
      this.shakeX = (Math.random() * 2 - 1) * this.shakeMagnitude;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeMagnitude;
      this.shakeMagnitude *= this.shakeDecay;
    } else {
      this.shakeMagnitude = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 6 * dt + 50 * dt;
      sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

      if (sw.alpha <= 0.02 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  public triggerShake(magnitude = 8): void {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
  }

  public emitFoodBurst(x: number, y: number, color: string, count = 16): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        decay: 1.5 + Math.random() * 1.5,
        shape: Math.random() > 0.5 ? 'square' : 'circle',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 8,
      });
    }

    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius: 36,
      color,
      alpha: 0.9,
      width: 3,
    });
  }

  public emitCrashBurst(x: number, y: number, colorA: string, colorB: string): void {
    this.triggerShake(16);

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 260;
      const color = Math.random() > 0.5 ? colorA : colorB;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color,
        alpha: 1,
        decay: 1.0 + Math.random() * 1.5,
        shape: 'square',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 12,
      });
    }

    this.shockwaves.push({
      x,
      y,
      radius: 6,
      maxRadius: 80,
      color: '#ff0033',
      alpha: 1.0,
      width: 5,
    });
  }

  public emitReviveSparks(x: number, y: number): void {
    this.triggerShake(6);
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: '#00ff66',
        alpha: 1,
        decay: 1.2 + Math.random() * 1.2,
        shape: 'spark',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 6,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Draw shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = sw.width;
      ctx.stroke();
      ctx.restore();
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.lineTo(p.size, 0);
        ctx.moveTo(0, -p.size);
        ctx.lineTo(0, p.size);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  public clear(): void {
    this.particles = [];
    this.shockwaves = [];
    this.shakeMagnitude = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }
}
