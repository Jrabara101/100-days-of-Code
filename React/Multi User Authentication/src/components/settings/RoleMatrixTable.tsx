import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleName, PermissionAction, Role } from '../../types/auth';
import { RoleBadge } from '../common/RoleBadge';
import {
  Shield,
  Plus,
  AlertTriangle,
  Lock,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';

interface RoleMatrixTableProps {
  onOpenInviteModal?: () => void;
}

export const RoleMatrixTable: React.FC<RoleMatrixTableProps> = ({ onOpenInviteModal }) => {
  const {
    allRoles,
    allPermissions,
    updateRolePermissions,
    createCustomRole,
    triggerSudoChallenge,
    currentUser
  } = useAuth();

  // Active role selected for detailed view or filter
  const [selectedRoleTab, setSelectedRoleTab] = useState<RoleName>('Admin');

  // Accordion open states for the 4 permission domains
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    'Workspaces & Projects': true,
    'Team & Access Management': true,
    'Billing & Invoicing': true,
    'Audit & Security Logs': true
  });

  // Privilege escalation warning modal state
  const [escalationWarning, setEscalationWarning] = useState<{
    roleName: RoleName;
    permissionAction: PermissionAction;
    permissionName: string;
    newPermissions: PermissionAction[];
  } | null>(null);

  // Custom Role Drawer state
  const [isCustomRoleDrawerOpen, setIsCustomRoleDrawerOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [inheritFrom, setInheritFrom] = useState<RoleName>('Member');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionAction[]>([]);
  const [drawerError, setDrawerError] = useState('');

  // Toast feedback
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  // Check if role has a permission
  const hasPermission = (role: Role, action: PermissionAction) => {
    return role.permissions.includes(action);
  };

  // Toggle permission capability
  const handleToggle = (role: Role, action: PermissionAction) => {
    if (role.name === 'Owner') {
      showToast('Owner permissions cannot be revoked under any circumstance.', 'error');
      return;
    }

    // Guard: Only Owner and Admin can modify permissions
    if (currentUser?.role !== 'Owner' && currentUser?.role !== 'Admin') {
      showToast('Your active role lacks "users:manage_roles" privilege to alter the matrix.', 'error');
      return;
    }

    const permObj = allPermissions.find(p => p.action === action);
    const currentlyEnabled = role.permissions.includes(action);

    let nextPermissions: PermissionAction[];
    if (currentlyEnabled) {
      nextPermissions = role.permissions.filter(p => p !== action);
    } else {
      nextPermissions = [...role.permissions, action];
    }

    // If enabling a CRITICAL permission, prompt escalation warning
    if (!currentlyEnabled && permObj?.isCritical) {
      setEscalationWarning({
        roleName: role.name,
        permissionAction: action,
        permissionName: permObj.name,
        newPermissions: nextPermissions
      });
      return;
    }

    // Apply update
    const res = updateRolePermissions(role.name, nextPermissions);
    if (!res.success) {
      showToast(res.error || 'Failed to update permission.', 'error');
    } else {
      showToast(`Updated capability "${permObj?.name}" for ${role.name}.`);
    }
  };

  // Confirm privilege escalation
  const confirmEscalation = () => {
    if (!escalationWarning) return;

    // Trigger sudo challenge for critical permissions!
    triggerSudoChallenge(() => {
      const res = updateRolePermissions(escalationWarning.roleName, escalationWarning.newPermissions, true);
      if (res.success) {
        showToast(`Escalated critical capability "${escalationWarning.permissionName}" for ${escalationWarning.roleName}.`);
      } else {
        showToast(res.error || 'Escalation failed.', 'error');
      }
      setEscalationWarning(null);
    });
  };

  // Open drawer and pre-fill inherited permissions
  const handleOpenDrawer = () => {
    const parentRole = allRoles.find(r => r.name === inheritFrom);
    setSelectedPermissions(parentRole ? [...parentRole.permissions] : []);
    setIsCustomRoleDrawerOpen(true);
  };

  const handleInheritChange = (parentName: RoleName) => {
    setInheritFrom(parentName);
    const parent = allRoles.find(r => r.name === parentName);
    if (parent) {
      setSelectedPermissions([...parent.permissions]);
    }
  };

  const handleDrawerPermissionToggle = (action: PermissionAction) => {
    setSelectedPermissions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError('');

    if (!customRoleName.trim()) {
      setDrawerError('Please provide a unique role identifier.');
      return;
    }

    const res = createCustomRole(customRoleName.trim(), customRoleDesc, inheritFrom, selectedPermissions);
    if (!res.success) {
      setDrawerError(res.error || 'Failed to create role.');
      return;
    }

    showToast(`Custom role "${customRoleName}" successfully created.`);
    setIsCustomRoleDrawerOpen(false);
    setSelectedRoleTab(customRoleName.trim());
    setCustomRoleName('');
    setCustomRoleDesc('');
  };

  // Domains list
  const domains: ('Workspaces & Projects' | 'Team & Access Management' | 'Billing & Invoicing' | 'Audit & Security Logs')[] = [
    'Workspaces & Projects',
    'Team & Access Management',
    'Billing & Invoicing',
    'Audit & Security Logs'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 text-xs font-medium animate-slide-in ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-500/90 text-white border-emerald-400'
              : 'bg-red-500/90 text-white border-red-400'
          }`}
        >
          {feedbackToast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-vault-text flex items-center gap-2.5">
            Team Roles & Capability Matrix
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              PBAC / RBAC
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-vault-muted mt-1">
            Govern scoped operational privileges and inspect declarative access gates across the tenant.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenDrawer}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-surface hover:bg-slate-50 dark:hover:bg-vault-elevated text-xs font-medium text-slate-700 dark:text-vault-text transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Custom Role Builder</span>
          </button>

          {onOpenInviteModal && (
            <button
              onClick={onOpenInviteModal}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite New Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-vault-border">
        <span className="text-xs font-medium text-slate-400 dark:text-vault-muted mr-1 hidden sm:inline">
          Filter Focus:
        </span>
        {allRoles.map(r => {
          const isSelected = selectedRoleTab === r.name;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRoleTab(r.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all font-medium shrink-0 ${
                isSelected
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-vault-surface hover:bg-slate-200 dark:hover:bg-vault-elevated text-slate-600 dark:text-vault-muted'
              }`}
            >
              <RoleBadge role={r.name} size="sm" showIcon={false} />
              <span>{r.name}</span>
              <span className="text-[10px] font-mono opacity-60">
                ({r.permissions.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Permissions Matrix Table */}
      <div className="border border-slate-200 dark:border-vault-border rounded-2xl bg-white dark:bg-vault-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-50 dark:bg-vault-elevated border-b border-slate-200 dark:border-vault-border text-slate-600 dark:text-vault-muted font-medium">
                <th className="py-3 px-4 w-[38%] min-w-[280px]">Operational Capability & Scope</th>
                {allRoles.map(role => (
                  <th
                    key={role.id}
                    className={`py-3 px-3 text-center min-w-[100px] transition-colors ${
                      selectedRoleTab === role.name ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <RoleBadge role={role.name} size="sm" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body Grouped by Domain */}
            <tbody className="divide-y divide-slate-100 dark:divide-vault-border">
              {domains.map(domain => {
                const domainPermissions = allPermissions.filter(p => p.category === domain);
                const isExpanded = expandedDomains[domain];

                return (
                  <React.Fragment key={domain}>
                    {/* Domain Category Header Row */}
                    <tr
                      onClick={() => toggleDomain(domain)}
                      className="bg-slate-50/70 dark:bg-vault-elevated/40 hover:bg-slate-100/70 dark:hover:bg-vault-elevated/70 cursor-pointer transition-colors"
                    >
                      <td colSpan={allRoles.length + 1} className="py-2.5 px-4 font-semibold text-slate-800 dark:text-vault-text">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{domain}</span>
                          <span className="text-[11px] font-mono font-normal text-slate-400">
                            ({domainPermissions.length} capabilities)
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Permission Items in Domain */}
                    {isExpanded &&
                      domainPermissions.map(perm => (
                        <tr
                          key={perm.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-vault-elevated/30 transition-colors"
                        >
                          {/* Capability Name & Description */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-vault-text">
                                  {perm.name}
                                </span>
                                {perm.isCritical && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Critical
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-vault-muted leading-relaxed">
                                {perm.description}
                              </p>
                              <span className="font-mono text-[10px] text-slate-400 block pt-0.5">
                                {perm.action}
                              </span>
                            </div>
                          </td>

                          {/* Role Toggle Switches */}
                          {allRoles.map(role => {
                            const enabled = hasPermission(role, perm.action);
                            const isOwner = role.name === 'Owner';
                            const isSelectedCol = selectedRoleTab === role.name;

                            return (
                              <td
                                key={`${perm.id}-${role.id}`}
                                className={`py-3 px-3 text-center align-middle transition-colors ${
                                  isSelectedCol ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''
                                }`}
                              >
                                {isOwner ? (
                                  <div
                                    className="inline-flex items-center justify-center cursor-not-allowed group relative"
                                    title="Owner permissions cannot be revoked"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                      <Lock className="w-3.5 h-3.5" />
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={enabled}
                                    onClick={() => handleToggle(role, perm.action)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                      enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-vault-border'
                                    }`}
                                    title={`${enabled ? 'Revoke' : 'Grant'} ${perm.name} for ${role.name}`}
                                    aria-label={`Toggle ${perm.name} for ${role.name}`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                        enabled ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Privilege Escalation Warning Modal */}
      {escalationWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-vault-elevated border border-slate-200 dark:border-vault-border rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-vault-text">
                Privilege Escalation Guardrail
              </h3>
              <p className="text-xs text-slate-500 dark:text-vault-muted mt-1 leading-relaxed">
                You are about to grant the critical operational capability{' '}
                <strong className="text-amber-600 dark:text-amber-400 font-mono">
                  "{escalationWarning.permissionName}"
                </strong>{' '}
                to the role <strong className="text-slate-800 dark:text-white">{escalationWarning.roleName}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              This capability allows destructive data destruction, billing alterations, or role tampering. Authorizing this action will require contextual sudo re-authentication.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEscalationWarning(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-surface rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEscalation}
                className="px-4 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-all"
              >
                Proceed & Challenge Sudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Role Builder Slide-Over Drawer */}
      {isCustomRoleDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg h-full bg-white dark:bg-vault-surface border-l border-slate-200 dark:border-vault-border shadow-2xl flex flex-col animate-slide-in">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-vault-border flex items-center justify-between bg-slate-50 dark:bg-vault-elevated">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-vault-text">
                    Custom Role Blueprint Builder
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-vault-muted">
                    Author tailored privilege scopes inherited from foundational roles
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomRoleDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-vault-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Form */}
            <form onSubmit={handleCreateCustomRole} className="flex-1 overflow-y-auto p-5 space-y-5">
              {drawerError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                  {drawerError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
                  Role Identifier Name
                </label>
                <input
                  type="text"
                  value={customRoleName}
                  onChange={e => setCustomRoleName(e.target.value)}
                  placeholder="e.g. Release Engineer, DevOps Lead"
                  required
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-elevated text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
                  Role Description & Justification
                </label>
                <textarea
                  value={customRoleDesc}
                  onChange={e => setCustomRoleDesc(e.target.value)}
                  placeholder="Explain why this custom privilege scope is needed..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-elevated text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
                  Inherit Baseline Permissions From
                </label>
                <select
                  value={inheritFrom}
                  onChange={e => handleInheritChange(e.target.value as RoleName)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-elevated text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Member">Member (Standard Baseline)</option>
                  <option value="Manager">Manager (Project Lead Baseline)</option>
                  <option value="Admin">Admin (Governance Baseline)</option>
                  <option value="Auditor">Auditor (Compliance Baseline)</option>
                </select>
              </div>

              {/* Scoped Permissions Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-vault-text">
                    Select Granted Capabilities ({selectedPermissions.length} of {allPermissions.length})
                  </label>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {domains.map(domain => {
                    const domainPerms = allPermissions.filter(p => p.category === domain);
                    return (
                      <div key={domain} className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          {domain}
                        </span>
                        <div className="space-y-1">
                          {domainPerms.map(perm => {
                            const isChecked = selectedPermissions.includes(perm.action);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-blue-500/5 border-blue-500/30 text-slate-900 dark:text-white'
                                    : 'border-slate-200 dark:border-vault-border text-slate-500 dark:text-vault-muted'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleDrawerPermissionToggle(perm.action)}
                                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium">{perm.name}</span>
                                    {perm.isCritical && (
                                      <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-500">
                                        Critical
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400">{perm.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-vault-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCustomRoleDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-surface rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
                >
                  Create & Register Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
