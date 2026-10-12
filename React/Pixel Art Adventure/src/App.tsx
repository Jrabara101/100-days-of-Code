import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdventureGameState, DialogueNode, DialogueChoice, MemoryEcho } from './types/game';
import { MapDefinition } from '../server/maps';
import { fetchSaveState, saveGameState, fetchMapDefinition, submitChoice } from './services/api';
import { audioEngine } from './services/audio';
import { DIALOGUE_TREE } from './game/dialogues';
import { usePixelEngine } from './game/usePixelEngine';
import { ExplorationHUD } from './components/HUD/ExplorationHUD';
import { DialogueBox } from './components/Dialogue/DialogueBox';
import { QuestJournalDrawer } from './components/Journal/QuestJournalDrawer';
import { ChapterChronicleModal } from './components/Modals/ChapterChronicleModal';
import { MemoryEchoOverlay } from './components/Modals/MemoryEchoOverlay';
import { VirtualControls } from './components/Mobile/VirtualControls';
import { NotificationToast, ToastMessage } from './components/HUD/NotificationToast';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game State
  const [gameState, setGameState] = useState<AdventureGameState>({
    status: 'EXPLORING',
    player: {
      position: {
        mapId: 'whispering_glade',
        x: 5,
        y: 10,
        facing: 'right',
      },
      inventory: [
        { id: 'lantern', name: 'Ancient Lantern', icon: 'lantern', description: 'Casts a warm amber glow, dispelling the deep night shadows.' },
      ],
      activeToolId: 'lantern',
    },
    narrativeFlags: {
      met_elder: false,
      golem_awakened: false,
      echo_viewed: false,
      has_flute: false,
      shrine_decided: false,
    },
    activeQuests: [
      {
        id: 'q1',
        title: 'The Resonant Slumber',
        description: 'Follow the ancient stone trail and speak with Elder Mael regarding the tremors.',
        isCompleted: false,
        objectives: [
          { text: 'Consult with Elder Mael at the stone circle', done: false },
          { text: 'Retrieve the Harmonic Flute from the southern grove', done: false },
          { text: 'Awaken the Dormant Golem guarding the mountain pass', done: false },
        ],
      },
    ],
    currentDialogue: null,
    activeMemoryEcho: null,
    timeOfDay: 16.5,
  });

  const [mapData, setMapData] = useState<MapDefinition | null>(null);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isChronicleOpen, setIsChronicleOpen] = useState(false);
  const [discoveredEchoes, setDiscoveredEchoes] = useState<MemoryEcho[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [saveSyncStatus, setSaveSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  // Push floating notification toast
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // 1. Initial Load: Fetch Save and First Map
  useEffect(() => {
    async function initGame() {
      const saved = await fetchSaveState();
      if (saved && saved.player) {
        setGameState((prev) => ({
          ...prev,
          ...saved,
        }));
      }

      const initialMapId = saved?.player?.position?.mapId || 'whispering_glade';
      try {
        const map = await fetchMapDefinition(initialMapId);
        setMapData(map);
      } catch (err) {
        console.error('Failed to load initial map', err);
      }
    }

    initGame();
  }, []);

  // 2. Position Callback
  const handleUpdatePosition = useCallback((pos: any) => {
    setGameState((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        position: pos,
      },
    }));
  }, []);

  // 3. Dialogue Machine
  const handleStartDialogue = useCallback((nodeId: string) => {
    const node = DIALOGUE_TREE[nodeId];
    if (!node) return;

    setGameState((prev) => ({
      ...prev,
      status: 'DIALOGUE',
      currentDialogue: node,
    }));
  }, []);

  const handleSelectChoice = useCallback((choice: DialogueChoice) => {
    setGameState((prev) => {
      const nextFlags = { ...prev.narrativeFlags };
      if (choice.setFlags) {
        choice.setFlags.forEach((f) => (nextFlags[f] = true));
      }

      // Check quest objective completions
      const nextQuests = prev.activeQuests.map((q) => {
        if (q.id === 'q1') {
          const objs = [...q.objectives];
          if (nextFlags.met_elder) objs[0] = { ...objs[0], done: true };
          if (nextFlags.has_flute) objs[1] = { ...objs[1], done: true };
          if (nextFlags.golem_awakened) objs[2] = { ...objs[2], done: true };
          const allDone = objs.every((o) => o.done);
          return { ...q, objectives: objs, isCompleted: allDone };
        }
        return q;
      });

      // Special action triggers
      if (choice.action === 'awaken_golem') {
        nextFlags.golem_awakened = true;
        audioEngine.playFluteArpeggio();
        setTimeout(() => {
          audioEngine.playQuestComplete();
          addToast({
            title: 'Stone Golem Awakened!',
            description: 'The eastern pass to the Sunken Shrine is now unsealed.',
            type: 'quest',
          });
        }, 600);
      }

      if (choice.action === 'climax_choice') {
        const choiceNodeId = choice.id === 'c_restore_shrine' ? 'restore_shrine' : 'harvest_core';
        submitChoice('ch1', choiceNodeId, choice.text);
        setTimeout(() => {
          setIsChronicleOpen(true);
        }, 400);
      }

      if (choice.nextNodeId) {
        return {
          ...prev,
          narrativeFlags: nextFlags,
          activeQuests: nextQuests,
          currentDialogue: DIALOGUE_TREE[choice.nextNodeId] || null,
        };
      } else {
        return {
          ...prev,
          status: 'EXPLORING',
          narrativeFlags: nextFlags,
          activeQuests: nextQuests,
          currentDialogue: null,
        };
      }
    });
  }, [addToast]);

  const handleCloseDialogue = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: 'EXPLORING',
      currentDialogue: null,
    }));
  }, []);

  // 4. Memory Echo Trigger
  const handleTriggerMemoryEcho = useCallback((echoPayload: any) => {
    const echo: MemoryEcho = {
      id: echoPayload.echoId,
      title: echoPayload.title,
      subtitle: 'The Great Sundering of Aethelgard',
      prose: echoPayload.loreText,
      discoveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDiscoveredEchoes((prev) => {
      if (prev.some((e) => e.id === echo.id)) return prev;
      return [...prev, echo];
    });

    setGameState((prev) => ({
      ...prev,
      status: 'CUTSCENE',
      activeMemoryEcho: echo,
      narrativeFlags: {
        ...prev.narrativeFlags,
        echo_viewed: true,
      },
    }));

    addToast({
      title: 'Memory Echo Recovered',
      description: echo.title,
      type: 'lore',
    });
  }, [addToast]);

  const handleCloseMemoryEcho = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: 'EXPLORING',
      activeMemoryEcho: null,
    }));
  }, []);

  // 5. Open Relic Chest
  const handleOpenChest = useCallback((chestPayload: any) => {
    setGameState((prev) => {
      if (prev.narrativeFlags.has_flute) {
        addToast({ title: 'Chest Empty', description: 'The harmonic flute has already been retrieved.' });
        return prev;
      }

      const nextInventory = [
        ...prev.player.inventory,
        {
          id: chestPayload.itemId,
          name: chestPayload.itemName,
          icon: chestPayload.itemIcon,
          description: chestPayload.description,
        },
      ];

      const nextQuests = prev.activeQuests.map((q) => {
        if (q.id === 'q1') {
          const objs = [...q.objectives];
          objs[1] = { ...objs[1], done: true };
          return { ...q, objectives: objs };
        }
        return q;
      });

      audioEngine.playQuestComplete();
      addToast({
        title: `Obtained: ${chestPayload.itemName}!`,
        description: 'Press [2] to equip and play ancient resonance.',
        type: 'item',
      });

      return {
        ...prev,
        player: {
          ...prev.player,
          inventory: nextInventory,
          activeToolId: 'harmonic_flute',
        },
        narrativeFlags: {
          ...prev.narrativeFlags,
          has_flute: true,
        },
        activeQuests: nextQuests,
      };
    });
  }, [addToast]);

  // 6. Map Transitions
  const handleTransitionMap = useCallback(async (
    targetMapId: string,
    x: number,
    y: number,
    facing: 'up' | 'down' | 'left' | 'right'
  ) => {
    try {
      const nextMap = await fetchMapDefinition(targetMapId);
      setMapData(nextMap);

      setGameState((prev) => {
        const nextState: AdventureGameState = {
          ...prev,
          player: {
            ...prev.player,
            position: {
              mapId: targetMapId,
              x,
              y,
              facing,
            },
          },
        };
        saveGameState(nextState);
        return nextState;
      });

      addToast({
        title: nextMap.title,
        description: nextMap.chapter,
        type: 'lore',
      });
    } catch (err) {
      console.error('Failed to transition map', err);
    }
  }, [addToast]);

  // 7. Toggle Tools
  const handleToggleTool = useCallback((toolId: string) => {
    setGameState((prev) => {
      const isAlreadyActive = prev.player.activeToolId === toolId;
      const nextToolId = isAlreadyActive ? null : toolId;

      if (toolId === 'lantern') {
        audioEngine.playLanternToggle(!isAlreadyActive);
      } else if (toolId === 'harmonic_flute') {
        audioEngine.playFluteArpeggio();
        // If near dormant golem in whispering glade, trigger awaken
        if (
          prev.player.position.mapId === 'whispering_glade' &&
          Math.hypot(prev.player.position.x - 24, prev.player.position.y - 7) < 3.5 &&
          !prev.narrativeFlags.golem_awakened
        ) {
          handleStartDialogue('golem_awakened');
        }
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          activeToolId: nextToolId,
        },
      };
    });
  }, [handleStartDialogue]);

  // 8. Auto-Save periodically & on state changes
  useEffect(() => {
    const saveTimer = setInterval(async () => {
      setSaveSyncStatus('saving');
      const ok = await saveGameState(gameState);
      setSaveSyncStatus(ok ? 'synced' : 'offline');
    }, 25000);

    return () => clearInterval(saveTimer);
  }, [gameState]);

  // Decoupled Game Engine Hook
  const { activePrompt, setVirtualInput, triggerAction } = usePixelEngine({
    canvasRef,
    mapData,
    gameState,
    onUpdatePosition: handleUpdatePosition,
    onStartDialogue: handleStartDialogue,
    onTriggerMemoryEcho: handleTriggerMemoryEcho,
    onOpenChest: handleOpenChest,
    onTransitionMap: handleTransitionMap,
    onAwakenGolem: () => {},
    onToggleTool: handleToggleTool,
  });

  // Global key shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'j' || e.key === 'J') {
        setIsJournalOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMapOpen((prev) => !prev);
      } else if (e.code === 'Escape') {
        setIsJournalOpen(false);
        setIsMapOpen(false);
        if (gameState.status === 'DIALOGUE') {
          handleCloseDialogue();
        }
        if (gameState.status === 'CUTSCENE') {
          handleCloseMemoryEcho();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, handleCloseDialogue, handleCloseMemoryEcho]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0D14] flex items-center justify-center select-none">
      {/* 1. HTML5 2D Canvas Viewport (Pixelated & Centered) */}
      <canvas
        ref={canvasRef}
        className="w-full h-full pixelated block touch-none cursor-crosshair"
      />

      {/* 2. Exploration Atmospheric HUD */}
      <ExplorationHUD
        gameState={gameState}
        mapData={mapData}
        onOpenJournal={() => setIsJournalOpen(true)}
        onOpenMap={() => setIsMapOpen(true)}
        onToggleTool={handleToggleTool}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(audioEngine.toggleMute())}
        saveSyncStatus={saveSyncStatus}
      />

      {/* 3. Interactive Dialogue Terminal Overlay */}
      {gameState.status === 'DIALOGUE' && gameState.currentDialogue && (
        <DialogueBox
          dialogue={gameState.currentDialogue}
          narrativeFlags={gameState.narrativeFlags}
          onSelectChoice={handleSelectChoice}
          onClose={handleCloseDialogue}
        />
      )}

      {/* 4. Memory Echo Vignette Modal */}
      {gameState.status === 'CUTSCENE' && gameState.activeMemoryEcho && (
        <MemoryEchoOverlay
          echo={gameState.activeMemoryEcho}
          onClose={handleCloseMemoryEcho}
        />
      )}

      {/* 5. Quest Journal & World Map Drawer */}
      <QuestJournalDrawer
        isOpen={isJournalOpen || isMapOpen}
        onClose={() => {
          setIsJournalOpen(false);
          setIsMapOpen(false);
        }}
        quests={gameState.activeQuests}
        memoryEchoes={discoveredEchoes}
        currentMap={mapData}
        playerCoords={{
          x: gameState.player.position.x,
          y: gameState.player.position.y,
        }}
      />

      {/* 6. Chapter Complete Folk Chronicle Modal */}
      <ChapterChronicleModal
        isOpen={isChronicleOpen}
        chapterId="ch1"
        narrativeFlags={gameState.narrativeFlags}
        onContinue={() => {
          setIsChronicleOpen(false);
          setGameState((prev) => ({ ...prev, status: 'EXPLORING' }));
        }}
        onRewindBranch={() => {
          setIsChronicleOpen(false);
          // Rewind position back before the altar choice
          setGameState((prev) => ({
            ...prev,
            status: 'EXPLORING',
            narrativeFlags: {
              ...prev.narrativeFlags,
              shrine_restored: false,
              shrine_harvested: false,
            },
            player: {
              ...prev.player,
              position: {
                mapId: 'sunken_shrine',
                x: 14,
                y: 8,
                facing: 'up',
              },
            },
          }));
        }}
      />

      {/* 7. Mobile Virtual D-Pad & Action Buttons */}
      <VirtualControls
        onDirectionChange={setVirtualInput}
        onActionButton={triggerAction}
        onToolButton={() => handleToggleTool('lantern')}
        activePromptText={activePrompt?.text}
      />

      {/* 8. Notification Toasts */}
      <NotificationToast toasts={toasts} />
    </div>
  );
}
export default App;
