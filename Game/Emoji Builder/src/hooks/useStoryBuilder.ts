import { useState, useEffect, useRef, useCallback } from 'react';
import {
  EmojiStoryState,
  StoryPanel,
  EmojiSticker,
  SpeechBubble,
  BranchChoice,
  AspectRatio,
  SceneMood,
  ThemeId,
  BackgroundMode,
} from '../types';
import { DEFAULT_STORY } from '../data/sampleStories';
import { sound } from '../utils/soundEngine';

const STORAGE_KEY = 'emoji_story_builder_saved_state_v1';
const MAX_HISTORY = 30;

export function useStoryBuilder() {
  const [state, setState] = useState<EmojiStoryState>(() => {
    // Try URL hash first
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#story=')) {
      try {
        const raw = decodeURIComponent(window.location.hash.replace('#story=', ''));
        const parsed = JSON.parse(atob(raw));
        if (parsed && parsed.panels && parsed.panels.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse story from URL hash:', err);
      }
    }
    // Try localStorage next
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.panels && parsed.panels.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load story from localStorage:', err);
      }
    }
    return DEFAULT_STORY;
  });

  // Undo / Redo history stacks
  const historyRef = useRef<EmojiStoryState[]>([]);
  const futureRef = useRef<EmojiStoryState[]>([]);

  const pushState = useCallback((newState: EmojiStoryState) => {
    setState((prevState) => {
      historyRef.current.push(JSON.parse(JSON.stringify(prevState)));
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      }
      futureRef.current = [];
      return newState;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const previous = historyRef.current.pop()!;
    futureRef.current.push(JSON.parse(JSON.stringify(state)));
    setState(previous);
    sound.playPop();
  }, [state]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    historyRef.current.push(JSON.parse(JSON.stringify(state)));
    setState(next);
    sound.playPop();
  }, [state]);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Active panel lookup
  const activePanel =
    state.panels.find((p) => p.id === state.activePanelId) || state.panels[0] || null;

  // Panel index
  const activePanelIndex = state.panels.findIndex((p) => p.id === state.activePanelId);

  // Playback requestAnimationFrame Controller
  const animFrameRef = useRef<number | null>(null);
  const panelStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!state.playback.isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    panelStartTimeRef.current = performance.now();

    const loop = (now: number) => {
      const currentPanel = state.panels[state.playback.currentIndex] || state.panels[0];
      const dwellMs = (currentPanel.durationMs || 3000) / state.playback.speedMultiplier;
      const elapsed = now - panelStartTimeRef.current;

      if (elapsed >= dwellMs) {
        // Step to next panel
        const nextIndex = state.playback.currentIndex + 1;
        if (nextIndex < state.panels.length) {
          panelStartTimeRef.current = now;
          sound.playWhoosh();
          setState((prev) => ({
            ...prev,
            activePanelId: prev.panels[nextIndex].id,
            playback: { ...prev.playback, currentIndex: nextIndex },
          }));
        } else if (state.playback.loop) {
          panelStartTimeRef.current = now;
          sound.playChime();
          setState((prev) => ({
            ...prev,
            activePanelId: prev.panels[0].id,
            playback: { ...prev.playback, currentIndex: 0 },
          }));
        } else {
          // Finished
          setState((prev) => ({
            ...prev,
            playback: { ...prev.playback, isPlaying: false, currentIndex: 0 },
          }));
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state.playback.isPlaying, state.playback.currentIndex, state.playback.speedMultiplier, state.playback.loop, state.panels]);

  // Actions
  const togglePlay = useCallback(() => {
    setState((prev) => {
      const willPlay = !prev.playback.isPlaying;
      if (willPlay) {
        sound.playChime();
      }
      return {
        ...prev,
        playback: {
          ...prev.playback,
          isPlaying: willPlay,
          currentIndex: willPlay ? prev.panels.findIndex((p) => p.id === prev.activePanelId) : prev.playback.currentIndex,
        },
      };
    });
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setState((prev) => ({
      ...prev,
      playback: { ...prev.playback, speedMultiplier: speed },
    }));
  }, []);

  const toggleLoop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playback: { ...prev.playback, loop: !prev.playback.loop },
    }));
    sound.playPop();
  }, []);

  const setActivePanel = useCallback(
    (panelId: string) => {
      const idx = state.panels.findIndex((p) => p.id === panelId);
      if (idx !== -1) {
        setState((prev) => ({
          ...prev,
          activePanelId: panelId,
          selectedStickerId: null,
          selectedBubbleId: null,
          playback: { ...prev.playback, currentIndex: idx },
        }));
        sound.playPop();
      }
    },
    [state.panels]
  );

  const setAspectRatio = useCallback((ratio: AspectRatio) => {
    pushState({ ...state, aspectRatio: ratio });
    sound.playPop();
  }, [state, pushState]);

  const setTheme = useCallback((theme: ThemeId) => {
    pushState({ ...state, theme });
    sound.playChime();
  }, [state, pushState]);

  const setBackgroundMode = useCallback((bgMode: BackgroundMode) => {
    pushState({ ...state, bgMode });
    sound.playPop();
  }, [state, pushState]);

  const setGameMode = useCallback((mode: 'creator' | 'reader' | 'plot_guesser') => {
    setState((prev) => ({ ...prev, gameMode: mode }));
    sound.playChime();
  }, []);

  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  // Panel mutations
  const addPanel = useCallback(() => {
    const newId = `panel-${Date.now()}`;
    const newPanel: StoryPanel = {
      id: newId,
      title: `#${state.panels.length + 1} New Beat`,
      caption: 'A fresh chapter begins in the story...',
      mood: 'playful',
      backgroundGradient: 'from-amber-50 to-pink-50',
      durationMs: 3000,
      stickers: [{ id: `s-${Date.now()}`, char: '⭐', x: 50, y: 50, scale: 2.0, rotation: 0, animation: 'bounce' }],
      speechBubbles: [],
    };
    const newPanels = [...state.panels, newPanel];
    pushState({
      ...state,
      panels: newPanels,
      activePanelId: newId,
      selectedStickerId: null,
      selectedBubbleId: null,
    });
    sound.playDing();
  }, [state, pushState]);

  const duplicatePanel = useCallback(
    (panelId: string) => {
      const idx = state.panels.findIndex((p) => p.id === panelId);
      if (idx === -1) return;
      const target = state.panels[idx];
      const cloned: StoryPanel = {
        ...JSON.parse(JSON.stringify(target)),
        id: `panel-${Date.now()}`,
        title: `${target.title || 'Panel'} (Copy)`,
      };
      const newPanels = [...state.panels];
      newPanels.splice(idx + 1, 0, cloned);
      pushState({
        ...state,
        panels: newPanels,
        activePanelId: cloned.id,
      });
      sound.playDing();
    },
    [state, pushState]
  );

  const deletePanel = useCallback(
    (panelId: string) => {
      if (state.panels.length <= 1) return; // Keep at least one
      const idx = state.panels.findIndex((p) => p.id === panelId);
      const newPanels = state.panels.filter((p) => p.id !== panelId);
      const nextActiveId = newPanels[Math.max(0, idx - 1)].id;
      pushState({
        ...state,
        panels: newPanels,
        activePanelId: nextActiveId,
        selectedStickerId: null,
        selectedBubbleId: null,
      });
      sound.playPop();
    },
    [state, pushState]
  );

  const reorderPanels = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      const newPanels = Array.from(state.panels);
      const [removed] = newPanels.splice(sourceIndex, 1);
      newPanels.splice(destinationIndex, 0, removed);
      pushState({ ...state, panels: newPanels });
    },
    [state, pushState]
  );

  const updateActivePanel = useCallback(
    (updates: Partial<StoryPanel>) => {
      setState((prev) => ({
        ...prev,
        panels: prev.panels.map((p) => (p.id === prev.activePanelId ? { ...p, ...updates } : p)),
      }));
    },
    []
  );

  // Sticker mutations
  const addStickerToActivePanel = useCallback(
    (char: string, name?: string, x = 50, y = 50) => {
      if (!activePanel) return;
      const newSticker: EmojiSticker = {
        id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        char,
        name,
        x,
        y,
        scale: 2.0,
        rotation: 0,
        animation: 'bounce',
      };
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id ? { ...p, stickers: [...p.stickers, newSticker] } : p
      );
      pushState({
        ...state,
        panels: updatedPanels,
        selectedStickerId: newSticker.id,
        selectedBubbleId: null,
      });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  const updateSticker = useCallback(
    (stickerId: string, updates: Partial<EmojiSticker>) => {
      setState((prev) => ({
        ...prev,
        panels: prev.panels.map((p) =>
          p.id === prev.activePanelId
            ? {
                ...p,
                stickers: p.stickers.map((s) => (s.id === stickerId ? { ...s, ...updates } : s)),
              }
            : p
        ),
      }));
    },
    []
  );

  const deleteSticker = useCallback(
    (stickerId: string) => {
      if (!activePanel) return;
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id
          ? { ...p, stickers: p.stickers.filter((s) => s.id !== stickerId) }
          : p
      );
      pushState({
        ...state,
        panels: updatedPanels,
        selectedStickerId: null,
      });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  const duplicateSticker = useCallback(
    (stickerId: string) => {
      if (!activePanel) return;
      const target = activePanel.stickers.find((s) => s.id === stickerId);
      if (!target) return;
      const cloned: EmojiSticker = {
        ...target,
        id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        x: Math.min(85, target.x + 6),
        y: Math.min(85, target.y + 6),
      };
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id ? { ...p, stickers: [...p.stickers, cloned] } : p
      );
      pushState({
        ...state,
        panels: updatedPanels,
        selectedStickerId: cloned.id,
      });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  const bringStickerToFront = useCallback(
    (stickerId: string) => {
      if (!activePanel) return;
      const target = activePanel.stickers.find((s) => s.id === stickerId);
      if (!target) return;
      const remaining = activePanel.stickers.filter((s) => s.id !== stickerId);
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id ? { ...p, stickers: [...remaining, target] } : p
      );
      pushState({ ...state, panels: updatedPanels });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  const sendStickerToBack = useCallback(
    (stickerId: string) => {
      if (!activePanel) return;
      const target = activePanel.stickers.find((s) => s.id === stickerId);
      if (!target) return;
      const remaining = activePanel.stickers.filter((s) => s.id !== stickerId);
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id ? { ...p, stickers: [target, ...remaining] } : p
      );
      pushState({ ...state, panels: updatedPanels });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  const selectSticker = useCallback((stickerId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedStickerId: stickerId,
      selectedBubbleId: null,
    }));
  }, []);

  // Speech bubble mutations
  const addSpeechBubble = useCallback(
    (type: 'speech' | 'thought' | 'whisper' | 'shout' = 'speech', text = 'New dialogue bubble... 🍓') => {
      if (!activePanel) return;
      const newBubble: SpeechBubble = {
        id: `bubble-${Date.now()}`,
        text,
        x: 40,
        y: 20,
        type,
        tailDirection: 'bottom-left',
      };
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id
          ? { ...p, speechBubbles: [...(p.speechBubbles || []), newBubble] }
          : p
      );
      pushState({
        ...state,
        panels: updatedPanels,
        selectedBubbleId: newBubble.id,
        selectedStickerId: null,
      });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  const updateSpeechBubble = useCallback(
    (bubbleId: string, updates: Partial<SpeechBubble>) => {
      setState((prev) => ({
        ...prev,
        panels: prev.panels.map((p) =>
          p.id === prev.activePanelId
            ? {
                ...p,
                speechBubbles: (p.speechBubbles || []).map((b) =>
                  b.id === bubbleId ? { ...b, ...updates } : b
                ),
              }
            : p
        ),
      }));
    },
    []
  );

  const deleteSpeechBubble = useCallback(
    (bubbleId: string) => {
      if (!activePanel) return;
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id
          ? { ...p, speechBubbles: (p.speechBubbles || []).filter((b) => b.id !== bubbleId) }
          : p
      );
      pushState({
        ...state,
        panels: updatedPanels,
        selectedBubbleId: null,
      });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  const selectBubble = useCallback((bubbleId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedBubbleId: bubbleId,
      selectedStickerId: null,
    }));
  }, []);

  // Branch choices
  const addBranchChoice = useCallback(
    (label: string, labelEmoji: string, targetPanelId: string) => {
      if (!activePanel) return;
      const newChoice: BranchChoice = {
        id: `choice-${Date.now()}`,
        label,
        labelEmoji,
        targetPanelId,
      };
      const currentChoices = activePanel.choices || [];
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id ? { ...p, choices: [...currentChoices, newChoice] } : p
      );
      pushState({ ...state, panels: updatedPanels });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  const removeBranchChoice = useCallback(
    (choiceId: string) => {
      if (!activePanel) return;
      const updatedPanels = state.panels.map((p) =>
        p.id === activePanel.id
          ? { ...p, choices: (p.choices || []).filter((c) => c.id !== choiceId) }
          : p
      );
      pushState({ ...state, panels: updatedPanels });
      sound.playPop();
    },
    [activePanel, state, pushState]
  );

  // URL Hash sharing
  const getShareableUrl = useCallback(() => {
    try {
      const serialized = btoa(JSON.stringify(state));
      const url = new URL(window.location.href);
      url.hash = `story=${encodeURIComponent(serialized)}`;
      return url.toString();
    } catch {
      return window.location.href;
    }
  }, [state]);

  const resetStory = useCallback(() => {
    pushState(DEFAULT_STORY);
    sound.playChime();
  }, [pushState]);

  return {
    state,
    activePanel,
    activePanelIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    togglePlay,
    setPlaybackSpeed,
    toggleLoop,
    setActivePanel,
    setAspectRatio,
    setTheme,
    setBackgroundMode,
    setGameMode,
    setTitle,
    addPanel,
    duplicatePanel,
    deletePanel,
    reorderPanels,
    updateActivePanel,
    addStickerToActivePanel,
    updateSticker,
    deleteSticker,
    duplicateSticker,
    bringStickerToFront,
    sendStickerToBack,
    selectSticker,
    addSpeechBubble,
    updateSpeechBubble,
    deleteSpeechBubble,
    selectBubble,
    addBranchChoice,
    removeBranchChoice,
    getShareableUrl,
    resetStory,
  };
}
