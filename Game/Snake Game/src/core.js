export const GRID = 28;
export const CELL = 22; // px in design space
export const BOARD_PX = GRID * CELL;

// ---------- Helpers ----------
export const rand = (n) => Math.floor(Math.random() * n);
export const key = (x, y) => `${x},${y}`;
export const wrap = (n) => ((n % GRID) + GRID) % GRID;
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export const DIRS = {
  ArrowUp: { dx: 0, dy: -1, name: 'up' },
  ArrowDown: { dx: 0, dy: 1, name: 'down' },
  ArrowLeft: { dx: -1, dy: 0, name: 'left' },
  ArrowRight: { dx: 1, dy: 0, name: 'right' },
};

export const FOOD_TYPES = {
  normal: { points: 10, color: 'food', growth: 1, weight: 100, glyph: '◆' },
  golden: { points: 50, color: 'special', growth: 1, weight: 12, glyph: '★', duration: 6000, label: '2× POINTS', effect: 'double' },
  slowmo: { points: 20, color: 'accent2', growth: 1, weight: 10, glyph: '◐', duration: 6000, label: 'SLOW-MO', effect: 'slowmo' },
  shrink: { points: 30, color: 'accent2', growth: -3, weight: 8, glyph: '◯', duration: 0, label: 'SHRINK', effect: 'shrink' },
};

export const ACHIEVEMENTS = [
  { id: 'first_bite', name: 'FIRST BITE', cond: (s) => s.totalEaten >= 1 },
  { id: 'ten_long', name: 'SERPENTINE', desc: 'Length 10', cond: (s) => s.snake.length >= 10 },
  { id: 'combo_5', name: 'CHAIN x5', desc: '5x combo', cond: (s) => s.maxCombo >= 5 },
  { id: 'combo_10', name: 'CHAIN x10', desc: '10x combo', cond: (s) => s.maxCombo >= 10 },
  { id: 'level_5', name: 'TURBO', desc: 'Reach level 5', cond: (s) => s.level >= 5 },
  { id: 'level_10', name: 'WARP SPEED', desc: 'Reach level 10', cond: (s) => s.level >= 10 },
  { id: 'score_500', name: 'HALF-K', desc: 'Score 500', cond: (s) => s.score >= 500 },
  { id: 'score_1000', name: 'KILOBYTE', desc: 'Score 1000', cond: (s) => s.score >= 1000 },
  { id: 'portal', name: 'WORMHOLE', desc: 'Wrap 10 times', cond: (s) => s.wraps >= 10 },
  { id: 'golden', name: 'MIDAS', desc: 'Eat 3 gold', cond: (s) => s.goldEaten >= 3 },
];

// ---------- Initial state factory ----------
export function initialGameState() {
  const cx = Math.floor(GRID / 2);
  const cy = Math.floor(GRID / 2);
  const snake = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
    { x: cx - 3, y: cy },
  ];
  return {
    snake,
    direction: { dx: 1, dy: 0 },
    nextDirection: { dx: 1, dy: 0 },
    food: spawnFood(snake, [], 'normal'),
    specialFood: null,
    obstacles: spawnObstacles(snake, 8),
    score: 0,
    combo: 0,
    maxCombo: 0,
    level: 1,
    totalEaten: 0,
    goldEaten: 0,
    wraps: 0,
    pendingGrowth: 0,
    powerups: {}, // { slowmo: expiresAt, double: expiresAt }
    achievementsUnlocked: {},
    lastTickAt: 0,
  };
}

export function spawnFood(snake, obstacles, forceType = null) {
  const occupied = new Set();
  snake.forEach((s) => occupied.add(key(s.x, s.y)));
  obstacles.forEach((o) => occupied.add(key(o.x, o.y)));
  let x, y, tries = 0;
  do {
    x = rand(GRID); y = rand(GRID); tries++;
  } while (occupied.has(key(x, y)) && tries < 500);

  let type = forceType || 'normal';
  if (!forceType) {
    // pick weighted
    const totalW = Object.values(FOOD_TYPES).reduce((a, t) => a + t.weight, 0);
    let r = Math.random() * totalW;
    for (const [k, v] of Object.entries(FOOD_TYPES)) {
      r -= v.weight;
      if (r <= 0) { type = k; break; }
    }
  }
  return { x, y, type, born: performance.now() };
}

export function spawnObstacles(snake, count) {
  const occupied = new Set();
  snake.forEach((s) => {
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      occupied.add(key(s.x + dx, s.y + dy));
    }
  });
  const result = [];
  let tries = 0;
  while (result.length < count && tries < 2000) {
    tries++;
    const x = rand(GRID); const y = rand(GRID);
    if (occupied.has(key(x, y))) continue;
    result.push({ x, y });
    occupied.add(key(x, y));
  }
  return result;
}
