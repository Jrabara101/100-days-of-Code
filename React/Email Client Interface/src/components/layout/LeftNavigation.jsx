import React, { useState } from 'react';
import { 
  Inbox, 
  Star, 
  Clock, 
  Hourglass, 
  Send, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  ShieldAlert, 
  Plus, 
  Sliders, 
  ChevronDown, 
  Sun, 
  Moon, 
  HelpCircle,
  Mail
} from 'lucide-react';
import { useMailStore } from '../../store/useMailStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';

export function LeftNavigation() {
  const {
    activeHorizon,
    setActiveHorizon,
    openComposer,
    setScreenerOpen,
    setRuleStudioOpen,
    setShortcutsOpen,
    theme,
    toggleTheme,
    toggleDensityMode,
    densityMode,
  } = useMailStore();

  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const screenerItems = useLiveQuery(() => db.screener.where({ status: 'pending' }).toArray()) || [];
  const labels = useLiveQuery(() => db.labels.orderBy('sort_order').toArray()) || [];

  // Compute live unread counters
  const threads = useLiveQuery(() => db.threads.toArray()) || [];
  
  const inboxUnread = threads.filter(t => !t.is_archived && !t.is_trash && t.is_unread).length;
  const starredCount = threads.filter(t => t.is_starred && !t.is_trash).length;
  const snoozedCount = threads.filter(t => t.snoozed_until && !t.is_trash).length;
  const waitingCount = threads.filter(t => t.split_category === 'waiting_reply' && !t.is_archived && !t.is_trash).length;
  const draftsCount = 1;

  const getLabelUnread = (slug) => {
    return threads.filter(t => !t.is_archived && !t.is_trash && t.is_unread && t.labels?.includes(slug)).length;
  };

  return (
    <aside className="w-[240px] flex-shrink-0 h-full border-r border-[#E2E8F0] dark:border-[#222632] bg-[#F8FAFC] dark:bg-[#101217] flex flex-col justify-between select-none">
      {/* Top Header & Account Switcher */}
      <div className="p-3">
        {/* Account Switcher Pill */}
        <div className="relative mb-3">
          <button 
            onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#222632] bg-white dark:bg-[#161922] text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="truncate">{accounts[0]?.email_address || 'alex@acme.dev'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {accountDropdownOpen && (
            <div className="absolute top-10 left-0 right-0 z-30 bg-white dark:bg-[#1A1D27] border border-[#E2E8F0] dark:border-[#222632] rounded-xl shadow-xl py-1 text-xs animate-slide-down">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Connected Inboxes
              </div>
              {accounts.map((acc, i) => (
                <button
                  key={acc.id}
                  onClick={() => setAccountDropdownOpen(false)}
                  className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/60 ${i === 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  <span className="truncate">{acc.email_address}</span>
                  {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">Active</span>}
                </button>
              ))}
              <div className="border-t border-[#E2E8F0] dark:border-[#222632] mt-1 pt-1">
                <button 
                  onClick={() => setAccountDropdownOpen(false)}
                  className="w-full text-left px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect Mailbox (JMAP/IMAP)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Compose Button */}
        <button
          onClick={() => openComposer()}
          className="w-full h-9 flex items-center justify-between px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm shadow-blue-500/20 active:scale-[0.99] transition duration-150"
        >
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" />
            <span>Compose</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-700/60 rounded text-blue-100 border border-blue-400/30">C</kbd>
        </button>

        {/* First-Time Sender Screener Callout Card */}
        {screenerItems.length > 0 && (
          <div 
            onClick={() => setScreenerOpen(true)}
            className="mt-3 cursor-pointer rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 flex items-center justify-between hover:bg-amber-500/15 transition group"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Screener: {screenerItems.length} new senders</span>
            </div>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-300 group-hover:translate-x-0.5 transition-transform">
              Review &rarr;
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Navigation Views & Labels */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
        {/* Core System Views */}
        <div className="space-y-0.5 text-xs font-medium">
          <NavItem
            icon={<Inbox className="w-4 h-4" />}
            label="Inbox"
            count={inboxUnread}
            active={['focused', 'vip', 'feed', 'paper_trail', 'all'].includes(activeHorizon)}
            onClick={() => setActiveHorizon('focused')}
            countBadgeClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
          />
          <NavItem
            icon={<Star className="w-4 h-4" />}
            label="Starred & VIP"
            count={starredCount}
            active={activeHorizon === 'starred'}
            onClick={() => setActiveHorizon('starred')}
          />
          <NavItem
            icon={<Clock className="w-4 h-4" />}
            label="Snoozed"
            count={snoozedCount}
            active={activeHorizon === 'snoozed'}
            onClick={() => setActiveHorizon('snoozed')}
          />
          <NavItem
            icon={<Hourglass className="w-4 h-4" />}
            label="Waiting on Reply"
            count={waitingCount}
            active={activeHorizon === 'waiting_reply'}
            onClick={() => setActiveHorizon('waiting_reply')}
            hasAlertDot={waitingCount > 0}
            countBadgeClass="bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold"
          />
          <NavItem
            icon={<Send className="w-4 h-4" />}
            label="Sent"
            active={activeHorizon === 'sent'}
            onClick={() => setActiveHorizon('sent')}
          />
          <NavItem
            icon={<FileText className="w-4 h-4" />}
            label="Drafts"
            count={draftsCount}
            active={activeHorizon === 'drafts'}
            onClick={() => setActiveHorizon('drafts')}
            countBadgeClass="bg-rose-500/15 text-rose-600 dark:text-rose-400"
          />
          <NavItem
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Done / Archive"
            active={activeHorizon === 'archive'}
            onClick={() => setActiveHorizon('archive')}
          />
          <NavItem
            icon={<Trash2 className="w-4 h-4" />}
            label="Trash"
            active={activeHorizon === 'trash'}
            onClick={() => setActiveHorizon('trash')}
          />
        </div>

        {/* Labels & Smart Bundles Tree */}
        <div className="pt-2">
          <div className="px-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
            <span>LABELS & BUNDLES</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setRuleStudioOpen(true)}
                title="Triage Rules Studio"
                className="p-1 hover:text-slate-800 dark:hover:text-slate-200 rounded transition"
              >
                <Sliders className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="space-y-0.5 text-xs font-medium">
            {labels.map((lbl) => {
              const unread = getLabelUnread(lbl.slug);
              const isActive = activeHorizon === `label:${lbl.slug}`;
              return (
                <button
                  key={lbl.id}
                  onClick={() => setActiveHorizon(`label:${lbl.slug}`)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition group ${
                    isActive
                      ? 'bg-slate-200/80 dark:bg-[#161922] text-slate-900 dark:text-slate-100 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: lbl.color_hex }}
                    />
                    <span className="truncate">{lbl.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {lbl.bundle_in_inbox && (
                      <span title="Bundled in Inbox" className="text-[10px] text-emerald-500 dark:text-emerald-400">
                        📦
                      </span>
                    )}
                    {unread > 0 && (
                      <span className="text-[11px] tabular-nums font-mono text-slate-500 dark:text-slate-400">
                        {unread}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Status & Quick Controls */}
      <div className="p-3 border-t border-[#E2E8F0] dark:border-[#222632] space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>&lt;16ms Sync</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleDensityMode()}
              title={`Switch density (Current: ${densityMode})`}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition text-[10px] font-mono"
            >
              {densityMode === 'compact' ? '44px' : '64px'}
            </button>
            <button
              onClick={() => toggleTheme()}
              title="Toggle Light / Dark Mode"
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard Shortcuts HUD (?)"
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, count, active, onClick, hasAlertDot, countBadgeClass }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition group ${
        active 
          ? 'bg-slate-200/80 dark:bg-[#161922] text-slate-900 dark:text-slate-100 font-semibold' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        <span className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {hasAlertDot && (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
        )}
        {count !== undefined && count > 0 && (
          <span className={`text-[11px] tabular-nums font-mono px-1.5 py-0.2 rounded ${countBadgeClass || 'text-slate-500 dark:text-slate-400'}`}>
            {count}
          </span>
        )}
      </div>
    </button>
  );
}

