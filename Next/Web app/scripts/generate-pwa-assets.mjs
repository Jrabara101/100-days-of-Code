import { PNG } from "pngjs";
import fs from "fs";
import path from "path";

const root = process.cwd();
const iconsDir = path.join(root, "public", "icons");
const splashDir = path.join(root, "public", "splash");

const base = [37, 99, 235, 255];
const accent = [255, 255, 255, 255];

const fill = (png, color) => {
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = color[3];
    }
  }
};

const drawRect = (png, x, y, w, h, color) => {
  for (let yPos = y; yPos < y + h; yPos++) {
    for (let xPos = x; xPos < x + w; xPos++) {
      if (xPos < 0 || yPos < 0 || xPos >= png.width || yPos >= png.height) continue;
      const idx = (png.width * yPos + xPos) << 2;
      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = color[3];
    }
  }
};

const createImage = (width, height) => {
  const png = new PNG({ width, height });
  fill(png, base);

  const size = Math.floor(Math.min(width, height) * 0.45);
  const startX = Math.floor((width - size) / 2);
  const startY = Math.floor((height - size) / 2);
  drawRect(png, startX, startY, size, size, accent);

  const inner = Math.floor(size * 0.5);
  const innerStartX = startX + Math.floor((size - inner) / 2);
  const innerStartY = startY + Math.floor((size - inner) / 2);
  drawRect(png, innerStartX, innerStartY, inner, inner, base);

  return png;
};

const writePng = async (png, filePath) => {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    png.pack().pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

const icons = [48, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const splashes = [
  [640, 1136],
  [750, 1334],
  [828, 1792],
  [1125, 2436],
  [1242, 2688],
  [1536, 2048],
  [1668, 2224],
  [1668, 2388],
  [2048, 2732]
];

for (const size of icons) {
  const png = createImage(size, size);
  await writePng(png, path.join(iconsDir, `icon-${size}x${size}.png`));
}

for (const [width, height] of splashes) {
  const png = createImage(width, height);
  await writePng(png, path.join(splashDir, `apple-splash-${width}x${height}.png`));
}

console.log("PWA assets generated.");