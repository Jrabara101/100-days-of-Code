import React, { useState } from 'react';
import {
  ShieldCheck,
  Utensils,
  Building2,
  Plane,
  Terminal,
  Sparkles,
  Laptop,
  Car,
  Calendar,
  Download,
  Check,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import type { ExpensePolicy } from '../../types';

export const PolicyBuilder: React.FC = () => {
  const { policies, auditTrail, exportERPBundle, resetAllData } = useExpense();
  const [selectedPolicy, setSelectedPolicy] = useState<ExpensePolicy | null>(policies[0]);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const getPolicyIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils':
        return <Utensils className="w-5 h-5 text-amber-400" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'Plane':
        return <Plane className="w-5 h-5 text-purple-400" />;
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-teal-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-pink-400" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-emerald-400" />;
      case 'Car':
        return <Car className="w-5 h-5 text-indigo-400" />;
      case 'Calendar':
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleExport = (format: 'netsuite' | 'quickbooks' | 'xero') => {
    exportERPBundle(format);
    setDownloadSuccess(`Exported ${format.toUpperCase()} general ledger bundle with cryptographic audit packet.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#171A20] p-6 rounded-xl border border-[#232730] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Spend Governance & ERP Sync Engine</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              Policy Engine Active
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Configure hard and soft category caps, automated receipt thresholds, GL mappings, and
            export tamper-evident audit packets to NetSuite, QuickBooks, or Xero.
          </p>
        </div>

        {/* ERP Export Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('netsuite')}
            className="px-3 py-2 rounded-lg bg-[#121418] hover:bg-[#232730] border border-[#2E3440] text-xs font-mono text-gray-200 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>NetSuite (.CSV)</span>
          </button>
          <button
            onClick={() => handleExport('quickbooks')}
            className="px-3 py-2 rounded-lg bg-[#121418] hover:bg-[#232730] border border-[#2E3440] text-xs font-mono text-gray-200 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>QuickBooks</span>
          </button>
          <button
            onClick={() => handleExport('xero')}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 transition shadow-lg shadow-emerald-900/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export GL Bundle</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Category Rule Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Active Spend Policy Rules ({policies.length})
          </h3>
          <span className="text-[11px] text-gray-400 font-mono">
            Zero-Awkwardness Pre-Submission Enforcement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {policies.map((pol) => {
            const isSelected = selectedPolicy?.id === pol.id;

            return (
              <div
                key={pol.id}
                onClick={() => setSelectedPolicy(pol)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1C2027] border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-lg'
                    : 'bg-[#171A20] border-[#232730] hover:border-[#383E4D]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[#121418] border border-[#2E3440] flex items-center justify-center">
                      {getPolicyIcon(pol.icon)}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121418] text-gray-300 border border-[#2E3440]">
                      {pol.gl_code}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{pol.category}</h4>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {pol.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#232730] space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Soft Cap (Note):</span>
                    <span className="text-amber-400 font-bold">
                      {pol.soft_cap_cents ? `$${(pol.soft_cap_cents / 100).toFixed(0)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hard Limit:</span>
                    <span className="text-white font-bold">
                      ${(pol.max_amount_cents / 100).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Auto-Approve:</span>
                    <span className="text-emerald-400 font-bold">
                      {pol.auto_approve_under_cents > 0
                        ? `< $${(pol.auto_approve_under_cents / 100).toFixed(0)}`
                        : 'Manual'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audit Integrity & Fraud Sentinel Log */}
      <div className="bg-[#171A20] rounded-xl border border-[#232730] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#232730]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Cryptographic Audit Trail & Governance Provenance
            </h3>
          </div>
          <button
            onClick={resetAllData}
            className="text-[11px] font-mono text-gray-400 hover:text-red-400 underline"
          >
            Reset Demo Data to Initial State
          </button>
        </div>

        {/* Audit Log Entries */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto">
          {auditTrail.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-[#121418] border border-[#232730] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="font-semibold text-white">{log.action}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    Actor: {log.actor_name} • Entity: {log.entity_type} (#{log.entity_id})
                  </p>
                </div>
              </div>

              <div className="text-right text-[10px] font-mono text-gray-500">
                {new Date(log.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
