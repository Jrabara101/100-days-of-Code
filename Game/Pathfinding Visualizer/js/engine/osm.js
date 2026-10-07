/**
 * OpenStreetMap & City Tile Ingestion Engine
 * Handles real-world geospatial vector ingestion and topological grid mapping
 * Cartographic Pathfinding Laboratory
 */

export const CITY_PRESETS = {
  shibuya: {
    id: 'shibuya',
    name: 'Shibuya Crossing & Hachiko Plaza, Tokyo',
    country: 'Japan',
    icon: '🗼',
    startName: 'Shibuya Subway Concourse',
    targetName: 'Hachiko Memorial Plaza',
    start: { x: 5, y: 35 },
    target: { x: 45, y: 15 },
    description: 'World-famous multi-directional pedestrian scramble crossing with subway viaducts.',
    features: [
      { type: 'highway', p1: [5, 35], p2: [45, 15], width: 3 },
      { type: 'highway', p1: [10, 5], p2: [40, 45], width: 3 },
      { type: 'highway', p1: [5, 20], p2: [45, 25], width: 2 },
      { type: 'highway', p1: [25, 5], p2: [25, 45], width: 2 },
      { type: 'water', p1: [38, 0], p2: [42, 48], width: 2, flowAngle: Math.PI / 2 },
      { type: 'bridge', p1: [23, 22], p2: [27, 26], width: 2 }
    ]
  },
  manhattan: {
    id: 'manhattan',
    name: 'Lower Manhattan & Financial District, NYC',
    country: 'United States',
    icon: '🗽',
    startName: 'Battery Park Esplanade',
    targetName: 'One World Trade Center',
    start: { x: 6, y: 44 },
    target: { x: 42, y: 6 },
    description: 'Strict gridiron skyscraper canyons bordered by the Hudson and East River channels.',
    features: [
      { type: 'water', p1: [0, 0], p2: [6, 48], width: 3, flowAngle: Math.PI / 2 },
      { type: 'water', p1: [44, 0], p2: [48, 48], width: 3, flowAngle: Math.PI / 2 },
      { type: 'highway', p1: [8, 45], p2: [42, 45], width: 2 },
      { type: 'highway', p1: [8, 35], p2: [42, 35], width: 2 },
      { type: 'highway', p1: [8, 25], p2: [42, 25], width: 2 },
      { type: 'highway', p1: [8, 15], p2: [42, 15], width: 2 },
      { type: 'highway', p1: [12, 5], p2: [12, 45], width: 2 },
      { type: 'highway', p1: [22, 5], p2: [22, 45], width: 2 },
      { type: 'highway', p1: [32, 5], p2: [32, 45], width: 2 },
      { type: 'bridge', p1: [40, 15], p2: [47, 12], width: 2 }
    ]
  },
  venice: {
    id: 'venice',
    name: 'Venice Grand Canal & San Marco, Italy',
    country: 'Italy',
    icon: '🛶',
    startName: 'Santa Lucia Railway Terminus',
    targetName: 'Piazza San Marco Basilica',
    start: { x: 4, y: 10 },
    target: { x: 44, y: 40 },
    description: 'Serpentine Grand Canal with ancient stone bridges and labyrinthine pedestrian calli.',
    features: [
      { type: 'water', p1: [2, 8], p2: [18, 12], width: 4, flowAngle: 0.2 },
      { type: 'water', p1: [18, 12], p2: [30, 26], width: 4, flowAngle: 0.9 },
      { type: 'water', p1: [30, 26], p2: [22, 38], width: 4, flowAngle: 2.2 },
      { type: 'water', p1: [22, 38], p2: [46, 42], width: 4, flowAngle: 0.1 },
      { type: 'bridge', p1: [22, 18], p2: [26, 20], width: 2 },
      { type: 'bridge', p1: [28, 30], p2: [26, 34], width: 2 },
      { type: 'highway', p1: [4, 10], p2: [22, 18], width: 1 },
      { type: 'highway', p1: [26, 20], p2: [44, 40], width: 1 }
    ]
  },
  paris: {
    id: 'paris',
    name: 'Arc de Triomphe & Champs-Élysées, Paris',
    country: 'France',
    icon: '🏛️',
    startName: 'Porte Maillot Metro',
    targetName: 'Place de la Concorde',
    start: { x: 4, y: 25 },
    target: { x: 45, y: 25 },
    description: 'Iconic 12-avenue radial star roundabout (Place de l\'Étoile) connecting grand avenues.',
    features: [
      { type: 'highway', p1: [4, 25], p2: [45, 25], width: 3 },
      { type: 'highway', p1: [25, 4], p2: [25, 45], width: 3 },
      { type: 'highway', p1: [10, 10], p2: [40, 40], width: 2 },
      { type: 'highway', p1: [10, 40], p2: [40, 10], width: 2 },
      { type: 'water', p1: [0, 44], p2: [48, 40], width: 3, flowAngle: -0.1 },
      { type: 'bridge', p1: [23, 41], p2: [27, 41], width: 2 }
    ]
  },
  amsterdam: {
    id: 'amsterdam',
    name: 'Amsterdam Grachtenring Canals, Netherlands',
    country: 'Netherlands',
    icon: '🏰',
    startName: 'Centraal Station Waterfront',
    targetName: 'Rijksmuseum Canal Passage',
    start: { x: 25, y: 5 },
    target: { x: 25, y: 44 },
    description: 'Concentric rings of horseshoe canals spanned by historic arched bridges.',
    features: [
      { type: 'water', p1: [8, 15], p2: [42, 15], width: 2, flowAngle: 0 },
      { type: 'water', p1: [5, 25], p2: [45, 25], width: 2, flowAngle: 0 },
      { type: 'water', p1: [8, 35], p2: [42, 35], width: 2, flowAngle: 0 },
      { type: 'bridge', p1: [25, 13], p2: [25, 17], width: 2 },
      { type: 'bridge', p1: [15, 23], p2: [15, 27], width: 2 },
      { type: 'bridge', p1: [35, 23], p2: [35, 27], width: 2 },
      { type: 'bridge', p1: [25, 33], p2: [25, 37], width: 2 },
      { type: 'highway', p1: [25, 5], p2: [25, 45], width: 2 }
    ]
  },
  london: {
    id: 'london',
    name: 'River Thames & Tower Bridge, London',
    country: 'United Kingdom',
    icon: '🌉',
    startName: 'City of London Financial Hub',
    targetName: 'Southwark Riverside Wharf',
    start: { x: 10, y: 8 },
    target: { x: 38, y: 42 },
    description: 'Meandering River Thames dividing the city, linked by landmark historic bridge spans.',
    features: [
      { type: 'water', p1: [0, 22], p2: [48, 26], width: 4, flowAngle: 0.1 },
      { type: 'bridge', p1: [18, 20], p2: [18, 28], width: 2 },
      { type: 'bridge', p1: [32, 21], p2: [32, 29], width: 2 },
      { type: 'highway', p1: [10, 8], p2: [18, 20], width: 2 },
      { type: 'highway', p1: [18, 28], p2: [38, 42], width: 2 }
    ]
  }
};

/**
 * Ingest Real-World Location into the Topological Grid
 */
export async function ingestLocation(grid, queryOrPresetKey) {
  const cleanKey = String(queryOrPresetKey).toLowerCase().trim();

  // 1. Check if it's one of the instant built-in city presets
  if (CITY_PRESETS[cleanKey]) {
    applyPresetToGrid(grid, CITY_PRESETS[cleanKey]);
    return { success: true, preset: CITY_PRESETS[cleanKey], source: 'preset' };
  }

  // 2. Try querying backend API if available
  try {
    const res = await fetch(`/api/osm/road-graph?preset=${encodeURIComponent(cleanKey)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.preset) {
        applyPresetToGrid(grid, data.preset);
        return { success: true, preset: data.preset, source: 'backend' };
      }
    }
  } catch (err) {
    // Backend unavailable, fallback to presets or direct search
  }

  // 3. Fallback matching query text against preset names
  for (const preset of Object.values(CITY_PRESETS)) {
    if (preset.name.toLowerCase().includes(cleanKey) || preset.country.toLowerCase().includes(cleanKey)) {
      applyPresetToGrid(grid, preset);
      return { success: true, preset, source: 'preset-match' };
    }
  }

  // Default fallback to Shibuya Crossing
  const fallback = CITY_PRESETS.shibuya;
  applyPresetToGrid(grid, fallback);
  return { success: true, preset: fallback, source: 'default-fallback' };
}

/**
 * Apply vector features onto grid cells using Bresenham's rasterization
 */
export function applyPresetToGrid(grid, preset) {
  grid.clearTerrain();

  const drawLine = (x0, y0, x1, y1, width, biome, flowAngle) => {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
      // Draw with stroke width
      const r = Math.floor(width / 2);
      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          const node = grid.getNode(cx + ox, cy + oy);
          if (node) {
            node.biome = biome;
            if (biome === 'water' && flowAngle !== undefined) {
              node.flowAngle = flowAngle;
            }
          }
        }
      }

      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  };

  // First draw waterways
  for (const f of preset.features.filter(f => f.type === 'water')) {
    drawLine(f.p1[0], f.p1[1], f.p2[0], f.p2[1], f.width || 2, 'water', f.flowAngle);
  }

  // Next draw highways
  for (const f of preset.features.filter(f => f.type === 'highway')) {
    drawLine(f.p1[0], f.p1[1], f.p2[0], f.p2[1], f.width || 2, 'highway');
  }

  // Finally draw bridges crossing water
  for (const f of preset.features.filter(f => f.type === 'bridge')) {
    drawLine(f.p1[0], f.p1[1], f.p2[0], f.p2[1], f.width || 2, 'bridge');
  }

  // Set start and target
  if (preset.start) grid.setStart(preset.start.x, preset.start.y);
  if (preset.target) grid.setTarget(preset.target.x, preset.target.y);
}
