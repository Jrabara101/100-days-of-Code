import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DeltaHistoryStep,
  EditorTool,
  HeatmapPoint,
  LevelEntity,
  LevelMap,
  MapLayer,
  TileData,
} from './types/index.js';
import { TopBar } from './components/TopBar.js';
import { Toolbar } from './components/Toolbar.js';
import { CanvasViewport } from './components/CanvasViewport.js';
import { RightDock } from './components/RightDock.js';
import { TilesetDrawer } from './components/TilesetDrawer.js';
import { ExportDialog } from './components/ExportDialog.js';
import { ArcadeVaultModal } from './components/ArcadeVaultModal.js';
import { sound } from './utils/audio.js';

// Default starter fallback map
const DEFAULT_MAP: LevelMap = {
  id: 'map-forge-starter',
  title: 'Emerald Citadel 01',
  author: 'Forge Architect',
  description: 'Tactile level design playground with auto-tiled grass terrain, floating platforms, and a wire-linked vault blast door.',
  dimensions: {
    widthInTiles: 36,
    heightInTiles: 22,
    tileSize: 32,
  },
  layers: [
    {
      id: 'bg-parallax',
      name: 'Background Parallax',
      type: 'parallax',
      visible: true,
      opacity: 0.7,
      parallaxFactor: { x: 0.3, y: 0.2 },
      grid: {},
    },
    {
      id: 'terrain-midground',
      name: 'Terrain Midground',
      type: 'tile',
      visible: true,
      opacity: 1,
      parallaxFactor: { x: 1, y: 1 },
      grid: createInitialStarterGrid(),
    },
    {
      id: 'collision-geometry',
      name: 'Collision Geometry',
      type: 'collision',
      visible: false,
      opacity: 0.6,
      parallaxFactor: { x: 1, y: 1 },
      grid: {},
    },
    {
      id: 'foreground-canopy',
      name: 'Foreground Accents',
      type: 'tile',
      visible: true,
      opacity: 0.9,
      parallaxFactor: { x: 1.15, y: 1.1 },
      grid: {},
    },
  ],
  entities: [
    {
      id: 'spawn-player-1',
      name: 'Player Spawn',
      type: 'player_spawn',
      position: { x: 4 * 32, y: 14 * 32 },
      properties: { facing: 'right' },
      connectedEntityIds: [],
    },
    {
      id: 'gem-1',
      name: 'Solar Gem',
      type: 'collectible',
      position: { x: 9 * 32 + 6, y: 12 * 32 },
      properties: { points: 100, variant: 'gem' },
      connectedEntityIds: [],
    },
    {
      id: 'gem-2',
      name: 'Solar Gem 2',
      type: 'collectible',
      position: { x: 15 * 32 + 6, y: 10 * 32 },
      properties: { points: 150, variant: 'gem' },
      connectedEntityIds: [],
    },
    {
      id: 'gem-3',
      name: 'Star Core',
      type: 'collectible',
      position: { x: 23 * 32 + 6, y: 11 * 32 },
      properties: { points: 300, variant: 'gold' },
      connectedEntityIds: [],
    },
    {
      id: 'switch-1',
      name: 'Pressure Relay',
      type: 'trigger',
      position: { x: 12 * 32, y: 15 * 32 },
      properties: { triggered: false },
      connectedEntityIds: ['blast-door-1'],
    },
    {
      id: 'blast-door-1',
      name: 'Vault Blast Door',
      type: 'door',
      position: { x: 26 * 32, y: 13 * 32 },
      properties: { isOpen: false, locked: true },
      connectedEntityIds: [],
    },
    {
      id: 'sentinel-1',
      name: 'Guard Drone',
      type: 'enemy',
      position: { x: 19 * 32, y: 15 * 32 },
      properties: { patrolRadius: 90, speed: 65, hp: 100 },
      connectedEntityIds: [],
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: ['starter', 'platformer', 'overworld'],
};

function createInitialStarterGrid(): Record<string, TileData> {
  const grid: Record<string, TileData> = {};

  // Main ground
  for (let x = 2; x <= 16; x++) {
    for (let y = 16; y <= 19; y++) {
      grid[`${x},${y}`] = {
        tilesetId: 'grass',
        sourceX: x % 4,
        sourceY: y === 16 ? 0 : 1,
        collision: 'solid',
      };
    }
  }

  // Hazard spikes in pit
  grid['17,17'] = { tilesetId: 'grass', sourceX: 3, sourceY: 2, collision: 'hazard' };
  grid['18,17'] = { tilesetId: 'grass', sourceX: 3, sourceY: 2, collision: 'hazard' };

  // Floating platforms
  for (let x = 9; x <= 11; x++) {
    grid[`${x},13`] = {
      tilesetId: 'grass',
      sourceX: x === 9 ? 0 : x === 11 ? 2 : 1,
      sourceY: 0,
      collision: 'platform_one_way',
    };
  }

  for (let x = 14; x <= 16; x++) {
    grid[`${x},11`] = {
      tilesetId: 'grass',
      sourceX: x === 14 ? 0 : x === 16 ? 2 : 1,
      sourceY: 0,
      collision: 'platform_one_way',
    };
  }

  // Right side terrain
  for (let x = 19; x <= 32; x++) {
    for (let y = 16; y <= 19; y++) {
      grid[`${x},${y}`] = {
        tilesetId: 'grass',
        sourceX: x % 4,
        sourceY: y === 16 ? 0 : 1,
        collision: 'solid',
      };
    }
  }

  // Raised platform
  for (let x = 22; x <= 24; x++) {
    grid[`${x},13`] = {
      tilesetId: 'grass',
      sourceX: x === 22 ? 0 : x === 24 ? 2 : 1,
      sourceY: 0,
      collision: 'platform_one_way',
    };
  }

  // Wall barrier
  for (let y = 13; y <= 15; y++) {
    grid[`26,${y}`] = {
      tilesetId: 'grass',
      sourceX: 1,
      sourceY: 2,
      collision: 'solid',
    };
  }

  return grid;
}

export function App() {
  const [map, setMap] = useState<LevelMap>(DEFAULT_MAP);
  const [activeLayerId, setActiveLayerId] = useState<string>('terrain-midground');
  const [activeTool, setActiveTool] = useState<EditorTool>('brush');
  const [activeBiomeId, setActiveBiomeId] = useState<string>('grass');
  const [isAutoTileEnabled, setIsAutoTileEnabled] = useState<boolean>(true);

  // Brush tile definition
  const [selectedTileDef, setSelectedTileDef] = useState<TileData | null>({
    tilesetId: 'grass',
    sourceX: 1,
    sourceY: 0,
    collision: 'solid',
  });

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Viewport & grid options
  const [gridSettings, setGridSettings] = useState({
    showGrid: true,
    snapToGrid: true,
    size: 32,
  });

  // Playtest state
  const [isPlaytesting, setIsPlaytesting] = useState<boolean>(false);

  // Command-Pattern History Stack (capped at 100 delta steps)
  const [undoStack, setUndoStack] = useState<DeltaHistoryStep[]>([]);
  const [redoStack, setRedoStack] = useState<DeltaHistoryStep[]>([]);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Telemetry & Death Heatmap
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [telemetryStats, setTelemetryStats] = useState({
    clears: 3,
    deaths: 8,
    clearRate: 27,
    bestTimeMs: 12350,
  });

  // Cloud Save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>('Just now');

  // Load starter map from backend on initial mount
  useEffect(() => {
    fetch('/api/maps')
      .then((r) => r.json())
      .then((data) => {
        if (data.maps && data.maps.length > 0) {
          const firstMapId = data.maps[0].id;
          fetch(`/api/maps/${firstMapId}`)
            .then((r) => r.json())
            .then((mapData) => {
              if (mapData.map) {
                setMap(mapData.map);
                if (mapData.map.layers && mapData.map.layers.length > 0) {
                  setActiveLayerId(mapData.map.layers[1]?.id || mapData.map.layers[0].id);
                }
              }
            });

          // Fetch heatmap
          fetch(`/api/maps/${firstMapId}/heatmap`)
            .then((r) => r.json())
            .then((hm) => {
              if (hm.points) setHeatmapPoints(hm.points);
              if (hm.stats) setTelemetryStats(hm.stats);
            })
            .catch(() => {});
        }
      })
      .catch((err) => console.log('Using local fallback starter map:', err));
  }, []);

  /* ------------------- HISTORY DELTA STACK (UNDO / REDO) ------------------- */
  const handleTileChange = useCallback(
    (layerId: string, changes: { key: string; before: TileData | null; after: TileData | null }[]) => {
      const step: DeltaHistoryStep = {
        description: 'Tile Paint Pass',
        timestamp: Date.now(),
        layerId,
        tileChanges: changes,
      };

      setUndoStack((prev) => [...prev.slice(-99), step]);
      setRedoStack([]); // clear redo stack on new action
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastStep = undoStack[undoStack.length - 1];

    setMap((prev) => {
      const updatedLayers = prev.layers.map((l) => {
        if (l.id !== lastStep.layerId) return l;
        const newGrid = { ...l.grid };
        for (const change of lastStep.tileChanges) {
          if (change.before === null) {
            delete newGrid[change.key];
          } else {
            newGrid[change.key] = change.before;
          }
        }
        return { ...l, grid: newGrid };
      });
      return { ...prev, layers: updatedLayers };
    });

    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastStep]);
    sound.playClick();
  }, [undoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextStep = redoStack[redoStack.length - 1];

    setMap((prev) => {
      const updatedLayers = prev.layers.map((l) => {
        if (l.id !== nextStep.layerId) return l;
        const newGrid = { ...l.grid };
        for (const change of nextStep.tileChanges) {
          if (change.after === null) {
            delete newGrid[change.key];
          } else {
            newGrid[change.key] = change.after;
          }
        }
        return { ...l, grid: newGrid };
      });
      return { ...prev, layers: updatedLayers };
    });

    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, nextStep]);
    sound.playClick();
  }, [redoStack]);

  /* ------------------- KEYBOARD SHORTCUTS ------------------- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Space: Toggle Playtest Flight Check
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaytesting((prev) => !prev);
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Tool Shortcuts
      switch (e.key.toLowerCase()) {
        case 'b':
          setActiveTool('brush');
          sound.playClick();
          break;
        case 'g':
          setActiveTool('fill');
          sound.playClick();
          break;
        case 'e':
          setActiveTool('eraser');
          sound.playClick();
          break;
        case 'i':
          setActiveTool('picker');
          sound.playClick();
          break;
        case 's':
          setActiveTool('select');
          sound.playClick();
          break;
        case 'v':
          setActiveTool('entity');
          sound.playClick();
          break;
        case 'w':
          setActiveTool('wire');
          sound.playClick();
          break;
        case 'a':
          setIsAutoTileEnabled((prev) => !prev);
          sound.playClick();
          break;
        case 'r':
          // Reset Playtest
          if (isPlaytesting) {
            // Handled in simulation
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaytesting, handleUndo, handleRedo]);

  /* ------------------- BACKEND ACTIONS ------------------- */
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/maps/${map.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(map),
      });
      if (res.ok) {
        setLastSavedAt('Just now');
        sound.playWireConnect();
      }
    } catch (err) {
      console.error('Failed to save to cloud backend:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordTelemetry = async (event: any) => {
    try {
      await fetch(`/api/maps/${map.id}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      // Update local heatmap points on death
      if (event.eventType === 'death' && event.deathX && event.deathY) {
        setHeatmapPoints((prev) => [
          ...prev,
          { x: event.deathX, y: event.deathY, count: 1 },
        ]);
        setTelemetryStats((prev) => ({
          ...prev,
          deaths: prev.deaths + 1,
        }));
      }
    } catch (err) {
      console.error('Failed to report telemetry:', err);
    }
  };

  const handleInjectSimulatedDeaths = () => {
    const size = map.dimensions.tileSize;
    const newSimPoints = [
      { x: 17 * size + Math.random() * 20, y: 17 * size + Math.random() * 10, count: 3 },
      { x: 18 * size + Math.random() * 20, y: 17 * size + Math.random() * 10, count: 4 },
      { x: 26 * size + Math.random() * 10, y: 14 * size + Math.random() * 10, count: 2 },
      { x: 19 * size + Math.random() * 20, y: 16 * size + Math.random() * 10, count: 2 },
    ];
    setHeatmapPoints((prev) => [...prev, ...newSimPoints]);
    setShowHeatmap(true);
    sound.playDeath();
  };

  const selectedEntity = map.entities.find((e) => e.id === selectedEntityId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0C10] text-[#F8FAFC] overflow-hidden">
      {/* Top Navigation & Transport Bar */}
      <TopBar
        title={map.title}
        author={map.author}
        onUpdateTitle={(title) => setMap((m) => ({ ...m, title }))}
        isPlaytesting={isPlaytesting}
        onTogglePlaytest={() => setIsPlaytesting((prev) => !prev)}
        onResetPlaytest={() => {
          // Trigger reset via mode shift
          setIsPlaytesting(false);
          setTimeout(() => setIsPlaytesting(true), 50);
        }}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={1.25}
        gridSize={gridSettings.size}
        showGrid={gridSettings.showGrid}
        onToggleGrid={() => setGridSettings((g) => ({ ...g, showGrid: !g.showGrid }))}
        snapToGrid={gridSettings.snapToGrid}
        onToggleSnap={() => setGridSettings((g) => ({ ...g, snapToGrid: !g.snapToGrid }))}
        onChangeGridSize={(size) => setGridSettings((g) => ({ ...g, size }))}
        isAutoTileEnabled={isAutoTileEnabled}
        onToggleAutoTile={() => setIsAutoTileEnabled((prev) => !prev)}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onSaveCloud={handleSaveToCloud}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
      />

      {/* Main Studio Viewport & Sidebars */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Vertical Tool Strip */}
        <Toolbar
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          isAutoTileEnabled={isAutoTileEnabled}
          onToggleAutoTile={() => setIsAutoTileEnabled((prev) => !prev)}
          disabled={isPlaytesting}
        />

        {/* Center Interactive Canvas Viewport */}
        <CanvasViewport
          map={map}
          activeLayerId={activeLayerId}
          activeTool={activeTool}
          selectedTileDef={selectedTileDef}
          selectedEntityId={selectedEntityId}
          gridSettings={gridSettings}
          isPlaytesting={isPlaytesting}
          onTogglePlaytest={() => setIsPlaytesting((prev) => !prev)}
          onResetPlaytest={() => {
            setIsPlaytesting(false);
            setTimeout(() => setIsPlaytesting(true), 50);
          }}
          isAutoTileEnabled={isAutoTileEnabled}
          activeBiomeId={activeBiomeId}
          heatmapPoints={heatmapPoints}
          showHeatmap={showHeatmap}
          onTileChange={handleTileChange}
          onEntityChange={(entities) => setMap((m) => ({ ...m, entities }))}
          onSelectEntity={(id) => setSelectedEntityId(id)}
          onRecordTelemetry={handleRecordTelemetry}
        />

        {/* Right Dock (Inspector, Layers, Atmosphere, Telemetry) */}
        <RightDock
          map={map}
          activeLayerId={activeLayerId}
          onSelectLayer={(id) => setActiveLayerId(id)}
          onUpdateLayers={(layers) => setMap((m) => ({ ...m, layers }))}
          selectedEntity={selectedEntity}
          onUpdateEntity={(updated) =>
            setMap((m) => ({
              ...m,
              entities: m.entities.map((e) => (e.id === updated.id ? updated : e)),
            }))
          }
          onDeleteEntity={(id) =>
            setMap((m) => ({
              ...m,
              entities: m.entities.filter((e) => e.id !== id),
            }))
          }
          selectedTileDef={selectedTileDef}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
          telemetryStats={telemetryStats}
          onInjectSimulatedDeaths={handleInjectSimulatedDeaths}
          onUpdateMapDimensions={(dims) =>
            setMap((m) => ({
              ...m,
              dimensions: dims,
            }))
          }
        />
      </div>

      {/* Bottom Collapsible Tileset Drawer */}
      <TilesetDrawer
        activeBiomeId={activeBiomeId}
        onSelectBiome={(biomeId) => {
          setActiveBiomeId(biomeId);
          if (selectedTileDef) {
            setSelectedTileDef({ ...selectedTileDef, tilesetId: biomeId });
          }
        }}
        selectedTileDef={selectedTileDef}
        onSelectTileDef={(tile) => setSelectedTileDef(tile)}
        isAutoTileEnabled={isAutoTileEnabled}
        onToggleAutoTile={() => setIsAutoTileEnabled((prev) => !prev)}
      />

      {/* Universal Engine Asset Exporter Modal */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        map={map}
      />

      {/* Arcade Vault Repository & Seed Forking Modal */}
      <ArcadeVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        currentMap={map}
        onLoadMap={(loaded) => {
          setMap(loaded);
          if (loaded.layers && loaded.layers.length > 0) {
            setActiveLayerId(loaded.layers[1]?.id || loaded.layers[0].id);
          }
        }}
        onForkMap={(forked) => {
          setMap(forked);
          if (forked.layers && forked.layers.length > 0) {
            setActiveLayerId(forked.layers[1]?.id || forked.layers[0].id);
          }
        }}
        onPublishCurrentMap={handleSaveToCloud}
        isPublishing={isSaving}
      />
    </div>
  );
}

export default App;
