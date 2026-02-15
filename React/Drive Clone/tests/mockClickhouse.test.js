import { describe, expect, it } from 'vitest';
import { getDatasetBounds } from '../src/services/dataStore';
import { queryAggregatedSeries } from '../src/services/mockClickhouse';

describe('queryAggregatedSeries', () => {
  const bounds = getDatasetBounds();

  it('returns window-constrained points for lttb', async () => {
    const startTime = bounds.startTime + 2 * 60 * 60 * 1_000;
    const endTime = startTime + 3 * 60 * 60 * 1_000;

    const result = await queryAggregatedSeries({
      startTime,
      endTime,
      resolutionPx: 600,
      algorithm: 'lttb',
      includeEnvelope: true,
      latencyMs: 0
    });

    expect(result.points.length).toBeGreaterThan(0);
    expect(result.points[0].ts).toBeGreaterThanOrEqual(startTime);
    expect(result.points[result.points.length - 1].ts).toBeLessThanOrEqual(endTime);
    expect(result.meta.sourceCount).toBeGreaterThan(result.meta.returnedCount);
    expect(result.envelope.length).toBeGreaterThan(0);
  });

  it('supports minmax and avg aggregations', async () => {
    const startTime = bounds.startTime + 8 * 60 * 60 * 1_000;
    const endTime = startTime + 6 * 60 * 60 * 1_000;

    const minmax = await queryAggregatedSeries({
      startTime,
      endTime,
      resolutionPx: 450,
      algorithm: 'minmax',
      includeEnvelope: true,
      latencyMs: 0
    });

    const avg = await queryAggregatedSeries({
      startTime,
      endTime,
      resolutionPx: 450,
      algorithm: 'avg',
      includeEnvelope: false,
      latencyMs: 0
    });

    expect(minmax.points.length).toBeGreaterThan(0);
    expect(minmax.points.length).toBeLessThanOrEqual(900);
    expect(minmax.envelope.length).toBeGreaterThan(0);

    expect(avg.points.length).toBeGreaterThan(0);
    expect(avg.points.length).toBeLessThanOrEqual(450);
    expect(avg.envelope.length).toBe(0);
  });
});
