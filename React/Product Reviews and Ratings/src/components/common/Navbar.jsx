import React, { useState } from 'react';
import { useTrustStore } from '../../context/TrustStoreContext';
import { HotkeyKeycap } from './HotkeyKeycap';

export function Navbar() {
  const {
    viewMode,
    setViewMode,
    products,
    activeProductId,
    setActiveProductId,
    telemetryStats,
    queueCounts,
    resetToFactoryDefaults
  } = useTrustStore();

  const [showProductDropdown, setShowProductDropdown] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface-container-lowest border-b border-outline-variant/30 px-5 flex items-center justify-between select-none">
      {/* Left: Brand Identity & Product Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setViewMode('storefront')}>
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-mono font-bold text-sm shadow-xs">
            H
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
              Hollis Trust
            </span>
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider -mt-0.5">
              Review Governance Engine
            </span>
          </div>
        </div>

        {/* View Mode Toggle Pill (Storefront vs Admin) */}
        <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-outline-variant/40 ml-2">
          <button
            onClick={() => setViewMode('storefront')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-body-sm font-medium transition-all ${
              viewMode === 'storefront'
                ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            <span>Storefront</span>
          </button>
          <button
            onClick={() => setViewMode('admin')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-body-sm font-medium transition-all ${
              viewMode === 'admin'
                ? 'bg-primary text-white font-semibold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">security</span>
            <span>Admin Cockpit</span>
            {queueCounts['triage-inbox'] > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                viewMode === 'admin' ? 'bg-white text-primary' : 'bg-primary text-white'
              }`}>
                {queueCounts['triage-inbox']}
              </span>
            )}
          </button>
        </div>

        {/* Product Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProductDropdown(!showProductDropdown)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-body-sm font-medium text-on-surface transition-colors"
          >
            <span className="text-outline text-xs">SKU:</span>
            <span className="max-w-[140px] truncate">
              {products.find(p => p.id === activeProductId)?.title || 'Select Product'}
            </span>
            <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
          </button>

          {showProductDropdown && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-outline border-b border-outline-variant/20 mb-1">
                Select Active Catalog Item
              </div>
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProductId(p.id);
                    setShowProductDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-body-sm flex flex-col hover:bg-surface-container-low transition-colors ${
                    p.id === activeProductId ? 'bg-primary/5 text-primary font-semibold' : 'text-on-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{p.title}</span>
                    <span className="font-mono text-xs font-bold text-amber-700 ml-2">★ {p.rating}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-outline mt-0.5">
                    <span>{p.sku}</span>
                    {p.isBrigadeLocked && (
                      <span className="text-error bg-error/10 px-1 rounded font-bold">Lockdown Active</span>
                    )}
                    {p.defectAlert?.active && (
                      <span className="text-amber-800 bg-amber-100 px-1 rounded font-bold">QA Defect Radar</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Live Telemetry, Hotkey Cheat, Reset */}
      <div className="flex items-center gap-4">
        {/* Live Stream Pulse */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/30">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-label-code-sm text-primary uppercase font-bold tracking-tight">
            Live Stream Active
          </span>
        </div>

        {/* Demo Data Reset Button */}
        <button
          onClick={() => {
            if (confirm('Reset Hollis Trust database to original prototype seed data?')) {
              resetToFactoryDefaults();
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-mono text-label-code-sm"
          title="Reset to initial test data"
        >
          <span className="material-symbols-outlined text-[15px]">restart_alt</span>
          <span className="hidden md:inline">Reset Seed</span>
        </button>

        {/* User profile avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-outline-variant/30">
          <div className="flex flex-col text-right">
            <span className="font-mono text-xs font-semibold text-on-surface leading-tight">op_mc</span>
            <span className="font-mono text-[10px] text-primary font-medium leading-tight">Lead Operator</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold font-mono text-xs shadow-xs">
            MC
          </div>
        </div>
      </div>
    </header>
  );
}

