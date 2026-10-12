import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SocialButtonDeck } from '../components/SocialButtonDeck';
import { Shield, ArrowRight, Sparkles, Lock, KeyRound, Mail, CheckCircle2, UserCheck } from 'lucide-react';

export function LoginPage({ onNavigate }) {
  const { emailLogin, initiateOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usePasskey, setUsePasskey] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    await emailLogin(email);
    setIsSubmitting(false);
  };

  const triggerCollisionDemo = () => {
    // Triggers GitHub auth which pre-seeds alex.chen@acme.corp to demonstrate collision!
    initiateOAuth('github', 'login');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12 relative bg-radial-glow">
      
      {/* Interactive Quick-Test Banner */}
      <div className="w-full max-w-md mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Test Identity Collision (GitHub → Google):</span>
        </div>
        <button
          onClick={triggerCollisionDemo}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition whitespace-nowrap"
        >
          Simulate Collision ⚡
        </button>
      </div>

      {/* Main Centralized Social Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] dark:border-white/[0.08] bg-[#121316] text-[#F8FAFC] shadow-2xl glass-panel p-8 sm:p-9 space-y-6 specular-border">
        
        {/* Header Stack */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-blue-500/20 mb-1">
            <div className="w-full h-full bg-[#090A0C] rounded-[15px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
            Enterprise Single Sign-On
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
            Sign in to AuthMesh
          </h1>
          <p className="text-xs text-slate-400">
            Frictionless, passwordless authentication with your existing credentials.
          </p>
        </div>

        {/* Social Provider Button Deck */}
        <div className="space-y-4">
          <SocialButtonDeck recommendedProvider="github" intent="login" />
        </div>

        {/* Subdued Divider Ribbon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative px-3 bg-[#121316] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            or continue with email
          </span>
        </div>

        {/* Standard Email Form Deck */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Work email address</span>
              <button
                type="button"
                onClick={() => setUsePasskey(!usePasskey)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-mono transition"
              >
                {usePasskey ? 'Use standard email' : 'Use Passkey / WebAuthn'}
              </button>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                {usePasskey ? <KeyRound className="w-4 h-4 text-blue-400" /> : <Mail className="w-4 h-4" />}
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 transition font-mono text-xs"
              />
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="absolute inset-y-1.5 right-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center justify-center disabled:opacity-30 transition"
                title="Submit (Enter)"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

        {/* Security & Privacy Guarantee Subtext */}
        <div className="pt-2 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            By connecting, you agree to our Terms of Service. We respect your privacy and never post to your feeds.
          </p>
          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] font-mono text-slate-500">
            <span>256-bit AES</span>
            <span>•</span>
            <span>SOC2 Type II</span>
            <span>•</span>
            <span>Zero Password Storage</span>
          </div>
        </div>

      </div>

    </div>
  );
}
