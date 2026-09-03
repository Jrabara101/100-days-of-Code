import { CellType } from './types';
import type { SnakeState, FoodItem } from './types';

/**
 * 1D Flat Spatial Collision Matrix (O(1) lookups)
 * Flattened Uint8Array buffer representing a 2D discrete grid.
 * Index = y * width + x
 */
export class SpatialCollisionMatrix {
  public width: number;
  public height: number;
  public buffer: Uint8Array;
  private totalCells: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.totalCells = width * height;
    this.buffer = new Uint8Array(this.totalCells);
  }

  public resize(width: number, height: number): void {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.totalCells = width * height;
    this.buffer = new Uint8Array(this.totalCells);
  }

  public clear(): void {
    this.buffer.fill(CellType.EMPTY);
  }

  public getIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  public isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  public get(x: number, y: number): CellType {
    if (!this.isValid(x, y)) {
      return CellType.WALL;
    }
    return this.buffer[y * this.width + x] as CellType;
  }

  public set(x: number, y: number, type: CellType): void {
    if (this.isValid(x, y)) {
      this.buffer[y * this.width + x] = type;
    }
  }

  /**
   * Stamps snake body segments into the matrix.
   * Excludes head if requested so head can evaluate its destination.
   */
  public stampSnake(snake: SnakeState, includeHead = true): void {
    if (snake.status === 'DOWNED') return;
    const cellType = snake.id === 1 ? CellType.P1_BODY : CellType.P2_BODY;
    const startIndex = includeHead ? 0 : 1;

    for (let i = startIndex; i < snake.segments.length; i++) {
      const seg = snake.segments[i];
      if (this.isValid(seg.x, seg.y)) {
        this.buffer[seg.y * this.width + seg.x] = cellType;
      }
    }
  }

  /**
   * Stamps food items into the matrix.
   */
  public stampFood(foodList: FoodItem[]): void {
    for (const food of foodList) {
      if (this.isValid(food.x, food.y)) {
        this.buffer[food.y * this.width + food.x] = food.type;
      }
    }
  }

  /**
   * Calculates current non-empty cell occupancy percentage.
   */
  public getOccupancyPercentage(): number {
    let occupied = 0;
    for (let i = 0; i < this.totalCells; i++) {
      if (this.buffer[i] !== CellType.EMPTY) {
        occupied++;
      }
    }
    return Math.round((occupied / this.totalCells) * 1000) / 10;
  }
}
