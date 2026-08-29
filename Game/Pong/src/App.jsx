import React, { useState } from 'react';
import { usePongGame } from './hooks/usePongGame';
import { HeaderHUD } from './components/HeaderHUD';
import { PongCanvas } from './components/PongCanvas';
import { TelemetrySidebar } from './components/TelemetrySidebar';
import { SignalingModal } from './components/SignalingModal';
import { SettingsModal } from './components/SettingsModal';
import { FooterBar } from './components/FooterBar';
import { CRTOverlay } from './components/CRTOverlay';

export function App() {
  const [isSignalingOpen, setIsSignalingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);

  const {
    canvasRef,
    gameMode,
    setGameMode,
    role,
    connectionStatus,
    scores,
    matchState,
    winner,
    rallyCount,
    currentSpeed,
    aiDifficulty,
    setAiDifficulty,
    scoreLimit,
    setScoreLimit,
    theme,
    setTheme,
    isCRTEnabled,
    setIsCRTEnabled,
    isMuted,
    toggleSound,
    volume,
    setVolume,
    screenShake,
    telemetry,
    debugLogs,
    generatedToken,
    tokenType,
    handleHostMatch,
    handleJoinOffer,
    handleAcceptAnswer,
    handleResetPeer,
    handleRestartMatch
  } = usePongGame();

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center relative select-none font-mono"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Authentic CRT Filter & Scanlines */}
      <CRTOverlay isEnabled={isCRTEnabled} />

      {/* Top Header HUD */}
      <HeaderHUD
        gameMode={gameMode}
        setGameMode={setGameMode}
        role={role}
        connectionStatus={connectionStatus}
        scores={scores}
        rallyCount={rallyCount}
        isMuted={isMuted}
        toggleSound={toggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSignaling={() => setIsSignalingOpen(true)}
        onRestart={handleRestartMatch}
        theme={theme}
      />

      {/* Center Main Stage */}
      <main className="w-full flex-1 flex items-center justify-center p-4 pt-16 pb-10">
        <PongCanvas
          canvasRef={canvasRef}
          screenShake={screenShake}
          matchState={matchState}
          winner={winner}
          onRestart={handleRestartMatch}
          theme={theme}
        />
      </main>

      {/* Real-time System Telemetry & Console Sidebar */}
      <TelemetrySidebar
        telemetry={telemetry}
        debugLogs={debugLogs}
        currentSpeed={currentSpeed}
        rallyCount={rallyCount}
        gameMode={gameMode}
        role={role}
        onClearLogs={() => {}}
        isOpen={isTelemetryOpen}
        setIsOpen={setIsTelemetryOpen}
      />

      {/* Bottom Status Bar */}
      <FooterBar
        gameMode={gameMode}
        role={role}
        matchState={matchState}
        onRestart={handleRestartMatch}
        onOpenSignaling={() => setIsSignalingOpen(true)}
      />

      {/* WebRTC Signaling / Handshake Modal */}
      <SignalingModal
        isOpen={isSignalingOpen}
        onClose={() => setIsSignalingOpen(false)}
        role={role}
        connectionStatus={connectionStatus}
        generatedToken={generatedToken}
        tokenType={tokenType}
        onHostMatch={handleHostMatch}
        onJoinOffer={handleJoinOffer}
        onAcceptAnswer={handleAcceptAnswer}
        onResetPeer={handleResetPeer}
      />

      {/* Settings & Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        scoreLimit={scoreLimit}
        setScoreLimit={setScoreLimit}
        aiDifficulty={aiDifficulty}
        setAiDifficulty={setAiDifficulty}
        isCRTEnabled={isCRTEnabled}
        setIsCRTEnabled={setIsCRTEnabled}
        volume={volume}
        setVolume={setVolume}
      />
    </div>
  );
}
export default App;
