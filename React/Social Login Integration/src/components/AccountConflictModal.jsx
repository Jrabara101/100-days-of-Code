import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon, GitHubIcon, FacebookIcon } from './BrandIcons';
import { AlertTriangle, Lock, ArrowRight, X, ShieldAlert } from 'lucide-react';

export function AccountConflictModal() {
  const {
    conflictData,
    isConflictModalOpen,
    setIsConflictModalOpen,
    executeStepUpMerge
  } = useAuth();

  if (!isConflictModalOpen || !conflictData) return null;

  const { inboundProvider, inboundProfile, existingUser, mergeTicket, email } = conflictData;

  const getProviderIcon = (provider, size = "w-6 h-6") => {
    switch (provider) {
      case 'google': return <GoogleIcon className={size} />;
      case 'github': return <GitHubIcon className={size} />;
      case 'facebook': return <FacebookIcon className={size} />;
      default: return <span className="font-bold text-xs uppercase">{provider}</span>;
    }
  };

  const getProviderLabel = (provider) => {
    switch (provider) {
      case 'google': return 'Google';
      case 'github': return 'GitHub';
      case 'facebook': return 'Facebook';
      default: return provider;
    }
  };

  const primaryProvider = existingUser?.primaryProvider || 'google';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-[#121316] text-[#F8FAFC] shadow-2xl shadow-amber-500/10 overflow-hidden specular-border"
        role="dialog"
        aria-modal="true"
      >
        {/* Amber Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />
        
        {/* Close button */}
        <button
          onClick={() => setIsConflictModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400 shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Identity Collision Detected
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white mt-1">
                Account Already Exists
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-provider collision detected for <strong className="text-slate-200">{email}</strong>
              </p>
            </div>
          </div>

          {/* Diagnostic Visualizer: Dual Identity Collision Graph */}
          <div className="p-4 rounded-xl bg-[#090A0C]/80 border border-white/[0.06] relative">
            <div className="text-[11px] font-mono text-slate-400 mb-3 flex items-center justify-between">
              <span>INBOUND ATTEMPT</span>
              <span>EXISTING PRIMARY ACCOUNT</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* Left Chip: Inbound Attempt */}
              <div className="flex-1 p-3 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0">
                  {getProviderIcon(inboundProvider, "w-5 h-5")}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {inboundProfile?.name || 'Inbound User'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {getProviderLabel(inboundProvider)}
                  </div>
                </div>
              </div>

              {/* Center Link Indicator: Lock Badge */}
              <div className="relative flex flex-col items-center justify-center px-1">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20 animate-pulse">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono text-amber-400/80 mt-1 uppercase">Step-Up</span>
              </div>

              {/* Right Chip: Existing Account */}
              <div className="flex-1 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/30 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black/40 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  {getProviderIcon(primaryProvider, "w-5 h-5")}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {existingUser?.full_name || 'Existing Account'}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono truncate">
                    {getProviderLabel(primaryProvider)} (Verified)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plain-Language Narrative Copy */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.06] text-xs text-slate-300 leading-relaxed">
            <p>
              You previously registered an account using <strong className="text-white">{getProviderLabel(primaryProvider)}</strong>. 
              To securely connect your <strong className="text-white">{getProviderLabel(inboundProvider)}</strong> identity to this existing profile, please confirm ownership of your primary account.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => executeStepUpMerge(mergeTicket)}
              className="w-full h-11 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <span>Verify with {getProviderLabel(primaryProvider)} to Link Accounts</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsConflictModalOpen(false)}
              className="w-full h-10 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition"
            >
              Cancel & Use Different Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
