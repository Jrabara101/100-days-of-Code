import React, { useState, useEffect } from 'react';
import { useCombatEngine } from './hooks/useCombatEngine';
import { CombatTimeline } from './components/CombatTimeline';
import { FighterStage } from './components/FighterStage';
import { CommandTray } from './components/CommandTray';
import { CombatLogDrawer } from './components/CombatLogDrawer';
import { LobbyModal } from './components/LobbyModal';
import { MatchSummaryModal } from './components/MatchSummaryModal';

export const App: React.FC = () => {
  const {
    gameState,
    isConnected,
    isCommitted,
    opponentCommitted,
    selectedActionId,
    selectedStance,
    floatingTexts,
    isScreenShaking,
    activeAttackVfx,
    combatLogs,
    isResolvingStepByStep,
    timeRemainingMs,
    createRoom,
    joinRoom,
    selectAction,
    setStance,
    commitAction,
    requestRematch,
  } = useCombatEngine();

  const [isCombatLogOpen, setIsCombatLogOpen] = useState<boolean>(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState<boolean>(false);

  // Auto-dispatch into AI match on first load if no match exists once connected
  useEffect(() => {
    if (isConnected && !gameState) {
      createRoom('PYRO-FRAME SCION', true);
    }
  }, [isConnected, gameState, createRoom]);

  const isMatchOver = gameState?.phase === 'MATCH_OVER';

  return (
    <div className="relative min-h-screen bg-magma-950 font-chakra text-text-primary antialiased selection:bg-ember-orange selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Background Volcanic Atmospherics */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_10%,rgba(255,87,34,0.18),transparent_75%),radial-gradient(ellipse_70%_55%_at_50%_100%,rgba(220,38,38,0.22),transparent_70%)]" />
      <div className="fixed inset-0 scanline-overlay opacity-60 z-0" />

      {/* HEADER: Combat Timeline & Initiative */}
      <CombatTimeline
        gameState={gameState}
        timeRemainingMs={timeRemainingMs}
        onOpenCombatLog={() => setIsCombatLogOpen(true)}
        onOpenLobby={() => setIsLobbyOpen(true)}
      />

      {/* MAIN VIEWPORT: Fighter Stage */}
      <main className="flex-1 w-full pt-[68px] pb-1 relative z-10 flex flex-col justify-center overflow-hidden">
        {gameState ? (

          <FighterStage
            player={gameState.playerFighter}
            enemy={gameState.enemyFighter}
            floatingTexts={floatingTexts}
            isScreenShaking={isScreenShaking}
            activeAttackVfx={activeAttackVfx}
            opponentCommitted={opponentCommitted}
          />
        ) : (
          <div className="w-full h-80 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-solar-gold border-t-transparent animate-spin" />
            <span className="font-mono text-xs text-solar-gold tracking-widest uppercase">
              INITIALIZING CALDERA ORBITAL UPLINK...
            </span>
          </div>
        )}
      </main>

      {/* BOTTOM COMMAND TRAY */}
      {gameState && (
        <CommandTray
          player={gameState.playerFighter}
          selectedActionId={selectedActionId}
          selectedStance={selectedStance}
          isCommitted={isCommitted}
          isResolving={isResolvingStepByStep || gameState.phase === 'RESOLVING_ACTIONS'}
          onSelectAction={selectAction}
          onSetStance={setStance}
          onCommitAction={commitAction}
        />
      )}

      {/* VOLCANIC TELEMETRY FOOTER */}
      <footer className="w-full bg-magma-950/95 border-t border-magma-800 py-1.5 px-4 lg:px-8 relative z-20">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] font-mono text-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-rajdhani font-bold text-xs text-solar-gold uppercase">
              SOLAR EMBER PROTOCOL
            </span>
            <span>// SECTOR-IX CALDERA MVP v2.0</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-crimson-heat'} animate-pulse`} />
              SERVER: {isConnected ? 'ONLINE (120Hz)' : 'CONNECTING'}
            </span>
            <span>COMMIT-REVEAL: AUTH-LOCKED</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <CombatLogDrawer
        open={isCombatLogOpen}
        onOpenChange={setIsCombatLogOpen}
        logs={combatLogs}
      />

      <LobbyModal
        open={isLobbyOpen}
        onOpenChange={setIsLobbyOpen}
        gameState={gameState}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
      />

      <MatchSummaryModal
        open={Boolean(isMatchOver)}
        gameState={gameState}
        onRematch={requestRematch}
        onNewMatch={() => {
          setIsLobbyOpen(true);
        }}
      />
    </div>
  );
};

export default App;
