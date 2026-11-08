import React, { useState } from 'react';
import { 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Bookmark, 
  ArrowRight, 
  RotateCcw,
  ShieldAlert,
  Brain
} from 'lucide-react';
import { useQuizAssessmentEngine } from '../../hooks/useQuizAssessmentEngine';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { DragDropSequenceQuestion } from './DragDropSequenceQuestion';
import { ClozeFillQuestion } from './ClozeFillQuestion';
import { DiagramHotspotQuestion } from './DiagramHotspotQuestion';
import { ConfidenceSelector } from './ConfidenceSelector';
import { VideoRemediationCard } from './VideoRemediationCard';
import { sounds } from '../../services/audioEffects';
import confetti from 'canvas-confetti';

interface PolymorphicQuizStageProps {
  quizId: string;
  onExit: () => void;
  onOpenClassroom?: (lessonId: string, timestampSec: number) => void;
  onViewCertificate?: () => void;
}

export const PolymorphicQuizStage: React.FC<PolymorphicQuizStageProps> = ({
  quizId,
  onExit,
  onOpenClassroom,
  onViewCertificate
}) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const {
    quiz,
    currentIndex,
    totalQuestions,
    currentQuestion,
    currentAnswer,
    currentConfidence,
    currentGradedResult,
    gradedResults,
    timeRemainingSeconds,
    isCompleted,
    setAnswer,
    setConfidence,
    submitCurrentAnswer,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    formatTimecode
  } = useQuizAssessmentEngine({
    quizId,
    onFinish: (results) => {
      if (results.passed) {
        sounds.playSuccess();
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } catch {}
      }
    }
  });

  if (!quiz || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Toggle bookmark for current question
  const toggleBookmark = () => {
    sounds.playClick();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  // Completion calculation
  const totalEarnedPoints = Object.values(gradedResults).reduce((sum, r) => sum + r.pointsAwarded, 0);
  const totalPossiblePoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const finalScorePercent = Math.round((totalEarnedPoints / totalPossiblePoints) * 100);
  const isPassed = finalScorePercent >= quiz.passingScorePercent;
  const blindspots = Object.values(gradedResults).filter(r => r.isConceptualBlindspot);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F5] dark:bg-[#090B10] text-slate-900 dark:text-white flex flex-col transition-colors">
      {/* =========================================================================
          TOP ASSESSMENT HUD BAR (h-16)
          ========================================================================= */}
      <div className="h-16 border-b border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#171B26]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-16 z-30">
        {/* Left: Quiz Title & Mode */}
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            🏆 GRADED MASTERY MODE
          </span>
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 hidden sm:inline line-clamp-1">
            {quiz.title}
          </h2>
        </div>

        {/* Center: Segmented Question Progress Track */}
        <div className="flex items-center gap-1.5">
          {quiz.questions.map((q, idx) => {
            const result = gradedResults[q.id];
            const isCurrent = idx === currentIndex;

            let nodeClass = 'bg-black/5 dark:bg-white/10 text-slate-500 border border-transparent';
            if (result) {
              if (result.isConceptualBlindspot) {
                nodeClass = 'bg-red-500 text-white font-bold border-red-600 animate-pulse';
              } else if (result.isCorrect) {
                nodeClass = 'bg-emerald-500 text-white font-bold border-emerald-600';
              } else {
                nodeClass = 'bg-amber-500 text-white font-bold border-amber-600';
              }
            } else if (isCurrent) {
              nodeClass = 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-500/40';
            }

            return (
              <button
                key={q.id}
                onClick={() => jumpToQuestion(idx)}
                className={`w-7 h-7 rounded-lg font-mono text-xs flex items-center justify-center transition-all ${nodeClass}`}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Right: Countdown Clock & Exit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-mono font-bold tabular-nums">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>⏱ {formatTimecode(timeRemainingSeconds)} Remaining</span>
          </div>

          <button
            onClick={() => { sounds.playClick(); onExit(); }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Exit Assessment
          </button>
        </div>
      </div>

      {/* =========================================================================
          CENTRAL QUESTION & CONFIDENCE STAGE
          ========================================================================= */}
      <div className="flex-1 max-w-3xl w-full mx-auto py-8 px-4 sm:px-6">
        {isCompleted ? (
          /* =========================================================================
             FINAL QUIZ SUMMARY & MASTERY REPORT
             ========================================================================= */
          <div className="p-8 rounded-3xl bg-white dark:bg-[#171B26] border border-black/10 dark:border-white/10 shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ring-8 ${
                isPassed ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/10' : 'bg-amber-500/10 text-amber-500 ring-amber-500/10'
              }`}>
                {isPassed ? <Award className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isPassed ? 'Module 04 Mastery Verified!' : 'Diagnostic Review Complete'}
              </h3>
              <p className="text-xs text-slate-500">
                Passing Threshold: {quiz.passingScorePercent}% • Your Score: <strong className="font-mono text-base">{finalScorePercent}%</strong>
              </p>
            </div>

            {/* Score & Calibration Telemetry Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/5 dark:border-white/5 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Final Score
                </span>
                <span className={`text-2xl font-mono font-bold ${isPassed ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {finalScorePercent}%
                </span>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  {isPassed ? 'Passed (≥80%)' : 'Refresher Needed'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/5 dark:border-white/5 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Metacognitive Calibration
                </span>
                <span className="text-2xl font-mono font-bold text-indigo-500">
                  91%
                </span>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  Accuracy on High-Confidence
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-secondary dark:bg-[#11141C] border border-black/5 dark:border-white/5 text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  Blindspots Detected
                </span>
                <span className={`text-2xl font-mono font-bold ${blindspots.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {blindspots.length}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                  Enrolled in Spaced Review
                </span>
              </div>
            </div>

            {/* Blindspots summary if any */}
            {blindspots.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold font-mono">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Flagged Conceptual Blindspots for Priority Spaced Repetition:</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  You tagged these questions as 100% confident but missed an underlying invariant. They are now enrolled in your personal Memory Vault.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={() => { sounds.playClick(); onExit(); }}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Back to Dashboard
              </button>

              {onViewCertificate && (
                <button
                  onClick={() => { sounds.playClick(); onViewCertificate(); }}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <Award className="w-4 h-4" />
                  <span>View Verified Capstone Certificate</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Active Question Runner */
          <div className="space-y-6">
            {/* Metadata Header */}
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">
                  QUESTION {currentIndex + 1} OF {totalQuestions}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                  {currentQuestion.skillAxisTag}
                </span>
              </div>

              <button
                onClick={toggleBookmark}
                className={`flex items-center gap-1.5 transition-colors ${
                  bookmarkedIds.has(currentQuestion.id)
                    ? 'text-amber-500 font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.has(currentQuestion.id) ? 'fill-amber-500' : ''}`} />
                <span>{bookmarkedIds.has(currentQuestion.id) ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            </div>

            {/* Prompt */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#171B26] border border-black/10 dark:border-white/10 shadow-xs">
              <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.promptMarkdown}
              </p>
            </div>

            {/* Polymorphic Question Workspace */}
            {currentQuestion.questionType === 'multiple_choice' && currentQuestion.optionsPayload && (
              <MultipleChoiceQuestion
                options={currentQuestion.optionsPayload}
                selectedOptionId={currentAnswer}
                isSubmitted={!!currentGradedResult}
                correctAnswer={currentGradedResult?.correctAnswer}
                onSelectOption={setAnswer}
              />
            )}

            {currentQuestion.questionType === 'drag_order' && currentQuestion.sequenceItems && (
              <DragDropSequenceQuestion
                initialItems={currentQuestion.sequenceItems}
                currentOrder={currentAnswer || []}
                isSubmitted={!!currentGradedResult}
                correctOrder={currentGradedResult?.correctAnswer}
                onChangeOrder={setAnswer}
              />
            )}

            {currentQuestion.questionType === 'cloze_fill' && currentQuestion.clozeTemplate && (
              <ClozeFillQuestion
                template={currentQuestion.clozeTemplate}
                solutions={currentQuestion.clozeSolutions}
                userValues={currentAnswer || {}}
                isSubmitted={!!currentGradedResult}
                onChangeValue={(blankKey, val) => {
                  setAnswer({
                    ...(currentAnswer || {}),
                    [blankKey]: val
                  });
                }}
              />
            )}

            {currentQuestion.questionType === 'diagram_hotspot' && (
              <DiagramHotspotQuestion
                hotspots={currentQuestion.hotspots}
                selectedHotspotId={currentAnswer}
                isSubmitted={!!currentGradedResult}
                onSelectHotspot={setAnswer}
              />
            )}

            {/* Metacognitive Confidence Selector Bar */}
            <ConfidenceSelector
              currentConfidence={currentConfidence}
              isAnswerSelected={currentAnswer !== undefined}
              isSubmitted={!!currentGradedResult}
              onSelectConfidence={setConfidence}
              onSubmitAnswer={submitCurrentAnswer}
              onNextQuestion={nextQuestion}
              isLastQuestion={currentIndex === totalQuestions - 1}
            />

            {/* Post-Answer Instant Video Remediation Card */}
            {currentGradedResult && (
              <VideoRemediationCard
                result={currentGradedResult}
                onOpenClassroom={onOpenClassroom}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

