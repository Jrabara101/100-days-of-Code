export const TILE_SIZE = 48;
export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 50;

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

export class TilemapRenderer {
  private tiles: number[][];

  constructor() {
    this.tiles = [];
    this.initMap();
  }

  private initMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const isFlower = (x * 7 + y * 13) % 29 === 0;
        this.tiles[y][x] = isFlower ? TileType.FLOWER_GRASS : TileType.GRASS;
      }
    }

    // Outer walls
    for (let x = 0; x < MAP_WIDTH; x++) {
      this.tiles[0][x] = TileType.WALL_STONE;
      this.tiles[MAP_HEIGHT - 1][x] = TileType.WALL_STONE;
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
      this.tiles[y][0] = TileType.WALL_STONE;
      this.tiles[y][MAP_WIDTH - 1] = TileType.WALL_STONE;
    }

    // Plaza
    for (let y = 18; y <= 32; y++) {
      for (let x = 18; x <= 32; x++) {
        this.tiles[y][x] = TileType.PLAZA_BRICK;
      }
    }

    // Roads
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 24; x <= 26; x++) {
        this.tiles[y][x] = TileType.COBBLESTONE;
      }
    }
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      for (let y = 24; y <= 26; y++) {
        this.tiles[y][x] = TileType.COBBLESTONE;
      }
    }

    // Fountain
    for (let fy = 24; fy <= 26; fy++) {
      for (let fx = 24; fx <= 26; fx++) {
        this.tiles[fy][fx] = TileType.FOUNTAIN;
      }
    }

    // Buildings
    const buildings = [
      { bx: 19, by: 19, bw: 4, bh: 4, dx: 21, dy: 22 }, // Armory
      { bx: 28, by: 19, bw: 4, bh: 4, dx: 29, dy: 22 }, // Alchemist
      { bx: 19, by: 28, bw: 4, bh: 4, dx: 21, dy: 28 }, // Tavern
      { bx: 28, by: 28, bw: 4, bh: 4, dx: 29, dy: 28 }, // Guildhall
    ];
    for (const b of buildings) {
      for (let y = b.by; y < b.by + b.bh; y++) {
        for (let x = b.bx; x < b.bx + b.bw; x++) {
          if (x === b.dx && y === b.dy) {
            this.tiles[y][x] = TileType.WOOD_DECK;
          } else {
            this.tiles[y][x] = TileType.BUILDING;
          }
        }
      }
    }

    // Lanterns
    const lanterns = [
      { x: 18, y: 18 }, { x: 32, y: 18 },
      { x: 18, y: 32 }, { x: 32, y: 32 },
      { x: 23, y: 23 }, { x: 27, y: 23 },
      { x: 23, y: 27 }, { x: 27, y: 27 },
      { x: 24, y: 10 }, { x: 26, y: 10 },
      { x: 24, y: 40 }, { x: 26, y: 40 },
    ];
    for (const l of lanterns) {
      this.tiles[l.y][l.x] = TileType.LANTERN;
    }

    // Ponds
    for (let py = 8; py <= 14; py++) {
      for (let px = 8; px <= 14; px++) {
        if ((px - 11) ** 2 + (py - 11) ** 2 <= 10) {
          this.tiles[py][px] = TileType.WATER;
        }
      }
    }
    for (let py = 35; py <= 41; py++) {
      for (let px = 35; px <= 41; px++) {
        if ((px - 38) ** 2 + (py - 38) ** 2 <= 9) {
          this.tiles[py][px] = TileType.WATER;
        }
      }
    }

    // Trees
    const treeClusters = [
      { sx: 4, sy: 4, w: 4, h: 4 },
      { sx: 36, sy: 4, w: 5, h: 4 },
      { sx: 4, sy: 36, w: 4, h: 5 },
      { sx: 12, sy: 38, w: 4, h: 4 },
      { sx: 38, sy: 14, w: 4, h: 4 },
    ];
    for (const c of treeClusters) {
      for (let ty = c.sy; ty < c.sy + c.h; ty++) {
        for (let tx = c.sx; tx < c.sx + c.w; tx++) {
          if ((tx + ty) % 2 === 0) {
            this.tiles[ty][tx] = TileType.TREE;
          }
        }
      }
    }
  }

  public isSolidTile(type: TileType): boolean {
    return (
      type === TileType.WALL_STONE ||
      type === TileType.BUILDING ||
      type === TileType.FOUNTAIN ||
      type === TileType.TREE ||
      type === TileType.LANTERN ||
      type === TileType.WATER
    );
  }

  public checkCircleCollision(worldX: number, worldY: number, radius = 16): boolean {
    const worldMaxX = MAP_WIDTH * TILE_SIZE;
    const worldMaxY = MAP_HEIGHT * TILE_SIZE;
    if (worldX - radius < 0 || worldX + radius > worldMaxX || worldY - radius < 0 || worldY + radius > worldMaxY) {
      return true;
    }

    const minTileX = Math.floor((worldX - radius) / TILE_SIZE);
    const maxTileX = Math.floor((worldX + radius) / TILE_SIZE);
    const minTileY = Math.floor((worldY - radius) / TILE_SIZE);
    const maxTileY = Math.floor((worldY + radius) / TILE_SIZE);

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
          return true;
        }
        if (this.isSolidTile(this.tiles[ty][tx])) {
          const tileMinX = tx * TILE_SIZE;
          const tileMaxX = tileMinX + TILE_SIZE;
          const tileMinY = ty * TILE_SIZE;
          const tileMaxY = tileMinY + TILE_SIZE;

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

  public render(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    time: number
  ) {
    const minTileX = Math.max(0, Math.floor(camX / TILE_SIZE));
    const maxTileX = Math.min(MAP_WIDTH - 1, Math.ceil((camX + viewW) / TILE_SIZE));
    const minTileY = Math.max(0, Math.floor(camY / TILE_SIZE));
    const maxTileY = Math.min(MAP_HEIGHT - 1, Math.ceil((camY + viewH) / TILE_SIZE));

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const type = this.tiles[ty][tx];
        const screenX = tx * TILE_SIZE - camX;
        const screenY = ty * TILE_SIZE - camY;

        this.drawTile(ctx, type, screenX, screenY, tx, ty, time);
      }
    }
  }

  private drawTile(
    ctx: CanvasRenderingContext2D,
    type: TileType,
    sx: number,
    sy: number,
    tx: number,
    ty: number,
    time: number
  ) {
    switch (type) {
      case TileType.GRASS: {
        ctx.fillStyle = (tx + ty) % 2 === 0 ? '#132A1C' : '#163121';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Subtle grass specks
        ctx.fillStyle = '#1D3E2A';
        ctx.fillRect(sx + 10, sy + 14, 2, 4);
        ctx.fillRect(sx + 32, sy + 28, 2, 3);
        break;
      }
      case TileType.FLOWER_GRASS: {
        ctx.fillStyle = '#142E1F';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Small blue & yellow blossoms
        ctx.fillStyle = '#38BDF8';
        ctx.beginPath();
        ctx.arc(sx + 16, sy + 18, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(sx + 32, sy + 30, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TileType.COBBLESTONE: {
        ctx.fillStyle = '#263147';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Stone pavers pattern
        ctx.strokeStyle = '#1A2332';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 2, sy + 2, 20, 20);
        ctx.strokeRect(sx + 24, sy + 2, 22, 20);
        ctx.strokeRect(sx + 2, sy + 24, 22, 22);
        ctx.strokeRect(sx + 26, sy + 24, 20, 22);
        break;
      }
      case TileType.PLAZA_BRICK: {
        ctx.fillStyle = '#2D3748';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        // Elegant paved diamond grid
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 1, sy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        ctx.fillStyle = '#3A4454';
        ctx.fillRect(sx + 8, sy + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        break;
      }
      case TileType.WATER: {
        // Animated rippling azure water
        const wave = Math.sin(time * 0.003 + tx * 0.5 + ty * 0.5) * 4;
        ctx.fillStyle = '#0E3B5C';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.ellipse(sx + 24 + wave, sy + 24, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lily pad on select tiles
        if ((tx * 3 + ty) % 5 === 0) {
          ctx.fillStyle = '#065F46';
          ctx.beginPath();
          ctx.arc(sx + 20, sy + 20, 6, 0, Math.PI * 1.8);
          ctx.fill();
          ctx.fillStyle = '#F472B6';
          ctx.beginPath();
          ctx.arc(sx + 21, sy + 21, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case TileType.FOUNTAIN: {
        // Stone rim with pulsating water core
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(sx + 4, sy + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        // Animated swirling foam
        const angle = time * 0.004;
        ctx.strokeStyle = '#BAE6FD';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + 24, sy + 24, 12, angle, angle + Math.PI * 1.4);
        ctx.stroke();

        ctx.fillStyle = '#F0F9FF';
        ctx.beginPath();
        ctx.arc(sx + 24, sy + 24, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TileType.BUILDING: {
        // Roof timber & sloped shingles
        ctx.fillStyle = '#451A03';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(sx + 2, sy + 4, TILE_SIZE - 4, 12);
        ctx.fillStyle = '#92400E';
        ctx.fillRect(sx + 2, sy + 20, TILE_SIZE - 4, 12);
        // Mortar framing
        ctx.strokeStyle = '#292524';
        ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
        break;
      }
      case TileType.WOOD_DECK: {
        ctx.fillStyle = '#78350F';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#B45309';
        for (let i = 4; i < TILE_SIZE; i += 10) {
          ctx.fillRect(sx + 2, sy + i, TILE_SIZE - 4, 6);
        }
        break;
      }
      case TileType.TREE: {
        ctx.fillStyle = '#132A1C';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(sx + 24, sy + 38, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#5A3825';
        ctx.fillRect(sx + 20, sy + 26, 8, 16);

        // Lush layered canopy
        ctx.fillStyle = '#065F46';
        ctx.beginPath();
        ctx.arc(sx + 24, sy + 18, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.arc(sx + 20, sy + 15, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(sx + 25, sy + 12, 7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case TileType.LANTERN: {
        ctx.fillStyle = '#263147';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        // Stone post
        ctx.fillStyle = '#475569';
        ctx.fillRect(sx + 21, sy + 18, 6, 26);
        ctx.fillRect(sx + 18, sy + 40, 12, 4);

        // Glowing core
        const pulse = 0.8 + Math.sin(time * 0.005 + sx) * 0.15;
        const grad = ctx.createRadialGradient(sx + 24, sy + 16, 2, sx + 24, sy + 16, 32);
        grad.addColorStop(0, `rgba(245, 158, 11, ${pulse})`);
        grad.addColorStop(0.4, 'rgba(245, 158, 11, 0.25)');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx + 24, sy + 16, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(sx + 21, sy + 13, 6, 6);
        break;
      }
      case TileType.WALL_STONE: {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx + 2, sy + 2, 20, 18);
        ctx.fillRect(sx + 26, sy + 2, 20, 18);
        ctx.fillRect(sx + 14, sy + 24, 20, 18);
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
        break;
      }
    }
  }
}
