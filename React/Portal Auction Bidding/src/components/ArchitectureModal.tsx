import React, { useState } from 'react';
import { Database, Code, ShieldCheck, Check, Copy, ExternalLink, Zap } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';

export const ArchitectureModal: React.FC = () => {
  const { isArchitectureModalOpen, setIsArchitectureModalOpen } = useArchitectureContext();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'function' | 'schema' | 'architecture'>('function');

  if (!isArchitectureModalOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const plpgsqlCode = `-- ============================================================================
-- ATOMIC BID & PROXY RESOLUTION ENGINE (place_bid_atomic)
-- Executes row-level locking, proxy auto-bidding, soft-close anti-sniping
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
  -- 1. Strict Row-Level Lock on target lot (eliminates concurrent race conditions)
  SELECT * INTO v_lot FROM lots WHERE id = p_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lot % not found', p_lot_id; END IF;

  -- 2. Verify lot is live and unexpired
  IF v_lot.status != 'live' OR NOW() >= v_lot.ends_at THEN
    RAISE EXCEPTION 'Auction lot is closed or not live';
  END IF;

  -- 3. Verify bidder paddle authorization hold
  SELECT * INTO v_paddle FROM bidder_paddles 
  WHERE user_id = p_bidder_id AND hold_status = 'active_authorized';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bidder paddle is not verified or pre-auth deposit hold is inactive';
  END IF;

  -- 4. Minimum increment enforcement
  IF p_bid_amount_cents < v_lot.next_min_bid_cents THEN
    RAISE EXCEPTION 'Bid % is below minimum required %', p_bid_amount_cents, v_lot.next_min_bid_cents;
  END IF;

  -- 5. "Popcorn" Soft-Close Anti-Sniping Check (< 120s remaining)
  v_previous_ends_at := v_lot.ends_at;
  v_new_ends_at := v_previous_ends_at;
  IF (v_lot.ends_at - NOW()) < INTERVAL '120 seconds' THEN
    v_new_ends_at := NOW() + INTERVAL '120 seconds';
    v_soft_close_triggered := true;
  END IF;

  -- 6. Store or update confidential proxy ceiling vault
  IF p_proxy_ceiling_cents IS NOT NULL AND p_proxy_ceiling_cents >= p_bid_amount_cents THEN
    INSERT INTO proxy_max_bids (lot_id, bidder_id, paddle_number, max_ceiling_cents, is_active, updated_at)
    VALUES (p_lot_id, p_bidder_id, p_paddle_number, p_proxy_ceiling_cents, true, NOW())
    ON CONFLICT (lot_id, bidder_id) 
    DO UPDATE SET max_ceiling_cents = EXCLUDED.max_ceiling_cents, is_active = true, updated_at = NOW();
  END IF;

  -- 7. Autonomous Vickrey Proxy Stepping Resolution
  SELECT * INTO v_incumbent_proxy FROM proxy_max_bids
  WHERE lot_id = p_lot_id AND bidder_id != p_bidder_id AND is_active = true
  ORDER BY max_ceiling_cents DESC, created_at ASC LIMIT 1;

  IF FOUND AND v_incumbent_proxy.max_ceiling_cents >= p_bid_amount_cents THEN
    -- Incumbent proxy absorbs challenger
    v_min_increment := get_dynamic_min_increment_cents(p_bid_amount_cents);
    v_counter_bid_cents := LEAST(v_incumbent_proxy.max_ceiling_cents, p_bid_amount_cents + v_min_increment);

    -- Log challenger bid
    INSERT INTO bids (lot_id, bidder_id, paddle_number, amount_cents, is_proxy_auto_bid, triggered_soft_close_extension, previous_ends_at, new_ends_at, ip_hash)
    VALUES (p_lot_id, p_bidder_id, p_paddle_number, p_bid_amount_cents, false, v_soft_close_triggered, v_previous_ends_at, v_new_ends_at, p_ip_hash);

    -- Log incumbent defensive counter-bid
    INSERT INTO bids (lot_id, bidder_id, paddle_number, amount_cents, is_proxy_auto_bid, triggered_soft_close_extension, previous_ends_at, new_ends_at, ip_hash)
    VALUES (p_lot_id, v_incumbent_proxy.bidder_id, v_incumbent_proxy.paddle_number, v_counter_bid_cents, true, false, v_previous_ends_at, v_new_ends_at, 'SYSTEM_PROXY');

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
    -- Challenger takes the lead
    IF FOUND THEN UPDATE proxy_max_bids SET is_active = false WHERE id = v_incumbent_proxy.id; END IF;

    INSERT INTO bids (lot_id, bidder_id, paddle_number, amount_cents, is_proxy_auto_bid, triggered_soft_close_extension, previous_ends_at, new_ends_at, ip_hash)
    VALUES (p_lot_id, p_bidder_id, p_paddle_number, p_bid_amount_cents, false, v_soft_close_triggered, v_previous_ends_at, v_new_ends_at, p_ip_hash);

    -- Calculate reserve proximity without exposing raw reserve integer
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
      next_min_bid_cents = p_bid_amount_cents + get_dynamic_min_increment_cents(p_bid_amount_cents),
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
$$ LANGUAGE plpgsql;`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E5E3DC] dark:border-[#252934] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E5E3DC] dark:border-[#252934]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium text-[#111315] dark:text-[#F8FAFC]">
                Institutional Architecture & Database Engine
              </h3>
              <p className="text-xs text-[#646870] dark:text-[#8E96A8]">
                PostgreSQL Strict Integer-Cents Arithmetic, Row-Level Locking, & Vickrey Proxy Engine
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsArchitectureModalOpen(false)}
            className="text-neutral-400 hover:text-white font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center justify-between border-b border-[#E5E3DC] dark:border-[#252934] pb-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('function')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'function'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              place_bid_atomic (PL/pgSQL)
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-[#646870] dark:text-[#8E96A8] hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              PostgreSQL Tables & RLS Policies
            </button>
          </div>

          <button
            onClick={() => copyToClipboard(plpgsqlCode)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-mono"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied SQL' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto rounded-xl bg-neutral-950 p-4 border border-neutral-800 font-mono text-xs text-neutral-300">
          <pre className="whitespace-pre-wrap leading-relaxed">{plpgsqlCode}</pre>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between font-mono text-xs text-[#646870] dark:text-[#8E96A8]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Row-Level Security (RLS) protects reserve prices & proxy ceilings from public queries
          </span>
          <button
            onClick={() => setIsArchitectureModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

function useArchitectureContext() {
  const { isArchitectureModalOpen, setIsArchitectureModalOpen } = useAuction();
  return { isArchitectureModalOpen, setIsArchitectureModalOpen };
}

