import React from 'react';
import { Dialog } from './ui/dialog';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { EngineSettings } from '../engine/useZombieSurvivalEngine';
import { Volume2, Sparkles, Target, Palette, Smartphone } from 'lucide-react';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: EngineSettings;
  onUpdateSettings: (newSettings: Partial<EngineSettings>) => void;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
}

export function SettingsDrawer({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  showTouchControls,
  onToggleTouchControls,
}: SettingsDrawerProps) {
  const crosshairColors = [
    { name: 'Amber Hazard', color: '#F59E0B' },
    { name: 'Bio Emerald', color: '#10B981' },
    { name: 'Laser Crimson', color: '#EF4444' },
    { name: 'Shock Cyan', color: '#06B6D4' },
    { name: 'High-Vis White', color: '#F8FAFC' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="OPERATIONS SETTINGS // CALIBRATION" className="max-w-md">
      <div className="space-y-5">
        {/* Audio Volume Sliders */}
        <div className="space-y-3 bg-[#13191C] p-3 rounded-md border border-[#1E272B]">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
            <Volume2 className="w-4 h-4 text-amber-400" /> ACOUSTIC TELEMETRY
          </div>
          <Slider
            label="Master Volume"
            displayValue={`${Math.round(settings.masterVolume * 100)}%`}
            min={0}
            max={1}
            step={0.05}
            value={settings.masterVolume}
            onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
          />
          <Slider
            label="Sound Effects (SFX)"
            displayValue={`${Math.round(settings.sfxVolume * 100)}%`}
            min={0}
            max={1}
            step={0.05}
            value={settings.sfxVolume}
            onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
          />
        </div>

        {/* Sensory Shake Intensity */}
        <div className="space-y-3 bg-[#13191C] p-3 rounded-md border border-[#1E272B]">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
            <Sparkles className="w-4 h-4 text-cyan-400" /> SENSORY FEEDBACK
          </div>
          <Slider
            label="Camera Recoil & Screen-Shake"
            displayValue={`${Math.round(settings.screenShake * 100)}%`}
            min={0}
            max={1}
            step={0.1}
            value={settings.screenShake}
            onChange={(e) => onUpdateSettings({ screenShake: parseFloat(e.target.value) })}
          />
        </div>

        {/* Aim & Target Controls */}
        <div className="space-y-3 bg-[#13191C] p-3 rounded-md border border-[#1E272B]">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
            <Target className="w-4 h-4 text-emerald-400" /> TARGETING ASSIST
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300">Auto-Aim Snap Assist</span>
            <Button
              variant={settings.autoAim ? 'bio' : 'outline'}
              size="sm"
              onClick={() => onUpdateSettings({ autoAim: !settings.autoAim })}
              className="text-xs h-7"
            >
              {settings.autoAim ? 'ENABLED' : 'DISABLED'}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Virtual Touch Joysticks
            </span>
            <Button
              variant={showTouchControls ? 'hazard' : 'outline'}
              size="sm"
              onClick={onToggleTouchControls}
              className="text-xs h-7"
            >
              {showTouchControls ? 'VISIBLE' : 'HIDDEN'}
            </Button>
          </div>
        </div>

        {/* Tactical Crosshair Palette */}
        <div className="space-y-3 bg-[#13191C] p-3 rounded-md border border-[#1E272B]">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
            <Palette className="w-4 h-4 text-purple-400" /> CROSSHAIR RETICLE COLOR
          </div>
          <div className="flex items-center gap-2">
            {crosshairColors.map((c) => (
              <button
                key={c.color}
                onClick={() => onUpdateSettings({ crosshairColor: c.color })}
                title={c.name}
                className={`w-7 h-7 rounded-sm border-2 transition-all ${
                  settings.crosshairColor === c.color
                    ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <Button variant="default" className="w-full" onClick={() => onOpenChange(false)}>
            APPLY & RETURN TO COMBAT
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
