import { useState, useEffect, useRef, useCallback } from 'react';
import { Chapter, InVideoCheckpoint, Lesson, TimedQuestionItem, TimestampedNote, TranscriptSegment } from '../types';
import { learningEngine } from '../services/learningEngine';
import { sounds } from '../services/audioEffects';

interface UseClassroomCoordinatorProps {
  lesson: Lesson;
  checkpoints?: InVideoCheckpoint[];
}

export function useClassroomCoordinator({ lesson, checkpoints = [] }: UseClassroomCoordinatorProps) {
  const [currentTime, setCurrentTime] = useState<number>(195); // Start at ~03:15 near first concept
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeCheckpoint, setActiveCheckpoint] = useState<InVideoCheckpoint | null>(null);
  const [passedCheckpointIds, setPassedCheckpointIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<TimestampedNote[]>([]);
  const [timedQuestions, setTimedQuestions] = useState<TimedQuestionItem[]>([]);
  const [isCameraFlashing, setIsCameraFlashing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load initial notes & Q&A
  useEffect(() => {
    setNotes(learningEngine.getNotes(lesson.id));
    setTimedQuestions(learningEngine.getTimedQA(lesson.id));
  }, [lesson.id]);

  // Active chapter computation
  const activeChapter: Chapter = lesson.chapters.reduce((acc, chap) => {
    if (currentTime >= chap.timestampSec) return chap;
    return acc;
  }, lesson.chapters[0] || { id: 'c0', title: 'Introduction', timestampSec: 0 });

  // Active transcript line computation
  const activeTranscriptSegment: TranscriptSegment | undefined = lesson.transcriptSegments.find(
    seg => currentTime * 1000 >= seg.startMs && currentTime * 1000 <= seg.endMs
  );

  // Main playback timer loop
  useEffect(() => {
    if (!isPlaying || activeCheckpoint) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 1;
        if (next >= lesson.durationSeconds) {
          setIsPlaying(false);
          learningEngine.markLessonCompleted(lesson.id, lesson.moduleId);
          sounds.playSuccess();
          return lesson.durationSeconds;
        }

        // Check for in-video checkpoints
        const trigger = checkpoints.find(
          cp => Math.floor(cp.cueTimestampSec) === Math.floor(next) && !passedCheckpointIds.has(cp.id)
        );

        if (trigger) {
          setIsPlaying(false);
          setActiveCheckpoint(trigger);
          sounds.playCheckpoint();
        }

        return next;
      });
    }, 1000 / playbackRate);

    return () => clearInterval(interval);
  }, [isPlaying, playbackRate, activeCheckpoint, checkpoints, passedCheckpointIds, lesson]);

  // Controls
  const togglePlay = useCallback(() => {
    sounds.playClick();
    setIsPlaying(p => !p);
  }, []);

  const seekTo = useCallback((seconds: number) => {
    sounds.playClick();
    const clamped = Math.max(0, Math.min(lesson.durationSeconds, Math.floor(seconds)));
    setCurrentTime(clamped);
  }, [lesson.durationSeconds]);

  const skipSeconds = useCallback((delta: number) => {
    sounds.playClick();
    setCurrentTime(prev => Math.max(0, Math.min(lesson.durationSeconds, prev + delta)));
  }, [lesson.durationSeconds]);

  const changeSpeed = useCallback((speed: number) => {
    sounds.playClick();
    setPlaybackRate(speed);
  }, []);

  // Resume playback after completing in-video checkpoint
  const resolveCheckpoint = useCallback((checkpointId: string) => {
    setPassedCheckpointIds(prev => new Set([...prev, checkpointId]));
    setActiveCheckpoint(null);
    sounds.playSuccess();
    // Resume playback smoothly within 300ms
    setTimeout(() => {
      setIsPlaying(true);
    }, 300);
  }, []);

  // Snap current video frame & timestamp into notes (⌘+B)
  const snapCurrentFrame = useCallback((userMarkdownNote?: string) => {
    sounds.playCameraShutter();
    setIsCameraFlashing(true);
    setTimeout(() => setIsCameraFlashing(false), 350);

    // Generate snapshot representation for the current time
    let snapshotUrl = '';
    if (canvasRef.current) {
      try {
        snapshotUrl = canvasRef.current.toDataURL('image/png');
      } catch {
        // Fallback to SVG diagram
      }
    }

    if (!snapshotUrl) {
      const timecode = learningEngine.formatTimecode(currentTime);
      snapshotUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%2311141C"/><text x="15" y="30" fill="%236366F1" font-size="12" font-family="monospace">RAFT STATE MACHINE @ ${timecode}</text><circle cx="60" cy="90" r="30" fill="%233B82F6"/><text x="40" y="95" fill="white" font-size="10">Leader (A)</text><line x1="90" y1="90" x2="160" y2="90" stroke="%2310B981" stroke-width="2"/><circle cx="190" cy="90" r="30" fill="%2310B981"/><text x="170" y="95" fill="white" font-size="10">Follower</text><text x="15" y="155" fill="%238E98AE" font-size="11">Heartbeat ACK Quorum Achieved</text></svg>`;
    }

    const newNote = learningEngine.createNote({
      userId: 'usr-scholar-2026',
      lessonId: lesson.id,
      courseId: lesson.courseId,
      timestampSec: Math.floor(currentTime),
      frameSnapshotUrl: snapshotUrl,
      contentMarkdown: userMarkdownNote || `Captured slide snapshot at \`${learningEngine.formatTimecode(currentTime)}\`.`
    });

    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, [currentTime, lesson]);

  // Global Keyboard Shortcuts (Space for Play/Pause, ⌘+B for Frame Snap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        snapCurrentFrame();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(10);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, snapCurrentFrame, skipSeconds]);

  return {
    currentTime,
    isPlaying,
    playbackRate,
    activeChapter,
    activeTranscriptSegment,
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
    formatTimecode: learningEngine.formatTimecode
  };
}

