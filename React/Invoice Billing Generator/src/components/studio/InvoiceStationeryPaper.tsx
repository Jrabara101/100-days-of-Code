import React from 'react';
import { Invoice } from '../../types';
import { formatCents, formatBps } from '../../utils/currency';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, CheckCircle2, Zap, ArrowDownRight, CreditCard, Landmark } from 'lucide-react';

interface InvoiceStationeryPaperProps {
  invoice: Invoice;
  isEarlyDiscountApplied?: boolean;
  className?: string;
}

export const InvoiceStationeryPaper: React.FC<InvoiceStationeryPaperProps> = ({
  invoice,
  isEarlyDiscountApplied = false,
  className = '',
}) => {
  const checkoutUrl = `${window.location.origin}/pay/${invoice.public_token}`;
  const isPaid = invoice.status === 'paid';
  const isACHProcessing = invoice.status === 'processing_ach';

  return (
    <div
      className={`print-invoice-sheet relative bg-white text-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-900/5 p-8 sm:p-10 font-sans select-text overflow-hidden ${className}`}
      style={{ minHeight: '800px' }}
    >
      {/* Cryptographic "PAID" Stamp Slam Animation */}
      {isPaid && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none select-none animate-stamp-slam">
          <div className="border-4 border-emerald-600 text-emerald-700 font-mono font-black text-2xl sm:text-3xl tracking-widest px-6 py-2.5 rounded-lg uppercase shadow-lg bg-emerald-50/90 backdrop-blur-sm flex flex-col items-center rotate-[-10deg]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 stroke-[3]" />
              <span>PAID IN FULL</span>
            </div>
            <span className="text-[10px] tracking-normal font-sans font-medium text-emerald-800 mt-0.5">
              SETTLED VIA MULTI-RAIL • SECURE HASH: {invoice.transactions?.[0]?.provider_transaction_id || 'pi_3Q89KlZ90vX2'}
            </span>
          </div>
        </div>
      )}

      {/* ACH In Transit Watermark */}
      {isACHProcessing && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none select-none">
          <div className="border-2 border-dashed border-blue-500 text-blue-700 font-mono font-bold text-xl tracking-wider px-5 py-2 rounded-lg uppercase bg-blue-50/90 rotate-[-8deg] flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></span>
            <span>ACH CLEARING IN TRANSIT</span>
          </div>
        </div>
      )}

      {/* Top Header: Merchant & Document ID */}
      <div className="flex flex-wrap items-start justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold">
              <Zap className="w-4 h-4 text-stripe" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-950 font-display">
              Studio Hyperion LLC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            548 Market St, Suite 39201 • San Francisco, CA 94104<br />
            billing@hyperion.studio • US-EIN: 94-8291038
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">
            {invoice.document_type === 'quote'
              ? 'PROPOSAL / ESTIMATE'
              : invoice.document_type === 'credit_note'
              ? 'CREDIT NOTE'
              : 'TAX INVOICE'}
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-0.5">
            {invoice.invoice_number}
          </div>
          <div className="mt-2 text-xs text-slate-500 space-y-0.5">
            <div>Issue Date: <span className="font-medium text-slate-800">{invoice.issue_date}</span></div>
            <div>Payment Due: <span className="font-semibold text-slate-900">{invoice.due_date}</span></div>
          </div>
        </div>
      </div>

      {/* Bill To & QR Code Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-slate-200 text-xs">
        <div className="sm:col-span-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            BILLED TO:
          </span>
          <h4 className="text-sm font-bold text-slate-950">
            {invoice.client?.company_name || 'Client Corporation'}
          </h4>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            Attn: {invoice.client?.contact_name}<br />
            {invoice.client?.billing_email}<br />
            {invoice.client?.billing_address.line1}, {invoice.client?.billing_address.city}, {invoice.client?.billing_address.state} {invoice.client?.billing_address.postal_code}<br />
            {invoice.client?.tax_id_vat && (
              <span className="font-mono text-[11px] text-slate-500">Tax/VAT ID: {invoice.client.tax_id_vat}</span>
            )}
          </p>
        </div>

        {/* Scannable Checkout QR Code */}
        <div className="flex flex-col items-start sm:items-end justify-center">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
            <QRCodeSVG value={checkoutUrl} size={72} level="M" />
            <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-tight">
              Scan to Settle
            </span>
          </div>
        </div>
      </div>

      {/* Itemized Line Items Table */}
      <div className="py-6">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <th className="pb-2.5">Description & Scope</th>
              <th className="pb-2.5 text-center w-16">Qty</th>
              <th className="pb-2.5 text-right w-24">Rate</th>
              <th className="pb-2.5 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.line_items.map((item) => {
              const itemTotalCents = Math.round(Number(item.quantity) * Number(item.unit_price_cents));
              const isUnselectedAddon = item.is_optional_addon && !item.is_addon_selected;

              return (
                <tr key={item.id} className={isUnselectedAddon ? 'opacity-40 italic' : ''}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      {item.is_optional_addon && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                          {item.is_addon_selected ? '✓ Add-On Selected' : 'Optional Add-On'}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-center font-mono text-slate-600 tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-600 tabular-nums">
                    {formatCents(item.unit_price_cents, invoice.currency)}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                    {formatCents(itemTotalCents, invoice.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals & Mathematical Breakdown */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6 text-xs">
        <div className="max-w-xs space-y-2">
          {invoice.notes && (
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                PAYMENT TERMS & NOTES
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {invoice.notes}
              </p>
            </div>
          )}

          {invoice.early_discount_bps > 0 && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Early Payment Incentive:</span> Pay within 48h to save{' '}
                <span className="font-mono font-bold">{formatBps(invoice.early_discount_bps)}</span> via Stripe ACH transfer.
              </div>
            </div>
          )}
        </div>

        {/* Numerical Waterfall */}
        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono tabular-nums">{formatCents(invoice.subtotal_cents, invoice.currency)}</span>
          </div>

          {invoice.discount_cents > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount:</span>
              <span className="font-mono tabular-nums">-{formatCents(invoice.discount_cents, invoice.currency)}</span>
            </div>
          )}

          {invoice.tax_cents > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax (VAT/GST):</span>
              <span className="font-mono tabular-nums">{formatCents(invoice.tax_cents, invoice.currency)}</span>
            </div>
          )}

          {invoice.late_fee_cents > 0 && (
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Late Fee (Contractual):</span>
              <span className="font-mono tabular-nums">+{formatCents(invoice.late_fee_cents, invoice.currency)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline text-slate-950 font-bold">
            <span className="text-sm">Total:</span>
            <span className="text-lg font-mono tabular-nums">{formatCents(invoice.total_cents, invoice.currency)}</span>
          </div>

          {invoice.amount_paid_cents > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium text-[11px]">
              <span>Amount Paid:</span>
              <span className="font-mono tabular-nums">-{formatCents(invoice.amount_paid_cents, invoice.currency)}</span>
            </div>
          )}

          <div className="p-2 rounded bg-slate-900 text-white flex justify-between items-baseline font-bold mt-2">
            <span className="text-xs uppercase tracking-wider">Amount Due:</span>
            <span className="text-base font-mono tabular-nums text-emerald-400">
              {formatCents(invoice.amount_due_cents, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Rail Settlement Footer Badges */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
            ACCEPTED SETTLEMENT RAILS:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium flex items-center gap-1 text-[10px]">
              <Landmark className="w-3 h-3 text-emerald-600" />
              ACH ($0 Fee)
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium flex items-center gap-1 text-[10px]">
              <CreditCard className="w-3 h-3 text-stripe" />
              Cards / Apple Pay
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[10px]">
              🅿️ PayPal / Venmo
            </span>
          </div>
        </div>

        <div className="font-mono text-[10px] text-slate-400">
          Ref: {invoice.public_token.substring(0, 16)} • Instant TLS Receipt
        </div>
      </div>
    </div>
  );
};
