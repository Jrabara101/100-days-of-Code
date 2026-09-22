import { VisualTheme, ThemeColors } from '@/types/game';

export const THEMES: Record<VisualTheme, ThemeColors> = {
  neon_noir: {
    primary: '#06B6D4', // Cyan
    secondary: '#F43F5E', // Rose Crimson
    accent: '#F59E0B', // Amber Gold
    grid: 'rgba(6, 182, 212, 0.22)',
    glow: 'rgba(6, 182, 212, 0.45)',
    background: '#030712',
    name: 'Neon Noir',
    description: 'Electric Cyan & Crimson Cyberpunk Grid',
  },
  solar_flare: {
    primary: '#F59E0B', // Radiant Gold
    secondary: '#EF4444', // Fiery Red
    accent: '#FBBF24', // Sun Amber
    grid: 'rgba(245, 158, 11, 0.25)',
    glow: 'rgba(245, 158, 11, 0.5)',
    background: '#0B0703',
    name: 'Solar Flare',
    description: 'High-Energy Solar Plasma & Arcade Fire',
  },
  cyber_ocean: {
    primary: '#10B981', // Emerald
    secondary: '#06B6D4', // Sea Cyan
    accent: '#34D399', // Mint
    grid: 'rgba(16, 185, 129, 0.22)',
    glow: 'rgba(16, 185, 129, 0.45)',
    background: '#02110D',
    name: 'Cyber Ocean',
    description: 'Abyssal Bioluminescence & Emerald Glide',
  },
  retro_outrun: {
    primary: '#D946EF', // Fuchsia Neon
    secondary: '#38BDF8', // Sky Blue
    accent: '#F43F5E', // Miami Pink
    grid: 'rgba(217, 70, 239, 0.25)',
    glow: 'rgba(217, 70, 239, 0.45)',
    background: '#0A0314',
    name: 'Retro Outrun',
    description: '80s Synthwave Horizon & Sunset Grid',
  },
};

export function getTheme(theme: VisualTheme): ThemeColors {
  return THEMES[theme] || THEMES.neon_noir;
}
