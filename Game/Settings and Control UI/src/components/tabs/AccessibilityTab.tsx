import React from 'react';
import { Accessibility, Eye, Sparkles, SlidersHorizontal, ShieldAlert } from 'lucide-react';
import { SettingsState, AccessibilitySettings, ErgonomicPreset } from '@/types/settings';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { INITIAL_SETTINGS_STATE } from '@/constants/defaultSettings';

export interface AccessibilityTabProps {
  settings: SettingsState;
  onUpdateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  onApplyPreset: (preset: ErgonomicPreset) => void;
}

export const AccessibilityTab: React.FC<AccessibilityTabProps> = ({
  settings,
  onUpdateSetting,
  onApplyPreset,
}) => {
  const acc = settings.accessibilitySettings;
  const def = INITIAL_SETTINGS_STATE.accessibilitySettings;

  return (
    <div className="flex flex-col gap-6">
      {/* Ergonomic Archetypes Showcase */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2538]">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Ergonomic Calibration Archetypes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Preset 1: Single-Handed Left */}
          <div
            onClick={() => onApplyPreset('single-handed-left')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              acc.presetArchetype === 'single-handed-left'
                ? 'bg-[#1C2232] border-[#38BDF8] shadow-glow-cyan'
                : 'bg-[#131722]/80 border-[#1E2538] hover:border-slate-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-[#F8FAFC]">Single-Handed (Left Bias)</span>
                {acc.presetArchetype === 'single-handed-left' && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-[10px] font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Re-allocates all movement, fire, ADS, and interaction binds to the primary left hand (WASD + Q/E/R/F/C/Space/Shift) without needing a mouse.
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 mt-3 block">
              APPLY LEFT CLUSTER PRESET →
            </span>
          </div>

          {/* Preset 2: Single-Handed Right */}
          <div
            onClick={() => onApplyPreset('single-handed-right')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              acc.presetArchetype === 'single-handed-right'
                ? 'bg-[#1C2232] border-[#38BDF8] shadow-glow-cyan'
                : 'bg-[#131722]/80 border-[#1E2538] hover:border-slate-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-[#F8FAFC]">Single-Handed (Right Bias)</span>
                {acc.presetArchetype === 'single-handed-right' && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-[10px] font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Reroutes navigation to Arrow keys and surrounding Right-Shift / Numpad keys for one-handed right side operation.
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 mt-3 block">
              APPLY RIGHT CLUSTER PRESET →
            </span>
          </div>

          {/* Preset 3: Reduced Fatigue */}
          <div
            onClick={() => onApplyPreset('reduced-fatigue')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              acc.presetArchetype === 'reduced-fatigue'
                ? 'bg-[#1C2232] border-[#10B981] shadow-glow-emerald'
                : 'bg-[#131722]/80 border-[#1E2538] hover:border-slate-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-[#F8FAFC]">Reduced Fatigue & Overrides</span>
                {acc.presetArchetype === 'reduced-fatigue' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono text-[10px] font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Automatically activates toggle-over-hold overrides for high-fatigue actions (Sprint, ADS, Crouch) to protect joints from prolonged tension.
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 mt-3 block">
              APPLY FATIGUE MITIGATION →
            </span>
          </div>

          {/* Preset 4: Standard Default */}
          <div
            onClick={() => onApplyPreset('standard')}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              acc.presetArchetype === 'standard'
                ? 'bg-[#1C2232] border-slate-500'
                : 'bg-[#131722]/80 border-[#1E2538] hover:border-slate-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-[#F8FAFC]">Standard Competitive Preset</span>
                {acc.presetArchetype === 'standard' && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-300 font-mono text-[10px] font-bold">
                    DEFAULT
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Standard tournament configuration balanced for low latency and ergonomic distribution across mouse and keyboard.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 mt-3 block">
              RESTORE FACTORY ERGONOMICS →
            </span>
          </div>
        </div>
      </div>

      {/* Visual & Motor Adaptations */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2538]">
          <Eye className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Visual Contrast & Motor Calibration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Switch
            label="High-Contrast UI Focus Markers"
            description="Amplifies sky-cyan perimeter border indicators for all active keyboard and gamepad selections."
            checked={acc.highContrastFocusMarkers}
            altered={acc.highContrastFocusMarkers !== def.highContrastFocusMarkers}
            onResetDefault={() => onUpdateSetting('highContrastFocusMarkers', def.highContrastFocusMarkers)}
            onCheckedChange={(val) => onUpdateSetting('highContrastFocusMarkers', val)}
          />

          <Switch
            label="Camera Shake Reduction"
            description="Dampens violent camera shaking and explosive rumble for motion sensitivity relief."
            checked={acc.cameraShakeReduction}
            altered={acc.cameraShakeReduction !== def.cameraShakeReduction}
            onResetDefault={() => onUpdateSetting('cameraShakeReduction', def.cameraShakeReduction)}
            onCheckedChange={(val) => onUpdateSetting('cameraShakeReduction', val)}
          />

          <Switch
            label="Gamepad Stick-Swap Axes"
            description="Swaps Left and Right thumbstick functions (Left Stick aims, Right Stick moves)."
            checked={acc.stickSwapAxes}
            altered={acc.stickSwapAxes !== def.stickSwapAxes}
            onResetDefault={() => onUpdateSetting('stickSwapAxes', def.stickSwapAxes)}
            onCheckedChange={(val) => onUpdateSetting('stickSwapAxes', val)}
          />

          <Switch
            label="Universal Toggle-Vs-Hold Overrides"
            description="Enforces single-tap latching on any hold-dependent action across game engines."
            checked={acc.toggleVsHoldOverrides}
            altered={acc.toggleVsHoldOverrides !== def.toggleVsHoldOverrides}
            onResetDefault={() => onUpdateSetting('toggleVsHoldOverrides', def.toggleVsHoldOverrides)}
            onCheckedChange={(val) => onUpdateSetting('toggleVsHoldOverrides', val)}
          />
        </div>

        <Slider
          label="Interface Text & Glyph Scale"
          description="Scales HUD text, icons, and calibration metrics for optimal legibility."
          value={acc.uiScale}
          min={80}
          max={120}
          step={5}
          suffix="%"
          altered={acc.uiScale !== def.uiScale}
          onResetDefault={() => onUpdateSetting('uiScale', def.uiScale)}
          onChange={(val) => onUpdateSetting('uiScale', val)}
        />
      </div>
    </div>
  );
};
