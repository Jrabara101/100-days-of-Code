import React, { useState } from 'react';
import { useAuth, Can } from '../../context/AuthContext';
import { RoleBadge } from '../common/RoleBadge';
import { RoleName } from '../../types/auth';
import {
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Send,
  X
} from 'lucide-react';
import { authStorage } from '../../services/authService';

export const TeamMembersManager: React.FC = () => {
  const {
    currentUser,
    allRoles,
    invites,
    createTeamInvite,
    revokeInvite,
    changeUserRole,
    triggerSudoChallenge,
    refreshState
  } = useAuth();

  const [users, setUsers] = useState(() => authStorage.getUsers());
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleName>('Member');
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const syncUsers = () => {
    setUsers(authStorage.getUsers());
    refreshState();
  };

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice('');
    setSuccessNotice('');

    if (!inviteEmail.trim()) {
      setErrorNotice('Please provide an invitee email address.');
      return;
    }

    // Guard: Least privilege - non-owners cannot invite as Owner
    if (inviteRole === 'Owner' && currentUser?.role !== 'Owner') {
      setErrorNotice('Principle of least privilege: Only an active Owner can dispatch an Owner invitation.');
      return;
    }

    const newInv = createTeamInvite(inviteEmail.trim(), inviteRole);
    setSuccessNotice(`Invitation link generated and dispatched for ${newInv.email}.`);
    setInviteEmail('');
    setIsInviteModalOpen(false);
    syncUsers();
  };

  const handleRoleChange = (userId: string, newRole: RoleName) => {
    setErrorNotice('');
    setSuccessNotice('');

    // If making someone an Owner or altering high-privilege roles, trigger sudo challenge!
    if (newRole === 'Owner' || currentUser?.role !== 'Owner') {
      triggerSudoChallenge(() => {
        const res = changeUserRole(userId, newRole);
        if (!res.success) {
          setErrorNotice(res.error || 'Failed to update user role.');
        } else {
          setSuccessNotice('User role updated successfully.');
          syncUsers();
        }
      });
      return;
    }

    const res = changeUserRole(userId, newRole);
    if (!res.success) {
      setErrorNotice(res.error || 'Failed to update user role.');
    } else {
      setSuccessNotice('User role updated successfully.');
      syncUsers();
    }
  };

  const handleCopyInviteLink = (invite: any) => {
    const url = `${window.location.origin}${window.location.pathname}#/register?inviteToken=${invite.token}&email=${encodeURIComponent(invite.email)}&role=${encodeURIComponent(invite.role)}`;
    navigator.clipboard.writeText(url);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notifications */}
      {errorNotice && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice('')} className="p-1 hover:text-red-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice('')} className="p-1 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-vault-border">
        <div>
          <h3 className="text-lg font-bold font-display text-slate-900 dark:text-vault-text flex items-center gap-2">
            Workspace Roster & Team Access
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {users.length} Active Members
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-vault-muted mt-0.5">
            Manage organization members, assign role hierarchies, and track tokenized invitations.
          </p>
        </div>

        <Can do="users:invite">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
        </Can>
      </div>

      {/* Members Table */}
      <div className="border border-slate-200 dark:border-vault-border rounded-2xl bg-white dark:bg-vault-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-vault-elevated border-b border-slate-200 dark:border-vault-border text-slate-500 dark:text-vault-muted font-medium">
                <th className="py-3 px-4">Member Identity</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Active</th>
                <th className="py-3 px-4 text-right">Governance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-vault-border">
              {users.map(u => {
                const isCurrent = currentUser?.id === u.id;
                const isOwner = u.role === 'Owner';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-vault-elevated/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {u.full_name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-vault-text">
                              {u.full_name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 font-medium">
                                (You)
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <RoleBadge role={u.role} size="sm" />
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Verified
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Can
                        do="users:manage_roles"
                        fallback={<span className="text-slate-400 text-[11px]">Protected</span>}
                      >
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value as RoleName)}
                          disabled={isOwner && users.filter(x => x.role === 'Owner').length <= 1}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-elevated text-slate-700 dark:text-vault-text focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                        >
                          {allRoles.map(r => (
                            <option key={r.id} value={r.name}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </Can>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Section */}
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-vault-text flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400" />
          <span>Pending Invitations & Tokenized Links ({invites.length})</span>
        </h4>

        {invites.length === 0 ? (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-center text-xs text-slate-400">
            No active pending invites.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {invites.map(inv => (
              <div
                key={inv.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-surface shadow-subtle flex flex-col justify-between gap-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 dark:text-vault-text">
                      {inv.email}
                    </span>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <RoleBadge role={inv.role} size="sm" showIcon={false} />
                      <span className="text-[10px] text-slate-400 font-mono">
                        by {inv.inviter_name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                      inv.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : inv.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-vault-border/60">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyInviteLink(inv)}
                      className="px-2 py-1 rounded-md text-[11px] font-mono border border-slate-200 dark:border-vault-border hover:border-blue-400 text-slate-600 dark:text-vault-text transition-colors flex items-center gap-1"
                    >
                      {copiedInviteId === inv.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {inv.status === 'pending' && (
                      <button
                        onClick={() => {
                          revokeInvite(inv.id);
                          syncUsers();
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-vault-elevated border border-slate-200 dark:border-vault-border rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-vault-text">
                    Invite Collaborator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-vault-muted">
                    Generate tokenized invitation with pre-assigned role privileges
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-vault-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
                  Corporate Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="collaborator@partner.com"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
                  Initial Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as RoleName)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {allRoles.map(r => (
                    <option key={r.id} value={r.name}>
                      {r.name} — {r.description.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-slate-600 dark:text-vault-muted">
                Invitations are cryptographically tokenized with a 7-day expiration window and automatically recorded in the security audit ledger.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-surface rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Invite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
