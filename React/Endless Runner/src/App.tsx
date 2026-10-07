import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRunnerEngine } from './engine/useRunnerEngine';
import { GameSettings, GhostData, RunSubmissionPayload } from './types/game';
import { HudOverlay } from './components/HudOverlay';
import { PauseSheet } from './components/PauseSheet';
import { DailyGauntletModal } from './components/DailyGauntletModal';
import { GameOverDialog } from './components/GameOverDialog';
import { MobileTouchControls } from './components/MobileTouchControls';
import { Play, Sparkles, Trophy, Zap, Radio } from 'lucide-react';

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 80,
  sfxVolume: 85,
  cameraTilt: 60,
  screenShake: 70,
  showGhost: true,
  showHitboxes: false,
  keybindings: {
    moveLeft: ['a', 'arrowleft'],
    moveRight: ['d', 'arrowright'],
    jump: ['w', 'arrowup', ' '],
    slide: ['s', 'arrowdown'],
    overdrive: ['shift', 'e'],
  },
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Settings State with LocalStorage persistence
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('neon_runner_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('neon_runner_settings', JSON.stringify(newSettings));
  };

  // Seed configuration
  const [seed, setSeed] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('seed') || `DAILY-${new Date().toISOString().slice(0, 10)}`;
  });

  // Ghost runner data
  const [ghostData, setGhostData] = useState<GhostData | null>(null);

  // UI Modals State
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [runSummary, setRunSummary] = useState<RunSubmissionPayload | null>(null);
  const [hasStartedFirstRun, setHasStartedFirstRun] = useState(false);

  // Live WebSocket milestone notification
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Handle Game Over
  const handleGameOver = useCallback((summary: RunSubmissionPayload) => {
    setRunSummary(summary);
    setIsGameOverOpen(true);
  }, []);

  // Initialize runner engine
  const {
    hudState,
    startRun,
    pauseRun,
    resumeRun,
    moveLeft,
    moveRight,
    jump,
    slide,
    activateOverdrive,
    handleTouchStart,
    handleTouchEnd,
  } = useRunnerEngine({
    canvasRef,
    seed,
    ghostData: settings.showGhost ? ghostData : null,
    settings,
    onGameOver: handleGameOver,
  });

  // Load daily seed and ghost data from backend
  useEffect(() => {
    fetch(`/api/runs/daily`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !new URLSearchParams(window.location.search).get('seed')) {
          setSeed(data.seed);
        }
      })
      .catch(() => {});

    // Fetch top ghost for comparison
    fetch(`/api/leaderboard?seed=${seed}&limit=1`)
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.leaderboard && res.leaderboard.length > 0) {
          const top = res.leaderboard[0];
          fetch(`/api/ghosts/${top.id}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((ghost) => {
              if (ghost) setGhostData(ghost);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [seed]);

  // Connect to live WebSocket relay
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPort = window.location.port === '5175' ? '3002' : window.location.port;
    const wsUrl = `${wsProtocol}//${window.location.hostname}:${wsPort}/ws`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MILESTONE_ALERT') {
            setLiveToast(`⚡ ${data.playerHandle} surpassed ${data.distance}m!`);
            setTimeout(() => setLiveToast(null), 4000);
          } else if (data.type === 'NEW_HIGH_SCORE') {
            setLiveToast(`🏆 New Record: ${data.playerHandle} reached ${data.distance}m!`);
            setTimeout(() => setLiveToast(null), 5000);
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Resize canvas to match screen resolution with high-DPI scaling
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Instant Start
  const handleStartGame = () => {
    setHasStartedFirstRun(true);
    setIsGameOverOpen(false);
    startRun();
  };

  // Submit run to server
  const handleSubmitLeaderboard = async (playerHandle: string) => {
    if (!runSummary) return false;
    try {
      const res = await fetch('/api/runs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...runSummary, playerHandle }),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  // Keyboard shortcut to start from intro screen
  useEffect(() => {
    const handleInitialKey = (e: KeyboardEvent) => {
      if (!hasStartedFirstRun) {
        if (e.key === ' ' || e.key === 'Enter') {
          handleStartGame();
        }
      }
    };
    window.addEventListener('keydown', handleInitialKey);
    return () => window.removeEventListener('keydown', handleInitialKey);
  }, [hasStartedFirstRun]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070014] select-none">
      {/* 3D WebGL / Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Retro CRT Scanline Overlay */}
      <div className="absolute inset-0 scanlines" />

      {/* Live WebSocket Toast Banner */}
      {liveToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 glass-panel px-4 py-2 rounded-full border border-neon-cyan/40 text-xs font-orbitron font-bold text-white flex items-center gap-2 animate-in slide-in-from-top duration-300 shadow-lg shadow-neon-cyan/20">
          <Radio className="w-3.5 h-3.5 text-neon-magenta animate-pulse" />
          {liveToast}
        </div>
      )}

      {/* Running HUD Overlay */}
      {hasStartedFirstRun && hudState.status !== 'IDLE' && (
        <HudOverlay
          state={hudState}
          ghostData={ghostData}
          onPause={() => {
            pauseRun();
            setIsPauseOpen(true);
          }}
          onOpenSettings={() => {
            pauseRun();
            setIsPauseOpen(true);
          }}
          onOpenDailyModal={() => {
            pauseRun();
            setIsDailyModalOpen(true);
          }}
          onTriggerOverdrive={activateOverdrive}
        />
      )}

      {/* Onscreen Touch Navigation for Mobile / Tablet Parity */}
      {hasStartedFirstRun && hudState.status === 'RUNNING' && (
        <MobileTouchControls
          onMoveLeft={moveLeft}
          onMoveRight={moveRight}
          onJump={jump}
          onSlide={slide}
          onOverdrive={activateOverdrive}
          isOverdriveReady={hudState.overdriveGauge >= 100 && !hudState.isOverdriveActive}
        />
      )}

      {/* Instant Sprint Onboarding Overlay */}
      {!hasStartedFirstRun && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg glass-panel-magenta rounded-3xl p-8 text-center border-2 border-neon-cyan/50 shadow-2xl relative overflow-hidden">
            {/* Ambient cyber glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-cyan/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neon-magenta/20 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-orbitron font-bold mb-4 tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> ZERO-FRICTION INSTANT SPRINT
            </div>

            <h1 className="font-orbitron font-black text-4xl md:text-5xl text-white tracking-wider mb-2">
              NEON <span className="text-neon-cyan neon-glow-cyan">SLIPSTREAM</span>
            </h1>

            <p className="text-sm text-slate-300 font-medium mb-6 max-w-md mx-auto">
              High-velocity reflex gauntlet. Skim hazard boundaries to charge{' '}
              <span className="text-neon-magenta font-semibold">Slipstream Overdrive</span> and outrun the Hologram Ghost!
            </p>

            {/* Quick Controls Cheat Sheet */}
            <div className="grid grid-cols-4 gap-2 mb-8 text-xs font-orbitron">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 text-[10px] block">MOVE</span>
                <span className="font-bold text-neon-cyan">A / D</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 text-[10px] block">JUMP</span>
                <span className="font-bold text-neon-cyan">W / SPACE</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 text-[10px] block">SLIDE</span>
                <span className="font-bold text-neon-cyan">S / ▼</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400 text-[10px] block">BOOST</span>
                <span className="font-bold text-neon-magenta">SHIFT</span>
              </div>
            </div>

            {/* Main Instant Sprint Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-neon-cyan via-purple-600 to-neon-magenta text-white font-orbitron font-black text-lg md:text-xl tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-neon-cyan/25 hover:shadow-neon-magenta/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-white/30"
            >
              <Play className="w-6 h-6 fill-current" /> SPRINT (SPACE)
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Daily Seed: {seed}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-neon-cyan" /> 60Hz Physics
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pause & Settings Drawer */}
      <PauseSheet
        isOpen={isPauseOpen}
        onClose={() => {
          setIsPauseOpen(false);
          resumeRun();
        }}
        onResume={() => {
          setIsPauseOpen(false);
          resumeRun();
        }}
        onRestart={() => {
          setIsPauseOpen(false);
          startRun();
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Daily Gauntlet Modal */}
      <DailyGauntletModal
        isOpen={isDailyModalOpen}
        onClose={() => {
          setIsDailyModalOpen(false);
          resumeRun();
        }}
        currentSeed={seed}
        onSelectSeed={(newSeed) => {
          setSeed(newSeed);
          startRun();
        }}
      />

      {/* Game Over Summary Dialog */}
      <GameOverDialog
        isOpen={isGameOverOpen}
        runSummary={runSummary}
        ghostData={ghostData}
        onRestart={handleStartGame}
        onSubmitLeaderboard={handleSubmitLeaderboard}
      />
    </div>
  );
}
