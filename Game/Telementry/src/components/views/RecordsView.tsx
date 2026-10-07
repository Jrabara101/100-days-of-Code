import React from 'react';
import { PersonalRecord, Milestone } from '../../types/telemetry';
import { 
  Trophy, 
  Flame, 
  Award, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  Target,
  ArrowUpRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecordsViewProps {
  records: PersonalRecord[];
  milestones: Milestone[];
  onSelectSession: (id: string) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  records,
  milestones,
  onSelectSession
}) => {
  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00F0FF', '#10B981', '#F59E0B']
    });
  };

  const nearMissRecord = records.find(r => r.nearMiss);

  return (
    <div className="space-y-6">
      {/* Near Miss Alert Card */}
      {nearMissRecord && nearMissRecord.nearMiss && (
        <section className="rounded-lg bg-gradient-to-r from-amber-950/40 via-[#0d1322] to-amber-950/40 border border-amber-500/50 p-5 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                <Flame className="w-4 h-4" />
              </span>
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-amber-400 uppercase tracking-wider">
                NEAR-MISS DETECTED // RECORD WITHIN REACH
              </span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-lg font-bold text-slate-100">
              You were only {nearMissRecord.nearMiss.difference} {nearMissRecord.unit} off your all-time best!
            </h2>
            <p className="font-['Inter'] text-xs text-slate-300 max-w-xl">
              On {nearMissRecord.nearMiss.date}, you dealt <strong>{nearMissRecord.nearMiss.recentValue} DMG</strong> in Ranked 5v5. Your personal best sits at <strong>{nearMissRecord.formattedRecord}</strong>.
            </p>
          </div>

          <button
            onClick={() => onSelectSession(nearMissRecord.nearMiss!.sessionId)}
            className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-[#090d16] font-['Space_Grotesk'] text-xs font-bold transition shadow-[0_0_15px_rgba(245,158,11,0.4)] whitespace-nowrap"
          >
            Inspect Match Timeline
          </button>
        </section>
      )}

      {/* Personal Records Timeline Grid */}
      <section className="rounded-lg bg-[#0d1322] border border-[#1f293d] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
                Personal Records Timeline (PRs)
              </h2>
            </div>
            <p className="font-['Inter'] text-xs text-slate-400 mt-0.5">
              Historical high-water marks framed against your previous ceilings
            </p>
          </div>

          <button
            onClick={triggerConfetti}
            className="px-2.5 py-1 rounded bg-[#111827] border border-[#1f293d] hover:border-cyan-400/50 text-cyan-300 text-xs font-['JetBrains_Mono'] transition"
          >
            ★ Celebrate PRs
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-lg bg-[#090d16] border border-[#1f293d] hover:border-cyan-400/40 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-['Space_Grotesk'] font-semibold text-slate-300">
                    {record.title}
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                    PR ACTIVE
                  </span>
                </div>

                <div className="font-['JetBrains_Mono'] text-2xl font-black text-slate-100 tabular-nums">
                  {record.formattedRecord}
                </div>

                <div className="mt-2 text-xs font-['JetBrains_Mono'] text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Previous ceiling:</span>
                    <span className="text-slate-300">{record.previousRecord} {record.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Beaten by:</span>
                    <span className="flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                      +{record.beatenBy} {record.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1a2233] flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-slate-500">
                <span>{record.achievedDate} • {record.map}</span>
                <button
                  onClick={() => onSelectSession(record.achievedSessionId)}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  View Match
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Milestones with Visible Progress Bars */}
      <section className="rounded-lg bg-[#0d1322] border border-[#1f293d] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-cyan-400" />
          <h2 className="font-['Space_Grotesk'] text-sm font-bold text-slate-100 uppercase tracking-wider">
            Operational Career Milestones
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`p-4 rounded-lg border transition ${
                milestone.isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-[#090d16] border-[#1f293d]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-['Space_Grotesk'] text-sm font-bold text-slate-200">
                      {milestone.title}
                    </span>
                    {milestone.isCompleted && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <p className="font-['Inter'] text-xs text-slate-400 mt-0.5">
                    {milestone.description}
                  </p>
                </div>

                <span className="font-['JetBrains_Mono'] text-xs font-bold px-2 py-0.5 rounded bg-[#111827] text-cyan-300 border border-[#1f293d]">
                  {milestone.badge}
                </span>
              </div>

              {/* Progress Meter */}
              <div className="mt-3 space-y-1.5 font-['JetBrains_Mono'] text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">
                    Progress: <strong className="text-slate-200">{milestone.currentProgress}</strong> / {milestone.targetValue} {milestone.unit}
                  </span>
                  <span className="text-cyan-400 font-bold">{milestone.percentComplete}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#111827] border border-[#1f293d] overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      milestone.isCompleted
                        ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                        : 'bg-cyan-400 shadow-[0_0_8px_#00F0FF]'
                    }`}
                    style={{ width: `${Math.min(100, milestone.percentComplete)}%` }}
                  />
                </div>
                {milestone.isCompleted && milestone.completedDate && (
                  <div className="text-right text-[10px] text-emerald-400">
                    Achieved on {milestone.completedDate}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
