import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RoleName } from '../../types/auth';
import { RoleBadge } from './RoleBadge';
import { ShieldCheck, Mail, RotateCcw, AlertOctagon, Sun, Moon } from 'lucide-react';

interface PersonaSwitcherBannerProps {
  onOpenInbox: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const PersonaSwitcherBanner: React.FC<PersonaSwitcherBannerProps> = ({
  onOpenInbox,
  darkMode,
  onToggleDarkMode
}) => {
  const { currentUser, switchPersona, dispatchedEmails, isLockedOut, lockoutRemaining, resetAllDemoData, isSudoActive } = useAuth();
  const [confirmReset, setConfirmReset] = useState(false);

  const personas: { role: RoleName; label: string; desc: string }[] = [
    { role: 'Owner', label: 'Alex Vance', desc: 'Full sovereign custody' },
    { role: 'Admin', label: 'Sarah Chen', desc: 'Gov & team onboarding' },
    { role: 'Manager', label: 'Marcus Brooks', desc: 'Project & invite rights' },
    { role: 'Member', label: 'Elena Rostova', desc: 'Standard collaborator' },
    { role: 'Auditor', label: 'David Kim', desc: 'Read-only compliance' }
  ];

  return (
    <header role="banner" className="bg-slate-900/95 text-slate-200 border-b border-slate-800 text-xs px-4 py-2 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Testing Mode Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white font-display">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-subtle" />
            <span className="text-blue-400">AegisIAM</span>
            <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              RBAC Sandbox
            </span>
          </div>

          {isSudoActive && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Sudo Active (10m)
            </span>
          )}

          {isLockedOut && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
              <AlertOctagon className="w-3 h-3 text-red-400" />
              Lockout Sentinel Active ({lockoutRemaining}s)
            </span>
          )}
        </div>

        {/* Center: Persona Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[11px] text-slate-400 mr-1 hidden md:inline">Test Persona:</span>
          {personas.map(p => {
            const isActive = currentUser?.role === p.role;
            return (
              <button
                key={p.role}
                onClick={() => switchPersona(p.role)}
                title={`${p.label} (${p.role}) - ${p.desc}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300'
                }`}
              >
                <span>{p.label.split(' ')[0]}</span>
                <RoleBadge role={p.role} size="sm" showIcon={false} />
              </button>
            );
          })}
        </div>

        {/* Right: Quick Actions (Mailbox Drawer, Theme, Reset) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInbox}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-all font-medium"
            title="Open simulated mailbox to inspect reset links & invites"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Mock Inbox</span>
            {dispatchedEmails.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {dispatchedEmails.length}
              </span>
            )}
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={darkMode ? 'Switch to Pristine Light Mode' : 'Switch to Vault Dark Mode'}
            aria-label={darkMode ? 'Switch to Pristine Light Mode' : 'Switch to Vault Dark Mode'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-blue-300" />}
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  resetAllDemoData();
                  setConfirmReset(false);
                }}
                className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset sandbox database to initial state"
              aria-label="Reset sandbox database to initial state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
