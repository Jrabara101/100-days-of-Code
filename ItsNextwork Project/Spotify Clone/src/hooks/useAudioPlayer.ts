import { useState, useCallback, useRef, useEffect } from 'react';
import { ITrack } from '@/types';
import { mcpAudioService } from '@/services/MCPAudioService';

interface AudioPlayerState {
  currentTrack: ITrack | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  isMinimized: boolean;
  queue: ITrack[];
  currentIndex: number;
  playbackMode: 'audio' | 'simulation' | null;
}

const FAVORITES_STORAGE_KEY = 'nextsound_favorite_tracks';
const RECENT_STORAGE_KEY = 'nextsound_recent_tracks';
const MAX_FAVORITE_TRACKS = 50;
const MAX_RECENT_TRACKS = 20;
const FALLBACK_DURATION_MS = 30000;
const SIMULATION_TICK_MS = 250;

const getTrackIdentifier = (track: ITrack) => track.spotify_id || track.id;

const isSameTrack = (first: ITrack, second: ITrack) =>
  getTrackIdentifier(first) === getTrackIdentifier(second);

const parseStoredTracks = (key: string): ITrack[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const normalizeDuration = (duration?: number) => {
  if (!duration || Number.isNaN(duration)) return FALLBACK_DURATION_MS;
  return duration < 1000 ? duration * 1000 : duration;
};

export const useAudioPlayer = () => {
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    volume: 80,
    isShuffled: false,
    repeatMode: 'off',
    isMinimized: false,
    queue: [],
    currentIndex: 0,
    playbackMode: null,
  });
  const [favoriteTracks, setFavoriteTracks] = useState<ITrack[]>(() =>
    parseStoredTracks(FAVORITES_STORAGE_KEY)
  );
  const [recentlyPlayed, setRecentlyPlayed] = useState<ITrack[]>(() =>
    parseStoredTracks(RECENT_STORAGE_KEY)
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackRequestRef = useRef(0);
  const stateRef = useRef(state);
  const handleTrackEndRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteTracks));
  }, [favoriteTracks]);

  useEffect(() => {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  const clearProgressInterval = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const clearSimulationInterval = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
  }, []);

  const addRecentTrack = useCallback((track: ITrack) => {
    setRecentlyPlayed((prev) => {
      const deduped = prev.filter((item) => !isSameTrack(item, track));
      return [track, ...deduped].slice(0, MAX_RECENT_TRACKS);
    });
  }, []);

  const toggleTrackFavorite = useCallback((track: ITrack) => {
    setFavoriteTracks((prev) => {
      const isAlreadyFavorite = prev.some((item) => isSameTrack(item, track));

      if (isAlreadyFavorite) {
        return prev.filter((item) => !isSameTrack(item, track));
      }

      return [track, ...prev].slice(0, MAX_FAVORITE_TRACKS);
    });
  }, []);

  const clearRecentlyPlayed = useCallback(() => {
    setRecentlyPlayed([]);
  }, []);

  const startSimulationLoop = useCallback(
    (durationMs: number, startProgress: number) => {
      clearSimulationInterval();

      const safeDuration = Math.max(durationMs, 1000);
      const progressStep = (SIMULATION_TICK_MS / safeDuration) * 100;
      let simulatedProgress = startProgress;

      simulationInterval.current = setInterval(() => {
        simulatedProgress = Math.min(100, simulatedProgress + progressStep);
        setState((prev) => ({ ...prev, progress: simulatedProgress }));

        if (simulatedProgress >= 100) {
          clearSimulationInterval();
          setTimeout(() => {
            handleTrackEndRef.current?.();
          }, 0);
        }
      }, SIMULATION_TICK_MS);
    },
    [clearSimulationInterval]
  );

  const startSimulationPlayback = useCallback(
    (
      track: ITrack,
      queue: ITrack[],
      index: number,
      startProgress = 0,
      shouldStoreRecent = true
    ) => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }

      const clampedProgress = clamp(startProgress, 0, 100);

      setState((prev) => ({
        ...prev,
        currentTrack: track,
        queue,
        currentIndex: index,
        progress: clampedProgress,
        isPlaying: true,
        playbackMode: 'simulation',
      }));

      if (shouldStoreRecent) {
        addRecentTrack(track);
      }

      startSimulationLoop(normalizeDuration(track.duration), clampedProgress);
    },
    [addRecentTrack, startSimulationLoop]
  );

  const playFromQueueIndex = useCallback(
    async (index: number, queueInput?: ITrack[]) => {
      const queue = queueInput?.length ? queueInput : stateRef.current.queue;
      if (!queue.length) return;

      const safeIndex = clamp(index, 0, queue.length - 1);
      const baseTrack = queue[safeIndex];
      const requestId = ++playbackRequestRef.current;

      clearSimulationInterval();

      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
        audio.load();
        audio.volume = stateRef.current.volume / 100;
      }

      setState((prev) => ({
        ...prev,
        currentTrack: baseTrack,
        queue,
        currentIndex: safeIndex,
        isPlaying: true,
        progress: 0,
        playbackMode: null,
        isMinimized: false,
      }));
      addRecentTrack(baseTrack);

      let resolvedTrack = baseTrack;
      if (!resolvedTrack.preview_url) {
        try {
          resolvedTrack = await mcpAudioService.enhanceTrackWithPreview(baseTrack);
        } catch {
          resolvedTrack = baseTrack;
        }
      }

      if (playbackRequestRef.current !== requestId) return;

      if (resolvedTrack.preview_url && audioRef.current) {
        const playableAudio = audioRef.current;

        try {
          playableAudio.src = resolvedTrack.preview_url;
          playableAudio.volume = stateRef.current.volume / 100;
          await playableAudio.play();

          if (playbackRequestRef.current !== requestId) return;

          setState((prev) => ({
            ...prev,
            currentTrack: resolvedTrack,
            queue,
            currentIndex: safeIndex,
            isPlaying: true,
            progress: 0,
            playbackMode: 'audio',
          }));
          return;
        } catch {
          // Fall back to simulated playback when preview is unavailable or blocked
        }
      }

      startSimulationPlayback(resolvedTrack, queue, safeIndex, 0, false);
    },
    [addRecentTrack, clearSimulationInterval, startSimulationPlayback]
  );

  const getNextIndex = useCallback(
    (
      direction: 1 | -1,
      snapshot: AudioPlayerState,
      allowWrap: boolean
    ): number | null => {
      const queueLength = snapshot.queue.length;
      if (!queueLength) return null;

      if (snapshot.isShuffled && queueLength > 1) {
        let candidate = snapshot.currentIndex;
        while (candidate === snapshot.currentIndex) {
          candidate = Math.floor(Math.random() * queueLength);
        }
        return candidate;
      }

      const candidate = snapshot.currentIndex + direction;
      if (candidate >= 0 && candidate < queueLength) {
        return candidate;
      }

      if (!allowWrap) {
        return null;
      }

      return direction === 1 ? 0 : queueLength - 1;
    },
    []
  );

  const handleTrackEnd = useCallback(() => {
    const snapshot = stateRef.current;
    if (!snapshot.currentTrack) return;

    if (snapshot.repeatMode === 'one') {
      void playFromQueueIndex(snapshot.currentIndex);
      return;
    }

    const nextIndex = getNextIndex(1, snapshot, snapshot.repeatMode === 'all');

    if (nextIndex === null) {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        progress: 100,
        playbackMode: null,
      }));
      return;
    }

    void playFromQueueIndex(nextIndex);
  }, [getNextIndex, playFromQueueIndex]);

  useEffect(() => {
    handleTrackEndRef.current = handleTrackEnd;
  }, [handleTrackEnd]);

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.preload = 'auto';
    audio.volume = stateRef.current.volume / 100;

    const onEnded = () => {
      handleTrackEndRef.current?.();
    };

    const onError = () => {
      const snapshot = stateRef.current;
      if (!snapshot.currentTrack) return;

      startSimulationPlayback(
        snapshot.currentTrack,
        snapshot.queue,
        snapshot.currentIndex,
        snapshot.progress,
        false
      );
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);

      clearProgressInterval();
      clearSimulationInterval();

      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [clearProgressInterval, clearSimulationInterval, startSimulationPlayback]);

  useEffect(() => {
    if (!state.isPlaying || state.playbackMode !== 'audio') {
      clearProgressInterval();
      return;
    }

    clearProgressInterval();
    progressInterval.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || !audio.duration || Number.isNaN(audio.duration)) return;

      const progressValue = (audio.currentTime / audio.duration) * 100;
      setState((prev) => ({ ...prev, progress: clamp(progressValue, 0, 100) }));
    }, SIMULATION_TICK_MS);

    return () => {
      clearProgressInterval();
    };
  }, [clearProgressInterval, state.isPlaying, state.playbackMode]);

  const playTrack = useCallback(
    (track: ITrack, queueInput?: ITrack[]) => {
      const snapshot = stateRef.current;
      const queue =
        queueInput && queueInput.length > 0
          ? queueInput
          : snapshot.queue.length > 0
          ? snapshot.queue
          : [track];
      const targetIndex = Math.max(
        queue.findIndex((item) => isSameTrack(item, track)),
        0
      );

      const isCurrentTrack =
        snapshot.currentTrack && isSameTrack(snapshot.currentTrack, queue[targetIndex]);

      if (isCurrentTrack) {
        if (queueInput && queueInput.length > 0) {
          setState((prev) => ({
            ...prev,
            queue,
            currentIndex: targetIndex,
          }));
        }

        if (snapshot.isPlaying) {
          audioRef.current?.pause();
          clearSimulationInterval();
          setState((prev) => ({ ...prev, isPlaying: false }));
        } else {
          if (snapshot.playbackMode === 'audio' && audioRef.current) {
            audioRef.current.play().catch(() => {
              if (snapshot.currentTrack) {
                startSimulationPlayback(
                  snapshot.currentTrack,
                  snapshot.queue,
                  snapshot.currentIndex,
                  snapshot.progress,
                  false
                );
              }
            });
            setState((prev) => ({ ...prev, isPlaying: true }));
          } else if (snapshot.currentTrack) {
            startSimulationPlayback(
              snapshot.currentTrack,
              snapshot.queue,
              snapshot.currentIndex,
              snapshot.progress,
              false
            );
          }
        }
        return;
      }

      void playFromQueueIndex(targetIndex, queue);
    },
    [clearSimulationInterval, playFromQueueIndex, startSimulationPlayback]
  );

  const togglePlay = useCallback(() => {
    const snapshot = stateRef.current;
    if (!snapshot.currentTrack) return;

    if (snapshot.isPlaying) {
      audioRef.current?.pause();
      clearSimulationInterval();
      setState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }

    if (snapshot.playbackMode === 'audio' && audioRef.current) {
      audioRef.current.play().catch(() => {
        if (snapshot.currentTrack) {
          startSimulationPlayback(
            snapshot.currentTrack,
            snapshot.queue,
            snapshot.currentIndex,
            snapshot.progress,
            false
          );
        }
      });
      setState((prev) => ({ ...prev, isPlaying: true }));
      return;
    }

    startSimulationPlayback(
      snapshot.currentTrack,
      snapshot.queue,
      snapshot.currentIndex,
      snapshot.progress,
      false
    );
  }, [clearSimulationInterval, startSimulationPlayback]);

  const seek = useCallback(
    (position: number) => {
      const clampedPosition = clamp(position, 0, 100);
      const snapshot = stateRef.current;
      setState((prev) => ({ ...prev, progress: clampedPosition }));

      if (snapshot.playbackMode === 'audio' && audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = (clampedPosition / 100) * audioRef.current.duration;
      }

      if (
        snapshot.playbackMode === 'simulation' &&
        snapshot.isPlaying &&
        snapshot.currentTrack
      ) {
        startSimulationLoop(
          normalizeDuration(snapshot.currentTrack.duration),
          clampedPosition
        );
      }
    },
    [startSimulationLoop]
  );

  const skipNext = useCallback(() => {
    const snapshot = stateRef.current;
    if (!snapshot.queue.length) return;

    const nextIndex = getNextIndex(1, snapshot, snapshot.repeatMode === 'all');
    if (nextIndex === null) {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        progress: 100,
        playbackMode: null,
      }));
      return;
    }

    void playFromQueueIndex(nextIndex);
  }, [getNextIndex, playFromQueueIndex]);

  const skipPrevious = useCallback(() => {
    const snapshot = stateRef.current;
    if (!snapshot.queue.length) return;

    if (snapshot.progress > 5) {
      seek(0);
      return;
    }

    const previousIndex = getNextIndex(-1, snapshot, snapshot.repeatMode === 'all');
    if (previousIndex === null) {
      seek(0);
      return;
    }

    void playFromQueueIndex(previousIndex);
  }, [getNextIndex, playFromQueueIndex, seek]);

  const setVolume = useCallback((volume: number) => {
    const normalizedVolume = clamp(volume, 0, 100);
    setState((prev) => ({ ...prev, volume: normalizedVolume }));

    if (audioRef.current) {
      audioRef.current.volume = normalizedVolume / 100;
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((prev) => ({ ...prev, isShuffled: !prev.isShuffled }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
      const currentModeIndex = modes.indexOf(prev.repeatMode);
      const nextMode = modes[(currentModeIndex + 1) % modes.length];

      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  const toggleFavorite = useCallback(() => {
    const current = stateRef.current.currentTrack;
    if (!current) return;
    toggleTrackFavorite(current);
  }, [toggleTrackFavorite]);

  const toggleMinimize = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  const closePlayer = useCallback(() => {
    playbackRequestRef.current += 1;
    clearProgressInterval();
    clearSimulationInterval();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    setState((prev) => ({
      ...prev,
      currentTrack: null,
      isPlaying: false,
      progress: 0,
      queue: [],
      currentIndex: 0,
      playbackMode: null,
      isMinimized: false,
    }));
  }, [clearProgressInterval, clearSimulationInterval]);

  const isTrackFavorite = useCallback(
    (trackId: string) =>
      favoriteTracks.some((track) => getTrackIdentifier(track) === trackId),
    [favoriteTracks]
  );

  return {
    // State
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    progress: state.progress,
    volume: state.volume,
    isShuffled: state.isShuffled,
    repeatMode: state.repeatMode,
    isMinimized: state.isMinimized,
    queue: state.queue,
    currentIndex: state.currentIndex,
    favoriteTracks,
    recentlyPlayed,

    // Actions
    playTrack,
    togglePlay,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    toggleTrackFavorite,
    isTrackFavorite,
    clearRecentlyPlayed,
    toggleMinimize,
    closePlayer,
  };
};
