import React, { useState } from 'react';
import { 
  Play, 
  Zap, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Brain,
  Video
} from 'lucide-react';
import { Course, Enrollment, ModuleRetentionStats, StudyDayLog, UserSkillProficiency } from '../../types';
import { SkillRadarChart } from './SkillRadarChart';
import { StudyHeatmap } from './StudyHeatmap';
import { MemoryVaultCard } from './MemoryVaultCard';
import { ScheduleRebalanceModal } from './ScheduleRebalanceModal';
import { sounds } from '../../services/audioEffects';

interface LearnerCommandDashboardProps {
  course: Course;
  enrollment: Enrollment;
  moduleRetentions: ModuleRetentionStats[];
  skillProficiencies: UserSkillProficiency[];
  studyLogs: StudyDayLog[];
  dueCardsCount: number;
  onResumeLesson: (lessonId: string, timestampSec?: number) => void;
  onLaunchQuiz: (quizId: string) => void;
  onLaunchMemoryVault: () => void;
  onRebalanceSchedule: (preferredDays: number[], weeklyMinutes: number) => void;
}

export const LearnerCommandDashboard: React.FC<LearnerCommandDashboardProps> = ({
  course,
  enrollment,
  moduleRetentions,
  skillProficiencies,
  studyLogs,
  dueCardsCount,
  onResumeLesson,
  onLaunchQuiz,
  onLaunchMemoryVault,
  onRebalanceSchedule
}) => {
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);

  // Compute overall Watched vs Mastered metrics
  const completedLessons = moduleRetentions.reduce((acc, m) => acc + m.lessonsCompleted, 0);
  const totalLessons = 28; // Standard track curriculum count
  const watchedPercent = 68; // 19 / 28
  const avgRetention = Math.round(
    moduleRetentions.filter(m => m.lessonsCompleted > 0).reduce((acc, m) => acc + m.retentionHealthPercent, 0) /
    Math.max(1, moduleRetentions.filter(m => m.lessonsCompleted > 0).length)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* =========================================================================
          TOP STAGE: "Jump Back In" Active Course & Pacing Forecast Card
          ========================================================================= */}
      <section className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#171B26] p-6 lg:p-8 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center transition-all">
        {/* Left 7 Columns: Active Lesson Context & Dual Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              MODULE 04 OF 08 • DISTRIBUTED SYSTEMS ARCHITECTURE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Active Stream
            </span>
          </div>

          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              04.3 — Consensus Algorithms & Raft Leader Election
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" /> 24m video
              </span>
              <span>•</span>
              <span className="text-violet-600 dark:text-violet-400 font-semibold font-mono">
                ⚡ 3 in-video checkpoints
              </span>
              <span>•</span>
              <span className="font-mono">TLA+ formal verification</span>
            </p>
          </div>

          {/* Dual Progress Bar Strip: Watched vs Retained */}
          <div className="space-y-3 pt-2">
            {/* Bar 1: Consumption Progress */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Course Completion Progress:
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                  68% Watched (19 / 28 Lessons)
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                  style={{ width: '68%' }}
                />
              </div>
            </div>

            {/* Bar 2: Retention Health Mastery (Ebbinghaus Decay Protection) */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Retention Health Mastery:
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {avgRetention}% Strong (2 concepts due for quick refresher)
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: '74%' }}
                  title="Fresh Mastery"
                />
                <div
                  className="h-full bg-amber-400 transition-all duration-700"
                  style={{ width: '17%' }}
                  title="Fading (Refresher due)"
                />
              </div>
            </div>
          </div>

          {/* Primary CTA Cluster */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                sounds.playClick();
                onResumeLesson('les-04-03', 702); // 11:42 in seconds
              }}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Resume at 11:42</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onLaunchQuiz('quiz-mod-04-mastery');
              }}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-800 dark:text-slate-200 border border-black/10 dark:border-white/10 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 bg-black/5 dark:bg-white/5 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Take Module 4 Test-Out Quiz</span>
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Goal-Paced Finish Line Forecaster Box */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-[#F2F0E8] dark:bg-[#11141C] p-5 border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                TARGET GRADUATION FORECAST
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                🟢 +1.5 hrs Ahead of Pace
              </span>
            </div>

            <div>
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                DEC 18, 2026
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Projected certification date at current study cadence
              </p>
            </div>

            {/* Weekly Rhythm Selector */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#171B26] border border-black/5 dark:border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Active Weekly Schedule:
              </span>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mon (30m ✓)
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Wed (30m ✓)
                </span>
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-mono">
                  <Clock className="w-3.5 h-3.5" /> Fri (30m Scheduled)
                </span>
              </div>
            </div>

            {/* Zero-Guilt Action Link */}
            <div className="pt-1">
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsRebalanceModalOpen(true);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 font-semibold group"
              >
                <span>Busy week?</span>
                <span className="underline font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                  ✨ Rebalance My Study Schedule
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MIDDLE BENTO GRID: Skill Radar, Memory Vault & 365-Day Activity Matrix
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Multi-Axis Skill Competency Radar (4 Columns) */}
        <div className="lg:col-span-4 min-h-[380px]">
          <SkillRadarChart
            skills={skillProficiencies}
            onTakeFocusQuiz={() => onLaunchQuiz('quiz-mod-04-mastery')}
          />
        </div>

        {/* Card 2: Spaced-Repetition "Memory Vault" Queue (4 Columns) */}
        <div className="lg:col-span-4 min-h-[380px]">
          <MemoryVaultCard
            modules={moduleRetentions}
            dueCardsCount={dueCardsCount}
            onLaunchReview={onLaunchMemoryVault}
          />
        </div>

        {/* Card 3: 365-Day Study Activity & Velocity Matrix (4 Columns) */}
        <div className="lg:col-span-4 min-h-[380px]">
          <StudyHeatmap logs={studyLogs} />
        </div>
      </section>

      {/* Schedule Rebalancer Modal */}
      <ScheduleRebalanceModal
        isOpen={isRebalanceModalOpen}
        onClose={() => setIsRebalanceModalOpen(false)}
        currentProjectedDate={enrollment.projectedCompletionDate}
        onConfirmRebalance={onRebalanceSchedule}
      />
    </div>
  );
};

