import React from 'react';
import { 
  CoreStatMetric, 
  DailySummary, 
  Session, 
  PersonalRecord, 
  Milestone,
  ProfileScenario 
} from '../../types/telemetry';
import { FlightRecorderTape } from '../common/FlightRecorderTape';
import { HeroInsightBanner } from '../common/HeroInsightBanner';
import { StatCard } from '../common/StatCard';
import { 
  Trophy, 
  ChevronRight, 
  Flame, 
  Target, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Play
} from 'lucide-react';

interface OverviewViewProps {
  scenario: ProfileScenario;
  flightRecorderDays: DailySummary[];
  coreStats: CoreStatMetric[];
  recentSessions: Session[];
  records: PersonalRecord[];
  milestones: Milestone[];
  streakDays: number;
  wasStreakForgiven: boolean;
  weeklyPlaytimeHours: number;
  showPlaytimeAwareness: boolean;
  setShowPlaytimeAwareness: (show: boolean) => void;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onSelectSession: (id: string) => void;
  onExplainStat: (id: CoreStatMetric['id']) => void;
  onOpenWhy: () => void;
  onOpenTableTwin: () => void;
  onNavigateTab: (tab: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  scenario,
  flightRecorderDays,
  coreStats,
  recentSessions,
  records,
  milestones,
  streakDays,
  wasStreakForgiven,
  weeklyPlaytimeHours,
  showPlaytimeAwareness,
  setShowPlaytimeAwareness,
  selectedDate,
  onSelectDate,
  onSelectSession,
  onExplainStat,
  onOpenWhy,
  onOpenTableTwin,
  onNavigateTab
}) => {
  // Empty State (Day 1 Player: 0 sessions)
  if (scenario === 'empty' || recentSessions.length === 0) {
    return (
      <div className="py-12 px-4 max-w-3xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
          <Target className="w-8 h-8" />
        </div>
        <div>
          <span className="font-['JetBrains_Mono'] text-xs text-cyan-400 tracking-widest uppercase">
            // OPERATIVE ONBOARDING
          </span>
          <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-slate-100 mt-1">
            Welcome to ChronoStrike Telemetry
          </h2>
          <p className="font-['Inter'] text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            Your flight recorder is initialized. As soon as you complete your first combat match, 
            your recoil mechanics, accuracy trends, and past-self milestones will track here automatically.
          </p>
        </div>

        <div className="p-5 rounded-lg bg-[#0d1322] border border-[#1f293d] max-w-lg mx-auto text-left space-y-3 font-['Inter'] text-xs">
          <div className="font-['JetBrains_Mono'] text-cyan-300 font-semibold uppercase text-[11px]">
            What to expect after your first 5 matches:
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>30-Day Flight Recorder Tape visualizing your playtime & win rhythm</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AI Combat Cognition debriefing your prime reflex hours</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Truthful progress deltas framed strictly against your own past self</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onNavigateTab('activity')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-cyan-500 hover:bg-cyan-400 text-[#090d16] font-['Space_Grotesk'] font-bold text-sm transition shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Deploy First Simulation Match</span>
          </button>
        </div>
      </div>
    );
  }

  // Low Data Banner (< 5 sessions)
  const isLowData = scenario === 'low_data' || recentSessions.length < 5;

  // Find Near Miss Record for "Within Reach" Card
  const nearMissRecord = records.find(r => r.nearMiss) || records[0];

  return (
    <div className="space-y-6">
      {/* Low Data Warning Banner (Decision: No fake deltas based on 2 points) */}
      {isLowData && (
        <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-start gap-3 text-xs font-['Inter'] text-amber-200">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-['Space_Grotesk'] text-amber-300 block text-sm">
              Calibration Mode // 3 of 5 baseline sessions logged
            </strong>
            <span className="text-amber-200/90 leading-relaxed">
              Raw metrics are displayed below. Trend lines and historical deltas remain locked until you record at least <strong>5 combat sessions</strong>, ensuring every insight is statistically reliable rather than noise dressed as insight.
            </span>
          </div>
        </div>
      )}

      {/* Hero Insight Banner (Decision 2) */}
      <HeroInsightBanner
        sentence={
          isLowData
            ? "Strong early debut — your first-match weapon accuracy sits at 39.5% on Pulse Carbine."
            : "Your accuracy is up 8.4% this week — mostly from evening sessions."
        }
        onOpenWhy={onOpenWhy}
        weeklyPlaytimeHours={weeklyPlaytimeHours}
        showPlaytimeAwareness={showPlaytimeAwareness}
        setShowPlaytimeAwareness={setShowPlaytimeAwareness}
        streakDays={streakDays}
        wasStreakForgiven={wasStreakForgiven}
      />

      {/* Signature 30-Day Flight-Recorder Strip */}
      <FlightRecorderTape
        days={flightRecorderDays}
        onSelectDate={onSelectDate}
        selectedDate={selectedDate}
        onOpenTableTwin={onOpenTableTwin}
      />

      {/* 4 Core Stats Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-['JetBrains_Mono'] text-xs font-bold text-slate-400 uppercase tracking-wider">
            // CORE COMBAT TELEMETRY
          </span>
          <span className="text-[11px] font-['JetBrains_Mono'] text-slate-500">
            Tap any stat to view formula & proof
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreStats.map((stat) => (
            <StatCard
              key={stat.id}
              stat={stat}
              onClick={() => onExplainStat(stat.id)}
              hasEnoughData={!isLowData}
            />
          ))}
        </div>
      </div>

      {/* Middle Section: "Within Reach" Milestone Card + Quick Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 col): "Within Reach" Personal Record Card */}
        <div className="rounded-lg bg-[#0d1322] border border-amber-500/30 p-5 shadow-[0_0_25px_rgba(245,158,11,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono'] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                WITHIN REACH // MILESTONES
              </span>
              <span className="text-[10px] font-['JetBrains_Mono'] text-slate-500">
                Near Miss Detection
              </span>
            </div>

            <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-100">
              Personal Best Match Damage ({nearMissRecord.formattedRecord})
            </h3>
            
            <p className="font-['Inter'] text-xs text-slate-300 mt-2 leading-relaxed">
              On your recent session on <strong>{nearMissRecord.nearMiss?.date || 'Sept 28'}</strong>, you racked up <strong className="text-amber-300">{nearMissRecord.nearMiss?.recentValue || 3050} DMG</strong>.
              You were only <strong className="text-amber-400">{nearMissRecord.nearMiss?.difference || 70} DMG away</strong> from beating your all-time record!
            </p>

            {/* High-tech Segmented Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[11px] font-['JetBrains_Mono']">
                <span className="text-slate-400">Current Run: {nearMissRecord.nearMiss?.recentValue || 3050} DMG</span>
                <span className="text-amber-400 font-bold">Goal: {nearMissRecord.currentRecord} DMG</span>
              </div>
              <div className="h-2 rounded-full bg-[#111827] border border-[#1f293d] overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]" 
                  style={{ width: '97.7%' }} 
                />
              </div>
              <div className="text-right text-[10px] font-['JetBrains_Mono'] text-amber-400/90 font-semibold">
                97.7% of all-time ceiling
              </div>
            </div>

            {/* Secondary Milestone preview */}
            <div className="mt-4 pt-3 border-t border-[#1f293d] text-xs font-['Inter']">
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span>Precision Specialist V</span>
                <span className="font-['JetBrains_Mono'] text-cyan-300">48 / 50</span>
              </div>
              <p className="text-[11px] text-slate-500">
                2 more Longshot Headshots to unlock DEATH_CROSS badge.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#1f293d]">
            <button
              onClick={() => onNavigateTab('records')}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-[#111827] hover:bg-[#1a2233] border border-amber-500/30 text-amber-300 hover:text-white text-xs font-['Space_Grotesk'] font-bold transition"
            >
              <span>Explore All Records & Milestones</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (2 cols): Recent Combat Sessions */}
        <div className="lg:col-span-2 rounded-lg bg-[#0d1322] border border-[#1f293d] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-['JetBrains_Mono'] text-xs font-bold text-slate-300 uppercase tracking-wider">
                  // RECENT MATCH TELEMETRY
                </span>
                {selectedDate && (
                  <span className="text-[11px] font-['JetBrains_Mono'] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    Date: {selectedDate}
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigateTab('activity')}
                className="text-xs font-['JetBrains_Mono'] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View Full Log ({recentSessions.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sessions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-['JetBrains_Mono']">
                <thead className="text-[11px] text-slate-500 border-b border-[#1f293d] uppercase">
                  <tr>
                    <th className="pb-2">Mode & Map</th>
                    <th className="pb-2">Result</th>
                    <th className="pb-2">K/D</th>
                    <th className="pb-2">Accuracy</th>
                    <th className="pb-2">Damage</th>
                    <th className="pb-2">Weapon</th>
                    <th className="pb-2">Notable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172033]">
                  {recentSessions.slice(0, 5).map((session) => {
                    const isWin = session.result === 'VICTORY';
                    const hasPr = session.notableBadges.includes('PR SET');

                    return (
                      <tr 
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className="hover:bg-[#141c30] transition cursor-pointer group"
                      >
                        <td className="py-2.5">
                          <span className="font-['Space_Grotesk'] font-medium text-slate-200 block group-hover:text-cyan-300 transition">
                            {session.map}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {session.mode} • {session.durationMinutes}m
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isWin
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {session.result}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold tabular-nums text-slate-200">
                          {session.kdRatio.toFixed(2)}
                          <span className="text-[10px] text-slate-500 block font-normal">
                            {session.kills}/{session.deaths}
                          </span>
                        </td>
                        <td className="py-2.5 text-cyan-300 tabular-nums">
                          {session.accuracyPercent}%
                        </td>
                        <td className="py-2.5 text-slate-200 tabular-nums">
                          {session.damageDealt.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-slate-400">
                          {session.primaryWeapon}
                        </td>
                        <td className="py-2.5">
                          {hasPr ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                              PR SET ★
                            </span>
                          ) : session.notableBadges.length > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300">
                              {session.notableBadges[0]}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1f293d] flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-slate-500">
            <span>Click any match row to inspect complete round events and weapon timeline</span>
            <span className="text-cyan-400">Active Period: 30 Days</span>
          </div>
        </div>
      </div>
    </div>
  );
};
