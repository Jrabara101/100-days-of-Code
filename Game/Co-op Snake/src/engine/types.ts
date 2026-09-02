export interface Vector2D {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const DIRECTION_VECTORS: Record<Direction, Vector2D> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export const CellType = {
  EMPTY: 0,
  WALL: 1,
  P1_BODY: 2,
  P2_BODY: 3,
  FOOD_NORMAL: 4,
  FOOD_SUPER: 5,
  FOOD_FREEZE: 6,
  FOOD_GHOST: 7,
  REVIVE_BEACON: 8,
} as const;

export type CellType = (typeof CellType)[keyof typeof CellType];

export type PlayerId = 1 | 2;

export type PlayerStatus = 'ALIVE' | 'DOWNED' | 'REVIVING' | 'GHOST';

export type GameState = 'IDLE' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type AiDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';

export type OpponentMode = 'AI_ENEMY' | 'AI_COOP' | 'HUMAN_P2';

export type CollisionCause =
  | 'P1_WALL'
  | 'P2_WALL'
  | 'P1_SELF'
  | 'P2_SELF'
  | 'P1_P2_MUTUAL_HEAD'
  | 'P1_INTO_P2_BODY'
  | 'P2_INTO_P1_BODY'
  | 'OUT_OF_LIVES'
  | null;

export interface FoodItem {
  id: string;
  x: number;
  y: number;
  type: CellType;
  points: number;
  spawnTime: number;
  duration?: number;
}

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface SnakeState {
  id: PlayerId;
  name: string;
  color: string;
  glowColor: string;
  segments: SnakeSegment[];
  prevSegments: SnakeSegment[];
  direction: Direction;
  pendingDirection: Direction;
  status: PlayerStatus;
  growthPending: number;
  invulnerableTicks: number;
  scoreContribution: number;
  foodEatenCount: number;
  downedDurationMs: number;
  isAi: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface TelemetryData {
  fps: number;
  tickHz: number;
  tickMs: number;
  alpha: number;
  accumulatorMs: number;
  matrixOccupancy: number;
  gridWidth: number;
  gridHeight: number;
  particlesCount: number;
  p1Length: number;
  p2Length: number;
  score: number;
  p1Score: number;
  p2Score: number;
  highScore: number;
  combo: number;
  comboTimer: number;
  lastEater: PlayerId | null;
  lives: number;
  maxLives: number;
  p1Status: PlayerStatus;
  p2Status: PlayerStatus;
  ghostTimer: number;
  freezeTimer: number;
  activeFoodCount: number;
  collisionCause: CollisionCause;
  errorCode: string;
  opponentMode: OpponentMode;
  aiDifficulty: AiDifficulty;
  aiDecisionTimeMs?: number;
}

export interface GameSettings {
  gridWidth: number;
  gridHeight: number;
  initialSpeedHz: number;
  maxSpeedHz: number;
  friendlyPassThrough: boolean;
  sharedLives: number;
  soundVolume: number;
  soundEnabled: boolean;
  retroScanlines: boolean;
  subpixelInterpolation: boolean;
  screenShake: boolean;
  opponentMode: OpponentMode;
  aiDifficulty: AiDifficulty;
}

export const DEFAULT_SETTINGS: GameSettings = {
  gridWidth: 30,
  gridHeight: 20,
  initialSpeedHz: 10,
  maxSpeedHz: 18,
  friendlyPassThrough: false,
  sharedLives: 3,
  soundVolume: 0.6,
  soundEnabled: true,
  retroScanlines: true,
  subpixelInterpolation: true,
  screenShake: true,
  opponentMode: 'AI_ENEMY',
  aiDifficulty: 'NORMAL',
};
