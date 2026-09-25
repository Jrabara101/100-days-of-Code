import { ArtToySettings, AlgorithmType } from '@/types';
import { CURATED_PALETTES } from './algorithms/colorPalettes';

const STORAGE_KEY = 'aetherflow_art_toy_settings_v1';

export const DEFAULT_SETTINGS: ArtToySettings = {
  algorithm: 'flow_field',
  particleCount: 2400,
  trailDecay: 0.045, // 0.005 to 0.2
  symmetryFolds: 8,
  flowTurbulence: 1.2,
  baseSpeed: 1.6,
  colorPalette: CURATED_PALETTES[0].colors,
  colorPaletteName: CURATED_PALETTES[0].id,
  colorMode: 'cycle',
  soundEnabled: false,
  invertedBackground: false,
  strokeWidth: 1.5,
  glowIntensity: 0.8,
  pointerForce: 1.0,
};

/**
 * Encodes settings and seed into a compact URL hash
 */
export function encodeStateToHash(settings: ArtToySettings, seed: string): string {
  try {
    const params = new URLSearchParams();
    params.set('alg', settings.algorithm);
    params.set('p', settings.particleCount.toString());
    params.set('d', settings.trailDecay.toFixed(4));
    params.set('sym', settings.symmetryFolds.toString());
    params.set('turb', settings.flowTurbulence.toFixed(2));
    params.set('spd', settings.baseSpeed.toFixed(2));
    params.set('pal', settings.colorPaletteName);
    params.set('cm', settings.colorMode);
    params.set('inv', settings.invertedBackground ? '1' : '0');
    params.set('s', seed);
    return '#' + params.toString();
  } catch (e) {
    console.error('Failed to encode state to hash:', e);
    return '';
  }
}

/**
 * Decodes settings and seed from URL hash if present
 */
export function decodeStateFromHash(): { settings: Partial<ArtToySettings>; seed?: string } | null {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return null;
    const params = new URLSearchParams(hash);

    const partialSettings: Partial<ArtToySettings> = {};
    if (params.has('alg')) {
      partialSettings.algorithm = params.get('alg') as AlgorithmType;
    }
    if (params.has('p')) {
      const p = parseInt(params.get('p') || '', 10);
      if (!isNaN(p)) partialSettings.particleCount = Math.max(100, Math.min(10000, p));
    }
    if (params.has('d')) {
      const d = parseFloat(params.get('d') || '');
      if (!isNaN(d)) partialSettings.trailDecay = Math.max(0.005, Math.min(0.25, d));
    }
    if (params.has('sym')) {
      const sym = parseInt(params.get('sym') || '', 10);
      if (!isNaN(sym)) partialSettings.symmetryFolds = Math.max(2, Math.min(16, sym));
    }
    if (params.has('turb')) {
      const turb = parseFloat(params.get('turb') || '');
      if (!isNaN(turb)) partialSettings.flowTurbulence = Math.max(0.2, Math.min(4.0, turb));
    }
    if (params.has('spd')) {
      const spd = parseFloat(params.get('spd') || '');
      if (!isNaN(spd)) partialSettings.baseSpeed = Math.max(0.2, Math.min(5.0, spd));
    }
    if (params.has('pal')) {
      const palId = params.get('pal');
      const found = CURATED_PALETTES.find(p => p.id === palId);
      if (found) {
        partialSettings.colorPaletteName = found.id;
        partialSettings.colorPalette = found.colors;
      }
    }
    if (params.has('cm')) {
      partialSettings.colorMode = params.get('cm') as ArtToySettings['colorMode'];
    }
    if (params.has('inv')) {
      partialSettings.invertedBackground = params.get('inv') === '1';
    }

    const seed = params.get('s') || undefined;
    return { settings: partialSettings, seed };
  } catch (e) {
    console.error('Failed to decode state from hash:', e);
    return null;
  }
}

/**
 * Save settings to LocalStorage
 */
export function saveSettingsToStorage(settings: ArtToySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

/**
 * Load settings from LocalStorage
 */
export function loadSettingsFromStorage(): Partial<ArtToySettings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Generates an "Aesthetic Chaos Dice" curated serendipity configuration
 */
export function generateCuratedSerendipity(): { settings: ArtToySettings; seed: string } {
  const algorithms: AlgorithmType[] = ['flow_field', 'kaleidoscope', 'gravity_orbit', 'phyllotaxis'];
  const randomAlg = algorithms[Math.floor(Math.random() * algorithms.length)];
  const randomPalette = CURATED_PALETTES[Math.floor(Math.random() * CURATED_PALETTES.length)];
  const colorModes: ArtToySettings['colorMode'][] = ['cycle', 'velocity', 'random'];
  const randomColorMode = colorModes[Math.floor(Math.random() * colorModes.length)];

  const seed = Math.random().toString(36).substring(2, 9).toUpperCase();

  // Curated constraints based on algorithm to guarantee gallery-worthy aesthetics
  let particleCount = 2400;
  let trailDecay = 0.045;
  let symmetryFolds = 8;
  let flowTurbulence = 1.2;
  let baseSpeed = 1.6;

  switch (randomAlg) {
    case 'flow_field':
      particleCount = Math.floor(1800 + Math.random() * 2200);
      trailDecay = 0.02 + Math.random() * 0.06;
      flowTurbulence = 0.8 + Math.random() * 1.6;
      baseSpeed = 1.2 + Math.random() * 1.4;
      break;
    case 'kaleidoscope':
      particleCount = Math.floor(800 + Math.random() * 1600);
      trailDecay = 0.015 + Math.random() * 0.05;
      symmetryFolds = [4, 6, 8, 10, 12, 16][Math.floor(Math.random() * 6)];
      baseSpeed = 1.0 + Math.random() * 1.5;
      break;
    case 'gravity_orbit':
      particleCount = Math.floor(1500 + Math.random() * 2500);
      trailDecay = 0.03 + Math.random() * 0.07;
      baseSpeed = 1.4 + Math.random() * 1.6;
      break;
    case 'phyllotaxis':
      particleCount = Math.floor(1200 + Math.random() * 1800);
      trailDecay = 0.04 + Math.random() * 0.08;
      baseSpeed = 1.0 + Math.random() * 1.2;
      break;
  }

  const settings: ArtToySettings = {
    algorithm: randomAlg,
    particleCount,
    trailDecay,
    symmetryFolds,
    flowTurbulence,
    baseSpeed,
    colorPalette: randomPalette.colors,
    colorPaletteName: randomPalette.id,
    colorMode: randomColorMode,
    soundEnabled: false,
    invertedBackground: Math.random() > 0.85, // mostly sleek dark void
    strokeWidth: 1.2 + Math.random() * 0.8,
    glowIntensity: 0.7 + Math.random() * 0.5,
    pointerForce: 1.0,
  };

  return { settings, seed };
}
