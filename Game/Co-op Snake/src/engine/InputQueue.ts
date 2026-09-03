import { DIRECTION_VECTORS } from './types';
import type { Direction, PlayerId } from './types';

/**
 * Calculates dot product of two 2D directional vectors.
 * If dot product == -1, vectors are directly opposite (180° reversal).
 */
export function getDirectionDotProduct(dirA: Direction, dirB: Direction): number {
  const vecA = DIRECTION_VECTORS[dirA];
  const vecB = DIRECTION_VECTORS[dirB];
  const dot = vecA.x * vecB.x + vecA.y * vecB.y;
  return dot === 0 ? 0 : dot;
}

/**
 * Isolated FIFO Input Queue (Capacity = 2) for rapid-keypress buffering
 * Prevents instant 180° self-reversal collisions via dot-product validation.
 */
export class InputQueue {
  private p1Queue: Direction[] = [];
  private p2Queue: Direction[] = [];
  private readonly maxCapacity: number = 2;

  /**
   * Enqueues an input direction for the specified player.
   * Validates against the last pending queue element (or current direction) using vector dot product.
   */
  public enqueue(playerId: PlayerId, direction: Direction, currentDirection: Direction): boolean {
    const queue = playerId === 1 ? this.p1Queue : this.p2Queue;

    // Determine the reference direction: either the last enqueued item or the current moving direction
    const referenceDir = queue.length > 0 ? queue[queue.length - 1] : currentDirection;

    // Check if input is redundant (same as reference) or a 180° reversal (dot product == -1)
    if (direction === referenceDir) {
      return false;
    }

    if (getDirectionDotProduct(direction, referenceDir) === -1) {
      return false; // Direct 180° reversal rejected
    }

    if (queue.length >= this.maxCapacity) {
      // Overwrite the last pending item if queue is full
      queue[queue.length - 1] = direction;
    } else {
      queue.push(direction);
    }

    return true;
  }

  /**
   * Dequeues the next valid direction for the fixed-tick step.
   */
  public dequeue(playerId: PlayerId, currentDirection: Direction): Direction {
    const queue = playerId === 1 ? this.p1Queue : this.p2Queue;

    while (queue.length > 0) {
      const nextDir = queue.shift()!;
      // Final sanity check against current tick direction
      if (getDirectionDotProduct(nextDir, currentDirection) !== -1) {
        return nextDir;
      }
    }

    return currentDirection;
  }

  public peek(playerId: PlayerId): Direction | null {
    const queue = playerId === 1 ? this.p1Queue : this.p2Queue;
    return queue.length > 0 ? queue[0] : null;
  }

  public clear(): void {
    this.p1Queue = [];
    this.p2Queue = [];
  }
}
