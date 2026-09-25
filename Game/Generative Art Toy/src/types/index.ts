export type AlgorithmType = 'flow_field' | 'kaleidoscope' | 'gravity_orbit' | 'phyllotaxis';

export interface AttractorPoint {
  id: string;
  x: number;
  y: number;
  strength: number; // positive = attract, negative = repel
  radius?: number;
}

export interface ArtToySettings {
  algorithm: AlgorithmType;
  particleCount: number;
  trailDecay: number; // 0.005 (infinite trails) to 0.2 (fast fade)
  symmetryFolds: number;
  flowTurbulence: number;
  baseSpeed: number;
  colorPalette: string[];
  colorPaletteName: string;
  colorMode: 'cycle' | 'velocity' | 'monochrome' | 'random';
  soundEnabled: boolean;
  invertedBackground: boolean;
  strokeWidth: number;
  glowIntensity: number;
  pointerForce: number; // strength of cursor push/pull
}

export interface GenerativeToyState {
  settings: ArtToySettings;
  isPlaying: boolean;
  attractors: AttractorPoint[];
  activePointerCount: number;
  canvasResolution: { width: number; height: number };
  seed: string;
}

export interface ColorPaletteItem {
  id: string;
  name: string;
  colors: string[];
  description: string;
}

export type ExportFormat = 'png-1x' | 'png-2x' | 'png-4x' | 'svg' | 'webm';
