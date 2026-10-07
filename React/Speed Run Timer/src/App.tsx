import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ViewportMode, 
  SplitSegmentDefinition, 
  RaceStatus 
} from './types/race';
import { useRaceSocket } from './hooks/useRaceSocket';
import { usePrecisionStopwatch } from './hooks/usePrecisionStopwatch';
import { useAudioJuice } from './hooks/useAudioJuice';
import { useGlobalHotkeys } from './hooks/useGlobalHotkeys';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { RunnerViewport } from './components/RunnerViewport';
import { CasterViewport } from './components/CasterViewport';
import { SplitBoard } from './components/SplitBoard';
import { PostRaceModal } from './components/PostRaceModal';
import { SplitTemplateModal } from './components/SplitTemplateModal';
import { HotkeysModal } from './components/HotkeysModal';
import { Flame, Star, AlertCircle, Zap } from 'lucide-react';

export function App() {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('RUNNER');
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);
  const [showHotkeysModal, setShowHotkeysModal] = useState<boolean>(false);
  const [showPostRaceModal, setShowPostRaceModal] = useState<boolean>(false);
  const [surgeAlert, setSurgeAlert] = useState<{ message: string; isGold: boolean } | null>(null);
  const [surgeActive, setSurgeActive] = useState<boolean>(false);
  const [countdownDisplay, setCountdownDisplay] = useState<number | null>(null);

  const surgeTimeoutRef = useRef<number | null>(null);

  // Audio synthesis juice engine
  const {
    isMuted,
    toggleMute,
    playCountdownTick,
    playCountdownGo,
    playSplitChime,
    playGoldSurge,
    playResetSound,
  } = useAudioJuice();

  // Race WebSocket client & NTP clock calibration
  const {
    raceState,
    myPlayerId,
    myParticipant,
    isConnected,
    pingRttMs,
    clockOffsetMs,
    errorMessage,
    setErrorMessage,
    toggleReady,
    changeCategory,
    startCountdown,
    submitSplit,
    undoSplit,
    skipSplit,
    resetRun,
    addGhost,
    removeGhost,
    updateTelemetry,
  } = useRaceSocket({
    onCountdownTick: (remainingMs) => {
      const sec = Math.ceil(remainingMs / 1000);
      setCountdownDisplay(sec > 0 ? sec : 1);
      playCountdownTick(400 + (4 - sec) * 150);
    },
    onRaceStarted: () => {
      setCountdownDisplay(0);
      playCountdownGo();
      setTimeout(() => setCountdownDisplay(null), 800);
    },
    onSplitRecorded: (data) => {
      if (data.isGold) {
        playGoldSurge();
        setSurgeActive(true);
        if (surgeTimeoutRef.current) clearTimeout(surgeTimeoutRef.current);
        surgeTimeoutRef.current = window.setTimeout(() => setSurgeActive(false), 3000);
      } else {
        playSplitChime();
      }
    },
    onSurgeAlert: (data) => {
      setSurgeAlert({ message: data.message, isGold: data.isGold });
      setTimeout(() => setSurgeAlert(null), 4000);
    },
  });

  // Watch for race finished state to trigger debrief recap
  useEffect(() => {
    if (raceState?.status === 'RACE_FINISHED') {
      setShowPostRaceModal(true);
    }
  }, [raceState?.status]);

  // High-precision stopwatch decoupled from top-level renders
  const isRacing = raceState?.status === 'RACING';
  const startMonoMs = raceState?.serverStartTimestamp || 0;
  const frozenElapsedMs = myParticipant?.finalTimeMs;

  const { mainTextRef, msTextRef, getAuthoritativeElapsedMs } = usePrecisionStopwatch({
    isRunning: isRacing && !myParticipant?.hasFinished,
    authoritativeStartMonoMs: startMonoMs,
    clockOffsetMs,
    frozenElapsedMs,
  });

  // Hotkey handlers
  const handleSplit = useCallback(() => {
    if (!raceState || !myParticipant) return;
    if (raceState.status === 'LOBBY' || raceState.status === 'RACE_FINISHED') {
      startCountdown();
      return;
    }
    if (raceState.status === 'RACING' && !myParticipant.hasFinished) {
      const elapsed = getAuthoritativeElapsedMs();
      submitSplit(myParticipant.currentSplitIndex, elapsed);
    }
  }, [raceState, myParticipant, startCountdown, getAuthoritativeElapsedMs, submitSplit]);

  const handleUndo = useCallback(() => {
    undoSplit();
    playResetSound();
  }, [undoSplit, playResetSound]);

  const handleSkip = useCallback(() => {
    skipSplit();
  }, [skipSplit]);

  const handleReset = useCallback(() => {
    resetRun();
    playResetSound();
    setShowPostRaceModal(false);
  }, [resetRun, playResetSound]);

  // Register global hotkey manager
  useGlobalHotkeys({
    onSplit: handleSplit,
    onUndoSplit: handleUndo,
    onSkipSplit: handleSkip,
    onResetRun: handleReset,
  }, isConnected);

  // Fallback loading if room hasn't connected yet
  if (!raceState) {
    return (
      <div className="min-h-screen bg-obsidian-void flex flex-col items-center justify-center p-4 font-mono">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-8 w-8 text-neon-cyan animate-spin" />
          <h1 className="text-xl font-bold tracking-widest text-slate-100">
            CONNECTING TO SPEEDSYNC ARENA...
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Calibrating monotonic clock authority & NTP latency baseline...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-void bg-cyber-grid text-slate-100 selection:bg-neon-cyan/20">
      {/* Top Header */}
      <Header
        roomCode={raceState.roomCode}
        gameTitle={raceState.gameTitle}
        categoryName={raceState.categoryName}
        raceStatus={raceState.status}
        pingRttMs={pingRttMs}
        viewportMode={viewportMode}
        onSelectViewport={setViewportMode}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onOpenHotkeysModal={() => setShowHotkeysModal(true)}
        onOpenTemplatesModal={() => setShowTemplatesModal(true)}
      />

      {/* Floating Surge Alert Banner */}
      {surgeAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neon-gold text-obsidian-void font-mono font-black text-xs uppercase shadow-glow-gold">
            <Flame className="h-4 w-4 fill-obsidian-void animate-bounce" />
            <span>{surgeAlert.message}</span>
            <Star className="h-4 w-4 fill-obsidian-void" />
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded bg-neon-ruby/20 border border-neon-ruby text-neon-ruby font-mono text-xs shadow-glow-ruby">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-2 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Dramatic Countdown Overlay */}
      {countdownDisplay !== null && (
        <div className="fixed inset-0 z-50 bg-obsidian-void/90 backdrop-blur-md flex flex-col items-center justify-center font-mono select-none animate-in fade-in duration-150">
          <span className="text-sm text-neon-cyan tracking-widest uppercase mb-2 font-bold animate-pulse">
            SYNCHRONIZING MONOTONIC CLOCK BASELINE
          </span>
          <div className="text-8xl sm:text-9xl font-black text-neon-gold drop-shadow-[0_0_40px_rgba(255,184,0,0.8)] animate-surge">
            {countdownDisplay === 0 ? 'GO!' : countdownDisplay}
          </div>
          <span className="text-xs text-slate-400 mt-4">
            ALL PARTICIPANTS START SIMULTANEOUSLY
          </span>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col">
        {raceState.status === 'LOBBY' ? (
          <LobbyView
            raceState={raceState}
            myPlayerId={myPlayerId}
            onToggleReady={toggleReady}
            onStartCountdown={startCountdown}
            onChangeCategory={changeCategory}
            onAddGhost={addGhost}
            onRemoveGhost={removeGhost}
            onOpenTemplatesModal={() => setShowTemplatesModal(true)}
          />
        ) : viewportMode === 'RUNNER' ? (
          <div className="flex-1 flex flex-col justify-center items-center py-2">
            <RunnerViewport
              raceState={raceState}
              myParticipant={myParticipant}
              mainTextRef={mainTextRef}
              msTextRef={msTextRef}
              onTriggerSplit={handleSplit}
              onUndoSplit={handleUndo}
              onSkipSplit={handleSkip}
              onResetRun={handleReset}
              onStartCountdown={startCountdown}
              surgeActive={surgeActive}
            />
          </div>
        ) : viewportMode === 'CASTER' ? (
          <CasterViewport
            raceState={raceState}
            myParticipant={myParticipant}
            onTriggerSplit={handleSplit}
            onStartCountdown={startCountdown}
          />
        ) : (
          /* Full Split Board Viewport */
          <div className="max-w-3xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between p-3 rounded bg-obsidian-surface border border-obsidian-border text-xs font-mono">
              <span className="font-bold text-slate-200">
                ACTIVE SPLIT BOARD: {raceState.gameTitle} ({raceState.categoryName})
              </span>
              <button
                onClick={handleSplit}
                className="px-3 py-1 bg-neon-cyan text-obsidian-void font-bold rounded shadow-glow-cyan/40 hover:bg-neon-cyan/90 transition-all"
              >
                SPLIT [SPACE]
              </button>
            </div>
            <SplitBoard
              segments={raceState.segments}
              participant={myParticipant}
              currentSplitIndex={myParticipant?.currentSplitIndex || 0}
            />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="h-10 border-t border-obsidian-border/50 bg-obsidian-base/60 px-4 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span>SPEEDSYNC v1.0.0</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">FRAME-ACCURATE MULTIPLAYER TELEMETRY</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-emerald" />
          <span className="text-slate-400">SERVER CLOCK SYNCHRONIZED</span>
        </div>
      </footer>

      {/* Modals */}
      <PostRaceModal
        isOpen={showPostRaceModal}
        onClose={() => setShowPostRaceModal(false)}
        raceState={raceState}
        myParticipant={myParticipant}
        onResetRace={handleReset}
      />

      <SplitTemplateModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        gameTitle={raceState.gameTitle}
        categoryName={raceState.categoryName}
        segments={raceState.segments}
        onSaveTemplate={(title, cat, segs) => {
          // Send update or create room
          // In a live room, updates current segments
          raceState.gameTitle = title;
          raceState.categoryName = cat;
          raceState.segments = segs;
        }}
      />

      <HotkeysModal
        isOpen={showHotkeysModal}
        onClose={() => setShowHotkeysModal(false)}
      />
    </div>
  );
}

export default App;
