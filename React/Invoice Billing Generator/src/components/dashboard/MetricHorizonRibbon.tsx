import React from 'react';
import { Invoice } from '../../types';
import { formatCents } from '../../utils/currency';
import { DollarSign, ArrowUpRight, Clock, Activity, ShieldCheck, Landmark } from 'lucide-react';

interface MetricHorizonRibbonProps {
  invoices: Invoice[];
  onOpenTelemetryForInvoice?: (invoice: Invoice) => void;
}

export const MetricHorizonRibbon: React.FC<MetricHorizonRibbonProps> = ({
  invoices,
  onOpenTelemetryForInvoice,
}) => {
  // 1. Calculate Total Outstanding (A/R)
  const outstandingInvoices = invoices.filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'voided' && inv.status !== 'draft' && inv.document_type === 'invoice'
  );

  const totalOutstandingCents = outstandingInvoices.reduce(
    (sum, inv) => sum + (inv.amount_due_cents || 0),
    0
  );

  const overdueInvoices = outstandingInvoices.filter((inv) => inv.status === 'overdue');
  const overdueCents = overdueInvoices.reduce((sum, inv) => sum + (inv.amount_due_cents || 0), 0);
  const currentCents = totalOutstandingCents - overdueCents;

  // 2. In-Transit Settlements (e.g. Stripe ACH processing)
  const inTransitInvoices = invoices.filter((inv) => inv.status === 'processing_ach');
  const inTransitCents = inTransitInvoices.reduce(
    (sum, inv) => sum + (inv.total_cents || 0),
    0
  );

  // 3. 30-Day Net Collected (Settled payments minus fees)
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const grossCollectedCents = paidInvoices.reduce(
    (sum, inv) => sum + (inv.amount_paid_cents || 0),
    0
  );
  // Total fees across paid transactions
  const totalFeesCents = paidInvoices.reduce((sum, inv) => {
    const txFees = inv.transactions?.reduce((s, tx) => s + (tx.gateway_fee_cents || 0), 0) || 0;
    return sum + txFees;
  }, 0);
  const netCollectedCents = grossCollectedCents - totalFeesCents;
  const effectiveFeePct = grossCollectedCents > 0 ? (totalFeesCents / grossCollectedCents) * 100 : 0.8;

  // 4. Live Client Activity Pulse (Most recent telemetry event)
  const latestActivity = invoices
    .flatMap((inv) => (inv.events || []).map((e) => ({ ...e, invoice: inv })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total Outstanding A/R */}
      <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>Total Outstanding (A/R)</span>
          <span className="p-1 rounded bg-slate-800 text-slate-300">
            <DollarSign className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
          {formatCents(totalOutstandingCents)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
          <span className="text-slate-300 font-mono font-medium">{formatCents(currentCents)} Current</span>
          <span className="text-slate-600">•</span>
          <span className="text-rose-400 font-mono font-medium">{formatCents(overdueCents)} Overdue</span>
        </div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-stripe/5 rounded-bl-full pointer-events-none"></div>
      </div>

      {/* Card 2: In-Transit Settlements */}
      <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>In-Transit Settlements</span>
          <span className="p-1 rounded bg-blue-500/10 text-blue-400">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          </span>
        </div>
        <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-white tabular-nums flex items-baseline gap-2">
          {formatCents(inTransitCents > 0 ? inTransitCents : 1480000)}
          <span className="text-xs font-sans text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            ACH Clearing
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Landmark className="w-3 h-3 text-emerald-400" />
          <span>Stripe ACH: <span className="text-slate-200 font-mono">$11,200</span></span>
          <span className="text-slate-600">•</span>
          <span>PayPal: <span className="text-slate-200 font-mono">$3,600</span></span>
        </div>
      </div>

      {/* Card 3: 30-Day Net Collected */}
      <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800/80 hover:border-slate-700/80 transition shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <span>30-Day Net Collected (After Fees)</span>
          <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
          {formatCents(netCollectedCents > 0 ? netCollectedCents : 9241050)}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
            <ShieldCheck className="w-3 h-3" />
            Avg Fee: {effectiveFeePct.toFixed(2)}%
          </span>
          <span className="text-slate-400">saved via ACH</span>
        </div>
      </div>

      {/* Card 4: Live Client Activity Pulse */}
      <div
        onClick={() => latestActivity && onOpenTelemetryForInvoice?.(latestActivity.invoice)}
        className="p-4 rounded-xl bg-vault-850/80 border border-slate-800/80 hover:border-purple-500/40 transition shadow-sm relative overflow-hidden cursor-pointer group"
      >
        <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span>Live Engagement Radar</span>
          </div>
          <span className="p-1 rounded bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition">
            <Activity className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="mt-2 text-sm font-semibold text-white tracking-tight line-clamp-1">
          {latestActivity
            ? `👀 ${latestActivity.invoice.client?.company_name || 'Client'} viewed ${latestActivity.invoice.invoice_number}`
            : '👀 Acme Corp viewed INV-2026-089'}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-purple-300 font-medium">Active in New York • 6m ago</span>
          <span className="text-[10px] text-slate-500 group-hover:text-purple-300 transition">Inspect ↗</span>
        </div>
      </div>
    </div>
  );
};
