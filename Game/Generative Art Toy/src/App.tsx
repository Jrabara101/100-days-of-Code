import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArtToySettings, 
  AttractorPoint 
} from '@/types';
import { 
  DEFAULT_SETTINGS, 
  encodeStateToHash, 
  decodeStateFromHash, 
  saveSettingsToStorage, 
  loadSettingsFromStorage,
  generateCuratedSerendipity 
} from '@/lib/stateSerializer';
import { soundSynth } from '@/lib/algorithms/audioEngine';
import { useGenerativeCanvas } from '@/hooks/useGenerativeCanvas';
import { TopTelemetryBar } from '@/components/TopTelemetryBar';
import { ParameterDrawer } from '@/components/ParameterDrawer';
import { ExportModal } from '@/components/ExportModal';
import { SlidersHorizontal, Dices, Info, Sparkles } from 'lucide-react';

export default function App() {
  // Initialize state from URL hash or storage or defaults
  const initialState = useMemo(() => {
    const decoded = decodeStateFromHash();
    const stored = loadSettingsFromStorage();
    const initialSettings: ArtToySettings = {
      ...DEFAULT_SETTINGS,
      ...(stored || {}),
      ...(decoded?.settings || {})
    };
    const initialSeed = decoded?.seed || Math.random().toString(36).substring(2, 9).toUpperCase();
    return { initialSettings, initialSeed };
  }, []);

  const [settings, setSettings] = useState<ArtToySettings>(initialState.initialSettings);
  const [seed, setSeed] = useState<string>(initialState.initialSeed);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(60);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(true);

  // Initial Attractors for Gravity mode
  const [attractors, setAttractors] = useState<AttractorPoint[]>([
    { id: '1', x: window.innerWidth * 0.35, y: window.innerHeight * 0.5, strength: 1.0 },
    { id: '2', x: window.innerWidth * 0.65, y: window.innerHeight * 0.5, strength: -0.8 },
  ]);

  // Canvas hook managing dual-canvas setup & 60fps typed array loop
  const {
    trailsCanvasRef,
    overlayCanvasRef,
    isHudVisible,
    pingHudActivity,
    clearCanvas,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    vectorStrokesRef
  } = useGenerativeCanvas({
    settings,
    isPlaying,
    attractors,
    seed,
    onFpsUpdate: setFps
  });

  // Sync sound setting to Web Audio Engine
  useEffect(() => {
    soundSynth.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Persist settings to LocalStorage and URL hash
  useEffect(() => {
    saveSettingsToStorage(settings);
    const hash = encodeStateToHash(settings, seed);
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  }, [settings, seed]);

  // Hide initial interactive hint after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        clearCanvas();
      } else if (e.key === 'd' || e.key === 'D') {
        handleChaosDice();
      } else if (e.key === 'm' || e.key === 'M') {
        setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearCanvas]);

  // Aesthetic Chaos Dice (Curated Serendipity)
  const handleChaosDice = useCallback(() => {
    const { settings: newSettings, seed: newSeed } = generateCuratedSerendipity();
    setSettings(prev => ({
      ...newSettings,
      soundEnabled: prev.soundEnabled // keep user's sound preference
    }));
    setSeed(newSeed);
    soundSynth.triggerSerendipityChord();
  }, []);

  // Add Attractor
  const handleAddAttractor = (isAttractor: boolean) => {
    const newA: AttractorPoint = {
      id: Math.random().toString(36).substring(2, 7),
      x: window.innerWidth * (0.3 + Math.random() * 0.4),
      y: window.innerHeight * (0.3 + Math.random() * 0.4),
      strength: isAttractor ? 1.0 : -1.0
    };
    setAttractors(prev => [...prev, newA]);
  };

  const handleClearAttractors = () => {
    setAttractors([]);
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setSeed(Math.random().toString(36).substring(2, 9).toUpperCase());
    clearCanvas();
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none bg-[#0A0B0E]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseMove={pingHudActivity}
      onTouchStart={pingHudActivity}
    >
      {/* CANVAS 1: Persistent historical trails with alpha-decay */}
      <canvas
        ref={trailsCanvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair"
      />

      {/* CANVAS 2: Ephemeral pointer overlays, attractor points, and symmetry guides */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />

      {/* Floating Auto-Hiding Glassmorphic HUD */}
      <div
        className={`transition-opacity duration-500 ${
          isHudVisible || isDrawerOpen || isExportOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <TopTelemetryBar
          settings={settings}
          isPlaying={isPlaying}
          fps={fps}
          seed={seed}
          onSettingsChange={setSettings}
          onTogglePlay={() => setIsPlaying(p => !p)}
          onChaosDice={handleChaosDice}
          onClearCanvas={clearCanvas}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
        />
      </div>

      {/* Floating Micro-Dock / Quick Pill (Always Accessible at Bottom) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full shadow-2xl pointer-events-auto">
        <button
          onClick={handleChaosDice}
          title="Roll Chaos Dice"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/50 hover:to-pink-500/50 border border-pink-400/40 text-pink-200 text-xs font-semibold shadow-[0_0_12px_rgba(236,72,153,0.3)] transition-all cursor-pointer active:scale-95"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Serendipity</span>
        </button>

        <div className="h-3.5 w-px bg-white/15" />

        <button
          onClick={() => setIsDrawerOpen(true)}
          title="Open Studio Physics Drawer"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white/70 hover:text-white text-xs font-medium hover:bg-white/10 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Physics Controls</span>
        </button>

        <div className="h-3.5 w-px bg-white/15" />

        <div className="flex items-center gap-1 text-[11px] text-white/50 font-mono px-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{settings.algorithm.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Initial Instant-Flow Onboarding Hint */}
      {showHint && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-black/60 backdrop-blur-xl border border-white/15 rounded-full text-xs text-white/80 shadow-2xl">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Drag cursor or touch anywhere to sculpt live vectors & harmonics</span>
          </div>
        </div>
      )}

      {/* Parameter Adjustment Drawer / Sheet */}
      <ParameterDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        settings={settings}
        attractors={attractors}
        onSettingsChange={setSettings}
        onAddAttractor={handleAddAttractor}
        onClearAttractors={handleClearAttractors}
        onResetDefaults={handleResetDefaults}
      />

      {/* Museum-Grade Exporter Modal */}
      <ExportModal
        open={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        canvas={trailsCanvasRef.current}
        vectorStrokes={vectorStrokesRef.current}
        inverted={settings.invertedBackground}
      />
    </div>
  );
}
