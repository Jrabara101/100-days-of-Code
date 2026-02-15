import { describe, expect, it } from 'vitest';
import { lttbFromRange } from '../src/utils/lttb';

function makeSeries(count) {
  const timestamps = new Float64Array(count);
  const values = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    timestamps[index] = index * 1_000;
    values[index] = Math.sin(index / 12) * 10 + index * 0.01;
  }

  return { timestamps, values };
}

describe('lttbFromRange', () => {
  it('respects threshold and keeps first/last point', () => {
    const { timestamps, values } = makeSeries(10_000);
    const downsampled = lttbFromRange(timestamps, values, 0, timestamps.length, 750);

    expect(downsampled).toHaveLength(750);
    expect(downsampled[0].ts).toBe(timestamps[0]);
    expect(downsampled[0].value).toBe(values[0]);
    expect(downsampled[downsampled.length - 1].ts).toBe(timestamps[timestamps.length - 1]);
    expect(downsampled[downsampled.length - 1].value).toBe(values[values.length - 1]);
  });

  it('returns original range when threshold exceeds range length', () => {
    const { timestamps, values } = makeSeries(500);
    const downsampled = lttbFromRange(timestamps, values, 0, timestamps.length, 1_000);

    expect(downsampled).toHaveLength(timestamps.length);
  });
});
