import { useRef, useCallback, useEffect } from 'react';
import { DrawAction, DrawPoint, DrawStroke, ToolType } from '@/types/game';

const PAPER_COLOR = '#F8F4EC';

interface UseCanvasEngineProps {
  currentTool: ToolType;
  brushColor: string;
  brushSize: number;
  isDrawingEnabled: boolean;
  isBlindfold: boolean;
  isOneLineOnly: boolean;
  onCommitAction: (action: DrawAction) => void;
  actions: DrawAction[];
}

export function drawSmoothedCurve(
  ctx: CanvasRenderingContext2D,
  points: DrawPoint[],
  color: string,
  width: number,
  isEraser: boolean = false,
  customPaperColor: string = PAPER_COLOR
) {
  if (points.length < 2) {
    if (points.length === 1) {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = isEraser ? customPaperColor : color;
      ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = isEraser ? customPaperColor : color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

export function executeFloodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  w: number,
  h: number,
  dpr: number
) {
  const x = Math.round(startX * dpr);
  const y = Math.round(startY * dpr);
  const totalW = Math.round(w * dpr);
  const totalH = Math.round(h * dpr);

  if (x < 0 || x >= totalW || y < 0 || y >= totalH) return;

  const imgData = ctx.getImageData(0, 0, totalW, totalH);
  const data = imgData.data;

  const r_target = parseInt(fillColorHex.slice(1, 3), 16);
  const g_target = parseInt(fillColorHex.slice(3, 5), 16);
  const b_target = parseInt(fillColorHex.slice(5, 7), 16);
  const a_target = 255;

  const startIndex = (y * totalW + x) * 4;
  const r_base = data[startIndex];
  const g_base = data[startIndex + 1];
  const b_base = data[startIndex + 2];

  if (r_base === r_target && g_base === g_target && b_base === b_target) return;

  const matchBase = (idx: number) => {
    return (
      Math.abs(data[idx] - r_base) < 32 &&
      Math.abs(data[idx + 1] - g_base) < 32 &&
      Math.abs(data[idx + 2] - b_base) < 32
    );
  };

  const pixelStack: [number, number][] = [[x, y]];

  while (pixelStack.length > 0) {
    const [currX, currY] = pixelStack.pop()!;
    let y1 = currY;

    while (y1 >= 0 && matchBase((y1 * totalW + currX) * 4)) {
      y1--;
    }
    y1++;

    let spanLeft = false;
    let spanRight = false;

    while (y1 < totalH && matchBase((y1 * totalW + currX) * 4)) {
      const idx = (y1 * totalW + currX) * 4;
      data[idx] = r_target;
      data[idx + 1] = g_target;
      data[idx + 2] = b_target;
      data[idx + 3] = a_target;

      if (currX > 0) {
        if (matchBase((y1 * totalW + (currX - 1)) * 4)) {
          if (!spanLeft) {
            pixelStack.push([currX - 1, y1]);
            spanLeft = true;
          }
        } else if (spanLeft) {
          spanLeft = false;
        }
      }

      if (currX < totalW - 1) {
        if (matchBase((y1 * totalW + (currX + 1)) * 4)) {
          if (!spanRight) {
            pixelStack.push([currX + 1, y1]);
            spanRight = true;
          }
        } else if (spanRight) {
          spanRight = false;
        }
      }

      y1++;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function useCanvasEngine({
  currentTool,
  brushColor,
  brushSize,
  isDrawingEnabled,
  isBlindfold,
  isOneLineOnly,
  onCommitAction,
  actions,
}: UseCanvasEngineProps) {
  const layer1Ref = useRef<HTMLCanvasElement | null>(null);
  const layer2Ref = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isPointerDownRef = useRef<boolean>(false);
  const activeStrokePointsRef = useRef<DrawPoint[]>([]);
  const hasDrawnOneLineRef = useRef<boolean>(false);
  const blindfoldTimerRef = useRef<number | null>(null);

  // Redraw Layer 1 from action history
  const redrawCommittedActions = useCallback(() => {
    const layer1 = layer1Ref.current;
    const container = containerRef.current;
    if (!layer1 || !container) return;

    const ctx = layer1.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    ctx.fillStyle = PAPER_COLOR;
    ctx.fillRect(0, 0, rect.width, rect.height);

    const dpr = window.devicePixelRatio || 1;

    actions.forEach((action) => {
      if (action.type === 'stroke') {
        drawSmoothedCurve(
          ctx,
          action.points,
          action.color,
          action.width,
          action.tool === 'eraser',
          PAPER_COLOR
        );
      } else if (action.type === 'fill') {
        executeFloodFill(
          ctx,
          action.x,
          action.y,
          action.color,
          rect.width,
          rect.height,
          dpr
        );
      }
    });
  }, [actions]);

  // Resize both layers to match container with DPR
  const resizeCanvases = useCallback(() => {
    const container = containerRef.current;
    const l1 = layer1Ref.current;
    const l2 = layer2Ref.current;
    if (!container || !l1 || !l2) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    l1.width = rect.width * dpr;
    l1.height = rect.height * dpr;
    const ctx1 = l1.getContext('2d', { willReadFrequently: true });
    if (ctx1) {
      ctx1.scale(dpr, dpr);
    }

    l2.width = rect.width * dpr;
    l2.height = rect.height * dpr;
    const ctx2 = l2.getContext('2d');
    if (ctx2) {
      ctx2.scale(dpr, dpr);
    }

    redrawCommittedActions();
  }, [redrawCommittedActions]);

  useEffect(() => {
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    return () => {
      window.removeEventListener('resize', resizeCanvases);
    };
  }, [resizeCanvases]);

  useEffect(() => {
    redrawCommittedActions();
  }, [redrawCommittedActions]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): DrawPoint => {
    const l1 = layer1Ref.current;
    if (!l1) return { x: 0, y: 0 };
    const rect = l1.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingEnabled) return;
    if (isOneLineOnly && hasDrawnOneLineRef.current) {
      return;
    }

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const pos = getCoordinates(e);
    const container = containerRef.current;
    const l1 = layer1Ref.current;
    const l2 = layer2Ref.current;
    if (!container || !l1 || !l2) return;

    if (currentTool === 'fill') {
      const ctx1 = l1.getContext('2d', { willReadFrequently: true });
      if (ctx1) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        executeFloodFill(ctx1, pos.x, pos.y, brushColor, rect.width, rect.height, dpr);

        onCommitAction({
          type: 'fill',
          id: `fill_${Date.now()}`,
          x: pos.x,
          y: pos.y,
          color: brushColor,
          timestamp: Date.now(),
        });
      }
      return;
    }

    isPointerDownRef.current = true;
    activeStrokePointsRef.current = [pos];

    const ctx2 = l2.getContext('2d');
    if (ctx2) {
      const rect = container.getBoundingClientRect();
      ctx2.clearRect(0, 0, rect.width, rect.height);
      ctx2.beginPath();
      ctx2.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx2.fillStyle = currentTool === 'eraser' ? PAPER_COLOR : brushColor;
      ctx2.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingEnabled || !isPointerDownRef.current) return;

    const pos = getCoordinates(e);
    activeStrokePointsRef.current.push(pos);

    const l2 = layer2Ref.current;
    const container = containerRef.current;
    if (!l2 || !container) return;

    const ctx2 = l2.getContext('2d');
    if (!ctx2) return;

    const rect = container.getBoundingClientRect();
    ctx2.clearRect(0, 0, rect.width, rect.height);
    drawSmoothedCurve(
      ctx2,
      activeStrokePointsRef.current,
      brushColor,
      brushSize,
      currentTool === 'eraser',
      PAPER_COLOR
    );
  };

  const commitActiveStroke = useCallback(() => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    const points = [...activeStrokePointsRef.current];
    const l1 = layer1Ref.current;
    const l2 = layer2Ref.current;
    const container = containerRef.current;

    if (points.length > 0 && l1 && container) {
      const ctx1 = l1.getContext('2d', { willReadFrequently: true });
      if (ctx1) {
        drawSmoothedCurve(
          ctx1,
          points,
          brushColor,
          brushSize,
          currentTool === 'eraser',
          PAPER_COLOR
        );
      }

      const strokeAction: DrawStroke = {
        type: 'stroke',
        id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        points,
        color: brushColor,
        width: brushSize,
        tool: currentTool,
        timestamp: Date.now(),
      };

      onCommitAction(strokeAction);

      if (isOneLineOnly) {
        hasDrawnOneLineRef.current = true;
      }
    }

    if (l2 && container) {
      const ctx2 = l2.getContext('2d');
      if (ctx2) {
        const rect = container.getBoundingClientRect();
        ctx2.clearRect(0, 0, rect.width, rect.height);
      }
    }

    activeStrokePointsRef.current = [];

    // Blindfold mode: fade ink out after 1 second
    if (isBlindfold && l1 && container) {
      if (blindfoldTimerRef.current) {
        window.clearTimeout(blindfoldTimerRef.current);
      }
      blindfoldTimerRef.current = window.setTimeout(() => {
        const ctx1 = l1.getContext('2d', { willReadFrequently: true });
        if (ctx1) {
          const rect = container.getBoundingClientRect();
          ctx1.fillStyle = PAPER_COLOR;
          ctx1.fillRect(0, 0, rect.width, rect.height);
        }
      }, 1000);
    }
  }, [
    brushColor,
    brushSize,
    currentTool,
    isBlindfold,
    isOneLineOnly,
    onCommitAction,
  ]);

  const resetOneLine = useCallback(() => {
    hasDrawnOneLineRef.current = false;
  }, []);

  return {
    layer1Ref,
    layer2Ref,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    commitActiveStroke,
    redrawCommittedActions,
    resetOneLine,
    hasDrawnOneLine: hasDrawnOneLineRef.current,
  };
}
