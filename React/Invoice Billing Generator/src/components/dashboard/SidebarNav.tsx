import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Repeat,
  Users,
  BadgeDollarSign,
  ShieldCheck,
  Plus,
  Zap,
  CheckCircle2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export type NavigationTab =
  | 'ledger'
  | 'quotes'
  | 'retainers'
  | 'clients'
  | 'payouts'
  | 'dunning';

interface SidebarNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onNewInvoice: () => void;
  invoiceCount?: number;
  quotesCount?: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentTab,
  onSelectTab,
  onNewInvoice,
  invoiceCount = 4,
  quotesCount = 1,
}) => {
  const navItems = [
    { id: 'ledger' as NavigationTab, label: 'Invoices & Ledger', icon: FileText, badge: invoiceCount },
    { id: 'quotes' as NavigationTab, label: 'Quotes & Proposals', icon: FileSpreadsheet, badge: quotesCount },
    { id: 'retainers' as NavigationTab, label: 'Recurring Retainers', icon: Repeat, badge: 'Net-0' },
    { id: 'clients' as NavigationTab, label: 'Clients Directory', icon: Users },
    { id: 'payouts' as NavigationTab, label: 'Payouts & Fees', icon: BadgeDollarSign },
    { id: 'dunning' as NavigationTab, label: 'Dunning & Tax Rules', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-vault-950 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand & Organization Switcher */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-vault-850/80 border border-slate-800 hover:border-slate-700 transition cursor-pointer group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-stripe via-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-semibold text-white truncate tracking-tight">Studio Hyperion</h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Production Live</span>
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition shrink-0" />
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={onNewInvoice}
          className="w-full mt-3 flex items-center justify-between px-3.5 py-2.5 bg-stripe hover:bg-stripe-hover active:scale-[0.99] text-white font-medium text-xs rounded-lg shadow-sm transition group"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>New Invoice / Quote</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/20 rounded text-white tracking-wider">⌘I</kbd>
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          WORKSPACE
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-vault-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-vault-850/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-stripe' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-medium ${
                    isActive
                      ? 'bg-stripe/20 text-stripe-light border border-stripe/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Connected Gateways Status Card */}
      <div className="p-3 border-t border-slate-800/80 bg-vault-950">
        <div className="rounded-xl border border-slate-800/80 bg-vault-850/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">GATEWAY HEALTH</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              99.99%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-1.5 rounded bg-vault-900 border border-slate-800/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stripe"></span>
                <span className="text-slate-300 font-medium text-[11px]">Stripe Elements</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Live
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-vault-900 border border-slate-800/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-paypal-cobalt"></span>
                <span className="text-slate-300 font-medium text-[11px]">PayPal Commerce</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Webhooks: Verified</span>
            <span className="text-slate-400 font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
