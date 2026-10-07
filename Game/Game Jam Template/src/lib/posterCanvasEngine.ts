import type { PosterTemplateConfig, AspectRatioType, PaletteKey, StickerItem } from '../types/jam';

export interface CanvasDimensions {
  width: number;
  height: number;
  label: string;
}

export const ASPECT_DIMENSIONS: Record<AspectRatioType, CanvasDimensions> = {
  '16:9': { width: 1920, height: 1080, label: '16:9 Twitch / YouTube Banner' },
  '1:1': { width: 1080, height: 1080, label: '1:1 Square Feed Asset' },
  '9:16': { width: 1080, height: 1920, label: '9:16 Vertical TikTok / Story' },
  'A3_PRINT': { width: 1754, height: 2480, label: 'A3 Print Poster (300DPI scaled)' }
};

export interface PaletteColors {
  bg: string;
  bgGrad: string;
  primary: string;
  secondary: string;
  accent: string;
  textLight: string;
  textMuted: string;
  cardBg: string;
  border: string;
}

export const PALETTES: Record<PaletteKey, PaletteColors> = {
  cyber_neon: {
    bg: '#08090D',
    bgGrad: '#0F121C',
    primary: '#06B6D4',
    secondary: '#F43F5E',
    accent: '#A855F7',
    textLight: '#F8FAFC',
    textMuted: '#94A3B8',
    cardBg: 'rgba(15, 18, 28, 0.85)',
    border: '#222B42'
  },
  arcade_fire: {
    bg: '#0D0808',
    bgGrad: '#1F0B0B',
    primary: '#F59E0B',
    secondary: '#EF4444',
    accent: '#F97316',
    textLight: '#FFFBEB',
    textMuted: '#FCA5A5',
    cardBg: 'rgba(31, 11, 11, 0.85)',
    border: '#541C15'
  },
  retro_pixel: {
    bg: '#0B0814',
    bgGrad: '#190E2B',
    primary: '#10B981',
    secondary: '#EC4899',
    accent: '#8B5CF6',
    textLight: '#F5F3FF',
    textMuted: '#C4B5FD',
    cardBg: 'rgba(25, 14, 43, 0.85)',
    border: '#3B1F63'
  },
  deep_space: {
    bg: '#040711',
    bgGrad: '#0A1226',
    primary: '#38BDF8',
    secondary: '#818CF8',
    accent: '#C084FC',
    textLight: '#F0F9FF',
    textMuted: '#93C5FD',
    cardBg: 'rgba(10, 18, 38, 0.85)',
    border: '#1E293B'
  }
};

export const AVAILABLE_BADGES = [
  '⚡ GODOT 4.3',
  '🦀 BEVY RUST',
  '🕹️ UNITY 6',
  '🌐 WEBGL',
  '⚔️ UNREAL 5',
  '👾 PICO-8',
  '🎨 100% ORIGINAL ART',
  '🎵 PROCEDURAL OST',
  '⏱️ 48H SPEEDRUN',
  '🏆 $10,000 PRIZE POOL',
  '⭐ SOLO DEV',
  '🔥 MULTIPLAYER'
];

/**
 * High-DPI Canvas Rendering Engine
 */
export function renderPosterToCanvas(
  canvas: HTMLCanvasElement,
  config: PosterTemplateConfig,
  scaleFactor: number = 1
) {
  const baseDim = ASPECT_DIMENSIONS[config.aspectRatio];
  const width = baseDim.width * scaleFactor;
  const height = baseDim.height * scaleFactor;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colors = PALETTES[config.paletteKey] || PALETTES.cyber_neon;
  const s = scaleFactor;

  // 1. Background Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, colors.bg);
  grad.addColorStop(0.5, colors.bgGrad);
  grad.addColorStop(1, colors.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Cyber-grid Lines
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1 * s;
  const gridSize = 64 * s;
  ctx.beginPath();
  for (let x = 0; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 3. Ambient Neon Glow Orbs
  const glow1 = ctx.createRadialGradient(width * 0.2, height * 0.25, 0, width * 0.2, height * 0.25, width * 0.45);
  glow1.addColorStop(0, `${colors.primary}33`);
  glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, width, height);

  const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, width * 0.4);
  glow2.addColorStop(0, `${colors.secondary}29`);
  glow2.addColorStop(1, 'transparent');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, width, height);

  // 4. Outer HUD Frame & Corner Accents
  const pad = 48 * s;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 2 * s;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  // Corner marks
  const cornerLen = 32 * s;
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 4 * s;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(pad, pad + cornerLen);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + cornerLen, pad);
  // Top-right
  ctx.moveTo(width - pad - cornerLen, pad);
  ctx.lineTo(width - pad, pad);
  ctx.lineTo(width - pad, pad + cornerLen);
  // Bottom-left
  ctx.moveTo(pad, height - pad - cornerLen);
  ctx.lineTo(pad, height - pad);
  ctx.lineTo(pad + cornerLen, height - pad);
  // Bottom-right
  ctx.moveTo(width - pad - cornerLen, height - pad);
  ctx.lineTo(width - pad, height - pad);
  ctx.lineTo(width - pad, height - pad - cornerLen);
  ctx.stroke();

  // 5. Header Telemetry Bar
  ctx.font = `bold ${18 * s}px "JetBrains Mono", monospace`;
  ctx.fillStyle = colors.primary;
  ctx.textAlign = 'left';
  ctx.fillText(`// MISSION TELEMETRY // JAM_ID: #NEO-2026 // ${config.aspectRatio}`, pad + 24 * s, pad + 38 * s);

  ctx.textAlign = 'right';
  ctx.fillStyle = colors.textMuted;
  ctx.fillText(`TIMEFRAME: ${config.startDate} → ${config.endDate}`, width - pad - 24 * s, pad + 38 * s);

  // 6. Central Hero Title & Typography
  const centerX = width / 2;
  let titleY = height * 0.32;
  if (config.aspectRatio === '9:16' || config.aspectRatio === 'A3_PRINT') {
    titleY = height * 0.28;
  } else if (config.aspectRatio === '16:9') {
    titleY = height * 0.36;
  }

  // Pre-badge tag
  ctx.textAlign = 'center';
  ctx.font = `700 ${22 * s}px "JetBrains Mono", monospace`;
  ctx.fillStyle = colors.secondary;
  ctx.fillText(`[ OFFICIAL EVENT TRANSMISSION ]`, centerX, titleY - 70 * s);

  // Main Jam Title
  const titleFontSize = Math.min(width * 0.075, 96 * s);
  ctx.font = `900 ${titleFontSize}px "Space Grotesk", "Outfit", sans-serif`;
  ctx.fillStyle = colors.textLight;
  ctx.shadowColor = colors.primary;
  ctx.shadowBlur = 24 * s;
  ctx.fillText(config.jamTitle.toUpperCase(), centerX, titleY);
  ctx.shadowBlur = 0; // reset

  // Theme Tagline Ribbon
  const ribbonWidth = width * 0.78;
  const ribbonHeight = 60 * s;
  const ribbonY = titleY + 36 * s;

  ctx.fillStyle = colors.cardBg;
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.roundRect(centerX - ribbonWidth / 2, ribbonY, ribbonWidth, ribbonHeight, 8 * s);
  ctx.fill();
  ctx.stroke();

  ctx.font = `600 ${22 * s}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = colors.primary;
  ctx.fillText(`THEME: "${config.themeTagline}"`, centerX, ribbonY + 38 * s);

  // Team Banner / Sub-heading if present
  let contentY = ribbonY + 95 * s;
  if (config.teamName) {
    ctx.font = `700 ${28 * s}px "JetBrains Mono", monospace`;
    ctx.fillStyle = colors.secondary;
    ctx.fillText(`TEAM SQUAD: ${config.teamName.toUpperCase()} [${config.engineTag || 'GODOT'}]`, centerX, contentY);
    contentY += 45 * s;
  }

  // Prize Pool Callout
  if (config.prizePool) {
    ctx.font = `800 ${32 * s}px "Outfit", sans-serif`;
    ctx.fillStyle = '#F59E0B';
    ctx.fillText(`PRIZE POOL: ${config.prizePool}`, centerX, contentY);
    contentY += 45 * s;
  }

  // 7. Sponsor & Engine Badges Ribbon
  const badgeBarY = height - pad - 120 * s;
  const activeBadges = config.sponsorBadges.length > 0 
    ? config.sponsorBadges 
    : ['GODOT 4', 'BEVY RUST', 'ITCH.IO', 'SHADCN UI', 'WEBGL 2.0'];

  let badgeStartX = pad + 30 * s;
  ctx.textAlign = 'left';
  ctx.font = `bold ${16 * s}px "JetBrains Mono", monospace`;

  activeBadges.forEach((badge) => {
    const textWidth = ctx.measureText(badge).width;
    const boxW = textWidth + 32 * s;
    const boxH = 40 * s;

    if (badgeStartX + boxW < width - pad - 30 * s) {
      ctx.fillStyle = 'rgba(23, 29, 47, 0.7)';
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.roundRect(badgeStartX, badgeBarY, boxW, boxH, 6 * s);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.textLight;
      ctx.fillText(badge, badgeStartX + 16 * s, badgeBarY + 25 * s);
      badgeStartX += boxW + 16 * s;
    }
  });

  // Footer stamp
  ctx.font = `14 * s px "JetBrains Mono", monospace`;
  ctx.fillStyle = colors.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(
    `AUTHENTICATED BY CLIENT-SIDE RENDER ENGINE // ZERO EXTERNAL ASSETS REQUIRED // SPEEDRUN READY`,
    centerX,
    height - pad - 24 * s
  );

  // 8. Draggable Custom Stickers
  config.customStickers.forEach((sticker) => {
    drawStickerOnCanvas(ctx, sticker, width, height, s, colors);
  });
}

function drawStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  sticker: StickerItem,
  canvasWidth: number,
  canvasHeight: number,
  scaleFactor: number,
  colors: PaletteColors
) {
  const x = (sticker.x / 100) * canvasWidth;
  const y = (sticker.y / 100) * canvasHeight;
  const stickerScale = sticker.scale * scaleFactor;

  ctx.save();
  ctx.translate(x, y);

  // Pill badge background
  ctx.font = `bold ${24 * stickerScale}px "JetBrains Mono", monospace`;
  const text = `${sticker.glyph} ${sticker.label || ''}`.trim();
  const textMetrics = ctx.measureText(text);
  const paddingX = 20 * stickerScale;
  const pillW = textMetrics.width + paddingX * 2;
  const pillH = 50 * stickerScale;

  // Drop shadow
  ctx.shadowColor = colors.secondary;
  ctx.shadowBlur = 18 * stickerScale;

  // Background
  ctx.fillStyle = '#0F121C';
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 2 * stickerScale;

  ctx.beginPath();
  ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 10 * stickerScale);
  ctx.fill();
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;

  // Text
  ctx.fillStyle = '#F8FAFC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

/**
 * Generate Vector SVG representation of the poster
 */
export function generatePosterSvg(config: PosterTemplateConfig): string {
  const dim = ASPECT_DIMENSIONS[config.aspectRatio];
  const colors = PALETTES[config.paletteKey] || PALETTES.cyber_neon;
  const { width, height } = dim;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bg}"/>
      <stop offset="50%" stop-color="${colors.bgGrad}"/>
      <stop offset="100%" stop-color="${colors.bg}"/>
    </linearGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Frame Border -->
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" fill="none" stroke="${colors.border}" stroke-width="2" />

  <!-- Telemetry Header -->
  <text x="72" y="90" fill="${colors.primary}" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="bold">// MISSION TELEMETRY // JAM: #NEO-2026 // [${config.aspectRatio}]</text>
  <text x="${width - 72}" y="90" fill="${colors.textMuted}" font-family="'JetBrains Mono', monospace" font-size="20" text-anchor="end">${config.startDate} → ${config.endDate}</text>

  <!-- Hero Title -->
  <text x="${width / 2}" y="${height * 0.35}" fill="${colors.textLight}" font-family="'Space Grotesk', sans-serif" font-size="96" font-weight="900" text-anchor="middle" filter="url(#neonGlow)">
    ${config.jamTitle.toUpperCase()}
  </text>

  <!-- Theme Ribbon -->
  <rect x="${width / 2 - 400}" y="${height * 0.42}" width="800" height="60" rx="8" fill="${colors.cardBg}" stroke="${colors.primary}" stroke-width="2" />
  <text x="${width / 2}" y="${height * 0.42 + 38}" fill="${colors.primary}" font-family="'Plus Jakarta Sans', sans-serif" font-size="24" font-weight="bold" text-anchor="middle">
    THEME: "${config.themeTagline}"
  </text>

  <!-- Team / Subtitle -->
  ${config.teamName ? `
  <text x="${width / 2}" y="${height * 0.54}" fill="${colors.secondary}" font-family="'JetBrains Mono', monospace" font-size="28" font-weight="bold" text-anchor="middle">
    TEAM SQUAD: ${config.teamName.toUpperCase()} [${config.engineTag || 'GODOT'}]
  </text>
  ` : ''}

  <!-- Footer -->
  <text x="${width / 2}" y="${height - 72}" fill="${colors.textMuted}" font-family="'JetBrains Mono', monospace" font-size="16" text-anchor="middle">
    AUTHENTICATED EVENT SPECIFICATION // LIVE EMBED MATRIX
  </text>
</svg>`;
}
