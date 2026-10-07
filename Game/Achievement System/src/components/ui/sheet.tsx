import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sheet({
  open,
  onOpenChange,
  side = 'right',
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: 'right' | 'bottom';
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {side === 'right' ? (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-700/80 bg-surface/98 p-6 shadow-2xl backdrop-blur-2xl transition-transform duration-300">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-surface-high hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 overflow-y-auto pr-1">{children}</div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-slate-700/80 bg-surface/98 p-6 shadow-2xl backdrop-blur-2xl transition-transform duration-300">
          <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => onOpenChange(false)} />
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-surface-high hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 overflow-y-auto pr-1">{children}</div>
        </div>
      )}
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-xl font-bold tracking-tight text-white font-display', className)} {...props} />;
}

export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-400', className)} {...props} />;
}
