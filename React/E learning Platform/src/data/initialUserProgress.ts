import { Enrollment, ModuleRetentionStats, SpacedRepetitionCard, StudyDayLog, TimestampedNote, UserSkillProficiency } from '../types';

export const INITIAL_ENROLLMENT: Enrollment = {
  id: 'enr-usr-1',
  userId: 'usr-scholar-2026',
  courseId: 'course-dist-sys-01',
  weeklyTargetMinutes: 120,
  preferredStudyDays: [1, 3, 5], // Monday, Wednesday, Friday
  projectedCompletionDate: '2026-12-18',
  currentStreakDays: 18,
  streakFreezesAvailable: 2,
  enrolledAt: '2026-10-01T08:00:00Z',
  lastStudiedAt: new Date().toISOString()
};

export const INITIAL_MODULE_RETENTION: ModuleRetentionStats[] = [
  {
    moduleId: 'mod-01',
    moduleTitle: 'Module 01: CAP Theorem & Consistency Models',
    lessonsCompleted: 2,
    totalLessons: 2,
    completionPercent: 100,
    retentionHealthPercent: 74,
    lastReviewedAt: '2026-10-18T10:00:00Z',
    daysSinceReview: 21,
    fadingCardsCount: 3,
    status: 'fading'
  },
  {
    moduleId: 'mod-02',
    moduleTitle: 'Module 02: Consistent Hashing & Ring Geometry',
    lessonsCompleted: 1,
    totalLessons: 1,
    completionPercent: 100,
    retentionHealthPercent: 96,
    lastReviewedAt: '2026-11-04T14:30:00Z',
    daysSinceReview: 4,
    fadingCardsCount: 0,
    status: 'fresh'
  },
  {
    moduleId: 'mod-03',
    moduleTitle: 'Module 03: Replication Logs & State Machine Primitives',
    lessonsCompleted: 1,
    totalLessons: 1,
    completionPercent: 100,
    retentionHealthPercent: 68,
    lastReviewedAt: '2026-10-15T09:00:00Z',
    daysSinceReview: 24,
    fadingCardsCount: 3,
    status: 'fading'
  },
  {
    moduleId: 'mod-04',
    moduleTitle: 'Module 04: Raft Consensus, Leader Election & Log Replication',
    lessonsCompleted: 2,
    totalLessons: 3,
    completionPercent: 66.7,
    retentionHealthPercent: 92,
    lastReviewedAt: new Date().toISOString(),
    daysSinceReview: 0,
    fadingCardsCount: 0,
    status: 'fresh'
  },
  {
    moduleId: 'mod-05',
    moduleTitle: 'Module 05: Distributed Transactions, 2PC & Sagas',
    lessonsCompleted: 0,
    totalLessons: 1,
    completionPercent: 0,
    retentionHealthPercent: 0,
    lastReviewedAt: '',
    daysSinceReview: 0,
    fadingCardsCount: 0,
    status: 'fresh'
  }
];

export const INITIAL_SKILL_PROFICIENCIES: UserSkillProficiency[] = [
  { skillAxis: 'System Design', scorePercent: 92, totalAttempts: 24, lastAssessedAt: '2026-11-06' },
  { skillAxis: 'Database Indexing', scorePercent: 88, totalAttempts: 18, lastAssessedAt: '2026-11-05' },
  { skillAxis: 'Caching & Queues', scorePercent: 79, totalAttempts: 15, lastAssessedAt: '2026-11-04' },
  { skillAxis: 'Observability', scorePercent: 64, totalAttempts: 11, lastAssessedAt: '2026-11-02' },
  { skillAxis: 'Security & Consensus', scorePercent: 85, totalAttempts: 20, lastAssessedAt: '2026-11-07' }
];

export const INITIAL_SPACED_REPETITION_CARDS: SpacedRepetitionCard[] = [
  {
    id: 'srs-card-1',
    userId: 'usr-scholar-2026',
    questionId: 'q-srs-cap-1',
    courseId: 'course-dist-sys-01',
    moduleTitle: 'Module 01: CAP Theorem & Partitioning',
    questionPrompt: 'In PACELC theorem, what does the "ELC" acronym stand for when no partition is present?',
    questionType: 'multiple_choice',
    skillAxisTag: 'System Design',
    easinessFactor: 2.1,
    intervalDays: 1,
    repetitions: 1,
    lastReviewedAt: '2026-10-18T10:00:00Z',
    nextReviewAt: new Date(Date.now() - 3600000).toISOString(), // Due today
    remediationClip: {
      lessonId: 'les-01-01',
      lessonTitle: '01.1 — The Physics of Latency & PACELC Tradeoffs',
      startSec: 720,
      endSec: 760
    }
  },
  {
    id: 'srs-card-2',
    userId: 'usr-scholar-2026',
    questionId: 'q-srs-cap-2',
    courseId: 'course-dist-sys-01',
    moduleTitle: 'Module 01: CAP Theorem & Partitioning',
    questionPrompt: 'Why does Linearizability require strict real-time ordering rather than mere causal sequencing?',
    questionType: 'multiple_choice',
    skillAxisTag: 'System Design',
    easinessFactor: 2.2,
    intervalDays: 2,
    repetitions: 1,
    lastReviewedAt: '2026-10-18T10:00:00Z',
    nextReviewAt: new Date(Date.now() - 7200000).toISOString(),
    remediationClip: {
      lessonId: 'les-01-02',
      lessonTitle: '01.2 — Eventual vs Linearizable Consistency',
      startSec: 200,
      endSec: 240
    }
  },
  {
    id: 'srs-card-3',
    userId: 'usr-scholar-2026',
    questionId: 'q-srs-wal-1',
    courseId: 'course-dist-sys-01',
    moduleTitle: 'Module 03: Replication Logs',
    questionPrompt: 'What key disk property makes Write-Ahead Logging (WAL) orders of magnitude faster than random writes?',
    questionType: 'multiple_choice',
    skillAxisTag: 'Database Indexing',
    easinessFactor: 2.3,
    intervalDays: 1,
    repetitions: 0,
    lastReviewedAt: '2026-10-15T09:00:00Z',
    nextReviewAt: new Date(Date.now() - 10000000).toISOString(),
    remediationClip: {
      lessonId: 'les-03-01',
      lessonTitle: '03.1 — Anatomy of an Append-Only WAL',
      startSec: 15,
      endSec: 50
    }
  },
  {
    id: 'srs-card-4',
    userId: 'usr-scholar-2026',
    questionId: 'q-srs-wal-2',
    courseId: 'course-dist-sys-01',
    moduleTitle: 'Module 03: Replication Logs',
    questionPrompt: 'How does Log Compaction via snapshots prevent out-of-disk failures in State Machine Replication?',
    questionType: 'multiple_choice',
    skillAxisTag: 'Database Indexing',
    easinessFactor: 2.0,
    intervalDays: 1,
    repetitions: 0,
    lastReviewedAt: '2026-10-15T09:00:00Z',
    nextReviewAt: new Date(Date.now() - 5000000).toISOString()
  },
  {
    id: 'srs-card-5',
    userId: 'usr-scholar-2026',
    questionId: 'q-srs-cap-3',
    courseId: 'course-dist-sys-01',
    moduleTitle: 'Module 01: CAP Theorem & Partitioning',
    questionPrompt: 'Can a system provide both 100% Availability and Linearizable Consistency during a complete cross-region network partition?',
    questionType: 'multiple_choice',
    skillAxisTag: 'System Design',
    easinessFactor: 2.4,
    intervalDays: 2,
    repetitions: 1,
    lastReviewedAt: '2026-10-18T10:00:00Z',
    nextReviewAt: new Date(Date.now() - 1000000).toISOString()
  },
  {
    id: 'srs-card-6',
    userId: 'usr-scholar-2026',
    questionId: 'q-srs-wal-3',
    courseId: 'course-dist-sys-01',
    moduleTitle: 'Module 03: Replication Logs',
    questionPrompt: 'In state machine replication, what happens if an uncommitted entry differs between two replica logs?',
    questionType: 'multiple_choice',
    skillAxisTag: 'Security & Consensus',
    easinessFactor: 2.1,
    intervalDays: 1,
    repetitions: 0,
    lastReviewedAt: '2026-10-15T09:00:00Z',
    nextReviewAt: new Date(Date.now() - 2000000).toISOString()
  }
];

export const INITIAL_TIMESTAMPED_NOTES: TimestampedNote[] = [
  {
    id: 'note-1',
    userId: 'usr-scholar-2026',
    lessonId: 'les-04-03',
    courseId: 'course-dist-sys-01',
    timestampSec: 198, // 03:18
    frameSnapshotUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170" viewBox="0 0 300 170"><rect width="300" height="170" fill="%23171B26"/><text x="15" y="30" fill="%23A855F7" font-size="12" font-family="monospace">TIMING INVARIANT DIAGRAM @ 03:18</text><rect x="20" y="50" width="100" height="30" rx="4" fill="%234F46E5"/><text x="30" y="70" fill="white" font-size="11" font-family="sans-serif">Heartbeat 15-50ms</text><path d="M 125 65 L 165 65" stroke="%2310B981" stroke-width="2" marker-end="url(%23arr)"/><rect x="170" y="50" width="110" height="30" rx="4" fill="%2310B981"/><text x="180" y="70" fill="white" font-size="11" font-family="sans-serif">Timeout 150-300ms</text><text x="20" y="125" fill="%238E98AE" font-size="11">Ratio: 10x differential prevents jitter</text></svg>',
    contentMarkdown: `Heartbeat interval must be at least an order of magnitude smaller than election timeout (\`15ms\` vs \`150ms–300ms\`). This ensures followers receive regular heartbeats before their timers expire.`,
    createdAt: '2026-11-07T14:20:00Z',
    tags: ['timing-invariants', 'raft-paper']
  },
  {
    id: 'note-2',
    userId: 'usr-scholar-2026',
    lessonId: 'les-04-03',
    courseId: 'course-dist-sys-01',
    timestampSec: 495, // 08:15
    frameSnapshotUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="170" viewBox="0 0 300 170"><rect width="300" height="170" fill="%23171B26"/><circle cx="50" cy="85" r="28" fill="%2364748B"/><text x="32" y="90" fill="white" font-size="11">Follower</text><path d="M 85 85 L 140 85" stroke="%23A855F7" stroke-width="2"/><circle cx="170" cy="85" r="28" fill="%23F59E0B"/><text x="145" y="90" fill="white" font-size="10">Candidate (Term+1)</text><text x="20" y="145" fill="%2334D399" font-size="11">Vote for self + RequestVote RPCs</text></svg>',
    contentMarkdown: `**Follower -> Candidate Transition:**\nWhen timeout fires, node transitions to Candidate, increments term, votes for self, and starts election. Quorum majority (\`N/2 + 1\`) is required to become Leader.`,
    createdAt: '2026-11-07T14:35:00Z',
    tags: ['leader-election', 'terms']
  }
];

// Generate 365 days of activity for GitHub-style heatmap
export function generate365DayLogs(): StudyDayLog[] {
  const logs: StudyDayLog[] = [];
  const now = new Date('2026-11-08');

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Seed realistic study pattern
    const dayOfWeek = d.getDay();
    const isPreferredDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5; // Mon, Wed, Fri
    const isRecentStreak = i <= 18;

    let minutes = 0;
    let lessons = 0;
    let quizzes = 0;
    let cards = 0;
    let streakFrozen = false;

    if (isRecentStreak) {
      if (i === 4) {
        // Freeze shield used on sick day
        streakFrozen = true;
        minutes = 0;
      } else {
        minutes = 35 + ((i * 7) % 45);
        lessons = 1 + (i % 2);
        quizzes = i % 3 === 0 ? 1 : 0;
        cards = 4 + (i % 5);
      }
    } else if (isPreferredDay && Math.random() > 0.25) {
      minutes = 25 + Math.floor(Math.random() * 50);
      lessons = 1 + Math.floor(Math.random() * 2);
      quizzes = Math.random() > 0.5 ? 1 : 0;
      cards = Math.floor(Math.random() * 8);
    } else if (Math.random() > 0.65) {
      minutes = 15 + Math.floor(Math.random() * 30);
      cards = 3 + Math.floor(Math.random() * 4);
    }

    logs.push({
      date: dateStr,
      minutesStudied: minutes,
      lessonsCompletedCount: lessons,
      quizzesPassedCount: quizzes,
      cardsReviewedCount: cards,
      streakFrozen
    });
  }

  return logs;
}

