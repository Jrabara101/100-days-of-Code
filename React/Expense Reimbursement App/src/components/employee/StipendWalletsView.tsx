import React from 'react';
import { Laptop, Heart, BookOpen, Plus, CheckCircle2 } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface StipendWalletsViewProps {
  onOpenNewExpense: () => void;
}

export const StipendWalletsView: React.FC<StipendWalletsViewProps> = ({ onOpenNewExpense }) => {
  const { stipendWallets } = useExpense();

  const getWalletIcon = (icon: string) => {
    switch (icon) {
      case 'Laptop':
        return <Laptop className="w-6 h-6 text-blue-400" />;
      case 'Heart':
        return <Heart className="w-6 h-6 text-emerald-400" />;
      case 'BookOpen':
      default:
        return <BookOpen className="w-6 h-6 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#171A20] p-6 rounded-xl border border-[#232730] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Employee Stipend & Allowance Wallets</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
              Pre-Tax Benefits
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Company-sponsored wellness, remote setup, and continuous education allowances.
            Claims are 100% tax-free and reimburse straight to your checking account.
          </p>
        </div>

        <button
          onClick={onOpenNewExpense}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-900/40"
        >
          <Plus className="w-4 h-4" />
          <span>Claim Against Stipend</span>
        </button>
      </div>

      {/* 3 Wallet Master Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stipendWallets.map((wallet) => {
          const remainingCents = wallet.total_budget_cents - wallet.used_cents;
          const percentUsed = Math.min(
            100,
            Math.round((wallet.used_cents / wallet.total_budget_cents) * 100)
          );

          return (
            <div
              key={wallet.id}
              className="bg-[#171A20] rounded-xl border border-[#232730] p-6 shadow-sm flex flex-col justify-between hover:border-emerald-500/40 transition duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#121418] border border-[#2E3440] flex items-center justify-center">
                    {getWalletIcon(wallet.icon)}
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#121418] text-gray-400 border border-[#232730]">
                    Resets {wallet.reset_date}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{wallet.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Annual corporate allowance refreshed each calendar cycle.
                </p>

                {/* Progress Bar & Balances */}
                <div className="my-5 space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono text-2xl font-bold text-white tabular-nums">
                      ${(remainingCents / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-400 text-xs font-mono">
                      of ${(wallet.total_budget_cents / 100).toFixed(0)} remaining
                    </span>
                  </div>

                  <div className="w-full bg-[#121418] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${wallet.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-gray-500">
                    <span>${(wallet.used_cents / 100).toFixed(0)} claimed</span>
                    <span>{percentUsed}% spent</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#232730] flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Instant Auto-Approved</span>
                </span>

                <button
                  onClick={onOpenNewExpense}
                  className="px-3 py-1.5 rounded-lg bg-[#121418] hover:bg-[#232730] border border-[#2E3440] text-gray-200 hover:text-white text-xs font-medium transition"
                >
                  Submit Receipt
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
