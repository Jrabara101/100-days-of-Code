import { CollisionShape, TileData } from '../types/index.js';

/**
 * 47-Tile 8-Neighbor Adjacency Bitmasking Engine
 * Standard 8-directional binary weighting:
 *   NW (128) | N  (1)  | NE (2)
 *   W  (64)  | TILE    | E  (4)
 *   SW (32)  | S  (16) | SE (8)
 *
 * Diagonals (NE, SE, SW, NW) only count if both flanking cardinal directions are set.
 */

export const BITMASK_WEIGHTS = {
  N: 1,
  NE: 2,
  E: 4,
  SE: 8,
  S: 16,
  SW: 32,
  W: 64,
  NW: 128,
} as const;

// Normalized 47-tile blob canonical table:
// Maps valid bitmasks (with corner filtering) to a 0..46 canonical index.
// Format: index -> { name, defaultSourceX, defaultSourceY, isSolid, isEdge }
export interface CanonicalTileDef {
  index: number;
  name: string;
  sourceX: number;
  sourceY: number;
  description: string;
}

// 47 Canonical tile lookup mapping standard 47-tile atlas layout (e.g. 8x6 or 7x7 grid)
export const CANONICAL_47_MAP: Record<number, number> = {};

// Helper to build 47-tile lookup table
// Cardinal masks:
// N = 1, E = 4, S = 16, W = 64
// Diagonals: NE = 2, SE = 8, SW = 32, NW = 128
const RAW_TO_47_BLOB: [number, number][] = [
  // Isolated & simple caps
  [0, 0], // Single isolated
  [1, 1], // Top only (cap bottom)
  [4, 2], // Right only
  [16, 3], // Bottom only
  [64, 4], // Left only
  [5, 5], // Top-Right corner outer
  [20, 6], // Bottom-Right corner outer
  [80, 7], // Bottom-Left corner outer
  [65, 8], // Top-Left corner outer
  [17, 9], // Vertical column (N + S)
  [68, 10], // Horizontal row (W + E)
  // T-junctions without corners
  [21, 11], // N + E + S
  [84, 12], // E + S + W
  [81, 13], // S + W + N
  [69, 14], // W + N + E
  [85, 15], // 4-way cross without corners
  // Corners with 1 inner diagonal
  [7, 16], // N + E + NE (Solid outer with NE filled)
  [28, 17], // E + S + SE
  [112, 18], // S + W + SW
  [193, 19], // W + N + NW
  // 3-way with diagonals
  [23, 20], // N + E + S + NE
  [29, 21], // N + E + S + SE
  [31, 22], // N + E + S + NE + SE
  [87, 23], // E + S + W + SE
  [116, 24], // E + S + W + SW
  [119, 25], // E + S + W + SE + SW
  [113, 26], // S + W + N + SW
  [209, 27], // S + W + N + NW
  [241, 28], // S + W + N + SW + NW
  [71, 29], // W + N + E + NW
  [197, 30], // W + N + E + NE
  [199, 31], // W + N + E + NW + NE
  // Full 4-way with some inner corners missing
  [87, 32],
  [93, 33],
  [117, 34],
  [125, 35],
  [213, 36],
  [215, 37],
  [221, 38],
  [223, 39],
  [245, 40],
  [247, 41],
  [253, 42],
  // 4 corners with only 1, 2, 3 inner corners
  [95, 43], // Full cross with 3 corners
  [127, 44],
  [255, 45], // Full solid center (all 8 neighbors connected)
  [254, 46], // Full with 1 corner cutout
];

// Initialize lookup table with default mappings
for (let i = 0; i < 256; i++) {
  CANONICAL_47_MAP[i] = 0;
}

// Populate known patterns
RAW_TO_47_BLOB.forEach(([mask, idx]) => {
  CANONICAL_47_MAP[mask] = idx;
});

/**
 * Filter 8-neighbor raw mask:
 * Discard corner bits if corresponding cardinal bits are not active.
 */
export function normalizeBitmask(rawMask: number): number {
  let mask = rawMask & (1 | 4 | 16 | 64); // keep cardinal N, E, S, W

  // NE (2) requires N (1) and E (4)
  if ((rawMask & 2) && (rawMask & 1) && (rawMask & 4)) {
    mask |= 2;
  }
  // SE (8) requires S (16) and E (4)
  if ((rawMask & 8) && (rawMask & 16) && (rawMask & 4)) {
    mask |= 8;
  }
  // SW (32) requires S (16) and W (64)
  if ((rawMask & 32) && (rawMask & 16) && (rawMask & 64)) {
    mask |= 32;
  }
  // NW (128) requires N (1) and W (64)
  if ((rawMask & 128) && (rawMask & 1) && (rawMask & 64)) {
    mask |= 128;
  }

  return mask;
}

/**
 * Computes 8-neighbor adjacency bitmask for a tile at (gridX, gridY)
 */
export function compute8NeighborBitmask(
  grid: Record<string, TileData>,
  gridX: number,
  gridY: number,
  matchTilesetId?: string
): number {
  let raw = 0;

  const isConnected = (x: number, y: number) => {
    const tile = grid[`${x},${y}`];
    if (!tile) return false;
    if (matchTilesetId) {
      return tile.tilesetId === matchTilesetId;
    }
    return tile.collision === 'solid' || tile.collision === 'platform_one_way';
  };

  if (isConnected(gridX, gridY - 1)) raw |= BITMASK_WEIGHTS.N;
  if (isConnected(gridX + 1, gridY - 1)) raw |= BITMASK_WEIGHTS.NE;
  if (isConnected(gridX + 1, gridY)) raw |= BITMASK_WEIGHTS.E;
  if (isConnected(gridX + 1, gridY + 1)) raw |= BITMASK_WEIGHTS.SE;
  if (isConnected(gridX, gridY + 1)) raw |= BITMASK_WEIGHTS.S;
  if (isConnected(gridX - 1, gridY + 1)) raw |= BITMASK_WEIGHTS.SW;
  if (isConnected(gridX - 1, gridY)) raw |= BITMASK_WEIGHTS.W;
  if (isConnected(gridX - 1, gridY - 1)) raw |= BITMASK_WEIGHTS.NW;

  return normalizeBitmask(raw);
}

/**
 * Resolves 8-neighbor bitmask into a canonical atlas coordinate (sourceX, sourceY)
 * Standard 47-tile 8-column atlas grid:
 */
export function resolveCanonicalCoordinates(bitmask: number): {
  sourceX: number;
  sourceY: number;
  autotileIndex: number;
  name: string;
} {
  const norm = normalizeBitmask(bitmask);

  // Specific canonical shapes:
  if (norm === 255) {
    // Completely enclosed center tile
    return { sourceX: 1, sourceY: 1, autotileIndex: 45, name: 'Center Solid' };
  }
  if (norm === 0) {
    // Single isolated tile
    return { sourceX: 3, sourceY: 3, autotileIndex: 0, name: 'Isolated Island' };
  }

  // Top edge (S, W, E connected, N open)
  if ((norm & (1 | 4 | 16 | 64)) === (4 | 16 | 64)) {
    return { sourceX: 1, sourceY: 0, autotileIndex: 12, name: 'Top Grass/Wall Surface' };
  }
  // Bottom edge (N, W, E connected, S open)
  if ((norm & (1 | 4 | 16 | 64)) === (1 | 4 | 64)) {
    return { sourceX: 1, sourceY: 2, autotileIndex: 14, name: 'Bottom Cliff Edge' };
  }
  // Left edge (N, S, E connected, W open)
  if ((norm & (1 | 4 | 16 | 64)) === (1 | 4 | 16)) {
    return { sourceX: 0, sourceY: 1, autotileIndex: 11, name: 'Left Wall' };
  }
  // Right edge (N, S, W connected, E open)
  if ((norm & (1 | 4 | 16 | 64)) === (1 | 16 | 64)) {
    return { sourceX: 2, sourceY: 1, autotileIndex: 13, name: 'Right Wall' };
  }

  // Outer corners
  if ((norm & (1 | 4 | 16 | 64)) === (4 | 16)) {
    return { sourceX: 0, sourceY: 0, autotileIndex: 5, name: 'Outer Top-Left Corner' };
  }
  if ((norm & (1 | 4 | 16 | 64)) === (16 | 64)) {
    return { sourceX: 2, sourceY: 0, autotileIndex: 6, name: 'Outer Top-Right Corner' };
  }
  if ((norm & (1 | 4 | 16 | 64)) === (1 | 4)) {
    return { sourceX: 0, sourceY: 2, autotileIndex: 8, name: 'Outer Bottom-Left Corner' };
  }
  if ((norm & (1 | 4 | 16 | 64)) === (1 | 64)) {
    return { sourceX: 2, sourceY: 2, autotileIndex: 7, name: 'Outer Bottom-Right Corner' };
  }

  // Linear strips
  if ((norm & (1 | 4 | 16 | 64)) === (4 | 64)) {
    return { sourceX: 4, sourceY: 0, autotileIndex: 10, name: 'Horizontal Platform Strip' };
  }
  if ((norm & (1 | 4 | 16 | 64)) === (1 | 16)) {
    return { sourceX: 4, sourceY: 1, autotileIndex: 9, name: 'Vertical Pillar' };
  }

  // End caps
  if ((norm & (1 | 4 | 16 | 64)) === 16) {
    return { sourceX: 3, sourceY: 0, autotileIndex: 3, name: 'Top Cap End' };
  }
  if ((norm & (1 | 4 | 16 | 64)) === 1) {
    return { sourceX: 3, sourceY: 2, autotileIndex: 1, name: 'Bottom Cap End' };
  }
  if ((norm & (1 | 4 | 16 | 64)) === 4) {
    return { sourceX: 3, sourceY: 1, autotileIndex: 4, name: 'Left Cap End' };
  }
  if ((norm & (1 | 4 | 16 | 64)) === 64) {
    return { sourceX: 5, sourceY: 1, autotileIndex: 2, name: 'Right Cap End' };
  }

  // Inner corners
  if ((norm & 255) === (255 ^ 2)) {
    return { sourceX: 5, sourceY: 2, autotileIndex: 16, name: 'Inner Top-Right Corner' };
  }
  if ((norm & 255) === (255 ^ 8)) {
    return { sourceX: 5, sourceY: 3, autotileIndex: 17, name: 'Inner Bottom-Right Corner' };
  }
  if ((norm & 255) === (255 ^ 32)) {
    return { sourceX: 6, sourceY: 3, autotileIndex: 18, name: 'Inner Bottom-Left Corner' };
  }
  if ((norm & 255) === (255 ^ 128)) {
    return { sourceX: 6, sourceY: 2, autotileIndex: 19, name: 'Inner Top-Left Corner' };
  }

  // General fallback by canonical index
  const idx = CANONICAL_47_MAP[norm] ?? 0;
  const sx = idx % 8;
  const sy = Math.floor(idx / 8);

  return {
    sourceX: sx,
    sourceY: sy,
    autotileIndex: idx,
    name: `Autotile Variant #${idx}`,
  };
}

/**
 * Updates a target tile and triggers neighbor re-resolution for smooth 47-tile alignment.
 */
export function autotileCell(
  grid: Record<string, TileData>,
  gridX: number,
  gridY: number,
  tilesetId: string,
  collision: CollisionShape = 'solid'
): { key: string; tile: TileData }[] {
  const updates: { key: string; tile: TileData }[] = [];

  // Update target tile
  const mask = compute8NeighborBitmask(grid, gridX, gridY, tilesetId);
  const coords = resolveCanonicalCoordinates(mask);
  const targetKey = `${gridX},${gridY}`;
  const targetTile: TileData = {
    tilesetId,
    sourceX: coords.sourceX,
    sourceY: coords.sourceY,
    collision,
    autotileIndex: coords.autotileIndex,
  };
  grid[targetKey] = targetTile;
  updates.push({ key: targetKey, tile: targetTile });

  // Update 8 neighbors
  const neighbors = [
    [0, -1], [1, -1], [1, 0], [1, 1],
    [0, 1], [-1, 1], [-1, 0], [-1, -1]
  ];

  for (const [dx, dy] of neighbors) {
    const nx = gridX + dx;
    const ny = gridY + dy;
    const nKey = `${nx},${ny}`;
    const neighborTile = grid[nKey];
    if (neighborTile && neighborTile.tilesetId === tilesetId) {
      const nMask = compute8NeighborBitmask(grid, nx, ny, tilesetId);
      const nCoords = resolveCanonicalCoordinates(nMask);
      neighborTile.sourceX = nCoords.sourceX;
      neighborTile.sourceY = nCoords.sourceY;
      neighborTile.autotileIndex = nCoords.autotileIndex;
      updates.push({ key: nKey, tile: { ...neighborTile } });
    }
  }

  return updates;
}
