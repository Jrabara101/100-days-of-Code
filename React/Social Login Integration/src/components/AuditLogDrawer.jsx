import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Activity, X, Shield, Lock, CheckCircle, AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

export function AuditLogDrawer() {
  const { isAuditDrawerOpen, setIsAuditDrawerOpen } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuditDrawerOpen) {
      fetchLogs();
    }
  }, [isAuditDrawerOpen]);

  if (!isAuditDrawerOpen) return null;

  const getEventBadge = (type) => {
    switch (type) {
      case 'collision_detected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">COLLISION_DETECTED</span>;
      case 'stepup_merge_verified':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">MERGE_VERIFIED</span>;
      case 'account_linked':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">PROVIDER_LINKED</span>;
      case 'account_unlinked':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">PROVIDER_REVOKED</span>;
      case 'oauth_handshake':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">OAUTH_HANDSHAKE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-white/10">{type.toUpperCase()}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#121316] border-l border-white/10 shadow-2xl flex flex-col glass-panel animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Security Telemetry</h3>
              <p className="text-[11px] text-slate-400 font-mono">Real-time OAuth Audit Trail</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              title="Refresh logs"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAuditDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No audit events logged yet.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 hover:border-white/15 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  {getEventBadge(log.event_type)}
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300">
                  {log.provider && (
                    <div className="text-slate-400">
                      Provider: <strong className="text-white uppercase">{log.provider}</strong>
                    </div>
                  )}
                  {log.details && (
                    <pre className="mt-1.5 p-2 rounded bg-black/60 border border-white/5 text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-[11px] text-slate-500 font-mono flex items-center justify-between bg-black/20">
          <span>HMAC-SHA256 Signed State</span>
          <span className="text-emerald-400">● Tamper Proof</span>
        </div>
      </div>
    </div>
  );
}
