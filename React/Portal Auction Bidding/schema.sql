-- ============================================================================
-- PORTAL AUCTION & LIVE BIDDING ENGINE
-- Institutional-Grade PostgreSQL / Supabase Schema & Atomic Bidding Engine
-- ============================================================================

-- Extensions required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Definitions
CREATE TYPE auction_event_status AS ENUM ('upcoming', 'live', 'closed', 'settled');
CREATE TYPE lot_status AS ENUM (
  'draft', 
  'pending_review', 
  'scheduled', 
  'live', 
  'sold_hammer', 
  'unsold_reserve_not_met', 
  'settled'
);
CREATE TYPE reserve_status_type AS ENUM (
  'no_reserve', 
  'not_met', 
  'reserve_near', 
  'reserve_met'
);
CREATE TYPE hold_status_type AS ENUM (
  'active_authorized', 
  'captured_default', 
  'released'
);
CREATE TYPE author_role_type AS ENUM (
  'bidder', 
  'seller', 
  'specialist', 
  'system'
);
CREATE TYPE timeline_entry_type AS ENUM (
  'comment', 
  'seller_answer', 
  'inspection_addendum', 
  'reserve_lowered_event',
  'system_milestone'
);
CREATE TYPE escrow_stage_type AS ENUM (
  'awaiting_payment', 
  'funds_in_escrow', 
  'in_transit_authenticated', 
  'buyer_inspected', 
  'payout_released', 
  'disputed'
);

-- ============================================================================
-- 1. AUCTION EVENTS (Themed Catalogs & Timed Events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  buyer_premium_bps INT NOT NULL DEFAULT 500, -- 500 bps = 5.00%
  soft_close_window_seconds INT NOT NULL DEFAULT 120, -- 2 minutes (02:00)
  soft_close_extend_seconds INT NOT NULL DEFAULT 120, -- Extends to 2 minutes
  status auction_event_status NOT NULL DEFAULT 'upcoming',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. BIDDER PADDLES (Pre-Auth Hold Guardrails & Pseudonymous Identity)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bidder_paddles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  paddle_number TEXT UNIQUE NOT NULL, -- e.g. '#4092'
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_intent_hold_id TEXT NOT NULL,
  held_deposit_cents BIGINT NOT NULL DEFAULT 100000, -- e.g. $1,000.00
  bidding_limit_cents BIGINT NOT NULL DEFAULT 5000000, -- e.g. $50,000.00
  hold_status hold_status_type NOT NULL DEFAULT 'active_authorized',
  kyc_verified BOOLEAN NOT NULL DEFAULT true,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. LOTS (Individual Auction Items with Strict Integer-Cents Arithmetic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_number TEXT UNIQUE NOT NULL, -- e.g. 'LOT-2026-041'
  auction_event_id UUID REFERENCES auction_events(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  condition_grade TEXT NOT NULL DEFAULT '9.4/10 Mint',
  provenance_summary TEXT,
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  media_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  condition_pins JSONB NOT NULL DEFAULT '[]'::jsonb,
  starting_bid_cents BIGINT NOT NULL,
  
  -- SENSITIVE: reserve_price_cents is kept server-confidential!
  -- Never projected in public SELECT views or client responses!
  reserve_price_cents BIGINT, 
  reserve_status reserve_status_type NOT NULL DEFAULT 'not_met',
  
  current_bid_cents BIGINT NOT NULL DEFAULT 0,
  next_min_bid_cents BIGINT NOT NULL,
  leading_bidder_id UUID,
  leading_paddle_number TEXT,
  bids_count INT NOT NULL DEFAULT 0,
  watchers_count INT NOT NULL DEFAULT 0,
  extension_count INT NOT NULL DEFAULT 0,
  status lot_status NOT NULL DEFAULT 'scheduled',
  
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. BIDS (Immutable Chronological Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  paddle_number TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  is_proxy_auto_bid BOOLEAN NOT NULL DEFAULT false,
  triggered_soft_close_extension BOOLEAN NOT NULL DEFAULT false,
  previous_ends_at TIMESTAMPTZ,
  new_ends_at TIMESTAMPTZ,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bids_lot_id_created ON bids(lot_id, created_at DESC);

-- ============================================================================
-- 5. PROXY MAX BIDS (Confidential Ceiling Vault — Strictly Server-Only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS proxy_max_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL,
  paddle_number TEXT NOT NULL,
  max_ceiling_cents BIGINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lot_bidder UNIQUE (lot_id, bidder_id)
);

CREATE INDEX idx_proxy_lot ON proxy_max_bids(lot_id, is_active) WHERE is_active = true;

-- ============================================================================
-- 6. LOT TIMELINE ENTRIES (Interleaved Q&A, Specialist Notes & System Events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lot_timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_paddle_number TEXT,
  author_name TEXT NOT NULL,
  author_role author_role_type NOT NULL DEFAULT 'bidder',
  entry_type timeline_entry_type NOT NULL DEFAULT 'comment',
  body TEXT NOT NULL,
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  upvotes_count INT NOT NULL DEFAULT 0,
  reply_to_id UUID REFERENCES lot_timeline_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_lot ON lot_timeline_entries(lot_id, created_at DESC);

-- ============================================================================
-- 7. HAMMER SETTLEMENTS (Escrow & Post-Hammer Settlement Ledger)
-- ============================================================================
CREATE TABLE IF NOT EXISTS hammer_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_number TEXT UNIQUE NOT NULL, -- e.g. 'STL-2026-881'
  lot_id UUID NOT NULL UNIQUE REFERENCES lots(id),
  winner_id UUID NOT NULL,
  winner_paddle_number TEXT NOT NULL,
  seller_id UUID NOT NULL,
  hammer_price_cents BIGINT NOT NULL,
  buyer_premium_cents BIGINT NOT NULL, -- e.g. 5%
  shipping_insured_cents BIGINT NOT NULL,
  deposit_applied_cents BIGINT NOT NULL,
  total_buyer_due_cents BIGINT NOT NULL,
  seller_commission_cents BIGINT NOT NULL,
  seller_net_payout_cents BIGINT NOT NULL,
  escrow_stage escrow_stage_type NOT NULL DEFAULT 'awaiting_payment',
  tracking_number TEXT,
  carrier TEXT,
  bill_of_sale_url TEXT,
  payout_trace_id TEXT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. HELPER FUNCTION: Calculate Dynamic Bid Increment Ladder
-- ============================================================================
CREATE OR REPLACE FUNCTION get_dynamic_min_increment_cents(p_current_bid_cents BIGINT)
RETURNS BIGINT AS $$
BEGIN
  IF p_current_bid_cents < 100000 THEN          -- Under $1,000 -> +$50
    RETURN 5000;
  ELSIF p_current_bid_cents < 1000000 THEN      -- $1,000 - $10,000 -> +$250
    RETURN 25000;
  ELSIF p_current_bid_cents < 2500000 THEN      -- $10,000 - $25,000 -> +$500
    RETURN 50000;
  ELSE                                          -- > $25,000 -> +$1,000
    RETURN 100000;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 9. ATOMIC BID & PROXY RESOLUTION ENGINE (`place_bid_atomic`)
-- ============================================================================
CREATE OR REPLACE FUNCTION place_bid_atomic(
  p_lot_id UUID,
  p_bidder_id UUID,
  p_paddle_number TEXT,
  p_bid_amount_cents BIGINT,
  p_proxy_ceiling_cents BIGINT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_lot RECORD;
  v_paddle RECORD;
  v_incumbent_proxy RECORD;
  v_min_increment BIGINT;
  v_actual_bid_cents BIGINT;
  v_previous_ends_at TIMESTAMPTZ;
  v_new_ends_at TIMESTAMPTZ;
  v_soft_close_triggered BOOLEAN := false;
  v_reserve_status reserve_status_type;
  v_is_winner BOOLEAN := false;
  v_counter_bid_cents BIGINT;
BEGIN
  -- Step 1: Strict Row-Level Lock on target lot to prevent race conditions
  SELECT * INTO v_lot 
  FROM lots 
  WHERE id = p_lot_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot % not found', p_lot_id;
  END IF;

  -- Step 2: Validate lot is currently live and unexpired
  IF v_lot.status != 'live' OR NOW() >= v_lot.ends_at THEN
    RAISE EXCEPTION 'Auction lot is closed or not currently live';
  END IF;

  -- Step 3: Validate bidder paddle status and authorization hold
  SELECT * INTO v_paddle 
  FROM bidder_paddles 
  WHERE user_id = p_bidder_id AND hold_status = 'active_authorized';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bidder paddle is not verified or pre-auth deposit hold is inactive';
  END IF;

  -- Step 4: Validate minimum bid increment
  IF p_bid_amount_cents < v_lot.next_min_bid_cents THEN
    RAISE EXCEPTION 'Bid % is below minimum next required bid %', 
      p_bid_amount_cents, v_lot.next_min_bid_cents;
  END IF;

  -- Step 5: Check Soft-Close Popcorn Window (within 120s of ends_at)
  v_previous_ends_at := v_lot.ends_at;
  v_new_ends_at := v_previous_ends_at;

  IF (v_lot.ends_at - NOW()) < INTERVAL '120 seconds' THEN
    v_new_ends_at := NOW() + INTERVAL '120 seconds';
    v_soft_close_triggered := true;
  END IF;

  -- Step 6: Store or update user's proxy ceiling if provided
  IF p_proxy_ceiling_cents IS NOT NULL AND p_proxy_ceiling_cents >= p_bid_amount_cents THEN
    INSERT INTO proxy_max_bids (lot_id, bidder_id, paddle_number, max_ceiling_cents, is_active, updated_at)
    VALUES (p_lot_id, p_bidder_id, p_paddle_number, p_proxy_ceiling_cents, true, NOW())
    ON CONFLICT (lot_id, bidder_id) 
    DO UPDATE SET 
      max_ceiling_cents = EXCLUDED.max_ceiling_cents,
      is_active = true,
      updated_at = NOW();
  END IF;

  -- Step 7: Check for existing incumbent proxy holder
  SELECT * INTO v_incumbent_proxy 
  FROM proxy_max_bids
  WHERE lot_id = p_lot_id 
    AND bidder_id != p_bidder_id 
    AND is_active = true
    AND max_ceiling_cents > v_lot.current_bid_cents
  ORDER BY max_ceiling_cents DESC, created_at ASC
  LIMIT 1;

  -- Step 8: Autonomous Proxy Ceiling Resolution
  IF FOUND AND v_incumbent_proxy.max_ceiling_cents >= p_bid_amount_cents THEN
    -- Incumbent proxy absorbs the bid!
    -- Log the challenger's bid first
    INSERT INTO bids (
      lot_id, bidder_id, paddle_number, amount_cents, 
      is_proxy_auto_bid, triggered_soft_close_extension, 
      previous_ends_at, new_ends_at, ip_hash
    ) VALUES (
      p_lot_id, p_bidder_id, p_paddle_number, p_bid_amount_cents, 
      false, v_soft_close_triggered, v_previous_ends_at, v_new_ends_at, p_ip_hash
    );

    -- Calculate incumbent auto-counter bid
    v_min_increment := get_dynamic_min_increment_cents(p_bid_amount_cents);
    v_counter_bid_cents := LEAST(v_incumbent_proxy.max_ceiling_cents, p_bid_amount_cents + v_min_increment);

    -- Insert defensive auto-bid for incumbent
    INSERT INTO bids (
      lot_id, bidder_id, paddle_number, amount_cents, 
      is_proxy_auto_bid, triggered_soft_close_extension, 
      previous_ends_at, new_ends_at, ip_hash
    ) VALUES (
      p_lot_id, v_incumbent_proxy.bidder_id, v_incumbent_proxy.paddle_number, v_counter_bid_cents, 
      true, false, v_previous_ends_at, v_new_ends_at, 'SYSTEM_PROXY'
    );

    v_actual_bid_cents := v_counter_bid_cents;

    -- Update lot with incumbent still leading
    UPDATE lots SET 
      current_bid_cents = v_counter_bid_cents,
      next_min_bid_cents = v_counter_bid_cents + get_dynamic_min_increment_cents(v_counter_bid_cents),
      leading_bidder_id = v_incumbent_proxy.bidder_id,
      leading_paddle_number = v_incumbent_proxy.paddle_number,
      bids_count = bids_count + 2,
      ends_at = v_new_ends_at,
      extension_count = CASE WHEN v_soft_close_triggered THEN extension_count + 1 ELSE extension_count END,
      updated_at = NOW()
    WHERE id = p_lot_id;

    v_is_winner := false;
  ELSE
    -- Challenger takes the lead!
    -- If incumbent had a lower proxy, step challenger just above it
    IF FOUND THEN
      -- Incumbent proxy exceeded, deactivate it
      UPDATE proxy_max_bids SET is_active = false WHERE id = v_incumbent_proxy.id;
    END IF;

    -- Log challenger's bid
    INSERT INTO bids (
      lot_id, bidder_id, paddle_number, amount_cents, 
      is_proxy_auto_bid, triggered_soft_close_extension, 
      previous_ends_at, new_ends_at, ip_hash
    ) VALUES (
      p_lot_id, p_bidder_id, p_paddle_number, p_bid_amount_cents, 
      false, v_soft_close_triggered, v_previous_ends_at, v_new_ends_at, p_ip_hash
    );

    v_actual_bid_cents := p_bid_amount_cents;
    v_min_increment := get_dynamic_min_increment_cents(p_bid_amount_cents);

    -- Calculate reserve proximity status without exposing raw reserve
    IF v_lot.reserve_price_cents IS NULL OR v_lot.reserve_status = 'no_reserve' THEN
      v_reserve_status := 'no_reserve';
    ELSIF p_bid_amount_cents >= v_lot.reserve_price_cents THEN
      v_reserve_status := 'reserve_met';
    ELSIF p_bid_amount_cents >= (v_lot.reserve_price_cents * 90 / 100) THEN
      v_reserve_status := 'reserve_near';
    ELSE
      v_reserve_status := 'not_met';
    END IF;

    UPDATE lots SET 
      current_bid_cents = p_bid_amount_cents,
      next_min_bid_cents = p_bid_amount_cents + v_min_increment,
      leading_bidder_id = p_bidder_id,
      leading_paddle_number = p_paddle_number,
      reserve_status = v_reserve_status,
      bids_count = bids_count + 1,
      ends_at = v_new_ends_at,
      extension_count = CASE WHEN v_soft_close_triggered THEN extension_count + 1 ELSE extension_count END,
      updated_at = NOW()
    WHERE id = p_lot_id;

    v_is_winner := true;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'lot_id', p_lot_id,
    'current_bid_cents', v_actual_bid_cents,
    'is_leading', v_is_winner,
    'soft_close_extended', v_soft_close_triggered,
    'new_ends_at', v_new_ends_at
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. ROW LEVEL SECURITY & SANITIZED PUBLIC VIEWS
-- ============================================================================
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_max_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE hammer_settlements ENABLE ROW LEVEL SECURITY;

-- Public view: completely strips sensitive reserve_price_cents!
CREATE OR REPLACE VIEW public_lots_view AS
SELECT 
  id,
  lot_number,
  auction_event_id,
  seller_id,
  title,
  subtitle,
  slug,
  category,
  condition_grade,
  provenance_summary,
  specifications,
  media_gallery,
  condition_pins,
  starting_bid_cents,
  reserve_status, -- Only exposes 'no_reserve' | 'not_met' | 'reserve_near' | 'reserve_met'
  current_bid_cents,
  next_min_bid_cents,
  leading_paddle_number,
  bids_count,
  watchers_count,
  extension_count,
  status,
  starts_at,
  ends_at,
  closed_at,
  created_at
FROM lots;

