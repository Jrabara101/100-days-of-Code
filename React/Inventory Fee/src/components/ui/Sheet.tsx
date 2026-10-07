import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: string;
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  width = "max-w-xl",
}: SheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Sliding Sheet Panel */}
      <div className="fixed inset-y-0 right-0 flex pl-10">
        <div
          className={cn(
            "w-screen bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200 text-zinc-100",
            width
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <h2 className="text-sm font-semibold tracking-wide text-zinc-100 font-mono">
                  {title}
                </h2>
              </div>
              {description && (
                <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
