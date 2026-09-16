import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { useNetwork } from '../../context/NetworkContext';
import { Info, RotateCw } from 'lucide-react';

export default function BetaConsole({ isFocused = true }) {
  const { gameState, rotateBetaHex, updateBetaControl, dispatchFlux } = useGameState();
  const { beta, phase } = gameState;

  const hexes = ['H1', 'H2', 'H3', 'H4', 'K1', 'K2', 'K3', 'K4', 'L1', 'L2', 'L3', 'L4'];

  const cycleBypassDeg = () => {
    const degrees = [0, 45, 90, 135, 180];
    const currentIdx = degrees.indexOf(beta.bypassDeg);
    const nextIdx = (currentIdx + 1) % degrees.length;
    updateBetaControl('bypassDeg', degrees[nextIdx]);
  };

  return (
    <div
      className={`flex flex-col bg-surface-container-low/80 backdrop-blur-md rounded-xl p-space-md shadow-2xl space-y-space-md relative overflow-hidden group transition-all duration-300 ${
        isFocused ? 'ring-1 ring-secondary/40' : 'opacity-80'
      }`}
    >
      {/* Glow Underlay Layer */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Beta Console */}
      <div className="flex items-center justify-between bg-surface-container-high/90 p-space-sm rounded shadow-sm">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-secondary text-body-lg">alt_route</span>
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
              CON_BETA // NYX-09
            </span>
            <span className="font-headline-md text-headline-md text-on-surface leading-tight">
              Energy Conduit Router
            </span>
          </div>
        </div>
        <div className="px-space-sm py-space-xs rounded bg-surface-container-lowest font-telemetry-sm text-telemetry-sm text-secondary flex items-center gap-1.5 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span>BAR {beta.hydraulicPressure.toFixed(1)}</span>
        </div>
      </div>

      {/* Asymmetric Intelligence Clue Strip for Player 2 */}
      <div className="bg-secondary/5 border border-secondary/20 rounded p-space-xs flex items-start gap-2 text-[11px] font-telemetry-sm text-secondary/90">
        <Info size={14} className="shrink-0 mt-0.5 text-secondary" />
        <div>
          <span className="font-bold uppercase tracking-wider text-secondary">[REMOTE TELEMETRY TO ALPHA]:</span>
          <p className="text-on-surface-variant text-[11px] leading-tight mt-0.5">
            Diagnostic matrix confirms Chamber Alpha requires resonance nodes <strong className="text-primary">[A1, B2, C3, C4]</strong> energized and <strong className="text-primary">GATE_TX ARMED</strong> to align the 432.8 MHz carrier wave.
          </p>
        </div>
      </div>

      {/* Beta Realtime Telemetry Readout */}
      <div className="grid grid-cols-2 gap-space-sm">
        <div className="bg-surface-container p-space-sm rounded flex flex-col shadow-inner">
          <span className="font-label-caps text-label-caps text-outline">GATE LOCK 02</span>
          <span className="font-telemetry-lg text-telemetry-lg text-tertiary font-bold">
            {phase >= 2 ? 'UNLOCKED (ACTV)' : 'ENGAGED'}
          </span>
          <div className="w-full bg-surface-container-highest h-1 rounded mt-space-xs overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${phase >= 2 ? 'bg-tertiary w-full' : 'bg-secondary w-1/3'}`}
            ></div>
          </div>
        </div>
        <div className="bg-surface-container p-space-sm rounded flex flex-col shadow-inner">
          <span className="font-label-caps text-label-caps text-outline">CONDUIT FLUID FLOW</span>
          <span className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">
            {beta.fluidFlow} L/M (94%)
          </span>
          <div className="w-full bg-surface-container-highest h-1 rounded mt-space-xs overflow-hidden">
            <div className="h-full bg-secondary w-[94%]"></div>
          </div>
        </div>
      </div>

      {/* Interactive Hex-Grid Conduit Shifter */}
      <div className="bg-surface-container-lowest/80 p-space-md rounded-lg flex flex-col space-y-space-sm shadow-inner">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
            Rotational Hex Power Matrix
          </span>
          <span className="font-telemetry-sm text-telemetry-sm text-secondary">
            [FLUX: {phase > 2 ? 'LOCKED' : 'COHERENT'}]
          </span>
        </div>

        {/* Hex Grid Alignment Matrix */}
        <div className="relative bg-surface-container-low p-space-md rounded grid grid-cols-4 gap-space-md place-items-center">
          {/* Ambient conduit connections SVG Amber */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-secondary"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 240 160"
          >
            <path
              className="animate-pulse"
              d="M 210,30 L 150,30 L 150,90 L 90,90 L 30,130"
              opacity="0.6"
              stroke="currentColor"
              strokeDasharray="4 2"
              strokeWidth="2"
            ></path>
            <path
              d="M 210,90 L 150,90 L 90,30 L 30,30"
              opacity="0.3"
              stroke="currentColor"
              strokeWidth="1.5"
            ></path>
          </svg>

          {/* Hex buttons */}
          {hexes.map((hexId) => {
            const rot = beta.hexRotations[hexId] || 0;
            const isTarget = ['K2', 'L3', 'H4'].includes(hexId);
            return (
              <button
                key={hexId}
                onClick={() => rotateBetaHex(hexId)}
                className={`w-10 h-10 rounded font-telemetry-sm text-telemetry-sm font-bold flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 z-10 relative group/hex ${
                  rot > 0
                    ? 'bg-secondary text-on-secondary shadow-[0_0_12px_rgba(250,188,69,0.6)]'
                    : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
                }`}
                type="button"
                title={`Click to rotate hex cell ${hexId} (current: ${rot}°)`}
              >
                <span className="text-[11px]">{hexId}</span>
                <span
                  className="text-[8px] font-normal transition-transform duration-300"
                  style={{ transform: `rotate(${rot}deg)` }}
                >
                  ▲
                </span>
                <span className="absolute -bottom-2 text-[7px] text-on-secondary/80 font-mono">
                  {rot}°
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fluid Hydraulic Pressure Bar Graphs */}
      <div className="bg-surface-container p-space-sm rounded-lg flex flex-col space-y-space-xs shadow-inner">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-outline">CONDUIT FLUID DYNAMICS</span>
          <span className="font-telemetry-sm text-telemetry-sm text-secondary font-bold">
            {beta.hydraulicPressure.toFixed(1)} BAR // STABLE
          </span>
        </div>
        <div className="h-16 w-full bg-surface-container-lowest rounded flex items-end justify-between p-space-xs gap-1">
          {[35, 65, 80, 100, 75, 50, 68, 85].map((pct, idx) => {
            const height = Math.min(100, (pct * beta.packetInjectionRate) / 92);
            return (
              <div
                key={idx}
                className="w-1/8 bg-secondary/80 rounded-t transition-all duration-300"
                style={{
                  height: `${height}%`,
                  opacity: 0.3 + (height / 100) * 0.7
                }}
              ></div>
            );
          })}
        </div>
      </div>

      {/* Tactile Hardware Switches & Rotary Dials Beta */}
      <div className="bg-surface-container-high p-space-md rounded-lg space-y-space-md shadow-md">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">
            Auxiliary Switches
          </span>
          <span className="font-telemetry-sm text-telemetry-sm text-outline">BANK 02-B</span>
        </div>

        <div className="grid grid-cols-3 gap-space-sm">
          {/* Rotary Bypass Dial */}
          <div
            onClick={cycleBypassDeg}
            className="bg-surface-container-low p-space-sm rounded flex flex-col items-center gap-space-xs shadow-inner cursor-pointer hover:bg-surface-container transition-colors group/rot"
          >
            <span className="font-label-caps text-label-caps text-outline">BYPASS_DEG</span>
            <div className="w-7 h-7 rounded-full bg-surface-container-highest relative flex items-center justify-center shadow transition-transform group-hover/rot:scale-105">
              <div
                className="w-1 h-3.5 bg-secondary rounded-full absolute -top-0.5 transition-transform duration-300"
                style={{ transform: `rotate(${beta.bypassDeg}deg)` }}
              ></div>
            </div>
            <span className="font-telemetry-sm text-telemetry-sm text-secondary font-bold">
              {beta.bypassDeg}° ANG
            </span>
          </div>

          {/* Toggle 1: FLUX_DIV */}
          <div
            onClick={() => updateBetaControl('fluxDiv', !beta.fluxDiv)}
            className="bg-surface-container-low p-space-sm rounded flex flex-col items-center gap-space-xs shadow-inner cursor-pointer hover:bg-surface-container transition-colors"
          >
            <span className="font-label-caps text-label-caps text-outline">FLUX_DIV</span>
            <div
              className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all ${
                beta.fluxDiv ? 'bg-secondary/30 justify-end' : 'bg-surface-container-highest justify-start'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-all shadow-md ${
                  beta.fluxDiv ? 'bg-secondary shadow-[0_0_8px_rgba(250,188,69,0.8)]' : 'bg-outline'
                }`}
              ></div>
            </div>
            <span
              className={`font-telemetry-sm text-telemetry-sm font-bold ${
                beta.fluxDiv ? 'text-secondary' : 'text-outline'
              }`}
            >
              {beta.fluxDiv ? 'ENGAGED' : 'OFF'}
            </span>
          </div>

          {/* Toggle 2: GATE_REL */}
          <div
            onClick={() => updateBetaControl('gateRel', !beta.gateRel)}
            className="bg-surface-container-low p-space-sm rounded flex flex-col items-center gap-space-xs shadow-inner cursor-pointer hover:bg-surface-container transition-colors"
          >
            <span className="font-label-caps text-label-caps text-outline">GATE_REL</span>
            <div
              className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-all ${
                beta.gateRel ? 'bg-secondary/30 justify-end' : 'bg-surface-container-highest justify-start'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-all shadow-md ${
                  beta.gateRel ? 'bg-secondary shadow-[0_0_8px_rgba(250,188,69,0.8)]' : 'bg-outline'
                }`}
              ></div>
            </div>
            <span
              className={`font-telemetry-sm text-telemetry-sm font-bold ${
                beta.gateRel ? 'text-secondary' : 'text-outline'
              }`}
            >
              {beta.gateRel ? 'LATCHED' : 'OPEN'}
            </span>
          </div>
        </div>

        {/* Conduit Throttle Lever with Calibration Ticks */}
        <div className="space-y-1">
          <div className="flex justify-between font-label-caps text-label-caps text-outline">
            <span>PACKET INJECTION RATE</span>
            <span className="text-secondary font-telemetry-sm text-telemetry-sm font-bold">
              {beta.packetInjectionRate.toFixed(1)} kP/s
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={beta.packetInjectionRate}
              onChange={(e) => updateBetaControl('packetInjectionRate', parseFloat(e.target.value))}
              className="w-full h-3 bg-surface-container-lowest rounded appearance-none cursor-pointer accent-secondary"
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
        onClick={dispatchFlux}
        className={`w-full py-space-sm px-space-md rounded font-label-caps text-label-caps uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-space-xs shadow-xl active:scale-[0.98] ${
          phase > 2
            ? 'bg-tertiary text-on-tertiary-fixed shadow-tertiary/20'
            : 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container shadow-secondary/30'
        }`}
        type="button"
      >
        <span className="material-symbols-outlined text-body-md">bolt</span>
        <span>
          {phase > 2 ? 'STAGE 02 LOCKED // RE-DISPATCH' : 'DISPATCH FLUX PACKET [SHIFT-02]'}
        </span>
      </button>
    </div>
  );
}
