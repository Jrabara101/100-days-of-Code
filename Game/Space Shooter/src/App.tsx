import React, { useState, useEffect, useRef } from 'react';
import { useSpaceShooterEngine } from './hooks/useSpaceShooterEngine';
import { useGameRelay } from './hooks/useGameRelay';
import { NavigationHeader } from './components/NavigationHeader';
import { GameCanvas } from './components/GameCanvas';
import { CommsFeed } from './components/hud/CommsFeed';
import { HangarModal } from './components/modals/HangarModal';
import { SettingsSheet } from './components/modals/SettingsSheet';
import { DebriefModal } from './components/modals/DebriefModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { generateSectorWaves } from '../server/waveDirector';
import { getDailySeed } from '../server/prng';
import { SectorConfig } from '../server/waveDirector';
import { Play, Rocket, Trophy, Keyboard, Sparkles } from 'lucide-react';
import { Button } from './components/ui/Button';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<'interceptor' | 'dreadnought' | 'scout'>('interceptor');
  const [sectorData, setSectorData] = useState<SectorConfig | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Modals state
  const [hangarOpen, setHangarOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);

  // Engine Hook
  const {
    gameState,
    finalRunData,
    startRun,
    togglePause,
    triggerDash,
    triggerEMP,
    setShip,
    updateSettings,
    clearFinalRunData,
  } = useSpaceShooterEngine(canvasRef, selectedShipId);

  // WebSocket Comms Relay
  const { latestTicker, isConnected, onlinePilots } = useGameRelay();

  // Load Daily Sector on Mount
  useEffect(() => {
    fetch('/api/sectors/daily')
      .then((res) => res.json())
      .then((data) => {
        setSectorData(data);
      })
      .catch((err) => {
        console.warn('Backend sector API unavailable, generating local daily sector:', err);
        const daily = getDailySeed();
        const fallbackSector = generateSectorWaves(daily.seed, 10);
        setSectorData(fallbackSector);
      });
  }, []);

  // Launch initial sortie when sector data is ready
  const handleStartGame = () => {
    if (sectorData) {
      startRun(sectorData);
      setIsPaused(false);
    }
  };

  const handlePauseToggle = () => {
    const paused = togglePause();
    setIsPaused(paused);
  };

  const handleShipChange = (shipId: 'interceptor' | 'dreadnought' | 'scout') => {
    setSelectedShipId(shipId);
    setShip(shipId);
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface flex flex-col justify-between relative select-none">
      {/* HUD Corner Tactical Brackets (Avionics framing) */}
      <div className="fixed inset-0 pointer-events-none z-30">
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-primary/40" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-primary/40" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-primary/40" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-primary/40" />
      </div>

      {/* Top Avionics Navigation Header */}
      <NavigationHeader
        onOpenHangar={() => setHangarOpen(true)}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onTogglePause={handlePauseToggle}
        isPaused={isPaused}
        sectorName={sectorData?.sectorName || 'Daily Sector'}
      />

      {/* Main Tactical Arena Content */}
      <main className="w-full pt-16 flex-1 flex flex-col items-center justify-center px-2 sm:px-6 py-4">
        <div className="w-full max-w-6xl relative flex flex-col items-center">
          {/* Game Canvas Container */}
          <GameCanvas
            canvasRef={canvasRef}
            gameState={gameState}
            onDash={triggerDash}
            onEMP={triggerEMP}
          />

          {/* Start Screen Overlay if IDLE */}
          {gameState.status === 'IDLE' && (
            <div className="absolute inset-0 z-30 bg-surface-container-lowest/85 backdrop-blur-md rounded-xl flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(76,215,246,0.6)] animate-pulse">
                <Rocket className="w-8 h-8 text-primary" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold font-mono text-primary uppercase tracking-wider mb-2">
                SYS.AEROSTRIKE // MK-IV
              </h1>
              <p className="text-xs sm:text-sm font-mono text-on-surface-variant max-w-lg mb-6">
                Contested Sector Anomaly detected. Thread high-velocity projectiles in the Graze Zone to supercharge your modular weapon synergies.
              </p>

              {/* Mission Launch Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                <Button
                  size="lg"
                  variant="neon"
                  onClick={handleStartGame}
                  className="px-8 py-3 text-sm h-12"
                >
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  DROP INTO ORBIT [START MISSION]
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setHangarOpen(true)}
                  className="h-12"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  HANGAR & LOADOUT
                </Button>
              </div>

              {/* Quick Controls Cheat-Sheet */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container/60 p-3 rounded-lg border border-outline-variant/30 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-primary font-bold">WASD / MOUSE</span>
                  <span>Thrust & Aim</span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-amber-300 font-bold">CLICK / SPACE</span>
                  <span>Cannons</span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-secondary font-bold">SHIFT / R-CLICK</span>
                  <span>Phase Dash</span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-tertiary-fixed font-bold">SPACE / F</span>
                  <span>EMP Overdrive</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Comms Feed & Status Ticker */}
      <CommsFeed
        latestTicker={latestTicker}
        isConnected={isConnected}
        onlinePilots={onlinePilots}
      />

      {/* Modals & Drawers */}
      <HangarModal
        open={hangarOpen}
        onOpenChange={setHangarOpen}
        selectedShipId={selectedShipId}
        onSelectShip={handleShipChange}
      />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={gameState.settings}
        onUpdateSettings={updateSettings}
        onResume={handlePauseToggle}
        onRestart={handleStartGame}
        isPaused={isPaused}
      />

      <DebriefModal
        open={Boolean(finalRunData)}
        onOpenChange={(open) => {
          if (!open) clearFinalRunData();
        }}
        runData={finalRunData}
        onRestart={handleStartGame}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
      />

      <LeaderboardModal
        open={leaderboardOpen}
        onOpenChange={setLeaderboardOpen}
      />
    </div>
  );
}
