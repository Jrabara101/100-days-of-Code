import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  side?: 'right' | 'left' | 'bottom';
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  title,
  side = 'right',
  children,
}) => {
  if (!open) return null;

  const sideClasses = {
    right: 'top-0 right-0 h-full w-full max-w-md border-l border-ember-orange/40 animate-in slide-in-from-right duration-200',
    left: 'top-0 left-0 h-full w-full max-w-md border-r border-ember-orange/40 animate-in slide-in-from-left duration-200',
    bottom: 'bottom-0 left-0 right-0 max-h-[80vh] border-t border-ember-orange/40 animate-in slide-in-from-bottom duration-200',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          'fixed z-50 bg-magma-950/95 backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col',
          sideClasses[side]
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-magma-800">
          <h3 className="font-rajdhani text-lg font-bold text-solar-gold uppercase tracking-wider">
            {title}
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-text-muted hover:text-solar-gold p-1 rounded-md hover:bg-magma-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto mt-4">{children}</div>
      </div>
    </div>
  );
};
