import React, { useState } from 'react';
import { useAuth, Can, usePermission } from '../../context/AuthContext';
import { RoleBadge } from '../common/RoleBadge';
import { RoleMatrixTable } from '../settings/RoleMatrixTable';
import { SessionManager } from '../settings/SessionManager';
import { TeamMembersManager } from '../settings/TeamMembersManager';
import { AccessDenied } from '../common/AccessDenied';
import {
  Shield,
  LayoutDashboard,
  KeyRound,
  Laptop,
  Users,
  LogOut,
  FolderGit2,
  Lock,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  Plus
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { currentUser, logout, isSudoActive, isLockedOut, lockoutRemaining } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'security' | 'team'>('overview');

  // Capability checks
  const canManageRoles = usePermission('users:manage_roles');
  const canRevokeSessions = usePermission('security:sessions_revoke');
  const canReadUsers = usePermission('users:read');
  const canCreateProjects = usePermission('projects:create');

  // Interactive dummy projects
  const [projects] = useState([
    { id: 'p1', name: 'Identity Engine v3', env: 'Production', region: 'us-east-1', status: 'Healthy' },
    { id: 'p2', name: 'Biometric Auth Gateway', env: 'Staging', region: 'eu-central-1', status: 'Building' },
    { id: 'p3', name: 'Zero-Trust Proxy Node', env: 'Production', region: 'ap-northeast-1', status: 'Healthy' }
  ]);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-50 dark:bg-vault-bg text-slate-900 dark:text-vault-text transition-colors">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-vault-surface border-r border-slate-200 dark:border-vault-border flex flex-col shrink-0">
        {/* Workspace Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-vault-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-display text-slate-900 dark:text-vault-text leading-tight">
                Aegis Enterprise
              </h2>
              <span className="text-[10px] font-mono text-slate-400">Org ID: tenant_ae99</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-elevated'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Workspace Overview</span>
            </div>
            {activeTab === 'overview' && <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'matrix'
                ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-elevated'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4" />
              <span>Roles & Capabilities</span>
            </div>
            {!canManageRoles && <Lock className="w-3 h-3 text-slate-400" />}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-elevated'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Laptop className="w-4 h-4" />
              <span>Sessions & Security</span>
            </div>
            {isSudoActive && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'team'
                ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-elevated'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>Team Roster & Invites</span>
            </div>
          </button>
        </nav>

        {/* Current User Card */}
        <div className="p-3.5 m-3 rounded-2xl bg-slate-50 dark:bg-vault-elevated border border-slate-200 dark:border-vault-border space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {currentUser?.full_name.slice(0, 2) || 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-slate-900 dark:text-vault-text truncate block">
                  {currentUser?.full_name}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono truncate block">
                {currentUser?.email}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-vault-border/60">
            {currentUser && <RoleBadge role={currentUser.role} size="sm" />}
            <button
              onClick={logout}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              title="Sign out of current workspace"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full overflow-y-auto">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Headline */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-vault-text">
                  Welcome back, {currentUser?.full_name.split(' ')[0]}
                </h1>
                <p className="text-xs text-slate-500 dark:text-vault-muted mt-0.5">
                  Account health verified • Sovereign session bound with zero trust telemetry
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentUser && <RoleBadge role={currentUser.role} size="md" />}
              </div>
            </div>

            {/* Health Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-vault-surface border border-slate-200 dark:border-vault-border shadow-subtle space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Assigned Authority</span>
                  <KeyRound className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-vault-text">
                  {currentUser?.role}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-vault-muted">
                  Principle of least privilege active
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-vault-surface border border-slate-200 dark:border-vault-border shadow-subtle space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Connected Devices</span>
                  <Laptop className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-vault-text">
                  4 Authorized
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  No untrusted anomalies
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-vault-surface border border-slate-200 dark:border-vault-border shadow-subtle space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Sudo Challenge Mode</span>
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-vault-text">
                  {isSudoActive ? 'Elevated (10m)' : 'Standby'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-vault-muted">
                  Required for critical mutations
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-vault-surface border border-slate-200 dark:border-vault-border shadow-subtle space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Lockout Sentinel</span>
                  <AlertOctagon className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-vault-text">
                  {isLockedOut ? `Locked (${lockoutRemaining}s)` : 'Armed (5/5 max)'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-vault-muted">
                  Sliding velocity limiter
                </p>
              </div>
            </div>

            {/* Declarative Gated Projects Section */}
            <div className="p-6 rounded-2xl bg-white dark:bg-vault-surface border border-slate-200 dark:border-vault-border space-y-4 shadow-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-vault-text flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-blue-500" />
                    <span>Active Tenant Workspaces</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-vault-muted mt-0.5">
                    Demonstrating declarative <code className="font-mono text-blue-500">&lt;Can do="projects:create"&gt;</code> access gates.
                  </p>
                </div>

                {/* Declarative Access Gate */}
                <Can
                  do="projects:create"
                  fallback={
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-vault-elevated px-2 py-1 rounded">
                      Creation Locked
                    </span>
                  }
                >
                  <button className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Project</span>
                  </button>
                </Can>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {projects.map(proj => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-elevated space-y-2 hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-vault-text">
                        {proj.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                        {proj.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{proj.env}</span>
                      <span>{proj.region}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Link Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('matrix')}
                className="p-4 rounded-xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-surface hover:bg-slate-50 dark:hover:bg-vault-elevated text-left space-y-1 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-vault-text">
                  <span>Inspect Capability Matrix</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-vault-muted">
                  Toggle granular privileges for Owner, Admin, Manager, Member, and Auditor.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className="p-4 rounded-xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-surface hover:bg-slate-50 dark:hover:bg-vault-elevated text-left space-y-1 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-vault-text">
                  <span>Manage Active Sessions</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-vault-muted">
                  Audit device locations and trigger 1-click panic killswitch revocation.
                </p>
              </button>

              <button
                onClick={() => setActiveTab('team')}
                className="p-4 rounded-xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-surface hover:bg-slate-50 dark:hover:bg-vault-elevated text-left space-y-1 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-vault-text">
                  <span>Invite Team Members</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-vault-muted">
                  Dispatch tokenized invitations with pre-configured role assignments.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* MATRIX TAB WITH ACCESS GATE */}
        {activeTab === 'matrix' && (
          canManageRoles ? (
            <RoleMatrixTable onOpenInviteModal={() => setActiveTab('team')} />
          ) : (
            <AccessDenied
              requiredPermission="users:manage_roles"
              onGoBack={() => setActiveTab('overview')}
            />
          )
        )}

        {/* SECURITY & SESSIONS TAB */}
        {activeTab === 'security' && <SessionManager />}

        {/* TEAM MEMBERS TAB */}
        {activeTab === 'team' && (
          canReadUsers ? (
            <TeamMembersManager />
          ) : (
            <AccessDenied
              requiredPermission="users:read"
              onGoBack={() => setActiveTab('overview')}
            />
          )
        )}
      </main>
    </div>
  );
};
