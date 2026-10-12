import React, { useState, useEffect, useRef } from 'react';
import { useZombieSurvivalEngine } from './engine/useZombieSurvivalEngine';
import { FloatingHUD } from './components/FloatingHUD';
import { ScrapForgeModal } from './components/ScrapForgeModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { PostMortemModal } from './components/PostMortemModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { TouchControls } from './components/TouchControls';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import {
  Skull,
  Radio,
  Flame,
  Shield,
  Crosshair,
  Calendar,
  Sparkles,
  Users,
  Smartphone,
  Trophy,
} from 'lucide-react';

export default function App() {
  const [dailySeedInfo, setDailySeedInfo] = useState<{
    seed: string;
    protocol: string;
    utcDate: string;
    modifiers: string[];
  } | null>(null);

  const [customSeedInput, setCustomSeedInput] = useState('');
  const [activeSeed, setActiveSeed] = useState<string>('2026-10-09-QUARANTINE');

  // Modals
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Live Spectator Feed via WebSockets
  const [liveSquadAlerts, setLiveSquadAlerts] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch Daily Seed from Fastify Backend
  useEffect(() => {
    const fetchDailySeed = async () => {
      try {
        const res = await fetch('/api/waves/daily');
        if (res.ok) {
          const data = await res.json();
          setDailySeedInfo(data);
          setActiveSeed(data.seed);
        }
      } catch (err) {
        // Fallback default
        setActiveSeed('2026-10-09-QUARANTINE');
      }
    };
    fetchDailySeed();
  }, []);

  // WebSockets spectator relay
  useEffect(() => {
    let ws: WebSocket;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'alert') {
            setLiveSquadAlerts((prev) => [msg.text, ...prev].slice(0, 3));
          }
        } catch (e) {}
      };

      wsRef.current = ws;
    } catch (e) {}

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Initialize Game Engine Hook
  const {
    canvasRef,
    gameState,
    settings,
    setSettings,
    startNextWave,
    triggerReload,
    upgradeWeapon,
    repairBarricade,
    deployFloodlight,
    deployTripwire,
    switchWeapon,
    restartGame,
    setTouchMove,
    setTouchAim,
    getTelemetry,
  } = useZombieSurvivalEngine(activeSeed);

  // Auto-resize Canvas to full window size
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  // Global Hotkey for Forge [B] & Settings [ESC]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyB') {
        setIsForgeOpen((prev) => !prev);
      } else if (e.code === 'Escape') {
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto open forge between waves
  useEffect(() => {
    if (gameState.status === 'WAVE_INTERMISSION') {
      setIsForgeOpen(true);
    }
  }, [gameState.status]);

  const handleStartMission = () => {
    restartGame(activeSeed);
  };

  const isGameOver = gameState.status === 'GAME_OVER';
  const isIdle = gameState.status === 'IDLE';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070A0B] text-slate-100 select-none">
      {/* 2D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair-tactical block"
      />

      {/* CRT Scanline & Grain Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none scanline-overlay z-10" />

      {/* Floating Combat HUD (Active during combat) */}
      {!isIdle && !isGameOver && (
        <FloatingHUD
          gameState={gameState}
          onOpenForge={() => setIsForgeOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onTriggerReload={triggerReload}
          onDeployTripwire={deployTripwire}
          onRepairNearestBarricade={() => {
            const nearest = gameState.barricades[0];
            if (nearest) repairBarricade(nearest.id);
          }}
          onSwitchWeapon={switchWeapon}
        />
      )}

      {/* Mobile Touch Controls Overlay */}
      {showTouchControls && !isIdle && !isGameOver && (
        <TouchControls
          onMove={setTouchMove}
          onAim={setTouchAim}
          onReload={triggerReload}
          onSwitchWeapon={() => {
            const nextIdx = (gameState.player.activeWeaponIndex + 1) % gameState.player.weapons.length;
            switchWeapon(nextIdx);
          }}
        />
      )}

      {/* Live Squad Relay Ticker */}
      {liveSquadAlerts.length > 0 && (
        <div className="absolute top-20 right-6 z-20 pointer-events-none space-y-1">
          {liveSquadAlerts.map((alert, i) => (
            <div
              key={i}
              className="bg-black/80 border-l-2 border-amber-500 px-3 py-1 text-[11px] font-mono text-amber-300 backdrop-blur-sm animate-in fade-in slide-in-from-right"
            >
              [RELAY] {alert}
            </div>
          ))}
        </div>
      )}

      {/* ZERO-FRICTION "DROP INTO QUARANTINE" MISSION BRIEFING / ONBOARDING MODAL */}
      {isIdle && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0C1012] border-2 border-amber-500/60 rounded-md p-6 sm:p-8 text-slate-100 shadow-[0_0_80px_rgba(245,158,11,0.25)]">
            {/* Header */}
            <div className="text-center pb-5 border-b border-[#1E272B] mb-5">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-widest mb-3">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> BIOHAZARD PROTOCOL ACTIVE
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-black tracking-wider text-white uppercase">
                QUARANTINE SURVIVAL
              </h1>
              <p className="text-xs sm:text-sm font-mono text-slate-400 mt-1 max-w-md mx-auto">
                Deterministic twin-stick horde defense. Evolve modular weapons, barricade chokepoints, and survive the blackout swarms.
              </p>
            </div>

            {/* Daily Seed & Modifiers Card */}
            <div className="bg-[#13191C] border border-[#1E272B] p-4 rounded-md mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    DAILY SYNCHRONIZED SEED:
                  </span>
                  <Badge variant="hazard" className="font-mono text-xs">
                    {activeSeed}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLeaderboardOpen(true)}
                  className="text-xs h-7 text-amber-400 border-amber-500/40"
                >
                  <Trophy className="w-3.5 h-3.5 mr-1" /> VIEW LEADERBOARD
                </Button>
              </div>

              {/* Modifiers */}
              <div className="text-[11px] font-mono text-slate-300 space-y-1">
                <div className="flex items-center gap-2 text-red-400">
                  <Flame className="w-3.5 h-3.5" /> Sector Incursions: Walkers, Sprinters, Acid Spitters, Armored Brutes.
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" /> Modular Scrap Forge: Unlock Tesla Shock, Incendiary, & Cryo munitions.
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <Shield className="w-3.5 h-3.5" /> Field Fortifications: Board up entryways and plant halogen floodlights.
                </div>
              </div>
            </div>

            {/* Field Controls Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs mb-6">
              <div className="bg-slate-950 p-2 rounded-sm border border-slate-800">
                <div className="text-amber-400 font-bold text-sm">WASD</div>
                <div className="text-[10px] text-slate-400">360° LOCOMOTION</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-sm border border-slate-800">
                <div className="text-emerald-400 font-bold text-sm">[R] KEY</div>
                <div className="text-[10px] text-slate-400">ACTIVE RELOAD (SWEET SPOT)</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-sm border border-slate-800">
                <div className="text-cyan-400 font-bold text-sm">[1] [2] [3]</div>
                <div className="text-[10px] text-slate-400">QUICK-RACK WEAPONS</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-sm border border-slate-800">
                <div className="text-red-400 font-bold text-sm">[F] / [E]</div>
                <div className="text-[10px] text-slate-400">FORTIFY & MINES</div>
              </div>
            </div>

            {/* Custom Seed Input Option */}
            <div className="flex items-center gap-2 mb-6 bg-slate-900/60 p-2 rounded-sm border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">CUSTOM SEED:</span>
              <input
                type="text"
                placeholder={activeSeed}
                value={customSeedInput}
                onChange={(e) => setCustomSeedInput(e.target.value)}
                className="bg-black/60 border border-slate-700 rounded-sm px-2 py-1 text-xs font-mono text-white flex-1 focus:border-amber-500 focus:outline-none"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (customSeedInput.trim()) {
                    setActiveSeed(customSeedInput.trim());
                  }
                }}
                className="text-xs h-7"
              >
                LOCK SEED
              </Button>
            </div>

            {/* Deploy CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowTouchControls(!showTouchControls)}
                className="w-full sm:w-auto text-xs gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                {showTouchControls ? 'TOUCH STICKS: ON' : 'ENABLE TOUCH STICKS'}
              </Button>

              <Button
                variant="hazard"
                size="lg"
                onClick={handleStartMission}
                className="w-full sm:w-auto px-8 py-3 text-base font-black tracking-widest gap-2 shadow-[0_0_30px_rgba(245,158,11,0.5)]"
              >
                <Crosshair className="w-5 h-5" /> DEPLOY TO OUTPOST →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scrap Forge Upgrade Drawer/Modal */}
      <ScrapForgeModal
        open={isForgeOpen}
        onOpenChange={setIsForgeOpen}
        playerScrap={gameState.player.scrap}
        weapons={gameState.player.weapons}
        activeWeaponIndex={gameState.player.activeWeaponIndex}
        onUpgradeWeapon={upgradeWeapon}
        onDeployFloodlight={deployFloodlight}
        onDeployTripwire={deployTripwire}
        onRepairNearestBarricade={() => {
          const nearest = gameState.barricades[0];
          return nearest ? repairBarricade(nearest.id) : false;
        }}
        onResumeGame={() => {
          setIsForgeOpen(false);
          if (gameState.status === 'WAVE_INTERMISSION') {
            startNextWave();
          }
        }}
      />

      {/* Pause & Accessibility Settings Drawer */}
      <SettingsDrawer
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        showTouchControls={showTouchControls}
        onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
      />

      {/* Post-Mortem Debrief / Quarantine Failure Modal */}
      <PostMortemModal
        open={isGameOver}
        gameState={gameState}
        telemetry={getTelemetry()}
        onRestartGame={() => restartGame(activeSeed)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      {/* Global Quarantine Leaderboard Modal */}
      <LeaderboardModal
        open={isLeaderboardOpen}
        onOpenChange={setIsLeaderboardOpen}
        currentSeed={activeSeed}
      />
    </div>
  );
}
