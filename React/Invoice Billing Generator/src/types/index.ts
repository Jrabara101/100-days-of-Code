export type DocumentType = 'quote' | 'invoice' | 'credit_note';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'processing_ach'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'voided'
  | 'refunded';

export type PaymentRail = 'stripe_card' | 'stripe_ach' | 'paypal';

export type PaymentMethodType =
  | 'card'
  | 'us_bank_account'
  | 'apple_pay'
  | 'paypal_wallet'
  | 'venmo'
  | 'wire';

export type PaymentProvider = 'stripe' | 'paypal' | 'manual_wire';

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Client {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name: string;
  billing_email: string;
  cc_emails?: string[];
  tax_id_vat?: string;
  billing_address: BillingAddress;
  currency: string;
  stripe_customer_id?: string;
  paypal_payer_id?: string;
  payment_terms_days: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price_cents: number;
  tax_rate_bps: number; // e.g. 825 = 8.25%
  is_optional_addon?: boolean;
  is_addon_selected?: boolean;
  sort_order: number;
}

export interface EnabledPaymentRails {
  stripe_card: boolean;
  stripe_ach: boolean;
  paypal: boolean;
}

export interface InvoiceEvent {
  id: string;
  invoice_id: string;
  event_type:
    | 'created'
    | 'email_sent'
    | 'client_viewed'
    | 'pdf_downloaded'
    | 'addon_toggled'
    | 'payment_initiated'
    | 'payment_succeeded'
    | 'payment_failed'
    | 'dunning_sent'
    | 'late_fee_applied'
    | 'late_fee_waived';
  actor_email?: string;
  ip_city?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  invoice_id: string;
  provider: PaymentProvider;
  provider_transaction_id: string;
  payment_method_type: PaymentMethodType;
  gross_amount_cents: number;
  gateway_fee_cents: number;
  net_amount_cents: number;
  currency: string;
  status: 'initiated' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
  receipt_url?: string;
  raw_webhook_payload?: Record<string, any>;
  settled_at?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  public_token: string;
  client_id: string;
  client?: Client;
  document_type: DocumentType;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  
  // Integer cents calculations
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  late_fee_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  amount_due_cents: number;

  deposit_percentage?: number | null; // e.g., 50 for 50%
  enabled_rails: EnabledPaymentRails;
  pass_processing_fee: boolean;
  early_discount_bps: number; // e.g. 200 = 2% discount within 48h
  notes?: string;
  terms_and_conditions?: string;
  paid_at?: string;
  
  line_items: InvoiceLineItem[];
  events: InvoiceEvent[];
  transactions: PaymentTransaction[];

  // Client interactive state on checkout portal
  selected_milestone?: 'deposit' | 'full';
  
  created_at: string;
  updated_at: string;
}

export interface BillableTimeEntry {
  id: string;
  client_id: string;
  project_name: string;
  description: string;
  hours: number;
  rate_cents: number;
  date: string;
  deliverable_url?: string;
}

export interface ReimbursableExpense {
  id: string;
  client_id: string;
  category: string;
  description: string;
  amount_cents: number;
  date: string;
  receipt_url?: string;
}
