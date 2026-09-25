import * as React from 'react';
import { Palette, Sparkles, Orbit, PlusCircle, MinusCircle, RotateCcw } from 'lucide-react';
import { ArtToySettings, AttractorPoint } from '@/types';
import { CURATED_PALETTES } from '@/lib/algorithms/colorPalettes';
import { Sheet } from './ui/sheet';
import { Slider } from './ui/slider';
import { Button } from './ui/button';

interface ParameterDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: ArtToySettings;
  attractors: AttractorPoint[];
  onSettingsChange: (settings: ArtToySettings) => void;
  onAddAttractor: (isAttractor: boolean) => void;
  onClearAttractors: () => void;
  onResetDefaults: () => void;
}

export function ParameterDrawer({
  open,
  onClose,
  settings,
  attractors,
  onSettingsChange,
  onAddAttractor,
  onClearAttractors,
  onResetDefaults
}: ParameterDrawerProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Generative Physics & Studio Controls"
      position="right"
      className="w-full sm:w-[420px]"
    >
      <div className="space-y-6 pb-6 text-white">
        {/* Curated Color Palettes */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              Harmonic Color Palette
            </span>
            <span className="text-[11px] text-white/50">{settings.colorPaletteName}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CURATED_PALETTES.map((pal) => {
              const isSelected = settings.colorPaletteName === pal.id;
              return (
                <button
                  key={pal.id}
                  onClick={() =>
                    onSettingsChange({
                      ...settings,
                      colorPaletteName: pal.id,
                      colorPalette: pal.colors
                    })
                  }
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400/80 bg-white/10 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-[11px] font-medium text-white mb-1.5 truncate">
                    {pal.name}
                  </div>
                  {/* Color Swatch Strip */}
                  <div className="flex h-3 w-full rounded-md overflow-hidden border border-white/10">
                    {pal.colors.map((c, i) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Mode Selection */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-white/70">Color Dynamics Mode</span>
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
            {(['cycle', 'velocity', 'random', 'monochrome'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onSettingsChange({ ...settings, colorMode: mode })}
                className={`py-1 text-[11px] font-medium capitalize rounded-lg transition-all cursor-pointer ${
                  settings.colorMode === mode
                    ? 'bg-white/20 text-white border border-white/20 shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders: Physics & Dynamics */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Particle Dynamics & Canvas Physics
          </div>

          {/* Trail Decay / Persistence */}
          <Slider
            label="Trail Persistence (Decay)"
            min={0.005}
            max={0.2}
            step={0.005}
            value={settings.trailDecay}
            onChange={(val) => onSettingsChange({ ...settings, trailDecay: val })}
          />

          {/* Base Particle Speed */}
          <Slider
            label="Base Flow Speed"
            min={0.2}
            max={5.0}
            step={0.1}
            unit="x"
            value={settings.baseSpeed}
            onChange={(val) => onSettingsChange({ ...settings, baseSpeed: val })}
          />

          {/* Particle Pool Count */}
          <Slider
            label="Particle Pool Size"
            min={100}
            max={10000}
            step={100}
            value={settings.particleCount}
            onChange={(val) => onSettingsChange({ ...settings, particleCount: val })}
          />

          {/* Stroke Width */}
          <Slider
            label="Stroke Thickness"
            min={0.5}
            max={5.0}
            step={0.25}
            unit="px"
            value={settings.strokeWidth}
            onChange={(val) => onSettingsChange({ ...settings, strokeWidth: val })}
          />

          {/* Algorithm-Specific Sliders */}
          {settings.algorithm === 'kaleidoscope' && (
            <Slider
              label="Symmetry Folds (Radial Axes)"
              min={2}
              max={16}
              step={1}
              value={settings.symmetryFolds}
              onChange={(val) => onSettingsChange({ ...settings, symmetryFolds: Math.round(val) })}
            />
          )}

          {settings.algorithm === 'flow_field' && (
            <Slider
              label="Flow Field Turbulence"
              min={0.2}
              max={4.0}
              step={0.1}
              value={settings.flowTurbulence}
              onChange={(val) => onSettingsChange({ ...settings, flowTurbulence: val })}
            />
          )}
        </div>

        {/* Gravitational Well Controls (if gravity mode or general sandbox) */}
        {settings.algorithm === 'gravity_orbit' && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <Orbit className="w-3.5 h-3.5 text-cyan-400" />
                Gravitational Wells ({attractors.length})
              </span>
              {attractors.length > 0 && (
                <button
                  onClick={onClearAttractors}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear Wells
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => onAddAttractor(true)}
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Attractor</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => onAddAttractor(false)}
              >
                <MinusCircle className="w-3.5 h-3.5 text-pink-500" />
                <span>− Repulsor</span>
              </Button>
            </div>
          </div>
        )}

        {/* Reset Defaults Action */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetDefaults}
            className="text-white/60 hover:text-white gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default State</span>
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
