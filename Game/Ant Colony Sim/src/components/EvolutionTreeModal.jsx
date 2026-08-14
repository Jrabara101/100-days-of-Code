import React from 'react';
import { X, Dna, Zap, Shield, Sparkles, Heart, Activity, Check } from 'lucide-react';

export const TECH_TREE = [
  {
    id: 'pheromone_potency_1',
    name: 'Pheromone Synthesis I',
    desc: 'Increases trail strength and longevity by +40%.',
    icon: Sparkles,
    cost: { sugar: 30, protein: 10, leaf: 15 },
    category: 'Trail Bio-Chemistry'
  },
  {
    id: 'pheromone_potency_2',
    name: 'Pheromone Synthesis II',
    desc: 'Enhances sensory sensitivity and trail diffusion radius by +60%.',
    icon: Sparkles,
    requires: 'pheromone_potency_1',
    cost: { sugar: 60, protein: 25, leaf: 35 },
    category: 'Trail Bio-Chemistry'
  },
  {
    id: 'ant_speed_1',
    name: 'Enhanced Leg Musculature',
    desc: 'All ant castes gain +25% base traversal speed.',
    icon: Zap,
    cost: { sugar: 40, protein: 25, leaf: 15 },
    category: 'Anatomy'
  },
  {
    id: 'mandible_crush',
    name: 'Serrated Mandibles',
    desc: 'Soldiers and Harvesters deal +10 melee damage to predators.',
    icon: Shield,
    cost: { sugar: 20, protein: 50, leaf: 20 },
    category: 'Anatomy'
  },
  {
    id: 'queen_fertility',
    name: 'Royal Jelly Diet',
    desc: 'Queen lays eggs 50% faster, expanding the colony swarm.',
    icon: Heart,
    cost: { sugar: 65, protein: 60, leaf: 30 },
    category: 'Reproduction'
  },
  {
    id: 'brood_growth',
    name: 'Nursery Thermoregulation',
    desc: 'Accelerates egg, larva, and pupa metamorphosis by +40%.',
    icon: Activity,
    cost: { sugar: 35, protein: 45, leaf: 40 },
    category: 'Reproduction'
  }
];

export default function EvolutionTreeModal({
  sim,
  isOpen,
  onClose,
  resources,
  unlockedTechs,
  onUnlockTech
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="w-full max-w-3xl glass-panel p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 font-mono uppercase tracking-wide">
                Genetics & Tech Evolution
              </h2>
              <p className="text-xs text-slate-400">
                Mutate your colony DNA to unlock enhanced pheromones, mandibles, and vitality.
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

        {/* Available Resources Bar */}
        <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 font-bold uppercase">Available Biomass:</span>
          <div className="flex items-center gap-4">
            <span className="text-sky-300">🍬 {Math.floor(resources.sugar)} Sugar</span>
            <span className="text-rose-300">🥩 {Math.floor(resources.protein)} Protein</span>
            <span className="text-emerald-300">🍃 {Math.floor(resources.leaf)} Leaves</span>
          </div>
        </div>

        {/* Tech Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
          {TECH_TREE.map(tech => {
            const Icon = tech.icon;
            const isUnlocked = unlockedTechs.has(tech.id);
            const reqMet = !tech.requires || unlockedTechs.has(tech.requires);
            const canAfford =
              resources.sugar >= tech.cost.sugar &&
              resources.protein >= tech.cost.protein &&
              resources.leaf >= tech.cost.leaf;

            return (
              <div
                key={tech.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isUnlocked
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : reqMet
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                      {tech.category}
                    </span>
                    {isUnlocked && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Check className="w-3 h-3" /> MUTATED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 mb-1">
                    <div className={`p-2 rounded-xl bg-slate-900 border ${isUnlocked ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-400 border-slate-800'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 font-mono">{tech.name}</h4>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{tech.desc}</p>
                </div>

                {/* Costs & Action */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-slate-400 space-x-2">
                    {tech.cost.sugar > 0 && <span className="text-sky-300">{tech.cost.sugar} Sugar</span>}
                    {tech.cost.protein > 0 && <span className="text-rose-300">{tech.cost.protein} Protein</span>}
                    {tech.cost.leaf > 0 && <span className="text-emerald-300">{tech.cost.leaf} Leaf</span>}
                  </div>

                  {!isUnlocked && (
                    <button
                      disabled={!reqMet || !canAfford}
                      onClick={() => onUnlockTech(tech.id, tech.cost)}
                      className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition shadow-md ${
                        reqMet && canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {!reqMet ? 'Locked' : canAfford ? 'Synthesize' : 'Need Resources'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
