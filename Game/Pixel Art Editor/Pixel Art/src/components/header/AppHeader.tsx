import React from 'react';
import { usePixelStore } from '../../store/usePixelStore';
import { AppTab } from '../../types/pixel';
import { 
  Grid, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Users, 
  Layers, 
  Palette, 
  Film, 
  Sparkles,
  Maximize2
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export const AppHeader: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    zoom, 
    setZoom, 
    showGrid, 
    setShowGrid, 
    resetView,
    peerJam,
    togglePeerJam
  } = usePixelStore();

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'editor', label: 'Editor', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'palettes', label: 'Palettes', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'layers', label: 'Layers', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'export', label: 'Export', icon: <Download className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 z-50 bg-surface-panel/95 backdrop-blur-xl border-b border-border-subtle px-4 flex items-center justify-between shadow-lg select-none">
      {/* Brand & Tabs */}
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('editor')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-container/30 border border-primary/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-md shadow-primary/10">
            <Grid className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight text-on-surface flex items-center gap-1.5">
              SpriteForge <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase font-bold tracking-normal">Pro</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-border-subtle/50">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-3">
        {/* Zoom & Grid HUD */}
        <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg border border-border-subtle">
          <Tooltip content="Zoom Out" shortcut="Ctrl -">
            <button
              onClick={() => setZoom((z) => Math.max(100, z - 100))}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <span 
            onClick={resetView}
            title="Click to reset zoom"
            className="font-mono text-xs text-on-surface-variant px-1.5 cursor-pointer hover:text-primary transition-colors min-w-[3rem] text-center"
          >
            {zoom}%
          </span>

          <Tooltip content="Zoom In" shortcut="Ctrl +">
            <button
              onClick={() => setZoom((z) => Math.min(2400, z + 100))}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <span className="w-[1px] h-3.5 bg-border-subtle mx-1" />

          <Tooltip content={showGrid ? "Hide Grid" : "Show Grid"} shortcut="G">
            <button
              onClick={() => setShowGrid((g) => !g)}
              className={`p-1 rounded transition-colors ${
                showGrid ? 'text-secondary bg-surface-container-high' : 'text-text-muted hover:text-on-surface'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>

        {/* Peer Jam Live Room Button */}
        <Tooltip content={peerJam.enabled ? "Live Jam Enabled (Multi-Tab Synced)" : "Join Live Peer Jam"}>
          <button
            onClick={togglePeerJam}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
              peerJam.enabled
                ? 'bg-secondary/15 border-secondary/40 text-secondary shadow-sm shadow-secondary/10'
                : 'bg-surface-container border-border-subtle text-text-muted hover:text-on-surface'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{peerJam.enabled ? `Jam (${peerJam.peers.length + 1})` : 'Live Jam'}</span>
            {peerJam.enabled && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
          </button>
        </Tooltip>

        {/* Export Action */}
        <button
          onClick={() => setActiveTab('export')}
          className="flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary-container transition-all shadow-md shadow-primary/20 hover:scale-[1.02]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
