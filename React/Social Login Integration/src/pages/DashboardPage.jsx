import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LinkedProvidersManager } from '../components/LinkedProvidersManager';
import {
  ShieldCheck,
  User,
  Clock,
  Key,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  CheckCircle2
} from 'lucide-react';

export function DashboardPage({ onNavigate }) {
  const { user, identities, logout, initiateOAuth } = useAuth();

  // Progressive profiling state (workspace preference, username handle)
  const [handle, setHandle] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-slate-400 text-sm">Please sign in to view your dashboard.</p>
          <button
            onClick={() => onNavigate('/login')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 bg-radial-glow">
      
      {/* Top Banner: User Identity Header */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#121316] p-6 sm:p-8 glass-panel specular-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                alt={user.full_name || 'User'}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#121316] flex items-center justify-center text-white" title="Active Session">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {user.full_name || 'Authenticated User'}
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Verified Identity
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>{user.email}</span>
                <span>•</span>
                <span className="text-slate-500">UID: {user.id.substring(0, 8)}...</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-right">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Linked Providers</div>
              <div className="text-base font-bold font-mono text-blue-400">{identities.length} Active</div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-right">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Security Health</div>
              <div className="text-base font-bold font-mono text-emerald-400">100% Secure</div>
            </div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Connected Social Accounts Management Console */}
        <div className="lg:col-span-2 space-y-8">
          <LinkedProvidersManager />

          {/* Progressive Profiling Deck */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121316] p-6 glass-panel space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Progressive Profiling</h3>
                  <p className="text-[11px] text-slate-400">Optional workspace preferences requested on demand</p>
                </div>
              </div>

              {isSaved && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Preferences Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSavePreferences} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-mono text-slate-400">Developer Handle</label>
                <input
                  type="text"
                  placeholder="@alexchen"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400">Default Workspace</label>
                <input
                  type="text"
                  placeholder="Acme Engineering"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full h-9 mt-1 px-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition"
                >
                  Update Metadata
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Security Telemetry & Session Tokens */}
        <div className="space-y-6">
          
          {/* Security Transport Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121316] p-6 glass-panel space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Identity Token Security</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Transport Protocol</div>
                <div className="text-slate-200 font-mono text-[11px]">HTTP-Only, Secure, SameSite=Lax</div>
                <p className="text-[10px] text-slate-500">Inaccessible to client XSS scripts</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase">PKCE Architecture</div>
                <div className="text-slate-200 font-mono text-[11px]">RFC 7636 · SHA-256 S256</div>
                <p className="text-[10px] text-slate-500">Secret-less authorization code verification</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase">CSRF Defense</div>
                <div className="text-slate-200 font-mono text-[11px]">HMAC-SHA256 Signed State Nonce</div>
                <p className="text-[10px] text-slate-500">Tamper-proof payload with 10-minute expiry</p>
              </div>
            </div>
          </div>

          {/* Quick Identity Actions Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121316] p-6 glass-panel space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Sandbox Actions</h3>
            
            <button
              onClick={() => initiateOAuth('facebook', 'link')}
              className="w-full h-10 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-medium flex items-center justify-between transition"
            >
              <span>Test Linking Facebook Identity</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/login')}
              className="w-full h-10 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] text-xs font-medium flex items-center justify-between transition"
            >
              <span>Switch Accounts / Re-test</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
