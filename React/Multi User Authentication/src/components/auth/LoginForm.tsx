import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, ArrowRight, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';
import { RoleName } from '../../types/auth';

interface LoginFormProps {
  onNavigateToForgotPassword: () => void;
  onNavigateToRegister: () => void;
  onSuccessLogin?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onNavigateToForgotPassword,
  onNavigateToRegister,
  onSuccessLogin
}) => {
  const { login, isLoading, isLockedOut, lockoutRemaining } = useAuth();

  const [email, setEmail] = useState('alex.vance@aegis-security.io');
  const [password, setPassword] = useState('VaultPassphrase!2026');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [remember30Days, setRemember30Days] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  // Email format verification
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // CapsLock Listener
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && !e.getModifierState('CapsLock')) {
      setCapsLockActive(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isValidEmail) {
      setErrorMessage('Please provide a valid work email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please provide your password.');
      return;
    }

    const res = await login(email, password, remember30Days);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failure.');
    } else {
      if (onSuccessLogin) onSuccessLogin();
    }
  };

  // Quick Persona selector for seamless evaluation
  const setDemoCredentials = (role: RoleName, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('VaultPassphrase!2026');
    setErrorMessage('');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Rate Limit Sentinel Lockout Alert */}
      {isLockedOut && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1">
            <h4 className="font-semibold text-red-700 dark:text-red-300">
              Account Lockout Sentinel Active
            </h4>
            <p className="leading-relaxed">
              Rate limiting triggered after 5 consecutive failures. Authentication vector locked for{' '}
              <strong className="font-mono text-sm underline">{lockoutRemaining}s</strong> to prevent automated credential stuffing.
            </p>
          </div>
        </div>
      )}

      {/* General Error Alert */}
      {errorMessage && !isLockedOut && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
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
              onChange={e => {
                setEmail(e.target.value.trim()); // Auto-trimming
                setErrorMessage('');
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder="name@company.com"
              disabled={isLockedOut || isLoading}
              className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                emailTouched && !isValidEmail
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-slate-200 dark:border-vault-border focus:border-blue-500'
              }`}
            />
            {emailTouched && isValidEmail && (
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-500">
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>
          {emailTouched && !isValidEmail && (
            <p className="mt-1 text-[11px] text-red-500">
              Enter a properly structured corporate domain email.
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-vault-text">
              Password
            </label>
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setErrorMessage('');
              }}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              placeholder="••••••••••••"
              disabled={isLockedOut || isLoading}
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-vault-text"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* CapsLock Warning Indicator */}
          {capsLockActive && (
            <div className="mt-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1.5 animate-fade-in font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Caps Lock is ON — passphrases are case-sensitive</span>
            </div>
          )}
        </div>

        {/* Utility Row */}
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-vault-muted">
            <input
              type="checkbox"
              checked={remember30Days}
              onChange={e => setRemember30Days(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-vault-border dark:bg-vault-elevated"
            />
            <span>Remember this device for 30 days</span>
          </label>
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={isLoading || isLockedOut}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying Cryptographic Credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* SSO Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-vault-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white dark:bg-vault-bg text-slate-400 dark:text-vault-muted">
            Or continue with
          </span>
        </div>
      </div>

      {/* SSO Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setEmail('alex.vance@aegis-security.io');
            setPassword('VaultPassphrase!2026');
            login('alex.vance@aegis-security.io', 'VaultPassphrase!2026');
          }}
          className="py-2 px-3 border border-slate-200 dark:border-vault-border rounded-xl bg-white dark:bg-vault-surface hover:bg-slate-50 dark:hover:bg-vault-elevated text-xs font-medium text-slate-700 dark:text-vault-text transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Google Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEmail('sarah.chen@aegis-security.io');
            setPassword('VaultPassphrase!2026');
            login('sarah.chen@aegis-security.io', 'VaultPassphrase!2026');
          }}
          className="py-2 px-3 border border-slate-200 dark:border-vault-border rounded-xl bg-white dark:bg-vault-surface hover:bg-slate-50 dark:hover:bg-vault-elevated text-xs font-medium text-slate-700 dark:text-vault-text transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>GitHub Enterprise</span>
        </button>
      </div>

      {/* Instant Demo Accounts Picker */}
      <div className="pt-2 p-3 rounded-xl bg-slate-50 dark:bg-vault-surface border border-slate-200 dark:border-vault-border">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-vault-text mb-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Quick Demo Personas (1-Click Fill)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDemoCredentials('Owner', 'alex.vance@aegis-security.io')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-elevated hover:border-purple-400 text-left text-[11px] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-vault-text">Alex Vance</span>
              <RoleBadge role="Owner" size="sm" showIcon={false} />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">alex.vance@...</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('Admin', 'sarah.chen@aegis-security.io')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-elevated hover:border-blue-400 text-left text-[11px] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-vault-text">Sarah Chen</span>
              <RoleBadge role="Admin" size="sm" showIcon={false} />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">sarah.chen@...</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('Manager', 'marcus.brooks@aegis-security.io')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-elevated hover:border-teal-400 text-left text-[11px] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-vault-text">Marcus Brooks</span>
              <RoleBadge role="Manager" size="sm" showIcon={false} />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">marcus.brooks@...</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('Member', 'elena.rostova@aegis-security.io')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-vault-border bg-white dark:bg-vault-elevated hover:border-emerald-400 text-left text-[11px] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-vault-text">Elena Rostova</span>
              <RoleBadge role="Member" size="sm" showIcon={false} />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">elena.rostova@...</span>
          </button>
        </div>
      </div>

      {/* Switch to Register link */}
      <div className="text-center text-xs text-slate-500 dark:text-vault-muted pt-1">
        <span>Don't have a workspace tenant? </span>
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          Create workspace
        </button>
      </div>
    </div>
  );
};
