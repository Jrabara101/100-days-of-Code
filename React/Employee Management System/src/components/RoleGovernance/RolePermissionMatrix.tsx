import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Lock, 
  Plus, 
  AlertCircle, 
  History, 
  Check, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { storage } from '../../services/storageService';
import { Role, PermissionScope, ActingDelegation } from '../../types';
import confetti from 'canvas-confetti';

export const RolePermissionMatrix: React.FC = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role-manager');
  const [activeTab, setActiveTab] = useState<'matrix' | 'delegations' | 'audit'>('matrix');
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [actingManagerId, setActingManagerId] = useState('');
  const [delegationStart, setDelegationStart] = useState('2026-11-10');
  const [delegationEnd, setDelegationEnd] = useState('2026-11-20');
  const [delegationReason, setDelegationReason] = useState('Annual family sabbatical');

  const allRoles = storage.getRoles();
  const allEmployees = storage.getEmployees();
  const selectedRole = allRoles.find(r => r.id === selectedRoleId) || allRoles[0];
  const delegations = storage.getDelegations();
  const auditLogs = storage.getAuditLogs();
  const activeEmp = storage.getActiveEmployee();

  const scopeOptions: { value: PermissionScope; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'own', label: 'Own Only' },
    { value: 'direct_reports', label: 'Direct Reports' },
    { value: 'department', label: 'Department' },
    { value: 'all', label: 'Entire Org' }
  ];

  const handleUpdateScope = (domain: keyof Role['permissions'], newScope: PermissionScope) => {
    const updatedPermissions = {
      ...selectedRole.permissions,
      [domain]: newScope
    };
    storage.updateRolePermissions(selectedRole.id, updatedPermissions);
    confetti({ particleCount: 20, spread: 40 });
  };

  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmp || !actingManagerId) return;

    storage.addDelegation({
      managerId: activeEmp.id,
      actingManagerId,
      startDate: delegationStart,
      endDate: delegationEnd,
      reason: delegationReason,
      isActive: true,
      delegatedScopes: ['leave:approve', 'attendance:manage', 'acting:manager_authority']
    });

    setShowDelegationModal(false);
    confetti({ particleCount: 40, spread: 60 });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
            Role Governance & Scoped Permission Matrix (RBAC)
          </h1>
          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">
            Field-Level Shielding
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Relational authority scopes, temporary acting delegations, and immutable access security logs.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-divider-light dark:border-divider-dark">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'border-brand text-brand dark:text-brand-dark'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Interactive Scope Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('delegations')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'delegations'
              ? 'border-brand text-brand dark:text-brand-dark'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Acting Delegations ({delegations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-brand text-brand dark:text-brand-dark'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE SCOPE MATRIX */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Rail (Role Hierarchy List - 260px / 4 cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Organizational Roles Hierarchy
            </h3>

            {allRoles.map(r => {
              const isSelected = r.id === selectedRoleId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-sm ring-1 ring-brand/30'
                      : 'border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark hover:border-brand/40'
                  }`}
                >
                  <div className="pt-0.5">
                    <span 
                      className="w-3 h-3 rounded-full block" 
                      style={{ backgroundColor: r.badgeColor }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {r.hierarchyLevel}. {r.name}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400">
                        L{r.hierarchyLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {r.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Rail: Main Matrix Stage (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Role Scope Banner */}
            <div className="p-4 rounded-2xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
                style={{ backgroundColor: selectedRole.badgeColor }}
              >
                L{selectedRole.hierarchyLevel}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Blueprint: {selectedRole.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {selectedRole.hierarchyLevel === 1 && 'Unrestricted global operational and administrative authority across all entities and encrypted fields.'}
                  {selectedRole.hierarchyLevel === 2 && 'People Partners can manage lifecycle states, calibrate salaries, and approve leaves company-wide.'}
                  {selectedRole.hierarchyLevel === 3 && 'Department Heads can view and triage profiles, shifts, and leaves strictly across their departmental cluster.'}
                  {selectedRole.hierarchyLevel === 4 && 'Team Managers dynamically inherit approval rights strictly for direct and indirect reports via recursive CTE.'}
                  {selectedRole.hierarchyLevel === 5 && 'Standard employees hold self-service view and edit privileges strictly over their own record.'}
                  {selectedRole.hierarchyLevel === 6 && 'External contractors hold time-tracking permissions without internal compensation visibility.'}
                </p>
              </div>
            </div>

            {/* Permission Capability Grid */}
            <div className="rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark overflow-hidden shadow-sm">
              <div className="p-4 border-b border-divider-light dark:border-divider-dark flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Resource Domain & Relational Scope Pill Selector
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Changes persist automatically
                </span>
              </div>

              <div className="divide-y divide-divider-light dark:divide-divider-dark">
                {[
                  {
                    key: 'employeeCrud' as keyof Role['permissions'],
                    title: 'Employee Directory CRUD',
                    description: 'View directory profiles, edit personal details, and onboard team members.'
                  },
                  {
                    key: 'compensationRead' as keyof Role['permissions'],
                    title: 'Compensation & PII (Read Shield)',
                    description: 'Access sensitive base salary, equity grants, bank routing and tax IDs.'
                  },
                  {
                    key: 'compensationWrite' as keyof Role['permissions'],
                    title: 'Compensation Revisions (Write)',
                    description: 'Calibrate base salaries, bonus percentages, and equity units.'
                  },
                  {
                    key: 'attendanceManage' as keyof Role['permissions'],
                    title: 'Attendance & Shift Management',
                    description: 'Sign-off on weekly timesheets and resolve missing-punch anomalies.'
                  },
                  {
                    key: 'leaveApprove' as keyof Role['permissions'],
                    title: 'Time-Off & PTO Approvals',
                    description: 'Approve or reject vacation, sick, and parental leave requests.'
                  },
                  {
                    key: 'systemAdmin' as keyof Role['permissions'],
                    title: 'System & Role Governance',
                    description: 'Configure RBAC matrices, acting delegations, and audit log exports.'
                  }
                ].map(domain => {
                  const currentScope = selectedRole.permissions[domain.key];

                  return (
                    <div key={domain.key} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="max-w-xs">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {domain.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {domain.description}
                        </p>
                      </div>

                      {/* 5-State Segmented Scope Pill Selector */}
                      <div className="flex items-center gap-1 bg-surface-light dark:bg-surface-dark p-1 rounded-xl border border-divider-light dark:border-divider-dark overflow-x-auto">
                        {scopeOptions.map(opt => {
                          const isScopeActive = currentScope === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleUpdateScope(domain.key, opt.value)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                                isScopeActive
                                  ? 'bg-brand text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTING DELEGATIONS */}
      {activeTab === 'delegations' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Temporary Acting-Role Delegations
              </h3>
              <p className="text-xs text-slate-500">
                When a manager travels or takes leave, authority is delegated with automatic expiration on their return.
              </p>
            </div>
            <button
              onClick={() => setShowDelegationModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Delegate Acting Authority</span>
            </button>
          </div>

          <div className="space-y-3">
            {delegations.map(del => {
              const manager = allEmployees.find(e => e.id === del.managerId);
              const acting = allEmployees.find(e => e.id === del.actingManagerId);

              return (
                <div
                  key={del.id}
                  className="p-4 rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center -space-x-3">
                      <img
                        src={manager?.avatarUrl}
                        alt={manager?.firstName}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-surface-dark"
                      />
                      <img
                        src={acting?.avatarUrl}
                        alt={acting?.firstName}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {manager?.firstName} {manager?.lastName} → Acting Manager: {acting?.firstName} {acting?.lastName}
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                          Scheduled
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        "{del.reason}" • Dates: {del.startDate} to {del.endDate}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {del.delegatedScopes.map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-surface-light dark:bg-surface-dark font-mono text-slate-400">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-400">
                      Auto-expires on {del.endDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Immutable Enterprise Security Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Complete chronological ledger of all PII reveals, role elevations, salary adjustments, and manager re-parenting.
            </p>
          </div>

          <div className="rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-light dark:bg-surface-dark text-slate-500 font-semibold border-b border-divider-light dark:border-divider-dark">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Target Subject</th>
                    <th className="py-2.5 px-3">Details</th>
                    <th className="py-2.5 px-3">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider-light dark:divide-divider-dark">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-brand dark:text-brand-dark">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                        {log.actorName}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {log.targetEmployeeName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || '192.168.1.104'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Delegation */}
      {showDelegationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div 
            className="w-full max-w-md rounded-2xl border border-divider-light dark:border-divider-dark bg-elevated-light dark:bg-elevated-dark p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Create Temporary Acting-Manager Delegation
            </h3>
            <p className="text-xs text-slate-500">
              Assign a colleague to inherit leave approvals and timesheet sign-offs while you are on leave.
            </p>

            <form onSubmit={handleCreateDelegation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Acting Manager Designee</label>
                <select
                  value={actingManagerId}
                  onChange={(e) => setActingManagerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
                >
                  <option value="">Select Acting Manager...</option>
                  {allEmployees.filter(e => e.id !== activeEmp?.id).map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.jobTitle})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={delegationStart}
                    onChange={(e) => setDelegationStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={delegationEnd}
                    onChange={(e) => setDelegationEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Reason / Handover Note</label>
                <textarea
                  value={delegationReason}
                  onChange={(e) => setDelegationReason(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider-light dark:border-divider-dark">
                <button
                  type="button"
                  onClick={() => setShowDelegationModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-sm"
                >
                  Confirm Delegation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
