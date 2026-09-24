import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { SpatialBounds, WorkerLayoutPayload, WorkerLayoutResponse } from '../types/gallery';

interface UseMasonryWorkerProps {
  items: Array<{ id: string; width: number; height: number }>;
  containerWidth: number;
  columnCount: number;
  gutter?: number;
  scrollTop: number;
  viewportHeight: number;
  bufferZone?: number;
}

export function useMasonryWorker({
  items,
  containerWidth,
  columnCount,
  gutter = 16,
  scrollTop,
  viewportHeight,
  bufferZone = 400,
}: UseMasonryWorkerProps) {
  const workerRef = useRef<Worker | null>(null);
  const [bounds, setBounds] = useState<Record<string, SpatialBounds>>({});
  const [totalHeight, setTotalHeight] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Initialize Web Worker
  useEffect(() => {
    try {
      const worker = new Worker(
        new URL('../workers/layout.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event: MessageEvent<WorkerLayoutResponse>) => {
        const { bounds: calculatedBounds, totalHeight: calculatedHeight } = event.data;
        setBounds(calculatedBounds);
        setTotalHeight(calculatedHeight);
        setIsCalculating(false);
      };

      worker.onerror = (err) => {
        console.error('Masonry worker error:', err);
        setIsCalculating(false);
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
      };
    } catch (e) {
      console.warn('Web Workers unavailable, using synchronous fallback:', e);
    }
  }, []);

  // Post layout job to worker when dependencies change
  useEffect(() => {
    if (containerWidth <= 0 || items.length === 0) {
      setBounds({});
      setTotalHeight(0);
      return;
    }

    setIsCalculating(true);

    const payload: WorkerLayoutPayload = {
      items: items.map((it) => ({ id: it.id, width: it.width, height: it.height })),
      containerWidth,
      columnCount,
      gutter,
    };

    if (workerRef.current) {
      workerRef.current.postMessage(payload);
    } else {
      // Synchronous fallback if worker failed to instantiate
      const validCols = Math.max(1, columnCount);
      const colWidth = Math.max(100, (containerWidth - (validCols - 1) * gutter) / validCols);
      const colHeights = new Array(validCols).fill(0);
      const fallbackBounds: Record<string, SpatialBounds> = {};

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        let minCol = 0;
        let minH = colHeights[0];
        for (let c = 1; c < validCols; c++) {
          if (colHeights[c] < minH) {
            minH = colHeights[c];
            minCol = c;
          }
        }
        const aspect = it.height > 0 && it.width > 0 ? it.height / it.width : 1;
        const clamped = Math.max(0.55, Math.min(1.8, aspect));
        const cardH = Math.round(colWidth * clamped);
        const top = colHeights[minCol];
        const left = Math.round(minCol * (colWidth + gutter));

        fallbackBounds[it.id] = {
          id: it.id,
          top,
          left,
          width: Math.round(colWidth),
          height: cardH,
          column: minCol,
        };
        colHeights[minCol] += cardH + gutter;
      }
      setBounds(fallbackBounds);
      setTotalHeight(Math.max(...colHeights));
      setIsCalculating(false);
    }
  }, [items, containerWidth, columnCount, gutter]);

  // Spatial Viewport Culling: calculate which items intersect the active screen + buffer
  const visibleIds = useMemo(() => {
    const minVisibleY = Math.max(0, scrollTop - bufferZone);
    const maxVisibleY = scrollTop + viewportHeight + bufferZone;
    const result: string[] = [];

    const itemIds = Object.keys(bounds);
    for (let i = 0; i < itemIds.length; i++) {
      const id = itemIds[i];
      const box = bounds[id];
      if (!box) continue;

      const itemBottom = box.top + box.height;
      if (itemBottom >= minVisibleY && box.top <= maxVisibleY) {
        result.push(id);
      }
    }

    return result;
  }, [bounds, scrollTop, viewportHeight, bufferZone]);

  const getItemBounds = useCallback(
    (id: string) => bounds[id] || null,
    [bounds]
  );

  return {
    bounds,
    totalHeight,
    visibleIds,
    isCalculating,
    getItemBounds,
  };
}
