import React, { useState, useEffect } from 'react';
import { useInputDeviceDetector } from '@/hooks/useInputDeviceDetector';
import { useGamepadInput } from '@/hooks/useGamepadInput';
import { useKeybindManager } from '@/hooks/useKeybindManager';
import { SettingsModal } from '@/components/SettingsModal';
import { GameBackground } from '@/components/demo/GameBackground';

export function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // 1. Hardware Detection Hook
  const {
    lastActiveDevice,
    controllerType,
    activeScheme,
    gamepadConnected,
    activeGamepadName,
    simulateDevice,
  } = useInputDeviceDetector();

  // 2. Gamepad Polling & Deflection Hook
  const {
    gamepadState,
    setSimulatedStick,
  } = useGamepadInput();

  // 3. Keybind State Machine & Settings Manager Hook
  const {
    settings,
    startListening,
    cancelListening,
    resolveConflictWithSwap,
    resolveConflictWithShift,
    resolveConflictWithModifier,
    resolveConflictWithOverride,
    resetSingleAction,
    resetCategory,
    resetAllToDefaults,
    applyErgonomicPreset,
    saveChanges,
    setActiveTab,
    updateGameplaySetting,
    updateAudioSetting,
    updateVideoSetting,
    updateAccessibilitySetting,
    updateDeviceContext,
    applyImportedProfile,
  } = useKeybindManager();

  // Sync active hardware changes into settings context for dynamic glyph swapping
  useEffect(() => {
    updateDeviceContext({
      lastActiveDevice,
      controllerType,
      gamepadConnected,
    });
  }, [lastActiveDevice, controllerType, gamepadConnected, updateDeviceContext]);

  return (
    <div
      className={`min-h-screen w-screen overflow-hidden bg-[#08090D] ${
        settings.accessibilitySettings.highContrastFocusMarkers ? 'high-contrast-focus' : ''
      }`}
      style={{
        fontSize: `${settings.accessibilitySettings.uiScale}%`,
      }}
    >
      {/* Tactical Combat Simulator Backdrop */}
      <GameBackground
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSettingsOpen={isSettingsOpen}
      />

      {/* Central Tactical Avionics Calibration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        activeScheme={activeScheme}
        activeGamepadName={activeGamepadName}
        gamepadState={gamepadState}
        onSimulateDevice={simulateDevice}
        onSimulateStick={(x, y) => setSimulatedStick('left', x, y)}
        onStartListening={startListening}
        onCancelListening={cancelListening}
        onConflictSwap={resolveConflictWithSwap}
        onConflictShift={resolveConflictWithShift}
        onConflictModifier={resolveConflictWithModifier}
        onConflictOverride={resolveConflictWithOverride}
        onResetSingleAction={resetSingleAction}
        onResetCategory={resetCategory}
        onResetAll={resetAllToDefaults}
        onApplyPreset={applyErgonomicPreset}
        onSave={saveChanges}
        currentTab={settings.activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
        onUpdateGameplay={updateGameplaySetting}
        onUpdateAudio={updateAudioSetting}
        onUpdateVideo={updateVideoSetting}
        onUpdateAccessibility={updateAccessibilitySetting}
        onApplyImportedProfile={applyImportedProfile}
      />
    </div>
  );
}

export default App;
