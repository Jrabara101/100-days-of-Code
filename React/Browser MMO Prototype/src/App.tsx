import React, { useState, useEffect, useRef } from 'react';
import { useMMONetwork } from './hooks/useMMONetwork.js';
import { useMMOEngine } from './hooks/useMMOEngine.js';
import { UnitFrame } from './components/hud/UnitFrame.js';
import { TargetFrame } from './components/hud/TargetFrame.js';
import { MinimapRadar } from './components/hud/MinimapRadar.js';
import { ChatDock } from './components/hud/ChatDock.js';
import { ActionHotbar } from './components/hud/ActionHotbar.js';
import { SpatialInventory } from './components/hud/SpatialInventory.js';
import { PaperDollEquipment } from './components/hud/PaperDollEquipment.js';
import { TradeModal } from './components/hud/TradeModal.js';
import { TradeInviteBanner } from './components/hud/TradeInviteBanner.js';
import { PlayerInspectorModal } from './components/hud/PlayerInspectorModal.js';
import { ShardSelector } from './components/hud/ShardSelector.js';
import { ControlsHelpModal } from './components/hud/ControlsHelpModal.js';
import { OnboardingModal } from './components/hud/OnboardingModal.js';
import { VirtualJoystick } from './components/hud/VirtualJoystick.js';
import { Smartphone, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  // Query param shard
  const urlShard = new URLSearchParams(window.location.search).get('shard') || 'REALM';

  // User credentials
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    return !!localStorage.getItem('mmo_username');
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('mmo_username') || '';
  });
  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem('mmo_color') || '#38BDF8';
  });

  // Modal visibility states
  const [showInventory, setShowInventory] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);
  const [showShardModal, setShowShardModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showJoystick, setShowJoystick] = useState(() => {
    return 'ontouchstart' in window || window.innerWidth < 768;
  });
  const [inspectTargetId, setInspectTargetId] = useState<string | null>(null);
  const [whisperTarget, setWhisperTarget] = useState<{ name: string; id: string } | null>(null);

  const chatInputRef = useRef<HTMLInputElement | null>(null);

  // MMO Real-Time Network Hook
  const network = useMMONetwork(urlShard, username, avatarColor);

  // MMO 60Hz Engine Hook
  const {
    canvasRef,
    minimapCanvasRef,
    handleCanvasPointerDown,
    setVirtualJoystickVector,
    localPlayerPosRef,
  } = useMMOEngine({
    network,
    onOpenInventory: () => setShowInventory(prev => !prev),
    onOpenCharacter: () => setShowCharacter(prev => !prev),
    onFocusChat: () => chatInputRef.current?.focus(),
  });

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  // Onboarding completion
  const handleOnboardingJoin = (chosenName: string, chosenColor: string) => {
    setUsername(chosenName);
    setAvatarColor(chosenColor);
    setHasOnboarded(true);
    network.sendPacket({
      type: 'JOIN',
      shardId: network.state.shardId,
      username: chosenName,
      avatarColor: chosenColor,
    });
  };

  const myPlayer = network.state.myPlayerId ? network.state.players[network.state.myPlayerId] : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060911] select-none">
      {/* 1. Full-Bleed 100vw x 100vh 2D Canvas Game World */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* 2. Glassmorphic 4-Corner Non-Blocking HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10 overflow-hidden">
        {/* Top Tier: Unit Frame, Target Frame & Minimap Radar */}
        <div className="flex items-start justify-between w-full">
          {/* Top-Left Unit & Target Frames */}
          <div className="flex flex-col gap-3">
            <UnitFrame
              state={network.state}
              onOpenCharacter={() => setShowCharacter(prev => !prev)}
              onOpenShardModal={() => setShowShardModal(true)}
            />

            {network.state.selectedTargetId && (
              <TargetFrame
                state={network.state}
                onClose={() => network.selectTarget(null)}
                onTrade={targetId => network.sendTradeRequest(targetId)}
                onWhisper={(targetName, targetId) => {
                  setWhisperTarget({ name: targetName, id: targetId });
                  chatInputRef.current?.focus();
                }}
                onInspect={targetId => setInspectTargetId(targetId)}
              />
            )}
          </div>

          {/* Top-Right Minimap Radar & Telemetry */}
          <MinimapRadar
            state={network.state}
            minimapCanvasRef={minimapCanvasRef}
            localPosRef={localPlayerPosRef}
          />
        </div>

        {/* Center Screen: Floating Toast Alerts */}
        {network.systemAlert && (
          <div
            key={network.systemAlert.timestamp}
            className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-2 rounded-2xl bg-[#0B0F19]/90 border border-amber-500/50 shadow-2xl text-xs font-mono font-bold text-amber-300 animate-in fade-in slide-in-from-top-4 duration-150 flex items-center gap-2 z-30"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{network.systemAlert.message}</span>
          </div>
        )}

        {/* Bottom Tier: Multi-Tab Chat, Virtual Joystick & Action Hotbar */}
        <div className="flex items-end justify-between w-full">
          {/* Bottom-Left: Chat & Social Dock */}
          <div className="flex items-end gap-3">
            <ChatDock
              state={network.state}
              onSendChat={network.sendChat}
              onSendEmote={network.sendEmote}
              whisperTarget={whisperTarget}
              onClearWhisperTarget={() => setWhisperTarget(null)}
              inputRef={chatInputRef}
            />

            {/* Mobile / Touch Virtual Joystick */}
            {showJoystick && (
              <div className="pb-1">
                <VirtualJoystick onMoveVector={setVirtualJoystickVector} />
              </div>
            )}
          </div>

          {/* Bottom-Center: 8-Slot Belt & Drawer Toggles */}
          <div className="flex items-center gap-2">
            <ActionHotbar
              state={network.state}
              onOpenInventory={() => setShowInventory(prev => !prev)}
              onOpenCharacter={() => setShowCharacter(prev => !prev)}
              onOpenGuide={() => setShowGuideModal(true)}
              onUseItem={network.sendItemUse}
            />

            {/* Touch Controls Toggle button */}
            <button
              onClick={() => setShowJoystick(prev => !prev)}
              className="pointer-events-auto p-2 rounded-2xl bg-[#0B0F19]/80 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition shadow"
              title="Toggle Touch Virtual Thumbstick"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Floating Right-Anchor Windows (Inventory & Paper-Doll) */}
      {(showInventory || showCharacter) && (
        <div className="fixed top-16 right-4 z-40 pointer-events-auto flex flex-col md:flex-row gap-3 max-h-[85vh] overflow-y-auto animate-in slide-in-from-right-6 duration-200">
          {showCharacter && (
            <PaperDollEquipment
              inventory={network.state.inventory}
              onUnequipItem={network.sendItemUnequip}
              onClose={() => setShowCharacter(false)}
              username={myPlayer?.username || username || 'Adventurer'}
              level={myPlayer?.level || 1}
            />
          )}

          {showInventory && (
            <SpatialInventory
              inventory={network.state.inventory}
              onMoveItem={network.sendItemMove}
              onEquipItem={network.sendItemEquip}
              onDropItem={network.sendItemDrop}
              onUseItem={network.sendItemUse}
              onSortItems={network.sendItemSort}
              onClose={() => setShowInventory(false)}
            />
          )}
        </div>
      )}

      {/* 4. Incoming Trade Request Banner */}
      <TradeInviteBanner
        invite={network.state.tradeInvite}
        onRespond={network.sendTradeRespond}
      />

      {/* 5. Synchronized Double-Lock Trade Modal */}
      {network.state.activeTrade && (
        <TradeModal
          trade={network.state.activeTrade}
          inventory={network.state.inventory}
          onStageItem={uid => network.sendTradeStageItem(network.state.activeTrade!.tradeId, uid)}
          onUnstageItem={uid => network.sendTradeUnstageItem(network.state.activeTrade!.tradeId, uid)}
          onSetGold={amt => network.sendTradeSetGold(network.state.activeTrade!.tradeId, amt)}
          onToggleLock={locked => network.sendTradeLock(network.state.activeTrade!.tradeId, locked)}
          onConfirm={() => network.sendTradeConfirm(network.state.activeTrade!.tradeId)}
          onCancel={() => network.sendTradeCancel(network.state.activeTrade!.tradeId)}
        />
      )}

      {/* 6. Quick-Inspect Modal */}
      {inspectTargetId && network.state.players[inspectTargetId] && (
        <PlayerInspectorModal
          target={network.state.players[inspectTargetId]}
          onClose={() => setInspectTargetId(null)}
          onTrade={targetId => network.sendTradeRequest(targetId)}
          onWhisper={(targetName, targetId) => {
            setWhisperTarget({ name: targetName, id: targetId });
            chatInputRef.current?.focus();
          }}
        />
      )}

      {/* 7. Shard Hopping Gate Modal */}
      {showShardModal && (
        <ShardSelector
          currentShard={network.state.shardId}
          onSelectShard={newShardId => {
            network.switchShard(newShardId);
            window.history.replaceState(null, '', `?shard=${newShardId}`);
          }}
          onClose={() => setShowShardModal(false)}
        />
      )}

      {/* 8. Controls & Mechanics Guide Modal */}
      {showGuideModal && (
        <ControlsHelpModal onClose={() => setShowGuideModal(false)} />
      )}

      {/* 9. Zero-Friction Onboarding Modal if handle not yet set */}
      {!hasOnboarded && (
        <OnboardingModal
          onJoin={handleOnboardingJoin}
          defaultShard={network.state.shardId}
        />
      )}
    </div>
  );
}
