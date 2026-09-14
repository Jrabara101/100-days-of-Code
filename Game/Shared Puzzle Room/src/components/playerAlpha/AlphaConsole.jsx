import React, { useState, useEffect } from 'react';
import { useGameState } from '../../context/GameStateContext';
import { useNetwork } from '../../context/NetworkContext';
import { Sliders, Activity, Info } from 'lucide-react';

export default function AlphaConsole({ isFocused = true }) {
  const { gameState, toggleAlphaNode, updateAlphaControl, pulseFrequency } = useGameState();
  const { playerRole } = useNetwork();
  const { alpha, phase } = gameState;

  // Waveform animation offset
  const [waveOffset, setWaveOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset((prev) => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const nodes = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];

  const cyclePotCal = () => {
    const options = [0, 6, 12, 18, 24];
    const nextIdx = (options.indexOf(alpha.potCal) + 1) % options.length;
    updateAlphaControl('potCal', options[nextIdx]);
  };

  return (
    <div
      className={`flex flex-col bg-surface-container-low/80 backdrop-blur-md rounded-xl p-space-md shadow-2xl space-y-space-md relative overflow-hidden group transition-all duration-300 ${
        isFocused ? 'ring-1 ring-primary/40' : 'opacity-80'
      }`}
    >
      {/* Glow Underlay Layer */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Alpha Console */}
      <div className="flex items-center justify-between bg-surface-container-high/90 p-space-sm rounded shadow-sm">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-body-lg">tune</span>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-primary tracking-widest uppercase">
              CON_ALPHA // VEX-01
            </span>
            <span className="font-headline-md text-headline-md text-on-surface leading-tight">
              Frequency Harmonic Tuner
            </span>
          </div>
        </div>
        <div className="px-space-sm py-space-xs rounded bg-surface-container-lowest font-telemetry-sm text-telemetry-sm text-primary flex items-center gap-1.5 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>{alpha.frequency.toFixed(1)} MHz</span>
        </div>
      </div>

      {/* Asymmetric Intelligence Clue Strip for Player 1 */}
      <div className="bg-primary/5 border border-primary/20 rounded p-space-xs flex items-start gap-2 text-[11px] font-telemetry-sm text-primary/90">
        <Info size={14} className="shrink-0 mt-0.5 text-primary" />
        <div>
          <span className="font-bold uppercase tracking-wider text-primary">[REMOTE TELEMETRY TO BETA]:</span>
          <p className="text-on-surface-variant text-[11px] leading-tight mt-0.5">
            Hydraulic conduit loop expects Chamber Beta to lock <strong className="text-secondary">BYPASS_DEG to 45°</strong> with <strong className="text-secondary">FLUX_DIV ENGAGED</strong> to enable Stage 1 harmonic absorption.
          </p>
        </div>
      </div>

      {/* Alpha Realtime Telemetry Readout */}
      <div className="grid grid-cols-2 gap-space-sm">
        <div className="bg-surface-container p-space-sm rounded flex flex-col shadow-inner">
          <span className="font-label-caps text-label-caps text-outline">RELAY INTEGRITY</span>
          <span className="font-telemetry-lg text-telemetry-lg text-primary font-bold">
            {alpha.activeNodes.length}/4 ENERGIZED
          </span>
          <div className="w-full bg-surface-container-highest h-1 rounded mt-space-xs overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, (alpha.activeNodes.length / 4) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-surface-container p-space-sm rounded flex flex-col shadow-inner">
          <span className="font-label-caps text-label-caps text-outline">CORE OVERCHARGE</span>
          <span
            className={`font-telemetry-lg text-telemetry-lg font-bold ${
              gameState.overcharge > 50 ? 'text-error animate-pulse' : 'text-on-surface'
            }`}
          >
            {gameState.overcharge > 50 ? 'CRITICAL ' : 'NOMINAL '} {gameState.overcharge}%
          </span>
          <div className="w-full bg-surface-container-highest h-1 rounded mt-space-xs overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                gameState.overcharge > 50 ? 'bg-error' : 'bg-primary/60'
              }`}
              style={{ width: `${gameState.overcharge}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Interactive Node Conduit Matrix */}
      <div className="bg-surface-container-lowest/80 p-space-md rounded-lg flex flex-col space-y-space-sm shadow-inner">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Resonance Node Matrix
          </span>
          <span className="font-telemetry-sm text-telemetry-sm text-primary">
            [POLARITY: {phase > 1 ? 'LOCKED' : 'MANUAL'}]
          </span>
        </div>

        {/* Interactive Grid with SVG Conduits */}
        <div className="relative bg-surface-container-low p-space-md rounded grid grid-cols-4 gap-space-md place-items-center">
          {/* Ambient conduit connections SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-primary"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 240 160"
          >
            <path
              className="animate-pulse"
              d="M 30,30 L 90,30 L 90,90 L 150,90 L 210,130"
              opacity="0.6"
              stroke="currentColor"
              strokeDasharray="4 2"
              strokeWidth="2"
            ></path>
            <path
              d="M 30,90 L 90,90 L 150,30 L 210,30"
              opacity="0.3"
              stroke="currentColor"
              strokeWidth="1.5"
            ></path>
          </svg>

          {/* Nodes */}
          {nodes.map((nodeId) => {
            const isActive = alpha.activeNodes.includes(nodeId);
            return (
              <button
                key={nodeId}
                onClick={() => toggleAlphaNode(nodeId)}
                className={`w-10 h-10 rounded font-telemetry-sm text-telemetry-sm font-bold flex items-center justify-center shadow-lg transition-all active:scale-95 z-10 ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(162,201,255,0.6)] scale-105'
                    : 'bg-surface-container-high text-outline hover:bg-surface-variant hover:text-primary'
                }`}
                type="button"
                title={`Toggle Resonance Node ${nodeId}`}
              >
                {nodeId}
              </button>
            );
          })}
        </div>
      </div>

      {/* Harmonic Frequency Waveform Visualizer */}
      <div className="bg-surface-container p-space-sm rounded-lg flex flex-col space-y-space-xs shadow-inner">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-outline">FREQUENCY CARRIER WAVE</span>
          <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
            RES-LOCK: {phase > 1 ? 'HARMONIZED' : 'ACTIVE'}
          </span>
        </div>
        <div className="h-16 w-full bg-surface-container-lowest rounded flex items-center px-space-xs overflow-hidden relative">
          <svg className="w-full h-12 text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 300 48">
            <path
              d={`M0,24 Q${25 + (waveOffset % 20)},${2 + (alpha.modulation / 10)} ${50},24 T100,24 T150,24 T200,24 T250,24 T300,24`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            ></path>
            <path
              d={`M0,24 Q25,${44 - (alpha.modulation / 12)} 50,24 T100,24 T150,24 T200,24 T250,24 T300,24`}
              fill="none"
              opacity="0.35"
              stroke="currentColor"
              strokeWidth="1"
            ></path>
          </svg>
        </div>
      </div>

      {/* Tactile Hardware Switches & Rotary Dials */}
      <div className="bg-surface-container-high p-space-md rounded-lg space-y-space-md shadow-md">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">
            Auxiliary Switches
          </span>
          <span className="font-telemetry-sm text-telemetry-sm text-outline">BANK 01-A</span>
        </div>

        <div className="grid grid-cols-3 gap-space-sm">
          {/* Toggle 1: GATE_TX */}
          <div
            onClick={() => updateAlphaControl('gateTx', !alpha.gateTx)}
            className="bg-surface-container-low p-space-sm rounded flex flex-col items-center gap-space-xs shadow-inner cursor-pointer hover:bg-surface-container transition-colors"
          >
            <span className="font-label-caps text-label-caps text-outline">GATE_TX</span>
            <div
              className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all ${
                alpha.gateTx ? 'bg-primary/30 justify-end' : 'bg-surface-container-highest justify-start'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-all shadow-md ${
                  alpha.gateTx ? 'bg-primary shadow-[0_0_8px_rgba(162,201,255,0.8)]' : 'bg-outline'
                }`}
              ></div>
            </div>
            <span
              className={`font-telemetry-sm text-telemetry-sm font-bold ${
                alpha.gateTx ? 'text-primary' : 'text-outline'
              }`}
            >
              {alpha.gateTx ? 'ARMED' : 'OFF'}
            </span>
          </div>

          {/* Toggle 2: PHASE_ST */}
          <div
            onClick={() => updateAlphaControl('phaseSt', !alpha.phaseSt)}
            className="bg-surface-container-low p-space-sm rounded flex flex-col items-center gap-space-xs shadow-inner cursor-pointer hover:bg-surface-container transition-colors"
          >
            <span className="font-label-caps text-label-caps text-outline">PHASE_ST</span>
            <div
              className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all ${
                alpha.phaseSt ? 'bg-primary/30 justify-end' : 'bg-surface-container-highest justify-start'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-all shadow-md ${
                  alpha.phaseSt ? 'bg-primary shadow-[0_0_8px_rgba(162,201,255,0.8)]' : 'bg-outline'
                }`}
              ></div>
            </div>
            <span
              className={`font-telemetry-sm text-telemetry-sm font-bold ${
                alpha.phaseSt ? 'text-primary' : 'text-outline'
              }`}
            >
              {alpha.phaseSt ? 'ACTIVE' : 'STBY'}
            </span>
          </div>

          {/* Rotary Dial Indicator: POT_CAL */}
          <div
            onClick={cyclePotCal}
            className="bg-surface-container-low p-space-sm rounded flex flex-col items-center gap-space-xs shadow-inner cursor-pointer hover:bg-surface-container transition-colors group/dial"
          >
            <span className="font-label-caps text-label-caps text-outline">POT_CAL</span>
            <div className="w-7 h-7 rounded-full bg-surface-container-highest relative flex items-center justify-center shadow transition-transform group-hover/dial:scale-105">
              <div
                className="w-1 h-3.5 bg-primary rounded-full absolute -top-0.5 transition-transform duration-300"
                style={{ transform: `rotate(${alpha.potCal * 10}deg)` }}
              ></div>
            </div>
            <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
              +{alpha.potCal} dB
            </span>
          </div>
        </div>

        {/* Slider Levers with Calibration Ticks */}
        <div className="space-y-1">
          <div className="flex justify-between font-label-caps text-label-caps text-outline">
            <span>MODULATION COEF</span>
            <span className="text-primary font-telemetry-sm text-telemetry-sm font-bold">
              {alpha.modulation.toFixed(1)}%
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={alpha.modulation}
              onChange={(e) => updateAlphaControl('modulation', parseFloat(e.target.value))}
              className="w-full h-3 bg-surface-container-lowest rounded appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="flex justify-between px-0.5 font-label-caps text-label-caps text-outline-variant">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={pulseFrequency}
        className={`w-full py-space-sm px-space-md rounded font-label-caps text-label-caps uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-space-xs shadow-xl active:scale-[0.98] ${
          phase > 1
            ? 'bg-tertiary text-on-tertiary-fixed shadow-tertiary/20'
            : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-primary/30'
        }`}
        type="button"
      >
        <span className="material-symbols-outlined text-body-md">graphic_eq</span>
        <span>
          {phase > 1 ? 'STAGE 01 LOCKED // RE-PULSE' : 'PULSE FREQUENCY [SHIFT-01]'}
        </span>
      </button>
    </div>
  );
}
