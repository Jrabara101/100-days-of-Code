import React from 'react';
import { 
  MousePointer, Sparkles, Droplet, Leaf, Shield, 
  MapPin, UserPlus, Flame, Eye, EyeOff, Radio
} from 'lucide-react';

export const TOOLS = [
  { id: 'INSPECT', name: 'Inspect Entity', icon: MousePointer, color: 'text-sky-400', desc: 'Click any ant, food, or pest to view details' },
  { id: 'DROP_SUGAR', name: 'Drop Sugar', icon: Sparkles, color: 'text-sky-300', desc: 'Place sugar crystal (+60 energy)' },
  { id: 'DROP_HONEY', name: 'Drop Honey', icon: Droplet, color: 'text-amber-400', desc: 'Place dense honeydew drop (+100 food)' },
  { id: 'DROP_LEAF', name: 'Drop Foliage', icon: Leaf, color: 'text-emerald-400', desc: 'Place fresh leaf cuttings' },
  { id: 'PLACE_STONE', name: 'Place Barrier', icon: Shield, color: 'text-slate-300', desc: 'Place a solid stone obstacle' },
  { id: 'PLACE_BEACON', name: 'Rally Beacon', icon: Radio, color: 'text-purple-400', desc: 'Place pheromone beacon to gather ants' },
  { id: 'SPAWN_WORKER', name: 'Spawn Worker', icon: UserPlus, color: 'text-amber-500', desc: 'Instantly spawn adult worker ant' },
  { id: 'SPAWN_SOLDIER', name: 'Spawn Soldier', icon: UserPlus, color: 'text-rose-500', desc: 'Instantly spawn adult soldier ant' },
  { id: 'SQUISH', name: 'Squish Pest', icon: Flame, color: 'text-rose-400', desc: 'Click on spiders/beetles to eliminate them' },
];

export default function ToolPalette({
  activeTool,
  onSelectTool,
  pheromoneFilters,
  onTogglePheromoneFilter
}) {
  return (
    <aside className="absolute left-3 top-20 bottom-3 z-30 flex flex-col justify-between pointer-events-none w-56">
      {/* Tools Selector */}
      <div className="glass-panel p-3 rounded-2xl pointer-events-auto flex flex-col gap-2 shadow-2xl overflow-y-auto max-h-[65vh]">
        <h2 className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between pb-1 border-b border-slate-700/60">
          <span>God Directives</span>
          <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">TOOLS</span>
        </h2>

        <div className="flex flex-col gap-1">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)] text-slate-100'
                    : 'bg-slate-900/40 hover:bg-slate-800/70 border border-slate-800 text-slate-300'
                }`}
                title={tool.desc}
              >
                <div className={`p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 ${tool.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold tracking-wide truncate">{tool.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{tool.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pheromone Heatmap Layer Toggles */}
      <div className="glass-panel p-3 rounded-2xl pointer-events-auto flex flex-col gap-2 shadow-2xl">
        <h3 className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between pb-1 border-b border-slate-700/60">
          <span>Pheromone Layers</span>
        </h3>

        <div className="flex flex-col gap-1.5 text-xs font-mono">
          <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50">
            <span className="flex items-center gap-2 text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
              Food Trails
            </span>
            <input
              type="checkbox"
              checked={pheromoneFilters.food}
              onChange={() => onTogglePheromoneFilter('food')}
              className="accent-sky-400 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50">
            <span className="flex items-center gap-2 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              Home Trails
            </span>
            <input
              type="checkbox"
              checked={pheromoneFilters.home}
              onChange={() => onTogglePheromoneFilter('home')}
              className="accent-amber-400 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50">
            <span className="flex items-center gap-2 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              Danger / Alarm
            </span>
            <input
              type="checkbox"
              checked={pheromoneFilters.danger}
              onChange={() => onTogglePheromoneFilter('danger')}
              className="accent-rose-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>
    </aside>
  );
}
