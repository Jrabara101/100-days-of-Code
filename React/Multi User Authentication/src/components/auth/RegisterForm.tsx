import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PasswordEntropyMeter } from '../common/PasswordEntropyMeter';
import { evaluatePasswordEntropy } from '../../utils/entropy';
import { Mail, User as UserIcon, Lock, ArrowRight, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface RegisterFormProps {
  onNavigateToLogin: () => void;
  inviteToken?: string;
  initialEmail?: string;
  initialRole?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onNavigateToLogin,
  inviteToken,
  initialEmail = '',
  initialRole = 'Member'
}) => {
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const entropy = evaluatePasswordEntropy(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !fullName || !password) {
      setErrorMessage('Please fill in all identity fields.');
      return;
    }

    if (entropy.score < 2) {
      setErrorMessage('Password strength does not meet the minimum corporate entropy threshold.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password confirmation mismatch.');
      return;
    }

    const res = await register(email, password, fullName, inviteToken);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create workspace account.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {inviteToken && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-700 dark:text-teal-300 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-teal-800 dark:text-teal-200">
              Tokenized Team Invitation Detected
            </h4>
            <p className="mt-0.5 leading-relaxed">
              Accepting this invitation assigns you the pre-configured role privileges of{' '}
              <strong>"{initialRole}"</strong>.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Elena Vance"
              required
              className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
            Work Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value.trim())}
              placeholder="elena@enterprise.io"
              required
              readOnly={!!inviteToken && !!initialEmail}
              className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                inviteToken && initialEmail ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
            Create Master Passphrase
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create high-entropy passphrase"
              required
              className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            />
          </div>
          {/* Real-time 4-Segment Entropy Bar */}
          <PasswordEntropyMeter password={password} />
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
          disabled={isLoading || (password.length > 0 && entropy.score < 2) || (confirmPassword.length > 0 && !passwordsMatch)}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Provisioning Identity...</span>
            </>
          ) : (
            <>
              <span>{inviteToken ? 'Accept Invitation & Enter' : 'Create Workspace Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 dark:text-vault-muted pt-1">
        <span>Already have an authenticated identity? </span>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};
