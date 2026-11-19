import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Globe, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const RegionalRadarCard: React.FC = () => {
  const regions = [
    { name: 'US-East (Virginia)', latency: '32ms', throughput: '14.2k req/s', status: 'optimal', health: 99.99 },
    { name: 'US-West (Oregon)', latency: '48ms', throughput: '8.6k req/s', status: 'optimal', health: 99.98 },
    { name: 'EU-Central (Frankfürt)', latency: '84ms', throughput: '11.4k req/s', status: 'recovering', health: 99.91 },
    { name: 'APAC-East (Tokyo)', latency: '62ms', throughput: '6.9k req/s', status: 'optimal', health: 99.97 },
  ];

  return (
    <div className="rounded-2xl bg-[#11141B] dark:bg-[#11141B] border border-white/[0.07] p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.07] mb-4">
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            Global Edge PoP Operations Radar
          </h3>
        </div>
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          4/4 PoPs Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {regions.map((reg) => (
          <div
            key={reg.name}
            className="p-3 rounded-xl bg-[#171B24] border border-white/5 space-y-2 hover:border-white/15 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">{reg.name}</span>
              {reg.status === 'optimal' ? (
                <CheckCircle2 size={13} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={13} className="text-amber-400" />
              )}
            </div>

            <div className="flex items-baseline justify-between font-mono">
              <div className="text-lg font-bold text-white">{reg.latency}</div>
              <div className="text-[11px] text-slate-400">{reg.throughput}</div>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${reg.health}%` }}
                className={`h-full ${reg.status === 'optimal' ? 'bg-emerald-400' : 'bg-amber-400'}`}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 flex justify-between">
              <span>SLA Health</span>
              <span>{reg.health}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
