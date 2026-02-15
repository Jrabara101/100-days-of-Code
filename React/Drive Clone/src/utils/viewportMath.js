export function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeWindow(windowRange) {
  const startTime = Number(windowRange?.startTime ?? 0);
  const endTime = Number(windowRange?.endTime ?? 0);
  if (startTime <= endTime) {
    return { startTime, endTime };
  }
  return { startTime: endTime, endTime: startTime };
}

export function clampWindow(windowRange, bounds, minSpanMs = 30_000, maxSpanMs) {
  const normalizedBounds = normalizeWindow(bounds);
  const totalSpan = normalizedBounds.endTime - normalizedBounds.startTime;

  if (totalSpan <= 0) {
    return normalizedBounds;
  }

  const boundedMinSpan = clampValue(minSpanMs, 1, totalSpan);
  const boundedMaxSpan = clampValue(
    maxSpanMs ?? totalSpan,
    boundedMinSpan,
    totalSpan
  );

  let { startTime, endTime } = normalizeWindow(windowRange);
  let span = endTime - startTime;

  if (span < boundedMinSpan) {
    endTime = startTime + boundedMinSpan;
    span = boundedMinSpan;
  }

  if (span > boundedMaxSpan) {
    endTime = startTime + boundedMaxSpan;
    span = boundedMaxSpan;
  }

  if (startTime < normalizedBounds.startTime) {
    startTime = normalizedBounds.startTime;
    endTime = startTime + span;
  }

  if (endTime > normalizedBounds.endTime) {
    endTime = normalizedBounds.endTime;
    startTime = endTime - span;
  }

  if (startTime < normalizedBounds.startTime) {
    startTime = normalizedBounds.startTime;
  }

  if (endTime > normalizedBounds.endTime) {
    endTime = normalizedBounds.endTime;
  }

  if (endTime - startTime < boundedMinSpan) {
    startTime = normalizedBounds.endTime - boundedMinSpan;
    endTime = normalizedBounds.endTime;
  }

  return {
    startTime: Math.round(startTime),
    endTime: Math.round(endTime)
  };
}

export function zoomWindowAt(
  windowRange,
  { anchorTime, zoomFactor },
  bounds,
  minSpanMs = 30_000,
  maxSpanMs
) {
  const normalized = normalizeWindow(windowRange);
  const span = normalized.endTime - normalized.startTime;
  const safeSpan = Math.max(1, span);
  const boundedZoomFactor = clampValue(Number(zoomFactor) || 1, 0.2, 5);
  const targetSpan = safeSpan * boundedZoomFactor;

  const anchorRatio = clampValue(
    (Number(anchorTime) - normalized.startTime) / safeSpan,
    0,
    1
  );

  const nextStart = Number(anchorTime) - targetSpan * anchorRatio;
  const nextEnd = nextStart + targetSpan;

  return clampWindow(
    { startTime: nextStart, endTime: nextEnd },
    bounds,
    minSpanMs,
    maxSpanMs
  );
}

export function panWindowByRatio(
  windowRange,
  deltaRatio,
  bounds,
  minSpanMs = 30_000,
  maxSpanMs
) {
  const normalized = normalizeWindow(windowRange);
  const span = normalized.endTime - normalized.startTime;
  const deltaMs = span * (Number(deltaRatio) || 0);

  return clampWindow(
    {
      startTime: normalized.startTime + deltaMs,
      endTime: normalized.endTime + deltaMs
    },
    bounds,
    minSpanMs,
    maxSpanMs
  );
}
