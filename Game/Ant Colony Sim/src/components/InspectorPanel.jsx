import React from 'react';
import { X, Heart, Zap, Package, Activity, Trash2, PlusCircle, ShieldAlert } from 'lucide-react';

export default function InspectorPanel({
  selectedEntity,
  onClose,
  onBoostEnergy,
  onKillEntity
}) {
  if (!selectedEntity) return null;

  const isAnt = !!selectedEntity.caste;
  const isFood = selectedEntity.amount !== undefined;
  const isPredator = !!selectedEntity.name && !isAnt && !isFood;

  return (
    <aside className="absolute right-3 top-20 z-30 w-72 glass-panel p-4 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ color: isAnt ? selectedEntity.caste.color : isFood ? '#38bdf8' : '#ef4444' }}
          />
          <h3 className="font-extrabold text-sm text-slate-100 font-mono uppercase tracking-wide">
            {isAnt ? `${selectedEntity.caste.name} #${selectedEntity.id}` : isFood ? `${selectedEntity.type} Source` : selectedEntity.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Ant Inspector */}
      {isAnt && (
        <div className="space-y-3 text-xs">
          {/* Stage & State */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800 font-mono">
            <span className="text-slate-400">Stage: <strong className="text-purple-400">{selectedEntity.stage}</strong></span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {selectedEntity.state}
            </span>
          </div>

          {/* Vitals: HP & Energy */}
          <div className="space-y-1.5 font-mono">
            {/* HP */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3 h-3" /> HP
              </span>
              <span className="text-slate-300 font-bold">
                {Math.max(0, Math.ceil(selectedEntity.hp))} / {selectedEntity.maxHp}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, (selectedEntity.hp / selectedEntity.maxHp) * 100)}%` }}
              />
            </div>

            {/* Energy */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3" /> Energy
              </span>
              <span className="text-slate-300 font-bold">
                {Math.ceil(selectedEntity.energy)} / {selectedEntity.maxEnergy}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, (selectedEntity.energy / selectedEntity.maxEnergy) * 100)}%` }}
              />
            </div>
          </div>

          {/* Cargo Payload */}
          <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Package className="w-3.5 h-3.5 text-sky-400" /> Cargo:
            </span>
            <span className="text-slate-200 font-bold">
              {selectedEntity.cargo.amount > 0 ? (
                <span className="text-sky-300">{selectedEntity.cargo.amount}x {selectedEntity.cargo.type}</span>
              ) : (
                <span className="text-slate-500">Empty</span>
              )}
            </span>
          </div>

          {/* Real-time Activity Log */}
          <div>
            <h4 className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" /> Neural Log:
            </h4>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px] text-slate-300 max-h-24 overflow-y-auto">
              {selectedEntity.activityLog?.slice().reverse().map((log, i) => (
                <div key={i} className="leading-tight text-slate-400">
                  • <span className="text-slate-200">{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => onBoostEnergy(selectedEntity)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold font-mono transition"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Boost
            </button>
            <button
              onClick={() => onKillEntity(selectedEntity)}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-[11px] font-bold font-mono transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Cull
            </button>
          </div>
        </div>
      )}

      {/* Food Node Inspector */}
      {isFood && (
        <div className="space-y-3 text-xs font-mono">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-slate-300 mb-1">
              <span>Resource Type:</span>
              <strong className="text-sky-300 uppercase">{selectedEntity.type}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Remaining:</span>
              <strong className="text-slate-100">{Math.ceil(selectedEntity.amount)} / {selectedEntity.maxAmount}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Predator Inspector */}
      {isPredator && (
        <div className="space-y-3 text-xs font-mono">
          <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40 text-rose-200">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Hostile Threat
            </div>
            <div className="flex justify-between text-[11px]">
              <span>HP:</span>
              <span>{Math.max(0, Math.ceil(selectedEntity.hp))} / {selectedEntity.maxHp}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Attack Power:</span>
              <span>{selectedEntity.attack} DPS</span>
            </div>
          </div>

          <button
            onClick={() => onKillEntity(selectedEntity)}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-lg"
          >
            Squish Threat
          </button>
        </div>
      )}
    </aside>
  );
}
