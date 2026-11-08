import React, { useState } from 'react';
import { 
  Menu, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  MessageSquare, 
  FolderGit2, 
  Sparkles,
  BookOpen,
  Check,
  ChevronRight
} from 'lucide-react';
import { Course, InVideoCheckpoint, Lesson } from '../../types';
import { useClassroomCoordinator } from '../../hooks/useClassroomCoordinator';
import { VideoStage } from './VideoStage';
import { TimestampedNotesRail } from './TimestampedNotesRail';
import { TranscriptRail } from './TranscriptRail';
import { TimedQARail } from './TimedQARail';
import { LabFilesRail } from './LabFilesRail';
import { sounds } from '../../services/audioEffects';
import { learningEngine } from '../../services/learningEngine';

interface InteractiveCourseClassroomProps {
  course: Course;
  lesson: Lesson;
  checkpoints?: InVideoCheckpoint[];
  onOpenSyllabus: () => void;
  onNextLesson?: () => void;
  initialSeekTime?: number;
}

type CompanionTab = 'notes' | 'transcript' | 'qa' | 'files';

export const InteractiveCourseClassroom: React.FC<InteractiveCourseClassroomProps> = ({
  course,
  lesson,
  checkpoints = [],
  onOpenSyllabus,
  onNextLesson,
  initialSeekTime
}) => {
  const [activeTab, setActiveTab] = useState<CompanionTab>('notes');
  const [isCompletedState, setIsCompletedState] = useState<boolean>(false);

  const {
    currentTime,
    isPlaying,
    playbackRate,
    activeChapter,
    activeCheckpoint,
    passedCheckpointIds,
    notes,
    timedQuestions,
    isCameraFlashing,
    canvasRef,
    togglePlay,
    seekTo,
    skipSeconds,
    changeSpeed,
    resolveCheckpoint,
    snapCurrentFrame,
    formatTimecode
  } = useClassroomCoordinator({ lesson, checkpoints });

  // Initial seek on mount if requested (e.g. Resume at 11:42)
  React.useEffect(() => {
    if (initialSeekTime !== undefined) {
      seekTo(initialSeekTime);
    }
  }, [initialSeekTime, seekTo]);

  const handleMarkComplete = () => {
    sounds.playSuccess();
    setIsCompletedState(true);
    learningEngine.markLessonCompleted(lesson.id, lesson.moduleId);
  };

  const handleSaveNote = (content: string, attachSnapshot: boolean) => {
    snapCurrentFrame(content);
  };

  const handleDeleteNote = (noteId: string) => {
    learningEngine.deleteNote(noteId);
  };

  const handleAskQuestion = (questionText: string) => {
    learningEngine.addQuestion({
      lessonId: lesson.id,
      timestampSec: Math.floor(currentTime),
      author: 'Alex Mercer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      question: questionText
    });
  };

  const handleUpvoteQuestion = (questionId: string) => {
    learningEngine.upvoteQuestion(questionId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#090B10] text-white overflow-hidden">
      {/* =========================================================================
          TOP CLASSROOM BREADCRUMB & PROGRESS RIBBON (h-14)
          ========================================================================= */}
      <div className="h-14 bg-[#0B0D13] border-b border-white/10 px-4 flex items-center justify-between text-white shrink-0">
        {/* Left: Syllabus Drawer & Lesson Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { sounds.playClick(); onOpenSyllabus(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Syllabus Drawer</span>
          </button>

          <div className="h-4 w-px bg-white/20" />

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 hidden md:inline">{course.title.split('&')[0]}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden md:inline" />
            <span className="font-semibold text-white">{lesson.title}</span>
          </div>
        </div>

        {/* Center: Segmented Lesson Step Nodes */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-3.5 h-3.5" /> Intro
          </span>
          <span className="text-white/20">——</span>
          <span className={`flex items-center gap-1 ${
            passedCheckpointIds.has('quiz-invideo-04-3-check-1') ? 'text-emerald-400' : 'text-violet-400 font-bold'
          }`}>
            <span className="w-2 h-2 rotate-45 bg-current inline-block" />
            08:15 Checkpoint Quiz
          </span>
          <span className="text-white/20">——</span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full border border-current inline-block" />
            14:30 Split-Brain Lab
          </span>
          <span className="text-white/20">——</span>
          <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2 h-2 rounded-full border border-current inline-block" />
            Module Quiz
          </span>
        </div>

        {/* Right: Mark Complete & Next Lesson */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkComplete}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isCompletedState
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/10 hover:bg-white/20 text-slate-200'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isCompletedState ? 'text-emerald-400' : ''}`} />
            <span>{isCompletedState ? 'Lesson Mastered' : 'Mark Complete'}</span>
          </button>

          {onNextLesson && (
            <button
              onClick={() => { sounds.playClick(); onNextLesson(); }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>Next: Module Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2-COLUMN RESIZABLE LEARNING STAGE
          ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane (7 or 8 Columns): Video & In-Video Checkpoint Stage */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 border-white/10">
          <VideoStage
            currentTime={currentTime}
            durationSeconds={lesson.durationSeconds}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            activeChapter={activeChapter}
            activeCheckpoint={activeCheckpoint}
            passedCheckpointIds={passedCheckpointIds}
            notes={notes}
            isCameraFlashing={isCameraFlashing}
            canvasRef={canvasRef}
            onTogglePlay={togglePlay}
            onSeekTo={seekTo}
            onSkipSeconds={skipSeconds}
            onChangeSpeed={changeSpeed}
            onResolveCheckpoint={resolveCheckpoint}
            onSnapFrame={() => snapCurrentFrame()}
            formatTimecode={formatTimecode}
          />
        </div>

        {/* Right Pane (4 or 5 Columns): Companion Rail (Tabs: Notes, Transcript, Q&A, Files) */}
        <div className="lg:col-span-5 xl:col-span-4 border-l border-white/10 bg-[#11141C] flex flex-col overflow-hidden">
          {/* Segmented Top Companion Tabs */}
          <div className="h-11 px-3 bg-[#0B0D13] border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 w-full">
              <button
                onClick={() => { sounds.playClick(); setActiveTab('notes'); }}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'notes'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>📝 Notes</span>
                <span className="font-mono text-[10px] opacity-80">({notes.length})</span>
              </button>

              <button
                onClick={() => { sounds.playClick(); setActiveTab('transcript'); }}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'transcript'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>📜 Transcript</span>
              </button>

              <button
                onClick={() => { sounds.playClick(); setActiveTab('qa'); }}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'qa'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>💬 Q&A</span>
                <span className="font-mono text-[10px] opacity-80">({timedQuestions.length})</span>
              </button>

              <button
                onClick={() => { sounds.playClick(); setActiveTab('files'); }}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'files'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>📦 Labs</span>
              </button>
            </div>
          </div>

          {/* Active Companion Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'notes' && (
              <TimestampedNotesRail
                notes={notes}
                currentTime={currentTime}
                onSeekTo={seekTo}
                onSaveNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
                formatTimecode={formatTimecode}
              />
            )}

            {activeTab === 'transcript' && (
              <TranscriptRail
                transcriptSegments={lesson.transcriptSegments}
                currentTime={currentTime}
                onSeekTo={seekTo}
                formatTimecode={formatTimecode}
              />
            )}

            {activeTab === 'qa' && (
              <TimedQARail
                questions={timedQuestions}
                currentTime={currentTime}
                onSeekTo={seekTo}
                onUpvote={handleUpvoteQuestion}
                onAskQuestion={handleAskQuestion}
                formatTimecode={formatTimecode}
              />
            )}

            {activeTab === 'files' && (
              <LabFilesRail
                resources={lesson.resources}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

