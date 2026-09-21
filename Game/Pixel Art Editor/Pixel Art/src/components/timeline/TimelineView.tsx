import React, { useEffect, useRef, useState } from 'react';
import { usePixelStore } from '../../store/usePixelStore';
import { compositeFrameToCanvas } from '../../lib/exportUtils';
import { 
  Play, 
  Pause, 
  Repeat, 
  ArrowLeftRight, 
  Square, 
  Plus, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Zap
} from 'lucide-react';
import { LoopMode } from '../../types/pixel';

export const TimelineView: React.FC = () => {
  const {
    dimensions,
    layers,
    frames,
    activeFrameIndex,
    setActiveFrameIndex,
    fps,
    setFps,
    isPlaying,
    togglePlay,
    loopMode,
    setLoopMode,
    onionSkin,
    toggleOnionSkin,
    addFrame,
    duplicateFrame,
    deleteFrame,
    toggleLayerVisibility,
  } = usePixelStore();

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [frameDurationTicks, setFrameDurationTicks] = useState(3);
  const [frameEventLabel, setFrameEventLabel] = useState('step_impact_right');
  const pingPongForwardRef = useRef(true);

  // Playback Animation Loop via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    let animId: number;
    let lastTime = performance.now();
    const interval = 1000 / fps;

    const tick = (now: number) => {
      if (now - lastTime >= interval) {
        lastTime = now;
        if (loopMode === 'loop') {
          setActiveFrameIndex((activeFrameIndex + 1) % frames.length);
        } else if (loopMode === 'ping-pong') {
          let nextIdx = activeFrameIndex;
          if (pingPongForwardRef.current) {
            if (nextIdx + 1 < frames.length) {
              nextIdx++;
            } else {
              pingPongForwardRef.current = false;
              nextIdx--;
            }
          } else {
            if (nextIdx - 1 >= 0) {
              nextIdx--;
            } else {
              pingPongForwardRef.current = true;
              nextIdx++;
            }
          }
          setActiveFrameIndex(Math.max(0, Math.min(frames.length - 1, nextIdx)));
        } else if (loopMode === 'once') {
          if (activeFrameIndex + 1 < frames.length) {
            setActiveFrameIndex(activeFrameIndex + 1);
          } else {
            togglePlay(); // Stop
          }
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, fps, loopMode, activeFrameIndex, frames.length, setActiveFrameIndex, togglePlay]);

  // Render current frame to Center Stage Preview Canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    const frameCanvas = compositeFrameToCanvas(currentFrame, layers, dimensions.width, dimensions.height);
    ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
  }, [frames, layers, activeFrameIndex, dimensions]);

  const loopModes: { id: LoopMode; label: string; icon: React.ReactNode }[] = [
    { id: 'loop', label: 'Loop', icon: <Repeat className="w-3.5 h-3.5" /> },
    { id: 'ping-pong', label: 'Ping-Pong', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
    { id: 'once', label: 'Once', icon: <Square className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-bg-canvas text-on-surface select-none">
      {/* Top Workspace Toolbar Sub-header */}
      <div className="h-12 bg-surface-panel flex items-center justify-between px-6 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-base text-primary tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Timeline Sequencer
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-border-subtle">
            SEQ_01_HERO_CYCLE
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* FPS Slider */}
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-lg border border-border-subtle">
            <span className="text-xs font-mono text-on-surface-variant">FPS:</span>
            <input
              type="range"
              min="1"
              max="60"
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value, 10))}
              className="w-24 accent-primary cursor-pointer h-1.5 bg-surface-container rounded"
            />
            <span className="text-xs font-mono text-primary font-bold w-12 text-right">{fps} FPS</span>
          </div>

          {/* Loop Mode Selector */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle">
            {loopModes.map((lm) => {
              const isActive = loopMode === lm.id;
              return (
                <button
                  key={lm.id}
                  onClick={() => setLoopMode(lm.id)}
                  className={`p-1.5 rounded transition-colors ${
                    isActive ? 'bg-primary/20 text-primary font-bold' : 'text-text-muted hover:text-on-surface'
                  }`}
                  title={`Loop Mode: ${lm.label}`}
                >
                  {lm.icon}
                </button>
              );
            })}
          </div>

          {/* Onion Skin Toggle */}
          <button
            onClick={toggleOnionSkin}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
              onionSkin.enabled
                ? 'bg-secondary text-on-secondary border-secondary shadow-md shadow-secondary/15 font-bold'
                : 'bg-surface-container border-border-subtle text-text-muted hover:text-on-surface'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Onion Skin</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Dock: Animation Tracks */}
        <aside className="w-64 bg-surface-panel flex flex-col border-r border-border-subtle shrink-0">
          <div className="p-3 border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">Animation Tracks</span>
            <span className="text-xs font-mono text-text-muted">{layers.length} Layers</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 rounded-lg bg-surface-container border border-border-subtle group hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </button>
                  <span className="text-xs font-medium text-on-surface truncate max-w-[120px]">
                    {layer.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container-high text-primary">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border-subtle bg-surface-container-lowest">
            <div className="text-[10px] font-mono text-text-muted uppercase mb-1">Track Interpolation</div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Sampling</span>
              <span className="font-mono text-primary font-bold">Nearest Neighbor</span>
            </div>
          </div>
        </aside>

        {/* Center Stage / Preview Canvas */}
        <div className="flex-1 flex flex-col bg-bg-canvas relative overflow-hidden items-center justify-center p-8">
          <div className="relative w-[340px] h-[340px] bg-surface-container-lowest rounded-2xl shadow-2xl flex items-center justify-center border border-border-subtle overflow-hidden">
            {/* Checkerboard Pattern */}
            <div className="absolute inset-0 bg-checkerboard opacity-20 pointer-events-none" />

            {/* Stage Canvas */}
            <canvas
              ref={previewCanvasRef}
              width={256}
              height={256}
              className="relative z-10 w-64 h-64 pixelated drop-shadow-2xl"
            />

            {/* Stage HUD Tags */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-surface-panel/90 backdrop-blur rounded text-[11px] font-mono text-primary border border-border-subtle font-bold">
              FRAME: {String(activeFrameIndex + 1).padStart(2, '0')} / {String(frames.length).padStart(2, '0')}
            </div>

            <div className="absolute top-3 right-3 px-2 py-1 bg-surface-panel/90 backdrop-blur rounded text-[11px] font-mono text-secondary border border-border-subtle">
              ONION: {onionSkin.enabled ? '-1, +1 GHOSTS' : 'OFF'}
            </div>
          </div>
        </div>

        {/* Right Dock: Frame Inspector & Ease Curve */}
        <aside className="w-72 bg-surface-panel flex flex-col border-l border-border-subtle shrink-0">
          <div className="p-3 border-b border-border-subtle">
            <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">Frame Inspector</span>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div>
              <label className="text-[11px] font-mono text-text-muted block mb-1">SELECTED FRAME</label>
              <input
                type="text"
                value={`Frame ${String(activeFrameIndex + 1).padStart(2, '0')}`}
                readOnly
                className="w-full bg-surface-container px-2.5 py-1.5 rounded-lg text-on-surface text-xs font-mono border border-border-subtle focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-text-muted block mb-1">HOLD DURATION (TICKS)</label>
              <input
                type="number"
                min="1"
                max="24"
                value={frameDurationTicks}
                onChange={(e) => setFrameDurationTicks(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-surface-container px-2.5 py-1.5 rounded-lg text-on-surface text-xs font-mono border border-border-subtle focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-text-muted block mb-1">FRAME EVENT / TAG</label>
              <input
                type="text"
                value={frameEventLabel}
                onChange={(e) => setFrameEventLabel(e.target.value)}
                className="w-full bg-surface-container px-2.5 py-1.5 rounded-lg text-on-surface text-xs font-mono border border-border-subtle focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <label className="text-[11px] font-mono text-text-muted block mb-2">INTERPOLATION CURVE</label>
              <div className="w-full h-28 bg-surface-container rounded-lg relative flex items-center justify-center p-2 border border-border-subtle overflow-hidden">
                <svg className="w-full h-full text-primary" fill="none" viewBox="0 0 100 100">
                  <path d="M 0 100 C 50 100, 50 0, 100 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="5" fill="#4cd7f6" />
                </svg>
                <div className="absolute bottom-1.5 right-2 text-[10px] font-mono text-text-muted uppercase">
                  EASE-IN-OUT
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-border-subtle bg-surface-container-lowest">
            <button
              onClick={() => duplicateFrame()}
              className="w-full py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-container transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate In-Between Frame</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Bottom Frame Sequencer Strip */}
      <footer className="h-40 bg-surface-panel border-t border-border-subtle flex flex-col shrink-0">
        {/* Playback Controls Bar */}
        <div className="h-10 px-6 flex items-center justify-between border-b border-border-subtle bg-surface-container-low">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFrameIndex(0)}
              className="p-1 rounded hover:bg-surface-container text-on-surface transition-colors"
              title="First Frame"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveFrameIndex(Math.max(0, activeFrameIndex - 1))}
              className="p-1 rounded hover:bg-surface-container text-on-surface transition-colors"
              title="Previous Frame"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all ${
                isPlaying ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary hover:bg-primary-container'
              }`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => setActiveFrameIndex(Math.min(frames.length - 1, activeFrameIndex + 1))}
              className="p-1 rounded hover:bg-surface-container text-on-surface transition-colors"
              title="Next Frame"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveFrameIndex(frames.length - 1)}
              className="p-1 rounded hover:bg-surface-container text-on-surface transition-colors"
              title="Last Frame"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            <span className="w-[1px] h-4 bg-border-subtle mx-2" />

            <div className="flex items-center gap-1 bg-surface-container px-2.5 py-0.5 rounded text-xs font-mono text-on-surface border border-border-subtle">
              <span className="text-primary font-bold">{String(activeFrameIndex + 1).padStart(2, '0')}</span> / {frames.length} FRAMES
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addFrame}
              className="flex items-center gap-1 text-xs font-mono text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-primary" /> Add Blank Frame
            </button>

            <button
              onClick={() => duplicateFrame()}
              className="flex items-center gap-1 text-xs font-mono text-on-surface-variant hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-secondary" /> Duplicate
            </button>

            <button
              disabled={frames.length <= 1}
              onClick={() => deleteFrame()}
              className="flex items-center gap-1 text-xs font-mono text-error hover:text-error/80 px-2 py-1 rounded hover:bg-surface-container disabled:opacity-30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex-1 overflow-x-auto p-3 flex items-center gap-3 relative select-none">
          {frames.map((_, idx) => {
            const isActive = idx === activeFrameIndex;
            return (
              <div
                key={idx}
                onClick={() => setActiveFrameIndex(idx)}
                className={`w-20 h-24 rounded-lg flex flex-col overflow-hidden shrink-0 cursor-pointer border transition-all ${
                  isActive
                    ? 'border-primary ring-2 ring-primary shadow-lg scale-105'
                    : 'bg-surface-container border-border-subtle hover:border-primary/50'
                }`}
              >
                <div className="flex-1 bg-surface-container-lowest flex items-center justify-center relative">
                  <span className={`font-mono text-sm font-bold ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                    #{idx + 1}
                  </span>
                </div>
                <div className={`h-5 flex items-center justify-center px-1 text-[9px] font-mono ${
                  isActive ? 'bg-primary-container text-on-primary-container font-bold' : 'bg-surface-container-high text-text-muted'
                }`}>
                  {idx === 0 ? 'Keyframe' : 'Frame'}
                </div>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
