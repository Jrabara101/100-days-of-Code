import React, { useEffect, useRef } from 'react';
import { GameCanvas } from '@/components/GameCanvas';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { TopHeaderHud } from '@/components/hud/TopHeaderHud';
import { BottomDockHud } from '@/components/hud/BottomDockHud';
import { ComboCallout } from '@/components/hud/ComboCallout';
import { ControlsHint } from '@/components/hud/ControlsHint';
import { AudioLoaderModal } from '@/components/modals/AudioLoaderModal';
import { SettingsSheet } from '@/components/modals/SettingsSheet';
import { RunSummaryModal } from '@/components/modals/RunSummaryModal';
import { useGameStore } from '@/store/useGameStore';

export const App: React.FC = () => {
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const { loadSeedFromHash } = useGameStore();

  useEffect(() => {
    loadSeedFromHash();
  }, [loadSeedFromHash]);

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col justify-between relative font-sans bg-void select-none">
      {/* 60FPS Game Canvas Layer */}
      <GameCanvas miniCanvasRef={miniCanvasRef} />

      {/* Beat-Reactive Ambient Aurora Border Glow */}
      <AuroraBackground />

      {/* Floating HUD Layer */}
      <TopHeaderHud />
      <ComboCallout />
      <ControlsHint />
      <BottomDockHud miniCanvasRef={miniCanvasRef} />

      {/* shadcn Dialogs & Sheets */}
      <AudioLoaderModal />
      <SettingsSheet />
      <RunSummaryModal />
    </main>
  );
};

export default App;
