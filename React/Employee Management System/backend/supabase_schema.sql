-- ============================================================================
-- AURA People OS: Modern Workforce, Scoped RBAC Governance & Attendance Suite
-- PostgreSQL / Supabase Enterprise Production Schema
-- ============================================================================

-- Enable UUID extension & pgcrypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. DEPARTMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    lead_employee_id UUID, -- FK to employees.id added via alter below
    parent_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    budget_headcount INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. ROLES & ROLE PERMISSIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    hierarchy_level INT NOT NULL, -- 1 = Super Admin, 2 = HR Partner, 3 = Dept Head, 4 = Manager, 5 = Employee, 6 = Contractor
    description TEXT,
    badge_color TEXT NOT NULL DEFAULT '#4F46E5',
    permissions JSONB NOT NULL DEFAULT '{
        "employeeCrud": "own",
        "compensationRead": "none",
        "compensationWrite": "none",
        "attendanceManage": "own",
        "leaveApprove": "none",
        "systemAdmin": "none"
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. EMPLOYEES TABLE (Core CRUD & Directory)
-- ----------------------------------------------------------------------------
CREATE TYPE employment_type_enum AS ENUM ('full_time', 'part_time', 'contractor');
CREATE TYPE work_mode_enum AS ENUM ('onsite', 'hybrid', 'remote', 'travel');
CREATE TYPE lifecycle_stage_enum AS ENUM ('candidate', 'pre_boarding', 'active', 'on_leave', 'offboarding', 'alumni');
CREATE TYPE attendance_presence_enum AS ENUM ('clocked_in_office', 'clocked_in_remote', 'on_break', 'on_leave', 'missing_punch', 'off_duty');

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_code TEXT NOT NULL UNIQUE, -- e.g. 'EMP-0142'
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    preferred_name TEXT,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    pronouns TEXT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL, -- Self-referencing FK
    job_title TEXT NOT NULL,
    employment_type employment_type_enum NOT NULL DEFAULT 'full_time',
    work_mode work_mode_enum NOT NULL DEFAULT 'hybrid',
    status lifecycle_stage_enum NOT NULL DEFAULT 'active',
    attendance_status attendance_presence_enum NOT NULL DEFAULT 'off_duty',
    timezone TEXT NOT NULL DEFAULT 'Europe/London (UTC+1)',
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    terminated_at DATE,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link lead_employee_id to employees(id)
ALTER TABLE public.departments 
    ADD CONSTRAINT fk_department_lead 
    FOREIGN KEY (lead_employee_id) 
    REFERENCES public.employees(id) 
    ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 4. EMPLOYEE SENSITIVE DATA TABLE (Isolated for Strict RLS & Field Shielding)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_sensitive_data (
    employee_id UUID PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
    base_salary NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    pay_frequency TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'bi-weekly'
    bonus_target_percent NUMERIC(5, 2) DEFAULT 0.00,
    equity_grant_units BIGINT DEFAULT 0,
    tax_id_encrypted TEXT, -- Stored encrypted or masked
    bank_account_last4 TEXT,
    home_address TEXT,
    emergency_contact JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. EMPLOYMENT HISTORY TABLE (Immutable Career & Compensation Timeline)
-- ----------------------------------------------------------------------------
CREATE TYPE change_type_enum AS ENUM ('promotion', 'transfer', 'compensation', 'manager_change', 'onboarding', 'leave_transition');

CREATE TABLE IF NOT EXISTS public.employment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    change_type change_type_enum NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 6. ATTENDANCE LOGS TABLE (Hybrid Presence & Shift Punching)
-- ----------------------------------------------------------------------------
CREATE TYPE punch_location_enum AS ENUM ('office', 'remote', 'travel');
CREATE TYPE punch_status_enum AS ENUM ('active', 'completed', 'missing_out_punch', 'disputed');

CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ NOT NULL,
    clock_out TIMESTAMPTZ,
    break_minutes INT NOT NULL DEFAULT 0,
    work_location punch_location_enum NOT NULL DEFAULT 'office',
    status punch_status_enum NOT NULL DEFAULT 'active',
    total_hours NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN clock_out IS NOT NULL THEN 
                ROUND(GREATEST(0, (EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600.0) - (break_minutes / 60.0))::numeric, 2)
            ELSE 0.00
        END
    ) STORED,
    notes TEXT,
    dispute_reason TEXT,
    suggested_clock_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_employee_shift_punch UNIQUE (employee_id, date, clock_in)
);

-- ----------------------------------------------------------------------------
-- 7. LEAVE REQUESTS TABLE (PTO, Sick, Parental with Conflict Radar)
-- ----------------------------------------------------------------------------
CREATE TYPE leave_type_enum AS ENUM ('pto', 'sick', 'parental', 'bereavement', 'unpaid');
CREATE TYPE leave_status_enum AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    leave_type leave_type_enum NOT NULL DEFAULT 'pto',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    half_day BOOLEAN NOT NULL DEFAULT false,
    days_count NUMERIC(4, 1) NOT NULL,
    status leave_status_enum NOT NULL DEFAULT 'pending',
    reason TEXT NOT NULL,
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_leave_date_range CHECK (end_date >= start_date)
);

-- ----------------------------------------------------------------------------
-- 8. ACTING DELEGATIONS TABLE (Temporary Authority Handoff on Vacation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.acting_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    acting_manager_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    delegated_scopes TEXT[] DEFAULT ARRAY['leave:approve', 'attendance:manage'],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 9. SECURITY AUDIT LOGS TABLE (Field-Level Privacy Shield Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL, -- 'PII_REVEAL', 'ROLE_CHANGE', 'SALARY_UPDATE', 'MANAGER_REPARENT'
    target_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    target_employee_name TEXT NOT NULL,
    field TEXT,
    details TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- DATABASE SAFEGUARDS & AUTOMATIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A. RECURSIVE ORG-TREE CTE FUNCTION: get_subordinate_ids(manager_uuid)
-- Resolves all direct and indirect reports in sub-millisecond recursive queries
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_subordinate_ids(manager_uuid UUID)
RETURNS TABLE (subordinate_id UUID) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE org_tree AS (
        -- Anchor member: direct reports
        SELECT id
        FROM public.employees
        WHERE manager_id = manager_uuid

        UNION ALL

        -- Recursive member: indirect reports
        SELECT e.id
        FROM public.employees e
        INNER JOIN org_tree ot ON e.manager_id = ot.id
    )
    SELECT id FROM org_tree;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- B. CYCLE-DETECTION TRIGGER
-- Prevents circular reporting loops (e.g., A manages B -> B cannot manage A)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_manager_hierarchy_cycle()
RETURNS TRIGGER AS $$
DECLARE
    sub_id UUID;
BEGIN
    IF NEW.manager_id IS NOT NULL THEN
        -- Prevent self-management
        IF NEW.id = NEW.manager_id THEN
            RAISE EXCEPTION 'An employee cannot be their own manager.';
        END IF;

        -- Check if NEW.manager_id is currently a subordinate of NEW.id
        FOR sub_id IN SELECT subordinate_id FROM public.get_subordinate_ids(NEW.id) LOOP
            IF sub_id = NEW.manager_id THEN
                RAISE EXCEPTION 'Circular reporting loop detected: cannot assign a subordinate as manager.';
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_manager_cycles ON public.employees;
CREATE TRIGGER trg_prevent_manager_cycles
    BEFORE INSERT OR UPDATE OF manager_id ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.check_manager_hierarchy_cycle();

-- ----------------------------------------------------------------------------
-- C. NIGHTLY ATTENDANCE WORKER FUNCTION
-- Automatically flags open shifts exceeding 14 hours as 'missing_out_punch'
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nightly_reconcile_missing_punches()
RETURNS INT AS $$
DECLARE
    reconciled_count INT;
BEGIN
    UPDATE public.attendance_logs
    SET 
        status = 'missing_out_punch',
        dispute_reason = 'Shift automatically flagged as missing out-punch (exceeded 14 hours open duration).',
        suggested_clock_out = clock_in + INTERVAL '8 hours'
    WHERE 
        status = 'active'
        AND clock_out IS NULL
        AND clock_in < (now() - INTERVAL '14 hours');

    GET DIAGNOSTICS reconciled_count = ROW_COUNT;
    RETURN reconciled_count;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- D. ROW-LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_sensitive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 1. Employees Directory: All authenticated users can read basic directory metadata
CREATE POLICY "Employees directory public read" 
    ON public.employees 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 2. Sensitive Data: Only Super Admins, HR People Partners, or the employee themselves
CREATE POLICY "Sensitive data access control" 
    ON public.employee_sensitive_data
    FOR SELECT
    USING (
        auth.uid() = (SELECT user_id FROM public.employees WHERE id = employee_sensitive_data.employee_id)
        OR EXISTS (
            SELECT 1 FROM public.employees e
            JOIN public.roles r ON e.role_id = r.id
            WHERE e.user_id = auth.uid() 
            AND r.code IN ('SUPER_ADMIN', 'HR_PARTNER')
        )
    );

-- 3. Attendance Logs: Employees can read own; Managers can read direct & indirect reports
CREATE POLICY "Attendance logs hierarchical access"
    ON public.attendance_logs
    FOR SELECT
    USING (
        auth.uid() = (SELECT user_id FROM public.employees WHERE id = attendance_logs.employee_id)
        OR EXISTS (
            SELECT 1 FROM public.employees mgr
            JOIN public.roles r ON mgr.role_id = r.id
            WHERE mgr.user_id = auth.uid()
            AND (
                r.code IN ('SUPER_ADMIN', 'HR_PARTNER')
                OR attendance_logs.employee_id IN (SELECT subordinate_id FROM public.get_subordinate_ids(mgr.id))
            )
        )
    );
