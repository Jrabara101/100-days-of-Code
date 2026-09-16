import React, { useState, useEffect } from 'react';
import { useNetwork } from './context/NetworkContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import TopStrip from './components/layout/TopStrip';
import BottomBar from './components/layout/BottomBar';
import AlphaConsole from './components/playerAlpha/AlphaConsole';
import BetaConsole from './components/playerBeta/BetaConsole';
import CentralNexus from './components/nexus/CentralNexus';
import PingLayer from './components/comms/PingLayer';
import RoomModal from './components/modals/RoomModal';
import VictoryModal from './components/modals/VictoryModal';

export default function App() {
  const { playerRole, setPlayerRole, setRoomId, triggerPing } = useNetwork();
  const [activeTab, setActiveTab] = useState('dual-sync-viewport');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isPingMode, setIsPingMode] = useState(false);

  // Parse URL query parameters on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      const urlRole = params.get('role');

      if (urlRoom) setRoomId(urlRoom.toUpperCase());
      if (urlRole && ['p1', 'p2', 'dual'].includes(urlRole.toLowerCase())) {
        setPlayerRole(urlRole.toLowerCase());
      }
    }
  }, [setRoomId, setPlayerRole]);

  // Handle clicking anywhere in arena for Tactical Ping
  const handleArenaClick = (e) => {
    if (isPingMode || e.altKey) {
      triggerPing(e, isPingMode ? 'COMMAND PING' : 'QUICK RADAR');
      setIsPingMode(false);
    }
  };

  return (
    <div
      onClick={handleArenaClick}
      className={`min-h-screen bg-background font-body-md text-on-surface antialiased select-none relative ${
        isPingMode ? 'cursor-crosshair' : ''
      }`}
    >
      {/* Visual Ping Radar Overlay */}
      <PingLayer />

      {/* Ping Mode Banner */}
      {isPingMode && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-primary text-on-primary font-label-caps text-label-caps uppercase font-bold px-4 py-1.5 rounded-full shadow-lg animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-on-primary animate-ping"></span>
          PING MODE ACTIVE: Click anywhere on consoles to drop sonar marker
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPingMode(false);
            }}
            className="ml-2 underline text-[10px]"
          >
            [CANCEL]
          </button>
        </div>
      )}

      {/* Fixed Top Header */}
      <Header
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Fixed Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Viewport Content Area */}
      <div className="pl-64">
        <main className="relative w-full pt-20 pb-16 min-h-screen bg-background">
          <div className="flex flex-col w-full px-margin-desktop py-space-md space-y-space-lg">
            {/* Top Telemetry Strip */}
            <TopStrip />

            {/* Chamber Grid Layout according to selected view mode */}
            {playerRole === 'dual' ? (
              /* DUAL SPLIT VIEWPORT: All 3 Chambers side by side */
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-desktop items-stretch">
                <div className="xl:col-span-4">
                  <AlphaConsole isFocused={true} />
                </div>
                <div className="xl:col-span-4">
                  <CentralNexus />
                </div>
                <div className="xl:col-span-4">
                  <BetaConsole isFocused={true} />
                </div>
              </div>
            ) : playerRole === 'p1' ? (
              /* PLAYER 1 CYAN IMMERSIVE VIEW */
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-desktop items-stretch">
                <div className="xl:col-span-6">
                  <AlphaConsole isFocused={true} />
                </div>
                <div className="xl:col-span-4">
                  <CentralNexus />
                </div>
                <div className="xl:col-span-2 flex flex-col justify-between">
                  <div className="bg-surface-container-low/60 rounded-xl p-space-sm border border-secondary/30">
                    <span className="font-label-caps text-[10px] text-secondary uppercase block mb-1">
                      [REMOTE BETA MONITOR]
                    </span>
                    <BetaConsole isFocused={false} />
                  </div>
                </div>
              </div>
            ) : (
              /* PLAYER 2 AMBER IMMERSIVE VIEW */
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter-desktop items-stretch">
                <div className="xl:col-span-2 flex flex-col justify-between">
                  <div className="bg-surface-container-low/60 rounded-xl p-space-sm border border-primary/30">
                    <span className="font-label-caps text-[10px] text-primary uppercase block mb-1">
                      [REMOTE ALPHA MONITOR]
                    </span>
                    <AlphaConsole isFocused={false} />
                  </div>
                </div>
                <div className="xl:col-span-4">
                  <CentralNexus />
                </div>
                <div className="xl:col-span-6">
                  <BetaConsole isFocused={true} />
                </div>
              </div>
            )}

            {/* Bottom Synced Output & Telemetry Bar */}
            <BottomBar />
          </div>
        </main>
      </div>

      {/* Fixed Bottom Controls & Tactile Comms */}
      <Footer onTriggerPingNode={() => setIsPingMode(!isPingMode)} />

      {/* Modals */}
      <RoomModal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} />
      <VictoryModal />
    </div>
  );
}
