import React from 'react';
import { useWeatherStore } from '../../store/useWeatherStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Slider } from '../ui/slider';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Clock, Play, RotateCcw, CloudRain, Sun, Cloud, CloudLightning, CloudSnow } from 'lucide-react';

export const HourlyScrubberHUD: React.FC = () => {
  const weather = useWeatherStore((state) => state.weather);
  const unit = useWeatherStore((state) => state.unit);
  const scrubbedIndex = useWeatherStore((state) => state.scrubbedHourIndex);
  const setScrubbedHour = useWeatherStore((state) => state.setScrubbedHour);

  if (!weather || !weather.hourly.length) return null;

  const maxIndex = weather.hourly.length - 1;
  const currentIndex = scrubbedIndex !== null ? scrubbedIndex : 0;

  const getConditionMiniIcon = (code: number) => {
    if (code >= 95) return <CloudLightning className="h-4 w-4 text-purple-400" />;
    if (code >= 70 && code <= 77) return <CloudSnow className="h-4 w-4 text-sky-200" />;
    if (code >= 50 && code <= 67) return <CloudRain className="h-4 w-4 text-cyan-400" />;
    if (code <= 1) return <Sun className="h-4 w-4 text-amber-400" />;
    return <Cloud className="h-4 w-4 text-slate-300" />;
  };

  return (
    <Card className="relative z-10 w-full mt-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle>
          <Clock className="h-4 w-4 text-cyan-400" />
          <span>Kinetic Hourly Forecast & Atmospheric Scrubber</span>
        </CardTitle>

        <div className="flex items-center gap-2">
          {scrubbedIndex !== null ? (
            <button
              onClick={() => setScrubbedHour(null)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Return to Real-Time</span>
            </button>
          ) : (
            <Badge variant="glow" className="font-mono text-[10px]">
              LIVE REAL-TIME FEED
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Scrubber Slider with Target Telemetry Feedback */}
        <div className="mb-5 bg-slate-950/70 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="font-bold">SCRUB TARGET:</span>
              <span className="text-cyan-300">
                {weather.hourly[currentIndex]?.time || 'Now'}
              </span>
            </span>

            <span className="text-slate-400">
              {currentIndex === 0 && scrubbedIndex === null ? 'Active Atmospheric State' : `Offset: +${currentIndex} Hours`}
            </span>
          </div>

          <Slider
            min={0}
            max={maxIndex}
            step={1}
            value={currentIndex}
            onChange={(val) => setScrubbedHour(val === 0 ? null : val)}
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>{weather.hourly[0]?.time} (Now)</span>
            <span>Drag slider to scrub simulation parameters in real-time</span>
            <span>{weather.hourly[maxIndex]?.time}</span>
          </div>
        </div>

        {/* Scrubbable Cards Horizontal Scroll Area */}
        <ScrollArea orientation="horizontal" className="w-full pb-2">
          <div className="flex gap-3">
            {weather.hourly.map((hour, idx) => {
              const isSelected = (scrubbedIndex === null && idx === 0) || scrubbedIndex === idx;
              const tempVal = unit === 'F' ? Math.round((hour.tempC * 9) / 5 + 32) : hour.tempC;

              return (
                <div
                  key={`${hour.time}-${idx}`}
                  onClick={() => setScrubbedHour(idx === 0 ? null : idx)}
                  className={`flex flex-col items-center justify-between min-w-[96px] p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border select-none ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-500/25 to-slate-900/90 border-cyan-400/60 shadow-[0_0_20px_rgba(56,189,248,0.3)] scale-[1.03]'
                      : 'bg-slate-950/60 border-white/5 hover:border-white/20 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="text-xs font-mono text-slate-400 mb-1">
                    {idx === 0 ? 'Now' : hour.time}
                  </span>

                  <div className="my-1.5 p-2 rounded-xl bg-white/5">
                    {getConditionMiniIcon(hour.conditionCode)}
                  </div>

                  <span className="font-display font-bold text-lg text-white">
                    {tempVal}°
                  </span>

                  <div className="w-full mt-2 pt-2 border-t border-white/10 flex flex-col items-center">
                    <span className="text-[10px] font-mono text-cyan-400">
                      {hour.precipProb}% Rain
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {hour.windSpeedKmh} km/h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
