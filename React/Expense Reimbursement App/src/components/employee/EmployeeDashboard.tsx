import React, { useState } from 'react';
import {
  UploadCloud,
  Car,
  Calendar,
  Search,
  Eye,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import type { ExpenseItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { AmountDisplay } from '../common/AmountDisplay';

interface EmployeeDashboardProps {
  onOpenSubmissionStudio: (mode?: 'receipt' | 'mileage' | 'per_diem') => void;
  onSelectItemForReview?: (item: ExpenseItem) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  onOpenSubmissionStudio,
  onSelectItemForReview,
}) => {
  const { items, deleteExpenseItem, exportERPBundle } = useExpense();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hoveredReceiptId, setHoveredReceiptId] = useState<string | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.merchant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.gl_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? item.status === 'pending'
        : statusFilter === 'approved'
        ? item.status === 'approved'
        : statusFilter === 'flagged'
        ? item.status === 'flagged'
        : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Quick-Drop Receipt Intake Strip */}
      <div className="relative group rounded-xl border-2 border-dashed border-[#2E3440] hover:border-emerald-500/70 bg-[#121418]/80 hover:bg-[#121418] p-4 transition-all duration-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div
          onClick={() => onOpenSubmissionStudio('receipt')}
          className="flex items-center gap-3.5 cursor-pointer flex-1"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">
                Drag & drop receipts here, paste from clipboard (⌘V)
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                AI OCR 2-Sec
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Instant merchant extraction, historical FX currency conversion & pre-submission policy linting.
            </p>
          </div>
        </div>

        {/* Quick Triggers */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => onOpenSubmissionStudio('mileage')}
            className="px-3 py-2 rounded-lg bg-[#171A20] hover:bg-[#1E222A] border border-[#2E3440] hover:border-emerald-500/40 text-xs font-medium text-gray-200 flex items-center gap-1.5 transition"
          >
            <Car className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Log Mileage</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSubmissionStudio('per_diem')}
            className="px-3 py-2 rounded-lg bg-[#171A20] hover:bg-[#1E222A] border border-[#2E3440] hover:border-emerald-500/40 text-xs font-medium text-gray-200 flex items-center gap-1.5 transition"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Claim Per Diem</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSubmissionStudio('receipt')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-900/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#171A20] p-3 rounded-xl border border-[#232730]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant, category, GL code, or description..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#121418] border border-[#2E3440] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto">
          {['all', 'pending', 'approved', 'flagged'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                statusFilter === st
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-[#232730]'
              }`}
            >
              {st === 'all' ? 'All Claims' : st}
            </button>
          ))}

          <button
            onClick={() => exportERPBundle('netsuite')}
            className="px-2.5 py-1.5 rounded-lg bg-[#121418] hover:bg-[#232730] border border-[#2E3440] text-gray-300 text-xs font-mono flex items-center gap-1 ml-2 transition"
            title="Export CSV for Accounting"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Personal Expense Ledger Table */}
      <div className="bg-[#171A20] rounded-xl border border-[#232730] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#121418] border-b border-[#232730] text-[#8F98A8] font-medium uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-12 text-center">Receipt</th>
                <th className="py-3 px-4">Merchant & Description</th>
                <th className="py-3 px-3 font-mono">Date</th>
                <th className="py-3 px-3">Category & GL Code</th>
                <th className="py-3 px-3">Policy Audit Status</th>
                <th className="py-3 px-3 font-mono">Original Amount</th>
                <th className="py-3 px-4 font-mono text-right">Reimbursement (USD)</th>
                <th className="py-3 px-3 text-center">Settlement Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232730]">
              {filteredItems.map((item) => {
                const hasSoftWarning = item.policy_flags.includes('over_cap');
                const hasDuplicate = item.policy_flags.includes('duplicate_risk');

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#1A1D24] transition duration-150 group"
                  >
                    {/* Micro Thumbnail with Zoom Hover */}
                    <td className="py-2.5 px-4 text-center relative">
                      <div
                        onMouseEnter={() => setHoveredReceiptId(item.id)}
                        onMouseLeave={() => setHoveredReceiptId(null)}
                        className="w-9 h-11 mx-auto rounded border border-[#2E3440] bg-[#121418] flex items-center justify-center cursor-pointer hover:border-emerald-400 transition overflow-hidden relative shadow-sm"
                      >
                        <Receipt className="w-4 h-4 text-gray-400 group-hover:text-emerald-400" />

                        {/* Floating Tooltip Hover Preview */}
                        {hoveredReceiptId === item.id && (
                          <div className="absolute left-12 top-0 z-40 bg-[#0A0B0D] p-3 rounded-lg border border-emerald-500/50 shadow-2xl w-48 text-left pointer-events-none">
                            <p className="text-[10px] uppercase text-emerald-400 font-bold mb-1">
                              Receipt Micro-Preview
                            </p>
                            <p className="font-semibold text-white text-xs">{item.merchant_name}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {item.transaction_date} • {item.gl_code}
                            </p>
                            <p className="text-xs font-bold font-mono text-emerald-300 mt-1">
                              ${(item.reimbursement_amount_cents / 100).toFixed(2)} USD
                            </p>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Merchant & Description */}
                    <td className="py-2.5 px-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.merchant_name}</span>
                        {item.is_billable_to_client && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            Client Billable
                          </span>
                        )}
                      </div>
                      {item.justification_note && (
                        <p className="text-[11px] text-gray-400 mt-0.5 italic truncate max-w-xs">
                          "{item.justification_note}"
                        </p>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 font-mono text-gray-300 text-[11px]">
                      {item.transaction_date}
                    </td>

                    {/* Category & GL Code */}
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#121418] border border-[#2E3440] text-[11px] text-gray-300">
                        <span>{item.category}</span>
                        <span className="text-gray-500 font-mono text-[9px]">• {item.gl_code}</span>
                      </span>
                    </td>

                    {/* Policy Audit Status */}
                    <td className="py-2.5 px-3">
                      {hasDuplicate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-semibold">
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                          <span>Duplicate Risk</span>
                        </span>
                      ) : hasSoftWarning ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px]">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Over Cap (Justified)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-teal-400" />
                          <span>In Policy</span>
                        </span>
                      )}
                    </td>

                    {/* Original Amount */}
                    <td className="py-2.5 px-3 font-mono text-gray-300 text-[11px]">
                      {item.original_currency !== 'USD' ? (
                        <span>
                          {(item.original_amount_cents / 100).toFixed(2)} {item.original_currency}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    {/* Reimbursement USD */}
                    <td className="py-2.5 px-4 font-mono text-right font-bold text-white text-[13px] tabular-nums">
                      <AmountDisplay
                        amountCents={item.reimbursement_amount_cents}
                        originalAmountCents={item.original_amount_cents}
                        originalCurrency={item.original_currency}
                        fxRate={item.fx_rate}
                      />
                    </td>

                    {/* Settlement Stage */}
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => onSelectItemForReview && onSelectItemForReview(item)}
                          className="p-1 rounded hover:bg-[#232730] text-gray-400 hover:text-white transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExpenseItem(item.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                          title="Delete Claim"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 text-xs font-mono">
                    No expense claims found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
