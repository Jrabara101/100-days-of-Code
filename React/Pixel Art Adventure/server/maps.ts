export interface MapDefinition {
  id: string;
  title: string;
  chapter: string;
  width: number;
  height: number;
  tileSize: number;
  layers: {
    ground: number[][];
    detail: number[][];
    collisions: number[][];
    overlay: number[][];
  };
  lightSources: {
    x: number;
    y: number;
    radius: number;
    color: string;
    intensity: number;
  }[];
  npcs: {
    id: string;
    name: string;
    x: number;
    y: number;
    facing: 'up' | 'down' | 'left' | 'right';
    dialogueNodeId: string;
    spriteType: 'elder' | 'golem' | 'wanderer' | 'guardian' | 'spirit';
  }[];
  triggers: {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    promptText: string;
    promptKey: string;
    type: 'talk' | 'inspect' | 'memory_echo' | 'chest' | 'portal' | 'puzzle';
    actionPayload: Record<string, any>;
  }[];
}

// Generate map grids programmatically for clean precision
function createGrid(width: number, height: number, defaultValue: number = 0): number[][] {
  return Array.from({ length: height }, () => Array(width).fill(defaultValue));
}

// --- MAP 1: Whispering Glade ---
const W1 = 32;
const H1 = 22;

const gladeGround = createGrid(W1, H1, 0); // 0 = grass
const gladeDetail = createGrid(W1, H1, 0);
const gladeCollision = createGrid(W1, H1, 0);
const gladeOverlay = createGrid(W1, H1, 0);

// Borders / tree perimeter
for (let y = 0; y < H1; y++) {
  for (let x = 0; x < W1; x++) {
    if (x === 0 || x === W1 - 1 || y === 0 || y === H1 - 1) {
      gladeCollision[y][x] = 1;
      gladeDetail[y][x] = 10; // big perimeter tree
      gladeOverlay[y][x] = 20; // canopy
    }
  }
}

// Pathway from player start (4, 10) through Elder Mael (10, 8) to Golem (24, 7)
for (let x = 3; x <= 28; x++) {
  gladeGround[10][x] = 1; // stone path
  gladeGround[9][x] = 2;  // dirt edge
}
for (let y = 7; y <= 16; y++) {
  gladeGround[y][10] = 1; // vertical path branch
  gladeGround[y][18] = 2; // dirt trail to Wanderer
}

// North-South Stream / River around x = 20
for (let y = 1; y < H1 - 1; y++) {
  if (y !== 10 && y !== 9) { // bridge at y = 9, 10
    gladeGround[y][20] = 3; // water
    gladeGround[y][21] = 3; // water
    gladeCollision[y][20] = 1;
    gladeCollision[y][21] = 1;
  } else {
    gladeGround[y][20] = 4; // wood bridge
    gladeGround[y][21] = 4; // wood bridge
  }
}

// Forest Groves (Clusters of ancient trees)
const treeClusters = [
  { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 4 },
  { x: 12, y: 2 }, { x: 13, y: 2 }, { x: 14, y: 2 },
  { x: 2, y: 15 }, { x: 3, y: 16 }, { x: 4, y: 16 },
  { x: 14, y: 17 }, { x: 15, y: 17 }, { x: 16, y: 18 },
  { x: 25, y: 2 }, { x: 26, y: 2 }, { x: 27, y: 3 },
  { x: 26, y: 14 }, { x: 27, y: 15 }, { x: 28, y: 14 },
];

for (const t of treeClusters) {
  if (t.y < H1 && t.x < W1) {
    gladeCollision[t.y][t.x] = 1;
    gladeDetail[t.y][t.x] = 10;
    gladeOverlay[t.y][t.x] = 20;
  }
}

// Ancient Monolith Ruins at (14, 5)
gladeCollision[5][14] = 1;
gladeDetail[5][14] = 15; // Monolith Pillar

// Flowers and decor
const decorSpots = [
  { x: 6, y: 7, id: 5 }, { x: 8, y: 12, id: 5 }, { x: 13, y: 11, id: 5 },
  { x: 16, y: 8, id: 5 }, { x: 22, y: 13, id: 5 }, { x: 7, y: 16, id: 6 },
  { x: 18, y: 17, id: 16 }, // campfire near Lyra
  { x: 10, y: 6, id: 12 },  // lantern post near Mael
  { x: 19, y: 9, id: 12 },  // lantern post before bridge
  { x: 23, y: 6, id: 12 },  // spirit torch near Golem
];

for (const d of decorSpots) {
  if (d.y < H1 && d.x < W1) {
    gladeDetail[d.y][d.x] = d.id;
  }
}

export const whisperingGladeMap: MapDefinition = {
  id: 'whispering_glade',
  title: 'Whispering Glade',
  chapter: 'Chapter 1: The Resonant Slumber',
  width: W1,
  height: H1,
  tileSize: 32,
  layers: {
    ground: gladeGround,
    detail: gladeDetail,
    collisions: gladeCollision,
    overlay: gladeOverlay,
  },
  lightSources: [
    { x: 10, y: 6, radius: 95, color: '#FBBF24', intensity: 0.9 }, // Elder's lantern
    { x: 19, y: 9, radius: 85, color: '#FBBF24', intensity: 0.8 }, // Bridge lantern
    { x: 18, y: 17, radius: 110, color: '#F59E0B', intensity: 0.95 }, // Lyra's campfire
    { x: 14, y: 5, radius: 100, color: '#38BDF8', intensity: 0.85 }, // Monolith cyan glow
    { x: 24, y: 7, radius: 90, color: '#38BDF8', intensity: 0.7 }, // Golem runic light
  ],
  npcs: [
    {
      id: 'elder_mael',
      name: 'Elder Mael',
      x: 10,
      y: 8,
      facing: 'down',
      dialogueNodeId: 'mael_intro',
      spriteType: 'elder',
    },
    {
      id: 'stone_golem',
      name: 'Dormant Golem',
      x: 24,
      y: 7,
      facing: 'left',
      dialogueNodeId: 'golem_dormant',
      spriteType: 'golem',
    },
    {
      id: 'lyra_wanderer',
      name: 'Lyra the Wanderer',
      x: 18,
      y: 16,
      facing: 'up',
      dialogueNodeId: 'lyra_intro',
      spriteType: 'wanderer',
    },
  ],
  triggers: [
    {
      id: 'monolith_echo',
      x: 14,
      y: 5,
      radius: 1.5,
      promptText: 'Inspect Ancient Monolith',
      promptKey: 'Space',
      type: 'memory_echo',
      actionPayload: {
        echoId: 'echo_fall_of_aethelgard',
        title: 'Memory Echo: The Great Sundering',
        loreText:
          'A sudden tremor shakes the stone. Ghostly sepia hues engulf your vision. You see ancient architects singing stones into the sky before a blinding rift fractured their sanctuary...',
      },
    },
    {
      id: 'relic_chest',
      x: 6,
      y: 17,
      radius: 1.2,
      promptText: 'Open Mossy Relic Chest',
      promptKey: 'E',
      type: 'chest',
      actionPayload: {
        chestId: 'relic_chest_flute',
        itemId: 'harmonic_flute',
        itemName: 'Harmonic Flute',
        itemIcon: 'flute',
        description: 'An ancient carved ivory flute capable of resonating with dormant earthen golems.',
      },
    },
    {
      id: 'portal_to_shrine',
      x: 29,
      y: 10,
      radius: 1.4,
      promptText: 'Enter Sunken Shrine',
      promptKey: 'E',
      type: 'portal',
      actionPayload: {
        targetMapId: 'sunken_shrine',
        targetX: 3,
        targetY: 9,
        targetFacing: 'right',
        requiresFlag: 'golem_awakened',
        blockMessage: 'The ancient stone golem bars the mountain pass. Awaken it with harmonic resonance.',
      },
    },
  ],
};

// --- MAP 2: Sunken Shrine ---
const W2 = 28;
const H2 = 18;

const shrineGround = createGrid(W2, H2, 6); // ancient slate tile
const shrineDetail = createGrid(W2, H2, 0);
const shrineCollision = createGrid(W2, H2, 0);
const shrineOverlay = createGrid(W2, H2, 0);

// Shrine Perimeter Walls
for (let y = 0; y < H2; y++) {
  for (let x = 0; x < W2; x++) {
    if (x === 0 || x === W2 - 1 || y === 0 || y === H2 - 1) {
      shrineCollision[y][x] = 1;
      shrineDetail[y][x] = 15; // stone wall column
    }
  }
}

// Inner sunken sanctuary pools
for (let y = 4; y <= 13; y++) {
  for (let x = 6; x <= 8; x++) {
    shrineGround[y][x] = 3; // water pool
    shrineCollision[y][x] = 1;
  }
  for (let x = 19; x <= 21; x++) {
    shrineGround[y][x] = 3; // water pool
    shrineCollision[y][x] = 1;
  }
}

// Altar platform at center
shrineCollision[4][14] = 1;
shrineDetail[4][14] = 18; // Sacred Heart Altar

export const sunkenShrineMap: MapDefinition = {
  id: 'sunken_shrine',
  title: 'The Sunken Shrine',
  chapter: 'Chapter 1: The Chamber of Equilibrium',
  width: W2,
  height: H2,
  tileSize: 32,
  layers: {
    ground: shrineGround,
    detail: shrineDetail,
    collisions: shrineCollision,
    overlay: shrineOverlay,
  },
  lightSources: [
    { x: 14, y: 4, radius: 130, color: '#38BDF8', intensity: 1.0 }, // Heart Altar cyan radiance
    { x: 7, y: 9, radius: 90, color: '#10B981', intensity: 0.8 },  // Green water pool rune
    { x: 20, y: 9, radius: 90, color: '#10B981', intensity: 0.8 }, // Green water pool rune
    { x: 14, y: 12, radius: 100, color: '#FBBF24', intensity: 0.85 }, // Entrance brazier
  ],
  npcs: [
    {
      id: 'guardian_sentinel',
      name: 'Sanctuary Guardian',
      x: 14,
      y: 7,
      facing: 'down',
      dialogueNodeId: 'guardian_intro',
      spriteType: 'guardian',
    },
  ],
  triggers: [
    {
      id: 'altar_decision',
      x: 14,
      y: 5,
      radius: 1.5,
      promptText: 'Commune with Shrine Heart',
      promptKey: 'E',
      type: 'puzzle',
      actionPayload: {
        dialogueNodeId: 'shrine_climax_choice',
      },
    },
    {
      id: 'shrine_to_glade',
      x: 2,
      y: 9,
      radius: 1.3,
      promptText: 'Return to Whispering Glade',
      promptKey: 'E',
      type: 'portal',
      actionPayload: {
        targetMapId: 'whispering_glade',
        targetX: 28,
        targetY: 10,
        targetFacing: 'left',
      },
    },
  ],
};

export const mapsRegistry: Record<string, MapDefinition> = {
  whispering_glade: whisperingGladeMap,
  sunken_shrine: sunkenShrineMap,
};
