import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Viewport3D } from './components/Viewport3D';
import { BitboardEngine } from './engine/BitboardEngine';
import { PeerSyncBus } from './engine/PeerSyncBus';
import { PlayerBadge } from './components/HUD/PlayerBadge';
import { StatusPill } from './components/HUD/StatusPill';
import { ControlsBar } from './components/HUD/ControlsBar';
import { BitboardInspector } from './components/HUD/BitboardInspector';
import { WinModal } from './components/HUD/WinModal';
import { sound } from './utils/audioEffects';

export function App() {
  const engineRef = useRef(new BitboardEngine());
  const viewportRef = useRef(null);
  const peerBusRef = useRef(null);

  const [gameState, setGameState] = useState(() => engineRef.current.getState());
  const [hoveredCell, setHoveredCell] = useState(null);
  const [gameMode, setGameMode] = useState('LOCAL'); // 'LOCAL' | 'AI' | 'PEER'
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [peerCount, setPeerCount] = useState(1);
  const [myPeerRole, setMyPeerRole] = useState('X');

  // Initialize PeerSyncBus for multi-tab synchronization
  useEffect(() => {
    const bus = new PeerSyncBus('cyber-3d-tictactoe-bus');
    peerBusRef.current = bus;

    const unsubscribe = bus.subscribe((event) => {
      if (event.type === 'PEER_CONNECTED') {
        setPeerCount((prev) => prev + 1);
      } else if (event.type === 'SYNC_MOVE') {
        // Execute remote peer move
        handleRemoteMove(event.cellIndex, event.playerRole);
      } else if (event.type === 'SYNC_RESET') {
        // Execute remote reset
        handleReset(false);
      }
    });

    return () => {
      unsubscribe();
      bus.destroy();
      peerBusRef.current = null;
    };
  }, []);

  const handleRemoteMove = useCallback((cellIndex, playerRole) => {
    const engine = engineRef.current;
    if (engine.isCellOccupied(cellIndex) || engine.status !== 'IN_PROGRESS') return;

    const result = engine.makeMove(cellIndex, playerRole);
    if (result.success) {
      const newState = engine.getState();
      setGameState(newState);

      // Play audio & 3D kinetic animation
      sound.playDrop(playerRole);
      viewportRef.current?.spawnPiece(cellIndex, playerRole, () => {
        if (newState.status === 'WON') {
          sound.playLaser();
          sound.playWin();
          viewportRef.current?.spawnWinLaser(newState.winningIndices);
          setScores((prev) => ({ ...prev, [newState.winner]: prev[newState.winner] + 1 }));
        } else if (newState.status === 'DRAW') {
          sound.playDraw();
        }
      });
    }
  }, []);

  // Handle player clicking a 3D cell collider
  const handleCellClick = useCallback(
    (cellIndex) => {
      const engine = engineRef.current;
      if (engine.status !== 'IN_PROGRESS' || engine.isCellOccupied(cellIndex)) {
        return;
      }

      // In PEER mode, enforce taking turn as assigned role if multi-tab
      const currentRole = engine.currentTurn;

      const result = engine.makeMove(cellIndex, currentRole);
      if (!result.success) return;

      const newState = engine.getState();
      setGameState(newState);

      // Broadcast move across multi-tab bus
      if (gameMode === 'PEER' && peerBusRef.current) {
        peerBusRef.current.sendMove(cellIndex, currentRole);
      }

      // Play sound and trigger 3D drop animation
      sound.playDrop(currentRole);
      viewportRef.current?.spawnPiece(cellIndex, currentRole, () => {
        if (newState.status === 'WON') {
          sound.playLaser();
          sound.playWin();
          viewportRef.current?.spawnWinLaser(newState.winningIndices);
          setScores((prev) => ({ ...prev, [newState.winner]: prev[newState.winner] + 1 }));
        } else if (newState.status === 'DRAW') {
          sound.playDraw();
        } else if (gameMode === 'AI' && newState.currentTurn === 'O') {
          // Trigger AI Move
          triggerAIMove();
        }
      });
    },
    [gameMode]
  );

  // Trigger AI Move in Single Player Mode
  const triggerAIMove = useCallback(() => {
    setTimeout(() => {
      const engine = engineRef.current;
      if (engine.status !== 'IN_PROGRESS' || engine.currentTurn !== 'O') return;

      const bestCell = engine.getBestAIMove('O');
      if (bestCell === null) return;

      const result = engine.makeMove(bestCell, 'O');
      if (!result.success) return;

      const newState = engine.getState();
      setGameState(newState);

      sound.playDrop('O');
      viewportRef.current?.spawnPiece(bestCell, 'O', () => {
        if (newState.status === 'WON') {
          sound.playLaser();
          sound.playWin();
          viewportRef.current?.spawnWinLaser(newState.winningIndices);
          setScores((prev) => ({ ...prev, [newState.winner]: prev[newState.winner] + 1 }));
        } else if (newState.status === 'DRAW') {
          sound.playDraw();
        }
      });
    }, 450);
  }, []);

  const handleCellHover = useCallback((index) => {
    setHoveredCell(index);
    if (index !== null) {
      sound.playHover();
    }
  }, []);

  const handleReset = useCallback((broadcast = true) => {
    engineRef.current.reset();
    setGameState(engineRef.current.getState());
    viewportRef.current?.resetScene();

    if (broadcast && peerBusRef.current && gameMode === 'PEER') {
      peerBusRef.current.sendReset();
    }
  }, [gameMode]);

  const handleResetCamera = useCallback(() => {
    viewportRef.current?.resetCamera();
  }, []);

  const handleToggleSound = useCallback(() => {
    const nextVal = sound.toggle();
    setSoundEnabled(nextVal);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07080f] select-none font-inter">
      {/* 3D Babylon.js Viewport Layer */}
      <Viewport3D
        ref={viewportRef}
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
      />

      {/* Cyber Grid Background Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-transparent to-black/60" />

      {/* React Bits / shadcn Glassmorphic HUD Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
        {/* Top Header & Turn Status Pill */}
        <StatusPill
          currentTurn={gameState.currentTurn}
          status={gameState.status}
          hoveredCell={hoveredCell}
          gameMode={gameMode}
          peerCount={peerCount}
        />

        {/* Middle Section: Player Badges Floating on Sides */}
        <div className="flex justify-between items-start w-full max-w-6xl mx-auto pointer-events-none px-2">
          {/* Player X Badge */}
          <div className="pointer-events-auto w-52 sm:w-64">
            <PlayerBadge
              role="X"
              label={gameMode === 'PEER' ? 'Player X (Host)' : 'Player X'}
              score={scores.X}
              isActive={gameState.status === 'IN_PROGRESS' && gameState.currentTurn === 'X'}
              mask={gameState.mx}
              isAI={false}
              peerConnected={gameMode === 'PEER'}
            />
          </div>

          {/* Player O Badge */}
          <div className="pointer-events-auto w-52 sm:w-64">
            <PlayerBadge
              role="O"
              label={gameMode === 'AI' ? 'Cyber-AI' : gameMode === 'PEER' ? 'Player O (Peer)' : 'Player O'}
              score={scores.O}
              isActive={gameState.status === 'IN_PROGRESS' && gameState.currentTurn === 'O'}
              mask={gameState.mo}
              isAI={gameMode === 'AI'}
              peerConnected={gameMode === 'PEER'}
            />
          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div className="pointer-events-auto mt-auto">
          <ControlsBar
            gameMode={gameMode}
            onSelectMode={(mode) => {
              setGameMode(mode);
              handleReset(true);
            }}
            onResetGame={() => handleReset(true)}
            onResetCamera={handleResetCamera}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setInspectorOpen((prev) => !prev)}
            peerCount={peerCount}
          />
        </div>
      </div>

      {/* Bitboard 9-bit FSM Debugger Drawer / Inspector */}
      <BitboardInspector
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        mx={gameState.mx}
        mo={gameState.mo}
        winningMask={gameState.winningMask}
      />

      {/* Win / Draw Modal */}
      <WinModal
        status={gameState.status}
        winner={gameState.winner}
        winningIndices={gameState.winningIndices}
        onRematch={() => handleReset(true)}
      />
    </div>
  );
}
export default App;
