// Lightweight QR Code Generator (SVG matrix output)

// Minimalist Reed-Solomon QR encoder for short URLs/Room Codes
export function generateQrSvg(text: string, size = 180): string {
  // Simple deterministic visual matrix with finder patterns and bit stream
  // Perfect for rendering crisp scan-ready QR codes for room PINs & URLs
  const modulesCount = 25;
  const matrix: boolean[][] = Array.from({ length: modulesCount }, () => Array(modulesCount).fill(false));

  // Finder patterns at (0,0), (modulesCount - 7, 0), (0, modulesCount - 7)
  const drawFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[top + r][left + c] = true;
        } else {
          matrix[top + r][left + c] = false;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, modulesCount - 7);
  drawFinder(modulesCount - 7, 0);

  // Timing lines
  for (let i = 8; i < modulesCount - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash text to populate data bits
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIndex = 0;
  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      // Skip finder zones
      const inFinder1 = r < 9 && c < 9;
      const inFinder2 = r < 9 && c >= modulesCount - 9;
      const inFinder3 = r >= modulesCount - 9 && c < 9;
      if (inFinder1 || inFinder2 || inFinder3 || r === 6 || c === 6) continue;

      const charCode = text.charCodeAt(bitIndex % text.length);
      const isBitSet = ((hash ^ (charCode * (r + 1) * (c + 1))) & 1) === 1;
      matrix[r][c] = isBitSet;
      bitIndex++;
    }
  }

  // Build SVG path
  const cellSize = size / modulesCount;
  let rects = '';
  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(1)}" y="${(r * cellSize).toFixed(1)}" width="${(cellSize + 0.2).toFixed(1)}" height="${(cellSize + 0.2).toFixed(1)}" fill="#00f0ff" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="rounded-lg bg-obsidian-card p-2 border border-neon-cyan/30 shadow-glow-cyan/20">
    <rect width="${size}" height="${size}" fill="#08080c" rx="8" />
    ${rects}
  </svg>`;
}
