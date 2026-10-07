import React, { useState } from 'react';
import {
  Layers,
  Sliders,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Activity,
  Compass,
  Flame,
  Cable,
  Unlink,
} from 'lucide-react';
import { LevelEntity, LevelMap, MapLayer, TileData } from '../types/index.js';
import { Button, Badge } from './ui/index.js';
import { sound } from '../utils/audio.js';

interface RightDockProps {
  map: LevelMap;
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onUpdateLayers: (layers: MapLayer[]) => void;
  selectedEntity: LevelEntity | null;
  onUpdateEntity: (entity: LevelEntity) => void;
  onDeleteEntity: (entityId: string) => void;
  selectedTileDef: TileData | null;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  telemetryStats: {
    clears: number;
    deaths: number;
    clearRate: number;
    bestTimeMs: number | null;
  };
  onInjectSimulatedDeaths: () => void;
  onUpdateMapDimensions: (dims: { widthInTiles: number; heightInTiles: number; tileSize: number }) => void;
}

export const RightDock: React.FC<RightDockProps> = ({
  map,
  activeLayerId,
  onSelectLayer,
  onUpdateLayers,
  selectedEntity,
  onUpdateEntity,
  onDeleteEntity,
  selectedTileDef,
  showHeatmap,
  onToggleHeatmap,
  telemetryStats,
  onInjectSimulatedDeaths,
  onUpdateMapDimensions,
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'inspector' | 'atmosphere' | 'telemetry'>('layers');
  const [parallaxTestFactor, setParallaxTestFactor] = useState(0.5);

  /* ---------------- LAYER STACK ACTIONS ---------------- */
  const toggleVisibility = (layerId: string) => {
    const updated = map.layers.map((l) =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    );
    onUpdateLayers(updated);
    sound.playClick();
  };

  const changeOpacity = (layerId: string, opacity: number) => {
    const updated = map.layers.map((l) =>
      l.id === layerId ? { ...l, opacity } : l
    );
    onUpdateLayers(updated);
  };

  const moveLayer = (index: number, direction: 'up' | 'down') => {
    const newLayers = [...map.layers];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newLayers.length) return;

    const temp = newLayers[index];
    newLayers[index] = newLayers[targetIdx];
    newLayers[targetIdx] = temp;
    onUpdateLayers(newLayers);
    sound.playClick();
  };

  const addNewLayer = () => {
    const newLayer: MapLayer = {
      id: `layer-${Date.now()}`,
      name: `Custom Layer ${map.layers.length + 1}`,
      type: 'tile',
      visible: true,
      opacity: 1,
      parallaxFactor: { x: 1, y: 1 },
      grid: {},
    };
    onUpdateLayers([...map.layers, newLayer]);
    onSelectLayer(newLayer.id);
    sound.playPlace();
  };

  const removeLayer = (layerId: string) => {
    if (map.layers.length <= 1) return;
    const updated = map.layers.filter((l) => l.id !== layerId);
    onUpdateLayers(updated);
    if (activeLayerId === layerId) {
      onSelectLayer(updated[0].id);
    }
    sound.playErase();
  };

  return (
    <aside className="w-[310px] bg-[#121620] border-l border-[#222B3D] flex flex-col z-20 select-none text-xs">
      {/* Dock Tabs Header */}
      <div className="flex items-center border-b border-[#222B3D] bg-[#0E121A] p-1 gap-1">
        <button
          onClick={() => {
            setActiveTab('layers');
            sound.playClick();
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'layers'
              ? 'bg-[#192030] text-cyan-400 border border-cyan-500/30'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('inspector');
            sound.playClick();
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'inspector'
              ? 'bg-[#192030] text-cyan-400 border border-cyan-500/30'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Inspector</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('atmosphere');
            sound.playClick();
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'atmosphere'
              ? 'bg-[#192030] text-cyan-400 border border-cyan-500/30'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Scene</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('telemetry');
            sound.playClick();
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'telemetry'
              ? 'bg-[#192030] text-rose-400 border border-rose-500/30'
              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Stats</span>
        </button>
      </div>

      {/* Dock Content Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* ================= TAB 1: LAYERS ================= */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#F8FAFC] tracking-wide uppercase text-[11px] text-cyan-400">
                Layer Stack ({map.layers.length})
              </span>
              <Button
                variant="cyan"
                size="sm"
                onClick={addNewLayer}
                className="h-6 text-[10px] px-2 py-0 gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Layer</span>
              </Button>
            </div>

            <div className="space-y-2">
              {map.layers.map((layer, idx) => {
                const isActive = layer.id === activeLayerId;
                const tileCount = Object.keys(layer.grid).length;

                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#192030] border-cyan-500/50 shadow-glowCyan'
                        : 'bg-[#141A26] border-[#222B3D] hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisibility(layer.id);
                          }}
                          className={`p-1 rounded hover:bg-[#222B3D] ${
                            layer.visible ? 'text-cyan-400' : 'text-[#64748B]'
                          }`}
                          title="Toggle Layer Visibility"
                        >
                          {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <span className="font-semibold text-[#F8FAFC]">{layer.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayer(idx, 'up');
                          }}
                          className="p-1 text-[#94A3B8] hover:text-white disabled:opacity-20"
                          title="Move Layer Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === map.layers.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveLayer(idx, 'down');
                          }}
                          className="p-1 text-[#94A3B8] hover:text-white disabled:opacity-20"
                          title="Move Layer Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {map.layers.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLayer(layer.id);
                            }}
                            className="p-1 text-[#94A3B8] hover:text-rose-400"
                            title="Delete Layer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Layer Controls: Opacity & Telemetry */}
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-1.5">
                      <span>Opacity: {Math.round(layer.opacity * 100)}%</span>
                      <span className="font-mono text-[10px] text-cyan-400/80">{tileCount} tiles</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => changeOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 h-1 bg-[#222B3D] rounded cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: INSPECTOR ================= */}
        {activeTab === 'inspector' && (
          <div className="space-y-3">
            {selectedEntity ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F8FAFC] uppercase text-[11px] text-cyan-400">
                    Entity Properties
                  </span>
                  <Badge variant="cyan">{selectedEntity.type}</Badge>
                </div>

                {/* Entity Name */}
                <div className="space-y-1">
                  <label className="text-[11px] text-[#94A3B8]">Entity Label</label>
                  <input
                    type="text"
                    value={selectedEntity.name}
                    onChange={(e) =>
                      onUpdateEntity({ ...selectedEntity, name: e.target.value })
                    }
                    className="w-full bg-[#0A0C10] border border-[#222B3D] focus:border-cyan-500 rounded p-1.5 text-white"
                  />
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <label className="text-[10px] text-[#64748B]">Pos X</label>
                    <input
                      type="number"
                      value={Math.round(selectedEntity.position.x)}
                      onChange={(e) =>
                        onUpdateEntity({
                          ...selectedEntity,
                          position: { ...selectedEntity.position, x: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-[#0A0C10] border border-[#222B3D] rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#64748B]">Pos Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedEntity.position.y)}
                      onChange={(e) =>
                        onUpdateEntity({
                          ...selectedEntity,
                          position: { ...selectedEntity.position, y: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-[#0A0C10] border border-[#222B3D] rounded p-1.5 text-white"
                    />
                  </div>
                </div>

                {/* Entity-specific properties */}
                {selectedEntity.type === 'collectible' && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#94A3B8]">Score Points</label>
                    <input
                      type="number"
                      value={Number(selectedEntity.properties.points || 100)}
                      onChange={(e) =>
                        onUpdateEntity({
                          ...selectedEntity,
                          properties: { ...selectedEntity.properties, points: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-[#0A0C10] border border-[#222B3D] rounded p-1.5 text-white"
                    />
                  </div>
                )}

                {selectedEntity.type === 'enemy' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-[#94A3B8]">Patrol Radius (px)</label>
                      <input
                        type="number"
                        value={Number(selectedEntity.properties.patrolRadius || 96)}
                        onChange={(e) =>
                          onUpdateEntity({
                            ...selectedEntity,
                            properties: {
                              ...selectedEntity.properties,
                              patrolRadius: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-[#0A0C10] border border-[#222B3D] rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#94A3B8]">Speed (px/s)</label>
                      <input
                        type="number"
                        value={Number(selectedEntity.properties.speed || 60)}
                        onChange={(e) =>
                          onUpdateEntity({
                            ...selectedEntity,
                            properties: {
                              ...selectedEntity.properties,
                              speed: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-[#0A0C10] border border-[#222B3D] rounded p-1.5 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Logic Wire Connections */}
                <div className="space-y-1.5 pt-2 border-t border-[#222B3D]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC] flex items-center gap-1">
                      <Cable className="w-3.5 h-3.5 text-cyan-400" />
                      Trigger Conduits
                    </span>
                    <Badge variant="cyan">{selectedEntity.connectedEntityIds?.length || 0} links</Badge>
                  </div>

                  {selectedEntity.connectedEntityIds?.length ? (
                    <div className="space-y-1">
                      {selectedEntity.connectedEntityIds.map((targetId) => {
                        const targetEnt = map.entities.find((e) => e.id === targetId);
                        return (
                          <div
                            key={targetId}
                            className="flex items-center justify-between bg-[#192030] p-1.5 rounded border border-[#222B3D]"
                          >
                            <span className="font-mono text-cyan-400">
                              ➔ {targetEnt ? targetEnt.name : targetId}
                            </span>
                            <button
                              onClick={() => {
                                onUpdateEntity({
                                  ...selectedEntity,
                                  connectedEntityIds: selectedEntity.connectedEntityIds.filter(
                                    (id) => id !== targetId
                                  ),
                                });
                                sound.playWireConnect();
                              }}
                              className="text-rose-400 hover:text-rose-300 p-0.5"
                              title="Unlink Conduit"
                            >
                              <Unlink className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#64748B]">
                      Use the Wire Tool [W] to drag a logic conduit to another entity (e.g. Pressure Plate ➔ Blast Door).
                    </p>
                  )}
                </div>

                {/* Delete Entity */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDeleteEntity(selectedEntity.id);
                    sound.playErase();
                  }}
                  className="w-full mt-2"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Entity</span>
                </Button>
              </div>
            ) : selectedTileDef ? (
              <div className="space-y-3">
                <span className="font-bold text-[#F8FAFC] uppercase text-[11px] text-cyan-400">
                  Selected Tile Brush
                </span>

                <div className="p-3 bg-[#192030] rounded-xl border border-[#222B3D] space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#94A3B8]">Tileset ID:</span>
                    <strong className="text-white uppercase">{selectedTileDef.tilesetId}</strong>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#94A3B8]">Atlas Coord:</span>
                    <span className="text-cyan-400 font-bold">
                      [{selectedTileDef.sourceX}, {selectedTileDef.sourceY}]
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#94A3B8]">Collision:</span>
                    <Badge variant={selectedTileDef.collision === 'solid' ? 'cyan' : 'emerald'}>
                      {selectedTileDef.collision}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#64748B] space-y-2">
                <Sliders className="w-6 h-6 mx-auto opacity-50" />
                <p>Select an entity or tile to inspect and customize its parameters.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ATMOSPHERE & SCENE ================= */}
        {activeTab === 'atmosphere' && (
          <div className="space-y-4">
            <span className="font-bold text-[#F8FAFC] uppercase text-[11px] text-cyan-400">
              Atmosphere & Parallax
            </span>

            {/* Parallax preview slider */}
            <div className="p-3 bg-[#192030] rounded-xl border border-[#222B3D] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Parallax Preview Shift</span>
                <span className="font-mono text-cyan-400">{Math.round(parallaxTestFactor * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={parallaxTestFactor}
                onChange={(e) => setParallaxTestFactor(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-[#222B3D] rounded cursor-pointer"
              />
              <p className="text-[10px] text-[#64748B]">
                Interactive preview simulates depth-rate between deep mountain silhouette ridges and foreground structures.
              </p>
            </div>

            {/* Map Dimensions Editor */}
            <div className="p-3 bg-[#192030] rounded-xl border border-[#222B3D] space-y-2.5">
              <span className="font-semibold text-white">Map Dimensions</span>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-[#64748B]">Width (Tiles)</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={map.dimensions.widthInTiles}
                    onChange={(e) =>
                      onUpdateMapDimensions({
                        ...map.dimensions,
                        widthInTiles: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#0A0C10] border border-[#222B3D] rounded p-1 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#64748B]">Height (Tiles)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={map.dimensions.heightInTiles}
                    onChange={(e) =>
                      onUpdateMapDimensions({
                        ...map.dimensions,
                        heightInTiles: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#0A0C10] border border-[#222B3D] rounded p-1 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: TELEMETRY & HEATMAP ================= */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#F8FAFC] uppercase text-[11px] text-rose-400">
                Community Telemetry
              </span>
              <button
                onClick={onToggleHeatmap}
                className={`p-1 rounded border flex items-center gap-1 font-mono text-[10px] ${
                  showHeatmap
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-[#192030] border-[#222B3D] text-[#94A3B8]'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>{showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[#192030] rounded-xl border border-[#222B3D]">
                <div className="text-[10px] text-[#64748B] uppercase">Total Clears</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {telemetryStats.clears}
                </div>
              </div>
              <div className="p-3 bg-[#192030] rounded-xl border border-[#222B3D]">
                <div className="text-[10px] text-[#64748B] uppercase">Player Deaths</div>
                <div className="text-lg font-bold font-mono text-rose-400">
                  {telemetryStats.deaths}
                </div>
              </div>
              <div className="p-3 bg-[#192030] rounded-xl border border-[#222B3D]">
                <div className="text-[10px] text-[#64748B] uppercase">Clear Rate</div>
                <div className="text-lg font-bold font-mono text-cyan-400">
                  {telemetryStats.clearRate}%
                </div>
              </div>
              <div className="p-3 bg-[#192030] rounded-xl border border-[#222B3D]">
                <div className="text-[10px] text-[#64748B] uppercase">Best Record</div>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {telemetryStats.bestTimeMs ? `${(telemetryStats.bestTimeMs / 1000).toFixed(1)}s` : '--'}
                </div>
              </div>
            </div>

            {/* Inject Simulated Deaths */}
            <Button
              variant="outline"
              size="sm"
              onClick={onInjectSimulatedDeaths}
              className="w-full text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Simulate Playtest Deaths</span>
            </Button>
            <p className="text-[10px] text-[#64748B]">
              Injects simulated community speedrun deaths to visualize heat clusters across platform gaps and hazards.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
