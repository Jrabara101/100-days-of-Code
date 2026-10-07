import React from 'react';
import { Sliders, MousePointer, Vibrate, Shield } from 'lucide-react';
import { SettingsState, GameplaySettings } from '@/types/settings';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { INITIAL_SETTINGS_STATE } from '@/constants/defaultSettings';

export interface GameplayTabProps {
  settings: SettingsState;
  onUpdateSetting: <K extends keyof GameplaySettings>(key: K, value: GameplaySettings[K]) => void;
}

export const GameplayTab: React.FC<GameplayTabProps> = ({
  settings,
  onUpdateSetting,
}) => {
  const g = settings.gameplaySettings;
  const def = INITIAL_SETTINGS_STATE.gameplaySettings;

  return (
    <div className="flex flex-col gap-6">
      {/* Mouse & Aiming Calibration */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2538]">
          <MousePointer className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Mouse Dynamics & Aim Calibration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Slider
            label="Mouse Sensitivity Multiplier"
            description="Scales raw hardware DPI input into rotation delta."
            value={g.mouseSensitivity}
            min={0.1}
            max={10.0}
            step={0.05}
            suffix="x"
            altered={g.mouseSensitivity !== def.mouseSensitivity}
            onResetDefault={() => onUpdateSetting('mouseSensitivity', def.mouseSensitivity)}
            onChange={(val) => onUpdateSetting('mouseSensitivity', val)}
          />

          <div className="p-3 rounded-lg bg-[#131722]/80 border border-[#1E2538] flex flex-col justify-between">
            <div>
              <span className="text-sm font-semibold text-[#F8FAFC] tracking-wide block">
                Aim Response Curve
              </span>
              <span className="text-xs text-[#64748B] leading-relaxed block mt-1">
                Defines input acceleration curve for fine crosshair adjustments.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-3">
              {(['linear', 'exponential', 's-curve'] as const).map((curve) => (
                <button
                  key={curve}
                  type="button"
                  onClick={() => onUpdateSetting('responseCurve', curve)}
                  className={`px-2 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                    g.responseCurve === curve
                      ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                      : 'bg-[#1C2232] text-slate-400 hover:text-white'
                  }`}
                >
                  {curve}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Switch
            label="Invert Y-Axis (Pitch)"
            description="Reverses vertical look trajectory for flight stick or retro camera feel."
            checked={g.invertYAxis}
            altered={g.invertYAxis !== def.invertYAxis}
            onResetDefault={() => onUpdateSetting('invertYAxis', def.invertYAxis)}
            onCheckedChange={(val) => onUpdateSetting('invertYAxis', val)}
          />

          <Switch
            label="Hold to Aim Down Sights (ADS)"
            description="When enabled, requires holding RMB or LT to maintain optical zoom."
            checked={g.adsHold}
            altered={g.adsHold !== def.adsHold}
            onResetDefault={() => onUpdateSetting('adsHold', def.adsHold)}
            onCheckedChange={(val) => onUpdateSetting('adsHold', val)}
          />
        </div>
      </div>

      {/* Movement Mechanics */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2538]">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Movement Actuation
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Switch
            label="Toggle Sprint Mode"
            description="Press once to engage full sprint speed instead of holding key."
            checked={g.toggleSprint}
            altered={g.toggleSprint !== def.toggleSprint}
            onResetDefault={() => onUpdateSetting('toggleSprint', def.toggleSprint)}
            onCheckedChange={(val) => onUpdateSetting('toggleSprint', val)}
          />

          <Switch
            label="Toggle Crouch Mode"
            description="Press once to toggle stance between standing and crouched."
            checked={g.toggleCrouch}
            altered={g.toggleCrouch !== def.toggleCrouch}
            onResetDefault={() => onUpdateSetting('toggleCrouch', def.toggleCrouch)}
            onCheckedChange={(val) => onUpdateSetting('toggleCrouch', val)}
          />
        </div>
      </div>

      {/* Analog Gamepad Mechanics */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2538]">
          <Vibrate className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Analog Hardware & Haptic Telemetry
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Slider
            label="Analog Stick Inner Deadzone"
            description="Filters out hardware stick drift and micro-jitter when centered."
            value={g.stickDeadzone}
            min={0.0}
            max={0.5}
            step={0.01}
            altered={g.stickDeadzone !== def.stickDeadzone}
            onResetDefault={() => onUpdateSetting('stickDeadzone', def.stickDeadzone)}
            onChange={(val) => onUpdateSetting('stickDeadzone', val)}
          />

          <Slider
            label="Controller Vibration Intensity"
            description="Sets magnitude for dual-rumble motors and weapon discharge recoil."
            value={g.vibrationIntensity}
            min={0}
            max={100}
            step={1}
            suffix="%"
            altered={g.vibrationIntensity !== def.vibrationIntensity}
            onResetDefault={() => onUpdateSetting('vibrationIntensity', def.vibrationIntensity)}
            onChange={(val) => onUpdateSetting('vibrationIntensity', val)}
          />
        </div>

        <Switch
          label="Enable Gamepad Vibration Actuators"
          description="Send tactile haptic pulses to supported physical gamepads."
          checked={g.vibrationEnabled}
          altered={g.vibrationEnabled !== def.vibrationEnabled}
          onResetDefault={() => onUpdateSetting('vibrationEnabled', def.vibrationEnabled)}
          onCheckedChange={(val) => onUpdateSetting('vibrationEnabled', val)}
        />
      </div>
    </div>
  );
};
