import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Episode, 
  Chapter, 
  ListeningVaultClip, 
  PlaybackSpeed, 
  CommuteFilterType, 
  VoicemailQuestion 
} from '../types';
import { MOCK_EPISODES, MOCK_VOICEMAILS } from '../data/mockPodcastData';
import { globalAudioEngine } from '../services/audioEngine';

interface PodcastContextType {
  episodes: Episode[];
  currentEpisode: Episode;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: PlaybackSpeed;
  volume: number;
  isMuted: boolean;
  commuteFilter: CommuteFilterType;
  activeChapter: Chapter | null;
  activeSentenceId: string | null;
  isSampleMode: boolean;
  sampleRemainingSec: number;
  isDaylightTheme: boolean;
  isCreatorView: boolean;
  listeningVault: ListeningVaultClip[];
  voicemails: VoicemailQuestion[];
  isSearchModalOpen: boolean;
  isVoicemailModalOpen: boolean;
  isAudiogramModalOpen: boolean;
  activeAudiogramClip: ListeningVaultClip | null;
  isSleepTimerModalOpen: boolean;
  sleepTimerRemainingSec: number | null;
  showResumeBanner: boolean;
  lastPausedChapter: Chapter | null;

  // Actions
  selectEpisode: (episodeId: string, autoPlay?: boolean) => void;
  togglePlay: () => void;
  playEpisode: (episodeId: string, startSec?: number) => void;
  seekTo: (seconds: number) => void;
  setPlaybackRate: (rate: PlaybackSpeed) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  playSample: (episodeId: string) => void;
  stopSampleAndPlayFull: () => void;
  skipIntro: () => void;
  setCommuteFilter: (filter: CommuteFilterType) => void;
  toggleDaylightTheme: () => void;
  toggleCreatorView: () => void;
  setIsSearchModalOpen: (open: boolean) => void;
  setIsVoicemailModalOpen: (open: boolean) => void;
  setIsAudiogramModalOpen: (open: boolean) => void;
  setIsSleepTimerModalOpen: (open: boolean) => void;
  setActiveAudiogramClip: (clip: ListeningVaultClip | null) => void;
  addToVault: (clip: Omit<ListeningVaultClip, 'id' | 'dateSaved'>) => void;
  removeFromVault: (clipId: string) => void;
  promoteRetentionPeak: (episodeId: string, timestampSec: number) => void;
  addEpisode: (episode: Episode) => void;
  updateEpisodeChapters: (episodeId: string, chapters: Chapter[]) => void;
  submitVoicemail: (vm: Partial<VoicemailQuestion>) => void;
  setSleepTimer: (minutes: number | null) => void;
  resumeAndRecap: () => void;
  dismissResumeBanner: () => void;
}

const PodcastContext = createContext<PodcastContextType | null>(null);

const INITIAL_VAULT: ListeningVaultClip[] = [
  {
    id: "vault-1",
    episodeId: "ep-142",
    episodeTitle: "Solo Builder Economics & The Death of Freemium",
    speakerName: "Maya Lin",
    quoteText: "When you have zero employees, every free user asking for an API tweak consumes your most scarce asset: cognitive building bandwidth.",
    startTimeSec: 210,
    endTimeSec: 252,
    dateSaved: "Yesterday",
    tags: ["Pricing", "Solo Founder"]
  },
  {
    id: "vault-2",
    episodeId: "ep-140",
    episodeTitle: "15-Minute Tactical Sprint: The Daily Design Ritual",
    speakerName: "Sarah Chen",
    quoteText: "If you can't communicate visual hierarchy purely through spatial rhythm and spacing, no gradient palette will save you.",
    startTimeSec: 250,
    endTimeSec: 320,
    dateSaved: "2 weeks ago",
    tags: ["Design Craft", "Typography"]
  }
];

export const PodcastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [episodes, setEpisodes] = useState<Episode[]>(MOCK_EPISODES);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>("ep-142");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRateState] = useState<PlaybackSpeed>(1.0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [commuteFilter, setCommuteFilter] = useState<CommuteFilterType>('all');
  
  // Theme & Views
  const [isDaylightTheme, setIsDaylightTheme] = useState<boolean>(false);
  const [isCreatorView, setIsCreatorView] = useState<boolean>(false);

  // Modals
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isVoicemailModalOpen, setIsVoicemailModalOpen] = useState<boolean>(false);
  const [isAudiogramModalOpen, setIsAudiogramModalOpen] = useState<boolean>(false);
  const [activeAudiogramClip, setActiveAudiogramClip] = useState<ListeningVaultClip | null>(null);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState<boolean>(false);
  const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<number | null>(null);

  // Vault & Voicemails
  const [listeningVault, setListeningVault] = useState<ListeningVaultClip[]>(INITIAL_VAULT);
  const [voicemails, setVoicemails] = useState<VoicemailQuestion[]>(MOCK_VOICEMAILS);

  // Sample Hook 45s State
  const [isSampleMode, setIsSampleMode] = useState<boolean>(false);
  const [sampleEndTimestamp, setSampleEndTimestamp] = useState<number>(0);
  const [sampleRemainingSec, setSampleRemainingSec] = useState<number>(45);

  // Resume & Wind-Down Banner
  const [showResumeBanner, setShowResumeBanner] = useState<boolean>(true);
  const [lastPausedChapter, setLastPausedChapter] = useState<Chapter | null>(null);

  const currentEpisode = useMemo(() => {
    return episodes.find(e => e.id === currentEpisodeId) || episodes[0];
  }, [episodes, currentEpisodeId]);

  // Audio Engine Synchronizer
  useEffect(() => {
    globalAudioEngine.setDuration(currentEpisode.durationSec);
  }, [currentEpisode]);

  useEffect(() => {
    const unsubTime = globalAudioEngine.onTimeUpdate((time) => {
      setCurrentTime(time);

      // Handle 45s sample playback countdown
      if (isSampleMode) {
        const remaining = Math.max(0, sampleEndTimestamp - time);
        setSampleRemainingSec(Math.ceil(remaining));
        if (time >= sampleEndTimestamp) {
          globalAudioEngine.pause();
          setIsSampleMode(false);
        }
      }
    });

    const unsubPlayState = globalAudioEngine.onPlayStateChange((playing) => {
      setIsPlaying(playing);
    });

    return () => {
      unsubTime();
      unsubPlayState();
    };
  }, [isSampleMode, sampleEndTimestamp]);

  // Theme Sync to Document Body
  useEffect(() => {
    if (isDaylightTheme) {
      document.body.classList.add('theme-daylight');
    } else {
      document.body.classList.remove('theme-daylight');
    }
  }, [isDaylightTheme]);

  // Sleep Timer Interval
  useEffect(() => {
    if (sleepTimerRemainingSec === null) return;
    if (sleepTimerRemainingSec <= 0) {
      globalAudioEngine.pause();
      setSleepTimerRemainingSec(null);
      return;
    }

    const interval = setInterval(() => {
      setSleepTimerRemainingSec(prev => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemainingSec]);

  // Active Chapter Derivation
  const activeChapter = useMemo(() => {
    if (!currentEpisode.chapters || currentEpisode.chapters.length === 0) return null;
    const match = currentEpisode.chapters.find(
      ch => currentTime >= ch.startTimeSec && currentTime < ch.endTimeSec
    );
    return match || currentEpisode.chapters[0];
  }, [currentEpisode, currentTime]);

  // Active Sentence Derivation
  const activeSentenceId = useMemo(() => {
    for (const block of currentEpisode.transcript) {
      if (currentTime >= block.startTimeSec && currentTime <= block.endTimeSec) {
        for (const sentence of block.sentences) {
          if (currentTime >= sentence.startTimeSec && currentTime <= sentence.endTimeSec) {
            return sentence.id;
          }
        }
        return block.sentences[0]?.id || null;
      }
    }
    return null;
  }, [currentEpisode, currentTime]);

  // Play / Pause Controls
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      globalAudioEngine.pause();
      // Record paused chapter for resume banner
      if (activeChapter) {
        setLastPausedChapter(activeChapter);
      }
    } else {
      globalAudioEngine.play();
    }
  }, [isPlaying, activeChapter]);

  const selectEpisode = useCallback((episodeId: string, autoPlay = false) => {
    const ep = episodes.find(e => e.id === episodeId);
    if (!ep) return;
    setCurrentEpisodeId(episodeId);
    globalAudioEngine.setDuration(ep.durationSec);
    setIsSampleMode(false);
    if (autoPlay) {
      globalAudioEngine.play(0);
    } else {
      globalAudioEngine.pause();
      globalAudioEngine.seek(0);
    }
  }, [episodes]);

  const playEpisode = useCallback((episodeId: string, startSec?: number) => {
    setIsSampleMode(false);
    if (episodeId !== currentEpisodeId) {
      setCurrentEpisodeId(episodeId);
      const ep = episodes.find(e => e.id === episodeId);
      if (ep) {
        globalAudioEngine.setDuration(ep.durationSec);
      }
    }
    const seekTarget = startSec !== undefined ? startSec : 0;
    globalAudioEngine.play(seekTarget);
  }, [currentEpisodeId, episodes]);

  const seekTo = useCallback((seconds: number) => {
    globalAudioEngine.seek(seconds);
  }, []);

  const setPlaybackRate = useCallback((rate: PlaybackSpeed) => {
    setPlaybackRateState(rate);
    globalAudioEngine.setPlaybackRate(rate);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    globalAudioEngine.setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      globalAudioEngine.setMute(next);
      return next;
    });
  }, []);

  // 45-Second Peak Sample Hook
  const playSample = useCallback((episodeId: string) => {
    const ep = episodes.find(e => e.id === episodeId);
    if (!ep) return;
    
    setCurrentEpisodeId(episodeId);
    globalAudioEngine.setDuration(ep.durationSec);
    
    const start = ep.sampleBestMoment.startTimeSec;
    const end = start + ep.sampleBestMoment.durationSec;
    
    setSampleEndTimestamp(end);
    setSampleRemainingSec(ep.sampleBestMoment.durationSec);
    setIsSampleMode(true);
    
    globalAudioEngine.play(start);
  }, [episodes]);

  const stopSampleAndPlayFull = useCallback(() => {
    setIsSampleMode(false);
    if (!isPlaying) {
      globalAudioEngine.play();
    }
  }, [isPlaying]);

  // Skip Intro / Housekeeping
  const skipIntro = useCallback(() => {
    if (currentEpisode.introBanterEndSec) {
      seekTo(currentEpisode.introBanterEndSec);
    }
  }, [currentEpisode, seekTo]);

  const toggleDaylightTheme = useCallback(() => {
    setIsDaylightTheme(prev => !prev);
  }, []);

  const toggleCreatorView = useCallback(() => {
    setIsCreatorView(prev => !prev);
  }, []);

  // Vault Actions
  const addToVault = useCallback((clip: Omit<ListeningVaultClip, 'id' | 'dateSaved'>) => {
    const newClip: ListeningVaultClip = {
      ...clip,
      id: `vault-${Date.now()}`,
      dateSaved: 'Just now'
    };
    setListeningVault(prev => [newClip, ...prev]);
  }, []);

  const removeFromVault = useCallback((clipId: string) => {
    setListeningVault(prev => prev.filter(c => c.id !== clipId));
  }, []);

  // Creator Retention Peak Promotion
  const promoteRetentionPeak = useCallback((episodeId: string, timestampSec: number) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== episodeId) return ep;
      return {
        ...ep,
        sampleBestMoment: {
          startTimeSec: timestampSec,
          durationSec: 45,
          hookSummary: `Promoted from listener retention replay spike at ${Math.floor(timestampSec / 60)}:${(timestampSec % 60).toString().padStart(2, '0')}.`
        }
      };
    }));
  }, []);

  const addEpisode = useCallback((newEp: Episode) => {
    setEpisodes(prev => [newEp, ...prev]);
  }, []);

  const updateEpisodeChapters = useCallback((episodeId: string, newChapters: Chapter[]) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== episodeId) return ep;
      return { ...ep, chapters: newChapters };
    }));
  }, []);

  const submitVoicemail = useCallback((vm: Partial<VoicemailQuestion>) => {
    const newVm: VoicemailQuestion = {
      id: `vm-${Date.now()}`,
      episodeId: currentEpisodeId,
      authorName: vm.authorName || 'Anonymous Listener',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      timeAgo: 'Just now',
      durationSec: vm.durationSec || 45,
      textPrompt: vm.textPrompt || '',
      status: 'queued',
      topicTag: vm.topicTag || currentEpisode.tags[0] || 'Listener Question'
    };
    setVoicemails(prev => [newVm, ...prev]);
  }, [currentEpisodeId, currentEpisode]);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerRemainingSec(null);
    } else {
      setSleepTimerRemainingSec(minutes * 60);
    }
  }, []);

  const resumeAndRecap = useCallback(() => {
    const rewindTarget = Math.max(0, currentTime - 30);
    seekTo(rewindTarget);
    globalAudioEngine.play();
    setShowResumeBanner(false);
  }, [currentTime, seekTo]);

  const dismissResumeBanner = useCallback(() => {
    setShowResumeBanner(false);
  }, []);

  return (
    <PodcastContext.Provider
      value={{
        episodes,
        currentEpisode,
        isPlaying,
        currentTime,
        duration: currentEpisode.durationSec,
        playbackRate,
        volume,
        isMuted,
        commuteFilter,
        activeChapter,
        activeSentenceId,
        isSampleMode,
        sampleRemainingSec,
        isDaylightTheme,
        isCreatorView,
        listeningVault,
        voicemails,
        isSearchModalOpen,
        isVoicemailModalOpen,
        isAudiogramModalOpen,
        activeAudiogramClip,
        isSleepTimerModalOpen,
        sleepTimerRemainingSec,
        showResumeBanner,
        lastPausedChapter: lastPausedChapter || currentEpisode.chapters[1] || null,

        selectEpisode,
        togglePlay,
        playEpisode,
        seekTo,
        setPlaybackRate,
        setVolume,
        toggleMute,
        playSample,
        stopSampleAndPlayFull,
        skipIntro,
        setCommuteFilter,
        toggleDaylightTheme,
        toggleCreatorView,
        setIsSearchModalOpen,
        setIsVoicemailModalOpen,
        setIsAudiogramModalOpen,
        setIsSleepTimerModalOpen,
        setActiveAudiogramClip,
        addToVault,
        removeFromVault,
        promoteRetentionPeak,
        addEpisode,
        updateEpisodeChapters,
        submitVoicemail,
        setSleepTimer,
        resumeAndRecap,
        dismissResumeBanner
      }}
    >
      {children}
    </PodcastContext.Provider>
  );
};

export const usePodcast = () => {
  const context = useContext(PodcastContext);
  if (!context) {
    throw new Error('usePodcast must be used within a PodcastProvider');
  }
  return context;
};
