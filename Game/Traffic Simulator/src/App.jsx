import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrafficEngine } from './engine/TrafficEngine.js';
import { SimulationCanvas } from './components/SimulationCanvas.jsx';
import { TopHeader } from './components/TopHeader.jsx';
import { ControlPanel } from './components/ControlPanel.jsx';
import { TelemetryHUD } from './components/TelemetryHUD.jsx';
import { VehicleInspectorModal } from './components/VehicleInspectorModal.jsx';
import { DisturbancesToolbar } from './components/DisturbancesToolbar.jsx';

export default function App() {
  // Headless Engine Instance
  const engine = useMemo(() => new TrafficEngine(1200, 800), []);

  const [currentScenario, setCurrentScenario] = useState('SUGIYAMA_RING');
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // HUD and Drawer state
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [isTelemetryHudOpen, setIsTelemetryHudOpen] = useState(true);

  // Visual options
  const [visualOptions, setVisualOptions] = useState({
    showHeatmap: false,
    showHeadways: true,
    showStopLines: true
  });

  // Throttled Telemetry State for React UI
  const [telemetry, setTelemetry] = useState(engine.telemetry);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry({ ...engine.telemetry });
    }, 150); // 6.6 Hz update rate for React HUD, leaving 60Hz loop to Canvas
    return () => clearInterval(interval);
  }, [engine]);

  // Scenario Switcher
  const handleScenarioChange = useCallback((scenarioKey) => {
    setCurrentScenario(scenarioKey);
    setSelectedVehicleId(null);
    engine.initScenario(scenarioKey);
  }, [engine]);

  // Pause / Resume
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      engine.isPaused = next;
      return next;
    });
  }, [engine]);

  // Speed Multiplier
  const handleChangeSpeed = useCallback((speed) => {
    setSpeedMultiplier(speed);
    engine.speedMultiplier = speed;
  }, [engine]);

  // Reset
  const handleReset = useCallback(() => {
    setSelectedVehicleId(null);
    engine.reset();
  }, [engine]);

  // Spawner & Signals handlers
  const handleSpawnVehicle = (laneId, profileKey, vehicleType) => {
    engine.spawnVehicle(laneId, profileKey, vehicleType);
  };

  const handleForceCycleLight = () => {
    if (engine.trafficLight) {
      engine.trafficLight.forceCycleNext();
    }
  };

  const handleClearVehicles = () => {
    engine.vehicles = [];
    setSelectedVehicleId(null);
  };

  const handleTapBrake = () => {
    engine.triggerTapBrakeLeader();
  };

  const handleToggleStall = () => {
    engine.toggleStallSelected();
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when typing inside inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 'b' || e.key === 'B') {
        handleTapBrake();
      } else if (e.key === 's' || e.key === 'S') {
        handleToggleStall();
      } else if (e.key === 'h' || e.key === 'H') {
        setVisualOptions(v => ({ ...v, showHeatmap: !v.showHeatmap }));
      } else if (e.key === 't' || e.key === 'T') {
        setIsTelemetryHudOpen(o => !o);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsControlPanelOpen(o => !o);
      } else if (e.key === '1') {
        handleScenarioChange('SUGIYAMA_RING');
      } else if (e.key === '2') {
        handleScenarioChange('FOUR_WAY_INTERSECTION');
      } else if (e.key === '3') {
        handleScenarioChange('HIGHWAY_BOTTLENECK');
      } else if (e.key === '4') {
        handleScenarioChange('ROUNDABOUT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause, handleReset, handleScenarioChange]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cyber-950 flex flex-col justify-between select-none">
      {/* 1. TOP HEADER & HUD BAR */}
      <TopHeader
        engine={engine}
        currentScenario={currentScenario}
        onScenarioChange={handleScenarioChange}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        speedMultiplier={speedMultiplier}
        onChangeSpeed={handleChangeSpeed}
        onReset={handleReset}
        telemetry={telemetry}
        isControlPanelOpen={isControlPanelOpen}
        onToggleControlPanel={() => setIsControlPanelOpen(p => !p)}
        isTelemetryHudOpen={isTelemetryHudOpen}
        onToggleTelemetryHud={() => setIsTelemetryHudOpen(p => !p)}
      />

      {/* 2. MAIN HARDWARE-ACCELERATED 2D SIMULATION CANVAS */}
      <div className="absolute inset-0 z-10">
        <SimulationCanvas
          engine={engine}
          visualOptions={visualOptions}
          onSelectVehicle={(id) => setSelectedVehicleId(id)}
          selectedVehicleId={selectedVehicleId}
        />
      </div>

      {/* 3. COLLAPSIBLE ENGINE CONTROL DRAWER */}
      <ControlPanel
        isOpen={isControlPanelOpen}
        onClose={() => setIsControlPanelOpen(false)}
        engine={engine}
        visualOptions={visualOptions}
        onUpdateVisualOptions={(opts) => setVisualOptions(prev => ({ ...prev, ...opts }))}
        onSpawnVehicle={handleSpawnVehicle}
        onForceCycleLight={handleForceCycleLight}
        onClearVehicles={handleClearVehicles}
      />

      {/* 4. SPACE-TIME & MACROSCOPIC TELEMETRY HUD */}
      <TelemetryHUD
        isOpen={isTelemetryHudOpen}
        onClose={() => setIsTelemetryHudOpen(false)}
        engine={engine}
      />

      {/* 5. VEHICLE INSPECTOR MODAL */}
      <VehicleInspectorModal
        vehicleId={selectedVehicleId}
        engine={engine}
        onClose={() => setSelectedVehicleId(null)}
      />

      {/* 6. DISTURBANCES ACTION BAR */}
      <DisturbancesToolbar
        onTapBrake={handleTapBrake}
        onToggleStall={handleToggleStall}
        engine={engine}
      />
    </div>
  );
}
