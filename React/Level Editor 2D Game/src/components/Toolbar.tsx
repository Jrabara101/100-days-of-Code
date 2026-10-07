import React from 'react';
import {
  Paintbrush,
  PaintBucket,
  Eraser,
  Pipette,
  BoxSelect,
  Sparkles,
  Cable,
  Package,
} from 'lucide-react';
import { EditorTool } from '../types/index.js';
import { sound } from '../utils/audio.js';

interface ToolbarProps {
  activeTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  isAutoTileEnabled: boolean;
  onToggleAutoTile: () => void;
  disabled?: boolean;
}

interface ToolDef {
  id: EditorTool;
  name: string;
  key: string;
  icon: React.ReactNode;
  color: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  isAutoTileEnabled,
  onToggleAutoTile,
  disabled = false,
}) => {
  const tools: ToolDef[] = [
    {
      id: 'brush',
      name: 'Pencil / Tile Brush',
      key: 'B',
      icon: <Paintbrush className="w-5 h-5" />,
      color: 'hover:text-cyan-400',
    },
    {
      id: 'fill',
      name: 'Bucket Flood Fill',
      key: 'G',
      icon: <PaintBucket className="w-5 h-5" />,
      color: 'hover:text-emerald-400',
    },
    {
      id: 'eraser',
      name: 'Tile Eraser',
      key: 'E',
      icon: <Eraser className="w-5 h-5" />,
      color: 'hover:text-rose-400',
    },
    {
      id: 'picker',
      name: 'Eyedropper / Picker',
      key: 'I',
      icon: <Pipette className="w-5 h-5" />,
      color: 'hover:text-amber-400',
    },
    {
      id: 'select',
      name: 'Marquee Selection',
      key: 'S',
      icon: <BoxSelect className="w-5 h-5" />,
      color: 'hover:text-blue-400',
    },
    {
      id: 'entity',
      name: 'Entity Placer',
      key: 'V',
      icon: <Package className="w-5 h-5" />,
      color: 'hover:text-purple-400',
    },
    {
      id: 'wire',
      name: 'Conduit Wiring Tool',
      key: 'W',
      icon: <Cable className="w-5 h-5" />,
      color: 'hover:text-cyan-300',
    },
  ];

  return (
    <aside className="w-[52px] bg-[#121620] border-r border-[#222B3D] flex flex-col items-center py-3 gap-2 z-20 select-none">
      <div className="flex flex-col items-center gap-1.5 w-full px-1.5">
        {tools.map((t) => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              disabled={disabled}
              onClick={() => {
                onSelectTool(t.id);
                sound.playClick();
              }}
              title={`${t.name} [${t.key}]`}
              className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 group active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-glowCyan'
                  : 'bg-[#192030] text-[#94A3B8] border border-[#222B3D] hover:bg-[#222B3D] hover:text-[#F8FAFC]'
              }`}
            >
              {t.icon}

              {/* Hotkey Badge in bottom-right corner */}
              <span
                className={`absolute bottom-0.5 right-1 text-[9px] font-mono leading-none ${
                  isActive ? 'text-cyan-300 font-bold' : 'text-[#64748B] group-hover:text-white'
                }`}
              >
                {t.key}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-6 h-px bg-[#222B3D] my-1" />

      {/* Auto-Tile 47-Blob Mode Quick Switch */}
      <button
        disabled={disabled}
        onClick={() => {
          onToggleAutoTile();
          sound.playClick();
        }}
        title="47-Tile 8-Neighbor Adjacency Bitmasking [A]"
        className={`relative w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 ${
          isAutoTileEnabled
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-glowEmerald ring-1 ring-emerald-400/30'
            : 'bg-[#192030] text-[#64748B] border border-[#222B3D] hover:bg-[#222B3D] hover:text-[#94A3B8]'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-[8px] font-mono uppercase tracking-tighter mt-0.5 font-bold">Auto</span>
      </button>
    </aside>
  );
};
