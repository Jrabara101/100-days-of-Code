import React from 'react';
import { Volume2, Music, Mic, Bell, Headphones, Play } from 'lucide-react';
import { SettingsState, AudioSettings } from '@/types/settings';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { soundEngine } from '@/services/audioService';
import { INITIAL_SETTINGS_STATE } from '@/constants/defaultSettings';

export interface AudioTabProps {
  settings: SettingsState;
  onUpdateSetting: <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => void;
}

export const AudioTab: React.FC<AudioTabProps> = ({
  settings,
  onUpdateSetting,
}) => {
  const a = settings.audioSettings;
  const def = INITIAL_SETTINGS_STATE.audioSettings;

  const testSfx = () => {
    soundEngine.playFire();
  };

  const testUiSound = () => {
    soundEngine.playSaveSuccess();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sound Output Configuration */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2538]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
              Acoustic Mix & Output Profile
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={testSfx} className="text-xs font-mono gap-1">
              <Play className="w-3 h-3 text-cyan-400" />
              Test SFX
            </Button>
            <Button size="sm" variant="secondary" onClick={testUiSound} className="text-xs font-mono gap-1">
              <Play className="w-3 h-3 text-emerald-400" />
              Test UI Chime
            </Button>
          </div>
        </div>

        {/* Master Volume */}
        <Slider
          label="Master Volume Level"
          description="Main gain stage governing all tactical audio output channels."
          value={a.masterVolume}
          min={0}
          max={100}
          step={1}
          suffix="%"
          altered={a.masterVolume !== def.masterVolume}
          onResetDefault={() => onUpdateSetting('masterVolume', def.masterVolume)}
          onChange={(val) => {
            onUpdateSetting('masterVolume', val);
            soundEngine.setVolume(val);
          }}
        />

        {/* Channel Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Slider
            label="Sound Effects (SFX)"
            description="Gunshots, footsteps, atmospheric environmental explosions."
            value={a.sfxVolume}
            min={0}
            max={100}
            suffix="%"
            altered={a.sfxVolume !== def.sfxVolume}
            onResetDefault={() => onUpdateSetting('sfxVolume', def.sfxVolume)}
            onChange={(val) => onUpdateSetting('sfxVolume', val)}
          />

          <Slider
            label="Musical Score & Soundtrack"
            description="Orchestral and synth combat cues."
            value={a.musicVolume}
            min={0}
            max={100}
            suffix="%"
            altered={a.musicVolume !== def.musicVolume}
            onResetDefault={() => onUpdateSetting('musicVolume', def.musicVolume)}
            onChange={(val) => onUpdateSetting('musicVolume', val)}
          />

          <Slider
            label="Voice & Squad Radio Comm"
            description="Teammate voice channels and mission commander radio pings."
            value={a.voiceVolume}
            min={0}
            max={100}
            suffix="%"
            altered={a.voiceVolume !== def.voiceVolume}
            onResetDefault={() => onUpdateSetting('voiceVolume', def.voiceVolume)}
            onChange={(val) => onUpdateSetting('voiceVolume', val)}
          />

          <Slider
            label="UI System Ticks & Indicators"
            description="Interactive switches, calibration tones, and warning buzzers."
            value={a.uiVolume}
            min={0}
            max={100}
            suffix="%"
            altered={a.uiVolume !== def.uiVolume}
            onResetDefault={() => onUpdateSetting('uiVolume', def.uiVolume)}
            onChange={(val) => onUpdateSetting('uiVolume', val)}
          />
        </div>
      </div>

      {/* Output Hardware Modes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2538]">
          <Headphones className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Audio Spatializer & Background Policy
          </h3>
        </div>

        <div className="p-3.5 rounded-lg bg-[#131722]/80 border border-[#1E2538] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <span className="text-sm font-semibold text-[#F8FAFC]">Spatial Audio Profile</span>
            <span className="text-xs text-[#64748B] block mt-0.5">
              Optimizes directional HRTF panning for your physical audio gear.
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
            {(['stereo', 'headphones', 'surround'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdateSetting('audioOutput', mode)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                  a.audioOutput === mode
                    ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                    : 'bg-[#1C2232] text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <Switch
          label="Mute Audio When Game Window Unfocused"
          description="Silences all audio channels automatically when switching apps or Alt-Tabbing."
          checked={a.muteWhenUnfocused}
          altered={a.muteWhenUnfocused !== def.muteWhenUnfocused}
          onResetDefault={() => onUpdateSetting('muteWhenUnfocused', def.muteWhenUnfocused)}
          onCheckedChange={(val) => onUpdateSetting('muteWhenUnfocused', val)}
        />
      </div>
    </div>
  );
};
