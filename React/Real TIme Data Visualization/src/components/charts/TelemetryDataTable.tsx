import React, { useState, useMemo } from 'react';
import { useTelemetry, METRIC_METAS } from '../../context/TelemetryContext';
import { MetricId } from '../../types/telemetry';
import { Download, Search, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  metricId: MetricId;
  height?: number;
}

export const TelemetryDataTable: React.FC<Props> = ({ metricId, height = 320 }) => {
  const { getSeriesData } = useTelemetry();
  const rawData = getSeriesData(metricId, 100);
  const meta = METRIC_METAS[metricId];
  const [searchTerm, setSearchTerm] = useState('');

  const rows = useMemo(() => {
    return [...rawData].reverse().filter((pt) => {
      if (!searchTerm) return true;
      return pt.timeLabel.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [rawData, searchTerm]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Time', 'Value', 'Baseline', 'VariancePct', 'Anomaly'];
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => {
        const variance = (((r.value - r.baseline) / r.baseline) * 100).toFixed(2);
        return [r.timestamp, `"${r.timeLabel}"`, r.value.toFixed(2), r.baseline.toFixed(2), variance, r.isAnomaly ? 'YES' : 'NO'].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${metricId}_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col justify-between" style={{ minHeight: height }}>
      {/* Search and Action Bar */}
      <div className="flex items-center justify-between p-3 border-b border-white/5 gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search timestamp..."
            className="w-full bg-[#171B24] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono"
          />
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table Data Container */}
      <div className="flex-1 overflow-y-auto max-h-72">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#171B24]/80 sticky top-0 border-b border-white/5 text-slate-400 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2 px-3">Timestamp</th>
              <th className="py-2 px-3">Live Value</th>
              <th className="py-2 px-3">Baseline</th>
              <th className="py-2 px-3">Variance</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {rows.slice(0, 30).map((row) => {
              const variancePct = ((row.value - row.baseline) / row.baseline) * 100;
              const isPositive = variancePct >= 0;
              return (
                <tr key={row.timestamp} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-3 text-slate-400">{row.timeLabel}</td>
                  <td className="py-2 px-3 font-semibold text-white">{meta.format(row.value)}</td>
                  <td className="py-2 px-3 text-slate-400">{meta.format(row.baseline)}</td>
                  <td className={`py-2 px-3 font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{variancePct.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3">
                    {row.isAnomaly ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <AlertTriangle size={10} /> BREAKOUT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <CheckCircle2 size={11} className="text-emerald-400" /> Nominal
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Showing {Math.min(30, rows.length)} of {rows.length} buffered points</span>
        <span>LTTB-Validated Resolution</span>
      </div>
    </div>
  );
};
