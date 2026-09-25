/**
 * Harmonic Kaleidoscope Radial Symmetry Engine.
 * Computes N-fold rotational and reflective mirror coordinates
 * around arbitrary center points (default canvas center).
 */

export interface SymmetryPoint {
  x: number;
  y: number;
}

export class KaleidoscopeEngine {
  /**
   * Transforms a single point (x, y) into an array of mirrored/rotated points
   * using N-fold rotational and reflection symmetry.
   */
  public static getSymmetricPoints(
    x: number,
    y: number,
    cx: number,
    cy: number,
    folds: number = 8,
    mirror: boolean = true
  ): SymmetryPoint[] {
    const points: SymmetryPoint[] = [];
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    let baseAngle = Math.atan2(dy, dx);

    const stepAngle = (Math.PI * 2) / folds;

    for (let i = 0; i < folds; i++) {
      const rotAngle = baseAngle + i * stepAngle;
      points.push({
        x: cx + r * Math.cos(rotAngle),
        y: cy + r * Math.sin(rotAngle)
      });

      if (mirror) {
        // Mirrored reflection across the sector radial bisector
        const mirrorAngle = (i * stepAngle) - baseAngle;
        points.push({
          x: cx + r * Math.cos(mirrorAngle),
          y: cy + r * Math.sin(mirrorAngle)
        });
      }
    }

    return points;
  }

  /**
   * Helper to draw symmetry guideline axes on ephemeral overlay canvas
   */
  public static drawGuideLines(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    folds: number,
    inverted: boolean = false
  ) {
    ctx.save();
    ctx.strokeStyle = inverted ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);

    const stepAngle = (Math.PI * 2) / folds;

    // Draw radial ray axes
    for (let i = 0; i < folds; i++) {
      const angle = i * stepAngle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      ctx.stroke();
    }

    // Concentric guide rings
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.33, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.66, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
