import { useState, useRef, useEffect, useCallback } from 'react';
import type { PosterTemplateConfig, AspectRatioType, PaletteKey, StickerItem } from '../types/jam';
import { 
  renderPosterToCanvas, 
  generatePosterSvg, 
  ASPECT_DIMENSIONS, 
  PALETTES, 
  AVAILABLE_BADGES 
} from '../lib/posterCanvasEngine';
import { soundFx } from '../lib/soundFx';
import { 
  Download, 
  Copy, 
  Sparkles, 
  Palette, 
  Share2, 
  Plus, 
  Trash2, 
  Code, 
  Check, 
  Sliders, 
  Zap, 
  Layers 
} from 'lucide-react';

interface AssetStudioDockProps {
  currentThemeKeyword: string;
  currentThemeTagline: string;
}

export const AssetStudioDock = ({
  currentThemeKeyword,
  currentThemeTagline
}: AssetStudioDockProps) => {
  const [config, setConfig] = useState<PosterTemplateConfig>({
    jamTitle: 'CYBER-JAM 2026',
    themeTagline: currentThemeKeyword || currentThemeTagline || 'ASYMMETRIC VELOCITY',
    startDate: 'OCT 24',
    endDate: 'OCT 26',
    aspectRatio: '16:9',
    paletteKey: 'cyber_neon',
    sponsorBadges: ['⚡ GODOT 4', '🦀 BEVY', '🎮 ITCH.IO', '🕹️ UNITY'],
    customStickers: [
      { id: 'st-1', x: 25, y: 72, scale: 1.1, glyph: '⏱️', label: '48H SPEEDRUN' },
      { id: 'st-2', x: 75, y: 72, scale: 1.1, glyph: '🦀', label: 'BEVY RUST' }
    ],
    engineTag: 'Godot 4.3',
    teamName: 'Team Void-Riders',
    prizePool: '$10,000 USD'
  });

  const [exportScale, setExportScale] = useState<number>(2); // Default 2x high-DPI
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'stickers' | 'social_card'>('editor');
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync theme tagline if updated externally
  useEffect(() => {
    if (currentThemeKeyword && currentThemeKeyword !== 'ENCRYPTED // STAND BY') {
      setConfig(prev => ({
        ...prev,
        themeTagline: currentThemeKeyword
      }));
    }
  }, [currentThemeKeyword]);

  // Render canvas whenever config changes
  const redraw = useCallback(() => {
    if (canvasRef.current) {
      renderPosterToCanvas(canvasRef.current, config, 1);
    }
  }, [config]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle Dragging Stickers directly on the Canvas Preview
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Find closest sticker within radius
    const hit = config.customStickers.find(st => {
      const dist = Math.hypot(st.x - clickX, st.y - clickY);
      return dist < 12;
    });

    if (hit) {
      setDraggingStickerId(hit.id);
      soundFx.playUiClick(850);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingStickerId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let moveX = ((e.clientX - rect.left) / rect.width) * 100;
    let moveY = ((e.clientY - rect.top) / rect.height) * 100;

    // Magnetic snap-to-grid (steps of 5%)
    if (Math.abs(moveX - 50) < 3) moveX = 50; // Center snap
    if (Math.abs(moveY - 50) < 3) moveY = 50;
    moveX = Math.round(moveX * 2) / 2;
    moveY = Math.round(moveY * 2) / 2;

    setConfig(prev => ({
      ...prev,
      customStickers: prev.customStickers.map(st => 
        st.id === draggingStickerId ? { ...st, x: moveX, y: moveY } : st
      )
    }));
  };

  const handleCanvasMouseUp = () => {
    if (draggingStickerId) {
      soundFx.playUiClick(700);
      setDraggingStickerId(null);
    }
  };

  // Export PNG at chosen high-DPI scale (1x, 2x, 3x)
  const handleExportPng = () => {
    soundFx.playUiClick(900);
    const exportCanvas = document.createElement('canvas');
    renderPosterToCanvas(exportCanvas, config, exportScale);

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.jamTitle.toLowerCase().replace(/\s+/g, '-')}-${config.aspectRatio.toLowerCase()}-${exportScale}x.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // Export clean Vector SVG
  const handleExportSvg = () => {
    soundFx.playUiClick(880);
    const svgString = generatePosterSvg(config);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.jamTitle.toLowerCase().replace(/\s+/g, '-')}-${config.aspectRatio.toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy PNG directly to system clipboard
  const handleCopyToClipboard = async () => {
    soundFx.playUiClick(950);
    try {
      const exportCanvas = document.createElement('canvas');
      renderPosterToCanvas(exportCanvas, config, 1);
      exportCanvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard API error, fallback to SVG text copy:', err);
      navigator.clipboard.writeText(generatePosterSvg(config));
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    }
  };

  // Add a sticker
  const handleAddSticker = (glyphLabel: string) => {
    soundFx.playUiClick(1000);
    const parts = glyphLabel.split(' ');
    const glyph = parts[0];
    const label = parts.slice(1).join(' ');

    const newSticker: StickerItem = {
      id: `st-${Date.now()}`,
      x: 50,
      y: 50,
      scale: 1.0,
      glyph,
      label
    };

    setConfig(prev => ({
      ...prev,
      customStickers: [...prev.customStickers, newSticker]
    }));
  };

  const handleRemoveSticker = (id: string) => {
    soundFx.playUiClick(500);
    setConfig(prev => ({
      ...prev,
      customStickers: prev.customStickers.filter(st => st.id !== id)
    }));
  };

  // Calculate canvas aspect ratio styles for container
  const dim = ASPECT_DIMENSIONS[config.aspectRatio];
  const aspectFraction = `${dim.width} / ${dim.height}`;

  return (
    <div id="poster-forge" className="bg-[#0F121C] border border-[#222B42] rounded-xl overflow-hidden shadow-2xl">
      {/* Studio Header */}
      <div className="bg-[#171D2F] px-5 py-4 border-b border-[#222B42] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-white tracking-wide">POSTER & BANNER FORGE</h2>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                HIGH-DPI v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Real-time in-browser graphic forge. Zero external services. Instant high-res export.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#08090D] p-1 rounded-lg border border-[#222B42]">
          <button
            onClick={() => { setActiveTab('editor'); soundFx.playUiClick(700); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'editor' ? 'bg-[#171D2F] text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Controls
          </button>
          <button
            onClick={() => { setActiveTab('stickers'); soundFx.playUiClick(700); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'stickers' ? 'bg-[#171D2F] text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Badges ({config.customStickers.length})
          </button>
          <button
            onClick={() => { setActiveTab('social_card'); soundFx.playUiClick(700); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'social_card' ? 'bg-[#171D2F] text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> Team Embed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* LEFT COLUMN: Controls Dock (5 cols) */}
        <div className="lg:col-span-5 p-5 border-r border-[#222B42] space-y-5 bg-[#0F121C]/90 overflow-y-auto max-h-[720px]">
          {/* 1. Aspect Ratio Format Tabs */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              CANVAS FORMAT & ASPECT RATIO
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['16:9', '1:1', '9:16', 'A3_PRINT'] as AspectRatioType[]).map((ar) => (
                <button
                  key={ar}
                  onClick={() => {
                    soundFx.playUiClick(750);
                    setConfig(prev => ({ ...prev, aspectRatio: ar }));
                  }}
                  className={`px-3 py-2.5 rounded-lg border text-left text-xs transition-all ${
                    config.aspectRatio === ar
                      ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 font-bold shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/50'
                      : 'border-[#222B42] bg-[#171D2F] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-mono text-sm">{ar}</div>
                  <div className="text-[10px] text-slate-400 truncate">{ASPECT_DIMENSIONS[ar].label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Colorway Palette Selector */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-rose-400" /> COLORWAY CHROMATICS
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PALETTES) as PaletteKey[]).map((pkey) => {
                const pal = PALETTES[pkey];
                return (
                  <button
                    key={pkey}
                    onClick={() => {
                      soundFx.playUiClick(750);
                      setConfig(prev => ({ ...prev, paletteKey: pkey }));
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      config.paletteKey === pkey
                        ? 'border-rose-500 bg-rose-950/20 text-white font-bold ring-1 ring-rose-500/50'
                        : 'border-[#222B42] bg-[#171D2F] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.primary }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.secondary }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: pal.accent }} />
                    </div>
                    <div className="capitalize font-mono text-[11px] text-slate-300">{pkey.replace('_', ' ')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'editor' && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">JAM HEADLINE</label>
                <input
                  type="text"
                  value={config.jamTitle}
                  onChange={(e) => setConfig({ ...config, jamTitle: e.target.value })}
                  className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">THEME TAGLINE</label>
                <input
                  type="text"
                  value={config.themeTagline}
                  onChange={(e) => setConfig({ ...config, themeTagline: e.target.value })}
                  className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">START DATE</label>
                  <input
                    type="text"
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">END DATE</label>
                  <input
                    type="text"
                    value={config.endDate}
                    onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                    className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">PRIZE POOL CALLOUT</label>
                <input
                  type="text"
                  value={config.prizePool || ''}
                  onChange={(e) => setConfig({ ...config, prizePool: e.target.value })}
                  placeholder="$10,000 USD or Special Trophy"
                  className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-amber-300 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          )}

          {activeTab === 'stickers' && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">CLICK TO ADD BADGE ARSENAL</span>
                <span className="text-[10px] text-cyan-400 font-mono">DRAG ON PREVIEW TO REPOSITION</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_BADGES.map((b) => (
                  <button
                    key={b}
                    onClick={() => handleAddSticker(b)}
                    className="px-2.5 py-1 bg-[#171D2F] hover:bg-cyan-950/40 hover:border-cyan-500/50 border border-[#222B42] rounded text-xs text-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-cyan-400" /> {b}
                  </button>
                ))}
              </div>

              {/* Active Badges List */}
              <div className="pt-2">
                <label className="block text-xs font-mono text-slate-400 mb-2">ACTIVE CANVAS BADGES</label>
                {config.customStickers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No badges placed. Click above to inject.</p>
                ) : (
                  <div className="space-y-2">
                    {config.customStickers.map((st) => (
                      <div key={st.id} className="flex items-center justify-between bg-[#171D2F] px-3 py-1.5 rounded border border-[#222B42] text-xs">
                        <span className="font-mono text-white flex items-center gap-1.5">
                          <span>{st.glyph}</span> <span>{st.label}</span>
                          <span className="text-[10px] text-slate-500">({st.x}%, {st.y}%)</span>
                        </span>
                        <button
                          onClick={() => handleRemoveSticker(st.id)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                          title="Remove badge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'social_card' && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">TEAM / SQUAD NAME</label>
                <input
                  type="text"
                  value={config.teamName || ''}
                  onChange={(e) => setConfig({ ...config, teamName: e.target.value })}
                  className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">GAME ENGINE IN USE</label>
                <select
                  value={config.engineTag || 'Godot'}
                  onChange={(e) => setConfig({ ...config, engineTag: e.target.value })}
                  className="w-full bg-[#171D2F] border border-[#222B42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="Godot 4.3">Godot 4.3</option>
                  <option value="Bevy 0.14 (Rust)">Bevy 0.14 (Rust)</option>
                  <option value="Unity 6">Unity 6</option>
                  <option value="Unreal Engine 5">Unreal Engine 5</option>
                  <option value="Three.js / WebGL">Three.js / WebGL</option>
                  <option value="PICO-8">PICO-8</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-cyan-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Dynamic Team Teaser Card
                </div>
                <p>
                  This configuration embeds your team name and primary tech stack directly into the social embed banner.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Live Canvas Staging Dock (7 cols) */}
        <div className="lg:col-span-7 p-5 flex flex-col justify-between bg-[#08090D] relative">
          {/* Top Canvas Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">PREVIEW VIEWPORT</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded">
                DRAG STICKERS TO MOVE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-400">DPI SCALE:</label>
              <select
                value={exportScale}
                onChange={(e) => setExportScale(Number(e.target.value))}
                className="bg-[#171D2F] border border-[#222B42] rounded px-2 py-1 text-xs text-white font-mono focus:outline-none"
              >
                <option value={1}>1x (Standard Web)</option>
                <option value={2}>2x (Retina High-DPI)</option>
                <option value={3}>3x (Ultra Print 4K)</option>
              </select>
            </div>
          </div>

          {/* Interactive Canvas Viewport */}
          <div 
            ref={containerRef}
            className="w-full flex items-center justify-center p-4 bg-[#0B0D14] border border-[#222B42] rounded-xl shadow-inner relative overflow-hidden"
            style={{ minHeight: '380px' }}
          >
            <div 
              className="relative max-w-full max-h-[460px] shadow-2xl rounded border border-slate-700/50 transition-all duration-300 ease-out"
              style={{ aspectRatio: aspectFraction }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="w-full h-full block rounded cursor-crosshair object-contain"
              />
            </div>
          </div>

          {/* Bottom Export Action Bar */}
          <div className="mt-4 pt-4 border-t border-[#222B42] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-mono text-slate-500">
              OUTPUT: {dim.width * exportScale} × {dim.height * exportScale} px (PNG)
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Copy to clipboard */}
              <button
                onClick={handleCopyToClipboard}
                className="px-3 py-2 bg-[#171D2F] hover:bg-[#222B42] text-slate-200 border border-[#222B42] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Copy PNG to clipboard"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" /> Copy Image
                  </>
                )}
              </button>

              {/* Vector SVG */}
              <button
                onClick={handleExportSvg}
                className="px-3 py-2 bg-[#171D2F] hover:bg-[#222B42] text-slate-200 border border-[#222B42] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Download Vector SVG"
              >
                <Code className="w-3.5 h-3.5 text-purple-400" /> Vector SVG
              </button>

              {/* High-DPI PNG Download */}
              <button
                onClick={handleExportPng}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-cyan-500 hover:from-rose-600 hover:to-cyan-600 text-white rounded-lg text-xs font-bold font-mono tracking-wider shadow-lg shadow-rose-950/40 flex items-center gap-2 transition-transform active:scale-95"
              >
                <Download className="w-4 h-4" /> EXPORT {exportScale}X PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
