import React from 'react';
import { clsx } from 'clsx';
import { soundEngine } from '@/services/audioService';

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  altered?: boolean;
  disabled?: boolean;
  onResetDefault?: () => void;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  altered = false,
  disabled = false,
  onResetDefault,
  onCheckedChange,
}) => {
  const toggle = () => {
    if (disabled) return;
    const next = !checked;
    soundEngine.playToggle(next);
    onCheckedChange(next);
  };

  return (
    <div
      onClick={toggle}
      className={clsx(
        'flex items-center justify-between p-3 rounded-lg bg-[#131722]/80 border border-[#1E2538] transition-all cursor-pointer select-none',
        disabled ? 'opacity-40 pointer-events-none' : 'hover:border-slate-700/80'
      )}
    >
      <div className="flex flex-col gap-0.5 pr-4">
        <div className="flex items-center gap-2">
          {altered && (
            <span
              title="Parameter altered from default"
              className="inline-block w-2 h-2 rounded-full bg-[#10B981] shadow-glow-emerald animate-pulse"
            />
          )}
          <span className="text-sm font-semibold text-[#F8FAFC] tracking-wide">{label}</span>
          {altered && onResetDefault && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetDefault();
              }}
              title="Reset parameter to default"
              className="text-[10px] font-mono text-slate-400 hover:text-amber-400 transition-colors px-1 py-0.2 rounded hover:bg-[#1E2538]"
            >
              RESET
            </button>
          )}
        </div>
        {description && <p className="text-xs text-[#64748B] leading-relaxed">{description}</p>}
      </div>

      <div
        className={clsx(
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out border',
          checked
            ? 'bg-cyan-950 border-cyan-500/80 shadow-glow-cyan'
            : 'bg-[#0E1118] border-[#1E2538]'
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full transition duration-200 ease-in-out shadow-sm',
            checked
              ? 'translate-x-6 bg-[#38BDF8] shadow-glow-cyan'
              : 'translate-x-1 bg-slate-600'
          )}
        />
      </div>
    </div>
  );
};
