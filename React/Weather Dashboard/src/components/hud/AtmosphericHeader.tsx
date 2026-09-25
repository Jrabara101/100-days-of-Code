import React from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { Badge } from '../ui/badge';
import { Search, Activity, Cpu, Compass, RefreshCw, Zap } from 'lucide-react';

interface AtmosphericHeaderProps {
  fps: number;
  particleCount: number;
  onOpenSearch: () => void;
  onOpenDiagnostics: () => void;
}

export const AtmosphericHeader: React.FC<AtmosphericHeaderProps> = ({
  fps,
  particleCount,
  onOpenSearch,
  onOpenDiagnostics,
}) => {
  const unit = useWeatherStore((state) => state.unit);
  const setUnit = useWeatherStore((state) => state.setUnit);
  const isLoading = useWeatherStore((state) => state.isLoading);
  const isCacheHit = useWeatherStore((state) => state.isCacheHit);
  const latency = useWeatherStore((state) => state.lastFetchLatencyMs);
  const currentCity = useWeatherStore((state) => state.currentCity);
  const lat = useWeatherStore((state) => state.lat);
  const lon = useWeatherStore((state) => state.lon);
  const fetchWeather = useWeatherStore((state) => state.fetchWeatherForCity);

  const isMac = typeof window !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

  return (
    <header className="relative z-10 w-full pt-4 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel rounded-2xl p-4 md:px-6">
        {/* Brand & Mission Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent border border-cyan-500/40 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
            <Compass className="h-5 w-5 text-cyan-400 animate-spin" style={{ animationDuration: '24s' }} />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-base md:text-lg tracking-wider text-white">
                ATMOSPHERE<span className="text-cyan-400 font-light ml-1">ENGINE</span>
              </span>
              <Badge variant="glow" className="hidden sm:inline-flex text-[10px] py-0 px-2 uppercase font-mono">
                v2.4 Telemetry
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-cyan-400/90 font-medium">GPS:</span>
              <span>{Math.abs(lat).toFixed(2)}°{lat >= 0 ? 'N' : 'S'}</span>
              <span>•</span>
              <span>{Math.abs(lon).toFixed(2)}°{lon >= 0 ? 'E' : 'W'}</span>
            </div>
          </div>
        </div>

        {/* Center Live Simulation Telemetry Status */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
            <div className={`h-2 w-2 rounded-full ${fps >= 55 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-slate-300 font-bold">{fps} FPS</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400">{particleCount} PARTICLES</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
            <Zap className={`h-3 w-3 ${isCacheHit ? 'text-emerald-400' : 'text-blue-400'}`} />
            <span className="text-slate-400">{isCacheHit ? 'CACHE' : 'NET'}</span>
            <span className={isCacheHit ? 'text-emerald-300 font-bold' : 'text-blue-300 font-bold'}>
              {latency}ms
            </span>
          </div>
        </div>

        {/* Controls & Search Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Bar Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-white/15 hover:border-cyan-500/40 text-xs text-slate-300 transition-all shadow-inner group cursor-pointer"
          >
            <Search className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-medium">Search coordinates...</span>
            <span className="inline sm:hidden font-medium">Search</span>
            <kbd className="hidden sm:inline-flex items-center rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>

          {/* Unit Toggle °C / °F */}
          <div className="flex items-center rounded-xl bg-slate-950/80 p-0.5 border border-white/10 text-xs font-mono">
            <button
              onClick={() => setUnit('C')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                unit === 'C'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                unit === 'F'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              °F
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => fetchWeather(currentCity, lat, lon)}
            disabled={isLoading}
            title="Force Telemetry Sync"
            className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Diagnostics Modal Button */}
          <button
            onClick={onOpenDiagnostics}
            title="Telemetry Engine Diagnostics"
            className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-white/10 hover:border-cyan-500/30 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
          >
            <Cpu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
