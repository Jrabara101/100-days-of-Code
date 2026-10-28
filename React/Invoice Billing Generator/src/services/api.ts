import { Invoice, Client, InvoiceEvent, PaymentTransaction, BillableTimeEntry, ReimbursableExpense, InvoiceLineItem } from '../types';
import { mockInvoices, mockClients, mockBillableTimeEntries, mockReimbursableExpenses } from '../data/mockData';
import { calculateInvoiceTotals, calculateGatewayBreakdown } from '../utils/currency';

const STORAGE_KEY_INVOICES = 'ledgercraft_invoices_v1';
const STORAGE_KEY_CLIENTS = 'ledgercraft_clients_v1';
const STORAGE_KEY_TIMES = 'ledgercraft_time_entries_v1';
const STORAGE_KEY_EXPENSES = 'ledgercraft_expenses_v1';

function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEY_INVOICES)) {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(mockInvoices));
  }
  if (!localStorage.getItem(STORAGE_KEY_CLIENTS)) {
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(mockClients));
  }
  if (!localStorage.getItem(STORAGE_KEY_TIMES)) {
    localStorage.setItem(STORAGE_KEY_TIMES, JSON.stringify(mockBillableTimeEntries));
  }
  if (!localStorage.getItem(STORAGE_KEY_EXPENSES)) {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(mockReimbursableExpenses));
  }
}

initializeStorage();

export class ApiService {
  private static getStored<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Failed to read from localStorage key: ${key}`, e);
      return fallback;
    }
  }

  private static setStored<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to write to localStorage key: ${key}`, e);
    }
  }

  // Invoices API
  static async getInvoices(): Promise<Invoice[]> {
    return this.getStored<Invoice[]>(STORAGE_KEY_INVOICES, mockInvoices);
  }

  static async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    return invoices.find((inv) => inv.id === id) || null;
  }

  static async getInvoiceByToken(public_token: string): Promise<Invoice | null> {
    const invoices = await this.getInvoices();
    const invoice = invoices.find((inv) => inv.public_token === public_token);
    
    if (invoice && invoice.status === 'sent') {
      // Record Client View Telemetry automatically
      await this.logEvent(invoice.id, {
        event_type: 'client_viewed',
        actor_email: invoice.client?.billing_email || 'client@external.domain',
        ip_city: 'Client Browser Session',
        user_agent: navigator.userAgent,
        metadata: { referrer: document.referrer || 'direct_link', timestamp: new Date().toISOString() },
      });
      // Transition to 'viewed'
      invoice.status = 'viewed';
      await this.saveInvoice(invoice);
    }

    return invoice || null;
  }

  static async saveInvoice(invoice: Invoice): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const index = invoices.findIndex((inv) => inv.id === invoice.id);
    
    // Recalculate totals
    const { subtotalCents, taxCents, discountCents, lateFeeCents, totalCents } = calculateInvoiceTotals(
      invoice.line_items,
      invoice.discount_cents,
      invoice.late_fee_cents,
      invoice.early_discount_bps,
      false
    );

    const updatedInvoice: Invoice = {
      ...invoice,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      discount_cents: discountCents,
      late_fee_cents: lateFeeCents,
      total_cents: totalCents,
      amount_due_cents: Math.max(0, totalCents - (invoice.amount_paid_cents || 0)),
      updated_at: new Date().toISOString(),
    };

    if (index >= 0) {
      invoices[index] = updatedInvoice;
    } else {
      invoices.unshift(updatedInvoice);
    }

    this.setStored(STORAGE_KEY_INVOICES, invoices);
    return updatedInvoice;
  }

  // Toggle optional upsell add-on line item
  static async toggleAddon(invoiceId: string, lineItemId: string, isSelected: boolean): Promise<Invoice | null> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) return null;

    const item = invoice.line_items.find((i) => i.id === lineItemId);
    if (item && item.is_optional_addon) {
      item.is_addon_selected = isSelected;

      // Recalculate totals
      const { subtotalCents, taxCents, discountCents, lateFeeCents, totalCents } = calculateInvoiceTotals(
        invoice.line_items,
        invoice.discount_cents,
        invoice.late_fee_cents,
        invoice.early_discount_bps,
        false
      );

      invoice.subtotal_cents = subtotalCents;
      invoice.tax_cents = taxCents;
      invoice.discount_cents = discountCents;
      invoice.late_fee_cents = lateFeeCents;
      invoice.total_cents = totalCents;
      invoice.amount_due_cents = Math.max(0, totalCents - (invoice.amount_paid_cents || 0));

      await this.logEvent(invoiceId, {
        event_type: 'addon_toggled',
        actor_email: invoice.client?.billing_email || 'client',
        ip_city: 'Client Portal',
        metadata: {
          line_item_title: item.title,
          is_selected: isSelected,
          unit_price_cents: item.unit_price_cents,
          new_total_cents: totalCents,
        },
      });

      return await this.saveInvoice(invoice);
    }
    return invoice;
  }

  // Atomic Quote-to-Invoice Conversion
  static async convertQuoteToInvoice(quoteId: string, signerName: string): Promise<Invoice | null> {
    const invoice = await this.getInvoiceById(quoteId);
    if (!invoice || invoice.document_type !== 'quote') return null;

    const newInvoiceNumber = invoice.invoice_number.replace('QTE-', 'INV-');
    invoice.document_type = 'invoice';
    invoice.invoice_number = newInvoiceNumber;
    invoice.status = 'viewed';
    invoice.notes = `${invoice.notes || ''}\nApproved and signed by ${signerName} on ${new Date().toLocaleDateString()}`;

    await this.logEvent(invoice.id, {
      event_type: 'created',
      actor_email: invoice.client?.billing_email,
      ip_city: 'Electronic Signature Node',
      metadata: {
        action: 'quote_scope_approved',
        signer_name: signerName,
        converted_to: newInvoiceNumber,
      },
    });

    return await this.saveInvoice(invoice);
  }

  // Waive Contractual Late Fee
  static async waiveLateFee(invoiceId: string): Promise<Invoice | null> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) return null;

    const waivedAmount = invoice.late_fee_cents;
    invoice.late_fee_cents = 0;

    await this.logEvent(invoiceId, {
      event_type: 'late_fee_waived',
      actor_email: 'finance@hyperion.studio',
      ip_city: 'Back-Office Command',
      metadata: { waived_cents: waivedAmount, reason: 'Merchant Courtesy Waiver' },
    });

    return await this.saveInvoice(invoice);
  }

  // Webhook-Aware Polite Dunning Trigger
  static async triggerDunningReminder(invoiceId: string, stageName: string): Promise<Invoice | null> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) return null;

    // Dunning Auto-Pause Guardrail:
    if (invoice.status === 'paid' || invoice.status === 'processing_ach') {
      console.warn(`Dunning paused automatically for invoice ${invoice.invoice_number} because status is ${invoice.status}`);
      return invoice;
    }

    await this.logEvent(invoiceId, {
      event_type: 'dunning_sent',
      actor_email: invoice.client?.billing_email,
      ip_city: 'Polite Dunning Daemon',
      metadata: {
        stage: stageName,
        amount_due_cents: invoice.amount_due_cents,
        auto_pause_guardrail_active: true,
      },
    });

    return invoice;
  }

  // Process Stripe Multi-Rail Payment (Cards, US ACH, Apple Pay)
  static async processStripePayment(
    invoiceId: string,
    rail: 'stripe_card' | 'stripe_ach',
    grossCents: number,
    bankName?: string
  ): Promise<{ invoice: Invoice; transaction: PaymentTransaction }> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const breakdown = calculateGatewayBreakdown(grossCents, rail, invoice.pass_processing_fee);
    const txId = `pi_3Q${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const isAch = rail === 'stripe_ach';

    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}`,
      invoice_id: invoiceId,
      provider: 'stripe',
      provider_transaction_id: txId,
      payment_method_type: isAch ? 'us_bank_account' : 'card',
      gross_amount_cents: grossCents,
      gateway_fee_cents: breakdown.feeCents,
      net_amount_cents: breakdown.netPayoutCents,
      currency: invoice.currency,
      status: isAch ? 'processing' : 'succeeded',
      receipt_url: `https://pay.stripe.com/receipts/acct_hyperion/${txId}`,
      raw_webhook_payload: {
        id: `evt_test_${Date.now()}`,
        type: isAch ? 'payment_intent.processing' : 'payment_intent.succeeded',
        fee_details: { fee_cents: breakdown.feeCents, net_cents: breakdown.netPayoutCents },
        bank_name: bankName || 'Connected Institution',
      },
      settled_at: isAch ? undefined : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    invoice.transactions = [newTx, ...(invoice.transactions || [])];

    if (isAch) {
      invoice.status = 'processing_ach';
    } else {
      invoice.amount_paid_cents = (invoice.amount_paid_cents || 0) + grossCents;
      invoice.amount_due_cents = Math.max(0, invoice.total_cents - invoice.amount_paid_cents);
      if (invoice.amount_due_cents === 0) {
        invoice.status = 'paid';
        invoice.paid_at = new Date().toISOString();
      } else {
        invoice.status = 'partially_paid';
      }
    }

    // Mutual Exclusion Lock: Invalidate any open PayPal session
    // Cross-Gateway Safeguard:
    invoice.events = invoice.events || [];
    invoice.events.unshift({
      id: `ev_${Date.now()}`,
      invoice_id: invoiceId,
      event_type: isAch ? 'payment_initiated' : 'payment_succeeded',
      actor_email: invoice.client?.billing_email || 'client',
      ip_city: 'Stripe Payment Element',
      metadata: {
        rail,
        provider_transaction_id: txId,
        gross_amount_cents: grossCents,
        gateway_fee_cents: breakdown.feeCents,
        cross_gateway_lock: 'PayPal orders invalidated',
      },
      created_at: new Date().toISOString(),
    });

    const savedInvoice = await this.saveInvoice(invoice);
    return { invoice: savedInvoice, transaction: newTx };
  }

  // Process PayPal Smart Buttons Payment
  static async processPayPalPayment(
    invoiceId: string,
    orderId: string,
    grossCents: number
  ): Promise<{ invoice: Invoice; transaction: PaymentTransaction }> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const breakdown = calculateGatewayBreakdown(grossCents, 'paypal', invoice.pass_processing_fee);
    const txId = `PAYID-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newTx: PaymentTransaction = {
      id: `tx_pp_${Date.now()}`,
      invoice_id: invoiceId,
      provider: 'paypal',
      provider_transaction_id: txId,
      payment_method_type: 'paypal_wallet',
      gross_amount_cents: grossCents,
      gateway_fee_cents: breakdown.feeCents,
      net_amount_cents: breakdown.netPayoutCents,
      currency: invoice.currency,
      status: 'succeeded',
      receipt_url: `https://www.paypal.com/activity/payment/${txId}`,
      raw_webhook_payload: {
        order_id: orderId,
        seller_receivable_breakdown: {
          gross_amount: { value: (grossCents / 100).toFixed(2), currency_code: invoice.currency },
          paypal_fee: { value: (breakdown.feeCents / 100).toFixed(2), currency_code: invoice.currency },
          net_amount: { value: (breakdown.netPayoutCents / 100).toFixed(2), currency_code: invoice.currency },
        },
      },
      settled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    invoice.transactions = [newTx, ...(invoice.transactions || [])];
    invoice.amount_paid_cents = (invoice.amount_paid_cents || 0) + grossCents;
    invoice.amount_due_cents = Math.max(0, invoice.total_cents - invoice.amount_paid_cents);

    if (invoice.amount_due_cents === 0) {
      invoice.status = 'paid';
      invoice.paid_at = new Date().toISOString();
    } else {
      invoice.status = 'partially_paid';
    }

    invoice.events = invoice.events || [];
    invoice.events.unshift({
      id: `ev_${Date.now()}`,
      invoice_id: invoiceId,
      event_type: 'payment_succeeded',
      actor_email: invoice.client?.billing_email || 'client',
      ip_city: 'PayPal Checkout Gateway',
      metadata: {
        provider: 'paypal',
        paypal_order_id: orderId,
        provider_transaction_id: txId,
        fee_cents: breakdown.feeCents,
      },
      created_at: new Date().toISOString(),
    });

    const savedInvoice = await this.saveInvoice(invoice);
    return { invoice: savedInvoice, transaction: newTx };
  }

  // Issue Credit Note or Refund
  static async issueRefund(
    invoiceId: string,
    refundCents: number,
    reason: string
  ): Promise<{ invoice: Invoice; creditNote: Invoice }> {
    const invoice = await this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    const creditNoteNumber = `CN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const creditNote: Invoice = {
      id: `cn-${Date.now()}`,
      invoice_number: creditNoteNumber,
      public_token: `tok_cn_${Date.now()}`,
      client_id: invoice.client_id,
      client: invoice.client,
      document_type: 'credit_note',
      status: 'refunded',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      currency: invoice.currency,
      subtotal_cents: -refundCents,
      discount_cents: 0,
      tax_cents: 0,
      late_fee_cents: 0,
      total_cents: -refundCents,
      amount_paid_cents: -refundCents,
      amount_due_cents: 0,
      enabled_rails: invoice.enabled_rails,
      pass_processing_fee: false,
      early_discount_bps: 0,
      notes: `Credit Note against ${invoice.invoice_number}. Reason: ${reason}`,
      line_items: [
        {
          id: `cn-li-${Date.now()}`,
          invoice_id: `cn-${Date.now()}`,
          title: `Refund for ${invoice.invoice_number}: ${reason}`,
          quantity: 1,
          unit_price_cents: -refundCents,
          tax_rate_bps: 0,
          sort_order: 1,
        }
      ],
      events: [
        {
          id: `ev_cn_${Date.now()}`,
          invoice_id: `cn-${Date.now()}`,
          event_type: 'created',
          actor_email: 'finance@hyperion.studio',
          created_at: new Date().toISOString(),
        }
      ],
      transactions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    invoice.status = 'refunded';
    await this.logEvent(invoiceId, {
      event_type: 'payment_failed', // or refund event
      actor_email: 'finance@hyperion.studio',
      metadata: { action: 'refund_issued', credit_note_number: creditNoteNumber, refund_cents: refundCents },
    });

    await this.saveInvoice(creditNote);
    const updatedInvoice = await this.saveInvoice(invoice);

    return { invoice: updatedInvoice, creditNote };
  }

  // Telemetry Logger
  static async logEvent(invoiceId: string, event: Omit<InvoiceEvent, 'id' | 'invoice_id' | 'created_at'>): Promise<void> {
    const invoices = await this.getInvoices();
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const fullEvent: InvoiceEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      invoice_id: invoiceId,
      ...event,
      created_at: new Date().toISOString(),
    };

    invoice.events = [fullEvent, ...(invoice.events || [])];
    this.setStored(STORAGE_KEY_INVOICES, invoices);
  }

  // Clients
  static async getClients(): Promise<Client[]> {
    return this.getStored<Client[]>(STORAGE_KEY_CLIENTS, mockClients);
  }

  static async saveClient(client: Client): Promise<Client> {
    const clients = await this.getClients();
    const index = clients.findIndex((c) => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    this.setStored(STORAGE_KEY_CLIENTS, clients);
    return client;
  }

  // Billable Time & Expenses
  static async getBillableTime(): Promise<BillableTimeEntry[]> {
    return this.getStored<BillableTimeEntry[]>(STORAGE_KEY_TIMES, mockBillableTimeEntries);
  }

  static async getExpenses(): Promise<ReimbursableExpense[]> {
    return this.getStored<ReimbursableExpense[]>(STORAGE_KEY_EXPENSES, mockReimbursableExpenses);
  }

  static async resetToDefault(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY_INVOICES);
    localStorage.removeItem(STORAGE_KEY_CLIENTS);
    localStorage.removeItem(STORAGE_KEY_TIMES);
    localStorage.removeItem(STORAGE_KEY_EXPENSES);
    initializeStorage();
  }
}
