import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon, GitHubIcon, FacebookIcon } from './BrandIcons';
import { CheckCircle2, Plus, Unlink, AlertCircle, ShieldCheck, Clock, Lock } from 'lucide-react';

const ALL_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    description: 'Use your Google Workspace or Personal account for enterprise single sign-on.',
    icon: GoogleIcon,
    accent: '#4285F4'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync your developer identity, commit workflows, and repositories.',
    icon: GitHubIcon,
    accent: '#24292F'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect your Meta social profile for quick personal access.',
    icon: FacebookIcon,
    accent: '#1877F2'
  }
];

export function LinkedProvidersManager() {
  const { identities, unlinkProvider, initiateOAuth, activeHandshake } = useAuth();
  const [confirmDisconnectProvider, setConfirmDisconnectProvider] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalConnected = identities.length;

  const handleDisconnect = async (providerId) => {
    setIsProcessing(true);
    await unlinkProvider(providerId);
    setIsProcessing(false);
    setConfirmDisconnectProvider(null);
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diffHours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 3600));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-[#121316] text-[#F8FAFC] p-6 sm:p-8 space-y-6 glass-panel specular-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">Connected Social Accounts</h2>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {totalConnected} of {ALL_PROVIDERS.length} Linked
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage the third-party providers linked to your identity for one-click access.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/[0.08] px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active Guardrail: Min 1 Method</span>
        </div>
      </div>

      {/* Provider List Cards */}
      <div className="space-y-3.5">
        {ALL_PROVIDERS.map((provider) => {
          const linkedRecord = identities.find(i => i.provider === provider.id);
          const isConnected = !!linkedRecord;
          const isOnlyMethod = isConnected && totalConnected <= 1;
          const IconComponent = provider.icon;
          const isConfirming = confirmDisconnectProvider === provider.id;

          return (
            <div
              key={provider.id}
              className={`relative rounded-xl p-4 sm:p-5 border transition-all duration-200
                ${isConnected 
                  ? 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]' 
                  : 'bg-black/20 border-white/[0.04] opacity-80 hover:opacity-100 hover:border-white/[0.1]'
                }
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Left: Brand Icon + Info */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{provider.name}</span>
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-white/5">
                          Not linked
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {isConnected ? (
                        <>
                          <span className="font-mono text-slate-300">
                            {linkedRecord.identity_data?.email || linkedRecord.identity_data?.username || 'Linked identity'}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>Linked {formatRelativeTime(linkedRecord.created_at)}</span>
                          </span>
                        </>
                      ) : (
                        <span>{provider.description}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isConnected ? (
                    isConfirming ? (
                      /* Inline Disconnect Confirmation Flyout */
                      <div className="flex items-center gap-2 animate-in fade-in duration-150">
                        <span className="text-xs text-rose-300 hidden md:inline">Revoke access?</span>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleDisconnect(provider.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition"
                        >
                          {isProcessing ? 'Revoking...' : 'Yes, disconnect'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDisconnectProvider(null)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* Disconnect Button with Safety Guardrail */
                      <div className="relative group">
                        <button
                          type="button"
                          disabled={isOnlyMethod}
                          onClick={() => setConfirmDisconnectProvider(provider.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition
                            ${isOnlyMethod
                              ? 'opacity-40 cursor-not-allowed bg-slate-900/40 border-white/[0.05] text-slate-500'
                              : 'text-slate-300 hover:text-rose-400 bg-white/[0.02] hover:bg-rose-500/10 border-white/[0.08] hover:border-rose-500/30'
                            }
                          `}
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Disconnect</span>
                        </button>

                        {/* Guardrail tooltip when sole remaining method */}
                        {isOnlyMethod && (
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-[10px] text-amber-300 font-mono whitespace-nowrap shadow-xl z-20">
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>You must retain at least one login method</span>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    /* Connect Provider Button */
                    <button
                      type="button"
                      disabled={!!activeHandshake}
                      onClick={() => initiateOAuth(provider.id, 'link')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect {provider.name}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Reassurance Subtext */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>OAuth tokens stored with AES-256 GCM envelope encryption.</span>
        </span>
        <span className="font-mono text-[10px] text-slate-500">RFC 7636 PKCE Compliant</span>
      </div>
    </div>
  );
}
