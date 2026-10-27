import React from 'react';
import {
  Clock,
  ArrowRight,
  ExternalLink,
  Laptop,
  BookOpen,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface TopRibbonProps {
  onOpenPayoutTracker: () => void;
  onOpenNewExpense: () => void;
}

export const TopRibbon: React.FC<TopRibbonProps> = ({ onOpenPayoutTracker }) => {
  const { payoutBatches, items, stipendWallets } = useExpense();

  // Find latest active in-flight batch
  const activeBatch =
    payoutBatches.find((b) => b.status === 'in_transit' || b.status === 'queued') ||
    payoutBatches[0];

  // Calculate pending items for employee
  const pendingItems = items.filter((i) => i.status === 'pending');
  const pendingTotalCents = pendingItems.reduce((acc, i) => acc + i.reimbursement_amount_cents, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: In-Flight Payout Tracker */}
      <div
        onClick={onOpenPayoutTracker}
        className="group relative bg-[#171A20] hover:bg-[#1C2027] transition-all duration-200 rounded-xl p-4 border border-[#232730] hover:border-emerald-500/40 shadow-sm cursor-pointer overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              In-Flight Payout Tracker
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-emerald-400 transition" />
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              ${activeBatch ? (activeBatch.amount_cents / 100).toFixed(2) : '0.00'}
            </h3>
            <span className="text-xs text-gray-400">on the way to •••• 4829</span>
          </div>

          {/* 4-Node Mini Horizontal Stepper */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
              <span className="text-emerald-400">1. Submitted ✓</span>
              <span className="text-emerald-400">2. Approved ✓</span>
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                3. ACH Sent <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </span>
              <span className="text-gray-500">4. Deposited</span>
            </div>

            <div className="w-full bg-[#121418] rounded-full h-1.5 overflow-hidden flex">
              <div className="bg-emerald-500 h-full w-[75%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#232730] flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span>Trace: {activeBatch?.trace_id?.slice(0, 18)}...</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            Est: Tomorrow <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Card 2: Pending Approval Total */}
      <div className="relative bg-[#171A20] rounded-xl p-4 border border-[#232730] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Pending Approval Queue
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {pendingItems.length} items
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              ${(pendingTotalCents / 100).toFixed(2)}
            </h3>
            <span className="text-xs text-gray-400">awaiting sign-off</span>
          </div>

          {/* Reviewer Details Card */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#121418] border border-[#232730]">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
              alt="Marcus Vance"
              className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-500/30"
            />
            <div className="flex-1 min-w-0 text-[11px]">
              <p className="text-gray-200 font-medium truncate">With @marcus (Engineering VP)</p>
              <p className="text-gray-400 text-[10px] truncate">Auto-escalates in 18 hrs</p>
            </div>
            <span className="text-[10px] text-amber-400/90 font-mono">Avg: 4h</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#232730] flex items-center justify-between text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-400" />
            1 item auto-approved (&lt;$40)
          </span>
          <span className="text-gray-400">Updated 5m ago</span>
        </div>
      </div>

      {/* Card 3: Active Stipend Wallets */}
      <div className="relative bg-[#171A20] rounded-xl p-4 border border-[#232730] shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              Company Stipend Wallets
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Resets Dec 31</span>
          </div>

          {/* Wallet Progress Meters */}
          <div className="space-y-2.5 my-1">
            {stipendWallets.map((wallet) => {
              const remainingCents = wallet.total_budget_cents - wallet.used_cents;
              const percentUsed = Math.min(100, Math.round((wallet.used_cents / wallet.total_budget_cents) * 100));

              return (
                <div key={wallet.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-300 flex items-center gap-1.5 truncate">
                      {wallet.icon === 'Laptop' && <Laptop className="w-3 h-3 text-blue-400" />}
                      {wallet.icon === 'Heart' && <Heart className="w-3 h-3 text-emerald-400" />}
                      {wallet.icon === 'BookOpen' && <BookOpen className="w-3 h-3 text-purple-400" />}
                      <span className="truncate">{wallet.name.split(' ')[0]}</span>
                    </span>
                    <span className="font-mono text-gray-300 tabular-nums text-[10px]">
                      <span className="font-semibold text-white">
                        ${(remainingCents / 100).toFixed(0)}
                      </span>{' '}
                      / ${(wallet.total_budget_cents / 100).toFixed(0)} left
                    </span>
                  </div>

                  <div className="w-full bg-[#121418] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${wallet.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#232730] flex items-center justify-between text-[10px] text-gray-400">
          <span>Tax-advantaged benefits</span>
          <span className="text-blue-400 font-medium">100% Tax-Free</span>
        </div>
      </div>
    </div>
  );
};
