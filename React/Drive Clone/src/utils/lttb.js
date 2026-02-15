function toPoint(timestamps, values, globalIndex) {
  return {
    ts: timestamps[globalIndex],
    value: values[globalIndex]
  };
}

export function rangeToPoints(timestamps, values, startIndex, endIndex) {
  const from = Math.max(0, Math.floor(startIndex));
  const to = Math.min(timestamps.length, Math.floor(endIndex));

  if (from >= to) {
    return [];
  }

  const output = [];
  for (let index = from; index < to; index += 1) {
    output.push(toPoint(timestamps, values, index));
  }

  return output;
}

export function lttbFromRange(timestamps, values, startIndex, endIndex, threshold) {
  const from = Math.max(0, Math.floor(startIndex));
  const to = Math.min(timestamps.length, Math.floor(endIndex));

  if (from >= to) {
    return [];
  }

  const rangeLength = to - from;
  const safeThreshold = Math.max(0, Math.floor(threshold));

  if (safeThreshold <= 0 || safeThreshold >= rangeLength) {
    return rangeToPoints(timestamps, values, from, to);
  }

  if (safeThreshold === 1) {
    return [toPoint(timestamps, values, from)];
  }

  if (safeThreshold === 2) {
    return [toPoint(timestamps, values, from), toPoint(timestamps, values, to - 1)];
  }

  const localLastIndex = rangeLength - 1;
  const every = (rangeLength - 2) / (safeThreshold - 2);

  const sampledLocalIndices = [0];
  let a = 0;

  for (let bucket = 0; bucket < safeThreshold - 2; bucket += 1) {
    let avgRangeStart = Math.floor((bucket + 1) * every) + 1;
    let avgRangeEnd = Math.floor((bucket + 2) * every) + 1;

    if (avgRangeEnd > rangeLength) {
      avgRangeEnd = rangeLength;
    }

    let avgX = 0;
    let avgY = 0;

    if (avgRangeEnd <= avgRangeStart) {
      const fallbackLocalIndex = Math.max(0, Math.min(localLastIndex, avgRangeStart - 1));
      const fallbackGlobalIndex = from + fallbackLocalIndex;
      avgX = timestamps[fallbackGlobalIndex];
      avgY = values[fallbackGlobalIndex];
    } else {
      const avgRangeLength = avgRangeEnd - avgRangeStart;
      for (let index = avgRangeStart; index < avgRangeEnd; index += 1) {
        const globalIndex = from + index;
        avgX += timestamps[globalIndex];
        avgY += values[globalIndex];
      }

      avgX /= avgRangeLength;
      avgY /= avgRangeLength;
    }

    let rangeStart = Math.floor(bucket * every) + 1;
    let rangeEnd = Math.floor((bucket + 1) * every) + 1;

    if (rangeStart > localLastIndex - 1) {
      rangeStart = localLastIndex - 1;
    }

    if (rangeEnd > localLastIndex) {
      rangeEnd = localLastIndex;
    }

    rangeEnd = Math.max(rangeStart + 1, rangeEnd);

    const aGlobal = from + a;
    const ax = timestamps[aGlobal];
    const ay = values[aGlobal];

    let maxArea = -1;
    let nextA = rangeStart;

    for (let index = rangeStart; index < rangeEnd; index += 1) {
      const globalIndex = from + index;
      const area = Math.abs(
        (ax - avgX) * (values[globalIndex] - ay) -
          (ax - timestamps[globalIndex]) * (avgY - ay)
      );

      if (area > maxArea) {
        maxArea = area;
        nextA = index;
      }
    }

    sampledLocalIndices.push(nextA);
    a = nextA;
  }

  sampledLocalIndices.push(localLastIndex);

  return sampledLocalIndices.map((localIndex) =>
    toPoint(timestamps, values, from + localIndex)
  );
}
