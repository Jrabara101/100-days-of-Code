import React from 'react';
import { Shield, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  badgeText?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  badgeText = 'Zero-Trust Architecture'
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-vault-bg text-slate-900 dark:text-vault-text transition-colors">
      {/* Left Presentation Rail (45% Desktop) */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#0B0F19] text-white p-12 flex-col justify-between overflow-hidden border-r border-[#252932]">
        {/* Cryptographic Grid & Ambient Glow */}
        <div className="absolute inset-0 crypto-grid opacity-60 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Wordmark & Shield Glyph */}
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-vault-glow">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                Aegis<span className="text-blue-500">IAM</span>
              </span>
              <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Identity & Access Governance
              </p>
            </div>
          </div>
        </div>

        {/* Center: Security Value Proposition Highlights */}
        <div className="relative z-10 space-y-8 my-auto max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{badgeText}</span>
          </div>

          <h2 className="text-3xl font-display font-bold leading-tight tracking-tight text-white">
            Enterprise sovereign access without user anxiety.
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Eliminating credential risk through transparent account health signals, time-budgeted magic recovery links, and declarative capability matrices.
          </p>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span><strong>Enumeration-Safe Tunnel:</strong> Zero leak vectors for public user directories</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span><strong>Argon2id & SHA-256:</strong> Cryptographic token hashing with 15m expiration</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span><strong>Panic Device Ejection:</strong> One-click session invalidation across global fleets</span>
            </div>
          </div>
        </div>

        {/* Bottom: Customer Trust Card & Compliance Badges */}
        <div className="relative z-10 space-y-4 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <p className="text-xs text-slate-300 italic mb-3">
              "Aegis allows us to enforce bank-grade least privilege without slowing our engineers down. The self-service recovery tunnel has eliminated 90% of our helpdesk tickets."
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                  MK
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Michael Kozlov</h4>
                  <p className="text-[10px] text-slate-400">Chief Information Security Officer • ScaleVault</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              SOC-2 Type II Certified
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              End-to-End Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Right Interactive Stage (55% Desktop) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Mobile Header (visible only on small screens) */}
        <div className="lg:hidden w-full max-w-md mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg font-display text-slate-900 dark:text-vault-text">
              Aegis<span className="text-blue-500">IAM</span>
            </span>
          </div>
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-vault-text">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-vault-muted">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
