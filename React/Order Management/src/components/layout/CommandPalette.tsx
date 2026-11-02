import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Package,
  AlertTriangle,
  Zap,
  Clock,
  Truck,
  RotateCcw,
  Boxes,
  ArrowRight,
  Maximize2,
  X,
} from 'lucide-react';
import { useOrders, FilterTab } from '../../context/OrderContext';

interface CommandPaletteProps {
  setCurrentView: (view: 'ledger' | 'pack' | 'returns' | 'inventory') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ setCurrentView }) => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    orders,
    openOrderInspector,
    setActiveFilterTab,
    openPackStation,
  } = useOrders();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Filter commands and orders
  const lowerQ = query.toLowerCase().trim();

  const matchedOrders = orders.filter((o) => {
    if (!lowerQ) return true;
    return (
      o.order_number.toLowerCase().includes(lowerQ) ||
      o.customer_name.toLowerCase().includes(lowerQ) ||
      o.customer_email.toLowerCase().includes(lowerQ) ||
      o.line_items.some((i) => i.sku.toLowerCase().includes(lowerQ) || i.title.toLowerCase().includes(lowerQ))
    );
  }).slice(0, 5);

  const actions = [
    {
      id: 'act-exceptions',
      title: 'View Exceptions & Holds Radar',
      subtitle: 'Triage invalid addresses, fraud reviews and stock shortages',
      icon: AlertTriangle,
      color: 'text-rose-500',
      run: () => {
        setCurrentView('ledger');
        setActiveFilterTab('exceptions');
      },
    },
    {
      id: 'act-pack',
      title: 'Open Barcode Scan-to-Pack Station Mode',
      subtitle: 'Dedicated full-screen warehouse fulfillment interface',
      icon: Maximize2,
      color: 'text-emerald-500',
      run: () => {
        setCurrentView('pack');
      },
    },
    {
      id: 'act-returns',
      title: 'Open Returns & Exchanges (RMA) Desk',
      subtitle: 'Keep-the-Item economizer calculator & dock grading',
      icon: RotateCcw,
      color: 'text-amber-500',
      run: () => {
        setCurrentView('returns');
      },
    },
    {
      id: 'act-inventory',
      title: 'Inspect Inventory Guardrails & ATS Stock',
      subtitle: 'Safety-stock channel reservation locks (DTC, B2B, POS)',
      icon: Boxes,
      color: 'text-purple-500',
      run: () => {
        setCurrentView('inventory');
      },
    },
  ].filter((a) => !lowerQ || a.title.toLowerCase().includes(lowerQ) || a.subtitle.toLowerCase().includes(lowerQ));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsCommandPaletteOpen(false)}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all select-none">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-divider-light dark:border-divider-dark flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Order #, customer email, SKU, or type an action..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-sans"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 text-xs">
          {/* Quick Actions Section */}
          {actions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Navigation Actions
              </div>
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      act.run();
                      setIsCommandPaletteOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${act.color}`} />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {act.subtitle}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Matched Orders Section */}
          {matchedOrders.length > 0 && (
            <div className="pt-2">
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Orders & Shipments
              </div>
              {matchedOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => {
                    openOrderInspector(ord.id);
                    setIsCommandPaletteOpen(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-brand-primary" />
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {ord.order_number} — {ord.customer_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {ord.shipping_address.city}, {ord.shipping_address.state} • {ord.line_items.length} items
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-brand-primary">
                    Open Inspector →
                  </span>
                </div>
              ))}
            </div>
          )}

          {actions.length === 0 && matchedOrders.length === 0 && (
            <div className="py-8 text-center text-slate-400 font-mono">
              No matching orders or commands found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

