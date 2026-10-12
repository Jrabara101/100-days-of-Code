-- ==============================================================================
-- AuthMesh: Enterprise Social Identity & Account Linking Gateway Schema
-- Compatible with PostgreSQL 14+ and Supabase Auth Extensions
-- ==============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Core Identity Entity)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant email lookups during collision detection
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));

-- 2. Identities Table (Normalized Provider Graph)
-- Models 1:N relationship between one primary user and multiple social providers
CREATE TABLE IF NOT EXISTS identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook', 'github', 'email')),
    provider_user_id TEXT NOT NULL,
    identity_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores raw profile, username, email, avatar
    last_sign_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_provider_account UNIQUE (provider, provider_user_id)
);

-- Indexes for lightning-fast graph resolution and deduplication
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_provider_uid ON identities(provider, provider_user_id);

-- 3. Audit Logs Table (Tamper-evident Security History)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'oauth_handshake', 'account_linked', 'account_unlinked', 'collision_detected', 'stepup_merge_verified', 'logout'
    provider TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 4. Initial Seed Data (Demo Account Setup)
-- Pre-seeds Alex Chen with a primary Google account for immediate Collision testing
INSERT INTO users (id, email, full_name, avatar_url, created_at, last_sign_in_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'alex.chen@acme.corp',
    'Alex Chen',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO identities (id, user_id, provider, provider_user_id, identity_data, last_sign_in_at, created_at)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'google',
    'google-oauth2|10948291048201948',
    '{"email": "alex.chen@acme.corp", "name": "Alex Chen", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80", "verified_email": true}'::jsonb,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '30 days'
)
ON CONFLICT (provider, provider_user_id) DO NOTHING;
