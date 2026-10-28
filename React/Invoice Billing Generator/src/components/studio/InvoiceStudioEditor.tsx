import React, { useState } from 'react';
import {
  Invoice,
  Client,
  InvoiceLineItem,
  DocumentType,
  BillableTimeEntry,
  ReimbursableExpense
} from '../../types';
import { formatCents, calculateInvoiceTotals } from '../../utils/currency';
import { InvoiceStationeryPaper } from './InvoiceStationeryPaper';
import { UnbilledTimeExpenseModal } from './UnbilledTimeExpenseModal';
import {
  ArrowLeft,
  Send,
  Save,
  Eye,
  Plus,
  Trash2,
  Clock,
  Receipt,
  GripVertical,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Landmark,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface InvoiceStudioEditorProps {
  initialInvoice?: Invoice;
  clients: Client[];
  timeEntries: BillableTimeEntry[];
  expenses: ReimbursableExpense[];
  onSave: (invoice: Invoice) => void;
  onSend: (invoice: Invoice) => void;
  onPreviewPortal: (invoice: Invoice) => void;
  onBack: () => void;
}

export const InvoiceStudioEditor: React.FC<InvoiceStudioEditorProps> = ({
  initialInvoice,
  clients,
  timeEntries,
  expenses,
  onSave,
  onSend,
  onPreviewPortal,
  onBack,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialInvoice?.client_id || clients[0]?.id || ''
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const [documentType, setDocumentType] = useState<DocumentType>(
    initialInvoice?.document_type || 'invoice'
  );

  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialInvoice?.invoice_number ||
      (documentType === 'quote'
        ? `QTE-2026-${Math.floor(100 + Math.random() * 900)}`
        : `INV-2026-${Math.floor(100 + Math.random() * 900)}`)
  );

  const [issueDate, setIssueDate] = useState<string>(
    initialInvoice?.issue_date || new Date().toISOString().split('T')[0]
  );

  const [dueDate, setDueDate] = useState<string>(
    initialInvoice?.due_date ||
      new Date(Date.now() + (selectedClient?.payment_terms_days || 14) * 86400000)
        .toISOString()
        .split('T')[0]
  );

  const [currency, setCurrency] = useState<string>(initialInvoice?.currency || 'USD');
  const [notes, setNotes] = useState<string>(
    initialInvoice?.notes ||
      'Net 14 payment terms. Instant bank transfer (Stripe ACH) or card settlement accepted above.'
  );

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    initialInvoice?.line_items || [
      {
        id: 'li-new-1',
        invoice_id: 'new',
        title: 'Platform Architecture & Design System Implementation',
        description: 'Design token pipeline, responsive layout primitives, and component library.',
        quantity: 1,
        unit_price_cents: 485000,
        tax_rate_bps: 0,
        is_optional_addon: false,
        is_addon_selected: false,
        sort_order: 1,
      },
      {
        id: 'li-new-2',
        invoice_id: 'new',
        title: 'Multi-Rail Payment Gateway Integration (Stripe + PayPal)',
        description: 'Payment Elements, PayPal Smart Buttons, and automated reconciliation.',
        quantity: 1,
        unit_price_cents: 360000,
        tax_rate_bps: 0,
        is_optional_addon: false,
        is_addon_selected: false,
        sort_order: 2,
      },
      {
        id: 'li-new-3',
        invoice_id: 'new',
        title: 'Priority 48h Delivery & Penetration Audit SLA',
        description: 'Guaranteed 4-hour critical response SLA for launch window.',
        quantity: 1,
        unit_price_cents: 40000,
        tax_rate_bps: 0,
        is_optional_addon: true,
        is_addon_selected: false,
        sort_order: 3,
      }
    ]
  );

  const [discountCents, setDiscountCents] = useState<number>(initialInvoice?.discount_cents || 0);
  const [lateFeeCents, setLateFeeCents] = useState<number>(initialInvoice?.late_fee_cents || 0);

  // Rails & Margin Protection
  const [enabledRails, setEnabledRails] = useState(
    initialInvoice?.enabled_rails || {
      stripe_card: true,
      stripe_ach: true,
      paypal: true,
    }
  );

  const [passProcessingFee, setPassProcessingFee] = useState<boolean>(
    initialInvoice?.pass_processing_fee || false
  );

  const [earlyDiscountBps, setEarlyDiscountBps] = useState<number>(
    initialInvoice?.early_discount_bps || 200 // 2%
  );

  const [depositPercentage, setDepositPercentage] = useState<number | null>(
    initialInvoice?.deposit_percentage !== undefined ? initialInvoice.deposit_percentage : 50
  );

  const [isTimeExpenseModalOpen, setIsTimeExpenseModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Recalculate totals
  const totals = calculateInvoiceTotals(
    lineItems,
    discountCents,
    lateFeeCents,
    earlyDiscountBps,
    false
  );

  const currentInvoice: Invoice = {
    id: initialInvoice?.id || `inv-${Date.now()}`,
    invoice_number: invoiceNumber,
    public_token: initialInvoice?.public_token || `tok_live_${Date.now()}`,
    client_id: selectedClientId,
    client: selectedClient,
    document_type: documentType,
    status: initialInvoice?.status || 'draft',
    issue_date: issueDate,
    due_date: dueDate,
    currency,
    subtotal_cents: totals.subtotalCents,
    discount_cents: totals.discountCents,
    tax_cents: totals.taxCents,
    late_fee_cents: totals.lateFeeCents,
    total_cents: totals.totalCents,
    amount_paid_cents: initialInvoice?.amount_paid_cents || 0,
    amount_due_cents: Math.max(0, totals.totalCents - (initialInvoice?.amount_paid_cents || 0)),
    deposit_percentage: depositPercentage,
    enabled_rails: enabledRails,
    pass_processing_fee: passProcessingFee,
    early_discount_bps: earlyDiscountBps,
    notes,
    line_items: lineItems,
    events: initialInvoice?.events || [],
    transactions: initialInvoice?.transactions || [],
    created_at: initialInvoice?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Line item handlers
  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `li-${Date.now()}`,
        invoice_id: currentInvoice.id,
        title: 'New Service Deliverable',
        description: 'Description of scope or deliverable...',
        quantity: 1,
        unit_price_cents: 100000,
        tax_rate_bps: 0,
        is_optional_addon: false,
        is_addon_selected: false,
        sort_order: lineItems.length + 1,
      },
    ]);
  };

  const handleUpdateItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleImportItems = (newItems: Omit<InvoiceLineItem, 'id' | 'invoice_id'>[]) => {
    const formatted = newItems.map((item, idx) => ({
      ...item,
      id: `li-imported-${Date.now()}-${idx}`,
      invoice_id: currentInvoice.id,
    }));
    setLineItems([...lineItems, ...formatted]);
  };

  const handleSaveDraft = () => {
    onSave(currentInvoice);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSendInvoice = () => {
    const toSend = { ...currentInvoice, status: 'sent' as const };
    onSend(toSend);
  };

  return (
    <div className="flex flex-col h-screen bg-vault-950 overflow-hidden text-slate-100">
      {/* Top Studio Action Bar */}
      <header className="h-14 border-b border-slate-800 bg-vault-900 px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-vault-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Invoices</span>
            <span className="text-slate-600">/</span>
            <span className="font-mono font-semibold text-white">{invoiceNumber}</span>
          </div>

          {/* Document Type Switcher */}
          <div className="ml-4 p-0.5 rounded-lg bg-vault-950 border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => {
                setDocumentType('invoice');
                if (invoiceNumber.startsWith('QTE-')) setInvoiceNumber(invoiceNumber.replace('QTE-', 'INV-'));
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                documentType === 'invoice'
                  ? 'bg-vault-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📄 Invoice
            </button>
            <button
              onClick={() => {
                setDocumentType('quote');
                if (invoiceNumber.startsWith('INV-')) setInvoiceNumber(invoiceNumber.replace('INV-', 'QTE-'));
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                documentType === 'quote'
                  ? 'bg-purple-900/60 text-purple-200 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✨ Interactive Quote
            </button>
          </div>

          {/* Autosave Status */}
          <span className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 ml-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {isSaved ? 'Saved Draft ✓' : 'Autosaved'}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreviewPortal(currentInvoice)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-vault-800 hover:bg-vault-750 text-slate-200 text-xs font-medium transition"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Preview Client Portal</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-vault-800 hover:bg-vault-750 text-slate-200 text-xs font-medium transition"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleSendInvoice}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-stripe hover:bg-stripe-hover active:scale-95 text-white text-xs font-semibold shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {documentType === 'quote' ? 'Send Proposal' : 'Send Invoice'} ({formatCents(totals.totalCents, currency)}) ↵
            </span>
          </button>
        </div>
      </header>

      {/* Split-Screen Studio Stage */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Pane: Structured Billing Composer (48% width) */}
        <div className="w-full lg:w-[48%] border-r border-slate-800/80 bg-vault-900 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Client & Terms Block */}
          <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800 space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              CLIENT & PAYMENT TERMS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Client</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    const c = clients.find((client) => client.id === e.target.value);
                    if (c) {
                      setDueDate(
                        new Date(Date.now() + c.payment_terms_days * 86400000)
                          .toISOString()
                          .split('T')[0]
                      );
                    }
                  }}
                  className="w-full text-xs p-2 rounded-lg bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe font-mono"
                >
                  <option value="USD">USD ($ - United States Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe font-mono"
                />
              </div>
            </div>
          </div>

          {/* Draggable Line Items Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                ITEMIZED SCOPE & OPTIONAL CLIENT ADD-ONS
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTimeExpenseModalOpen(true)}
                  className="text-xs text-stripe hover:underline flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  <span>Pull Unbilled Hours & Expenses</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition space-y-3 ${
                    item.is_optional_addon
                      ? 'bg-purple-950/20 border-purple-500/30'
                      : 'bg-vault-850/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-slate-600 mt-2 cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </span>

                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                        placeholder="Deliverable Title / Milestone..."
                        className="w-full text-xs font-semibold p-1.5 rounded bg-vault-950 border border-slate-800 text-white focus:outline-none focus:border-stripe"
                      />

                      <textarea
                        value={item.description || ''}
                        onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                        placeholder="Deliverable description, repo link, or scope breakdown..."
                        rows={2}
                        className="w-full text-[11px] p-1.5 rounded bg-vault-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-stripe"
                      />

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500 text-[11px]">Qty / Hrs:</label>
                          <input
                            type="number"
                            min="0.25"
                            step="0.5"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                            className="w-16 p-1 rounded bg-vault-950 border border-slate-800 text-white text-center font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500 text-[11px]">Rate ($):</label>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={(item.unit_price_cents || 0) / 100}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { unit_price_cents: Math.round(Number(e.target.value) * 100) })
                            }
                            className="w-24 p-1 rounded bg-vault-950 border border-slate-800 text-white text-right font-mono"
                          />
                        </div>

                        <div className="flex-1 text-right font-mono font-bold text-white tabular-nums">
                          {formatCents(Math.round(Number(item.quantity) * Number(item.unit_price_cents)))}
                        </div>
                      </div>

                      {/* Optional Add-On Toggle */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.is_optional_addon || false}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { is_optional_addon: e.target.checked })
                            }
                            className="rounded border-slate-700 text-purple-500 focus:ring-0"
                          />
                          <span className="text-[11px] font-medium text-purple-300">
                            ☆ Make Optional Client Upsell Add-On (Client can toggle during checkout)
                          </span>
                        </label>

                        {lineItems.length > 1 && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 transition p-1"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddItem}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 hover:bg-vault-850/40 text-xs font-medium text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Line Item</span>
            </button>
          </div>

          {/* Payment Rails & Margin Protection Card */}
          <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                PAYMENT RAILS & MARGIN PROTECTION
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACH Nudge Active
              </span>
            </div>

            {/* Gateway Toggles */}
            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-lg bg-vault-900 border border-emerald-500/30 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={enabledRails.stripe_ach}
                    onChange={(e) => setEnabledRails({ ...enabledRails, stripe_ach: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-emerald-300 block">
                      Stripe US ACH Direct Debit ($0 Fee)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Recommended rail. Caps fees at $5 max instead of 2.9% - 3.5%.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  $0 Fee
                </span>
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-vault-900 border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={enabledRails.stripe_card}
                    onChange={(e) => setEnabledRails({ ...enabledRails, stripe_card: e.target.checked })}
                    className="rounded text-stripe focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Stripe Cards, Apple Pay & Google Pay
                    </span>
                    <span className="text-[10px] text-slate-400">
                      2.9% + 30¢ standard card gateway fees.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">2.9% + 30¢</span>
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-vault-900 border border-slate-800 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={enabledRails.paypal}
                    onChange={(e) => setEnabledRails({ ...enabledRails, paypal: e.target.checked })}
                    className="rounded text-blue-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      PayPal Wallet, Pay Later & Venmo
                    </span>
                    <span className="text-[10px] text-slate-400">
                      3.49% + 49¢ standard merchant rate.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">3.49% + 49¢</span>
              </label>
            </div>

            {/* Smart Incentives */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Pass card/PayPal processing fee to client</span>
                <input
                  type="checkbox"
                  checked={passProcessingFee}
                  onChange={(e) => setPassProcessingFee(e.target.checked)}
                  className="rounded text-stripe focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">
                  Offer 2% Early Payment Discount ({formatCents(Math.round(totals.totalCents * 0.02))} off) if paid within 48h
                </span>
                <input
                  type="checkbox"
                  checked={earlyDiscountBps === 200}
                  onChange={(e) => setEarlyDiscountBps(e.target.checked ? 200 : 0)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">
                  Allow 50% Upfront Milestone Deposit ({formatCents(Math.round(totals.totalCents * 0.5))} due now)
                </span>
                <input
                  type="checkbox"
                  checked={depositPercentage === 50}
                  onChange={(e) => setDepositPercentage(e.target.checked ? 50 : null)}
                  className="rounded text-indigo-500 focus:ring-0"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Pane: Live 1:1 Digital Stationery Preview (52% width) */}
        <div className="w-full lg:w-[52%] bg-vault-950 bg-grid-dots overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
          <div className="w-full max-w-xl">
            <InvoiceStationeryPaper invoice={currentInvoice} />
          </div>
        </div>
      </div>

      {/* Unbilled Hours & Expenses Modal */}
      <UnbilledTimeExpenseModal
        isOpen={isTimeExpenseModalOpen}
        onClose={() => setIsTimeExpenseModalOpen(false)}
        clientId={selectedClientId}
        timeEntries={timeEntries}
        expenses={expenses}
        onImportItems={handleImportItems}
      />
    </div>
  );
};
