import React from 'react';
import { useTamagotchiEngine } from './hooks/useTamagotchiEngine';
import { ArchitectureSidebar } from './components/ArchitectureSidebar';
import { HandheldChassis } from './components/HandheldChassis';

export default function App() {
  const {
    stage,
    mode,
    hunger,
    happiness,
    energy,
    health,
    discipline,
    isSleeping,
    isCallingForAttention,
    poopCount,
    showStats,
    menuIndex,
    miniGame,
    uptime,
    tickRate,
    handleButtonA,
    handleButtonB,
    handleButtonC
  } = useTamagotchiEngine();

  return (
    <div class="bg-background text-on-background min-h-screen flex flex-col md:flex-row items-center justify-center p-4 md:p-8 font-body-sm overflow-x-hidden">
      {/* Main Container: Bento Grid Layout */}
      <div class="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Sidebar: Architecture Specs & Engine Metrics */}
        <ArchitectureSidebar tickRate={tickRate} uptime={uptime} />

        {/* Center: Handheld Device Shell */}
        <HandheldChassis
          stage={stage}
          mode={mode}
          hunger={hunger}
          happiness={happiness}
          energy={energy}
          health={health}
          discipline={discipline}
          isSleeping={isSleeping}
          isCallingForAttention={isCallingForAttention}
          poopCount={poopCount}
          showStats={showStats}
          menuIndex={menuIndex}
          miniGame={miniGame}
          onButtonA={handleButtonA}
          onButtonB={handleButtonB}
          onButtonC={handleButtonC}
        />
      </div>
    </div>
  );
}
