import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AddressDiff } from '../../types';

interface AddressHealerCardProps {
  orderId: string;
  diff: AddressDiff;
  onApplyVerified: (orderId: string) => void;
}

export const AddressHealerCard: React.FC<AddressHealerCardProps> = ({
  orderId,
  diff,
  onApplyVerified,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [customerMailSent, setCustomerMailSent] = useState(false);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyVerified(orderId);
      setIsApplying(false);
    }, 300);
  };

  const handleSendMail = () => {
    setCustomerMailSent(true);
    setTimeout(() => setCustomerMailSent(false), 4000);
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 p-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
              USPS Address Validation Warning
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400">
              Missing Secondary Unit / Zip+4 Mismatch (Confidence: {diff.confidenceScore}%)
            </div>
          </div>
        </div>

        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
          DPV MATCHED
        </span>
      </div>

      {/* Side-by-Side Diff */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs">
        {/* Customer Entered */}
        <div className="p-2.5 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark">
          <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <span>Customer Entered</span>
          </div>
          <div className="font-mono text-slate-700 dark:text-slate-300 space-y-0.5 text-[11px]">
            <div>{diff.original.name}</div>
            <div className="line-through decoration-rose-500 text-slate-400">
              {diff.original.street1}
              {diff.original.street2 ? `, ${diff.original.street2}` : ''}
            </div>
            <div>
              {diff.original.city}, {diff.original.state} {diff.original.postalCode}
            </div>
          </div>
        </div>

        {/* USPS Verified Match */}
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40">
          <div className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              USPS Verified Match
            </span>
            <span className="font-mono text-[9px] bg-emerald-500/20 px-1 rounded text-emerald-800 dark:text-emerald-300">
              RECOMMENDED
            </span>
          </div>
          <div className="font-mono text-slate-900 dark:text-slate-100 font-semibold space-y-0.5 text-[11px]">
            <div>{diff.suggested.name}</div>
            <div className="text-emerald-700 dark:text-emerald-300">
              {diff.suggested.street1}
            </div>
            <div>
              {diff.suggested.city}, {diff.suggested.state} <span className="bg-emerald-500/30 px-1 rounded">{diff.suggested.postalCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reasons breakdown */}
      <div className="mb-3 space-y-0.5 px-1">
        {diff.correctionReasons.map((reason, idx) => (
          <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-mono">
            <span className="text-emerald-500 font-bold">•</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>

      {/* Action Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
        <button
          onClick={handleApply}
          disabled={isApplying}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Apply Verified Address & Release Hold (A)</span>
        </button>

        <button
          onClick={handleSendMail}
          disabled={customerMailSent}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark hover:border-slate-400 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
        >
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>{customerMailSent ? '✓ Link Emailed!' : 'Send 1-Click Customer Link'}</span>
        </button>
      </div>
    </div>
  );
};

