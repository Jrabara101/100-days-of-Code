import React from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Wind,
  Sun,
  Activity,
  Gauge,
  Sunrise,
  Sunset,
  Eye,
  Droplet,
  Compass,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const TelemetryGaugesHUD: React.FC = () => {
  const weather = useWeatherStore((state) => state.weather);
  const particleConfig = useWeatherStore((state) => state.particleConfig);

  if (!weather) return null;

  // Degrees to Cardinal Direction helper
  const getCardinal = (deg: number) => {
    const val = Math.floor((deg / 22.5) + 0.5);
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return arr[val % 16];
  };

  // Beaufort scale helper
  const getBeaufort = (kmh: number) => {
    if (kmh < 2) return 'Calm';
    if (kmh < 12) return 'Light Breeze';
    if (kmh < 20) return 'Gentle Breeze';
    if (kmh < 29) return 'Moderate Breeze';
    if (kmh < 39) return 'Fresh Breeze';
    if (kmh < 50) return 'Strong Breeze';
    if (kmh < 62) return 'High Wind';
    return 'Gale Force';
  };

  // UV risk category
  const getUvLevel = (uv: number) => {
    if (uv <= 2) return { text: 'Low', color: 'text-emerald-400', badge: 'emerald' as const };
    if (uv <= 5) return { text: 'Moderate', color: 'text-yellow-400', badge: 'warning' as const };
    if (uv <= 7) return { text: 'High', color: 'text-amber-400', badge: 'warning' as const };
    if (uv <= 10) return { text: 'Very High', color: 'text-rose-400', badge: 'default' as const };
    return { text: 'Extreme', color: 'text-purple-400', badge: 'accent' as const };
  };

  const uvLevel = getUvLevel(weather.uvIndex);

  // AQI color and advice
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return { color: 'text-emerald-400', bg: 'bg-emerald-500', bar: 'from-emerald-400 to-green-500' };
    if (aqi <= 100) return { color: 'text-yellow-400', bg: 'bg-yellow-500', bar: 'from-yellow-400 to-amber-500' };
    if (aqi <= 150) return { color: 'text-orange-400', bg: 'bg-orange-500', bar: 'from-orange-400 to-amber-600' };
    return { color: 'text-rose-400', bg: 'bg-rose-500', bar: 'from-rose-500 to-red-600' };
  };

  const aqiTheme = getAqiColor(weather.aqi);

  // Dew point approximation
  const dewPointC = Math.round(weather.tempC - (100 - weather.humidityPct) / 5);

  return (
    <div className="relative z-10 w-full mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. AERODYNAMIC WIND COMPASS HUD */}
        <Card className="glass-panel-hover">
          <CardHeader>
            <CardTitle>
              <Wind className="h-4 w-4 text-cyan-400" />
              <span>Wind Aerodynamics & Vector</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {/* Rotating Compass Dial */}
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 shadow-inner">
                {/* Compass Cardinal Labels */}
                <span className="absolute top-1 text-[9px] font-mono font-bold text-cyan-400">N</span>
                <span className="absolute right-1 text-[9px] font-mono text-slate-400">E</span>
                <span className="absolute bottom-1 text-[9px] font-mono text-slate-400">S</span>
                <span className="absolute left-1 text-[9px] font-mono text-slate-400">W</span>

                {/* Rotating Vector Arrow */}
                <div
                  className="absolute h-full w-full flex items-center justify-center transition-transform duration-700 ease-out"
                  style={{ transform: `rotate(${weather.windDirectionDeg}deg)` }}
                >
                  <div className="h-10 w-0.5 bg-gradient-to-t from-transparent via-cyan-400 to-cyan-300 shadow-[0_0_10px_#38bdf8]" />
                  <div className="absolute top-2 h-2.5 w-2.5 -translate-x-[4px] rotate-45 border-t-2 border-l-2 border-cyan-300" />
                </div>

                {/* Center Bearing Hub */}
                <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-white/20 text-[10px] font-mono font-bold text-white shadow">
                  {getCardinal(weather.windDirectionDeg)}
                </div>
              </div>

              {/* Telemetry Readouts */}
              <div className="flex flex-col gap-2 grow">
                <div>
                  <div className="text-3xl font-display font-extrabold text-white">
                    {weather.windSpeedKmh} <span className="text-xs font-mono text-slate-400 font-normal">km/h</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Heading: {weather.windDirectionDeg}° • {getCardinal(weather.windDirectionDeg)}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Peak Gusts:</span>
                  <span className="text-cyan-300 font-bold">{weather.windGustsKmh} km/h</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Beaufort:</span>
                  <span className="text-slate-300">{getBeaufort(weather.windSpeedKmh)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. UV RADIATION INDEX HUD */}
        <Card className="glass-panel-hover">
          <CardHeader>
            <CardTitle>
              <Sun className="h-4 w-4 text-amber-400" />
              <span>UV Radiation Exposure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-4xl font-display font-black text-white">
                {weather.uvIndex}
                <span className="text-sm font-mono text-slate-400 font-normal ml-2">/ 12</span>
              </div>
              <Badge variant={uvLevel.badge} className="font-mono text-xs">
                {uvLevel.text}
              </Badge>
            </div>

            <Progress
              value={weather.uvIndex}
              max={12}
              indicatorClassName="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
              className="h-2.5 mb-4"
            />

            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-xs text-slate-300 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-200">
                  {weather.uvIndex <= 2
                    ? 'Minimal sun protection needed.'
                    : weather.uvIndex <= 5
                    ? 'Wear SPF 30+ sunglasses during mid-day.'
                    : 'High UV risk. Seek shade between 11 AM - 3 PM.'}
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-1">Solar Peak: ~12:30 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. AIR QUALITY INDEX (AQI) HUD */}
        <Card className="glass-panel-hover">
          <CardHeader>
            <CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Air Quality Telemetry</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-4xl font-display font-black text-white">
                {weather.aqi}
                <span className="text-xs font-mono text-slate-400 font-normal ml-2">US AQI</span>
              </div>
              <Badge
                className={`font-mono text-xs ${
                  weather.aqi <= 50 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {weather.aqiCategory}
              </Badge>
            </div>

            <Progress
              value={weather.aqi}
              max={250}
              indicatorClassName={`bg-gradient-to-r ${aqiTheme.bar}`}
              className="h-2.5 mb-4"
            />

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase">PM 2.5 Fine</span>
                <span className="text-sm font-bold text-slate-200">{weather.pm25} µg/m³</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase">PM 10 Particulate</span>
                <span className="text-sm font-bold text-slate-200">{weather.pm10} µg/m³</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. ATMOSPHERIC PRESSURE & HUMIDITY */}
        <Card className="glass-panel-hover">
          <CardHeader>
            <CardTitle>
              <Gauge className="h-4 w-4 text-cyan-400" />
              <span>Pressure & Saturation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Surface Pressure</span>
                <span className="text-2xl font-display font-bold text-white">
                  {weather.pressureHpa} <span className="text-xs font-mono text-slate-400">hPa</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 block mt-0.5">
                  {weather.pressureHpa > 1013 ? 'High Density (Stable)' : 'Low Density (Front)'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Relative Humidity</span>
                <span className="text-2xl font-display font-bold text-white">
                  {weather.humidityPct}%
                </span>
                <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                  Dew Point: {dewPointC}°
                </span>
              </div>
            </div>

            <Progress
              value={weather.humidityPct}
              max={100}
              indicatorClassName="bg-gradient-to-r from-sky-500 to-blue-600"
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* 5. SOLAR EPHEMERIS & DAYLIGHT ORBIT */}
        <Card className="glass-panel-hover">
          <CardHeader>
            <CardTitle>
              <Sunrise className="h-4 w-4 text-amber-400" />
              <span>Solar Orbit & Ephemeris</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-white/10 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Sunrise className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Sunrise</span>
                  <span className="text-sm font-display font-bold text-white">{weather.sunrise}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Sunset className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Sunset</span>
                  <span className="text-sm font-display font-bold text-white">{weather.sunset}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span>Day Cycle State:</span>
              <span className={weather.isDay ? 'text-amber-300 font-bold' : 'text-indigo-300 font-bold'}>
                {weather.isDay ? 'SOLAR DAYLIGHT' : 'NOCTURNAL CYCLE'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 6. OPTICAL VISIBILITY & CLOUD FRACTION */}
        <Card className="glass-panel-hover">
          <CardHeader>
            <CardTitle>
              <Eye className="h-4 w-4 text-blue-400" />
              <span>Atmospheric Optics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Optical Sightline</span>
                <span className="text-2xl font-display font-bold text-white">
                  {weather.visibilityKm} <span className="text-xs font-mono text-slate-400">km</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-300 block mt-0.5">
                  {weather.visibilityKm >= 10 ? 'Unrestricted Clarity' : 'Obscured Vision'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Cloud Fraction</span>
                <span className="text-2xl font-display font-bold text-white">
                  {Math.round(particleConfig.cloudCover * 100)}%
                </span>
                <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                  Fog: {Math.round(particleConfig.fogDensity * 100)}%
                </span>
              </div>
            </div>

            <Progress
              value={particleConfig.cloudCover * 100}
              max={100}
              indicatorClassName="bg-gradient-to-r from-slate-400 to-indigo-400"
              className="h-2"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
