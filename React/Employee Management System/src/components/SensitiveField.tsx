import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { storage } from '../services/storageService';

interface SensitiveFieldProps {
  label: string;
  value: string | number;
  fieldId: string;
  targetEmployeeId: string;
  targetEmployeeName: string;
  canView?: boolean;
  prefix?: string;
  suffix?: string;
}

export const SensitiveField: React.FC<SensitiveFieldProps> = ({
  label,
  value,
  fieldId,
  targetEmployeeId,
  targetEmployeeName,
  canView = true,
  prefix = '',
  suffix = ''
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRevealed && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRevealed && timeLeft === 0) {
      setIsRevealed(false);
      setTimeLeft(30);
    }
    return () => clearTimeout(timer);
  }, [isRevealed, timeLeft]);

  const handleReveal = () => {
    if (!canView) return;
    setIsRevealed(true);
    setTimeLeft(30);

    // Record in security audit log
    storage.addAuditLog({
      action: 'PII_REVEAL',
      targetEmployeeId,
      targetEmployeeName,
      field: fieldId,
      details: `Unveiled masked ${label} field in Profile Inspector (30s session)`
    });
  };

  const handleHide = () => {
    setIsRevealed(false);
    setTimeLeft(30);
  };

  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="group relative rounded-xl border border-divider-light dark:border-divider-dark bg-surface-light dark:bg-surface-dark p-3.5 transition-all hover:border-brand/40">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-brand" />
          {label}
        </span>

        {canView ? (
          <div className="flex items-center gap-2">
            {isRevealed ? (
              <div className="flex items-center gap-1.5 bg-brand/10 text-brand dark:text-brand-dark px-2 py-0.5 rounded-full text-[11px] font-mono">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{timeLeft}s</span>
                <button
                  onClick={handleHide}
                  className="hover:opacity-80 text-slate-400 hover:text-slate-200 ml-1"
                  title="Hide immediately"
                >
                  <EyeOff className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleReveal}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-hover dark:text-brand-dark px-2 py-0.5 rounded hover:bg-brand/10 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>Reveal (Logged)</span>
              </button>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            Restricted
          </span>
        )}
      </div>

      <div className="relative font-mono text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
        {canView ? (
          isRevealed ? (
            <span className="transition-opacity duration-200 animate-fadeIn">
              {prefix}{formattedValue}{suffix}
            </span>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 select-none tracking-widest filter blur-[4px]">
                ••••••••••••••
              </span>
              <span className="text-[10px] text-slate-500 font-sans font-normal italic">
                Encrypted & Masked
              </span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic font-sans">
            <span>••••••••••••</span>
            <span className="text-[10px] text-slate-500">(Scope policy: No Read)</span>
          </div>
        )}
      </div>
    </div>
  );
};
