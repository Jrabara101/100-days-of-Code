import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => onOpenChange?.(false)}
      />

      {/* Modal Dialog Content */}
      <div
        className={cn(
          'relative z-50 w-full max-w-lg bg-magma-900 border-2 border-ember-orange/40 rounded-xl p-6 shadow-[0_0_50px_rgba(255,87,34,0.3)] animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        <div className="flex items-center justify-between mb-4 border-b border-magma-800 pb-3">
          <div>
            {title && <h2 className="font-rajdhani text-2xl font-bold text-solar-gold tracking-wide">{title}</h2>}
            {description && <p className="font-chakra text-xs text-text-muted mt-1">{description}</p>}
          </div>
          {onOpenChange && (
            <button
              onClick={() => onOpenChange(false)}
              className="text-text-muted hover:text-solar-gold transition-colors p-1 rounded-md hover:bg-magma-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};
