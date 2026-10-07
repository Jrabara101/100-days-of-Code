import React, { useState, useEffect } from "react";
import {
  Search,
  ScanLine,
  MapPin,
  TrendingDown,
  Layers,
  Compass,
  CheckCircle2,
  Lock,
  ArrowRight,
  X,
} from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { NavTab } from "./Sidebar";
import { Input } from "./ui/Input";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onSelectTab: (tab: NavTab) => void;
  onOpenScanner: () => void;
}

export function CommandMenu({
  open,
  onOpenChange,
  items,
  onSelectItem,
  onSelectTab,
  onOpenScanner,
}: CommandMenuProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "F2") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const filteredItems = items.filter(
    (it) =>
      it.sku.toLowerCase().includes(query.toLowerCase()) ||
      it.title.toLowerCase().includes(query.toLowerCase()) ||
      it.upc.includes(query) ||
      it.primaryLocation.bin.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Palette Card */}
      <div className="relative z-50 w-full max-w-xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 p-3 shadow-2xl shadow-cyan-950/40 text-zinc-100 font-mono animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-zinc-800 pb-2 px-1">
          <Search className="w-4 h-4 text-cyan-400 mr-2 flex-shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, SKU (AVN-4420), or Bin location..."
            className="h-9 border-none bg-transparent text-sm focus-visible:ring-0 px-0 placeholder:text-zinc-500"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Nav Actions */}
        <div className="py-2 border-b border-zinc-800/80">
          <div className="text-[10px] text-zinc-400 uppercase px-2 mb-1">
            Quick Operations Shortcuts
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => {
                onOpenScanner();
                onOpenChange(false);
              }}
              className="p-2 rounded hover:bg-zinc-900 text-left flex items-center gap-2 text-cyan-300 transition-colors"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Launch Scan & Stash</span>
            </button>

            <button
              onClick={() => {
                onSelectTab("digital-twin");
                onOpenChange(false);
              }}
              className="p-2 rounded hover:bg-zinc-900 text-left flex items-center gap-2 text-zinc-300 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Digital Twin 2D Map</span>
            </button>

            <button
              onClick={() => {
                onSelectTab("burn-forecaster");
                onOpenChange(false);
              }}
              className="p-2 rounded hover:bg-zinc-900 text-left flex items-center gap-2 text-zinc-300 transition-colors"
            >
              <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Burn-Rate Forecaster</span>
            </button>

            <button
              onClick={() => {
                onSelectTab("channel-locks");
                onOpenChange(false);
              }}
              className="p-2 rounded hover:bg-zinc-900 text-left flex items-center gap-2 text-zinc-300 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Multi-Channel Locks</span>
            </button>
          </div>
        </div>

        {/* SKU Results List */}
        <div className="max-h-64 overflow-y-auto divide-y divide-zinc-900 pt-2">
          <div className="text-[10px] text-zinc-400 uppercase px-2 mb-1">
            SKUs & Manifest ({filteredItems.length})
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              No matching SKUs or locations found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectItem(item);
                  onOpenChange(false);
                }}
                className="w-full p-2.5 rounded hover:bg-zinc-900/80 text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300 group-hover:text-cyan-200">
                      {item.sku}
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-900 px-1 rounded">
                      Bin {item.primaryLocation.bin}
                    </span>
                  </div>
                  <div className="text-zinc-300 text-[11px] truncate max-w-sm mt-0.5">
                    {item.title}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-zinc-200">
                    {item.quantityAvailable} Avail
                  </div>
                  <div className="text-[10px] text-cyan-400 flex items-center justify-end gap-1">
                    Open <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 px-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
          <span>Navigation: Arrow Keys or Click</span>
          <span>Close: ESC</span>
        </div>
      </div>
    </div>
  );
}
