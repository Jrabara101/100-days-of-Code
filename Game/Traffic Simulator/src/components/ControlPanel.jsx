import React, { useState } from 'react';
import { 
  Sliders, 
  Car, 
  TrafficCone, 
  Eye, 
  X, 
  RotateCw, 
  PlusCircle, 
  Trash2,
  Sparkles,
  Cpu
} from 'lucide-react';
import { DRIVER_PROFILES } from '../engine/IDM.js';

export function ControlPanel({
  isOpen,
  onClose,
  engine,
  visualOptions,
  onUpdateVisualOptions,
  onSpawnVehicle,
  onForceCycleLight,
  onClearVehicles
}) {
  const [activeTab, setActiveTab] = useState('idm'); // 'idm' | 'spawner' | 'signals' | 'display'
  const [selectedProfile, setSelectedProfile] = useState('COMMUTER');

  // Local IDM slider state
  const [idmParams, setIdmParams] = useState({
    v0: 16.67, // m/s (60 km/h)
    T: 1.4,
    s0: 4.0,
    aMax: 1.4,
    bComf: 1.8,
    delta: 4
  });

  const [inflowRate, setInflowRate] = useState(engine.inflowRate || 30);
  const [spawnType, setSpawnType] = useState('car');
  const [spawnLane, setSpawnLane] = useState(Object.keys(engine.tracks)[0] || 'ring');

  const handleProfileSelect = (key) => {
    setSelectedProfile(key);
    const profile = DRIVER_PROFILES[key];
    if (profile) {
      const newParams = {
        v0: profile.v0,
        T: profile.T,
        s0: profile.s0,
        aMax: profile.aMax,
        bComf: profile.bComf,
        delta: profile.delta
      };
      setIdmParams(newParams);
      engine.globalDriverProfile = key;
      engine.setGlobalIDMOverrides(newParams);
    }
  };

  const handleSliderChange = (param, value) => {
    const newParams = { ...idmParams, [param]: parseFloat(value) };
    setIdmParams(newParams);
    engine.setGlobalIDMOverrides(newParams);
  };

  const handleInflowChange = (val) => {
    const rate = parseInt(val, 10);
    setInflowRate(rate);
    engine.inflowRate = rate;
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-20 right-4 z-40 w-96 max-h-[82vh] overflow-y-auto glass-panel p-5 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-200 pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase font-mono">
            ENGINE CONTROL DECK
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab('idm')}
          className={`py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'idm'
              ? 'bg-sky-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Physics
        </button>
        <button
          onClick={() => setActiveTab('spawner')}
          className={`py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'spawner'
              ? 'bg-sky-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Spawner
        </button>
        <button
          onClick={() => setActiveTab('signals')}
          className={`py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'signals'
              ? 'bg-sky-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Signals
        </button>
        <button
          onClick={() => setActiveTab('display')}
          className={`py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'display'
              ? 'bg-sky-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Layers
        </button>
      </div>

      {/* TAB 1: IDM PHYSICS & DRIVER PROFILES */}
      {activeTab === 'idm' && (
        <div className="flex flex-col gap-4 text-xs">
          {/* Driver Profiles Selector */}
          <div>
            <label className="text-[11px] font-mono text-sky-400 mb-2 block font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>DRIVER ARCHETYPE PRESET</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(DRIVER_PROFILES).map(([key, profile]) => (
                <button
                  key={key}
                  onClick={() => handleProfileSelect(key)}
                  className={`p-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
                    selectedProfile === key
                      ? 'border-sky-400 bg-sky-500/20 text-white shadow-md'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-[11px]" style={{ color: profile.color }}>
                    {profile.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    v0: {Math.round(profile.v0 * 3.6)}km/h | T: {profile.T}s
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex flex-col gap-3 font-mono">
            {/* Desired Speed v0 */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Desired Speed (v₀):</span>
                <strong className="text-sky-400">{Math.round(idmParams.v0 * 3.6)} km/h</strong>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="0.5"
                value={idmParams.v0}
                onChange={(e) => handleSliderChange('v0', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Safe Time Headway T */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Safe Time Headway (T):</span>
                <strong className="text-sky-400">{idmParams.T.toFixed(1)} s</strong>
              </div>
              <input
                type="range"
                min="0.4"
                max="3.0"
                step="0.1"
                value={idmParams.T}
                onChange={(e) => handleSliderChange('T', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Standstill Gap s0 */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Standstill Gap (s₀):</span>
                <strong className="text-sky-400">{idmParams.s0.toFixed(1)} m</strong>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={idmParams.s0}
                onChange={(e) => handleSliderChange('s0', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Max Acceleration a */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Max Acceleration (a):</span>
                <strong className="text-sky-400">{idmParams.aMax.toFixed(1)} m/s²</strong>
              </div>
              <input
                type="range"
                min="0.4"
                max="3.5"
                step="0.1"
                value={idmParams.aMax}
                onChange={(e) => handleSliderChange('aMax', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Comfortable Braking b */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Comfortable Decel (b):</span>
                <strong className="text-sky-400">{idmParams.bComf.toFixed(1)} m/s²</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={idmParams.bComf}
                onChange={(e) => handleSliderChange('bComf', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPAWNER & FLEET CONTROLS */}
      {activeTab === 'spawner' && (
        <div className="flex flex-col gap-4 text-xs font-mono">
          {/* Continuous Inflow Demand */}
          <div className="glass-card p-3 rounded-xl">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300">Continuous Inflow Demand:</span>
              <strong className="text-emerald-400">{inflowRate} veh/min</strong>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={inflowRate}
              onChange={(e) => handleInflowChange(e.target.value)}
              className="w-full mb-2"
            />
            <p className="text-[10px] text-slate-400 font-sans">
              Injects vehicles automatically when safe headway is available at entry lines.
            </p>
          </div>

          {/* Manual Injection Tool */}
          <div className="glass-card p-3 rounded-xl flex flex-col gap-3">
            <label className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>MANUAL INJECTION</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Vehicle Type:</span>
                <select
                  value={spawnType}
                  onChange={(e) => setSpawnType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                >
                  <option value="car">Standard Sedan</option>
                  <option value="sports">Sports Car</option>
                  <option value="truck">Heavy Freight Truck</option>
                  <option value="compact">Compact EV</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Target Track:</span>
                <select
                  value={spawnLane}
                  onChange={(e) => setSpawnLane(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 outline-none"
                >
                  {Object.keys(engine.tracks).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => onSpawnVehicle(spawnLane, selectedProfile, spawnType)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-white shadow-lg active:scale-95 transition-all text-xs"
            >
              ➕ Inject Vehicle Now
            </button>
          </div>

          {/* Clear Traffic Button */}
          <button
            onClick={onClearVehicles}
            className="w-full py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-all text-xs font-bold flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Vehicles</span>
          </button>
        </div>
      )}

      {/* TAB 3: SIGNALS & TRAFFIC LIGHT FSM */}
      {activeTab === 'signals' && (
        <div className="flex flex-col gap-4 text-xs font-mono">
          {engine.trafficLight ? (
            <>
              {/* Adaptive Mode Toggle */}
              <div className="glass-card p-3 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">Smart Sensor Adaptive FSM</span>
                  <span className="text-[10px] text-slate-400 font-sans">Extends green dynamically based on queue density</span>
                </div>
                <input
                  type="checkbox"
                  checked={engine.trafficLight.adaptiveMode}
                  onChange={(e) => {
                    engine.trafficLight.adaptiveMode = e.target.checked;
                  }}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Green Duration */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Green Phase Duration:</span>
                  <strong className="text-emerald-400">{engine.trafficLight.greenDuration} s</strong>
                </div>
                <input
                  type="range"
                  min="4"
                  max="25"
                  step="1"
                  defaultValue={engine.trafficLight.greenDuration}
                  onChange={(e) => { engine.trafficLight.greenDuration = parseFloat(e.target.value); }}
                  className="w-full"
                />
              </div>

              {/* Yellow Duration */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Yellow Dilemma Clearance:</span>
                  <strong className="text-amber-400">{engine.trafficLight.yellowDuration} s</strong>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="5.0"
                  step="0.5"
                  defaultValue={engine.trafficLight.yellowDuration}
                  onChange={(e) => { engine.trafficLight.yellowDuration = parseFloat(e.target.value); }}
                  className="w-full"
                />
              </div>

              {/* Force Cycle Button */}
              <button
                onClick={onForceCycleLight}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold hover:bg-amber-500/30 transition-all text-xs flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Force Next Signal Phase</span>
              </button>
            </>
          ) : (
            <div className="p-4 text-center text-slate-400 font-sans glass-card rounded-xl">
              <TrafficCone className="w-8 h-8 mx-auto text-slate-500 mb-2" />
              <p>This scenario does not utilize traffic signal FSMs (Free-flow / Ring circuit).</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VISUAL DISPLAY LAYERS */}
      {activeTab === 'display' && (
        <div className="flex flex-col gap-3 text-xs font-mono">
          <label className="flex items-center justify-between p-3 rounded-xl glass-card cursor-pointer hover:border-sky-400/40 transition-all">
            <div>
              <span className="text-slate-200 font-bold block text-[11px]">Speed Heatmap Mode</span>
              <span className="text-[10px] text-slate-400 font-sans">Colors cars: Red=Stopped/Jam, Green=Free flow</span>
            </div>
            <input
              type="checkbox"
              checked={visualOptions.showHeatmap}
              onChange={(e) => onUpdateVisualOptions({ showHeatmap: e.target.checked })}
              className="w-4 h-4 accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl glass-card cursor-pointer hover:border-sky-400/40 transition-all">
            <div>
              <span className="text-slate-200 font-bold block text-[11px]">Headway Gap Vectors</span>
              <span className="text-[10px] text-slate-400 font-sans">Renders dashed distance rays between adjacent cars</span>
            </div>
            <input
              type="checkbox"
              checked={visualOptions.showHeadways}
              onChange={(e) => onUpdateVisualOptions({ showHeadways: e.target.checked })}
              className="w-4 h-4 accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl glass-card cursor-pointer hover:border-sky-400/40 transition-all">
            <div>
              <span className="text-slate-200 font-bold block text-[11px]">Stop Lines & Crosswalks</span>
              <span className="text-[10px] text-slate-400 font-sans">Shows physical stop lines and signal boundary boxes</span>
            </div>
            <input
              type="checkbox"
              checked={visualOptions.showStopLines}
              onChange={(e) => onUpdateVisualOptions({ showStopLines: e.target.checked })}
              className="w-4 h-4 accent-cyan-400"
            />
          </label>
        </div>
      )}
    </aside>
  );
}
