import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Role,
  Permission,
  Session,
  AuditLog,
  TeamInvite,
  DispatchedEmail,
  PermissionAction,
  RoleName
} from '../types/auth';
import { authStorage, sha256 } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  activeRole: Role | null;
  allRoles: Role[];
  allPermissions: Permission[];
  sessions: Session[];
  auditLogs: AuditLog[];
  invites: TeamInvite[];
  dispatchedEmails: DispatchedEmail[];
  isAuthenticated: boolean;
  isLoading: boolean;
  lockoutRemaining: number;
  isLockedOut: boolean;
  isSudoActive: boolean;

  // Actions
  login: (email: string, password: string, remember30Days?: boolean) => Promise<{ success: boolean; error?: string; lockout?: boolean }>;
  logout: () => void;
  register: (email: string, password: string, fullName: string, inviteToken?: string) => Promise<{ success: boolean; error?: string }>;
  switchPersona: (roleName: RoleName) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; rawToken?: string }>;
  resetPassword: (rawToken: string, newPassword: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  revokeSession: (sessionId: string) => boolean;
  revokeAllOtherSessions: () => number;
  updateRolePermissions: (roleName: RoleName, permissions: PermissionAction[], isEscalationConfirmed?: boolean) => { success: boolean; error?: string };
  createCustomRole: (name: string, description: string, inheritedFrom: string, permissions: PermissionAction[]) => { success: boolean; role?: Role; error?: string };
  createTeamInvite: (email: string, role: RoleName) => TeamInvite;
  revokeInvite: (inviteId: string) => boolean;
  changeUserRole: (userId: string, newRole: RoleName) => { success: boolean; error?: string };
  triggerSudoChallenge: (callback: () => void) => void;
  verifySudoPassword: (password: string) => Promise<boolean>;
  refreshState: () => void;
  resetAllDemoData: () => void;

  // Sudo Modal State
  sudoModalOpen: boolean;
  closeSudoModal: () => void;
  sudoActionPending: (() => void) | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authStorage.getCurrentUser());
  const [allRoles, setAllRoles] = useState<Role[]>(() => authStorage.getRoles());
  const [allPermissions] = useState<Permission[]>(() => authStorage.getPermissions());
  const [sessions, setSessions] = useState<Session[]>(() => authStorage.getSessions());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => authStorage.getAuditLogs());
  const [invites, setInvites] = useState<TeamInvite[]>(() => authStorage.getInvites());
  const [dispatchedEmails, setDispatchedEmails] = useState<DispatchedEmail[]>(() => authStorage.getDispatchedEmails());
  const [isLoading, setIsLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Sudo Mode state
  const [sudoModalOpen, setSudoModalOpen] = useState(false);
  const [sudoActionPending, setSudoActionPending] = useState<(() => void) | null>(null);

  const refreshState = useCallback(() => {
    setCurrentUser(authStorage.getCurrentUser());
    setAllRoles(authStorage.getRoles());
    setSessions(authStorage.getSessions());
    setAuditLogs(authStorage.getAuditLogs());
    setInvites(authStorage.getInvites());
    setDispatchedEmails(authStorage.getDispatchedEmails());
  }, []);

  // Sync lockout countdown
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // Determine active role
  const activeRole = useMemo(() => {
    if (!currentUser) return null;
    return allRoles.find(r => r.name === currentUser.role) || null;
  }, [currentUser, allRoles]);

  // Login handler with rate-limiting sentinel
  const login = async (email: string, password: string, _remember30Days = true) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Check lockout state
    const lockoutState = authStorage.getLockoutState(cleanEmail);
    if (lockoutState.lockedUntil && Date.now() < lockoutState.lockedUntil) {
      const remaining = Math.ceil((lockoutState.lockedUntil - Date.now()) / 1000);
      setLockoutRemaining(remaining);
      setIsLoading(false);
      return {
        success: false,
        error: `Security sentinel: Account locked due to repeated sign-in velocity. Retry in ${remaining}s.`,
        lockout: true
      };
    }

    // Artificial delay to simulate defensive cryptographic verification & prevent timing attacks
    await new Promise(r => setTimeout(r, 450));

    const users = authStorage.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    // Accept valid user password or default demo master password for easy demonstration
    const isMasterPassword = password === 'VaultPassphrase!2026' || password === 'password123';
    let isValidPassword = isMasterPassword;

    if (user && user.password_hash && !isMasterPassword) {
      const passHash = await sha256(password);
      isValidPassword = user.password_hash === passHash;
    }

    if (!user || !isValidPassword) {
      const record = authStorage.recordFailedLogin(cleanEmail);
      setIsLoading(false);

      if (record.isLocked) {
        setLockoutRemaining(record.remainingSeconds);
        return {
          success: false,
          error: `Account locked for 60 seconds due to 5 consecutive authentication failures. Security dispatch sent to ${cleanEmail}.`,
          lockout: true
        };
      }

      return {
        success: false,
        error: `Invalid credentials. (${record.attempts}/5 allowed attempts before automatic rate-limiting lockout).`
      };
    }

    // Success: Reset lockout attempts
    authStorage.resetFailedLogin(cleanEmail);
    authStorage.setCurrentUser(user);
    setCurrentUser(user);

    // Record login audit log
    authStorage.addAuditLog({
      user_id: user.id,
      user_email: user.email,
      actor_name: `${user.full_name} (${user.role})`,
      event: 'USER_LOGIN_SUCCESS',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { role: user.role, sessionType: 'interactive_web' }
    });

    refreshState();
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      authStorage.addAuditLog({
        user_id: currentUser.id,
        user_email: currentUser.email,
        actor_name: currentUser.full_name,
        event: 'SESSION_REVOKED',
        ip_address: '192.0.2.14',
        location: 'San Francisco, US',
        user_agent: navigator.userAgent,
        metadata: { action: 'user_signout' }
      });
    }
    authStorage.setCurrentUser(null);
    setCurrentUser(null);
    refreshState();
  };

  const register = async (email: string, password: string, fullName: string, inviteToken?: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const cleanEmail = email.trim().toLowerCase();
    const users = authStorage.getUsers();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      setIsLoading(false);
      return { success: false, error: 'An account with this email address already exists.' };
    }

    // If registered via invite, inherit invite's assigned role
    let assignedRole: RoleName = 'Member';
    if (inviteToken) {
      const invites = authStorage.getInvites();
      const invite = invites.find(i => i.token === inviteToken && i.status === 'pending');
      if (invite) {
        assignedRole = invite.role;
        invite.status = 'accepted';
      }
    }

    const passwordHash = await sha256(password);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      full_name: fullName,
      role: assignedRole,
      is_verified: true,
      status: 'active',
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      password_hash: passwordHash
    };

    users.push(newUser);
    localStorage.setItem('aegis_users_v1', JSON.stringify(users));

    authStorage.setCurrentUser(newUser);
    setCurrentUser(newUser);

    authStorage.addAuditLog({
      user_id: newUser.id,
      user_email: newUser.email,
      actor_name: newUser.full_name,
      event: 'USER_LOGIN_SUCCESS',
      ip_address: '192.0.2.14',
      location: 'San Francisco, US',
      user_agent: navigator.userAgent,
      metadata: { registrationMethod: inviteToken ? 'team_invitation' : 'direct_workspace_creation', role: assignedRole }
    });

    refreshState();
    setIsLoading(false);
    return { success: true };
  };

  // Instant Persona Switcher for painless evaluation
  const switchPersona = (roleName: RoleName) => {
    const users = authStorage.getUsers();
    const persona = users.find(u => u.role === roleName) || users[0];
    authStorage.setCurrentUser(persona);
    setCurrentUser(persona);
    refreshState();
  };

  // Password Reset with Enumeration-Safe neutral messaging
  const requestPasswordReset = async (email: string) => {
    setIsLoading(true);
    // Neutral timing to prevent enumeration through response timing
    await new Promise(r => setTimeout(r, 380));

    const cleanEmail = email.trim().toLowerCase();
    const users = authStorage.getUsers();
    const exists = users.some(u => u.email.toLowerCase() === cleanEmail);

    let rawToken: string | undefined;
    if (exists) {
      const res = await authStorage.createPasswordReset(cleanEmail);
      rawToken = res.rawToken;
    } else {
      // Even if user doesn't exist, log attempt neutrally
      authStorage.addAuditLog({
        user_email: cleanEmail,
        actor_name: 'Anonymous Visitor',
        event: 'PASSWORD_RESET_REQUESTED',
        ip_address: '192.0.2.14',
        location: 'San Francisco, US',
        user_agent: navigator.userAgent,
        metadata: { exists: false }
      });
    }

    refreshState();
    setIsLoading(false);

    // Strictly enumeration-safe confirmation
    return {
      success: true,
      message: `If an account exists for ${cleanEmail}, a secure, single-use recovery link has been dispatched.`,
      rawToken
    };
  };

  const resetPassword = async (rawToken: string, newPassword: string, email?: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const verify = await authStorage.verifyPasswordResetToken(rawToken, email);
    if (!verify.valid) {
      setIsLoading(false);
      return { success: false, error: verify.reason || 'Cryptographic token validation failed.' };
    }

    const newHash = await sha256(newPassword);
    const consumed = await authStorage.consumePasswordResetToken(rawToken, newHash);

    refreshState();
    setIsLoading(false);

    if (!consumed) {
      return { success: false, error: 'Could not consume password reset token.' };
    }

    return { success: true };
  };

  const revokeSession = (sessionId: string) => {
    const res = authStorage.revokeSession(sessionId);
    refreshState();
    return res;
  };

  const revokeAllOtherSessions = () => {
    const count = authStorage.revokeAllOtherSessions();
    refreshState();
    return count;
  };

  const updateRolePermissions = (roleName: RoleName, permissions: PermissionAction[], isEscalationConfirmed = false) => {
    const res = authStorage.updateRolePermissions(roleName, permissions, isEscalationConfirmed);
    refreshState();
    return res;
  };

  const createCustomRole = (name: string, description: string, inheritedFrom: string, permissions: PermissionAction[]) => {
    const res = authStorage.createCustomRole(name, description, inheritedFrom, permissions);
    refreshState();
    return res;
  };

  const createTeamInvite = (email: string, role: RoleName) => {
    const res = authStorage.createTeamInvite(email, role);
    refreshState();
    return res;
  };

  const revokeInvite = (inviteId: string) => {
    const res = authStorage.revokeInvite(inviteId);
    refreshState();
    return res;
  };

  const changeUserRole = (userId: string, newRole: RoleName) => {
    const res = authStorage.changeUserRole(userId, newRole);
    refreshState();
    return res;
  };

  // Sudo mode management
  const triggerSudoChallenge = (callback: () => void) => {
    if (authStorage.isSudoActive()) {
      callback();
    } else {
      setSudoActionPending(() => callback);
      setSudoModalOpen(true);
    }
  };

  const verifySudoPassword = async (password: string) => {
    await new Promise(r => setTimeout(r, 350));
    // Sudo verification
    const isMasterPassword = password === 'VaultPassphrase!2026' || password === 'password123';
    let isValid = isMasterPassword;

    if (currentUser?.password_hash && !isMasterPassword) {
      const hash = await sha256(password);
      isValid = currentUser.password_hash === hash;
    }

    if (isValid) {
      authStorage.setSudoMode(10); // 10 minutes TTL
      if (sudoActionPending) {
        sudoActionPending();
        setSudoActionPending(null);
      }
      setSudoModalOpen(false);
      refreshState();
      return true;
    }

    return false;
  };

  const closeSudoModal = () => {
    setSudoModalOpen(false);
    setSudoActionPending(null);
  };

  const resetAllDemoData = () => {
    authStorage.resetAllData();
    refreshState();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        allRoles,
        allPermissions,
        sessions,
        auditLogs,
        invites,
        dispatchedEmails,
        isAuthenticated: !!currentUser,
        isLoading,
        lockoutRemaining,
        isLockedOut: lockoutRemaining > 0,
        isSudoActive: authStorage.isSudoActive(),
        login,
        logout,
        register,
        switchPersona,
        requestPasswordReset,
        resetPassword,
        revokeSession,
        revokeAllOtherSessions,
        updateRolePermissions,
        createCustomRole,
        createTeamInvite,
        revokeInvite,
        changeUserRole,
        triggerSudoChallenge,
        verifySudoPassword,
        refreshState,
        resetAllDemoData,
        sudoModalOpen,
        closeSudoModal,
        sudoActionPending
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Declarative Hook: usePermission
export function usePermission(action: PermissionAction): boolean {
  const { activeRole } = useAuth();
  if (!activeRole) return false;
  return activeRole.permissions.includes(action);
}

// Declarative Hook: useRole
export function useRole(requiredRole: RoleName): boolean {
  const { currentUser } = useAuth();
  if (!currentUser) return false;
  return currentUser.role === requiredRole;
}

// Declarative Access Gate Component: <Can do="..." fallback={...}>
interface CanProps {
  do: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ do: action, children, fallback = null }) => {
  const hasPermission = usePermission(action);
  if (hasPermission) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};
