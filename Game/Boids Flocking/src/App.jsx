import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BoidsEngine3D } from './engine/BoidsEngine3D';
import { PRESETS } from './engine/presets';
import { synth } from './utils/audioSynth';
import { BoidsViewport } from './components/BoidsViewport';
import { TopNav } from './components/HUD/TopNav';
import { ControlDrawer } from './components/HUD/ControlDrawer';
import { FloatingActions } from './components/HUD/FloatingActions';
import { TelemetryModal } from './components/HUD/TelemetryModal';

export function App() {
  // Initialize headless engine once
  const [engine] = useState(() => new BoidsEngine3D(1400));

  // Simulation Parameters & Behavioral Weights
  const [numBoids, setNumBoids] = useState(1400);
  const [activePreset, setActivePreset] = useState('murmuration');
  const [weights, setWeights] = useState({
    weightSep: 1.8,
    weightAli: 1.6,
    weightCoh: 1.2,
    weightTarget: 0.5,
    neighborRadius: 9.0,
    separationRadius: 3.2,
    maxSpeed: 1.5,
    minSpeed: 0.7,
    maxForce: 0.09,
  });

  // Visual & Rendering State
  const [colorTheme, setColorTheme] = useState('cyan');
  const [cameraMode, setCameraMode] = useState('default');
  const [showBounds, setShowBounds] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showTarget, setShowTarget] = useState(true);
  const [showPredator, setShowPredator] = useState(false);
  const [mouseTargeting, setMouseTargeting] = useState(false);

  // Playback & Interactive State
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);

  // Real-time Telemetry
  const [telemetry, setTelemetry] = useState({
    boids: 1400,
    fps: 60,
    avgSpeed: '1.15',
    activeBuckets: 48,
    stepMs: '0.42',
  });

  // Sync Boid Count
  const handleNumBoidsChange = (count) => {
    setNumBoids(count);
    engine.setNumBoids(count);
  };

  // Sync Individual Weights
  const handleWeightChange = (key, value) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
    engine[key] = value;
    if (key === 'neighborRadius') {
      engine.cellSize = Math.max(4.0, value);
    }
  };

  // Apply Preset Configuration
  const handleSelectPreset = (presetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setActivePreset(presetId);
    setNumBoids(preset.boids);
    engine.setNumBoids(preset.boids);

    const newWeights = {
      weightSep: preset.weightSep,
      weightAli: preset.weightAli,
      weightCoh: preset.weightCoh,
      weightTarget: preset.weightTarget,
      neighborRadius: preset.neighborRadius,
      separationRadius: preset.separationRadius,
      maxSpeed: preset.maxSpeed,
      minSpeed: preset.minSpeed,
      maxForce: preset.maxForce,
    };

    setWeights(newWeights);
    Object.assign(engine, newWeights);
    engine.cellSize = Math.max(4.0, preset.neighborRadius);

    setColorTheme(preset.colorTheme);
    setShowTarget(preset.targetActive);
    engine.target.active = preset.targetActive;

    setShowPredator(preset.predatorActive);
    engine.predator.active = preset.predatorActive;

    engine.scramble(0.8);
    synth.playBurst();
  };

  // Toggle Target Attractor
  const handleToggleTarget = () => {
    const next = !engine.target.active;
    engine.target.active = next;
    setShowTarget(next);
  };

  // Toggle Predator Agent
  const handleTogglePredator = () => {
    const next = !engine.predator.active;
    engine.predator.active = next;
    setShowPredator(next);
  };

  // Scramble / Impulse Actions
  const handleScramble = () => {
    engine.scramble(1.2);
    synth.playBurst();
  };

  const handleShockwave = () => {
    engine.radialImpulse(0, 0, 0, 3.5);
    synth.playBurst();
  };

  // Toggle Audio Generative Synthesizer
  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    synth.toggle(next);
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Reset to Baseline Defaults
  const handleResetDefaults = () => {
    handleSelectPreset('murmuration');
  };

  // Telemetry Callback from Viewport
  const handleTelemetryUpdate = useCallback((data) => {
    setTelemetry(data);
    synth.update(parseFloat(data.avgSpeed), data.boids);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-cyber-dark select-none">
      {/* 3D WebGL Canvas Layer */}
      <BoidsViewport
        engine={engine}
        colorTheme={colorTheme}
        showBounds={showBounds}
        showGrid={showGrid}
        showTarget={showTarget}
        showPredator={showPredator}
        cameraMode={cameraMode}
        mouseTargeting={mouseTargeting}
        isPaused={isPaused}
        onTelemetryUpdate={handleTelemetryUpdate}
      />

      {/* Top HUD Header */}
      <TopNav
        telemetry={telemetry}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        onOpenTelemetryModal={() => setIsTelemetryModalOpen(true)}
        onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
        isDrawerOpen={isDrawerOpen}
      />

      {/* Floating Bottom Quick HUD & Reynolds Sliders */}
      <FloatingActions
        weights={weights}
        onWeightChange={handleWeightChange}
        targetActive={showTarget && engine.target.active}
        onToggleTarget={handleToggleTarget}
        onScramble={handleScramble}
        onShockwave={handleShockwave}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Slide-out Parameter Drawer */}
      <ControlDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        engine={engine}
        numBoids={numBoids}
        onNumBoidsChange={handleNumBoidsChange}
        weights={weights}
        onWeightChange={handleWeightChange}
        colorTheme={colorTheme}
        onColorThemeChange={setColorTheme}
        cameraMode={cameraMode}
        onCameraModeChange={setCameraMode}
        showBounds={showBounds}
        onToggleBounds={() => setShowBounds((prev) => !prev)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        showTarget={showTarget}
        onToggleTarget={handleToggleTarget}
        showPredator={showPredator}
        onTogglePredator={handleTogglePredator}
        mouseTargeting={mouseTargeting}
        onToggleMouseTargeting={() => {
          const next = !mouseTargeting;
          setMouseTargeting(next);
          engine.target.mode = next ? 'mouse' : 'lissajous';
        }}
        onResetDefaults={handleResetDefaults}
      />

      {/* Systems Architecture & Math Inspector Modal */}
      <TelemetryModal
        isOpen={isTelemetryModalOpen}
        onClose={() => setIsTelemetryModalOpen(false)}
        telemetry={telemetry}
        engine={engine}
      />
    </div>
  );
}

export default App;
