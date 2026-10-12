import { EntityState, KeyframeSnapshot } from '../types/replay';

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpAngle(a1: number, a2: number, t: number): number {
  let diff = (a2 - a1) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a1 + diff * t;
}

export function interpolateEntities(
  prevKf: KeyframeSnapshot,
  nextKf: KeyframeSnapshot,
  targetTick: number
): EntityState[] {
  if (prevKf.tick === nextKf.tick) {
    return prevKf.entities;
  }

  const alpha = Math.max(0, Math.min(1, (targetTick - prevKf.tick) / (nextKf.tick - prevKf.tick)));
  const nextEntityMap = new Map<string, EntityState>();
  for (const ent of nextKf.entities) {
    nextEntityMap.set(ent.id, ent);
  }

  const interpolated: EntityState[] = [];

  for (const pEnt of prevKf.entities) {
    const nEnt = nextEntityMap.get(pEnt.id);
    if (nEnt) {
      interpolated.push({
        ...pEnt,
        pos: {
          x: lerp(pEnt.pos.x, nEnt.pos.x, alpha),
          y: lerp(pEnt.pos.y, nEnt.pos.y, alpha),
        },
        velocity: {
          x: lerp(pEnt.velocity.x, nEnt.velocity.x, alpha),
          y: lerp(pEnt.velocity.y, nEnt.velocity.y, alpha),
        },
        rotation: lerpAngle(pEnt.rotation ?? 0, nEnt.rotation ?? 0, alpha),
        health: nEnt.health !== undefined && pEnt.health !== undefined
          ? lerp(pEnt.health, nEnt.health, alpha)
          : (nEnt.health ?? pEnt.health),
      });
      nextEntityMap.delete(pEnt.id);
    } else {
      // Entity disappeared in next keyframe; keep for first half of alpha
      if (alpha < 0.5) {
        interpolated.push(pEnt);
      }
    }
  }

  // Entities that only exist in next keyframe
  for (const [, nEnt] of nextEntityMap) {
    if (alpha >= 0.5) {
      interpolated.push(nEnt);
    }
  }

  return interpolated;
}
