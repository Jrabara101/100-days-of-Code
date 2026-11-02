import React, { useState } from 'react';
import { useRestaurant } from '../services/restaurantStore';
import { X, Database, Copy, Check, ShieldCheck, Flame, Code } from 'lucide-react';

const SQL_SCHEMA_TEXT = `-- ============================================================================
-- L'ATELIER DU FEU — POSTGRESQL & SUPABASE PRODUCTION RELATIONAL SCHEMA
-- ============================================================================
-- Architecture: Zero-Double-Booking Temporal Exclusion, Strict Integer-Cents,
-- Dietary Intelligence Matrices, Spatial Table Mapping, and Verified Diner Auditing.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 1. DINING ZONES & ARCHITECTURAL FLOORPLAN TABLES
CREATE TABLE IF NOT EXISTS dining_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    vibe_decibel_label TEXT NOT NULL,
    acoustic_decibels INT NOT NULL DEFAULT 64,
    is_weather_dependent BOOLEAN NOT NULL DEFAULT false,
    hero_photo_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES dining_zones(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL UNIQUE, -- e.g. 'T14', 'C1'
    min_covers INT NOT NULL CHECK (min_covers >= 1),
    max_covers INT NOT NULL CHECK (max_covers >= min_covers),
    shape TEXT NOT NULL CHECK (shape IN ('round', 'square', 'booth', 'counter')),
    svg_x FLOAT NOT NULL,
    svg_y FLOAT NOT NULL,
    sightline_photo_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. LIVING CULINARY MENU & SOMMELIER CELLAR
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_period TEXT NOT NULL CHECK (service_period IN ('lunch', 'aperitivo', 'dinner', 'tasting', 'beverage')),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    chef_provenance_note TEXT NOT NULL,
    price_cents BIGINT NOT NULL CHECK (price_cents >= 0),
    dietary_tags TEXT[] NOT NULL DEFAULT '{}',
    modifiable_tags TEXT[] NOT NULL DEFAULT '{}',
    modification_instructions TEXT,
    allergens_present TEXT[] NOT NULL DEFAULT '{}',
    paired_beverage_id UUID REFERENCES menu_items(id),
    remaining_portions INT CHECK (remaining_portions >= 0),
    is_86d BOOLEAN NOT NULL DEFAULT false,
    mentions_count INT NOT NULL DEFAULT 0
);

-- 3. RESERVATIONS & ZERO-DOUBLE-BOOKING EXCLUSION CONSTRAINT
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confirmation_code TEXT NOT NULL UNIQUE,
    table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
    zone_id UUID NOT NULL REFERENCES dining_zones(id) ON DELETE RESTRICT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    party_size INT NOT NULL CHECK (party_size BETWEEN 1 AND 12),
    reserved_start TIMESTAMPTZ NOT NULL,
    reserved_end TIMESTAMPTZ NOT NULL,
    turn_minutes INT NOT NULL DEFAULT 105,
    status TEXT NOT NULL CHECK (status IN ('held_5m', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    pacing_preference TEXT NOT NULL DEFAULT 'standard' CHECK (pacing_preference IN ('express', 'standard', 'leisurely')),
    dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
    deposit_cents BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mathematical Zero-Double-Booking Protection using btree_gist
ALTER TABLE reservations 
ADD CONSTRAINT no_overlapping_reservations 
EXCLUDE USING gist (
    table_id WITH =,
    tstzrange(reserved_start, reserved_end) WITH &&
)
WHERE (status IN ('held_5m', 'confirmed', 'seated'));`;

export default function DatabaseSchemaModal() {
  const { schemaModalOpen, setSchemaModalOpen, showToast } = useRestaurant();
  const [copied, setCopied] = useState(false);

  if (!schemaModalOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_TEXT);
    setCopied(true);
    showToast('📋 Production PostgreSQL / Supabase Schema copied to clipboard.');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border-hairline)] pb-4 shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] text-xs font-mono-numbers">
              <Database className="w-3.5 h-3.5" />
              <span>Production Architecture Specification</span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-light text-[var(--text-primary)]">
              PostgreSQL &amp; Supabase Database Schema
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="py-2 px-3 rounded-lg bg-[var(--brand-primary)] text-white text-xs font-mono-numbers flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={() => setSchemaModalOpen(false)}
              className="p-2 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 text-xs font-mono-numbers">
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            <span className="text-[var(--brand-primary)] font-bold block">1. btree_gist Exclusion</span>
            <span className="text-[var(--text-muted)] text-[11px]">Mathematically prevents overlapping seat bookings in parallel threads.</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            <span className="text-[var(--accent-gold)] font-bold block">2. Strict Integer Cents</span>
            <span className="text-[var(--text-muted)] text-[11px]">Eliminates floating-point rounding bugs across wine bottles and deposits.</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            <span className="text-emerald-500 font-bold block">3. Temporal 5m Holds</span>
            <span className="text-[var(--text-muted)] text-[11px]">Locks seats for 300 seconds during guest checkout pre-briefing.</span>
          </div>
        </div>

        {/* Code Display */}
        <div className="flex-1 overflow-y-auto rounded-xl bg-black/90 p-4 border border-[var(--border-hairline)]">
          <pre className="text-xs font-mono-numbers text-emerald-400 whitespace-pre-wrap leading-relaxed">
            {SQL_SCHEMA_TEXT}
          </pre>
        </div>

      </div>
    </div>
  );
}
