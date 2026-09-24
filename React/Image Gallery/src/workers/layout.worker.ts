import { WorkerLayoutPayload, WorkerLayoutResponse, SpatialBounds } from '../types/gallery';

self.onmessage = (event: MessageEvent<WorkerLayoutPayload>) => {
  const { items, containerWidth, columnCount, gutter } = event.data;

  if (!items || items.length === 0 || containerWidth <= 0) {
    const emptyResponse: WorkerLayoutResponse = {
      bounds: {},
      totalHeight: 0,
      columnHeights: [],
    };
    self.postMessage(emptyResponse);
    return;
  }

  const validCols = Math.max(1, columnCount);
  const columnWidth = Math.max(100, (containerWidth - (validCols - 1) * gutter) / validCols);
  const columnHeights = new Array(validCols).fill(0);
  const bounds: Record<string, SpatialBounds> = {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Find column with the minimum height
    let minCol = 0;
    let minHeight = columnHeights[0];
    for (let c = 1; c < validCols; c++) {
      if (columnHeights[c] < minHeight) {
        minHeight = columnHeights[c];
        minCol = c;
      }
    }

    // Determine card aspect ratio (constrained to realistic photo bounds [0.55 to 1.8])
    const rawAspect = item.height > 0 && item.width > 0 ? item.height / item.width : 1;
    const clampedAspect = Math.max(0.55, Math.min(1.8, rawAspect));
    const cardHeight = Math.round(columnWidth * clampedAspect);

    const top = columnHeights[minCol];
    const left = Math.round(minCol * (columnWidth + gutter));

    bounds[item.id] = {
      id: item.id,
      top,
      left,
      width: Math.round(columnWidth),
      height: cardHeight,
      column: minCol,
    };

    columnHeights[minCol] += cardHeight + gutter;
  }

  const totalHeight = Math.max(...columnHeights);

  const response: WorkerLayoutResponse = {
    bounds,
    totalHeight,
    columnHeights,
  };

  self.postMessage(response);
};
