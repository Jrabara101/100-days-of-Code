import React from 'react';
import { Monitor, Sun, Eye, Zap } from 'lucide-react';
import { SettingsState, VideoSettings } from '@/types/settings';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { INITIAL_SETTINGS_STATE } from '@/constants/defaultSettings';

export interface VideoTabProps {
  settings: SettingsState;
  onUpdateSetting: <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => void;
}

export const VideoTab: React.FC<VideoTabProps> = ({
  settings,
  onUpdateSetting,
}) => {
  const v = settings.videoSettings;
  const def = INITIAL_SETTINGS_STATE.videoSettings;

  return (
    <div className="flex flex-col gap-6">
      {/* Display Mode & Resolution */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2538]">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Display Output & Resolution
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Display Mode */}
          <div className="p-3.5 rounded-lg bg-[#131722]/80 border border-[#1E2538] flex flex-col justify-between">
            <span className="text-sm font-semibold text-[#F8FAFC]">Display Window Mode</span>
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              {(['fullscreen', 'borderless', 'windowed'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateSetting('displayMode', mode)}
                  className={`px-2 py-1.5 rounded text-xs font-mono font-bold uppercase transition-all ${
                    v.displayMode === mode
                      ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                      : 'bg-[#1C2232] text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution Selector */}
          <div className="p-3.5 rounded-lg bg-[#131722]/80 border border-[#1E2538] flex flex-col justify-between">
            <span className="text-sm font-semibold text-[#F8FAFC]">Render Resolution</span>
            <select
              value={v.resolution}
              onChange={(e) => onUpdateSetting('resolution', e.target.value)}
              className="mt-3 px-3 py-1.5 rounded bg-[#1C2232] border border-[#1E2538] text-xs font-mono font-bold text-cyan-300 outline-none focus:border-[#38BDF8]"
            >
              <option value="3840x2160 (16:9 4K)">3840x2160 (16:9 UHD 4K)</option>
              <option value="2560x1440 (16:9 QHD)">2560x1440 (16:9 QHD 2K)</option>
              <option value="1920x1080 (16:9)">1920x1080 (16:9 FHD)</option>
              <option value="1280x720 (16:9)">1280x720 (16:9 HD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Optics & Framerate */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1E2538]">
          <Eye className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Camera Optics & Refresh Pace
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Slider
            label="Field of View (FOV)"
            description="Expands peripheral vision for heightened tactical awareness."
            value={v.fov}
            min={60}
            max={120}
            step={1}
            suffix="°"
            altered={v.fov !== def.fov}
            onResetDefault={() => onUpdateSetting('fov', def.fov)}
            onChange={(val) => onUpdateSetting('fov', val)}
          />

          <Slider
            label="Luminance Brightness"
            description="Calibrates gamma curve for high dynamic range environments."
            value={v.brightness}
            min={0}
            max={100}
            step={1}
            suffix="%"
            altered={v.brightness !== def.brightness}
            onResetDefault={() => onUpdateSetting('brightness', def.brightness)}
            onChange={(val) => onUpdateSetting('brightness', val)}
          />
        </div>

        {/* Frame Rate Limit Selector */}
        <div className="p-3.5 rounded-lg bg-[#131722]/80 border border-[#1E2538] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <span className="text-sm font-semibold text-[#F8FAFC]">Frame Rate Cap (Max FPS)</span>
            <span className="text-xs text-[#64748B] block mt-0.5">
              Limits GPU thermals and matches monitor refresh rate.
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[30, 60, 120, 144, 240, 0].map((fps) => (
              <button
                key={fps}
                type="button"
                onClick={() => onUpdateSetting('frameRateLimit', fps)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  v.frameRateLimit === fps
                    ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                    : 'bg-[#1C2232] text-slate-400 hover:text-white'
                }`}
              >
                {fps === 0 ? 'UNCAPPED' : `${fps} FPS`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Switch
            label="Vertical Synchronization (V-Sync)"
            description="Locks frame delivery to display scan cycles to eliminate screen tearing."
            checked={v.vSync}
            altered={v.vSync !== def.vSync}
            onResetDefault={() => onUpdateSetting('vSync', def.vSync)}
            onCheckedChange={(val) => onUpdateSetting('vSync', val)}
          />

          <Switch
            label="High-Speed Motion Blur"
            description="Simulates realistic cinematic optical blur during swift camera rotation."
            checked={v.motionBlur}
            altered={v.motionBlur !== def.motionBlur}
            onResetDefault={() => onUpdateSetting('motionBlur', def.motionBlur)}
            onCheckedChange={(val) => onUpdateSetting('motionBlur', val)}
          />
        </div>
      </div>
    </div>
  );
};
