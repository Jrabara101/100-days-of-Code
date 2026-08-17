import { PIXELS_PER_METER } from './Vehicle.js';

/**
 * Parametric Road Track Base Class
 */
export class RoadTrack {
  constructor(id, name, lengthMeters) {
    this.id = id;
    this.name = name;
    this.lengthMeters = lengthMeters;
    this.isLoop = false;
  }

  /**
   * Get 2D Cartesian position and tangent angle from 1D arc-length s (meters) and lateral offset d (meters)
   * @param {number} s - Longitudinal distance along track (m)
   * @param {number} d - Lateral offset perpendicular to tangent (m)
   * @returns {{x: number, y: number, angle: number}}
   */
  getTransform(s, d = 0) {
    throw new Error('getTransform must be implemented by subclass');
  }

  draw(ctx, options = {}) {
    throw new Error('draw must be implemented by subclass');
  }
}

/**
 * Linear Straight Track
 */
export class StraightTrack extends RoadTrack {
  constructor(id, name, x1, y1, x2, y2, isLoop = true) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthPx = Math.sqrt(dx * dx + dy * dy);
    const lengthMeters = lengthPx / PIXELS_PER_METER;

    super(id, name, lengthMeters);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.angle = Math.atan2(dy, dx);
    this.lengthPx = lengthPx;
    this.isLoop = isLoop;
  }

  getTransform(s, d = 0) {
    let effectiveS = s;
    if (this.isLoop && this.lengthMeters > 0) {
      effectiveS = ((s % this.lengthMeters) + this.lengthMeters) % this.lengthMeters;
    }
    const sPx = effectiveS * PIXELS_PER_METER;
    const dPx = d * PIXELS_PER_METER;

    const cosA = Math.cos(this.angle);
    const sinA = Math.sin(this.angle);

    // Lateral perpendicular vector: normal = (-sinA, cosA)
    const x = this.x1 + cosA * sPx - sinA * dPx;
    const y = this.y1 + sinA * sPx + cosA * dPx;

    return { x, y, angle: this.angle };
  }
}

/**
 * Circular Arc / Ring Track (e.g. Sugiyama Ring, Roundabout)
 */
export class ArcTrack extends RoadTrack {
  constructor(id, name, cx, cy, radiusMeters, startAngle = 0, sweepAngle = Math.PI * 2, isLoop = true) {
    const lengthMeters = radiusMeters * Math.abs(sweepAngle);
    super(id, name, lengthMeters);
    this.cx = cx;
    this.cy = cy;
    this.radiusMeters = radiusMeters;
    this.radiusPx = radiusMeters * PIXELS_PER_METER;
    this.startAngle = startAngle;
    this.sweepAngle = sweepAngle;
    this.isLoop = isLoop;
  }

  getTransform(s, d = 0) {
    let effectiveS = s;
    if (this.isLoop && this.lengthMeters > 0) {
      effectiveS = ((s % this.lengthMeters) + this.lengthMeters) % this.lengthMeters;
    }

    const fraction = this.lengthMeters > 0 ? (effectiveS / this.lengthMeters) : 0;
    const currentAngle = this.startAngle + fraction * this.sweepAngle;

    const rEffectivePx = (this.radiusMeters + d) * PIXELS_PER_METER;
    const x = this.cx + Math.cos(currentAngle) * rEffectivePx;
    const y = this.cy + Math.sin(currentAngle) * rEffectivePx;

    // Tangent angle is perpendicular to radius vector in direction of sweep
    const tangentAngle = currentAngle + (this.sweepAngle >= 0 ? Math.PI / 2 : -Math.PI / 2);

    return { x, y, angle: tangentAngle };
  }
}

/**
 * Composite Path (Linear + Arcs + Beziers) with arc-length lookup table
 */
export class CompositeTrack extends RoadTrack {
  constructor(id, name, points, isLoop = true) {
    // points: Array of {x, y}
    let totalLengthPx = 0;
    const segments = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLenPx = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      segments.push({
        p1,
        p2,
        startDistPx: totalLengthPx,
        lengthPx: segLenPx,
        angle
      });
      totalLengthPx += segLenPx;
    }

    if (isLoop && points.length > 2) {
      const p1 = points[points.length - 1];
      const p2 = points[0];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLenPx = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      segments.push({
        p1,
        p2,
        startDistPx: totalLengthPx,
        lengthPx: segLenPx,
        angle
      });
      totalLengthPx += segLenPx;
    }

    const totalLengthMeters = totalLengthPx / PIXELS_PER_METER;
    super(id, name, totalLengthMeters);
    this.points = points;
    this.segments = segments;
    this.totalLengthPx = totalLengthPx;
    this.isLoop = isLoop;
  }

  getTransform(s, d = 0) {
    let effectiveS = s;
    if (this.isLoop && this.lengthMeters > 0) {
      effectiveS = ((s % this.lengthMeters) + this.lengthMeters) % this.lengthMeters;
    }
    const sPx = effectiveS * PIXELS_PER_METER;
    const dPx = d * PIXELS_PER_METER;

    // Find active segment via binary search or linear scan
    let seg = this.segments[0];
    for (let i = 0; i < this.segments.length; i++) {
      const cur = this.segments[i];
      if (sPx >= cur.startDistPx && sPx <= cur.startDistPx + cur.lengthPx) {
        seg = cur;
        break;
      }
    }

    const segLocalDist = Math.max(0, Math.min(seg.lengthPx, sPx - seg.startDistPx));
    const cosA = Math.cos(seg.angle);
    const sinA = Math.sin(seg.angle);

    const x = seg.p1.x + cosA * segLocalDist - sinA * dPx;
    const y = seg.p1.y + sinA * segLocalDist + cosA * dPx;

    return { x, y, angle: seg.angle };
  }
}
