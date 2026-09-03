import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SnakeEngine } from './engine/SnakeEngine';
import { DEFAULT_SETTINGS } from './engine/types';
import type { Direction, GameSettings, GameState, PlayerId, TelemetryData } from './engine/types';
import { GameHUD } from './components/GameHUD';
import { CanvasViewport } from './components/CanvasViewport';
import { ControlsLegend } from './components/ControlsLegend';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { globalAudio } from './engine/AudioEngine';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const engineRef = useRef<SnakeEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new SnakeEngine(DEFAULT_SETTINGS);
  }
  const engine = engineRef.current;

  const [gameState, setGameState] = useState<GameState>(engine.gameState);
  const [telemetry, setTelemetry] = useState<TelemetryData>(engine.getTelemetry());
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);

  // Sync engine callbacks
  useEffect(() => {
    engine.onStateChange = (newState: GameState) => {
      setGameState(newState);
    };

    // Telemetry update interval (updates React state 30 times a second)
    const telemetryInterval = setInterval(() => {
      setTelemetry(engine.getTelemetry());
    }, 33);

    return () => clearInterval(telemetryInterval);
  }, [engine]);

  // Global Keydown & Keyup Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game controls
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });

      // P1 Inputs (WASD)
      if (key === 'w') engine.handleInput(1, 'UP');
      else if (key === 'a') engine.handleInput(1, 'LEFT');
      else if (key === 's') engine.handleInput(1, 'DOWN');
      else if (key === 'd') engine.handleInput(1, 'RIGHT');

      // P2 Inputs (Arrow Keys) - only active in Local 2P Human mode
      else if (key === 'arrowup') engine.handleInput(2, 'UP');
      else if (key === 'arrowleft') engine.handleInput(2, 'LEFT');
      else if (key === 'arrowdown') engine.handleInput(2, 'DOWN');
      else if (key === 'arrowright') engine.handleInput(2, 'RIGHT');

      // Global Shortcuts
      else if (e.code === 'Space') {
        engine.togglePause();
      } else if (key === 'r') {
        engine.startCountdown();
      } else if (key === 'm') {
        const nextSound = !settings.soundEnabled;
        setSettings((s) => ({ ...s, soundEnabled: nextSound }));
        engine.updateSettings({ soundEnabled: nextSound });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, settings.soundEnabled]);

  const handleStartRestart = useCallback(() => {
    setShowSettings(false);
    engine.startCountdown();
  }, [engine]);

  const handleTogglePause = useCallback(() => {
    engine.togglePause();
  }, [engine]);

  const handleToggleSound = useCallback(() => {
    const nextSound = !settings.soundEnabled;
    const newSettings = { ...settings, soundEnabled: nextSound };
    setSettings(newSettings);
    engine.updateSettings(newSettings);
  }, [engine, settings]);

  const handleUpdateSettings = useCallback(
    (updated: Partial<GameSettings>) => {
      const newSettings = { ...settings, ...updated };
      setSettings(newSettings);
      engine.updateSettings(newSettings);
    },
    [engine, settings]
  );

  const handleVirtualInput = useCallback(
    (playerId: PlayerId, direction: Direction) => {
      globalAudio.playClick();
      engine.handleInput(playerId, direction);
    },
    [engine]
  );

  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans uppercase font-bold select-none overflow-x-hidden">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 grid-bg z-0 opacity-25 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col min-h-screen w-full max-w-[1320px] mx-auto p-2 sm:p-4 lg:p-6 justify-between gap-4">
        {/* Top HUD */}
        <GameHUD
          telemetry={telemetry}
          isPaused={gameState === 'PAUSED'}
          soundEnabled={settings.soundEnabled}
          onTogglePause={handleTogglePause}
          onToggleSound={handleToggleSound}
          onOpenSettings={() => setShowSettings(true)}
          onToggleTelemetry={() => setShowTelemetry((v) => !v)}
          showTelemetry={showTelemetry}
        />

        {/* Real-Time Telemetry Inspector Drawer */}
        {showTelemetry && (
          <TelemetryDrawer
            telemetry={telemetry}
            onClose={() => setShowTelemetry(false)}
          />
        )}

        {/* Center Canvas Viewport */}
        <CanvasViewport
          engine={engine}
          gameState={gameState}
          retroScanlines={settings.retroScanlines}
          onRestart={handleStartRestart}
        />

        {/* Bottom Controls Legend */}
        <ControlsLegend
          activeKeys={activeKeys}
          onVirtualInput={handleVirtualInput}
          opponentMode={settings.opponentMode}
          aiDifficulty={settings.aiDifficulty}
        />
      </div>

      {/* Modals */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          telemetry={telemetry}
          onRestart={handleStartRestart}
        />
      )}

      {gameState === 'PAUSED' && !showSettings && (
        <PauseModal
          onResume={handleTogglePause}
          onRestart={handleStartRestart}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;
