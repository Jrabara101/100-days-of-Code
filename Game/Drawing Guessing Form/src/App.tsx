import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useSyncRoom } from '@/hooks/useSyncRoom';
import { GameHeader } from '@/components/game/GameHeader';
import { ArtistToolbar } from '@/components/canvas/ArtistToolbar';
import { DualLayerCanvas } from '@/components/canvas/DualLayerCanvas';
import { ScoreboardSticky } from '@/components/game/ScoreboardSticky';
import { ChatStream } from '@/components/game/ChatStream';
import { PlayersDrawer } from '@/components/game/PlayersDrawer';
import { WordSelectModal } from '@/components/game/WordSelectModal';
import { RoundRecapModal } from '@/components/game/RoundRecapModal';
import { PartyModifiersModal } from '@/components/game/PartyModifiersModal';
import { DualScreenPairingModal } from '@/components/game/DualScreenPairingModal';
import { MatchPodiumModal } from '@/components/game/MatchPodiumModal';
import { MobileStylusView } from '@/components/mobile/MobileStylusView';
import { fireStudioConfetti } from '@/components/react-bits/ConfettiBurst';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { DrawAction } from '@/types/game';

export const App: React.FC = () => {
  const {
    roomId,
    round,
    phase,
    timeLeft,
    maxTime,
    hiddenWord,
    targetWord,
    activeCategory,
    wordChoices,
    players,
    localPlayerId,
    currentArtistId,
    canvasState,
    modifiers,
    isSoundEnabled,
    viewMode,
    currentTool,
    brushColor,
    brushSize,
    chatMessages,
    setCurrentTool,
    setBrushColor,
    setBrushSize,
    addCanvasAction,
    undoCanvasAction,
    clearCanvas,
    setCanvasActions,
    selectWord,
    submitGuess,
    toggleBlindfold,
    toggleOneLine,
    setActiveDeck,
    setCustomWords,
    setViewMode,
    toggleSound,
    startNextRound,
    restartGame,
  } = useGameStore();

  const { broadcastAction } = useSyncRoom();
  const { playSuccessChime, playWarmAlert } = useSoundEffects(isSoundEnabled);

  // Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isModifiersOpen, setIsModifiersOpen] = useState(false);
  const [burstPoints, setBurstPoints] = useState<number | null>(null);

  const localPlayer = players.find((p) => p.id === localPlayerId) || players[0];
  const activeArtist = players.find((p) => p.id === currentArtistId) || players[0];
  const isArtist = localPlayer.id === currentArtistId;

  // Detect URL search params (e.g. ?view=mobile)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'mobile') {
      setViewMode('mobile_stylus');
    }
  }, [setViewMode]);

  // Initial Seed Sample Sketch (Hand-drawn Giraffe from prototype)
  useEffect(() => {
    if (canvasState.actions.length === 0) {
      const cx = 330;
      const cy = 200;

      // Initial vector strokes
      const sampleStrokes: DrawAction[] = [
        // Neck and head contour
        {
          type: 'stroke',
          id: 'initial_neck',
          color: '#1E2638',
          width: 3.5,
          tool: 'brush',
          timestamp: Date.now() - 25000,
          points: [
            { x: cx - 24, y: cy + 65 },
            { x: cx - 21, y: cy + 20 },
            { x: cx - 18, y: cy - 20 },
            { x: cx - 26, y: cy - 35 },
            { x: cx - 12, y: cy - 54 },
            { x: cx - 18, y: cy - 68 },
            { x: cx - 18, y: cy - 70 },
          ],
        },
        // Snout and back of neck
        {
          type: 'stroke',
          id: 'initial_snout',
          color: '#1E2638',
          width: 3.5,
          tool: 'brush',
          timestamp: Date.now() - 22000,
          points: [
            { x: cx + 4, y: cy - 54 },
            { x: cx + 8, y: cy - 68 },
            { x: cx + 8, y: cy - 70 },
            { x: cx + 8, y: cy - 54 },
            { x: cx + 24, y: cy - 50 },
            { x: cx + 36, y: cy - 48 },
            { x: cx + 32, y: cy - 26 },
            { x: cx + 18, y: cy - 22 },
            { x: cx + 6, y: cy + 65 },
          ],
        },
        // Eye
        {
          type: 'stroke',
          id: 'initial_eye',
          color: '#1E2638',
          width: 4,
          tool: 'brush',
          timestamp: Date.now() - 19000,
          points: [{ x: cx - 1, y: cy - 38 }],
        },
        // Warm spots
        {
          type: 'stroke',
          id: 'initial_spot1',
          color: '#C85A32',
          width: 14,
          tool: 'brush',
          timestamp: Date.now() - 16000,
          points: [
            { x: cx - 6, y: cy + 10 },
            { x: cx - 6, y: cy + 14 },
          ],
        },
        {
          type: 'stroke',
          id: 'initial_spot2',
          color: '#D9822B',
          width: 12,
          tool: 'brush',
          timestamp: Date.now() - 14000,
          points: [
            { x: cx - 9, y: cy + 40 },
            { x: cx - 9, y: cy + 44 },
          ],
        },
        // Leaf accent
        {
          type: 'stroke',
          id: 'initial_leaf_stem',
          color: '#3B5E41',
          width: 2.5,
          tool: 'brush',
          timestamp: Date.now() - 10000,
          points: [
            { x: cx + 28, y: cy - 26 },
            { x: cx + 40, y: cy - 25 },
            { x: cx + 52, y: cy - 36 },
          ],
        },
        {
          type: 'stroke',
          id: 'initial_leaf',
          color: '#527C59',
          width: 8,
          tool: 'brush',
          timestamp: Date.now() - 8000,
          points: [
            { x: cx + 45, y: cy - 28 },
            { x: cx + 47, y: cy - 29 },
          ],
        },
      ];

      setCanvasActions(sampleStrokes);
    }
  }, []); // Run once on mount

  const handleCommitAction = (action: DrawAction) => {
    addCanvasAction(action);
    broadcastAction({
      type: 'STROKE',
      senderId: localPlayer.id,
      senderName: localPlayer.username,
      action,
    });
  };

  const handleClear = () => {
    clearCanvas();
    broadcastAction({
      type: 'CLEAR',
      senderId: localPlayer.id,
      senderName: localPlayer.username,
    });
  };

  const handleGuessSubmit = (guessText: string) => {
    const res = submitGuess(guessText, localPlayer.id);

    if (res.isExact) {
      fireStudioConfetti();
      playSuccessChime();
      setBurstPoints(250);
      setTimeout(() => setBurstPoints(null), 1500);
    } else if (res.isWarm) {
      playWarmAlert();
    }
  };

  // Render dedicated Mobile Touch Stylus Pad View if active
  if (viewMode === 'mobile_stylus') {
    return (
      <MobileStylusView
        roomId={roomId}
        timeLeft={timeLeft}
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        brushColor={brushColor}
        onSelectColor={setBrushColor}
        brushSize={brushSize}
        onSelectSize={setBrushSize}
        isArtist={isArtist}
        targetWord={targetWord}
        categoryHint={activeCategory}
        actions={canvasState.actions}
        onCommitAction={handleCommitAction}
        onUndo={undoCanvasAction}
        onClear={handleClear}
        onSwitchToDesktop={() => setViewMode('standard')}
        onSubmitGuess={handleGuessSubmit}
        hasGuessedCorrectly={localPlayer.hasGuessedCorrectly}
        localPlayer={localPlayer}
      />
    );
  }

  return (
    <div className="text-studio-ink font-sans antialiased h-full overflow-hidden select-none flex flex-col justify-between">
      {/* Top App Bar & HUD */}
      <GameHeader
        roomId={roomId}
        round={round}
        hiddenWord={hiddenWord}
        categoryHint={activeCategory}
        timeLeft={timeLeft}
        maxTime={maxTime}
        totalPlayers={players.length}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSound}
        onTogglePlayersDrawer={() => setIsDrawerOpen(true)}
        onOpenPairingModal={() => setIsPairingOpen(true)}
        onOpenModifiersModal={() => setIsModifiersOpen(true)}
        isArtist={isArtist}
        targetWord={targetWord}
      />

      {/* Main Viewport: Studio Desk Composition */}
      <main className="relative flex-1 flex flex-col lg:flex-row justify-center items-stretch p-2 sm:p-3.5 gap-3 max-w-7xl w-full mx-auto overflow-hidden min-h-0">
        {/* Left Dock: Pencil Case & Artist Mediums */}
        <ArtistToolbar
          currentTool={currentTool}
          onSelectTool={setCurrentTool}
          brushColor={brushColor}
          onSelectColor={setBrushColor}
          brushSize={brushSize}
          onSelectSize={setBrushSize}
          onUndo={undoCanvasAction}
          onClear={handleClear}
          isArtist={isArtist}
          activeWord={targetWord}
          isBlindfold={modifiers.blindfoldMode}
          isOneLineOnly={modifiers.oneLineOnly}
        />

        {/* Center: Spiral Sketchbook Canvas */}
        <DualLayerCanvas
          currentTool={currentTool}
          brushColor={brushColor}
          brushSize={brushSize}
          isDrawingEnabled={isArtist}
          isBlindfold={modifiers.blindfoldMode}
          isOneLineOnly={modifiers.oneLineOnly}
          actions={canvasState.actions}
          onCommitAction={handleCommitAction}
          onUndo={undoCanvasAction}
          onClear={handleClear}
          activeArtist={activeArtist}
          timeLeft={timeLeft}
          burstPoints={burstPoints}
        />

        {/* Right Dock: Memo Pad Scores & Den Chat */}
        <aside className="w-full lg:w-72 flex flex-col gap-2.5 shrink-0 order-3 min-h-0">
          <ScoreboardSticky
            players={players}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />

          <ChatStream
            messages={chatMessages}
            onSubmitGuess={handleGuessSubmit}
            isArtist={isArtist}
            hasGuessedCorrectly={localPlayer.hasGuessedCorrectly}
            localPlayer={localPlayer}
          />
        </aside>
      </main>

      {/* Slide-Over Players Drawer */}
      <PlayersDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        players={players}
        roomId={roomId}
      />

      {/* Word Selection Modal */}
      <WordSelectModal
        open={phase === 'WORD_SELECTION'}
        choices={wordChoices || []}
        onSelectWord={selectWord}
        isArtist={isArtist}
        artistName={activeArtist.username}
      />

      {/* Round Recap Modal (with 3-second Vector Stroke Timelapse Replay) */}
      <RoundRecapModal
        open={phase === 'ROUND_RECAP'}
        targetWord={targetWord}
        category={activeCategory}
        actions={canvasState.actions}
        players={players}
        round={round}
        onNextRound={startNextRound}
      />

      {/* Party Modifiers & Chaos Decks Modal */}
      <PartyModifiersModal
        open={isModifiersOpen}
        onClose={() => setIsModifiersOpen(false)}
        modifiers={modifiers}
        onToggleBlindfold={toggleBlindfold}
        onToggleOneLine={toggleOneLine}
        onSelectDeck={setActiveDeck}
        onImportCustomWords={setCustomWords}
      />

      {/* Dual-Screen & Mobile Stylus Pairing Modal */}
      <DualScreenPairingModal
        open={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        roomId={roomId}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
      />

      {/* Match Champions Podium Modal */}
      <MatchPodiumModal
        open={phase === 'MATCH_PODIUM'}
        players={players}
        onRestart={restartGame}
      />
    </div>
  );
};
