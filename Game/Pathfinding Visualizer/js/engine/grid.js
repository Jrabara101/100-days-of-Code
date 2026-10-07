/**
 * Multi-Cost Topological Biome & Elevation Grid Engine
 * Cartographic Pathfinding Laboratory
 */

export const BIOMES = {
  plain: {
    id: 'plain',
    name: 'Open Ground',
    baseCost: 1.0,
    color: '#0f172a',
    borderColor: '#1e293b',
    icon: '🌱',
    description: 'Flat open terrain with nominal 1.0x baseline travel friction.'
  },
  highway: {
    id: 'highway',
    name: 'Paved Highway',
    baseCost: 0.5,
    color: '#1e293b',
    borderColor: '#334155',
    accentColor: '#f59e0b',
    icon: '🛣️',
    description: 'High-speed transit artery with 0.5x reduced energy travel cost.'
  },
  forest: {
    id: 'forest',
    name: 'Dense Forest',
    baseCost: 3.0,
    color: '#064e3b',
    borderColor: '#065f46',
    accentColor: '#10b981',
    icon: '🌲',
    description: 'Thick foliage, rough underbrush imposing 3.0x traversal friction.'
  },
  swamp: {
    id: 'swamp',
    name: 'Murky Swamp',
    baseCost: 6.0,
    color: '#365314',
    borderColor: '#3f6212',
    accentColor: '#84cc16',
    icon: '🌿',
    description: 'Viscous mud and wetlands inflicting heavy 6.0x travel energy cost.'
  },
  water: {
    id: 'water',
    name: 'Waterway / River',
    baseCost: 2.0,
    color: '#0c4a6e',
    borderColor: '#0284c7',
    accentColor: '#38bdf8',
    icon: '🌊',
    description: 'Directional current vectors: downstream boost vs upstream penalty.'
  },
  bridge: {
    id: 'bridge',
    name: 'Bridge / Viaduct',
    baseCost: 0.8,
    color: '#475569',
    borderColor: '#64748b',
    accentColor: '#94a3b8',
    icon: '🌉',
    description: 'Reinforced transit span crossing waters and chasms at 0.8x cost.'
  },
  sand: {
    id: 'sand',
    name: 'Shifting Dunes',
    baseCost: 2.0,
    color: '#78350f',
    borderColor: '#92400e',
    accentColor: '#f59e0b',
    icon: '🏜️',
    description: 'Loose granular terrain causing moderate 2.0x wheel slip.'
  },
  wall: {
    id: 'wall',
    name: 'Mountain / Barrier',
    baseCost: Infinity,
    color: '#18181b',
    borderColor: '#27272a',
    accentColor: '#ef4444',
    icon: '🧱',
    description: 'Impassable physical obstacle with Infinite traversal resistance.'
  }
};

export class GridNode {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.biome = 'plain';
    this.elevation = 0; // 0 to 100 meters
    this.flowAngle = null; // null or radians 0 to 2*PI for water current
    this.flowMagnitude = 1.0;
    this.isStart = false;
    this.isTarget = false;
    this.checkpointId = null; // null or 'alpha' | 'beta' | 'gamma'
    this.isTemporaryObstacle = false; // For chaos patrol drones or floods
  }

  isPassable() {
    return this.biome !== 'wall' && !this.isTemporaryObstacle;
  }
}

export class TopologicalGrid {
  constructor(width = 50, height = 50) {
    this.width = width;
    this.height = height;
    this.nodes = [];
    this.start = { x: 4, y: Math.floor(height / 2) };
    this.target = { x: width - 5, y: Math.floor(height / 2) };
    this.checkpoints = []; // [{ id: 'alpha', x, y, name, points }]

    this.initGrid();
  }

  initGrid() {
    this.nodes = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new GridNode(x, y));
      }
      this.nodes.push(row);
    }
    this.setStart(this.start.x, this.start.y);
    this.setTarget(this.target.x, this.target.y);
  }

  getNode(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    return this.nodes[y][x];
  }

  setStart(x, y) {
    if (this.start) {
      const prev = this.getNode(this.start.x, this.start.y);
      if (prev) prev.isStart = false;
    }
    this.start = { x, y };
    const curr = this.getNode(x, y);
    if (curr) {
      curr.isStart = true;
      if (curr.biome === 'wall') curr.biome = 'plain';
    }
  }

  setTarget(x, y) {
    if (this.target) {
      const prev = this.getNode(this.target.x, this.target.y);
      if (prev) prev.isTarget = false;
    }
    this.target = { x, y };
    const curr = this.getNode(x, y);
    if (curr) {
      curr.isTarget = true;
      if (curr.biome === 'wall') curr.biome = 'plain';
    }
  }

  setBiome(x, y, biomeKey) {
    const node = this.getNode(x, y);
    if (!node || node.isStart || node.isTarget) return;
    node.biome = biomeKey;
  }

  setElevation(x, y, elevation) {
    const node = this.getNode(x, y);
    if (!node) return;
    node.elevation = Math.max(0, Math.min(100, Math.round(elevation)));
  }

  setWaterCurrent(x, y, angleRad, magnitude = 1.0) {
    const node = this.getNode(x, y);
    if (!node) return;
    node.biome = 'water';
    node.flowAngle = angleRad;
    node.flowMagnitude = magnitude;
  }

  /**
   * Calculate edge cost from node u to neighbor v
   * Incorporates:
   * 1. Target biome base travel friction
   * 2. Diagonal distance factor (1.414x)
   * 3. Topographic elevation slope penalty / kinetic boost
   * 4. Directional waterway flow vectors (downstream speed vs upstream drag)
   */
  getEdgeCost(u, v) {
    if (!v.isPassable()) return Infinity;

    const baseCost = BIOMES[v.biome]?.baseCost || 1.0;
    const dx = v.x - u.x;
    const dy = v.y - u.y;
    const isDiagonal = dx !== 0 && dy !== 0;
    const distMultiplier = isDiagonal ? Math.SQRT2 : 1.0;

    // 1. Elevation Gradient Penalty / Boost
    const dz = v.elevation - u.elevation;
    let elevationModifier = 0;
    if (dz > 0) {
      // Steep uphill penalty (exponential or scaled slope resistance)
      elevationModifier = (dz / 100) * 4.0;
    } else if (dz < 0) {
      // Downhill momentum boost (modest energy saving)
      elevationModifier = (dz / 100) * 0.8;
    }

    // 2. Water Current Vector Impact
    let currentModifier = 0;
    if (v.biome === 'water' && v.flowAngle !== null) {
      const moveAngle = Math.atan2(dy, dx);
      // Dot product between water flow vector and movement vector
      const cosDiff = Math.cos(moveAngle - v.flowAngle);
      if (cosDiff > 0) {
        // Traveling downstream with current: energy discount up to -40%
        currentModifier = -0.4 * cosDiff * v.flowMagnitude;
      } else {
        // Battling upstream against current: resistance penalty up to +120%
        currentModifier = 1.2 * Math.abs(cosDiff) * v.flowMagnitude;
      }
    }

    const effectiveCost = (baseCost + elevationModifier + currentModifier) * distMultiplier;
    return Math.max(0.1, effectiveCost); // Guarantee positive non-zero edge cost
  }

  /**
   * Get passable 8-way neighbors with diagonal corner cutting prevention
   */
  getNeighbors(node, allowDiagonal = true) {
    const neighbors = [];
    const dirs = allowDiagonal
      ? [
          { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 },
          { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
        ]
      : [
          { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
        ];

    for (const { dx, dy } of dirs) {
      const nx = node.x + dx;
      const ny = node.y + dy;
      const neighbor = this.getNode(nx, ny);

      if (!neighbor || !neighbor.isPassable()) continue;

      // Prevent cutting through tight diagonal corners between two walls
      if (dx !== 0 && dy !== 0) {
        const side1 = this.getNode(node.x + dx, node.y);
        const side2 = this.getNode(node.x, node.y + dy);
        if (side1 && !side1.isPassable() && side2 && !side2.isPassable()) {
          continue; // Blocked by pinch corner
        }
      }

      neighbors.push(neighbor);
    }

    return neighbors;
  }

  // =========================================================================
  // PROCEDURAL TERRAIN & MAZE GENERATORS
  // =========================================================================

  clearTerrain() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const node = this.nodes[y][x];
        node.biome = 'plain';
        node.elevation = 0;
        node.flowAngle = null;
        node.isTemporaryObstacle = false;
      }
    }
  }

  /**
   * Simplex / Perlin Topographic Synthesis
   */
  generateTopographicTerrain(seed = Math.random() * 1000) {
    this.clearTerrain();
    
    // Simple 2D multi-octave pseudo-noise generator
    const noise2D = (x, y) => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
      return n - Math.floor(n);
    };

    const smoothNoise = (x, y) => {
      const corners = (noise2D(x - 1, y - 1) + noise2D(x + 1, y - 1) + noise2D(x - 1, y + 1) + noise2D(x + 1, y + 1)) / 16;
      const sides = (noise2D(x - 1, y) + noise2D(x + 1, y) + noise2D(x, y - 1) + noise2D(x, y + 1)) / 8;
      const center = noise2D(x, y) / 4;
      return corners + sides + center;
    };

    const interpolatedNoise = (x, y) => {
      const intX = Math.floor(x);
      const fracX = x - intX;
      const intY = Math.floor(y);
      const fracY = y - intY;

      const v1 = smoothNoise(intX, intY);
      const v2 = smoothNoise(intX + 1, intY);
      const v3 = smoothNoise(intX, intY + 1);
      const v4 = smoothNoise(intX + 1, intY + 1);

      const i1 = v1 * (1 - fracX) + v2 * fracX;
      const i2 = v3 * (1 - fracX) + v4 * fracX;
      return i1 * (1 - fracY) + i2 * fracY;
    };

    // Meandering river spine
    const riverY = Math.floor(this.height / 2);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const node = this.nodes[y][x];
        if (node.isStart || node.isTarget) continue;

        const nx = x / 7.0;
        const ny = y / 7.0;
        const val = interpolatedNoise(nx, ny) * 0.7 + interpolatedNoise(nx * 2, ny * 2) * 0.3;
        
        // Calculate elevation heightmap
        const elev = Math.floor(val * 85);
        node.elevation = elev;

        // Assign biomes based on altitude & moisture
        if (elev > 60) {
          node.biome = 'wall'; // High mountain ridge
        } else if (elev > 45) {
          node.biome = 'forest'; // Mountainous woods
        } else if (elev > 25) {
          node.biome = 'plain'; // Open grasslands
        } else if (elev > 12) {
          node.biome = 'swamp'; // Lowland marshes
        } else {
          node.biome = 'sand'; // Riverbanks
        }

        // River carve-through
        const riverMeander = Math.round(riverY + Math.sin(x * 0.25) * 4);
        if (Math.abs(y - riverMeander) <= 1) {
          node.biome = 'water';
          node.flowAngle = 0.1; // Flowing eastward toward target
          node.elevation = 5;
        }
      }
    }

    // Place strategic bridges over the river
    const bridgeX1 = Math.floor(this.width * 0.35);
    const bridgeX2 = Math.floor(this.width * 0.7);
    for (const bx of [bridgeX1, bridgeX2]) {
      for (let dy = -2; dy <= 2; dy++) {
        const n = this.getNode(bx, riverY + dy);
        if (n && n.biome === 'water') {
          n.biome = 'bridge';
          n.elevation = 8;
        }
      }
    }

    // Highway artery connecting start to target
    for (let x = 2; x < this.width - 2; x++) {
      const hy = Math.floor(this.height * 0.2);
      const hn = this.getNode(x, hy);
      if (hn && hn.biome !== 'wall') {
        hn.biome = 'highway';
      }
    }
  }

  /**
   * Recursive Division Labyrinth Maze
   */
  generateRecursiveMaze() {
    this.clearTerrain();

    // Create outer border walls
    for (let x = 0; x < this.width; x++) {
      this.setBiome(x, 0, 'wall');
      this.setBiome(x, this.height - 1, 'wall');
    }
    for (let y = 0; y < this.height; y++) {
      this.setBiome(0, y, 'wall');
      this.setBiome(this.width - 1, y, 'wall');
    }

    const divide = (x1, y1, x2, y2) => {
      const w = x2 - x1;
      const h = y2 - y1;
      if (w < 4 || h < 4) return;

      const horizontal = h > w;
      if (horizontal) {
        // Horizontal wall
        const wy = y1 + 2 + Math.floor(Math.random() * (h - 4));
        const passage = x1 + Math.floor(Math.random() * w);
        for (let x = x1; x <= x2; x++) {
          if (x !== passage) {
            this.setBiome(x, wy, 'wall');
          }
        }
        divide(x1, y1, x2, wy - 1);
        divide(x1, wy + 1, x2, y2);
      } else {
        // Vertical wall
        const wx = x1 + 2 + Math.floor(Math.random() * (w - 4));
        const passage = y1 + Math.floor(Math.random() * h);
        for (let y = y1; y <= y2; y++) {
          if (y !== passage) {
            this.setBiome(wx, y, 'wall');
          }
        }
        divide(x1, y1, wx - 1, y2);
        divide(wx + 1, y1, x2, y2);
      }
    };

    divide(1, 1, this.width - 2, this.height - 2);

    // Ensure start and target are open
    this.getNode(this.start.x, this.start.y).biome = 'plain';
    this.getNode(this.target.x, this.target.y).biome = 'plain';
  }

  /**
   * Voronoi Multi-Biome Clusters
   */
  generateVoronoiBiomes(numCentroids = 16) {
    this.clearTerrain();

    const centroids = [];
    const biomeTypes = ['highway', 'forest', 'swamp', 'water', 'sand', 'plain'];
    for (let i = 0; i < numCentroids; i++) {
      centroids.push({
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height),
        biome: biomeTypes[Math.floor(Math.random() * biomeTypes.length)],
        elevation: Math.floor(Math.random() * 60)
      });
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let minDist = Infinity;
        let closest = centroids[0];
        for (const c of centroids) {
          const d = Math.hypot(x - c.x, y - c.y);
          if (d < minDist) {
            minDist = d;
            closest = c;
          }
        }
        const node = this.nodes[y][x];
        node.biome = closest.biome;
        node.elevation = closest.elevation;
        if (node.biome === 'water') {
          node.flowAngle = 0.5;
        }
      }
    }

    this.getNode(this.start.x, this.start.y).biome = 'plain';
    this.getNode(this.target.x, this.target.y).biome = 'plain';
  }
}
