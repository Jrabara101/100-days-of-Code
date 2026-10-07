import React from 'react';
import { Sheet, SheetHeader, SheetTitle, SheetDescription } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { SpaceShooterState } from '../../types/game';
import { soundEngine } from '../../engine/AudioEngine';
import { Settings, Volume2, Vibrate, Crosshair, Play, RotateCcw } from 'lucide-react';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SpaceShooterState['settings'];
  onUpdateSettings: (newSettings: Partial<SpaceShooterState['settings']>) => void;
  onResume: () => void;
  onRestart: () => void;
  isPaused: boolean;
}

export function SettingsSheet({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  onResume,
  onRestart,
  isPaused,
}: SettingsSheetProps) {
  const handleMasterVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ masterVolume: val });
    soundEngine.setMasterVolume(val);
  };

  const handleSfxVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ soundFxVolume: val });
    soundEngine.setSfxVolume(val);
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onUpdateSettings({ sensitivity: val });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>
          <Settings className="w-5 h-5 text-primary" />
          TACTICAL AVIONICS // SETTINGS
        </SheetTitle>
        <SheetDescription>
          {isPaused ? 'TACTICAL PAUSE ENGAGED. Adjust audio and flight controls.' : 'Configure avionics telemetry & accessibility.'}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 py-2">
        {/* Audio Configuration */}
        <div className="flex flex-col gap-4 p-4 rounded-lg bg-surface-container/70 border border-outline-variant/40">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-primary uppercase">
            <Volume2 className="w-4 h-4" />
            <span>ACOUSTIC & SYNTH TELEMETRY</span>
          </div>

          <Slider
            label="MASTER SYNTH GAIN"
            min={0}
            max={1}
            step={0.05}
            value={settings.masterVolume}
            valueDisplay={`${Math.round(settings.masterVolume * 100)}%`}
            onChange={handleMasterVolChange}
          />

          <Slider
            label="SFX DISCHARGE VOLUME"
            min={0}
            max={1}
            step={0.05}
            value={settings.soundFxVolume}
            valueDisplay={`${Math.round(settings.soundFxVolume * 100)}%`}
            onChange={handleSfxVolChange}
          />
        </div>

        {/* Flight & Kinetic Response */}
        <div className="flex flex-col gap-4 p-4 rounded-lg bg-surface-container/70 border border-outline-variant/40">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-secondary uppercase">
            <Vibrate className="w-4 h-4" />
            <span>KINETIC & HAPTICS</span>
          </div>

          <div className="flex items-center justify-between font-mono text-xs text-on-surface">
            <div className="flex flex-col">
              <span className="font-semibold">SCREEN SHAKE DAMPING</span>
              <span className="text-[10px] text-on-surface-variant">Camera recoil on hull impact & EMP</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ screenShake: !settings.screenShake })}
              className={`px-3 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                settings.screenShake
                  ? 'bg-secondary/20 text-secondary border-secondary/50'
                  : 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'
              }`}
            >
              {settings.screenShake ? 'ENABLED (100%)' : 'DISABLED'}
            </button>
          </div>

          <Slider
            label="TWIN-STICK / POINTER SENSITIVITY"
            min={0.5}
            max={2.0}
            step={0.1}
            value={settings.sensitivity}
            valueDisplay={`${settings.sensitivity.toFixed(1)}x`}
            onChange={handleSensitivityChange}
          />
        </div>

        {/* Accessibility Toggles */}
        <div className="flex flex-col gap-4 p-4 rounded-lg bg-surface-container/70 border border-outline-variant/40">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-300 uppercase">
            <Crosshair className="w-4 h-4" />
            <span>COMBAT ACCESSIBILITY</span>
          </div>

          <div className="flex items-center justify-between font-mono text-xs text-on-surface">
            <div className="flex flex-col">
              <span className="font-semibold">AUTO-FIRE FIREWALL</span>
              <span className="text-[10px] text-on-surface-variant">Continuous weapon discharge without holding click</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoFire: !settings.autoFire })}
              className={`px-3 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                settings.autoFire
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'
              }`}
            >
              {settings.autoFire ? 'ENGAGED' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2.5 mt-2">
          {isPaused && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                onResume();
                onOpenChange(false);
              }}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              RESUME COMBAT ENGAGEMENT
            </Button>
          )}

          <Button
            variant="destructive"
            onClick={() => {
              onRestart();
              onOpenChange(false);
            }}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            RESTART SECTOR RUN
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
