import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AchievementNode,
  BlockBiome,
  PlinthState,
  StateMachineStage,
  WebSocketMessage,
} from './types/achievement';
import { INITIAL_ACHIEVEMENT_NODES } from './lib/initialData';
import { useAchievementAudio } from './hooks/useAchievementAudio';
import { useConfetti } from './hooks/useConfetti';
import { TopNavigationBar } from './components/hud/TopNavigationBar';
import { ArchipelagoCanvas } from './components/viewport/ArchipelagoCanvas';
import { TelemetryHUD } from './components/hud/TelemetryHUD';
import { TelemetryInjector } from './components/hud/TelemetryInjector';
import { CelebrationToast } from './components/hud/CelebrationToast';
import { BlockInspectorSheet } from './components/inspector/BlockInspectorSheet';
import { FlexPlinthModal } from './components/showcase/FlexPlinthModal';
import { ArchSpecDialog } from './components/showcase/ArchSpecDialog';

export function App() {
  // Core System State
  const [nodes, setNodes] = useState<Record<string, AchievementNode>>(INITIAL_ACHIEVEMENT_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeBiomeFilter, setActiveBiomeFilter] = useState<BlockBiome | 'all'>('all');
  const [stage, setStage] = useState<StateMachineStage>('IDLE');

  // Interactive Viewport Focus
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Modals & Drawers
  const [isFlexPlinthOpen, setIsFlexPlinthOpen] = useState(false);
  const [isArchSpecOpen, setIsArchSpecOpen] = useState(false);
  const [isTelemetryDockOpen, setIsTelemetryDockOpen] = useState(false);

  // Plinth Showcase State
  const [plinthState, setPlinthState] = useState<PlinthState>({
    size: 3,
    slots: { 0: 'node_ow_bedrock', 1: 'node_ow_conduit', 2: 'node_nether_gate' },
    title: 'Vanguard Operator',
    badgeStyle: 'cyber',
  });

  // Juice & Feedback: Audio, Confetti, Pulses, Toast
  const { playUnlockChime, playClickSound, playConduitPulse } = useAchievementAudio();
  const { canvasRef, triggerCelebration } = useConfetti();
  const [celebrationAchievement, setCelebrationAchievement] = useState<AchievementNode | null>(null);
  const [pulsingLinks, setPulsingLinks] = useState<Array<[string, string]>>([]);
  const [lastTelemetryMsg, setLastTelemetryMsg] = useState<string | null>(
    'Authoritative DAG Evaluator ready. Inject telemetry events below.'
  );

  // WebSocket Connection
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Stats Derived
  const totalPoints = Object.values(nodes)
    .filter((n) => n.isUnlocked)
    .reduce((sum, n) => sum + n.points, 0);
  const unlockedCount = Object.values(nodes).filter((n) => n.isUnlocked).length;

  // Trigger Conduit Pulse Animation along DAG path
  const triggerConduitPulseWave = useCallback(
    (path: string[]) => {
      if (path.length < 2) return;
      const links: Array<[string, string]> = [];
      for (let i = 0; i < path.length - 1; i++) {
        links.push([path[i], path[i + 1]]);
      }
      setPulsingLinks(links);
      playConduitPulse();

      setTimeout(() => {
        setPulsingLinks([]);
      }, 3000);
    },
    [playConduitPulse]
  );

  // Handle Milestone Unlock Event from Server or Local Fallback
  const handleMilestoneUnlock = useCallback(
    (achievement: AchievementNode, pulsePath?: string[]) => {
      setNodes((prev) => ({
        ...prev,
        [achievement.id]: achievement,
      }));

      // Celebrate
      playUnlockChime(achievement.isSecret);
      triggerCelebration();
      setCelebrationAchievement(achievement);

      // Pulse conduit lines
      if (pulsePath && pulsePath.length > 0) {
        triggerConduitPulseWave(pulsePath);
      } else if (achievement.parentIds.length > 0) {
        triggerConduitPulseWave([...achievement.parentIds, achievement.id]);
      }
    },
    [playUnlockChime, triggerCelebration, triggerConduitPulseWave]
  );

  // Connect to Backend WebSocket
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    function connectWS() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            if (data.type === 'INIT_STATE' && data.nodes) {
              setNodes(data.nodes);
            } else if (data.type === 'ACHIEVEMENT_UNLOCKED' && data.node) {
              handleMilestoneUnlock(data.node, data.pulsePath);
              if (data.message) setLastTelemetryMsg(data.message);
            } else if (data.type === 'ACHIEVEMENT_PROGRESS' && data.node) {
              setNodes((prev) => ({
                ...prev,
                [data.node!.id]: data.node!,
              }));
              if (data.message) setLastTelemetryMsg(data.message);
            }
          } catch (err) {
            console.error('WS Parse Error:', err);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWS, 4000);
        };

        socket.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWS, 4000);
      }
    }

    connectWS();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [handleMilestoneUnlock]);

  // Initial Fetch from REST API (if server is active)
  useEffect(() => {
    fetch('/api/achievements')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.nodes) {
          setNodes(data.nodes);
        }
      })
      .catch(() => {
        // Fallback already loaded
      });
  }, []);

  // Send Telemetry Event (Server-Authoritative with Local Fallback)
  const sendTelemetry = useCallback(
    async (event: string, count?: number, targetNode?: string) => {
      try {
        const res = await fetch('/api/telemetry/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, count, targetNode }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.message) setLastTelemetryMsg(result.message);
          if (result.status === 'UNLOCKED' && result.node) {
            handleMilestoneUnlock(result.node, result.pulsePath);
          } else if (result.status === 'PROGRESS' && result.node) {
            setNodes((prev) => ({ ...prev, [result.node.id]: result.node }));
          }
          return result;
        }
      } catch (err) {
        // Local Fallback simulation if Fastify server is offline
        console.warn('Backend offline, running deterministic client-side DAG evaluation fallback');
      }

      // Local DAG Evaluation Fallback
      setNodes((prev) => {
        const nextNodes = { ...prev };
        // Find node matching event
        let candidateId = targetNode;
        if (!candidateId) {
          const match = Object.values(nextNodes).find((n) => !n.isUnlocked);
          candidateId = match?.id;
        }
        if (!candidateId || !nextNodes[candidateId]) return prev;

        const node = { ...nextNodes[candidateId] };
        const parentsUnlocked = node.parentIds.every((pid) => nextNodes[pid]?.isUnlocked);

        if (!parentsUnlocked) {
          setLastTelemetryMsg(`Prerequisite locked for [${node.title}]. Complete parent milestones first.`);
          return prev;
        }

        const inc = count ?? 50;
        node.progress = {
          ...node.progress,
          current: Math.min(node.progress.target, node.progress.current + inc),
        };

        if (node.progress.current >= node.progress.target) {
          node.isUnlocked = true;
          node.unlockedAt = new Date().toISOString();
          node.unlockToken = `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}88`;
          nextNodes[candidateId] = node;
          handleMilestoneUnlock(node, [...node.parentIds, node.id]);
          setLastTelemetryMsg(`CRITERIA MET: Local verified token minted for [${node.title}].`);
        } else {
          nextNodes[candidateId] = node;
          setLastTelemetryMsg(`Telemetry updated: [${node.title}] ${node.progress.current}/${node.progress.target}`);
        }

        return nextNodes;
      });
    },
    [handleMilestoneUnlock]
  );

  // Reset Matrix State
  const resetMatrix = useCallback(async () => {
    try {
      await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    } catch (err) {
      // Ignored
    }
    setNodes(INITIAL_ACHIEVEMENT_NODES);
    setLastTelemetryMsg('Archipelago Matrix restored to default state.');
  }, []);

  // Direct Claim / Unlock Milestone from Inspector Sheet
  const claimMilestone = useCallback(
    async (nodeId: string) => {
      setStage('CLAIMING_REWARD');
      try {
        const res = await fetch(`/api/achievements/unlock/${nodeId}`, { method: 'POST' });
        if (res.ok) {
          const result = await res.json();
          if (result.node) {
            handleMilestoneUnlock(result.node, result.pulsePath);
          }
          setStage('INSPECTING_BLOCK');
          return;
        }
      } catch (err) {
        // Fallback
      }

      // Local claim fallback
      setNodes((prev) => {
        const node = prev[nodeId];
        if (!node) return prev;
        const updated = {
          ...node,
          isUnlocked: true,
          progress: { ...node.progress, current: node.progress.target },
          unlockedAt: new Date().toISOString(),
          unlockToken: `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}7F`,
        };
        handleMilestoneUnlock(updated, [...node.parentIds, node.id]);
        return { ...prev, [nodeId]: updated };
      });
      setStage('INSPECTING_BLOCK');
    },
    [handleMilestoneUnlock]
  );

  // Pin Milestone to Flex Plinth
  const pinToPlinth = useCallback(
    (nodeId: string) => {
      const emptySlotIndex = Array.from({ length: plinthState.size * plinthState.size }).findIndex(
        (_, idx) => !plinthState.slots[idx]
      );
      const targetSlot = emptySlotIndex !== -1 ? emptySlotIndex : 0;
      setPlinthState((prev) => ({
        ...prev,
        slots: { ...prev.slots, [targetSlot]: nodeId },
      }));
      setIsFlexPlinthOpen(true);
    },
    [plinthState.size, plinthState.slots]
  );

  // Select Node for Inspector Sheet
  const handleSelectNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);
      setStage('INSPECTING_BLOCK');
      playClickSound();
    },
    [playClickSound]
  );

  // Instant Pan to Node from Search or Toast
  const handleFocusNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setFocusNodeId(nodeId);
    // Reset focus after trigger so it can re-trigger on subsequent clicks
    setTimeout(() => setFocusNodeId(null), 100);
  }, []);

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#07090e] text-slate-100 select-none">
      {/* Confetti Celebration Particle Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Top Navigation Bar */}
      <TopNavigationBar
        nodes={nodes}
        activeBiomeFilter={activeBiomeFilter}
        onBiomeFilterChange={(b) => {
          setActiveBiomeFilter(b);
          setStage('FILTERING');
        }}
        onFocusNode={handleFocusNode}
        onOpenFlexPlinth={() => setIsFlexPlinthOpen(true)}
        onOpenArchSpec={() => setIsArchSpecOpen(true)}
        onToggleTelemetryDock={() => setIsTelemetryDockOpen((prev) => !prev)}
        isTelemetryDockOpen={isTelemetryDockOpen}
        isConnected={isConnected}
        totalPoints={totalPoints}
        unlockedCount={unlockedCount}
      />

      {/* Main 2D Pan-and-Zoom Archipelago Canvas */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <ArchipelagoCanvas
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          activeBiomeFilter={activeBiomeFilter}
          onSelectNode={handleSelectNode}
          onHoverNode={playClickSound}
          pulsingLinks={pulsingLinks}
          focusNodeId={focusNodeId}
        />

        {/* Completionist Velocity & Category Radar HUD */}
        <TelemetryHUD nodes={nodes} />

        {/* Live Gameplay Telemetry Simulator Dock */}
        <TelemetryInjector
          isOpen={isTelemetryDockOpen}
          onClose={() => setIsTelemetryDockOpen(false)}
          onSendTelemetry={sendTelemetry}
          onResetMatrix={resetMatrix}
          lastTelemetryMsg={lastTelemetryMsg}
        />
      </main>

      {/* Celebratory Milestone Unlocked Toast Banner */}
      <CelebrationToast
        achievement={celebrationAchievement}
        onInspect={(id) => handleFocusNode(id)}
        onClose={() => setCelebrationAchievement(null)}
      />

      {/* Inspector Sheet & Claim Drawer */}
      <BlockInspectorSheet
        node={selectedNode}
        allNodes={nodes}
        isOpen={Boolean(selectedNodeId)}
        onClose={() => {
          setSelectedNodeId(null);
          setStage('IDLE');
        }}
        onClaimReward={claimMilestone}
        onPinToPlinth={pinToPlinth}
      />

      {/* Trophy Flex Plinth Modal Showcase */}
      <FlexPlinthModal
        isOpen={isFlexPlinthOpen}
        onClose={() => setIsFlexPlinthOpen(false)}
        nodes={nodes}
        plinthState={plinthState}
        onUpdatePlinth={setPlinthState}
      />

      {/* Fastify & DAG Architecture System Spec Modal */}
      <ArchSpecDialog
        isOpen={isArchSpecOpen}
        onClose={() => setIsArchSpecOpen(false)}
      />
    </div>
  );
}
