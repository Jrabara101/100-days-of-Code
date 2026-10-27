import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp, ArrowDown, Check, Clock, CloudCheck, Sparkles, X } from 'lucide-react';
import QuestionBlockFactory from './QuestionBlockFactory';
import OutcomeStage from './OutcomeStage';
import { pipeVariables } from '../../utils/variablePiping';
import { upsertPartialAnswer, completeResponse } from '../../utils/storage';
import { sound } from '../../utils/audio';

export default function RespondentRunner({
  survey,
  onClose = null,
  isStandalone = false
}) {
  // Session Token for resilient partial capture
  const [sessionToken] = useState(() => {
    const existing = sessionStorage.getItem(`pulseflow_sess_${survey.id}`);
    if (existing) return existing;
    const fresh = 'sess_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(`pulseflow_sess_${survey.id}`, fresh);
    return fresh;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [historyStack, setHistoryStack] = useState([0]); // For true branching backtracking
  const [answers, setAnswers] = useState(() => {
    // Restore answers from session storage if exists
    try {
      const saved = sessionStorage.getItem(`pulseflow_ans_${survey.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isCompleted, setIsCompleted] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved'
  const [slideDirection, setSlideDirection] = useState('down'); // 'up' | 'down'

  // Timer for Knowledge quizzes with time limits
  const [secondsRemaining, setSecondsRemaining] = useState(
    survey.settings?.time_limit_seconds || null
  );

  const startTimeRef = useRef(Date.now());
  const activeQuestion = survey.questions[currentIndex];
  const totalQuestions = survey.questions.length;

  // Countdown timer effect
  useEffect(() => {
    if (!secondsRemaining || isCompleted) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isCompleted]);

  // Global Runner Keyboard Navigation (Arrows & Enter)
  useEffect(() => {
    if (isCompleted) return;

    const handleGlobalKeys = (e) => {
      // Don't intercept if inside textarea (unless ctrl+enter)
      const tagName = e.target.tagName;
      if (tagName === 'TEXTAREA' && !(e.ctrlKey && e.key === 'Enter')) {
        return;
      }

      // Enter to advance
      if (e.key === 'Enter' && tagName !== 'INPUT') {
        e.preventDefault();
        handleNext();
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [currentIndex, answers, isCompleted, historyStack]);

  // Answer Change Handler with Ghost Partial Sync
  const handleAnswerChange = (val) => {
    if (!activeQuestion) return;

    const newAnswers = { ...answers, [activeQuestion.id]: val };
    setAnswers(newAnswers);
    sessionStorage.setItem(`pulseflow_ans_${survey.id}`, JSON.stringify(newAnswers));

    // Optimistic Ghost Partial Upsert
    setSaveStatus('saving');
    upsertPartialAnswer({
      surveyId: survey.id,
      sessionToken: sessionToken,
      questionId: activeQuestion.id,
      answerValue: val,
      device: window.innerWidth < 768 ? 'mobile' : 'desktop'
    });

    setTimeout(() => {
      setSaveStatus('saved');
    }, 400);
  };

  // Evaluate branching logic to find next question index
  const getNextQuestionIndex = () => {
    if (!activeQuestion) return currentIndex + 1;

    const currentAnswer = answers[activeQuestion.id];
    const rules = (survey.logic_rules || []).filter(
      r => r.source_question_id === activeQuestion.id
    );

    for (const rule of rules) {
      let isMatch = false;

      if (rule.condition === 'always') {
        isMatch = true;
      } else if (rule.condition === 'equals') {
        isMatch = String(currentAnswer).trim().toLowerCase() === String(rule.value).trim().toLowerCase();
      } else if (rule.condition === 'not_equals') {
        isMatch = String(currentAnswer).trim().toLowerCase() !== String(rule.value).trim().toLowerCase();
      } else if (rule.condition === 'less_than') {
        const numAnswer = parseFloat(currentAnswer);
        const numVal = parseFloat(rule.value);
        if (!isNaN(numAnswer) && !isNaN(numVal)) {
          isMatch = numAnswer < numVal;
        }
      } else if (rule.condition === 'greater_than') {
        const numAnswer = parseFloat(currentAnswer);
        const numVal = parseFloat(rule.value);
        if (!isNaN(numAnswer) && !isNaN(numVal)) {
          isMatch = numAnswer > numVal;
        }
      }

      if (isMatch && rule.target_question_id) {
        const targetIdx = survey.questions.findIndex(q => q.id === rule.target_question_id);
        if (targetIdx !== -1) {
          return targetIdx;
        }
      }
    }

    // Default sequential progression
    return currentIndex + 1;
  };

  // Step Forward
  const handleNext = (directValue) => {
    if (!activeQuestion) return;

    const currentVal = directValue !== undefined ? directValue : answers[activeQuestion.id];

    // Validation check for required fields
    if (activeQuestion.is_required && (currentVal === undefined || currentVal === null || currentVal === '')) {
      sound.playKeyTap();
      return;
    }

    sound.playAdvance();
    const nextIdx = getNextQuestionIndex();

    if (nextIdx >= totalQuestions) {
      handleFinalSubmit();
    } else {
      setSlideDirection('down');
      setHistoryStack(prev => [...prev, nextIdx]);
      setCurrentIndex(nextIdx);
    }
  };

  // Step Backward with History Stack
  const handleBack = () => {
    if (historyStack.length <= 1) return;

    sound.playKeyTap();
    setSlideDirection('up');
    const newStack = [...historyStack];
    newStack.pop(); // Remove current
    const previousIdx = newStack[newStack.length - 1];
    setHistoryStack(newStack);
    setCurrentIndex(previousIdx);
  };

  // Calculate outcomes, scores, and complete response
  const handleFinalSubmit = () => {
    const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Calculate Scored Quiz points
    let computedScore = 0;
    if (survey.type === 'scored_quiz') {
      let earnedPoints = 0;
      let totalPossible = 0;

      survey.questions.forEach((q) => {
        if (q.properties?.correct_answer) {
          const pts = q.properties.points || 10;
          totalPossible += pts;
          if (answers[q.id] === q.properties.correct_answer) {
            earnedPoints += pts;
          }
        }
      });

      computedScore = totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 100;
    }

    // Calculate Personality Assessment category buckets
    const categoryScores = { architect: 0, coach: 0, operator: 0, maestro: 0 };
    if (survey.type === 'personality_assessment') {
      survey.questions.forEach((q) => {
        const val = answers[q.id];
        if (val) {
          const choice = (q.properties?.choices || []).find(c => c.label === val);
          if (choice?.category_points) {
            Object.entries(choice.category_points).forEach(([cat, pts]) => {
              categoryScores[cat] = (categoryScores[cat] || 0) + pts;
            });
          }
          if (q.properties?.category_points && typeof val === 'number') {
            Object.entries(q.properties.category_points).forEach(([cat, pts]) => {
              categoryScores[cat] = (categoryScores[cat] || 0) + (pts * val);
            });
          }
        }
      });
    }

    // Determine Matching Outcome
    let matchedOutcome = null;
    if (survey.quiz_outcomes && survey.quiz_outcomes.length > 0) {
      if (survey.type === 'scored_quiz') {
        matchedOutcome = survey.quiz_outcomes.find(
          o => computedScore >= o.min_score && computedScore <= o.max_score
        ) || survey.quiz_outcomes[0];
      } else if (survey.type === 'personality_assessment') {
        let topCat = 'architect';
        let highest = -1;
        Object.entries(categoryScores).forEach(([cat, pts]) => {
          if (pts > highest) {
            highest = pts;
            topCat = cat;
          }
        });
        matchedOutcome = survey.quiz_outcomes.find(o => o.category_match === topCat) || survey.quiz_outcomes[0];
      } else {
        matchedOutcome = survey.quiz_outcomes[0];
      }
    }

    // Finalize response in persistent storage
    completeResponse({
      sessionToken: sessionToken,
      totalScore: computedScore,
      outcomeTitle: matchedOutcome?.title || 'Completed',
      durationSeconds: elapsedSeconds
    });

    setIsCompleted(true);
  };

  const handleRestart = () => {
    sessionStorage.removeItem(`pulseflow_ans_${survey.id}`);
    sessionStorage.removeItem(`pulseflow_sess_${survey.id}`);
    setAnswers({});
    setCurrentIndex(0);
    setHistoryStack([0]);
    setIsCompleted(false);
    setSecondsRemaining(survey.settings?.time_limit_seconds || null);
    startTimeRef.current = Date.now();
  };

  // Progress Bar Percentage
  const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / totalQuestions) * 100));

  // Formatted Timer Display
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-[#0A0B0E] text-white flex flex-col justify-between overflow-x-hidden ${isStandalone ? '' : ''}`}>
      {/* 1. Hairline Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-white/10 z-50">
        <div
          className="h-full bg-brand shadow-glow-brand transition-all duration-300 ease-out"
          style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
        />
      </div>

      {/* 2. Top Header Ribbon */}
      <header className="w-full max-w-4xl mx-auto px-6 py-5 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 text-brand-light flex items-center justify-center font-bold text-sm">
            {survey.theme_config?.logoText ? survey.theme_config.logoText.charAt(0) : 'P'}
          </div>
          <span className="font-semibold text-sm tracking-tight text-white/90 hidden sm:inline">
            {survey.theme_config?.logoText || survey.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Countdown Clock (if quiz with timer) */}
          {secondsRemaining !== null && !isCompleted && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border transition-all ${
                secondsRemaining < 30
                  ? 'border-rose-500/80 bg-rose-950/40 text-rose-400 animate-pulse'
                  : 'border-white/15 bg-white/5 text-slate-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          )}

          {/* Question Counter Chip */}
          {!isCompleted && (
            <div className="font-mono text-xs px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
              {currentIndex + 1} of {totalQuestions}
            </div>
          )}

          {/* Exit / Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 3. Central Stage */}
      <main className="flex-1 flex flex-col justify-center items-center w-full px-6 py-6 sm:py-12 z-30">
        {isCompleted ? (
          <OutcomeStage
            survey={survey}
            answers={answers}
            totalScore={
              survey.type === 'scored_quiz'
                ? Math.round(
                    (survey.questions.reduce((acc, q) => acc + (answers[q.id] === q.properties?.correct_answer ? (q.properties.points || 10) : 0), 0) /
                      (survey.questions.filter(q => q.properties?.correct_answer).reduce((acc, q) => acc + (q.properties.points || 10), 0) || 1)) *
                      100
                  )
                : 100
            }
            onRestart={handleRestart}
            onExit={onClose}
          />
        ) : (
          activeQuestion && (
            <div
              key={activeQuestion.id}
              className={`w-full max-w-2xl mx-auto flex flex-col items-start ${
                slideDirection === 'down' ? 'animate-fade-slide-up' : 'animate-fade-slide-down'
              }`}
            >
              {/* Question Number Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-xs font-bold text-brand-light bg-brand/10 border border-brand/20 px-2.5 py-0.5 rounded">
                  {String(currentIndex + 1).padStart(2, '0')} →
                </span>
                {activeQuestion.is_required && (
                  <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                    * Required
                  </span>
                )}
              </div>

              {/* Title with Contextual Variable Piping */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-snug mb-3">
                {pipeVariables(activeQuestion.title, answers, survey.questions)}
              </h1>

              {/* Subtitle / Helper Copy */}
              {activeQuestion.subtitle && (
                <p className="text-sm sm:text-base text-slate-400 mb-8 leading-relaxed">
                  {pipeVariables(activeQuestion.subtitle, answers, survey.questions)}
                </p>
              )}

              {/* Polymorphic Question Block */}
              <div className="w-full mt-2">
                <QuestionBlockFactory
                  question={activeQuestion}
                  value={answers[activeQuestion.id]}
                  onChange={handleAnswerChange}
                  onSubmit={(val) => handleNext(val)}
                  isQuiz={survey.type === 'scored_quiz'}
                  showFeedback={survey.settings?.show_instant_feedback}
                />
              </div>
            </div>
          )
        )}
      </main>

      {/* 4. Persistent Bottom Command Bar */}
      {!isCompleted && (
        <footer className="w-full border-t border-white/10 bg-[#0A0B0E]/90 backdrop-blur-md px-6 py-3.5 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {/* Auto-save Status Indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  saveStatus === 'saving'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                }`}
              />
              <span className="hidden sm:inline font-mono text-[11px]">
                {saveStatus === 'saving' ? 'Syncing...' : '✓ Answers autosaved'}
              </span>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-3">
              {/* Vertical Navigation Arrows */}
              <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-white/5">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={historyStack.length <= 1}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Previous question (↑ or Shift+Tab)"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-white/10" />
                <button
                  type="button"
                  onClick={() => handleNext()}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  title="Next question (↓ or Enter)"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Submit / OK CTA */}
              <button
                type="button"
                onClick={() => handleNext()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-light text-white font-semibold text-sm shadow-glow-brand transition-all active:scale-[0.98]"
              >
                <span>{currentIndex === totalQuestions - 1 ? 'Submit' : 'OK'}</span>
                <span className="keycap-badge bg-black/30 border-white/20 text-white font-mono text-[10px]">
                  ↵ Enter
                </span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
