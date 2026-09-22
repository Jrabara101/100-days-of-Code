export type GameStatus = 'IDLE' | 'LOADING_TRACK' | 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type VisualTheme = 'neon_noir' | 'solar_flare' | 'cyber_ocean' | 'retro_outrun';

export interface TrackMeta {
  title: string;
  duration: number;
  currentTime: number;
  bpm: number;
  sourceType: 'procedural' | 'file' | 'mic';
}

export interface AudioMetrics {
  bpm: number;
  bassIntensity: number; // 0.0 - 1.0 normalized
  midIntensity: number;
  trebleIntensity: number;
  isBeat: boolean;
  energy: number;
}

export interface GameSettings {
  sensitivity: number; // 0.5 - 3.0
  speed: number; // 0.6 - 2.5
  visualTheme: VisualTheme;
  zenMode: boolean; // Spectator / ambient mode: no collision damage
  volume: number; // 0.0 - 1.0
  motionBlur: number; // 0.1 - 0.95 (canvas alpha persistence)
  cameraShake: boolean;
}

export interface GameStats {
  score: number;
  multiplier: number;
  combo: number;
  maxCombo: number;
  accuracyHits: number;
  totalNotes: number;
  shield: number; // 0 - 100
  grade: 'S+' | 'S' | 'A' | 'B' | 'C';
}

export interface VisualizerGameState {
  trackMeta: TrackMeta | null;
  isPlaying: boolean;
  gameStatus: GameStatus;
  score: number;
  multiplier: number;
  combo: number;
  audioMetrics: AudioMetrics;
  settings: GameSettings;
}

export interface HighwayNote {
  z: number; // 1.0 (horizon) down to 0.0 (strike line)
  lane: number; // 0: Left, 1: Center, 2: Right
  isHazard: boolean;
  color: string;
  size: number;
  hit: boolean;
  type: 'ring' | 'diamond' | 'spike';
}

export interface HighwayRing {
  z: number;
  color: string;
  alpha: number;
}

export interface HighwayParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  grid: string;
  glow: string;
  background: string;
  name: string;
  description: string;
}
