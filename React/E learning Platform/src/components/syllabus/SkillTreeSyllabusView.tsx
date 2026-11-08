import React, { useState } from 'react';
import { Course, ModuleRetentionStats } from '../../types';
import { DualProgressRing } from '../common/DualProgressRing';
import { 
  CheckCircle2, 
  Lock, 
  Play, 
  Zap, 
  Brain, 
  Award, 
  ArrowDown, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { sounds } from '../../services/audioEffects';

interface SkillTreeSyllabusViewProps {
  course: Course;
  moduleRetentions: ModuleRetentionStats[];
  onSelectLesson: (lessonId: string) => void;
  onLaunchTestOutQuiz: (quizId: string) => void;
  onLaunchMemoryVault: () => void;
  onViewCertificate: () => void;
}

export const SkillTreeSyllabusView: React.FC<SkillTreeSyllabusViewProps> = ({
  course,
  moduleRetentions,
  onSelectLesson,
  onLaunchTestOutQuiz,
  onLaunchMemoryVault,
  onViewCertificate
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('mod-04');

  const getRetentionData = (moduleId: string) => {
    return moduleRetentions.find(m => m.moduleId === moduleId) || {
      moduleId,
      moduleTitle: '',
      lessonsCompleted: 0,
      totalLessons: 1,
      completionPercent: 0,
      retentionHealthPercent: 0,
      lastReviewedAt: '',
      daysSinceReview: 0,
      fadingCardsCount: 0,
      status: 'fresh' as const
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          DIRECTED ACYCLIC GRAPH (DAG) CURRICULUM MAP
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {course.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
          Modules enforce prerequisite knowledge boundaries. Experienced learners can challenge foundational modules to test out immediately.
        </p>
      </div>

      {/* DAG Node Map */}
      <div className="space-y-6 relative">
        {course.modules.map((mod, index) => {
          const ret = getRetentionData(mod.id);
          const isCompleted = ret.completionPercent === 100;
          const isFading = isCompleted && ret.retentionHealthPercent < 85;
          const isCurrentActive = mod.id === 'mod-04'; // Active module
          const isLocked = index > 3 && !isCompleted && !isCurrentActive;

          return (
            <div key={mod.id} className="relative flex flex-col items-center">
              {/* Module Card */}
              <div className={`w-full rounded-3xl border p-6 transition-all shadow-xs ${
                isCurrentActive
                  ? 'bg-white dark:bg-[#171B26] border-indigo-500 ring-4 ring-indigo-500/20'
                  : isFading
                    ? 'bg-white dark:bg-[#171B26] border-dashed border-amber-400'
                    : isCompleted
                      ? 'bg-white dark:bg-[#171B26] border-emerald-500/80'
                      : isLocked
                        ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70'
                        : 'bg-white dark:bg-[#171B26] border-black/10 dark:border-white/10'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Dual Ring + Title & Description */}
                  <div className="flex items-start gap-4">
                    <DualProgressRing
                      watchedPercent={ret.completionPercent}
                      retentionPercent={ret.retentionHealthPercent}
                      size={60}
                      label={`${ret.retentionHealthPercent}%`}
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                          MODULE 0{mod.sortOrder}
                        </span>

                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Mastered
                          </span>
                        )}

                        {isFading && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold animate-pulse-subtle">
                            <AlertTriangle className="w-3 h-3" /> Studied {ret.daysSinceReview}d ago • Retention at {ret.retentionHealthPercent}%
                          </span>
                        )}

                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold">
                            Active Stream
                          </span>
                        )}

                        {isLocked && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-500/10 text-slate-500 border border-slate-500/30 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Prerequisite Required
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                        {mod.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                        <span>{ret.lessonsCompleted} / {mod.lessons.length || 2} Lessons</span>
                        <span>•</span>
                        <span>{mod.estimatedMinutes} Mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {isFading && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onLaunchMemoryVault();
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>3-Min Refresher</span>
                      </button>
                    )}

                    {mod.allowTestOut && !isCompleted && (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onLaunchTestOutQuiz(mod.testOutQuizId || 'quiz-mod-01-diagnostic');
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 hover:border-orange-500 text-slate-700 dark:text-slate-300 hover:text-orange-500 bg-black/5 dark:bg-white/5 flex items-center gap-1.5 transition-colors"
                        title="Score 80%+ on diagnostic test to bypass this module"
                      >
                        <Zap className="w-3.5 h-3.5 text-orange-500" />
                        <span>Test Out (5m Quiz)</span>
                      </button>
                    )}

                    {isCurrentActive ? (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onSelectLesson('les-04-03');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Continue Module</span>
                      </button>
                    ) : isCompleted ? (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onSelectLesson(mod.lessons[0]?.id || 'les-01-01');
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        Review Lessons
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Connecting DAG Dependency Arrow */}
              {index < course.modules.length - 1 && (
                <div className="py-2 flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <ArrowDown className="w-5 h-5 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}

        {/* Capstone Certification Node */}
        <div className="pt-4 flex flex-col items-center">
          <div className="w-full rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 border-2 border-indigo-500/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-amber-500 uppercase">
                  FINAL PRESTIGE CAPSTONE
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Proctored Distributed Systems Certification Exam
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Passing certifies your multi-axis Skill Radar with a cryptographically verifiable public credential.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playSuccess();
                onViewCertificate();
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 flex items-center gap-2 shrink-0 transition-all"
            >
              <span>View Verifiable Certificate</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

