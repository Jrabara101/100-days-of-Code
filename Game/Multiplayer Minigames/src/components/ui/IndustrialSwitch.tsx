import React from 'react';
import { sounds } from '../../lib/audio';
import { cn } from '../../lib/utils';

interface IndustrialSwitchProps {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  variant?: 'p1' | 'p2' | 'neutral';
  className?: string;
}

export const IndustrialSwitch: React.FC<IndustrialSwitchProps> = ({
  label,
  sublabel,
  checked,
  onChange,
  disabled = false,
  variant = 'neutral',
  className,
}) => {
  const handleClick = () => {
    if (disabled) return;
    sounds.playClick(checked ? 0.9 : 1.3);
    onChange(!checked);
  };

  const activeColors = {
    p1: 'bg-[#58A6FF] shadow-[0_0_12px_#58A6FF]',
    p2: 'bg-[#D29922] shadow-[0_0_12px_#D29922]',
    neutral: 'bg-emerald-400 shadow-[0_0_12px_#34d399]',
  };

  const borderColors = {
    p1: checked ? 'border-[#58A6FF]/60 text-[#58A6FF]' : 'border-slate-800 text-slate-400',
    p2: checked ? 'border-[#D29922]/60 text-[#D29922]' : 'border-slate-800 text-slate-400',
    neutral: checked ? 'border-emerald-500/60 text-emerald-400' : 'border-slate-800 text-slate-400',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'group relative flex items-center justify-between p-3 rounded-lg border bg-[#11161D] transition-all text-left w-full',
        'hover:bg-[#161B22] focus:outline-none focus:ring-1 focus:ring-slate-600',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        borderColors[variant],
        className
      )}
    >
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-200 group-hover:text-white transition-colors">
          {label}
        </div>
        {sublabel && (
          <div className="text-[10px] text-slate-400 tracking-wide font-mono mt-0.5">
            {sublabel}
          </div>
        )}
      </div>

      {/* Industrial switch body */}
      <div className="relative w-12 h-6 rounded-full bg-slate-900 border border-slate-700 p-0.5 shadow-inner transition-colors">
        <div
          className={cn(
            'w-4 h-4 rounded-full transition-transform duration-200 transform flex items-center justify-center',
            checked ? 'translate-x-6' : 'translate-x-0 bg-slate-600',
            checked && activeColors[variant]
          )}
        >
          {/* Metal rivet center */}
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900/60" />
        </div>
      </div>
    </button>
  );
};
