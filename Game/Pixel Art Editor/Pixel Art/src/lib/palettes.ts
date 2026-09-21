export interface PalettePreset {
  name: string;
  description: string;
  colors: string[];
}

export const PALETTE_PRESETS: Record<string, PalettePreset> = {
  'Cyberpunk Neon 32': {
    name: 'Cyberpunk Neon 32',
    description: 'Iconic neon synthwave palette with electric violets, cyan pulses, and void blacks.',
    colors: [
      '#090A0F', '#15121B', '#1D1A23', '#211E27', '#2C2832', '#37333D', '#3B3742', '#494454',
      '#958EA0', '#CBC3D7', '#E7E0ED', '#FFFFFF', '#D0BCFF', '#A078FF', '#6D3BD7', '#5516BE',
      '#3C0091', '#4CD7F6', '#03B5D3', '#ACEDFF', '#00424E', '#FFB869', '#CA801E', '#FFDCBB',
      '#FFB4AB', '#93000A', '#690005', '#22C55E', '#10B981', '#EAB308', '#EC4899', '#8B5CF6'
    ]
  },
  'Pico-8 (16)': {
    name: 'Pico-8 (16)',
    description: 'Legendary 16-color fantasy console palette created by Lexaloffle.',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ]
  },
  'Game Boy Classic (4)': {
    name: 'Game Boy Classic (4)',
    description: 'Authentic 4-tone monochrome liquid crystal display tones from 1989.',
    colors: [
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F'
    ]
  },
  'Endesga 32': {
    name: 'Endesga 32',
    description: 'Versatile 32-color master palette designed by pixel artist Edermunizz.',
    colors: [
      '#BE4A2F', '#D77643', '#EAD4AA', '#E4A672', '#B86F50', '#733E39', '#3E2731', '#26171E',
      '#A22633', '#E43B44', '#F77622', '#FEE761', '#63C74D', '#3E8948', '#265C42', '#193C3E',
      '#124E89', '#0099DB', '#2CE8F5', '#FFFFFF', '#C0CBDC', '#8B9BB4', '#5A6988', '#3A4466',
      '#262B44', '#181425', '#FF0044', '#68386C', '#B55088', '#F6757A', '#E8B796', '#C28569'
    ]
  },
  'Commodore 64 (16)': {
    name: 'Commodore 64 (16)',
    description: 'The distinctive VIC-II 16-color palette of the historic C64 home computer.',
    colors: [
      '#000000', '#FFFFFF', '#880000', '#AAFFEE', '#CC44CC', '#00CC55', '#0000AA', '#EEEE77',
      '#DD8855', '#664400', '#FF7777', '#333333', '#777777', '#AAFF66', '#0088FF', '#BBBBBB'
    ]
  },
  'NES Classic (54)': {
    name: 'NES Classic (54)',
    description: 'Classic 8-bit Nintendo Entertainment System hardware color limitations.',
    colors: [
      '#666666', '#002A88', '#1412A7', '#3B00A4', '#5C007E', '#6E0040', '#6C0600', '#561D00',
      '#333500', '#0B4800', '#005200', '#004F08', '#00404D', '#000000', '#ADADAD', '#155FD9',
      '#4240FF', '#7527FE', '#A01ACC', '#B71E7B', '#B53120', '#994E00', '#6B6D00', '#388700',
      '#0C9300', '#008F32', '#007C8D', '#000000', '#FFFFFF', '#64B0FF', '#9290FF', '#C676FF',
      '#F36AFF', '#FE6ECC', '#FE8176', '#E79E38', '#B7BD00', '#84D700', '#52E432', '#3CE380',
      '#37D0E0', '#4F4F4F', '#FFFFFF', '#C0E0FF', '#D0D0FF', '#E8C0FF', '#FCC0FF', '#FEC4EA',
      '#FECDC8', '#F7D99E', '#E4E69E', '#CEF29E', '#B8F8B8', '#B0F8DA', '#ADF0F4', '#B8B8B8'
    ]
  }
};

/**
 * Creates an empty 2D frame (height x width) initialized with empty string (transparent)
 */
export function createEmptyGrid(width: number, height: number): string[][] {
  const grid: string[][] = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(''));
  }
  return grid;
}

/**
 * Generates an initial animated 4-frame cyberpunk sprite so users instantly have working content!
 */
export function createInitialDemoFrames(width: number, height: number, layerCount: number): string[][][][] {
  // 4 frames, layerCount layers
  const frames: string[][][][] = [];
  
  for (let f = 0; f < 4; f++) {
    const frameLayers: string[][][] = [];
    
    for (let l = 0; l < layerCount; l++) {
      const grid = createEmptyGrid(width, height);
      
      // Layer 0: Base Body & Cape (Runs / bobs up and down)
      if (l === 0) {
        const bob = (f % 2 === 0) ? 0 : 1;
        const cx = Math.floor(width / 2);
        const cy = Math.floor(height / 2) + bob;

        // Head (helmet)
        for (let y = cy - 8; y <= cy - 4; y++) {
          for (let x = cx - 3; x <= cx + 3; x++) {
            grid[y][x] = '#37333D';
          }
        }
        // Visor glow
        grid[cy - 6][cx - 2] = '#4CD7F6';
        grid[cy - 6][cx - 1] = '#4CD7F6';
        grid[cy - 6][cx] = '#4CD7F6';
        grid[cy - 6][cx + 1] = '#4CD7F6';

        // Torso / Armor
        for (let y = cy - 3; y <= cy + 3; y++) {
          for (let x = cx - 4; x <= cx + 4; x++) {
            grid[y][x] = '#211E27';
          }
        }
        // Chest core
        grid[cy - 1][cx] = '#D0BCFF';
        grid[cy][cx] = '#A078FF';

        // Animated Legs based on frame f
        if (f === 0) {
          // Stride 1: Left leg forward, right leg back
          for (let y = cy + 4; y <= cy + 8; y++) {
            grid[y][cx - 3] = '#37333D';
            grid[y][cx + 3] = '#1D1A23';
          }
          grid[cy + 8][cx - 4] = '#4CD7F6';
          grid[cy + 8][cx + 4] = '#37333D';
        } else if (f === 1) {
          // Passing position
          for (let y = cy + 4; y <= cy + 7; y++) {
            grid[y][cx - 1] = '#37333D';
            grid[y][cx + 1] = '#211E27';
          }
          grid[cy + 7][cx - 1] = '#4CD7F6';
          grid[cy + 7][cx + 1] = '#37333D';
        } else if (f === 2) {
          // Stride 2: Right leg forward, left leg back
          for (let y = cy + 4; y <= cy + 8; y++) {
            grid[y][cx + 3] = '#37333D';
            grid[y][cx - 3] = '#1D1A23';
          }
          grid[cy + 8][cx + 4] = '#4CD7F6';
          grid[cy + 8][cx - 4] = '#37333D';
        } else {
          // Passing position 2
          for (let y = cy + 4; y <= cy + 7; y++) {
            grid[y][cx + 1] = '#37333D';
            grid[y][cx - 1] = '#211E27';
          }
          grid[cy + 7][cx + 1] = '#4CD7F6';
          grid[cy + 7][cx - 1] = '#37333D';
        }

        // Cyber Cape trailing behind
        const capeSkew = f * 1;
        for (let y = cy - 2; y <= cy + 5; y++) {
          const x = cx - 5 - (y - cy + 2) + Math.floor(capeSkew / 2);
          if (x >= 0 && x < width && y >= 0 && y < height) {
            grid[y][x] = '#6D3BD7';
            if (x - 1 >= 0) grid[y][x - 1] = '#5516BE';
          }
        }
      }

      // Layer 1: FX Overlay (Glowing Cyan Energy Blades)
      if (l === 1) {
        const bob = (f % 2 === 0) ? 0 : 1;
        const cx = Math.floor(width / 2);
        const cy = Math.floor(height / 2) + bob;
        // Blade in hand
        const bladeX = cx + 5 + ((f % 2 === 0) ? 1 : 0);
        for (let y = cy - 5; y <= cy + 4; y++) {
          if (bladeX < width && y >= 0 && y < height) {
            grid[y][bladeX] = '#4CD7F6';
            if (bladeX + 1 < width) grid[y][bladeX + 1] = '#ACEDFF';
          }
        }
        // Sparks / particles
        if (f === 0 || f === 2) {
          if (bladeX + 2 < width && cy - 2 >= 0) grid[cy - 2][bladeX + 2] = '#FFFFFF';
          if (bladeX + 3 < width && cy - 4 >= 0) grid[cy - 4][bladeX + 3] = '#4CD7F6';
        }
      }

      frameLayers.push(grid);
    }
    frames.push(frameLayers);
  }

  return frames;
}
