import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Bell,
  Sparkles,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';

export const TopHeader: React.FC = () => {
  const { orders, setIsCommandPaletteOpen } = useOrders();
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pendingExceptions = orders.filter((o) => o.order_status === 'on_hold_exception').length;

  return (
    <header className="h-14 border-b border-divider-light dark:border-divider-dark bg-surface-secondary-light/80 dark:bg-surface-secondary-dark/80 backdrop-blur px-6 flex items-center justify-between shrink-0 select-none z-10 transition-colors">
      {/* Left: Operational Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">OPS CLOCK:</span>
          <span className="text-brand-primary font-mono">{timeString} UTC</span>
        </div>
        <div className="h-4 w-px bg-divider-light dark:bg-divider-dark hidden sm:block"></div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Carrier Dispatch Cutoff:</span>
          <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            ⏱ 4:00 PM EST (1h 40m left)
          </span>
        </div>
      </div>

      {/* Right: Telemetry & Controls */}
      <div className="flex items-center gap-3">
        {/* Exceptions Pill */}
        {pendingExceptions > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>{pendingExceptions} Exceptions Blocking Pick</span>
          </div>
        )}

        {/* Global Search Shortcut Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark hover:border-brand-primary text-xs text-slate-600 dark:text-slate-300 shadow-2xs transition-all"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Command Menu</span>
          <kbd className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Live Sync Status */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 pl-2">
          <Wifi className="w-3 h-3 text-emerald-500" />
          <span className="hidden lg:inline">SYNCED</span>
        </div>
      </div>
    </header>
  );
};

