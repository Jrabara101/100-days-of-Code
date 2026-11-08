import {
  ConfidenceLevel,
  Course,
  GradedAnswerResult,
  ModuleRetentionStats,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  SpacedRepetitionCard,
  SRSRating,
  StudyDayLog,
  TimestampedNote,
  UserAnswerSubmission,
  UserSkillProficiency
} from '../types';
import { INITIAL_COURSES, INITIAL_TIMED_QA } from '../data/initialCourses';
import { INITIAL_QUIZZES } from '../data/initialQuizzes';
import {
  generate365DayLogs,
  INITIAL_ENROLLMENT,
  INITIAL_MODULE_RETENTION,
  INITIAL_SKILL_PROFICIENCIES,
  INITIAL_SPACED_REPETITION_CARDS,
  INITIAL_TIMESTAMPED_NOTES
} from '../data/initialUserProgress';

const STORAGE_KEYS = {
  COURSES: 'high_retention_courses',
  ENROLLMENT: 'high_retention_enrollment',
  RETENTION: 'high_retention_modules',
  SKILLS: 'high_retention_skills',
  SRS_CARDS: 'high_retention_srs_cards',
  NOTES: 'high_retention_notes',
  STUDY_LOGS: 'high_retention_study_logs',
  QUIZ_ATTEMPTS: 'high_retention_quiz_attempts',
  TIMED_QA: 'high_retention_timed_qa'
};

class LearningEngineService {
  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage quota exceeded or error', e);
    }
  }

  // Initializer / Reset helper
  public resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.COURSES);
    localStorage.removeItem(STORAGE_KEYS.ENROLLMENT);
    localStorage.removeItem(STORAGE_KEYS.RETENTION);
    localStorage.removeItem(STORAGE_KEYS.SKILLS);
    localStorage.removeItem(STORAGE_KEYS.SRS_CARDS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.STUDY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.TIMED_QA);
  }

  // 1. Courses
  public getCourses(): Course[] {
    return this.getStorage<Course[]>(STORAGE_KEYS.COURSES, INITIAL_COURSES);
  }

  public getCourseBySlug(slug: string): Course | undefined {
    return this.getCourses().find(c => c.slug === slug);
  }

  // 2. Enrollment & Schedule
  public getEnrollment() {
    return this.getStorage(STORAGE_KEYS.ENROLLMENT, INITIAL_ENROLLMENT);
  }

  public updateEnrollment(updates: Partial<typeof INITIAL_ENROLLMENT>) {
    const current = this.getEnrollment();
    const updated = { ...current, ...updates };
    this.setStorage(STORAGE_KEYS.ENROLLMENT, updated);
    return updated;
  }

  // Rebalance Study Schedule (Zero-Guilt Forecaster)
  public rebalanceSchedule(preferredDays: number[], weeklyMinutes: number) {
    const enrollment = this.getEnrollment();
    const modules = this.getModuleRetention();
    
    // Count uncompleted lessons
    let uncompletedLessons = 0;
    modules.forEach(m => {
      uncompletedLessons += (m.totalLessons - m.lessonsCompleted);
    });
    if (uncompletedLessons === 0) uncompletedLessons = 4;

    const lessonsPerWeek = Math.max(1, Math.floor(weeklyMinutes / 30));
    const weeksNeeded = Math.ceil(uncompletedLessons / lessonsPerWeek);

    const projected = new Date();
    projected.setDate(projected.getDate() + weeksNeeded * 7);
    const newDateStr = projected.toISOString().split('T')[0];

    const updated = this.updateEnrollment({
      preferredStudyDays: preferredDays,
      weeklyTargetMinutes: weeklyMinutes,
      projectedCompletionDate: newDateStr
    });

    return {
      newProjectedDate: newDateStr,
      weeksNeeded,
      lessonsPerWeek,
      enrollment: updated
    };
  }

  // 3. Module Retention & Ebbinghaus Decay Calculation
  public getModuleRetention(): ModuleRetentionStats[] {
    const modules = this.getStorage<ModuleRetentionStats[]>(STORAGE_KEYS.RETENTION, INITIAL_MODULE_RETENTION);
    
    // Recalculate real-time retention health based on days since review:
    // R = 100 * EXP(-days / (stability * 8))
    return modules.map(m => {
      if (m.lessonsCompleted === 0) {
        return { ...m, retentionHealthPercent: 0, status: 'fresh' };
      }
      const days = m.daysSinceReview;
      const stability = 2.4; // Average stability factor
      const decayRatio = Math.exp(-days / (stability * 8.0));
      const decayedHealth = Math.max(45, Math.min(100, Math.round(100 * decayRatio)));

      let status: 'fresh' | 'fading' | 'critical' = 'fresh';
      if (decayedHealth < 75) status = 'fading';
      if (decayedHealth < 50) status = 'critical';

      return {
        ...m,
        retentionHealthPercent: decayedHealth,
        status
      };
    });
  }

  // Restore retention ring upon completing a spaced review session
  public restoreModuleRetention(moduleId: string, restoredHealthPercent: number = 98) {
    const modules = this.getModuleRetention();
    const updated = modules.map(m => {
      if (m.moduleId === moduleId) {
        return {
          ...m,
          retentionHealthPercent: restoredHealthPercent,
          lastReviewedAt: new Date().toISOString(),
          daysSinceReview: 0,
          fadingCardsCount: 0,
          status: 'fresh' as const
        };
      }
      return m;
    });
    this.setStorage(STORAGE_KEYS.RETENTION, updated);
    return updated;
  }

  // Mark lesson completed
  public markLessonCompleted(lessonId: string, moduleId: string) {
    const modules = this.getModuleRetention();
    const updated = modules.map(m => {
      if (m.moduleId === moduleId) {
        const completed = Math.min(m.totalLessons, m.lessonsCompleted + 1);
        return {
          ...m,
          lessonsCompleted: completed,
          completionPercent: Math.round((completed / m.totalLessons) * 100),
          lastReviewedAt: new Date().toISOString(),
          daysSinceReview: 0,
          retentionHealthPercent: 100,
          status: 'fresh' as const
        };
      }
      return m;
    });
    this.setStorage(STORAGE_KEYS.RETENTION, updated);

    // Update study log for today
    this.logStudyActivity(15, 1, 0, 0);
    return updated;
  }

  // 4. Quizzes & Anti-Leak Grading
  public getQuiz(quizId: string): Quiz | undefined {
    return INITIAL_QUIZZES[quizId];
  }

  // Strips answers for active test environment
  public getSanitizedQuiz(quizId: string): Quiz | null {
    const quiz = this.getQuiz(quizId);
    if (!quiz) return null;

    const safeQuestions: QuizQuestion[] = quiz.questions.map(q => {
      const copy: QuizQuestion = {
        id: q.id,
        quizId: q.quizId,
        questionType: q.questionType,
        promptMarkdown: q.promptMarkdown,
        skillAxisTag: q.skillAxisTag,
        points: q.points,
        explanationMarkdown: '', // stripped
        videoCueTimestampSec: q.videoCueTimestampSec
      };

      if (q.optionsPayload) {
        copy.optionsPayload = q.optionsPayload.map(o => ({ id: o.id, text: o.text }));
      }
      if (q.sequenceItems) {
        copy.sequenceItems = [...q.sequenceItems];
      }
      if (q.clozeTemplate) {
        copy.clozeTemplate = q.clozeTemplate;
      }
      if (q.diagramUrl) {
        copy.diagramUrl = q.diagramUrl;
        copy.hotspots = q.hotspots?.map(h => ({
          id: h.id,
          label: h.label,
          xPercent: h.xPercent,
          yPercent: h.yPercent,
          radiusPercent: h.radiusPercent,
          isCorrect: false, // stripped
          feedback: '' // stripped
        }));
      }

      return copy;
    });

    return {
      ...quiz,
      questions: safeQuestions
    };
  }

  // Server-side grading of single answer
  public evaluateAnswer(
    quizId: string,
    submission: UserAnswerSubmission
  ): GradedAnswerResult {
    const quiz = this.getQuiz(quizId);
    if (!quiz) throw new Error('Quiz not found');

    const originalQuestion = quiz.questions.find(q => q.id === submission.questionId);
    if (!originalQuestion) throw new Error('Question not found');

    let isCorrect = false;

    if (originalQuestion.questionType === 'multiple_choice') {
      isCorrect = submission.answer === originalQuestion.correctAnswerPayload;
    } else if (originalQuestion.questionType === 'drag_order') {
      isCorrect = JSON.stringify(submission.answer) === JSON.stringify(originalQuestion.correctSequenceIds);
    } else if (originalQuestion.questionType === 'cloze_fill') {
      const solutions = originalQuestion.clozeSolutions || {};
      const userAnswers = submission.answer || {};
      isCorrect = Object.keys(solutions).every(k => {
        const expected = (solutions[k] || '').trim().toLowerCase();
        const given = (userAnswers[k] || '').trim().toLowerCase();
        return given.length > 0 && (expected.includes(given) || given.includes(expected.split(' ')[0]));
      });
    } else if (originalQuestion.questionType === 'diagram_hotspot') {
      const matched = originalQuestion.hotspots?.find(h => h.id === submission.answer);
      isCorrect = !!(matched && matched.isCorrect);
    }

    // Metacognitive Blindspot detection: High confidence + Wrong
    const isConceptualBlindspot = (!isCorrect) && (submission.confidence === 'high_confidence');

    // Auto-enroll in Memory Vault if missed or if learner answered by guessing
    if (!isCorrect || submission.confidence === 'guessing') {
      this.enrollInSpacedRepetition(originalQuestion);
    }

    // Update Skill proficiency
    this.updateSkillProficiency(originalQuestion.skillAxisTag, isCorrect);

    return {
      questionId: originalQuestion.id,
      isCorrect,
      isConceptualBlindspot,
      confidence: submission.confidence,
      explanationMarkdown: originalQuestion.explanationMarkdown,
      correctAnswer: originalQuestion.correctAnswerPayload || originalQuestion.correctSequenceIds || originalQuestion.clozeSolutions,
      remediation: originalQuestion.remediationLessonId ? {
        lessonId: originalQuestion.remediationLessonId,
        lessonTitle: originalQuestion.remediationLessonTitle || 'Core Concept Lecture',
        startSec: originalQuestion.remediationStartSec || 0,
        endSec: originalQuestion.remediationEndSec || 45
      } : undefined,
      pointsAwarded: isCorrect ? originalQuestion.points : 0
    };
  }

  // 5. Spaced Repetition (FSRS / SM-2)
  public getSpacedRepetitionCards(): SpacedRepetitionCard[] {
    return this.getStorage<SpacedRepetitionCard[]>(
      STORAGE_KEYS.SRS_CARDS,
      INITIAL_SPACED_REPETITION_CARDS
    );
  }

  public getDueSpacedRepetitionCards(): SpacedRepetitionCard[] {
    const cards = this.getSpacedRepetitionCards();
    const now = Date.now();
    return cards.filter(c => new Date(c.nextReviewAt).getTime() <= now);
  }

  public enrollInSpacedRepetition(question: QuizQuestion) {
    const cards = this.getSpacedRepetitionCards();
    const existingIndex = cards.findIndex(c => c.questionId === question.id);

    const newCard: SpacedRepetitionCard = {
      id: `srs-${question.id}-${Date.now()}`,
      userId: 'usr-scholar-2026',
      questionId: question.id,
      courseId: 'course-dist-sys-01',
      moduleTitle: 'Module Review',
      questionPrompt: question.promptMarkdown,
      questionType: question.questionType,
      skillAxisTag: question.skillAxisTag,
      easinessFactor: 2.1,
      intervalDays: 1,
      repetitions: 0,
      lastReviewedAt: new Date().toISOString(),
      nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
      remediationClip: question.remediationLessonId ? {
        lessonId: question.remediationLessonId,
        lessonTitle: question.remediationLessonTitle || 'Lesson Explanation',
        startSec: question.remediationStartSec || 0,
        endSec: question.remediationEndSec || 35
      } : undefined
    };

    if (existingIndex >= 0) {
      cards[existingIndex] = {
        ...cards[existingIndex],
        intervalDays: 1,
        repetitions: 0,
        easinessFactor: Math.max(1.3, cards[existingIndex].easinessFactor - 0.2),
        nextReviewAt: new Date(Date.now() + 86400000).toISOString()
      };
    } else {
      cards.push(newCard);
    }

    this.setStorage(STORAGE_KEYS.SRS_CARDS, cards);
  }

  // SM-2 Review Interval Computation
  public reviewSpacedCard(cardId: string, rating: SRSRating) {
    const cards = this.getSpacedRepetitionCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) return null;

    let { easinessFactor, intervalDays, repetitions } = card;

    if (rating === 'again') {
      repetitions = 0;
      intervalDays = 1;
      easinessFactor = Math.max(1.3, easinessFactor - 0.2);
    } else if (rating === 'hard') {
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
      easinessFactor = Math.max(1.3, easinessFactor - 0.15);
    } else if (rating === 'good') {
      repetitions += 1;
      if (repetitions === 1) intervalDays = 3;
      else if (repetitions === 2) intervalDays = 7;
      else intervalDays = Math.round(intervalDays * easinessFactor);
    } else if (rating === 'easy') {
      repetitions += 1;
      if (repetitions === 1) intervalDays = 5;
      else if (repetitions === 2) intervalDays = 12;
      else intervalDays = Math.round(intervalDays * easinessFactor * 1.3);
      easinessFactor += 0.15;
    }

    card.easinessFactor = Number(easinessFactor.toFixed(2));
    card.intervalDays = intervalDays;
    card.repetitions = repetitions;
    card.lastReviewedAt = new Date().toISOString();
    card.nextReviewAt = new Date(Date.now() + intervalDays * 86400000).toISOString();

    this.setStorage(STORAGE_KEYS.SRS_CARDS, cards);
    this.logStudyActivity(2, 0, 0, 1);

    return card;
  }

  // 6. Timestamped Notes & Frame Snaps
  public getNotes(lessonId?: string): TimestampedNote[] {
    const notes = this.getStorage<TimestampedNote[]>(STORAGE_KEYS.NOTES, INITIAL_TIMESTAMPED_NOTES);
    if (lessonId) {
      return notes.filter(n => n.lessonId === lessonId);
    }
    return notes;
  }

  public createNote(note: Omit<TimestampedNote, 'id' | 'createdAt'>): TimestampedNote {
    const notes = this.getNotes();
    const newNote: TimestampedNote = {
      ...note,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    notes.unshift(newNote);
    this.setStorage(STORAGE_KEYS.NOTES, notes);
    return newNote;
  }

  public deleteNote(noteId: string): void {
    const notes = this.getNotes().filter(n => n.id !== noteId);
    this.setStorage(STORAGE_KEYS.NOTES, notes);
  }

  // 7. Timed Q&A
  public getTimedQA(lessonId: string) {
    const all = this.getStorage(STORAGE_KEYS.TIMED_QA, INITIAL_TIMED_QA);
    return all.filter(q => q.lessonId === lessonId);
  }

  public addQuestion(question: Omit<typeof INITIAL_TIMED_QA[0], 'id' | 'createdAt' | 'upvotes' | 'hasInstructorAnswer'>) {
    const all = this.getStorage(STORAGE_KEYS.TIMED_QA, INITIAL_TIMED_QA);
    const newQ = {
      ...question,
      id: `qa-${Date.now()}`,
      upvotes: 1,
      hasInstructorAnswer: false,
      createdAt: 'Just now'
    };
    all.unshift(newQ);
    this.setStorage(STORAGE_KEYS.TIMED_QA, all);
    return newQ;
  }

  public upvoteQuestion(questionId: string) {
    const all = this.getStorage(STORAGE_KEYS.TIMED_QA, INITIAL_TIMED_QA);
    const item = all.find(q => q.id === questionId);
    if (item) {
      item.upvotes += 1;
      this.setStorage(STORAGE_KEYS.TIMED_QA, all);
    }
  }

  // 8. Skill Proficiencies
  public getSkillProficiencies(): UserSkillProficiency[] {
    return this.getStorage<UserSkillProficiency[]>(
      STORAGE_KEYS.SKILLS,
      INITIAL_SKILL_PROFICIENCIES
    );
  }

  public updateSkillProficiency(skillAxis: string, wasCorrect: boolean) {
    const skills = this.getSkillProficiencies();
    const target = skills.find(s => s.skillAxis === skillAxis);
    if (target) {
      target.totalAttempts += 1;
      const change = wasCorrect ? 2 : -4;
      target.scorePercent = Math.max(30, Math.min(99, target.scorePercent + change));
      target.lastAssessedAt = new Date().toISOString().split('T')[0];
    } else {
      skills.push({
        skillAxis,
        scorePercent: wasCorrect ? 75 : 55,
        totalAttempts: 1,
        lastAssessedAt: new Date().toISOString().split('T')[0]
      });
    }
    this.setStorage(STORAGE_KEYS.SKILLS, skills);
  }

  // 9. Study Logs & 365-Day Activity Heatmap
  public getStudyLogs(): StudyDayLog[] {
    return this.getStorage<StudyDayLog[]>(STORAGE_KEYS.STUDY_LOGS, generate365DayLogs());
  }

  public logStudyActivity(minutes: number, lessons: number, quizzes: number, cards: number) {
    const logs = this.getStudyLogs();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = logs.find(l => l.date === todayStr);

    if (todayLog) {
      todayLog.minutesStudied += minutes;
      todayLog.lessonsCompletedCount += lessons;
      todayLog.quizzesPassedCount += quizzes;
      todayLog.cardsReviewedCount += cards;
    } else {
      logs.push({
        date: todayStr,
        minutesStudied: minutes,
        lessonsCompletedCount: lessons,
        quizzesPassedCount: quizzes,
        cardsReviewedCount: cards
      });
    }

    this.setStorage(STORAGE_KEYS.STUDY_LOGS, logs);
  }

  // Format seconds into MM:SS
  public formatTimecode(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export const learningEngine = new LearningEngineService();

