-- ============================================================================
-- L'ATELIER DU FEU — POSTGRESQL & SUPABASE PRODUCTION RELATIONAL SCHEMA
-- ============================================================================
-- Architecture: Zero-Double-Booking Temporal Exclusion, Strict Integer-Cents,
-- Dietary Intelligence Matrices, Spatial Table Mapping, and Verified Diner Auditing.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ----------------------------------------------------------------------------
-- 1. DINING ZONES & ARCHITECTURAL FLOORPLAN TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dining_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    vibe_decibel_label TEXT NOT NULL, -- e.g. "Conversational • ~64 dB"
    acoustic_decibels INT NOT NULL DEFAULT 64,
    is_weather_dependent BOOLEAN NOT NULL DEFAULT false,
    hero_photo_url TEXT NOT NULL,
    ambient_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID NOT NULL REFERENCES dining_zones(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL UNIQUE, -- e.g. 'T14', 'C1', 'B2'
    min_covers INT NOT NULL CHECK (min_covers >= 1),
    max_covers INT NOT NULL CHECK (max_covers >= min_covers),
    shape TEXT NOT NULL CHECK (shape IN ('round', 'square', 'booth', 'counter')),
    svg_x FLOAT NOT NULL,
    svg_y FLOAT NOT NULL,
    svg_width FLOAT NOT NULL DEFAULT 60,
    svg_height FLOAT NOT NULL DEFAULT 60,
    sightline_photo_url TEXT NOT NULL,
    sightline_caption TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. LIVING CULINARY MENU & SOMMELIER CELLAR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    service_period TEXT NOT NULL CHECK (service_period IN ('lunch', 'aperitivo', 'dinner', 'tasting', 'beverage')),
    course_number TEXT NOT NULL, -- e.g. '01 // PRIMI', '02 // SECONDI'
    sort_order FLOAT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
    service_period TEXT NOT NULL CHECK (service_period IN ('lunch', 'aperitivo', 'dinner', 'tasting', 'beverage')),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    chef_provenance_note TEXT NOT NULL,
    price_cents BIGINT NOT NULL CHECK (price_cents >= 0),
    dietary_tags TEXT[] NOT NULL DEFAULT '{}', -- ['gf', 'vegan', 'df', 'pescatarian', 'halal', 'allium_free']
    modifiable_tags TEXT[] NOT NULL DEFAULT '{}', -- ['gf_modifiable', 'df_modifiable']
    modification_instructions TEXT, -- e.g. "Can be prepared Gluten-Free using house-extruded rice pasta (+2 min prep)"
    allergens_present TEXT[] NOT NULL DEFAULT '{}', -- ['gluten', 'dairy', 'nuts', 'shellfish', 'allium']
    paired_beverage_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    pairing_note TEXT,
    wine_vintage TEXT,
    wine_region TEXT,
    wine_acidity TEXT, -- 'Crisp / High', 'Balanced', 'Soft'
    wine_minerality TEXT, -- 'Flint & Crushed Oyster', 'Volcanic Ash'
    wine_body TEXT, -- 'Light', 'Medium-Plus', 'Full-Bodied'
    image_url TEXT NOT NULL,
    remaining_portions INT CHECK (remaining_portions >= 0),
    is_86d BOOLEAN NOT NULL DEFAULT false,
    mentions_count INT NOT NULL DEFAULT 0,
    sort_order FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. RESERVATIONS & ZERO-DOUBLE-BOOKING EXCLUSION CONSTRAINT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    confirmation_code TEXT NOT NULL UNIQUE, -- e.g. 'RES-9482'
    table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
    zone_id UUID NOT NULL REFERENCES dining_zones(id) ON DELETE RESTRICT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    party_size INT NOT NULL CHECK (party_size >= 1 AND party_size <= 12),
    reserved_start TIMESTAMPTZ NOT NULL,
    reserved_end TIMESTAMPTZ NOT NULL,
    turn_minutes INT NOT NULL DEFAULT 105,
    status TEXT NOT NULL CHECK (status IN ('held_5m', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    occasion TEXT, -- 'Anniversary', 'Birthday', 'Business Dinner', 'Date Night'
    pacing_preference TEXT NOT NULL DEFAULT 'standard' CHECK (pacing_preference IN ('express', 'standard', 'leisurely')),
    seating_notes TEXT, -- 'Quiet corner', 'Stroller space', 'High sightline'
    dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
    special_requests TEXT,
    deposit_cents BIGINT NOT NULL DEFAULT 0,
    hold_expires_at TIMESTAMPTZ, -- for 'held_5m' locks
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_reservation_time_range CHECK (reserved_end > reserved_start)
);

-- Mathematical Zero-Double-Booking Protection using btree_gist
ALTER TABLE reservations 
ADD CONSTRAINT no_overlapping_reservations 
EXCLUDE USING gist (
    table_id WITH =,
    tstzrange(reserved_start, reserved_end) WITH &&
)
WHERE (status IN ('held_5m', 'confirmed', 'seated'));

-- ----------------------------------------------------------------------------
-- 4. VIP STANDBY WAITLIST
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS waitlist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    party_size INT NOT NULL CHECK (party_size >= 1),
    target_date DATE NOT NULL,
    preferred_window_start TIME NOT NULL,
    preferred_window_end TIME NOT NULL,
    zone_preference_id UUID REFERENCES dining_zones(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'claimed', 'expired')),
    claim_expires_at TIMESTAMPTZ,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. RELATIONAL VISUAL GALLERY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL DEFAULT '4:5', -- '4:5', '16:9', '1:1'
    caption TEXT NOT NULL,
    lighting_mood TEXT NOT NULL CHECK (lighting_mood IN ('daylight', 'candlelight', 'both')),
    category TEXT NOT NULL CHECK (category IN ('culinary', 'interior', 'cellar', 'team')),
    linked_menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    linked_zone_id UUID REFERENCES dining_zones(id) ON DELETE SET NULL,
    sort_order FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. RESERVATION-VERIFIED REVIEWS & HOSPITALITY MATRIX
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID UNIQUE REFERENCES reservations(id) ON DELETE SET NULL,
    reviewer_name TEXT NOT NULL,
    seated_zone_name TEXT NOT NULL,
    service_period_label TEXT NOT NULL DEFAULT 'Evening Service',
    party_size INT NOT NULL DEFAULT 2,
    rating_overall INT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    rating_food INT NOT NULL CHECK (rating_food BETWEEN 1 AND 5),
    rating_service INT NOT NULL CHECK (rating_service BETWEEN 1 AND 5),
    rating_ambience INT NOT NULL CHECK (rating_ambience BETWEEN 1 AND 5),
    noise_level_reported TEXT NOT NULL CHECK (noise_level_reported IN ('quiet', 'conversational', 'lively', 'loud')),
    comment TEXT NOT NULL,
    favorite_dish_ids UUID[] NOT NULL DEFAULT '{}',
    favorite_dish_names TEXT[] NOT NULL DEFAULT '{}',
    photo_urls TEXT[] NOT NULL DEFAULT '{}',
    management_reply TEXT,
    is_verified_diner BOOLEAN NOT NULL DEFAULT true,
    is_published BOOLEAN NOT NULL DEFAULT true,
    visited_at DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning sub-millisecond retrieval
CREATE INDEX IF NOT EXISTS idx_menu_service_period ON menu_items(service_period);
CREATE INDEX IF NOT EXISTS idx_menu_dietary_tags ON menu_items USING GIN(dietary_tags);
CREATE INDEX IF NOT EXISTS idx_reservations_start_end ON reservations(reserved_start, reserved_end);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating_overall);
