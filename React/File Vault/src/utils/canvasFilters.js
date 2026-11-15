/**
 * Canvas Image Processing & Enhancement Filters
 * Used in Document Scanner and Document Crop & OCR Review
 */

export function applyDocumentFilter(canvas, filterMode, rotationAngle = 0, isDeskew = false) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Pixel manipulation
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Standard perceptual luminance
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    if (filterMode === 'bw') {
      // Clean B&W threshold
      const threshold = 135;
      const val = gray > threshold ? 255 : 20;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    } else if (filterMode === 'grayscale') {
      // Grayscale Pro with subtle S-curve contrast boost
      let adjusted = gray;
      if (adjusted < 128) {
        adjusted = Math.max(0, adjusted - 15);
      } else {
        adjusted = Math.min(255, adjusted + 15);
      }
      data[i] = adjusted;
      data[i + 1] = adjusted;
      data[i + 2] = adjusted;
    } else if (filterMode === 'color') {
      // True Color - slight contrast boost
      data[i] = Math.min(255, Math.max(0, (r - 128) * 1.1 + 128));
      data[i + 1] = Math.min(255, Math.max(0, (g - 128) * 1.1 + 128));
      data[i + 2] = Math.min(255, Math.max(0, (b - 128) * 1.1 + 128));
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

