import { ColorPaletteItem } from '@/types';

export const CURATED_PALETTES: ColorPaletteItem[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Electric pinks, cyan lasers, and ultraviolet sparks',
    colors: ['#FF007F', '#00F0FF', '#7928CA', '#00FFA3', '#FFE600', '#9B51E0']
  },
  {
    id: 'aurora',
    name: 'Ethereal Aurora',
    description: 'Polar greens, mystic teals, and atmospheric violet glow',
    colors: ['#00FF87', '#60EFFF', '#0061FF', '#A033FF', '#4FACFE', '#00F2FE']
  },
  {
    id: 'solar',
    name: 'Solar Flare',
    description: 'Molten gold, incandescent magma, and thermonuclear radiance',
    colors: ['#FF4500', '#FF8C00', '#FFD700', '#FF0055', '#FFAA00', '#FF2A00']
  },
  {
    id: 'cosmos',
    name: 'Deep Cosmos',
    description: 'Interstellar nebula purples, star sapphire, and cosmic stardust',
    colors: ['#4A00E0', '#8E2DE2', '#12FFF7', '#B92B27', '#1565C0', '#F72585']
  },
  {
    id: 'emerald',
    name: 'Emerald Zen',
    description: 'Tranquil jade, bamboo moss, and meditative mint luminescence',
    colors: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#047857', '#A7F3D0']
  },
  {
    id: 'monokai',
    name: 'Monokai Vibrant',
    description: 'Classic algorithmic phosphor: hot magenta, lime, and cyan',
    colors: ['#F92672', '#A6E22E', '#66D9EF', '#FD971F', '#AE81FF', '#E6DB74']
  },
  {
    id: 'obsidian',
    name: 'Obsidian Monolith',
    description: 'Pure high-contrast titanium silver, chrome sheen, and platinum',
    colors: ['#FFFFFF', '#E2E8F0', '#94A3B8', '#CBD5E1', '#F8FAFC', '#64748B']
  },
  {
    id: 'opal',
    name: 'Opal Iridescence',
    description: 'Shifting pearlescent pastels with delicate prismatic shimmer',
    colors: ['#FF9A9E', '#FECFEF', '#A1C4FD', '#C2E9FB', '#FBC2EB', '#A6C1EE']
  }
];

// Helper to parse hex color to [r, g, b]
export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Linear RGB interpolation
export function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// Sample palette smoothly across a continuous float normalized index
export function samplePalette(palette: string[], index: number): string {
  if (!palette || palette.length === 0) return '#FFFFFF';
  if (palette.length === 1) return palette[0];
  
  const wrapped = ((index % 1) + 1) % 1;
  const scaled = wrapped * palette.length;
  const i1 = Math.floor(scaled) % palette.length;
  const i2 = (i1 + 1) % palette.length;
  const frac = scaled - Math.floor(scaled);

  return lerpColor(palette[i1], palette[i2], frac);
}
