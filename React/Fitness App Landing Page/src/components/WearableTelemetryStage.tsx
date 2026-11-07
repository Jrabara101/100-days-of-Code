import React, { useState } from 'react';
import {
  Watch,
  Activity,
  Heart,
  ShieldCheck,
  Tv,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { WEARABLES } from '../data/mockData';
import { WearableDevice } from '../types';

export const WearableTelemetryStage: React.FC = () => {
  const [activeDevice, setActiveDevice] = useState<WearableDevice>(WEARABLES[0]);

  return (
    <section className="py-20 md:py-28 border-t border-white/10 relative" id="wearables">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318] border border-sky-500/30 text-sky-400 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <Activity className="w-3.5 h-3.5" />
            Zero Proprietary Hardware Lock-In
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Universal Wearable Telemetry Engine
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-2">
            Bring the device already on your wrist. Our real-time Bluetooth Low Energy (BLE)
            bridge auto-scales workout strain to your recovery status.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {WEARABLES.map((device) => (
            <button
              key={device.id}
              onClick={() => setActiveDevice(device)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                activeDevice.id === device.id
                  ? 'bg-[#D4FF00] text-[#08090C] shadow-lg shadow-[#D4FF00]/20'
                  : 'bg-[#111318] text-zinc-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {device.id === 'apple_tv' ? (
                <Tv className="w-3.5 h-3.5" />
              ) : (
                <Watch className="w-3.5 h-3.5" />
              )}
              {device.name.split('&')[0]}
            </button>
          ))}
        </div>

        {/* Interactive Showcase Card */}
        <div className="rounded-3xl bg-[#111318] border border-white/15 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
          {/* Left Details (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-xs font-bold uppercase">
                {activeDevice.tag}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Direct BLE Protocol 5.3
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              {activeDevice.name}
            </h3>

            <p className="text-base text-zinc-300 font-medium leading-relaxed">
              {activeDevice.headline}
            </p>

            <p className="text-sm text-zinc-400 leading-relaxed">
              {activeDevice.description}
            </p>

            {/* Metrics Triplets */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
              {activeDevice.metrics.map((m, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex flex-col"
                >
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {m.label}
                  </span>
                  <span className="font-mono text-lg font-bold text-[#D4FF00] mt-0.5 tabular-nums">
                    {m.value}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 mt-1">
                    {m.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Simulated HUD Graphic (5 cols) */}
          <div className="lg:col-span-5 relative p-6 rounded-3xl bg-black/80 border border-white/15 flex flex-col gap-5 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono text-white font-bold uppercase">
                  Telemetry Channel Connected
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#D4FF00]">240 FPS TICK</span>
            </div>

            {/* Visual Dial Simulation */}
            <div className="p-4 rounded-2xl bg-[#0E1015] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-heart-pulse" />
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block">
                    CARDIOVASCULAR LOAD
                  </span>
                  <span className="text-xl font-mono font-black text-white">
                    Zone 4: 88% Max HR
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                Optimal
              </span>
            </div>

            {/* Dynamic Telemetry Graph Bars */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>Anaerobic Threshold</span>
                <span className="text-white">164 / 185 BPM</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-[#D4FF00] to-rose-500 w-[82%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>Day Strain Target</span>
                <span className="text-white">14.8 / 18.0 Strain</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-emerald-400 w-[78%]" />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auto-sync enabled
              </span>
              <span className="text-sky-400">Apple HealthKit 2-Way</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
