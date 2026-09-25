import React from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { Badge } from '../ui/badge';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Sun,
  CloudFog,
  Wind,
  Droplets,
  Bookmark,
  BookmarkCheck,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PRESET_CITIES } from '../../services/weatherApi';

export const HeroWeatherHUD: React.FC = () => {
  const weather = useWeatherStore((state) => state.weather);
  const unit = useWeatherStore((state) => state.unit);
  const currentCity = useWeatherStore((state) => state.currentCity);
  const currentCountry = useWeatherStore((state) => state.currentCountry);
  const scrubbedIndex = useWeatherStore((state) => state.scrubbedHourIndex);
  const savedCities = useWeatherStore((state) => state.savedCities);
  const toggleSavedCity = useWeatherStore((state) => state.toggleSavedCity);
  const isCitySaved = useWeatherStore((state) => state.isCitySaved(currentCity));
  const fetchWeather = useWeatherStore((state) => state.fetchWeatherForCity);
  const particleConfig = useWeatherStore((state) => state.particleConfig);

  if (!weather) return null;

  // If scrubbed, show scrubbed hour's values
  const isScrubbed = scrubbedIndex !== null && weather.hourly[scrubbedIndex];
  const activeHourly = isScrubbed ? weather.hourly[scrubbedIndex] : null;

  const rawTempC = activeHourly ? activeHourly.tempC : weather.tempC;
  const tempDisplay = unit === 'F' ? Math.round((rawTempC * 9) / 5 + 32) : Math.round(rawTempC);

  const rawFeelsC = weather.feelsLikeC;
  const feelsDisplay = unit === 'F' ? Math.round((rawFeelsC * 9) / 5 + 32) : Math.round(rawFeelsC);

  const maxDisplay = unit === 'F' ? Math.round((weather.tempMaxC * 9) / 5 + 32) : weather.tempMaxC;
  const minDisplay = unit === 'F' ? Math.round((weather.tempMinC * 9) / 5 + 32) : weather.tempMinC;

  // Condition icon selector
  const conditionCode = activeHourly ? activeHourly.conditionCode : weather.conditionCode;
  const isRain =
    (conditionCode >= 50 && conditionCode <= 67) ||
    (conditionCode >= 80 && conditionCode <= 82);
  const isSnow =
    (conditionCode >= 70 && conditionCode <= 77) ||
    (conditionCode >= 85 && conditionCode <= 86);
  const isThunder = conditionCode >= 95;
  const isFog = conditionCode === 45 || conditionCode === 48;
  const isClear = conditionCode <= 1;

  const renderWeatherIcon = () => {
    if (isThunder) return <CloudLightning className="h-12 w-12 text-purple-400 animate-pulse" />;
    if (isSnow) return <CloudSnow className="h-12 w-12 text-sky-200 animate-bounce" style={{ animationDuration: '3s' }} />;
    if (isRain) return <CloudRain className="h-12 w-12 text-cyan-400 animate-pulse" />;
    if (isFog) return <CloudFog className="h-12 w-12 text-slate-300" />;
    if (isClear) return <Sun className="h-12 w-12 text-amber-400 animate-spin" style={{ animationDuration: '40s' }} />;
    return <Cloud className="h-12 w-12 text-slate-300" />;
  };

  const getAtmosphericStatePill = () => {
    if (isThunder) return { text: 'Severe Electrical Storm', variant: 'accent' as const };
    if (isSnow) return { text: 'Sub-Zero Cryo Precipitation', variant: 'glow' as const };
    if (isRain) return { text: 'Active Hydro Precipitation', variant: 'default' as const };
    if (isFog) return { text: 'Dense Vapor Obscuration', variant: 'secondary' as const };
    if (isClear) return { text: 'Solar Radiant Optimal', variant: 'warning' as const };
    return { text: 'Stratospheric Cloud Formations', variant: 'secondary' as const };
  };

  const statePill = getAtmosphericStatePill();

  return (
    <div className="relative z-10 w-full mt-4">
      {/* Top Quick Cities Dock for Zero-Latency Switching */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap flex items-center gap-1.5 mr-1">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Zero-Lag Dock:
        </span>
        {savedCities.map((city) => {
          const isActive = currentCity.toLowerCase() === city.name.toLowerCase();
          return (
            <button
              key={`${city.name}-${city.latitude}`}
              onClick={() => fetchWeather(city.name, city.latitude, city.longitude, city.country)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                isActive
                  ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                  : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800 hover:border-white/20'
              }`}
            >
              <MapPin className={`h-3 w-3 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{city.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Hero HUD Panel */}
      <div className="glass-panel glass-panel-hover rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        {/* Scrubbing Alert Banner if Scrubbed */}
        {isScrubbed && (
          <div className="absolute top-0 left-0 right-0 py-1.5 px-4 bg-gradient-to-r from-amber-500/30 via-orange-500/40 to-amber-500/30 border-b border-amber-400/40 flex items-center justify-between text-xs font-mono text-amber-200 animate-fadeIn">
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>SCRUBBED TIMELINE RECONSTRUCTION: {activeHourly.time}</span>
            </span>
            <span className="text-[11px] underline cursor-pointer" onClick={() => useWeatherStore.getState().setScrubbedHour(null)}>
              Reset to Live (Now)
            </span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          {/* Left Column: Location & Temperature */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={statePill.variant} className="font-mono text-xs py-1 px-3">
                {statePill.text}
              </Badge>
              <button
                onClick={() =>
                  toggleSavedCity({
                    id: Math.random(),
                    name: currentCity,
                    country: currentCountry,
                    latitude: weather.lat,
                    longitude: weather.lon,
                  })
                }
                title={isCitySaved ? 'Remove from Saved Cities' : 'Save City to Fast Dock'}
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {isCitySaved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-cyan-400" />
                    <span className="text-cyan-400">PINNED</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    <span>PIN CITY</span>
                  </>
                )}
              </button>
            </div>

            {/* City Title */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight flex items-baseline gap-3">
              {currentCity}
              <span className="text-slate-400 font-light text-xl sm:text-2xl">{currentCountry}</span>
            </h1>

            {/* Hero Temperature */}
            <div className="flex items-baseline gap-4 mt-2">
              <span className="font-display font-black text-7xl sm:text-8xl md:text-9xl text-white tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                {tempDisplay}
                <span className="text-cyan-400 font-light text-4xl sm:text-5xl md:text-6xl align-top ml-1">
                  °{unit}
                </span>
              </span>

              <div className="flex flex-col justify-end pb-4 text-sm font-mono text-slate-300">
                <span className="text-slate-400">Feels Like {feelsDisplay}°{unit}</span>
                <span className="text-emerald-400">High: {maxDisplay}° • Low: {minDisplay}°</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Condition & Wind/Precip Telemetry */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4">
            <div className="flex items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-white/10 shadow-lg">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                {renderWeatherIcon()}
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Atmosphere State</p>
                <p className="text-xl font-display font-bold text-white">
                  {isScrubbed ? `At ${activeHourly.time}: ` : ''}{weather.conditionText}
                </p>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">
                  WMO #{conditionCode} • Barometric: {weather.pressureHpa} hPa
                </p>
              </div>
            </div>

            {/* Micro Vectors HUD */}
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                <Wind className="h-4 w-4 text-cyan-400" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Wind Velocity</span>
                  <span className="text-sm font-mono font-bold text-slate-200">
                    {weather.windSpeedKmh} km/h
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                <Droplets className="h-4 w-4 text-blue-400" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Precipitation</span>
                  <span className="text-sm font-mono font-bold text-slate-200">
                    {weather.precipitationMm} mm
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
