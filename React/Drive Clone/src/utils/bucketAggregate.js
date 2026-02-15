function initBucket(ts, value) {
  return {
    count: 1,
    sum: value,
    min: value,
    max: value,
    minTs: ts,
    maxTs: ts,
    firstTs: ts,
    lastTs: ts
  };
}

function updateBucket(bucket, ts, value) {
  bucket.count += 1;
  bucket.sum += value;
  bucket.lastTs = ts;

  if (value < bucket.min) {
    bucket.min = value;
    bucket.minTs = ts;
  }

  if (value > bucket.max) {
    bucket.max = value;
    bucket.maxTs = ts;
  }
}

export function aggregateRangeBuckets(
  timestamps,
  values,
  startIndex,
  endIndex,
  bucketCount,
  mode = 'avg',
  includeEnvelope = false
) {
  const from = Math.max(0, Math.floor(startIndex));
  const to = Math.min(timestamps.length, Math.floor(endIndex));

  if (from >= to) {
    return {
      points: [],
      envelope: [],
      bucketMs: 0
    };
  }

  const safeBucketCount = Math.max(1, Math.floor(bucketCount));
  const firstTs = timestamps[from];
  const lastTs = timestamps[to - 1];
  const spanMs = Math.max(1, lastTs - firstTs + 1);
  const bucketMs = Math.max(1, Math.ceil(spanMs / safeBucketCount));

  const buckets = new Array(safeBucketCount);

  for (let index = from; index < to; index += 1) {
    const ts = timestamps[index];
    const value = values[index];
    const bucketIndex = Math.min(
      safeBucketCount - 1,
      Math.floor((ts - firstTs) / bucketMs)
    );

    if (!buckets[bucketIndex]) {
      buckets[bucketIndex] = initBucket(ts, value);
      continue;
    }

    updateBucket(buckets[bucketIndex], ts, value);
  }

  const points = [];
  const envelope = [];

  for (const bucket of buckets) {
    if (!bucket) {
      continue;
    }

    const midpointTs = Math.round((bucket.firstTs + bucket.lastTs) / 2);

    if (mode === 'minmax') {
      if (bucket.minTs <= bucket.maxTs) {
        points.push({ ts: bucket.minTs, value: bucket.min });
        if (bucket.maxTs !== bucket.minTs || bucket.max !== bucket.min) {
          points.push({ ts: bucket.maxTs, value: bucket.max });
        }
      } else {
        points.push({ ts: bucket.maxTs, value: bucket.max });
        if (bucket.maxTs !== bucket.minTs || bucket.max !== bucket.min) {
          points.push({ ts: bucket.minTs, value: bucket.min });
        }
      }
    } else {
      points.push({ ts: midpointTs, value: bucket.sum / bucket.count });
    }

    if (includeEnvelope) {
      envelope.push({ ts: midpointTs, min: bucket.min, max: bucket.max });
    }
  }

  return {
    points,
    envelope,
    bucketMs
  };
}
