export type LaneIndex = 0 | 1 | 2; // 0: Left, 1: Center, 2: Right
export type ObstacleType = 'barrier_low' | 'barrier_high' | 'pitfall' | 'moving_train';
export type PowerUpType = 'coin_magnet' | 'shield' | 'overdrive_boost' | 'multiplier_2x';
export type BiomeType = 'neon_city' | 'sky_bridge' | 'magma_vault';

export interface ObstacleEntity {
  id: string;
  type: ObstacleType;
  lane: LaneIndex;
  zPos: number; // Longitudinal distance along the track
  height: number;
  width: number;
  cleared: boolean;
  nearMissChecked?: boolean;
}

export interface CollectibleEntity {
  id: string;
  type: 'coin' | PowerUpType;
  lane: LaneIndex;
  zPos: number;
  yOffset: number; // Height off the ground
  collected: boolean;
}

export interface TrackChunk {
  id: string;
  zStart: number;
  length: number;
  biome: BiomeType;
  obstacles: ObstacleEntity[];
  collectibles: CollectibleEntity[];
}

export interface PlayerPhysicsState {
  lane: LaneIndex;
  targetX: number;
  currentX: number;
  yPos: number;
  yVelocity: number;
  isGrounded: boolean;
  isJumping: boolean;
  isSliding: boolean;
  slideTimerMs: number;
  invincibleTimerMs: number;
  coyoteTimerMs: number;
  jumpBufferMs: number;
}

export interface EndlessRunnerGameState {
  status: 'IDLE' | 'COUNTDOWN' | 'RUNNING' | 'PAUSED' | 'CRASHED';
  seed: string;
  distanceMeters: number;
  currentSpeed: number; // m/s, accelerating over time
  score: number;
  coinsCollected: number;
  nearMissCount: number;
  overdriveGauge: number; // 0.0 - 100.0
  isOverdriveActive: boolean;
  activePowerUps: { type: PowerUpType; expiresAtMs: number }[];
  ghostDistanceMeters: number;
}

export interface TelemetryAction {
  timeMs: number;
  action: 'MOVE_LEFT' | 'MOVE_RIGHT' | 'JUMP' | 'SLIDE' | 'OVERDRIVE';
  lane: LaneIndex;
  y: number;
}

export interface RunSubmissionPayload {
  seed: string;
  playerHandle: string;
  distance: number;
  score: number;
  durationMs: number;
  inputTelemetry: TelemetryAction[];
  nearMissCount: number;
  coinsCollected: number;
  causeOfDeath?: string;
}

export interface LeaderboardEntry {
  id: string;
  playerHandle: string;
  seed: string;
  distance: number;
  score: number;
  maxCombo: number;
  nearMissCount: number;
  coinsCollected: number;
  durationMs: number;
  createdAt: string;
  telemetryJson?: string;
}

export interface GameSettings {
  masterVolume: number; // 0 - 100
  sfxVolume: number;    // 0 - 100
  cameraTilt: number;   // 0 - 100
  screenShake: number;  // 0 - 100
  showGhost: boolean;
  showHitboxes: boolean;
  keybindings: {
    moveLeft: string[];
    moveRight: string[];
    jump: string[];
    slide: string[];
    overdrive: string[];
  };
}

export interface GhostData {
  playerHandle: string;
  finalDistance: number;
  telemetry: TelemetryAction[];
}
