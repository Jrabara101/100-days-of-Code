import React from 'react';
import { 
  Car, 
  X, 
  Gauge, 
  ArrowRightLeft, 
  ShieldAlert, 
  Zap, 
  Clock, 
  Flame,
  Radio
} from 'lucide-react';

export function VehicleInspectorModal({
  vehicleId,
  engine,
  onClose
}) {
  if (!vehicleId || !engine) return null;

  const vehicle = engine.vehicles.find(v => v.id === vehicleId);

  if (!vehicle) {
    return null;
  }

  const speedKmh = Math.round(vehicle.getSpeedKmh());
  const accelMps2 = vehicle.a.toFixed(2);
  const targetGap = vehicle.targetGapSStar ? vehicle.targetGapSStar.toFixed(1) : '--';
  const actualGap = vehicle.actualHeadway !== Infinity ? vehicle.actualHeadway.toFixed(1) : '∞ (Clear Road)';
  const deltaV = vehicle.vLead !== null ? (vehicle.v - vehicle.vLead).toFixed(1) : '0.0';

  return (
    <div className="fixed bottom-24 right-4 z-40 w-80 glass-panel p-4 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto border-cyan-400/30">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-3.5 h-3.5 rounded-full shadow-md"
            style={{ backgroundColor: vehicle.color }}
          />
          <h3 className="text-xs font-bold font-mono text-slate-100 flex items-center gap-1.5">
            <span>VEHICLE #{vehicle.id}</span>
            <span className="text-[10px] text-slate-400 font-sans">({vehicle.vehicleType})</span>
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Driver Archetype Badge */}
      <div className="flex justify-between items-center px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
        <span className="text-slate-400 text-[10px]">Driver Profile:</span>
        <strong style={{ color: vehicle.params.color }}>{vehicle.params.name}</strong>
      </div>

      {/* Live Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {/* Speed */}
        <div className="glass-card p-2 rounded-xl flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase">Velocity</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <strong className="text-sm text-sky-400">{speedKmh}</strong>
            <span className="text-[10px] text-slate-400">km/h</span>
          </div>
          <span className="text-[9px] text-slate-500">({vehicle.v.toFixed(1)} m/s)</span>
        </div>

        {/* Instantaneous Acceleration */}
        <div className="glass-card p-2 rounded-xl flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase">Acceleration (v̇)</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <strong className={`text-sm ${vehicle.a < -0.3 ? 'text-rose-400' : vehicle.a > 0.3 ? 'text-emerald-400' : 'text-slate-300'}`}>
              {vehicle.a > 0 ? `+${accelMps2}` : accelMps2}
            </strong>
            <span className="text-[10px] text-slate-400">m/s²</span>
          </div>
          <span className="text-[9px] text-slate-500">
            {vehicle.isBraking ? '🚨 BRAKING' : vehicle.a > 0.1 ? '⚡ ACCELERATING' : '⚖️ CRUISE'}
          </span>
        </div>

        {/* Actual Headway */}
        <div className="glass-card p-2 rounded-xl flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase">Net Headway (s)</span>
          <strong className="text-xs text-slate-200 mt-0.5">{actualGap} {actualGap !== '∞ (Clear Road)' ? 'm' : ''}</strong>
          <span className="text-[9px] text-slate-500">Bumper gap</span>
        </div>

        {/* Desired Gap s* */}
        <div className="glass-card p-2 rounded-xl flex flex-col">
          <span className="text-[9px] text-slate-400 uppercase">IDM Target (s*)</span>
          <strong className="text-xs text-cyan-300 mt-0.5">{targetGap} m</strong>
          <span className="text-[9px] text-slate-500">Equilibrium gap</span>
        </div>
      </div>

      {/* Approach Delta V */}
      <div className="flex justify-between items-center px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] font-mono">
        <span className="text-slate-400">Approach Velocity (Δv):</span>
        <strong className={parseFloat(deltaV) > 0 ? 'text-amber-400' : 'text-slate-300'}>
          {deltaV} m/s
        </strong>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-semibold">
        <button
          onClick={() => vehicle.triggerTapBrake(3.0)}
          className="py-1.5 px-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Tap Brake</span>
        </button>

        <button
          onClick={() => vehicle.toggleStall()}
          className={`py-1.5 px-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
            vehicle.isStalled
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{vehicle.isStalled ? 'Resume' : 'Stall Engine'}</span>
        </button>
      </div>
    </div>
  );
}
