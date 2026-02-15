import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getDatasetBounds } from '../services/dataStore';
import { queryAggregatedSeries } from '../services/mockClickhouse';
import { clampWindow, panWindowByRatio, zoomWindowAt } from '../utils/viewportMath';

const DEFAULT_MIN_WINDOW_MS = 30_000;

function getDpr() {
  if (typeof window === 'undefined') {
    return 1;
  }

  return Math.max(1, window.devicePixelRatio || 1);
}

export function useDataWindow({
  initialWindow,
  widthPx,
  fetcher = queryAggregatedSeries,
  algorithm = 'lttb',
  maxPointsPerPx = 1,
  debounceMs = 45,
  minWindowMs = DEFAULT_MIN_WINDOW_MS
} = {}) {
  const bounds = useMemo(() => getDatasetBounds(), []);
  const maxWindowMs = bounds.endTime - bounds.startTime;

  const initialRef = useRef(
    clampWindow(initialWindow ?? bounds, bounds, minWindowMs, maxWindowMs)
  );

  const [windowRange, setWindowRange] = useState(initialRef.current);
  const [data, setData] = useState([]);
  const [envelope, setEnvelope] = useState([]);
  const [meta, setMeta] = useState({
    sourceCount: 0,
    returnedCount: 0,
    bucketMs: 0,
    algorithm
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map());

  const setWindow = useCallback(
    (nextWindow) => {
      setWindowRange((previous) => {
        const candidate =
          typeof nextWindow === 'function' ? nextWindow(previous) : nextWindow;

        return clampWindow(candidate, bounds, minWindowMs, maxWindowMs);
      });
    },
    [bounds, maxWindowMs, minWindowMs]
  );

  const resetWindow = useCallback(() => {
    setWindowRange(initialRef.current);
  }, []);

  const applyBrush = useCallback(
    (startTime, endTime) => {
      setWindow({ startTime, endTime });
    },
    [setWindow]
  );

  const zoomAt = useCallback(
    ({ anchorTime, zoomFactor }) => {
      setWindow((currentWindow) =>
        zoomWindowAt(
          currentWindow,
          { anchorTime, zoomFactor },
          bounds,
          minWindowMs,
          maxWindowMs
        )
      );
    },
    [bounds, maxWindowMs, minWindowMs, setWindow]
  );

  const panByRatio = useCallback(
    (deltaRatio) => {
      setWindow((currentWindow) =>
        panWindowByRatio(
          currentWindow,
          deltaRatio,
          bounds,
          minWindowMs,
          maxWindowMs
        )
      );
    },
    [bounds, maxWindowMs, minWindowMs, setWindow]
  );

  useEffect(() => {
    const safeWidth = Math.max(0, Math.floor(widthPx || 0));
    const currentRequestId = ++requestIdRef.current;

    if (safeWidth <= 0) {
      return undefined;
    }

    const resolutionPx = Math.max(
      16,
      Math.floor(safeWidth * getDpr() * Math.max(0.25, maxPointsPerPx))
    );

    const cacheKey = [
      windowRange.startTime,
      windowRange.endTime,
      resolutionPx,
      algorithm
    ].join(':');

    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setData(cached.points);
      setEnvelope(cached.envelope);
      setMeta(cached.meta);
      setStatus('success');
      setError(null);
      return undefined;
    }

    setStatus('loading');

    const timeoutId = setTimeout(async () => {
      try {
        const result = await fetcher({
          startTime: windowRange.startTime,
          endTime: windowRange.endTime,
          resolutionPx,
          algorithm,
          includeEnvelope: true
        });

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        cacheRef.current.set(cacheKey, result);
        if (cacheRef.current.size > 60) {
          const oldest = cacheRef.current.keys().next().value;
          cacheRef.current.delete(oldest);
        }

        setData(result.points);
        setEnvelope(result.envelope ?? []);
        setMeta(result.meta);
        setStatus('success');
        setError(null);
      } catch (fetchError) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setStatus('error');
        setError(
          fetchError instanceof Error ? fetchError : new Error(String(fetchError))
        );
      }
    }, Math.max(0, debounceMs));

    return () => clearTimeout(timeoutId);
  }, [
    algorithm,
    debounceMs,
    fetcher,
    maxPointsPerPx,
    widthPx,
    windowRange.endTime,
    windowRange.startTime
  ]);

  return {
    data,
    envelope,
    meta,
    status,
    error,
    window: windowRange,
    setWindow,
    resetWindow,
    applyBrush,
    zoomAt,
    panByRatio
  };
}
