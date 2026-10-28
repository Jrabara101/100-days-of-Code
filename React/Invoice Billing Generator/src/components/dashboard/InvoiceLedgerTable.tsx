import React, { useState } from 'react';
import { Invoice } from '../../types';
import { formatCents, formatRelativeDueDate } from '../../utils/currency';
import { StatusBadge } from '../common/Badge';
import {
  Search,
  ExternalLink,
  Copy,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  MoreVertical,
  Check
} from 'lucide-react';

interface InvoiceLedgerTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onOpenPortal: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
}

type FilterFacet = 'all' | 'needs_attention' | 'viewed' | 'processing' | 'paid' | 'drafts';

export const InvoiceLedgerTable: React.FC<InvoiceLedgerTableProps> = ({
  invoices,
  onSelectInvoice,
  onOpenPortal,
  onEditInvoice,
  onSendReminder,
}) => {
  const [filterFacet, setFilterFacet] = useState<FilterFacet>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopyLink = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const portalUrl = `${window.location.origin}/pay/${invoice.public_token}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedToken(invoice.id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Filter calculations
  const filteredInvoices = invoices.filter((inv) => {
    // Search query match
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.client?.company_name.toLowerCase().includes(query) ||
      inv.client?.billing_email.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Facet match
    switch (filterFacet) {
      case 'needs_attention':
        return inv.status === 'overdue';
      case 'viewed':
        return inv.status === 'viewed';
      case 'processing':
        return inv.status === 'processing_ach';
      case 'paid':
        return inv.status === 'paid';
      case 'drafts':
        return inv.status === 'draft' || inv.document_type === 'quote';
      default:
        return true;
    }
  });

  // Facet Counts
  const counts = {
    all: invoices.length,
    needs_attention: invoices.filter((i) => i.status === 'overdue').length,
    viewed: invoices.filter((i) => i.status === 'viewed').length,
    processing: invoices.filter((i) => i.status === 'processing_ach').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    drafts: invoices.filter((i) => i.status === 'draft' || i.document_type === 'quote').length,
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-vault-850/60 shadow-sm overflow-hidden">
      {/* Top Filter Bar & Search */}
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-vault-900/60">
        {/* Facet Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: 'all' as FilterFacet, label: 'All', count: counts.all },
            { id: 'needs_attention' as FilterFacet, label: 'Needs Attention', count: counts.needs_attention, alert: counts.needs_attention > 0 },
            { id: 'viewed' as FilterFacet, label: 'Viewed', count: counts.viewed },
            { id: 'processing' as FilterFacet, label: 'Processing', count: counts.processing },
            { id: 'paid' as FilterFacet, label: 'Paid', count: counts.paid },
            { id: 'drafts' as FilterFacet, label: 'Drafts & Quotes', count: counts.drafts },
          ].map((facet) => {
            const isActive = filterFacet === facet.id;
            return (
              <button
                key={facet.id}
                onClick={() => setFilterFacet(facet.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-vault-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-vault-800/40'
                }`}
              >
                <span>{facet.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    facet.alert
                      ? 'bg-rose-500/20 text-rose-300 font-semibold'
                      : isActive
                      ? 'bg-stripe/20 text-stripe-light'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {facet.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by invoice # or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-vault-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-stripe transition"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-vault-900/80 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider text-[11px] select-none">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Invoice #</th>
              <th className="py-2.5 px-4 font-semibold">Client</th>
              <th className="py-2.5 px-4 font-semibold">Status & Telemetry</th>
              <th className="py-2.5 px-4 font-semibold">Timeline</th>
              <th className="py-2.5 px-4 font-semibold text-right">Gross Total</th>
              <th className="py-2.5 px-4 font-semibold text-right">Gateway & Net</th>
              <th className="py-2.5 px-4 font-semibold text-center w-28">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No invoices matched the selected filter or query.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const relativeDue = formatRelativeDueDate(inv.due_date);
                const hasViewEvent = inv.events?.some((e) => e.event_type === 'client_viewed');
                const lastEvent = inv.events?.[0];

                // Calculate Net estimate
                const primaryTx = inv.transactions?.[0];
                const netAmount = primaryTx ? primaryTx.net_amount_cents : inv.total_cents - Math.round(inv.total_cents * 0.015);

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-vault-800/40 transition cursor-pointer group h-11"
                  >
                    {/* Invoice # */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-200 group-hover:text-stripe-light transition">
                          {inv.invoice_number}
                        </span>
                        {inv.document_type === 'quote' && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            Proposal
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        {inv.client?.avatar_url ? (
                          <img
                            src={inv.client.avatar_url}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-300">
                            {inv.client?.company_name?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div className="truncate max-w-[170px]">
                          <span className="font-medium text-slate-200 block truncate">
                            {inv.client?.company_name || 'Acme Corp'}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {inv.client?.contact_name || inv.client?.billing_email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status & Telemetry */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={inv.status} size="sm" />
                        {hasViewEvent && inv.status !== 'paid' && (
                          <span className="text-[10px] font-mono text-purple-300 flex items-center gap-1 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            <Eye className="w-3 h-3 text-purple-400" />
                            Viewed
                          </span>
                        )}
                        {inv.late_fee_cents > 0 && inv.status === 'overdue' && (
                          <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            +$50 Late Fee
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Timeline */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="text-[11px]">
                        <span
                          className={`font-medium ${
                            relativeDue.isOverdue
                              ? 'text-rose-400 font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          {relativeDue.label}
                        </span>
                        <span className="text-slate-500 block text-[10px]">
                          Due {new Date(inv.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </td>

                    {/* Gross Total */}
                    <td className="py-2 px-4 whitespace-nowrap text-right">
                      <span className="font-mono font-bold text-slate-100 tabular-nums">
                        {formatCents(inv.total_cents, inv.currency)}
                      </span>
                      {inv.amount_paid_cents > 0 && inv.status !== 'paid' && (
                        <div className="text-[10px] font-mono text-emerald-400">
                          {formatCents(inv.amount_paid_cents)} paid
                        </div>
                      )}
                    </td>

                    {/* Gateway & Net */}
                    <td className="py-2 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono text-slate-400 tabular-nums text-[11px]">
                          {formatCents(netAmount, inv.currency)} Net
                        </span>
                        {inv.status === 'paid' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {primaryTx?.provider === 'stripe'
                          ? primaryTx.payment_method_type === 'us_bank_account'
                            ? 'Stripe ACH ($0 fee)'
                            : 'Stripe Card (2.9%)'
                          : primaryTx?.provider === 'paypal'
                          ? 'PayPal Commerce'
                          : 'ACH / Stripe / PP'}
                      </span>
                    </td>

                    {/* Quick Hover Actions */}
                    <td className="py-2 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100 transition">
                        <button
                          title="Copy Hosted Pay Link"
                          onClick={(e) => handleCopyLink(inv, e)}
                          className="p-1 rounded hover:bg-vault-750 text-slate-400 hover:text-white transition"
                        >
                          {copiedToken === inv.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          title="Open Hosted Client Checkout Portal"
                          onClick={() => onOpenPortal(inv)}
                          className="p-1 rounded hover:bg-vault-750 text-slate-400 hover:text-stripe-light transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          title="Inspect Telemetry & Waterfall"
                          onClick={() => onSelectInvoice(inv)}
                          className="p-1 rounded hover:bg-vault-750 text-slate-400 hover:text-purple-300 transition"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
