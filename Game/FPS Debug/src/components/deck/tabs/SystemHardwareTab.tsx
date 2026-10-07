import React, { useState, useEffect } from 'react';
import type { HardwareProfile, PerformanceSummary } from '../../../types/telemetry';
import { getMemoryStats } from '../../../utils/hardware';
import { Cpu, HardDrive, Monitor, Shield, Layers, RefreshCw } from 'lucide-react';

interface SystemHardwareTabProps {
  hardware: HardwareProfile | null;
  metrics: PerformanceSummary;
}

export const SystemHardwareTab: React.FC<SystemHardwareTabProps> = ({ hardware, metrics }) => {
  const [memory, setMemory] = useState(getMemoryStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setMemory(getMemoryStats());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const heapPct = memory.limitMb && memory.usedMb
    ? Math.min(100, Math.round((memory.usedMb / memory.limitMb) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {/* GPU & Graphics Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
          <span className="text-xs font-mono-avionics text-cyan-400 flex items-center space-x-1.5 font-semibold uppercase">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>GPU Graphics Pipeline &amp; Unmasked Renderer</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 font-mono-avionics">
            {hardware?.webglVersion || 'WebGL 2.0'}
          </span>
        </div>

        <div className="space-y-2 font-mono-avionics text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-[#080C16] border border-slate-800/60">
            <span className="text-slate-400">Unmasked Renderer:</span>
            <span className="text-white font-semibold break-all text-right mt-1 sm:mt-0 text-cyan-200">
              {hardware?.gpuRenderer || 'Querying WebGL debug info...'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400 block text-[10px] uppercase">Vendor String</span>
              <span className="text-slate-200 font-medium text-xs mt-0.5 block">
                {hardware?.gpuVendor || 'Generic Vendor'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400 block text-[10px] uppercase">Max Texture Dimension</span>
              <span className="text-emerald-400 font-medium text-xs mt-0.5 block">
                {hardware?.maxTextureSize ? `${hardware.maxTextureSize} × ${hardware.maxTextureSize} px` : '4096 px'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400 block text-[10px] uppercase">Context Status</span>
              <span className="text-emerald-400 font-medium text-xs mt-0.5 block">
                Active / Hardware Accelerated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CPU & Memory Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* CPU Topology */}
        <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-mono-avionics text-slate-300 flex items-center space-x-1.5 font-semibold">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>CPU Concurrency &amp; Core Topology</span>
            </span>
          </div>

          <div className="space-y-2 font-mono-avionics text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400">Logical Cores:</span>
              <span className="text-emerald-300 font-bold text-sm">
                {hardware?.cores || navigator.hardwareConcurrency || 4} Threads
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400">Device RAM:</span>
              <span className="text-white font-semibold">
                {hardware?.deviceMemoryGb ? `${hardware.deviceMemoryGb} GB Allocated` : 'Browser Masked (~8-16 GB)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400">Worker Support:</span>
              <span className="text-cyan-300 font-semibold">Dedicated Web Workers Enabled</span>
            </div>
          </div>
        </div>

        {/* Display & Viewport */}
        <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-mono-avionics text-slate-300 flex items-center space-x-1.5 font-semibold">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>Display Calibration &amp; DPR</span>
            </span>
          </div>

          <div className="space-y-2 font-mono-avionics text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400">Calibrated Refresh Rate:</span>
              <span className="text-cyan-300 font-bold text-sm">
                {hardware?.screenRefreshRate || 60} Hz VSync
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400">Device Pixel Ratio (DPR):</span>
              <span className="text-white font-semibold">
                {hardware?.dpr || window.devicePixelRatio || 1}x Retina Scaling
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#080C16] border border-slate-800/60">
              <span className="text-slate-400">Viewport Dimensions:</span>
              <span className="text-slate-300">
                {window.innerWidth} × {window.innerHeight} px
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Heap Usage Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0D1322] p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
          <span className="text-xs font-mono-avionics text-slate-300 flex items-center space-x-1.5 font-semibold">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>JavaScript Heap Allocation (performance.memory)</span>
          </span>
          <span className="text-xs font-mono-avionics text-slate-400">
            {memory.usedMb ? `${memory.usedMb} MB / ${memory.limitMb || 'N/A'} MB` : 'Chromium API Only'}
          </span>
        </div>

        {memory.usedMb ? (
          <div>
            <div className="w-full bg-[#080C16] h-3 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  heapPct > 80 ? 'bg-red-500' : heapPct > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.max(4, heapPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono-avionics text-slate-500 mt-1.5">
              <span>Allocated: {memory.totalMb || memory.usedMb} MB</span>
              <span>Heap Ceiling: {memory.limitMb} MB ({heapPct}% Utilized)</span>
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono-avionics text-slate-500 italic p-2 bg-[#080C16] rounded border border-slate-800/60">
            Note: Granular JS heap telemetry is supported on Chromium-based browsers (Chrome, Edge, Opera, Brave). Firefox and Safari restrict heap reads for fingerprint security.
          </div>
        )}
      </div>
    </div>
  );
};
