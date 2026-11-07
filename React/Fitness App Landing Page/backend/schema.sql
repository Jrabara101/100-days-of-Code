-- =========================================================================
-- PULSE // FIT — PostgreSQL & Supabase Database Schema
-- Acquisition Engine & Deferred Deep-Link State Handoff
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Coaches Table
CREATE TABLE IF NOT EXISTS coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    specialty_headline TEXT NOT NULL,
    coaching_style TEXT NOT NULL CHECK (coaching_style IN ('technical', 'high_energy', 'mindful')),
    avatar_url TEXT NOT NULL,
    intro_clip_url TEXT,
    sample_playlist_url TEXT,
    credentials TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workout Programs & Workouts
CREATE TABLE IF NOT EXISTS workout_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('strength', 'hiit', 'mobility', 'pilates', 'endurance', 'kettlebell')),
    target_goal TEXT NOT NULL CHECK (target_goal IN ('hypertrophy', 'conditioning', 'longevity')),
    recommended_days_per_week SMALLINT NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES workout_programs(id) ON DELETE SET NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('strength', 'hiit', 'mobility', 'pilates', 'endurance', 'kettlebell')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INT NOT NULL,
    equipment_tags TEXT[] NOT NULL DEFAULT '{}',
    primary_muscles TEXT[] NOT NULL DEFAULT '{}',
    is_apartment_friendly BOOLEAN NOT NULL DEFAULT false,
    avg_calories_burned INT NOT NULL DEFAULT 300,
    heart_rate_zone TEXT NOT NULL DEFAULT 'Zone 3 (Tempo/Pacing)',
    preview_video_url TEXT,
    poster_url TEXT,
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    circuits_count INT NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Membership Plans Table
CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE CHECK (code IN ('monthly', 'annual_flagship', 'household_duo')),
    name TEXT NOT NULL,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
    price_cents INT NOT NULL,
    monthly_equivalent_cents INT NOT NULL,
    trial_days INT NOT NULL DEFAULT 14,
    max_profiles INT NOT NULL DEFAULT 1,
    hsa_fsa_eligible BOOLEAN NOT NULL DEFAULT true,
    perks_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Deferred Deep-Link Blueprints (Web-to-App State Handoff)
CREATE TABLE IF NOT EXISTS deferred_deeplink_blueprints (
    token CHAR(12) PRIMARY KEY,
    goal_type TEXT NOT NULL,
    days_per_week SMALLINT NOT NULL,
    equipment_profile TEXT NOT NULL,
    selected_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    selected_plan_code TEXT,
    generated_schedule_json JSONB NOT NULL,
    phone_hash TEXT,
    device_fingerprint JSONB DEFAULT '{}'::jsonb,
    claimed_by_app_user_id UUID,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy deferred token resolution
CREATE INDEX IF NOT EXISTS idx_blueprints_expires_at ON deferred_deeplink_blueprints(expires_at);
CREATE INDEX IF NOT EXISTS idx_blueprints_phone_hash ON deferred_deeplink_blueprints(phone_hash);

-- 5. Acquisition Attribution Events Table
CREATE TABLE IF NOT EXISTS acquisition_attribution_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_token CHAR(12) REFERENCES deferred_deeplink_blueprints(token) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view',
        'workout_previewed',
        'blueprint_generated',
        'qr_scanned',
        'sms_link_sent',
        'store_redirect_clicked',
        'app_install_claimed'
    )),
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    os_platform TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attribution_token ON acquisition_attribution_events(blueprint_token);
CREATE INDEX IF NOT EXISTS idx_attribution_event_type ON acquisition_attribution_events(event_type);

-- =========================================================================
-- SEED DATA
-- =========================================================================

-- Seed Coaches
INSERT INTO coaches (id, name, handle, specialty_headline, coaching_style, avatar_url, intro_clip_url, sample_playlist_url, credentials)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'Marcus Chen', '@marcuschen_biomech', 'Lead Biomechanics & Power Systems', 'technical', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=280&q=80', 'https://cdn.pulsefit.app/coaches/marcus_intro.mp4', 'https://music.apple.com/playlist/biomech', ARRAY['M.S. Exercise Physiology', 'CSCS *D', 'Former Olympic Weightlifting Coach']),
    ('c2222222-2222-2222-2222-222222222222', 'Elena Rostova', '@elena_metcon', 'Director of Metabolic Conditioning', 'high_energy', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=280&q=80', 'https://cdn.pulsefit.app/coaches/elena_intro.mp4', 'https://spotify.com/playlist/metcon', ARRAY['Ex-CrossFit Games Athlete', 'Kettlebell Master Level II', 'Ironman 70.3 Finisher']),
    ('c3333333-3333-3333-3333-333333333333', 'Maya Vance', '@mayavance_fit', 'Functional Hypertrophy & Longevity', 'high_energy', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=280&q=80', 'https://cdn.pulsefit.app/coaches/maya_intro.mp4', 'https://music.apple.com/playlist/hypertrophy', ARRAY['D1 Track & Field Strength Coach', 'NASM-PES', 'Pre/Post-Natal Certified']),
    ('c4444444-4444-4444-4444-444444444444', 'Liam Patel', '@liampatel_mobility', 'Head of Joint Health & Neuromuscular Recovery', 'mindful', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=280&q=80', 'https://cdn.pulsefit.app/coaches/liam_intro.mp4', 'https://spotify.com/playlist/mobility', ARRAY['Doctor of Physical Therapy (DPT)', 'FRCms Specialist', 'Spinal Mechanics Fellow'])
ON CONFLICT (handle) DO NOTHING;

-- Seed Membership Plans
INSERT INTO membership_plans (code, name, billing_interval, price_cents, monthly_equivalent_cents, trial_days, max_profiles, hsa_fsa_eligible, perks_json)
VALUES
    ('monthly', 'Monthly Flexible', 'month', 1999, 1999, 7, 1, true, '{"cancel_anytime": true, "offline_downloads": false}'::jsonb),
    ('annual_flagship', 'Annual Athlete Flagship', 'year', 11988, 999, 14, 1, true, '{"free_smart_rope": true, "offline_downloads": true, "form_check_ai": true}'::jsonb),
    ('household_duo', 'Household & Fleet', 'year', 17988, 1499, 14, 4, true, '{"profiles": 4, "apple_tv_dual_hr": true, "household_leaderboard": true}'::jsonb)
ON CONFLICT (code) DO NOTHING;
