import { Layer } from '../types/pixel';

export interface SpriteSheetOptions {
  scale: number;
  layout: 'auto' | 'horizontal' | 'vertical';
  padding: number;
  trimAlpha: boolean;
  format: 'png' | 'webp';
}

/**
 * Composite a single frame from its visible layers into an HTMLCanvasElement
 */
export function compositeFrameToCanvas(
  frameLayers: string[][][],
  layers: Layer[],
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  layers.forEach((layer, layerIdx) => {
    if (!layer.visible) return;
    const grid = frameLayers[layerIdx];
    if (!grid) return;

    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = width;
    layerCanvas.height = height;
    const layerCtx = layerCanvas.getContext('2d');
    if (!layerCtx) return;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = grid[y]?.[x];
        if (color) {
          layerCtx.fillStyle = color;
          layerCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode || 'source-over';
    ctx.drawImage(layerCanvas, 0, 0);
    ctx.restore();
  });

  return canvas;
}

/**
 * Generates an exported sprite sheet canvas with nearest-neighbor upscaling
 */
export function generateSpriteSheetCanvas(
  frames: string[][][][],
  layers: Layer[],
  width: number,
  height: number,
  options: SpriteSheetOptions
): { canvas: HTMLCanvasElement; cols: number; rows: number; totalW: number; totalH: number } {
  const frameCount = frames.length;
  let cols = frameCount;
  let rows = 1;

  if (options.layout === 'auto') {
    cols = Math.ceil(Math.sqrt(frameCount));
    rows = Math.ceil(frameCount / cols);
  } else if (options.layout === 'horizontal') {
    cols = frameCount;
    rows = 1;
  } else if (options.layout === 'vertical') {
    cols = 1;
    rows = frameCount;
  }

  const frameW = width * options.scale;
  const frameH = height * options.scale;
  const pad = options.padding * options.scale;

  const totalW = cols * frameW + (cols + 1) * pad;
  const totalH = rows * frameH + (rows + 1) * pad;

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = totalW;
  sheetCanvas.height = totalH;
  const ctx = sheetCanvas.getContext('2d');
  if (!ctx) return { canvas: sheetCanvas, cols, rows, totalW, totalH };

  ctx.imageSmoothingEnabled = false;

  frames.forEach((frameLayers, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = pad + col * (frameW + pad);
    const y = pad + row * (frameH + pad);

    const frameCanvas = compositeFrameToCanvas(frameLayers, layers, width, height);
    ctx.drawImage(frameCanvas, 0, 0, width, height, x, y, frameW, frameH);
  });

  return { canvas: sheetCanvas, cols, rows, totalW, totalH };
}

/**
 * Trigger file download from data URI or Blob
 */
export function downloadFile(dataUrlOrBlob: string | Blob, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  if (typeof dataUrlOrBlob === 'string') {
    link.href = dataUrlOrBlob;
  } else {
    link.href = URL.createObjectURL(dataUrlOrBlob);
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates TexturePacker / Phaser 3 Atlas JSON
 */
export function generatePhaserAtlasJSON(
  framesCount: number,
  cols: number,
  width: number,
  height: number,
  scale: number,
  padding: number
): string {
  const frameW = width * scale;
  const frameH = height * scale;
  const pad = padding * scale;

  const framesData: Record<string, any> = {};

  for (let i = 0; i < framesCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = pad + col * (frameW + pad);
    const y = pad + row * (frameH + pad);

    framesData[`frame_${i}`] = {
      frame: { x, y, w: frameW, h: frameH },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
      sourceSize: { w: frameW, h: frameH },
      pivot: { x: 0.5, y: 0.5 }
    };
  }

  const output = {
    frames: framesData,
    meta: {
      app: "SpriteForge Pro",
      version: "1.0",
      image: "spritesheet.png",
      format: "RGBA8888",
      size: { w: cols * frameW, h: Math.ceil(framesCount / cols) * frameH },
      scale: `${scale}`
    }
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Generates Godot 4.x .tres SpriteFrames resource format
 */
export function generateGodotSpriteFrames(
  framesCount: number,
  fps: number
): string {
  let subresources = `[gd_resource type="SpriteFrames" load_steps=${framesCount + 2} format=3]\n\n`;
  subresources += `[ext_resource type="Texture2D" uid="uid://spriteforge" path="res://spritesheet.png" id="1_tex"]\n\n`;

  let frameRefs: string[] = [];
  for (let i = 0; i < framesCount; i++) {
    subresources += `[sub_resource type="AtlasTexture" id="AtlasTexture_${i}"]\n`;
    subresources += `atlas = ExtResource("1_tex")\n`;
    subresources += `region = Rect2(${i * 64}, 0, 64, 64)\n\n`;
    frameRefs.push(`SubResource("AtlasTexture_${i}")`);
  }

  subresources += `[resource]\nanimations = [{\n`;
  subresources += `"frames": [${frameRefs.join(', ')}],\n`;
  subresources += `"loop": true,\n`;
  subresources += `"name": &"default",\n`;
  subresources += `"speed": ${fps}.0\n`;
  subresources += `}]\n`;

  return subresources;
}

/**
 * Generates CSS Keyframes steps() animation snippet
 */
export function generateCSSKeyframes(
  framesCount: number,
  width: number,
  height: number,
  scale: number,
  fps: number
): string {
  const scaledW = width * scale;
  const scaledH = height * scale;
  const totalW = scaledW * framesCount;
  const duration = (framesCount / fps).toFixed(2);

  return `/* SpriteForge Pro CSS Sprite Animation */
.sprite-animation {
  width: ${scaledW}px;
  height: ${scaledH}px;
  background-image: url('spritesheet.png');
  background-repeat: no-repeat;
  image-rendering: pixelated;
  animation: sprite-play ${duration}s steps(${framesCount}) infinite;
}

@keyframes sprite-play {
  from {
    background-position: 0px 0px;
  }
  to {
    background-position: -${totalW}px 0px;
  }
}`;
}

/**
 * Record animated frames into a WebM video blob using MediaRecorder
 */
export async function exportAnimatedWebM(
  frames: string[][][][],
  layers: Layer[],
  width: number,
  height: number,
  scale: number,
  fps: number,
  loopCount: number = 3
): Promise<Blob> {
  const scaledW = width * scale;
  const scaledH = height * scale;

  const animCanvas = document.createElement('canvas');
  animCanvas.width = scaledW;
  animCanvas.height = scaledH;
  const ctx = animCanvas.getContext('2d');
  if (!ctx) throw new Error("Could not initialize 2D canvas context");
  ctx.imageSmoothingEnabled = false;

  const stream = animCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const frameIntervalMs = 1000 / fps;
  const totalCycles = loopCount;

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    recorder.start();

    let cycle = 0;
    let frameIdx = 0;

    const renderStep = () => {
      if (cycle >= totalCycles) {
        recorder.stop();
        return;
      }

      ctx.clearRect(0, 0, scaledW, scaledH);
      const frameCanvas = compositeFrameToCanvas(frames[frameIdx], layers, width, height);
      ctx.drawImage(frameCanvas, 0, 0, width, height, 0, 0, scaledW, scaledH);

      frameIdx++;
      if (frameIdx >= frames.length) {
        frameIdx = 0;
        cycle++;
      }

      setTimeout(renderStep, frameIntervalMs);
    };

    renderStep();
  });
}
