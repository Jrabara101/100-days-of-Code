import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GameSettings, VisualTheme } from '@/types/game';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function encodeTrackSeed(settings: GameSettings, trackName: string = 'synthwave'): string {
  const params = new URLSearchParams({
    theme: settings.visualTheme,
    speed: settings.speed.toFixed(1),
    sens: settings.sensitivity.toFixed(1),
    zen: settings.zenMode ? '1' : '0',
    blur: settings.motionBlur.toFixed(2),
    track: trackName,
  });
  return params.toString();
}

export function decodeTrackSeed(hash: string): Partial<GameSettings & { track: string }> {
  try {
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const params = new URLSearchParams(cleanHash);
    const result: Partial<GameSettings & { track: string }> = {};

    const theme = params.get('theme') as VisualTheme;
    if (theme && ['neon_noir', 'solar_flare', 'cyber_ocean', 'retro_outrun'].includes(theme)) {
      result.visualTheme = theme;
    }
    const speed = parseFloat(params.get('speed') || '');
    if (!isNaN(speed) && speed >= 0.5 && speed <= 3.0) {
      result.speed = speed;
    }
    const sens = parseFloat(params.get('sens') || '');
    if (!isNaN(sens) && sens >= 0.5 && sens <= 3.0) {
      result.sensitivity = sens;
    }
    const zen = params.get('zen');
    if (zen !== null) {
      result.zenMode = zen === '1';
    }
    const blur = parseFloat(params.get('blur') || '');
    if (!isNaN(blur) && blur >= 0.1 && blur <= 0.95) {
      result.motionBlur = blur;
    }
    const track = params.get('track');
    if (track) {
      result.track = track;
    }
    return result;
  } catch {
    return {};
  }
}
