-- ==============================================================================
-- LedgerCraft: PostgreSQL / Supabase High-Precision Invoicing & Multi-Rail Schema
-- Precision FinTech Settlement, Integer-Cents Ledger, Idempotency & Telemetry
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    billing_email TEXT NOT NULL,
    cc_emails TEXT[] DEFAULT '{}',
    tax_id_vat TEXT,
    billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    currency TEXT NOT NULL DEFAULT 'USD',
    stripe_customer_id TEXT,
    paypal_payer_id TEXT,
    payment_terms_days INT NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Invoices & Proposals Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL UNIQUE,
    public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    document_type TEXT NOT NULL CHECK (document_type IN ('quote', 'invoice', 'credit_note')),
    status TEXT NOT NULL CHECK (status IN (
        'draft', 'sent', 'viewed', 'processing_ach', 
        'partially_paid', 'paid', 'overdue', 'voided', 'refunded'
    )),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    
    -- Integer Cents Precision Arithmetic
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    discount_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    late_fee_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL DEFAULT 0,
    amount_paid_cents BIGINT NOT NULL DEFAULT 0,
    amount_due_cents BIGINT GENERATED ALWAYS AS (total_cents - amount_paid_cents) STORED,
    
    deposit_percentage INT CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100),
    enabled_rails JSONB NOT NULL DEFAULT '{"stripe_card": true, "stripe_ach": true, "paypal": true}'::jsonb,
    pass_processing_fee BOOLEAN NOT NULL DEFAULT FALSE,
    early_discount_bps INT NOT NULL DEFAULT 0, -- e.g., 200 = 2.00%
    notes TEXT,
    terms_and_conditions TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit_price_cents BIGINT NOT NULL DEFAULT 0,
    tax_rate_bps INT NOT NULL DEFAULT 0, -- 825 = 8.25%
    is_optional_addon BOOLEAN NOT NULL DEFAULT FALSE,
    is_addon_selected BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Multi-Rail Settlement Ledger (Payment Transactions)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'manual_wire')),
    provider_transaction_id TEXT NOT NULL UNIQUE,
    payment_method_type TEXT NOT NULL CHECK (payment_method_type IN (
        'card', 'us_bank_account', 'apple_pay', 'paypal_wallet', 'venmo', 'wire'
    )),
    gross_amount_cents BIGINT NOT NULL,
    gateway_fee_cents BIGINT NOT NULL DEFAULT 0,
    net_amount_cents BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN (
        'initiated', 'processing', 'succeeded', 'failed', 'refunded', 'disputed'
    )),
    receipt_url TEXT,
    raw_webhook_payload JSONB,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Real-Time View Telemetry & Audit Trail
CREATE TABLE IF NOT EXISTS invoice_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'created', 'email_sent', 'client_viewed', 'pdf_downloaded',
        'addon_toggled', 'payment_initiated', 'payment_succeeded',
        'payment_failed', 'dunning_sent', 'late_fee_applied', 'late_fee_waived'
    )),
    actor_email TEXT,
    ip_city TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ultra-fast telemetry and lookup
CREATE INDEX IF NOT EXISTS idx_invoices_token ON invoices(public_token);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_events_invoice ON invoice_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_events_created ON invoice_events(created_at DESC);
