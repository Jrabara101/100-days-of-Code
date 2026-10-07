import React from 'react';
import { Gamepad2, Sliders, Activity, MousePointer, ShieldCheck } from 'lucide-react';
import { SettingsState, ControllerType, ActiveControlScheme } from '@/types/settings';
import { DeadzoneVisualizer } from './DeadzoneVisualizer';
import { SandboxArena } from './SandboxArena';
import { GamepadStateSnapshot } from '@/types/settings';

export interface HardwareWorkbenchProps {
  settings: SettingsState;
  gamepadState: GamepadStateSnapshot;
  activeScheme: ActiveControlScheme;
  onSimulateDevice: (scheme: ActiveControlScheme) => void;
  onSimulateStick: (x: number, y: number) => void;
  onDeadzoneChange: (val: number) => void;
}

export const HardwareWorkbench: React.FC<HardwareWorkbenchProps> = ({
  settings,
  gamepadState,
  activeScheme,
  onSimulateDevice,
  onSimulateStick,
  onDeadzoneChange,
}) => {
  const leftX = gamepadState.axes.leftStickX;
  const leftY = gamepadState.axes.leftStickY;
  const rightX = gamepadState.axes.rightStickX;
  const rightY = gamepadState.axes.rightStickY;

  const ltPercent = Math.round((gamepadState.leftTrigger || 0) * 100);
  const rtPercent = Math.round((gamepadState.rightTrigger || 0) * 100);

  return (
    <div className="flex flex-col gap-4 sticky top-0 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
      {/* Device Emulation Quick Switcher */}
      <div className="p-3.5 rounded-xl bg-[#0E1118] border border-[#1E2538] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Hardware Profile Emulation
          </span>
          <span className="text-[10px] font-mono text-[#38BDF8] bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
            AUTO DETECT ON
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => onSimulateDevice('KBM')}
            className={`px-2 py-1.5 rounded text-[11px] font-mono font-bold transition-all ${
              activeScheme === 'KBM'
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'bg-[#1C2232] text-slate-400 hover:text-white hover:bg-[#283145]'
            }`}
          >
            KBM
          </button>
          <button
            type="button"
            onClick={() => onSimulateDevice('GAMEPAD_XBOX')}
            className={`px-2 py-1.5 rounded text-[11px] font-mono font-bold transition-all ${
              activeScheme === 'GAMEPAD_XBOX'
                ? 'bg-emerald-500 text-slate-950 shadow-glow-emerald'
                : 'bg-[#1C2232] text-slate-400 hover:text-white hover:bg-[#283145]'
            }`}
          >
            XBOX
          </button>
          <button
            type="button"
            onClick={() => onSimulateDevice('GAMEPAD_PLAYSTATION')}
            className={`px-2 py-1.5 rounded text-[11px] font-mono font-bold transition-all ${
              activeScheme === 'GAMEPAD_PLAYSTATION'
                ? 'bg-blue-500 text-slate-950 shadow-sm'
                : 'bg-[#1C2232] text-slate-400 hover:text-white hover:bg-[#283145]'
            }`}
          >
            PS5
          </button>
          <button
            type="button"
            onClick={() => onSimulateDevice('GAMEPAD_SWITCH')}
            className={`px-2 py-1.5 rounded text-[11px] font-mono font-bold transition-all ${
              activeScheme === 'GAMEPAD_SWITCH'
                ? 'bg-red-500 text-white shadow-glow-crimson'
                : 'bg-[#1C2232] text-slate-400 hover:text-white hover:bg-[#283145]'
            }`}
          >
            SWITCH
          </button>
        </div>
      </div>

      {/* Analog Triggers Squeeze Gauge */}
      <div className="p-3.5 rounded-xl bg-[#0E1118] border border-[#1E2538] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            Analog Trigger Squeeze
          </span>
          <span className="text-[10px] font-mono text-slate-400">0 - 100% PRESSURE</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* LT */}
          <div className="flex flex-col gap-1 p-2 rounded bg-[#131722] border border-[#1E2538]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">LT (LEFT)</span>
              <span className="font-bold text-cyan-400">{ltPercent}%</span>
            </div>
            <div className="h-2 w-full bg-[#08090D] rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-75"
                style={{ width: `${ltPercent}%` }}
              />
            </div>
          </div>

          {/* RT */}
          <div className="flex flex-col gap-1 p-2 rounded bg-[#131722] border border-[#1E2538]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">RT (RIGHT)</span>
              <span className="font-bold text-amber-400">{rtPercent}%</span>
            </div>
            <div className="h-2 w-full bg-[#08090D] rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-75"
                style={{ width: `${rtPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deadzone Visualizer Component */}
      <DeadzoneVisualizer
        deadzone={settings.gameplaySettings.stickDeadzone}
        rawX={leftX}
        rawY={leftY}
        onSimulateStick={onSimulateStick}
      />

      {/* Live Embedded Sandbox Arena */}
      <SandboxArena
        settings={settings}
        rawStickX={leftX}
        rawStickY={leftY}
        rawRightX={rightX}
        rawRightY={rightY}
      />

      {/* Controller Button Rapid-Test Indicator Matrix */}
      <div className="p-3.5 rounded-xl bg-[#0E1118] border border-[#1E2538] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Hardware Switch Bus
          </span>
          <span className="text-[10px] text-slate-500">17-CHANNEL POLLED</span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 text-center font-mono text-[10px]">
          {gamepadState.buttons.map((btn) => (
            <div
              key={btn.index}
              className={`p-1 rounded border transition-colors ${
                btn.pressed || btn.value > 0.3
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-300 shadow-glow-cyan'
                  : 'bg-[#131722] text-slate-500 border-[#1E2538]'
              }`}
            >
              {btn.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
