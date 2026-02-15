import { useEffect, useMemo, useRef, useState } from 'react';
import { scaleLinear, scaleTime } from 'd3-scale';
import AxisLayer from './AxisLayer';
import ChartOverlay from './ChartOverlay';

function computeYDomain(data, envelope) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const point of data) {
    if (point.value < min) {
      min = point.value;
    }
    if (point.value > max) {
      max = point.value;
    }
  }

  for (const bucket of envelope) {
    if (bucket.min < min) {
      min = bucket.min;
    }
    if (bucket.max > max) {
      max = bucket.max;
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [0, 1];
  }

  if (min === max) {
    const padding = Math.abs(min) * 0.05 || 1;
    return [min - padding, max + padding];
  }

  const padding = (max - min) * 0.1;
  return [min - padding, max + padding];
}

export default function CanvasChart({
  data,
  envelope,
  width,
  height,
  window: windowRange,
  onBrushEnd,
  onWheelZoom,
  onPan,
  loading
}) {
  const canvasRef = useRef(null);
  const [selection, setSelection] = useState(null);

  const yDomain = useMemo(() => computeYDomain(data, envelope), [data, envelope]);

  const xScale = useMemo(
    () =>
      scaleTime()
        .domain([windowRange.startTime, windowRange.endTime])
        .range([0, width]),
    [width, windowRange.endTime, windowRange.startTime]
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain(yDomain)
        .nice()
        .range([height, 0]),
    [height, yDomain]
  );

  useEffect(() => {
    setSelection(null);
  }, [windowRange.endTime, windowRange.startTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) {
      return;
    }

    const dpr =
      typeof globalThis !== 'undefined'
        ? Math.max(1, globalThis.devicePixelRatio || 1)
        : 1;

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext('2d');
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    context.clearRect(0, 0, width, height);

    context.fillStyle = '#071129';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(135, 160, 200, 0.15)';
    context.lineWidth = 1;
    const yTicks = yScale.ticks(5);
    for (const tick of yTicks) {
      const y = yScale(tick);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    if (envelope.length > 0) {
      context.strokeStyle = 'rgba(129, 212, 250, 0.28)';
      context.lineWidth = 1;
      context.beginPath();

      for (const bucket of envelope) {
        const x = xScale(bucket.ts);
        const y1 = yScale(bucket.min);
        const y2 = yScale(bucket.max);
        context.moveTo(x, y1);
        context.lineTo(x, y2);
      }

      context.stroke();
    }

    if (data.length > 0) {
      context.beginPath();
      context.strokeStyle = '#4CC9F0';
      context.lineWidth = 1.5;

      for (let index = 0; index < data.length; index += 1) {
        const point = data[index];
        const x = xScale(point.ts);
        const y = yScale(point.value);

        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.stroke();
    }

    if (selection) {
      const left = xScale(selection.startTime);
      const right = xScale(selection.endTime);
      const selectionWidth = Math.max(0, right - left);

      context.fillStyle = 'rgba(245, 158, 11, 0.22)';
      context.fillRect(left, 0, selectionWidth, height);
      context.strokeStyle = 'rgba(245, 158, 11, 0.9)';
      context.lineWidth = 1;
      context.strokeRect(left, 0.5, selectionWidth, height - 1);
    }
  }, [data, envelope, height, selection, width, xScale, yScale]);

  return (
    <div className="chart-root" style={{ width: `${width}px`, height: `${height}px` }}>
      <canvas ref={canvasRef} className="chart-canvas" />
      <AxisLayer width={width} height={height} window={windowRange} yDomain={yDomain} />
      <ChartOverlay
        width={width}
        window={windowRange}
        onBrushEnd={onBrushEnd}
        onWheelZoom={onWheelZoom}
        onPan={onPan}
        onBrushPreview={setSelection}
      />
      {loading ? <div className="loading-badge">Loading...</div> : null}
    </div>
  );
}
