import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Simulation } from './engine/simulation.js';
import { LIFE_STAGES } from './engine/antEntity.js';
import SimCanvas from './components/SimCanvas.jsx';
import TopBar from './components/TopBar.jsx';
import ToolPalette from './components/ToolPalette.jsx';
import InspectorPanel from './components/InspectorPanel.jsx';
import ColonyManagementModal from './components/ColonyManagementModal.jsx';
import EvolutionTreeModal from './components/EvolutionTreeModal.jsx';
import StatisticsModal from './components/StatisticsModal.jsx';
import ScenarioModal from './components/ScenarioModal.jsx';
import Minimap from './components/Minimap.jsx';

export default function App() {
  // Initialize Core Simulation Engine
  const sim = useMemo(() => new Simulation(2000, 1400), []);

  // UI Reactive States
  const [resources, setResources] = useState({ ...sim.resources });
  const [population, setPopulation] = useState(sim.ants.length);
  const [broodCount, setBroodCount] = useState(0);
  const [gameHour, setGameHour] = useState(sim.gameHour);
  const [weather, setWeather] = useState(sim.weather);
  const [speedFactor, setSpeedFactor] = useState(sim.speedFactor);
  const [isPaused, setIsPaused] = useState(sim.isPaused);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Active Tool & Inspector
  const [activeTool, setActiveTool] = useState('INSPECT');
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Pheromone Layer View Filters
  const [pheromoneFilters, setPheromoneFilters] = useState({
    food: true,
    home: true,
    danger: true,
  });

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'colony' | 'evolution' | 'statistics' | 'scenarios' | null

  // Camera & Viewport
  const [camera, setCamera] = useState({
    x: sim.nest.x - window.innerWidth / 2,
    y: sim.nest.y - window.innerHeight / 2,
    zoom: 1.0,
  });
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Event Toasts
  const [notifications, setNotifications] = useState([]);

  // Main Game Loop (Physics & Logic)
  useEffect(() => {
    let lastTime = performance.now();
    let frameId;
    let uiThrottleTimer = 0;

    const loop = (time) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      // Update simulation physics & AI
      sim.update(dt);

      // Throttle React State Sync (every 100ms) for high performance
      uiThrottleTimer += dt;
      if (uiThrottleTimer >= 0.08) {
        uiThrottleTimer = 0;

        const adults = sim.ants.filter(a => a.stage === LIFE_STAGES.ADULT);
        const brood = sim.ants.filter(a => a.stage !== LIFE_STAGES.ADULT);

        setResources({ ...sim.resources });
        setPopulation(adults.length);
        setBroodCount(brood.length);
        setGameHour(sim.gameHour);
        setWeather(sim.weather);
        setNotifications([...sim.notifications]);

        // Keep selected entity up to date
        if (selectedEntity) {
          if (selectedEntity.hp !== undefined && selectedEntity.hp <= 0 && selectedEntity.stage === LIFE_STAGES.ADULT) {
            setSelectedEntity(null);
          } else {
            // Force re-render of inspector values
            setSelectedEntity({ ...selectedEntity });
          }
        }
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [sim, selectedEntity]);

  // Handlers
  const handleTogglePause = () => {
    sim.isPaused = !sim.isPaused;
    setIsPaused(sim.isPaused);
  };

  const handleSetSpeed = (factor) => {
    sim.speedFactor = factor;
    sim.isPaused = false;
    setSpeedFactor(factor);
    setIsPaused(false);
  };

  const handleToggleAudio = () => {
    const active = sim.audioEngine.toggleMusic();
    setIsAudioActive(active);
  };

  const handleTogglePheromoneFilter = (key) => {
    setPheromoneFilters(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleBoostEnergy = (entity) => {
    if (entity && entity.energy !== undefined) {
      entity.energy = entity.maxEnergy;
      entity.hp = entity.maxHp;
      sim.audioEngine.playSFX('deposit');
      setSelectedEntity({ ...entity });
    }
  };

  const handleKillEntity = (entity) => {
    if (entity) {
      entity.hp = 0;
      setSelectedEntity(null);
    }
  };

  const handleUpdateCasteRatios = (newRatios) => {
    sim.casteRatios = { ...newRatios };
  };

  const handleUnlockTech = (techId, cost) => {
    sim.unlockUpgrade(techId, cost);
  };

  const handleSelectScenario = (scenarioId) => {
    if (scenarioId === 'SPIDER_SIEGE') {
      // Spawn 4 spiders
      for (let i = 0; i < 4; i++) {
        sim.predators.push(new (sim.predators[0]?.constructor || Object)(
          sim.nextPredatorId++,
          sim.nest.x + (Math.random() - 0.5) * 600,
          sim.nest.y + (Math.random() - 0.5) * 600,
          'spider'
        ));
      }
      sim.addNotification('SCENARIO: Arachnid Siege initiated!', 'warning');
    } else if (scenarioId === 'RAIN_FLOOD') {
      sim.weather = 'RAIN';
      sim.rainIntensity = 1.0;
      sim.weatherTimer = 180;
      sim.addNotification('SCENARIO: Torrential Rainstorm started!', 'info');
    } else if (scenarioId === 'AUTUMN_HARVEST') {
      for (let i = 0; i < 5; i++) {
        sim.dropFood(
          sim.nest.x + (Math.random() - 0.5) * 800,
          sim.nest.y + (Math.random() - 0.5) * 800,
          'leaf',
          150
        );
      }
      sim.addNotification('SCENARIO: Autumn Foliage spawned across the map!', 'success');
    }
  };

  const handleNavigateMinimap = (worldX, worldY) => {
    setCamera(prev => ({
      ...prev,
      x: worldX - (canvasSize.width / 2) / prev.zoom,
      y: worldY - (canvasSize.height / 2) / prev.zoom,
    }));
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#06090e] select-none font-sans">
      {/* 2D Canvas Viewport */}
      <SimCanvas
        sim={sim}
        activeTool={activeTool}
        pheromoneFilters={pheromoneFilters}
        onSelectEntity={setSelectedEntity}
        camera={camera}
        setCamera={setCamera}
        setCanvasSize={setCanvasSize}
      />

      {/* Top Vital HUD Bar */}
      <TopBar
        sim={sim}
        resources={resources}
        population={population}
        broodCount={broodCount}
        gameHour={gameHour}
        weather={weather}
        speedFactor={speedFactor}
        isPaused={isPaused}
        isAudioActive={isAudioActive}
        onTogglePause={handleTogglePause}
        onSetSpeed={handleSetSpeed}
        onToggleAudio={handleToggleAudio}
        onOpenModal={setActiveModal}
      />

      {/* Left God Tool Palette & Pheromone Filters */}
      <ToolPalette
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        pheromoneFilters={pheromoneFilters}
        onTogglePheromoneFilter={handleTogglePheromoneFilter}
      />

      {/* Right Inspector Drawer */}
      <InspectorPanel
        selectedEntity={selectedEntity}
        onClose={() => setSelectedEntity(null)}
        onBoostEnergy={handleBoostEnergy}
        onKillEntity={handleKillEntity}
      />

      {/* Bottom Right Radar Minimap */}
      <Minimap
        sim={sim}
        camera={camera}
        canvasSize={canvasSize}
        onNavigate={handleNavigateMinimap}
      />

      {/* Live Event Notifications (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none max-w-md w-full">
        {notifications.slice(0, 3).map(n => (
          <div
            key={n.id}
            className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold shadow-2xl border backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              n.type === 'danger' || n.type === 'warning'
                ? 'bg-rose-950/80 text-rose-200 border-rose-500/50'
                : n.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50'
                : 'bg-slate-900/80 text-slate-200 border-slate-700/60'
            }`}
          >
            {n.text}
          </div>
        ))}
      </div>

      {/* Interactive Modals */}
      <ColonyManagementModal
        sim={sim}
        isOpen={activeModal === 'colony'}
        onClose={() => setActiveModal(null)}
        casteRatios={sim.casteRatios}
        onUpdateRatios={handleUpdateCasteRatios}
      />

      <EvolutionTreeModal
        sim={sim}
        isOpen={activeModal === 'evolution'}
        onClose={() => setActiveModal(null)}
        resources={resources}
        unlockedTechs={sim.upgrades.unlockedTechs}
        onUnlockTech={handleUnlockTech}
      />

      <StatisticsModal
        sim={sim}
        isOpen={activeModal === 'statistics'}
        onClose={() => setActiveModal(null)}
        stats={sim.stats}
        historySnapshots={sim.historySnapshots}
      />

      <ScenarioModal
        isOpen={activeModal === 'scenarios'}
        onClose={() => setActiveModal(null)}
        onSelectScenario={handleSelectScenario}
      />
    </main>
  );
}
