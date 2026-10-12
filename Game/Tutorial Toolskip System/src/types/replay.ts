export type EventCategory = 'kill' | 'death' | 'ability' | 'checkpoint' | 'milestone';

export interface ReplayEventMarker {
  id: string;
  tick: number;
  timestampMs: number;
  category: EventCategory;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface PlayerInputPacket {
  tick: number;
  dt: number;
  keys: number; // Bitmask of pressed inputs (WASD, Space, Click, etc.)
  cursor: { x: number; y: number };
}

export interface EntityState {
  id: string;
  type: 'player' | 'enemy' | 'boss' | 'projectile' | 'particle' | 'crystal' | 'hazard' | 'gate';
  pos: { x: number; y: number };
  velocity: { x: number; y: number };
  stateFlags: number;
  health?: number;
  maxHealth?: number;
  rotation?: number;
  radius?: number;
  color?: string;
}

export interface KeyframeSnapshot {
  tick: number;
  timestampMs: number;
  entities: EntityState[];
}

export interface ReplayMetadata {
  replayId: string;
  gameTitle: string;
  mapSeed?: string;
  recordedAt: string; // ISO 8601
  totalTicks: number;
  durationMs: number;
  tickRate: number; // e.g., 60
  authorName: string;
  checksum: string;
  markers: ReplayEventMarker[];
}

export interface ReplayPayload {
  metadata: ReplayMetadata;
  keyframes: KeyframeSnapshot[];
  inputs: PlayerInputPacket[];
  compressedData?: string;
}

export type PlaybackStatus = 'IDLE' | 'RECORDING' | 'PAUSED' | 'PLAYING' | 'SEEKING' | 'SLOW_MO' | 'SCRUBBING';

export interface ReplaySessionState {
  status: PlaybackStatus;
  currentTick: number;
  totalTicks: number;
  playbackSpeed: number; // 0.1 to 2.0
  isLooping: boolean;
  loopRange: [number, number] | null;
  activeMarkerId: string | null;
  isGhostEnabled: boolean;
  ghostReplayData: ReplayMetadata | null;
}

// Input bitmasks
export const INPUT_MASK = {
  UP: 1 << 0,       // W / ArrowUp
  DOWN: 1 << 1,     // S / ArrowDown
  LEFT: 1 << 2,     // A / ArrowLeft
  RIGHT: 1 << 3,    // D / ArrowRight
  FIRE: 1 << 4,     // Left click / Space
  ABILITY: 1 << 5,  // Right click / Q / E
  DASH: 1 << 6,     // Shift / Space
} as const;

export interface VerificationResult {
  valid: boolean;
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  divergenceTick?: number;
  checksumMatch: boolean;
  calculatedChecksum: string;
  verifiedAt: string;
}
