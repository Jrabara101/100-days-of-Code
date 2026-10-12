import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Activity, Sun, Moon, RotateCcw, FileText, LogOut, UserCheck } from 'lucide-react';

export function Navbar({ currentPath, onNavigate }) {
  const { user, isAuthenticated, logout, resetDemo, setIsAuditDrawerOpen } = useAuth();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] dark:border-white/[0.08] bg-[#090A0C]/80 dark:bg-[#090A0C]/80 light:bg-white/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(isAuthenticated ? '/dashboard' : '/login')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#090A0C] dark:bg-[#090A0C] light:bg-white rounded-[11px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white dark:text-white light:text-slate-900">AuthMesh</span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                v1.0 PKCE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">Social Identity & Account Linking Gateway</p>
          </div>
        </div>

        {/* Telemetry and Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Security Status Pip */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 border border-white/5 dark:border-white/5 light:border-slate-200 text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOC2 Type II Certified</span>
          </div>

          {/* Audit Logs button */}
          <button
            onClick={() => setIsAuditDrawerOpen(true)}
            title="Open cryptographic audit trail"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Audit Stream</span>
          </button>

          {/* Reset Demo button */}
          <button
            onClick={resetDemo}
            title="Reset to default seeded accounts to re-test collision"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:text-amber-300 bg-white/[0.02] hover:bg-amber-500/10 border border-white/[0.06] hover:border-amber-500/30 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition"
            title="Toggle color theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Profile / Logout state */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-white/[0.05] transition"
              >
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                  alt={user.full_name || 'User'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-500/40"
                />
                <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[100px] truncate">
                  {user.full_name || user.email.split('@')[0]}
                </span>
              </button>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/login')}
              className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 transition"
            >
              Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
