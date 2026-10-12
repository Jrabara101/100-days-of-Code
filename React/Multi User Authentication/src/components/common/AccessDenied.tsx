import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, KeyRound, ExternalLink } from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface AccessDeniedProps {
  requiredPermission?: string;
  requiredRole?: string;
  onGoBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission = 'users:manage_roles',
  requiredRole,
  onGoBack
}) => {
  const { currentUser, switchPersona } = useAuth();

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-vault-surface border border-slate-200 dark:border-vault-border rounded-2xl shadow-elevated p-8 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
            403 Forbidden • Principle of Least Privilege
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-vault-text pt-2">
            Restricted Capability Zone
          </h2>
          <p className="text-xs text-slate-500 dark:text-vault-muted leading-relaxed">
            Your current active persona does not possess the requisite operational privileges to inspect or mutate this security domain.
          </p>
        </div>

        {/* Diagnostic Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-vault-elevated border border-slate-200/80 dark:border-vault-border text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-vault-muted">Active Identity:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
              {currentUser?.email}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-vault-muted">Assigned Role:</span>
            {currentUser && <RoleBadge role={currentUser.role} size="sm" />}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-vault-border/50">
            <span className="text-slate-500 dark:text-vault-muted">Required Capability:</span>
            <span className="font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded text-[11px]">
              {requiredRole ? `Role: ${requiredRole}` : requiredPermission}
            </span>
          </div>
        </div>

        {/* Sandbox Helper: Switch to Owner or Admin */}
        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-left text-xs text-slate-600 dark:text-vault-muted space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sandbox Quick Elevation</span>
          </div>
          <p className="text-[11px]">
            To inspect this protected capability matrix, instantly switch your persona to Owner or Admin:
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => switchPersona('Owner')}
              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
            >
              Switch to Owner
            </button>
            <button
              onClick={() => switchPersona('Admin')}
              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-vault-border text-slate-800 dark:text-vault-text text-xs font-medium hover:bg-slate-300 dark:hover:bg-vault-surface transition-colors"
            >
              Switch to Admin
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 dark:text-vault-muted hover:text-slate-900 dark:hover:text-vault-text rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </button>
          )}
          <a
            href="mailto:security-lead@aegis-security.io"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-vault-elevated hover:bg-slate-200 dark:hover:bg-vault-border text-slate-700 dark:text-vault-text rounded-xl transition-colors"
          >
            <span>Request Role Elevation</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
