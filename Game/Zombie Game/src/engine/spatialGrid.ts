export interface GridEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  [key: string]: any;
}

export class SpatialHashGrid<T extends GridEntity> {
  private cellSize: number;
  private grid: Map<string, T[]>;

  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  public clear() {
    this.grid.clear();
  }

  private getKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  public insert(entity: T) {
    const minX = Math.floor((entity.x - entity.radius) / this.cellSize);
    const maxX = Math.floor((entity.x + entity.radius) / this.cellSize);
    const minY = Math.floor((entity.y - entity.radius) / this.cellSize);
    const maxY = Math.floor((entity.y + entity.radius) / this.cellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = this.getKey(cx, cy);
        let list = this.grid.get(key);
        if (!list) {
          list = [];
          this.grid.set(key, list);
        }
        list.push(entity);
      }
    }
  }

  public queryNearby(x: number, y: number, radius: number): T[] {
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minY = Math.floor((y - radius) / this.cellSize);
    const maxY = Math.floor((y + radius) / this.cellSize);

    const results: T[] = [];
    const seenIds = new Set<string>();

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = this.getKey(cx, cy);
        const cellEntities = this.grid.get(key);
        if (cellEntities) {
          for (let i = 0; i < cellEntities.length; i++) {
            const ent = cellEntities[i];
            if (!seenIds.has(ent.id)) {
              seenIds.add(ent.id);
              // Radial distance check
              const dx = ent.x - x;
              const dy = ent.y - y;
              const distSq = dx * dx + dy * dy;
              const rSum = ent.radius + radius;
              if (distSq <= rSum * rSum) {
                results.push(ent);
              }
            }
          }
        }
      }
    }

    return results;
  }
}
