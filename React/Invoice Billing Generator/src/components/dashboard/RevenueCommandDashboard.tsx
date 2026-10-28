import React, { useState, useEffect } from 'react';
import { Invoice, Client, BillableTimeEntry, ReimbursableExpense } from '../../types';
import { SidebarNav, NavigationTab } from './SidebarNav';
import { MetricHorizonRibbon } from './MetricHorizonRibbon';
import { InvoiceLedgerTable } from './InvoiceLedgerTable';
import { ClientsDirectory } from './ClientsDirectory';
import { QuotesProposalsView } from './QuotesProposalsView';
import { PayoutsAndFeesView } from './PayoutsAndFeesView';
import { DunningRulesView } from './DunningRulesView';
import { SettlementAndWebhookInspector } from '../inspector/SettlementAndWebhookInspector';
import { formatCents } from '../../utils/currency';
import {
  Sparkles,
  Repeat,
  ShieldCheck,
  CreditCard,
  Landmark,
  ExternalLink,
  Plus,
  RefreshCw
} from 'lucide-react';
import { ApiService } from '../../services/api';

interface RevenueCommandDashboardProps {
  invoices: Invoice[];
  clients: Client[];
  timeEntries: BillableTimeEntry[];
  expenses: ReimbursableExpense[];
  onNewInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onOpenPortal: (invoice: Invoice) => void;
  onInvoiceUpdated: (updated: Invoice) => void;
  onResetData: () => void;
}

export const RevenueCommandDashboard: React.FC<RevenueCommandDashboardProps> = ({
  invoices,
  clients,
  timeEntries,
  expenses,
  onNewInvoice,
  onEditInvoice,
  onOpenPortal,
  onInvoiceUpdated,
  onResetData,
}) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('ledger');
  const [selectedInspectorInvoice, setSelectedInspectorInvoice] = useState<Invoice | null>(null);

  // Keyboard shortcut ⌘I / Ctrl+I to create new invoice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        onNewInvoice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewInvoice]);

  const quotes = invoices.filter((i) => i.document_type === 'quote');

  const handleConvertQuote = async (quote: Invoice) => {
    const converted = await ApiService.convertQuoteToInvoice(quote.id, 'Client Authorized Signer');
    if (converted) {
      onInvoiceUpdated(converted);
      setSelectedInspectorInvoice(converted);
    }
  };

  return (
    <div className="flex min-h-screen bg-vault-950 text-slate-100 font-sans select-none">
      {/* 240px Left Navigation Rail */}
      <SidebarNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onNewInvoice={onNewInvoice}
        invoiceCount={invoices.length}
        quotesCount={quotes.length}
      />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-vault-900/60 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-white capitalize font-display tracking-tight">
              {currentTab === 'ledger'
                ? 'Revenue & Receivables Command Center'
                : currentTab === 'quotes'
                ? 'Quotes & Interactive Client Proposals'
                : currentTab === 'retainers'
                ? 'Recurring Retainers & Auto-Pay Vault'
                : currentTab === 'clients'
                ? 'Clients & Billing Profiles'
                : currentTab === 'payouts'
                ? 'Payouts & Multi-Rail Fee Ledger'
                : 'Dunning & Late-Fee Guardrails'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[11px]">
              Multi-Rail Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onResetData}
              title="Reset state to default demo data"
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            <button
              onClick={onNewInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stripe hover:bg-stripe-hover text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {currentTab === 'ledger' && (
            <>
              {/* 4-Card Cashflow & Aging Horizon Ribbon */}
              <MetricHorizonRibbon
                invoices={invoices}
                onOpenTelemetryForInvoice={(inv) => setSelectedInspectorInvoice(inv)}
              />

              {/* High-Density Invoice Ledger Table */}
              <InvoiceLedgerTable
                invoices={invoices}
                onSelectInvoice={(inv) => setSelectedInspectorInvoice(inv)}
                onOpenPortal={(inv) => onOpenPortal(inv)}
                onEditInvoice={(inv) => onEditInvoice(inv)}
                onSendReminder={(inv) => setSelectedInspectorInvoice(inv)}
              />
            </>
          )}

          {currentTab === 'quotes' && (
            <QuotesProposalsView
              quotes={quotes}
              onOpenQuote={(q) => onOpenPortal(q)}
              onConvertQuote={handleConvertQuote}
            />
          )}

          {currentTab === 'retainers' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-vault-850/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">Recurring Retainers & Net-0 Auto-Charge</h2>
                    <p className="text-xs text-slate-400">
                      Vaulted customer cards and Stripe SetupIntents billed automatically on the 1st of each month with zero dunning friction.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                  3 Retainers Active ($14,500/mo)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-vault-850/60 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Acme Global Corporation</span>
                  <div className="text-xl font-bold font-mono text-white">$6,000.00 / mo</div>
                  <span className="text-[11px] text-emerald-400 font-mono block">
                    Stripe Card (•••• 4242) • Auto-Renews Nov 1
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-vault-850/60 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Monolith Financial AI</span>
                  <div className="text-xl font-bold font-mono text-white">$5,000.00 / mo</div>
                  <span className="text-[11px] text-emerald-400 font-mono block">
                    Stripe ACH (•••• 9012) • Auto-Renews Nov 1
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-vault-850/60 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">Pulse BioSystems</span>
                  <div className="text-xl font-bold font-mono text-white">$3,500.00 / mo</div>
                  <span className="text-[11px] text-emerald-400 font-mono block">
                    PayPal Recurring Vault • Auto-Renews Nov 1
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'clients' && <ClientsDirectory clients={clients} />}

          {currentTab === 'payouts' && <PayoutsAndFeesView invoices={invoices} />}

          {currentTab === 'dunning' && <DunningRulesView />}
        </main>
      </div>

      {/* Slide-Over Settlement & Webhook Inspector */}
      {selectedInspectorInvoice && (
        <SettlementAndWebhookInspector
          invoice={selectedInspectorInvoice}
          onClose={() => setSelectedInspectorInvoice(null)}
          onInvoiceUpdated={(updated) => {
            onInvoiceUpdated(updated);
            setSelectedInspectorInvoice(updated);
          }}
          onOpenPortal={(inv) => onOpenPortal(inv)}
        />
      )}
    </div>
  );
};
