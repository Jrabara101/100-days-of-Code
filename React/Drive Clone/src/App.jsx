import { useMemo } from 'react';
import CanvasChart from './components/CanvasChart';
import { useDataWindow } from './hooks/useDataWindow';
import { useResizeObserver } from './hooks/useResizeObserver';
import { getDatasetBounds, getDatasetSummary } from './services/dataStore';
import { formatDateTime, formatMetric } from './utils/formatters';

export default function App() {
  const bounds = useMemo(() => getDatasetBounds(), []);
  const summary = useMemo(() => getDatasetSummary(), []);
  const { containerRef, width } = useResizeObserver();

  const {
    data,
    envelope,
    meta,
    status,
    error,
    window,
    resetWindow,
    applyBrush,
    zoomAt,
    panByRatio
  } = useDataWindow({
    initialWindow: bounds,
    widthPx: width,
    algorithm: 'lttb',
    maxPointsPerPx: 1,
    debounceMs: 45
  });

  const chartHeight = 420;
  const windowSpanHours = ((window.endTime - window.startTime) / 3_600_000).toFixed(2);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Tier 5/6 Performance Challenge</p>
          <h1>Canvas Time-Series Analytics</h1>
          <p className="subheading">
            1.2M+ synthetic points, viewport fetching, D3 scales, and canvas rendering.
          </p>
        </div>

        <div className="toolbar">
          <span className="pill">Algorithm: {meta.algorithm.toUpperCase()}</span>
          <button type="button" onClick={resetWindow}>
            Reset Window
          </button>
        </div>
      </header>

      <section className="chart-card">
        <div ref={containerRef} className="chart-stage">
          <CanvasChart
            data={data}
            envelope={envelope}
            width={width}
            height={chartHeight}
            window={window}
            onBrushEnd={applyBrush}
            onWheelZoom={zoomAt}
            onPan={(deltaRatio) => panByRatio(-deltaRatio)}
            loading={status === 'loading'}
          />
        </div>

        <p className="interaction-hint">
          Drag to brush zoom. Scroll wheel to zoom at cursor. Hold Shift + drag to pan.
        </p>

        <div className="meta-grid">
          <article>
            <span>Dataset Range</span>
            <strong>
              {formatDateTime(summary.startTime)} - {formatDateTime(summary.endTime)}
            </strong>
          </article>

          <article>
            <span>Total Raw Points</span>
            <strong>{formatMetric(summary.totalPoints)}</strong>
          </article>

          <article>
            <span>Window Span</span>
            <strong>{windowSpanHours} h</strong>
          </article>

          <article>
            <span>Window Source Count</span>
            <strong>{formatMetric(meta.sourceCount)}</strong>
          </article>

          <article>
            <span>Returned Points</span>
            <strong>{formatMetric(meta.returnedCount)}</strong>
          </article>

          <article>
            <span>Bucket Resolution</span>
            <strong>{formatMetric(meta.bucketMs)} ms</strong>
          </article>

          <article>
            <span>Status</span>
            <strong className={`status-${status}`}>{status}</strong>
          </article>
        </div>

        {error ? <p className="error-text">{error.message}</p> : null}
      </section>
    </main>
  );
}
