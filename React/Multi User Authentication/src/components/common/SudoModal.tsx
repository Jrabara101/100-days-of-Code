import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, X, AlertTriangle, Lock } from 'lucide-react';

export const SudoModal: React.FC = () => {
  const { sudoModalOpen, closeSudoModal, verifySudoPassword, currentUser } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!sudoModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please provide your password to confirm identity.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const ok = await verifySudoPassword(password);
      if (!ok) {
        setError('Incorrect password. For demonstration, you may also use "VaultPassphrase!2026".');
      } else {
        setPassword('');
      }
    } catch {
      setError('Contextual verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-vault-elevated border border-slate-200 dark:border-vault-border rounded-2xl shadow-elevated p-6 relative">
        <button
          onClick={closeSudoModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-vault-text transition-colors p-1 rounded-lg"
          aria-label="Close sudo modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-vault-text">
              Contextual Sudo Challenge
            </h3>
            <p className="text-xs text-slate-500 dark:text-vault-muted">
              Confirm your identity before executing sensitive mutations
            </p>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <span>
              This operation alters high-risk security governance controls. Re-authenticating unlocks elevated sudo mode for 10 minutes without disrupting your active session.
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-vault-text mb-1.5">
              Confirm Password for <span className="font-mono text-blue-600 dark:text-blue-400">{currentUser?.email}</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your master password"
                autoFocus
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-vault-border bg-slate-50 dark:bg-vault-surface text-slate-900 dark:text-vault-text focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-vault-text p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={closeSudoModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-vault-muted hover:bg-slate-100 dark:hover:bg-vault-surface rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authorize Action</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
