import React, { useState, useEffect, useRef } from 'react';
import { usePixelStore } from '../../store/usePixelStore';
import { 
  generateSpriteSheetCanvas, 
  downloadFile, 
  generatePhaserAtlasJSON, 
  generateGodotSpriteFrames, 
  generateCSSKeyframes,
  exportAnimatedWebM,
  compositeFrameToCanvas
} from '../../lib/exportUtils';
import confetti from 'canvas-confetti';
import { 
  Download, 
  Film, 
  Code, 
  Share2, 
  Copy, 
  Check, 
  Grid, 
  Sparkles, 
  CloudCheck, 
  ExternalLink,
  Layers
} from 'lucide-react';

export const ExportView: React.FC = () => {
  const {
    dimensions,
    layers,
    frames,
    fps,
    projectTitle,
    setProjectTitle,
    projectTags,
    setProjectTags,
    projectDescription,
    setProjectDescription,
    peerJam,
    togglePeerJam,
  } = usePixelStore();

  // Export Settings State
  const [scale, setScale] = useState<number>(2);
  const [layout, setLayout] = useState<'auto' | 'horizontal' | 'vertical'>('auto');
  const [padding, setPadding] = useState<number>(1);
  const [trimAlpha, setTrimAlpha] = useState<boolean>(false);
  const [format, setFormat] = useState<'png' | 'webp'>('png');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);

  // Live preview animation frame index
  const [previewFrameIdx, setPreviewFrameIdx] = useState<number>(0);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Live preview animation loop
  useEffect(() => {
    if (frames.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewFrameIdx((prev) => (prev + 1) % frames.length);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [frames.length, fps]);

  // Render preview frame
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const currentFrame = frames[previewFrameIdx];
    if (!currentFrame) return;

    const frameCanvas = compositeFrameToCanvas(currentFrame, layers, dimensions.width, dimensions.height);
    ctx.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
  }, [previewFrameIdx, frames, layers, dimensions]);

  // Download Spritesheet Handler
  const handleDownloadSpriteSheet = () => {
    const { canvas } = generateSpriteSheetCanvas(frames, layers, dimensions.width, dimensions.height, {
      scale,
      layout,
      padding,
      trimAlpha,
      format,
    });

    const dataUrl = canvas.toDataURL(`image/${format}`);
    downloadFile(dataUrl, `spritesheet_${dimensions.width * scale}x${dimensions.height * scale}.${format}`);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#d0bcff', '#4cd7f6', '#ffb869'],
    });
  };

  // Download Current Frame PNG
  const handleDownloadSingleFrame = () => {
    const frameCanvas = compositeFrameToCanvas(frames[previewFrameIdx], layers, dimensions.width, dimensions.height);
    
    // Scale up
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = dimensions.width * scale;
    scaledCanvas.height = dimensions.height * scale;
    const ctx = scaledCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(frameCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      downloadFile(scaledCanvas.toDataURL('image/png'), `frame_${previewFrameIdx + 1}_${scale}x.png`);
    }
  };

  // Export WebM Video
  const handleExportWebM = async () => {
    try {
      setIsExportingVideo(true);
      const blob = await exportAnimatedWebM(frames, layers, dimensions.width, dimensions.height, scale, fps, 3);
      downloadFile(blob, 'sprite_animation.webm');
      confetti({ particleCount: 60, spread: 70, colors: ['#4cd7f6', '#d0bcff'] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingVideo(false);
    }
  };

  // Copy Game Engine Code Snippet
  const handleCopyCode = (formatType: 'css' | 'godot' | 'phaser' | 'texturepacker') => {
    let text = '';
    const cols = layout === 'auto' ? Math.ceil(Math.sqrt(frames.length)) : (layout === 'horizontal' ? frames.length : 1);

    if (formatType === 'css') {
      text = generateCSSKeyframes(frames.length, dimensions.width, dimensions.height, scale, fps);
    } else if (formatType === 'godot') {
      text = generateGodotSpriteFrames(frames.length, fps);
    } else {
      text = generatePhaserAtlasJSON(frames.length, cols, dimensions.width, dimensions.height, scale, padding);
    }

    navigator.clipboard.writeText(text);
    setCopiedFormat(formatType);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-bg-canvas text-on-surface select-none">
      {/* Top Status Bar */}
      <div className="w-full bg-surface-panel px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary border border-border-subtle">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-on-surface">{projectTitle}</span>
              <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded font-mono text-[10px] uppercase font-bold">
                Ready for Engine
              </span>
            </div>
            <p className="text-[11px] text-text-muted font-mono">
              {dimensions.width}×{dimensions.height}px • {frames.length} Frames • {layers.length} Layers • Auto-Saved to Browser
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-lg border border-border-subtle text-xs font-mono text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span>Local Sync Active</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="w-full max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Export Modules (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Module 01: Sprite Sheet / Atlas */}
          <div className="bg-surface-panel rounded-xl p-5 border border-border-subtle shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-on-surface">Module 01: Sprite Sheet / Atlas Export</h3>
              </div>
              <span className="font-mono text-xs text-text-muted">Lossless Nearest-Neighbor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-text-muted">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'webp')}
                  className="bg-surface-container text-on-surface px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-mono outline-none"
                >
                  <option value="png">PNG Spritesheet (.png)</option>
                  <option value="webp">WebP Atlas (.webp)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-text-muted">Scale Factor</label>
                <select
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value, 10))}
                  className="bg-surface-container text-on-surface px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-mono outline-none"
                >
                  <option value={1}>1x ({dimensions.width}px Original)</option>
                  <option value={2}>2x ({dimensions.width * 2}px HD)</option>
                  <option value={4}>4x ({dimensions.width * 4}px Retina)</option>
                  <option value={8}>8x ({dimensions.width * 8}px Ultra)</option>
                  <option value={16}>16x ({dimensions.width * 16}px Poster)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-text-muted">Layout Grid</label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as any)}
                  className="bg-surface-container text-on-surface px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-mono outline-none"
                >
                  <option value="auto">Auto (Square Matrix)</option>
                  <option value="horizontal">Horizontal Strip (1 x {frames.length})</option>
                  <option value="vertical">Vertical Column ({frames.length} x 1)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-lg border border-border-subtle">
                <div>
                  <div className="text-xs font-medium text-on-surface">Frame Padding</div>
                  <div className="text-[10px] text-text-muted">Avoid bleeding in texture atlases</div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="16"
                    value={padding}
                    onChange={(e) => setPadding(parseInt(e.target.value, 10) || 0)}
                    className="w-14 bg-surface text-center text-on-surface py-1 rounded text-xs font-mono border border-border-subtle"
                  />
                  <span className="text-[10px] text-text-muted font-mono">px</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-lg border border-border-subtle">
                <div>
                  <div className="text-xs font-medium text-on-surface">Nearest-Neighbor Filter</div>
                  <div className="text-[10px] text-text-muted">Zero blur, razor-sharp pixels</div>
                </div>
                <span className="font-mono text-xs text-primary font-bold">Enabled</span>
              </div>
            </div>

            <button
              onClick={handleDownloadSpriteSheet}
              className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-md font-mono"
            >
              <Download className="w-4 h-4" /> Download Sprite Sheet ({format.toUpperCase()})
            </button>
          </div>

          {/* Module 02: Animation / Video Export */}
          <div className="bg-surface-panel rounded-xl p-5 border border-border-subtle shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">Module 02: Animated Video / WebM Export</h3>
              </div>
              <span className="font-mono text-xs text-secondary">{fps} FPS Loop</span>
            </div>

            <p className="text-xs text-text-muted">
              Compile your frame sequence directly into an animated video file or lossless sequence ready for social sharing or game engine imports.
            </p>

            <button
              disabled={isExportingVideo}
              onClick={handleExportWebM}
              className="w-full py-2.5 bg-secondary text-on-secondary rounded-lg text-xs font-semibold hover:bg-secondary-container transition-all flex items-center justify-center gap-2 shadow-md font-mono disabled:opacity-50"
            >
              <Film className="w-4 h-4" />
              {isExportingVideo ? 'Rendering WebM Video...' : 'Export Animated Video (.webm)'}
            </button>
          </div>

          {/* Module 03: Game Engine & Code Export */}
          <div className="bg-surface-panel rounded-xl p-5 border border-border-subtle shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-tertiary" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-tertiary" />
                <h3 className="text-sm font-semibold text-on-surface">Module 03: Game Engine Code Generators</h3>
              </div>
              <span className="font-mono text-xs text-text-muted">Click to Copy</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'phaser', label: 'Phaser.js', desc: 'Atlas JSON' },
                { id: 'godot', label: 'Godot 4.x', desc: '.tres SpriteFrames' },
                { id: 'css', label: 'CSS Steps()', desc: '@keyframes' },
                { id: 'texturepacker', label: 'TexturePacker', desc: 'JSON Hash' },
              ].map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => handleCopyCode(engine.id as any)}
                  className="flex flex-col items-start p-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-left transition-all group"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-on-surface group-hover:text-tertiary transition-colors">
                      {engine.label}
                    </span>
                    {copiedFormat === engine.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">{engine.desc}</span>
                </button>
              ))}
            </div>

            {/* Live Code Preview Snippet */}
            <div className="bg-surface-container-lowest p-3 rounded-lg border border-border-subtle font-mono text-[11px] text-text-muted overflow-x-auto">
              <span className="text-tertiary">//@SpriteForge Animation Config:</span><br />
              <span className="text-on-surface-variant">
                {`{ "frames": ${frames.length}, "fps": ${fps}, "size": {"w": ${dimensions.width * scale}, "h": ${dimensions.height * scale}}, "format": "RGBA8888" }`}
              </span>
            </div>
          </div>

          {/* Module 04: Community & Peer Jam Room */}
          <div className="bg-surface-panel rounded-xl p-5 border border-border-subtle shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-container" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary-container" />
                <h3 className="text-sm font-semibold text-on-surface">Module 04: Live Peer Jam & Metadata</h3>
              </div>
              <span className="font-mono text-xs text-text-muted">Real-Time Sync</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-text-muted">Project Title</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="bg-surface-container px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-text-muted">Tags</label>
                <input
                  type="text"
                  value={projectTags}
                  onChange={(e) => setProjectTags(e.target.value)}
                  className="bg-surface-container px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono text-text-muted">Description</label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={2}
                className="bg-surface-container px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-mono text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Export Preview & Actions (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-4">
          <div className="bg-surface-panel rounded-xl p-5 border border-border-subtle shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                <h3 className="text-sm font-semibold text-on-surface">Live Export Preview</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="font-mono text-xs text-secondary">{fps} FPS Playing</span>
              </div>
            </div>

            {/* Canvas Preview Container */}
            <div className="relative w-full aspect-square bg-[#0f0d15] rounded-xl border border-border-subtle flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-checkerboard opacity-20 pointer-events-none" />
              
              <canvas
                ref={previewCanvasRef}
                width={200}
                height={200}
                className="relative z-10 w-48 h-48 pixelated drop-shadow-2xl"
              />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-surface-panel/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-mono">
                <span className="text-text-muted">
                  Frame: <strong className="text-on-surface">{previewFrameIdx + 1}/{frames.length}</strong>
                </span>
                <span className="text-secondary">
                  Res: <strong className="text-on-surface">{dimensions.width * scale}×{dimensions.height * scale}px</strong>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadSingleFrame}
                className="py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-border-subtle text-xs font-mono text-on-surface transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Save Frame PNG</span>
              </button>

              <button
                onClick={handleDownloadSpriteSheet}
                className="py-2 px-3 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Sheet PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
