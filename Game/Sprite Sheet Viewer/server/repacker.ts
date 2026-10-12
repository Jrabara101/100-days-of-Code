import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

export interface RectToPack {
  frameId: string;
  width: number;
  height: number;
  trimOffsetX: number;
  trimOffsetY: number;
  origWidth: number;
  origHeight: number;
  hash: string;
  buffer: Buffer;
}

export interface PackedItem {
  frameId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  trimOffsetX: number;
  trimOffsetY: number;
  buffer: Buffer;
}

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * MaxRects 2D Bin Packing (Best Short Side Fit)
 */
export class MaxRectsPacker {
  width: number;
  height: number;
  padding: number;
  freeRects: FreeRect[] = [];
  packedItems: PackedItem[] = [];

  constructor(initialWidth: number = 256, initialHeight: number = 256, padding: number = 1) {
    this.width = initialWidth;
    this.height = initialHeight;
    this.padding = padding;
    this.freeRects = [{ x: 0, y: 0, width: initialWidth, height: initialHeight }];
  }

  insert(rect: RectToPack): PackedItem | null {
    const paddedW = rect.width + this.padding;
    const paddedH = rect.height + this.padding;

    let bestNodeIndex = -1;
    let bestShortSideFit = Infinity;

    // Find best free rectangle
    for (let i = 0; i < this.freeRects.length; i++) {
      const free = this.freeRects[i];
      if (free.width >= paddedW && free.height >= paddedH) {
        const leftoverW = free.width - paddedW;
        const leftoverH = free.height - paddedH;
        const shortSideFit = Math.min(leftoverW, leftoverH);

        if (shortSideFit < bestShortSideFit) {
          bestShortSideFit = shortSideFit;
          bestNodeIndex = i;
        }
      }
    }

    if (bestNodeIndex === -1) {
      return null; // Doesn't fit in current dimensions
    }

    const freeNode = this.freeRects[bestNodeIndex];
    const packed: PackedItem = {
      frameId: rect.frameId,
      x: freeNode.x,
      y: freeNode.y,
      width: rect.width,
      height: rect.height,
      trimOffsetX: rect.trimOffsetX,
      trimOffsetY: rect.trimOffsetY,
      buffer: rect.buffer,
    };

    // Split free rectangles intersecting with the placed item
    this.splitFreeRectangles(freeNode.x, freeNode.y, paddedW, paddedH);
    return packed;
  }

  private splitFreeRectangles(placedX: number, placedY: number, placedW: number, placedH: number) {
    const newFreeRects: FreeRect[] = [];

    for (const free of this.freeRects) {
      // Check intersection
      if (
        placedX >= free.x + free.width ||
        placedX + placedW <= free.x ||
        placedY >= free.y + free.height ||
        placedY + placedH <= free.y
      ) {
        newFreeRects.push(free);
        continue;
      }

      // Top split
      if (placedY > free.y && placedY < free.y + free.height) {
        newFreeRects.push({
          x: free.x,
          y: free.y,
          width: free.width,
          height: placedY - free.y,
        });
      }

      // Bottom split
      if (placedY + placedH < free.y + free.height) {
        newFreeRects.push({
          x: free.x,
          y: placedY + placedH,
          width: free.width,
          height: free.y + free.height - (placedY + placedH),
        });
      }

      // Left split
      if (placedX > free.x && placedX < free.x + free.width) {
        newFreeRects.push({
          x: free.x,
          y: free.y,
          width: placedX - free.x,
          height: free.height,
        });
      }

      // Right split
      if (placedX + placedW < free.x + free.width) {
        newFreeRects.push({
          x: placedX + placedW,
          y: free.y,
          width: free.x + free.width - (placedX + placedW),
          height: free.height,
        });
      }
    }

    // Prune redundant/contained rectangles
    this.freeRects = this.pruneFreeRects(newFreeRects);
  }

  private pruneFreeRects(rects: FreeRect[]): FreeRect[] {
    const result: FreeRect[] = [];
    for (let i = 0; i < rects.length; i++) {
      let isContained = false;
      const a = rects[i];
      if (a.width <= 0 || a.height <= 0) continue;

      for (let j = 0; j < rects.length; j++) {
        if (i === j) continue;
        const b = rects[j];
        if (
          a.x >= b.x &&
          a.y >= b.y &&
          a.x + a.width <= b.x + b.width &&
          a.y + a.height <= b.y + b.height
        ) {
          isContained = true;
          break;
        }
      }

      if (!isContained) {
        result.push(a);
      }
    }
    return result;
  }
}

/**
 * Trims alpha channel and packs sprite frames into a compact atlas using Sharp
 */
export async function optimizeAtlasWithMaxRects(
  imageBuffer: Buffer,
  frames: Record<string, any>,
  uploadDir: string
) {
  const originalMeta = await sharp(imageBuffer).metadata();
  const origWidth = originalMeta.width || 256;
  const origHeight = originalMeta.height || 256;

  const frameList = Object.values(frames);
  const rectsToPack: RectToPack[] = [];
  const hashMap = new Map<string, { frameId: string; packed: PackedItem }>();
  let duplicateFramesRemoved = 0;
  let totalTrimmedPixels = 0;

  for (const f of frameList) {
    const { x, y, width: fw, height: fh } = f.sourceRect;
    if (fw <= 0 || fh <= 0) continue;

    // Extract raw frame buffer
    const frameBuffer = await sharp(imageBuffer)
      .extract({ left: x, top: y, width: fw, height: fh })
      .toBuffer();

    // Check trimmed bounds using sharp trim or pixel scan
    let trimOffsetX = 0;
    let trimOffsetY = 0;
    let trimmedBuffer = frameBuffer;
    let trimmedWidth = fw;
    let trimmedHeight = fh;

    try {
      const trimmedResult = await sharp(frameBuffer)
        .trim({ threshold: 10 })
        .toBuffer({ resolveWithObject: true });

      trimmedBuffer = trimmedResult.data;
      trimmedWidth = trimmedResult.info.width;
      trimmedHeight = trimmedResult.info.height;
      trimOffsetX = Math.max(0, -trimmedResult.info.trimOffsetLeft!);
      trimOffsetY = Math.max(0, -trimmedResult.info.trimOffsetTop!);

      const origArea = fw * fh;
      const trimmedArea = trimmedWidth * trimmedHeight;
      if (origArea > trimmedArea) {
        totalTrimmedPixels += origArea - trimmedArea;
      }
    } catch {
      // If image has no transparent borders, keep full frame
      trimmedBuffer = frameBuffer;
      trimmedWidth = fw;
      trimmedHeight = fh;
    }

    // Hash buffer for duplicate frame detection
    const hash = crypto.createHash('sha256').update(trimmedBuffer).digest('hex');

    rectsToPack.push({
      frameId: f.id,
      width: trimmedWidth,
      height: trimmedHeight,
      trimOffsetX,
      trimOffsetY,
      origWidth: fw,
      origHeight: fh,
      hash,
      buffer: trimmedBuffer,
    });
  }

  // Sort descending by height / area for optimal bin packing
  rectsToPack.sort((a, b) => b.height * b.width - a.height * a.width);

  // Determine starting atlas canvas size (power of 2 or snug box)
  let canvasSize = 64;
  let packer: MaxRectsPacker | null = null;
  const uniqueRects: RectToPack[] = [];
  const duplicatesMap = new Map<string, string>(); // duplicate frameId -> original frameId

  for (const r of rectsToPack) {
    if (hashMap.has(r.hash)) {
      duplicateFramesRemoved++;
      duplicatesMap.set(r.frameId, hashMap.get(r.hash)!.frameId);
    } else {
      uniqueRects.push(r);
      hashMap.set(r.hash, { frameId: r.frameId, packed: null as any });
    }
  }

  // Find canvas size where all unique rects fit
  let packedSuccess = false;
  while (!packedSuccess && canvasSize <= 4096) {
    packer = new MaxRectsPacker(canvasSize, canvasSize, 2);
    let allFit = true;

    for (const r of uniqueRects) {
      const item = packer.insert(r);
      if (!item) {
        allFit = false;
        break;
      }
      packer.packedItems.push(item);
      hashMap.get(r.hash)!.packed = item;
    }

    if (allFit) {
      packedSuccess = true;
    } else {
      canvasSize *= 2;
    }
  }

  if (!packer || !packedSuccess) {
    throw new Error('Unable to pack sprite sheet within 4096x4096px bounds.');
  }

  // Calculate actual bounding box used by packed items
  let maxPackedX = 0;
  let maxPackedY = 0;
  for (const item of packer.packedItems) {
    maxPackedX = Math.max(maxPackedX, item.x + item.width);
    maxPackedY = Math.max(maxPackedY, item.y + item.height);
  }

  // Round up to multiple of 4 for GPU texture alignment
  const finalW = Math.max(32, Math.ceil(maxPackedX / 4) * 4);
  const finalH = Math.max(32, Math.ceil(maxPackedY / 4) * 4);

  // Composite new PNG atlas
  const compositeList = packer.packedItems.map((item) => ({
    input: item.buffer,
    left: item.x,
    top: item.y,
  }));

  const optimizedFilename = `repacked_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.png`;
  const optimizedFilePath = path.join(uploadDir, optimizedFilename);

  await sharp({
    create: {
      width: finalW,
      height: finalH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeList)
    .png({ compressionLevel: 9 })
    .toFile(optimizedFilePath);

  // Build updated frames record
  const updatedFrames: Record<string, any> = {};

  for (const f of frameList) {
    // If it's a duplicate, point to the canonical packed rect
    const targetFrameId = duplicatesMap.get(f.id) || f.id;
    const packedItem = packer.packedItems.find((p) => p.frameId === targetFrameId);

    if (packedItem) {
      // Adjust anchor point so visual sprite positioning remains identical
      const newAnchorX = f.anchorPoint.x - packedItem.trimOffsetX;
      const newAnchorY = f.anchorPoint.y - packedItem.trimOffsetY;

      // Adjust hitboxes relative to new trimmed frame
      const updatedHitboxes = f.hitboxes.map((hb: any) => ({
        ...hb,
        x: hb.x - packedItem.trimOffsetX,
        y: hb.y - packedItem.trimOffsetY,
      }));

      updatedFrames[f.id] = {
        ...f,
        sourceRect: {
          x: packedItem.x,
          y: packedItem.y,
          width: packedItem.width,
          height: packedItem.height,
        },
        anchorPoint: {
          x: Math.max(0, newAnchorX),
          y: Math.max(0, newAnchorY),
        },
        hitboxes: updatedHitboxes,
      };
    } else {
      updatedFrames[f.id] = f;
    }
  }

  const originalVramBytes = origWidth * origHeight * 4;
  const optimizedVramBytes = finalW * finalH * 4;
  const vramSavedPercentage = +(
    ((originalVramBytes - optimizedVramBytes) / originalVramBytes) *
    100
  ).toFixed(1);

  return {
    originalDimensions: { width: origWidth, height: origHeight },
    repackedDimensions: { width: finalW, height: finalH },
    originalVramBytes,
    optimizedVramBytes,
    vramSavedPercentage: Math.max(0, vramSavedPercentage),
    duplicateFramesRemoved,
    trimmedPixels: totalTrimmedPixels,
    repackedImageUrl: `/uploads/${optimizedFilename}`,
    frames: updatedFrames,
  };
}
