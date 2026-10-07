import React from 'react';
import { 
  Activity, 
  BarChart3, 
  Trophy, 
  Target, 
  Lightbulb, 
  Calendar, 
  Settings, 
  Sparkles,
  Users,
  Compass
} from 'lucide-react';
import { PlayerProfile, ProfileScenario } from '../../types/telemetry';

export type NavTab = 
  | 'overview' 
  | 'activity' 
  | 'records' 
  | 'goals' 
  | 'insights' 
  | 'recap' 
  | 'friends' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  player: PlayerProfile;
  scenario: ProfileScenario;
  onOpenSeasonWrapped: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  player,
  onOpenSeasonWrapped
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: Activity, badge: null },
    { id: 'activity' as NavTab, label: 'Activity Log', icon: BarChart3, badge: null },
    { id: 'records' as NavTab, label: 'Records & PRs', icon: Trophy, badge: 'PR' },
    { id: 'goals' as NavTab, label: 'Goals & Streaks', icon: Target, badge: null },
    { id: 'insights' as NavTab, label: 'Combat Insights', icon: Lightbulb, badge: 'AI' },
    { id: 'recap' as NavTab, label: 'Weekly Recap', icon: Calendar, badge: 'NEW' },
    { id: 'friends' as NavTab, label: 'Duo Compare', icon: Users, badge: null },
    { id: 'settings' as NavTab, label: 'Settings & Export', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Desktop Left Rail Navigation (>= 768px) */}
      <aside 
        className="hidden md:flex flex-col w-64 bg-[#0d1322]/95 border-r border-[#1e293b] backdrop-blur-md h-screen fixed left-0 top-0 z-30 select-none"
        aria-label="Primary Navigation"
      >
        {/* Brand & System Status */}
        <div className="p-5 border-b border-[#1e293b]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Space_Grotesk'] font-bold text-sm tracking-wider text-slate-100 uppercase">
                  ChronoStrike
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] animate-ping" />
              </div>
              <div className="font-['JetBrains_Mono'] text-[10px] text-cyan-400 tracking-wider">
                VORTEX // TELEMETRY
              </div>
            </div>
          </div>
        </div>

        {/* Season Wrapped Banner Trigger */}
        <div className="px-3 pt-3">
          <button
            onClick={onOpenSeasonWrapped}
            className="w-full group relative overflow-hidden rounded bg-gradient-to-r from-purple-950/60 to-cyan-950/60 border border-purple-500/30 p-2.5 text-left transition hover:border-purple-400/60 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
          >
            <div className="flex items-center gap-2 text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span className="font-['Space_Grotesk'] text-xs font-semibold tracking-wide">
                Season 04 Wrapped
              </span>
            </div>
            <p className="font-['Inter'] text-[11px] text-slate-400 mt-0.5">
              Your personal combat story
            </p>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 pb-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-slate-500">
            // TELEMETRY MODULES
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 shadow-[inset_0_1px_0_rgba(0,240,255,0.2),0_0_12px_rgba(0,240,255,0.1)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#141c30] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon 
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                    }`} 
                  />
                  <span className="font-['Inter']">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-['JetBrains_Mono'] font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Player Profile Footer HUD */}
        <div className="p-3 border-t border-[#1e293b] bg-[#090d16]/80">
          <div className="flex items-center gap-3 p-2 rounded bg-[#111827] border border-[#1f293d]">
            <div className="relative">
              <div className="w-9 h-9 rounded bg-gradient-to-br from-cyan-600 to-indigo-700 flex items-center justify-center font-['JetBrains_Mono'] font-bold text-white text-xs border border-cyan-400/40">
                {player.avatarSeed.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#090d16]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-['Space_Grotesk'] text-xs font-semibold text-slate-200 truncate">
                  {player.displayName}
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-cyan-400">
                  {player.tag}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-['JetBrains_Mono']">
                <span className="truncate">{player.rankTier}</span>
                <span className="text-emerald-400 font-bold">{player.elo}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d1322]/95 border-t border-[#1e293b] backdrop-blur-lg z-40 px-2 py-2 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {[
          { id: 'overview' as NavTab, label: 'Overview', icon: Activity },
          { id: 'activity' as NavTab, label: 'Activity', icon: BarChart3 },
          { id: 'records' as NavTab, label: 'Records', icon: Trophy },
          { id: 'goals' as NavTab, label: 'Goals', icon: Target },
          { id: 'insights' as NavTab, label: 'Insights', icon: Lightbulb },
          { id: 'settings' as NavTab, label: 'More', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded transition ${
                isActive ? 'text-cyan-400 font-medium' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-['Inter']">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
