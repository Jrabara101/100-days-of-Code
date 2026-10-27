import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Receipt,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import type { ExpenseItem, ExpenseReport } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ReceiptCanvas } from '../ocr/ReceiptCanvas';
import { SAMPLE_BOUNDING_BOXES } from '../../data/mockData';

export const ApproverTriageCockpit: React.FC = () => {
  const {
    reports,
    items,
    approveLineItem,
    flagLineItem,
    approveCleanItemsInReport,
    triggerCelebration,
  } = useExpense();

  const [activeTab, setActiveTab] = useState<'review' | 'flagged' | 'auto' | 'batches'>('review');
  const [selectedReportId, setSelectedReportId] = useState<string>('rep-084');
  const [selectedItemId, setSelectedItemId] = useState<string>('item-002');
  const [clarificationComment, setClarificationComment] = useState<string>('');
  const [showClarificationInput, setShowClarificationInput] = useState<boolean>(false);
  const [splitSuccessBanner, setSplitSuccessBanner] = useState<string | null>(null);

  // Active report and items
  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];
  const reportItems = items.filter((i) => i.report_id === selectedReportId);
  const activeItem = items.find((i) => i.id === selectedItemId) || reportItems[0] || items[0];

  // Clean items in active report (non-duplicate)
  const cleanItems = reportItems.filter(
    (i) => !i.policy_flags.includes('duplicate_risk') && i.status !== 'approved'
  );
  const cleanTotalCents = cleanItems.reduce((acc, i) => acc + i.reimbursement_amount_cents, 0);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in textarea/input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'j' || e.key === 'J') {
        // Step to next item
        const currentIndex = reportItems.findIndex((i) => i.id === selectedItemId);
        if (currentIndex < reportItems.length - 1) {
          setSelectedItemId(reportItems[currentIndex + 1].id);
        }
      } else if (e.key === 'k' || e.key === 'K') {
        // Step to previous item
        const currentIndex = reportItems.findIndex((i) => i.id === selectedItemId);
        if (currentIndex > 0) {
          setSelectedItemId(reportItems[currentIndex - 1].id);
        }
      } else if (e.key === 'a' || e.key === 'A') {
        // Approve current item
        if (activeItem && activeItem.status !== 'approved') {
          approveLineItem(activeItem.id);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        // Open flag input
        setShowClarificationInput(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        // Approve clean items
        handleApproveClean();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportItems, selectedItemId, activeItem]);

  const handleApproveClean = () => {
    if (!activeReport) return;
    const res = approveCleanItemsInReport(activeReport.id);
    if (res.approvedCount > 0) {
      setSplitSuccessBanner(
        `✓ Fast-Track Payout: ${res.approvedCount} clean items ($${(res.approvedAmountCents / 100).toFixed(2)}) dispatched to ACH Batch #${res.batchId} without waiting!`
      );
      setTimeout(() => setSplitSuccessBanner(null), 6000);
    }
  };

  const handleSendClarification = () => {
    if (activeItem && clarificationComment.trim()) {
      flagLineItem(activeItem.id, clarificationComment.trim());
      setClarificationComment('');
      setShowClarificationInput(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Triage Header & Filters */}
      <div className="bg-[#171A20] p-4 rounded-xl border border-[#232730] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white hover:bg-[#232730]'
            }`}
          >
            <span>Needs Review</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-mono">
              {reportItems.filter((i) => i.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'flagged'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-gray-400 hover:text-white hover:bg-[#232730]'
            }`}
          >
            <span>Flagged / Exceptions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-red-500/30 text-red-300 text-[10px] font-mono">
              {reportItems.filter((i) => i.status === 'flagged').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('auto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'auto'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : 'text-gray-400 hover:text-white hover:bg-[#232730]'
            }`}
          >
            <span>Auto-Approved (&lt;$40)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-300 text-[10px] font-mono">
              14
            </span>
          </button>
        </div>

        {/* Keyboard Legend Strip */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 bg-[#121418] px-3 py-1.5 rounded-lg border border-[#232730]">
          <span className="text-gray-500">Keyboard shortcuts:</span>
          <span className="bg-[#171A20] px-1.5 py-0.5 rounded text-gray-300 border border-[#2E3440]">
            J / K Navigate
          </span>
          <span className="bg-[#171A20] px-1.5 py-0.5 rounded text-gray-300 border border-[#2E3440]">
            A Approve
          </span>
          <span className="bg-[#171A20] px-1.5 py-0.5 rounded text-gray-300 border border-[#2E3440]">
            F Flag
          </span>
          <span className="bg-[#171A20] px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/40 font-bold">
            ⌘Enter Partial Approve
          </span>
        </div>
      </div>

      {/* Unblocked Fast-Track Settlement Banner */}
      {splitSuccessBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{splitSuccessBanner}</span>
          </div>
          <button
            onClick={() => setSplitSuccessBanner(null)}
            className="text-emerald-400 hover:text-white font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Split-Pane Master-Detail Triage View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Rail: Report & Line-Item Queue (380px / 4 cols) */}
        <div className="lg:col-span-4 bg-[#171A20] rounded-xl border border-[#232730] p-4 space-y-4">
          {/* Active Report Header Card */}
          <div className="p-3.5 rounded-xl bg-[#121418] border border-[#2E3440]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeReport?.employee_avatar}
                  alt={activeReport?.employee_name}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-500/40"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{activeReport?.employee_name}</h4>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {activeReport?.report_number} • {activeReport?.department}
                  </p>
                </div>
              </div>
              <StatusBadge status={activeReport?.status || 'submitted'} size="sm" />
            </div>

            <p className="text-xs text-gray-300 font-medium mt-2.5 line-clamp-1">
              {activeReport?.title}
            </p>

            <div className="mt-3 pt-2 border-t border-[#232730] flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Total Claim:</span>
              <span className="text-white font-bold text-sm">
                ${activeReport ? (activeReport.total_cents / 100).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Line-Item Queue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider px-1">
              <span>Report Line Items ({reportItems.length})</span>
              <span className="text-[10px] font-mono">Select to audit</span>
            </div>

            {reportItems.map((item, index) => {
              const isSelected = selectedItemId === item.id;
              const isDuplicate = item.policy_flags.includes('duplicate_risk');
              const isOverCap = item.policy_flags.includes('over_cap');

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C2027] border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-md'
                      : 'bg-[#121418] border-[#232730] hover:border-[#383E4D]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{item.merchant_name}</span>
                        {item.status === 'approved' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-medium">
                            ✓ Approved
                          </span>
                        )}
                        {item.status === 'flagged' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-mono font-medium">
                            ⚠️ Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {item.transaction_date} • {item.gl_code}
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-white">
                        ${(item.reimbursement_amount_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Micro-Badges for anomalies */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {isDuplicate && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-[9px] font-bold">
                        <ShieldAlert className="w-3 h-3 text-red-400" />
                        <span>Possible Duplicate #EXP-041</span>
                      </span>
                    )}

                    {isOverCap && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px]">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Over Soft Cap • Note Attached</span>
                      </span>
                    )}

                    {!isDuplicate && !isOverCap && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[9px]">
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        <span>Clean Item</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats on report */}
          <div className="p-3 bg-[#121418] rounded-xl border border-[#232730] text-[11px] text-gray-400 space-y-1.5">
            <div className="flex justify-between">
              <span>Clean Items Available:</span>
              <span className="text-emerald-400 font-bold font-mono">
                {cleanItems.length} items (${(cleanTotalCents / 100).toFixed(2)})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Flagged / Review Items:</span>
              <span className="text-amber-400 font-bold font-mono">
                {reportItems.length - cleanItems.length} item
              </span>
            </div>
          </div>
        </div>

        {/* Right Stage: Side-by-Side Audit & Partial Settlement Inspector (8 cols) */}
        <div className="lg:col-span-8 bg-[#171A20] rounded-xl border border-[#232730] flex flex-col justify-between overflow-hidden">
          {/* Audit Details Area */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Top Item Summary Strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#232730]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Auditing Item #{activeItem?.id}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {activeItem?.merchant_name}
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Category: {activeItem?.category} • GL Code: {activeItem?.gl_code}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                  ${activeItem ? (activeItem.reimbursement_amount_cents / 100).toFixed(2) : '0.00'}
                </span>
                <p className="text-[11px] text-gray-400 font-mono">
                  Original: {(activeItem?.original_amount_cents / 100).toFixed(2)}{' '}
                  {activeItem?.original_currency}
                </p>
              </div>
            </div>

            {/* Department Budget Impact Meter */}
            <div className="p-4 rounded-xl bg-[#121418] border border-[#2E3440] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Engineering Travel & Lodging Budget (Q4)
                </span>
                <span className="font-mono text-gray-300">
                  <strong className="text-white">$31,240</strong> / $50,000 utilized (62.4%)
                </span>
              </div>
              <div className="w-full bg-[#171A20] rounded-full h-2 overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[62.4%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              </div>
              <p className="text-[10px] text-emerald-400/90 font-mono">
                ✓ Expense complies with allocated quarterly departmental runway.
              </p>
            </div>

            {/* Duplicate Risk Comparison Diff (If Flagged) */}
            {activeItem?.policy_flags.includes('duplicate_risk') && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Cryptographic Duplicate Match Detected</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#171A20] p-3 rounded-lg border border-[#2E3440]">
                    <span className="text-[10px] text-gray-400 font-mono">Current Claim</span>
                    <p className="font-bold text-white mt-1">Blue Bottle Coffee #42</p>
                    <p className="font-mono text-gray-300">$18.50 USD • Oct 20, 2026</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">
                      Hash: e3b0c44298fc1c149a...
                    </p>
                  </div>
                  <div className="bg-[#171A20] p-3 rounded-lg border border-red-500/40">
                    <span className="text-[10px] text-red-400 font-mono">
                      Settled Claim (#EXP-2026-041)
                    </span>
                    <p className="font-bold text-white mt-1">Blue Bottle Coffee #42</p>
                    <p className="font-mono text-red-300">$18.50 USD • Sep 15, 2026</p>
                    <p className="text-[10px] text-red-400 font-mono mt-1">
                      Status: Settled in Payout #ACH-441029
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Justification Note & Client Allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#121418] border border-[#2E3440] space-y-1.5">
                <span className="text-gray-400 font-medium">Employee Business Justification</span>
                <p className="text-gray-200 italic leading-relaxed">
                  "{activeItem?.justification_note || 'Standard business travel expense.'}"
                </p>
                {activeItem?.attendees && activeItem.attendees.length > 0 && (
                  <p className="text-[10px] text-gray-400 pt-1 border-t border-[#232730]">
                    Attendees: {activeItem.attendees.join(', ')}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#121418] border border-[#2E3440] space-y-1.5">
                <span className="text-gray-400 font-medium">Cost Centers & Client Billback</span>
                <p className="text-emerald-400 font-medium">
                  {activeItem?.is_billable_to_client
                    ? `✓ Billable to: ${activeItem.client_project_name || 'Client Project'}`
                    : 'Internal Corporate Operating Expense'}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  Allocated: 100% Engineering (Cost Center 410)
                </p>
              </div>
            </div>

            {/* Synchronized Receipt-to-Field Audit Canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Synchronized Receipt Canvas (Live Bounding Boxes)
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  Click tokens to verify OCR
                </span>
              </div>

              <div className="h-[320px] rounded-xl overflow-hidden border border-[#2E3440]">
                <ReceiptCanvas
                  receiptKey={activeItem?.receipt_url || 'standardHotel'}
                  boundingBoxes={SAMPLE_BOUNDING_BOXES[activeItem?.receipt_url || 'standardHotel'] || []}
                  focusedFieldKey={null}
                />
              </div>
            </div>

            {/* Clarification Comment Box (Slide Open) */}
            {showClarificationInput && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-300">
                  Request Clarification from {activeReport?.employee_name}:
                </label>
                <textarea
                  rows={2}
                  value={clarificationComment}
                  onChange={(e) => setClarificationComment(e.target.value)}
                  placeholder="e.g. Please clarify if the receipt was submitted twice or provide statement proof..."
                  className="w-full px-3 py-2 rounded-lg bg-[#121418] border border-[#2E3440] text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowClarificationInput(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#171A20] text-xs text-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendClarification}
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
                  >
                    Send Clarification Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PINNED BOTTOM PARTIAL APPROVAL ACTION BAR */}
          <div className="p-4 px-6 bg-[#121418] border-t border-[#232730] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-400 font-mono">
              <span className="text-white font-bold">{cleanItems.length} Clean Items</span> ($
              {(cleanTotalCents / 100).toFixed(2)}) ready for instant unblocked payout.
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowClarificationInput(!showClarificationInput)}
                className="px-3.5 py-2 rounded-lg bg-[#171A20] hover:bg-[#232730] border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Request Clarification</span>
              </button>

              <button
                type="button"
                onClick={handleApproveClean}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-900/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Approve {cleanItems.length} Clean Items ($
                  {(cleanTotalCents / 100).toFixed(2)}) Now
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
