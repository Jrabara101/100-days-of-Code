import * as THREE from 'three';

export interface BoardSkin {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  // Colors
  backgroundColor: number;
  fogColor: number;
  lightSquareColor: number;
  darkSquareColor: number;
  borderWoodColor: number;
  frameAccentColor: number;
  ambientLightColor: number;
  keyLightColor: number;
  fillLightColor: number;
  // Textures
  lightSquareTexture?: THREE.CanvasTexture;
  darkSquareTexture?: THREE.CanvasTexture;
  frameTexture?: THREE.CanvasTexture;
  // Piece Material Specs
  whitePiece: {
    color: number;
    roughness: number;
    metalness: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    transmission?: number;
    ior?: number;
    emissive?: number;
    emissiveIntensity?: number;
    accentColor: number;
  };
  blackPiece: {
    color: number;
    roughness: number;
    metalness: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    transmission?: number;
    ior?: number;
    emissive?: number;
    emissiveIntensity?: number;
    accentColor: number;
  };
}

/**
 * Procedural Canvas Texture Generators (100% Client-side, zero external files)
 */
function createWoodTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseCol = isDark ? '#2e1c14' : '#e6cdab';
  const grainCol = isDark ? '#1d110b' : '#c9ab81';

  ctx.fillStyle = baseCol;
  ctx.fillRect(0, 0, 512, 512);

  // Draw natural organic wood grain rings
  ctx.strokeStyle = grainCol;
  for (let i = 0; i < 90; i++) {
    ctx.lineWidth = Math.random() * 2.5 + 0.5;
    ctx.globalAlpha = Math.random() * 0.25 + 0.08;
    ctx.beginPath();
    const startY = Math.random() * 512;
    ctx.moveTo(0, startY);
    ctx.bezierCurveTo(
      150, startY + (Math.random() - 0.5) * 50,
      350, startY + (Math.random() - 0.5) * 50,
      512, startY + (Math.random() - 0.5) * 40
    );
    ctx.stroke();
  }

  // Soft wood fibers
  ctx.globalAlpha = 0.04;
  for (let x = 0; x < 512; x += 4) {
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(x, 0, 2, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createMarbleTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isDark ? '#111417' : '#f0f3f6';
  ctx.fillRect(0, 0, 512, 512);

  // Soft clouds
  for (let i = 0; i < 25; i++) {
    const rad = Math.random() * 120 + 40;
    const grad = ctx.createRadialGradient(
      Math.random() * 512, Math.random() * 512, 10,
      Math.random() * 512, Math.random() * 512, rad
    );
    grad.addColorStop(0, isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(215, 224, 235, 0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }

  // Fine veining
  ctx.strokeStyle = isDark ? 'rgba(226, 232, 240, 0.28)' : 'rgba(100, 116, 139, 0.35)';
  for (let v = 0; v < 8; v++) {
    ctx.beginPath();
    ctx.lineWidth = Math.random() * 2 + 0.5;
    let cx = Math.random() * 512;
    let cy = Math.random() * 512;
    ctx.moveTo(cx, cy);
    for (let step = 0; step < 6; step++) {
      cx += (Math.random() - 0.5) * 160;
      cy += (Math.random() - 0.5) * 160;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createCyberTexture(isDark: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isDark ? '#05070f' : '#0c1020';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle grid mesh
  ctx.strokeStyle = isDark ? 'rgba(236, 72, 153, 0.12)' : 'rgba(6, 182, 212, 0.15)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let i = 0; i <= 512; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Glowing circuit nodes
  ctx.fillStyle = isDark ? '#ec4899' : '#06b6d4';
  ctx.shadowColor = isDark ? '#ec4899' : '#06b6d4';
  ctx.shadowBlur = 8;
  for (let n = 0; n < 4; n++) {
    const nx = Math.floor(Math.random() * (512 / step)) * step;
    const ny = Math.floor(Math.random() * (512 / step)) * step;
    ctx.fillRect(nx - 2, ny - 2, 4, 4);
  }

  // Perimeter border accent
  ctx.strokeStyle = isDark ? 'rgba(236, 72, 153, 0.5)' : 'rgba(6, 182, 212, 0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 504, 504);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Built skins repository
let cachedSkins: BoardSkin[] | null = null;

export function getAvailableSkins(): BoardSkin[] {
  if (cachedSkins) return cachedSkins;

  cachedSkins = [
    {
      id: 'heritage',
      name: 'Grand Heritage',
      subtitle: 'Walnut & Curly Maple',
      description: 'Hand-crafted artisanal wood grain with satin finish and golden inlay joints.',
      badge: 'Classic',
      backgroundColor: 0x090c10,
      fogColor: 0x090c10,
      lightSquareColor: 0xecd7ba,
      darkSquareColor: 0x3d271d,
      borderWoodColor: 0x24160f,
      frameAccentColor: 0xd4af37,
      ambientLightColor: 0xffeedd,
      keyLightColor: 0xfffaed,
      fillLightColor: 0x90a4ae,
      lightSquareTexture: createWoodTexture(false),
      darkSquareTexture: createWoodTexture(true),
      frameTexture: createWoodTexture(true),
      whitePiece: {
        color: 0xf5e6cc,
        roughness: 0.28,
        metalness: 0.05,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
        accentColor: 0xd4af37, // gold collar
      },
      blackPiece: {
        color: 0x2a1a12,
        roughness: 0.32,
        metalness: 0.08,
        clearcoat: 0.5,
        clearcoatRoughness: 0.25,
        accentColor: 0x8c6d46, // warm bronze
      },
    },
    {
      id: 'carrara',
      name: 'Imperial Carrara',
      subtitle: 'White Marble & Black Obsidian',
      description: 'Mirror-polished Italian Carrara marble paired with obsidian stone and gold accents.',
      badge: 'Luxury',
      backgroundColor: 0x080a0f,
      fogColor: 0x080a0f,
      lightSquareColor: 0xf8fafc,
      darkSquareColor: 0x0f172a,
      borderWoodColor: 0x1e293b,
      frameAccentColor: 0xf59e0b,
      ambientLightColor: 0xf1f5f9,
      keyLightColor: 0xffffff,
      fillLightColor: 0x64748b,
      lightSquareTexture: createMarbleTexture(false),
      darkSquareTexture: createMarbleTexture(true),
      frameTexture: createMarbleTexture(true),
      whitePiece: {
        color: 0xf8fafc,
        roughness: 0.12,
        metalness: 0.02,
        clearcoat: 0.95,
        clearcoatRoughness: 0.1,
        accentColor: 0xf59e0b, // gold
      },
      blackPiece: {
        color: 0x090d14,
        roughness: 0.15,
        metalness: 0.35,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
        accentColor: 0xd97706, // deep amber gold
      },
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Matrix',
      subtitle: 'Neon Cyan & Synth Magenta',
      description: 'Dark cybernetic composite with emissive circuit traces and holographic piece cores.',
      badge: 'Sci-Fi',
      backgroundColor: 0x03030a,
      fogColor: 0x03030a,
      lightSquareColor: 0x0e1726,
      darkSquareColor: 0x060813,
      borderWoodColor: 0x02040a,
      frameAccentColor: 0x06b6d4,
      ambientLightColor: 0x1e1b4b,
      keyLightColor: 0x38bdf8,
      fillLightColor: 0xd946ef,
      lightSquareTexture: createCyberTexture(false),
      darkSquareTexture: createCyberTexture(true),
      whitePiece: {
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.85,
        clearcoat: 1.0,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        accentColor: 0x38bdf8,
      },
      blackPiece: {
        color: 0xa21caf,
        roughness: 0.15,
        metalness: 0.8,
        clearcoat: 1.0,
        emissive: 0xa21caf,
        emissiveIntensity: 0.45,
        accentColor: 0xf472b6,
      },
    },
    {
      id: 'sovereign',
      name: 'Royal Sovereign',
      subtitle: '24K Gold & Lapis Lazuli',
      description: 'Dignified 24k brushed gold opposing deep indigo blue lapis with royal regalia crowns.',
      badge: 'Royal',
      backgroundColor: 0x0a0714,
      fogColor: 0x0a0714,
      lightSquareColor: 0xfef08a,
      darkSquareColor: 0x172554,
      borderWoodColor: 0x1e1b4b,
      frameAccentColor: 0xeab308,
      ambientLightColor: 0xede9fe,
      keyLightColor: 0xfef08a,
      fillLightColor: 0x6366f1,
      whitePiece: {
        color: 0xfacc15,
        roughness: 0.18,
        metalness: 0.95,
        clearcoat: 0.8,
        accentColor: 0xffffff,
      },
      blackPiece: {
        color: 0x1e1b4b,
        roughness: 0.22,
        metalness: 0.5,
        clearcoat: 0.8,
        accentColor: 0xeab308,
      },
    },
    {
      id: 'frost',
      name: 'Nordic Frost',
      subtitle: 'Glacial Crystal & Charcoal Basalt',
      description: 'Translucent optical glacial glass alongside matte volcanic charcoal basalt.',
      badge: 'Modern',
      backgroundColor: 0x0b131a,
      fogColor: 0x0b131a,
      lightSquareColor: 0xe0f2fe,
      darkSquareColor: 0x1c2430,
      borderWoodColor: 0x0f172a,
      frameAccentColor: 0x38bdf8,
      ambientLightColor: 0xbae6fd,
      keyLightColor: 0xe0f2fe,
      fillLightColor: 0x475569,
      whitePiece: {
        color: 0xffffff,
        roughness: 0.08,
        metalness: 0.05,
        transmission: 0.82,
        ior: 1.52,
        clearcoat: 1.0,
        accentColor: 0x38bdf8,
      },
      blackPiece: {
        color: 0x1e293b,
        roughness: 0.65,
        metalness: 0.1,
        accentColor: 0x94a3b8,
      },
    },
  ];

  return cachedSkins;
}

export function getSkinById(id: string): BoardSkin {
  const skins = getAvailableSkins();
  return skins.find((s) => s.id === id) || skins[0];
}
