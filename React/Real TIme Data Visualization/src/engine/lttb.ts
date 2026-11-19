import { TelemetryPoint } from '../types/telemetry';

/**
 * Largest-Triangle-Three-Buckets (LTTB) downsampling algorithm
 * Preserves visual peaks, valleys, and structural shape for locked 60fps rendering.
 */
export function downsampleLTTB(data: TelemetryPoint[], threshold: number): TelemetryPoint[] {
  if (threshold >= data.length || threshold <= 0) {
    return data;
  }

  const sampled: TelemetryPoint[] = [];
  const every = (data.length - 2) / (threshold - 2);

  let a = 0; // Initially always the first point in the data
  sampled.push(data[a]);

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket (boundary c)
    let avgX = 0;
    let avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * every) + 1, data.length);
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    if (avgRangeLength > 0) {
      for (let j = avgRangeStart; j < avgRangeEnd; j++) {
        avgX += data[j].timestamp;
        avgY += data[j].value;
      }
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;
    } else {
      const fallbackIdx = Math.min(avgRangeStart, data.length - 1);
      avgX = data[fallbackIdx].timestamp;
      avgY = data[fallbackIdx].value;
    }

    // Get the range for this bucket
    const rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * every) + 1, data.length);

    // Point a
    const pointAX = data[a].timestamp;
    const pointAY = data[a].value;

    let maxArea = -1;
    let maxAreaPoint = data[rangeOffs];
    let nextA = rangeOffs;

    for (let j = rangeOffs; j < rangeTo; j++) {
      // Calculate triangle area over three points: Point A, candidate Point B, average Point C
      const area = Math.abs(
        (pointAX - avgX) * (data[j].value - pointAY) -
        (pointAX - data[j].timestamp) * (avgY - pointAY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = data[j];
        nextA = j;
      }
    }

    sampled.push(maxAreaPoint);
    a = nextA; // This selected point becomes Point A in the next bucket
  }

  // Always append the last point
  sampled.push(data[data.length - 1]);

  return sampled;
}
