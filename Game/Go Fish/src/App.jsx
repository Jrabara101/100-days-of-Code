import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoFishEngine } from './engine/GoFishEngine';
import { PlayingCard } from './components/PlayingCard';
import { AnimationOverlay } from './components/AnimationOverlay';
import { AIBrainInspector } from './components/AIBrainInspector';
import { AskModal } from './components/AskModal';
import { GameOverModal } from './components/GameOverModal';
import { soundFX } from './utils/audio';
import { Brain, Volume2, VolumeX, Monitor, RefreshCw, HelpCircle, Layers, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const engineRef = useRef(null);
  
  const [uiState, setUiState] = useState({
    playerHand: [],
    aiHandCount: 0,
    playerBooks: [],
    aiBooks: [],
    stockCount: 0,
    turn: 0,
    gameState: 'DEALING',
    log: [],
    aiMemory: {},
    activeAnimation: null
  });

  const [selectedRank, setSelectedRank] = useState(null);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isBrainInspectorOpen, setIsBrainInspectorOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [crtEnabled, setCrtEnabled] = useState(true);

  // Initialize engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GoFishEngine(
        (newState) => setUiState(newState),
        (audioType) => {
          if (audioType === 'deal') soundFX.playDeal();
          else if (audioType === 'askSuccess') soundFX.playAskSuccess();
          else if (audioType === 'goFish') soundFX.playGoFish();
          else if (audioType === 'book') soundFX.playBookComplete();
          else if (audioType === 'win') soundFX.playWin();
          else if (audioType === 'gameOver') soundFX.playGameOver();
        }
      );
      engineRef.current.notifyReact();
    }
  }, []);

  const toggleSound = () => {
    soundFX.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleCardClick = (rank) => {
    soundFX.playClick();
    if (uiState.turn === 0 && (uiState.gameState === 'ASK_SELECT' || uiState.gameState === 'RESOLVE')) {
      setSelectedRank(rank);
    }
  };

  const handleAskSubmit = () => {
    if (!selectedRank || uiState.turn !== 0 || (uiState.gameState !== 'ASK_SELECT' && uiState.gameState !== 'RESOLVE')) return;
    engineRef.current.processAsk(0, selectedRank);
    setSelectedRank(null);
    setIsAskModalOpen(false);
  };

  const handleRestart = () => {
    soundFX.playClick();
    setSelectedRank(null);
    engineRef.current.initNewGame();
  };

  // Unique ranks in player's hand for rank selection modal
  const playerUniqueRanks = [...new Set(uiState.playerHand.map(c => c.rank))];

  return (
    <div className={`min-h-screen bg-[#064e3b] text-white font-pixel flex flex-col justify-between p-3 md:p-6 select-none relative ${crtEnabled ? 'crt-overlay' : ''}`}>
      
      {/* HEADER HUD */}
      <header className="w-full max-w-5xl mx-auto bg-[#111827] p-3 md:p-4 pixel-box flex flex-wrap justify-between items-center gap-3">
        
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-nes-yellow text-black border-2 border-black flex items-center justify-center font-black text-xl shadow-pixel-sm">
            🐟
          </div>
          <div>
            <h1 className="text-base md:text-xl font-black text-nes-yellow tracking-wider flex items-center gap-2">
              GO_FISH_ARCADE.EXE
            </h1>
            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
              <span>TURN:</span>
              <span className={`font-black px-1.5 py-0.2 ${uiState.turn === 0 ? 'bg-cyan-500 text-black' : 'bg-rose-500 text-white'}`}>
                {uiState.turn === 0 ? 'YOUR TURN' : "AI OPPONENT'S TURN"}
              </span>
            </div>
          </div>
        </div>

        {/* HUD Controls & Stats */}
        <div className="flex items-center gap-2 md:gap-4 text-xs font-bold flex-wrap">
          {/* Stock Count Badge */}
          <div className="bg-emerald-950 px-3 py-1.5 pixel-box border-emerald-400 flex items-center gap-1.5 text-emerald-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Stock: {uiState.stockCount}</span>
          </div>

          {/* AI Memory Matrix Button */}
          <button 
            onClick={() => setIsBrainInspectorOpen(true)}
            className="pixel-btn bg-cyan-800 hover:bg-cyan-700 text-white px-2.5 py-1.5 text-xs flex items-center gap-1"
            title="Inspect AI Inference Matrix"
          >
            <Brain className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="hidden sm:inline">AI Brain</span>
          </button>

          {/* CRT Toggle */}
          <button 
            onClick={() => setCrtEnabled(!crtEnabled)}
            className={`pixel-btn px-2.5 py-1.5 text-xs flex items-center gap-1 ${crtEnabled ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-400'}`}
            title="Toggle CRT Scanline Effect"
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">CRT</span>
          </button>

          {/* Sound Toggle */}
          <button 
            onClick={toggleSound}
            className="pixel-btn bg-gray-800 hover:bg-gray-700 text-white p-1.5 text-xs"
            title="Toggle Sound Effects"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Reset Button */}
          <button 
            onClick={handleRestart} 
            className="pixel-btn bg-nes-red px-3 py-1.5 text-xs text-white uppercase hover:bg-red-500 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* MAIN ARENA TABLE */}
      <main className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        
        {/* LEFT PANEL: AI Opponent Status */}
        <div className="bg-[#1e1b4b] p-4 pixel-box border-rose-400 flex flex-col justify-between min-h-[190px]">
          <div>
            <div className="flex justify-between items-center border-b-2 border-rose-400/40 pb-2 mb-2">
              <h2 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                🤖 AI OPPONENT
              </h2>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-600 px-1.5 py-0.5 font-bold">
                Level: Expert Inference
              </span>
            </div>

            <div className="flex items-center gap-4 my-3">
              {/* Stack of cards representation */}
              <div className="relative w-14 h-20 bg-gb-dark border-4 border-black shadow-pixel flex items-center justify-center shrink-0">
                <div className="text-xl font-black text-white">{uiState.aiHandCount}</div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border border-black animate-ping"></div>
              </div>

              <div>
                <div className="text-lg font-black text-white">{uiState.aiHandCount} Cards Held</div>
                <div className="text-[11px] text-gray-300 mt-1">
                  Private hand state encapsulated ($O(1)$ asymmetry).
                </div>
              </div>
            </div>
          </div>

          {/* AI Completed Books */}
          <div className="mt-2">
            <div className="text-[10px] text-rose-300 font-bold uppercase mb-1">
              AI Books Collected ({uiState.aiBooks.length}):
            </div>
            <div className="flex gap-1.5 flex-wrap min-h-[28px] items-center bg-black/40 p-1.5 border border-rose-900">
              {uiState.aiBooks.length > 0 ? (
                uiState.aiBooks.map((b, idx) => (
                  <span key={`ai-b-${idx}`} className="bg-nes-red text-white text-[10px] font-black px-2 py-0.5 border border-black shadow-pixel-sm">
                    [{b}]
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-gray-500 italic">No books collected yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: LCD Inset Terminal Log */}
        <div className="bg-black p-3 pixel-box border-emerald-500 flex flex-col justify-between h-[210px] md:h-auto overflow-hidden">
          <div className="flex justify-between items-center border-b border-emerald-900 pb-1 mb-1">
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 animate-pulse"></span>
              COMBAT EVENT LOG
            </span>
            <span className="text-[9px] text-emerald-600 font-mono">LCD TERMINAL V1.0</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] text-emerald-400 p-1 bg-gray-950 border border-emerald-900/60 leading-snug">
            {uiState.log.map((entry, idx) => (
              <div key={`log-${idx}`} className="border-b border-gray-900 pb-0.5">
                {entry}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Player Score & Books */}
        <div className="bg-[#0f2e1a] p-4 pixel-box border-emerald-400 flex flex-col justify-between min-h-[190px]">
          <div>
            <div className="flex justify-between items-center border-b-2 border-emerald-400/40 pb-2 mb-2">
              <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                👤 YOUR SCORE
              </h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.5 font-bold">
                Goal: 4-of-a-Kind
              </span>
            </div>

            <div className="my-3">
              <div className="text-3xl font-black text-nes-yellow">{uiState.playerBooks.length} Books</div>
              <div className="text-[11px] text-gray-300 mt-1">
                Collect 4 matching card ranks to complete a book set.
              </div>
            </div>
          </div>

          {/* Player Completed Books */}
          <div className="mt-2">
            <div className="text-[10px] text-emerald-300 font-bold uppercase mb-1">
              Your Books Completed ({uiState.playerBooks.length}):
            </div>
            <div className="flex gap-1.5 flex-wrap min-h-[28px] items-center bg-black/40 p-1.5 border border-emerald-900">
              {uiState.playerBooks.length > 0 ? (
                uiState.playerBooks.map((b, idx) => (
                  <span key={`p-b-${idx}`} className="bg-nes-yellow text-black text-[10px] font-black px-2 py-0.5 border border-black shadow-pixel-sm">
                    [{b}]
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-gray-500 italic">No books collected yet.</span>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* BOTTOM TRAY: Player Hand & Controls */}
      <footer className="w-full max-w-5xl mx-auto bg-[#111827] p-4 md:p-6 pixel-box flex flex-col items-center">
        
        {/* Hand Tray Header & Actions */}
        <div className="w-full flex flex-wrap justify-between items-center gap-3 mb-4 border-b-2 border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
              YOUR HAND ({uiState.playerHand.length} CARDS)
            </span>
            <span className="text-[10px] text-gray-400">
              (Click a card to select rank)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-black text-nes-yellow bg-gray-900 px-3 py-1.5 border border-gray-700">
              Selected Rank: <span className="text-white">[{selectedRank || 'NONE'}]</span>
            </div>

            <button 
              disabled={uiState.turn !== 0 || (uiState.gameState !== 'ASK_SELECT' && uiState.gameState !== 'RESOLVE')}
              onClick={() => setIsAskModalOpen(true)}
              className="pixel-btn bg-nes-yellow text-black px-4 py-2 text-xs font-black uppercase disabled:opacity-30 hover:bg-yellow-400 flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              Ask AI for Rank
            </button>
          </div>
        </div>

        {/* Fanned Card Grid */}
        <div className="w-full overflow-x-auto py-3 min-h-[130px] flex items-center justify-center">
          {uiState.playerHand.length > 0 ? (
            <div className="flex gap-2 justify-center px-4">
              {uiState.playerHand.map((card) => (
                <PlayingCard
                  key={card.id}
                  card={card}
                  isSelected={selectedRank === card.rank}
                  onClick={handleCardClick}
                  disabled={uiState.turn !== 0 || uiState.gameState === 'ANIMATING'}
                />
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic py-6 flex items-center gap-2">
              <span>Hand Empty. Drawing card from Stock Pile...</span>
            </div>
          )}
        </div>

      </footer>

      {/* FLOATING MODALS */}
      <AskModal
        isOpen={isAskModalOpen}
        availableRanks={playerUniqueRanks}
        selectedRank={selectedRank}
        onSelectRank={(rank) => {
          soundFX.playClick();
          setSelectedRank(rank);
        }}
        onSubmit={handleAskSubmit}
        onClose={() => setIsAskModalOpen(false)}
      />

      <AIBrainInspector
        isOpen={isBrainInspectorOpen}
        aiMemory={uiState.aiMemory}
        onClose={() => setIsBrainInspectorOpen(false)}
      />

      <GameOverModal
        isOpen={uiState.gameState === 'GAME_OVER'}
        playerBooks={uiState.playerBooks}
        aiBooks={uiState.aiBooks}
        onRestart={handleRestart}
      />

      <AnimationOverlay activeAnimation={uiState.activeAnimation} />

    </div>
  );
}
