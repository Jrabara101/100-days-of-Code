-- ====================================================================
-- Hollis Trust & Safety Review Governance Architecture
-- PostgreSQL / Supabase Migration Schema
-- Version: 4.2-institutional
-- ====================================================================

-- Enable UUID extension and pgcrypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
    CREATE TYPE review_provenance_type AS ENUM (
        'verified_purchase',
        'incentivized_gifted',
        'repeat_buyer',
        'unverified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE moderation_status_type AS ENUM (
        'pending',
        'auto_approved',
        'approved',
        'redacted_approved',
        'rejected',
        'quarantined_spam'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE media_type_enum AS ENUM ('image', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE private_resolution_type AS ENUM (
        'none',
        'replacement_sent',
        'refund_issued',
        'store_credit'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Product Rating Aggregates (Denormalized for sub-10ms storefront reads)
CREATE TABLE IF NOT EXISTS product_rating_aggregates (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_sku TEXT NOT NULL UNIQUE,
    product_title TEXT NOT NULL,
    total_reviews_count INT DEFAULT 0,
    verified_reviews_count INT DEFAULT 0,
    media_reviews_count INT DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0.00,
    bayesian_score NUMERIC(4,3) DEFAULT 0.000,
    rating_distribution JSONB DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb,
    dimensional_averages JSONB DEFAULT '{}'::jsonb,
    sentiment_highlights JSONB DEFAULT '[]'::jsonb,
    is_brigade_locked BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reviews Table (Primary Audit-Proof Ledger)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES product_rating_aggregates(product_id) ON DELETE CASCADE,
    variant_id UUID,
    variant_title_snapshot TEXT,
    user_id UUID,
    order_id UUID,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT,
    reviewer_location TEXT,
    reviewer_attributes JSONB DEFAULT '{}'::jsonb,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    dimensional_scores JSONB DEFAULT '{}'::jsonb,
    title TEXT NOT NULL,
    body_original TEXT NOT NULL,
    body_sanitized TEXT NOT NULL,
    follow_up_update_text TEXT,
    follow_up_added_at TIMESTAMPTZ,
    provenance_type review_provenance_type NOT NULL DEFAULT 'unverified',
    token_hash TEXT,
    moderation_status moderation_status_type NOT NULL DEFAULT 'pending',
    priority_queue TEXT DEFAULT 'triage-inbox',
    rejection_reason_code TEXT,
    risk_score SMALLINT DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    risk_flags JSONB DEFAULT '[]'::jsonb,
    helpful_upvotes INT DEFAULT 0,
    helpful_downvotes INT DEFAULT 0,
    ip_subnet_hash TEXT,
    device_fingerprint_hash TEXT,
    moderated_by UUID,
    moderated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Review Media (EXIF Stripped & Privacy Blurred Derivatives)
CREATE TABLE IF NOT EXISTS review_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    media_type media_type_enum DEFAULT 'image',
    original_storage_path TEXT NOT NULL,
    public_sanitized_url TEXT NOT NULL,
    thumbnail_url TEXT,
    perceptual_hash TEXT,
    is_redacted_blurred BOOLEAN DEFAULT false,
    blur_bounding_box JSONB,
    moderation_status moderation_status_type DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Review Merchant Responses & Private Make-Good Bridge
CREATE TABLE IF NOT EXISTS review_merchant_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    responder_id UUID,
    responder_name TEXT NOT NULL,
    responder_title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    private_resolution_offered private_resolution_type DEFAULT 'none',
    resolution_tracking_number TEXT,
    resolution_reorder_cost NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Moderation Audit Logs
CREATE TABLE IF NOT EXISTS moderation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    actor_id UUID,
    actor_role TEXT NOT NULL DEFAULT 'LEAD_OPERATOR',
    action TEXT NOT NULL,
    diff_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for sub-millisecond retrieval
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews (product_id, moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_priority_queue ON reviews (priority_queue, moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_risk_score ON reviews (risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_media_phash ON review_media (perceptual_hash);

-- ====================================================================
-- Automated Bayesian Recalculation Trigger Function
-- Bayesian Formula: (v / (v + m)) * R + (m / (v + m)) * C
-- v: total approved reviews count
-- m: confidence weight threshold (default 25)
-- R: sample mean
-- C: global prior rating (default 4.50)
-- ====================================================================
CREATE OR REPLACE FUNCTION fn_recalculate_product_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id UUID;
    v_total INT;
    v_verified INT;
    v_media INT;
    v_avg NUMERIC(3,2);
    v_bayesian NUMERIC(4,3);
    v_dist JSONB;
    c_prior_weight CONSTANT NUMERIC := 25.0;
    c_prior_mean CONSTANT NUMERIC := 4.50;
BEGIN
    target_product_id := COALESCE(NEW.product_id, OLD.product_id);

    -- Calculate approved reviews stats
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE provenance_type IN ('verified_purchase', 'repeat_buyer')),
        COALESCE(AVG(rating), 0.00),
        jsonb_build_object(
            '1', COUNT(*) FILTER (WHERE rating = 1),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '5', COUNT(*) FILTER (WHERE rating = 5)
        )
    INTO 
        v_total,
        v_verified,
        v_avg,
        v_dist
    FROM reviews
    WHERE product_id = target_product_id
      AND moderation_status IN ('approved', 'redacted_approved');

    -- Calculate count with media
    SELECT COUNT(DISTINCT r.id)
    INTO v_media
    FROM reviews r
    JOIN review_media m ON m.review_id = r.id
    WHERE r.product_id = target_product_id
      AND r.moderation_status IN ('approved', 'redacted_approved');

    -- Compute Bayesian Score
    IF v_total > 0 THEN
        v_bayesian := ROUND(
            ((v_total::NUMERIC / (v_total + c_prior_weight)) * v_avg) +
            ((c_prior_weight / (v_total + c_prior_weight)) * c_prior_mean),
            3
        );
    ELSE
        v_bayesian := c_prior_mean;
    END IF;

    -- Update denormalized aggregates table
    UPDATE product_rating_aggregates
    SET 
        total_reviews_count = v_total,
        verified_reviews_count = v_verified,
        media_reviews_count = v_media,
        average_rating = v_avg,
        bayesian_score = v_bayesian,
        rating_distribution = v_dist,
        updated_at = NOW()
    WHERE product_id = target_product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition on reviews state change
DROP TRIGGER IF EXISTS trg_recalc_product_aggregates ON reviews;
CREATE TRIGGER trg_recalc_product_aggregates
AFTER INSERT OR UPDATE OF moderation_status, rating OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_recalculate_product_aggregates();

