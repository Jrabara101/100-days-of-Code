import React, { useState, useEffect } from 'react';
import { Invoice, PaymentTransaction } from '../../types';
import { formatCents, formatBps } from '../../utils/currency';
import { InvoiceStationeryPaper } from '../studio/InvoiceStationeryPaper';
import { AchBankTransferDock } from './AchBankTransferDock';
import { StripeCheckoutDock } from './StripeCheckoutDock';
import { PayPalCheckoutDock } from './PayPalCheckoutDock';
import { ApiService } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Download,
  Printer,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Landmark,
  CreditCard,
  FileText,
  AlertCircle
} from 'lucide-react';

interface HostedClientPortalProps {
  invoice: Invoice;
  onInvoiceUpdated?: (updated: Invoice) => void;
  onBackToDashboard?: () => void;
}

export const HostedClientPortal: React.FC<HostedClientPortalProps> = ({
  invoice: initialInvoice,
  onInvoiceUpdated,
  onBackToDashboard,
}) => {
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice);
  const [activeRailTab, setActiveRailTab] = useState<'ach' | 'card' | 'paypal'>('ach');
  const [selectedMilestone, setSelectedMilestone] = useState<'deposit' | 'full'>('full');
  const [isEarlyDiscountSelected, setIsEarlyDiscountSelected] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<PaymentTransaction | null>(null);

  // Proposal electronic signature state
  const [signerName, setSignerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    setInvoice(initialInvoice);
  }, [initialInvoice]);

  // Log client view telemetry on portal mount
  useEffect(() => {
    ApiService.logEvent(invoice.id, {
      event_type: 'client_viewed',
      actor_email: invoice.client?.billing_email || 'client@external.domain',
      ip_city: 'San Francisco, CA',
      user_agent: navigator.userAgent,
      metadata: { referrer: document.referrer || 'direct_portal', timestamp: new Date().toISOString() },
    });
  }, [invoice.id]);

  // Calculate dynamic amount due based on milestone and early discount
  const fullTotalCents = invoice.total_cents;
  const depositCents = invoice.deposit_percentage
    ? Math.round((fullTotalCents * invoice.deposit_percentage) / 100)
    : fullTotalCents;

  const earlyDiscountSavingsCents =
    invoice.early_discount_bps > 0
      ? Math.round((fullTotalCents * invoice.early_discount_bps) / 10000)
      : 0;

  let currentChargeCents =
    selectedMilestone === 'deposit'
      ? depositCents
      : isEarlyDiscountSelected && activeRailTab === 'ach'
      ? Math.max(0, fullTotalCents - earlyDiscountSavingsCents)
      : fullTotalCents;

  // Toggle optional upsell add-on item
  const handleToggleAddon = async (lineItemId: string, checked: boolean) => {
    const updated = await ApiService.toggleAddon(invoice.id, lineItemId, checked);
    if (updated) {
      setInvoice(updated);
      onInvoiceUpdated?.(updated);
    }
  };

  // Process Stripe ACH payment
  const handlePayACH = async (bankName: string) => {
    setIsProcessing(true);
    try {
      const { invoice: updatedInv, transaction } = await ApiService.processStripePayment(
        invoice.id,
        'stripe_ach',
        currentChargeCents,
        bankName
      );
      setInvoice(updatedInv);
      setCompletedTx(transaction);
      onInvoiceUpdated?.(updatedInv);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Stripe Card payment
  const handlePayCard = async () => {
    setIsProcessing(true);
    try {
      const { invoice: updatedInv, transaction } = await ApiService.processStripePayment(
        invoice.id,
        'stripe_card',
        currentChargeCents
      );
      setInvoice(updatedInv);
      setCompletedTx(transaction);
      onInvoiceUpdated?.(updatedInv);

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process PayPal payment
  const handlePayPayPal = async () => {
    setIsProcessing(true);
    try {
      const orderId = `O-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const { invoice: updatedInv, transaction } = await ApiService.processPayPalPayment(
        invoice.id,
        orderId,
        currentChargeCents
      );
      setInvoice(updatedInv);
      setCompletedTx(transaction);
      onInvoiceUpdated?.(updatedInv);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quote / Proposal scope approval
  const handleApproveScope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) return;
    setIsSigning(true);
    try {
      const converted = await ApiService.convertQuoteToInvoice(invoice.id, signerName);
      if (converted) {
        setInvoice(converted);
        onInvoiceUpdated?.(converted);
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    ApiService.logEvent(invoice.id, {
      event_type: 'pdf_downloaded',
      actor_email: invoice.client?.billing_email,
      ip_city: 'Client Portal',
    });
    window.print();
  };

  const isPaid = invoice.status === 'paid';
  const isProcessingACH = invoice.status === 'processing_ach';
  const isSettledOrInTransit = isPaid || isProcessingACH;

  return (
    <div className="min-h-screen bg-vault-950 text-slate-100 flex flex-col font-sans select-text">
      {/* Top Trust & Verification Bar */}
      <header className="no-print h-14 border-b border-slate-800 bg-vault-900/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-2.5 py-1 rounded bg-vault-800 hover:bg-vault-750 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
            >
              <span>← Back to Command Center</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Invoice from Studio Hyperion LLC</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-vault-800 hover:bg-vault-750 text-slate-200 text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-vault-800 hover:bg-vault-750 text-slate-200 text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <span className="font-mono text-xs text-slate-400 px-2 py-1 bg-vault-950 rounded border border-slate-800">
            {invoice.currency}
          </span>
        </div>
      </header>

      {/* Main 2-Column Asymmetric Settlement Portal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Invoice & Upsell Section (58% width ~ 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quote Scope Approval Banner if document is Quote */}
          {invoice.document_type === 'quote' && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-vault-850 to-vault-850 border border-purple-500/40 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Approve Scope & Convert to Invoice</h3>
                  <p className="text-xs text-slate-400">
                    Signing this document converts the estimate into an active invoice and unlocks milestone deposit settlement.
                  </p>
                </div>
              </div>

              <form onSubmit={handleApproveScope} className="flex flex-wrap items-center gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Type full legal name to sign..."
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="flex-1 min-w-[200px] text-xs p-2.5 rounded-lg bg-vault-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={!signerName.trim() || isSigning}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-stripe hover:from-purple-500 hover:to-stripe-hover disabled:opacity-50 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSigning ? 'Securing Hash...' : 'Approve Scope & Sign'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Interactive Client Add-Ons Upsell Box */}
          {invoice.line_items.some((item) => item.is_optional_addon) && !isSettledOrInTransit && (
            <div className="p-4 rounded-xl border border-dashed border-purple-500/40 bg-purple-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  OPTIONAL CLIENT ADD-ONS & SERVICE ACCELERATORS
                </span>
                <span className="text-[11px] text-purple-300 font-mono">Click to include in scope</span>
              </div>

              <div className="space-y-2">
                {invoice.line_items
                  .filter((item) => item.is_optional_addon)
                  .map((addon) => (
                    <label
                      key={addon.id}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                        addon.is_addon_selected
                          ? 'bg-purple-900/40 border-purple-400 text-white shadow-sm'
                          : 'bg-vault-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 pr-2">
                        <input
                          type="checkbox"
                          checked={addon.is_addon_selected || false}
                          onChange={(e) => handleToggleAddon(addon.id, e.target.checked)}
                          className="rounded border-slate-700 text-purple-500 focus:ring-0 w-4 h-4"
                        />
                        <div>
                          <span className="font-semibold text-xs block">{addon.title}</span>
                          {addon.description && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {addon.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-purple-300 text-xs shrink-0">
                        +{formatCents(addon.unit_price_cents, invoice.currency)}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {/* Milestone Payment Selector */}
          {invoice.deposit_percentage && !isSettledOrInTransit && (
            <div className="p-4 rounded-xl bg-vault-850/80 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                CHOOSE PAYMENT SCHEDULE
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* 50% Deposit */}
                <button
                  type="button"
                  onClick={() => setSelectedMilestone('deposit')}
                  className={`p-3 rounded-lg border text-left transition ${
                    selectedMilestone === 'deposit'
                      ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                      : 'bg-vault-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">Pay 50% Milestone Deposit</span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  </div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {formatCents(depositCents, invoice.currency)}
                  </div>
                  <span className="text-[10px] text-slate-500">Remaining 50% due upon deliverable completion</span>
                </button>

                {/* 100% Full Balance + Early Discount */}
                <button
                  type="button"
                  onClick={() => setSelectedMilestone('full')}
                  className={`p-3 rounded-lg border text-left transition ${
                    selectedMilestone === 'full'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                      : 'bg-vault-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-emerald-300">Pay Full Balance</span>
                    {earlyDiscountSavingsCents > 0 && (
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                        Save {formatCents(earlyDiscountSavingsCents)}
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold font-mono text-white mt-1">
                    {formatCents(
                      isEarlyDiscountSelected && activeRailTab === 'ach'
                        ? fullTotalCents - earlyDiscountSavingsCents
                        : fullTotalCents,
                      invoice.currency
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">One-time payment in full</span>
                </button>
              </div>
            </div>
          )}

          {/* 1:1 High-Craft Stationery Invoice Sheet */}
          <InvoiceStationeryPaper
            invoice={invoice}
            isEarlyDiscountApplied={isEarlyDiscountSelected && activeRailTab === 'ach'}
          />
        </div>

        {/* Right Column: Sticky Multi-Rail Payment Dock (42% width ~ 5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="rounded-2xl border border-slate-800 bg-vault-850 p-6 shadow-2xl space-y-5">
            {/* Payment Summary Header */}
            <div className="space-y-1 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Amount Due</span>
                <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                  256-Bit TLS Direct
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                {formatCents(currentChargeCents, invoice.currency)}
              </div>
              {selectedMilestone === 'deposit' && (
                <div className="text-xs text-indigo-300 font-medium">
                  50% Upfront Milestone Deposit
                </div>
              )}
            </div>

            {/* If Invoice Already Paid or in ACH Transit */}
            {isSettledOrInTransit ? (
              <div className="p-5 rounded-xl bg-vault-900 border border-slate-800 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isPaid ? 'Invoice Settled in Full' : 'ACH Transfer in Transit'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {isPaid
                      ? 'Payment has been confirmed. A tamper-evident cryptographic receipt has been generated.'
                      : 'Your bank transfer is clearing via Stripe Financial Connections (Est. 2-3 business days). Dunning reminders are paused.'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-vault-950 border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1 text-left">
                  <div className="flex justify-between">
                    <span>Transaction Hash:</span>
                    <span className="text-slate-200">
                      {completedTx?.provider_transaction_id || invoice.transactions?.[0]?.provider_transaction_id || 'pi_3Q89KlZ90vX2'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Settled Amount:</span>
                    <span className="text-emerald-400 font-bold">
                      {formatCents(invoice.total_cents, invoice.currency)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 rounded-lg bg-vault-800 hover:bg-vault-750 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span>Download Tamper-Evident Receipt (PDF)</span>
                </button>
              </div>
            ) : (
              /* Active Multi-Rail Checkout Selector */
              <div className="space-y-4">
                {/* 3-Way Segmented Control Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-vault-950 rounded-xl border border-slate-800 text-xs font-medium">
                  {/* ACH Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveRailTab('ach')}
                    className={`py-2 px-1 rounded-lg transition flex flex-col items-center justify-center gap-1 ${
                      activeRailTab === 'ach'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-[11px]">Bank ACH</span>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded">
                      $0 Fee
                    </span>
                  </button>

                  {/* Card Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveRailTab('card')}
                    className={`py-2 px-1 rounded-lg transition flex flex-col items-center justify-center gap-1 ${
                      activeRailTab === 'card'
                        ? 'bg-stripe/20 text-stripe-light border border-stripe/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-stripe" />
                      <span className="font-semibold text-[11px]">Card / Apple</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">Instant</span>
                  </button>

                  {/* PayPal Tab */}
                  <button
                    type="button"
                    onClick={() => setActiveRailTab('paypal')}
                    className={`py-2 px-1 rounded-lg transition flex flex-col items-center justify-center gap-1 ${
                      activeRailTab === 'paypal'
                        ? 'bg-blue-950/60 text-blue-300 border border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[11px]">🅿️ PayPal</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">Pay in 4</span>
                  </button>
                </div>

                {/* Tab 1: Stripe ACH */}
                {activeRailTab === 'ach' && (
                  <AchBankTransferDock
                    amountCents={currentChargeCents}
                    currency={invoice.currency}
                    onPay={handlePayACH}
                    isProcessing={isProcessing}
                    savingsCents={24500}
                  />
                )}

                {/* Tab 2: Stripe Card */}
                {activeRailTab === 'card' && (
                  <StripeCheckoutDock
                    amountCents={currentChargeCents}
                    currency={invoice.currency}
                    onPay={handlePayCard}
                    isProcessing={isProcessing}
                    passFeeToClient={invoice.pass_processing_fee}
                  />
                )}

                {/* Tab 3: PayPal Smart Buttons */}
                {activeRailTab === 'paypal' && (
                  <PayPalCheckoutDock
                    amountCents={currentChargeCents}
                    currency={invoice.currency}
                    onPay={handlePayPayPal}
                    isProcessing={isProcessing}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
