import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  ArrowUp,
  Box,
  Split,
  Layers,
} from 'lucide-react';
import { CollisionShape, TileData } from '../types/index.js';
import { BUILT_IN_BIOMES, getBiomeAtlas } from '../utils/tilesets.js';
import { sound } from '../utils/audio.js';
import { Badge } from './ui/index.js';

interface TilesetDrawerProps {
  activeBiomeId: string;
  onSelectBiome: (biomeId: string) => void;
  selectedTileDef: TileData | null;
  onSelectTileDef: (tile: TileData) => void;
  isAutoTileEnabled: boolean;
  onToggleAutoTile: () => void;
}

export const TilesetDrawer: React.FC<TilesetDrawerProps> = ({
  activeBiomeId,
  onSelectBiome,
  selectedTileDef,
  onSelectTileDef,
  isAutoTileEnabled,
  onToggleAutoTile,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(activeBiomeId);
  const [activeCollision, setActiveCollision] = useState<CollisionShape>('solid');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render the current biome atlas onto the drawer swatch canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const atlas = getBiomeAtlas(activeBiomeId);
    ctx.drawImage(atlas, 0, 0, canvas.width, canvas.height);
  }, [activeBiomeId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellWidth = canvas.width / 8;
    const cellHeight = canvas.height / 6;

    const col = Math.floor(clickX / cellWidth);
    const row = Math.floor(clickY / cellHeight);

    if (col >= 0 && col < 8 && row >= 0 && row < 6) {
      const tile: TileData = {
        tilesetId: activeBiomeId,
        sourceX: col,
        sourceY: row,
        collision: activeCollision,
      };
      onSelectTileDef(tile);
      sound.playClick();
    }
  };

  const collisionButtons: { type: CollisionShape; name: string; icon: React.ReactNode; color: string }[] = [
    { type: 'solid', name: 'Solid', icon: <Box className="w-3.5 h-3.5" />, color: 'hover:text-cyan-400' },
    {
      type: 'platform_one_way',
      name: 'One-Way',
      icon: <ArrowUp className="w-3.5 h-3.5" />,
      color: 'hover:text-emerald-400',
    },
    { type: 'hazard', name: 'Hazard', icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'hover:text-rose-400' },
    { type: 'ladder', name: 'Ladder', icon: <Split className="w-3.5 h-3.5" />, color: 'hover:text-amber-400' },
  ];

  return (
    <div
      className={`bg-[#121620] border-t border-[#222B3D] transition-all duration-200 select-none z-20 flex flex-col ${
        isExpanded ? 'h-[230px]' : 'h-9'
      }`}
    >
      {/* Drawer Control Tab Bar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-[#222B3D] bg-[#0E121A]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* Biome Tabs */}
          {BUILT_IN_BIOMES.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                onSelectBiome(b.id);
                setActiveTab(b.id);
                sound.playClick();
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeBiomeId === b.id
                  ? 'bg-[#192030] text-cyan-400 border border-cyan-500/30'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: b.previewColor }}
              />
              <span>{b.name}</span>
            </button>
          ))}
        </div>

        {/* Right Toggle Accordion Button */}
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            sound.playClick();
          }}
          className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-white px-2 py-1 rounded hover:bg-[#192030]"
        >
          <span>Tileset Palette</span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Swatch Grid & Collision Brush Row */}
      {isExpanded && (
        <div className="flex-1 p-3 flex flex-col md:flex-row items-center gap-4 overflow-y-auto">
          {/* Swatch Matrix Canvas (8x6 grid) */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative p-1 bg-[#0A0C10] border border-[#222B3D] rounded-xl shadow-inner">
              <canvas
                ref={canvasRef}
                width={8 * 28}
                height={6 * 28}
                onClick={handleCanvasClick}
                className="cursor-pointer rounded image-rendering-pixelated"
                title="Click any tile variant to paint with it"
              />
            </div>
            <span className="text-[10px] text-[#64748B] font-mono">
              Atlas Matrix: 8×6 Variants (Click to select)
            </span>
          </div>

          <div className="h-full w-px bg-[#222B3D] hidden md:block" />

          {/* Active Tile Preview & Collision Modifier */}
          <div className="flex-1 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#F8FAFC] uppercase text-[11px] text-cyan-400">
                Active Brush Config
              </span>

              {/* Auto-tile toggle button */}
              <button
                onClick={onToggleAutoTile}
                className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
                  isAutoTileEnabled
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-[#192030] border-[#222B3D] text-[#64748B]'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{isAutoTileEnabled ? 'Auto-Tile: Active' : 'Auto-Tile: Disabled'}</span>
              </button>
            </div>

            {/* Collision Brushes */}
            <div className="space-y-1">
              <span className="text-[11px] text-[#94A3B8]">Collision Mask Property:</span>
              <div className="flex items-center gap-1.5">
                {collisionButtons.map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => {
                      setActiveCollision(btn.type);
                      if (selectedTileDef) {
                        onSelectTileDef({ ...selectedTileDef, collision: btn.type });
                      }
                      sound.playClick();
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold transition-all ${
                      activeCollision === btn.type
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-glowCyan'
                        : 'bg-[#192030] border-[#222B3D] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {btn.icon}
                    <span>{btn.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Tile Telemetry Pill */}
            {selectedTileDef && (
              <div className="flex items-center gap-3 bg-[#0A0C10] p-2 rounded-lg border border-[#222B3D] text-[11px] font-mono">
                <span className="text-[#94A3B8]">Biome: <strong className="text-white uppercase">{selectedTileDef.tilesetId}</strong></span>
                <span className="text-[#94A3B8]">Source: <strong className="text-cyan-400">[{selectedTileDef.sourceX}, {selectedTileDef.sourceY}]</strong></span>
                <span className="text-[#94A3B8]">Mask: <Badge variant="cyan">{selectedTileDef.collision}</Badge></span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
