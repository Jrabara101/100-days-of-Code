import { aggregateRangeBuckets } from '../utils/bucketAggregate';
import { lttbFromRange } from '../utils/lttb';
import { getDataset, getDatasetBounds } from './dataStore';

function lowerBound(array, value) {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (array[mid] < value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function upperBound(array, value) {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (array[mid] <= value) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function clampQueryWindow(startTime, endTime, bounds) {
  const normalizedStart = Math.min(startTime, endTime);
  const normalizedEnd = Math.max(startTime, endTime);

  return {
    startTime: Math.max(bounds.startTime, normalizedStart),
    endTime: Math.min(bounds.endTime, normalizedEnd)
  };
}

export async function queryAggregatedSeries({
  startTime,
  endTime,
  resolutionPx,
  algorithm = 'lttb',
  includeEnvelope = false,
  latencyMs
}) {
  const dataset = getDataset();
  const bounds = getDatasetBounds();
  const windowRange = clampQueryWindow(startTime, endTime, bounds);

  if (windowRange.endTime <= windowRange.startTime) {
    return {
      points: [],
      envelope: [],
      meta: {
        sourceCount: 0,
        returnedCount: 0,
        bucketMs: 0,
        algorithm
      }
    };
  }

  const from = lowerBound(dataset.timestamps, windowRange.startTime);
  const to = upperBound(dataset.timestamps, windowRange.endTime);
  const sourceCount = Math.max(0, to - from);

  if (sourceCount === 0) {
    return {
      points: [],
      envelope: [],
      meta: {
        sourceCount,
        returnedCount: 0,
        bucketMs: 0,
        algorithm
      }
    };
  }

  const safeResolution = Math.max(16, Math.floor(resolutionPx || 1_024));
  const normalizedAlgorithm = algorithm === 'avg' || algorithm === 'minmax' ? algorithm : 'lttb';

  let points = [];
  let envelope = [];
  let bucketMs = 0;

  if (normalizedAlgorithm === 'avg') {
    const aggregated = aggregateRangeBuckets(
      dataset.timestamps,
      dataset.values,
      from,
      to,
      safeResolution,
      'avg',
      includeEnvelope
    );

    points = aggregated.points;
    envelope = includeEnvelope ? aggregated.envelope : [];
    bucketMs = aggregated.bucketMs;
  } else if (normalizedAlgorithm === 'minmax') {
    const bucketCount = Math.max(1, Math.floor(safeResolution / 2));
    const aggregated = aggregateRangeBuckets(
      dataset.timestamps,
      dataset.values,
      from,
      to,
      bucketCount,
      'minmax',
      true
    );

    points = aggregated.points;
    envelope = includeEnvelope ? aggregated.envelope : [];
    bucketMs = aggregated.bucketMs;
  } else {
    const threshold = Math.max(3, Math.min(sourceCount, safeResolution));
    points = lttbFromRange(dataset.timestamps, dataset.values, from, to, threshold);

    if (includeEnvelope) {
      const envelopeData = aggregateRangeBuckets(
        dataset.timestamps,
        dataset.values,
        from,
        to,
        Math.max(1, Math.floor(safeResolution / 2)),
        'avg',
        true
      );

      envelope = envelopeData.envelope;
      bucketMs = envelopeData.bucketMs;
    } else {
      bucketMs = Math.max(
        1,
        Math.round((windowRange.endTime - windowRange.startTime) / Math.max(1, points.length))
      );
    }
  }

  const payload = {
    points,
    envelope,
    meta: {
      sourceCount,
      returnedCount: points.length,
      bucketMs,
      algorithm: normalizedAlgorithm
    }
  };

  const delay = latencyMs ?? 20 + Math.floor(Math.random() * 41);
  if (delay <= 0) {
    return payload;
  }

  return new Promise((resolve) => {
    setTimeout(() => resolve(payload), delay);
  });
}
