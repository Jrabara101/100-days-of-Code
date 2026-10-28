import React from 'react';
import { Invoice } from '../../types';
import { formatCents } from '../../utils/currency';
import { StatusBadge } from '../common/Badge';
import { FileSpreadsheet, ArrowRight, CheckCircle2, Send, ExternalLink, Sparkles } from 'lucide-react';

interface QuotesProposalsViewProps {
  quotes: Invoice[];
  onOpenQuote: (quote: Invoice) => void;
  onConvertQuote: (quote: Invoice) => void;
}

export const QuotesProposalsView: React.FC<QuotesProposalsViewProps> = ({
  quotes,
  onOpenQuote,
  onConvertQuote,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-vault-850 to-vault-850 border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Interactive Quotes & Dynamic Client Proposals</h2>
            <p className="text-xs text-slate-400">
              Deliver proposals as interactive web pages. When a client clicks "Approve Scope & Sign", documents atomically convert to Active Invoices.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-vault-900 border border-slate-800 text-xs text-slate-300 font-mono">
            100% Milestone Lock Ready
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((quote) => (
          <div
            key={quote.id}
            className="p-5 rounded-xl bg-vault-850/80 border border-slate-800 hover:border-purple-500/40 transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-300">
                    {quote.invoice_number}
                  </span>
                  <StatusBadge status={quote.status} size="sm" />
                </div>
                <h3 className="text-sm font-semibold text-white mt-1">
                  {quote.client?.company_name}
                </h3>
                <span className="text-xs text-slate-400">{quote.client?.contact_name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-white tabular-nums">
                  {formatCents(quote.total_cents, quote.currency)}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  50% Deposit: {formatCents(Math.round(quote.total_cents * 0.5))}
                </span>
              </div>
            </div>

            {/* Scope Items Preview */}
            <div className="p-3 rounded-lg bg-vault-900/60 border border-slate-800/80 space-y-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                INCLUDED SCOPE & MILESTONES
              </span>
              {quote.line_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-slate-300">
                  <span className="truncate pr-2">• {item.title}</span>
                  <span className="font-mono text-slate-400 shrink-0">
                    {formatCents(item.unit_price_cents)}
                  </span>
                </div>
              ))}
            </div>

            {/* Conversion Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
              <button
                onClick={() => onOpenQuote(quote)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Hosted Proposal</span>
              </button>

              <button
                onClick={() => onConvertQuote(quote)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-stripe hover:from-purple-500 hover:to-stripe-hover text-white text-xs font-medium rounded-lg shadow-sm transition active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulate Client Signing & Convert</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
