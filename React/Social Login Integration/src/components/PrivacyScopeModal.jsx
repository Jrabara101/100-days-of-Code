import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Eye, Lock, Trash2, X, CheckCircle, FileText } from 'lucide-react';

export function PrivacyScopeModal() {
  const { privacyScopeProvider, setPrivacyScopeProvider } = useAuth();

  if (!privacyScopeProvider) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121316] text-[#F8FAFC] shadow-2xl glass-panel p-6 sm:p-7 space-y-5 specular-border">
        
        <button
          onClick={() => setPrivacyScopeProvider(null)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Scope & Privacy Disclosure</h3>
            <p className="text-xs text-slate-400">Our transparent data commitment</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Item 1 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
            <Eye className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">What we read</div>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Only your verified primary email address, public display name, and avatar picture provided by Google, GitHub, or Facebook.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
            <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">What we will NEVER do</div>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                We will never post to your timeline or feeds, access private source repositories, read your friends list, or message contacts.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
            <Trash2 className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Zero lock-in & Token Revocation</div>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                You can disconnect any provider at any time from your security settings. Upon unlinking, third-party tokens and associations are permanently expunged.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setPrivacyScopeProvider(null)}
            className="w-full h-10 px-4 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
