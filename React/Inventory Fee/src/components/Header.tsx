import React from "react";
import {
  Boxes,
  ScanLine,
  Activity,
  Radio,
  Volume2,
  VolumeX,
  Command,
  User,
  ShieldCheck
} from "lucide-react";
import { Button } from "./ui/Button";

interface HeaderProps {
  onOpenScanner: () => void;
  onOpenCommand: () => void;
  isWsConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalSkus: number;
}

export function Header({
  onOpenScanner,
  onOpenCommand,
  isWsConnected,
  soundEnabled,
  onToggleSound,
  totalSkus,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-13 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between text-zinc-100">
      {/* Brand & Warehouse Status */}
      <div className="flex items-center gap-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm tracking-wider text-white">
                AEROLOGIX
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-semibold">
                COMMAND v2.4
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span>WH-04 Austin Hub</span>
              <span>•</span>
              <span className="text-zinc-500">{totalSkus} SKUs Monitored</span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

        {/* Telemetry latency */}
        <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-zinc-400">TELEMETRY</span>
          <span className="text-emerald-400 font-semibold">12ms</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>
      </div>

      {/* Center Search / Scan Reticle Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenCommand}
          className="w-full h-8 px-3 rounded bg-zinc-900/80 border border-zinc-700/80 hover:border-cyan-500/50 text-left text-xs font-mono text-zinc-400 flex items-center justify-between transition-colors shadow-inner group"
        >
          <div className="flex items-center gap-2">
            <ScanLine className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
            <span>Fuzzy Search SKU, Bin, or UPC barcode...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
              ⌘K
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 rounded">
              F2
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Zero-Hardware Scanner Trigger */}
        <Button
          onClick={onOpenScanner}
          variant="cyan"
          size="sm"
          className="gap-1.5 font-mono shadow-sm"
        >
          <ScanLine className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">SCAN & STASH</span>
        </Button>

        {/* Audio FX Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? "Audio validation beeps active" : "Audio muted"}
          className="p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          )}
        </button>

        {/* Live WS Status */}
        <div
          title={isWsConnected ? "Live WebSocket telemetry linked" : "Connecting to warehouse stream..."}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isWsConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span className="hidden sm:inline">
            {isWsConnected ? "LIVE WS" : "RECONNECTING"}
          </span>
        </div>

        <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

        {/* Operator Profile */}
        <div className="flex items-center gap-2 pl-1">
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-xs font-mono font-medium text-zinc-200 leading-none">
              OP-7740
            </span>
            <span className="text-[9px] font-mono text-cyan-400/80 leading-none mt-1">
              Lead Tactician
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
