import { BoundingBox, SliceConfig, SpriteFrame } from '../types/sprite';

/**
 * Generate uniform grid frames from slice configuration
 */
export function generateGridFrames(
  imageWidth: number,
  imageHeight: number,
  config: SliceConfig
): SpriteFrame[] {
  const frames: SpriteFrame[] = [];
  const { frameWidth, frameHeight, offsetX, offsetY, spacingX, spacingY } = config;

  if (frameWidth <= 0 || frameHeight <= 0) return frames;

  let index = 0;
  for (let y = offsetY; y + frameHeight <= imageHeight; y += frameHeight + spacingY) {
    for (let x = offsetX; x + frameWidth <= imageWidth; x += frameWidth + spacingX) {
      const id = `frame_${index}`;
      
      // Default sensible hurtbox & collision box centered in frame
      const hurtbox: BoundingBox = {
        id: `hb_${id}_hurt`,
        type: 'hurtbox',
        x: Math.round(frameWidth * 0.2),
        y: Math.round(frameHeight * 0.15),
        width: Math.round(frameWidth * 0.6),
        height: Math.round(frameHeight * 0.75),
        label: 'Body Hurtbox',
      };

      const collision: BoundingBox = {
        id: `hb_${id}_col`,
        type: 'collision',
        x: Math.round(frameWidth * 0.25),
        y: Math.round(frameHeight * 0.8),
        width: Math.round(frameWidth * 0.5),
        height: Math.round(frameHeight * 0.2),
        label: 'Ground Footing',
      };

      frames.push({
        id,
        index,
        sourceRect: { x, y, width: frameWidth, height: frameHeight },
        anchorPoint: {
          x: Math.round(frameWidth / 2),
          y: frameHeight, // Default anchor at bottom-center (standard platformer/RPG pivot)
        },
        hitboxes: [hurtbox, collision],
      });
      index++;
    }
  }

  return frames;
}

/**
 * Convert detected heuristic islands into SpriteFrame objects
 */
export function convertIslandsToFrames(
  islands: { x: number; y: number; width: number; height: number }[]
): SpriteFrame[] {
  return islands.map((rect, idx) => {
    const id = `frame_${idx}`;
    return {
      id,
      index: idx,
      sourceRect: { ...rect },
      anchorPoint: {
        x: Math.round(rect.width / 2),
        y: rect.height,
      },
      hitboxes: [
        {
          id: `hb_${id}_hurt`,
          type: 'hurtbox',
          x: Math.round(rect.width * 0.15),
          y: Math.round(rect.height * 0.1),
          width: Math.round(rect.width * 0.7),
          height: Math.round(rect.height * 0.8),
          label: 'Auto Hurtbox',
        },
      ],
    };
  });
}

/**
 * Calculate GPU texture VRAM footprint in bytes (RGBA 32-bit = 4 bytes per pixel)
 */
export function calculateVramBytes(width: number, height: number): number {
  return width * height * 4;
}

/**
 * Format bytes to readable string (KB / MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
