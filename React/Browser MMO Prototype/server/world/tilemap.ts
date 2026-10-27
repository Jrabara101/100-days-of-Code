import type { TileMapMeta } from './types.js';

export const TILE_SIZE = 48;
export const MAP_WIDTH = 50; // In tiles (2400px)
export const MAP_HEIGHT = 50; // In tiles (2400px)

export enum TileType {
  GRASS = 0,
  COBBLESTONE = 1,
  PLAZA_BRICK = 2,
  WATER = 3,
  WALL_STONE = 4,
  BUILDING = 5,
  FOUNTAIN = 6,
  TREE = 7,
  WOOD_DECK = 8,
  FLOWER_GRASS = 9,
  LANTERN = 10,
}

export interface WorldTile {
  type: TileType;
  solid: boolean;
  elevation?: number;
}

export class WorldTileMap {
  public width = MAP_WIDTH;
  public height = MAP_HEIGHT;
  public tileSize = TILE_SIZE;
  public tiles: WorldTile[][];
  public solidGrid: boolean[][];
  public spawnPoint = { x: 25 * TILE_SIZE, y: 28 * TILE_SIZE }; // Just south of town fountain

  constructor() {
    this.tiles = [];
    this.solidGrid = [];
    this.generateTownMap();
  }

  public getMeta(): TileMapMeta {
    return {
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      spawnPoint: this.spawnPoint,
    };
  }

  private generateTownMap() {
    // Initialize base grass
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      this.solidGrid[y] = [];
      for (let x = 0; x < this.width; x++) {
        // Subtle flower clusters
        const isFlower = (x * 7 + y * 13) % 29 === 0;
        this.tiles[y][x] = {
          type: isFlower ? TileType.FLOWER_GRASS : TileType.GRASS,
          solid: false,
        };
        this.solidGrid[y][x] = false;
      }
    }

    // Outer Perimeter Boundary Walls
    for (let x = 0; x < this.width; x++) {
      this.setTile(x, 0, TileType.WALL_STONE, true);
      this.setTile(x, this.height - 1, TileType.WALL_STONE, true);
    }
    for (let y = 0; y < this.height; y++) {
      this.setTile(0, y, TileType.WALL_STONE, true);
      this.setTile(this.width - 1, y, TileType.WALL_STONE, true);
    }

    // Main Town Plaza (Tiles 18 to 32)
    for (let y = 18; y <= 32; y++) {
      for (let x = 18; x <= 32; x++) {
        this.setTile(x, y, TileType.PLAZA_BRICK, false);
      }
    }

    // Cobblestone Main Crossroads Roads
    // North-South Avenue
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 24; x <= 26; x++) {
        this.setTile(x, y, TileType.COBBLESTONE, false);
      }
    }
    // East-West Boulevard
    for (let x = 1; x < this.width - 1; x++) {
      for (let y = 24; y <= 26; y++) {
        this.setTile(x, y, TileType.COBBLESTONE, false);
      }
    }

    // Center Town Fountain (Center at 25, 25)
    for (let fy = 24; fy <= 26; fy++) {
      for (let fx = 24; fx <= 26; fx++) {
        this.setTile(fx, fy, TileType.FOUNTAIN, true);
      }
    }

    // Merchant Stalls & Town Buildings (solid with walkable doorways)
    // 1. Armorer & Blacksmith (Top-Left: x: 19..22, y: 19..22)
    this.createBuilding(19, 19, 4, 4, 'Armory', 21, 22);

    // 2. Alchemist & Apothecary (Top-Right: x: 28..31, y: 19..22)
    this.createBuilding(28, 19, 4, 4, 'Alchemist', 29, 22);

    // 3. The Golden Griffin Tavern (Bottom-Left: x: 19..22, y: 28..31)
    this.createBuilding(19, 28, 4, 4, 'Tavern', 21, 28);

    // 4. Realm Adventurers Guildhall (Bottom-Right: x: 28..31, y: 28..31)
    this.createBuilding(28, 28, 4, 4, 'Guildhall', 29, 28);

    // Lanterns around town square
    const lanternCoords = [
      { x: 18, y: 18 }, { x: 32, y: 18 },
      { x: 18, y: 32 }, { x: 32, y: 32 },
      { x: 23, y: 23 }, { x: 27, y: 23 },
      { x: 23, y: 27 }, { x: 27, y: 27 },
      { x: 24, y: 10 }, { x: 26, y: 10 },
      { x: 24, y: 40 }, { x: 26, y: 40 },
    ];
    for (const l of lanternCoords) {
      this.setTile(l.x, l.y, TileType.LANTERN, true);
    }

    // Scenic Pond (x: 8..14, y: 8..14)
    for (let py = 8; py <= 14; py++) {
      for (let px = 8; px <= 14; px++) {
        const dx = px - 11;
        const dy = py - 11;
        if (dx * dx + dy * dy <= 10) {
          this.setTile(px, py, TileType.WATER, true);
        }
      }
    }

    // Second Pond with Lotus (x: 35..41, y: 35..41)
    for (let py = 35; py <= 41; py++) {
      for (let px = 35; px <= 41; px++) {
        const dx = px - 38;
        const dy = py - 38;
        if (dx * dx + dy * dy <= 9) {
          this.setTile(px, py, TileType.WATER, true);
        }
      }
    }

    // Lush Tree Groves (Solid forest outskirts)
    const treeClusters = [
      { startX: 4, startY: 4, w: 4, h: 4 },
      { startX: 36, startY: 4, w: 5, h: 4 },
      { startX: 4, startY: 36, w: 4, h: 5 },
      { startX: 12, startY: 38, w: 4, h: 4 },
      { startX: 38, startY: 14, w: 4, h: 4 },
    ];
    for (const cluster of treeClusters) {
      for (let ty = cluster.startY; ty < cluster.startY + cluster.h; ty++) {
        for (let tx = cluster.startX; tx < cluster.startX + cluster.w; tx++) {
          if ((tx + ty) % 2 === 0) {
            this.setTile(tx, ty, TileType.TREE, true);
          }
        }
      }
    }
  }

  private createBuilding(bx: number, by: number, bw: number, bh: number, name: string, doorX: number, doorY: number) {
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + bw; x++) {
        if (x === doorX && y === doorY) {
          // Open wooden deck entrance
          this.setTile(x, y, TileType.WOOD_DECK, false);
        } else {
          this.setTile(x, y, TileType.BUILDING, true);
        }
      }
    }
  }

  private setTile(x: number, y: number, type: TileType, solid: boolean) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = { type, solid };
      this.solidGrid[y][x] = solid;
    }
  }

  // Authoritative AABB Circle/Box collision check against canonical tilemap
  public checkCircleCollision(worldX: number, worldY: number, radius = 16): boolean {
    // Check bounds
    const worldMaxX = this.width * this.tileSize;
    const worldMaxY = this.height * this.tileSize;
    if (worldX - radius < 0 || worldX + radius > worldMaxX || worldY - radius < 0 || worldY + radius > worldMaxY) {
      return true;
    }

    // Check intersecting tiles
    const minTileX = Math.floor((worldX - radius) / this.tileSize);
    const maxTileX = Math.floor((worldX + radius) / this.tileSize);
    const minTileY = Math.floor((worldY - radius) / this.tileSize);
    const maxTileY = Math.floor((worldY + radius) / this.tileSize);

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
          return true;
        }
        if (this.solidGrid[ty][tx]) {
          // Find closest point in tile rect to circle center
          const tileMinX = tx * this.tileSize;
          const tileMaxX = tileMinX + this.tileSize;
          const tileMinY = ty * this.tileSize;
          const tileMaxY = tileMinY + this.tileSize;

          const closestX = Math.max(tileMinX, Math.min(worldX, tileMaxX));
          const closestY = Math.max(tileMinY, Math.min(worldY, tileMaxY));

          const distX = worldX - closestX;
          const distY = worldY - closestY;
          if (distX * distX + distY * distY < radius * radius) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
