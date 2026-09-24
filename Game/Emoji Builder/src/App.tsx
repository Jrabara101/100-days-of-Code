import React, { useState, useEffect } from 'react';
import { useStoryBuilder } from './hooks/useStoryBuilder';
import { THEMES } from './data/themeDefinitions';
import { Header } from './components/Header';
import { CanvasStage } from './components/CanvasStage';
import { EmojiArsenalDrawer } from './components/EmojiArsenalDrawer';
import { InspectorDrawer } from './components/InspectorDrawer';
import { TimelineReel } from './components/TimelineReel';
import { StoryReelModal } from './components/StoryReelModal';
import { PlotGuesserModal } from './components/PlotGuesserModal';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  const {
    state,
    activePanel,
    activePanelIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    togglePlay,
    setPlaybackSpeed,
    toggleLoop,
    setActivePanel,
    setAspectRatio,
    setTheme,
    setBackgroundMode,
    setGameMode,
    setTitle,
    addPanel,
    duplicatePanel,
    deletePanel,
    updateActivePanel,
    addStickerToActivePanel,
    updateSticker,
    deleteSticker,
    duplicateSticker,
    bringStickerToFront,
    sendStickerToBack,
    selectSticker,
    addSpeechBubble,
    updateSpeechBubble,
    deleteSpeechBubble,
    selectBubble,
    addBranchChoice,
    removeBranchChoice,
    getShareableUrl,
  } = useStoryBuilder();

  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const currentTheme = THEMES[state.theme] || THEMES.berry_patisserie;

  // Selected sticker character for companion suggestions
  const selectedStickerChar = activePanel?.stickers.find(
    (s) => s.id === state.selectedStickerId
  )?.char;

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedStickerId) {
          deleteSticker(state.selectedStickerId);
        } else if (state.selectedBubbleId) {
          deleteSpeechBubble(state.selectedBubbleId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, togglePlay, state.selectedStickerId, state.selectedBubbleId, deleteSticker, deleteSpeechBubble]);

  return (
    <div
      style={{ backgroundColor: currentTheme.bodyBg }}
      className={`min-h-screen flex flex-col overflow-hidden select-none font-fredoka transition-colors duration-300 ${
        currentTheme.isDark ? 'dark text-stone-100' : 'text-stone-700'
      }`}
    >
      {/* 1. Top Bar */}
      <Header
        title={state.title}
        themeId={state.theme}
        bgMode={state.bgMode}
        aspectRatio={state.aspectRatio}
        gameMode={state.gameMode}
        canUndo={canUndo}
        canRedo={canRedo}
        onUpdateTitle={setTitle}
        onSelectTheme={setTheme}
        onToggleBgMode={setBackgroundMode}
        onSelectAspectRatio={setAspectRatio}
        onSelectGameMode={setGameMode}
        onUndo={undo}
        onRedo={redo}
        onOpenReelModal={() => setIsReelModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onShare={() => {
          const url = getShareableUrl();
          navigator.clipboard.writeText(url);
        }}
      />

      {/* 2. Main Playground Workspace */}
      <main className="pt-20 pb-32 px-4 flex flex-1 h-[calc(100vh)] gap-3.5 overflow-hidden">
        {/* Left: Sticker Catalog & AI Prop Baker Drawer */}
        <EmojiArsenalDrawer
          theme={currentTheme}
          selectedStickerChar={selectedStickerChar}
          onAddSticker={(char, name) => addStickerToActivePanel(char, name)}
        />

        {/* Center: Magnetic Storyboard Canvas Viewport */}
        <CanvasStage
          panel={activePanel}
          panelIndex={activePanelIndex}
          totalPanels={state.panels.length}
          theme={currentTheme}
          bgMode={state.bgMode}
          aspectRatio={state.aspectRatio}
          gameMode={state.gameMode}
          selectedStickerId={state.selectedStickerId}
          selectedBubbleId={state.selectedBubbleId}
          onSelectSticker={selectSticker}
          onUpdateSticker={updateSticker}
          onDeleteSticker={deleteSticker}
          onDuplicateSticker={duplicateSticker}
          onBringStickerToFront={bringStickerToFront}
          onSendStickerToBack={sendStickerToBack}
          onAddSticker={(char, name, x, y) => addStickerToActivePanel(char, name, x, y)}
          onSelectBubble={selectBubble}
          onUpdateBubble={updateSpeechBubble}
          onDeleteBubble={deleteSpeechBubble}
          onAddSpeechBubble={() => addSpeechBubble('speech')}
          onUpdatePanel={updateActivePanel}
          onSelectBranchPanel={(targetId) => setActivePanel(targetId)}
        />

        {/* Right: Sound FX & Prose Narrator & Choice Inspector */}
        <InspectorDrawer
          panel={activePanel}
          allPanels={state.panels}
          theme={currentTheme}
          onUpdatePanel={updateActivePanel}
          onAddBranchChoice={addBranchChoice}
          onRemoveBranchChoice={removeBranchChoice}
        />
      </main>

      {/* 3. Bottom Storyboard Timeline Reel */}
      <TimelineReel
        panels={state.panels}
        activePanelId={state.activePanelId}
        theme={currentTheme}
        playback={state.playback}
        onSelectPanel={setActivePanel}
        onAddPanel={addPanel}
        onDuplicatePanel={duplicatePanel}
        onDeletePanel={deletePanel}
        onTogglePlay={togglePlay}
        onToggleLoop={toggleLoop}
        onSetPlaybackSpeed={setPlaybackSpeed}
      />

      {/* 4. Cinematic Story Reel Presenter Modal */}
      <StoryReelModal
        isOpen={isReelModalOpen}
        panels={state.panels}
        initialIndex={activePanelIndex}
        aspectRatio={state.aspectRatio}
        theme={currentTheme}
        onClose={() => setIsReelModalOpen(false)}
        onSelectBranch={(targetId) => {
          setActivePanel(targetId);
        }}
      />

      {/* 5. Decode the Plot Party Game Modal */}
      <PlotGuesserModal
        isOpen={state.gameMode === 'plot_guesser'}
        theme={currentTheme}
        currentStoryTitle={state.title}
        currentStoryPanels={state.panels}
        onClose={() => setGameMode('creator')}
      />

      {/* 6. High-Res Comic Strip & Reel Exporter Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        storyTitle={state.title}
        panels={state.panels}
        theme={currentTheme}
        getShareableUrl={getShareableUrl}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default App;
