import React from 'react';
import { X, BookOpen, Play, ShieldAlert, CloudRain, Sparkles, Sprout } from 'lucide-react';

export const SCENARIOS = [
  {
    id: 'SANDBOX',
    title: 'Open World Bio-Sandbox',
    desc: 'Unrestricted environment to observe emergent swarm intelligence, trail formation, and ecosystem dynamics.',
    icon: Sparkles,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    difficulty: 'Relaxed'
  },
  {
    id: 'SPIDER_SIEGE',
    title: 'Arachnid Swarm Siege',
    desc: 'Aggressive shadow spiders have invaded the territory. Build an army of soldiers with serrated mandibles to defend the Queen!',
    icon: ShieldAlert,
    color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    difficulty: 'Hard'
  },
  {
    id: 'RAIN_FLOOD',
    title: 'The Great Rainstorm',
    desc: 'Continuous torrential rain washes away pheromone trails every few seconds. Train scouts to guide foragers through the storm.',
    icon: CloudRain,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    difficulty: 'Medium'
  },
  {
    id: 'AUTUMN_HARVEST',
    title: 'Autumn Harvest Rush',
    desc: 'Winter approaches. Prioritize Harvester and Worker breeding to collect 400 Biomass units within the time limit.',
    icon: Sprout,
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    difficulty: 'Medium'
  }
];

export default function ScenarioModal({
  isOpen,
  onClose,
  onSelectScenario
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 font-mono uppercase tracking-wide">
                Simulation Scenarios & Challenges
              </h2>
              <p className="text-xs text-slate-400">
                Choose a predefined biological ecological scenario or play in open sandbox mode.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios List */}
        <div className="space-y-3">
          {SCENARIOS.map(sc => {
            const Icon = sc.icon;

            return (
              <div
                key={sc.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl border ${sc.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100 font-mono">{sc.title}</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {sc.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">{sc.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectScenario(sc.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 font-bold font-mono text-xs transition flex items-center gap-1.5 border border-slate-700 shadow-md whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" /> Launch
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
