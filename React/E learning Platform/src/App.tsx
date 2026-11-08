import React, { useState, useEffect } from 'react';
import { Navbar, NavigationTab } from './components/common/Navbar';
import { LearnerCommandDashboard } from './components/dashboard/LearnerCommandDashboard';
import { InteractiveCourseClassroom } from './components/classroom/InteractiveCourseClassroom';
import { PolymorphicQuizStage } from './components/quiz/PolymorphicQuizStage';
import { SkillTreeSyllabusView } from './components/syllabus/SkillTreeSyllabusView';
import { VerifiableCredentialPortal } from './components/certificate/VerifiableCredentialPortal';
import { MemoryVaultModal } from './components/dashboard/MemoryVaultModal';
import { learningEngine } from './services/learningEngine';
import { sounds } from './services/audioEffects';
import { Course, InVideoCheckpoint, Lesson } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [activeQuizId, setActiveQuizId] = useState<string>('quiz-mod-04-mastery');
  const [activeLessonId, setActiveLessonId] = useState<string>('les-04-03');
  const [initialSeekSeconds, setInitialSeekSeconds] = useState<number | undefined>(undefined);
  const [isMemoryVaultOpen, setIsMemoryVaultOpen] = useState<boolean>(false);

  // Synchronized state from LearningEngine
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollment, setEnrollment] = useState(learningEngine.getEnrollment());
  const [moduleRetentions, setModuleRetentions] = useState(learningEngine.getModuleRetention());
  const [skillProficiencies, setSkillProficiencies] = useState(learningEngine.getSkillProficiencies());
  const [studyLogs, setStudyLogs] = useState(learningEngine.getStudyLogs());
  const [dueCardsCount, setDueCardsCount] = useState(learningEngine.getDueSpacedRepetitionCards().length);

  const refreshState = () => {
    setCourses(learningEngine.getCourses());
    setEnrollment(learningEngine.getEnrollment());
    setModuleRetentions(learningEngine.getModuleRetention());
    setSkillProficiencies(learningEngine.getSkillProficiencies());
    setStudyLogs(learningEngine.getStudyLogs());
    setDueCardsCount(learningEngine.getDueSpacedRepetitionCards().length);
  };

  useEffect(() => {
    refreshState();
  }, []);

  const currentCourse: Course = courses[0] || learningEngine.getCourses()[0];

  // Find active lesson
  let currentLesson: Lesson = currentCourse.modules[3]?.lessons[2] || {
    id: 'les-04-03',
    moduleId: 'mod-04',
    courseId: currentCourse.id,
    sortOrder: 3,
    title: '04.3 — Consensus Algorithms & Raft Leader Election (Master Stage)',
    lessonType: 'video_lecture',
    durationSeconds: 1450,
    chapters: [],
    transcriptSegments: [],
    resources: []
  };

  // Find checkpoint questions for active lesson
  const inVideoCheckpoints: InVideoCheckpoint[] = [
    {
      id: 'quiz-invideo-04-3-check-1',
      cueTimestampSec: 495, // 08:15
      question: {
        id: 'q-invideo-815',
        quizId: 'quiz-invideo-04-3-check-1',
        questionType: 'multiple_choice',
        videoCueTimestampSec: 495,
        skillAxisTag: 'Security & Consensus',
        points: 10,
        promptMarkdown: `If Follower Node B's election timeout expires before receiving a heartbeat from the Leader, what state does Node B transition to first?`,
        optionsPayload: [
          { id: 'opt-c1', text: '[A] Candidate: Increments term, votes for self, and requests votes from peers.' },
          { id: 'opt-c2', text: '[B] Immediate Leader: Takes over cluster and broadcasts commits.' },
          { id: 'opt-c3', text: '[C] Offline Partition: Shuts down network interface and halts.' }
        ],
        correctAnswerPayload: 'opt-c1',
        explanationMarkdown: `**Correct! Node B becomes a Candidate.** It increments its term counter, casts a vote for itself, and requests votes from all other nodes. Playback smoothly resumes!`,
        remediationLessonId: 'les-04-03',
        remediationStartSec: 411,
        remediationEndSec: 494
      }
    }
  ];

  // Handlers
  const handleResumeLesson = (lessonId: string, timestampSec?: number) => {
    setActiveLessonId(lessonId);
    setInitialSeekSeconds(timestampSec);
    setCurrentTab('classroom');
  };

  const handleLaunchQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    setCurrentTab('quiz');
  };

  const handleRebalanceSchedule = (preferredDays: number[], weeklyMinutes: number) => {
    learningEngine.rebalanceSchedule(preferredDays, weeklyMinutes);
    refreshState();
  };

  const handleJumpToClassroomFromRemediation = (lessonId: string, timestampSec: number) => {
    setActiveLessonId(lessonId);
    setInitialSeekSeconds(timestampSec);
    setCurrentTab('classroom');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#090B10] text-slate-900 dark:text-white transition-colors flex flex-col">
      {/* Top Global Navigation & Habit Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => {
          sounds.playClick();
          setCurrentTab(tab);
        }}
        dueCardsCount={dueCardsCount}
        onOpenMemoryVault={() => setIsMemoryVaultOpen(true)}
        streakDays={enrollment.currentStreakDays}
        freezeShields={enrollment.streakFreezesAvailable}
      />

      {/* Main View Port */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <LearnerCommandDashboard
            course={currentCourse}
            enrollment={enrollment}
            moduleRetentions={moduleRetentions}
            skillProficiencies={skillProficiencies}
            studyLogs={studyLogs}
            dueCardsCount={dueCardsCount}
            onResumeLesson={handleResumeLesson}
            onLaunchQuiz={handleLaunchQuiz}
            onLaunchMemoryVault={() => setIsMemoryVaultOpen(true)}
            onRebalanceSchedule={handleRebalanceSchedule}
          />
        )}

        {currentTab === 'classroom' && (
          <InteractiveCourseClassroom
            course={currentCourse}
            lesson={currentLesson}
            checkpoints={inVideoCheckpoints}
            onOpenSyllabus={() => setCurrentTab('syllabus')}
            onNextLesson={() => handleLaunchQuiz('quiz-mod-04-mastery')}
            initialSeekTime={initialSeekSeconds}
          />
        )}

        {currentTab === 'quiz' && (
          <PolymorphicQuizStage
            quizId={activeQuizId}
            onExit={() => setCurrentTab('dashboard')}
            onOpenClassroom={handleJumpToClassroomFromRemediation}
            onViewCertificate={() => setCurrentTab('certificate')}
          />
        )}

        {currentTab === 'syllabus' && (
          <SkillTreeSyllabusView
            course={currentCourse}
            moduleRetentions={moduleRetentions}
            onSelectLesson={handleResumeLesson}
            onLaunchTestOutQuiz={handleLaunchQuiz}
            onLaunchMemoryVault={() => setIsMemoryVaultOpen(true)}
            onViewCertificate={() => setCurrentTab('certificate')}
          />
        )}

        {currentTab === 'certificate' && (
          <VerifiableCredentialPortal
            certificateId="CERT-2026-8841"
            onBackToDashboard={() => setCurrentTab('dashboard')}
          />
        )}
      </main>

      {/* Spaced-Repetition Memory Vault Modal */}
      <MemoryVaultModal
        isOpen={isMemoryVaultOpen}
        onClose={() => {
          setIsMemoryVaultOpen(false);
          refreshState();
        }}
        onJumpToRemediation={handleJumpToClassroomFromRemediation}
      />
    </div>
  );
}

export default App;
