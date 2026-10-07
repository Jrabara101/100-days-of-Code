import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-mono font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-neon-cyan text-obsidian-void font-bold hover:bg-neon-cyan/90 shadow-glow-cyan/30 hover:shadow-glow-cyan',
      secondary: 'bg-obsidian-surface border border-obsidian-border text-slate-100 hover:bg-obsidian-overlay hover:border-neon-cyan/40',
      outline: 'bg-transparent border border-obsidian-border text-slate-300 hover:text-slate-100 hover:border-slate-400',
      danger: 'bg-neon-ruby/10 border border-neon-ruby/40 text-neon-ruby hover:bg-neon-ruby/20 hover:border-neon-ruby shadow-glow-ruby/20',
      gold: 'bg-neon-gold text-obsidian-void font-bold hover:bg-amber-400 shadow-glow-gold/40 hover:shadow-glow-gold',
      ghost: 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1 rounded-[3px] h-7',
      md: 'text-xs px-4 py-2 rounded-[4px] h-9 tracking-wider',
      lg: 'text-sm px-6 py-2.5 rounded-[4px] h-11 tracking-wider font-semibold',
      icon: 'h-9 w-9 rounded-[4px]',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// Badge
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'emerald' | 'ruby' | 'gold' | 'purple' | 'slate';
}

export function Badge({ className, variant = 'slate', children, ...props }: BadgeProps) {
  const variants = {
    cyan: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30',
    emerald: 'bg-neon-emerald/15 text-neon-emerald border-neon-emerald/30',
    ruby: 'bg-neon-ruby/15 text-neon-ruby border-neon-ruby/30',
    gold: 'bg-neon-gold/15 text-neon-gold border-neon-gold/40',
    purple: 'bg-neon-purple/15 text-neon-purple border-neon-purple/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-widest font-semibold border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Card
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-obsidian-surface/90 backdrop-blur-md border border-obsidian-border rounded-[4px] shadow-lg relative overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Modal Dialog Backdrop & Container
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-void/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div 
        className={cn(
          'relative w-full z-10 bg-obsidian-base border border-obsidian-border rounded-[6px] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between pb-4 border-b border-obsidian-border mb-4">
          <div>
            <h3 className="text-lg font-bold font-mono tracking-wider text-slate-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-neon-cyan animate-pulse" />
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1 font-mono">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-white/5 transition-colors font-mono text-sm"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
