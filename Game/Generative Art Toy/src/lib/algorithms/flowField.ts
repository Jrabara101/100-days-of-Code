import { SimplexNoise } from './simplexNoise';

export interface FlowFieldConfig {
  noiseScale: number;
  timeSpeed: number;
  turbulence: number;
  baseSpeed: number;
  vortexStrength: number;
}

export class FlowFieldEngine {
  private noise: SimplexNoise;
  private time: number = 0;

  constructor(seed: number = 42) {
    this.noise = new SimplexNoise(seed);
  }

  public setSeed(seed: number) {
    this.noise.init(seed);
    this.time = 0;
  }

  public updateTime(dt: number, speedMultiplier: number = 1.0) {
    this.time += dt * 0.00015 * speedMultiplier;
  }

  /**
   * Computes the vector angle at (x, y) with optional pointer vortex
   */
  public getVector(
    x: number,
    y: number,
    width: number,
    height: number,
    turbulence: number = 1.0,
    pointerX: number = -1,
    pointerY: number = -1,
    pointerActive: boolean = false
  ): { vx: number; vy: number; speedNorm: number } {
    const scale = 0.0018 * turbulence;
    const n = this.noise.noise3D(x * scale, y * scale, this.time);
    
    // Convert noise [-1, 1] to angle [0, 4*PI]
    let angle = n * Math.PI * 4.0;

    // Pointer disturbance (vortex swirl)
    if (pointerActive && pointerX >= 0 && pointerY >= 0) {
      const dx = pointerX - x;
      const dy = pointerY - y;
      const distSq = dx * dx + dy * dy;
      const maxDist = 240;
      if (distSq < maxDist * maxDist && distSq > 4) {
        const dist = Math.sqrt(distSq);
        const factor = (1 - dist / maxDist);
        // Swirl angle perpendicular to pointer direction
        const pointerAngle = Math.atan2(dy, dx) + Math.PI * 0.5;
        angle = angle * (1 - factor * 0.8) + pointerAngle * (factor * 0.8);
      }
    }

    const vx = Math.cos(angle);
    const vy = Math.sin(angle);
    const speedNorm = (n + 1.0) * 0.5; // normalized 0 to 1

    return { vx, vy, speedNorm };
  }
}
