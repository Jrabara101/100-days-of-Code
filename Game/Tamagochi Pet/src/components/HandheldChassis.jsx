import React from 'react';
import { LcdScreen } from './LcdScreen';
import { HardwareControls } from './HardwareControls';

export function HandheldChassis({
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
  onButtonA,
  onButtonB,
  onButtonC
}) {
  return (
    <main class="md:col-span-8 flex justify-center w-full order-1 md:order-2">
      {/* Handheld Chassis */}
      <div class="relative w-[340px] h-[520px] rounded-[40px] rounded-br-[80px] bg-error shadow-casing plastic-texture p-6 flex flex-col items-center border-4 border-[#8B0000]">
        {/* Brand / Logo Area */}
        <div class="w-full flex justify-between items-center px-4 mb-4">
          <div class="font-headline-md text-on-error font-black italic tracking-tighter text-xl drop-shadow-md">
            PET-LINK
          </div>
          <div class="font-label-caps text-on-error text-[10px] opacity-70">
            V.2.0 DISCIPLINE
          </div>
        </div>

        {/* Screen Bezel & LCD Screen */}
        <LcdScreen
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
        />

        {/* Hardware Controls */}
        <HardwareControls
          mode={mode}
          onButtonA={onButtonA}
          onButtonB={onButtonB}
          onButtonC={onButtonC}
        />
      </div>
    </main>
  );
}
