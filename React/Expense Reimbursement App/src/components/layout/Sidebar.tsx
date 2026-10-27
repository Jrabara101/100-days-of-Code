import React from 'react';
import {
  Wallet,
  Receipt,
  CheckSquare,
  ShieldCheck,
  FileSpreadsheet,
  Plus,
  ChevronDown,
  Building,
  CheckCircle2,
  Moon,
  Sun,
  Users,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenNewExpense: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewExpense,
}) => {
  const { currentRole, setCurrentRole, theme, setTheme, items } = useExpense();

  const pendingApprovalsCount = items.filter((i) => i.status === 'pending').length;

  const navItems = [
    { id: 'reimbursements', label: 'My Reimbursements', icon: Receipt },
    { id: 'stipends', label: 'Stipend Wallets', icon: Wallet },
    {
      id: 'approvals',
      label: 'Approval Queue',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'policies', label: 'Spend Policies', icon: ShieldCheck },
    { id: 'accounting', label: 'Accounting & ERP Sync', icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 bg-[#121418] border-r border-[#232730] flex flex-col justify-between h-screen p-4 text-[#8F98A8] select-none sticky top-0 shrink-0">
      <div className="space-y-5">
        {/* Workspace Brand & Org Switcher */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#171A20] border border-[#232730]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              AS
            </div>
            <div>
              <h1 className="font-bold text-xs text-white tracking-tight flex items-center gap-1">
                AeroSpend
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </h1>
              <p className="text-[10px] text-gray-400 font-mono">Apex Labs Inc.</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>

        {/* Quick CTA Button with ⌘U Badge */}
        <button
          type="button"
          onClick={onOpenNewExpense}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition duration-150 shadow-lg shadow-emerald-900/30 flex items-center justify-between group"
        >
          <span className="flex items-center gap-1.5">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Expense</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-700/80 text-emerald-100 group-hover:bg-emerald-600">
            ⌘U
          </span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#171A20] text-white border border-[#232730] shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-[#171A20]/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Role Switcher Pill */}
        <div className="p-3 rounded-xl bg-[#171A20] border border-[#232730] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-400">
            <span>Simulation Persona:</span>
            <Users className="w-3.5 h-3.5 text-gray-400" />
          </div>

          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setCurrentRole('employee')}
              className={`py-1 text-[10px] rounded font-medium transition ${
                currentRole === 'employee'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-gray-400 hover:text-white bg-[#121418]'
              }`}
              title="Employee Persona"
            >
              Employee
            </button>
            <button
              onClick={() => {
                setCurrentRole('manager');
                setCurrentTab('approvals');
              }}
              className={`py-1 text-[10px] rounded font-medium transition ${
                currentRole === 'manager'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-gray-400 hover:text-white bg-[#121418]'
              }`}
              title="Manager Persona"
            >
              Manager
            </button>
            <button
              onClick={() => {
                setCurrentRole('finance');
                setCurrentTab('policies');
              }}
              className={`py-1 text-[10px] rounded font-medium transition ${
                currentRole === 'finance'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-gray-400 hover:text-white bg-[#121418]'
              }`}
              title="Finance Controller Persona"
            >
              Finance
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bank Account Card & Theme Toggle */}
      <div className="space-y-3">
        {/* Direct Deposit Status Card */}
        <div className="p-3 rounded-xl bg-[#171A20] border border-[#232730] text-xs">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-white font-medium">
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chase Premier</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[11px] text-gray-400 font-mono">Checking •••• 4829</p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Direct Deposit Verified</span>
          </div>
        </div>

        {/* Theme Toggle & User Info */}
        <div className="flex items-center justify-between pt-2 border-t border-[#232730] text-xs">
          <div className="flex items-center gap-2">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Elena Rostova"
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-white text-[11px] font-medium truncate w-24">Elena Rostova</span>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg hover:bg-[#171A20] text-gray-400 hover:text-white transition"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
