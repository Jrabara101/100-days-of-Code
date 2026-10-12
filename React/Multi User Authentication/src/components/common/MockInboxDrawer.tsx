import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, X, ExternalLink, ShieldCheck, UserPlus, AlertCircle, Clock, Copy, Check } from 'lucide-react';

interface MockInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToReset?: (token: string, email: string) => void;
  onNavigateToRegister?: (token: string, email: string, role: string) => void;
}

export const MockInboxDrawer: React.FC<MockInboxDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToReset,
  onNavigateToRegister
}) => {
  const { dispatchedEmails } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(window.location.origin + window.location.pathname + url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleActionClick = (email: any) => {
    if (email.type === 'PASSWORD_RESET') {
      const match = email.action_url.match(/token=([^&]+)&email=([^&]+)/);
      if (match && onNavigateToReset) {
        onNavigateToReset(match[1], decodeURIComponent(match[2]));
        onClose();
        return;
      }
    } else if (email.type === 'TEAM_INVITE') {
      const match = email.action_url.match(/inviteToken=([^&]+)&email=([^&]+)&role=([^&]+)/);
      if (match && onNavigateToRegister) {
        onNavigateToRegister(match[1], decodeURIComponent(match[2]), decodeURIComponent(match[3]));
        onClose();
        return;
      }
    }
    // Fallback: update hash
    window.location.hash = email.action_url.replace('#', '');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-white dark:bg-vault-surface border-l border-slate-200 dark:border-vault-border shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-vault-border flex items-center justify-between bg-slate-50 dark:bg-vault-elevated">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-vault-text flex items-center gap-2">
                Simulated Mailbox
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {dispatchedEmails.length} messages
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-vault-muted">
                Captures magic reset tokens & team invites in real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-vault-text hover:bg-slate-100 dark:hover:bg-vault-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {dispatchedEmails.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-vault-muted">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-vault-elevated flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Mailbox is clean</p>
              <p className="text-xs text-slate-400 dark:text-vault-muted mt-1 max-w-xs">
                Request a password reset from the login screen or invite a team member to see cryptographic dispatches here.
              </p>
            </div>
          ) : (
            dispatchedEmails.map(mail => (
              <div
                key={mail.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-elevated shadow-subtle space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {mail.type === 'PASSWORD_RESET' && (
                      <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {mail.type === 'TEAM_INVITE' && (
                      <div className="w-6 h-6 rounded-md bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {mail.type === 'SECURITY_ALERT' && (
                      <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-800 dark:text-vault-text line-clamp-1">
                      {mail.subject}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-vault-muted font-mono shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(mail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-vault-muted leading-relaxed">
                  <p className="mb-1 text-[11px] text-slate-400">
                    To: <strong className="font-mono text-slate-700 dark:text-slate-300">{mail.to}</strong>
                  </p>
                  <p>{mail.body}</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-vault-border/50">
                  <button
                    onClick={() => handleCopyLink(mail.id, mail.action_url)}
                    className="text-[11px] font-mono text-slate-500 dark:text-vault-muted hover:text-blue-500 flex items-center gap-1 transition-colors"
                  >
                    {copiedId === mail.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Magic URL</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleActionClick(mail)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>{mail.action_label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-vault-surface border-t border-slate-200 dark:border-vault-border text-center text-[11px] text-slate-400 dark:text-vault-muted">
          All cryptographic reset tokens expire in 15 minutes and invalidate on single-use.
        </div>
      </div>
    </div>
  );
};
