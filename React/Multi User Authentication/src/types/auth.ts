export type RoleName = 'Owner' | 'Admin' | 'Manager' | 'Member' | 'Auditor' | string;

export type PermissionAction =
  // Workspaces & Projects
  | 'projects:create'
  | 'projects:read'
  | 'projects:edit'
  | 'projects:delete'
  | 'org:update'
  | 'org:delete'
  // Team & Access Management
  | 'users:read'
  | 'users:invite'
  | 'users:manage_roles'
  | 'users:remove'
  // Billing & Invoicing
  | 'billing:view'
  | 'billing:manage'
  | 'billing:erase_payment'
  // Audit & Security Logs
  | 'audit:read'
  | 'audit:export'
  | 'security:sessions_revoke'
  | 'security:sudo_bypass';

export interface Permission {
  id: string;
  action: PermissionAction;
  category: 'Workspaces & Projects' | 'Team & Access Management' | 'Billing & Invoicing' | 'Audit & Security Logs';
  name: string;
  description: string;
  isCritical?: boolean;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  is_system: boolean;
  color: string;
  permissions: PermissionAction[];
  created_at: string;
  inherited_from?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: RoleName;
  is_verified: boolean;
  status: 'active' | 'suspended' | 'pending';
  last_login?: string;
  created_at: string;
  password_hash?: string;
}

export interface Session {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  user_agent: string;
  ip_address: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  location: string;
  last_active_at: string;
  expires_at: string;
  is_current: boolean;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  email: string;
  token_hash: string;
  raw_token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email: string;
  actor_name: string;
  event: 
    | 'USER_LOGIN_SUCCESS'
    | 'USER_LOGIN_FAILED'
    | 'ACCOUNT_LOCKED_VELOCITY'
    | 'PASSWORD_RESET_REQUESTED'
    | 'PASSWORD_RESET_COMPLETED'
    | 'SESSION_REVOKED'
    | 'ALL_SESSIONS_REVOKED'
    | 'ROLE_PERMISSIONS_UPDATED'
    | 'CUSTOM_ROLE_CREATED'
    | 'USER_ROLE_CHANGED'
    | 'TEAM_MEMBER_INVITED'
    | 'INVITE_REVOKED'
    | 'SUDO_CHALLENGE_PASSED'
    | 'CRITICAL_PERMISSION_MUTATED';
  ip_address: string;
  location: string;
  user_agent: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: RoleName;
  invited_by: string;
  inviter_name: string;
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
}

export interface DispatchedEmail {
  id: string;
  to: string;
  subject: string;
  type: 'PASSWORD_RESET' | 'TEAM_INVITE' | 'SECURITY_ALERT';
  body: string;
  action_url: string;
  action_label: string;
  timestamp: string;
}

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
  lastAttemptAt: number | null;
}
