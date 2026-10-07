import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'level_editor.sqlite');
export const db = new DatabaseSync(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    tile_size INTEGER NOT NULL,
    layers_json TEXT NOT NULL,
    entities_json TEXT NOT NULL,
    tags_json TEXT,
    forked_from_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tilesets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    tile_width INTEGER NOT NULL,
    tile_height INTEGER NOT NULL,
    data_url TEXT,
    collision_rules_json TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    map_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    clear_time_ms INTEGER,
    score INTEGER,
    death_x REAL,
    death_y REAL,
    created_at TEXT NOT NULL
  );
`);

// Check if starter maps exist; if not, seed starter blueprints
const countStmt = db.prepare('SELECT COUNT(*) as count FROM maps');
const result = countStmt.get() as { count: number } | undefined;

if (!result || result.count === 0) {
  seedStarterMaps();
}

function seedStarterMaps() {
  const now = new Date().toISOString();

  // Starter Map 1: Emerald Ruins (Grass Overworld)
  const emeraldLayers = [
    {
      id: 'bg-1',
      name: 'Background Parallax',
      type: 'parallax',
      visible: true,
      opacity: 0.65,
      parallaxFactor: { x: 0.25, y: 0.15 },
      grid: {}
    },
    {
      id: 'terrain-main',
      name: 'Terrain (Midground)',
      type: 'tile',
      visible: true,
      opacity: 1,
      parallaxFactor: { x: 1, y: 1 },
      grid: generateStarterTerrain('grass')
    },
    {
      id: 'collision-layer',
      name: 'Collision Geometry',
      type: 'collision',
      visible: false,
      opacity: 0.6,
      parallaxFactor: { x: 1, y: 1 },
      grid: {}
    },
    {
      id: 'foreground-layer',
      name: 'Foreground Accents',
      type: 'tile',
      visible: true,
      opacity: 0.9,
      parallaxFactor: { x: 1.1, y: 1.05 },
      grid: {}
    }
  ];

  const emeraldEntities = [
    {
      id: 'spawn-1',
      name: 'Player Start',
      type: 'player_spawn',
      position: { x: 4 * 32, y: 14 * 32 },
      properties: { facing: 'right' },
      connectedEntityIds: []
    },
    {
      id: 'coin-1',
      name: 'Star Gem 1',
      type: 'collectible',
      position: { x: 9 * 32 + 8, y: 12 * 32 },
      properties: { points: 100, variant: 'gem' },
      connectedEntityIds: []
    },
    {
      id: 'coin-2',
      name: 'Star Gem 2',
      type: 'collectible',
      position: { x: 15 * 32 + 8, y: 10 * 32 },
      properties: { points: 100, variant: 'gem' },
      connectedEntityIds: []
    },
    {
      id: 'coin-3',
      name: 'Star Gem 3',
      type: 'collectible',
      position: { x: 23 * 32 + 8, y: 11 * 32 },
      properties: { points: 250, variant: 'gold' },
      connectedEntityIds: []
    },
    {
      id: 'plate-1',
      name: 'Pressure Switch',
      type: 'trigger',
      position: { x: 12 * 32, y: 15 * 32 },
      properties: { triggered: false, label: 'Gate Trigger' },
      connectedEntityIds: ['door-1']
    },
    {
      id: 'door-1',
      name: 'Vault Blast Door',
      type: 'door',
      position: { x: 27 * 32, y: 13 * 32 },
      properties: { isOpen: false, locked: true },
      connectedEntityIds: []
    },
    {
      id: 'patrol-1',
      name: 'Forest Sentinel',
      type: 'enemy',
      position: { x: 19 * 32, y: 15 * 32 },
      properties: { patrolRadius: 96, speed: 60, hp: 100 },
      connectedEntityIds: []
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO maps (id, title, author, description, width, height, tile_size, layers_json, entities_json, tags_json, forked_from_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    'map-starter-emerald',
    'Emerald Outpost 01',
    'Forge Architect',
    'A balanced starter obstacle course with floating platforms, auto-tiled grass terrain, and a pressure plate blast door puzzle.',
    40,
    22,
    32,
    JSON.stringify(emeraldLayers),
    JSON.stringify(emeraldEntities),
    JSON.stringify(['starter', 'puzzle', 'overworld', 'speedrun']),
    null,
    now,
    now
  );

  // Seed sample death heatmap telemetry for visual overlay demonstration
  const teleStmt = db.prepare(`
    INSERT INTO telemetry (map_id, event_type, clear_time_ms, score, death_x, death_y, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Simulated death spots near hazard pits
  const simulatedDeaths = [
    { x: 17 * 32 + 10, y: 17 * 32 + 12 },
    { x: 17 * 32 + 15, y: 17 * 32 + 16 },
    { x: 18 * 32 + 4, y: 17 * 32 + 20 },
    { x: 20 * 32 + 8, y: 16 * 32 + 10 },
    { x: 20 * 32 + 14, y: 15 * 32 + 25 },
    { x: 21 * 32 + 10, y: 16 * 32 + 18 },
    { x: 12 * 32 + 12, y: 15 * 32 + 14 },
    { x: 27 * 32 + 16, y: 14 * 32 + 16 },
  ];

  for (const death of simulatedDeaths) {
    teleStmt.run('map-starter-emerald', 'death', null, null, death.x, death.y, now);
  }

  // Seed completion records
  teleStmt.run('map-starter-emerald', 'clear', 14250, 450, null, null, now);
  teleStmt.run('map-starter-emerald', 'clear', 18900, 300, null, null, now);
  teleStmt.run('map-starter-emerald', 'clear', 12350, 450, null, null, now);
}

function generateStarterTerrain(biome: string) {
  const grid: Record<string, any> = {};

  // Ground level from x=2 to x=16 at y=16..19
  for (let x = 2; x <= 16; x++) {
    for (let y = 16; y <= 19; y++) {
      grid[`${x},${y}`] = {
        tilesetId: biome,
        sourceX: x % 4,
        sourceY: y === 16 ? 0 : 1,
        collision: 'solid'
      };
    }
  }

  // Hazard gap at x=17, 18
  grid['17,17'] = { tilesetId: biome, sourceX: 3, sourceY: 2, collision: 'hazard' };
  grid['18,17'] = { tilesetId: biome, sourceX: 3, sourceY: 2, collision: 'hazard' };

  // Island 1 at x=9..11, y=13
  for (let x = 9; x <= 11; x++) {
    grid[`${x},13`] = {
      tilesetId: biome,
      sourceX: x === 9 ? 0 : x === 11 ? 2 : 1,
      sourceY: 0,
      collision: 'platform_one_way'
    };
  }

  // Island 2 at x=14..16, y=11
  for (let x = 14; x <= 16; x++) {
    grid[`${x},11`] = {
      tilesetId: biome,
      sourceX: x === 14 ? 0 : x === 16 ? 2 : 1,
      sourceY: 0,
      collision: 'platform_one_way'
    };
  }

  // Ground after pit from x=19 to x=32 at y=16..19
  for (let x = 19; x <= 32; x++) {
    for (let y = 16; y <= 19; y++) {
      grid[`${x},${y}`] = {
        tilesetId: biome,
        sourceX: x % 4,
        sourceY: y === 16 ? 0 : 1,
        collision: 'solid'
      };
    }
  }

  // Platform tower at x=22..24, y=13
  for (let x = 22; x <= 24; x++) {
    grid[`${x},13`] = {
      tilesetId: biome,
      sourceX: x === 22 ? 0 : x === 24 ? 2 : 1,
      sourceY: 0,
      collision: 'platform_one_way'
    };
  }

  // Wall barrier at x=27, y=13..15
  for (let y = 13; y <= 15; y++) {
    grid[`27,${y}`] = {
      tilesetId: biome,
      sourceX: 1,
      sourceY: 2,
      collision: 'solid'
    };
  }

  return grid;
}
