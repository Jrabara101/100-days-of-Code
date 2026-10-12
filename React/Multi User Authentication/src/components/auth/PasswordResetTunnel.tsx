import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PasswordEntropyMeter } from '../common/PasswordEntropyMeter';
import { evaluatePasswordEntropy } from '../../utils/entropy';
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  RotateCw,
  Lock,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Inbox
} from 'lucide-react';

interface PasswordResetTunnelProps {
  onNavigateToLogin: () => void;
  onOpenMockInbox?: () => void;
  initialToken?: string;
  initialEmail?: string;
}

export const PasswordResetTunnel: React.FC<PasswordResetTunnelProps> = ({
  onNavigateToLogin,
  onOpenMockInbox,
  initialToken = '',
  initialEmail = ''
}) => {
  const { requestPasswordReset, resetPassword, isLoading } = useAuth();

  // Multi-step state machine: 'request' | 'check-inbox' | 'new-password' | 'celebration'
  const [step, setStep] = useState<'request' | 'check-inbox' | 'new-password' | 'celebration'>(
    initialToken ? 'new-password' : 'request'
  );

  // Form states
  const [email, setEmail] = useState(initialEmail || 'alex.vance@aegis-security.io');
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 60-second resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Synchronize initial token prop changes
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      if (initialEmail) setEmail(initialEmail);
      setStep('new-password');
    }
  }, [initialToken, initialEmail]);

  const entropy = evaluatePasswordEntropy(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  // Step 1: Submit Request Email
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('Please enter your work email.');
      return;
    }

    const res = await requestPasswordReset(email);
    setStatusMessage(res.message);
    if (res.rawToken) {
      setToken(res.rawToken);
    }
    setCooldown(60); // 60s cooldown
    setStep('check-inbox');
  };

  // Resend trigger
  const handleResend = async () => {
    if (cooldown > 0) return;
    const res = await requestPasswordReset(email);
    if (res.rawToken) setToken(res.rawToken);
    setCooldown(60);
  };

  // Step 3: Submit New Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please enter and confirm your new passphrase.');
      return;
    }

    if (entropy.score < 2) {
      setErrorMessage('Passphrase entropy is too weak. Please adhere to the entropy meter requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passphrases do not match.');
      return;
    }

    const res = await resetPassword(token, newPassword, email);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update credentials.');
      return;
    }

    setStep('celebration');
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-surface shadow-elevated transition-all">
      {/* Step 1: Recovery Request Form */}
      {step === 'request' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <button
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-vault-muted hover:text-slate-800 dark:hover:text-vault-text transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </button>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-vault-text">
              Reset your password
            </h2>
            <p className="text-xs text-slate-500 dark:text-vault-muted mt-1 leading-relaxed">
              Enter your work email address. We will dispatch a single-use, 15-minute cryptographic recovery link.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value.trim())}
                  placeholder="name@company.com"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching Secure Token...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Magic Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & Anti-Enumeration Notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-vault-elevated border border-slate-200/80 dark:border-vault-border text-[11px] text-slate-500 dark:text-vault-muted leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Enumeration-Safe Guarantee:
            </span>{' '}
            To prevent account harvesting, our server dispatches confirmation without revealing whether the address is registered in our tenant catalog.
          </div>
        </div>
      )}

      {/* Step 2: Check Your Inbox Interstitial */}
      {step === 'check-inbox' && (
        <div className="space-y-6 text-center animate-fade-in">
          {/* Centered confirmation icon */}
          <div className="relative w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto shadow-vault-glow">
            <Mail className="w-8 h-8" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-vault-surface">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-vault-text">
              Check your inbox
            </h2>
            <p className="text-xs text-slate-500 dark:text-vault-muted leading-relaxed max-w-sm mx-auto">
              {statusMessage || `If an account exists for ${email}, a single-use recovery link has been dispatched.`}
            </p>
          </div>

          {/* Intelligent Mailbox Shortcuts */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              One-Click Mailbox Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-elevated hover:border-blue-400 text-xs font-medium text-slate-700 dark:text-vault-text flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Gmail</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href="https://outlook.live.com"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-elevated hover:border-blue-400 text-xs font-medium text-slate-700 dark:text-vault-text flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open Outlook</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Sandbox Direct Action: Open Dispatched Email inside the app */}
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5" />
                <span>Simulated Mailbox Ready</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">15m TTL</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-vault-muted text-left">
              In this live sandbox, you can inspect the dispatched magic link directly in the built-in mailbox:
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('new-password')}
                className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
              >
                Simulate Link Click → Proceed to Step 3
              </button>
              {onOpenMockInbox && (
                <button
                  type="button"
                  onClick={onOpenMockInbox}
                  className="py-1.5 px-3 rounded-lg border border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-vault-elevated text-xs font-medium transition-colors"
                >
                  View Email
                </button>
              )}
            </div>
          </div>

          {/* Resend Cooldown Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-vault-border/60 flex items-center justify-between text-xs">
            <button
              onClick={onNavigateToLogin}
              className="text-slate-500 dark:text-vault-muted hover:text-slate-800 dark:hover:text-vault-text"
            >
              Return to sign in
            </button>

            {cooldown > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-vault-elevated text-[11px] font-mono text-slate-500 dark:text-vault-muted">
                <RotateCw className="w-3 h-3 animate-spin text-blue-500" />
                Resend in {cooldown}s
              </span>
            ) : (
              <button
                onClick={handleResend}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Resend email
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: New Password Creation Stage */}
      {step === 'new-password' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Token Authenticated ({email})</span>
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-vault-text">
              Create new passphrase
            </h2>
            <p className="text-xs text-slate-500 dark:text-vault-muted mt-1">
              Set a high-entropy passphrase to re-key your workspace custody.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
                New Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter vault-grade passphrase"
                  required
                  autoFocus
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              {/* Real-time 4-Segment Entropy Bar */}
              <PasswordEntropyMeter password={newPassword} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
                Confirm Passphrase
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter passphrase"
                  required
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono ${
                    confirmPassword && !passwordsMatch
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-200 dark:border-vault-border focus:border-blue-500'
                  }`}
                />
                {passwordsMatch && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-500">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-[11px] text-red-500">Passphrases do not match.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || entropy.score < 2 || !passwordsMatch}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Re-Keying Cryptographic Hash...</span>
                </>
              ) : (
                <>
                  <span>Update Password and Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 4: Success Celebration */}
      {step === 'celebration' && (
        <div className="space-y-6 text-center animate-fade-in py-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-vault-text">
              Password successfully updated
            </h2>
            <p className="text-xs text-slate-500 dark:text-vault-muted leading-relaxed max-w-sm mx-auto">
              Your cryptographic session key has been regenerated. All existing recovery links have been permanently invalidated.
            </p>
          </div>

          <button
            onClick={onNavigateToLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>Proceed to Workspace Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
