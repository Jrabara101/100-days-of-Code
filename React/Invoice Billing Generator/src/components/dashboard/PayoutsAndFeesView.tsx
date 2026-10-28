import React from 'react';
import { Invoice } from '../../types';
import { formatCents } from '../../utils/currency';
import { Landmark, ArrowUpRight, ShieldCheck, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';

interface PayoutsAndFeesViewProps {
  invoices: Invoice[];
}

export const PayoutsAndFeesView: React.FC<PayoutsAndFeesViewProps> = ({ invoices }) => {
  // Extract settled transactions
  const transactions = invoices.flatMap((inv) => inv.transactions || []);
  const grossBilledCents = transactions.reduce((sum, tx) => sum + tx.gross_amount_cents, 0);
  const totalFeesCents = transactions.reduce((sum, tx) => sum + tx.gateway_fee_cents, 0);
  const netPayoutCents = transactions.reduce((sum, tx) => sum + tx.net_amount_cents, 0);

  // Theoretical fee if everything was paid with PayPal (3.49% + $0.49) vs actual ACH savings
  const estimatedLegacyFeeCents = Math.round(grossBilledCents * 0.0349);
  const totalFeesSavedCents = Math.max(0, estimatedLegacyFeeCents - totalFeesCents);

  return (
    <div className="space-y-6">
      {/* Payout & Settlement Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gross Volume */}
        <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Gross Processed Volume</span>
          <div className="text-2xl font-bold font-mono text-white mt-1.5 tabular-nums">
            {formatCents(grossBilledCents || 2370000)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across Stripe ACH & PayPal rails</span>
        </div>

        {/* Total Gateway Fees */}
        <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Blended Gateway Fees Paid</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1.5 tabular-nums">
            {formatCents(totalFeesCents || 1000)}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Saved {formatCents(totalFeesSavedCents || 81713)} via ACH routing
          </span>
        </div>

        {/* Net to Mercury Bank */}
        <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Net Deposited to Mercury •••• 9012</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5 tabular-nums">
            {formatCents(netPayoutCents || 2369000)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Next payout: Today 5:00 PM EST</span>
        </div>
      </div>

      {/* Connected Payout Destination */}
      <div className="p-5 rounded-xl bg-vault-850/60 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Mercury Business Checking •••• 9012</h3>
            <span className="text-xs text-slate-400">Routing: 021000021 • Daily automatic payout sweeps enabled</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Primary Settlement Rail
        </span>
      </div>

      {/* Multi-Rail Fee Comparison Matrix */}
      <div className="p-5 rounded-xl bg-vault-850/60 border border-slate-800 space-y-3">
        <h3 className="text-sm font-semibold text-white">Payment Rail Fee Comparison & Margin Shield</h3>
        <p className="text-xs text-slate-400">
          Our intelligent payment router steers clients toward zero-fee ACH while preserving seamless card & PayPal checkout.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* ACH */}
          <div className="p-4 rounded-lg bg-vault-900 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">Stripe US ACH Transfer</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                RECOMMENDED
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white">$0.00 / 0.8%</div>
            <p className="text-[11px] text-slate-400">
              Capped at $5.00 maximum fee. Saves 2.5% to 3.5% on enterprise invoices over $5,000.
            </p>
          </div>

          {/* Cards */}
          <div className="p-4 rounded-lg bg-vault-900 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-stripe-light">Stripe Cards & Apple Pay</span>
            <div className="text-xl font-bold font-mono text-white">2.9% + 30¢</div>
            <p className="text-[11px] text-slate-400">
              Instant settlement. Convenience fee pass-through option available.
            </p>
          </div>

          {/* PayPal */}
          <div className="p-4 rounded-lg bg-vault-900 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-blue-400">PayPal & Venmo</span>
            <div className="text-xl font-bold font-mono text-white">3.49% + 49¢</div>
            <p className="text-[11px] text-slate-400">
              Consumer favorite for SMBs, supports PayPal Pay Later (4 installments).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
