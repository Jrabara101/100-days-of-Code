import React from 'react';
import { DailySummary, CoreStatMetric } from '../../types/telemetry';
import { X, Table as TableIcon, Download } from 'lucide-react';

interface TableTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
  flightRecorderDays: DailySummary[];
  coreStats: CoreStatMetric[];
}

export const TableTwinModal: React.FC<TableTwinModalProps> = ({
  isOpen,
  onClose,
  flightRecorderDays,
  coreStats
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-twin-title"
    >
      <div 
        className="w-full max-w-4xl max-h-[85vh] rounded-lg bg-[#0d1322] border border-cyan-500/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 uppercase tracking-widest">
                A11Y_AUDIT // CHART TABLE TWIN
              </span>
              <h2 id="table-twin-title" className="font-['Space_Grotesk'] text-lg font-bold text-slate-100">
                Accessible Data Twin
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#1a2233] text-slate-400 hover:text-white transition"
            aria-label="Close table twin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Tables Section */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Table 1: Core Performance Metrics */}
          <div>
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-200 mb-2 uppercase tracking-wider">
              Core Stat Metrics Table
            </h3>
            <div className="overflow-x-auto rounded border border-[#1f293d] bg-[#090d16]">
              <table className="w-full text-left text-xs font-['JetBrains_Mono']">
                <caption className="sr-only">Core Combat Performance Metrics Overview</caption>
                <thead className="bg-[#111827] text-slate-400 border-b border-[#1f293d] text-[11px] uppercase">
                  <tr>
                    <th scope="col" className="p-2.5">Metric Name</th>
                    <th scope="col" className="p-2.5">Current Value</th>
                    <th scope="col" className="p-2.5">Delta vs Last Period</th>
                    <th scope="col" className="p-2.5">Sessions Sampled</th>
                    <th scope="col" className="p-2.5">Calculation Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]">
                  {coreStats.map((stat) => (
                    <tr key={stat.id} className="hover:bg-[#141c30]">
                      <th scope="row" className="p-2.5 text-slate-200 font-semibold">{stat.name}</th>
                      <td className="p-2.5 text-cyan-300 font-bold tabular-nums">{stat.formattedValue}</td>
                      <td className="p-2.5 tabular-nums">
                        {stat.delta >= 0 ? `+${stat.delta}` : stat.delta} {stat.unit}
                      </td>
                      <td className="p-2.5 text-slate-400 tabular-nums">{stat.sessionsCount}</td>
                      <td className="p-2.5 text-slate-400 font-['Inter'] text-[11px]">{stat.formula}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Flight Recorder 30-Day Activity Tape */}
          <div>
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-200 mb-2 uppercase tracking-wider">
              Flight Recorder // 30-Day Timeline Table
            </h3>
            <div className="overflow-x-auto rounded border border-[#1f293d] bg-[#090d16] max-h-64">
              <table className="w-full text-left text-xs font-['JetBrains_Mono']">
                <caption className="sr-only">30-Day Daily Playtime and Win/Loss Record</caption>
                <thead className="sticky top-0 bg-[#111827] text-slate-400 border-b border-[#1f293d] text-[11px] uppercase">
                  <tr>
                    <th scope="col" className="p-2.5">Date</th>
                    <th scope="col" className="p-2.5">Playtime (Hours)</th>
                    <th scope="col" className="p-2.5">Matches</th>
                    <th scope="col" className="p-2.5">Result (W - L)</th>
                    <th scope="col" className="p-2.5">Win Rate</th>
                    <th scope="col" className="p-2.5">Avg K/D</th>
                    <th scope="col" className="p-2.5">Avg DMG</th>
                    <th scope="col" className="p-2.5">Notable Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]">
                  {flightRecorderDays.map((day) => (
                    <tr key={day.date} className="hover:bg-[#141c30]">
                      <th scope="row" className="p-2.5 text-slate-300 font-normal">{day.date}</th>
                      <td className="p-2.5 text-slate-100 font-bold tabular-nums">{day.playtimeHours}h</td>
                      <td className="p-2.5 text-slate-400 tabular-nums">{day.sessionCount}</td>
                      <td className="p-2.5 tabular-nums">
                        {day.sessionCount > 0 ? (
                          <span>
                            <span className="text-emerald-400 font-semibold">{day.wins}W</span> - <span className="text-rose-400 font-semibold">{day.losses}L</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">Rest</span>
                        )}
                      </td>
                      <td className="p-2.5 tabular-nums">{day.sessionCount > 0 ? `${day.winRate}%` : '—'}</td>
                      <td className="p-2.5 text-cyan-300 tabular-nums">{day.sessionCount > 0 ? day.avgKd : '—'}</td>
                      <td className="p-2.5 tabular-nums">{day.sessionCount > 0 ? day.avgDamage.toLocaleString() : '—'}</td>
                      <td className="p-2.5 text-amber-300">{day.notableEvent || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1f293d] flex items-center justify-between text-xs font-['JetBrains_Mono'] text-slate-400">
          <span>Compliant with Screen Reader & Keyboard Navigation Standards</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#090d16] font-bold transition"
          >
            Close Table View
          </button>
        </div>
      </div>
    </div>
  );
};
