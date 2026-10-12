import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Session, AuditLog } from '../../types/auth';
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Download,
  Filter,
  Check,
  ShieldCheck,
  Radio
} from 'lucide-react';

export const SessionManager: React.FC = () => {
  const {
    sessions,
    auditLogs,
    revokeSession,
    revokeAllOtherSessions,
    triggerSudoChallenge,
    isSudoActive
  } = useAuth();

  // Ejection animation state: track session being revoked
  const [ejectingSessionId, setEjectingSessionId] = useState<string | null>(null);

  // Undoable toast state
  const [undoToast, setUndoToast] = useState<{
    message: string;
    sessionId?: string;
  } | null>(null);

  // Audit filter state
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'LOGINS' | 'SECURITY' | 'REVOCATIONS'>('ALL');

  // Confirm panic revocation modal
  const [confirmPanicModal, setConfirmPanicModal] = useState(false);

  // Eject single session with micro-interaction
  const handleRevokeSingle = (session: Session) => {
    // Immediate 40% opacity + miniature spinner animation
    setEjectingSessionId(session.id);

    setTimeout(() => {
      revokeSession(session.id);
      setEjectingSessionId(null);
      setUndoToast({
        message: `Session for ${session.browser} on ${session.os} terminated.`,
        sessionId: session.id
      });

      setTimeout(() => setUndoToast(null), 4500);
    }, 450);
  };

  // Panic Revocation: Revoke all other sessions
  const handlePanicRevocation = () => {
    // Sensitive action: challenge sudo!
    triggerSudoChallenge(() => {
      const count = revokeAllOtherSessions();
      setConfirmPanicModal(false);
      setUndoToast({
        message: `Panic Killswitch Activated: ${count} remote device sessions terminated immediately.`
      });
      setTimeout(() => setUndoToast(null), 4500);
    });
  };

  // Export audit logs to JSON
  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aegis-security-audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Separate current session from other sessions
  const currentSession = sessions.find(s => s.is_current);
  const otherSessions = sessions.filter(s => !s.is_current);

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilter === 'LOGINS') return log.event.includes('LOGIN');
    if (auditFilter === 'SECURITY') return log.event.includes('ROLE') || log.event.includes('PASSWORD') || log.event.includes('SUDO');
    if (auditFilter === 'REVOCATIONS') return log.event.includes('REVOKED') || log.event.includes('LOCKED');
    return true;
  });

  const getDeviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-5 h-5" />;
    if (type === 'tablet') return <Tablet className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Undoable Toast Notification */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl border border-slate-700 bg-slate-900 text-white shadow-2xl flex items-center justify-between gap-4 text-xs font-medium animate-slide-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{undoToast.message}</span>
          </div>
          <button
            onClick={() => setUndoToast(null)}
            className="text-slate-400 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sudo Mode Active Banner */}
      {isSudoActive && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>
              <strong>Elevated Sudo Mode Active:</strong> You can execute sensitive device revocations and credential rotations without repeated challenges.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-700 dark:text-amber-300">
            TTL: 10m
          </span>
        </div>
      )}

      {/* SECTION 1: ACTIVE DEVICES & SESSIONS MODULE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-vault-border">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-vault-text flex items-center gap-2">
              Active Devices & Connected Sessions
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {sessions.length} Authorized
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-vault-muted mt-0.5">
              Hardware registry and cryptographic refresh tokens associated with your identity.
            </p>
          </div>

          {/* Panic Revocation Button */}
          {otherSessions.length > 0 && (
            <button
              onClick={() => setConfirmPanicModal(true)}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-medium transition-all flex items-center gap-2 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sign Out of All Other Devices</span>
            </button>
          )}
        </div>

        {/* Current Session Card */}
        {currentSession && (
          <div className="p-4 rounded-2xl border-2 border-blue-500/40 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] relative space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  {getDeviceIcon(currentSession.device_type)}
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-vault-surface animate-pulse" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-vault-text">
                      {currentSession.device_name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Current Device
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-vault-muted mt-0.5">
                    {currentSession.browser} on {currentSession.os}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-vault-elevated px-2 py-1 rounded-md border border-slate-200 dark:border-vault-border">
                  {currentSession.ip_address}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-vault-muted pt-2 border-t border-slate-200/60 dark:border-vault-border/60">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>{currentSession.location}</span>
              </div>
              <span className="font-mono text-[11px]">Sliding refresh active</span>
            </div>
          </div>
        )}

        {/* Other Connected Devices */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block pt-1">
            Other Active Sessions ({otherSessions.length})
          </span>

          {otherSessions.length === 0 ? (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-center text-xs text-slate-500 dark:text-vault-muted">
              No other active hardware sessions detected. Your credentials are fully confined to this browser.
            </div>
          ) : (
            otherSessions.map(session => {
              const isEjecting = ejectingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-surface shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                    isEjecting
                      ? 'opacity-40 translate-x-6 scale-95 pointer-events-none'
                      : 'hover:border-slate-300 dark:hover:border-vault-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-vault-elevated text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                      {getDeviceIcon(session.device_type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-vault-text">
                          {session.device_name}
                        </h4>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-vault-muted">
                          {session.browser} • {session.os}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-vault-muted">
                        <span className="font-mono bg-slate-100 dark:bg-vault-elevated px-1.5 py-0.5 rounded text-[10px]">
                          {session.ip_address}
                        </span>
                        <span>•</span>
                        <span>{session.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-vault-border">
                    <button
                      onClick={() => handleRevokeSingle(session)}
                      disabled={isEjecting}
                      className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      {isEjecting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                          <span>Ejecting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke Session</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: DEFENSIVE AUDIT TRAILS & ACTIVITY LOG */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-vault-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-vault-text flex items-center gap-2">
              Security Activity & Audit Trails
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Immutable Ledger
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-vault-muted mt-0.5">
              Cryptographically timestamped telemetry of all identity events, IP locations, and privilege mutations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-surface hover:bg-slate-50 dark:hover:bg-vault-elevated text-xs font-medium text-slate-700 dark:text-vault-text transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SIEM JSON</span>
            </button>
          </div>
        </div>

        {/* Audit Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          {(['ALL', 'LOGINS', 'SECURITY', 'REVOCATIONS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setAuditFilter(tab)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                auditFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-vault-elevated text-slate-600 dark:text-vault-muted hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Audit Event Stream */}
        <div className="border border-slate-200 dark:border-vault-border rounded-2xl bg-white dark:bg-vault-surface divide-y divide-slate-100 dark:divide-vault-border overflow-hidden shadow-sm">
          {filteredAuditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No audit logs matched this filter criteria.
            </div>
          ) : (
            filteredAuditLogs.map(log => {
              const isAlert = log.event.includes('LOCKED') || log.event.includes('FAILED');
              const isSuccess = log.event.includes('SUCCESS') || log.event.includes('COMPLETED');

              return (
                <div
                  key={log.id}
                  className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-vault-elevated/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isAlert
                          ? 'bg-red-500/10 text-red-500'
                          : isSuccess
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {isAlert ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : isSuccess ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Radio className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-vault-text">
                          {log.event.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-vault-elevated px-1.5 py-0.2 rounded">
                          {log.actor_name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-vault-muted font-mono">
                        <span>IP: {log.ip_address}</span>
                        <span>•</span>
                        <span>{log.location}</span>
                        {log.metadata && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">
                              {JSON.stringify(log.metadata).slice(0, 40)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 sm:justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Panic Revocation Confirmation Modal */}
      {confirmPanicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-vault-elevated border border-slate-200 dark:border-vault-border rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-vault-text">
                Confirm Panic Device Ejection
              </h3>
              <p className="text-xs text-slate-500 dark:text-vault-muted mt-1 leading-relaxed">
                This will immediately invalidate all active refresh tokens, cookies, and bearer credentials across all devices except this active browser window.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300">
              Any unauthorized or compromised sessions will be terminated instantaneously. You will remain signed in on this current machine.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPanicModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-surface rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePanicRevocation}
                className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-all"
              >
                Execute Global Ejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
