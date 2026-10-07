import * as React from 'react';
import { cn } from './button';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'fever' | 'emerald' | 'gold';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-gray-200 border-white/20',
    primary: 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]',
    secondary: 'bg-secondary/20 text-secondary border-secondary/40 shadow-[0_0_10px_rgba(255,0,127,0.3)]',
    outline: 'border border-white/30 text-gray-300',
    fever: 'bg-accent-fever/25 text-pink-300 border-accent-fever/50 animate-pulse',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    gold: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(255,209,102,0.3)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono tracking-wider transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// Progress Bar
export function Progress({ value = 0, max = 100, color = 'bg-primary', className }: { value?: number; max?: number; color?: string; className?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-surface-high', className)}>
      <div
        className={cn('h-full transition-all duration-150 ease-out', color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Dialog / Modal Backdrop Container
export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      {/* Content modal */}
      <div
        className={cn(
          'relative z-50 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-surface-low/95 p-6 shadow-2xl backdrop-blur-2xl text-white transition-all transform scale-100',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            {title && <h2 className="text-xl font-bold font-display uppercase tracking-wide text-primary">{title}</h2>}
            {description && <p className="text-sm text-gray-400 font-mono mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-mono"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
