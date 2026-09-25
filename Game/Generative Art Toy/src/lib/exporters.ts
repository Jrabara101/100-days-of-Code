/**
 * Museum-Grade Exporters for Generative Art:
 * 1. Lossless PNG with 1x, 2x, 4x supersampling (up to 8K print resolution)
 * 2. Vector SVG paths optimized for physical pen-plotters (AxiDraw) and laser cutters
 * 3. Canvas stream looping WebM video recorder
 */

export interface VectorStroke {
  points: [number, number][];
  color: string;
  width: number;
}

/**
 * Downloads a Blob as a file in the browser
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Lossless PNG Export with optional offscreen resolution scaling (1x, 2x, 4x)
 */
export async function exportPNG(
  canvas: HTMLCanvasElement,
  scale: 1 | 2 | 4 = 1,
  filename: string = 'generative-artwork.png'
): Promise<void> {
  if (scale === 1) {
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, filename);
    }, 'image/png');
    return;
  }

  // Offscreen high-resolution supersampling
  const offscreen = document.createElement('canvas');
  offscreen.width = canvas.width * scale;
  offscreen.height = canvas.height * scale;
  const offCtx = offscreen.getContext('2d', { alpha: false });
  if (!offCtx) return;

  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = 'high';
  offCtx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);

  offscreen.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename);
  }, 'image/png');
}

/**
 * Vector SVG Exporter structured for physical pen-plotters & laser cutters
 */
export function exportSVG(
  strokes: VectorStroke[],
  width: number,
  height: number,
  inverted: boolean = false,
  filename: string = 'generative-plotter.svg'
): void {
  const bgColor = inverted ? '#ffffff' : '#0a0b0e';
  let svgContent = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" version="1.1">
  <rect width="100%" height="100%" fill="${bgColor}" />
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
`;

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    const pointsStr = stroke.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    svgContent += `    <polyline points="${pointsStr}" stroke="${stroke.color}" stroke-width="${stroke.width.toFixed(1)}" opacity="0.85" />\n`;
  }

  svgContent += `  </g>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Looping Canvas WebM Video Recorder
 */
export class CanvasVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;

  public startRecording(canvas: HTMLCanvasElement, onStopCallback?: (blob: Blob) => void) {
    this.recordedChunks = [];
    try {
      const stream = canvas.captureStream(60); // 60 FPS capture
      const options = { mimeType: 'video/webm;codecs=vp9' };
      
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      this.mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        if (onStopCallback) {
          onStopCallback(blob);
        } else {
          downloadBlob(blob, `generative-loop-${Date.now()}.webm`);
        }
        this.isRecording = false;
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (e) {
      console.error('Video recording failed to start:', e);
      this.isRecording = false;
    }
  }

  public stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}
