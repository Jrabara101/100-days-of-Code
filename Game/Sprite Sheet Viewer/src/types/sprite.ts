export type HitboxType = 'hurtbox' | 'hitbox' | 'collision';

export interface BoundingBox {
  id: string;
  type: HitboxType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface SpriteFrame {
  id: string;
  index: number;
  sourceRect: { x: number; y: number; width: number; height: number };
  anchorPoint: { x: number; y: number }; // Relative to frame origin (0,0 is top-left, or custom pixel coords)
  hitboxes: BoundingBox[];
  durationMs?: number; // Optional frame-level timing override
}

export interface AnimationClip {
  id: string;
  name: string;
  fps: number;
  loop: boolean;
  pingPong: boolean;
  frameIds: string[]; // Ordered list of SpriteFrame IDs
}

export interface SliceConfig {
  mode: 'grid' | 'auto';
  frameWidth: number;
  frameHeight: number;
  offsetX: number;
  offsetY: number;
  spacingX: number;
  spacingY: number;
  alphaThreshold?: number; // For heuristic auto-detection (0-255)
  minClusterSize?: number; // Minimum pixel island width/height
}

export interface SpriteAtlasProject {
  id: string;
  title: string;
  imageUrl: string;
  imageDimensions: { width: number; height: number };
  sliceConfig: SliceConfig;
  frames: Record<string, SpriteFrame>;
  clips: AnimationClip[];
  activeClipId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ViewportBackground = 'checkerboard' | 'void' | 'chroma' | 'stage';

export interface PlaytestCharacterState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  facingRight: boolean;
  currentAction: 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'hurt';
  actionTimer: number;
}

export interface OptimizationResult {
  originalDimensions: { width: number; height: number };
  repackedDimensions: { width: number; height: number };
  originalVramBytes: number;
  optimizedVramBytes: number;
  vramSavedPercentage: number;
  duplicateFramesRemoved: number;
  trimmedPixels: number;
  repackedImageUrl: string;
  frames: Record<string, SpriteFrame>;
}
