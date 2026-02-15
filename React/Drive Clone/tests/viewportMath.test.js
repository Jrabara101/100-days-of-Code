import { describe, expect, it } from 'vitest';
import { clampWindow, panWindowByRatio, zoomWindowAt } from '../src/utils/viewportMath';

const bounds = {
  startTime: 1_000,
  endTime: 101_000
};

describe('viewportMath', () => {
  it('clamps windows to bounds and min span', () => {
    const windowRange = clampWindow(
      { startTime: -50_000, endTime: 1_200 },
      bounds,
      10_000
    );

    expect(windowRange.startTime).toBe(bounds.startTime);
    expect(windowRange.endTime - windowRange.startTime).toBeGreaterThanOrEqual(10_000);
  });

  it('zooms around anchor and stays bounded', () => {
    const startWindow = { startTime: 20_000, endTime: 80_000 };
    const anchorTime = 50_000;

    const zoomed = zoomWindowAt(startWindow, { anchorTime, zoomFactor: 0.5 }, bounds, 5_000);

    expect(zoomed.endTime - zoomed.startTime).toBeLessThan(60_000);
    expect(zoomed.startTime).toBeGreaterThanOrEqual(bounds.startTime);
    expect(zoomed.endTime).toBeLessThanOrEqual(bounds.endTime);
  });

  it('pans by ratio and clamps on boundaries', () => {
    const startWindow = { startTime: 40_000, endTime: 70_000 };
    const panned = panWindowByRatio(startWindow, 2, bounds, 5_000);

    expect(panned.endTime).toBe(bounds.endTime);
    expect(panned.endTime - panned.startTime).toBe(30_000);
  });
});
