export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialItem {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: string;
  data: any;
}

export class Quadtree {
  private bounds: Rect;
  private maxItems: number;
  private maxDepth: number;
  private depth: number;
  private items: SpatialItem[];
  private nodes: Quadtree[];

  constructor(bounds: Rect, maxItems: number = 8, maxDepth: number = 5, depth: number = 0) {
    this.bounds = bounds;
    this.maxItems = maxItems;
    this.maxDepth = maxDepth;
    this.depth = depth;
    this.items = [];
    this.nodes = [];
  }

  public clear(): void {
    this.items.length = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
    this.nodes.length = 0;
  }

  private subdivide(): void {
    const subW = this.bounds.width / 2;
    const subH = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.nodes[0] = new Quadtree({ x: x + subW, y, width: subW, height: subH }, this.maxItems, this.maxDepth, this.depth + 1);
    this.nodes[1] = new Quadtree({ x, y, width: subW, height: subH }, this.maxItems, this.maxDepth, this.depth + 1);
    this.nodes[2] = new Quadtree({ x, y: y + subH, width: subW, height: subH }, this.maxItems, this.maxDepth, this.depth + 1);
    this.nodes[3] = new Quadtree({ x: x + subW, y: y + subH, width: subW, height: subH }, this.maxItems, this.maxDepth, this.depth + 1);
  }

  private getIndex(item: SpatialItem): number {
    const midX = this.bounds.x + this.bounds.width / 2;
    const midY = this.bounds.y + this.bounds.height / 2;

    const top = item.y - item.radius < midY && item.y + item.radius < midY;
    const bottom = item.y - item.radius > midY;

    if (item.x - item.radius < midX && item.x + item.radius < midX) {
      if (top) return 1;
      if (bottom) return 2;
    } else if (item.x - item.radius > midX) {
      if (top) return 0;
      if (bottom) return 3;
    }

    return -1;
  }

  public insert(item: SpatialItem): void {
    if (this.nodes.length > 0) {
      const index = this.getIndex(item);
      if (index !== -1) {
        this.nodes[index].insert(item);
        return;
      }
    }

    this.items.push(item);

    if (this.items.length > this.maxItems && this.depth < this.maxDepth) {
      if (this.nodes.length === 0) {
        this.subdivide();
      }

      let i = 0;
      while (i < this.items.length) {
        const index = this.getIndex(this.items[i]);
        if (index !== -1) {
          const removed = this.items.splice(i, 1)[0];
          this.nodes[index].insert(removed);
        } else {
          i++;
        }
      }
    }
  }

  public retrieve(returnItems: SpatialItem[], queryArea: Rect): SpatialItem[] {
    const midX = this.bounds.x + this.bounds.width / 2;
    const midY = this.bounds.y + this.bounds.height / 2;

    const startIsNorth = queryArea.y < midY;
    const startIsWest = queryArea.x < midX;
    const endIsEast = queryArea.x + queryArea.width > midX;
    const endIsSouth = queryArea.y + queryArea.height > midY;

    if (this.nodes.length > 0) {
      // Top-Right
      if (startIsNorth && endIsEast) {
        this.nodes[0].retrieve(returnItems, queryArea);
      }
      // Top-Left
      if (startIsNorth && startIsWest) {
        this.nodes[1].retrieve(returnItems, queryArea);
      }
      // Bottom-Left
      if (endIsSouth && startIsWest) {
        this.nodes[2].retrieve(returnItems, queryArea);
      }
      // Bottom-Right
      if (endIsSouth && endIsEast) {
        this.nodes[3].retrieve(returnItems, queryArea);
      }
    }

    for (let i = 0; i < this.items.length; i++) {
      returnItems.push(this.items[i]);
    }

    return returnItems;
  }

  public queryCircle(x: number, y: number, radius: number): SpatialItem[] {
    const searchArea: Rect = {
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2,
    };
    const candidates: SpatialItem[] = [];
    this.retrieve(candidates, searchArea);

    // Filter by true Euclidean distance
    const rSq = radius * radius;
    return candidates.filter((item) => {
      const dx = item.x - x;
      const dy = item.y - y;
      const combinedRadius = radius + item.radius;
      return dx * dx + dy * dy <= combinedRadius * combinedRadius;
    });
  }
}
