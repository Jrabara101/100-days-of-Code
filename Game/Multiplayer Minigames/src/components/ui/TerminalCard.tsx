import React from 'react';
import { cn } from '../../lib/utils';

interface TerminalCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  variant?: 'default' | 'p1' | 'p2';
  className?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const TerminalCard: React.FC<TerminalCardProps> = ({
  title,
  subtitle,
  badge,
  variant = 'default',
  className,
  children,
  headerAction,
}) => {
  const variantStyles = {
    default: 'border-slate-800 bg-[#161B22]/85 shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
    p1: 'border-[#58A6FF]/40 bg-[#161B22]/90 shadow-[0_0_20px_rgba(88,166,255,0.15)]',
    p2: 'border-[#D29922]/40 bg-[#161B22]/90 shadow-[0_0_20px_rgba(210,153,34,0.15)]',
  };

  const badgeStyles = {
    default: 'text-slate-400 border-slate-700 bg-slate-900/60',
    p1: 'text-[#58A6FF] border-[#58A6FF]/40 bg-[#58A6FF]/10',
    p2: 'text-[#D29922] border-[#D29922]/40 bg-[#D29922]/10',
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border backdrop-blur-md overflow-hidden transition-all duration-300',
        variantStyles[variant],
        className
      )}
    >
      {/* Top industrial status bar */}
      {(title || badge || headerAction) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-black/40">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                variant === 'p1'
                  ? 'bg-[#58A6FF] shadow-[0_0_8px_#58A6FF]'
                  : variant === 'p2'
                  ? 'bg-[#D29922] shadow-[0_0_8px_#D29922]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              )}
            />
            {title && (
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-200">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {badge && (
              <span
                className={cn(
                  'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border',
                  badgeStyles[variant]
                )}
              >
                {badge}
              </span>
            )}
            {headerAction}
          </div>
        </div>
      )}

      {/* Main card body */}
      <div className="p-4">{children}</div>
    </div>
  );
};
