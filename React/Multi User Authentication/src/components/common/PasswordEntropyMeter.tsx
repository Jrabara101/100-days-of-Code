import React from 'react';
import { evaluatePasswordEntropy } from '../../utils/entropy';
import { Check, X, ShieldAlert, Sparkles, Clock, KeyRound } from 'lucide-react';

interface PasswordEntropyMeterProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordEntropyMeter: React.FC<PasswordEntropyMeterProps> = ({
  password,
  showRequirements = true
}) => {
  const result = evaluatePasswordEntropy(password);

  if (!password) {
    return (
      <div className="mt-2 text-xs text-slate-500 dark:text-vault-muted flex items-center gap-1.5">
        <KeyRound className="w-3.5 h-3.5" />
        <span>Entropy guide: Use 10+ characters with mixed case & symbols</span>
      </div>
    );
  }

  // Segment colors based on score
  const getSegmentColor = (segmentIndex: number) => {
    if (segmentIndex > result.score) {
      return 'bg-slate-200 dark:bg-vault-border';
    }

    switch (result.score) {
      case 1:
        return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
      case 2:
        return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
      case 3:
        return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      case 4:
        return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      default:
        return 'bg-slate-200 dark:bg-vault-border';
    }
  };

  return (
    <div className="mt-2.5 space-y-2.5 animate-fade-in">
      {/* 4-Segment Bar */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map(seg => (
          <div
            key={seg}
            className={`h-full rounded-full transition-all duration-300 ease-out ${getSegmentColor(seg)}`}
          />
        ))}
      </div>

      {/* Label and Estimated Crack Time */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <span style={{ color: result.color }}>{result.label}</span>
          <span className="text-slate-400 dark:text-vault-muted">
            • {result.entropyBits} bits entropy
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-vault-muted text-[11px] font-mono">
          <Clock className="w-3 h-3" />
          <span>Crack time: {result.crackTimeEstimate}</span>
        </div>
      </div>

      {/* Leak Pattern Alert if detected */}
      {result.detectedPattern && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Dictionary leak warning: Contains predictable token <strong>"{result.detectedPattern}"</strong>.
          </span>
        </div>
      )}

      {/* Dynamic Requirements Checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
          <div className={`flex items-center gap-1.5 transition-colors ${result.hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-vault-muted'}`}>
            {result.hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <span>10+ characters</span>
          </div>

          <div className={`flex items-center gap-1.5 transition-colors ${result.hasMixedCase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-vault-muted'}`}>
            {result.hasMixedCase ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <span>Upper & lowercase</span>
          </div>

          <div className={`flex items-center gap-1.5 transition-colors ${result.hasNumbers ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-vault-muted'}`}>
            {result.hasNumbers ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <span>At least one number</span>
          </div>

          <div className={`flex items-center gap-1.5 transition-colors ${result.hasSymbols ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-vault-muted'}`}>
            {result.hasSymbols ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <span>Cryptographic symbol</span>
          </div>
        </div>
      )}

      {result.score === 4 && (
        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>Vault-grade defense: Immune to dictionary & rainbow table attacks.</span>
        </div>
      )}
    </div>
  );
};
