import React, { useState, useEffect, useRef } from 'react';
import { WordWerewolfEngine } from './engine/WordWerewolfEngine';
import { CouncilSessionState, NavSection } from './engine/types';
import { VoxelCouncil3D } from './viewport/VoxelCouncil3D';
import { soundEngine } from './audio/soundEngine';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ProtocolBanner } from './components/ProtocolBanner';
import { ClueFeed } from './components/ClueFeed';
import { RoleCard } from './components/RoleCard';
import { ClueInputTerminal } from './components/ClueInputTerminal';
import { TribunalVotingGrid } from './components/TribunalVotingGrid';
import { RebuttalModal } from './components/RebuttalModal';
import { SettlementModal } from './components/SettlementModal';
import { SuspectDossiersModal } from './components/SuspectDossiersModal';
import { EvidenceLockerModal } from './components/EvidenceLockerModal';
import { TacticalLogsModal } from './components/TacticalLogsModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [engine] = useState(() => new WordWerewolfEngine());
  const [session, setSession] = useState<CouncilSessionState>(() => ({
    state: engine.state,
    round: engine.round,
    tick: engine.tick,
    tickHex: '0x' + engine.tick.toString(16).toUpperCase(),
    players: engine.players,
    currentWordPair: engine.currentWordPair,
    civilianWord: engine.civilianWord,
    werewolfWord: engine.werewolfWord,
    werewolfId: engine.werewolfId,
    clueTurnIndex: engine.clueTurnIndex,
    cluesSubmitted: engine.cluesSubmitted,
    convictedPlayerId: engine.convictedPlayerId,
    winnerTeam: engine.winnerTeam,
    victoryReason: engine.victoryReason,
    userPlayer: engine.players[0],
    telemetryLog: engine.telemetryLog,
    rebuttalGuessedWord: engine.rebuttalGuessedWord,
    isRebuttalCorrect: engine.isRebuttalCorrect,
    deliberationTimeLeft: engine.deliberationTimeLeft
  }));

  const [activeSection, setActiveSection] = useState<NavSection>('chamber');
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [showCrt, setShowCrt] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const voxelSceneRef = useRef<VoxelCouncil3D | null>(null);

  // Initialize Engine listener and Three.js low-res 320x200 canvas
  useEffect(() => {
    engine.setListener((updatedState) => {
      setSession({ ...updatedState });
    });

    if (canvasRef.current && !voxelSceneRef.current) {
      voxelSceneRef.current = new VoxelCouncil3D(canvasRef.current);
    }

    return () => {
      if (voxelSceneRef.current) {
        voxelSceneRef.current.destroy();
        voxelSceneRef.current = null;
      }
    };
  }, [engine]);

  // Update 3D viewport active markers & character motions when session changes
  useEffect(() => {
    if (voxelSceneRef.current) {
      const highestSusp = session.players.slice().sort((a, b) => b.suspicion - a.suspicion)[0]?.id || 3;
      voxelSceneRef.current.updateMarkers(session.clueTurnIndex, highestSusp);
      if (session.state === 'CLUES') {
        voxelSceneRef.current.setSpeakerBob(session.clueTurnIndex);
      }
    }
  }, [session.clueTurnIndex, session.players, session.state]);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleCrt = () => {
    setShowCrt(!showCrt);
  };

  const handleAdvanceToClues = () => {
    engine.advanceFromReveal();
  };

  const handleSubmitClue = (clue: string) => {
    engine.submitClue(0, clue);
  };

  const handleCastVote = (targetId: number) => {
    engine.castBallot(0, targetId);
  };

  const handleSubmitRebuttal = (guess: string) => {
    engine.submitWerewolfRebuttalGuess(guess);
  };

  const handleNextRound = () => {
    engine.startNewMatch();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0b0d1a] font-mono text-[#e1e1f3] overflow-x-hidden">
      {/* CRT Scanline Shader Overlay */}
      {showCrt && <div className="fixed inset-0 crt-overlay z-[60] pointer-events-none"></div>}
      <div className="fixed inset-0 crt-vignette z-[55] pointer-events-none"></div>

      {/* 3D Pixelated Voxel Canvas Layer (Strict 320x200 Nearest-Neighbor Buffer) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <canvas
          ref={canvasRef}
          id="pixel-canvas"
          className="pixel-canvas opacity-70"
          width={320}
          height={200}
        />
        {/* Subtle Dark Gradient Overlay to ensure crisp UI legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d1a]/85 via-transparent to-[#0b0d1a]/95 pointer-events-none"></div>
      </div>

      {/* Header Telemetry Bar */}
      <Header
        session={session}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Sidebar Channel Switchboard */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(section) => setActiveSection(section)}
        session={session}
      />

      {/* Main Deliberation Cockpit Area */}
      <div className="md:pl-64 pt-16 pb-10 min-h-screen relative z-10">
        <main className="w-full px-3 md:px-6 py-4 max-w-7xl mx-auto flex flex-col">
          {/* Top Protocol Status Banner & Role Unmask Card */}
          <ProtocolBanner session={session} />

          {/* Bento Split-Stage Grid (5 cols / 7 cols ratio) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
            {/* Left Stage Column: Clue Feed Transcript & Telemetry */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <ClueFeed session={session} />
            </div>

            {/* Right Stage Column: Role Reveal, Clue Dispatch, and Tribunal Accusation Grid */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* 1. Secret Role Matrix Card */}
              <RoleCard
                session={session}
                onAdvanceToClues={handleAdvanceToClues}
              />

              {/* 2. Tactical Clue Dispatch Terminal */}
              <ClueInputTerminal
                session={session}
                onSubmitClue={handleSubmitClue}
              />

              {/* 3. Tribunal Accusation Actuators (2x2 Grid) */}
              <TribunalVotingGrid
                session={session}
                onCastVote={handleCastVote}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Phase 4: Werewolf Rebuttal Modal (If werewolf is caught) */}
      {session.state === 'REBUTTAL' && (
        <RebuttalModal
          session={session}
          onSubmitGuess={handleSubmitRebuttal}
        />
      )}

      {/* Phase 5: Conclave Resolution & Settlement Modal */}
      {session.state === 'SETTLEMENT' && (
        <SettlementModal
          session={session}
          onNextRound={handleNextRound}
        />
      )}

      {/* Channel 03: Suspect Dossiers Modal */}
      {activeSection === 'dossiers' && (
        <SuspectDossiersModal
          session={session}
          onClose={() => setActiveSection('chamber')}
        />
      )}

      {/* Channel 04: Evidence Locker Modal */}
      {activeSection === 'evidence' && (
        <EvidenceLockerModal
          session={session}
          onClose={() => setActiveSection('chamber')}
        />
      )}

      {/* Channel 05: Tactical Logs Modal */}
      {activeSection === 'logs' && (
        <TacticalLogsModal
          session={session}
          onClose={() => setActiveSection('chamber')}
        />
      )}

      {/* System Settings Modal */}
      {showSettings && (
        <SettingsModal
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          showCrt={showCrt}
          onToggleCrt={handleToggleCrt}
          onRestartMatch={() => engine.initSession()}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Retro Bottom Telemetry Footer */}
      <footer className="fixed bottom-0 left-0 right-0 h-8 z-40 bg-[#0b0d1a] border-t-2 border-[#323442] shadow-[0_-2px_0_0_#060814]">
        <div className="h-8 w-full px-4 flex items-center justify-between text-[#94a3b8] text-[10px] font-mono overflow-hidden">
          <div className="flex items-center gap-4 truncate">
            <span className="text-[#38bdf8] flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 bg-[#38bdf8] inline-block animate-pulse"></span>
              SYS.RUNNING: 120_FPS
            </span>
            <span className="text-[#f59e0b] truncate">
              [TICKER]: DELIBERATION WINDOW {session.state === 'VOTING' ? `${session.deliberationTimeLeft}s` : 'ACTIVE'}
            </span>
            <span className="hidden lg:inline text-[#94a3b8]">
              ENCRYPTION: 64-BIT VOXEL-KEY
            </span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-[#f43f5e] font-bold">ACCUSATION THRESHOLD: 60%</span>
            <span className="text-[#38bdf8] font-mono">HOST: VOXEL_CHAMBER_01</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
