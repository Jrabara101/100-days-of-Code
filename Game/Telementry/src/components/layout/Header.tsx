import React from 'react';
import { 
  Radio, 
  Table, 
  Sparkles, 
  HelpCircle, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { PeriodFilter, ProfileScenario } from '../../types/telemetry';

interface HeaderProps {
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  scenario: ProfileScenario;
  setScenario: (s: ProfileScenario) => void;
  onOpenTableTwin: () => void;
  onOpenSeasonWrapped: () => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  period,
  setPeriod,
  scenario,
  setScenario,
  onOpenTableTwin,
  onOpenSeasonWrapped,
  activeTabTitle
}) => {
  return (
    <header className="sticky top-0 z-20 bg-[#090d16]/90 border-b border-[#1e293b]/80 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title & Diagnostic Breadcrumb */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-['JetBrains_Mono'] text-[11px] text-cyan-400 tracking-wider font-semibold">
              // TELEMETRY_DECK
            </span>
            <span className="text-slate-600">/</span>
            <span className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wide">
              {activeTabTitle}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-['JetBrains_Mono']">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              US-EAST // 14MS
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-400">
              PROTOCOL RED // S-04
            </span>
            <span className="hidden lg:inline text-slate-600">•</span>
            <span className="hidden lg:inline text-cyan-400/80">
              SELF-COMPARISON ENGINE
            </span>
          </div>
        </div>

        {/* Global Controls: Period Switcher, Scenario Switcher, Table Twin */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Scenario Tester Selector (For reviewers/testers: Veteran, Low Data, Empty) */}
          <div className="flex items-center rounded bg-[#111827] border border-[#1f293d] p-1 text-xs">
            <span className="hidden sm:inline px-2 font-['JetBrains_Mono'] text-[10px] text-slate-400 uppercase">
              State:
            </span>
            {(['veteran', 'low_data', 'empty'] as ProfileScenario[]).map((s) => {
              const labels: Record<ProfileScenario, string> = {
                veteran: 'Veteran (6mo)',
                low_data: 'Low Data (3)',
                empty: 'Day 1 (0)'
              };
              const isCurrent = scenario === s;
              return (
                <button
                  key={s}
                  onClick={() => setScenario(s)}
                  className={`px-2 py-1 rounded text-[11px] font-['JetBrains_Mono'] font-medium transition ${
                    isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a202c]'
                  }`}
                  title={`Switch to ${labels[s]} simulation mode`}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>

          {/* Period Switcher (7d / 30d / Season / All) */}
          <div className="flex items-center rounded bg-[#111827] border border-[#1f293d] p-1 text-xs">
            {(['7d', '30d', 'season', 'all'] as PeriodFilter[]).map((p) => {
              const labels: Record<PeriodFilter, string> = {
                '7d': '7D',
                '30d': '30D',
                'season': 'SEASON',
                'all': 'ALL TIME'
              };
              const isCurrent = period === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded text-[11px] font-['JetBrains_Mono'] font-bold transition ${
                    isCurrent
                      ? 'bg-cyan-500 text-[#090d16] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a202c]'
                  }`}
                  aria-pressed={isCurrent}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {/* Accessible Table Twin Trigger Button (Decision: Every chart has a table twin) */}
          <button
            onClick={onOpenTableTwin}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#111827] border border-[#1f293d] hover:border-cyan-400/50 text-slate-300 hover:text-cyan-300 text-xs font-['JetBrains_Mono'] transition"
            title="Open accessible data table for current charts (Screen Reader Friendly)"
            aria-label="Toggle accessible table twin view"
          >
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Table Twin</span>
          </button>
        </div>
      </div>
    </header>
  );
};
