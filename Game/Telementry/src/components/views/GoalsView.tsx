import React, { useState } from 'react';
import { PlayerGoal, StreakData } from '../../types/telemetry';
import { 
  Target, 
  Flame, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Sparkles,
  ShieldCheck,
  Snowflake,
  HeartHandshake
} from 'lucide-react';

interface GoalsViewProps {
  goals: PlayerGoal[];
  onAddGoal: (g: Omit<PlayerGoal, 'id' | 'currentValue' | 'status' | 'createdBy'>) => void;
  onDeleteGoal: (id: string) => void;
  onToggleGoalStatus: (id: string) => void;
  streak: StreakData;
  onUseStreakFreeze: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onAddGoal,
  onDeleteGoal,
  onToggleGoalStatus,
  streak,
  onUseStreakFreeze
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMetric, setNewMetric] = useState<PlayerGoal['metric']>('accuracy');
  const [newTarget, setNewTarget] = useState<number>(45);
  const [newUnit, setNewUnit] = useState('%');
  const [newDeadline, setNewDeadline] = useState('2026-10-31');

  const handleMetricChange = (m: PlayerGoal['metric']) => {
    setNewMetric(m);
    if (m === 'accuracy') {
      setNewTarget(45);
      setNewUnit('%');
    } else if (m === 'kd') {
      setNewTarget(2.0);
      setNewUnit('ratio');
    } else if (m === 'weekly_hours') {
      setNewTarget(6);
      setNewUnit('hrs');
    } else if (m === 'win_rate') {
      setNewTarget(65);
      setNewUnit('%');
    } else if (m === 'damage') {
      setNewTarget(2600);
      setNewUnit('DMG');
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddGoal({
      title: newTitle.trim(),
      metric: newMetric,
      targetValue: Number(newTarget),
      unit: newUnit,
      deadline: newDeadline
    });
    setNewTitle('');
    setModalOpen(false);
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Forgiving Streak Widget (Decision 4: Streaks forgive) */}
      <section className="rounded-lg bg-gradient-to-r from-[#0d1322] via-[#101b2f] to-[#0d1322] border border-cyan-500/30 p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                <Flame className="w-5 h-5 text-cyan-400" />
              </span>
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-cyan-300 uppercase tracking-widest">
                HABIT_LOOP // FORGIVING STREAK ENGINE
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-['JetBrains_Mono'] text-3xl sm:text-4xl font-black text-slate-100 tabular-nums">
                {streak.currentStreakDays} Days Active
              </span>
              <span className="text-xs text-slate-400 font-['Inter']">
                (Longest record: <strong>{streak.longestStreakDays} days</strong>)
              </span>
            </div>

            {/* Non-judgmental, forgiving copy per Decision 4 */}
            <p className="font-['Inter'] text-xs text-slate-300 max-w-xl leading-relaxed">
              {streak.wasForgiven ? (
                <span className="text-amber-300 font-semibold">
                  ★ Welcome back — your best streak was {streak.longestStreakDays} days. A streak freeze preserved your streak on your last rest day!
                </span>
              ) : (
                <span>
                  Streaks in ChronoStrike include automatic forgiveness. You get <strong>1 free freeze per week</strong> so missing a busy Tuesday never resets your hard-earned habit.
                </span>
              )}
            </p>
          </div>

          {/* Freeze Inventory & Shield Action */}
          <div className="p-4 rounded bg-[#090d16] border border-[#1f293d] flex flex-col items-center justify-center min-w-[200px] text-center space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-['JetBrains_Mono'] text-slate-400">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <span>Streak Freezes Remaining</span>
            </div>
            <div className="font-['JetBrains_Mono'] text-2xl font-bold text-cyan-300">
              {streak.freezesRemaining} / {streak.maxFreezes}
            </div>
            <button
              onClick={onUseStreakFreeze}
              disabled={streak.freezesRemaining === 0}
              className={`w-full py-1.5 px-3 rounded text-xs font-['Space_Grotesk'] font-bold transition ${
                streak.freezesRemaining > 0
                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {streak.freezesRemaining > 0 ? 'Apply Streak Freeze' : 'No Freezes Left'}
            </button>
          </div>
        </div>
      </section>

      {/* Goals Header & Create Goal Trigger */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-['Space_Grotesk'] text-base font-bold text-slate-100 uppercase tracking-wider">
            Player Self-Determined Goals
          </h2>
          <p className="font-['Inter'] text-xs text-slate-400 mt-0.5">
            Self-chosen benchmarks beat assigned quotas for long-term motivation
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-[#090d16] font-['Space_Grotesk'] text-xs font-bold transition shadow-[0_0_15px_rgba(0,240,255,0.3)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Personal Goal</span>
        </button>
      </section>

      {/* Active Goals Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeGoals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

          return (
            <div
              key={goal.id}
              className="p-5 rounded-lg bg-[#0d1322] border border-[#1f293d] hover:border-cyan-400/40 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-['Space_Grotesk'] text-sm font-bold text-slate-100">
                    {goal.title}
                  </span>
                  {goal.createdBy === 'suggested' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      DATA SUGGESTION
                    </span>
                  )}
                </div>

                {goal.suggestedReason && (
                  <p className="font-['Inter'] text-[11px] text-slate-400 italic mb-2">
                    "{goal.suggestedReason}"
                  </p>
                )}

                {/* Progress Readout */}
                <div className="space-y-1.5 font-['JetBrains_Mono'] text-xs mt-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Current: <strong>{goal.currentValue} {goal.unit}</strong></span>
                    <span className="text-cyan-400 font-bold">Target: {goal.targetValue} {goal.unit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#111827] border border-[#1f293d] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Deadline: {goal.deadline}</span>
                    <span className="font-bold text-slate-300">{percent}% Complete</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#1a2233] flex items-center justify-between text-xs font-['JetBrains_Mono']">
                <button
                  onClick={() => onToggleGoalStatus(goal.id)}
                  className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Done</span>
                </button>
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  className="text-slate-500 hover:text-rose-400 transition"
                  aria-label="Delete goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Completed Goals Accordion */}
      {completedGoals.length > 0 && (
        <section className="rounded-lg bg-[#090d16] border border-[#1f293d] p-4">
          <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-emerald-400 font-semibold mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed Benchmarks ({completedGoals.length})</span>
          </div>

          <div className="space-y-2">
            {completedGoals.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-2.5 rounded bg-[#0d1322] border border-[#1f293d] text-xs font-['Inter']"
              >
                <span className="line-through text-slate-400">{g.title}</span>
                <button
                  onClick={() => onToggleGoalStatus(g.id)}
                  className="text-[11px] font-['JetBrains_Mono'] text-cyan-400 hover:underline"
                >
                  Re-activate
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create Goal Modal */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg bg-[#0d1322] border border-cyan-500/40 p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-slate-100 mb-4">
              Define Personal Goal
            </h3>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs font-['Inter']">
              <div>
                <label className="block text-slate-300 mb-1 font-['JetBrains_Mono'] text-[11px]">
                  GOAL TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reach 45% Accuracy"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 rounded bg-[#090d16] border border-[#1f293d] focus:border-cyan-400 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-['JetBrains_Mono'] text-[11px]">
                  METRIC TRACKED
                </label>
                <select
                  value={newMetric}
                  onChange={(e) => handleMetricChange(e.target.value as PlayerGoal['metric'])}
                  className="w-full p-2 rounded bg-[#090d16] border border-[#1f293d] focus:border-cyan-400 text-slate-100 font-['JetBrains_Mono'] focus:outline-none"
                >
                  <option value="accuracy">Weapon Accuracy (%)</option>
                  <option value="kd">Kill / Death Ratio</option>
                  <option value="weekly_hours">Weekly Playtime (Hours)</option>
                  <option value="win_rate">Match Win Rate (%)</option>
                  <option value="damage">Average Damage per Match</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-['JetBrains_Mono'] text-[11px]">
                    TARGET VALUE ({newUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseFloat(e.target.value))}
                    className="w-full p-2 rounded bg-[#090d16] border border-[#1f293d] focus:border-cyan-400 text-slate-100 font-['JetBrains_Mono'] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-['JetBrains_Mono'] text-[11px]">
                    DEADLINE
                  </label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2 rounded bg-[#090d16] border border-[#1f293d] focus:border-cyan-400 text-slate-100 font-['JetBrains_Mono'] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1f293d] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#1e293b] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#090d16] font-['Space_Grotesk'] font-bold"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
