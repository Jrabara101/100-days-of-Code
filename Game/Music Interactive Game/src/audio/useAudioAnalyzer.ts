import { useEffect, useCallback } from 'react';
import { globalAudioPipeline, PROCEDURAL_TRACKS } from './AudioPipeline';
import { useGameStore } from '@/store/useGameStore';

export function useAudioAnalyzer() {
  const {
    gameStatus,
    setGameStatus,
    setTrackMeta,
    settings,
    setSummaryOpen,
  } = useGameStore();

  // Register onEnded callback for audio
  useEffect(() => {
    globalAudioPipeline.onEndedCallback = () => {
      setGameStatus('GAME_OVER');
      setSummaryOpen(true);
    };
  }, [setGameStatus, setSummaryOpen]);

  // Sync volume with settings
  useEffect(() => {
    globalAudioPipeline.setVolume(settings.volume);
  }, [settings.volume]);

  const startProcedural = useCallback(
    (trackId: string = 'synthwave') => {
      const track = PROCEDURAL_TRACKS.find((t) => t.id === trackId) || PROCEDURAL_TRACKS[0];
      globalAudioPipeline.startProceduralSynth(track.id, settings.volume);
      setTrackMeta({
        title: `${track.title.toUpperCase()} (${track.bpm} BPM)`,
        duration: 180,
        currentTime: 0,
        bpm: track.bpm,
        sourceType: 'procedural',
      });
      setGameStatus('PLAYING');
    },
    [settings.volume, setTrackMeta, setGameStatus]
  );

  const loadAudioFile = useCallback(
    async (file: File) => {
      setGameStatus('LOADING_TRACK');
      try {
        const info = await globalAudioPipeline.loadFile(file, settings.volume);
        setTrackMeta({
          title: info.title.toUpperCase(),
          duration: info.duration,
          currentTime: 0,
          bpm: 128,
          sourceType: 'file',
        });
        setGameStatus('PLAYING');
        return true;
      } catch (err) {
        console.error('Failed to decode audio file:', err);
        setGameStatus('READY');
        return false;
      }
    },
    [settings.volume, setTrackMeta, setGameStatus]
  );

  const activateMicrophone = useCallback(async () => {
    setGameStatus('LOADING_TRACK');
    const success = await globalAudioPipeline.enableMicrophone();
    if (success) {
      setTrackMeta({
        title: 'LIVE MICROPHONE INPUT',
        duration: 9999,
        currentTime: 0,
        bpm: 120,
        sourceType: 'mic',
      });
      setGameStatus('PLAYING');
      return true;
    } else {
      setGameStatus('READY');
      return false;
    }
  }, [setTrackMeta, setGameStatus]);

  const pauseAudio = useCallback(() => {
    globalAudioPipeline.stopAudio();
    setGameStatus('PAUSED');
  }, [setGameStatus]);

  const resumeAudio = useCallback(() => {
    if (globalAudioPipeline.isProcedural) {
      globalAudioPipeline.startProceduralSynth(globalAudioPipeline.currentTrackId, settings.volume);
    } else {
      globalAudioPipeline.resume();
    }
    setGameStatus('PLAYING');
  }, [settings.volume, setGameStatus]);

  const togglePlay = useCallback(() => {
    if (gameStatus === 'PLAYING') {
      pauseAudio();
    } else if (gameStatus === 'PAUSED' || gameStatus === 'READY' || gameStatus === 'IDLE') {
      resumeAudio();
    }
  }, [gameStatus, pauseAudio, resumeAudio]);

  return {
    pipeline: globalAudioPipeline,
    startProcedural,
    loadAudioFile,
    activateMicrophone,
    pauseAudio,
    resumeAudio,
    togglePlay,
    proceduralTracks: PROCEDURAL_TRACKS,
  };
}
