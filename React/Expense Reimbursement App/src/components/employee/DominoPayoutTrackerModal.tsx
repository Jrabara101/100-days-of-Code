import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface DominoPayoutTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DominoPayoutTrackerModal: React.FC<DominoPayoutTrackerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { payoutBatches, dispatchPayoutBatch, triggerCelebration } = useExpense();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeBatch =
    payoutBatches.find((b) => b.status === 'in_transit' || b.status === 'queued') ||
    payoutBatches[0];

  const handleCopyTrace = () => {
    if (activeBatch?.trace_id) {
      navigator.clipboard.writeText(activeBatch.trace_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulateSettlement = () => {
    if (activeBatch) {
      dispatchPayoutBatch(activeBatch.id);
      triggerCelebration();
    }
  };

  const steps = [
    {
      num: 1,
      title: 'Expense Claim Submitted',
      desc: 'All itemized receipts & digital affidavits verified',
      time: 'Oct 21, 2:32 PM',
      completed: true,
      current: false,
    },
    {
      num: 2,
      title: 'Manager Approved',
      desc: 'Signed off by Marcus Vance (VP Engineering)',
      time: 'Oct 21, 4:10 PM',
      completed: true,
      current: false,
    },
    {
      num: 3,
      title: 'Finance & Tax Compliance Verified',
      desc: 'GL-6120 & GL-6130 mapped with VAT deductions',
      time: 'Oct 22, 9:45 AM',
      completed: true,
      current: false,
    },
    {
      num: 4,
      title: 'ACH / Fedwire Dispatched',
      desc: 'Dispatched through banking partner (Silicon Valley Bank / JP Morgan)',
      time: 'Oct 22, 10:30 AM',
      completed: activeBatch?.progress_step >= 4,
      current: activeBatch?.progress_step === 4,
    },
    {
      num: 5,
      title: 'Settled in Direct Deposit',
      desc: 'Available in Chase Checking •••• 4829',
      time: activeBatch?.status === 'settled' ? 'Settled Today' : 'Est. Tomorrow by 5:00 PM EST',
      completed: activeBatch?.status === 'settled',
      current: activeBatch?.status === 'settled',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#171A20] text-[#F8FAFC] border border-[#232730] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-[#232730] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-lg text-white">
                  Live Reimbursement Settlement Tracker
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                  {activeBatch?.status === 'settled' ? 'Settled ✓' : 'In Transit ⚡'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Batch ID: {activeBatch?.id} • {activeBatch?.items_count} line items
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#232730] text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Destination Banner */}
        <div className="bg-[#121418] p-6 border-b border-[#232730] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              Total Payout Amount
            </span>
            <div className="text-3xl font-extrabold font-mono text-white tracking-tight mt-1 tabular-nums">
              ${activeBatch ? (activeBatch.amount_cents / 100).toFixed(2) : '0.00'}{' '}
              <span className="text-sm font-sans text-emerald-400 font-normal">USD</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#171A20] border border-[#232730] text-xs">
            <div className="flex items-center gap-2 text-gray-300 font-medium mb-1">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Chase Premier Checking</span>
            </div>
            <div className="font-mono text-gray-400 text-[11px] flex items-center gap-2">
              <span>Account: •••• {activeBatch?.bank_account_last4 || '4829'}</span>
              <span className="w-1 h-1 rounded-full bg-gray-500" />
              <span className="text-emerald-400">Direct Deposit Verified ✓</span>
            </div>
          </div>
        </div>

        {/* 5-Stage Domino's Stepper */}
        <div className="p-6">
          <div className="relative pl-6 space-y-6 before:absolute before:left-9 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#232730]">
            {steps.map((step) => {
              return (
                <div key={step.num} className="relative flex items-start gap-4 group">
                  {/* Status Circle */}
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step.completed
                        ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                        : step.current
                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 animate-pulse'
                        : 'bg-[#121418] text-gray-500 border border-[#232730]'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span>{step.num}</span>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 bg-[#121418]/60 hover:bg-[#121418] p-3 rounded-xl border border-[#232730] transition">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-semibold ${
                          step.completed
                            ? 'text-white'
                            : step.current
                            ? 'text-emerald-300'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {step.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trace ID Banner */}
          <div className="mt-6 p-3.5 bg-[#121418] rounded-xl border border-[#232730] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-xs">
                <span className="text-gray-400">Fedwire / NACHA Trace Reference: </span>
                <span className="font-mono text-white font-medium ml-1">
                  {activeBatch?.trace_id}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyTrace}
              className="px-2.5 py-1 rounded bg-[#171A20] hover:bg-[#232730] border border-[#232730] text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0D0F12] border-t border-[#232730] flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Backed by FDIC Insured Commercial Accounts
          </span>

          <div className="flex items-center gap-2">
            {activeBatch?.status !== 'settled' && (
              <button
                onClick={handleSimulateSettlement}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-900/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Bank Arrival (Celebrate 🎉)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#171A20] hover:bg-[#232730] border border-[#232730] text-gray-300 hover:text-white font-medium text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
