import { AttractorPoint } from '@/types';

export class GravityOrbitEngine {
  private G: number = 3200; // Gravitational constant
  private softeningEpsilonSq: number = 400; // Softening parameter to prevent infinite velocity spikes at r=0

  /**
   * Applies gravitational acceleration from all attractors/repulsors onto a particle (px, py)
   */
  public calculateNetAcceleration(
    px: number,
    py: number,
    attractors: AttractorPoint[],
    pointerX: number = -1,
    pointerY: number = -1,
    pointerStrength: number = 0
  ): { ax: number; ay: number } {
    let ax = 0;
    let ay = 0;

    // Fixed / spawned attractors
    for (let i = 0; i < attractors.length; i++) {
      const a = attractors[i];
      const dx = a.x - px;
      const dy = a.y - py;
      const distSq = dx * dx + dy * dy + this.softeningEpsilonSq;
      const dist = Math.sqrt(distSq);

      // Force = G * strength / distSq
      const force = (this.G * a.strength) / distSq;
      ax += (dx / dist) * force;
      ay += (dy / dist) * force;
    }

    // Active cursor attractor/repulsor
    if (pointerStrength !== 0 && pointerX >= 0 && pointerY >= 0) {
      const dx = pointerX - px;
      const dy = pointerY - py;
      const distSq = dx * dx + dy * dy + this.softeningEpsilonSq;
      const dist = Math.sqrt(distSq);

      const force = (this.G * pointerStrength) / distSq;
      ax += (dx / dist) * force;
      ay += (dy / dist) * force;
    }

    return { ax, ay };
  }

  /**
   * Renders glowing gravitational wells / repulsors on overlay canvas
   */
  public static drawAttractorOverlays(
    ctx: CanvasRenderingContext2D,
    attractors: AttractorPoint[],
    time: number
  ) {
    for (const a of attractors) {
      const isAttractor = a.strength > 0;
      const baseColor = isAttractor ? '#00F0FF' : '#FF0055';
      const glowRadius = Math.min(48, Math.max(16, Math.abs(a.strength) * 20));

      ctx.save();
      // Outer ripple ring
      const ripple = (time * 0.04) % 1;
      ctx.beginPath();
      ctx.arc(a.x, a.y, glowRadius * (0.8 + ripple * 0.5), 0, Math.PI * 2);
      ctx.strokeStyle = isAttractor
        ? `rgba(0, 240, 255, ${0.5 * (1 - ripple)})`
        : `rgba(255, 0, 85, ${0.5 * (1 - ripple)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core well circle
      ctx.beginPath();
      ctx.arc(a.x, a.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = baseColor;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 12;
      ctx.fill();

      // Sign indicator
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isAttractor ? '+' : '−', a.x, a.y);

      ctx.restore();
    }
  }
}
