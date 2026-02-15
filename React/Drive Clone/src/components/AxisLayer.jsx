import { useMemo } from 'react';
import { scaleLinear, scaleTime } from 'd3-scale';
import { formatAxisTime, formatMetric } from '../utils/formatters';

const X_TICK_COUNT = 6;
const Y_TICK_COUNT = 5;

function toPixel(value) {
  return Number.isFinite(value) ? value : 0;
}

export default function AxisLayer({ width, height, window, yDomain }) {
  const spanMs = Math.max(1, window.endTime - window.startTime);

  const xScale = useMemo(
    () =>
      scaleTime()
        .domain([window.startTime, window.endTime])
        .range([0, width]),
    [height, width, window.endTime, window.startTime]
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain(yDomain)
        .range([height, 0]),
    [height, yDomain]
  );

  const xTicks = useMemo(
    () => xScale.ticks(X_TICK_COUNT).map((tick) => +tick),
    [xScale]
  );

  const yTicks = useMemo(() => yScale.ticks(Y_TICK_COUNT), [yScale]);

  return (
    <div className="axis-layer">
      {xTicks.map((tick) => (
        <div
          className="axis-tick axis-tick-x"
          key={`x-${tick}`}
          style={{ left: `${toPixel(xScale(tick))}px` }}
        >
          <span>{formatAxisTime(tick, spanMs)}</span>
        </div>
      ))}

      {yTicks.map((tick) => (
        <div
          className="axis-tick axis-tick-y"
          key={`y-${tick}`}
          style={{ top: `${toPixel(yScale(tick))}px` }}
        >
          <span>{formatMetric(tick)}</span>
        </div>
      ))}
    </div>
  );
}
