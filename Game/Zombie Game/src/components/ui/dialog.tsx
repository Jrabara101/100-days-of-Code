import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, title, className }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          'relative w-full max-w-xl bg-[#0C1012] border-2 border-amber-500/40 rounded-md p-6 text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E272B]">
          {title ? (
            <h2 className="text-xl font-display font-black tracking-wider text-amber-400 uppercase flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-amber-500 animate-pulse" />
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
