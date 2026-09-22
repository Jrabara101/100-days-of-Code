import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Sheet } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { THEMES } from '@/game/themes';
import { VisualTheme } from '@/types/game';
import { SlidersHorizontal, Share2, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SettingsSheet: React.FC = () => {
  const {
    isSettingsOpen,
    setSettingsOpen,
    settings,
    updateSettings,
    getShareableSeedUrl,
  } = useGameStore();

  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = async () => {
    const url = getShareableSeedUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Sheet
      open={isSettingsOpen}
      onOpenChange={setSettingsOpen}
      title="TELEMETRY & GRAPHICS"
      icon={<SlidersHorizontal className="w-5 h-5" />}
    >
      {/* Visual Theme Selector */}
      <div>
        <label className="text-xs font-mono text-slate-300 block mb-2.5">
          COLOR PALETTE PRESET
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(THEMES) as VisualTheme[]).map((themeKey) => {
            const theme = THEMES[themeKey];
            const isSelected = settings.visualTheme === themeKey;
            return (
              <button
                key={themeKey}
                onClick={() => updateSettings({ visualTheme: themeKey })}
                className={cn(
                  'p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between text-left',
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-neon-cyan'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span>{theme.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <Slider
        label="SPECTRAL SENSITIVITY"
        valueDisplay={`${settings.sensitivity.toFixed(1)}x`}
        min={0.5}
        max={3.0}
        step={0.1}
        value={settings.sensitivity}
        onChange={(val) => updateSettings({ sensitivity: val })}
        accent="cyan"
        description="Multiplies bass and transient thresholds for rhythm beats and speed gates."
      />

      <Slider
        label="HIGHWAY SPEED (DIFFICULTY)"
        valueDisplay={`${settings.speed.toFixed(1)}x`}
        min={0.6}
        max={2.5}
        step={0.1}
        value={settings.speed}
        onChange={(val) => updateSettings({ speed: val })}
        accent="rose"
        description="Controls forward velocity of the undulating frequency track."
      />

      <Slider
        label="MASTER SYNTH GAIN"
        valueDisplay={`${Math.round(settings.volume * 100)}%`}
        min={0}
        max={1}
        step={0.05}
        value={settings.volume}
        onChange={(val) => updateSettings({ volume: val })}
        accent="emerald"
      />

      <Slider
        label="MOTION BLUR / PERSISTENCE"
        valueDisplay={`${Math.round(settings.motionBlur * 100)}%`}
        min={0.1}
        max={0.95}
        step={0.05}
        value={settings.motionBlur}
        onChange={(val) => updateSettings({ motionBlur: val })}
        accent="amber"
        description="Canvas clear alpha for synth persistence and neon particle trails."
      />

      {/* Camera Shake Switch */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-200">Camera Shake & FOV Kicks</div>
          <div className="text-[11px] text-slate-400">Procedural bass impact cinematics</div>
        </div>
        <Switch
          checked={settings.cameraShake}
          onCheckedChange={(checked) => updateSettings({ cameraShake: checked })}
        />
      </div>

      {/* Zen / Spectator Mode Switch */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ambient "Vibe" Spectator Mode</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Removes hazard collisions for zero-stress listening visualizer.
          </div>
        </div>
        <Switch
          checked={settings.zenMode}
          onCheckedChange={(checked) => updateSettings({ zenMode: checked })}
        />
      </div>

      {/* Seed-Based Track Sharing */}
      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            SEED-BASED TRACK SHARING
          </span>
          <span className="text-[10px] font-mono text-slate-400">URL HASH</span>
        </div>
        <p className="text-[11px] text-slate-300 mb-3">
          Encodes theme, speed, sensitivity, and blur into a lightweight share link.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleCopyShareLink}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">LINK COPIED TO CLIPBOARD!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>COPY TRACK SHARE LINK</span>
            </>
          )}
        </Button>
      </div>

      {/* Sheet Close */}
      <div className="pt-2">
        <Button
          variant="default"
          size="md"
          className="w-full"
          onClick={() => setSettingsOpen(false)}
        >
          APPLY CONFIGURATION
        </Button>
      </div>
    </Sheet>
  );
};
