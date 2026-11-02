-- ==============================================================================
-- DISPATCH CORE: Omnichannel Order Management & Fulfillment Database Schema
-- Strict Integer-Cents Financial Precision & Concurrency Safeguards
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS & DOMAIN TYPES
CREATE TYPE order_channel AS ENUM ('dtc_web', 'shopify', 'amazon', 'b2b_wholesale', 'pos');
CREATE TYPE order_status AS ENUM (
  'grace_hold',
  'on_hold_exception',
  'ready_to_fulfill',
  'partially_fulfilled',
  'fulfilled',
  'delivered',
  'cancelled'
);
CREATE TYPE exception_code AS ENUM (
  'none',
  'invalid_address',
  'fraud_review',
  'stock_shortage',
  'carrier_stalled'
);
CREATE TYPE address_validation_status AS ENUM ('verified', 'warning_suggested', 'invalid');
CREATE TYPE fulfillment_status AS ENUM (
  'queued_for_wave',
  'picking',
  'packed',
  'label_purchased',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'exception_stalled'
);
CREATE TYPE carrier_type AS ENUM ('usps', 'ups', 'fedex', 'dhl');
CREATE TYPE rma_resolution_type AS ENUM ('exchange', 'store_credit', 'refund', 'keep_item_credit');
CREATE TYPE rma_reason_code AS ENUM ('sizing_small', 'sizing_large', 'damaged_in_transit', 'defective', 'changed_mind');
CREATE TYPE condition_grade AS ENUM ('uninspected', 'grade_a_restock', 'grade_b_open_box', 'grade_c_quarantine');
CREATE TYPE rma_status AS ENUM ('requested', 'in_transit', 'received_graded', 'completed');
CREATE TYPE audit_actor_type AS ENUM ('system_router', 'operator', 'carrier_webhook', 'customer');

-- 2. WAREHOUSES & HUBS
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(32) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  active_sla_pct DECIMAL(5, 2) DEFAULT 99.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS (Integer-Cents Financials & Address Hygiene)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  channel order_channel NOT NULL DEFAULT 'shopify',
  customer_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  order_status order_status NOT NULL DEFAULT 'grace_hold',
  exception_code exception_code NOT NULL DEFAULT 'none',
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Strict Integer Cents Ledger
  subtotal_cents BIGINT NOT NULL CHECK (subtotal_cents >= 0),
  discount_cents BIGINT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  shipping_charged_cents BIGINT NOT NULL DEFAULT 0 CHECK (shipping_charged_cents >= 0),
  tax_cents BIGINT NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_paid_cents BIGINT NOT NULL CHECK (total_paid_cents >= 0),
  cogs_total_cents BIGINT NOT NULL DEFAULT 0 CHECK (cogs_total_cents >= 0),
  gateway_fee_cents BIGINT NOT NULL DEFAULT 0 CHECK (gateway_fee_cents >= 0),
  shipping_cost_actual_cents BIGINT NOT NULL DEFAULT 0 CHECK (shipping_cost_actual_cents >= 0),
  pick_pack_fee_cents BIGINT NOT NULL DEFAULT 0 CHECK (pick_pack_fee_cents >= 0),
  net_margin_cents BIGINT NOT NULL,

  -- Address Hygiene & Validation
  shipping_address JSONB NOT NULL,
  address_validation_status address_validation_status NOT NULL DEFAULT 'verified',
  address_suggestion JSONB,

  -- Operational Timers & Allocation
  sla_ship_by_at TIMESTAMPTZ NOT NULL,
  grace_period_ends_at TIMESTAMPTZ,
  allocated_warehouse_id UUID REFERENCES warehouses(id),
  routing_logic_explanation TEXT,
  fraud_risk_score INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_exception ON orders(exception_code);
CREATE INDEX idx_orders_sla ON orders(sla_ship_by_at ASC);
CREATE INDEX idx_orders_email ON orders(customer_email);

-- 4. ORDER LINE ITEMS
CREATE TABLE IF NOT EXISTS order_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  variant_title TEXT,
  thumbnail_url TEXT,
  bin_location TEXT NOT NULL,
  quantity_ordered INT NOT NULL CHECK (quantity_ordered > 0),
  quantity_allocated INT NOT NULL DEFAULT 0,
  quantity_fulfilled INT NOT NULL DEFAULT 0,
  quantity_returned INT NOT NULL DEFAULT 0,
  unit_price_cents BIGINT NOT NULL,
  unit_cogs_cents BIGINT NOT NULL,
  weight_grams INT NOT NULL DEFAULT 250,
  allocated_warehouse_id UUID REFERENCES warehouses(id)
);

CREATE INDEX idx_line_items_order ON order_line_items(order_id);
CREATE INDEX idx_line_items_sku ON order_line_items(sku);

-- 5. FULFILLMENTS (Individual Parcels & Split Shipments)
CREATE TABLE IF NOT EXISTS fulfillments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fulfillment_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  status fulfillment_status NOT NULL DEFAULT 'queued_for_wave',
  carrier carrier_type NOT NULL DEFAULT 'usps',
  service_level TEXT NOT NULL,
  tracking_number TEXT UNIQUE,
  label_url TEXT,
  label_cost_cents BIGINT NOT NULL DEFAULT 0,
  recommended_box_code TEXT,
  last_carrier_scan_text TEXT,
  last_carrier_scan_at TIMESTAMPTZ,
  estimated_delivery_date DATE,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  is_backordered BOOLEAN DEFAULT false,
  backorder_restock_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fulfillments_order ON fulfillments(order_id);
CREATE INDEX idx_fulfillments_tracking ON fulfillments(tracking_number);

-- 6. INVENTORY LEVELS & CHANNEL RESERVATIONS (With Generated ATS Column)
CREATE TABLE IF NOT EXISTS inventory_levels (
  variant_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  sku TEXT NOT NULL,
  on_hand_qty INT NOT NULL DEFAULT 0,
  reserved_qty INT NOT NULL DEFAULT 0,
  quarantined_qty INT NOT NULL DEFAULT 0,
  -- Available To Sell (ATS) generated always
  available_qty INT GENERATED ALWAYS AS (on_hand_qty - reserved_qty - quarantined_qty) STORED,
  safety_stock_threshold INT NOT NULL DEFAULT 10,
  dtc_reserved_qty INT DEFAULT 0,
  b2b_reserved_qty INT DEFAULT 0,
  marketplace_reserved_qty INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (variant_id, warehouse_id)
);

-- 7. RETURN AUTHORIZATIONS (RMAs & Condition Grading)
CREATE TABLE IF NOT EXISTS return_authorizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rma_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  line_item_id UUID REFERENCES order_line_items(id),
  resolution_type rma_resolution_type NOT NULL DEFAULT 'exchange',
  reason_code rma_reason_code NOT NULL,
  condition_grade condition_grade NOT NULL DEFAULT 'uninspected',
  return_label_cost_cents BIGINT NOT NULL DEFAULT 0,
  refund_amount_cents BIGINT NOT NULL DEFAULT 0,
  status rma_status NOT NULL DEFAULT 'requested',
  customer_photo_url TEXT,
  customer_comment TEXT,
  economizer_savings_cents BIGINT DEFAULT 0,
  dock_operator TEXT,
  inspected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ORDER AUDIT EVENTS (Immutable Operational Timeline)
CREATE TABLE IF NOT EXISTS order_audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_type audit_actor_type NOT NULL,
  actor_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata_diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_order ON order_audit_events(order_id, created_at DESC);

-- ==============================================================================
-- 9. CONCURRENCY SAFEGUARD: ATOMIC INVENTORY RESERVATION WITH ROW LOCKING
-- ==============================================================================
CREATE OR REPLACE FUNCTION reserve_inventory_atomic(
  p_order_id UUID,
  p_variant_id UUID,
  p_warehouse_id UUID,
  p_qty INT
) RETURNS JSONB AS $$
DECLARE
  v_available INT;
  v_on_hand INT;
  v_reserved INT;
  v_quarantined INT;
BEGIN
  -- Row-lock specifically for update to prevent race conditions during flash sales
  SELECT on_hand_qty, reserved_qty, quarantined_qty, (on_hand_qty - reserved_qty - quarantined_qty)
  INTO v_on_hand, v_reserved, v_quarantined, v_available
  FROM inventory_levels
  WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVENTORY_RECORD_NOT_FOUND');
  END IF;

  IF v_available < p_qty THEN
    -- Flag stock shortage exception on order
    UPDATE orders 
    SET order_status = 'on_hold_exception',
        exception_code = 'stock_shortage',
        routing_logic_explanation = 'Stock shortage detected during atomic reservation: requested ' || p_qty || ', available ' || v_available
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_AVAILABLE_STOCK', 'available', v_available);
  END IF;

  -- Lock & increment reserved qty
  UPDATE inventory_levels
  SET reserved_qty = reserved_qty + p_qty,
      updated_at = NOW()
  WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id;

  RETURN jsonb_build_object('success', true, 'reserved', p_qty, 'remaining_ats', v_available - p_qty);
END;
$$ LANGUAGE plpgsql;

-- 10. REAL-TIME NET MARGIN COMPUTATION TRIGGER
CREATE OR REPLACE FUNCTION compute_order_net_margin() RETURNS TRIGGER AS $$
BEGIN
  -- Net margin formula: Total Paid - Landed COGS - Gateway Fee - Actual Shipping Cost - Pick/Pack Fee
  NEW.net_margin_cents := NEW.total_paid_cents 
                          - NEW.cogs_total_cents 
                          - NEW.gateway_fee_cents 
                          - NEW.shipping_cost_actual_cents 
                          - NEW.pick_pack_fee_cents;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_compute_net_margin
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION compute_order_net_margin();

