-- ============================================================================
-- AegisIAM: Enterprise Multi-User Authentication, RBAC & Recovery Schema
-- Target Engine: PostgreSQL 15+ / Supabase
-- Extensions: pgcrypto, uuid-ossp
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing entities (for idempotent migrations)
DROP TABLE IF EXISTS auth_audit_logs CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS team_invites CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ----------------------------------------------------------------------------
-- 2. ROLES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    color TEXT DEFAULT '#2563EB',
    inherited_from_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roles_name ON roles(name);

-- ----------------------------------------------------------------------------
-- 3. PERMISSIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL UNIQUE, -- e.g. 'org:delete', 'billing:manage'
    category TEXT NOT NULL,      -- e.g. 'Workspaces & Projects', 'Billing & Invoicing'
    description TEXT NOT NULL,
    is_critical BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_category ON permissions(category);

-- ----------------------------------------------------------------------------
-- 4. ROLE_PERMISSIONS JUNCTION TABLE (Composite Primary Key)
-- ----------------------------------------------------------------------------
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_perm ON role_permissions(permission_id);

-- ----------------------------------------------------------------------------
-- 5. USER_ROLES JUNCTION TABLE (Composite Primary Key)
-- ----------------------------------------------------------------------------
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ----------------------------------------------------------------------------
-- 6. SESSIONS TABLE (Device Trust & Sliding Expirations)
-- ----------------------------------------------------------------------------
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT NOT NULL,
    ip_address INET NOT NULL,
    device_name TEXT,
    device_type TEXT DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser TEXT,
    os TEXT,
    location TEXT,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ----------------------------------------------------------------------------
-- 7. PASSWORD_RESETS TABLE (Single-Use 15-Minute Magic Links)
-- ----------------------------------------------------------------------------
CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE, -- SHA-256 of 32-byte cryptographically secure token
    expires_at TIMESTAMPTZ NOT NULL, -- 15 minutes TTL
    used_at TIMESTAMPTZ,             -- Nullable; populated upon consumption
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_resets_token_hash ON password_resets(token_hash);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

-- ----------------------------------------------------------------------------
-- 8. TEAM_INVITES TABLE (Tokenized Onboarding)
-- ----------------------------------------------------------------------------
CREATE TABLE team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_invites_token ON team_invites(token_hash);
CREATE INDEX idx_team_invites_email ON team_invites(email);

-- ----------------------------------------------------------------------------
-- 9. AUTH_AUDIT_LOGS TABLE (Defensive Activity Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE auth_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    event TEXT NOT NULL,
    ip_address INET NOT NULL,
    location TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON auth_audit_logs(user_id);
CREATE INDEX idx_audit_logs_event ON auth_audit_logs(event);
CREATE INDEX idx_audit_logs_created_at ON auth_audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if auth.uid() has permission
CREATE OR REPLACE FUNCTION auth_has_permission(required_action TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND p.action = required_action
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SESSIONS RLS: Users can only select and delete their own sessions
CREATE POLICY sessions_user_read ON sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY sessions_user_delete ON sessions
    FOR DELETE USING (user_id = auth.uid());

-- AUDIT LOGS RLS: Users can view their own events, Auditor/Admin can view all
CREATE POLICY audit_logs_read ON auth_audit_logs
    FOR SELECT USING (
        user_id = auth.uid() 
        OR auth_has_permission('audit:read')
    );

-- ROLE PERMISSIONS RLS: Modifications require 'users:manage_roles'
CREATE POLICY role_permissions_manage ON role_permissions
    FOR ALL USING (auth_has_permission('users:manage_roles'));

-- ----------------------------------------------------------------------------
-- 11. GOVERNANCE GUARDRAIL TRIGGER (Prevent Last Owner Demotion)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_at_least_one_owner()
RETURNS TRIGGER AS $$
DECLARE
    owner_role_id UUID;
    remaining_owners INT;
BEGIN
    SELECT id INTO owner_role_id FROM roles WHERE name = 'Owner' LIMIT 1;

    -- If deleting an Owner assignment or updating away from Owner
    IF (TG_OP = 'DELETE' AND OLD.role_id = owner_role_id) OR 
       (TG_OP = 'UPDATE' AND OLD.role_id = owner_role_id AND NEW.role_id <> owner_role_id) THEN
        SELECT COUNT(*) INTO remaining_owners 
        FROM user_roles 
        WHERE role_id = owner_role_id AND user_id <> OLD.user_id;

        IF remaining_owners < 1 THEN
            RAISE EXCEPTION 'Governance Violation: Organizations must maintain at least one verified active Owner.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guard_last_owner
BEFORE DELETE OR UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION enforce_at_least_one_owner();

-- ----------------------------------------------------------------------------
-- 12. SEED INITIAL PERMISSIONS & ROLES
-- ----------------------------------------------------------------------------
INSERT INTO permissions (action, category, description, is_critical) VALUES
('projects:create', 'Workspaces & Projects', 'Initialize new project repositories and workspaces', false),
('projects:read', 'Workspaces & Projects', 'Inspect workspace resources, read configurations', false),
('projects:edit', 'Workspaces & Projects', 'Update project settings and environment variables', false),
('projects:delete', 'Workspaces & Projects', 'Permanently destroy project resources and volumes', true),
('org:update', 'Workspaces & Projects', 'Modify company profile and domain verifications', false),
('org:delete', 'Workspaces & Projects', 'Permanently decommission workspace and credentials', true),
('users:read', 'Team & Access Management', 'View active organization roster and profiles', false),
('users:invite', 'Team & Access Management', 'Dispatch tokenized invitations with pre-assigned roles', false),
('users:manage_roles', 'Team & Access Management', 'Assign role capabilities and author custom blueprints', true),
('users:remove', 'Team & Access Management', 'Eject team members and invalidate tenant credentials', true),
('billing:view', 'Billing & Invoicing', 'Access billing statements and seat allocations', false),
('billing:manage', 'Billing & Invoicing', 'Update subscription tiers and commit thresholds', false),
('billing:erase_payment', 'Billing & Invoicing', 'Remove primary corporate payment instruments', true),
('audit:read', 'Audit & Security Logs', 'Inspect authentication logs and IP coordinates', false),
('audit:export', 'Audit & Security Logs', 'Download cryptographically sealed compliance reports', false),
('security:sessions_revoke', 'Audit & Security Logs', 'Terminate untrusted device connections and tokens', false),
('security:sudo_bypass', 'Audit & Security Logs', 'Bypass contextual re-authentication challenges', true);

INSERT INTO roles (name, description, is_system, color) VALUES
('Owner', 'Full sovereign custody of the organization, security controls, and billing instruments.', true, '#7C3AED'),
('Admin', 'Elevated technical governance, member onboarding, and resource lifecycle management.', true, '#2563EB'),
('Manager', 'Project lead managing day-to-day deliverables, member invitations, and team operations.', true, '#0D9488'),
('Member', 'Standard collaborator contributing code, executing pipeline builds, and viewing assets.', true, '#10B981'),
('Auditor', 'Read-only compliance officer inspecting security trails, access logs, and financial records.', true, '#64748B');

-- Link Owner to all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'Owner';

-- Link Admin to permissions (except critical org:delete, billing:erase_payment)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
WHERE r.name = 'Admin' AND p.action NOT IN ('org:delete', 'billing:erase_payment', 'security:sudo_bypass');
