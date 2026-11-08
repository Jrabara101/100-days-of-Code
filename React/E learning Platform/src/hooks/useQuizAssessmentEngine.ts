import { useState, useEffect, useCallback } from 'react';
import { ConfidenceLevel, GradedAnswerResult, Quiz, QuizQuestion } from '../types';
import { learningEngine } from '../services/learningEngine';
import { sounds } from '../services/audioEffects';

interface UseQuizAssessmentEngineProps {
  quizId: string;
  onFinish?: (results: {
    scorePercent: number;
    passed: boolean;
    answers: GradedAnswerResult[];
    blindspotsCount: number;
  }) => void;
}

export function useQuizAssessmentEngine({ quizId, onFinish }: UseQuizAssessmentEngineProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [confidences, setConfidences] = useState<Record<string, ConfidenceLevel>>({});
  const [gradedResults, setGradedResults] = useState<Record<string, GradedAnswerResult>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(720);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());

  // Initialize quiz with anti-leak protection
  useEffect(() => {
    const loadedQuiz = learningEngine.getSanitizedQuiz(quizId);
    if (loadedQuiz) {
      setQuiz(loadedQuiz);
      if (loadedQuiz.timeLimitSeconds) {
        setTimeRemainingSeconds(loadedQuiz.timeLimitSeconds);
      }
    }
  }, [quizId]);

  // Countdown timer loop
  useEffect(() => {
    if (isCompleted || !quiz || !quiz.timeLimitSeconds) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit quiz on time expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, quiz]);

  const currentQuestion: QuizQuestion | undefined = quiz?.questions[currentIndex];
  const totalQuestions = quiz?.questions.length || 0;
  const currentAnswer = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const currentConfidence: ConfidenceLevel = (currentQuestion && confidences[currentQuestion.id]) || 'fairly_sure';
  const currentGradedResult: GradedAnswerResult | undefined = currentQuestion ? gradedResults[currentQuestion.id] : undefined;

  // Set answer for current question
  const setAnswer = useCallback((answer: any) => {
    if (!currentQuestion || currentGradedResult) return; // Prevent modifying after grading
    sounds.playClick();
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  }, [currentQuestion, currentGradedResult]);

  // Set confidence level
  const setConfidence = useCallback((level: ConfidenceLevel) => {
    if (!currentQuestion || currentGradedResult) return;
    sounds.playClick();
    setConfidences(prev => ({
      ...prev,
      [currentQuestion.id]: level
    }));
  }, [currentQuestion, currentGradedResult]);

  // Cycle confidence with 'C' keyboard shortcut
  const cycleConfidence = useCallback(() => {
    if (!currentQuestion || currentGradedResult) return;
    const levels: ConfidenceLevel[] = ['guessing', 'fairly_sure', 'high_confidence'];
    const nextIdx = (levels.indexOf(currentConfidence) + 1) % levels.length;
    setConfidence(levels[nextIdx]);
  }, [currentQuestion, currentGradedResult, currentConfidence, setConfidence]);

  // Submit single answer for instant evaluation & remediation
  const submitCurrentAnswer = useCallback(() => {
    if (!currentQuestion || currentAnswer === undefined || currentGradedResult || isSubmitting) return;

    setIsSubmitting(true);
    sounds.playClick();

    // Call grading engine
    const result = learningEngine.evaluateAnswer(quizId, {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      confidence: currentConfidence,
      timeSpentMs: 15000
    });

    if (result.isCorrect) {
      sounds.playSuccess();
    } else {
      sounds.playWarning();
    }

    setGradedResults(prev => ({
      ...prev,
      [currentQuestion.id]: result
    }));

    setIsSubmitting(false);
  }, [quizId, currentQuestion, currentAnswer, currentConfidence, currentGradedResult, isSubmitting]);

  // Navigate to next question or complete
  const nextQuestion = useCallback(() => {
    sounds.playClick();
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finish quiz
      setIsCompleted(true);
      const allResults = Object.values(gradedResults);
      const totalPoints = quiz?.questions.reduce((sum, q) => sum + q.points, 0) || 100;
      const earnedPoints = allResults.reduce((sum, r) => sum + r.pointsAwarded, 0);
      const scorePercent = Math.round((earnedPoints / totalPoints) * 100);
      const passed = scorePercent >= (quiz?.passingScorePercent || 80);
      const blindspotsCount = allResults.filter(r => r.isConceptualBlindspot).length;

      // Update study log
      learningEngine.logStudyActivity(Math.round((Date.now() - startTime) / 60000), 0, passed ? 1 : 0, 0);

      if (onFinish) {
        onFinish({
          scorePercent,
          passed,
          answers: allResults,
          blindspotsCount
        });
      }
    }
  }, [currentIndex, totalQuestions, gradedResults, quiz, startTime, onFinish]);

  const prevQuestion = useCallback(() => {
    sounds.playClick();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const jumpToQuestion = useCallback((index: number) => {
    sounds.playClick();
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  }, [totalQuestions]);

  // Global Keyboard Shortcuts for Assessment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        cycleConfidence();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!currentGradedResult && currentAnswer !== undefined) {
          submitCurrentAnswer();
        } else if (currentGradedResult) {
          nextQuestion();
        }
      } else if (currentQuestion?.questionType === 'multiple_choice' && !currentGradedResult) {
        const keyMap: Record<string, number> = {
          '1': 0, '2': 1, '3': 2, '4': 3,
          'a': 0, 'b': 1, 'c': 2, 'd': 3,
          'A': 0, 'B': 1, 'C': 2, 'D': 3
        };
        // Avoid collision with confidence shortcut 'c' unless explicit
        if (keyMap[e.key] !== undefined && e.key.toLowerCase() !== 'c') {
          const opt = currentQuestion.optionsPayload?.[keyMap[e.key]];
          if (opt) {
            setAnswer(opt.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, currentGradedResult, currentAnswer, cycleConfidence, submitCurrentAnswer, nextQuestion, setAnswer]);

  return {
    quiz,
    currentIndex,
    totalQuestions,
    currentQuestion,
    currentAnswer,
    currentConfidence,
    currentGradedResult,
    gradedResults,
    timeRemainingSeconds,
    isSubmitting,
    isCompleted,
    setAnswer,
    setConfidence,
    cycleConfidence,
    submitCurrentAnswer,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    formatTimecode: learningEngine.formatTimecode
  };
}

