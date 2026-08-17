import React, { useRef, useEffect, useState } from 'react';
import { LineChart, X, Activity, Waves, Gauge } from 'lucide-react';

export function TelemetryHUD({
  isOpen,
  onClose,
  engine
}) {
  const [activeTab, setActiveTab] = useState('spacetime'); // 'spacetime' | 'fundamental' | 'histogram'
  const spaceTimeCanvasRef = useRef(null);
  const fundamentalCanvasRef = useRef(null);

  // Render Space-Time Trajectory Diagram
  useEffect(() => {
    if (!isOpen || activeTab !== 'spacetime') return;

    let animId;
    const canvas = spaceTimeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderSpaceTime = () => {
      const history = engine.recorder.trajectoryHistory;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#090f1d';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      // Position grid lines
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      // Time grid lines
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      if (history.length < 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.fillText('Recording trajectory data...', width / 2 - 80, height / 2);
        animId = requestAnimationFrame(renderSpaceTime);
        return;
      }

      const mainTrack = engine.tracks.ring || engine.tracks.LANE_0 || Object.values(engine.tracks)[0];
      const maxTrackLength = mainTrack ? mainTrack.lengthMeters : 500;
      const timeSpan = engine.recorder.maxHistorySeconds;
      const currentTime = engine.recorder.simTime;
      const startTime = currentTime - timeSpan;

      // Group history by vehicle ID to draw smooth lines
      const vehicleLines = new Map();

      for (let i = 0; i < history.length; i++) {
        const snap = history[i];
        const tNorm = (snap.time - startTime) / timeSpan; // 0 (top/old) to 1 (bottom/current)
        const y = tNorm * height;

        for (let j = 0; j < snap.vehicles.length; j++) {
          const v = snap.vehicles[j];
          const xNorm = (v.s % maxTrackLength) / maxTrackLength;
          const x = xNorm * width;

          if (!vehicleLines.has(v.id)) {
            vehicleLines.set(v.id, []);
          }
          vehicleLines.get(v.id).push({ x, y, isBraking: v.isBraking, speed: v.v, color: v.color });
        }
      }

      // Draw trajectory paths
      vehicleLines.forEach((pts) => {
        for (let k = 0; k < pts.length - 1; k++) {
          const p1 = pts[k];
          const p2 = pts[k + 1];

          // Skip wrap-around jumps across width
          if (Math.abs(p2.x - p1.x) > width * 0.4) continue;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = p2.isBraking ? '#ef4444' : 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = p2.isBraking ? 2.5 : 1.2;
          ctx.stroke();
        }
      });

      // Axis labels
      ctx.fillStyle = '#00f0ff';
      ctx.font = '10px monospace';
      ctx.fillText(`Track s: 0m → ${Math.round(maxTrackLength)}m`, 10, 15);
      ctx.fillText(`Time History (Past ${timeSpan}s ↓)`, 10, height - 10);

      animId = requestAnimationFrame(renderSpaceTime);
    };

    animId = requestAnimationFrame(renderSpaceTime);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, engine]);

  // Render Fundamental Diagram (Q vs k)
  useEffect(() => {
    if (!isOpen || activeTab !== 'fundamental') return;

    let animId;
    const canvas = fundamentalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderFundamental = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#090f1d';
      ctx.fillRect(0, 0, width, height);

      // Theoretical Triangular Diagram Envelope
      const kCrit = 45; // veh/km
      const kJam = 140; // veh/km
      const qCap = 1800; // veh/hr

      const mapK = (k) => (k / kJam) * (width - 40) + 30;
      const mapQ = (q) => height - 30 - (q / (qCap * 1.2)) * (height - 50);

      // Draw Theoretical Curve
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(mapK(0), mapQ(0));
      ctx.lineTo(mapK(kCrit), mapQ(qCap));
      ctx.lineTo(mapK(kJam), mapQ(0));
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Historical Empirical Points
      const macHistory = engine.recorder.macroscopicHistory;
      for (let i = 0; i < macHistory.length; i++) {
        const pt = macHistory[i];
        const px = mapK(pt.density);
        const py = mapQ(pt.flow);

        ctx.fillStyle = pt.density > kCrit ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Current Operating Point (Pulsing Dot)
      if (macHistory.length > 0) {
        const cur = macHistory[macHistory.length - 1];
        const curX = mapK(cur.density);
        const curY = mapQ(cur.flow);

        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Axis Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('Flow Q (veh/h) ↑', 10, 15);
      ctx.fillText('Traffic Density k (veh/km) →', width / 2 - 60, height - 8);

      animId = requestAnimationFrame(renderFundamental);
    };

    animId = requestAnimationFrame(renderFundamental);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, engine]);

  if (!isOpen) return null;

  return (
    <aside className="fixed bottom-20 left-4 z-40 w-[440px] glass-panel p-4 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide font-mono">
            MICROSCOPIC FLOW TELEMETRY
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab('spacetime')}
          className={`py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'spacetime'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Space-Time (s, t)</span>
        </button>
        <button
          onClick={() => setActiveTab('fundamental')}
          className={`py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'fundamental'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Fundamental (Q-k)</span>
        </button>
      </div>

      {/* SPACE-TIME DIAGRAM */}
      {activeTab === 'spacetime' && (
        <div className="flex flex-col gap-2">
          <div className="relative w-full h-52 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            <canvas
              ref={spaceTimeCanvasRef}
              width={400}
              height={208}
              className="w-full h-full block"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            💡 <strong className="text-cyan-300">Observation:</strong> Parallel backward-sloping red lines demonstrate authentic shockwave wave velocity (<span className="font-mono">v_wave ≈ -15 km/h</span>).
          </p>
        </div>
      )}

      {/* FUNDAMENTAL FLOW-DENSITY DIAGRAM */}
      {activeTab === 'fundamental' && (
        <div className="flex flex-col gap-2">
          <div className="relative w-full h-52 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            <canvas
              ref={fundamentalCanvasRef}
              width={400}
              height={208}
              className="w-full h-full block"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            💡 <strong className="text-cyan-300">Greenshields Curve:</strong> Green points indicate free flow; Red points indicate capacity breakdown & congestion branch.
          </p>
        </div>
      )}
    </aside>
  );
}
