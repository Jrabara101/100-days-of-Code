import React, { useState } from 'react';
import { Invoice, InvoiceEvent } from '../../types';
import { formatCents } from '../../utils/currency';
import { StatusBadge } from '../common/Badge';
import { ApiService } from '../../services/api';
import {
  X,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CreditCard,
  Landmark,
  Bell
} from 'lucide-react';

interface SettlementAndWebhookInspectorProps {
  invoice: Invoice | null;
  onClose: () => void;
  onInvoiceUpdated: (updated: Invoice) => void;
  onOpenPortal: (invoice: Invoice) => void;
}

export const SettlementAndWebhookInspector: React.FC<SettlementAndWebhookInspectorProps> = ({
  invoice,
  onClose,
  onInvoiceUpdated,
  onOpenPortal,
}) => {
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState('Client requested scope adjustment');
  const [isDunningTriggering, setIsDunningTriggering] = useState(false);

  if (!invoice) return null;

  const primaryTx = invoice.transactions?.[0];
  const grossCents = primaryTx?.gross_amount_cents || invoice.total_cents;
  const feeCents = primaryTx?.gateway_fee_cents || Math.round(grossCents * 0.029 + 30);
  const taxCents = invoice.tax_cents;
  const netCents = primaryTx?.net_amount_cents || (grossCents - feeCents - taxCents);

  // Waive late fee action
  const handleWaiveLateFee = async () => {
    const updated = await ApiService.waiveLateFee(invoice.id);
    if (updated) {
      onInvoiceUpdated(updated);
    }
  };

  // Trigger dunning sequence step
  const handleTriggerDunning = async () => {
    setIsDunningTriggering(true);
    try {
      const updated = await ApiService.triggerDunningReminder(invoice.id, 'Firm Follow-Up #2 (Overdue)');
      if (updated) {
        onInvoiceUpdated(updated);
      }
    } finally {
      setIsDunningTriggering(false);
    }
  };

  // Refund & Credit Note action
  const handleIssueRefund = async () => {
    if (!refundReason) return;
    try {
      const { invoice: updatedInv } = await ApiService.issueRefund(
        invoice.id,
        invoice.total_cents,
        refundReason
      );
      onInvoiceUpdated(updatedInv);
      setIsRefunding(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-vault-900 border-l border-slate-800 shadow-2xl flex flex-col font-sans select-text animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-vault-850">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-purple-400" />
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Telemetry & Reconciliation</span>
              <span className="font-mono text-xs text-purple-300 font-normal">
                {invoice.invoice_number}
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {invoice.client?.company_name} • {invoice.client?.contact_name}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {/* Status and Direct Portal Link */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-vault-850/80 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">Lifecycle State:</span>
            <StatusBadge status={invoice.status} size="sm" />
          </div>

          <button
            onClick={() => onOpenPortal(invoice)}
            className="text-xs text-stripe hover:underline flex items-center gap-1 font-medium"
          >
            <span>Open Hosted Checkout</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Net Payout Waterfall Card */}
        <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
              TRUE NET-TO-BANK LEDGER WATERFALL
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Mercury •••• 9012
            </span>
          </div>

          {/* Graphical Waterfall Bars */}
          <div className="space-y-2 pt-1 font-mono">
            <div className="flex justify-between items-center text-slate-200">
              <span className="flex items-center gap-1.5 font-sans">
                <CreditCard className="w-3.5 h-3.5 text-stripe" />
                Gross Billed:
              </span>
              <span className="font-bold text-white tabular-nums">{formatCents(grossCents)}</span>
            </div>

            <div className="flex justify-between items-center text-amber-400 text-[11px]">
              <span>Stripe / PayPal Gateway Fee:</span>
              <span className="tabular-nums">-{formatCents(feeCents)}</span>
            </div>

            {taxCents > 0 && (
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Tax/VAT Reserved:</span>
                <span className="tabular-nums">-{formatCents(taxCents)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-700/80 flex justify-between items-center text-emerald-400 font-bold text-sm">
              <span className="font-sans">Net Payout Credited:</span>
              <span className="tabular-nums">{formatCents(netCents)}</span>
            </div>
          </div>

          {primaryTx && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>TX: {primaryTx.provider_transaction_id}</span>
              <span className="text-emerald-400">Settlement Verified ✓</span>
            </div>
          )}
        </div>

        {/* Live Client Engagement Radar & Dunning Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              CLIENT ENGAGEMENT RADAR & AUDIT LOG
            </span>
            <span className="text-[10px] text-purple-300 font-mono">Real-Time Telemetry</span>
          </div>

          <div className="relative pl-6 space-y-4 border-l-2 border-slate-800 ml-2">
            {(invoice.events || []).map((ev) => (
              <div key={ev.id} className="relative group">
                {/* Stepper Dot */}
                <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-vault-900 border-2 border-purple-500 group-hover:scale-125 transition"></div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white capitalize text-xs">
                      {ev.event_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {ev.actor_email && <span>Actor: {ev.actor_email}</span>}
                    {ev.ip_city && <span> • {ev.ip_city}</span>}
                  </p>

                  {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                    <div className="p-2 rounded bg-vault-950 border border-slate-800/80 font-mono text-[10px] text-slate-400 mt-1 space-y-0.5">
                      {Object.entries(ev.metadata).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-slate-300 truncate max-w-[200px]">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contractual Late Fee Notice & Waiver */}
        {invoice.late_fee_cents > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Late Fee Accrued: {formatCents(invoice.late_fee_cents)}
              </span>
              <button
                onClick={handleWaiveLateFee}
                className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-[11px] transition"
              >
                Waive as Courtesy
              </button>
            </div>
            <p className="text-[11px] text-rose-400/90">
              Contractual late fee accrued after the 5-day grace period. One-click waiver preserves client goodwill.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions Drawer */}
      <div className="p-4 border-t border-slate-800 bg-vault-850 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Trigger Polite Dunning */}
          <button
            onClick={handleTriggerDunning}
            disabled={invoice.status === 'paid' || isDunningTriggering}
            className="py-2 px-3 rounded-lg border border-slate-700 bg-vault-800 hover:bg-vault-750 disabled:opacity-40 text-slate-200 font-medium text-xs transition flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Send Polite Dunning</span>
          </button>

          {/* Issue Refund / Credit Note */}
          <button
            onClick={() => setIsRefunding(!isRefunding)}
            disabled={invoice.status === 'refunded'}
            className="py-2 px-3 rounded-lg border border-slate-700 bg-vault-800 hover:bg-vault-750 disabled:opacity-40 text-slate-200 font-medium text-xs transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Credit Note / Refund</span>
          </button>
        </div>

        {/* Refund Form Drawer */}
        {isRefunding && (
          <div className="p-3 rounded-xl bg-vault-950 border border-slate-700 space-y-2 animate-fade-in text-xs">
            <span className="font-semibold text-rose-400 block">Issue Credit Note & Gateway Reversal</span>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for Credit Note..."
              className="w-full p-2 rounded bg-vault-900 border border-slate-700 text-white text-xs"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsRefunding(false)}
                className="px-2.5 py-1 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueRefund}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Confirm Full Refund ({formatCents(invoice.total_cents)})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
