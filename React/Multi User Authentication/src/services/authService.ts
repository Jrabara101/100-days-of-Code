import {
  User,
  Role,
  Permission,
  Session,
  AuditLog,
  TeamInvite,
  DispatchedEmail,
  LockoutState,
  PermissionAction,
  RoleName
} from '../types/auth';

// Storage keys
const USERS_KEY = 'aegis_users_v1';
const ROLES_KEY = 'aegis_roles_v1';
const PERMISSIONS_KEY = 'aegis_permissions_v1';
const SESSIONS_KEY = 'aegis_sessions_v1';
const AUDIT_LOGS_KEY = 'aegis_audit_logs_v1';
const RESETS_KEY = 'aegis_password_resets_v1';
const INVITES_KEY = 'aegis_invites_v1';
const EMAILS_KEY = 'aegis_dispatched_emails_v1';
const LOCKOUT_KEY = 'aegis_lockout_state_v1';
const CURRENT_USER_KEY = 'aegis_active_session_user_v1';
const SUDO_EXPIRES_KEY = 'aegis_sudo_expires_v1';

// Web Crypto Helpers
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateCryptoToken(lengthBytes = 32): string {
  const bytes = new Uint8Array(lengthBytes);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initial System Permissions
export const INITIAL_PERMISSIONS: Permission[] = [
  // Workspaces & Projects
  {
    id: 'p1',
    action: 'projects:create',
    category: 'Workspaces & Projects',
    name: 'Create Projects',
    description: 'Initialize new project repositories, workspaces, and service accounts.'
  },
  {
    id: 'p2',
    action: 'projects:read',
    category: 'Workspaces & Projects',
    name: 'View Projects',
    description: 'Inspect workspace resources, read configurations, and view metrics.'
  },
  {
    id: 'p3',
    action: 'projects:edit',
    category: 'Workspaces & Projects',
    name: 'Modify Projects',
    description: 'Update project settings, modify environment variables, and manage tags.'
  },
  {
    id: 'p4',
    action: 'projects:delete',
    category: 'Workspaces & Projects',
    name: 'Delete Projects',
    description: 'Permanently destroy project resources and purge associated data volumes.',
    isCritical: true
  },
  {
    id: 'p5',
    action: 'org:update',
    category: 'Workspaces & Projects',
    name: 'Update Organization',
    description: 'Modify company profile, default regions, and domain verifications.'
  },
  {
    id: 'p6',
    action: 'org:delete',
    category: 'Workspaces & Projects',
    name: 'Destroy Organization',
    description: 'Permanently decommission workspace and revoke all tenant credentials.',
    isCritical: true
  },

  // Team & Access Management
  {
    id: 'p7',
    action: 'users:read',
    category: 'Team & Access Management',
    name: 'List Team Members',
    description: 'View active organization rosters, public profiles, and current roles.'
  },
  {
    id: 'p8',
    action: 'users:invite',
    category: 'Team & Access Management',
    name: 'Invite Members',
    description: 'Dispatch tokenized invitations with pre-assigned role privileges.'
  },
  {
    id: 'p9',
    action: 'users:manage_roles',
    category: 'Team & Access Management',
    name: 'Govern Roles & Matrix',
    description: 'Assign role capabilities and author custom permission blueprints.',
    isCritical: true
  },
  {
    id: 'p10',
    action: 'users:remove',
    category: 'Team & Access Management',
    name: 'Eject Team Members',
    description: 'Revoke membership and immediately invalidate all tenant credentials.',
    isCritical: true
  },

  // Billing & Invoicing
  {
    id: 'p11',
    action: 'billing:view',
    category: 'Billing & Invoicing',
    name: 'View Invoices & Usage',
    description: 'Access billing statements, seat allocations, and consumption trends.'
  },
  {
    id: 'p12',
    action: 'billing:manage',
    category: 'Billing & Invoicing',
    name: 'Update Subscription Tier',
    description: 'Upgrade or downgrade plan tiers and adjust commit thresholds.'
  },
  {
    id: 'p13',
    action: 'billing:erase_payment',
    category: 'Billing & Invoicing',
    name: 'Erase Payment Method',
    description: 'Remove primary corporate payment instruments and default fallback cards.',
    isCritical: true
  },

  // Audit & Security Logs
  {
    id: 'p14',
    action: 'audit:read',
    category: 'Audit & Security Logs',
    name: 'Inspect Security Trails',
    description: 'View live authentication logs, IP coordinates, and session timelines.'
  },
  {
    id: 'p15',
    action: 'audit:export',
    category: 'Audit & Security Logs',
    name: 'Export SIEM Archives',
    description: 'Download cryptographically sealed compliance reports in CSV/JSON.'
  },
  {
    id: 'p16',
    action: 'security:sessions_revoke',
    category: 'Audit & Security Logs',
    name: 'Revoke Remote Sessions',
    description: 'Terminate untrusted device connections and invalidate refresh tokens.'
  },
  {
    id: 'p17',
    action: 'security:sudo_bypass',
    category: 'Audit & Security Logs',
    name: 'Sudo Challenge Exemption',
    description: 'Bypass contextual re-authentication challenges for automated scripts.',
    isCritical: true
  }
];

// Initial System Roles
export const INITIAL_ROLES: Role[] = [
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Full sovereign custody of the organization, security controls, and billing instruments.',
    is_system: true,
    color: '#7C3AED',
    permissions: INITIAL_PERMISSIONS.map(p => p.action),
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Elevated technical governance, member onboarding, and resource lifecycle management.',
    is_system: true,
    color: '#2563EB',
    permissions: INITIAL_PERMISSIONS.filter(p => !['org:delete', 'billing:erase_payment', 'security:sudo_bypass'].includes(p.action)).map(p => p.action),
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description: 'Project lead managing day-to-day deliverables, member invitations, and team operations.',
    is_system: true,
    color: '#0D9488',
    permissions: [
      'projects:create', 'projects:read', 'projects:edit',
      'users:read', 'users:invite',
      'billing:view',
      'audit:read', 'security:sessions_revoke'
    ],
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'role-member',
    name: 'Member',
    description: 'Standard collaborator contributing code, executing pipeline builds, and viewing assets.',
    is_system: true,
    color: '#10B981',
    permissions: [
      'projects:create', 'projects:read', 'projects:edit',
      'users:read'
    ],
    created_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'role-auditor',
    name: 'Auditor',
    description: 'Read-only compliance officer inspecting security trails, access logs, and financial records.',
    is_system: true,
    color: '#64748B',
    permissions: [
      'projects:read',
      'users:read',
      'billing:view',
      'audit:read', 'audit:export'
    ],
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

// Initial Pre-Seeded Personas
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-owner-01',
    email: 'alex.vance@aegis-security.io',
    full_name: 'Alex Vance',
    role: 'Owner',
    is_verified: true,
    status: 'active',
    last_login: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    created_at: '2025-11-12T10:00:00.000Z'
  },
  {
    id: 'usr-admin-02',
    email: 'sarah.chen@aegis-security.io',
    full_name: 'Sarah Chen',
    role: 'Admin',
    is_verified: true,
    status: 'active',
    last_login: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    created_at: '2025-12-01T14:20:00.000Z'
  },
  {
    id: 'usr-manager-03',
    email: 'marcus.brooks@aegis-security.io',
    full_name: 'Marcus Brooks',
    role: 'Manager',
    is_verified: true,
    status: 'active',
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    created_at: '2026-01-10T09:15:00.000Z'
  },
  {
    id: 'usr-member-04',
    email: 'elena.rostova@aegis-security.io',
    full_name: 'Elena Rostova',
    role: 'Member',
    is_verified: true,
    status: 'active',
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: '2026-02-14T11:45:00.000Z'
  },
  {
    id: 'usr-auditor-05',
    email: 'david.kim@aegis-security.io',
    full_name: 'David Kim',
    role: 'Auditor',
    is_verified: true,
    status: 'active',
    last_login: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_at: '2026-03-01T16:00:00.000Z'
  }
];

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'sess-current-01',
    user_id: 'usr-owner-01',
    refresh_token_hash: 'hash-curr-8921a9',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    ip_address: '192.0.2.14',
    device_name: 'MacBook Pro 16" (M3 Max)',
    device_type: 'desktop',
    browser: 'Chrome 128',
    os: 'macOS Sonoma',
    location: 'San Francisco, US • Active right now',
    last_active_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    is_current: true
  },
  {
    id: 'sess-office-02',
    user_id: 'usr-owner-01',
    refresh_token_hash: 'hash-off-9912bc',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
    ip_address: '84.115.22.91',
    device_name: 'ThinkPad X1 Carbon',
    device_type: 'desktop',
    browser: 'Firefox 130',
    os: 'Windows 11 Enterprise',
    location: 'Berlin, DE • Last seen 3h ago',
    last_active_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    is_current: false
  },
  {
    id: 'sess-mobile-03',
    user_id: 'usr-owner-01',
    refresh_token_hash: 'hash-mob-4431cc',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    ip_address: '172.56.41.112',
    device_name: 'iPhone 16 Pro',
    device_type: 'mobile',
    browser: 'Mobile Safari',
    os: 'iOS 18.1',
    location: 'London, UK • Last seen 1d ago',
    last_active_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    is_current: false
  },
  {
    id: 'sess-tablet-04',
    user_id: 'usr-owner-01',
    refresh_token_hash: 'hash-tab-2210ff',
    user_agent: 'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15',
    ip_address: '210.140.10.5',
    device_name: 'iPad Air 11" (M2)',
    device_type: 'tablet',
    browser: 'Chrome for iPad',
    os: 'iPadOS 17.6',
    location: 'Tokyo, JP • Last seen 4d ago',
    last_active_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    is_current: false
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    user_id: 'usr-owner-01',
    user_email: 'alex.vance@aegis-security.io',
    actor_name: 'Alex Vance (Owner)',
    event: 'USER_LOGIN_SUCCESS',
    ip_address: '192.0.2.14',
    location: 'San Francisco, US',
    user_agent: 'Chrome 128 / macOS',
    metadata: { method: 'password_authenticated', mfa: 'hardware_security_key' },
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'log-02',
    user_id: 'usr-admin-02',
    user_email: 'sarah.chen@aegis-security.io',
    actor_name: 'Sarah Chen (Admin)',
    event: 'TEAM_MEMBER_INVITED',
    ip_address: '198.51.100.8',
    location: 'Seattle, US',
    user_agent: 'Chrome 127 / macOS',
    metadata: { invited_email: 'elena.rostova@aegis-security.io', role: 'Member' },
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString()
  },
  {
    id: 'log-03',
    user_id: 'usr-owner-01',
    user_email: 'alex.vance@aegis-security.io',
    actor_name: 'Alex Vance (Owner)',
    event: 'PASSWORD_RESET_COMPLETED',
    ip_address: '192.0.2.14',
    location: 'San Francisco, US',
    user_agent: 'Chrome 128 / macOS',
    metadata: { entropy_bits: 84, grade: 'vault_passphrase' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  },
  {
    id: 'log-04',
    user_id: 'usr-owner-01',
    user_email: 'alex.vance@aegis-security.io',
    actor_name: 'Alex Vance (Owner)',
    event: 'SESSION_REVOKED',
    ip_address: '192.0.2.14',
    location: 'San Francisco, US',
    user_agent: 'Chrome 128 / macOS',
    metadata: { revoked_device: 'Safari on macOS Monterey (Stale session)' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString()
  },
  {
    id: 'log-05',
    user_id: 'usr-owner-01',
    user_email: 'alex.vance@aegis-security.io',
    actor_name: 'Alex Vance (Owner)',
    event: 'SUDO_CHALLENGE_PASSED',
    ip_address: '192.0.2.14',
    location: 'San Francisco, US',
    user_agent: 'Chrome 128 / macOS',
    metadata: { action: 'billing_payment_method_inspection', ttl_minutes: 10 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()
  }
];

export const INITIAL_INVITES: TeamInvite[] = [
  {
    id: 'inv-01',
    email: 'jordan.taylor@enterprise-partner.com',
    role: 'Member',
    invited_by: 'usr-owner-01',
    inviter_name: 'Alex Vance',
    token: 'inv-tok-99a8b1c4',
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'inv-02',
    email: 'external.compliance@kpmg-audit.com',
    role: 'Auditor',
    invited_by: 'usr-admin-02',
    inviter_name: 'Sarah Chen',
    token: 'inv-tok-33f2d1e7',
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(PERMISSIONS_KEY)) {
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(INITIAL_PERMISSIONS));
    }
    if (!localStorage.getItem(ROLES_KEY)) {
      localStorage.setItem(ROLES_KEY, JSON.stringify(INITIAL_ROLES));
    }
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(SESSIONS_KEY)) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(INITIAL_SESSIONS));
    }
    if (!localStorage.getItem(AUDIT_LOGS_KEY)) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(INVITES_KEY)) {
      localStorage.setItem(INVITES_KEY, JSON.stringify(INITIAL_INVITES));
    }
    if (!localStorage.getItem(EMAILS_KEY)) {
      localStorage.setItem(EMAILS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(CURRENT_USER_KEY)) {
      // Default logged in as Owner (Alex Vance)
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(INITIAL_USERS[0]));
    }
  }

  // Getters
  getUsers(): User[] {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  getRoles(): Role[] {
    return JSON.parse(localStorage.getItem(ROLES_KEY) || '[]');
  }

  getPermissions(): Permission[] {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || '[]');
  }

  getSessions(): Session[] {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  }

  getAuditLogs(): AuditLog[] {
    return JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || '[]');
  }

  getInvites(): TeamInvite[] {
    return JSON.parse(localStorage.getItem(INVITES_KEY) || '[]');
  }

  getDispatchedEmails(): DispatchedEmail[] {
    return JSON.parse(localStorage.getItem(EMAILS_KEY) || '[]');
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  getLockoutState(email: string): LockoutState {
    const all = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
    const userState = all[email.toLowerCase()] || { failedAttempts: 0, lockedUntil: null, lastAttemptAt: null };
    
    // Check if lockout expired
    if (userState.lockedUntil && Date.now() > userState.lockedUntil) {
      userState.failedAttempts = 0;
      userState.lockedUntil = null;
      all[email.toLowerCase()] = userState;
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify(all));
    }

    return userState;
  }

  recordFailedLogin(email: string): { isLocked: boolean; remainingSeconds: number; attempts: number } {
    const all = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
    const key = email.toLowerCase();
    const current = all[key] || { failedAttempts: 0, lockedUntil: null, lastAttemptAt: null };

    current.failedAttempts += 1;
    current.lastAttemptAt = Date.now();

    let isLocked = false;
    let remainingSeconds = 0;

    if (current.failedAttempts >= 5) {
      // 60-second lockout
      current.lockedUntil = Date.now() + 60 * 1000;
      isLocked = true;
      remainingSeconds = 60;

      // Log lockout event
      this.addAuditLog({
        user_email: email,
        actor_name: 'Security Sentinel Sentinel',
        event: 'ACCOUNT_LOCKED_VELOCITY',
        ip_address: '192.0.2.14',
        location: 'San Francisco, US',
        user_agent: navigator.userAgent,
        metadata: { failedAttempts: current.failedAttempts, lockoutDurationSeconds: 60 }
      });

      // Dispatch security alert email to mock inbox
      this.dispatchEmail({
        to: email,
        subject: '⚠️ Security Alert: Suspicious Login Velocity Detected',
        type: 'SECURITY_ALERT',
        body: `We detected 5 consecutive failed sign-in attempts for your account from IP 192.0.2.14. For your protection, password authentication has been temporarily rate-limited for 60 seconds. If this wasn't you, consider rotating your credentials immediately.`,
        action_url: '#/forgot-password',
        action_label: 'Initiate Secure Password Reset'
      });
    }

    all[key] = current;
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(all));

    return { isLocked, remainingSeconds, attempts: current.failedAttempts };
  }

  resetFailedLogin(email: string) {
    const all = JSON.parse(localStorage.getItem(LOCKOUT_KEY) || '{}');
    delete all[email.toLowerCase()];
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(all));
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep last 100
    if (logs.length > 100) logs.pop();
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    return newLog;
  }

  dispatchEmail(email: Omit<DispatchedEmail, 'id' | 'timestamp'>): DispatchedEmail {
    const emails = this.getDispatchedEmails();
    const newEmail: DispatchedEmail = {
      ...email,
      id: `mail-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    emails.unshift(newEmail);
    if (emails.length > 20) emails.pop();
    localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
    return newEmail;
  }

  // Password reset tokens
  async createPasswordReset(email: string): Promise<{ rawToken: string; expiresAt: string }> {
    const rawToken = generateCryptoToken(32);
    const tokenHash = await sha256(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    const resets: any[] = JSON.parse(localStorage.getItem(RESETS_KEY) || '[]');
    resets.push({
      id: `rst-${Date.now()}`,
      email: email.toLowerCase(),
      token_hash: tokenHash,
      raw_token: rawToken,
      expires_at: expiresAt,
      used_at: null,
      created_at: new Date().toISOString()
    });
    localStorage.setItem(RESETS_KEY, JSON.stringify(resets));

    // Audit log
    this.addAuditLog({
      user_email: email,
      actor_name: 'Self-Service Recovery Portal',
      event: 'PASSWORD_RESET_REQUESTED',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { lifespan_minutes: 15 }
    });

    // Send mock email
    this.dispatchEmail({
      to: email,
      subject: '🔐 Reset Your Aegis Workspace Password',
      type: 'PASSWORD_RESET',
      body: `A password reset request was initiated for your Aegis workspace account. This single-use magic link is strictly time-budgeted for 15 minutes and will automatically invalidate upon completion.`,
      action_url: `#/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`,
      action_label: 'Complete Secure Password Reset'
    });

    return { rawToken, expiresAt };
  }

  async verifyPasswordResetToken(rawToken: string, email?: string): Promise<{ valid: boolean; reason?: string }> {
    const tokenHash = await sha256(rawToken);
    const resets: any[] = JSON.parse(localStorage.getItem(RESETS_KEY) || '[]');
    const record = resets.find(r => r.token_hash === tokenHash || r.raw_token === rawToken);

    if (!record) {
      return { valid: false, reason: 'Invalid or unknown cryptographic recovery token.' };
    }
    if (record.used_at) {
      return { valid: false, reason: 'This single-use recovery link has already been consumed.' };
    }
    if (new Date() > new Date(record.expires_at)) {
      return { valid: false, reason: 'This cryptographic recovery token expired after 15 minutes.' };
    }
    if (email && record.email.toLowerCase() !== email.toLowerCase()) {
      return { valid: false, reason: 'Target email mismatch for cryptographic recovery token.' };
    }

    return { valid: true };
  }

  async consumePasswordResetToken(rawToken: string, newPasswordHash: string): Promise<boolean> {
    const tokenHash = await sha256(rawToken);
    const resets: any[] = JSON.parse(localStorage.getItem(RESETS_KEY) || '[]');
    const record = resets.find(r => r.token_hash === tokenHash || r.raw_token === rawToken);

    if (!record || record.used_at || new Date() > new Date(record.expires_at)) {
      return false;
    }

    record.used_at = new Date().toISOString();
    localStorage.setItem(RESETS_KEY, JSON.stringify(resets));

    // Update user password
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === record.email.toLowerCase());
    if (user) {
      user.password_hash = newPasswordHash;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Audit log
      this.addAuditLog({
        user_id: user.id,
        user_email: user.email,
        actor_name: user.full_name,
        event: 'PASSWORD_RESET_COMPLETED',
        ip_address: '192.0.2.14',
        location: 'San Francisco, US',
        user_agent: navigator.userAgent,
        metadata: { token_id: record.id }
      });
    }

    return true;
  }

  // Session Management
  revokeSession(sessionId: string): boolean {
    const sessions = this.getSessions();
    const target = sessions.find(s => s.id === sessionId);
    if (!target) return false;

    const remaining = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(remaining));

    this.addAuditLog({
      user_id: target.user_id,
      user_email: this.getCurrentUser()?.email || 'user',
      actor_name: this.getCurrentUser()?.full_name || 'User',
      event: 'SESSION_REVOKED',
      ip_address: target.ip_address,
      location: target.location,
      user_agent: target.user_agent,
      metadata: { device_name: target.device_name, os: target.os, browser: target.browser }
    });

    return true;
  }

  revokeAllOtherSessions(): number {
    const sessions = this.getSessions();
    const current = sessions.find(s => s.is_current);
    const count = sessions.filter(s => !s.is_current).length;

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(current ? [current] : []));

    this.addAuditLog({
      user_email: this.getCurrentUser()?.email || 'user',
      actor_name: this.getCurrentUser()?.full_name || 'User',
      event: 'ALL_SESSIONS_REVOKED',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { revokedCount: count, retainedSessionId: current?.id }
    });

    return count;
  }

  // Roles & Permissions Governance
  updateRolePermissions(roleName: RoleName, permissions: PermissionAction[], isEscalationConfirmed = false): { success: boolean; error?: string } {
    if (roleName === 'Owner') {
      return { success: false, error: 'Owner permissions are system-locked and cannot be modified.' };
    }

    const roles = this.getRoles();
    const role = roles.find(r => r.name === roleName);
    if (!role) {
      return { success: false, error: 'Role not found.' };
    }

    // Guard: Prevent granting critical permissions without explicit confirmation
    const criticalPermissions = INITIAL_PERMISSIONS.filter(p => p.isCritical).map(p => p.action);
    const addedCritical = permissions.filter(p => criticalPermissions.includes(p) && !role.permissions.includes(p));

    if (addedCritical.length > 0 && !isEscalationConfirmed) {
      return {
        success: false,
        error: `Privilege escalation guard: Granting critical permission(s) [${addedCritical.join(', ')}] requires explicit elevated confirmation.`
      };
    }

    role.permissions = permissions;
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));

    this.addAuditLog({
      user_email: this.getCurrentUser()?.email || 'admin',
      actor_name: this.getCurrentUser()?.full_name || 'Admin',
      event: 'ROLE_PERMISSIONS_UPDATED',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { roleName, permissionCount: permissions.length, addedCritical }
    });

    return { success: true };
  }

  createCustomRole(name: string, description: string, inheritedFrom: string, permissions: PermissionAction[]): { success: boolean; role?: Role; error?: string } {
    const roles = this.getRoles();
    if (roles.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: 'A role with this name already exists.' };
    }

    const newRole: Role = {
      id: `role-custom-${Date.now()}`,
      name,
      description,
      is_system: false,
      color: '#0D9488',
      permissions,
      inherited_from: inheritedFrom,
      created_at: new Date().toISOString()
    };

    roles.push(newRole);
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));

    this.addAuditLog({
      user_email: this.getCurrentUser()?.email || 'admin',
      actor_name: this.getCurrentUser()?.full_name || 'Admin',
      event: 'CUSTOM_ROLE_CREATED',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { roleName: name, inheritedFrom, permissionCount: permissions.length }
    });

    return { success: true, role: newRole };
  }

  // Team Management & Invites
  createTeamInvite(email: string, role: RoleName): TeamInvite {
    const invites = this.getInvites();
    const token = generateCryptoToken(16);
    const currentUser = this.getCurrentUser();

    const newInvite: TeamInvite = {
      id: `inv-${Date.now()}`,
      email: email.toLowerCase(),
      role,
      invited_by: currentUser?.id || 'usr-owner-01',
      inviter_name: currentUser?.full_name || 'Workspace Lead',
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
      created_at: new Date().toISOString()
    };

    invites.unshift(newInvite);
    localStorage.setItem(INVITES_KEY, JSON.stringify(invites));

    this.addAuditLog({
      user_email: currentUser?.email || 'admin',
      actor_name: currentUser?.full_name || 'Admin',
      event: 'TEAM_MEMBER_INVITED',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { invitee: email, role, token }
    });

    this.dispatchEmail({
      to: email,
      subject: `👋 You have been invited to join the Aegis workspace as ${role}`,
      type: 'TEAM_INVITE',
      body: `${currentUser?.full_name || 'Workspace Administrator'} has invited you to collaborate in Aegis with role permissions scoped to "${role}". Click the link below to accept the invitation and activate your account.`,
      action_url: `#/register?inviteToken=${token}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`,
      action_label: 'Accept Invitation & Complete Profile'
    });

    return newInvite;
  }

  revokeInvite(inviteId: string): boolean {
    const invites = this.getInvites();
    const invite = invites.find(i => i.id === inviteId);
    if (!invite) return false;

    invite.status = 'revoked';
    localStorage.setItem(INVITES_KEY, JSON.stringify(invites));

    this.addAuditLog({
      user_email: this.getCurrentUser()?.email || 'admin',
      actor_name: this.getCurrentUser()?.full_name || 'Admin',
      event: 'INVITE_REVOKED',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { invitee: invite.email, role: invite.role }
    });

    return true;
  }

  changeUserRole(userId: string, newRole: RoleName): { success: boolean; error?: string } {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    const currentUser = this.getCurrentUser();
    // Guard: Least privilege - Admins cannot grant Owner, or demote the last Owner
    if (newRole === 'Owner' && currentUser?.role !== 'Owner') {
      return { success: false, error: 'Principle of least privilege: Only an existing Owner can transfer or grant Owner custody.' };
    }

    if (user.role === 'Owner' && newRole !== 'Owner') {
      const ownerCount = users.filter(u => u.role === 'Owner').length;
      if (ownerCount <= 1) {
        return { success: false, error: 'Governance guardrail: Organizations must maintain at least one verified active Owner.' };
      }
    }

    const previousRole = user.role;
    user.role = newRole;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // If current logged in user changed their own role, update session
    if (currentUser && currentUser.id === userId) {
      currentUser.role = newRole;
      this.setCurrentUser(currentUser);
    }

    this.addAuditLog({
      user_email: currentUser?.email || 'admin',
      actor_name: currentUser?.full_name || 'Admin',
      event: 'USER_ROLE_CHANGED',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { targetUser: user.email, previousRole, newRole }
    });

    return { success: true };
  }

  // Sudo Mode (Contextual Re-Authentication)
  setSudoMode(durationMinutes = 10) {
    const expires = Date.now() + durationMinutes * 60 * 1000;
    sessionStorage.setItem(SUDO_EXPIRES_KEY, expires.toString());

    this.addAuditLog({
      user_email: this.getCurrentUser()?.email || 'user',
      actor_name: this.getCurrentUser()?.full_name || 'User',
      event: 'SUDO_CHALLENGE_PASSED',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { ttl_minutes: durationMinutes }
    });
  }

  isSudoActive(): boolean {
    const raw = sessionStorage.getItem(SUDO_EXPIRES_KEY);
    if (!raw) return false;
    const expires = parseInt(raw, 10);
    return Date.now() < expires;
  }

  resetAllData() {
    localStorage.removeItem(PERMISSIONS_KEY);
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(AUDIT_LOGS_KEY);
    localStorage.removeItem(RESETS_KEY);
    localStorage.removeItem(INVITES_KEY);
    localStorage.removeItem(EMAILS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(SUDO_EXPIRES_KEY);
    this.init();
  }
}

export const authStorage = new StorageService();
