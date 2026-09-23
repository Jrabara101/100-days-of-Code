import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          'relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#1E1B19] border border-[#3A3430] p-6 shadow-2xl animate-in zoom-in-95 duration-150',
          className
        )}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-[#A8A29E] hover:text-white p-1 rounded-lg bg-[#2B2724] border border-[#3D3733] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          {description && <p className="text-xs text-[#78716C] font-mono mt-0.5">{description}</p>}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
