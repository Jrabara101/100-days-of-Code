import * as React from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Dices, 
  SlidersHorizontal, 
  Download, 
  Trash2, 
  Sun, 
  Moon, 
  Copy, 
  Check,
  Maximize2,
  Minimize2,
  Waves,
  Sparkles,
  Orbit,
  CircleDot
} from 'lucide-react';
import { ArtToySettings, AlgorithmType } from '@/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabItem } from './ui/tabs';

interface TopTelemetryBarProps {
  settings: ArtToySettings;
  isPlaying: boolean;
  fps: number;
  seed: string;
  onSettingsChange: (settings: ArtToySettings) => void;
  onTogglePlay: () => void;
  onChaosDice: () => void;
  onClearCanvas: () => void;
  onOpenDrawer: () => void;
  onOpenExport: () => void;
}

export function TopTelemetryBar({
  settings,
  isPlaying,
  fps,
  seed,
  onSettingsChange,
  onTogglePlay,
  onChaosDice,
  onClearCanvas,
  onOpenDrawer,
  onOpenExport
}: TopTelemetryBarProps) {
  const [copied, setCopied] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const algorithmTabs: TabItem<AlgorithmType>[] = [
    { id: 'flow_field', label: 'Flow Field', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'kaleidoscope', label: 'Kaleidoscope', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'gravity_orbit', label: 'Gravity Orbit', icon: <Orbit className="w-3.5 h-3.5" /> },
    { id: 'phyllotaxis', label: 'Phyllotaxis', icon: <CircleDot className="w-3.5 h-3.5" /> },
  ];

  const handleCopySeed = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const fpsVariant = fps >= 55 ? 'success' : fps >= 30 ? 'warning' : 'default';

  return (
    <header className="fixed top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2.5 pointer-events-auto">
      {/* Left Segment: Logo & Telemetry */}
      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-2xl shadow-xl">
        {/* Title branding */}
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 shadow-[0_0_10px_#00F0FF] animate-pulse" />
          <span className="font-semibold text-xs text-white tracking-wider uppercase hidden sm:inline">
            AetherFlow
          </span>
        </div>

        {/* Real-time FPS telemetry badge */}
        <Badge variant={fpsVariant} className="text-[10px] tracking-tight">
          {fps} FPS
        </Badge>

        {/* Particles count badge */}
        <Badge variant="default" className="text-[10px] hidden md:inline-flex">
          {settings.particleCount.toLocaleString()} particles
        </Badge>

        {/* Deterministic Seed hash badge with one-click copy */}
        <button
          onClick={handleCopySeed}
          title="Click to copy shareable URL seed"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-[11px] font-mono transition-all cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
          <span>#{seed}</span>
        </button>
      </div>

      {/* Center Segment: Mode Switcher Tabs */}
      <div className="order-3 xl:order-2">
        <Tabs
          items={algorithmTabs}
          value={settings.algorithm}
          onChange={(newAlg) => onSettingsChange({ ...settings, algorithm: newAlg })}
        />
      </div>

      {/* Right Segment: Playback, Chaos Dice & Utility Controls */}
      <div className="order-2 xl:order-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-xl">
        {/* Aesthetic Chaos Dice */}
        <Button
          variant="neon"
          size="sm"
          onClick={onChaosDice}
          title="Roll Aesthetic Chaos Dice (Curated Serendipity)"
          className="gap-1.5 font-semibold"
        >
          <Dices className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chaos Dice</span>
        </Button>

        {/* Play/Pause toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onTogglePlay}
          title={isPlaying ? "Pause Simulation" : "Resume Simulation"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
        </Button>

        {/* Audio Mute/Unmute toggle */}
        <Button
          variant={settings.soundEnabled ? "default" : "ghost"}
          size="icon"
          onClick={() => onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}
          title={settings.soundEnabled ? "Mute Web Audio Chimes" : "Enable Pentatonic Ambient Chimes"}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <VolumeX className="w-4 h-4 opacity-50" />
          )}
        </Button>

        {/* Invert Background Void */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSettingsChange({ ...settings, invertedBackground: !settings.invertedBackground })}
          title="Invert Void Background"
        >
          {settings.invertedBackground ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>

        {/* Clear Canvas */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearCanvas}
          title="Clear Trails Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Sliders Drawer Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenDrawer}
          title="Adjust Parameters & Physics"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>

        {/* Museum Export Modal Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenExport}
          title="Export 4K/8K PNG, SVG, or WebM"
          className="gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Export</span>
        </Button>

        {/* Fullscreen Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
          className="hidden sm:inline-flex"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
