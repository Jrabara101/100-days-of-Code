import { BiomeDefinition } from '../types/index.js';

export const BUILT_IN_BIOMES: BiomeDefinition[] = [
  {
    id: 'grass',
    name: 'Grass Overworld',
    description: 'Lush green turf, stratified soil, cliff overhangs, and wildflower props.',
    previewColor: '#10B981',
    defaultCollision: 'solid',
    props: ['flower_red', 'flower_yellow', 'mushroom', 'pebbles', 'moss_patch'],
  },
  {
    id: 'stone',
    name: 'Castle Bastion',
    description: 'Chiseled dark masonry, castle battlements, dungeon slabs, and iron studs.',
    previewColor: '#64748B',
    defaultCollision: 'solid',
    props: ['torch_sconce', 'wall_crack', 'iron_grate', 'chains', 'banner'],
  },
  {
    id: 'magma',
    name: 'Magma Cavern',
    description: 'Basalt rock crags, glowing molten lava edges, obsidian crusts, and smoking vents.',
    previewColor: '#EF4444',
    defaultCollision: 'solid',
    props: ['lava_bubble', 'steam_vent', 'obsidian_crystal', 'fire_flower', 'skull'],
  },
  {
    id: 'cyber',
    name: 'Neon Cyber Foundry',
    description: 'Carbon alloy plating, cyan conduit runs, holographic grates, and power cells.',
    previewColor: '#06B6D4',
    defaultCollision: 'solid',
    props: ['hologram_ad', 'circuit_node', 'laser_emitter', 'battery_cell', 'terminal'],
  },
];

// Atlas dimension: 8 columns x 6 rows = 48 tile cells (each 32x32px)
const ATLAS_COLS = 8;
const ATLAS_ROWS = 6;
const TILE_SIZE = 32;

// Cache of generated atlas canvases for instant blitting
const atlasCache: Record<string, HTMLCanvasElement> = {};

/**
 * Creates or retrieves a procedural pixel art tile atlas for a given biome.
 */
export function getBiomeAtlas(biomeId: string): HTMLCanvasElement {
  if (atlasCache[biomeId]) {
    return atlasCache[biomeId];
  }

  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TILE_SIZE;
  canvas.height = ATLAS_ROWS * TILE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  // Render all tile variants into the atlas
  for (let row = 0; row < ATLAS_ROWS; row++) {
    for (let col = 0; col < ATLAS_COLS; col++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      renderTileVariant(ctx, biomeId, col, row, x, y, TILE_SIZE);
    }
  }

  atlasCache[biomeId] = canvas;
  return canvas;
}

/**
 * Renders a specific tile variation based on (col, row) coordinates in the atlas.
 */
function renderTileVariant(
  ctx: CanvasRenderingContext2D,
  biomeId: string,
  col: number,
  row: number,
  x: number,
  y: number,
  size: number
) {
  ctx.save();

  if (biomeId === 'grass') {
    renderGrassTile(ctx, col, row, x, y, size);
  } else if (biomeId === 'stone') {
    renderStoneTile(ctx, col, row, x, y, size);
  } else if (biomeId === 'magma') {
    renderMagmaTile(ctx, col, row, x, y, size);
  } else if (biomeId === 'cyber') {
    renderCyberTile(ctx, col, row, x, y, size);
  } else {
    renderGenericTile(ctx, col, row, x, y, size);
  }

  ctx.restore();
}

/* ------------------- BIOME TILE RENDERERS ------------------- */

function renderGrassTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  x: number,
  y: number,
  size: number
) {
  const isTop = row === 0 || (col === 1 && row === 0) || (col === 4 && row === 0);
  const isSolidFill = col === 1 && row === 1;

  // Base earth body
  ctx.fillStyle = '#452818';
  ctx.fillRect(x, y, size, size);

  // Soil texture grain
  ctx.fillStyle = '#5A341E';
  ctx.fillRect(x + 4, y + 8, size - 8, size - 12);
  ctx.fillStyle = '#321D11';
  ctx.fillRect(x + 2, y + size - 8, size - 4, 6);

  // Dark soil speckles
  ctx.fillStyle = '#26140A';
  ctx.fillRect(x + 6, y + 14, 4, 3);
  ctx.fillRect(x + 18, y + 20, 5, 3);
  ctx.fillRect(x + 10, y + 24, 3, 2);

  // Rock inclusions in dirt
  if ((col + row) % 3 === 0) {
    ctx.fillStyle = '#78716C';
    ctx.fillRect(x + 14, y + 16, 6, 5);
    ctx.fillStyle = '#A8A29E';
    ctx.fillRect(x + 14, y + 16, 5, 2);
  }

  // Turf grass cap on top edges
  if (isTop) {
    // Grass foliage base
    ctx.fillStyle = '#15803D';
    ctx.fillRect(x, y, size, 8);
    // Vibrant grass blades
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(x, y, size, 5);
    ctx.fillStyle = '#4ADE80';
    ctx.fillRect(x, y, size, 2);

    // Hanging grass fringes
    ctx.fillStyle = '#16A34A';
    for (let i = 0; i < size; i += 4) {
      const drop = (i * 7) % 5 + 3;
      ctx.fillRect(x + i, y + 5, 2, drop);
    }
  }

  // Left wall border
  if (col === 0) {
    ctx.fillStyle = '#2B170B';
    ctx.fillRect(x, y, 4, size);
  }
  // Right wall border
  if (col === 2) {
    ctx.fillStyle = '#2B170B';
    ctx.fillRect(x + size - 4, y, 4, size);
  }

  // Highlight border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

function renderStoneTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  x: number,
  y: number,
  size: number
) {
  // Base chiseled dark stone
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(x, y, size, size);

  // Masonry brick pattern
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 2, y + 2, 12, 12);
  ctx.fillRect(x + 16, y + 2, 14, 12);
  ctx.fillRect(x + 2, y + 16, 18, 13);
  ctx.fillRect(x + 22, y + 16, 8, 13);

  // Mortar lines
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(x, y + 14, size, 2);
  ctx.fillRect(x + 14, y, 2, 14);
  ctx.fillRect(x + 20, y + 15, 2, 17);

  // Top battlement ledge
  if (row === 0) {
    ctx.fillStyle = '#64748B';
    ctx.fillRect(x, y, size, 4);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(x, y, size, 1);
  }

  // Moss/cracks
  if ((col + row) % 2 === 1) {
    ctx.fillStyle = '#059669';
    ctx.fillRect(x + 3, y + 12, 4, 2);
    ctx.fillRect(x + 16, y + 26, 3, 2);
  }

  ctx.strokeStyle = '#0F172A';
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

function renderMagmaTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  x: number,
  y: number,
  size: number
) {
  // Obsidian basalt base
  ctx.fillStyle = '#181214';
  ctx.fillRect(x, y, size, size);

  // Crag facets
  ctx.fillStyle = '#2A1D20';
  ctx.fillRect(x + 3, y + 3, size - 6, size - 6);

  // Molten magma cracks & veins
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 8);
  ctx.lineTo(x + 14, y + 18);
  ctx.lineTo(x + 28, y + 12);
  ctx.lineTo(x + 22, y + 26);
  ctx.lineTo(x + 6, y + 24);
  ctx.closePath();
  ctx.fill();

  // Core golden glow
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(x + 12, y + 14, 8, 4);
  ctx.fillRect(x + 8, y + 10, 4, 3);
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(x + 14, y + 15, 4, 2);

  // Glowing lava rim on top
  if (row === 0) {
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(x, y, size, 5);
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(x, y, size, 2);
  }

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

function renderCyberTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  x: number,
  y: number,
  size: number
) {
  // Deep carbon alloy plate
  ctx.fillStyle = '#0B1220';
  ctx.fillRect(x, y, size, size);

  // Inner beveled plate
  ctx.fillStyle = '#131F35';
  ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

  // Hex / circuit conduit lines
  ctx.strokeStyle = '#06B6D4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 6);
  ctx.lineTo(x + 16, y + 6);
  ctx.lineTo(x + 22, y + 16);
  ctx.lineTo(x + 22, y + 26);
  ctx.stroke();

  // Glowing circuit nodes
  ctx.fillStyle = '#22D3EE';
  ctx.beginPath();
  ctx.arc(x + 6, y + 6, 2, 0, Math.PI * 2);
  ctx.arc(x + 22, y + 26, 2, 0, Math.PI * 2);
  ctx.fill();

  // Top illuminated shield bar
  if (row === 0) {
    ctx.fillStyle = '#0891B2';
    ctx.fillRect(x, y, size, 4);
    ctx.fillStyle = '#67E8F9';
    ctx.fillRect(x, y, size, 1.5);
  }

  // Corner rivets
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 2, y + 2, 2, 2);
  ctx.fillRect(x + size - 4, y + 2, 2, 2);
  ctx.fillRect(x + 2, y + size - 4, 2, 2);
  ctx.fillRect(x + size - 4, y + size - 4, 2, 2);

  ctx.strokeStyle = '#1E293B';
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

function renderGenericTile(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  x: number,
  y: number,
  size: number
) {
  ctx.fillStyle = '#334155';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#475569';
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}
