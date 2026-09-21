/**
 * Bresenham's Line Algorithm
 * Returns an array of {x, y} points connecting (x0, y0) to (x1, y1)
 */
export function getLinePixels(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let currX = x0;
  let currY = y0;

  while (true) {
    points.push({ x: currX, y: currY });
    if (currX === x1 && currY === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      currX += sx;
    }
    if (e2 < dx) {
      err += dx;
      currY += sy;
    }
  }

  return points;
}

/**
 * Brush Stamp Generator
 * Returns an array of relative coordinates for a given brush size (1, 2, 3, 4)
 */
export function getBrushOffsets(size: number): { dx: number; dy: number }[] {
  if (size <= 1) return [{ dx: 0, dy: 0 }];
  
  const offsets: { dx: number; dy: number }[] = [];
  const radius = size / 2;
  const min = -Math.floor((size - 1) / 2);
  const max = Math.ceil((size - 1) / 2);

  for (let dy = min; dy <= max; dy++) {
    for (let dx = min; dx <= max; dx++) {
      // Circle shape for brush > 2, square for 2
      if (size === 2 || (dx * dx + dy * dy <= radius * radius + 0.5)) {
        offsets.push({ dx, dy });
      }
    }
  }
  return offsets.length > 0 ? offsets : [{ dx: 0, dy: 0 }];
}

/**
 * 4-Way BFS Flood Fill
 * Mutates grid in-place and fills matching target color with fillColor
 */
export function floodFill(
  grid: string[][],
  startX: number,
  startY: number,
  fillColor: string,
  width: number,
  height: number
): boolean {
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return false;
  const targetColor = grid[startY][startX];
  if (targetColor === fillColor) return false;

  const queue: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(width * height);
  visited[startY * width + startX] = 1;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    grid[y][x] = fillColor;

    // 4 neighbors: Up, Down, Left, Right
    const neighbors: [number, number][] = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = ny * width + nx;
        if (!visited[idx] && grid[ny][nx] === targetColor) {
          visited[idx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  return true;
}

/**
 * Pixel-Perfect Stroke Filter
 * Cleans up extra L-corner pixels when drawing continuous pixel art lines
 */
export function filterPixelPerfect(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return points;
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i < points.length; i++) {
    if (i > 0 && i < points.length - 1) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      // If p1 shares an edge with p0 and p2 and forms an L corner where p0 and p2 are diagonal
      const dx0 = Math.abs(p1.x - p0.x);
      const dy0 = Math.abs(p1.y - p0.y);
      const dx1 = Math.abs(p2.x - p1.x);
      const dy1 = Math.abs(p2.y - p1.y);

      if ((dx0 + dy0 === 1) && (dx1 + dy1 === 1)) {
        if (Math.abs(p2.x - p0.x) === 1 && Math.abs(p2.y - p0.y) === 1) {
          // Skip the intermediate corner pixel
          continue;
        }
      }
    }
    result.push(points[i]);
  }
  return result;
}
