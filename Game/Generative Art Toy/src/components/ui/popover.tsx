import * as React from "react"
import { cn } from "@/lib/utils"

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Popover({
  open,
  onClose,
  trigger,
  children,
  className
}: PopoverProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {trigger}
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-2 p-3 bg-neutral-900/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
