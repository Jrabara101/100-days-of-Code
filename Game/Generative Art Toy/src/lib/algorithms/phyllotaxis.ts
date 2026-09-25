/**
 * Phyllotaxis & Organic Crystal Bloomer Engine.
 * Simulates Fermat's spiral (golden ratio angle 137.507764 deg)
 * combined with rhythmic crystal blooms and harmonic expansion.
 */

export const GOLDEN_ANGLE_RAD = 137.507764 * (Math.PI / 180);

export class PhyllotaxisEngine {
  private time: number = 0;

  public updateTime(dt: number, speedMultiplier: number = 1.0) {
    this.time += dt * 0.001 * speedMultiplier;
  }

  /**
   * Calculates dynamic target position for particle index `n`
   */
  public getTargetPosition(
    n: number,
    cx: number,
    cy: number,
    spreadScaling: number = 6.5,
    pointerDistortionX: number = -1,
    pointerDistortionY: number = -1
  ): { targetX: number; targetY: number; radius: number; angle: number } {
    // Dynamic breathing oscillation
    const breath = 1.0 + Math.sin(this.time * 1.5 + n * 0.002) * 0.12;
    const r = spreadScaling * Math.sqrt(n) * breath;
    const theta = n * GOLDEN_ANGLE_RAD + (this.time * 0.15);

    let targetX = cx + r * Math.cos(theta);
    let targetY = cy + r * Math.sin(theta);

    // Pointer magnetic ripple repulsion
    if (pointerDistortionX >= 0 && pointerDistortionY >= 0) {
      const dx = targetX - pointerDistortionX;
      const dy = targetY - pointerDistortionY;
      const distSq = dx * dx + dy * dy;
      if (distSq < 30000 && distSq > 1) {
        const dist = Math.sqrt(distSq);
        const push = (1 - dist / 173) * 60;
        targetX += (dx / dist) * push;
        targetY += (dy / dist) * push;
      }
    }

    return { targetX, targetY, radius: r, angle: theta };
  }
}
