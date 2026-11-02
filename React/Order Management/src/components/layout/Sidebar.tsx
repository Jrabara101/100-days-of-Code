import React from 'react';
import {
  Package,
  AlertTriangle,
  Zap,
  Clock,
  Truck,
  RotateCcw,
  Boxes,
  Maximize2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Keyboard,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useOrders, FilterTab } from '../../context/OrderContext';
import { MOCK_WAREHOUSES } from '../../utils/mockData';

interface SidebarProps {
  currentView: 'ledger' | 'pack' | 'returns' | 'inventory';
  setCurrentView: (view: 'ledger' | 'pack' | 'returns' | 'inventory') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const {
    orders,
    activeFilterTab,
    setActiveFilterTab,
    selectedWarehouseId,
    setSelectedWarehouseId,
    setIsCommandPaletteOpen,
    setIsKeyboardGuideOpen,
    soundEnabled,
    toggleSound,
    isDarkMode,
    toggleDarkMode,
  } = useOrders();

  // Counts for badges
  const exceptionsCount = orders.filter((o) => o.order_status === 'on_hold_exception').length;
  const readyCount = orders.filter((o) => o.order_status === 'ready_to_fulfill').length;
  const graceCount = orders.filter((o) => o.order_status === 'grace_hold').length;
  const transitCount = orders.filter((o) => o.fulfillments.some((f) => f.status === 'in_transit' || f.status === 'exception_stalled')).length;

  const handleNavClick = (view: 'ledger' | 'pack' | 'returns' | 'inventory', filter?: FilterTab) => {
    setCurrentView(view);
    if (filter) {
      setActiveFilterTab(filter);
    }
  };

  return (
    <aside className="w-60 bg-surface-secondary-light dark:bg-surface-secondary-dark border-r border-divider-light dark:border-divider-dark flex flex-col h-screen select-none shrink-0 transition-colors duration-200">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-divider-light dark:border-divider-dark flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-sm shadow-brand-primary/30">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
              DISPATCH<span className="text-brand-primary font-mono text-xs ml-1">CORE</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-tight flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              99.8% SLA HEALTH
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse / Node Switcher */}
      <div className="p-3 border-b border-divider-light dark:border-divider-dark">
        <label className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5 block px-1">
          Fulfillment Node
        </label>
        <div className="relative">
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="w-full appearance-none bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark text-xs font-medium text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all cursor-pointer truncate"
          >
            <option value="all">🏭 All Nodes (3 Hubs • 99.2% SLA)</option>
            {MOCK_WAREHOUSES.map((wh) => (
              <option key={wh.id} value={wh.id}>
                📍 {wh.code} ({wh.name.slice(0, 18)}...)
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Global Command Palette Trigger */}
      <div className="p-3">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark hover:border-slate-300 dark:hover:border-slate-600 rounded-lg shadow-2xs group transition-all"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400 group-hover:text-brand-primary transition-colors">🔍</span>
            <span className="truncate">Search orders, SKUs...</span>
          </span>
          <kbd className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-400 dark:text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto text-xs font-medium">
        <div className="px-2 pt-2 pb-1 text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
          Operations Horizon
        </div>

        {/* All Orders Ledger */}
        <button
          onClick={() => handleNavClick('ledger', 'all')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
            currentView === 'ledger' && activeFilterTab === 'all'
              ? 'bg-brand-primary text-white font-semibold shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5" />
            <span>All Orders Ledger</span>
          </span>
          <span className={`font-mono text-[11px] ${currentView === 'ledger' && activeFilterTab === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>
            {orders.length}
          </span>
        </button>

        {/* Exceptions & Holds */}
        <button
          onClick={() => handleNavClick('ledger', 'exceptions')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
            currentView === 'ledger' && activeFilterTab === 'exceptions'
              ? 'bg-rose-600 text-white font-semibold shadow-xs'
              : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Exceptions & Holds</span>
          </span>
          {exceptionsCount > 0 && (
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                currentView === 'ledger' && activeFilterTab === 'exceptions'
                  ? 'bg-white text-rose-600'
                  : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 animate-pulse'
              }`}
            >
              {exceptionsCount}
            </span>
          )}
        </button>

        {/* Ready to Ship */}
        <button
          onClick={() => handleNavClick('ledger', 'ready_to_ship')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
            currentView === 'ledger' && activeFilterTab === 'ready_to_ship'
              ? 'bg-brand-primary text-white font-semibold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Ready to Ship / Wave</span>
          </span>
          <span className="font-mono text-[11px] text-slate-400">{readyCount}</span>
        </button>

        {/* 15m Grace Window */}
        <button
          onClick={() => handleNavClick('ledger', 'grace_hold')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
            currentView === 'ledger' && activeFilterTab === 'grace_hold'
              ? 'bg-purple-600 text-white font-semibold'
              : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>15m Grace Window</span>
          </span>
          <span className="font-mono text-[11px] text-purple-500 dark:text-purple-300">{graceCount}</span>
        </button>

        {/* In-Transit & Carrier Radar */}
        <button
          onClick={() => handleNavClick('ledger', 'in_transit')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
            currentView === 'ledger' && activeFilterTab === 'in_transit'
              ? 'bg-brand-primary text-white font-semibold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5" />
            <span>Carrier Transit Radar</span>
          </span>
          <span className="font-mono text-[11px] text-slate-400">{transitCount}</span>
        </button>

        <div className="px-2 pt-3 pb-1 text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
          Warehouse Stations
        </div>

        {/* Scan-to-Pack Station */}
        <button
          onClick={() => handleNavClick('pack')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
            currentView === 'pack'
              ? 'bg-brand-primary text-white font-semibold shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Scan-to-Pack Station</span>
          </span>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-mono px-1 rounded">
            HOT
          </span>
        </button>

        {/* Returns & Exchanges (RMA) */}
        <button
          onClick={() => handleNavClick('returns')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
            currentView === 'returns'
              ? 'bg-brand-primary text-white font-semibold shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Returns & RMAs</span>
          </span>
          <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 rounded">
            Eco
          </span>
        </button>

        {/* Inventory & Safety Stock */}
        <button
          onClick={() => handleNavClick('inventory')}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
            currentView === 'inventory'
              ? 'bg-brand-primary text-white font-semibold shadow-xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventory Guardrails</span>
          </span>
          <span className="font-mono text-[11px] text-slate-400">ATS</span>
        </button>
      </nav>

      {/* Bottom Utility Controls */}
      <div className="p-3 border-t border-divider-light dark:border-divider-dark space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute warehouse audio synthesizer' : 'Enable barcode audio beeps'}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              onClick={toggleDarkMode}
              title="Toggle Dark/Light Mode"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          <button
            onClick={() => setIsKeyboardGuideOpen(true)}
            title="Keyboard shortcuts (J/K/P/S/A/Cmd+K)"
            className="flex items-center gap-1 text-[11px] font-mono hover:text-slate-900 dark:hover:text-white px-1.5 py-1 rounded bg-surface-elevated-light dark:bg-surface-elevated-dark border border-divider-light dark:border-divider-dark"
          >
            <Keyboard className="w-3 h-3" />
            <span>?</span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 text-center">
          v2.4.0 • PRODUCTION GRADE
        </div>
      </div>
    </aside>
  );
};

