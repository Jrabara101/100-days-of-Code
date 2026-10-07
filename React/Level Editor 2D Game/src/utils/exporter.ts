import { LevelMap } from '../types/index.js';
import { getBiomeAtlas } from './tilesets.js';

/**
 * Universal Engine-Ready Asset Exporter
 */

// 1. Tiled JSON Exporter (.tmj / .json)
export function exportToTiledJSON(map: LevelMap): string {
  const { widthInTiles, heightInTiles, tileSize } = map.dimensions;

  // Convert sparse grid to flat row-major array for Tiled
  const tiledLayers = map.layers.map((layer, index) => {
    const data: number[] = new Array(widthInTiles * heightInTiles).fill(0);

    for (let y = 0; y < heightInTiles; y++) {
      for (let x = 0; x < widthInTiles; x++) {
        const tile = layer.grid[`${x},${y}`];
        if (tile) {
          // Standard Tiled GID = (sourceY * 8 + sourceX) + 1
          const localId = tile.sourceY * 8 + tile.sourceX;
          data[y * widthInTiles + x] = localId + 1;
        }
      }
    }

    return {
      id: index + 1,
      name: layer.name,
      type: 'tilelayer',
      visible: layer.visible,
      opacity: layer.opacity,
      x: 0,
      y: 0,
      width: widthInTiles,
      height: heightInTiles,
      data,
    };
  });

  // Entities as Tiled Object Group
  const objectGroup = {
    id: map.layers.length + 1,
    name: 'Entities',
    type: 'objectgroup',
    visible: true,
    opacity: 1,
    x: 0,
    y: 0,
    objects: map.entities.map((e, idx) => ({
      id: idx + 100,
      name: e.name,
      type: e.type,
      x: e.position.x,
      y: e.position.y,
      width: tileSize,
      height: tileSize,
      rotation: 0,
      visible: true,
      properties: Object.entries(e.properties).map(([k, v]) => ({
        name: k,
        type: typeof v === 'number' ? 'float' : typeof v === 'boolean' ? 'bool' : 'string',
        value: v,
      })),
    })),
  };

  const tiledDoc = {
    compressionlevel: -1,
    width: widthInTiles,
    height: heightInTiles,
    tilewidth: tileSize,
    tileheight: tileSize,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    type: 'map',
    version: '1.10',
    tiledversion: '1.10.2',
    infinite: false,
    nextlayerid: map.layers.length + 2,
    nextobjectid: map.entities.length + 101,
    layers: [...tiledLayers, objectGroup],
    tilesets: [
      {
        firstgid: 1,
        name: 'BiomeAtlas',
        tilewidth: tileSize,
        tileheight: tileSize,
        spacing: 0,
        margin: 0,
        columns: 8,
        tilecount: 48,
        image: 'biome_atlas.png',
        imagewidth: 8 * tileSize,
        imageheight: 6 * tileSize,
      },
    ],
    properties: [
      { name: 'author', type: 'string', value: map.author },
      { name: 'title', type: 'string', value: map.title },
    ],
  };

  return JSON.stringify(tiledDoc, null, 2);
}

// 2. Godot 4 .tscn Scene Exporter
export function exportToGodotTSCN(map: LevelMap): string {
  const { widthInTiles, heightInTiles, tileSize } = map.dimensions;
  let out = `[gd_scene format=3 uid="uid://forge_${Date.now()}"]\n\n`;
  out += `[node name="${map.title.replace(/[^a-zA-Z0-9_]/g, '')}" type="Node2D"]\n\n`;

  // TileMap node
  out += `[node name="TileMap" type="TileMap" parent="."]\n`;
  out += `tile_set = SubResource("TileSet_forge")\n`;
  out += `cell_quadrant_size = ${tileSize}\n`;
  out += `format = 2\n\n`;

  // Layer data
  map.layers.forEach((layer, layerIdx) => {
    const tiles: string[] = [];
    for (let y = 0; y < heightInTiles; y++) {
      for (let x = 0; x < widthInTiles; x++) {
        const tile = layer.grid[`${x},${y}`];
        if (tile) {
          // Godot PackedInt32Array tile entry: x, y, source_id, atlas_x, atlas_y, alternative_tile
          tiles.push(`${x}, ${y}, 0, ${tile.sourceX}, ${tile.sourceY}, 0`);
        }
      }
    }
    if (tiles.length > 0) {
      out += `# Layer ${layerIdx}: ${layer.name}\n`;
      out += `layer_${layerIdx}/name = "${layer.name}"\n`;
      out += `layer_${layerIdx}/tile_data = PackedInt32Array(${tiles.join(', ')})\n\n`;
    }
  });

  // Entities
  map.entities.forEach((ent) => {
    const nodeName = `${ent.type}_${ent.id.replace(/[^a-zA-Z0-9_]/g, '')}`;
    const nodeType = ent.type === 'player_spawn' ? 'Marker2D' : ent.type === 'enemy' ? 'CharacterBody2D' : 'Area2D';
    out += `[node name="${nodeName}" type="${nodeType}" parent="."]\n`;
    out += `position = Vector2(${ent.position.x}, ${ent.position.y})\n`;
    out += `metadata/entity_type = "${ent.type}"\n`;
    out += `metadata/name = "${ent.name}"\n\n`;
  });

  return out;
}

// 3. Unity CSV Exporter
export function exportToUnityCSV(map: LevelMap, layerIndex: number = 1): string {
  const { widthInTiles, heightInTiles } = map.dimensions;
  const targetLayer = map.layers[layerIndex] || map.layers[0];
  if (!targetLayer) return '';

  const rows: string[] = [];
  for (let y = 0; y < heightInTiles; y++) {
    const cols: number[] = [];
    for (let x = 0; x < widthInTiles; x++) {
      const tile = targetLayer.grid[`${x},${y}`];
      if (tile) {
        cols.push(tile.sourceY * 8 + tile.sourceX + 1);
      } else {
        cols.push(-1);
      }
    }
    rows.push(cols.join(','));
  }

  return rows.join('\n');
}

// 4. High-Resolution Composite PNG Renderer
export async function renderCompositePNG(map: LevelMap, scale: number = 2): Promise<string> {
  const { widthInTiles, heightInTiles, tileSize } = map.dimensions;
  const canvas = document.createElement('canvas');
  canvas.width = widthInTiles * tileSize * scale;
  canvas.height = heightInTiles * tileSize * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);

  // Background void
  ctx.fillStyle = '#0A0C10';
  ctx.fillRect(0, 0, widthInTiles * tileSize, heightInTiles * tileSize);

  // Render tile layers
  for (const layer of map.layers) {
    if (!layer.visible) continue;
    ctx.globalAlpha = layer.opacity;

    for (const [key, tile] of Object.entries(layer.grid)) {
      const [gx, gy] = key.split(',').map(Number);
      const atlas = getBiomeAtlas(tile.tilesetId || 'grass');
      ctx.drawImage(
        atlas,
        tile.sourceX * tileSize,
        tile.sourceY * tileSize,
        tileSize,
        tileSize,
        gx * tileSize,
        gy * tileSize,
        tileSize,
        tileSize
      );
    }
  }

  // Render entities
  ctx.globalAlpha = 1;
  for (const ent of map.entities) {
    const { x, y } = ent.position;
    if (ent.type === 'player_spawn') {
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(x + 16, y + 16, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (ent.type === 'collectible') {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (ent.type === 'door') {
      ctx.fillStyle = '#6366F1';
      ctx.fillRect(x, y, 20, 40);
    } else if (ent.type === 'trigger') {
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(x, y + 20, 32, 12);
    } else if (ent.type === 'enemy') {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(x, y, 24, 24);
    }
  }

  return canvas.toDataURL('image/png');
}

// Download Helper
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
