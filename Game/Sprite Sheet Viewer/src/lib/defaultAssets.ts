import { SpriteAtlasProject } from '../types/sprite';
import { generateGridFrames } from './atlasMath';

/**
 * Procedurally generates a clean 8-bit / 16-bit Cyber Knight sprite sheet
 * containing distinct animations:
 * - Row 0: Idle (4 frames)
 * - Row 1: Run (6 frames)
 * - Row 2: Slash / Attack (5 frames with swinging laser sword & hitbox area)
 * - Row 3: Jump & Fall (4 frames)
 * Size: 256 x 128 (8 columns x 4 rows of 32x32 tiles)
 */
export function generateSampleSpriteSheetDataUrl(): string {
  const canvas = document.createElement('canvas');
  const cols = 8;
  const rows = 4;
  const frameW = 32;
  const frameH = 32;
  canvas.width = cols * frameW;
  canvas.height = rows * frameH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = {
    armor: '#38BDF8', // Cyan cyber armor
    visor: '#F43F5E', // Rose glowing visor
    darkArmor: '#0284C7',
    sword: '#34D399', // Emerald energy blade
    swordGlow: '#6EE7B7',
    hilt: '#F59E0B',
    boots: '#1E293B',
    cape: '#8B5CF6',
  };

  // Helper to draw a pixel block
  const px = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // Helper to draw character base body
  const drawKnight = (
    baseX: number,
    baseY: number,
    pose: {
      legOffset?: number;
      armAngle?: number;
      headBob?: number;
      swordSwing?: number;
      jumping?: boolean;
    }
  ) => {
    const bob = pose.headBob || 0;
    const leg = pose.legOffset || 0;
    const cx = baseX + 16;
    const cy = baseY + 26 + bob;

    // Cape (fluttering behind)
    px(cx - 7, cy - 14, 3, 10 + Math.abs(leg), colors.cape);

    // Legs
    if (pose.jumping) {
      px(cx - 5, cy - 4, 3, 4, colors.boots);
      px(cx + 2, cy - 3, 3, 3, colors.boots);
    } else {
      px(cx - 4 - leg, cy - 6, 3, 6, colors.boots);
      px(cx + 1 + leg, cy - 6, 3, 6, colors.boots);
    }

    // Torso / Chest Armor
    px(cx - 5, cy - 14, 10, 8, colors.armor);
    px(cx - 4, cy - 12, 8, 4, colors.darkArmor);

    // Helmet / Head
    px(cx - 5, cy - 22, 10, 8, colors.armor);
    // Glowing Visor
    px(cx - 2, cy - 19, 7, 2, colors.visor);

    // Arms & Weapon
    if (pose.swordSwing !== undefined) {
      // Slashing motion
      const swing = pose.swordSwing;
      if (swing === 0) {
        // Windup
        px(cx - 8, cy - 13, 3, 6, colors.armor);
        px(cx - 11, cy - 20, 2, 8, colors.sword);
      } else if (swing === 1) {
        // Full horizontal slash with blade arc
        px(cx + 4, cy - 13, 6, 3, colors.armor);
        px(cx + 9, cy - 14, 12, 3, colors.sword);
        px(cx + 10, cy - 17, 10, 2, colors.swordGlow); // Arc
      } else if (swing === 2) {
        // Forward thrust
        px(cx + 5, cy - 12, 8, 3, colors.armor);
        px(cx + 13, cy - 13, 14, 3, colors.sword);
      } else {
        // Recovery
        px(cx + 3, cy - 10, 4, 4, colors.armor);
        px(cx + 6, cy - 7, 6, 2, colors.sword);
      }
    } else {
      // Idle / Running sword resting
      px(cx + 4, cy - 13 + (pose.armAngle || 0), 3, 6, colors.armor);
      px(cx + 6, cy - 16 + (pose.armAngle || 0), 2, 7, colors.sword);
    }
  };

  // Row 0: Idle (4 frames)
  for (let f = 0; f < 4; f++) {
    const bob = f === 1 || f === 2 ? 1 : 0;
    drawKnight(f * 32, 0 * 32, { headBob: bob });
  }

  // Row 1: Run (6 frames)
  const runLegs = [-3, -1, 2, 3, 1, -2];
  for (let f = 0; f < 6; f++) {
    const leg = runLegs[f];
    const arm = -leg;
    const bob = Math.abs(leg) > 1 ? -1 : 0;
    drawKnight(f * 32, 1 * 32, { legOffset: leg, armAngle: arm, headBob: bob });
  }

  // Row 2: Attack (5 frames)
  for (let f = 0; f < 5; f++) {
    drawKnight(f * 32, 2 * 32, { swordSwing: f });
  }

  // Row 3: Jump & Fall (4 frames)
  for (let f = 0; f < 4; f++) {
    drawKnight(f * 32, 3 * 32, {
      jumping: true,
      headBob: f < 2 ? -2 : 0,
      legOffset: f === 2 ? 2 : 0,
    });
  }

  return canvas.toDataURL('image/png');
}

/**
 * Creates the initial pre-configured project with rich clips and hitboxes
 */
export function createDefaultProject(): SpriteAtlasProject {
  const imageUrl = generateSampleSpriteSheetDataUrl();
  const frameWidth = 32;
  const frameHeight = 32;
  const cols = 8;
  const rows = 4;

  const rawFrames = generateGridFrames(cols * frameWidth, rows * frameHeight, {
    mode: 'grid',
    frameWidth,
    frameHeight,
    offsetX: 0,
    offsetY: 0,
    spacingX: 0,
    spacingY: 0,
  });

  const frames: Record<string, any> = {};
  rawFrames.forEach((f) => {
    // Add special attack hitbox on Attack frames (row 2: indices 16 to 20)
    if (f.index >= 16 && f.index <= 20) {
      if (f.index === 17 || f.index === 18) {
        // Active strike frame! Add a crimson HITBOX
        f.hitboxes.push({
          id: `hb_${f.id}_strike`,
          type: 'hitbox',
          x: 18,
          y: 6,
          width: 14,
          height: 16,
          label: 'Energy Blade Strike',
        });
      }
    }
    frames[f.id] = f;
  });

  // Pre-configured standard animation clips matching row layouts
  const clips = [
    {
      id: 'clip_idle',
      name: 'Idle',
      fps: 6,
      loop: true,
      pingPong: false,
      frameIds: ['frame_0', 'frame_1', 'frame_2', 'frame_3'],
    },
    {
      id: 'clip_run',
      name: 'Run',
      fps: 12,
      loop: true,
      pingPong: false,
      frameIds: [
        'frame_8',
        'frame_9',
        'frame_10',
        'frame_11',
        'frame_12',
        'frame_13',
      ],
    },
    {
      id: 'clip_attack',
      name: 'Attack',
      fps: 14,
      loop: false,
      pingPong: false,
      frameIds: [
        'frame_16',
        'frame_17',
        'frame_18',
        'frame_19',
        'frame_20',
      ],
    },
    {
      id: 'clip_jump',
      name: 'Jump & Fall',
      fps: 8,
      loop: false,
      pingPong: false,
      frameIds: ['frame_24', 'frame_25', 'frame_26', 'frame_27'],
    },
  ];

  return {
    id: 'proj_cyber_knight',
    title: 'Cyber Knight - Character Rig',
    imageUrl,
    imageDimensions: { width: cols * frameWidth, height: rows * frameHeight },
    sliceConfig: {
      mode: 'grid',
      frameWidth,
      frameHeight,
      offsetX: 0,
      offsetY: 0,
      spacingX: 0,
      spacingY: 0,
    },
    frames,
    clips,
    activeClipId: 'clip_idle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Procedurally generates a 24x24 Pixel Rogue sprite sheet
 */
export function createRogueProject(): SpriteAtlasProject {
  const canvas = document.createElement('canvas');
  const cols = 6;
  const rows = 4;
  const frameW = 24;
  const frameH = 24;
  canvas.width = cols * frameW;
  canvas.height = rows * frameH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return createDefaultProject();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = {
    hood: '#10B981', // Emerald rogue hood
    cloak: '#047857',
    mask: '#064E3B',
    dagger: '#F59E0B',
    boots: '#1E293B',
  };

  const px = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // Draw rogue
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = c * frameW + 12;
      const by = r * frameH + 20;
      const bob = (c % 2 === 1) ? 1 : 0;

      // Cloak
      px(bx - 4, by - 10 + bob, 8, 8, colors.cloak);
      // Hood
      px(bx - 4, by - 16 + bob, 8, 6, colors.hood);
      // Mask & Eyes
      px(bx - 2, by - 14 + bob, 5, 2, colors.mask);
      px(bx, by - 14 + bob, 1, 1, '#FCD34D'); // Glint

      // Legs
      if (r === 1) {
        // Run
        px(bx - 3 + (c % 3 - 1) * 2, by - 2, 2, 3, colors.boots);
        px(bx + 1 - (c % 3 - 1) * 2, by - 2, 2, 3, colors.boots);
      } else {
        px(bx - 3, by - 2, 2, 3, colors.boots);
        px(bx + 1, by - 2, 2, 3, colors.boots);
      }

      // Daggers
      if (r === 2) {
        // Attack slash
        px(bx + 4 + c * 2, by - 12, 6, 2, colors.dagger);
      } else {
        px(bx + 3, by - 8, 2, 4, colors.dagger);
      }
    }
  }

  const imageUrl = canvas.toDataURL('image/png');
  const rawFrames = generateGridFrames(cols * frameW, rows * frameH, {
    mode: 'grid',
    frameWidth: frameW,
    frameHeight: frameH,
    offsetX: 0,
    offsetY: 0,
    spacingX: 0,
    spacingY: 0,
  });

  const frames: Record<string, any> = {};
  rawFrames.forEach((f) => {
    frames[f.id] = f;
  });

  const clips = [
    {
      id: 'clip_idle',
      name: 'Idle',
      fps: 6,
      loop: true,
      pingPong: false,
      frameIds: ['frame_0', 'frame_1', 'frame_2', 'frame_3'],
    },
    {
      id: 'clip_run',
      name: 'Run',
      fps: 12,
      loop: true,
      pingPong: false,
      frameIds: ['frame_6', 'frame_7', 'frame_8', 'frame_9', 'frame_10', 'frame_11'],
    },
    {
      id: 'clip_attack',
      name: 'Attack',
      fps: 14,
      loop: false,
      pingPong: false,
      frameIds: ['frame_12', 'frame_13', 'frame_14', 'frame_15'],
    },
  ];

  return {
    id: 'proj_pixel_rogue',
    title: 'Pixel Rogue - 24px Rig',
    imageUrl,
    imageDimensions: { width: cols * frameW, height: rows * frameH },
    sliceConfig: {
      mode: 'grid',
      frameWidth: frameW,
      frameHeight: frameH,
      offsetX: 0,
      offsetY: 0,
      spacingX: 0,
      spacingY: 0,
    },
    frames,
    clips,
    activeClipId: 'clip_idle',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

