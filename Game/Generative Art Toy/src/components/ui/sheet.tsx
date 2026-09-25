import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'bottom' | 'right';
  className?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  position = 'bottom',
  className
}: SheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Clickable backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div
        className={cn(
          "fixed pointer-events-auto bg-neutral-950/90 border-white/15 backdrop-blur-2xl shadow-2xl transition-all duration-300 flex flex-col z-50",
          position === 'bottom' && "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t border-x px-6 py-5",
          position === 'right' && "top-0 right-0 bottom-0 w-full sm:w-[420px] rounded-l-2xl border-l border-y px-6 py-5",
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-semibold text-sm text-white tracking-wide">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
