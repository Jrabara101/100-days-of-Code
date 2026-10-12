export interface DetectedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Heuristic auto-slice algorithm:
 * Analyzes alpha channel transparency margins to auto-detect frame boundaries
 * and connected non-transparent pixel islands.
 */
export function detectSpriteIslands(
  image: HTMLImageElement,
  alphaThreshold: number = 15,
  minSize: number = 8,
  padding: number = 0
): DetectedRect[] {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imgData;

  const visited = new Uint8Array(width * height);
  const islands: DetectedRect[] = [];

  // Breadth-first search / queue-based island detection
  const queue = new Int32Array(width * height * 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;

      const alpha = data[idx * 4 + 3];
      if (alpha < alphaThreshold) {
        visited[idx] = 1;
        continue;
      }

      // Found an unvisited non-transparent pixel! Expand island
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;

      let head = 0;
      let tail = 0;
      queue[tail++] = x;
      queue[tail++] = y;
      visited[idx] = 1;

      while (head < tail) {
        const cx = queue[head++];
        const cy = queue[head++];

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // Check 8-connected neighbors
        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
          [cx + 1, cy + 1],
          [cx - 1, cy - 1],
          [cx + 1, cy - 1],
          [cx - 1, cy + 1],
        ];

        for (let i = 0; i < neighbors.length; i++) {
          const nx = neighbors[i][0];
          const ny = neighbors[i][1];

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (!visited[nIdx]) {
              const nAlpha = data[nIdx * 4 + 3];
              if (nAlpha >= alphaThreshold) {
                visited[nIdx] = 1;
                queue[tail++] = nx;
                queue[tail++] = ny;
              } else {
                visited[nIdx] = 1; // Mark transparent visited to avoid re-checking
              }
            }
          }
        }
      }

      const rectWidth = maxX - minX + 1;
      const rectHeight = maxY - minY + 1;

      // Filter out small noise
      if (rectWidth >= minSize && rectHeight >= minSize) {
        const pX = Math.max(0, minX - padding);
        const pY = Math.max(0, minY - padding);
        const pW = Math.min(width - pX, rectWidth + padding * 2);
        const pH = Math.min(height - pY, rectHeight + padding * 2);

        islands.push({
          x: pX,
          y: pY,
          width: pW,
          height: pH,
        });
      }
    }
  }

  // Sort islands logically: top-to-bottom, left-to-right (with row tolerance)
  islands.sort((a, b) => {
    const rowDiff = Math.abs(a.y - b.y);
    // If within similar vertical height row, sort by X
    if (rowDiff < Math.min(a.height, b.height) * 0.5) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  return islands;
}
