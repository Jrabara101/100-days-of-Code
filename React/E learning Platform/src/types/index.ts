// Core Domain & Data Model Types matching PostgreSQL/Supabase Schemas

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video_lecture' | 'interactive_reading' | 'hands_on_lab';
export type QuizMode = 'in_video_checkpoint' | 'module_mastery' | 'diagnostic_test_out' | 'final_certification';
export type QuestionType = 'multiple_choice' | 'multi_select' | 'cloze_fill' | 'drag_order' | 'diagram_hotspot';
export type ConfidenceLevel = 'guessing' | 'fairly_sure' | 'high_confidence';

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  difficulty: DifficultyLevel;
  category: string;
  skillAxes: string[]; // e.g. ["System Design", "SQL Optimization", "Caching", "Security"]
  totalDurationMinutes: number;
  publishedAt: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  thumbnailUrl: string;
  modules: Module[];
}

export interface Module {
  id: string;
  courseId: string;
  sortOrder: number;
  title: string;
  description: string;
  prerequisiteModuleIds: string[];
  allowTestOut: boolean;
  testOutQuizId?: string;
  lessons: Lesson[];
  estimatedMinutes: number;
}

export interface Chapter {
  id: string;
  title: string;
  timestampSec: number;
}

export interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string;
}

export interface LabFile {
  name: string;
  size: string;
  language: string;
  description: string;
  downloadUrl?: string;
  codeSnippet?: string;
}

export interface TimedQuestionItem {
  id: string;
  lessonId: string;
  timestampSec: number;
  author: string;
  avatar: string;
  question: string;
  upvotes: number;
  hasInstructorAnswer: boolean;
  instructorAnswer?: {
    author: string;
    text: string;
    timestamp: string;
  };
  createdAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  sortOrder: number;
  title: string;
  lessonType: LessonType;
  videoStreamUrl?: string;
  durationSeconds: number;
  chapters: Chapter[];
  transcriptSegments: TranscriptSegment[];
  resources: LabFile[];
  checkpoints?: InVideoCheckpoint[];
}

export interface InVideoCheckpoint {
  id: string;
  cueTimestampSec: number;
  question: QuizQuestion;
}

export interface OptionItem {
  id: string;
  text: string;
  isCorrect?: boolean; // Stripped during active test
  explanation?: string;
}

export interface HotspotArea {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
  isCorrect: boolean;
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionType: QuestionType;
  videoCueTimestampSec?: number;
  promptMarkdown: string;
  optionsPayload?: OptionItem[];
  // For cloze_fill: template with {{blank1}}, and correct tokens
  clozeTemplate?: string;
  clozeSolutions?: Record<string, string>;
  // For drag_order: items in initial scrambled order and correct order IDs
  sequenceItems?: { id: string; content: string }[];
  correctSequenceIds?: string[];
  // For diagram_hotspot:
  diagramUrl?: string;
  hotspots?: HotspotArea[];
  correctAnswerPayload?: any; // kept on server or revealed post-submit
  explanationMarkdown: string;
  remediationLessonId?: string;
  remediationLessonTitle?: string;
  remediationStartSec?: number;
  remediationEndSec?: number;
  skillAxisTag: string;
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  title: string;
  description?: string;
  quizMode: QuizMode;
  passingScorePercent: number;
  timeLimitSeconds?: number;
  shuffleQuestions: boolean;
  questions: QuizQuestion[];
}

export interface UserAnswerSubmission {
  questionId: string;
  answer: any;
  confidence: ConfidenceLevel;
  timeSpentMs: number;
}

export interface GradedAnswerResult {
  questionId: string;
  isCorrect: boolean;
  isConceptualBlindspot: boolean; // High confidence + Incorrect
  confidence: ConfidenceLevel;
  explanationMarkdown: string;
  correctAnswer: any;
  remediation?: {
    lessonId: string;
    lessonTitle: string;
    startSec: number;
    endSec: number;
  };
  pointsAwarded: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  courseId: string;
  scorePercent: number;
  passed: boolean;
  confidenceCalibrationScore: number; // Percentage of high confidence answers that were actually correct
  blindspotsCount: number;
  answersBreakdown: GradedAnswerResult[];
  startedAt: string;
  completedAt: string;
}

// Spaced Repetition (FSRS / SM-2)
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface SpacedRepetitionCard {
  id: string;
  userId: string;
  questionId: string;
  courseId: string;
  moduleTitle: string;
  questionPrompt: string;
  questionType: QuestionType;
  skillAxisTag: string;
  easinessFactor: number; // Default 2.5
  intervalDays: number; // 1, 3, 7, 21...
  repetitions: number;
  lastReviewedAt: string;
  nextReviewAt: string;
  remediationClip?: {
    lessonId: string;
    lessonTitle: string;
    startSec: number;
    endSec: number;
  };
}

export interface TimestampedNote {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  timestampSec: number;
  frameSnapshotUrl?: string;
  contentMarkdown: string;
  createdAt: string;
  tags?: string[];
}

export interface LessonProgress {
  userId: string;
  lessonId: string;
  lastPositionSec: number;
  watchedRanges: [number, number][]; // [[0, 60], [120, 180]]
  isCompleted: boolean;
  completedAt?: string;
}

export interface ModuleRetentionStats {
  moduleId: string;
  moduleTitle: string;
  lessonsCompleted: number;
  totalLessons: number;
  completionPercent: number;
  retentionHealthPercent: number; // 0-100% computed via Ebbinghaus decay curve
  lastReviewedAt: string;
  daysSinceReview: number;
  fadingCardsCount: number;
  status: 'fresh' | 'fading' | 'critical';
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  weeklyTargetMinutes: number; // e.g. 120
  preferredStudyDays: number[]; // 1=Mon, 3=Wed, 5=Fri
  projectedCompletionDate: string;
  currentStreakDays: number;
  streakFreezesAvailable: number;
  enrolledAt: string;
  lastStudiedAt: string;
}

export interface StudyDayLog {
  date: string; // YYYY-MM-DD
  minutesStudied: number;
  lessonsCompletedCount: number;
  quizzesPassedCount: number;
  cardsReviewedCount: number;
  streakFrozen?: boolean;
}

export interface UserSkillProficiency {
  skillAxis: string;
  scorePercent: number; // 0 - 100
  totalAttempts: number;
  lastAssessedAt: string;
}

export interface VerifiableCertificate {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  courseSlug: string;
  issueDate: string;
  totalHoursStudied: number;
  capstoneScorePercent: number;
  verificationHash: string;
  skillBreakdown: { axis: string; proficiency: number }[];
  verifiedBy: string;
}

