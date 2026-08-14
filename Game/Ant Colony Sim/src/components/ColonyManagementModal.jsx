import React, { useState } from 'react';
import { X, Users, Crown, Shield, Compass, Shovel, HeartHandshake } from 'lucide-react';
import { CASTES, LIFE_STAGES } from '../engine/antEntity.js';

export default function ColonyManagementModal({
  sim,
  isOpen,
  onClose,
  casteRatios,
  onUpdateRatios
}) {
  if (!isOpen) return null;

  const [ratios, setRatios] = useState({ ...casteRatios });

  const adults = sim.ants.filter(a => a.stage === LIFE_STAGES.ADULT);
  const brood = sim.ants.filter(a => a.stage !== LIFE_STAGES.ADULT);

  const casteCounts = {
    QUEEN: adults.filter(a => a.caste.id === 'QUEEN').length,
    WORKER: adults.filter(a => a.caste.id === 'WORKER').length,
    SOLDIER: adults.filter(a => a.caste.id === 'SOLDIER').length,
    SCOUT: adults.filter(a => a.caste.id === 'SCOUT').length,
    HARVESTER: adults.filter(a => a.caste.id === 'HARVESTER').length,
    NURSE: adults.filter(a => a.caste.id === 'NURSE').length,
  };

  const handleRatioChange = (casteKey, val) => {
    const num = parseFloat(val);
    const updated = { ...ratios, [casteKey]: num };
    
    // Normalize sum to 1.0
    const total = Object.values(updated).reduce((acc, curr) => acc + curr, 0);
    if (total > 0) {
      for (const k in updated) {
        updated[k] = updated[k] / total;
      }
    }
    setRatios(updated);
    onUpdateRatios(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-100 font-mono uppercase tracking-wide">
                Colony Caste Management
              </h2>
              <p className="text-xs text-slate-400">
                Allocate reproductive priority for newly laid eggs & view population census.
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

        {/* Current Census Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(CASTES).map(([key, caste]) => (
            <div
              key={key}
              className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col items-center text-center font-mono"
            >
              <span
                className="w-3 h-3 rounded-full mb-1 shadow-[0_0_8px_currentColor]"
                style={{ color: caste.color }}
              />
              <span className="text-xs text-slate-300 font-bold">{caste.name}</span>
              <span className="text-base font-extrabold text-slate-100 mt-1">
                {casteCounts[key] || 0}
              </span>
            </div>
          ))}
        </div>

        {/* Breeding Allocation Sliders */}
        <div className="space-y-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
          <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
            Egg Metamorphosis Ratios
          </h3>

          <div className="space-y-2.5">
            {Object.keys(ratios).map(casteKey => {
              const caste = CASTES[casteKey];
              const pct = Math.round((ratios[casteKey] || 0) * 100);

              return (
                <div key={casteKey} className="flex items-center gap-3 text-xs font-mono">
                  <div className="w-24 text-slate-300 flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: caste?.color }} />
                    {caste?.name}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ratios[casteKey] || 0}
                    onChange={e => handleRatioChange(casteKey, e.target.value)}
                    className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="w-12 text-right text-emerald-400 font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chambers Overview */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 space-y-2">
          <h3 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-wider">
            Nest Chambers & Infrastructure
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {sim.nest.chambers.map(ch => (
              <div key={ch.id} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-slate-200 font-bold truncate">{ch.name}</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Active & Operational</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono tracking-wider transition shadow-lg"
          >
            Confirm & Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}
