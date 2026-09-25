import * as React from "react"
import { cn } from "@/lib/utils"

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className
}: TabsProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center p-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
              isActive
                ? "bg-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] border border-white/20 font-semibold"
                : "text-white/60 hover:text-white/90 hover:bg-white/5 border border-transparent"
            )}
          >
            {item.icon && <span className="opacity-90">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
