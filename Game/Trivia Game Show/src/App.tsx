import { useState, useEffect, useRef, useCallback } from 'react';
import { TriviaGameshowEngine } from './engine/TriviaGameshowEngine';
import { EngineSnapshot } from './engine/types';
import { BroadcastHeader } from './components/BroadcastHeader';
import { TierProgressRibbon } from './components/TierProgressRibbon';
import { CrtConsole } from './components/CrtConsole';
import { PrizeLadderSidebar } from './components/PrizeLadderSidebar';
import { LiveCrowdChat } from './components/LiveCrowdChat';
import { PodiumModal } from './components/PodiumModal';
import { BroadcastFooter } from './components/BroadcastFooter';

export default function App() {
  const engineRef = useRef<TriviaGameshowEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new TriviaGameshowEngine();
  }

  const engine = engineRef.current;
  const [gameState, setGameState] = useState<EngineSnapshot>(() => engine.getSnapshot());
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    engine.setListener((snapshot) => {
      setGameState({ ...snapshot });
    });

    return () => {
      engine.cleanup();
    };
  }, [engine]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = engine.audio.toggleMute();
    setIsMuted(nextMuted);
  }, [engine]);

  // Global Keyboard Navigation (1-4, A-D, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input elements if any
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();

      // Number keys 1..4
      if (['1', '2', '3', '4'].includes(key)) {
        const optionIndex = parseInt(key, 10) - 1;
        engine.handleSelectOption(optionIndex);
      }
      // Letters A..D
      else if (['a', 'b', 'c', 'd'].includes(key)) {
        const optionIndex = key.charCodeAt(0) - 'a'.charCodeAt(0);
        engine.handleSelectOption(optionIndex);
      }
      // Space or Enter to Advance during REVEAL or Start
      else if (e.code === 'Space' || e.key === 'Enter') {
        if (gameState.phase === 'REVEAL') {
          e.preventDefault();
          engine.proceedNext();
        } else if (gameState.phase === 'GAME_OVER' || gameState.phase === 'VICTORY') {
          e.preventDefault();
          engine.reset();
        }
      }
      // Lifeline Shortcuts: H (Hack 50/50), F (Freeze), S (Skip)
      else if (key === 'h') {
        engine.useFiftyFifty();
      } else if (key === 'f') {
        engine.useFreeze();
      } else if (key === 's') {
        engine.useSkip();
      } else if (key === 'm') {
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, gameState.phase, handleToggleMute]);

  return (
    <div className="min-h-screen w-full relative studio-radial flex flex-col justify-between p-3 md:p-6 text-slate-100 overflow-x-hidden selection:bg-pink-500 selection:text-white">
      {/* Background Ambience & Retro Grid Shaders */}
      <div className="fixed inset-0 pointer-events-none z-0 synth-grid opacity-60" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.2),rgba(236,72,153,0.1)_45%,transparent_80%)]" />
      <div className="fixed bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-purple-950/20 to-transparent pointer-events-none z-0" />

      {/* Top Deck: Telemetry & Broadcast Banner */}
      <div className="relative z-20 flex flex-col gap-3 w-full">
        <BroadcastHeader
          engine={engine}
          state={gameState}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
        <TierProgressRibbon currentTierIndex={gameState.tierIndex} />
      </div>

      {/* Main Stage Arena: Left CRT Console + Right Vertical Prize Ladder */}
      <main className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 my-4 md:my-6 items-stretch">
        <CrtConsole engine={engine} state={gameState} />
        <PrizeLadderSidebar currentTierIndex={gameState.tierIndex} />
      </main>

      {/* Spectator Chatter Deck */}
      <div className="relative z-20 w-full mb-3">
        <LiveCrowdChat phase={gameState.phase} tierIndex={gameState.tierIndex} />
      </div>

      {/* Bottom Footer Telemetry */}
      <div className="relative z-20 w-full">
        <BroadcastFooter tierIndex={gameState.tierIndex} phase={gameState.phase} />
      </div>

      {/* Modal Settlement on Game Over / Grand Champion */}
      <PodiumModal engine={engine} state={gameState} />
    </div>
  );
}
