export const CHUNK_SIZE = 480; // 480px per chunk (10 tiles)

export interface SpatialEntity {
  id: string;
  x: number;
  y: number;
}

export class SpatialHashGrid {
  private chunkSize = CHUNK_SIZE;
  // chunkKey 'cx,cy' -> Set of entity IDs
  private chunks: Map<string, Set<string>> = new Map();
  // entityId -> chunkKey
  private entityToChunk: Map<string, string> = new Map();

  public getChunkKey(x: number, y: number): string {
    const cx = Math.floor(x / this.chunkSize);
    const cy = Math.floor(y / this.chunkSize);
    return `${cx},${cy}`;
  }

  public updateEntity(id: string, x: number, y: number) {
    const newKey = this.getChunkKey(x, y);
    const oldKey = this.entityToChunk.get(id);

    if (oldKey === newKey) {
      return;
    }

    if (oldKey) {
      const oldSet = this.chunks.get(oldKey);
      if (oldSet) {
        oldSet.delete(id);
        if (oldSet.size === 0) {
          this.chunks.delete(oldKey);
        }
      }
    }

    let newSet = this.chunks.get(newKey);
    if (!newSet) {
      newSet = new Set();
      this.chunks.set(newKey, newSet);
    }
    newSet.add(id);
    this.entityToChunk.set(id, newKey);
  }

  public removeEntity(id: string) {
    const oldKey = this.entityToChunk.get(id);
    if (oldKey) {
      const set = this.chunks.get(oldKey);
      if (set) {
        set.delete(id);
        if (set.size === 0) {
          this.chunks.delete(oldKey);
        }
      }
      this.entityToChunk.delete(id);
    }
  }

  // Retrieve all entity IDs in adjacent chunks (3x3 grid around player)
  public getNeighborEntityIds(x: number, y: number): Set<string> {
    const centerCx = Math.floor(x / this.chunkSize);
    const centerCy = Math.floor(y / this.chunkSize);
    const results = new Set<string>();

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${centerCx + dx},${centerCy + dy}`;
        const set = this.chunks.get(key);
        if (set) {
          for (const id of set) {
            results.add(id);
          }
        }
      }
    }

    return results;
  }

  // Calculate Euclidean distance between two points
  public static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
