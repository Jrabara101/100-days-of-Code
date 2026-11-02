-- ============================================================================
-- GOURMETDROP / FOOD DELIVERY PLATFORM
-- Production-Grade PostgreSQL + PostGIS Schema & Stored Procedures
-- Integer-Cents Financial Precision & Spatial Telemetry
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Cleanup (if rebuilding)
DROP TABLE IF EXISTS courier_telemetry_pings CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS modifier_options CASCADE;
DROP TABLE IF EXISTS modifier_groups CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;
DROP TABLE IF EXISTS couriers CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    saved_default_lat DOUBLE PRECISION DEFAULT 37.7749,
    saved_default_lng DOUBLE PRECISION DEFAULT -122.4194,
    default_gate_code TEXT DEFAULT '1492#',
    default_delivery_notes TEXT DEFAULT 'Leave at front porch door • Do not ring bell',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. RESTAURANTS & OPERATIONAL VITALS
-- ----------------------------------------------------------------------------
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cuisine_tags TEXT[] NOT NULL DEFAULT '{}',
    is_virtual_kitchen BOOLEAN NOT NULL DEFAULT false,
    origin_badge TEXT NOT NULL DEFAULT 'Verified Neighborhood Dining Room — Est. 2018',
    health_score INT NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    health_grade TEXT NOT NULL DEFAULT 'Grade A',
    physical_street_address TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    delivery_polygon GEOGRAPHY(Polygon, 4326) NOT NULL,
    base_prep_minutes INT NOT NULL DEFAULT 15,
    current_load_status TEXT NOT NULL CHECK (current_load_status IN ('quiet', 'normal', 'busy', 'paused')) DEFAULT 'normal',
    active_ticket_count INT NOT NULL DEFAULT 6,
    delivery_fee_cents BIGINT NOT NULL DEFAULT 299,
    free_delivery_min_cents BIGINT DEFAULT 3500,
    service_fee_bps INT NOT NULL DEFAULT 1000, -- 1000 bps = 10.00%
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 4.80,
    reviews_count INT NOT NULL DEFAULT 0,
    travel_quality_score NUMERIC(3,1) NOT NULL DEFAULT 98.0, -- percentage hot & intact
    hero_image_url TEXT NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. MENU CATEGORIES & DISHES
-- ----------------------------------------------------------------------------
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    base_price_cents BIGINT NOT NULL CHECK (base_price_cents >= 0),
    calories INT NOT NULL DEFAULT 0,
    protein_grams INT NOT NULL DEFAULT 0,
    dietary_flags TEXT[] NOT NULL DEFAULT '{}', -- e.g. ['gf', 'vegan', 'halal', 'high-protein', 'spicy']
    travel_quality_score NUMERIC(2,1) NOT NULL DEFAULT 4.8,
    packaging_note TEXT NOT NULL DEFAULT 'Crispy Vented Packaging • Holds Heat 35m',
    is_sold_out BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    sort_order FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. MODIFIER MATRICES (GROUPS & OPTIONS)
-- ----------------------------------------------------------------------------
CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    min_select INT NOT NULL DEFAULT 0,
    max_select INT NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE modifier_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_delta_cents BIGINT NOT NULL DEFAULT 0,
    calories_delta INT NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0
);

-- ----------------------------------------------------------------------------
-- 5. MULTIPLAYER GROUP CARTS & CART ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    share_code TEXT UNIQUE NOT NULL, -- e.g. GRP-4920
    host_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('open', 'locked_checkout', 'converted')) DEFAULT 'open',
    per_person_limit_cents BIGINT, -- e.g. 2500 for $25.00 limit
    locks_at TIMESTAMPTZ,
    utensils_requested BOOLEAN NOT NULL DEFAULT false,
    condiments_ledger JSONB DEFAULT '{"chopsticks": 0, "extra_napkins": false, "chili_oil": 1}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    participant_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    participant_name TEXT NOT NULL DEFAULT 'You (Host)',
    participant_avatar TEXT,
    participant_color TEXT DEFAULT '#8B5CF6',
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0) DEFAULT 1,
    selected_modifiers JSONB NOT NULL DEFAULT '[]', -- array of { group_id, option_id, name, price_delta_cents }
    unit_computed_cents BIGINT NOT NULL CHECK (unit_computed_cents >= 0),
    substitution_policy TEXT NOT NULL CHECK (substitution_policy IN ('chef_choice', 'refund_item', 'cancel_order', 'specific_item')) DEFAULT 'chef_choice',
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. COURIERS & ACTIVE LOGISTICS FLEET
-- ----------------------------------------------------------------------------
CREATE TABLE couriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    rating NUMERIC(3,2) NOT NULL DEFAULT 4.98,
    total_deliveries INT NOT NULL DEFAULT 1200,
    vehicle_type TEXT NOT NULL DEFAULT 'Honda PCX Scooter',
    license_plate TEXT NOT NULL DEFAULT '8X92',
    has_insulated_thermal_bag BOOLEAN NOT NULL DEFAULT true,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    current_heading FLOAT DEFAULT 0.0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- ----------------------------------------------------------------------------
-- 7. ORDERS & 6-STAGE TELEMETRY PIPELINE
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL, -- e.g. FD-9482
    cart_id UUID REFERENCES carts(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN (
        'placed', 
        'accepted', 
        'preparing', 
        'ready_for_pickup', 
        'picked_up', 
        'arriving', 
        'delivered', 
        'cancelled'
    )) DEFAULT 'placed',
    routing_tier TEXT NOT NULL CHECK (routing_tier IN ('priority_direct', 'standard', 'eco_saver')) DEFAULT 'standard',
    items_subtotal_cents BIGINT NOT NULL,
    delivery_fee_cents BIGINT NOT NULL DEFAULT 0,
    service_fee_cents BIGINT NOT NULL DEFAULT 0,
    discount_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    courier_tip_cents BIGINT NOT NULL DEFAULT 0,
    total_charged_cents BIGINT NOT NULL,
    dropoff_location GEOGRAPHY(Point, 4326) NOT NULL,
    dropoff_instructions JSONB NOT NULL DEFAULT '{"pin_lat": 37.7749, "pin_lng": -122.4194, "gate_code": "1492#", "leave_at_door": true}',
    dropoff_photo_url TEXT,
    porch_reference_photo_url TEXT,
    estimated_delivery_at TIMESTAMPTZ NOT NULL,
    delivered_at TIMESTAMPTZ,
    
    -- Intermediate Multi-Stop Batch Waypoint (if eco_saver or batched)
    has_intermediate_stop BOOLEAN NOT NULL DEFAULT false,
    intermediate_stop_note TEXT,
    intermediate_stop_lat DOUBLE PRECISION,
    intermediate_stop_lng DOUBLE PRECISION,
    
    -- 10-Minute Add-On Bundle Window
    bundle_window_expires_at TIMESTAMPTZ,
    bundled_items JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order line items snapshot (for audits & 30s instant make-goods)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_title TEXT NOT NULL,
    quantity INT NOT NULL,
    unit_price_cents BIGINT NOT NULL,
    total_price_cents BIGINT NOT NULL,
    selected_modifiers JSONB NOT NULL DEFAULT '[]',
    substitution_policy TEXT NOT NULL DEFAULT 'chef_choice',
    participant_name TEXT DEFAULT 'You',
    is_reported_missing_or_damaged BOOLEAN NOT NULL DEFAULT false,
    make_good_credit_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. COURIER TELEMETRY PINGS (Time-Series & Replay Stream)
-- ----------------------------------------------------------------------------
CREATE TABLE courier_telemetry_pings (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    heading_deg FLOAT NOT NULL DEFAULT 0,
    speed_mps FLOAT NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courier_telemetry_order ON courier_telemetry_pings (order_id, recorded_at DESC);
CREATE INDEX idx_restaurants_location ON restaurants USING GIST (location);
CREATE INDEX idx_restaurants_delivery_polygon ON restaurants USING GIST (delivery_polygon);

-- ----------------------------------------------------------------------------
-- 9. STORED PROCEDURES & BUSINESS LOGIC
-- ----------------------------------------------------------------------------

-- A. Validate Modifiers & Compute Authentic Integer-Cents Price (Prevents Tampering)
CREATE OR REPLACE FUNCTION fn_validate_item_price(
    p_menu_item_id UUID,
    p_selected_modifiers JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_base_price BIGINT;
    v_total_delta BIGINT := 0;
    v_mod RECORD;
    v_actual_delta BIGINT;
BEGIN
    SELECT base_price_cents INTO v_base_price
    FROM menu_items
    WHERE id = p_menu_item_id AND is_sold_out = false;

    IF v_base_price IS NULL THEN
        RAISE EXCEPTION 'Item not found or currently sold out: %', p_menu_item_id;
    END IF;

    -- Validate each modifier option exists and add genuine price delta
    FOR v_mod IN SELECT * FROM jsonb_to_recordset(p_selected_modifiers) AS x(option_id UUID)
    LOOP
        SELECT mo.price_delta_cents INTO v_actual_delta
        FROM modifier_options mo
        JOIN modifier_groups mg ON mo.group_id = mg.id
        WHERE mo.id = v_mod.option_id
          AND mg.menu_item_id = p_menu_item_id
          AND mo.is_available = true;

        IF v_actual_delta IS NULL THEN
            RAISE EXCEPTION 'Invalid, unavailable, or mismatched modifier option % for menu item %', v_mod.option_id, p_menu_item_id;
        END IF;

        v_total_delta := v_total_delta + v_actual_delta;
    END LOOP;

    RETURN v_base_price + v_total_delta;
END;
$$;

-- B. Filter Deliverable Restaurants by PostGIS Polygon & Sphere Distance
CREATE OR REPLACE FUNCTION fn_filter_deliverable_restaurants(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_max_distance_meters FLOAT DEFAULT 10000.0
)
RETURNS TABLE (
    restaurant_id UUID,
    restaurant_name TEXT,
    distance_meters FLOAT,
    is_deliverable BOOLEAN,
    estimated_prep_and_transit_minutes INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_point GEOGRAPHY;
BEGIN
    v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY;

    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        ST_Distance(r.location, v_point) AS distance_meters,
        ST_Contains(r.delivery_polygon::geometry, v_point::geometry) AS is_deliverable,
        (
            r.base_prep_minutes + 
            CASE r.current_load_status
                WHEN 'quiet' THEN -2
                WHEN 'normal' THEN 0
                WHEN 'busy' THEN 10
                WHEN 'paused' THEN 999
            END +
            CEIL(ST_Distance(r.location, v_point) / 400.0)::INT -- ~24km/h scooter speed
        ) AS estimated_prep_and_transit_minutes
    FROM restaurants r
    WHERE r.is_open = true
      AND ST_Distance(r.location, v_point) <= p_max_distance_meters
    ORDER BY distance_meters ASC;
END;
$$;
